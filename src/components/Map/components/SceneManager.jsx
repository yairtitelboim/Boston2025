import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { createLogger } from '../../../utils/logging';

// Create a logger for the SceneManager component
const logger = createLogger('SceneManager');

// New left sidebar styles
const SceneSidebar = styled.div`
  position: fixed;
  top: 0;
  left: ${props => props.isOpen ? '0' : '-380px'};
  width: 360px;
  height: 100vh;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 4px 0 6px -1px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
  z-index: 999;
  overflow-y: auto;
  padding: 24px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.3);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.5);
    border-radius: 4px;
    &:hover {
      background: rgba(148, 163, 184, 0.7);
    }
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
`;

const SidebarTitle = styled.h2`
  color: white;
  margin: 0;
  font-size: 20px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  opacity: 0.8;
  transition: opacity 0.2s ease;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const SceneList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SceneItem = styled.div`
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(148, 163, 184, 0.4);
  }
`;

const SceneName = styled.span`
  color: white;
  font-size: 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const SceneNameInput = styled.input`
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 4px;
  padding: 4px 8px;
  color: white;
  font-size: 14px;
  width: 100%;
  margin-bottom: 4px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const SceneTimestamp = styled.div`
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  margin-top: 4px;
`;

const SceneActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.$delete ? '#ff4444' : props.$update ? '#4ade80' : 'white'};
  cursor: pointer;
  padding: 4px;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

const SaveSceneForm = styled.form`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
`;

const SaveSceneInput = styled.input`
  flex: 1;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  padding: 8px 12px;
  color: white;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const SaveSceneButton = styled.button`
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s ease;

  &:hover {
    background: #2563eb;
  }
`;

