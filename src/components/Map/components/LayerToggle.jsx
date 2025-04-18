import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { osmLayerIds, loadOSMData, toggleOSMLayer } from '../utils/osmLayers';
import * as turf from '@turf/turf';
import NeighborhoodBoundaries from './NeighborhoodBoundaries';
import PlanningAnalysisLayer from './PlanningAnalysisLayer';
import PropertyPricesLayer from './PropertyPricesLayer';
import EmploymentLayer from './EmploymentLayer';
import { SidePopup } from './SidePopup';
import LayerIcons from './icons/LayerIcons';
import { useLayerToggles } from '../hooks/useLayerToggles';
import { use3DBuildings } from '../hooks/use3DBuildings';
import { NeighborhoodPopup } from './NeighborhoodPopup';
// import { COLORS, TRANSPORTATION_CATEGORIES } from '../constants/layerConstants';
import {
  LayerToggleContainer,
  LayerHeader,
  Title,
  CollapseButton,
  ExpandButton,
  SearchInput,
  CategorySection,
  CategoryHeader,
  CategoryIcon,
  CategoryTitle,
  ToggleSwitch,
  SubLayerContainer,
  SubLayer
} from './styles/LayerToggleStyles';
import SceneManager from './SceneManager';
import { handleNeighborhoodSelection } from '../../../services/claude';
import OSMPOILayer from './OSMPOILayer';

// Array of Mapbox green spaces layers
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

// More specific filter for natural areas that are actually parks
const naturalParkFilter = [
  'any',
  ['==', ['get', 'class'], 'park'],
  ['==', ['get', 'class'], 'garden'],
  ['==', ['get', 'class'], 'forest'],
  ['==', ['get', 'class'], 'wood']
];

// Add this styled component at the top with other styled components
const POILegend = styled.div`
  margin-top: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
`;

const POILegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0;
`;

const ColorDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.color};
  border: 1px solid rgba(255, 255, 255, 0.3);
`;



