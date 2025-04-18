import React, { useRef, useEffect, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAP_CONFIG, BUILDING_COLORS } from './constants';
import { brickellGEOIDs } from './constants/geoIds';
import {
    initializeGEOIDParticleLayers,
    animateGEOIDParticles,
    stopGEOIDAnimation
} from './hooks/mapAnimations';
import { askClaude, parseClaudeResponse } from '../../services/claude';
import styled from 'styled-components';
import AIChatPanel from './AIChatPanel';
import {
    addGeoIdTags,
    createPOIToggle,
    highlightPOIBuildings,
    calculateBuildingArea
} from './utils';
import { initializeGEOIDLayer, getGEOIDLayerId, getAllGEOIDLayerIds } from './layers/GEOIDLayer';
import {
  initializeRoadGrid,
  animateRoadGrid,
  stopRoadAnimation
} from './hooks/mapAnimations';
import BostonBuildingsLayer from './BostonBuildingsLayer';
import POIGraph from './POIGraph';
import { useLayerToggles } from './Map/hooks/useLayerToggles';
import { use3DBuildings } from './Map/hooks/use3DBuildings';

// Set mapbox access token
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const MapContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  .callout-annotation {
    cursor: default;

    &:hover {
      z-index: 2;
    }
  }

  .mapboxgl-marker {
    z-index: 1 !important;
  }

  .custom-popup .mapboxgl-popup-content {
    background: none;
    padding: 0;
    border: none;
    box-shadow: none;
  }

  .custom-popup .mapboxgl-popup-close-button {
    color: white;
    font-size: 16px;
    padding: 4px 8px;
    right: 4px;
    top: 4px;
  }

  .custom-popup .mapboxgl-popup-tip {
    display: none;
  }
`;

const LayerToggleContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  padding: 10px;
  border-radius: 4px;
  z-index: 1;
`;

const ToggleButton = styled.button`
  padding: 8px 12px;
  background: ${props => props.active ? '#4CAF50' : '#666'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 150px;
  text-align: left;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.active ? '#45a049' : '#777'};
  }
`;

const DEBUG_LOGGING = false;

const log = (message, ...args) => {
  if (DEBUG_LOGGING) {
    console.log(message, ...args);
  }
};

const error = (message, ...args) => {
  console.error(message, ...args); // Keep error logs but make them more concise
};

