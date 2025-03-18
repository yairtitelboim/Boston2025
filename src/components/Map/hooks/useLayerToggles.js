import { useState, useEffect } from 'react';
import { COLORS, TRANSPORTATION_CATEGORIES, DEFAULT_EXPANDED_CATEGORIES } from '../constants/layerConstants';
import { loadOSMData, toggleOSMLayer } from '../utils/osmLayers';
import * as turf from '@turf/turf';

export const useLayerToggles = (map) => {
  // OSM layer states
  const [showOSMTransit, setShowOSMTransit] = useState(false);
  const [showOSMBike, setShowOSMBike] = useState(false);
  const [showOSMPedestrian, setShowOSMPedestrian] = useState(false);

  // Layer visibility states
  const [showTransitStops, setShowTransitStops] = useState(false);
  const [showTransitRoutes, setShowTransitRoutes] = useState(false);
  const [showBikeLanes, setShowBikeLanes] = useState(false);
  const [showBikePaths, setShowBikePaths] = useState(false);
  const [showBikeParking, setShowBikeParking] = useState(false);
  const [showPedestrianPaths, setShowPedestrianPaths] = useState(false);
  const [showPedestrianCrossings, setShowPedestrianCrossings] = useState(false);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(DEFAULT_EXPANDED_CATEGORIES);
  const [is3DLoading, setIs3DLoading] = useState(false);

  // Keep track of modified layers
  const modifiedLayers = new Set();

  // Load OSM data when map is ready
  useEffect(() => {
    if (map.current) {
      loadOSMData(map.current);
    }
  }, [map]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleLayerCategory = (category, layerIds, color, newState) => {
    console.log(`\nToggling ${category} layers:`, layerIds);
    
    const layers = map.current.getStyle().layers;
    let foundAnyLayer = false;

    layerIds.forEach(baseId => {
      const matchingLayers = layers.filter(l => 
        l.id.toLowerCase().includes(baseId.toLowerCase())
      );
      
      matchingLayers.forEach(layer => {
        if (modifiedLayers.has(layer.id)) {
          return;
        }

        try {
          foundAnyLayer = true;
          
          if (layer.type === 'line') {
            const currentColor = map.current.getPaintProperty(layer.id, 'line-color');
            map.current.setPaintProperty(layer.id, 'line-width', newState ? 1 : 0.5);
            map.current.setPaintProperty(layer.id, 'line-color', newState ? color : COLORS.default);
          } else if (layer.type === 'symbol' && layer.id.includes('label')) {
            map.current.setPaintProperty(layer.id, 'text-color', newState ? color : '#666666');
            map.current.setPaintProperty(layer.id, 'text-halo-width', newState ? 2 : 1);
          }
          
          modifiedLayers.add(layer.id);
        } catch (error) {
          console.warn(`Failed to toggle layer ${layer.id}:`, error);
        }
      });
    });

    if (!foundAnyLayer) {
      console.log(`No layers found for ${category}`);
    }
  };

  const handleToggle = (category, layerIds, color, newState) => {
    modifiedLayers.clear();
    toggleLayerCategory(category, layerIds, color, newState);
  };

  const handleOSMTransitToggle = (newState) => {
    setShowOSMTransit(newState);
    
    const transitStates = {
      stops: showTransitStops,
      routes: showTransitRoutes
    };
    
    if (transitStates.stops) {
      toggleOSMLayer(map.current, 'publicTransit', 'stops', newState, COLORS.transit);
    }
    if (transitStates.routes) {
      toggleOSMLayer(map.current, 'publicTransit', 'routes', newState, COLORS.transit);
    }
  };

  const handleOSMBikeToggle = (newState) => {
    setShowOSMBike(newState);
    
    if (showBikeLanes) {
      toggleOSMLayer(map.current, 'bikeInfra', 'lanes', newState, COLORS.bike);
    }
    if (showBikePaths) {
      toggleOSMLayer(map.current, 'bikeInfra', 'paths', newState, COLORS.bike);
    }
    if (showBikeParking) {
      toggleOSMLayer(map.current, 'bikeInfra', 'parking', newState, COLORS.bike);
    }
  };

  const handleOSMPedestrianToggle = (newState) => {
    setShowOSMPedestrian(newState);
    
    const pedestrianStates = {
      paths: showPedestrianPaths,
      crossings: showPedestrianCrossings
    };
    
    if (pedestrianStates.paths) {
      toggleOSMLayer(map.current, 'pedestrian', 'paths', newState, COLORS.pedestrian);
    }
    if (pedestrianStates.crossings) {
      toggleOSMLayer(map.current, 'pedestrian', 'crossings', newState, COLORS.pedestrian);
    }
  };

  return {
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
    searchTerm,
    expandedCategories,
    is3DLoading,
    setSearchTerm,
    setShowTransitStops,
    setShowTransitRoutes,
    setShowBikeLanes,
    setShowBikePaths,
    setShowBikeParking,
    setShowPedestrianPaths,
    setShowPedestrianCrossings,
    toggleCategory,
    handleToggle,
    handleOSMTransitToggle,
    handleOSMBikeToggle,
    handleOSMPedestrianToggle,
    setIs3DLoading
  };
}; 