const LayerToggle = ({
  map,
  isLayerMenuCollapsed,
  setIsLayerMenuCollapsed,
  showZoningLayer,
  setShowZoningLayer,
  showPlanningAnalysis,
  setShowPlanningAnalysis,
  showAdaptiveReuse,
  setShowAdaptiveReuse,
  showDevelopmentPotential,
  setShowDevelopmentPotential,
  showTransportation = false,
  setShowTransportation,
  showRoads,
  setShowRoads,
  showNeighborhoodBoundaries,
  setShowNeighborhoodBoundaries,
  showPropertyPrices,
  setShowPropertyPrices,
  showEmployment = false,
  setShowEmployment,
  showParks = false,
  setShowParks,
  showNeighborhoodLabels = false,
  setShowNeighborhoodLabels,
  showEmploymentLabels = false,
  setShowEmploymentLabels,
  showLocalZones = false,
  setShowLocalZones,
  showLocalZoneBoundaries = false,
  setShowLocalZoneBoundaries,
  showLocalZoneLabels = false,
  setShowLocalZoneLabels,
  showPOIMarkers = true,
  setShowPOIMarkers,
  showOSMPOIs = false,
  setShowOSMPOIs,
  showBostonBuildings,
  setShowBostonBuildings,
  isSceneSidebarOpen,
  setIsSceneSidebarOpen
}) => {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [neighborhoodMarkers, setNeighborhoodMarkers] = useState(null);
  const [planningData, setPlanningData] = useState(null);
  // Removed Toggle All Layers functionality
  const [expandedCategories, setExpandedCategories] = useState({
    poiMarkers: false,
    osmPOIs: false,
    parks: false,
    bostonBuildings: false,
    mapbox3DBuildings: false
  });
  // Ref to track 3D buildings state updates
  const isUpdating3DBuildingsRef = useRef(false);

  const {
    showOSMTransit,
    showOSMBike,
    showOSMPedestrian,
    expandedCategories: useLayerTogglesExpandedCategories,
    is3DLoading,
    toggleCategory,
    handleToggle,
    handleOSMTransitToggle,
    handleOSMBikeToggle,
    handleOSMPedestrianToggle,
    setIs3DLoading,
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
    setShowPedestrianCrossings
  } = useLayerToggles(map);

  const {
    show3DBuildings,
    toggle3D,
    reset3DBuildings,
    setShow3DBuildings
  } = use3DBuildings(map);

  const handlePlanningDataLoaded = (data) => {
    console.log('Planning data loaded:', {
      adaptiveReuse: data.adaptiveReuse?.length || 0,
      development: data.development?.length || 0
    });
    setPlanningData(data);
  };

  // Function to toggle visibility and styling of park layers
  const toggleParkLayers = (visible) => {
    if (!map.current) {
      console.warn('Map not available for toggling park layers');
      return;
    }

    console.log(`Parks Toggle: Setting park layers to ${visible ? 'visible' : 'hidden'}`);

    // First handle the critical park layers directly
    const criticalParkLayers = ['national-park', 'landuse'];
    criticalParkLayers.forEach(layerId => {
      try {
        if (map.current.getLayer(layerId)) {
          console.log(`%c[DIRECT PARK TOGGLE] Setting ${layerId} to ${visible ? 'visible' : 'none'}`, 'background: red; color: white;');
          map.current.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
        }
      } catch (error) {
        console.warn(`Error setting visibility for ${layerId}:`, error);
      }
    });

    // Process each park layer
    parkLayers.forEach(layerId => {
      if (map.current.getLayer(layerId)) {
        try {
          // Get the layer type
          const layer = map.current.getLayer(layerId);
          const layerType = layer.type;

          // Set visibility for all layer types
          map.current.setLayoutProperty(
            layerId,
            'visibility',
            visible ? 'visible' : 'none'
          );

          // Apply appropriate styling based on layer type
          switch (layerType) {
            case 'fill':
              map.current.setPaintProperty(
                layerId,
                'fill-color',
                visible ? '#063006' : '#050f08'
              );
              map.current.setPaintProperty(
                layerId,
                'fill-opacity',
                visible ? 0.6 : 0.3
              );
              break;

            case 'line':
              map.current.setPaintProperty(
                layerId,
                'line-color',
                visible ? '#063006' : '#333333'
              );
              map.current.setPaintProperty(
                layerId,
                'line-opacity',
                visible ? 0.8 : 0.4
              );
              break;

            case 'symbol':
              if (map.current.getPaintProperty(layerId, 'text-color') !== undefined) {
                map.current.setPaintProperty(
                  layerId,
                  'text-color',
                  visible ? '#ffffff' : '#888888'
                );
                map.current.setPaintProperty(
                  layerId,
                  'text-halo-color',
                  visible ? '#063006' : '#333333'
                );
              }
              break;
          }
        } catch (error) {
          console.warn(`Parks Toggle: Could not style park layer ${layerId}:`, error);
        }
      }
    });

    // Apply filter to natural layer if it exists
    if (map.current.getLayer('natural')) {
      try {
        if (visible) {
          if (!map.current._originalNaturalFilter) {
            map.current._originalNaturalFilter = map.current.getFilter('natural') || ['all'];
          }
          map.current.setFilter('natural', ['all',
            map.current._originalNaturalFilter,
            naturalParkFilter
          ]);
          map.current.setPaintProperty('natural', 'fill-color', '#063006');
          map.current.setPaintProperty('natural', 'fill-opacity', 0.6);
        } else {
          if (map.current._originalNaturalFilter) {
            map.current.setFilter('natural', map.current._originalNaturalFilter);
          }
          map.current.setPaintProperty('natural', 'fill-color', '#050f08');
          map.current.setPaintProperty('natural', 'fill-opacity', 0.3);
        }
      } catch (error) {
        console.warn('Parks Toggle: Could not filter natural layer:', error);
      }
    }
  };



  // Register with layerStateManager if available
  useEffect(() => {
    if (window.layerStateManager) {
      console.log('LayerToggle: Registering with layerStateManager');

      // Register all layer states
      window.layerStateManager.registerLayer('showPlanningAnalysis', setShowPlanningAnalysis, showPlanningAnalysis);
      window.layerStateManager.registerLayer('showAdaptiveReuse', setShowAdaptiveReuse, showAdaptiveReuse);
      window.layerStateManager.registerLayer('showDevelopmentPotential', setShowDevelopmentPotential, showDevelopmentPotential);
      window.layerStateManager.registerLayer('showTransportation', setShowTransportation, showTransportation);
      window.layerStateManager.registerLayer('showRoads', setShowRoads, showRoads);
      window.layerStateManager.registerLayer('showNeighborhoodBoundaries', setShowNeighborhoodBoundaries, showNeighborhoodBoundaries);
      window.layerStateManager.registerLayer('showNeighborhoodLabels', setShowNeighborhoodLabels, showNeighborhoodLabels);
      window.layerStateManager.registerLayer('showPropertyPrices', setShowPropertyPrices, showPropertyPrices);
      window.layerStateManager.registerLayer('showParks', setShowParks, showParks);
      window.layerStateManager.registerLayer('showEmployment', setShowEmployment, showEmployment);
      window.layerStateManager.registerLayer('showEmploymentLabels', setShowEmploymentLabels, showEmploymentLabels);
      window.layerStateManager.registerLayer('showLocalZones', setShowLocalZones, showLocalZones);
      window.layerStateManager.registerLayer('showLocalZoneBoundaries', setShowLocalZoneBoundaries, showLocalZoneBoundaries);
      window.layerStateManager.registerLayer('showLocalZoneLabels', setShowLocalZoneLabels, showLocalZoneLabels);
      window.layerStateManager.registerLayer('showPOIMarkers', setShowPOIMarkers, showPOIMarkers);
      window.layerStateManager.registerLayer('showOSMPOIs', setShowOSMPOIs, showOSMPOIs);
      window.layerStateManager.registerLayer('showBostonBuildings', setShowBostonBuildings, showBostonBuildings);

      // Register OSM transit states
      window.layerStateManager.registerLayer('showOSMTransit', handleOSMTransitToggle, showOSMTransit);
      window.layerStateManager.registerLayer('showTransitStops', setShowTransitStops, showTransitStops);
      window.layerStateManager.registerLayer('showTransitRoutes', setShowTransitRoutes, showTransitRoutes);

      // Register OSM bike states
      window.layerStateManager.registerLayer('showOSMBike', handleOSMBikeToggle, showOSMBike);
      window.layerStateManager.registerLayer('showBikeLanes', setShowBikeLanes, showBikeLanes);
      window.layerStateManager.registerLayer('showBikePaths', setShowBikePaths, showBikePaths);
      window.layerStateManager.registerLayer('showBikeParking', setShowBikeParking, showBikeParking);

      // Register OSM pedestrian states
      window.layerStateManager.registerLayer('showOSMPedestrian', handleOSMPedestrianToggle, showOSMPedestrian);
      window.layerStateManager.registerLayer('showPedestrianPaths', setShowPedestrianPaths, showPedestrianPaths);
      window.layerStateManager.registerLayer('showPedestrianCrossings', setShowPedestrianCrossings, showPedestrianCrossings);

      // Register 3D buildings state
      window.layerStateManager.registerLayer('show3DBuildings', setShow3DBuildings, show3DBuildings);
    }
  }, []);

  // Update layerStateManager when layer states change
  useEffect(() => {
    if (window.layerStateManager) {
      // Update all layer states
      window.layerStateManager.updateLayerState('showPlanningAnalysis', showPlanningAnalysis);
      window.layerStateManager.updateLayerState('showAdaptiveReuse', showAdaptiveReuse);
      window.layerStateManager.updateLayerState('showDevelopmentPotential', showDevelopmentPotential);
      window.layerStateManager.updateLayerState('showTransportation', showTransportation);
      window.layerStateManager.updateLayerState('showRoads', showRoads);
      window.layerStateManager.updateLayerState('showNeighborhoodBoundaries', showNeighborhoodBoundaries);
      window.layerStateManager.updateLayerState('showNeighborhoodLabels', showNeighborhoodLabels);
      window.layerStateManager.updateLayerState('showPropertyPrices', showPropertyPrices);
      window.layerStateManager.updateLayerState('showParks', showParks);
      window.layerStateManager.updateLayerState('showEmployment', showEmployment);
      window.layerStateManager.updateLayerState('showEmploymentLabels', showEmploymentLabels);
      window.layerStateManager.updateLayerState('showLocalZones', showLocalZones);
      window.layerStateManager.updateLayerState('showLocalZoneBoundaries', showLocalZoneBoundaries);
      window.layerStateManager.updateLayerState('showLocalZoneLabels', showLocalZoneLabels);
      window.layerStateManager.updateLayerState('showPOIMarkers', showPOIMarkers);
      window.layerStateManager.updateLayerState('showOSMPOIs', showOSMPOIs);
      window.layerStateManager.updateLayerState('showBostonBuildings', showBostonBuildings);

      // Update OSM transit states
      window.layerStateManager.updateLayerState('showOSMTransit', showOSMTransit);
      window.layerStateManager.updateLayerState('showTransitStops', showTransitStops);
      window.layerStateManager.updateLayerState('showTransitRoutes', showTransitRoutes);

      // Update OSM bike states
      window.layerStateManager.updateLayerState('showOSMBike', showOSMBike);
      window.layerStateManager.updateLayerState('showBikeLanes', showBikeLanes);
      window.layerStateManager.updateLayerState('showBikePaths', showBikePaths);
      window.layerStateManager.updateLayerState('showBikeParking', showBikeParking);

      // Update OSM pedestrian states
      window.layerStateManager.updateLayerState('showOSMPedestrian', showOSMPedestrian);
      window.layerStateManager.updateLayerState('showPedestrianPaths', showPedestrianPaths);
      window.layerStateManager.updateLayerState('showPedestrianCrossings', showPedestrianCrossings);

      // Update 3D buildings state
      window.layerStateManager.updateLayerState('show3DBuildings', show3DBuildings);
    }
  }, [
    showPlanningAnalysis, showAdaptiveReuse, showDevelopmentPotential,
    showTransportation, showRoads, showNeighborhoodBoundaries, showNeighborhoodLabels,
    showPropertyPrices, showParks, showEmployment, showEmploymentLabels,
    showLocalZones, showLocalZoneBoundaries, showLocalZoneLabels,
    showPOIMarkers, showOSMPOIs, showBostonBuildings,
    showOSMTransit, showTransitStops, showTransitRoutes,
    showOSMBike, showBikeLanes, showBikePaths, showBikeParking,
    showOSMPedestrian, showPedestrianPaths, showPedestrianCrossings,
    show3DBuildings
  ]);

  // Effect to handle park layers visibility
  useEffect(() => {
    toggleParkLayers(showParks);
  }, [showParks]);

  // Make toggleParkLayers and setParksVisible available globally
  useEffect(() => {
    // Make these functions available immediately, regardless of map state

    // Make toggleParkLayers available globally with improved logging
    window.toggleParkLayers = (visible) => {
      console.log(`%c[GLOBAL TOGGLE] toggleParkLayers called with visible=${visible}`, 'background: blue; color: white; font-weight: bold;');

      // First update the React state
      setShowParks(visible);
      console.log(`%c[GLOBAL TOGGLE] Updated React state to ${visible}`, 'background: blue; color: white;');

      // Then update the layer state manager
      if (window.layerStateManager) {
        console.log(`%c[GLOBAL TOGGLE] Updating layerStateManager with Parks=${visible}`, 'background: blue; color: white;');
        window.layerStateManager.updateLayerState('showParks', visible);
      }

      // Then toggle the layers directly
      if (map?.current) {
        console.log(`%c[GLOBAL TOGGLE] Directly toggling park layers to ${visible ? 'visible' : 'hidden'}`, 'background: blue; color: white;');
        toggleParkLayers(visible);
      }
    };

    // Make setParksVisible available globally with improved logging
    window.setParksVisible = (visible) => {
      console.log(`%c[GLOBAL SETTER] setParksVisible called with visible=${visible}`, 'background: green; color: white; font-size: 16px; padding: 5px;');

      // First update the React state
      setShowParks(visible);
      console.log(`%c[GLOBAL SETTER] Updated React state to ${visible}`, 'background: green; color: white;');

      // Then update the layer state manager
      if (window.layerStateManager) {
        console.log(`%c[GLOBAL SETTER] Updating layerStateManager with Parks=${visible}`, 'background: green; color: white;');
        window.layerStateManager.updateLayerState('showParks', visible);
      }

      // Then toggle the layers directly
      if (map?.current) {
        console.log(`%c[GLOBAL SETTER] Directly toggling park layers to ${visible ? 'visible' : 'hidden'}`, 'background: green; color: white;');
        toggleParkLayers(visible);
      }

      // Verify the park layers visibility directly
      setTimeout(() => {
        try {
          if (map?.current) {
            const criticalParkLayers = ['national-park', 'landuse'];
            criticalParkLayers.forEach(layerId => {
              try {
                if (map.current.getLayer(layerId)) {
                  const visibility = map.current.getLayoutProperty(layerId, 'visibility');
                  console.log(`%c[GLOBAL SETTER] ${layerId} visibility after update: ${visibility}`, 'background: green; color: white;');

                  // Force the visibility if it doesn't match what we want
                  if (visibility !== (visible ? 'visible' : 'none')) {
                    console.log(`%c[GLOBAL SETTER] Forcing ${layerId} visibility to ${visible ? 'visible' : 'none'}`, 'background: red; color: white; font-weight: bold;');
                    map.current.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
                  }
                }
              } catch (error) {
                // Ignore errors
              }
            });
          }

          // Also check the layer state manager
          if (window.layerStateManager) {
            const currentState = window.layerStateManager.getAllLayerStates().showParks;
            console.log(`%c[GLOBAL SETTER] Parks state after update: ${currentState}`, 'background: green; color: white;');

            // Force the state if it doesn't match what we want
            if (currentState !== visible) {
              console.log(`%c[GLOBAL SETTER] Forcing layerStateManager Parks=${visible}`, 'background: red; color: white; font-weight: bold;');
              window.layerStateManager.updateLayerState('showParks', visible);
            }
          }
        } catch (error) {
          console.error('Error verifying park layers visibility:', error);
        }
      }, 100);
    };

    console.log('Made Parks toggle functions available globally');

    return () => {
      delete window.toggleParkLayers;
      delete window.setParksVisible;
    };
  }, []);

  // Make OSM POIs toggle functions available globally
  useEffect(() => {
    // Make toggleOSMPOIs available globally with improved logging
    window.toggleOSMPOIs = (visible) => {
      console.log(`%c[GLOBAL TOGGLE] toggleOSMPOIs called with visible=${visible}`, 'background: purple; color: white; font-weight: bold;');

      // First update the React state
      setShowOSMPOIs(visible);
      console.log(`%c[GLOBAL TOGGLE] Updated React state to ${visible}`, 'background: purple; color: white;');

      // Then update the layer state manager
      if (window.layerStateManager) {
        console.log(`%c[GLOBAL TOGGLE] Updating layerStateManager with OSMPOIs=${visible}`, 'background: purple; color: white;');
        window.layerStateManager.updateLayerState('showOSMPOIs', visible);
      }

      // Emit an event that POI Graph can listen to
      if (window.mapEventBus) {
        console.log(`%c[GLOBAL TOGGLE] Emitting osmLayer:visibility event with visible=${visible}`, 'background: purple; color: white;');
        window.mapEventBus.emit('osmLayer:visibility', { visible });
        window.mapEventBus.emit('osm:visibility', { visible });
      }
    };

    // Make setOSMPOIsVisible available globally with improved logging
    window.setOSMPOIsVisible = (visible) => {
      console.log(`%c[GLOBAL SETTER] setOSMPOIsVisible called with visible=${visible}`, 'background: orange; color: black; font-weight: bold;');

      // First update the React state
      setShowOSMPOIs(visible);
      console.log(`%c[GLOBAL SETTER] Updated React state to ${visible}`, 'background: orange; color: black;');

      // Then update the layer state manager
      if (window.layerStateManager) {
        console.log(`%c[GLOBAL SETTER] Updating layerStateManager with OSMPOIs=${visible}`, 'background: orange; color: black;');
        window.layerStateManager.updateLayerState('showOSMPOIs', visible);
      }

      // Emit an event that POI Graph can listen to
      if (window.mapEventBus) {
        console.log(`%c[GLOBAL SETTER] Emitting osmLayer:visibility event with visible=${visible}`, 'background: orange; color: black;');
        window.mapEventBus.emit('osmLayer:visibility', { visible });
        window.mapEventBus.emit('osm:visibility', { visible });
      }
    };

    console.log('Made OSM POIs toggle functions available globally');

    return () => {
      delete window.toggleOSMPOIs;
      delete window.setOSMPOIsVisible;
    };
  }, []);

  // Make 3D Buildings toggle functions available globally
  useEffect(() => {
    // Make these functions available immediately, regardless of map state

    // Make toggle3DBuildings available globally
    window.toggle3DBuildings = () => {
      console.log('Global toggle3DBuildings called');
      if (toggle3D) {
        toggle3D();
      }
    };

    // Make set3DBuildingsVisible available globally
    window.set3DBuildingsVisible = (visible) => {
      console.log(`Global set3DBuildingsVisible called with visible=${visible}`);

      // Update the React state
      setShow3DBuildings(visible);

      // Also update the map layers directly if map is available
      if (map?.current) {
        const buildingLayers = ['3d-buildings', 'buildings-3d-layer', 'osm-buildings-3d', 'harbor-buildings-3d'];
        buildingLayers.forEach(layerId => {
          try {
            if (map.current.getLayer(layerId)) {
              console.log(`Setting ${layerId} visibility to ${visible ? 'visible' : 'none'}`);
              map.current.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
            }
          } catch (error) {
            console.warn(`Error setting visibility for ${layerId}:`, error);
          }
        });
      }

      // Update the layer state manager
      if (window.layerStateManager) {
        window.layerStateManager.updateLayerState('show3DBuildings', visible);
      }
    };

    console.log('Made 3D Buildings toggle functions available globally');

    return () => {
      delete window.toggle3DBuildings;
      delete window.set3DBuildingsVisible;
    };
  }, [toggle3D]);

  // One-time check for default 3D buildings layer visibility when map loads
  useEffect(() => {
    if (map?.current && map.current.loaded()) {
      try {
        // Check the current visibility of the default 3D buildings layers
        const buildingLayers = [
          '3d-buildings',
          'harbor-buildings-3d'
        ];

        let isAnyVisible = false;

        // Check if any of the building layers is visible
        buildingLayers.forEach(layerId => {
          if (map.current.getLayer(layerId)) {
            const visibility = map.current.getLayoutProperty(layerId, 'visibility');
            if (visibility !== 'none') {
              isAnyVisible = true;
              console.log(`${layerId} is visible`);
            }
          }
        });

        console.log(`Initial 3D buildings layer visibility: ${isAnyVisible}`);

        // Update our state if needed
        if (show3DBuildings !== isAnyVisible) {
          setShow3DBuildings(isAnyVisible);
        }
      } catch (error) {
        console.error('Error checking 3D buildings layer:', error);
      }
    }
  }, [map?.current]);



  return (
    <>
      <LayerToggleContainer $isCollapsed={isLayerMenuCollapsed}>
        <LayerHeader>
          <Title>Map Layers</Title>
          <CollapseButton
            onClick={() => setIsLayerMenuCollapsed(!isLayerMenuCollapsed)}
            $isCollapsed={isLayerMenuCollapsed}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L10.83 12l4.58 4.59L14 18l-6-6 6-6 1.41 1.41z"/>
            </svg>
          </CollapseButton>
        </LayerHeader>





        {/* Scenes Section */}
        <CategorySection>
          <CategoryHeader
            onClick={() => setIsSceneSidebarOpen(true)}
            style={{ background: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.2)' }}
          >
            <CategoryIcon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h-4.5m-9 0H5a2 2 0 01-2-2V7a2 2 0 012-2h1.5m9 0h4.5a2 2 0 012 2v.5M9 7h1m5 0h1M9 11h1m5 0h1M9 15h1m5 0h1M9 19h1m5 0h1" />
              </svg>
            </CategoryIcon>
            <CategoryTitle>Saved Scenes</CategoryTitle>
            <div style={{ marginLeft: 'auto' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </CategoryHeader>
        </CategorySection>

        {/* Mapbox POI Markers Section */}
        <CategorySection>
          <CategoryHeader
            onClick={() => setExpandedCategories({...expandedCategories, poiMarkers: !expandedCategories.poiMarkers})}
            $isExpanded={expandedCategories.poiMarkers}
          >
            <CategoryIcon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </CategoryIcon>
            <CategoryTitle>Mapbox POIs</CategoryTitle>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={showPOIMarkers}
                onChange={() => setShowPOIMarkers(!showPOIMarkers)}
              />
              <span></span>
            </ToggleSwitch>
          </CategoryHeader>

          {expandedCategories.poiMarkers && (
            <POILegend>
              <POILegendItem><ColorDot color="#ff9900" />Restaurant</POILegendItem>
              <POILegendItem><ColorDot color="#cc6600" />Cafe</POILegendItem>
              <POILegendItem><ColorDot color="#990099" />Bar</POILegendItem>
              <POILegendItem><ColorDot color="#0066ff" />Shop</POILegendItem>
              <POILegendItem><ColorDot color="#cc3300" />Museum</POILegendItem>
              <POILegendItem><ColorDot color="#33cc33" />Park</POILegendItem>
              <POILegendItem><ColorDot color="#ff3333" />School</POILegendItem>
              <POILegendItem><ColorDot color="#ff0000" />Hospital</POILegendItem>
              <POILegendItem><ColorDot color="#999999" />Other</POILegendItem>
            </POILegend>
          )}
        </CategorySection>

        {/* OSM POIs Section */}
        <CategorySection>
          <CategoryHeader
            onClick={() => setExpandedCategories({...expandedCategories, osmPOIs: !expandedCategories.osmPOIs})}
            $isExpanded={expandedCategories.osmPOIs}
          >
            <CategoryIcon><LayerIcons.POI /></CategoryIcon>
            <CategoryTitle>OSM POIs</CategoryTitle>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={showOSMPOIs}
                onChange={() => {
                  const newValue = !showOSMPOIs;
                  console.log(`%c[OSM TOGGLE] User clicked OSM POIs toggle, new value: ${newValue}`, 'background: purple; color: white; font-weight: bold;');

                  // Use the global function to ensure consistent state updates
                  if (window.setOSMPOIsVisible) {
                    window.setOSMPOIsVisible(newValue);
                  } else {
                    // Fallback if global function is not available
                    setShowOSMPOIs(newValue);

                    // Update the layer state manager directly
                    if (window.layerStateManager) {
                      window.layerStateManager.updateLayerState('showOSMPOIs', newValue);
                    }

                    // Emit events
                    if (window.mapEventBus) {
                      window.mapEventBus.emit('osmLayer:visibility', { visible: newValue });
                      window.mapEventBus.emit('osm:visibility', { visible: newValue });
                    }
                  }

                  // Log the state after update
                  setTimeout(() => {
                    if (window.layerStateManager) {
                      const currentState = window.layerStateManager.getAllLayerStates().showOSMPOIs;
                      console.log(`%c[OSM TOGGLE] OSM POIs state after toggle: ${currentState}`, 'background: purple; color: white;');
                    }
                  }, 100);
                }}
              />
              <span></span>
            </ToggleSwitch>
          </CategoryHeader>

          {showOSMPOIs && expandedCategories.osmPOIs && (
            <POILegend>
              <POILegendItem><ColorDot color="#ff9900" />Restaurants</POILegendItem>
              <POILegendItem><ColorDot color="#cc6600" />Cafes</POILegendItem>
              <POILegendItem><ColorDot color="#990099" />Bars</POILegendItem>
              <POILegendItem><ColorDot color="#0066ff" />Shops</POILegendItem>
              <POILegendItem><ColorDot color="#cc3300" />Cultural</POILegendItem>
              <POILegendItem><ColorDot color="#33cc33" />Parks</POILegendItem>
              <POILegendItem><ColorDot color="#ff3333" />Education</POILegendItem>
              <POILegendItem><ColorDot color="#ff0000" />Healthcare</POILegendItem>
            </POILegend>
          )}
        </CategorySection>

        {/* Parks Section */}
        <CategorySection>
          <CategoryHeader
            onClick={() => setExpandedCategories({...expandedCategories, parks: !expandedCategories.parks})}
            $isExpanded={expandedCategories.parks}
          >
            <CategoryIcon><LayerIcons.Nature /></CategoryIcon>
            <CategoryTitle>Parks</CategoryTitle>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={showParks}
                onChange={() => {
                  const newValue = !showParks;
                  console.log(`%c[PARKS TOGGLE] User clicked Parks toggle, new value: ${newValue}`, 'background: orange; color: black; font-size: 16px; padding: 5px;');

                  // Use the global function to ensure consistent state updates
                  if (window.setParksVisible) {
                    console.log(`%c[PARKS TOGGLE] Calling setParksVisible(${newValue})`, 'background: orange; color: black; font-weight: bold;');
                    window.setParksVisible(newValue);
                  } else {
                    // Fallback if global function is not available
                    console.log(`%c[PARKS TOGGLE] Global function not available, using direct updates`, 'background: orange; color: black;');

                    // First update the React state
                    setShowParks(newValue);

                    // Then update the layer state manager
                    if (window.layerStateManager) {
                      console.log(`%c[PARKS TOGGLE] Updating layerStateManager with Parks=${newValue}`, 'background: orange; color: black;');
                      window.layerStateManager.updateLayerState('showParks', newValue);
                    }

                    // Then toggle the layers directly
                    if (map?.current) {
                      console.log(`%c[PARKS TOGGLE] Directly toggling park layers to ${newValue ? 'visible' : 'hidden'}`, 'background: orange; color: black;');
                      toggleParkLayers(newValue);
                    }
                  }

                  // Verify the park layers visibility directly
                  setTimeout(() => {
                    try {
                      if (map?.current) {
                        const criticalParkLayers = ['national-park', 'landuse'];
                        criticalParkLayers.forEach(layerId => {
                          try {
                            if (map.current.getLayer(layerId)) {
                              const visibility = map.current.getLayoutProperty(layerId, 'visibility');
                              console.log(`%c[PARKS TOGGLE] ${layerId} visibility after toggle: ${visibility}`, 'background: orange; color: black;');
                            }
                          } catch (error) {
                            // Ignore errors
                          }
                        });
                      }

                      // Also check the layer state manager
                      if (window.layerStateManager) {
                        const currentState = window.layerStateManager.getAllLayerStates().showParks;
                        console.log(`%c[PARKS TOGGLE] Parks state after toggle: ${currentState}`, 'background: orange; color: black;');
                      }
                    } catch (error) {
                      console.error('Error verifying park layers visibility:', error);
                    }
                  }, 100);
                }}
              />
              <span></span>
            </ToggleSwitch>
          </CategoryHeader>
        </CategorySection>

        {/* Boston Buildings Section */}
        <CategorySection>
          <CategoryHeader
            onClick={() => setExpandedCategories({...expandedCategories, bostonBuildings: !expandedCategories.bostonBuildings})}
            $isExpanded={expandedCategories.bostonBuildings}
          >
            <CategoryIcon><LayerIcons.Boston /></CategoryIcon>
            <CategoryTitle>Boston Buildings</CategoryTitle>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={showBostonBuildings}
                onChange={() => {
                  const newValue = !showBostonBuildings;
                  console.log(`[TOGGLE] User clicked Boston Buildings toggle, new value: ${newValue}`);

                  // First update the React state
                  setShowBostonBuildings(newValue);

                  // Then update the layer state manager
                  if (window.layerStateManager) {
                    console.log(`[TOGGLE] Updating layerStateManager with Boston Buildings=${newValue}`);
                    window.layerStateManager.updateLayerState('showBostonBuildings', newValue);
                  }

                  // Try all available methods to update the layer visibility

                  // Method 1: Use the direct toggle function from BostonBuildingsLayer
                  if (window.toggleBostonBuildingsDirectly) {
                    console.log(`[TOGGLE] Using toggleBostonBuildingsDirectly(${newValue})`);
                    window.toggleBostonBuildingsDirectly(newValue);
                  }
                  // Method 2: Use the global setter function
                  else if (window.setBostonBuildingsVisible) {
                    console.log(`[TOGGLE] Using setBostonBuildingsVisible(${newValue})`);
                    window.setBostonBuildingsVisible(newValue);
                  }
                  // Method 3: Use the force update function
                  else if (window.forceUpdateBostonBuildings) {
                    console.log(`[TOGGLE] Using forceUpdateBostonBuildings(${newValue})`);
                    window.forceUpdateBostonBuildings(newValue);
                  }
                  // Method 4: Direct layer manipulation
                  else if (map?.current) {
                    console.log(`[TOGGLE] Using direct layer manipulation`);
                    const bostonBuildingLayers = ['boston-buildings-fill', 'boston-buildings-outline'];
                    bostonBuildingLayers.forEach(layerId => {
                      try {
                        if (map.current.getLayer(layerId)) {
                          console.log(`[TOGGLE] Setting ${layerId} to ${newValue ? 'visible' : 'none'}`);
                          map.current.setLayoutProperty(layerId, 'visibility', newValue ? 'visible' : 'none');
                        }
                      } catch (error) {
                        console.warn(`Error setting visibility for ${layerId}:`, error);
                      }
                    });
                  }

                  // Fly to Boston if enabling and not already there
                  if (newValue && map?.current) {
                    const center = map.current.getCenter();
                    const zoom = map.current.getZoom();
                    if (Math.abs(center.lng - (-71.06)) > 0.1 || Math.abs(center.lat - 42.36) > 0.1 || zoom < 14) {
                      map.current.flyTo({
                        center: [-71.06, 42.36],
                        zoom: 15,
                        pitch: 60,
                        bearing: -20,
                        duration: 2000
                      });
                    }
                  }

                  // Check the layer status after toggle
                  setTimeout(() => {
                    if (window.checkBostonBuildingsLayer) {
                      console.log('[TOGGLE] Checking layer status after toggle:');
                      window.checkBostonBuildingsLayer();
                    }
                  }, 500);
                }}
              />
              <span></span>
            </ToggleSwitch>
          </CategoryHeader>
        </CategorySection>

        {/* Mapbox Default 3D Buildings Section */}
        <CategorySection>
          <CategoryHeader
            onClick={() => setExpandedCategories({...expandedCategories, mapbox3DBuildings: !expandedCategories.mapbox3DBuildings})}
            $isExpanded={expandedCategories.mapbox3DBuildings}
          >
            <CategoryIcon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M2 22h20M2 2h20M5 2v20M19 2v20M9 2v7M9 15v7M15 2v7M15 15v7M9 9h6M9 15h6" />
              </svg>
            </CategoryIcon>
            <CategoryTitle>Mapbox 3D Buildings</CategoryTitle>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={show3DBuildings}
                onChange={() => {
                  const newState = !show3DBuildings;
                  console.log(`3D Buildings toggle clicked, new value: ${newState}`);

                  // Use the global function to ensure consistent state updates
                  if (window.set3DBuildingsVisible) {
                    window.set3DBuildingsVisible(newState);
                  } else {
                    // Fallback if global function is not available
                    setShow3DBuildings(newState);

                    // Update the visibility of the layers if map is available
                    if (map?.current) {
                      const newVisibility = newState ? 'visible' : 'none';
                      const buildingLayers = ['3d-buildings', 'buildings-3d-layer', 'osm-buildings-3d', 'harbor-buildings-3d'];

                      buildingLayers.forEach(layerId => {
                        if (map.current.getLayer(layerId)) {
                          map.current.setLayoutProperty(layerId, 'visibility', newVisibility);
                        }
                      });
                    }

                    // Update the layer state manager directly
                    if (window.layerStateManager) {
                      window.layerStateManager.updateLayerState('show3DBuildings', newState);
                    }
                  }

                  // Log the state after update
                  setTimeout(() => {
                    if (window.layerStateManager) {
                      const currentState = window.layerStateManager.getAllLayerStates().show3DBuildings;
                      console.log(`3D Buildings state after toggle: ${currentState}`);
                    }
                  }, 100);
                }}
              />
              <span></span>
            </ToggleSwitch>
          </CategoryHeader>
        </CategorySection>
      </LayerToggleContainer>

      <ExpandButton
        onClick={() => setIsLayerMenuCollapsed(false)}
        $isCollapsed={isLayerMenuCollapsed}
        title="Expand layer menu"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.41 7.41L10.83 12l4.58 4.59L14 18l-6-6 6-6 1.41 1.41z"/>
        </svg>
      </ExpandButton>

      <SceneManager
        map={map.current}
        layerStates={{
          showParks,
          showPOIMarkers,
          showOSMPOIs,
          showBostonBuildings,
          show3DBuildings
        }}
        onLoadScene={(sceneLayerStates) => {
          if (sceneLayerStates.showParks !== undefined) setShowParks(sceneLayerStates.showParks);
          if (sceneLayerStates.showPOIMarkers !== undefined) setShowPOIMarkers(sceneLayerStates.showPOIMarkers);
          if (sceneLayerStates.showOSMPOIs !== undefined) setShowOSMPOIs(sceneLayerStates.showOSMPOIs);
          if (sceneLayerStates.showBostonBuildings !== undefined) setShowBostonBuildings(sceneLayerStates.showBostonBuildings);
          if (sceneLayerStates.show3DBuildings !== undefined) setShow3DBuildings(sceneLayerStates.show3DBuildings);
        }}
        isOpen={isSceneSidebarOpen}
        onClose={() => setIsSceneSidebarOpen(false)}
      />
    </>
  );
};

export default LayerToggle;