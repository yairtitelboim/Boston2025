import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { osmLayerIds, loadOSMData, toggleOSMLayer } from '../utils/osmLayers';
import * as turf from '@turf/turf';
import NeighborhoodBoundaries from './NeighborhoodBoundaries';
import PlanningAnalysisLayer from './PlanningAnalysisLayer';
import PropertyPricesLayer from './PropertyPricesLayer';
import EmploymentLayer from './EmploymentLayer';
import { SidePopup } from './SidePopup';
import { LayerIcons } from './icons/LayerIcons';
import { useLayerToggles } from '../hooks/useLayerToggles';
import { use3DBuildings } from '../hooks/use3DBuildings';
import { NeighborhoodPopup } from './NeighborhoodPopup';
import { COLORS, TRANSPORTATION_CATEGORIES } from '../constants/layerConstants';
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

// Array of Mapbox green spaces layers
const parkLayers = [
  'park',
  'park-label',
  'national-park',
  'golf-course',
  'pitch',
  'grass'
];

// More specific filter for natural areas that are actually parks
const naturalParkFilter = [
  'any',
  ['==', ['get', 'class'], 'park'],
  ['==', ['get', 'class'], 'garden'],
  ['==', ['get', 'class'], 'forest'],
  ['==', ['get', 'class'], 'wood']
];

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
  setShowLocalZoneLabels
}) => {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [neighborhoodMarkers, setNeighborhoodMarkers] = useState(null);
  const [planningData, setPlanningData] = useState(null);
  const [isSceneSidebarOpen, setIsSceneSidebarOpen] = useState(false);

  const {
    showOSMTransit,
    showOSMBike,
    showOSMPedestrian,
    expandedCategories,
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
    reset3DBuildings
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
    if (!map.current) return;
    
    parkLayers.forEach(layerId => {
      if (map.current.getLayer(layerId)) {
        try {
          // Set visibility
          map.current.setLayoutProperty(
            layerId,
            'visibility',
            visible ? 'visible' : 'none'
          );
          
          // Set color for fill layers
          const layer = map.current.getLayer(layerId);
          if (layer && layer.type === 'fill') {
            map.current.setPaintProperty(
              layerId, 
              'fill-color', 
              visible ? '#2a9d2a' : '#050f08'
            );
            map.current.setPaintProperty(
              layerId, 
              'fill-opacity', 
              visible ? 0.45 : 0.3
            );
          }
          
          // Handle symbol layers with background color
          if (layer && layer.type === 'symbol' && 
              map.current.getPaintProperty(layerId, 'background-color') !== undefined) {
            map.current.setPaintProperty(
              layerId, 
              'background-color', 
              visible ? '#2a9d2a' : '#050f08'
            );
          }
        } catch (error) {
          console.warn(`Could not style park layer ${layerId}:`, error);
        }
      }
    });
    
    // Apply filter to the 'natural' layer if it exists to only show park-like natural areas
    if (map.current.getLayer('natural')) {
      try {
        if (visible) {
          // Store the original filter if we haven't stored it yet
          if (!map.current._originalNaturalFilter) {
            map.current._originalNaturalFilter = map.current.getFilter('natural') || ['all'];
          }
          
          // Apply our custom filter for natural areas that are parks
          map.current.setFilter('natural', ['all', 
            map.current._originalNaturalFilter,
            naturalParkFilter
          ]);
          
          // Set visibility and style
          map.current.setLayoutProperty('natural', 'visibility', 'visible');
          map.current.setPaintProperty('natural', 'fill-color', '#2a9d2a');
          map.current.setPaintProperty('natural', 'fill-opacity', 0.45);
        } else {
          // Restore original filter and style
          if (map.current._originalNaturalFilter) {
            map.current.setFilter('natural', map.current._originalNaturalFilter);
          }
          map.current.setLayoutProperty('natural', 'visibility', 'none');
          map.current.setPaintProperty('natural', 'fill-color', '#050f08');
          map.current.setPaintProperty('natural', 'fill-opacity', 0.3);
        }
      } catch (error) {
        console.warn('Could not filter natural layer:', error);
      }
    }
  };

  // Effect to handle park layers visibility when showParks changes
  useEffect(() => {
    toggleParkLayers(showParks);
  }, [showParks]);

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

        {/* Pedestrian Network - Moved to top */}
        <CategorySection>
          <CategoryHeader 
            onClick={() => toggleCategory('pedestrianNetwork')}
            $isExpanded={expandedCategories.pedestrianNetwork}
          >
            <CategoryIcon><LayerIcons.Pedestrian /></CategoryIcon>
            <CategoryTitle>Pedestrian Network</CategoryTitle>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={showOSMPedestrian}
                onChange={() => handleOSMPedestrianToggle(!showOSMPedestrian)}
              />
              <span></span>
            </ToggleSwitch>
          </CategoryHeader>

          <SubLayerContainer $isVisible={expandedCategories.pedestrianNetwork && showOSMPedestrian}>
            <SubLayer>
              <span>Walking Paths</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={showPedestrianPaths}
                  onChange={() => {
                    const newState = !showPedestrianPaths;
                    setShowPedestrianPaths(newState);
                    toggleOSMLayer(map.current, 'pedestrian', 'paths', newState && showOSMPedestrian, COLORS.pedestrian);
                  }}
                />
                <span></span>
              </ToggleSwitch>
            </SubLayer>
            
            <SubLayer>
              <span>Crossings</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={showPedestrianCrossings}
                  onChange={() => {
                    const newState = !showPedestrianCrossings;
                    setShowPedestrianCrossings(newState);
                    toggleOSMLayer(map.current, 'pedestrian', 'crossings', newState && showOSMPedestrian, COLORS.pedestrian);
                  }}
                />
                <span></span>
              </ToggleSwitch>
            </SubLayer>
          </SubLayerContainer>
        </CategorySection>

        {/* Public Transit Section */}
        <CategorySection>
          <CategoryHeader 
            onClick={() => toggleCategory('publicTransit')}
            $isExpanded={expandedCategories.publicTransit}
          >
            <CategoryIcon><LayerIcons.Transit /></CategoryIcon>
            <CategoryTitle>Public Transit</CategoryTitle>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={showOSMTransit}
                onChange={() => handleOSMTransitToggle(!showOSMTransit)}
              />
              <span></span>
            </ToggleSwitch>
          </CategoryHeader>

          <SubLayerContainer $isVisible={expandedCategories.publicTransit && showOSMTransit}>
            <SubLayer>
              <span>Transit Stops</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={showTransitStops}
                  onChange={() => {
                    const newState = !showTransitStops;
                    setShowTransitStops(newState);
                    toggleOSMLayer(map.current, 'publicTransit', 'stops', newState && showOSMTransit, COLORS.transit);
                  }}
                />
                <span></span>
              </ToggleSwitch>
            </SubLayer>
            
            <SubLayer>
              <span>Transit Routes</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={showTransitRoutes}
                  onChange={() => {
                    const newState = !showTransitRoutes;
                    setShowTransitRoutes(newState);
                    toggleOSMLayer(map.current, 'publicTransit', 'routes', newState && showOSMTransit, COLORS.transit);
                  }}
                />
                <span></span>
              </ToggleSwitch>
            </SubLayer>
          </SubLayerContainer>
        </CategorySection>

        {/* Bike Network Section */}
        <CategorySection>
          <CategoryHeader 
            onClick={() => toggleCategory('bikeNetwork')}
            $isExpanded={expandedCategories.bikeNetwork}
          >
            <CategoryIcon><LayerIcons.Bike /></CategoryIcon>
            <CategoryTitle>Bike Network</CategoryTitle>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={showOSMBike}
                onChange={() => handleOSMBikeToggle(!showOSMBike)}
              />
              <span></span>
            </ToggleSwitch>
          </CategoryHeader>

          <SubLayerContainer $isVisible={expandedCategories.bikeNetwork && showOSMBike}>
            <SubLayer>
              <span>Bike Lanes</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={showBikeLanes}
                  onChange={() => {
                    const newState = !showBikeLanes;
                    setShowBikeLanes(newState);
                    toggleOSMLayer(map.current, 'bikeInfra', 'lanes', newState && showOSMBike, COLORS.bike);
                  }}
                />
                <span></span>
              </ToggleSwitch>
            </SubLayer>
            
            <SubLayer>
              <span>Dedicated Paths</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={showBikePaths}
                  onChange={() => {
                    const newState = !showBikePaths;
                    setShowBikePaths(newState);
                    toggleOSMLayer(map.current, 'bikeInfra', 'paths', newState && showOSMBike, COLORS.bike);
                  }}
                />
                <span></span>
              </ToggleSwitch>
            </SubLayer>
            
            <SubLayer>
              <span>Bike Parking</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={showBikeParking}
                  onChange={() => {
                    const newState = !showBikeParking;
                    setShowBikeParking(newState);
                    toggleOSMLayer(map.current, 'bikeInfra', 'parking', newState && showOSMBike, COLORS.bike);
                  }}
                />
                <span></span>
              </ToggleSwitch>
            </SubLayer>
          </SubLayerContainer>
        </CategorySection>

        {/* Transportation Network */}
        <CategorySection>
          <CategoryHeader 
            onClick={() => toggleCategory('transportation')}
            $isExpanded={expandedCategories.transportation}
          >
            <CategoryIcon><LayerIcons.Transportation /></CategoryIcon>
            <CategoryTitle>Transportation Network</CategoryTitle>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={showTransportation}
                onChange={() => {
                  const newState = !showTransportation;
                  setShowTransportation(newState);
                  if (!newState) {
                    setShowRoads(false);
                  }
                  handleToggle('roads', TRANSPORTATION_CATEGORIES.roads, COLORS.roads, newState);
                }}
              />
              <span></span>
            </ToggleSwitch>
          </CategoryHeader>

          <SubLayerContainer $isVisible={expandedCategories.transportation && showTransportation}>
            <SubLayer>
              <span>Roads</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={showRoads}
                  onChange={() => {
                    const newState = !showRoads;
                    setShowRoads(newState);
                    handleToggle('roads', TRANSPORTATION_CATEGORIES.roads, COLORS.roads, newState);
                  }}
                />
                <span></span>
              </ToggleSwitch>
            </SubLayer>
          </SubLayerContainer>
        </CategorySection>

        {/* Zoning Data Section */}
        <CategorySection>
          <CategoryHeader>
            <CategoryIcon><LayerIcons.Zoning /></CategoryIcon>
            <CategoryTitle>Zoning Data</CategoryTitle>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={showZoningLayer}
                onChange={() => {
                  const newState = !showZoningLayer;
                  setShowZoningLayer(newState);
                  
                  if (!newState && map.current) {
                    map.current.setPaintProperty('background', 'background-color', '#111111');
                    map.current.setPaintProperty('water', 'fill-color', '#222222');
                    map.current.setPaintProperty('land', 'background-color', '#111111');
                    
                    ['road-primary', 'road-secondary', 'road-street'].forEach(layer => {
                      if (map.current.getLayer(layer)) {
                        map.current.setPaintProperty(layer, 'line-color', '#333333');
                      }
                    });
                  }
                }}
              />
              <span></span>
            </ToggleSwitch>
          </CategoryHeader>
        </CategorySection>

        {/* Planning Analysis */}
        <CategorySection>
          <CategoryHeader 
            onClick={() => toggleCategory('planning')}
            $isExpanded={expandedCategories.planning}
          >
            <CategoryIcon><LayerIcons.Planning /></CategoryIcon>
            <CategoryTitle>Planning Analysis</CategoryTitle>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={showPlanningAnalysis}
                onChange={() => setShowPlanningAnalysis(!showPlanningAnalysis)}
              />
              <span></span>
            </ToggleSwitch>
          </CategoryHeader>

          <SubLayerContainer $isVisible={expandedCategories.planning && showPlanningAnalysis}>
            <PlanningAnalysisLayer
              map={map}
              showAdaptiveReuse={showAdaptiveReuse}
              showDevelopmentPotential={showDevelopmentPotential}
              onDataLoaded={handlePlanningDataLoaded}
            />
            <SubLayer>
              <span>Adaptive Reuse</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={showAdaptiveReuse}
                  onChange={() => {
                    setShowAdaptiveReuse(!showAdaptiveReuse);
                    map.current.setLayoutProperty(
                      'adaptive-reuse-layer',
                      'visibility',
                      !showAdaptiveReuse ? 'visible' : 'none'
                    );
                  }}
                />
                <span></span>
              </ToggleSwitch>
            </SubLayer>
            
            <SubLayer>
              <span>Development Areas</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={showDevelopmentPotential}
                  onChange={() => {
                    setShowDevelopmentPotential(!showDevelopmentPotential);
                    map.current.setLayoutProperty(
                      'development-potential-layer',
                      'visibility',
                      !showDevelopmentPotential ? 'visible' : 'none'
                    );
                  }}
                />
                <span></span>
              </ToggleSwitch>
            </SubLayer>
          </SubLayerContainer>
        </CategorySection>

        {/* 3D Buildings */}
        <CategorySection>
          <CategoryHeader>
            <CategoryIcon><LayerIcons.Buildings /></CategoryIcon>
            <CategoryTitle>3D Buildings</CategoryTitle>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={show3DBuildings}
                  onChange={toggle3D}
                  disabled={is3DLoading}
                />
                <span></span>
              </ToggleSwitch>
              <button
                onClick={reset3DBuildings}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff4444',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '12px',
                  opacity: 0.7
                }}
                title="Reset 3D buildings"
              >
                Reset
              </button>
            </div>
          </CategoryHeader>
          {is3DLoading && (
            <div style={{ 
              padding: '8px 12px', 
              color: '#fff', 
              fontSize: '12px',
              opacity: 0.7
            }}>
              Loading 3D buildings...
            </div>
          )}
        </CategorySection>

        {/* Neighborhood Boundaries */}
        <CategorySection>
          <CategoryHeader 
            onClick={() => toggleCategory('neighborhoods')}
            $isExpanded={expandedCategories.neighborhoods}
          >
            <CategoryIcon><LayerIcons.Neighborhood /></CategoryIcon>
            <CategoryTitle>Policy Initiatives</CategoryTitle>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={showNeighborhoodBoundaries}
                onChange={() => {
                  console.log('\n=== Toggling Neighborhood Boundaries ===');
                  console.log('Current state:', showNeighborhoodBoundaries);
                  console.log('New state:', !showNeighborhoodBoundaries);
                  setShowNeighborhoodBoundaries(!showNeighborhoodBoundaries);
                }}
              />
              <span></span>
            </ToggleSwitch>
          </CategoryHeader>
          
          {showNeighborhoodBoundaries && (
            <>
              <SubLayerContainer $isVisible={expandedCategories.neighborhoods && showNeighborhoodBoundaries}>
                <SubLayer>
                  <span>Boundary Labels</span>
                  <ToggleSwitch>
                    <input
                      type="checkbox"
                      checked={showNeighborhoodLabels}
                      onChange={() => setShowNeighborhoodLabels(!showNeighborhoodLabels)}
                    />
                    <span></span>
                  </ToggleSwitch>
                </SubLayer>
              </SubLayerContainer>
              
              <NeighborhoodBoundaries 
                map={map} 
                visible={showNeighborhoodBoundaries}
                showLabels={showNeighborhoodLabels}
                planningData={planningData}
                onNeighborhoodClick={(neighborhoodData) => {
                  console.log('\n=== Neighborhood Click ===');
                  console.log('Neighborhood:', neighborhoodData.name);
                  console.log('Total markers:', neighborhoodData.markerCount);
                  console.log('Adaptive reuse markers:', neighborhoodData.adaptiveReuse.length);
                  console.log('Development markers:', neighborhoodData.development.length);

                  const center = turf.center(neighborhoodData.geometry);
                  map.current.flyTo({
                    center: center.geometry.coordinates,
                    zoom: 12,
                    duration: 1000
                  });
                  
                  // Instead of setting state for the NeighborhoodPopup, send to AIChatPanel
                  if (window.setAIChatPanelMessages) {
                    // Open the AIChatPanel if it's collapsed
                    if (window.setAIChatPanelCollapsed) {
                      window.setAIChatPanelCollapsed(false);
                    }
                    
                    // Call the new function to handle neighborhood selection
                    handleNeighborhoodSelection(neighborhoodData, window.setAIChatPanelMessages);
                  } else {
                    console.warn('AIChatPanel message setter not available, falling back to popup');
                    // Fallback to original behavior if AIChatPanel integration is not available
                    setSelectedNeighborhood(neighborhoodData);
                    setNeighborhoodMarkers({
                      adaptiveReuse: neighborhoodData.adaptiveReuse,
                      development: neighborhoodData.development
                    });
                  }
                }}
              />
            </>
          )}
        </CategorySection>

        {/* Property Prices Section */}
        <CategorySection>
          <CategoryHeader 
            onClick={() => toggleCategory('propertyPrices')}
            $isExpanded={expandedCategories.propertyPrices}
          >
            <CategoryIcon><LayerIcons.Property /></CategoryIcon>
            <CategoryTitle>Property Prices</CategoryTitle>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={showPropertyPrices}
                onChange={() => setShowPropertyPrices(!showPropertyPrices)}
              />
              <span></span>
            </ToggleSwitch>
          </CategoryHeader>
        </CategorySection>

        {/* Parks Section */}
        <CategorySection>
          <CategoryHeader 
            onClick={() => toggleCategory('parks')}
            $isExpanded={expandedCategories.parks}
          >
            <CategoryIcon><LayerIcons.Nature /></CategoryIcon>
            <CategoryTitle>Parks</CategoryTitle>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={showParks}
                onChange={() => setShowParks(!showParks)}
              />
              <span></span>
            </ToggleSwitch>
          </CategoryHeader>
        </CategorySection>

        {/* Employment Clusters Section */}
        <CategorySection>
          <CategoryHeader 
            onClick={() => toggleCategory('employment')}
            $isExpanded={expandedCategories.employment}
          >
            <CategoryIcon><LayerIcons.Business /></CategoryIcon>
            <CategoryTitle>Employment Clusters</CategoryTitle>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={showEmployment}
                onChange={() => setShowEmployment(!showEmployment)}
              />
              <span></span>
            </ToggleSwitch>
          </CategoryHeader>

          <SubLayerContainer $isVisible={expandedCategories.employment && showEmployment}>
            <SubLayer>
              <span>Business Districts</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={showEmployment}
                  onChange={() => {
                    const newState = !showEmployment;
                    setShowEmployment(newState);
                  }}
                />
                <span></span>
              </ToggleSwitch>
            </SubLayer>

            <SubLayer>
              <span>Employment Labels</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={showEmploymentLabels}
                  onChange={() => setShowEmploymentLabels(!showEmploymentLabels)}
                />
                <span></span>
              </ToggleSwitch>
            </SubLayer>
          </SubLayerContainer>
        </CategorySection>

        {/* Local Zones Section */}
        <CategorySection>
          <CategoryHeader 
            onClick={() => toggleCategory('localZones')}
            $isExpanded={expandedCategories.localZones}
          >
            <CategoryIcon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11m16-11v11"/>
              </svg>
            </CategoryIcon>
            <CategoryTitle>Local Zones</CategoryTitle>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={showLocalZones}
                onChange={() => setShowLocalZones(!showLocalZones)}
              />
              <span></span>
            </ToggleSwitch>
          </CategoryHeader>

          <SubLayerContainer $isVisible={expandedCategories.localZones && showLocalZones}>
            <SubLayer>
              <span>Zone Boundaries</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={showLocalZoneBoundaries}
                  onChange={() => setShowLocalZoneBoundaries(!showLocalZoneBoundaries)}
                />
                <span></span>
              </ToggleSwitch>
            </SubLayer>

            <SubLayer>
              <span>Zone Labels</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={showLocalZoneLabels}
                  onChange={() => setShowLocalZoneLabels(!showLocalZoneLabels)}
                />
                <span></span>
              </ToggleSwitch>
            </SubLayer>
          </SubLayerContainer>
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
          showZoningLayer,
          showPlanningAnalysis,
          showAdaptiveReuse,
          showDevelopmentPotential,
          showTransportation,
          showRoads,
          showNeighborhoodBoundaries, 
          showNeighborhoodLabels,
          showPropertyPrices,
          show3DBuildings,
          showPublicTransit: showOSMTransit,
          showOSMTransit,
          showTransitStops,
          showTransitRoutes,
          showBikeInfra: showOSMBike,
          showOSMBike,
          showBikeLanes,
          showBikePaths,
          showBikeParking,
          showPedestrian: showOSMPedestrian,
          showOSMPedestrian,
          showPedestrianPaths,
          showPedestrianCrossings,
          showParks,
          showEmployment,
          showEmploymentLabels,
          showLocalZones,
          showLocalZoneBoundaries,
          showLocalZoneLabels
        }}
        onLoadScene={(sceneLayerStates) => {
          // Handle loading scene layer states
          if (sceneLayerStates.showZoningLayer !== undefined) setShowZoningLayer(sceneLayerStates.showZoningLayer);
          if (sceneLayerStates.showPlanningAnalysis !== undefined) setShowPlanningAnalysis(sceneLayerStates.showPlanningAnalysis);
          if (sceneLayerStates.showAdaptiveReuse !== undefined) setShowAdaptiveReuse(sceneLayerStates.showAdaptiveReuse);
          if (sceneLayerStates.showDevelopmentPotential !== undefined) setShowDevelopmentPotential(sceneLayerStates.showDevelopmentPotential);
          if (sceneLayerStates.showTransportation !== undefined) setShowTransportation(sceneLayerStates.showTransportation);
          if (sceneLayerStates.showRoads !== undefined) setShowRoads(sceneLayerStates.showRoads);
          if (sceneLayerStates.showNeighborhoodBoundaries !== undefined) setShowNeighborhoodBoundaries(sceneLayerStates.showNeighborhoodBoundaries);
          if (sceneLayerStates.showNeighborhoodLabels !== undefined) setShowNeighborhoodLabels(sceneLayerStates.showNeighborhoodLabels);
          if (sceneLayerStates.showPropertyPrices !== undefined) setShowPropertyPrices(sceneLayerStates.showPropertyPrices);
          if (sceneLayerStates.showBikeInfra !== undefined) handleOSMBikeToggle(sceneLayerStates.showOSMBike);
          if (sceneLayerStates.showPublicTransit !== undefined) handleOSMTransitToggle(sceneLayerStates.showOSMTransit);
          if (sceneLayerStates.showPedestrian !== undefined) handleOSMPedestrianToggle(sceneLayerStates.showOSMPedestrian);
          if (sceneLayerStates.showParks !== undefined) setShowParks(sceneLayerStates.showParks);
          if (sceneLayerStates.showEmployment !== undefined) setShowEmployment(sceneLayerStates.showEmployment);
          if (sceneLayerStates.showEmploymentLabels !== undefined) setShowEmploymentLabels(sceneLayerStates.showEmploymentLabels);
          if (sceneLayerStates.showLocalZones !== undefined) setShowLocalZones(sceneLayerStates.showLocalZones);
          if (sceneLayerStates.showLocalZoneBoundaries !== undefined) setShowLocalZoneBoundaries(sceneLayerStates.showLocalZoneBoundaries);
          if (sceneLayerStates.showLocalZoneLabels !== undefined) setShowLocalZoneLabels(sceneLayerStates.showLocalZoneLabels);
          
          // Handle 3D buildings state
          if (sceneLayerStates.show3DBuildings !== undefined) {
            console.log('Restoring 3D buildings state:', sceneLayerStates.show3DBuildings);
            
            // Get current state to check if we need to toggle
            const currentState = show3DBuildings;
            const targetState = sceneLayerStates.show3DBuildings;
            
            if (currentState !== targetState) {
              console.log('3D buildings state needs to change:', currentState, '->', targetState);
              // Call toggle3D from the hook to ensure proper layer setup/visibility
              toggle3D();
            } else {
              console.log('3D buildings state already matches scene:', currentState);
            }
          }
        }}
        isOpen={isSceneSidebarOpen}
        onClose={() => setIsSceneSidebarOpen(false)}
      />

      {/* Only show the popup if AIChatPanel integration failed */}
      {selectedNeighborhood && neighborhoodMarkers && (
        <NeighborhoodPopup
          selectedNeighborhood={selectedNeighborhood}
          neighborhoodMarkers={neighborhoodMarkers}
          onClose={() => {
            setSelectedNeighborhood(null);
            setNeighborhoodMarkers(null);
          }}
        />
      )}

      <PropertyPricesLayer
        map={map}
        showPropertyPrices={showPropertyPrices}
      />

      <EmploymentLayer
        map={map}
        showEmployment={showEmployment}
        showLabels={showEmploymentLabels}
      />
    </>
  );
};

export default LayerToggle; 