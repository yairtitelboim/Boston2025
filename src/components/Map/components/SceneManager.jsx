import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { osmLayerIds } from '../utils/osmLayers';

const SceneButton = styled.button`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(15, 23, 42, 1);
    border-color: rgba(148, 163, 184, 0.4);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const SceneModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  color: white;
  margin: 0;
  font-size: 20px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
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
`;

const SceneActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.$delete ? '#ff4444' : 'white'};
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
  layerStates,
  onLoadScene,
  onSaveScene
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scenes, setScenes] = useState(() => {
    const savedScenes = localStorage.getItem('mapScenes');
    return savedScenes ? JSON.parse(savedScenes) : [];
  });
  const [sceneName, setSceneName] = useState('');

  const captureLayerStates = () => {
    console.log('\n=== Capturing Layer States ===');
    
    // Capture actual map layer visibility states first
    const mapLayerStates = {};
    if (map) {
      // Get all OSM layer IDs
      const osmLayers = [
        'osm-transit-stops', 'osm-transit-routes',
        'osm-bike-lanes', 'osm-bike-paths', 'osm-bike-parking',
        'osm-pedestrian-paths', 'osm-pedestrian-crossings'
      ];

      // Get all map layers
      osmLayers.forEach(layerId => {
        try {
          if (map.getLayer(layerId)) {
            const visibility = map.getLayoutProperty(layerId, 'visibility');
            mapLayerStates[layerId] = visibility === 'visible';
            console.log(`Layer ${layerId} visibility:`, visibility);
          }
        } catch (error) {
          console.warn(`Could not get visibility for layer ${layerId}:`, error);
        }
      });
    }

    console.log('Map Layer States:', mapLayerStates);

    // Determine OSM states based on actual layer visibility
    const hasVisibleBikeLanes = mapLayerStates['osm-bike-lanes'] || false;
    const hasVisibleBikePaths = mapLayerStates['osm-bike-paths'] || false;
    const hasVisibleBikeParking = mapLayerStates['osm-bike-parking'] || false;
    const hasVisibleTransitStops = mapLayerStates['osm-transit-stops'] || false;
    const hasVisibleTransitRoutes = mapLayerStates['osm-transit-routes'] || false;
    const hasVisiblePedestrianPaths = mapLayerStates['osm-pedestrian-paths'] || false;
    const hasVisiblePedestrianCrossings = mapLayerStates['osm-pedestrian-crossings'] || false;

    // Infer parent toggle states from layer visibility
    const hasAnyVisibleBikeLayer = hasVisibleBikeLanes || hasVisibleBikePaths || hasVisibleBikeParking;
    const hasAnyVisibleTransitLayer = hasVisibleTransitStops || hasVisibleTransitRoutes;
    const hasAnyVisiblePedestrianLayer = hasVisiblePedestrianPaths || hasVisiblePedestrianCrossings;

    // Create toggle states based on actual layer visibility
    const toggleStates = {
      // Transportation Network
      showTransportation: layerStates.showTransportation || false,
      showRoads: layerStates.showRoads || false,
      
      // Public Transit
      showPublicTransit: layerStates.showPublicTransit || false,
      showOSMTransit: hasAnyVisibleTransitLayer,
      showTransitStops: hasVisibleTransitStops,
      showTransitRoutes: hasVisibleTransitRoutes,
      
      // Bike Network
      showBikeInfra: layerStates.showBikeInfra || hasAnyVisibleBikeLayer,
      showOSMBike: hasAnyVisibleBikeLayer,
      showBikeLanes: hasVisibleBikeLanes,
      showBikePaths: hasVisibleBikePaths,
      showBikeParking: hasVisibleBikeParking,
      
      // Pedestrian Network
      showPedestrian: layerStates.showPedestrian || hasAnyVisiblePedestrianLayer,
      showOSMPedestrian: hasAnyVisiblePedestrianLayer,
      showPedestrianPaths: hasVisiblePedestrianPaths,
      showPedestrianCrossings: hasVisiblePedestrianCrossings,
      
      // Other Layers
      showZoningLayer: layerStates.showZoningLayer || false,
      showPlanningAnalysis: layerStates.showPlanningAnalysis || false,
      showAdaptiveReuse: layerStates.showAdaptiveReuse || false,
      showDevelopmentPotential: layerStates.showDevelopmentPotential || false,
      showNeighborhoodBoundaries: layerStates.showNeighborhoodBoundaries || false,
      show3DBuildings: layerStates.show3DBuildings || false
    };

    console.log('Toggle States:', toggleStates);

    // Create a cleaned up version of toggle states that respects parent-child relationships
    const cleanedToggleStates = {
      // Transportation Network
      showTransportation: toggleStates.showTransportation,
      showRoads: toggleStates.showTransportation && toggleStates.showRoads,
      
      // Public Transit
      showPublicTransit: toggleStates.showPublicTransit,
      showOSMTransit: toggleStates.showPublicTransit && toggleStates.showOSMTransit,
      showTransitStops: toggleStates.showPublicTransit && toggleStates.showOSMTransit && toggleStates.showTransitStops,
      showTransitRoutes: toggleStates.showPublicTransit && toggleStates.showOSMTransit && toggleStates.showTransitRoutes,
      
      // Bike Network
      showBikeInfra: toggleStates.showBikeInfra,
      showOSMBike: toggleStates.showBikeInfra && toggleStates.showOSMBike,
      showBikeLanes: toggleStates.showBikeInfra && toggleStates.showOSMBike && toggleStates.showBikeLanes,
      showBikePaths: toggleStates.showBikeInfra && toggleStates.showOSMBike && toggleStates.showBikePaths,
      showBikeParking: toggleStates.showBikeInfra && toggleStates.showOSMBike && toggleStates.showBikeParking,
      
      // Pedestrian Network
      showPedestrian: toggleStates.showPedestrian,
      showOSMPedestrian: toggleStates.showPedestrian && toggleStates.showOSMPedestrian,
      showPedestrianPaths: toggleStates.showPedestrian && toggleStates.showOSMPedestrian && toggleStates.showPedestrianPaths,
      showPedestrianCrossings: toggleStates.showPedestrian && toggleStates.showOSMPedestrian && toggleStates.showPedestrianCrossings,
      
      // Other Layers
      showZoningLayer: toggleStates.showZoningLayer,
      showPlanningAnalysis: toggleStates.showPlanningAnalysis,
      showAdaptiveReuse: toggleStates.showPlanningAnalysis && toggleStates.showAdaptiveReuse,
      showDevelopmentPotential: toggleStates.showPlanningAnalysis && toggleStates.showDevelopmentPotential,
      showNeighborhoodBoundaries: toggleStates.showNeighborhoodBoundaries,
      show3DBuildings: toggleStates.show3DBuildings
    };

    return {
      toggleStates: cleanedToggleStates,
      mapLayerStates
    };
  };

  const handleSaveScene = (e) => {
    e.preventDefault();
    
    if (!sceneName.trim()) {
      console.warn('Scene name is required');
      return;
    }

    try {
      console.log('\n=== Saving New Scene ===');
      console.log('Scene Name:', sceneName);

      // Capture current layer states
      const { toggleStates, mapLayerStates } = captureLayerStates();

      // Capture camera state
      let cameraState = null;
      if (map) {
        try {
          cameraState = {
            center: map.getCenter(),
            zoom: map.getZoom(),
            pitch: map.getPitch(),
            bearing: map.getBearing()
          };
          console.log('Camera State:', cameraState);
        } catch (error) {
          console.warn('Could not get camera state:', error);
        }
      }

      const newScene = {
        id: Date.now(),
        name: sceneName,
        timestamp: new Date().toISOString(),
        toggleStates,
        mapLayerStates,
        camera: cameraState
      };

      console.log('Full Scene Data:', newScene);

      const updatedScenes = [...scenes, newScene];
      setScenes(updatedScenes);
      localStorage.setItem('mapScenes', JSON.stringify(updatedScenes));
      setSceneName('');
      setIsModalOpen(false);
      console.log('Scene saved successfully');
    } catch (error) {
      console.error('Error saving scene:', error);
    }
  };

  const restoreLayerStates = (scene) => {
    console.log('\n=== Restoring Layer States ===');
    
    if (!scene.toggleStates) {
      console.warn('Scene missing toggle states');
      return;
    }

    // First hide all OSM layers
    const hideAllOSMLayers = () => {
      if (!map) return;
      const osmLayers = [
        'osm-transit-stops', 'osm-transit-routes',
        'osm-bike-lanes', 'osm-bike-paths', 'osm-bike-parking',
        'osm-pedestrian-paths', 'osm-pedestrian-crossings'
      ];
      osmLayers.forEach(layerId => {
        try {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', 'none');
          }
        } catch (error) {
          console.warn(`Could not hide layer ${layerId}:`, error);
        }
      });
    };

    hideAllOSMLayers();

    // Create a cleaned up version of toggle states that respects parent-child relationships
    const cleanedToggleStates = {
      // Transportation Network
      showTransportation: scene.toggleStates.showTransportation,
      showRoads: scene.toggleStates.showTransportation && scene.toggleStates.showRoads,
      
      // Public Transit
      showPublicTransit: scene.toggleStates.showPublicTransit,
      showOSMTransit: scene.toggleStates.showPublicTransit && scene.toggleStates.showOSMTransit,
      showTransitStops: scene.toggleStates.showPublicTransit && scene.toggleStates.showOSMTransit && scene.toggleStates.showTransitStops,
      showTransitRoutes: scene.toggleStates.showPublicTransit && scene.toggleStates.showOSMTransit && scene.toggleStates.showTransitRoutes,
      
      // Bike Network
      showBikeInfra: scene.toggleStates.showBikeInfra,
      showOSMBike: scene.toggleStates.showBikeInfra && scene.toggleStates.showOSMBike,
      showBikeLanes: scene.toggleStates.showBikeInfra && scene.toggleStates.showOSMBike && scene.toggleStates.showBikeLanes,
      showBikePaths: scene.toggleStates.showBikeInfra && scene.toggleStates.showOSMBike && scene.toggleStates.showBikePaths,
      showBikeParking: scene.toggleStates.showBikeInfra && scene.toggleStates.showOSMBike && scene.toggleStates.showBikeParking,
      
      // Pedestrian Network
      showPedestrian: scene.toggleStates.showPedestrian,
      showOSMPedestrian: scene.toggleStates.showPedestrian && scene.toggleStates.showOSMPedestrian,
      showPedestrianPaths: scene.toggleStates.showPedestrian && scene.toggleStates.showOSMPedestrian && scene.toggleStates.showPedestrianPaths,
      showPedestrianCrossings: scene.toggleStates.showPedestrian && scene.toggleStates.showOSMPedestrian && scene.toggleStates.showPedestrianCrossings,
      
      // Other Layers
      showZoningLayer: scene.toggleStates.showZoningLayer,
      showPlanningAnalysis: scene.toggleStates.showPlanningAnalysis,
      showAdaptiveReuse: scene.toggleStates.showPlanningAnalysis && scene.toggleStates.showAdaptiveReuse,
      showDevelopmentPotential: scene.toggleStates.showPlanningAnalysis && scene.toggleStates.showDevelopmentPotential,
      showNeighborhoodBoundaries: scene.toggleStates.showNeighborhoodBoundaries,
      show3DBuildings: scene.toggleStates.show3DBuildings
    };

    // Restore layer visibility based on the scene state
    if (map && scene.mapLayerStates) {
      Object.entries(scene.mapLayerStates).forEach(([layerId, isVisible]) => {
        try {
          if (map.getLayer(layerId)) {
            console.log(`Setting ${layerId} visibility to ${isVisible ? 'visible' : 'none'}`);
            map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
          }
        } catch (error) {
          console.warn(`Could not set visibility for layer ${layerId}:`, error);
        }
      });
    }

    // Restore toggle states in the UI
    console.log('Restoring toggle states:', cleanedToggleStates);
    onLoadScene(cleanedToggleStates);
  };

  const handleSceneClick = (scene) => {
    try {
      console.log('\n=== Loading Scene ===');
      console.log('Scene Name:', scene.name);

      // Restore layer states
      restoreLayerStates(scene);

      // Update camera position if available
      if (map && scene.camera) {
        console.log('Updating camera position...');
        try {
          map.easeTo({
            center: [scene.camera.center.lng, scene.camera.center.lat],
            zoom: scene.camera.zoom,
            pitch: scene.camera.pitch,
            bearing: scene.camera.bearing,
            duration: 1500
          });
          console.log('Camera position updated successfully');
        } catch (error) {
          console.error('Error updating camera position:', error);
        }
      }

      setIsModalOpen(false);
      console.log('Scene loaded successfully');
    } catch (error) {
      console.error('Error loading scene:', error);
    }
  };

  const handleDeleteScene = (e, sceneId) => {
    e.stopPropagation();
    try {
      console.log('\n=== Deleting Scene ===');
      console.log('Scene ID:', sceneId);

      const updatedScenes = scenes.filter(scene => scene.id !== sceneId);
      setScenes(updatedScenes);
      localStorage.setItem('mapScenes', JSON.stringify(updatedScenes));
      console.log('Scene deleted successfully');
    } catch (error) {
      console.error('Error deleting scene:', error);
    }
  };

  return (
    <>
      <SceneButton onClick={() => setIsModalOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Scenes
      </SceneButton>

      {isModalOpen && (
        <>
          <ModalOverlay onClick={() => setIsModalOpen(false)} />
          <SceneModal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Saved Scenes</ModalTitle>
              <CloseButton onClick={() => setIsModalOpen(false)}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </CloseButton>
            </ModalHeader>

            <SaveSceneForm onSubmit={handleSaveScene}>
              <SaveSceneInput
                type="text"
                placeholder="Enter scene name..."
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
              />
              <SaveSceneButton type="submit">Save Scene</SaveSceneButton>
            </SaveSceneForm>

            <SceneList>
              {scenes.map(scene => (
                <SceneItem 
                  key={scene.id}
                  onClick={() => handleSceneClick(scene)}
                >
                  <SceneName>
                    {scene.name}
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                      {new Date(scene.timestamp).toLocaleString()}
                    </div>
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
              ))}
            </SceneList>
          </SceneModal>
        </>
      )}
    </>
  );
};

export default SceneManager; 