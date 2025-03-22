import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { askClaude, parseClaudeResponse } from '../../services/claude';
import { MapContainer, ToggleButton } from './styles/MapStyles';
import { Toggle3DButton, RotateButton } from './StyledComponents';
import AIChatPanel from './AIChatPanel/index';
import { useAIConsensusAnimation } from './hooks/useAIConsensusAnimation';
import { useMapInitialization } from './hooks/useMapInitialization';
import { PopupManager } from './components/PopupManager';
import { 
    highlightPOIBuildings,
    initializeRoadGrid,
    loadHarveyData
} from './utils';
import LayerToggle from './components/LayerToggle';
import { mockDisagreementData } from './constants/mockData';
import { ErcotManager } from './components/ErcotManager';
import { 
    initializeRoadParticles,
    animateRoadParticles,
    stopRoadParticles
} from './hooks/mapAnimations';
import ZoningLayer from './components/ZoningLayer';
import PlanningDocsLayer from './components/PlanningDocsLayer';
import PlanningAnalysisLayer from './components/PlanningAnalysisLayer';
import SceneManager from './components/SceneManager';
import LocalZonesLayer from './components/LocalZonesLayer';
import PropertyPricesLayer from './components/PropertyPricesLayer';
import EmploymentLayer from './components/EmploymentLayer';

// Debug utilities
const DEBUG = true;
const debugLog = (...args) => DEBUG && console.log('[MapDebug]', ...args);
const debugWarn = (...args) => DEBUG && console.warn('[MapDebug]', ...args);
const debugError = (...args) => DEBUG && console.error('[MapDebug]', ...args);

