import React, { useState } from 'react';
import styled from 'styled-components';
import { osmLayerIds, loadOSMData, toggleOSMLayer } from '../utils/osmLayers';
import * as turf from '@turf/turf';
import NeighborhoodBoundaries from './NeighborhoodBoundaries';
import PlanningAnalysisLayer from './PlanningAnalysisLayer';
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
  setShowNeighborhoodBoundaries
}) => {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [neighborhoodMarkers, setNeighborhoodMarkers] = useState(null);
  const [planningData, setPlanningData] = useState(null);

  const {
    showOSMTransit,
    showOSMBike,
    showOSMPedestrian,
    searchTerm,
    expandedCategories,
    is3DLoading,
    setSearchTerm,
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

        <SearchInput
          type="text"
          placeholder="Search layers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

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

        {/* Pedestrian Network */}
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
          <CategoryHeader>
            <CategoryIcon><LayerIcons.Neighborhood /></CategoryIcon>
            <CategoryTitle>Neighborhood Boundaries</CategoryTitle>
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
            <NeighborhoodBoundaries 
              map={map} 
              visible={showNeighborhoodBoundaries}
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

                setSelectedNeighborhood(neighborhoodData);
                setNeighborhoodMarkers({
                  adaptiveReuse: neighborhoodData.adaptiveReuse,
                  development: neighborhoodData.development
                });
              }}
            />
          )}
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

      <NeighborhoodPopup
        selectedNeighborhood={selectedNeighborhood}
        neighborhoodMarkers={neighborhoodMarkers}
        onClose={() => {
          setSelectedNeighborhood(null);
          setNeighborhoodMarkers(null);
        }}
      />
    </>
  );
};

export default LayerToggle; 