const MapComponent = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const buildingStates = useRef(new Map());
  const previousHighlight = useRef([]);
  const currentFilter = useRef(null);
  const poiToggleRef = useRef(null);
  const roadAnimationFrame = useRef(null);
  const isUpdating3DBuildingsRef = useRef(false);

  const [messages, setMessages] = useState([]);
  const [showPOIMarkers, setShowPOIMarkers] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [isGeoIDVisible, setIsGeoIDVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [censusBlocksVisible, setCensusBlocksVisible] = useState(true);
  const [mudVisible, setMudVisible] = useState(true);
  const [selectedPolygonId, setSelectedPolygonId] = useState(null);
  const [ercotData, setErcotData] = useState(null);
  const [isErcotMode, setIsErcotMode] = useState(false);

  const [showOSMPOIs, setShowOSMPOIs] = useState(false);
  const [showBostonBuildings, setShowBostonBuildings] = useState(false);
  const [showParks, setShowParks] = useState(false);
  const [showRoads, setShowRoads] = useState(false);
  const [showTransportation, setShowTransportation] = useState(false);
  const [showNeighborhoodBoundaries, setShowNeighborhoodBoundaries] = useState(false);
  const [showNeighborhoodLabels, setShowNeighborhoodLabels] = useState(false);
  const [showPropertyPrices, setShowPropertyPrices] = useState(false);
  const [showEmployment, setShowEmployment] = useState(false);
  const [showEmploymentLabels, setShowEmploymentLabels] = useState(false);
  const [showLocalZones, setShowLocalZones] = useState(false);
  const [showLocalZoneBoundaries, setShowLocalZoneBoundaries] = useState(false);
  const [showLocalZoneLabels, setShowLocalZoneLabels] = useState(false);
  const [showZoningLayer, setShowZoningLayer] = useState(false);
  const [showPlanningAnalysis, setShowPlanningAnalysis] = useState(false);
  const [showAdaptiveReuse, setShowAdaptiveReuse] = useState(false);
  const [showDevelopmentPotential, setShowDevelopmentPotential] = useState(false);

  const [categoryVisibility, setCategoryVisibility] = useState({
    shops: true,
    cultural: true,
    restaurants: true,
    transportation: true,
    education: true,
    healthcare: true,
    bars: true,
    cafes: true,
    parks: true
  });

  const {
    showOSMTransit,
    showOSMBike,
    showOSMPedestrian,
    showTransitStops,
    showTransitRoutes,
    showBikeLanes,
    showBikePaths,
    showBikeParking,
    showPedestrianPaths,
    showPedestrianCrossings,
    setShowTransitStops,
    setShowTransitRoutes,
    setShowBikeLanes,
    setShowBikePaths,
    setShowBikeParking,
    setShowPedestrianPaths,
    setShowPedestrianCrossings,
    handleOSMTransitToggle,
    handleOSMBikeToggle,
    handleOSMPedestrianToggle
  } = useLayerToggles(map);

  const {
    show3DBuildings,
    setShow3DBuildings,
    toggle3D,
    reset3DBuildings
  } = use3DBuildings(map);

  const loadingMessages = [
    "Analyzing spatial data...",
    "Processing urban patterns...",
    "Calculating density metrics...",
    "Mapping neighborhood features...",
    "Evaluating development zones..."
  ];

  useEffect(() => {
    let messageInterval;
    if (isLoading) {
      let index = 0;
      setLoadingMessage(loadingMessages[0]);
      messageInterval = setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[index]);
      }, 2000);
    }
    return () => clearInterval(messageInterval);
  }, [isLoading]);

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

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_CONFIG.style,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      pitch: 0
    });

    // Initialize map layers after style is loaded
    const initializeMapLayers = async () => {
      try {
        // Wait for style to load
        if (!map.current.isStyleLoaded()) {
          await new Promise((resolve, reject) => {
            map.current.once('style.load', resolve);
            map.current.once('error', reject);
          });
        }

        // Load census blocks
        const censusResponse = await fetch('/houston-census-blocks.geojson');
        const censusData = await censusResponse.json();

        if (!map.current.getSource('census-blocks')) {
          map.current.addSource('census-blocks', {
            type: 'geojson',
            data: censusData
          });

          map.current.addLayer({
            'id': 'census-blocks',
            'type': 'fill',
            'source': 'census-blocks',
            'paint': {
              'fill-color': '#FF0000',
              'fill-opacity': 0.4,
              'fill-outline-color': '#000000'
            }
          });
        }

        // Add 3D building layer if not exists
        if (!map.current.getLayer('3d-buildings')) {
          map.current.addLayer({
            'id': '3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 12,
            'paint': {
              'fill-extrusion-color': [
                'case',
                ['boolean', ['feature-state', 'inPowerGrid'], false],
                [
                  'interpolate',
                  ['linear'],
                  ['feature-state', 'yellowIntensity'],
                  0, '#8B7355',
                  0.5, '#DAA520',
                  1, '#f7db05'
                ],
                ['case',
                  ['boolean', ['feature-state', 'isNegative'], false],
                  '#380614',
                  ['case',
                    ['boolean', ['feature-state', 'isGreen'], false],
                    '#51ff00',
                    '#1a1a1a'
                  ]
                ]
              ],
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
              'fill-extrusion-opacity': 0.7
            }
          });
        }

        // Initialize road grid
        await new Promise(resolve => setTimeout(resolve, 100));
        initializeRoadGrid(map.current, {
          beforeId: null
        });

        // Start road animation
        if (!roadAnimationFrame.current) {
          roadAnimationFrame.current = animateRoadGrid(map.current);
        }

        // Add click handler for census blocks
        const handleCensusBlockClick = (e) => {
          if (!e.features?.length) return;

          const feature = e.features[0];
          const clickedId = feature.properties.OBJECTID;

          console.log('Block clicked:', {
            id: clickedId,
            price: feature.properties.price,
            mw: feature.properties.mw,
            isErcotMode
          });

          map.current.setPaintProperty('census-blocks', 'fill-opacity', [
            'case',
            ['==', ['get', 'OBJECTID'], clickedId],
            0.7,
            0.3
          ]);

          if (feature.properties.price !== undefined && feature.properties.mw !== undefined) {
            const existingPopups = document.getElementsByClassName('mapboxgl-popup');
            Array.from(existingPopups).forEach(popup => popup.remove());

            new mapboxgl.Popup({
              className: 'custom-popup',
              closeButton: true,
              maxWidth: '360px',
              closeOnClick: false
            })
              .setLngLat(e.lngLat)
              .setHTML(`
                <div style="
                  background: rgba(26, 26, 26, 0.95);
                  padding: 20px;
                  border-radius: 8px;
                  color: white;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  min-width: 320px;
                ">
                  <div style="display: grid; grid-gap: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <div style="font-size: 24px; color: ${feature.properties.price > 100 ? '#ff4d4d' : '#4CAF50'};">
                          $${feature.properties.price?.toFixed(2)}
                        </div>
                        <div style="font-size: 12px; color: #888;">Current Price/MWh</div>
                      </div>
                    </div>
                  </div>
                </div>
              `)
              .addTo(map.current);
          }
        };

        map.current.on('click', 'census-blocks', handleCensusBlockClick);

        // Add error handling
        map.current.on('error', (e) => {
          console.error('Mapbox error:', e);
        });

      } catch (error) {
        console.error('Error initializing map layers:', error);
      }
    };

    initializeMapLayers();

    // Cleanup function
    return () => {
      if (map.current) {
        if (roadAnimationFrame.current) {
          stopRoadAnimation(roadAnimationFrame.current);
          roadAnimationFrame.current = null;
        }

        map.current.off('click', 'census-blocks');
        map.current.off('error');
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Empty dependency array since we only want to initialize once

  useEffect(() => {
    if (map.current && !poiToggleRef.current) {
      poiToggleRef.current = createPOIToggle(
        map.current,
        map.current.getContainer(),
        showPOIMarkers
      );
    }

    return () => {
      if (poiToggleRef.current) {
        poiToggleRef.current.cleanup();
        poiToggleRef.current = null;
      }
    };
  }, [map.current]);

  useEffect(() => {
    if (map.current) {
      const visibility = showPOIMarkers ? 'visible' : 'none';
      if (map.current.getLayer('houston-pois')) {
        map.current.setLayoutProperty('houston-pois', 'visibility', visibility);
      }
      if (map.current.getLayer('houston-pois-hover')) {
        map.current.setLayoutProperty('houston-pois-hover', 'visibility', visibility);
      }
    }
  }, [showPOIMarkers]);

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
          getAllGEOIDLayerIds().forEach((layerId) => {
            if (map.current.getLayer(layerId)) {
              const startTime = performance.now();
              const animationDuration = 500;

              function animate(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / animationDuration, 1);
                const newOpacity = Math.max(0, 1 - (progress * 0.6));

                map.current.setPaintProperty(layerId, 'fill-opacity', newOpacity);

                if (progress < 1) {
                  requestAnimationFrame(animate);
                }
              }

              requestAnimationFrame(animate);
            }
          });

          highlightPOIBuildings(['restaurant', 'bar', 'nightclub'], '#FF4500');
          setShowPOIMarkers(false);

          if (map.current) {
            map.current.setLayoutProperty('houston-pois', 'visibility', 'none');
          }
        });
      });
    }
  };

  const toggleCensusBlocks = () => {
    if (!map.current) return;

    setCensusBlocksVisible(prev => {
      const newVisibility = !prev;
      if (map.current.getLayer('census-blocks')) {
        map.current.setLayoutProperty(
          'census-blocks',
          'visibility',
          newVisibility ? 'visible' : 'none'
        );
      }
      return newVisibility;
    });
  };

  const toggleMUD = () => {
    if (!map.current) return;

    setMudVisible(prev => {
      const newVisibility = !prev;
      if (map.current.getLayer('mud-districts')) {
        map.current.setLayoutProperty(
          'mud-districts',
          'visibility',
          newVisibility ? 'visible' : 'none'
        );
      }
      return newVisibility;
    });
  };

  const onEachFeature = (feature, layer) => {
    layer.on('click', (e) => {
      const polygonId = feature.properties.OBJECTID;
      console.log('Clicked polygon:', {
        id: polygonId,
        properties: feature.properties
      });
      setSelectedPolygonId(polygonId);
    });
  };

  const fetchErcotData = async () => {
    try {
      log('🔄 Loading ERCOT data...');
      setIsErcotMode(true);

      const response = await fetch('http://localhost:3001/api/ercot-data', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      log('📊 Received ERCOT data:', data);

      if (data?.data && map.current) {
        // Merge ERCOT data with census blocks
        const source = map.current.getSource('census-blocks');
        if (!source) {
          error('❌ Census blocks source not found');
          return;
        }

        const currentFeatures = source._data.features;
        const mergedFeatures = currentFeatures.map((feature, index) => {
          const ercotData = data.data[index % data.data.length];
          return {
            ...feature,
            properties: {
              ...feature.properties,
              price: ercotData.price,
              mw: ercotData.mw
            }
          };
        });

        // Update source data
        source.setData({
          type: 'FeatureCollection',
          features: mergedFeatures
        });

        // Set colors based on price
        const prices = data.data.map(d => d.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        log('💰 Price range:', { min: minPrice, max: maxPrice });

        map.current.setPaintProperty('census-blocks', 'fill-color', [
          'interpolate',
          ['linear'],
          ['get', 'price'],
          minPrice, '#00ff00',
          maxPrice, '#ff0000'
        ]);

        map.current.setPaintProperty('census-blocks', 'fill-opacity', 0.7);
      }
    } catch (error) {
      error('❌ Error fetching ERCOT data:', error);
      setIsErcotMode(false);
    }
  };

  const clearErcotMode = () => {
    setIsErcotMode(false);
    if (map.current) {
      map.current.setPaintProperty('census-blocks', 'fill-color', '#FF0000');
      map.current.setPaintProperty('census-blocks', 'fill-opacity', 0.4);
    }
  };

  const handleCategoryVisibilityChange = (newVisibility) => {
    log('Map: Category visibility changed:', newVisibility);
    setCategoryVisibility(newVisibility);
  };

  // Import and initialize the layer state manager
  useEffect(() => {
    // Dynamically import the layer state manager
    import('./Map/utils/layerStateManager').then(module => {
      const layerStateManager = module.default;
      log('Layer state manager loaded');

      // Register all layer states with the manager
      layerStateManager.registerLayer('showPOIMarkers', setShowPOIMarkers, showPOIMarkers);
      layerStateManager.registerLayer('showOSMPOIs', setShowOSMPOIs, showOSMPOIs);
      layerStateManager.registerLayer('showBostonBuildings', setShowBostonBuildings, showBostonBuildings);
      layerStateManager.registerLayer('showParks', setShowParks, showParks);
      layerStateManager.registerLayer('showRoads', setShowRoads, showRoads);
      layerStateManager.registerLayer('show3DBuildings', (value) => {
        // Special handling for 3D buildings
        if (map.current) {
          const visibility = value ? 'visible' : 'none';
          if (map.current.getLayer('3d-buildings')) {
            map.current.setLayoutProperty('3d-buildings', 'visibility', visibility);
          }
        }
      }, map.current && map.current.getLayoutProperty('3d-buildings', 'visibility') === 'visible');

      // Register other layer states
      layerStateManager.registerLayer('showTransportation', setShowTransportation, showTransportation);
      layerStateManager.registerLayer('showNeighborhoodBoundaries', setShowNeighborhoodBoundaries, showNeighborhoodBoundaries);
      layerStateManager.registerLayer('showNeighborhoodLabels', setShowNeighborhoodLabels, showNeighborhoodLabels);
      layerStateManager.registerLayer('showPropertyPrices', setShowPropertyPrices, showPropertyPrices);
      layerStateManager.registerLayer('showEmployment', setShowEmployment, showEmployment);
      layerStateManager.registerLayer('showEmploymentLabels', setShowEmploymentLabels, showEmploymentLabels);
      layerStateManager.registerLayer('showLocalZones', setShowLocalZones, showLocalZones);
      layerStateManager.registerLayer('showLocalZoneBoundaries', setShowLocalZoneBoundaries, showLocalZoneBoundaries);
      layerStateManager.registerLayer('showLocalZoneLabels', setShowLocalZoneLabels, showLocalZoneLabels);
      layerStateManager.registerLayer('showZoningLayer', setShowZoningLayer, showZoningLayer);
      layerStateManager.registerLayer('showPlanningAnalysis', setShowPlanningAnalysis, showPlanningAnalysis);
      layerStateManager.registerLayer('showAdaptiveReuse', setShowAdaptiveReuse, showAdaptiveReuse);
      layerStateManager.registerLayer('showDevelopmentPotential', setShowDevelopmentPotential, showDevelopmentPotential);
      layerStateManager.registerLayer('categoryVisibility', setCategoryVisibility, categoryVisibility);

      // For backward compatibility, maintain the old interface
      window.layerToggleManager = {
        getAllToggleStates: () => layerStateManager.getAllLayerStates(),
        setAllToggleStates: (states) => layerStateManager.setAllLayerStates(states)
      };

      // Also expose individual setter functions for convenience
      window.setPOIMarkersVisible = (value) => {
        setShowPOIMarkers(value);
        layerStateManager.updateLayerState('showPOIMarkers', value);
      };

      window.setOSMPOIsVisible = (value) => {
        setShowOSMPOIs(value);
        layerStateManager.updateLayerState('showOSMPOIs', value);
      };

      window.setBostonBuildingsVisible = (value) => {
        console.log(`[GLOBAL] setBostonBuildingsVisible called with visible=${value}`);

        // First update the React state
        setShowBostonBuildings(value);
        console.log(`[GLOBAL] Updated React state to ${value}`);

        // Then update the layer state manager
        layerStateManager.updateLayerState('showBostonBuildings', value);
        console.log(`[GLOBAL] Updated layerStateManager with Boston Buildings=${value}`);

        // Debug the current state of the layers
        console.log('[GLOBAL] Current layer state before update:');
        if (map.current) {
          const bostonBuildingLayers = [
            'boston-buildings-fill',
            'boston-buildings-outline',
            'boston-buildings-labels'
          ];

          // Check if source exists
          try {
            const source = map.current.getSource('boston-buildings');
            console.log(`[GLOBAL] Source 'boston-buildings' exists: ${!!source}`);
          } catch (error) {
            console.log(`[GLOBAL] Source 'boston-buildings' error: ${error.message}`);
          }

          // Check each layer
          bostonBuildingLayers.forEach(layerId => {
            try {
              const exists = map.current.getLayer(layerId);
              if (exists) {
                const visibility = map.current.getLayoutProperty(layerId, 'visibility');
                console.log(`[GLOBAL] Layer '${layerId}' exists: YES, visibility: ${visibility}`);
              } else {
                console.log(`[GLOBAL] Layer '${layerId}' exists: NO`);
              }
            } catch (error) {
              console.log(`[GLOBAL] Layer '${layerId}' error: ${error.message}`);
            }
          });
        }

        // Then update the map layers directly
        if (map.current) {
          const bostonBuildingLayers = [
            'boston-buildings-fill',
            'boston-buildings-outline'
          ];

          console.log(`[GLOBAL] Directly toggling Boston Buildings layers to ${value ? 'visible' : 'none'}`);

          bostonBuildingLayers.forEach(layerId => {
            try {
              if (map.current.getLayer(layerId)) {
                console.log(`[GLOBAL] Setting ${layerId} to ${value ? 'visible' : 'none'}`);
                map.current.setLayoutProperty(layerId, 'visibility', value ? 'visible' : 'none');
              }
            } catch (error) {
              console.warn(`Error setting visibility for ${layerId}:`, error);
            }
          });

          // Verify the Boston Buildings layers visibility directly
          setTimeout(() => {
            console.log('[GLOBAL] Verifying layer visibility after update:');
            try {
              // Check if source exists
              try {
                const source = map.current.getSource('boston-buildings');
                console.log(`[GLOBAL] Source 'boston-buildings' exists: ${!!source}`);
              } catch (error) {
                console.log(`[GLOBAL] Source 'boston-buildings' error: ${error.message}`);
              }

              // Check each layer
              bostonBuildingLayers.forEach(layerId => {
                try {
                  if (map.current.getLayer(layerId)) {
                    const visibility = map.current.getLayoutProperty(layerId, 'visibility');
                    console.log(`[GLOBAL] Layer '${layerId}' exists: YES, visibility: ${visibility}`);

                    // Force the visibility if it doesn't match what we want
                    if (visibility !== (value ? 'visible' : 'none')) {
                      console.log(`[GLOBAL] Forcing ${layerId} visibility to ${value ? 'visible' : 'none'}`);
                      map.current.setLayoutProperty(layerId, 'visibility', value ? 'visible' : 'none');
                    }
                  } else {
                    console.log(`[GLOBAL] Layer '${layerId}' exists: NO`);
                  }
                } catch (error) {
                  console.log(`[GLOBAL] Layer '${layerId}' error: ${error.message}`);
                }
              });

              // Also check the layer state manager
              const currentState = layerStateManager.getAllLayerStates().showBostonBuildings;
              console.log(`[GLOBAL] Boston Buildings state in layerStateManager: ${currentState}`);

              // Force the state if it doesn't match what we want
              if (currentState !== value) {
                console.log(`[GLOBAL] Forcing layerStateManager Boston Buildings=${value}`);
                layerStateManager.updateLayerState('showBostonBuildings', value);
              }

              // Emit an event to notify the BostonBuildingsLayer component
              if (window.mapEventBus && typeof window.mapEventBus.emit === 'function') {
                console.log(`[GLOBAL] Emitting bostonBuildings:visibility event with visible=${value}`);
                window.mapEventBus.emit('bostonBuildings:visibility', { visible: value });
              }
            } catch (error) {
              console.error('Error verifying Boston Buildings layers visibility:', error);
            }
          }, 100);
        }
      };

      window.setCategoryVisibility = (value) => {
        setCategoryVisibility(value);
        layerStateManager.updateLayerState('categoryVisibility', value);
      };

      window.setParksVisible = (value) => {
        setShowParks(value);
        layerStateManager.updateLayerState('showParks', value);
      };

      window.setRoadsVisible = (value) => {
        setShowRoads(value);
        layerStateManager.updateLayerState('showRoads', value);
      };

      // Add a global function to toggle 3D buildings
      window.toggle3DBuildings = () => {
        log('Global toggle3DBuildings called');
        if (toggle3D) {
          toggle3D();
        }
      };

      // Add a global function to set 3D buildings visibility directly
      window.set3DBuildingsVisible = (value) => {
        log(`Setting 3D Buildings visibility to: ${value}`);
        setShow3DBuildings(value);
        layerStateManager.updateLayerState('show3DBuildings', value);

        // Also update the map layers directly
        if (map.current) {
          const buildingLayers = ['3d-buildings', 'buildings-3d-layer', 'osm-buildings-3d', 'harbor-buildings-3d'];
          buildingLayers.forEach(layerId => {
            try {
              if (map.current.getLayer(layerId)) {
                log(`Setting ${layerId} visibility to ${value ? 'visible' : 'none'}`);
                map.current.setLayoutProperty(layerId, 'visibility', value ? 'visible' : 'none');
              }
            } catch (error) {
              console.warn(`Error setting visibility for ${layerId}:`, error);
            }
          });
        }
      };

      // Add a force update function for Boston Buildings
      window.forceUpdateBostonBuildings = (visible) => {
        console.log(`[FORCE] Force updating Boston Buildings visibility to: ${visible}`);

        // Debug the current state of the layers
        console.log('[FORCE] Current layer state before update:');
        if (map.current) {
          const bostonBuildingLayers = [
            'boston-buildings-fill',
            'boston-buildings-outline',
            'boston-buildings-labels'
          ];

          // Check if source exists
          try {
            const source = map.current.getSource('boston-buildings');
            console.log(`[FORCE] Source 'boston-buildings' exists: ${!!source}`);
          } catch (error) {
            console.log(`[FORCE] Source 'boston-buildings' error: ${error.message}`);
          }

          // Check each layer
          bostonBuildingLayers.forEach(layerId => {
            try {
              const exists = map.current.getLayer(layerId);
              if (exists) {
                const visibility = map.current.getLayoutProperty(layerId, 'visibility');
                console.log(`[FORCE] Layer '${layerId}' exists: YES, visibility: ${visibility}`);
              } else {
                console.log(`[FORCE] Layer '${layerId}' exists: NO`);
              }
            } catch (error) {
              console.log(`[FORCE] Layer '${layerId}' error: ${error.message}`);
            }
          });
        }

        // Update React state
        setShowBostonBuildings(visible);
        console.log(`[FORCE] Updated React state to ${visible}`);

        // Update layer state manager
        layerStateManager.updateLayerState('showBostonBuildings', visible);
        console.log(`[FORCE] Updated layerStateManager with Boston Buildings=${visible}`);

        // Directly update all possible Boston Buildings layers
        if (map.current) {
          const bostonBuildingLayers = [
            'boston-buildings-fill',
            'boston-buildings-outline'
          ];

          console.log(`[FORCE] Directly toggling Boston Buildings layers to ${visible ? 'visible' : 'none'}`);

          // Force update all Boston Buildings layers
          bostonBuildingLayers.forEach(layerId => {
            try {
              if (map.current.getLayer(layerId)) {
                console.log(`[FORCE] Setting ${layerId} to ${visible ? 'visible' : 'none'}`);
                map.current.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
              }
            } catch (error) {
              console.warn(`Error setting visibility for ${layerId}:`, error);
            }
          });

          // Trigger a small map movement to force re-render
          const center = map.current.getCenter();
          map.current.panTo(center);

          // Emit an event to notify the BostonBuildingsLayer component
          if (window.mapEventBus && typeof window.mapEventBus.emit === 'function') {
            console.log(`[FORCE] Emitting bostonBuildings:visibility event with visible=${visible}`);
            window.mapEventBus.emit('bostonBuildings:visibility', { visible });
          }

          // Verify the visibility was set correctly
          setTimeout(() => {
            console.log('[FORCE] Verifying layer visibility after update:');
            bostonBuildingLayers.forEach(layerId => {
              try {
                if (map.current.getLayer(layerId)) {
                  const currentVisibility = map.current.getLayoutProperty(layerId, 'visibility');
                  console.log(`[FORCE] Layer '${layerId}' visibility after update: ${currentVisibility}`);

                  // Force the visibility if it doesn't match what we want
                  if (currentVisibility !== (visible ? 'visible' : 'none')) {
                    console.log(`[FORCE] Forcing ${layerId} visibility to ${visible ? 'visible' : 'none'}`);
                    map.current.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
                  }
                }
              } catch (error) {
                console.log(`[FORCE] Error checking ${layerId}: ${error.message}`);
              }
            });
          }, 100);
        }
      };
    }).catch(error => {
      error('Failed to load layer state manager:', error);
    });

    return () => {
      // Clean up global interface
      delete window.layerToggleManager;
      delete window.setPOIMarkersVisible;
      delete window.setOSMPOIsVisible;
      delete window.setBostonBuildingsVisible;
      delete window.setCategoryVisibility;
      delete window.setParksVisible;
      delete window.setRoadsVisible;
      delete window.forceUpdateBostonBuildings;
      delete window.toggle3DBuildings;
      delete window.set3DBuildingsVisible;
      delete window.layerStateManager;
    };
  }, []);

  // Update layer state manager when states change
  useEffect(() => {
    if (window.layerStateManager) {
      window.layerStateManager.updateLayerState('showPOIMarkers', showPOIMarkers);
      window.layerStateManager.updateLayerState('showOSMPOIs', showOSMPOIs);
      window.layerStateManager.updateLayerState('showBostonBuildings', showBostonBuildings);
      window.layerStateManager.updateLayerState('showParks', showParks);
      window.layerStateManager.updateLayerState('showRoads', showRoads);
      window.layerStateManager.updateLayerState('showTransportation', showTransportation);
      window.layerStateManager.updateLayerState('showNeighborhoodBoundaries', showNeighborhoodBoundaries);
      window.layerStateManager.updateLayerState('showNeighborhoodLabels', showNeighborhoodLabels);
      window.layerStateManager.updateLayerState('showPropertyPrices', showPropertyPrices);
      window.layerStateManager.updateLayerState('showEmployment', showEmployment);
      window.layerStateManager.updateLayerState('showEmploymentLabels', showEmploymentLabels);
      window.layerStateManager.updateLayerState('showLocalZones', showLocalZones);
      window.layerStateManager.updateLayerState('showLocalZoneBoundaries', showLocalZoneBoundaries);
      window.layerStateManager.updateLayerState('showLocalZoneLabels', showLocalZoneLabels);
      window.layerStateManager.updateLayerState('showZoningLayer', showZoningLayer);
      window.layerStateManager.updateLayerState('showPlanningAnalysis', showPlanningAnalysis);
      window.layerStateManager.updateLayerState('showAdaptiveReuse', showAdaptiveReuse);
      window.layerStateManager.updateLayerState('showDevelopmentPotential', showDevelopmentPotential);
    }
  }, [
    showPOIMarkers, showOSMPOIs, showBostonBuildings, showParks, showRoads,
    showTransportation, showNeighborhoodBoundaries, showNeighborhoodLabels,
    showPropertyPrices, showEmployment, showEmploymentLabels,
    showLocalZones, showLocalZoneBoundaries, showLocalZoneLabels,
    showZoningLayer, showPlanningAnalysis, showAdaptiveReuse, showDevelopmentPotential
  ]);

  return (
    <MapContainer>
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

      <BostonBuildingsLayer
        map={map}
        visible={showBostonBuildings}
        selectedPOI={selectedPolygonId}
        visibleCategories={categoryVisibility}
      />

      <POIGraph
        map={map}
        showPOIMarkers={showPOIMarkers}
        setShowPOIMarkers={setShowPOIMarkers}
        graphOnlyMode={false}
        setGraphOnlyMode={() => {}}
        onCategoryVisibilityChange={handleCategoryVisibilityChange}
      />

      <LayerToggleContainer>
        <ToggleButton
          active={censusBlocksVisible}
          onClick={toggleCensusBlocks}
          style={{ height: '20px', padding: '0 8px', fontSize: '12px', marginRight: '8px' }}
        >
          Census Blocks
        </ToggleButton>
        <ToggleButton
          active={mudVisible}
          onClick={toggleMUD}
          style={{ height: '20px', padding: '0 8px', fontSize: '12px' }}
        >
          MUD Districts
        </ToggleButton>
        <ToggleButton
          active={isErcotMode}
          onClick={fetchErcotData}
          style={{ height: '20px', padding: '0 8px', fontSize: '12px', marginRight: '8px' }}
        >
          Load ERCOT Data
        </ToggleButton>
        {isErcotMode && (
          <ToggleButton
            onClick={clearErcotMode}
            style={{ height: '20px', padding: '0 8px', fontSize: '12px' }}
          >
            Clear ERCOT
          </ToggleButton>
        )}
        <ToggleButton
          active={showPOIMarkers}
          onClick={() => setShowPOIMarkers(!showPOIMarkers)}
          style={{ height: '20px', padding: '0 8px', fontSize: '12px' }}
        >
          POIs
        </ToggleButton>
      </LayerToggleContainer>

      <AIChatPanel
        messages={messages}
        setMessages={setMessages}
        isLoading={isLoading}
        loadingMessage={loadingMessage}
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleQuestion={handleQuestion}
        map={map}
      />
    </MapContainer>
  );
};

export default MapComponent;

