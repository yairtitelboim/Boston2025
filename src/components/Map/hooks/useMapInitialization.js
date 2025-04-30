import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAP_CONFIG, BOSTON_HARBOR_BOUNDS } from '../constants';
import { formatWaterData, formatAIConsensusData } from '../components/PopupCards';
import { mockDisagreementData } from '../constants/mockData';
import { handlePanelCollapse } from '../hooks/mapAnimations';  // Import the handlePanelCollapse function
import { initializeHarborLayers, updateHarborLighting } from '../utils/harborLayers';

const DEBUG_LOGGING = false;

const log = (...args) => {
  if (DEBUG_LOGGING) {
    console.log(...args);
  }
};

export const useMapInitialization = (map, mapContainer) => {
  useEffect(() => {
    if (!map.current) {
      log('Initializing map...');

      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v10',
          center: [-71.0589, 42.3601],
          zoom: 12,
          pitch: 45,
          bearing: 0
        });

        // Navigation controls removed as requested

        map.current.on('load', () => {
          log('Map load event fired');

          try {
            // Check if style is loaded
            if (map.current.isStyleLoaded()) {
              initializeLayers();
            } else {
              map.current.once('style.load', initializeLayers);
            }
          } catch (error) {
            log('Error during map load:', error);
          }
        });

        const initializeLayers = () => {
          try {
            // Check if layers already exist before adding
            if (!map.current.getLayer('miami-pois')) {
              // Add POI layers
              map.current.addLayer({
                'id': 'miami-pois',
                'type': 'symbol',
                // ... rest of layer config
              });
            }

            // Set default visibility for 3D buildings
            const buildingLayers = ['3d-buildings', 'harbor-buildings-3d'];
            buildingLayers.forEach(layerId => {
              if (map.current.getLayer(layerId)) {
                map.current.setLayoutProperty(layerId, 'visibility', 'none');
              }
            });

            // Add permit census layer
            try {
              console.log('Adding permit census layer directly in useMapInitialization');

              // Add source with pre-generated permit counts
              if (!map.current.getSource('direct-permit-census')) {
                console.log('Loading pre-generated permit census data...');
                fetch('/TrackCount.json')
                  .then(response => response.json())
                  .then(data => {
                    console.log('Loaded permit census data with', data.features.length, 'features');

                    // Find the maximum permit count and check the property fields
                    let maxCount = 0;

                    // Log the first feature's properties to debug
                    if (data.features.length > 0) {
                      console.log('First feature properties:', data.features[0].properties);
                    }

                    data.features.forEach(feature => {
                      const count = feature.properties.permitCount || 0;
                      maxCount = Math.max(maxCount, count);
                    });
                    console.log('Maximum permit count:', maxCount);

                    // Add the source with the data
                    map.current.addSource('direct-permit-census', {
                      type: 'geojson',
                      data: data
                    });

                    // Now add the layers
                    addPermitCensusLayers(maxCount);
                  })
                  .catch(err => {
                    console.error('Error loading permit census data:', err);
                    // Fallback to random data if there's an error
                    console.log('Falling back to random permit counts');
                    loadRandomPermitCounts();
                  });
              } else {
                // If source already exists, just add the layers
                addPermitCensusLayers(100);
              }

              // Fallback function to load random permit counts
              const loadRandomPermitCounts = () => {
                fetch('/boston-census-tracts.geojson')
                  .then(response => response.json())
                  .then(data => {
                    console.log('Loaded census tracts data with', data.features.length, 'features');

                    // Add random permit counts to each tract
                    const maxCount = 100;
                    data.features.forEach((feature, index) => {
                      // Generate random permit count
                      const randomCount = Math.floor(Math.random() * maxCount);
                      feature.properties.permitCount = randomCount;
                      feature.id = index; // Ensure each feature has an ID
                    });

                    // Add the source with the modified data
                    map.current.addSource('direct-permit-census', {
                      type: 'geojson',
                      data: data
                    });

                    // Now add the layers
                    addPermitCensusLayers(maxCount);
                  })
                  .catch(err => {
                    console.error('Error loading census tracts data:', err);
                  });
              };

              // Function to add permit census layers with gradient based on permit count
              const addPermitCensusLayers = (maxCount) => {
                console.log('Adding permit census layers with maxCount:', maxCount);

                // Remove existing layers if they exist
                if (map.current.getLayer('direct-permit-census-fill')) {
                  map.current.removeLayer('direct-permit-census-fill');
                }
                if (map.current.getLayer('direct-permit-census-line')) {
                  map.current.removeLayer('direct-permit-census-line');
                }
                if (map.current.getLayer('direct-permit-census-hover')) {
                  map.current.removeLayer('direct-permit-census-hover');
                }

                // Get permit counts from the source data to calculate percentiles
                let permitCounts = [];
                try {
                  const sourceData = map.current.getSource('direct-permit-census')._data;
                  if (sourceData && sourceData.features) {
                    permitCounts = sourceData.features
                      .map(f => f.properties.permitCount || 0)
                      .filter(count => count > 0)
                      .sort((a, b) => a - b);
                  }
                } catch (err) {
                  console.warn('Could not get permit counts from source data:', err);
                }

                // Calculate gradient stops for a balanced visualization
                // We'll use logarithmic scale for better visualization of the data
                let stops;

                try {
                  // Get all permit counts from the source data
                  const permitCounts = [];
                  try {
                    const sourceData = map.current.getSource('direct-permit-census')._data;
                    if (sourceData && sourceData.features) {
                      sourceData.features.forEach(f => {
                        const count = f.properties.permitCount || 0;
                        if (count > 0) permitCounts.push(count);
                      });
                    }
                  } catch (err) {
                    console.warn('Could not get permit counts from source data:', err);
                  }

                  // Sort the permit counts
                  permitCounts.sort((a, b) => a - b);
                  console.log(`Got ${permitCounts.length} permit counts, range: ${Math.min(...permitCounts)} - ${Math.max(...permitCounts)}`);

                  if (permitCounts.length <= 1) {
                    // If we have no data or all tracts have the same count, use fixed values
                    console.log('Insufficient data, using fixed gradient');
                    stops = {
                      p0: 0,
                      p1: 1,
                      p2: 2,
                      p3: 5,
                      p4: 10,
                      p5: 20,
                      p6: 50,
                      p7: 100,
                      max: Math.max(200, maxCount)
                    };
                  } else {
                    // Use logarithmic scale for better visualization
                    // This works well for data with a wide range of values
                    const logBase = 10;
                    const logMax = Math.log(maxCount) / Math.log(logBase);

                    stops = {
                      p0: 0,
                      p1: Math.pow(logBase, logMax * 0.1), // 10% of max on log scale
                      p2: Math.pow(logBase, logMax * 0.2), // 20% of max on log scale
                      p3: Math.pow(logBase, logMax * 0.3), // 30% of max on log scale
                      p4: Math.pow(logBase, logMax * 0.4), // 40% of max on log scale
                      p5: Math.pow(logBase, logMax * 0.5), // 50% of max on log scale
                      p6: Math.pow(logBase, logMax * 0.7), // 70% of max on log scale
                      p7: Math.pow(logBase, logMax * 0.9), // 90% of max on log scale
                      max: maxCount
                    };

                    // Round the values for cleaner display
                    Object.keys(stops).forEach(key => {
                      if (key !== 'p0' && key !== 'max') {
                        stops[key] = Math.round(stops[key]);
                      }
                    });

                    // Ensure stops are strictly increasing
                    let prevValue = stops.p0;
                    ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'max'].forEach(key => {
                      stops[key] = Math.max(stops[key], prevValue + 1);
                      prevValue = stops[key];
                    });
                  }

                  console.log('Gradient stops:', stops);
                } catch (err) {
                  console.error('Error calculating gradient stops:', err);
                  // Fallback to fixed values
                  stops = {
                    p0: 0,
                    p1: 10,
                    p2: 20,
                    p3: 50,
                    p4: 100,
                    p5: 200,
                    p6: 500,
                    p7: 1000,
                    max: Math.max(2000, maxCount)
                  };
                }

                // Add fill layer with enhanced color gradient based on permit count
                // Use 'beforeId' to ensure it appears below 3D buildings and Boston Buildings layers
                map.current.addLayer({
                  id: 'direct-permit-census-fill',
                  type: 'fill',
                  source: 'direct-permit-census',
                  paint: {
                    'fill-color': [
                      'interpolate',
                      ['linear'],
                      ['get', 'permitCount'],
                      0, 'rgba(50, 50, 50, 0.3)',       // Dark gray for zero permits
                      1, 'rgba(255, 255, 200, 0.5)',    // Very light yellow for 1+ permits
                      9, 'rgba(255, 255, 150, 0.6)',    // Light yellow
                      11, 'rgba(255, 255, 0, 0.65)',    // Yellow
                      20, 'rgba(255, 240, 0, 0.7)',     // Yellow-gold
                      33, 'rgba(255, 220, 0, 0.75)',    // Gold
                      80, 'rgba(255, 255, 0, 0.8)',     // Bright yellow
                      200, 'rgba(255, 255, 50, 0.85)',  // Brighter yellow
                      611, 'rgba(255, 255, 100, 0.9)'   // Brightest vibrant yellow for max
                    ],
                    'fill-opacity': [
                      'interpolate',
                      ['linear'],
                      ['get', 'permitCount'],
                      0, 0.15,   // Very transparent for zero permits
                      1, 0.2,    // Still quite transparent for few permits
                      10, 0.25,  // More visible but still transparent
                      25, 0.3,   // Medium-low opacity
                      50, 0.35,  // Medium opacity
                      100, 0.4,  // Medium-high opacity
                      200, 0.45, // Higher opacity
                      611, 0.5   // Maximum opacity at 50%
                    ]
                  },
                  layout: {
                    visibility: 'none'
                  }
                }, 'building'); // Place below Mapbox's default building layer

                // Add line layer with enhanced color gradient based on permit count
                // Use 'beforeId' to ensure it appears below 3D buildings and Boston Buildings layers
                map.current.addLayer({
                  id: 'direct-permit-census-line',
                  type: 'line',
                  source: 'direct-permit-census',
                  paint: {
                    'line-color': [
                      'interpolate',
                      ['linear'],
                      ['get', 'permitCount'],
                      0, 'rgba(100, 100, 100, 0.5)',    // Gray outline for zero permits
                      1, 'rgba(255, 255, 200, 0.7)',    // Very light yellow outline
                      9, 'rgba(255, 255, 150, 0.8)',    // Light yellow
                      20, 'rgba(255, 255, 0, 0.85)',    // Yellow
                      50, 'rgba(255, 240, 0, 0.9)',     // Yellow-gold
                      100, 'rgba(255, 255, 0, 0.95)',   // Bright yellow
                      200, 'rgba(255, 255, 50, 0.97)',  // Brighter yellow
                      611, 'rgba(255, 255, 150, 1.0)'   // Brightest vibrant yellow for max
                    ],
                    'line-opacity': [
                      'interpolate',
                      ['linear'],
                      ['get', 'permitCount'],
                      0, 0.1,    // Almost invisible for zero permits
                      1, 0.15,   // Very transparent for few permits
                      10, 0.2,   // Still quite transparent
                      25, 0.3,   // Medium-low opacity
                      50, 0.4,   // Medium opacity
                      100, 0.45, // Medium-high opacity
                      200, 0.5,  // Half opacity
                      611, 0.6   // Maximum opacity at 60% for lines
                    ],
                    'line-width': [
                      'interpolate',
                      ['linear'],
                      ['get', 'permitCount'],
                      0, 0.5,    // Thinner line for zero permits
                      1, 0.75,   // Still thin for few permits
                      25, 1.0,   // Medium line
                      100, 1.5,  // Thicker line
                      611, 2.0   // Thickest line for max
                    ]
                  },
                  layout: {
                    visibility: 'none'
                  }
                }, 'building'); // Place below Mapbox's default building layer

                // Add hover effect layer
                // Use 'beforeId' to ensure it appears below 3D buildings and Boston Buildings layers
                map.current.addLayer({
                  id: 'direct-permit-census-hover',
                  type: 'line',
                  source: 'direct-permit-census',
                  paint: {
                    'line-color': 'rgba(255, 255, 255, 1.0)', // White highlight
                    'line-width': 3
                  },
                  layout: {
                    visibility: 'none'
                  },
                  filter: ['==', ['get', 'GEOID'], '']
                }, 'building'); // Place below Mapbox's default building layer

                // Add hover interaction
                map.current.on('mousemove', 'direct-permit-census-fill', (e) => {
                  if (e.features.length > 0) {
                    // Try different possible tract ID fields
                    const feature = e.features[0];
                    const props = feature.properties;

                    // Find a suitable tract identifier
                    let tractId = props.tractId || props.GEOID || props.geoid20 || props.TRACTCE || props.tractce20 || props.OBJECTID || props.objectid || 'Unknown';
                    const permitCount = props.permitCount || 0;

                    // Get a more readable tract name if available
                    const tractName = props.name20 || props.NAME || tractId;

                    // Update the hover layer filter to highlight the hovered tract
                    // Use the same field that was used for the tractId
                    let filterField = 'tractId';
                    if (props.GEOID) filterField = 'GEOID';
                    else if (props.geoid20) filterField = 'geoid20';
                    else if (props.TRACTCE) filterField = 'TRACTCE';
                    else if (props.tractce20) filterField = 'tractce20';
                    else if (props.OBJECTID) filterField = 'OBJECTID';
                    else if (props.objectid) filterField = 'objectid';

                    map.current.setFilter('direct-permit-census-hover', ['==', ['get', filterField], tractId]);
                  }
                });

                map.current.on('mouseleave', 'direct-permit-census-fill', () => {
                  // Reset the hover layer filter - try all possible fields
                  ['tractId', 'GEOID', 'geoid20', 'TRACTCE', 'tractce20', 'OBJECTID', 'objectid'].forEach(field => {
                    try {
                      map.current.setFilter('direct-permit-census-hover', ['==', ['get', field], '']);
                    } catch (err) {
                      // Ignore errors for fields that don't exist
                    }
                  });
                });

                console.log('Permit census layers added successfully');
              };

              console.log('Permit census layer added successfully');

              // Make the permit census layer functions available globally
              window.togglePermitCensusLayer = (visible) => {
                try {
                  console.log(`Setting permit census layer visibility to ${visible ? 'visible' : 'none'}`);
                  map.current.setLayoutProperty('direct-permit-census-fill', 'visibility', visible ? 'visible' : 'none');
                  map.current.setLayoutProperty('direct-permit-census-line', 'visibility', visible ? 'visible' : 'none');
                } catch (err) {
                  console.error('Error toggling permit census layer:', err);
                }
              };

              // Make the toggle functions available globally
              window.togglePermitCensusLayer = (visible) => {
                try {
                  console.log(`[GLOBAL TOGGLE] togglePermitCensusLayer called with visible=${visible}`);

                  // If we're turning on the layer and it doesn't exist yet, reload the data
                  if (visible && (!map.current.getSource('direct-permit-census') || !map.current.getLayer('direct-permit-census-fill'))) {
                    console.log('[GLOBAL TOGGLE] Permit census layer not found, reloading data...');

                    // Remove existing source if it exists
                    if (map.current.getSource('direct-permit-census')) {
                      // Remove all layers that use this source first
                      ['direct-permit-census-fill', 'direct-permit-census-line', 'direct-permit-census-hover'].forEach(layerId => {
                        if (map.current.getLayer(layerId)) {
                          map.current.removeLayer(layerId);
                        }
                      });
                      map.current.removeSource('direct-permit-census');
                    }

                    // Load the data and add the layers
                    fetch('/TrackCount.json')
                      .then(response => response.json())
                      .then(data => {
                        console.log('[GLOBAL TOGGLE] Loaded permit census data with', data.features.length, 'features');

                        // Find the maximum permit count
                        let maxCount = 0;
                        data.features.forEach(feature => {
                          const count = feature.properties.permitCount || 0;
                          maxCount = Math.max(maxCount, count);
                        });
                        console.log('[GLOBAL TOGGLE] Maximum permit count:', maxCount);

                        // Add the source with the data
                        map.current.addSource('direct-permit-census', {
                          type: 'geojson',
                          data: data
                        });

                        // Now add the layers with enhanced color scheme
                        // Make sure to place them below building layers
                        addPermitCensusLayers(maxCount);

                        // Log the data distribution for debugging
                        console.log('[GLOBAL TOGGLE] Permit count distribution:',
                          data.features.reduce((acc, feature) => {
                            const count = feature.properties.permitCount || 0;
                            const bucket = Math.floor(count / 10) * 10;
                            acc[bucket] = (acc[bucket] || 0) + 1;
                            return acc;
                          }, {})
                        );

                        // Set the layers to visible
                        ['direct-permit-census-fill', 'direct-permit-census-line', 'direct-permit-census-hover'].forEach(layerId => {
                          if (map.current.getLayer(layerId)) {
                            map.current.setLayoutProperty(layerId, 'visibility', 'visible');
                          }
                        });

                        // Fly to Boston
                        map.current.flyTo({
                          center: [-71.06, 42.36],
                          zoom: 12,
                          pitch: 0,
                          bearing: 0,
                          duration: 2000
                        });
                      })
                      .catch(err => {
                        console.error('[GLOBAL TOGGLE] Error loading permit census data:', err);
                      });

                    return true;
                  }

                  // Check if the layers exist before trying to update them
                  const layerIds = ['direct-permit-census-fill', 'direct-permit-census-line', 'direct-permit-census-hover'];
                  const visibility = visible ? 'visible' : 'none';

                  layerIds.forEach(layerId => {
                    if (map.current.getLayer(layerId)) {
                      console.log(`[GLOBAL TOGGLE] Setting ${layerId} visibility to ${visibility}`);
                      map.current.setLayoutProperty(layerId, 'visibility', visibility);
                    } else {
                      console.warn(`[GLOBAL TOGGLE] Layer ${layerId} not found`);
                    }
                  });

                  // Fly to Boston if enabling and not already there
                  if (visible) {
                    const center = map.current.getCenter();
                    const zoom = map.current.getZoom();
                    if (Math.abs(center.lng - (-71.06)) > 0.1 || Math.abs(center.lat - 42.36) > 0.1 || zoom < 14) {
                      console.log('[GLOBAL TOGGLE] Flying to Boston');
                      map.current.flyTo({
                        center: [-71.06, 42.36],
                        zoom: 12,
                        pitch: 0,
                        bearing: 0,
                        duration: 2000
                      });
                    }
                  }

                  // Return true to indicate success
                  return true;
                } catch (err) {
                  console.error('[GLOBAL TOGGLE] Error in togglePermitCensusLayer:', err);
                  return false;
                }
              };

              window.setPermitCensusVisible = (visible) => {
                try {
                  console.log(`[GLOBAL SETTER] setPermitCensusVisible called with visible=${visible}`);
                  return window.togglePermitCensusLayer(visible); // Use the same implementation
                } catch (err) {
                  console.error('[GLOBAL SETTER] Error in setPermitCensusVisible:', err);
                  return false;
                }
              };

              // Add a function to check the visibility of the permit census layers
              window.checkPermitCensusVisibility = () => {
                try {
                  const layerIds = ['direct-permit-census-fill', 'direct-permit-census-line', 'direct-permit-census-hover'];
                  const status = {};

                  // Check if source exists
                  status.source = map.current.getSource('direct-permit-census') ? 'exists' : 'not found';

                  // Check layer visibility
                  layerIds.forEach(layerId => {
                    if (map.current.getLayer(layerId)) {
                      status[layerId] = map.current.getLayoutProperty(layerId, 'visibility');
                    } else {
                      status[layerId] = 'layer not found';
                    }
                  });

                  console.log('[VISIBILITY CHECK] Permit census layers status:', status);
                  return status;
                } catch (err) {
                  console.error('[VISIBILITY CHECK] Error checking permit census visibility:', err);
                  return null;
                }
              };

              console.log('Made permit census toggle functions available globally');
            } catch (err) {
              console.error('Error adding permit census layer:', err);
            }

            // Add city budget layer - simplified version
            try {
              console.log('Adding simplified city budget layer directly in useMapInitialization');

              const cityBudgetLayerId = 'city-budget-layer';

              // Use our new GeoJSON file with uplift values
              if (!map.current.getSource(cityBudgetLayerId)) {
                console.log('Loading city budget data from tracts_FY25_normalized.geojson...');

                // Function to set up layers once we have the data
                const setupLayers = (data) => {
                  console.log('Loaded city budget data with', data.features.length, 'features');

                  // Find the min and max values for uplift_val
                  let minUplift = Infinity;
                  let maxUplift = -Infinity;

                  data.features.forEach(feature => {
                    const upliftVal = feature.properties.uplift_val || 0;
                    minUplift = Math.min(minUplift, upliftVal);
                    maxUplift = Math.max(maxUplift, upliftVal);
                  });

                  console.log(`Uplift value range: ${minUplift} to ${maxUplift}`);

                  // Import turf if not already available
                  const turf = window.turf || require('@turf/turf');

                  // Process the data to create 3D extrusions based on uplift values
                  const processedData = {
                    type: 'FeatureCollection',
                    features: []
                  };

                  // Calculate the maximum absolute uplift value for scaling
                  const maxAbsUplift = Math.max(Math.abs(minUplift), Math.abs(maxUplift));

                  // Process each feature to prepare for 3D visualization
                  data.features.forEach(feature => {
                    const upliftVal = feature.properties.uplift_val || 0;
                    const hasReviewPulse = feature.properties.review_pulse || false;

                    // Add the original feature for the base layer
                    processedData.features.push({
                      ...feature,
                      id: feature.id || feature.properties.GEOID
                    });
                  });

                  // Add the source with the processed data
                  map.current.addSource(cityBudgetLayerId, {
                    type: 'geojson',
                    data: processedData
                  });

                  // Add fill-extrusion layer for 3D effect
                  map.current.addLayer({
                    id: `${cityBudgetLayerId}-extrusion`,
                    type: 'fill-extrusion',
                    source: cityBudgetLayerId,
                    paint: {
                      // Color based on uplift value
                      'fill-extrusion-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'uplift_val'],
                        minUplift, 'rgba(244, 67, 54, 0.9)', // Brighter red for negative uplift
                        0, 'rgba(128, 128, 128, 0.15)',      // More translucent gray for zero
                        maxUplift, 'rgba(76, 175, 80, 0.9)'  // Brighter green for positive uplift
                      ],
                      // Fixed height of 4 feet for all extrusions
                      'fill-extrusion-height': 4,
                      'fill-extrusion-base': 0,
                      'fill-extrusion-opacity': 0.6,
                      'fill-extrusion-vertical-gradient': true
                    },
                    layout: {
                      visibility: 'none'
                    }
                  }, 'building'); // Place below Mapbox's default building layer

                  // Add fill layer for 2D view (when 3D is toggled off)
                  map.current.addLayer({
                    id: `${cityBudgetLayerId}-fill`,
                    type: 'fill',
                    source: cityBudgetLayerId,
                    paint: {
                      'fill-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'uplift_val'],
                        minUplift, 'rgba(244, 67, 54, 0.9)', // Brighter red for negative uplift
                        0, 'rgba(128, 128, 128, 0.15)',      // More translucent gray for zero
                        maxUplift, 'rgba(76, 175, 80, 0.9)'  // Brighter green for positive uplift
                      ],
                      'fill-opacity': 0.6
                    },
                    layout: {
                      visibility: 'none'
                    }
                  }, 'building'); // Place below Mapbox's default building layer

                  // Add line layer to highlight tracts with review pulse
                  map.current.addLayer({
                    id: `${cityBudgetLayerId}-line`,
                    type: 'line',
                    source: cityBudgetLayerId,
                    paint: {
                      'line-color': [
                        'case',
                        ['boolean', ['get', 'review_pulse'], false],
                        'rgba(76, 175, 80, 1.0)', // Green for tracts with review pulse
                        'rgba(0, 0, 0, 0)'        // Transparent for others
                      ],
                      'line-width': [
                        'case',
                        ['boolean', ['get', 'review_pulse'], false],
                        3, // Thicker for review pulse tracts
                        0  // No line for others
                      ],
                      'line-opacity': 1.0,
                      'line-dasharray': [3, 2] // Dashed line for more visibility
                    },
                    layout: {
                      visibility: 'none'
                    }
                  }, 'building'); // Place below Mapbox's default building layer

                  // Add a special glow effect for review pulse tracts
                  map.current.addLayer({
                    id: `${cityBudgetLayerId}-pulse-glow`,
                    type: 'fill-extrusion',
                    source: cityBudgetLayerId,
                    filter: ['==', ['get', 'review_pulse'], true],
                    paint: {
                      'fill-extrusion-color': 'rgba(76, 175, 80, 0.3)',
                      'fill-extrusion-height': 5, // Slightly higher than the main extrusion
                      'fill-extrusion-base': 0,
                      'fill-extrusion-opacity': 0.4,
                      'fill-extrusion-vertical-gradient': true
                    },
                    layout: {
                      visibility: 'none'
                    }
                  }, 'building');

                  // Add hover outline layer
                  map.current.addLayer({
                    id: `${cityBudgetLayerId}-hover`,
                    type: 'line',
                    source: cityBudgetLayerId,
                    paint: {
                      'line-color': 'rgba(255, 255, 255, 1.0)', // White for hover
                      'line-width': 4,
                      'line-opacity': 1.0
                    },
                    layout: {
                      visibility: 'none'
                    },
                    filter: ['==', ['get', 'GEOID'], '']
                  }, 'building');

                  // Add 3D hover effect layer
                  map.current.addLayer({
                    id: `${cityBudgetLayerId}-hover-3d`,
                    type: 'fill-extrusion',
                    source: cityBudgetLayerId,
                    paint: {
                      'fill-extrusion-color': 'rgba(255, 255, 255, 0.3)', // White glow for hover
                      'fill-extrusion-height': 6, // Slightly higher than other extrusions for visibility
                      'fill-extrusion-base': 0,
                      'fill-extrusion-opacity': 0.6,
                      'fill-extrusion-vertical-gradient': true
                    },
                    layout: {
                      visibility: 'none'
                    },
                    filter: ['==', ['get', 'GEOID'], '']
                  }, 'building');

                  // Add hover interaction for both 2D and 3D layers
                  const hoverLayers = [`${cityBudgetLayerId}-fill`, `${cityBudgetLayerId}-extrusion`];

                  hoverLayers.forEach(layerId => {
                    map.current.on('mousemove', layerId, (e) => {
                      if (e.features.length > 0) {
                        const feature = e.features[0];
                        const props = feature.properties;

                        // Find a suitable tract identifier
                        let tractId = props.GEOID || 'Unknown';

                        // Get values for popup
                        const baseline = props.baseline_val || 0;
                        const actual = props.actual_24_val || 0;
                        const uplift = props.uplift_val || 0;
                        const reviewPulse = props.review_pulse ? 'Yes' : 'No';

                        // Update the hover layer filters to highlight the hovered tract
                        map.current.setFilter(`${cityBudgetLayerId}-hover`, ['==', ['get', 'GEOID'], tractId]);
                        map.current.setFilter(`${cityBudgetLayerId}-hover-3d`, ['==', ['get', 'GEOID'], tractId]);

                        // Show popup
                        if (map.current._cityBudgetPopup) {
                          map.current._cityBudgetPopup.remove();
                        }

                        // Determine if uplift is positive or negative for styling
                        const isPositiveUplift = uplift >= 0;
                        const upliftColor = isPositiveUplift ? '#4CAF50' : '#F44336'; // Green for positive, Red for negative
                        // Use a colored circle div instead of emoji for better control
                        const pulseColor = reviewPulse === 'Yes' ? '#4CAF50' : '#FFFFFF'; // Green for pulse, white for no pulse

                        const popup = new mapboxgl.Popup({
                          closeButton: false,
                          closeOnClick: false,
                          className: 'city-budget-popup',
                          maxWidth: '180px' // Smaller width for the popup
                        })
                          .setLngLat(e.lngLat)
                          .setHTML(`
                            <div style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
                                        padding: 8px;
                                        background-color: rgba(0,0,0,0.85);
                                        color: white;
                                        border-radius: 4px;
                                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                              <div style="display: flex; align-items: center; margin-bottom: 3px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 3px;">
                                <span style="font-size: 12px; font-weight: 600;">Tract ${tractId.slice(-5)}</span>
                                <div style="margin-left: auto; width: 10px; height: 10px; border-radius: 50%; background-color: ${pulseColor}; border: 1px solid rgba(255,255,255,0.5);"></div>
                              </div>

                              <div style="display: flex; align-items: center; margin-top: 4px; justify-content: space-between; width: 100%;">
                                <div style="width: 25%; text-align: center; padding: 3px 0;">
                                  <div style="font-size: 9px; opacity: 0.7; margin-bottom: 2px;">BASELINE</div>
                                  <div style="font-size: 12px; font-weight: 600;">$${(baseline/1000000).toFixed(1)}M</div>
                                </div>

                                <div style="width: 25%; text-align: center; padding: 3px 0; margin: 0 12px;">
                                  <div style="font-size: 9px; opacity: 0.7; margin-bottom: 2px;">ACTUAL</div>
                                  <div style="font-size: 12px; font-weight: 600;">$${(actual/1000000).toFixed(1)}M</div>
                                </div>

                                <div style="width: 25%; text-align: center; padding: 3px 0;">
                                  <div style="font-size: 9px; opacity: 0.7; margin-bottom: 2px;">UPLIFT</div>
                                  <div style="font-size: 12px; font-weight: 600; color: ${upliftColor};">
                                    $${(uplift/1000000).toFixed(1)}M
                                  </div>
                                </div>
                              </div>
                            </div>
                          `)
                          .addTo(map.current);

                        map.current._cityBudgetPopup = popup;
                      }
                    });
                  });

                  // Handle mouseleave for both 2D and 3D layers
                  hoverLayers.forEach(layerId => {
                    map.current.on('mouseleave', layerId, () => {
                      // Reset the hover layer filters
                      map.current.setFilter(`${cityBudgetLayerId}-hover`, ['==', ['get', 'GEOID'], '']);
                      map.current.setFilter(`${cityBudgetLayerId}-hover-3d`, ['==', ['get', 'GEOID'], '']);

                      // Remove popup
                      if (map.current._cityBudgetPopup) {
                        map.current._cityBudgetPopup.remove();
                        map.current._cityBudgetPopup = null;
                      }
                    });
                  });

                  console.log('City budget layers added successfully');

                  // Make the toggle function available globally
                  window.toggleCityBudgetLayer = (visible) => {
                    try {
                      console.log(`[GLOBAL TOGGLE] toggleCityBudgetLayer called with visible=${visible}`);

                      // Check if the layers exist before trying to update them
                      const layerIds = [
                        `${cityBudgetLayerId}-fill`,
                        `${cityBudgetLayerId}-line`,
                        `${cityBudgetLayerId}-hover`,
                        `${cityBudgetLayerId}-hover-3d`,
                        `${cityBudgetLayerId}-extrusion`,
                        `${cityBudgetLayerId}-pulse-glow`
                      ];
                      const visibility = visible ? 'visible' : 'none';

                      layerIds.forEach(layerId => {
                        if (map.current.getLayer(layerId)) {
                          console.log(`[GLOBAL TOGGLE] Setting ${layerId} visibility to ${visibility}`);
                          map.current.setLayoutProperty(layerId, 'visibility', visibility);
                        } else {
                          console.warn(`[GLOBAL TOGGLE] Layer ${layerId} not found`);
                        }
                      });

                      // If turning on, adjust the camera for a better 3D view and set extrusion height
                      if (visible) {
                        // Set a higher pitch to see the 3D effect
                        const center = map.current.getCenter();
                        const zoom = map.current.getZoom();

                        if (Math.abs(center.lng - (-71.06)) > 0.1 || Math.abs(center.lat - 42.36) > 0.1 || zoom < 14) {
                          console.log('[GLOBAL TOGGLE] Flying to Boston with 3D view');
                          map.current.flyTo({
                            center: [-71.06, 42.36],
                            zoom: 12,
                            pitch: 30, // More subtle pitch angle
                            bearing: 0,
                            duration: 2000
                          });
                        } else {
                          // Just adjust the pitch if we're already in Boston
                          map.current.easeTo({
                            pitch: 30, // More subtle pitch angle
                            duration: 1500
                          });
                        }

                        // Ensure extrusion height is set to 4 feet
                        console.log('[GLOBAL TOGGLE] Setting extrusion height to 4 feet');
                        if (window.updateCityBudgetExtrusionHeight) {
                          window.updateCityBudgetExtrusionHeight(4);
                        }
                      }

                      // Return true to indicate success
                      return true;
                    } catch (err) {
                      console.error('[GLOBAL TOGGLE] Error in toggleCityBudgetLayer:', err);
                      return false;
                    }
                  };

                  // Add a function to check the visibility of the city budget layers
                  window.checkCityBudgetVisibility = () => {
                    try {
                      const layerIds = [
                        `${cityBudgetLayerId}-fill`,
                        `${cityBudgetLayerId}-line`,
                        `${cityBudgetLayerId}-hover`,
                        `${cityBudgetLayerId}-hover-3d`,
                        `${cityBudgetLayerId}-extrusion`,
                        `${cityBudgetLayerId}-pulse-glow`
                      ];
                      const status = {};

                      // Check if source exists
                      status.source = map.current.getSource(cityBudgetLayerId) ? 'exists' : 'not found';

                      // Check layer visibility
                      layerIds.forEach(layerId => {
                        if (map.current.getLayer(layerId)) {
                          status[layerId] = map.current.getLayoutProperty(layerId, 'visibility');
                        } else {
                          status[layerId] = 'layer not found';
                        }
                      });

                      console.log('[VISIBILITY CHECK] City budget layers status:', status);
                      return status;
                    } catch (err) {
                      console.error('[VISIBILITY CHECK] Error checking city budget visibility:', err);
                      return null;
                    }
                  };

                  // Add a function to update the extrusion height
                  window.updateCityBudgetExtrusionHeight = (height = 4) => {
                    try {
                      console.log(`[EXTRUSION HEIGHT] Updating city budget extrusion height to ${height} feet`);

                      // Update the main extrusion layer
                      if (map.current.getLayer(`${cityBudgetLayerId}-extrusion`)) {
                        map.current.setPaintProperty(`${cityBudgetLayerId}-extrusion`, 'fill-extrusion-height', height);
                      }

                      // Update the pulse glow layer (slightly higher)
                      if (map.current.getLayer(`${cityBudgetLayerId}-pulse-glow`)) {
                        map.current.setPaintProperty(`${cityBudgetLayerId}-pulse-glow`, 'fill-extrusion-height', height + 1);
                      }

                      // Update the hover 3D layer (slightly higher)
                      if (map.current.getLayer(`${cityBudgetLayerId}-hover-3d`)) {
                        map.current.setPaintProperty(`${cityBudgetLayerId}-hover-3d`, 'fill-extrusion-height', height + 2);
                      }

                      return true;
                    } catch (err) {
                      console.error('[EXTRUSION HEIGHT] Error updating city budget extrusion height:', err);
                      return false;
                    }
                  };

                  console.log('Made city budget toggle functions available globally');
                };

                // Try different paths for the GeoJSON file
                const tryPaths = [
                  '/work/tracts_FY25_normalized.geojson',
                  './work/tracts_FY25_normalized.geojson',
                  '/public/work/tracts_FY25_normalized.geojson',
                  './public/work/tracts_FY25_normalized.geojson',
                  '/tracts_FY25_normalized.geojson',
                  './tracts_FY25_normalized.geojson',
                  '/Boston_docs/tracts_FY25_normalized.geojson',
                  './Boston_docs/tracts_FY25_normalized.geojson'
                ];

                let dataFetched = false;

                // Try each path until we find one that works
                const tryNextPath = (index) => {
                  if (index >= tryPaths.length) {
                    console.error('Failed to load data from any path, falling back to TrackCount.json');
                    // Fall back to TrackCount.json
                    fetch('/TrackCount.json')
                      .then(response => response.json())
                      .then(data => setupLayers(data))
                      .catch(err => console.error('Error loading fallback data:', err));
                    return;
                  }

                  const path = tryPaths[index];
                  console.log(`Trying to load from ${path}...`);

                  fetch(path)
                    .then(response => {
                      if (!response.ok) {
                        throw new Error(`Failed to fetch from ${path}: ${response.status}`);
                      }
                      return response.json();
                    })
                    .then(data => {
                      if (dataFetched) return; // Already loaded data from another path
                      dataFetched = true;
                      console.log(`Successfully loaded data from ${path}`);
                      setupLayers(data);
                    })
                    .catch(err => {
                      console.log(`Error loading from ${path}:`, err);
                      // Try the next path
                      tryNextPath(index + 1);
                    });
                };

                // Start trying paths
                tryNextPath(0);
              }
            } catch (err) {
              console.error('Error adding city budget layer:', err);
            }

            // Add LLM Review layer
            try {
              console.log('Adding LLM Review layer directly in useMapInitialization');

              const llmReviewLayerId = 'llm-review-layer';

              // Use our GeoJSON file with LLM review data
              if (!map.current.getSource('llm-review-data')) {
                console.log('Loading LLM Review data...');

                // Function to set up layers once we have the data
                const setupLLMReviewLayers = (data) => {
                  console.log('Loaded LLM Review data with', data.features.length, 'features');

                  // Add the source with the data
                  map.current.addSource('llm-review-data', {
                    type: 'geojson',
                    data: data
                  });

                  // Add fill layer for sentiment scores
                  map.current.addLayer({
                    id: llmReviewLayerId,
                    type: 'fill',
                    source: 'llm-review-data',
                    paint: {
                      'fill-color': [
                        'case',
                        // Special case for airport tract - always transparent
                        ['==', ['get', 'GEOID'], '25025981300'],
                        'rgba(30, 30, 30, 0)',
                        // Normal case for other tracts
                        [
                          'step',
                          ['get', 'sentiment_score'],
                          'rgba(30, 30, 30, 0)', // Completely transparent for lowest sentiment
                          0.3, 'rgba(255, 182, 193, 0.05)', // Very light pink for low-medium sentiment
                          0.5, 'rgba(255, 105, 180, 0.1)', // Light pink for medium sentiment
                          0.7, 'rgba(255, 20, 147, 0.2)', // Medium pink for high-medium sentiment
                          0.85, 'rgba(199, 21, 133, 0.3)' // Darker pink only for highest sentiment
                        ]
                      ],
                      'fill-opacity': 1.0,
                      'fill-outline-color': [
                        'case',
                        // Special case for airport tract - always transparent
                        ['==', ['get', 'GEOID'], '25025981300'],
                        'rgba(30, 30, 30, 0)',
                        // Normal case for other tracts
                        [
                          'step',
                          ['get', 'sentiment_score'],
                          'rgba(30, 30, 30, 0)', // Invisible outline for lowest sentiment
                          0.3, 'rgba(255, 182, 193, 0.05)', // Very subtle outline for low-medium sentiment
                          0.5, 'rgba(255, 105, 180, 0.1)', // Light outline for medium sentiment
                          0.7, 'rgba(255, 20, 147, 0.15)', // Medium outline for high-medium sentiment
                          0.85, 'rgba(199, 21, 133, 0.2)' // Slightly visible outline only for highest sentiment
                        ]
                      ]
                    },
                    layout: {
                      visibility: 'none'
                    }
                  }, 'road-label'); // Place below road labels for better visibility

                  // Add hover effect layer
                  map.current.addLayer({
                    id: `${llmReviewLayerId}-hover`,
                    type: 'line',
                    source: 'llm-review-data',
                    paint: {
                      'line-color': [
                        'case',
                        // Special case for airport tract - always transparent
                        ['==', ['get', 'GEOID'], '25025981300'],
                        'rgba(30, 30, 30, 0)',
                        // Normal hover color for other tracts
                        'rgba(255, 255, 255, 1.0)' // White for hover
                      ],
                      'line-width': 3,
                      'line-opacity': 1.0
                    },
                    layout: {
                      visibility: 'none'
                    },
                    filter: ['==', ['get', 'GEOID'], '']
                  }, 'road-label'); // Place below road labels for better visibility

                  // Add hover interaction for highlighting
                  map.current.on('mousemove', llmReviewLayerId, (e) => {
                    if (e.features.length > 0) {
                      const feature = e.features[0];
                      const geoid = feature.properties.GEOID || 'Unknown';

                      // Skip for airport tract
                      if (geoid === '25025981300') {
                        return;
                      }

                      // Update hover filter to highlight the tract
                      map.current.setFilter(`${llmReviewLayerId}-hover`, ['==', ['get', 'GEOID'], geoid]);

                      // Change cursor to pointer to indicate clickable area
                      map.current.getCanvas().style.cursor = 'pointer';
                    }
                  });

                  // Reset hover state when mouse leaves the layer
                  map.current.on('mouseleave', llmReviewLayerId, () => {
                    // Reset hover filter
                    map.current.setFilter(`${llmReviewLayerId}-hover`, ['==', ['get', 'GEOID'], '']);

                    // Reset cursor
                    map.current.getCanvas().style.cursor = '';
                  });

                  // Add click interaction for showing popup
                  map.current.on('click', llmReviewLayerId, (e) => {
                    // Log the click event for tracking
                    console.log('🎯 LLM Review Layer CLICKED:', e.lngLat);

                    if (e.features.length > 0) {
                      const feature = e.features[0];
                      const geoid = feature.properties.GEOID || 'Unknown';

                      // Log the feature data for debugging
                      console.log('🎯 LLM Review Feature CLICKED:', {
                        geoid,
                        lngLat: e.lngLat,
                        properties: feature.properties
                      });

                      // Skip popup for airport tract
                      if (geoid === '25025981300') {
                        console.log('🎯 Skipping popup for airport tract');
                        return;
                      }

                      // Remove existing popup
                      if (map.current._llmReviewPopup) {
                        console.log('🎯 Removing existing popup before creating new one');
                        map.current._llmReviewPopup.remove();
                      }

                      // Get sentiment score and other properties
                      const sentiment = feature.properties.sentiment_score || 0;
                      const reviewCount = feature.properties.review_count || 0;
                      let themes = feature.properties.themes || [];

                      // Parse themes if needed
                      if (typeof themes === 'string') {
                        try {
                          themes = JSON.parse(themes);
                        } catch (e) {
                          themes = [themes];
                        }
                      }

                      // Ensure themes is an array
                      if (!Array.isArray(themes)) {
                        themes = [themes];
                      }

                      // Get neighborhood name
                      let neighborhoodName = feature.properties.display_name ||
                                            feature.properties.neighborhood ||
                                            `Census Tract ${geoid.slice(-5)}`;

                      // Log popup creation
                      console.log('🎯 Creating LLM Review popup at:', e.lngLat, 'for tract:', geoid);

                      // Create and show the popup
                      const popup = new mapboxgl.Popup({
                        closeButton: true,
                        closeOnClick: true,
                        className: 'llm-review-popup',
                        maxWidth: '240px' // 20% smaller than original 300px
                      })
                        .setLngLat(e.lngLat)
                        .setHTML(`
                          <div class="llm-review-content" style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif; color: white; background-color: rgba(0,0,0,0.85); position: relative;">
                            <div class="llm-review-header" style="margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #ff69b4; border-bottom: 1px solid rgba(255,105,180,0.3); padding-bottom: 5px; display: flex; align-items: center; padding-right: 28px;">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="margin-right: 5px; flex-shrink: 0;">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                              </svg>
                              <span style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${neighborhoodName}</span>
                            </div>

                            <div class="llm-review-stats" style="display: flex; align-items: center; margin-bottom: 10px;">
                              <div class="llm-review-stat" style="flex: 1; text-align: center; padding: 7px 0; background-color: rgba(255,255,255,0.05); border-radius: 5px; margin-right: 5px;">
                                <div class="llm-review-stat-label" style="font-size: 10px; opacity: 0.7; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px;">Sentiment</div>
                                <div class="llm-review-stat-value" style="font-size: 14px; font-weight: 600; color: ${
                                  sentiment > 0.85 ? '#8b0062' :
                                  sentiment > 0.7 ? '#c71585' :
                                  sentiment > 0.5 ? '#ff1493' :
                                  sentiment > 0.3 ? '#ff69b4' :
                                  '#ffb6c1'
                                }">
                                  ${(sentiment * 100).toFixed(0)}%
                                </div>
                              </div>

                              <div class="llm-review-stat" style="flex: 1; text-align: center; padding: 7px 0; background-color: rgba(255,255,255,0.05); border-radius: 5px;">
                                <div class="llm-review-stat-label" style="font-size: 10px; opacity: 0.7; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px;">Reviews</div>
                                <div class="llm-review-stat-value" style="font-size: 14px; font-weight: 600;">${reviewCount}</div>
                              </div>
                            </div>

                            <div class="llm-review-themes" style="margin-top: 10px;">
                              <div class="llm-review-themes-label" style="margin-bottom: 5px; font-size: 12px; opacity: 0.9;">Top Themes:</div>
                              <div class="llm-review-themes-list" style="display: flex; flex-wrap: wrap; gap: 5px;">
                                ${themes.slice(0, 4).map(theme => {
                                  const themeText = typeof theme === 'string' ? theme : JSON.stringify(theme);
                                  // Generate a consistent color based on the theme name
                                  const themeColors = {
                                    'dining': '#ff9966',
                                    'food': '#ff9966',
                                    'restaurants': '#ff9966',
                                    'shopping': '#66b3ff',
                                    'retail': '#66b3ff',
                                    'nightlife': '#cc99ff',
                                    'entertainment': '#cc99ff',
                                    'bars': '#cc99ff',
                                    'transportation': '#99cc99',
                                    'transit': '#99cc99',
                                    'accessibility': '#99cc99',
                                    'recreation': '#ffcc66',
                                    'parks': '#ffcc66',
                                    'outdoors': '#ffcc66',
                                    'family-friendly': '#ff99cc',
                                    'family': '#ff99cc',
                                    'safety': '#99ccff',
                                    'culture': '#ff8080',
                                    'arts': '#ff8080',
                                    'education': '#80b3ff',
                                    'schools': '#80b3ff',
                                    'affordability': '#b3cc99',
                                    'housing': '#b3cc99',
                                    'community': '#ffb366',
                                    'diversity': '#c299ff'
                                  };

                                  // Get color based on theme or use a default color
                                  let themeColor = '#999999';
                                  const lowerTheme = themeText.toLowerCase();

                                  // Check if the theme contains any of our known themes
                                  for (const [key, color] of Object.entries(themeColors)) {
                                    if (lowerTheme.includes(key)) {
                                      themeColor = color;
                                      break;
                                    }
                                  }

                                  // Calculate a contrasting text color (black or white)
                                  const r = parseInt(themeColor.slice(1, 3), 16);
                                  const g = parseInt(themeColor.slice(3, 5), 16);
                                  const b = parseInt(themeColor.slice(5, 7), 16);
                                  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                                  const textColor = brightness > 128 ? '#000000' : '#ffffff';

                                  return `
                                    <div class="llm-review-theme" style="
                                      background-color: ${themeColor};
                                      color: ${textColor};
                                      padding: 3px 8px;
                                      border-radius: 10px;
                                      font-size: 11px;
                                      font-weight: 500;
                                      display: inline-block;
                                      text-transform: capitalize;
                                    ">${themeText}</div>
                                  `;
                                }).join('')}
                              </div>
                            </div>
                          </div>
                        `)
                        .addTo(map.current);

                      // Log popup dimensions
                      console.log('🎯 LLM Review popup created with dimensions:', {
                        maxWidth: '240px',
                        contentWidth: '240px',
                        scale: '0.9'
                      });

                      // Store the popup reference
                      map.current._llmReviewPopup = popup;

                      // Add event listener for when popup is closed
                      popup.on('close', () => {
                        console.log('🎯 LLM Review popup closed by user');
                        map.current._llmReviewPopup = null;
                      });
                    }
                  });

                  console.log('LLM Review layers added successfully');

                  // Make the toggle function available globally
                  window.toggleLLMReviewLayer = (visible) => {
                    try {
                      console.log(`[GLOBAL TOGGLE] toggleLLMReviewLayer called with visible=${visible}`);

                      // Check if the layers exist before trying to update them
                      const layerIds = [
                        llmReviewLayerId,
                        `${llmReviewLayerId}-hover`
                      ];
                      const visibility = visible ? 'visible' : 'none';

                      layerIds.forEach(layerId => {
                        if (map.current.getLayer(layerId)) {
                          console.log(`[GLOBAL TOGGLE] Setting ${layerId} visibility to ${visibility}`);
                          map.current.setLayoutProperty(layerId, 'visibility', visibility);
                        } else {
                          console.warn(`[GLOBAL TOGGLE] Layer ${layerId} not found`);
                        }
                      });

                      // If turning on, fly to Boston
                      if (visible) {
                        const center = map.current.getCenter();
                        const zoom = map.current.getZoom();
                        if (Math.abs(center.lng - (-71.06)) > 0.1 || Math.abs(center.lat - 42.36) > 0.1 || zoom < 14) {
                          console.log('[GLOBAL TOGGLE] Flying to Boston');
                          map.current.flyTo({
                            center: [-71.0589, 42.3601],
                            zoom: 11.5,
                            pitch: 0,
                            bearing: 0,
                            duration: 2000
                          });
                        }
                      }

                      // Return true to indicate success
                      return true;
                    } catch (err) {
                      console.error('[GLOBAL TOGGLE] Error in toggleLLMReviewLayer:', err);
                      return false;
                    }
                  };

                  // Add a function to check the visibility of the LLM Review layers
                  window.checkLLMReviewVisibility = () => {
                    try {
                      const layerIds = [
                        llmReviewLayerId,
                        `${llmReviewLayerId}-hover`
                      ];
                      const status = {};

                      // Check if source exists
                      status.source = map.current.getSource('llm-review-data') ? 'exists' : 'not found';

                      // Check layer visibility
                      layerIds.forEach(layerId => {
                        if (map.current.getLayer(layerId)) {
                          status[layerId] = map.current.getLayoutProperty(layerId, 'visibility');
                        } else {
                          status[layerId] = 'layer not found';
                        }
                      });

                      console.log('[VISIBILITY CHECK] LLM Review layers status:', status);
                      return status;
                    } catch (err) {
                      console.error('[VISIBILITY CHECK] Error checking LLM Review visibility:', err);
                      return null;
                    }
                  };

                  console.log('Made LLM Review toggle functions available globally');
                };

                // Try different paths for the GeoJSON file
                const tryPaths = [
                  '/work/tracts_with_llm_reviews_fixed.geojson',
                  './work/tracts_with_llm_reviews_fixed.geojson',
                  '/public/work/tracts_with_llm_reviews_fixed.geojson',
                  './public/work/tracts_with_llm_reviews_fixed.geojson',
                  '/work/tracts_with_llm_reviews.geojson',
                  './work/tracts_with_llm_reviews.geojson',
                  '/public/work/tracts_with_llm_reviews.geojson',
                  './public/work/tracts_with_llm_reviews.geojson',
                  '/work/tracts_reviews_llm.json',
                  './work/tracts_reviews_llm.json',
                  '/public/work/tracts_reviews_llm.json',
                  './public/work/tracts_reviews_llm.json',
                  '/tracts_reviews_llm.json',
                  './tracts_reviews_llm.json',
                  '/boston-census-tracts.geojson',
                  './boston-census-tracts.geojson'
                ];

                let dataFetched = false;

                // Try each path until we find one that works
                const tryNextPath = (index) => {
                  if (index >= tryPaths.length) {
                    console.error('Failed to load LLM Review data from any path, falling back to census tracts');
                    // Fall back to census tracts
                    fetch('/boston-census-tracts.geojson')
                      .then(response => response.json())
                      .then(data => {
                        console.log('Using census tracts as fallback for LLM Review data');
                        // Add sentiment scores to census tracts
                        data.features.forEach(feature => {
                          feature.properties.sentiment_score = Math.random() * 0.7 + 0.3; // Random score between 0.3 and 1.0
                          feature.properties.review_count = Math.floor(Math.random() * 300) + 50; // Random count between 50 and 350
                          feature.properties.themes = ["dining", "shopping", "nightlife", "transportation", "recreation"].sort(() => 0.5 - Math.random()).slice(0, 3); // Random themes
                        });
                        setupLLMReviewLayers(data);
                      })
                      .catch(err => {
                        console.error('Error loading census tracts as fallback:', err);
                      });
                    return;
                  }

                  const path = tryPaths[index];
                  console.log(`Trying to load LLM Review data from ${path}...`);

                  fetch(path)
                    .then(response => {
                      if (!response.ok) {
                        throw new Error(`Failed to fetch from ${path}: ${response.status}`);
                      }
                      return response.json();
                    })
                    .then(data => {
                      if (dataFetched) return; // Already loaded data from another path
                      dataFetched = true;
                      console.log(`Successfully loaded LLM Review data from ${path}`);
                      setupLLMReviewLayers(data);
                    })
                    .catch(err => {
                      console.log(`Error loading LLM Review data from ${path}:`, err);
                      // Try the next path
                      tryNextPath(index + 1);
                    });
                };

                // Start trying paths
                tryNextPath(0);
              }
            } catch (err) {
              console.error('Error adding LLM Review layer:', err);
            }

            log('Map initialization complete');
          } catch (error) {
            log('Error initializing layers:', error);
          }
        };
      } catch (error) {
        log('Error creating map:', error);
      }
    }

    return () => {
      if (map.current) {
        log('Cleaning up map...');
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
};