const SceneManager = ({
  map,
  isOpen,
  onClose
}) => {
  const [scenes, setScenes] = useState(() => {
    const savedScenes = localStorage.getItem('mapScenes');
    return savedScenes ? JSON.parse(savedScenes) : [];
  });
  const [sceneName, setSceneName] = useState('');
  const [editingSceneId, setEditingSceneId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Add state to track current camera position
  const [currentCamera, setCurrentCamera] = useState({
    center: { lng: -71.06, lat: 42.36 }, // Default to Boston
    zoom: 14,
    pitch: 0,
    bearing: 0
  });

  // Use a ref to track if we're programmatically changing the camera
  const isChangingCamera = useRef(false);

  // Add event listener to track map movement
  useEffect(() => {
    if (!map) return;

    // Function to update camera state
    const updateCameraState = () => {
      // Skip updates if we're programmatically changing the camera
      if (isChangingCamera.current) return;

      try {
        const newCamera = {
          center: map.getCenter(),
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing()
        };
        setCurrentCamera(newCamera);
      } catch (error) {
        console.warn('Error updating camera state:', error);
      }
    };

    // Add event listeners for map movement
    map.on('moveend', updateCameraState);
    map.on('zoomend', updateCameraState);
    map.on('pitchend', updateCameraState);
    map.on('rotateend', updateCameraState);

    // Initialize camera state
    updateCameraState();

    // Clean up event listeners
    return () => {
      map.off('moveend', updateCameraState);
      map.off('zoomend', updateCameraState);
      map.off('pitchend', updateCameraState);
      map.off('rotateend', updateCameraState);
    };
  }, [map]);

  // Helper function to check if map style is loaded
  const isMapStyleLoaded = useCallback(() => {
    if (!map) return false;
    try {
      return map.isStyleLoaded();
    } catch (error) {
      console.warn('Error checking if map style is loaded:', error);
      return false;
    }
  }, [map]);

  /**
   * Capture the current state of all layers and components
   * @returns {Object} The current state of all layers and components
   */
  const captureLayerStates = () => {
    if (!map) {
      logger.warn('Map not initialized for scene capture');
      return null;
    }

    try {
      logger.info('=== Capturing Scene State ===');

      // First, directly check if park layers are visible in the map
      const parkLayers = [
        'park',
        'park-label',
        'national-park',
        'golf-course',
        'pitch',
        'grass',
        'landuse',
        'landuse_overlay',
        'natural',
        'natural-line',
        'natural-point-label',
        'land-structure-polygon',
        'land-structure-line',
        'waterway',
        'waterway-label'
      ];

      let isParksVisible = false;
      for (const layerId of parkLayers) {
        try {
          if (map.getLayer(layerId) && map.getLayoutProperty(layerId, 'visibility') !== 'none') {
            isParksVisible = true;
            logger.info(`Park layer ${layerId} is visible, setting showParks to true`);
            console.log(`%cPark layer ${layerId} is visible, setting showParks to true`, 'color: green; font-weight: bold');
            break;
          }
        } catch (error) {
          // Ignore errors for layers that don't exist
        }
      }

      // Use the layer state manager if available
      if (window.layerStateManager) {
        logger.info('Using layerStateManager to capture layer states');
        const allLayerStates = window.layerStateManager.getAllLayerStates();

        // Override the parks state if we detect visible park layers
        if (isParksVisible) {
          logger.warn('Parks are visible, setting showParks to true');
          console.log('%cParks are visible, setting showParks to true', 'color: green; font-weight: bold');
          allLayerStates.showParks = true;

          // Also update the layer state manager
          window.layerStateManager.updateLayerState('showParks', true);
        }

        // Check for OSM POIs visibility
        try {
          // First check if the OSM POIs toggle is checked in the UI
          const osmPOIsToggle = document.querySelector('.osm-poi-marker');
          if (osmPOIsToggle) {
            console.log('%cOSM POI markers found in the DOM, setting showOSMPOIs to true', 'background: purple; color: white;');
            allLayerStates.showOSMPOIs = true;

            // Also update the layer state manager
            window.layerStateManager.updateLayerState('showOSMPOIs', true);
          }
        } catch (error) {
          logger.warn('Error checking OSM POIs visibility:', error);
        }

        // Log key states for debugging
        logger.info('Key layer states captured:');
        logger.info('- showBostonBuildings:', allLayerStates.showBostonBuildings);
        logger.info('- showOSMPOIs:', allLayerStates.showOSMPOIs);
        logger.info('- showPOIMarkers:', allLayerStates.showPOIMarkers);
        logger.info('- show3DBuildings:', allLayerStates.show3DBuildings);
        logger.info('- showParks:', allLayerStates.showParks);

        // Capture POI Graph state
        if (window.mapEventBus) {
          // Request current POI Graph state
          logger.info('Requesting current POI Graph state');
          window.mapEventBus.emit('poiGraph:requestState', {});

          // Add POI Graph visibility to the state
          const poiGraphElement = document.querySelector('.poi-graph-container');
          if (poiGraphElement) {
            const isVisible = window.getComputedStyle(poiGraphElement).display !== 'none';
            logger.info('POI Graph visibility detected:', isVisible);
            allLayerStates.poiGraphOpen = isVisible;
          }

          // Try to get OSM data state from the POI Graph
          const osmToggle = document.querySelector('.poi-graph-osm-toggle input[type="checkbox"]');
          if (osmToggle) {
            const osmDataEnabled = osmToggle.checked;
            logger.info('OSM Data toggle state detected:', osmDataEnabled);
            allLayerStates.osmDataEnabled = osmDataEnabled;
          }
        }

        logger.info('Complete layer states captured from layerStateManager');
        return allLayerStates;
      }

      // Fallback to the old method if layerStateManager is not available
      logger.warn('layerStateManager not available, using fallback method');

      // Use layerToggleManager if available
      if (window.layerToggleManager) {
        const toggleStates = window.layerToggleManager.getAllToggleStates();
        logger.info('Captured layer states from layerToggleManager:', toggleStates);
        return toggleStates;
      }

      // Last resort: infer from layer visibility or use defaults
      logger.warn('No state managers available, using defaults with safe layer checks');

      // Get all available layers in the map
      const availableLayers = map.getStyle().layers.map(layer => layer.id);
      logger.info('Available layers:', availableLayers);

      // Safe layer visibility check function
      const safeIsLayerVisible = (layerId) => {
        try {
          // Check if layer exists first
          if (!availableLayers.includes(layerId)) {
            logger.warn(`Layer ${layerId} not found in map, skipping visibility check`);
            return false;
          }
          return map.getLayoutProperty(layerId, 'visibility') !== 'none';
        } catch (error) {
          logger.warn(`Error checking visibility for layer ${layerId}:`, error);
          return false;
        }
      };

      // Check for Boston Buildings layers
      const bostonBuildingLayers = ['boston-buildings-fill', 'boston-buildings-outline', 'boston-buildings-labels'];
      const hasBostonBuildingLayers = bostonBuildingLayers.some(layerId => availableLayers.includes(layerId));
      const isBostonBuildingsVisible = hasBostonBuildingLayers &&
        bostonBuildingLayers.some(layerId => safeIsLayerVisible(layerId));

      // Check for 3D Buildings layer
      const has3DBuildings = availableLayers.includes('3d-buildings');
      const is3DBuildingsVisible = has3DBuildings && safeIsLayerVisible('3d-buildings');

      // Check for POI Markers
      const poiLayers = availableLayers.filter(layerId =>
        layerId.includes('poi') || layerId.includes('label'));
      const hasPOILayers = poiLayers.length > 0;
      const isPOIMarkersVisible = hasPOILayers &&
        poiLayers.some(layerId => safeIsLayerVisible(layerId));

      // Check if park layers are visible using the already defined parkLayers array
      let fallbackIsParksVisible = false;
      for (const layerId of parkLayers) {
        if (safeIsLayerVisible(layerId)) {
          fallbackIsParksVisible = true;
          logger.info(`Park layer ${layerId} is visible, setting showParks to true`);
          break;
        }
      }

      // Check if OSM POIs are visible
      let isOSMPOIsVisible = false;
      try {
        // First check if the OSM POIs toggle is checked in the UI
        const osmPOIsToggle = document.querySelector('.osm-poi-marker');
        if (osmPOIsToggle) {
          isOSMPOIsVisible = true;
          console.log('%cOSM POI markers found in the DOM, setting showOSMPOIs to true', 'background: purple; color: white;');
        }

        // Also check the layer state manager
        if (window.layerStateManager) {
          const osmPOIsState = window.layerStateManager.getAllLayerStates().showOSMPOIs;
          if (osmPOIsState) {
            isOSMPOIsVisible = true;
            console.log('%cOSM POIs state is true in layerStateManager', 'background: purple; color: white;');
          }
        }
      } catch (error) {
        logger.warn('Error checking OSM POIs visibility:', error);
      }

      // Create inferred states with safe defaults
      const inferredStates = {
        showBostonBuildings: isBostonBuildingsVisible,
        show3DBuildings: is3DBuildingsVisible,
        showPOIMarkers: isPOIMarkersVisible,
        showOSMPOIs: isOSMPOIsVisible, // Use the detected state
        showParks: fallbackIsParksVisible || isParksVisible, // Use either detection method
        showRoads: true,     // Default to true as roads are usually visible
        poiGraphOpen: false  // Default to false
      };

      logger.info('Inferred layer states:', inferredStates);
      return inferredStates;
    } catch (error) {
      logger.error('Error capturing layer states:', error);
      return {};
    }
  };

  /**
   * Restore layer states from a saved scene
   * @param {Object} sceneState - The saved scene state
   * @returns {boolean} - Whether the restoration was successful
   */
  const restoreLayerStates = useCallback((sceneState) => {
    if (!map || !sceneState) {
      logger.warn('Cannot restore scene: map or scene state missing');
      return false;
    }

    try {
      logger.info('=== Restoring Scene State ===');
      logger.info('Scene state to restore:', JSON.stringify(sceneState, null, 2));

      // Use layerStateManager if available
      if (window.layerStateManager) {
        logger.info('Using layerStateManager to restore layer states');

        // Log key states before restoration
        logger.info('Key states before restoration:');
        const currentStates = window.layerStateManager.getAllLayerStates();
        logger.info('- showBostonBuildings:', currentStates.showBostonBuildings);
        logger.info('- showOSMPOIs:', currentStates.showOSMPOIs);
        logger.info('- showPOIMarkers:', currentStates.showPOIMarkers);
        logger.info('- show3DBuildings:', currentStates.show3DBuildings);
        logger.info('- showParks:', currentStates.showParks);
        logger.info('- poiGraphOpen:', currentStates.poiGraphOpen);

        // Restore all layer states
        logger.info('Calling setAllLayerStates with scene state');
        window.layerStateManager.setAllLayerStates(sceneState);

        // Directly update critical layer visibilities to ensure they're applied
        if (sceneState.showBostonBuildings !== undefined) {
          logger.info('Directly setting Boston Buildings visibility:', sceneState.showBostonBuildings);
          if (window.setBostonBuildingsVisible) {
            window.setBostonBuildingsVisible(sceneState.showBostonBuildings);
          }

          // Also update the map layers directly
          const bostonBuildingLayers = ['boston-buildings-fill', 'boston-buildings-outline', 'boston-buildings-labels'];
          bostonBuildingLayers.forEach(layerId => {
            if (map.getLayer(layerId)) {
              logger.info(`Setting ${layerId} visibility to ${sceneState.showBostonBuildings ? 'visible' : 'none'}`);
              map.setLayoutProperty(layerId, 'visibility', sceneState.showBostonBuildings ? 'visible' : 'none');
            }
          });
        }

        // Directly update 3D Buildings visibility
        if (sceneState.show3DBuildings !== undefined) {
          logger.info('Directly setting 3D Buildings visibility:', sceneState.show3DBuildings);

          // First try to use the global setter function
          if (window.set3DBuildingsVisible) {
            logger.info('Using window.set3DBuildingsVisible to update 3D Buildings');
            window.set3DBuildingsVisible(sceneState.show3DBuildings);
          } else {
            // If global function is not available, try other methods

            // Try to directly call the toggle3DBuildings function if available
            if (window.toggle3DBuildings) {
              logger.info('Using window.toggle3DBuildings to ensure proper state');
              // Only call if the current state doesn't match the desired state
              const currentState = window.layerStateManager ?
                window.layerStateManager.getAllLayerStates().show3DBuildings : false;
              if (currentState !== sceneState.show3DBuildings) {
                window.toggle3DBuildings();
              }
            } else {
              // If toggle3DBuildings is not available, update the map layers directly
              logger.info('No global 3D Buildings functions available, updating map layers directly');

              const buildingLayers = ['3d-buildings', 'buildings-3d-layer', 'osm-buildings-3d', 'harbor-buildings-3d'];
              buildingLayers.forEach(layerId => {
                try {
                  if (map.getLayer(layerId)) {
                    logger.info(`Setting ${layerId} visibility to ${sceneState.show3DBuildings ? 'visible' : 'none'}`);
                    map.setLayoutProperty(layerId, 'visibility', sceneState.show3DBuildings ? 'visible' : 'none');
                  }
                } catch (error) {
                  logger.warn(`Error setting visibility for ${layerId}:`, error);
                }
              });

              // Also update the layer state manager directly
              if (window.layerStateManager) {
                logger.info('Updating layerStateManager with 3D Buildings visibility:', sceneState.show3DBuildings);
                window.layerStateManager.updateLayerState('show3DBuildings', sceneState.show3DBuildings);
              }
            }
          }

          // Log the 3D Buildings state after restoration
          setTimeout(() => {
            try {
              // Check if 3D building layers are actually visible
              const buildingLayers = ['3d-buildings', 'buildings-3d-layer', 'osm-buildings-3d', 'harbor-buildings-3d'];
              let is3DBuildingsVisible = false;

              for (const layerId of buildingLayers) {
                try {
                  if (map.getLayer(layerId) && map.getLayoutProperty(layerId, 'visibility') !== 'none') {
                    is3DBuildingsVisible = true;
                    logger.info(`3D Building layer ${layerId} is visible after restoration`);
                    break;
                  }
                } catch (error) {
                  // Ignore errors for layers that don't exist
                }
              }

              logger.info(`3D Buildings visibility after restoration: ${is3DBuildingsVisible}`);

              // Check if the state matches the actual visibility
              if (window.layerStateManager) {
                const buildingsState = window.layerStateManager.getAllLayerStates().show3DBuildings;
                logger.info(`3D Buildings state in layerStateManager: ${buildingsState}`);

                if (buildingsState !== is3DBuildingsVisible) {
                  logger.warn(`3D Buildings state mismatch: layerStateManager=${buildingsState}, actual=${is3DBuildingsVisible}`);
                  window.layerStateManager.updateLayerState('show3DBuildings', is3DBuildingsVisible);
                }
              }
            } catch (error) {
              logger.warn('Error checking 3D Buildings visibility after restoration:', error);
            }
          }, 500);
        }

        // Directly update POI Markers visibility
        if (sceneState.showPOIMarkers !== undefined) {
          logger.info('Directly setting POI Markers visibility:', sceneState.showPOIMarkers);
          if (window.setPOIMarkersVisible) {
            window.setPOIMarkersVisible(sceneState.showPOIMarkers);
          }

          // Also update the map layer directly
          if (map.getLayer('poi-label')) {
            logger.info(`Setting poi-label visibility to ${sceneState.showPOIMarkers ? 'visible' : 'none'}`);
            map.setLayoutProperty('poi-label', 'visibility', sceneState.showPOIMarkers ? 'visible' : 'none');
          }
        }

        // Directly update OSM POIs visibility
        if (sceneState.showOSMPOIs !== undefined) {
          logger.info('Directly setting OSM POIs visibility:', sceneState.showOSMPOIs);
          console.log('%c[SCENE RESTORE] Setting OSM POIs visibility:', 'background: purple; color: white; font-size: 16px; padding: 5px;', sceneState.showOSMPOIs);

          // Use the saved OSM POIs state from the scene
          const osmPOIsVisible = sceneState.showOSMPOIs;

          // Update the layer state manager directly
          if (window.layerStateManager) {
            logger.info('Updating layerStateManager with OSM POIs visibility:', osmPOIsVisible);
            console.log(`%c[SCENE RESTORE] Updating layerStateManager with OSM POIs=${osmPOIsVisible}`, 'background: purple; color: white;');
            window.layerStateManager.updateLayerState('showOSMPOIs', osmPOIsVisible);
          }

          // Use the global setter function
          if (window.setOSMPOIsVisible) {
            logger.info('Using window.setOSMPOIsVisible to update OSM POIs');
            console.log(`%c[SCENE RESTORE] Calling setOSMPOIsVisible(${osmPOIsVisible})`, 'background: purple; color: white;');
            window.setOSMPOIsVisible(osmPOIsVisible);
          }

          // Also emit events directly
          if (window.mapEventBus) {
            logger.info('Emitting osmLayer:visibility event with visible:', osmPOIsVisible);
            console.log(`%c[SCENE RESTORE] Emitting osmLayer:visibility with visible=${osmPOIsVisible}`, 'background: purple; color: white;');
            window.mapEventBus.emit('osmLayer:visibility', { visible: osmPOIsVisible });
            window.mapEventBus.emit('osm:visibility', { visible: osmPOIsVisible });
          }
        }

        // Directly update Parks visibility
        if (sceneState.showParks !== undefined) {
          logger.info('Directly setting Parks visibility:', sceneState.showParks);
          console.log('%cDirectly setting Parks visibility:', 'background: red; color: white; font-size: 16px; padding: 5px;', sceneState.showParks);

          // Use the saved Parks state from the scene
          const parksVisible = sceneState.showParks;

          // Always update the map layers directly first
          const criticalParkLayers = [
            'national-park',
            'landuse'
          ];

          criticalParkLayers.forEach(layerId => {
            try {
              if (map.getLayer(layerId)) {
                // Use the saved Parks state
                const newVisibility = parksVisible ? 'visible' : 'none';
                logger.info(`Setting ${layerId} visibility to ${newVisibility}`);
                console.log(`%cSetting ${layerId} visibility to ${newVisibility}`, 'background: green; color: white;');
                map.setLayoutProperty(layerId, 'visibility', newVisibility);
              }
            } catch (error) {
              logger.warn(`Error setting visibility for ${layerId}:`, error);
            }
          });

          // Update the layer state manager directly with the saved state
          if (window.layerStateManager) {
            logger.info('Updating layerStateManager with Parks visibility:', parksVisible);
            console.log(`%cUpdating layerStateManager Parks=${parksVisible}`, 'background: green; color: white;');
            window.layerStateManager.updateLayerState('showParks', parksVisible);
          }

          // Try to use the global setter function with the saved state
          if (window.setParksVisible) {
            logger.info('Using window.setParksVisible to update Parks');
            console.log(`%cCalling setParksVisible(${parksVisible})`, 'background: green; color: white;');
            window.setParksVisible(parksVisible);
          } else if (window.toggleParkLayers) {
            // Try to directly call the toggleParkLayers function if available
            logger.info('Using window.toggleParkLayers to update Parks');
            console.log(`%cCalling toggleParkLayers(${parksVisible})`, 'background: green; color: white;');
            window.toggleParkLayers(parksVisible);
          }

          // Also update all other park layers with the saved state
          const allParkLayers = [
            'park',
            'park-label',
            'national-park',
            'golf-course',
            'pitch',
            'grass',
            'landuse',
            'landuse_overlay',
            'natural',
            'natural-line',
            'natural-point-label',
            'land-structure-polygon',
            'land-structure-line',
            'waterway',
            'waterway-label'
          ];

          console.log(`%cUpdating all park layers to ${parksVisible ? 'visible' : 'hidden'}`, 'background: green; color: white;');

          allParkLayers.forEach(layerId => {
            try {
              if (map.getLayer(layerId)) {
                logger.info(`Setting ${layerId} visibility to ${parksVisible ? 'visible' : 'none'}`);
                map.setLayoutProperty(layerId, 'visibility', parksVisible ? 'visible' : 'none');
              }
            } catch (error) {
              logger.warn(`Error setting visibility for ${layerId}:`, error);
            }
          });

          // Final verification
          setTimeout(() => {
            console.log('%cVerifying park layers visibility after update', 'background: blue; color: white;');
            let visibleCount = 0;

            allParkLayers.forEach(layerId => {
              try {
                if (map.getLayer(layerId)) {
                  const visibility = map.getLayoutProperty(layerId, 'visibility');
                  if (visibility !== 'none') {
                    visibleCount++;
                    console.log(`${layerId}: VISIBLE`);
                  } else {
                    console.log(`${layerId}: HIDDEN`);
                  }
                }
              } catch (error) {
                // Ignore errors
              }
            });

            console.log(`%c${visibleCount} park layers are visible`, 'background: blue; color: white;');
          }, 500);
        }

        // Handle POI Graph visibility separately
        if (sceneState.poiGraphOpen !== undefined) {
          logger.info('Restoring POI Graph visibility:', sceneState.poiGraphOpen);

          // Use the event bus to toggle POI Graph visibility
          if (window.mapEventBus) {
            window.mapEventBus.emit('poiGraph:visibility', {
              isVisible: sceneState.poiGraphOpen,
              height: '40%'
            });
          }
        }

        // Handle OSM Data toggle separately
        if (sceneState.osmDataEnabled !== undefined) {
          logger.info('Restoring OSM Data state:', sceneState.osmDataEnabled);

          // Use the event bus to toggle OSM Data
          if (window.mapEventBus) {
            window.mapEventBus.emit('osmGraph:visibility', {
              visible: sceneState.osmDataEnabled
            });
          }
        }

        // Log key states after restoration
        logger.info('Key states after restoration:');
        const newStates = window.layerStateManager.getAllLayerStates();
        logger.info('- showBostonBuildings:', newStates.showBostonBuildings);
        logger.info('- showOSMPOIs:', newStates.showOSMPOIs);
        logger.info('- showPOIMarkers:', newStates.showPOIMarkers);
        logger.info('- show3DBuildings:', newStates.show3DBuildings);
        logger.info('- showParks:', newStates.showParks);

        // Notify components of state restoration
        if (window.mapEventBus) {
          logger.info('Emitting sceneRestored event');
          window.mapEventBus.emit('sceneRestored', sceneState);
        }

        return true;
      }

      // Fallback to the old method
      logger.warn('layerStateManager not available, using fallback method');

      // Ensure we have valid state objects
      const {
        poiStates = {},
        buildingStates = {},
        layerStates = {},
        styleStates = {},
        layerToggleStates = {}
      } = sceneState.toggleStates || sceneState;

      logger.info('Restoring scene with layer states:', layerToggleStates);

      // Step 1: Open POI Graph if it was open
      if (window.poiGraphManager) {
        logger.info('Setting POI Graph state:', poiStates.graphOpen);
        if (poiStates.graphOpen) {
          window.poiGraphManager.openGraph();

          // Wait for graph to open before handling OSM data
          setTimeout(() => {
            // Step 2: Enable OSM Data if it was enabled
            if (window.poiDataManager) {
              logger.info('Setting OSM Data state:', poiStates.osmDataEnabled);
              if (poiStates.osmDataEnabled) {
                window.poiDataManager.enableOSMData();
              } else {
                // Use toggleOSMData(false) instead of disableOSMData
                window.poiDataManager.toggleOSMData(false);
              }

              // Wait a bit to ensure OSM data is loaded before setting categories
              setTimeout(() => {
                // Restore visible categories if any
                if (Array.isArray(poiStates.visibleCategories)) {
                  logger.info('Restoring visible categories:', poiStates.visibleCategories);
                  window.poiDataManager.setVisibleCategories(poiStates.visibleCategories);
                }

                // Set POI markers visibility
                if (typeof poiStates.showPOIMarkers === 'boolean') {
                  logger.info('Setting POI markers visibility:', poiStates.showPOIMarkers);
                  window.poiDataManager.setMarkersVisibility(poiStates.showPOIMarkers);
                }
              }, 300);
            }
          }, 300);
        }
      }

      // Step 3: After a delay to let POI data initialize, restore remaining states
      setTimeout(() => {
        // Restore building states
        if (buildingStates) {
          if (map.getLayer('3d-buildings')) {
            map.setLayoutProperty(
              '3d-buildings',
              'visibility',
              buildingStates.show3DBuildings ? 'visible' : 'none'
            );
          }

          if (map.getLayer('boston-buildings')) {
            map.setLayoutProperty(
              'boston-buildings',
              'visibility',
              buildingStates.showBostonBuildings ? 'visible' : 'none'
            );
          }

          // Restore Boston Buildings specific layers
          const bostonBuildingLayers = [
            'boston-buildings-fill',
            'boston-buildings-outline',
            'boston-buildings-labels'
          ];

          bostonBuildingLayers.forEach(layerId => {
            if (map.getLayer(layerId) && buildingStates[layerId] !== undefined) {
              logger.info(`Restoring ${layerId} visibility to: ${buildingStates[layerId] ? 'visible' : 'none'}`);
              map.setLayoutProperty(
                layerId,
                'visibility',
                buildingStates[layerId] ? 'visible' : 'none'
              );
            }
          });

          // If we have a global Boston Buildings state but no specific layer states,
          // apply the global state to all Boston Buildings layers
          if (buildingStates.showBostonBuildings !== undefined) {
            bostonBuildingLayers.forEach(layerId => {
              if (map.getLayer(layerId) && buildingStates[layerId] === undefined) {
                logger.info(`Applying global Boston Buildings state to ${layerId}: ${buildingStates.showBostonBuildings ? 'visible' : 'none'}`);
                map.setLayoutProperty(
                  layerId,
                  'visibility',
                  buildingStates.showBostonBuildings ? 'visible' : 'none'
                );
              }
            });
          }
        }

        // Restore other layer states
        if (layerStates && typeof layerStates === 'object') {
          Object.entries(layerStates).forEach(([layerId, isVisible]) => {
            if (map.getLayer(layerId)) {
              map.setLayoutProperty(
                layerId,
                'visibility',
                isVisible ? 'visible' : 'none'
              );
            }
          });
        }

        // Restore style states
        if (styleStates && window.styleManager) {
          if (styleStates.theme) window.styleManager.setTheme(styleStates.theme);
          if (styleStates.customColors) window.styleManager.setCustomColors(styleStates.customColors);
          if (styleStates.effects) window.styleManager.setEffects(styleStates.effects);
        }

        // Restore LayerToggle states if available
        if (Object.keys(layerToggleStates).length > 0) {
          logger.info('Restoring LayerToggle states:', layerToggleStates);

          // If we have a layerToggleManager, use it to restore states
          if (window.layerToggleManager) {
            logger.info('SceneManager: Using layerToggleManager to restore states');
            logger.info('SceneManager: Boston Buildings state before:', window.layerToggleManager.getAllToggleStates().showBostonBuildings);
            window.layerToggleManager.setAllToggleStates(layerToggleStates);
            logger.info('SceneManager: Boston Buildings state after:', window.layerToggleManager.getAllToggleStates().showBostonBuildings);
          } else {
            // Otherwise, try to restore individual states
            // Boston Buildings
            if (layerToggleStates.showBostonBuildings !== undefined && window.setBostonBuildingsVisible) {
              logger.info(`Setting Boston Buildings visibility to: ${layerToggleStates.showBostonBuildings}`);
              window.setBostonBuildingsVisible(layerToggleStates.showBostonBuildings);

              // Force update the state in the parent component
              if (window.forceUpdateBostonBuildings) {
                logger.info('Forcing update of Boston Buildings layer');
                window.forceUpdateBostonBuildings(layerToggleStates.showBostonBuildings);
              }
            }

            // 3D Buildings
            if (layerToggleStates.show3DBuildings !== undefined && window.set3DBuildingsVisible) {
              logger.info(`Setting 3D Buildings visibility to: ${layerToggleStates.show3DBuildings}`);
              window.set3DBuildingsVisible(layerToggleStates.show3DBuildings);
            }

            // POI Markers
            if (layerToggleStates.showPOIMarkers !== undefined && window.setPOIMarkersVisible) {
              logger.info(`Setting POI Markers visibility to: ${layerToggleStates.showPOIMarkers}`);
              window.setPOIMarkersVisible(layerToggleStates.showPOIMarkers);
            }

            // OSM POIs
            if (layerToggleStates.showOSMPOIs !== undefined && window.setOSMPOIsVisible) {
              logger.info(`Setting OSM POIs visibility to: ${layerToggleStates.showOSMPOIs}`);
              window.setOSMPOIsVisible(layerToggleStates.showOSMPOIs);
            }

            // Parks
            if (layerToggleStates.showParks !== undefined && window.setParksVisible) {
              logger.info(`Setting Parks visibility to: ${layerToggleStates.showParks}`);
              window.setParksVisible(layerToggleStates.showParks);
            }

            // Roads
            if (layerToggleStates.showRoads !== undefined && window.setRoadsVisible) {
              logger.info(`Setting Roads visibility to: ${layerToggleStates.showRoads}`);
              window.setRoadsVisible(layerToggleStates.showRoads);
            }
          }
        }

        // Notify components of state restoration
        if (window.mapEventBus) {
          window.mapEventBus.emit('sceneRestored', sceneState);
        }
      }, 800); // Increased delay to ensure POI states are fully restored

      return true;
    } catch (error) {
      logger.error('Error restoring scene state:', error);
      return false;
    }
  }, [map]);

  // Add event listener to track map movement
  useEffect(() => {
    if (!map) return;

    // Function to update camera state
    const updateCameraState = () => {
      // Skip updates if we're programmatically changing the camera
      if (isChangingCamera.current) return;

      try {
        const newCamera = {
          center: map.getCenter(),
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing()
        };
        setCurrentCamera(newCamera);
      } catch (error) {
        console.warn('Error updating camera state:', error);
      }
    };

    // Add event listeners for map movement
    map.on('moveend', updateCameraState);
    map.on('zoomend', updateCameraState);
    map.on('pitchend', updateCameraState);
    map.on('rotateend', updateCameraState);

    // Initialize camera state
    updateCameraState();

    // Clean up event listeners
    return () => {
      map.off('moveend', updateCameraState);
      map.off('zoomend', updateCameraState);
      map.off('pitchend', updateCameraState);
      map.off('rotateend', updateCameraState);
    };
  }, [map]);

  // Expose SceneManager methods globally via window.mapComponent
  useEffect(() => {
    logger.info('Exposing SceneManager methods globally');

    if (!window.mapComponent) {
      window.mapComponent = {};
    }

    // Expose a method to load a scene by directly providing the scene object
    window.mapComponent.loadScene = (scene) => {
      logger.info('Loading scene via global loadScene method:', scene.name);
      logger.debug('Roads visible in scene:', scene.toggleStates && scene.toggleStates.showRoads);

      try {
        // Call the restoreLayerStates function
        restoreLayerStates(scene);

        // Update camera position if available
        if (map && scene.camera) {
          logger.debug('Updating camera position via global loadScene method');
          // Set flag to prevent camera state updates during programmatic changes
          isChangingCamera.current = true;

          map.easeTo({
            center: [scene.camera.center.lng, scene.camera.center.lat],
            zoom: scene.camera.zoom,
            pitch: scene.camera.pitch,
            bearing: scene.camera.bearing,
            duration: 1500
          });

          // Reset flag after animation completes
          setTimeout(() => {
            isChangingCamera.current = false;

            // Update current camera state after animation
            setCurrentCamera({
              center: map.getCenter(),
              zoom: map.getZoom(),
              pitch: map.getPitch(),
              bearing: map.getBearing()
            });
          }, 1600);
        }

        logger.info('Scene loaded successfully via global method');
        return true;
      } catch (error) {
        logger.error('Error loading scene via global method:', error);
        return false;
      }
    };

    // Expose a method to find and load a scene by name
    window.mapComponent.loadSceneByName = (sceneName) => {
      logger.info('Looking for scene by name:', sceneName);

      try {
        // First try exact match (case-sensitive)
        let targetScene = scenes.find(s => s.name === sceneName);

        if (targetScene) {
          logger.info('Found scene with exact name match:', targetScene.name);
          return window.mapComponent.loadScene(targetScene);
        }

        // Then try case-insensitive exact match
        targetScene = scenes.find(s =>
          s.name.toLowerCase() === sceneName.toLowerCase()
        );

        if (targetScene) {
          logger.info('Found scene with case-insensitive exact match:', targetScene.name);
          return window.mapComponent.loadScene(targetScene);
        }

        // Check if we're looking for a relative scene (next, previous)
        if (sceneName.toLowerCase() === 'next' || sceneName.toLowerCase() === 'prev' || sceneName.toLowerCase() === 'previous') {
          // We need to know what scene is currently loaded to find next/previous
          // For this example, we'll assume 'v1' is loaded if we can't determine current scene
          let currentSceneName = 'v1'; // Default assumption

          // Get scene names and find current index
          const sceneNames = scenes.map(s => s.name);
          logger.info('Available scenes:', sceneNames);

          const currentIndex = sceneNames.findIndex(name =>
            name.toLowerCase() === currentSceneName.toLowerCase()
          );

          if (currentIndex !== -1) {
            // Calculate target index
            let targetIndex;
            if (sceneName.toLowerCase() === 'next') {
              targetIndex = (currentIndex + 1) % scenes.length; // Wrap around to first scene if at the end
            } else {
              // Previous scene, handle wrapping to the end
              targetIndex = currentIndex > 0 ? currentIndex - 1 : scenes.length - 1;
            }

            logger.debug(`Moving from scene at index ${currentIndex} to index ${targetIndex}`);
            targetScene = scenes[targetIndex];
            if (targetScene) {
              logger.info(`Found relative ${sceneName} scene:`, targetScene.name);
              return window.mapComponent.loadScene(targetScene);
            }
          }
        }

        // If no exact match, try substring match
        targetScene = scenes.find(s =>
          s.name.toLowerCase().includes(sceneName.toLowerCase())
        );

        if (targetScene) {
          logger.info('Found scene with substring match:', targetScene.name);
          return window.mapComponent.loadScene(targetScene);
        }

        // If sceneName is a number, try to load scene by index
        const sceneIndex = parseInt(sceneName);
        if (!isNaN(sceneIndex) && sceneIndex >= 0 && sceneIndex < scenes.length) {
          targetScene = scenes[sceneIndex];
          logger.info('Found scene by index:', targetScene.name);
          return window.mapComponent.loadScene(targetScene);
        }

        // Special case for specific transitions we know about
        if (sceneName.toLowerCase() === 'solarpotential' ||
            sceneName.toLowerCase() === 'solar' ||
            sceneName.toLowerCase() === 'v2') {
          // Try looking for any scene with solar/energy in the name as fallback
          targetScene = scenes.find(s =>
            s.name.toLowerCase().includes('solar') ||
            s.name.toLowerCase().includes('energy') ||
            s.name.toLowerCase().includes('v2')
          );

          if (targetScene) {
            logger.info('Found solar/energy scene as fallback:', targetScene.name);
            return window.mapComponent.loadScene(targetScene);
          }

          // If we're currently on v1, try to find v2 or v3
          const v1Index = scenes.findIndex(s => s.name.toLowerCase() === 'v1');
          if (v1Index !== -1 && v1Index + 1 < scenes.length) {
            targetScene = scenes[v1Index + 1];
            logger.info('Found next scene after v1:', targetScene.name);
            return window.mapComponent.loadScene(targetScene);
          }
        }

        // We couldn't find any matching scene
        logger.warn('No scene found matching criteria:', sceneName);
        return false;
      } catch (error) {
        logger.error('Error loading scene by name:', error);
        return false;
      }
    };

    return () => {
      // Keep the methods when unmounting to allow other components to use them
      logger.info('SceneManager unmounting, but keeping global methods');
    };
  }, [map, scenes, restoreLayerStates]); // Re-attach when map, scenes, or restoreLayerStates change

  const handleSaveScene = (e) => {
    e.preventDefault();

    if (!sceneName.trim()) {
      logger.warn('Scene name is required');
      return;
    }

    try {
      // Add prominent console logs that will be visible in the browser console
      console.log('%c=== SAVING SCENE ===', 'background: #4285f4; color: white; font-size: 16px; padding: 5px 10px; border-radius: 5px;');
      console.log('%cScene Name:', 'font-weight: bold; color: #4285f4;', sceneName);

      logger.info('\n=== Saving New Scene ===');
      logger.info('Scene Name:', sceneName);

      // Log the current state of the map layers
      logger.info('Current map style:', map.getStyle().name);

      // Log the state of key layers
      try {
        const layerStates = window.layerStateManager ? window.layerStateManager.getAllLayerStates() : {};
        logger.info('Current layer states from manager:', {
          showBostonBuildings: layerStates.showBostonBuildings,
          show3DBuildings: layerStates.show3DBuildings,
          showParks: layerStates.showParks,
          showPOIMarkers: layerStates.showPOIMarkers,
          showOSMPOIs: layerStates.showOSMPOIs
        });

        // Check actual layer visibility in the map
        const availableLayers = map.getStyle().layers.map(layer => layer.id);
        logger.info('Available layers count:', availableLayers.length);

        // Check 3D Buildings layers
        const buildingLayers = ['3d-buildings', 'buildings-3d-layer', 'osm-buildings-3d', 'harbor-buildings-3d'];
        const visibleBuildingLayers = buildingLayers.filter(id => {
          try {
            return map.getLayer(id) && map.getLayoutProperty(id, 'visibility') !== 'none';
          } catch (e) {
            return false;
          }
        });
        logger.info('Visible 3D building layers:', visibleBuildingLayers);

        // Check Park layers
        const parkLayers = [
          'park',
          'park-label',
          'national-park',
          'golf-course',
          'pitch',
          'grass',
          'landuse',
          'natural'
        ];
        const visibleParkLayers = parkLayers.filter(id => {
          try {
            return map.getLayer(id) && map.getLayoutProperty(id, 'visibility') !== 'none';
          } catch (e) {
            return false;
          }
        });
        logger.info('Visible park layers:', visibleParkLayers);
      } catch (error) {
        logger.warn('Error checking layer visibility:', error);
      }

      // Capture current layer states
      const sceneState = captureLayerStates();

      if (!sceneState) {
        logger.error('Failed to capture layer states');
        console.error('Failed to capture layer states');
        return;
      }

      // Check if Parks are visible in the map directly
      // Use a more comprehensive list of park layers
      const parkLayers = [
        'national-park',
        'landuse',
        'park',
        'park-label',
        'golf-course',
        'pitch',
        'grass',
        'landuse_overlay',
        'natural',
        'natural-line',
        'natural-point-label',
        'land-structure-polygon',
        'land-structure-line',
        'waterway',
        'waterway-label'
      ];

      // Check if any park layers are visible
      let directParksVisible = false;
      let visibleLayers = [];

      for (const layerId of parkLayers) {
        try {
          if (map.getLayer(layerId)) {
            const visibility = map.getLayoutProperty(layerId, 'visibility');
            if (visibility !== 'none') {
              directParksVisible = true;
              visibleLayers.push(layerId);
              console.log(`%cDirect check: Park layer ${layerId} is VISIBLE`, 'color: green; font-weight: bold');
            } else {
              console.log(`Park layer ${layerId} exists but is HIDDEN`);
            }
          }
        } catch (error) {
          // Ignore errors for layers that don't exist
        }
      }

      console.log('%cVisible park layers:', 'font-weight: bold', visibleLayers);

      // Force the Parks state to match the actual visibility
      if (directParksVisible) {
        console.log('%cParks are visible on the map!', 'background: red; color: white; font-size: 16px; padding: 5px;');

        // Always force the Parks state to true if Parks are visible
        sceneState.showParks = true;

        // Also update the layer state manager directly
        if (window.layerStateManager) {
          console.log('%cUpdating layerStateManager with Parks=true', 'background: red; color: white;');
          window.layerStateManager.updateLayerState('showParks', true);
        }
      } else {
        console.log('%cNo park layers are visible on the map', 'color: red;');
      }

      // Check for OSM POIs visibility
      let osmPOIsVisible = false;
      try {
        // First check if the OSM POIs toggle is checked in the UI
        const osmPOIsToggle = document.querySelector('.osm-poi-marker');
        if (osmPOIsToggle) {
          osmPOIsVisible = true;
          console.log('%cOSM POI markers found in the DOM!', 'background: purple; color: white; font-size: 16px; padding: 5px;');
        }

        // Also check if the OSM POI layer is visible in the map
        try {
          if (map.getLayer('osm-poi-layer') && map.getLayoutProperty('osm-poi-layer', 'visibility') !== 'none') {
            osmPOIsVisible = true;
            console.log('%cOSM POI layer is visible in the map!', 'background: purple; color: white; font-size: 16px; padding: 5px;');
          }
        } catch (error) {
          // Ignore errors for layers that don't exist
        }

        // Also check the layer state manager
        if (window.layerStateManager) {
          const osmPOIsState = window.layerStateManager.getAllLayerStates().showOSMPOIs;
          if (osmPOIsState) {
            osmPOIsVisible = true;
            console.log('%cOSM POIs state is true in layerStateManager', 'background: purple; color: white;');
          }
        }

        // Also check the UI toggle directly
        const osmPOIsCheckbox = document.querySelector('input[type="checkbox"][aria-label="Toggle OSM POIs"]');
        if (osmPOIsCheckbox && osmPOIsCheckbox.checked) {
          osmPOIsVisible = true;
          console.log('%cOSM POIs checkbox is checked in the UI', 'background: purple; color: white;');
        }

        // Force the OSM POIs state to match the actual visibility
        if (osmPOIsVisible) {
          console.log('%cOSM POIs are visible on the map!', 'background: purple; color: white; font-size: 16px; padding: 5px;');

          // Always force the OSM POIs state to true if they are visible
          sceneState.showOSMPOIs = true;

          // Also update the layer state manager directly
          if (window.layerStateManager) {
            console.log('%cUpdating layerStateManager with OSM POIs=true', 'background: purple; color: white;');
            window.layerStateManager.updateLayerState('showOSMPOIs', true);
          }
        } else {
          console.log('%cNo OSM POI markers found on the map', 'color: purple;');
        }
      } catch (error) {
        logger.warn('Error checking OSM POIs visibility:', error);
      }

      // Log the captured state in a prominent way
      console.log('%cCaptured Layer States:', 'font-weight: bold; color: #4285f4;', {
        showBostonBuildings: sceneState.showBostonBuildings,
        show3DBuildings: sceneState.show3DBuildings,
        showParks: sceneState.showParks,
        showPOIMarkers: sceneState.showPOIMarkers,
        showOSMPOIs: sceneState.showOSMPOIs
      });

      // Check if the layer state manager has the same values
      if (window.layerStateManager) {
        const managerStates = window.layerStateManager.getAllLayerStates();
        console.log('%cLayer State Manager States:', 'font-weight: bold; color: #0f9d58;', {
          showBostonBuildings: managerStates.showBostonBuildings,
          show3DBuildings: managerStates.show3DBuildings,
          showParks: managerStates.showParks,
          showPOIMarkers: managerStates.showPOIMarkers,
          showOSMPOIs: managerStates.showOSMPOIs
        });

        // Check for any mismatches
        const mismatches = [];
        if (sceneState.showBostonBuildings !== managerStates.showBostonBuildings) mismatches.push('showBostonBuildings');
        if (sceneState.show3DBuildings !== managerStates.show3DBuildings) mismatches.push('show3DBuildings');
        if (sceneState.showParks !== managerStates.showParks) mismatches.push('showParks');
        if (sceneState.showPOIMarkers !== managerStates.showPOIMarkers) mismatches.push('showPOIMarkers');
        if (sceneState.showOSMPOIs !== managerStates.showOSMPOIs) mismatches.push('showOSMPOIs');

        if (mismatches.length > 0) {
          console.warn('%cState Mismatches Detected:', 'font-weight: bold; color: #db4437;', mismatches);
        } else {
          console.log('%cAll states match between captured state and layer manager', 'color: #0f9d58;');
        }
      }

      // Log all toggle states for debugging
      logger.info('Layer states being saved:');

      // Log critical layer states specifically
      logger.info('Critical layer states:');
      logger.info('- showBostonBuildings:', sceneState.showBostonBuildings);
      logger.info('- show3DBuildings:', sceneState.show3DBuildings);
      logger.info('- showPOIMarkers:', sceneState.showPOIMarkers);
      logger.info('- showOSMPOIs:', sceneState.showOSMPOIs);
      logger.info('- showParks:', sceneState.showParks);

      // Capture POI Graph states
      logger.info('POI Graph states:');
      logger.info('- poiGraphOpen:', sceneState.poiGraphOpen);
      logger.info('- poiGraphShowOSM:', sceneState.poiGraphShowOSM);
      logger.info('- poiGraphShowCurve:', sceneState.poiGraphShowCurve);
      logger.info('- poiGraphShowRadius:', sceneState.poiGraphShowRadius);

      // Check if POI Graph is currently open and capture its state
      try {
        // Check if the POI Graph component is visible in the DOM
        const poiGraphElement = document.querySelector('.poi-graph-container');
        if (poiGraphElement) {
          console.log('%cPOI Graph is open in the DOM', 'background: #4caf50; color: white;');
          sceneState.poiGraphOpen = true;

          // Try to get the POI Graph states from the layer state manager
          if (window.layerStateManager) {
            const layerStates = window.layerStateManager.getAllLayerStates();
            sceneState.poiGraphShowOSM = layerStates.poiGraphShowOSM || false;
            sceneState.poiGraphShowCurve = layerStates.poiGraphShowCurve || false;
            sceneState.poiGraphShowRadius = layerStates.poiGraphShowRadius || false;
            sceneState.poiVisibleCategories = layerStates.poiVisibleCategories || {};

            console.log('%cCaptured POI Graph states from layerStateManager:', 'background: #4caf50; color: white;', {
              poiGraphShowOSM: sceneState.poiGraphShowOSM,
              poiGraphShowCurve: sceneState.poiGraphShowCurve,
              poiGraphShowRadius: sceneState.poiGraphShowRadius,
              poiVisibleCategories: sceneState.poiVisibleCategories
            });
          }
        } else {
          console.log('%cPOI Graph is not open in the DOM', 'color: #4caf50;');
          sceneState.poiGraphOpen = false;
        }
      } catch (error) {
        logger.warn('Error checking POI Graph visibility:', error);
      }

      // Verify the states match what's in the UI
      logger.info('Verifying layer states match UI:');

      // Get all available layers in the map
      try {
        const availableLayers = map.getStyle().layers.map(layer => layer.id);
        logger.info('Available layers for verification:', availableLayers.length);

        // Safe layer visibility check function
        const safeIsLayerVisible = (layerId) => {
          try {
            // Check if layer exists first
            if (!availableLayers.includes(layerId)) {
              logger.warn(`Layer ${layerId} not found in map, skipping visibility check`);
              return false;
            }
            return map.getLayoutProperty(layerId, 'visibility') !== 'none';
          } catch (error) {
            logger.warn(`Error checking visibility for layer ${layerId}:`, error);
            return false;
          }
        };

        // Verify Boston Buildings state
        const bostonBuildingLayers = ['boston-buildings-fill', 'boston-buildings-outline', 'boston-buildings-labels'];
        const hasBostonBuildingLayers = bostonBuildingLayers.some(layerId => availableLayers.includes(layerId));
        const bostonBuildingsLayerVisible = hasBostonBuildingLayers &&
          bostonBuildingLayers.some(layerId => safeIsLayerVisible(layerId));
        logger.info(`Boston Buildings layer visible in map: ${bostonBuildingsLayerVisible}`);
        logger.info(`Boston Buildings state in scene: ${sceneState.showBostonBuildings}`);

        // Verify 3D Buildings state
        const has3DBuildings = availableLayers.includes('3d-buildings');
        const buildings3DLayerVisible = has3DBuildings && safeIsLayerVisible('3d-buildings');
        logger.info(`3D Buildings layer visible in map: ${buildings3DLayerVisible}`);
        logger.info(`3D Buildings state in scene: ${sceneState.show3DBuildings}`);

        // Verify POI Markers state
        const poiLayers = availableLayers.filter(layerId =>
          layerId.includes('poi') || layerId.includes('label'));
        const hasPOILayers = poiLayers.length > 0;
        const poiMarkersLayerVisible = hasPOILayers &&
          poiLayers.some(layerId => safeIsLayerVisible(layerId));
        logger.info(`POI Markers layer visible in map: ${poiMarkersLayerVisible}`);
        logger.info(`POI Markers state in scene: ${sceneState.showPOIMarkers}`);
      } catch (error) {
        logger.warn('Error verifying layer states:', error);
      }

      // Log all states for debugging
      logger.debug('All layer states:');
      Object.entries(sceneState).forEach(([key, value]) => {
        if (!key.startsWith('_')) { // Skip internal properties
          logger.debug(`  ${key}:`, value);
        }
      });

      // Use the tracked camera state instead of getting it directly from the map
      // This ensures we have the most accurate position even if the map is in transition
      let cameraState = { ...currentCamera };
      console.log('Using tracked camera state:', cameraState);

      // Validate camera state to ensure it's complete
      if (!cameraState.center || !cameraState.center.lng || !cameraState.center.lat) {
        logger.warn('Invalid camera center, using default');
        cameraState.center = { lng: -71.06, lat: 42.36 }; // Default to Boston
      }

      if (typeof cameraState.zoom !== 'number') {
        logger.warn('Invalid camera zoom, using default');
        cameraState.zoom = 14;
      }

      if (typeof cameraState.pitch !== 'number') {
        logger.warn('Invalid camera pitch, using default');
        cameraState.pitch = 0;
      }

      if (typeof cameraState.bearing !== 'number') {
        logger.warn('Invalid camera bearing, using default');
        cameraState.bearing = 0;
      }

      const newScene = {
        id: Date.now(),
        name: sceneName,
        timestamp: new Date().toISOString(),
        toggleStates: sceneState,
        camera: cameraState
      };

      logger.debug('Full Scene Data:', newScene);

      const updatedScenes = [...scenes, newScene];
      setScenes(updatedScenes);
      localStorage.setItem('mapScenes', JSON.stringify(updatedScenes));
      setSceneName('');
      logger.info('Scene saved successfully');
    } catch (error) {
      logger.error('Error saving scene:', error);
    }
  };

  const handleSceneClick = (scene) => {
    logger.info(`Scene clicked: ${scene.name}`);

    // Add prominent console logs that will be visible in the browser console
    console.log('%c=== LOADING SCENE ===', 'background: #0f9d58; color: white; font-size: 16px; padding: 5px 10px; border-radius: 5px;');
    console.log('%cScene Name:', 'font-weight: bold; color: #0f9d58;', scene.name);

    // Log the scene state that will be loaded
    const stateToRestore = scene.toggleStates || scene;

    // Create a new function to handle Parks visibility
    const handleParksVisibility = (visible) => {
      console.log(`%c[NEW HANDLER] Setting Parks to ${visible ? 'VISIBLE' : 'HIDDEN'}`, 'background: purple; color: white; font-size: 16px; padding: 5px;');

      // Update the UI toggle
      if (window.setParksVisible) {
        console.log(`%c[NEW HANDLER] Calling setParksVisible(${visible})`, 'background: purple; color: white;');
        window.setParksVisible(visible);
      }

      // Update the layer state manager
      if (window.layerStateManager) {
        console.log(`%c[NEW HANDLER] Updating layerStateManager with Parks=${visible}`, 'background: purple; color: white;');
        window.layerStateManager.updateLayerState('showParks', visible);
      }

      // Update the map layers directly
      if (map && map.getStyle) {
        const parkLayers = ['national-park', 'landuse'];
        parkLayers.forEach(layerId => {
          try {
            if (map.getLayer(layerId)) {
              console.log(`%c[NEW HANDLER] Setting ${layerId} to ${visible ? 'visible' : 'none'}`, 'background: purple; color: white;');
              map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
            }
          } catch (error) {
            console.warn(`[NEW HANDLER] Error setting visibility for ${layerId}:`, error);
          }
        });
      }
    };

    console.log('%cScene State to Restore:', 'font-weight: bold; color: #0f9d58; background: yellow; padding: 5px;', {
      showBostonBuildings: stateToRestore.showBostonBuildings,
      show3DBuildings: stateToRestore.show3DBuildings,
      showParks: stateToRestore.showParks,
      showPOIMarkers: stateToRestore.showPOIMarkers,
      showOSMPOIs: stateToRestore.showOSMPOIs
    });

    // Apply the Parks state from the scene
    if (stateToRestore.showParks !== undefined) {
      handleParksVisibility(stateToRestore.showParks);
    }

    // Apply the OSM POIs state from the scene
    if (stateToRestore.showOSMPOIs !== undefined && window.setOSMPOIsVisible) {
      console.log(`%c[SCENE CLICK] Setting OSM POIs to ${stateToRestore.showOSMPOIs ? 'visible' : 'hidden'}`, 'background: purple; color: white; font-size: 16px; padding: 5px;');
      window.setOSMPOIsVisible(stateToRestore.showOSMPOIs);
    }

    // Apply the Boston Buildings state from the scene
    if (stateToRestore.showBostonBuildings !== undefined) {
      console.log(`[SCENE] Setting Boston Buildings to ${stateToRestore.showBostonBuildings ? 'visible' : 'hidden'}`);

      // Try all available methods to update the layer visibility

      // Method 1: Use the direct toggle function from BostonBuildingsLayer
      if (window.toggleBostonBuildingsDirectly) {
        console.log(`[SCENE] Using toggleBostonBuildingsDirectly(${stateToRestore.showBostonBuildings})`);
        window.toggleBostonBuildingsDirectly(stateToRestore.showBostonBuildings);
      }
      // Method 2: Use the force update function
      else if (window.forceUpdateBostonBuildings) {
        console.log(`[SCENE] Using forceUpdateBostonBuildings(${stateToRestore.showBostonBuildings})`);
        window.forceUpdateBostonBuildings(stateToRestore.showBostonBuildings);
      }
      // Method 3: Use the global setter function
      else if (window.setBostonBuildingsVisible) {
        console.log(`[SCENE] Using setBostonBuildingsVisible(${stateToRestore.showBostonBuildings})`);
        window.setBostonBuildingsVisible(stateToRestore.showBostonBuildings);
      }
      // Method 4: Direct layer manipulation
      else if (map) {
        console.log(`[SCENE] Using direct layer manipulation`);
        const bostonBuildingLayers = ['boston-buildings-fill', 'boston-buildings-outline'];
        bostonBuildingLayers.forEach(layerId => {
          try {
            if (map.getLayer(layerId)) {
              console.log(`[SCENE] Setting ${layerId} to ${stateToRestore.showBostonBuildings ? 'visible' : 'none'}`);
              map.setLayoutProperty(layerId, 'visibility', stateToRestore.showBostonBuildings ? 'visible' : 'none');
            }
          } catch (error) {
            console.warn(`Error setting visibility for ${layerId}:`, error);
          }
        });
      }

      // Check the layer status after update
      setTimeout(() => {
        if (window.checkBostonBuildingsLayer) {
          console.log('[SCENE] Checking layer status after update:');
          window.checkBostonBuildingsLayer();
        }
      }, 500);
    }

    // Emit an event that we're loading a scene to throttle animations
    if (window.mapEventBus && typeof window.mapEventBus.emit === 'function') {
      window.mapEventBus.emit('scene:loading', { sceneName: scene.name, scene: scene });
    }

    // Check if map style is loaded
    if (map && !isMapStyleLoaded()) {
      logger.info('Map style not fully loaded yet, waiting...');

      // Wait for map style to load before restoring scene
      const checkStyleLoaded = () => {
        if (isMapStyleLoaded()) {
          logger.info('Map style now loaded, restoring scene');
          applyScene();
        } else {
          logger.debug('Map style still loading, waiting...');
          setTimeout(checkStyleLoaded, 100);
        }
      };

      setTimeout(checkStyleLoaded, 100);
      return;
    }

    // Apply the scene immediately if map style is already loaded
    applyScene();

    function applyScene() {
      try {
        logger.info('\n=== Applying Scene ===');
        logger.info('Scene Name:', scene.name);

        // Apply the Parks state from the scene
        if (scene.toggleStates?.showParks !== undefined) {
          const parksVisible = scene.toggleStates.showParks;
          console.log(`%c[APPLY SCENE] Using new handler for Parks state: ${parksVisible}`, 'background: green; color: white; font-size: 16px; padding: 5px;');
          handleParksVisibility(parksVisible);
        }

        // Apply the OSM POIs state from the scene
        if (scene.toggleStates?.showOSMPOIs !== undefined && window.setOSMPOIsVisible) {
          const osmPOIsVisible = scene.toggleStates.showOSMPOIs;
          console.log(`%c[APPLY SCENE] Setting OSM POIs to ${osmPOIsVisible ? 'visible' : 'hidden'}`, 'background: purple; color: white; font-size: 16px; padding: 5px;');
          window.setOSMPOIsVisible(osmPOIsVisible);
        }

        // Apply the Boston Buildings state from the scene
        if (scene.toggleStates?.showBostonBuildings !== undefined) {
          const bostonBuildingsVisible = scene.toggleStates.showBostonBuildings;
          console.log(`[APPLY] Setting Boston Buildings to ${bostonBuildingsVisible ? 'visible' : 'hidden'}`);

          // Try all available methods to update the layer visibility

          // Method 1: Use the direct toggle function from BostonBuildingsLayer
          if (window.toggleBostonBuildingsDirectly) {
            console.log(`[APPLY] Using toggleBostonBuildingsDirectly(${bostonBuildingsVisible})`);
            window.toggleBostonBuildingsDirectly(bostonBuildingsVisible);
          }
          // Method 2: Use the force update function
          else if (window.forceUpdateBostonBuildings) {
            console.log(`[APPLY] Using forceUpdateBostonBuildings(${bostonBuildingsVisible})`);
            window.forceUpdateBostonBuildings(bostonBuildingsVisible);
          }
          // Method 3: Use the global setter function
          else if (window.setBostonBuildingsVisible) {
            console.log(`[APPLY] Using setBostonBuildingsVisible(${bostonBuildingsVisible})`);
            window.setBostonBuildingsVisible(bostonBuildingsVisible);
          }
          // Method 4: Direct layer manipulation
          else if (map) {
            console.log(`[APPLY] Using direct layer manipulation`);
            const bostonBuildingLayers = ['boston-buildings-fill', 'boston-buildings-outline'];
            bostonBuildingLayers.forEach(layerId => {
              try {
                if (map.getLayer(layerId)) {
                  console.log(`[APPLY] Setting ${layerId} to ${bostonBuildingsVisible ? 'visible' : 'none'}`);
                  map.setLayoutProperty(layerId, 'visibility', bostonBuildingsVisible ? 'visible' : 'none');
                }
              } catch (error) {
                console.warn(`Error setting visibility for ${layerId}:`, error);
              }
            });
          }

          // Check the layer status after update
          setTimeout(() => {
            if (window.checkBostonBuildingsLayer) {
              console.log('[APPLY] Checking layer status after update:');
              window.checkBostonBuildingsLayer();
            }
          }, 500);
        }

        // Log the current state of the map layers before restoration
        logger.info('Current map style:', map.getStyle().name);

        // Log the state of key layers before restoration
        try {
          const layerStates = window.layerStateManager ? window.layerStateManager.getAllLayerStates() : {};
          logger.info('Current layer states before restoration:', {
            showBostonBuildings: layerStates.showBostonBuildings,
            show3DBuildings: layerStates.show3DBuildings,
            showParks: layerStates.showParks,
            showPOIMarkers: layerStates.showPOIMarkers,
            showOSMPOIs: layerStates.showOSMPOIs
          });

          // Check actual layer visibility in the map
          const availableLayers = map.getStyle().layers.map(layer => layer.id);
          logger.info('Available layers count:', availableLayers.length);

          // Check 3D Buildings layers
          const buildingLayers = ['3d-buildings', 'buildings-3d-layer', 'osm-buildings-3d', 'harbor-buildings-3d'];
          const visibleBuildingLayers = buildingLayers.filter(id => {
            try {
              return map.getLayer(id) && map.getLayoutProperty(id, 'visibility') !== 'none';
            } catch (e) {
              return false;
            }
          });
          logger.info('Visible 3D building layers before restoration:', visibleBuildingLayers);

          // Check Park layers
          const parkLayers = [
            'park',
            'park-label',
            'national-park',
            'golf-course',
            'pitch',
            'grass',
            'landuse',
            'natural'
          ];
          const visibleParkLayers = parkLayers.filter(id => {
            try {
              return map.getLayer(id) && map.getLayoutProperty(id, 'visibility') !== 'none';
            } catch (e) {
              return false;
            }
          });
          logger.info('Visible park layers before restoration:', visibleParkLayers);
        } catch (error) {
          logger.warn('Error checking layer visibility before restoration:', error);
        }

        // Log scene state to be restored
        logger.info('Scene state to be restored:', {
          showBostonBuildings: scene.toggleStates?.showBostonBuildings || scene.showBostonBuildings,
          show3DBuildings: scene.toggleStates?.show3DBuildings || scene.show3DBuildings,
          showParks: scene.toggleStates?.showParks || scene.showParks,
          showPOIMarkers: scene.toggleStates?.showPOIMarkers || scene.showPOIMarkers,
          showOSMPOIs: scene.toggleStates?.showOSMPOIs || scene.showOSMPOIs,

          // POI Graph states
          poiGraphOpen: scene.toggleStates?.poiGraphOpen || scene.poiGraphOpen,
          poiGraphShowOSM: scene.toggleStates?.poiGraphShowOSM || scene.poiGraphShowOSM,
          poiGraphShowCurve: scene.toggleStates?.poiGraphShowCurve || scene.poiGraphShowCurve,
          poiGraphShowRadius: scene.toggleStates?.poiGraphShowRadius || scene.poiGraphShowRadius
        });

        // Log Boston Buildings state before restoration
        logger.debug('Scene Boston Buildings state before restoration:', {
          sceneState: scene.toggleStates?.showBostonBuildings || scene.showBostonBuildings,
          currentState: window.layerStateManager
            ? window.layerStateManager.getAllLayerStates().showBostonBuildings
            : (window.layerToggleManager
                ? window.layerToggleManager.getAllToggleStates().showBostonBuildings
                : 'No state manager available')
        });

        // Determine which state object to use
        const stateToRestore = scene.toggleStates || scene;

        // Restore layer states from scene
        console.log('%cRestoring layer states...', 'font-weight: bold; color: #0f9d58;');
        const restorationResult = restoreLayerStates(stateToRestore);
        console.log('%cLayer state restoration result:', 'font-weight: bold; color: #0f9d58;', restorationResult ? 'SUCCESS' : 'FAILED');

        // Log Boston Buildings state after restoration
        logger.info('Scene Boston Buildings state after restoration:', {
          sceneState: scene.toggleStates?.showBostonBuildings || scene.showBostonBuildings,
          currentState: window.layerStateManager
            ? window.layerStateManager.getAllLayerStates().showBostonBuildings
            : (window.layerToggleManager
                ? window.layerToggleManager.getAllToggleStates().showBostonBuildings
                : 'No state manager available')
        });

        // Log the state of key layers after restoration
        try {
          const layerStates = window.layerStateManager ? window.layerStateManager.getAllLayerStates() : {};
          logger.info('Current layer states after restoration:', {
            showBostonBuildings: layerStates.showBostonBuildings,
            show3DBuildings: layerStates.show3DBuildings,
            showParks: layerStates.showParks,
            showPOIMarkers: layerStates.showPOIMarkers,
            showOSMPOIs: layerStates.showOSMPOIs
          });

          // Check actual layer visibility in the map
          const mapLayers = map.getStyle().layers;
          logger.info('Total map layers after restoration:', mapLayers.length);

          // Check 3D Buildings layers
          const buildingLayers = ['3d-buildings', 'buildings-3d-layer', 'osm-buildings-3d', 'harbor-buildings-3d'];
          const visibleBuildingLayers = buildingLayers.filter(id => {
            try {
              return map.getLayer(id) && map.getLayoutProperty(id, 'visibility') !== 'none';
            } catch (e) {
              return false;
            }
          });
          logger.info('Visible 3D building layers after restoration:', visibleBuildingLayers);

          // Log the actual visibility of each 3D building layer
          console.log('%c3D Building Layers Visibility Check:', 'font-weight: bold; color: #4285f4;');
          buildingLayers.forEach(layerId => {
            try {
              if (map.getLayer(layerId)) {
                const visibility = map.getLayoutProperty(layerId, 'visibility');
                console.log(`${layerId}: ${visibility === 'none' ? 'HIDDEN' : 'VISIBLE'}`);
              } else {
                console.log(`${layerId}: LAYER NOT FOUND`);
              }
            } catch (e) {
              console.log(`${layerId}: ERROR - ${e.message}`);
            }
          });

          // Check if 3D Buildings toggle is on in the layer state manager
          if (window.layerStateManager) {
            const buildingsState = window.layerStateManager.getAllLayerStates().show3DBuildings;
            console.log('%c3D Buildings Toggle State:', 'font-weight: bold; color: #4285f4;', buildingsState ? 'ON' : 'OFF');
          }

          // Check if the 3D Buildings functions are available
          console.log('%c3D Buildings Toggle Functions Check:', 'font-weight: bold; color: #4285f4;');
          console.log('window.toggle3DBuildings available:', typeof window.toggle3DBuildings === 'function' ? 'YES' : 'NO');
          console.log('window.set3DBuildingsVisible available:', typeof window.set3DBuildingsVisible === 'function' ? 'YES' : 'NO');

          // Check Park layers
          const parkLayers = [
            'park',
            'park-label',
            'national-park',
            'golf-course',
            'pitch',
            'grass',
            'landuse',
            'natural'
          ];
          const visibleParkLayers = parkLayers.filter(id => {
            try {
              return map.getLayer(id) && map.getLayoutProperty(id, 'visibility') !== 'none';
            } catch (e) {
              return false;
            }
          });
          logger.info('Visible park layers after restoration:', visibleParkLayers);

          // Log the actual visibility of each park layer
          console.log('%cPark Layers Visibility Check:', 'font-weight: bold; color: #db4437;');
          parkLayers.forEach(layerId => {
            try {
              if (map.getLayer(layerId)) {
                const visibility = map.getLayoutProperty(layerId, 'visibility');
                console.log(`${layerId}: ${visibility === 'none' ? 'HIDDEN' : 'VISIBLE'}`);
              } else {
                console.log(`${layerId}: LAYER NOT FOUND`);
              }
            } catch (e) {
              console.log(`${layerId}: ERROR - ${e.message}`);
            }
          });

          // Check if Parks toggle is on in the layer state manager
          if (window.layerStateManager) {
            const parksState = window.layerStateManager.getAllLayerStates().showParks;
            console.log('%cParks Toggle State:', 'font-weight: bold; color: #db4437;', parksState ? 'ON' : 'OFF');
          }

          // Check if the toggleParkLayers function is available
          console.log('%cPark Toggle Functions Check:', 'font-weight: bold; color: #db4437;');
          console.log('window.toggleParkLayers available:', typeof window.toggleParkLayers === 'function' ? 'YES' : 'NO');
          console.log('window.setParksVisible available:', typeof window.setParksVisible === 'function' ? 'YES' : 'NO');
        } catch (error) {
          logger.warn('Error checking layer visibility after restoration:', error);
        }

        // Add a final check of the layer state manager after restoration
        if (window.layerStateManager) {
          const finalStates = window.layerStateManager.getAllLayerStates();
          console.log('%cFINAL LAYER STATES AFTER RESTORATION:', 'background: #db4437; color: white; font-size: 14px; padding: 3px 8px; border-radius: 3px;', {
            showBostonBuildings: finalStates.showBostonBuildings,
            show3DBuildings: finalStates.show3DBuildings,
            showParks: finalStates.showParks,
            showPOIMarkers: finalStates.showPOIMarkers,
            showOSMPOIs: finalStates.showOSMPOIs,

            // POI Graph states
            poiGraphOpen: finalStates.poiGraphOpen,
            poiGraphShowOSM: finalStates.poiGraphShowOSM,
            poiGraphShowCurve: finalStates.poiGraphShowCurve,
            poiGraphShowRadius: finalStates.poiGraphShowRadius
          });

          // Check if the final states match what we expected
          const expectedStates = stateToRestore;
          const finalMismatches = [];
          if (finalStates.showBostonBuildings !== expectedStates.showBostonBuildings) finalMismatches.push('showBostonBuildings');
          if (finalStates.show3DBuildings !== expectedStates.show3DBuildings) finalMismatches.push('show3DBuildings');
          if (finalStates.showParks !== expectedStates.showParks) finalMismatches.push('showParks');
          if (finalStates.showPOIMarkers !== expectedStates.showPOIMarkers) finalMismatches.push('showPOIMarkers');
          if (finalStates.showOSMPOIs !== expectedStates.showOSMPOIs) finalMismatches.push('showOSMPOIs');

          // Check POI Graph states
          if (finalStates.poiGraphOpen !== expectedStates.poiGraphOpen) finalMismatches.push('poiGraphOpen');
          if (finalStates.poiGraphShowOSM !== expectedStates.poiGraphShowOSM) finalMismatches.push('poiGraphShowOSM');
          if (finalStates.poiGraphShowCurve !== expectedStates.poiGraphShowCurve) finalMismatches.push('poiGraphShowCurve');
          if (finalStates.poiGraphShowRadius !== expectedStates.poiGraphShowRadius) finalMismatches.push('poiGraphShowRadius');

          if (finalMismatches.length > 0) {
            console.warn('%cFINAL STATE MISMATCHES DETECTED:', 'background: #db4437; color: white; font-size: 14px; padding: 3px 8px; border-radius: 3px;', finalMismatches);
            console.log('Expected:', expectedStates);
            console.log('Actual:', finalStates);
          } else {
            console.log('%cAll final states match expected values', 'color: #0f9d58; font-weight: bold;');
          }
        }

        // Update camera position if available
        if (map && scene.camera) {
          logger.info('Updating camera position from scene:', scene.camera);
          try {
            // Ensure we have valid camera values
            const center = scene.camera.center &&
              typeof scene.camera.center.lng === 'number' &&
              typeof scene.camera.center.lat === 'number' ?
              [scene.camera.center.lng, scene.camera.center.lat] :
              [-71.06, 42.36]; // Default to Boston

            const zoom = typeof scene.camera.zoom === 'number' ? scene.camera.zoom : 14;
            const pitch = typeof scene.camera.pitch === 'number' ? scene.camera.pitch : 0;
            const bearing = typeof scene.camera.bearing === 'number' ? scene.camera.bearing : 0;

            logger.debug('Camera values being applied:', { center, zoom, pitch, bearing });

            // Set flag to prevent camera state updates during programmatic changes
            isChangingCamera.current = true;

            // Use flyTo instead of easeTo for more reliable camera transitions
            map.flyTo({
              center: center,
              zoom: zoom,
              pitch: pitch,
              bearing: bearing,
              duration: 1500,
              essential: true // This makes the camera movement a priority
            });

            // Reset flag after animation completes
            setTimeout(() => {
              isChangingCamera.current = false;

              // Update current camera state after animation
              setCurrentCamera({
                center: map.getCenter(),
                zoom: map.getZoom(),
                pitch: map.getPitch(),
                bearing: map.getBearing()
              });
            }, 1600);

            // Double-check that the camera position was updated
            setTimeout(() => {
              const newCenter = map.getCenter();
              const newZoom = map.getZoom();
              logger.info('Camera position after update:', {
                center: [newCenter.lng, newCenter.lat],
                zoom: newZoom,
                pitch: map.getPitch(),
                bearing: map.getBearing()
              });
            }, 1600);
          } catch (cameraError) {
            logger.warn('Could not update camera position:', cameraError);
          }
        }

        // After restoration is complete, do a final check and emit the loaded event
        setTimeout(() => {
          // Final verification of critical layer states
          logger.info('Final verification of critical layer states:');
          console.log('%c=== FINAL VERIFICATION OF MAP LAYERS ===', 'background: #db4437; color: white; font-size: 16px; padding: 5px 10px; border-radius: 5px;');

          try {
            // Get all available layers in the map
            const availableLayers = map.getStyle().layers.map(layer => layer.id);
            logger.info('Available layers for final verification:', availableLayers.length);

            // Safe layer visibility check function
            const safeIsLayerVisible = (layerId) => {
              try {
                // Check if layer exists first
                if (!availableLayers.includes(layerId)) {
                  logger.warn(`Layer ${layerId} not found in map, skipping visibility check`);
                  return false;
                }
                return map.getLayoutProperty(layerId, 'visibility') !== 'none';
              } catch (error) {
                logger.warn(`Error checking visibility for layer ${layerId}:`, error);
                return false;
              }
            };

            // Safe layer visibility update function
            const safeSetLayerVisibility = (layerId, isVisible) => {
              try {
                // Check if layer exists first
                if (!availableLayers.includes(layerId)) {
                  logger.warn(`Layer ${layerId} not found in map, skipping visibility update`);
                  return;
                }
                map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
                logger.info(`Updated ${layerId} visibility to ${isVisible ? 'visible' : 'none'}`);
              } catch (error) {
                logger.warn(`Error updating visibility for layer ${layerId}:`, error);
              }
            };

            // Verify Boston Buildings state
            const finalBostonBuildingsState = window.layerStateManager ?
              window.layerStateManager.getAllLayerStates().showBostonBuildings : null;

            // Check Boston Buildings layers
            const bostonBuildingLayers = ['boston-buildings-fill', 'boston-buildings-outline', 'boston-buildings-labels'];
            const hasBostonBuildingLayers = bostonBuildingLayers.some(layerId => availableLayers.includes(layerId));
            const bostonBuildingsLayerVisible = hasBostonBuildingLayers &&
              bostonBuildingLayers.some(layerId => safeIsLayerVisible(layerId));

            logger.info(`Final Boston Buildings state: ${finalBostonBuildingsState}`);
            logger.info(`Final Boston Buildings layer visible: ${bostonBuildingsLayerVisible}`);

            // If there's a mismatch, force update the layer visibility
            if (finalBostonBuildingsState !== null && bostonBuildingsLayerVisible !== finalBostonBuildingsState) {
              logger.warn('Mismatch detected in Boston Buildings state, forcing update');
              bostonBuildingLayers.forEach(layerId => {
                safeSetLayerVisibility(layerId, finalBostonBuildingsState);
              });
            }

            // Verify 3D Buildings state
            const final3DBuildingsState = window.layerStateManager ?
              window.layerStateManager.getAllLayerStates().show3DBuildings : null;

            // Check 3D Buildings layer
            const has3DBuildings = availableLayers.includes('3d-buildings');
            const buildings3DLayerVisible = has3DBuildings && safeIsLayerVisible('3d-buildings');

            logger.info(`Final 3D Buildings state: ${final3DBuildingsState}`);
            logger.info(`Final 3D Buildings layer visible: ${buildings3DLayerVisible}`);

            // If there's a mismatch, force update the layer visibility
            if (final3DBuildingsState !== null && buildings3DLayerVisible !== final3DBuildingsState) {
              logger.warn('Mismatch detected in 3D Buildings state, forcing update');
              safeSetLayerVisibility('3d-buildings', final3DBuildingsState);
            }

            // Verify POI Markers state
            const finalPOIMarkersState = window.layerStateManager ?
              window.layerStateManager.getAllLayerStates().showPOIMarkers : null;

            // Check POI Markers layers
            const poiLayers = availableLayers.filter(layerId =>
              layerId.includes('poi') || layerId.includes('label'));
            const hasPOILayers = poiLayers.length > 0;
            const poiMarkersLayerVisible = hasPOILayers &&
              poiLayers.some(layerId => safeIsLayerVisible(layerId));

            logger.info(`Final POI Markers state: ${finalPOIMarkersState}`);
            logger.info(`Final POI Markers layer visible: ${poiMarkersLayerVisible}`);

            // If there's a mismatch, force update the layer visibility
            if (finalPOIMarkersState !== null && poiMarkersLayerVisible !== finalPOIMarkersState) {
              logger.warn('Mismatch detected in POI Markers state, forcing update');
              poiLayers.forEach(layerId => {
                safeSetLayerVisibility(layerId, finalPOIMarkersState);
              });
            }
          } catch (error) {
            logger.warn('Error during final verification:', error);
          }

          // Final verification of Parks state using our new handler
          console.log('%c[FINAL VERIFICATION] Checking Parks state', 'background: green; color: white; font-size: 16px; padding: 5px;');

          // Check if the Parks state matches what was saved in the scene
          if (window.layerStateManager && scene.toggleStates?.showParks !== undefined) {
            const currentParksState = window.layerStateManager.getAllLayerStates().showParks;
            const savedParksState = scene.toggleStates.showParks;

            console.log(`%c[FINAL VERIFICATION] Parks state - Current: ${currentParksState}, Saved: ${savedParksState}`, 'background: green; color: white;');

            // If there's a mismatch, apply the saved state one last time using our new handler
            if (currentParksState !== savedParksState) {
              console.log(`%c[FINAL VERIFICATION] Fixing Parks state mismatch by setting to: ${savedParksState}`, 'background: green; color: white;');
              handleParksVisibility(savedParksState);
            }
          }

          // Final verification of OSM POIs state
          console.log('%c[FINAL VERIFICATION] Checking OSM POIs state', 'background: purple; color: white; font-size: 16px; padding: 5px;');

          // Check if the OSM POIs state matches what was saved in the scene
          if (window.layerStateManager && scene.toggleStates?.showOSMPOIs !== undefined) {
            const currentOSMPOIsState = window.layerStateManager.getAllLayerStates().showOSMPOIs;
            const savedOSMPOIsState = scene.toggleStates.showOSMPOIs;

            console.log(`%c[FINAL VERIFICATION] OSM POIs state - Current: ${currentOSMPOIsState}, Saved: ${savedOSMPOIsState}`, 'background: purple; color: white;');

            // If there's a mismatch, apply the saved state one last time
            if (currentOSMPOIsState !== savedOSMPOIsState && window.setOSMPOIsVisible) {
              console.log(`%c[FINAL VERIFICATION] Fixing OSM POIs state mismatch by setting to: ${savedOSMPOIsState}`, 'background: purple; color: white;');
              window.setOSMPOIsVisible(savedOSMPOIsState);
            }
          }

          // Final verification of Boston Buildings state
          console.log('[FINAL] Checking Boston Buildings state');

          // Check if the Boston Buildings state matches what was saved in the scene
          if (window.layerStateManager && scene.toggleStates?.showBostonBuildings !== undefined) {
            const currentBostonBuildingsState = window.layerStateManager.getAllLayerStates().showBostonBuildings;
            const savedBostonBuildingsState = scene.toggleStates.showBostonBuildings;

            console.log(`[FINAL] Boston Buildings state - Current: ${currentBostonBuildingsState}, Saved: ${savedBostonBuildingsState}`);

            // If there's a mismatch, apply the saved state one last time
            if (currentBostonBuildingsState !== savedBostonBuildingsState) {
              console.log(`[FINAL] Fixing Boston Buildings state mismatch by setting to: ${savedBostonBuildingsState}`);

              // Try all available methods to update the layer visibility

              // Method 1: Use the direct toggle function from BostonBuildingsLayer
              if (window.toggleBostonBuildingsDirectly) {
                console.log(`[FINAL] Using toggleBostonBuildingsDirectly(${savedBostonBuildingsState})`);
                window.toggleBostonBuildingsDirectly(savedBostonBuildingsState);
              }
              // Method 2: Use the force update function
              else if (window.forceUpdateBostonBuildings) {
                console.log(`[FINAL] Using forceUpdateBostonBuildings(${savedBostonBuildingsState})`);
                window.forceUpdateBostonBuildings(savedBostonBuildingsState);
              }
              // Method 3: Use the global setter function
              else if (window.setBostonBuildingsVisible) {
                console.log(`[FINAL] Using setBostonBuildingsVisible(${savedBostonBuildingsState})`);
                window.setBostonBuildingsVisible(savedBostonBuildingsState);
              }
              // Method 4: Direct layer manipulation
              else if (map) {
                console.log(`[FINAL] Using direct layer manipulation`);
                const bostonBuildingLayers = ['boston-buildings-fill', 'boston-buildings-outline'];
                bostonBuildingLayers.forEach(layerId => {
                  try {
                    if (map.getLayer(layerId)) {
                      console.log(`[FINAL] Setting ${layerId} to ${savedBostonBuildingsState ? 'visible' : 'none'}`);
                      map.setLayoutProperty(layerId, 'visibility', savedBostonBuildingsState ? 'visible' : 'none');
                    }
                  } catch (error) {
                    console.warn(`Error setting visibility for ${layerId}:`, error);
                  }
                });
              }
            }

            // Check the layer status after update
            setTimeout(() => {
              if (window.checkBostonBuildingsLayer) {
                console.log('[FINAL] Checking layer status after update:');
                window.checkBostonBuildingsLayer();
              }
            }, 500);
          }

          // Emit the loaded event
          if (window.mapEventBus && typeof window.mapEventBus.emit === 'function') {
            logger.info('Emitting scene:loaded event');
            window.mapEventBus.emit('scene:loaded', { sceneName: scene.name });

            // Also emit scene:applied event with the scene data for POI Graph to respond to
            logger.info('Emitting scene:applied event');
            window.mapEventBus.emit('scene:applied', {
              sceneName: scene.name,
              scene: scene
            });

            // Check if POI Graph should be opened based on scene state
            if (scene.toggleStates?.poiGraphOpen) {
              console.log('%c[SCENE] POI Graph should be open in this scene', 'background: #4caf50; color: white;');

              // Try to find and click the POI Graph toggle button if it exists
              setTimeout(() => {
                try {
                  const poiGraphToggleButton = document.querySelector('button[title="Show POI Stats"]');
                  if (poiGraphToggleButton && !document.querySelector('.poi-graph-container')) {
                    console.log('%c[SCENE] Clicking POI Graph toggle button', 'background: #4caf50; color: white;');
                    poiGraphToggleButton.click();
                  }
                } catch (error) {
                  console.error('Error opening POI Graph:', error);
                }
              }, 500);
            }
          }
        }, 1000);

        // Close the panel
        if (onClose) {
          onClose();
        }
      } catch (error) {
        logger.error('Error applying scene:', error);
        // Ensure we still emit the loaded event even if there's an error
        if (window.mapEventBus && typeof window.mapEventBus.emit === 'function') {
          window.mapEventBus.emit('scene:loaded', { error: true });
        }
      }
    }
  };

  const handleUpdateScene = (e, sceneId) => {
    e.stopPropagation();
    try {
      logger.info('\n=== Updating Scene ===');
      logger.info('Scene ID:', sceneId);

      // Find the scene to update
      const sceneToUpdate = scenes.find(scene => scene.id === sceneId);
      if (!sceneToUpdate) {
        console.error('Scene not found');
        return;
      }

      logger.info('Scene to update:', sceneToUpdate.name);

      // Capture current layer states
      const sceneState = captureLayerStates();

      if (!sceneState) {
        logger.error('Failed to capture layer states for scene update');
        return;
      }

      // Verify the captured state matches the actual UI state
      logger.info('Verifying captured state for scene update:');

      try {
        // Get all available layers in the map
        const availableLayers = map.getStyle().layers.map(layer => layer.id);
        logger.info('Available layers for verification:', availableLayers.length);

        // Safe layer visibility check function
        const safeIsLayerVisible = (layerId) => {
          try {
            // Check if layer exists first
            if (!availableLayers.includes(layerId)) {
              logger.warn(`Layer ${layerId} not found in map, skipping visibility check`);
              return false;
            }
            return map.getLayoutProperty(layerId, 'visibility') !== 'none';
          } catch (error) {
            logger.warn(`Error checking visibility for layer ${layerId}:`, error);
            return false;
          }
        };

        // Verify Boston Buildings state
        const bostonBuildingLayers = ['boston-buildings-fill', 'boston-buildings-outline', 'boston-buildings-labels'];
        const hasBostonBuildingLayers = bostonBuildingLayers.some(layerId => availableLayers.includes(layerId));
        const bostonBuildingsLayerVisible = hasBostonBuildingLayers &&
          bostonBuildingLayers.some(layerId => safeIsLayerVisible(layerId));
        logger.info(`Boston Buildings layer visible in map: ${bostonBuildingsLayerVisible}`);
        logger.info(`Boston Buildings state in captured state: ${sceneState.showBostonBuildings}`);

        // If there's a mismatch, correct the captured state
        if (bostonBuildingsLayerVisible !== sceneState.showBostonBuildings) {
          logger.warn('Mismatch detected in Boston Buildings state, correcting captured state');
          sceneState.showBostonBuildings = bostonBuildingsLayerVisible;
        }

        // Verify 3D Buildings state
        const has3DBuildings = availableLayers.includes('3d-buildings');
        const buildings3DLayerVisible = has3DBuildings && safeIsLayerVisible('3d-buildings');
        logger.info(`3D Buildings layer visible in map: ${buildings3DLayerVisible}`);
        logger.info(`3D Buildings state in captured state: ${sceneState.show3DBuildings}`);

        // If there's a mismatch, correct the captured state
        if (buildings3DLayerVisible !== sceneState.show3DBuildings) {
          logger.warn('Mismatch detected in 3D Buildings state, correcting captured state');
          sceneState.show3DBuildings = buildings3DLayerVisible;
        }

        // Verify POI Markers state
        const poiLayers = availableLayers.filter(layerId =>
          layerId.includes('poi') || layerId.includes('label'));
        const hasPOILayers = poiLayers.length > 0;
        const poiMarkersLayerVisible = hasPOILayers &&
          poiLayers.some(layerId => safeIsLayerVisible(layerId));
        logger.info(`POI Markers layer visible in map: ${poiMarkersLayerVisible}`);
        logger.info(`POI Markers state in captured state: ${sceneState.showPOIMarkers}`);

        // If there's a mismatch, correct the captured state
        if (poiMarkersLayerVisible !== sceneState.showPOIMarkers) {
          logger.warn('Mismatch detected in POI Markers state, correcting captured state');
          sceneState.showPOIMarkers = poiMarkersLayerVisible;
        }

        // Verify Parks state
        const parkLayers = [
          'park',
          'park-label',
          'national-park',
          'golf-course',
          'pitch',
          'grass',
          'landuse',
          'landuse_overlay',
          'natural',
          'natural-line',
          'natural-point-label',
          'land-structure-polygon',
          'land-structure-line',
          'waterway',
          'waterway-label'
        ];

        let isParksVisible = false;
        for (const layerId of parkLayers) {
          if (safeIsLayerVisible(layerId)) {
            isParksVisible = true;
            logger.info(`Park layer ${layerId} is visible, setting showParks to true`);
            break;
          }
        }

        logger.info(`Parks layers visible in map: ${isParksVisible}`);
        logger.info(`Parks state in captured state: ${sceneState.showParks}`);

        // If there's a mismatch, correct the captured state
        if (isParksVisible !== sceneState.showParks) {
          logger.warn('Mismatch detected in Parks state, correcting captured state');
          sceneState.showParks = isParksVisible;
        }
      } catch (error) {
        logger.warn('Error verifying captured state:', error);
      }

      // Use the tracked camera state instead of getting it directly from the map
      // This ensures we have the most accurate position even if the map is in transition
      let cameraState = { ...currentCamera };
      logger.debug('Using tracked camera state for update:', cameraState);

      // Validate camera state to ensure it's complete
      if (!cameraState.center || !cameraState.center.lng || !cameraState.center.lat) {
        logger.warn('Invalid camera center, using default');
        cameraState.center = { lng: -71.06, lat: 42.36 }; // Default to Boston
      }

      if (typeof cameraState.zoom !== 'number') {
        logger.warn('Invalid camera zoom, using default');
        cameraState.zoom = 14;
      }

      if (typeof cameraState.pitch !== 'number') {
        logger.warn('Invalid camera pitch, using default');
        cameraState.pitch = 0;
      }

      if (typeof cameraState.bearing !== 'number') {
        logger.warn('Invalid camera bearing, using default');
        cameraState.bearing = 0;
      }

      // Create updated scene with same ID and name but new state
      const updatedScene = {
        ...sceneToUpdate,
        timestamp: new Date().toISOString(),
        toggleStates: sceneState,
        camera: cameraState
      };

      logger.debug('Updated Scene Data:', updatedScene);

      // Update the scenes array
      const updatedScenes = scenes.map(scene =>
        scene.id === sceneId ? updatedScene : scene
      );

      setScenes(updatedScenes);
      localStorage.setItem('mapScenes', JSON.stringify(updatedScenes));
      logger.info('Scene updated successfully');
    } catch (error) {
      logger.error('Error updating scene:', error);
    }
  };

  const handleDeleteScene = (e, sceneId) => {
    e.stopPropagation();
    try {
      logger.info('\n=== Deleting Scene ===');
      logger.info('Scene ID:', sceneId);

      const updatedScenes = scenes.filter(scene => scene.id !== sceneId);
      setScenes(updatedScenes);
      localStorage.setItem('mapScenes', JSON.stringify(updatedScenes));
      logger.info('Scene deleted successfully');
    } catch (error) {
      logger.error('Error deleting scene:', error);
    }
  };

  const handleEditName = (e, sceneId, currentName) => {
    e.stopPropagation();
    setEditingSceneId(sceneId);
    setEditingName(currentName);
  };

  const handleSaveName = (e, sceneId) => {
    e.stopPropagation();
    if (!editingName.trim()) return;

    try {
      logger.info('\n=== Updating Scene Name ===');
      logger.info('Scene ID:', sceneId);
      logger.info('New Name:', editingName);

      const updatedScenes = scenes.map(scene =>
        scene.id === sceneId
          ? { ...scene, name: editingName.trim() }
          : scene
      );

      setScenes(updatedScenes);
      localStorage.setItem('mapScenes', JSON.stringify(updatedScenes));
      setEditingSceneId(null);
      setEditingName('');
      logger.info('Scene name updated successfully');
    } catch (error) {
      logger.error('Error updating scene name:', error);
    }
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingSceneId(null);
    setEditingName('');
  };

  return (
    <SceneSidebar isOpen={isOpen}>
      <SidebarHeader>
        <SidebarTitle>Saved Scenes</SidebarTitle>
        <CloseButton onClick={onClose} title="Close scenes panel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
          </svg>
        </CloseButton>
      </SidebarHeader>

      <SaveSceneForm onSubmit={handleSaveScene}>
        <SaveSceneInput
          type="text"
          placeholder="Enter scene name..."
          value={sceneName}
          onChange={(e) => setSceneName(e.target.value)}
        />
        <SaveSceneButton type="submit">Save</SaveSceneButton>
      </SaveSceneForm>

      <SceneList>
        {scenes.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: '20px 0' }}>
            No saved scenes yet. Save your current view to create a scene.
          </div>
        ) : (
          scenes.map(scene => (
            <SceneItem
              key={scene.id}
              onClick={() => handleSceneClick(scene)}
            >
              <SceneName>
                {editingSceneId === scene.id ? (
                  <>
                    <SceneNameInput
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveName(e, scene.id);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit(e);
                        }
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        onClick={(e) => handleSaveName(e, scene.id)}
                        style={{
                          background: '#3b82f6',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          color: 'white',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          background: 'none',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          color: 'white',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {scene.name}
                      <button
                        onClick={(e) => handleEditName(e, scene.id, scene.name)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255,255,255,0.5)',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          fontSize: '12px',
                          opacity: 0.7
                        }}
                        title="Edit scene name"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                    <SceneTimestamp>
                      {new Date(scene.timestamp).toLocaleString()}
                    </SceneTimestamp>
                  </>
                )}
              </SceneName>
              <SceneActions onClick={(e) => e.stopPropagation()}>
                <ActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSceneClick(scene);
                  }}
                  title="Load scene"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </ActionButton>
                <ActionButton
                  $update
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateScene(e, scene.id);
                  }}
                  title="Update scene with current map state"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </ActionButton>
                <ActionButton
                  $delete
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteScene(e, scene.id);
                  }}
                  title="Delete scene"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </ActionButton>
              </SceneActions>
            </SceneItem>
          ))
        )}
      </SceneList>
    </SceneSidebar>
  );
};

export default SceneManager;