// Performance monitoring
const monitorPerformance = () => {
  if (!DEBUG) return;
  
  // Memory usage reporting (Chrome only)
  const reportMemory = () => {
    if (window.performance && window.performance.memory) {
      const memoryInfo = window.performance.memory;
      debugLog('Memory Usage:', {
        totalJSHeapSize: (memoryInfo.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        usedJSHeapSize: (memoryInfo.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        jsHeapSizeLimit: (memoryInfo.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
        usagePercentage: ((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100).toFixed(2) + '%'
      });
    }
  };
  
  // Track FPS using a safer interval-based approach
  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 0;
  let isMonitoring = true;
  
  // Instead of using requestAnimationFrame which can cause recursion issues,
  // use a time interval to periodically check the frame rate
  const measureFPSInterval = setInterval(() => {
    if (!isMonitoring) {
      clearInterval(measureFPSInterval);
      return;
    }
    
    const currentTime = performance.now();
    const elapsedMs = currentTime - lastTime;
    
    if (elapsedMs >= 1000) {
      fps = Math.round((frameCount * 1000) / elapsedMs);
      debugLog('Estimated FPS:', fps);
      
      // Also report memory with FPS
      reportMemory();
      
      // Alert on low FPS which might indicate problems
      if (fps < 15) {
        debugWarn('Low FPS detected:', fps);
      }
      
      // Reset counters
      frameCount = 0;
      lastTime = currentTime;
    } else {
      // Estimate frame that would have occurred
      frameCount++;
    }
  }, 100); // Check every 100ms
  
  // Set up interval to report memory usage
  const memoryInterval = setInterval(reportMemory, 10000);
  
  // Return a cleanup function
  return () => {
    isMonitoring = false;
    clearInterval(measureFPSInterval);
    clearInterval(memoryInterval);
  };
};

// Global error handler
if (DEBUG) {
  window.addEventListener('error', (event) => {
    debugError('Global error caught:', {
      message: event.message,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });
}

// Set mapbox access token
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const MapComponent = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const roadAnimationFrame = useRef(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [inputValue, setInputValue] = useState('');
  const [isErcotMode, setIsErcotMode] = useState(false);
  const [showRoadGrid, setShowRoadGrid] = useState(false);
  const [showMUDLayer, setShowMUDLayer] = useState(false);
  const [showHarveyData, setShowHarveyData] = useState(false);
  const [showSurfaceWater, setShowSurfaceWater] = useState(false);
  const [showWastewaterOutfalls, setShowWastewaterOutfalls] = useState(false);
  const [showZipCodes, setShowZipCodes] = useState(false);
  const [showZipFloodAnalysis, setShowZipFloodAnalysis] = useState(false);
  const [isLayerMenuCollapsed, setIsLayerMenuCollapsed] = useState(false);
  const [showAIConsensus, setShowAIConsensus] = useState(false);
  const [showRoadParticles, setShowRoadParticles] = useState(true); // Restore default to true
  const [is3DActive, setIs3DActive] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const roadParticleAnimation = useRef(null);
  const [showZoningLayer, setShowZoningLayer] = useState(false);
  const [showPlanningDocsLayer, setShowPlanningDocsLayer] = useState(false);
  
  // Planning analysis states
  const [showPlanningAnalysis, setShowPlanningAnalysis] = useState(false);
  const [showAdaptiveReuse, setShowAdaptiveReuse] = useState(false);
  const [showDevelopmentPotential, setShowDevelopmentPotential] = useState(false);
  const [showTransportation, setShowTransportation] = useState(false);

  // Add these refs for drag functionality
  const isDraggingRef = useRef(false);
  const currentXRef = useRef(0);
  const currentYRef = useRef(0);
  const initialXRef = useRef(0);
  const initialYRef = useRef(0);
  const xOffsetRef = useRef(0);
  const yOffsetRef = useRef(0);
  const popupRef = useRef(null);
  
  // Debug tracking refs
  const requestAnimationFrameIds = useRef([]);
  const timeoutIds = useRef([]);
  const intervalIds = useRef([]);
  const layerLoadErrors = useRef([]);
  const crashWarnings = useRef(false);
  
  // Start performance monitoring
  useEffect(() => {
    debugLog('Map component mounted');
    const cleanup = monitorPerformance();
    
    return () => {
      debugLog('Map component unmounted');
      if (cleanup) cleanup();
    };
  }, []);
  
  // Track layer operations
  const trackLayerOperation = (operation, layerId, error = null) => {
    if (!DEBUG) return;
    
    const entry = {
      timestamp: new Date().toISOString(),
      operation,
      layerId
    };
    
    if (error) {
      entry.error = error.message;
      layerLoadErrors.current.push(entry);
      debugError(`Layer ${operation} error for ${layerId}:`, error);
    } else {
      debugLog(`Layer ${operation}:`, layerId);
    }
  };
  
  // Safe layer operation wrapper
  const safeLayerOperation = (operation, layerId, callback) => {
    if (!map.current) {
      debugWarn(`Can't ${operation} layer ${layerId} - map not initialized`);
      return false;
    }
    
    try {
      callback();
      trackLayerOperation(operation, layerId);
      return true;
    } catch (error) {
      trackLayerOperation(operation, layerId, error);
      return false;
    }
  };
  
  // Safe animation frame request
  const safeRequestAnimationFrame = (callback, name = 'unnamed') => {
    const id = requestAnimationFrame((time) => {
      try {
        callback(time);
        // Remove from tracking array once completed
        requestAnimationFrameIds.current = requestAnimationFrameIds.current.filter(item => item.id !== id);
      } catch (error) {
        debugError(`Animation frame error (${name}):`, error);
      }
    });
    
    // Track this animation frame request
    requestAnimationFrameIds.current.push({ id, name });
    return id;
  };
  
  // Monitor for potential memory leaks
  useEffect(() => {
    if (!DEBUG) return;
    
    const checkResourceUsage = () => {
      // Check for excessive animation frames
      if (requestAnimationFrameIds.current.length > 10) {
        debugWarn('Possible animation frame leak!', 
          requestAnimationFrameIds.current.map(item => item.name));
        crashWarnings.current = true;
      }
      
      // Report layer errors
      if (layerLoadErrors.current.length > 0) {
        debugWarn('Layer errors detected:', layerLoadErrors.current);
      }
    };
    
    const intervalId = setInterval(checkResourceUsage, 5000);
    intervalIds.current.push(intervalId);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Override animation functions with safe versions - FIX RECURSION ISSUE
  useEffect(() => {
    if (!DEBUG) return;
    
    // Store the original function
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    
    // Create a wrapper that uses the original
    const safeFn = (callback) => {
      return originalRequestAnimationFrame((time) => {
        try {
          // Track this request
          const id = Math.random().toString(36).substr(2, 9);
          requestAnimationFrameIds.current.push({ id, name: 'wrapped-raf' });
          
          // Call the callback
          callback(time);
          
          // Remove from tracking once done
          requestAnimationFrameIds.current = 
            requestAnimationFrameIds.current.filter(item => item.id !== id);
        } catch (error) {
          debugError('Error in requestAnimationFrame callback:', error);
        }
      });
    };
    
    // Replace the global function with our safe version
    window.requestAnimationFrame = safeFn;
    
    // Cleanup on unmount
    return () => {
      debugLog('Restoring original requestAnimationFrame');
      window.requestAnimationFrame = originalRequestAnimationFrame;
    };
  }, []);
  
  // Cleanup all resources on unmount
  useEffect(() => {
    return () => {
      if (DEBUG) {
        debugLog('Cleaning up resources on unmount');
      }
      
      // Cancel all animation frames
      requestAnimationFrameIds.current.forEach(item => {
        cancelAnimationFrame(item.id);
      });
      
      // Clear all timeouts
      timeoutIds.current.forEach(id => {
        clearTimeout(id);
      });
      
      // Clear all intervals
      intervalIds.current.forEach(id => {
        clearInterval(id);
      });
    };
  }, []);

  const { initializeParticleLayer, generateParticles } = useAIConsensusAnimation(map, showAIConsensus, mockDisagreementData);
  useMapInitialization(map, mapContainer);

  const ercotManagerRef = useRef(null);

  // Add loading state for 3D buildings
  const [is3DLoading, setIs3DLoading] = useState(false);

  // Add missing state declarations
  const [show3DBuildings, setShow3DBuildings] = useState(false);
  const [showNeighborhoodBoundaries, setShowNeighborhoodBoundaries] = useState(false);
  const [showRoads, setShowRoads] = useState(true);
  const [showPublicTransit, setShowPublicTransit] = useState(true);
  const [showBikeInfra, setShowBikeInfra] = useState(true);
  const [showPedestrian, setShowPedestrian] = useState(true);
  const [showPOIs, setShowPOIs] = useState(true);
  const [showTransitStops, setShowTransitStops] = useState(true);
  const [showTransitStations, setShowTransitStations] = useState(true);
  const [showTransitRoutes, setShowTransitRoutes] = useState(true);
  const [showBikeLanes, setShowBikeLanes] = useState(true);
  const [showBikePaths, setShowBikePaths] = useState(true);
  const [showBikeParking, setShowBikeParking] = useState(true);
  const [showPedestrianPaths, setShowPedestrianPaths] = useState(true);
  const [showPedestrianCrossings, setShowPedestrianCrossings] = useState(true);
  const [showOSMTransit, setShowOSMTransit] = useState(false);
  const [showOSMBike, setShowOSMBike] = useState(false);
  const [showOSMPedestrian, setShowOSMPedestrian] = useState(false);
  const [showPropertyPrices, setShowPropertyPrices] = useState(false);
  const [showEmployment, setShowEmployment] = useState(false);
  
  // Add missing state declarations for Parks and labels
  const [showParks, setShowParks] = useState(false);
  const [showNeighborhoodLabels, setShowNeighborhoodLabels] = useState(false);
  const [showEmploymentLabels, setShowEmploymentLabels] = useState(false);
  
  // Add Local Zones state
  const [showLocalZones, setShowLocalZones] = useState(false);
  const [showLocalZoneBoundaries, setShowLocalZoneBoundaries] = useState(false);
  const [showLocalZoneLabels, setShowLocalZoneLabels] = useState(false);

  // Add state for scene management
  const [layerStates, setLayerStates] = useState({
    showRoadGrid,
    showMUDLayer,
    showHarveyData,
    showSurfaceWater,
    showWastewaterOutfalls,
    showZipCodes,
    showZipFloodAnalysis,
    showAIConsensus,
    showRoadParticles,
    is3DActive,
    showZoningLayer,
    showPlanningDocsLayer,
    showPlanningAnalysis,
    showAdaptiveReuse,
    showDevelopmentPotential,
    showTransportation,
    showNeighborhoodBoundaries,
    showNeighborhoodLabels,
    show3DBuildings,
    showRoads,
    // Public Transit
    showPublicTransit,
    showOSMTransit,
    showTransitStops,
    showTransitStations,
    showTransitRoutes,
    // Bike Network
    showBikeInfra,
    showOSMBike,
    showBikeLanes,
    showBikePaths,
    showBikeParking,
    // Pedestrian Network
    showPedestrian,
    showOSMPedestrian,
    showPedestrianPaths,
    showPedestrianCrossings,
    // Other
    showPOIs,
    showPropertyPrices,
    showEmployment,
    showEmploymentLabels,
    showParks,
    // Local Zones
    showLocalZones,
    showLocalZoneBoundaries,
    showLocalZoneLabels
  });

  // Update layerStates whenever any layer state changes
  useEffect(() => {
    setLayerStates({
      showRoadGrid,
      showMUDLayer,
      showHarveyData,
      showSurfaceWater,
      showWastewaterOutfalls,
      showZipCodes,
      showZipFloodAnalysis,
      showAIConsensus,
      showRoadParticles,
      is3DActive,
      showZoningLayer,
      showPlanningDocsLayer,
      showPlanningAnalysis,
      showAdaptiveReuse,
      showDevelopmentPotential,
      showTransportation,
      showNeighborhoodBoundaries,
      showNeighborhoodLabels,
      show3DBuildings,
      showRoads,
      // Public Transit
      showPublicTransit,
      showOSMTransit,
      showTransitStops,
      showTransitStations,
      showTransitRoutes,
      // Bike Network
      showBikeInfra,
      showOSMBike,
      showBikeLanes,
      showBikePaths,
      showBikeParking,
      // Pedestrian Network
      showPedestrian,
      showOSMPedestrian,
      showPedestrianPaths,
      showPedestrianCrossings,
      // Other
      showPOIs,
      showPropertyPrices,
      showEmployment,
      showEmploymentLabels,
      showParks,
      // Local Zones
      showLocalZones,
      showLocalZoneBoundaries,
      showLocalZoneLabels
    });
  }, [
    showRoadGrid,
    showMUDLayer,
    showHarveyData,
    showSurfaceWater,
    showWastewaterOutfalls,
    showZipCodes,
    showZipFloodAnalysis,
    showAIConsensus,
    showRoadParticles,
    is3DActive,
    showZoningLayer,
    showPlanningDocsLayer,
    showPlanningAnalysis,
    showAdaptiveReuse,
    showDevelopmentPotential,
    showTransportation,
    showNeighborhoodBoundaries,
    showNeighborhoodLabels,
    show3DBuildings,
    showRoads,
    showPublicTransit,
    showOSMTransit,
    showTransitStops,
    showTransitStations,
    showTransitRoutes,
    showBikeInfra,
    showOSMBike,
    showBikeLanes,
    showBikePaths,
    showBikeParking,
    showPedestrian,
    showOSMPedestrian,
    showPedestrianPaths,
    showPedestrianCrossings,
    showPOIs,
    showPropertyPrices,
    showEmployment,
    showEmploymentLabels,
    showParks,
    showLocalZones,
    showLocalZoneBoundaries,
    showLocalZoneLabels
  ]);

  // Handler for loading scenes
  const handleLoadScene = (sceneLayerStates) => {
    console.log('\n=== Applying Scene Layer States ===');
    try {
      // First, hide all OSM layers
      const hideAllOSMLayers = () => {
        if (!map.current) return;
        const osmLayers = [
          'osm-transit-stops', 'osm-transit-routes',
          'osm-bike-lanes', 'osm-bike-paths', 'osm-bike-parking',
          'osm-pedestrian-paths', 'osm-pedestrian-crossings'
        ];
        osmLayers.forEach(layerId => {
          try {
            map.current.setLayoutProperty(layerId, 'visibility', 'none');
          } catch (error) {
            console.warn(`Could not hide layer ${layerId}:`, error);
          }
        });
      };

      hideAllOSMLayers();

      // Update all layer states
      Object.entries(sceneLayerStates).forEach(([key, value]) => {
        console.log(`Setting ${key}:`, value);
        switch (key) {
          case 'showTransportation':
            setShowTransportation(value);
            break;
          case 'showRoads':
            setShowRoads(value);
            break;
          case 'showPublicTransit':
            setShowPublicTransit(value);
            // Only show transit layers if both parent and child toggles are true
            if (value && sceneLayerStates.showOSMTransit) {
              if (sceneLayerStates.showTransitStops) {
                map.current.setLayoutProperty('osm-transit-stops', 'visibility', 'visible');
              }
              if (sceneLayerStates.showTransitRoutes) {
                map.current.setLayoutProperty('osm-transit-routes', 'visibility', 'visible');
              }
            }
            break;
          case 'showBikeInfra':
            setShowBikeInfra(value);
            // Only show bike layers if both parent and child toggles are true
            if (value && sceneLayerStates.showOSMBike) {
              if (sceneLayerStates.showBikeLanes) {
                map.current.setLayoutProperty('osm-bike-lanes', 'visibility', 'visible');
              }
              if (sceneLayerStates.showBikePaths) {
                map.current.setLayoutProperty('osm-bike-paths', 'visibility', 'visible');
              }
              if (sceneLayerStates.showBikeParking) {
                map.current.setLayoutProperty('osm-bike-parking', 'visibility', 'visible');
              }
            }
            break;
          case 'showPedestrian':
            setShowPedestrian(value);
            // Only show pedestrian layers if both parent and child toggles are true
            if (value && sceneLayerStates.showOSMPedestrian) {
              if (sceneLayerStates.showPedestrianPaths) {
                map.current.setLayoutProperty('osm-pedestrian-paths', 'visibility', 'visible');
              }
              if (sceneLayerStates.showPedestrianCrossings) {
                map.current.setLayoutProperty('osm-pedestrian-crossings', 'visibility', 'visible');
              }
            }
            break;
          case 'showOSMTransit':
          case 'showTransitStops':
          case 'showTransitRoutes':
          case 'showOSMBike':
          case 'showBikeLanes':
          case 'showBikePaths':
          case 'showBikeParking':
          case 'showOSMPedestrian':
          case 'showPedestrianPaths':
          case 'showPedestrianCrossings':
            // These are handled in their parent cases
            break;
          case 'showRoadGrid':
            setShowRoadGrid(value);
            break;
          case 'showMUDLayer':
            setShowMUDLayer(value);
            break;
          case 'showHarveyData':
            setShowHarveyData(value);
            break;
          case 'showSurfaceWater':
            setShowSurfaceWater(value);
            break;
          case 'showWastewaterOutfalls':
            setShowWastewaterOutfalls(value);
            break;
          case 'showZipCodes':
            setShowZipCodes(value);
            break;
          case 'showZipFloodAnalysis':
            setShowZipFloodAnalysis(value);
            break;
          case 'showAIConsensus':
            setShowAIConsensus(value);
            break;
          case 'showRoadParticles':
            setShowRoadParticles(value);
            break;
          case 'is3DActive':
            setIs3DActive(value);
            if (value) {
              toggle3D();
            }
            break;
          case 'showZoningLayer':
            setShowZoningLayer(value);
            break;
          case 'showPlanningDocsLayer':
            setShowPlanningDocsLayer(value);
            break;
          case 'showPlanningAnalysis':
            setShowPlanningAnalysis(value);
            break;
          case 'showAdaptiveReuse':
            setShowAdaptiveReuse(value);
            break;
          case 'showDevelopmentPotential':
            setShowDevelopmentPotential(value);
            break;
          case 'showNeighborhoodBoundaries':
            setShowNeighborhoodBoundaries(value);
            break;
          case 'showNeighborhoodLabels':
            setShowNeighborhoodLabels(value);
            break;
          case 'show3DBuildings':
            setShow3DBuildings(value);
            break;
          case 'showPOIs':
            setShowPOIs(value);
            break;
          case 'showPropertyPrices':
            setShowPropertyPrices(value);
            break;
          case 'showParks':
            setShowParks(value);
            // Handle park layers visibility
            if (value) {
              console.log('Restoring Parks layer visibility');
              const parkLayers = [
                'park', 'park-label', 'national-park', 'golf-course', 'pitch', 'grass'
              ];
              
              parkLayers.forEach(layerId => {
                if (map.current && map.current.getLayer(layerId)) {
                  try {
                    map.current.setLayoutProperty(layerId, 'visibility', 'visible');
                    if (map.current.getPaintProperty(layerId, 'fill-color') !== undefined) {
                      map.current.setPaintProperty(layerId, 'fill-color', '#2a9d2a');
                      map.current.setPaintProperty(layerId, 'fill-opacity', 0.45);
                    }
                  } catch (error) {
                    console.warn(`Could not style park layer ${layerId}:`, error);
                  }
                }
              });
              
              // Handle natural layer if it exists
              if (map.current && map.current.getLayer('natural')) {
                try {
                  if (!map.current._originalNaturalFilter) {
                    map.current._originalNaturalFilter = map.current.getFilter('natural') || ['all'];
                  }
                  
                  map.current.setFilter('natural', ['all', 
                    map.current._originalNaturalFilter,
                    ['any',
                      ['==', ['get', 'class'], 'park'],
                      ['==', ['get', 'class'], 'garden'],
                      ['==', ['get', 'class'], 'forest'],
                      ['==', ['get', 'class'], 'wood']
                    ]
                  ]);
                  
                  map.current.setLayoutProperty('natural', 'visibility', 'visible');
                  map.current.setPaintProperty('natural', 'fill-color', '#2a9d2a');
                  map.current.setPaintProperty('natural', 'fill-opacity', 0.45);
                } catch (error) {
                  console.warn('Could not filter natural layer:', error);
                }
              }
            } else {
              console.log('Hiding Parks layer');
              const parkLayers = [
                'park', 'park-label', 'national-park', 'golf-course', 'pitch', 'grass'
              ];
              
              parkLayers.forEach(layerId => {
                if (map.current && map.current.getLayer(layerId)) {
                  try {
                    map.current.setLayoutProperty(layerId, 'visibility', 'none');
                  } catch (error) {
                    console.warn(`Could not hide park layer ${layerId}:`, error);
                  }
                }
              });
              
              // Reset natural layer
              if (map.current && map.current.getLayer('natural')) {
                try {
                  map.current.setLayoutProperty('natural', 'visibility', 'none');
                  if (map.current._originalNaturalFilter) {
                    map.current.setFilter('natural', map.current._originalNaturalFilter);
                  }
                } catch (error) {
                  console.warn('Could not reset natural layer:', error);
                }
              }
            }
            break;
          case 'showEmployment':
            setShowEmployment(value);
            break;
          case 'showEmploymentLabels':
            setShowEmploymentLabels(value);
            break;
          case 'showLocalZones':
            setShowLocalZones(value);
            break;
          case 'showLocalZoneBoundaries':
            setShowLocalZoneBoundaries(value);
            break;
          case 'showLocalZoneLabels':
            setShowLocalZoneLabels(value);
            break;
          default:
            console.warn(`Unknown layer state: ${key}`);
        }
      });

      // Force update layerStates to ensure it reflects the new values
      setLayerStates(prevState => ({
        ...prevState,
        ...sceneLayerStates
      }));

      console.log('Successfully applied all layer states');
      console.log('Updated layer states:', layerStates);
    } catch (error) {
      console.error('Error applying layer states:', error);
    }
  };

  // Add effect to expose handleLoadScene on the map object and window.mapComponent
  useEffect(() => {
    console.log('Setting up handleLoadScene globally and on map.current');
    
    // Create window.mapComponent if it doesn't exist
    if (!window.mapComponent) {
      window.mapComponent = {};
      console.log('Created window.mapComponent object');
    }
    
    // First make sure handleLoadScene is exposed globally
    window.mapComponent.handleLoadScene = handleLoadScene;
    console.log('Exposed handleLoadScene on window.mapComponent');
    
    // Log the current window.mapComponent state
    console.log('Current window.mapComponent:', {
      exists: !!window.mapComponent,
      hasMap: !!window.mapComponent.map,
      hasHandleLoadScene: !!window.mapComponent.handleLoadScene
    });
    
    // Then attach to map.current when available
    if (map.current) {
      // Expose handleLoadScene function directly on the map object
      map.current.handleLoadScene = handleLoadScene;
      
      // Update global reference with map object
      window.mapComponent.map = map.current;
      
      console.log('Exposed handleLoadScene on map.current and updated window.mapComponent.map');
    } else {
      console.warn('map.current not available yet, handleLoadScene only available on window.mapComponent');
    }
    
    // Return cleanup function
    return () => {
      // Keep the global reference available even after component unmounts
      console.log('Map component unmounting, keeping handleLoadScene on window.mapComponent');
    };
  }, [handleLoadScene]);

  useEffect(() => {
    if (map.current) {
      if (showRoadGrid) {
        initializeRoadGrid(map.current, {
          minzoom: 5,
          maxzoom: 22
        });
      } else {
        if (map.current.getLayer('road-grid')) {
          map.current.removeLayer('road-grid');
        }
      }
    }
  }, [showRoadGrid]);

  // Add this effect for road particles
  useEffect(() => {
    if (!map.current) return;

    const initializeParticles = async () => {
      try {
        // Wait for style to fully load
        if (!map.current.isStyleLoaded()) {
          await new Promise(resolve => {
            map.current.once('style.load', resolve);
          });
        }

        if (showRoadParticles) {
          debugLog('Starting road particles animation...');
          initializeRoadParticles(map.current);
          
          // Use the original requestAnimationFrame for the animation loop
          // to avoid potential issues with our wrapped version
          const originalRequestAnimationFrame = window._originalRAF || window.requestAnimationFrame;
          
          const animate = (timestamp) => {
            try {
              if (!map.current) return;
              
              animateRoadParticles({ map: map.current, timestamp });
              roadParticleAnimation.current = originalRequestAnimationFrame(animate);
            } catch (error) {
              debugError('Error in road particles animation:', error);
              if (roadParticleAnimation.current) {
                cancelAnimationFrame(roadParticleAnimation.current);
                roadParticleAnimation.current = null;
              }
            }
          };
          
          // Start the animation loop
          roadParticleAnimation.current = originalRequestAnimationFrame(animate);
          debugLog('Road particles animation started');
        } else {
          if (roadParticleAnimation.current) {
            debugLog('Stopping road particles animation');
            stopRoadParticles(map.current);
            cancelAnimationFrame(roadParticleAnimation.current);
            roadParticleAnimation.current = null;
          }
        }
      } catch (error) {
        debugError('Failed to initialize road particles:', error);
      }
    };

    // Store original requestAnimationFrame if not already stored
    if (!window._originalRAF) {
      window._originalRAF = window.requestAnimationFrame;
    }

    // Initialize when map is ready
    if (map.current && map.current.loaded()) {
      debugLog('Map already loaded, initializing particles immediately');
      initializeParticles();
    } else {
      debugLog('Waiting for map to load before initializing particles');
      map.current.once('load', initializeParticles);
    }

    // Cleanup function
    return () => {
      if (roadParticleAnimation.current) {
        debugLog('Cleaning up road particle animation on effect cleanup');
        cancelAnimationFrame(roadParticleAnimation.current);
        roadParticleAnimation.current = null;
      }
    };
  }, [showRoadParticles]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (roadParticleAnimation.current) {
        cancelAnimationFrame(roadParticleAnimation.current);
        roadParticleAnimation.current = null;
      }
    };
  }, []);

  // Add a Layer Manager utility to better control layer loading and unloading
  const LayerManager = (() => {
    const loadedLayers = new Set();
    const layerLoadTimes = {};
    const pendingLayers = [];
    const layerTypes = {};
    let processingQueue = false;
    
    // Process the layer queue gradually to avoid overwhelming the GPU
    const processLayerQueue = () => {
      if (pendingLayers.length === 0 || processingQueue || !map.current) {
        return;
      }
      
      processingQueue = true;
      
      // Process just a few layers at a time
      const batchSize = 2;
      const layersToProcess = pendingLayers.splice(0, batchSize);
      
      debugLog(`Processing ${layersToProcess.length} layers from queue. ${pendingLayers.length} remaining.`);
      
      layersToProcess.forEach(({ layerId, setupFunction, type }) => {
        const startTime = performance.now();
        
        try {
          debugLog(`Loading layer: ${layerId} (${type})`);
          setupFunction();
          loadedLayers.add(layerId);
          layerTypes[layerId] = type;
          const loadTime = performance.now() - startTime;
          layerLoadTimes[layerId] = loadTime;
          debugLog(`Loaded layer ${layerId} in ${loadTime.toFixed(2)}ms`);
        } catch (error) {
          debugError(`Failed to load layer ${layerId}:`, error);
          trackLayerOperation('load', layerId, error);
        }
      });
      
      processingQueue = false;
      
      // Continue processing queue after a short delay
      if (pendingLayers.length > 0) {
        const timeoutId = setTimeout(processLayerQueue, 100);
        timeoutIds.current.push(timeoutId);
      } else {
        debugLog('All layers processed successfully');
      }
    };
    
    return {
      queueLayer: (layerId, setupFunction, type = 'unknown') => {
        if (loadedLayers.has(layerId)) {
          debugLog(`Layer ${layerId} already loaded, skipping`);
          return;
        }
        
        pendingLayers.push({ layerId, setupFunction, type });
        debugLog(`Queued layer: ${layerId} (${type})`);
        
        if (!processingQueue) {
          processLayerQueue();
        }
      },
      
      removeLayer: (layerId) => {
        if (!map.current || !loadedLayers.has(layerId)) {
          return;
        }
        
        try {
          if (map.current.getLayer(layerId)) {
            map.current.removeLayer(layerId);
          }
          
          // If this layer has a source with the same ID, remove it too
          if (map.current.getSource(layerId)) {
            map.current.removeSource(layerId);
          }
          
          loadedLayers.delete(layerId);
          debugLog(`Removed layer: ${layerId}`);
        } catch (error) {
          debugError(`Failed to remove layer ${layerId}:`, error);
        }
      },
      
      getLayerStats: () => {
        return {
          totalLayers: loadedLayers.size,
          loadedLayers: Array.from(loadedLayers),
          pendingLayers: pendingLayers.map(l => l.layerId),
          layerLoadTimes,
          layerTypeBreakdown: Object.entries(
            Array.from(loadedLayers).reduce((acc, layerId) => {
              const type = layerTypes[layerId] || 'unknown';
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {})
          )
        };
      }
    };
  })();
  
  // Add effect to periodically check layer health
  useEffect(() => {
    if (!DEBUG) return;
    
    const checkLayerHealth = () => {
      const stats = LayerManager.getLayerStats();
      debugLog('Layer stats:', stats);
      
      // Check if we have too many layers which could cause memory issues
      if (stats.totalLayers > 50) {
        debugWarn('High number of layers detected:', stats.totalLayers);
      }
      
      // Identify slow-loading layers
      const slowLayers = Object.entries(stats.layerLoadTimes)
        .filter(([_, time]) => time > 500)
        .sort((a, b) => b[1] - a[1]);
        
      if (slowLayers.length > 0) {
        debugWarn('Slow-loading layers detected:', 
          slowLayers.map(([id, time]) => `${id}: ${time.toFixed(2)}ms`));
      }
      
      // Check memory usage in Chrome
      if (window.performance && window.performance.memory) {
        const memoryInfo = window.performance.memory;
        const memoryUsagePercent = 
          (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
          
        if (memoryUsagePercent > 70) {
          debugWarn('High memory usage detected:', 
            `${memoryUsagePercent.toFixed(2)}% of available JS heap`);
        }
      }
    };
    
    const intervalId = setInterval(checkLayerHealth, 10000);
    intervalIds.current.push(intervalId);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleQuestion = async (question) => {
    setIsLoading(true);
    setMessages(prev => [...prev, { isUser: true, content: question }]);

    try {
      const bounds = map.current.getBounds();
      const mapBounds = {
        sw: bounds.getSouthWest(),
        ne: bounds.getNorthEast()
      };

      const response = await askClaude(question, {}, mapBounds);
      const parsedResponse = parseClaudeResponse(response);

      if (parsedResponse.mainText !== "Could not process the response. Please try again.") {
        setMessages(prev => [...prev, {
          isUser: false,
          content: parsedResponse
        }]);
        
        handleLLMResponse(parsedResponse);
      } else {
        throw new Error('Failed to parse response');
      }
    } catch (error) {
      console.error('Error in handleQuestion:', error);
      setMessages(prev => [...prev, {
        isUser: false,
        content: {
          mainText: "I apologize, but I encountered an error processing your request. Please try asking your question again.",
          poiInfo: null,
          followUps: []
        }
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (map.current) return;

    // Remove duplicate initialization since it's handled in useMapInitialization
    const handleMapLoad = async () => {
      if (!map.current.isStyleLoaded()) {
        await new Promise(resolve => map.current.once('style.load', resolve));
      }

      // Add debug logging to inspect available layers
      console.log('Available Mapbox Layers:');
      const layers = map.current.getStyle().layers;
      const transportationLayers = layers.filter(layer => {
        const layerId = layer.id.toLowerCase();
        return layerId.includes('road') || 
               layerId.includes('transit') || 
               layerId.includes('railway') ||
               layerId.includes('highway') ||
               layerId.includes('bridge') ||
               layerId.includes('tunnel') ||
               layerId.includes('traffic') ||
               layerId.includes('transportation');
      });
      console.log('Transportation-related layers:', transportationLayers);

      // Style water in the base map layers
      const waterLayers = [
        'water',
        'water-shadow',
        'waterway',
        'water-depth',
        'water-pattern'
      ];

      waterLayers.forEach(layerId => {
        if (!map.current.getLayer(layerId)) return;

        try {
          const layer = map.current.getLayer(layerId);
          if (!layer) return;

          // Handle fill layers
          if (layer.type === 'fill') {
            map.current.setPaintProperty(layerId, 'fill-color', '#001f3d');
            map.current.setPaintProperty(layerId, 'fill-opacity', 0.8);
          }
          
          // Handle line layers
          if (layer.type === 'line') {
            map.current.setPaintProperty(layerId, 'line-color', '#001f3d');
            map.current.setPaintProperty(layerId, 'line-opacity', 0.8);
          }
        } catch (error) {
          console.warn(`Could not style water layer ${layerId}:`, error);
        }
      });

      // Style parks and green areas
      const parkLayers = [
        'landuse',
        'park',
        'park-label',
        'national-park',
        'natural',
        'golf-course',
        'pitch',
        'grass'
      ];

      parkLayers.forEach(layerId => {
        if (!map.current.getLayer(layerId)) return;

        try {
          const layer = map.current.getLayer(layerId);
          if (!layer) return;

          if (layer.type === 'fill') {
            map.current.setPaintProperty(layerId, 'fill-color', '#092407');
            map.current.setPaintProperty(layerId, 'fill-opacity', 0.3);
          }
          if (layer.type === 'symbol' && map.current.getPaintProperty(layerId, 'background-color') !== undefined) {
            map.current.setPaintProperty(layerId, 'background-color', '#092407');
          }
        } catch (error) {
          console.warn(`Could not style park layer ${layerId}:`, error);
        }
      });
    };

    if (map.current) {
      handleMapLoad();
    } else {
      map.current.once('load', handleMapLoad);
    }
  }, [isErcotMode]);

  // Add cleanup effect for AI consensus animation
  useEffect(() => {
    if (!map.current) return;

    return () => {
      // Clean up AI consensus particles layer
      if (map.current.getLayer('ai-consensus-particles')) {
        map.current.removeLayer('ai-consensus-particles');
      }
      if (map.current.getSource('ai-consensus-particles')) {
        map.current.removeSource('ai-consensus-particles');
      }
    };
  }, []);

  const handleLLMResponse = (response) => {
    if (!map.current) return;

    const clearExistingElements = () => {
      const existingElements = document.querySelectorAll('.mapboxgl-popup, .callout-annotation, .mapboxgl-marker');
      existingElements.forEach(el => el.remove());
      
      if (map.current.getSource('area-highlights')) {
        map.current.getSource('area-highlights').setData({
          type: 'FeatureCollection',
          features: []
        });
      }
    };

    clearExistingElements();

    if (response?.coordinates) {
      map.current.flyTo({
        center: response.coordinates,
        zoom: response.zoomLevel,
        duration: 1000
      });

      map.current.once('moveend', () => {
        map.current.once('idle', () => {
          highlightPOIBuildings(['restaurant', 'bar', 'nightclub'], '#FF4500');
          
          if (map.current) {
            map.current.setLayoutProperty('houston-pois', 'visibility', 'none');
          }
        });
      });
    }
  };

  const dragStart = (e) => {
    if (e.type === "mousedown") {
      isDraggingRef.current = true;
      initialXRef.current = e.clientX - xOffsetRef.current;
      initialYRef.current = e.clientY - yOffsetRef.current;
    } else if (e.type === "touchstart") {
      isDraggingRef.current = true;
      initialXRef.current = e.touches[0].clientX - xOffsetRef.current;
      initialYRef.current = e.touches[0].clientY - yOffsetRef.current;
    }
  };

  const dragEnd = () => {
    isDraggingRef.current = false;
    initialXRef.current = currentXRef.current;
    initialYRef.current = currentYRef.current;
  };

  const drag = (e) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      
      if (e.type === "mousemove") {
        currentXRef.current = e.clientX - initialXRef.current;
        currentYRef.current = e.clientY - initialXRef.current;
      } else if (e.type === "touchmove") {
        currentXRef.current = e.touches[0].clientX - initialXRef.current;
        currentYRef.current = e.touches[0].clientY - initialXRef.current;
      }

      xOffsetRef.current = currentXRef.current;
      yOffsetRef.current = currentYRef.current;
      
      if (popupRef.current) {
        popupRef.current.style.transform = 
          `translate3d(${currentXRef.current}px, ${currentYRef.current}px, 0)`;
      }
    }
  };

  useEffect(() => {
    if (!map.current) return;

    // Update bounds whenever the map moves
    const updateBounds = () => {
      const bounds = map.current.getBounds();
    };

    map.current.on('moveend', updateBounds);
    // Get initial bounds
    updateBounds();

    return () => {
      if (map.current) {
        map.current.off('moveend', updateBounds);
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Add touch event handlers
    const handleTouchStart = (e) => {
      if (!e || !e.touches) return;
      
      if (e.touches.length === 2) {
        e.preventDefault(); // Prevent default zoom behavior
      }
    };

    const handleTouchMove = (e) => {
      if (!e || !e.touches) return;
      
      if (e.touches.length === 2) {
        e.preventDefault();
      }
    };

    // Add the event listeners to the canvas container
    const mapCanvas = map.current.getCanvas();
    if (mapCanvas) {
      mapCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      mapCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });

      return () => {
        mapCanvas.removeEventListener('touchstart', handleTouchStart);
        mapCanvas.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, []);

  // Add the toggle3D function
  const toggle3D = async () => {
    if (!map.current) return;
    
    try {
      console.log('\n=== Toggling 3D Buildings ===');
      debugLog('3D Buildings toggle initiated');
      setIs3DLoading(true);
      
      // Record memory usage before 3D operation
      if (window.performance && window.performance.memory) {
        const memBefore = window.performance.memory;
        debugLog('Memory before 3D toggle:', {
          usedJSHeapSize: (memBefore.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
          usagePercentage: ((memBefore.usedJSHeapSize / memBefore.jsHeapSizeLimit) * 100).toFixed(2) + '%'
        });
      }
      
      // Wait for style to be loaded if needed
      if (!map.current.isStyleLoaded()) {
        debugLog('Waiting for map style to load...');
        await new Promise(resolve => {
          map.current.once('style.load', resolve);
        });
      }

      const newState = !is3DActive;
      debugLog(`Setting 3D buildings visibility to: ${newState ? 'visible' : 'none'}`);
      
      // Initialize 3D buildings through LayerManager if turning on
      if (newState) {
        if (!map.current.getSource('osm-buildings')) {
          debugLog('Setting up 3D buildings through LayerManager');
          await setup3DBuildings();
        }
        
        // Record FPS drop during 3D activation
        let initialFPS = 0;
        let newFPS = 0;
        
        const measureInitialFPS = () => {
          return new Promise(resolve => {
            let frames = 0;
            const startTime = performance.now();
            const duration = 1000; // 1 second sample
            
            const countFrame = () => {
              frames++;
              const elapsed = performance.now() - startTime;
              if (elapsed < duration) {
                requestAnimationFrame(countFrame);
              } else {
                initialFPS = Math.round(frames * 1000 / elapsed);
                resolve();
              }
            };
            
            requestAnimationFrame(countFrame);
          });
        };
        
        await measureInitialFPS();
        debugLog(`Initial FPS before 3D: ${initialFPS}`);
      }
      
      // Update visibility for OSM buildings layer
      safeLayerOperation('update-visibility', 'osm-buildings-3d', () => {
        if (map.current.getLayer('osm-buildings-3d')) {
          map.current.setLayoutProperty(
            'osm-buildings-3d',
            'visibility',
            newState ? 'visible' : 'none'
          );
        }
      });
      
      // Update visibility for Mapbox buildings layer
      safeLayerOperation('update-visibility', 'buildings-3d-layer', () => {
        if (map.current.getLayer('buildings-3d-layer')) {
          map.current.setLayoutProperty(
            'buildings-3d-layer',
            'visibility',
            newState ? 'visible' : 'none'
          );
        }
      });
      
      // Measure memory after 3D toggle
      if (window.performance && window.performance.memory) {
        const memAfter = window.performance.memory;
        debugLog('Memory after 3D toggle:', {
          usedJSHeapSize: (memAfter.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
          usagePercentage: ((memAfter.usedJSHeapSize / memAfter.jsHeapSizeLimit) * 100).toFixed(2) + '%',
          increase: ((memAfter.usedJSHeapSize - (window._memBefore || 0)) / 1048576).toFixed(2) + ' MB'
        });
      }
      
      setIs3DActive(newState);
      debugLog('3D buildings toggle complete');
    } catch (error) {
      debugError('Error toggling 3D buildings:', error);
      console.error('Error toggling 3D buildings:', error);
    } finally {
      setIs3DLoading(false);
    }
  };
  
  // Add the setup3DBuildings function
  const setup3DBuildings = async () => {
    try {
      debugLog('\n=== Setting up 3D Buildings Layer ===');
      
      // Wait for style to be loaded
      if (!map.current.isStyleLoaded()) {
        debugLog('Waiting for map style to load...');
        await new Promise(resolve => {
          map.current.once('style.load', resolve);
        });
        debugLog('Map style loaded successfully');
      }

      // Add OSM buildings source through LayerManager
      LayerManager.queueLayer('osm-buildings-source', async () => {
        try {
          // Use the optimized 10k buildings file
          const startTime = performance.now();
          debugLog('Fetching building data...');
          
          const response = await fetch('/data/osm/la_buildings_3d_10k.geojson');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          debugLog(`Fetched building data in ${performance.now() - startTime}ms`);
          const parseStart = performance.now();
          const data = await response.json();
          debugLog(`Parsed building data in ${performance.now() - parseStart}ms`);
          
          // Only add the source if it doesn't exist
          if (!map.current.getSource('osm-buildings')) {
            map.current.addSource('osm-buildings', {
              type: 'geojson',
              data: data
            });
          }
          
          debugLog('OSM buildings source added successfully');
        } catch (error) {
          debugError('Error loading OSM buildings data:', error);
          throw error;
        }
      }, '3d-buildings');

      // Add OSM buildings layer through LayerManager
      LayerManager.queueLayer('osm-buildings-3d', () => {
        if (!map.current.getLayer('osm-buildings-3d') && map.current.getSource('osm-buildings')) {
          debugLog('Adding OSM buildings layer...');
          map.current.addLayer({
            'id': 'osm-buildings-3d',
            'source': 'osm-buildings',
            'type': 'fill-extrusion',
            'paint': {
              'fill-extrusion-color': [
                'interpolate',
                ['linear'],
                ['get', 'height'],
                0, '#4a4a4a',    // Dark gray for shortest buildings
                50, '#666666',   // Medium gray for medium buildings
                100, '#808080'   // Light gray for tallest buildings
              ],
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.9,
              'fill-extrusion-vertical-gradient': true,
              'fill-extrusion-ambient-occlusion-intensity': 0.3,
              'fill-extrusion-ambient-occlusion-radius': 3
            },
            'layout': {
              'visibility': 'none'
            }
          });
          debugLog('OSM buildings layer added successfully');
        }
      }, '3d-buildings');

      // Add Mapbox buildings layer through LayerManager
      LayerManager.queueLayer('buildings-3d-layer', () => {
        if (!map.current.getLayer('buildings-3d-layer')) {
          debugLog('Adding Mapbox buildings layer...');
          
          // First check if we have access to the composite source and building layer
          const style = map.current.getStyle();
          if (!style.sources.composite) {
            debugError('Composite source not available - check Mapbox token and style');
          } else {
            map.current.addLayer({
              'id': 'buildings-3d-layer',
              'source': 'composite',
              'source-layer': 'building',
              'type': 'fill-extrusion',
              'minzoom': 15,
              'paint': {
                'fill-extrusion-color': '#333333',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15, 0,
                  15.05, ['get', 'height']
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15, 0,
                  15.05, ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 1.0,
                'fill-extrusion-vertical-gradient': true,
                'fill-extrusion-ambient-occlusion-intensity': 0.3,
                'fill-extrusion-ambient-occlusion-radius': 3
              },
              'layout': {
                'visibility': 'none'
              }
            });
            debugLog('Mapbox buildings layer added successfully');
          }
        }
      }, '3d-buildings');

      debugLog('=== 3D Buildings Setup Complete ===\n');
    } catch (error) {
      debugError('Error setting up 3D buildings:', error);
      throw error;
    }
  };
  
  // Add the rotate function
  const rotateMap = () => {
    if (!map.current) return;
    
    const newRotation = (currentRotation + 90) % 360;
    
    map.current.easeTo({
      bearing: newRotation,
      duration: 1000
    });
    
    setCurrentRotation(newRotation);
  };
  
  useEffect(() => {
    debugLog('Map component - showZoningLayer state changed:', showZoningLayer);
  }, [showZoningLayer]);

  // Add cleanup effect for 3D buildings
  useEffect(() => {
    return () => {
      if (map.current) {
        debugLog('Cleaning up 3D building layers');
        
        // Use LayerManager to safely remove 3D layers
        LayerManager.removeLayer('buildings-3d-layer');
        LayerManager.removeLayer('osm-buildings-3d');
        
        // Remove the source last
        if (map.current.getSource('osm-buildings')) {
          try {
            map.current.removeSource('osm-buildings');
            debugLog('Removed osm-buildings source');
          } catch (error) {
            debugError('Error removing osm-buildings source:', error);
          }
        }
      }
    };
  }, []);

  return (
    <MapContainer>
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <PopupManager map={map} />
      <ErcotManager ref={ercotManagerRef} map={map} isErcotMode={isErcotMode} setIsErcotMode={setIsErcotMode} />
      
      {/* Add SceneManager component */}
      <SceneManager 
        map={map.current}
        layerStates={layerStates}
        onLoadScene={handleLoadScene}
        onSaveScene={() => console.log('Scene saved')}
        isOpen={false}
        onClose={() => console.log('Scene manager closed')}
      />
      
      {showZoningLayer && (
        console.log('Rendering ZoningLayer component'),
        <ZoningLayer map={map} visible={showZoningLayer} />
      )}
      
      {showPlanningDocsLayer && (
        console.log('Rendering PlanningDocsLayer component'),
        <PlanningDocsLayer map={map} visible={showPlanningDocsLayer} />
      )}
      
      {showPlanningAnalysis && (
        console.log('Rendering PlanningAnalysisLayer with:', {
          showAdaptiveReuse,
          showDevelopmentPotential
        }),
        <PlanningAnalysisLayer
          map={map}
          showAdaptiveReuse={showAdaptiveReuse}
          showDevelopmentPotential={showDevelopmentPotential}
        />
      )}
      
      <LayerToggle
        map={map}
        isLayerMenuCollapsed={isLayerMenuCollapsed}
        setIsLayerMenuCollapsed={setIsLayerMenuCollapsed}
        isErcotMode={isErcotMode}
        setIsErcotMode={setIsErcotMode}
        showRoadGrid={showRoadGrid}
        setShowRoadGrid={setShowRoadGrid}
        showMUDLayer={showMUDLayer}
        setShowMUDLayer={setShowMUDLayer}
        showHarveyData={showHarveyData}
        setShowHarveyData={setShowHarveyData}
        showSurfaceWater={showSurfaceWater}
        setShowSurfaceWater={setShowSurfaceWater}
        showWastewaterOutfalls={showWastewaterOutfalls}
        setShowWastewaterOutfalls={setShowWastewaterOutfalls}
        showZipCodes={showZipCodes}
        setShowZipCodes={setShowZipCodes}
        showZipFloodAnalysis={showZipFloodAnalysis}
        setShowZipFloodAnalysis={setShowZipFloodAnalysis}
        showAIConsensus={showAIConsensus}
        setShowAIConsensus={setShowAIConsensus}
        showZoningLayer={showZoningLayer}
        setShowZoningLayer={setShowZoningLayer}
        showPlanningDocsLayer={showPlanningDocsLayer}
        setShowPlanningDocsLayer={setShowPlanningDocsLayer}
        showPlanningAnalysis={showPlanningAnalysis}
        setShowPlanningAnalysis={setShowPlanningAnalysis}
        showAdaptiveReuse={showAdaptiveReuse}
        setShowAdaptiveReuse={setShowAdaptiveReuse}
        showDevelopmentPotential={showDevelopmentPotential}
        setShowDevelopmentPotential={setShowDevelopmentPotential}
        showTransportation={showTransportation}
        setShowTransportation={setShowTransportation}
        showRoads={showRoads}
        setShowRoads={setShowRoads}
        showPublicTransit={showPublicTransit}
        setShowPublicTransit={setShowPublicTransit}
        showBikeInfra={showBikeInfra}
        setShowBikeInfra={setShowBikeInfra}
        showPedestrian={showPedestrian}
        setShowPedestrian={setShowPedestrian}
        showPOIs={showPOIs}
        setShowPOIs={setShowPOIs}
        showTransitStops={showTransitStops}
        setShowTransitStops={setShowTransitStops}
        showTransitStations={showTransitStations}
        setShowTransitStations={setShowTransitStations}
        showTransitRoutes={showTransitRoutes}
        setShowTransitRoutes={setShowTransitRoutes}
        showBikeLanes={showBikeLanes}
        setShowBikeLanes={setShowBikeLanes}
        showBikePaths={showBikePaths}
        setShowBikePaths={setShowBikePaths}
        showBikeParking={showBikeParking}
        setShowBikeParking={setShowBikeParking}
        showPedestrianPaths={showPedestrianPaths}
        setShowPedestrianPaths={setShowPedestrianPaths}
        showPedestrianCrossings={showPedestrianCrossings}
        setShowPedestrianCrossings={setShowPedestrianCrossings}
        showNeighborhoodBoundaries={showNeighborhoodBoundaries}
        setShowNeighborhoodBoundaries={setShowNeighborhoodBoundaries}
        show3DBuildings={show3DBuildings}
        setShow3DBuildings={setShow3DBuildings}
        is3DLoading={is3DLoading}
        setIs3DLoading={setIs3DLoading}
        fetchErcotData={() => ercotManagerRef.current?.fetchErcotData()}
        loadHarveyData={loadHarveyData}
        showPropertyPrices={showPropertyPrices}
        setShowPropertyPrices={setShowPropertyPrices}
        showEmployment={showEmployment}
        setShowEmployment={setShowEmployment}
        showParks={showParks}
        setShowParks={setShowParks}
        showNeighborhoodLabels={showNeighborhoodLabels}
        setShowNeighborhoodLabels={setShowNeighborhoodLabels}
        showEmploymentLabels={showEmploymentLabels}
        setShowEmploymentLabels={setShowEmploymentLabels}
        showLocalZones={showLocalZones}
        setShowLocalZones={setShowLocalZones}
        showLocalZoneBoundaries={showLocalZoneBoundaries}
        setShowLocalZoneBoundaries={setShowLocalZoneBoundaries}
        showLocalZoneLabels={showLocalZoneLabels}
        setShowLocalZoneLabels={setShowLocalZoneLabels}
      />

        <ToggleButton 
          $active={showRoadParticles}
          onClick={() => setShowRoadParticles(!showRoadParticles)}
          style={{ height: '32px', padding: '0 12px', fontSize: '14px', marginBottom: '8px' }}
        >
          {showRoadParticles ? 'Hide Flow' : 'Show Flow'}
        </ToggleButton>

        {/* 3D Mode Toggle Button */}
        <Toggle3DButton 
          $active={is3DActive}
          onClick={toggle3D}
          disabled={is3DLoading}
          aria-label="Toggle 3D view"
        >
          {is3DLoading ? '...' : (is3DActive ? '2D' : '3D')}
        </Toggle3DButton>
        
        {/* Rotation Button */}
        <RotateButton 
          onClick={rotateMap}
          aria-label="Rotate map"
        >
          ↻
        </RotateButton>

      <AIChatPanel 
        messages={messages}
        setMessages={setMessages}
        isLoading={isLoading}
        loadingMessage={loadingMessage}
        inputValue={inputValue}
        setInputValue={setInputValue}
        map={map.current}
        handleQuestion={async (question) => {
          try {
            const response = await handleQuestion(question, {
              center: map.current.getCenter(),
              zoom: map.current.getZoom()
            });
            return response;
          } catch (error) {
            console.error('Error handling question:', error);
            return null;
          }
        }}
        initialCollapsed={true}
      />

      {showPropertyPrices && (
        <PropertyPricesLayer
          map={map}
          showPropertyPrices={showPropertyPrices}
        />
      )}
      
      {showEmployment && (
        <EmploymentLayer
          map={map}
          showEmployment={showEmployment}
          showLabels={showEmploymentLabels}
        />
      )}
      
      {showLocalZones && (
        <LocalZonesLayer
          map={map}
          showLocalZones={showLocalZones}
          showLocalZoneBoundaries={showLocalZoneBoundaries}
          showLocalZoneLabels={showLocalZoneLabels}
        />
      )}
    </MapContainer>
  );
};

export default MapComponent;

