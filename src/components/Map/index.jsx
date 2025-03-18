import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { askClaude, parseClaudeResponse } from '../../services/claude';
import { MapContainer, ToggleButton } from './styles/MapStyles';
import { Toggle3DButton, RotateButton } from './StyledComponents';
import AIChatPanel from './AIChatPanel';
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
  const [showRoadParticles, setShowRoadParticles] = useState(true);
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
    showPOIs
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
      showPOIs
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
    showPOIs
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
          case 'show3DBuildings':
            setShow3DBuildings(value);
            break;
          case 'showPOIs':
            setShowPOIs(value);
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
          console.log('Starting road particles animation...');
          initializeRoadParticles(map.current);
          roadParticleAnimation.current = animateRoadParticles({ map: map.current });
        } else {
          if (roadParticleAnimation.current) {
            stopRoadParticles(map.current);
            cancelAnimationFrame(roadParticleAnimation.current);
            roadParticleAnimation.current = null;
          }
        }
      } catch (error) {
        console.error('Failed to initialize road particles:', error);
      }
    };

    // Initialize when map is ready
    if (map.current.loaded()) {
      initializeParticles();
    } else {
      map.current.once('load', initializeParticles);
    }

    return () => {
      if (roadParticleAnimation.current) {
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
      setIs3DLoading(true);
      
      // Wait for style to be loaded if needed
      if (!map.current.isStyleLoaded()) {
        console.log('Waiting for map style to load...');
        await new Promise(resolve => {
          map.current.once('style.load', resolve);
        });
      }

      // Initialize 3D buildings if not already done
      if (!map.current.getSource('osm-buildings')) {
        console.log('Initializing 3D buildings...');
        await setup3DBuildings();
      }

      const newState = !is3DActive;
      console.log(`Setting 3D buildings visibility to: ${newState ? 'visible' : 'none'}`);
      
      // Update visibility for OSM buildings layer
      if (map.current.getLayer('osm-buildings-3d')) {
        map.current.setLayoutProperty(
          'osm-buildings-3d',
          'visibility',
          newState ? 'visible' : 'none'
        );
      }
      
      // Update visibility for Mapbox buildings layer
      if (map.current.getLayer('buildings-3d-layer')) {
        map.current.setLayoutProperty(
          'buildings-3d-layer',
          'visibility',
          newState ? 'visible' : 'none'
        );
      }
      
      // Update camera
      map.current.easeTo({
        pitch: newState ? 60 : 0,
        duration: 1000
      });
      
      setIs3DActive(newState);
      console.log('3D buildings toggle complete');
    } catch (error) {
      console.error('Error toggling 3D buildings:', error);
    } finally {
      setIs3DLoading(false);
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
    console.log('Map component - showZoningLayer state changed:', showZoningLayer);
  }, [showZoningLayer]);

  // Add effect to setup 3D buildings layer
  const setup3DBuildings = async () => {
    try {
      console.log('\n=== Setting up 3D Buildings Layer ===');
      
      // Wait for style to be loaded
      if (!map.current.isStyleLoaded()) {
        console.log('Waiting for map style to load...');
        await new Promise(resolve => {
          map.current.once('style.load', resolve);
        });
        console.log('Map style loaded successfully');
      }

      // Add OSM buildings source if it doesn't exist
      if (!map.current.getSource('osm-buildings')) {
        console.log('Adding OSM buildings source...');
        try {
          // Use the optimized 10k buildings file
          const response = await fetch('/data/osm/la_buildings_3d_10k.geojson');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          map.current.addSource('osm-buildings', {
            type: 'geojson',
            data: data
          });
          console.log('OSM buildings source added successfully');
        } catch (error) {
          console.error('Error loading OSM buildings data:', error);
          throw error; // Re-throw to handle in toggle3D
        }
      }

      // Add OSM buildings layer if it doesn't exist
      if (!map.current.getLayer('osm-buildings-3d') && map.current.getSource('osm-buildings')) {
        console.log('Adding OSM buildings layer...');
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
        console.log('OSM buildings layer added successfully');
      }

      // Add Mapbox buildings layer if it doesn't exist
      if (!map.current.getLayer('buildings-3d-layer')) {
        console.log('Adding Mapbox buildings layer...');
        
        // First check if we have access to the composite source and building layer
        const style = map.current.getStyle();
        if (!style.sources.composite) {
          console.error('Composite source not available - check Mapbox token and style');
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
          console.log('Mapbox buildings layer added successfully');
        }
      }

      console.log('=== 3D Buildings Setup Complete ===\n');
    } catch (error) {
      console.error('Error setting up 3D buildings:', error);
      throw error; // Re-throw to handle in toggle3D
    }
  };

  // Add cleanup effect for 3D buildings
  useEffect(() => {
    return () => {
      if (map.current) {
        if (map.current.getLayer('buildings-3d-layer')) {
          map.current.removeLayer('buildings-3d-layer');
        }
        if (map.current.getLayer('osm-buildings-3d')) {
          map.current.removeLayer('osm-buildings-3d');
        }
        if (map.current.getSource('osm-buildings')) {
          map.current.removeSource('osm-buildings');
        }
      }
    };
  }, []);

  return (
    <MapContainer>
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <SceneManager
        map={map.current}
        layerStates={layerStates}
        onLoadScene={handleLoadScene}
      />
      <PopupManager map={map} />
      <ErcotManager ref={ercotManagerRef} map={map} isErcotMode={isErcotMode} setIsErcotMode={setIsErcotMode} />
      
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
        map={map.current}
        initialCollapsed={true}
      />
    </MapContainer>
  );
};

export default MapComponent;

