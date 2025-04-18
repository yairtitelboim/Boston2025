import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { getColorForCategory } from './POIDataBar/utils/poiDataManager';
import { createLogger, LOG_LEVELS } from '../../../utils/logging';

// Create a logger for the BostonBuildingsLayer component
const logger = createLogger('BostonBuildingsLayer');

/**
 * BostonBuildingsLayer Component
 *
 * This component manages the 3D buildings layer for Boston.
 *
 * Note: Building labels are intentionally kept hidden at all times (visibility: 'none')
 * as per user requirements. The primary purpose is to show the 3D building structures
 * without cluttering the map with building names/labels.
 *
 * If labels are needed in the future, modify:
 * 1. The initial layout.visibility of 'boston-buildings-labels' layer
 * 2. Include the labels layer in the visibility toggle list
 * 3. Remove the explicit code that ensures labels remain hidden
 */
const BostonBuildingsLayer = ({ map, visible = false, selectedPOI = null, visibleCategories = {} }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(visible);
  const initializationAttempted = useRef(false);
  const mapLoaded = useRef(false);
  const pendingVisibility = useRef(visible);
  const initializationAttempts = useRef(0);
  const MAX_INIT_ATTEMPTS = 5;

  // Log important props for debugging
  logger.debug('Rendering with props', {
    hasMap: !!map,
    hasMapCurrent: !!(map && map.current),
    visible,
    isLoaded,
    isVisible,
    visibleCategories,
    initializationAttempted: initializationAttempted.current,
    mapLoaded: mapLoaded.current,
    initializationAttempts: initializationAttempts.current,
    pendingVisibility: pendingVisibility.current
  });

  // Effect to track map load state
  useEffect(() => {
    const mapInstance = map?.current;
    if (!mapInstance) return;

    const handleMapLoad = () => {
      logger.info('Map loaded');
      mapLoaded.current = true;

      // Attempt initialization if the map is loaded and we haven't successfully initialized yet
      if (!isLoaded && !initializationAttempted.current) {
        logger.info('Map loaded, attempting initialization');
        attemptInitialization();
      }
    };

    if (mapInstance.loaded()) {
      handleMapLoad();
    } else {
      mapInstance.once('load', handleMapLoad);
    }

    return () => {
      if (mapInstance) {
        mapInstance.off('load', handleMapLoad);
      }
    };
  }, [map?.current, isLoaded]);

  // Function to attempt initialization with retry logic
  const attemptInitialization = () => {
    const mapInstance = map?.current;
    if (!mapInstance) return false;

    // Check if already initialized
    if (isLoaded) return true;

    // Check if source already exists
    if (mapInstance.getSource('boston-buildings')) {
      console.log('BostonBuildingsLayer: Source already exists, skipping initialization');
      setIsLoaded(true);
      return true;
    }

    // Check attempts limit
    if (initializationAttempts.current >= MAX_INIT_ATTEMPTS) {
      logger.error(`Exceeded max initialization attempts (${MAX_INIT_ATTEMPTS})`);
      return false;
    }

    initializationAttempted.current = true;
    initializationAttempts.current += 1;

    logger.info(`Starting Initialization (Attempt ${initializationAttempts.current})`);

    initializeLayer();
    return true;
  };

  // Separate effect for initialization
  useEffect(() => {
    if (mapLoaded.current && !isLoaded && !initializationAttempted.current) {
      attemptInitialization();
    }

    // Set up a retry mechanism if the map is available but not fully loaded
    if (map?.current && !mapLoaded.current && !isLoaded && !initializationAttempted.current) {
      const retryTimer = setTimeout(() => {
        logger.info('Retrying initialization after timeout');
        // Force attempt even if map isn't fully loaded
        attemptInitialization();
      }, 2000); // 2 second retry

      return () => clearTimeout(retryTimer);
    }
  }, [map?.current, isLoaded, mapLoaded.current]);

  const initializeLayer = async () => {
    const mapInstance = map?.current;
    if (!mapInstance) return;

    try {
      // First check if the GeoJSON file exists
      logger.debug('Checking GeoJSON file...');
      const fileCheck = await fetch('/data/osm/boston_buildings_3d.geojson', { method: 'HEAD' });
      logger.debug(`GeoJSON file ${fileCheck.ok ? 'exists' : 'does not exist'}, status: ${fileCheck.status}`);

      if (!fileCheck.ok) {
        throw new Error(`GeoJSON file not accessible: ${fileCheck.status}`);
      }

      // Add the source
      logger.debug('Adding GeoJSON source');
      mapInstance.addSource('boston-buildings', {
        type: 'geojson',
        data: '/data/osm/boston_buildings_3d.geojson'
      });

      // Wait for source to load with timeout
      await Promise.race([
        new Promise((resolve, reject) => {
          const checkSource = () => {
            const source = mapInstance.getSource('boston-buildings');
            if (source && source.loaded()) {
              resolve();
            } else {
              setTimeout(checkSource, 100);
            }
          };
          checkSource();
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Source load timeout')), 10000))
      ]);

      // Verify source was added
      const source = mapInstance.getSource('boston-buildings');
      if (!source) {
        throw new Error('Failed to add source');
      }

      // Log source details
      const features = mapInstance.querySourceFeatures('boston-buildings');
      logger.debug(`Source loaded with ${features.length} features`);
      if (features.length === 0) {
        logger.warn('No features found in source, this may be normal for large sources');
      }

      // Add the layers
      logger.debug('Adding layers');

      // Get initial visibility from the pending state
      const initialVisibility = pendingVisibility.current ? 'visible' : 'none';
      logger.debug(`Initial visibility is ${initialVisibility}, but labels will always be hidden`);

      // Add fill-extrusion layer
      mapInstance.addLayer({
        id: 'boston-buildings-fill',
        type: 'fill-extrusion',
        source: 'boston-buildings',
        paint: {
          'fill-extrusion-color': [
            'match',
            ['downcase', ['get', 'building']],  // Convert building type to lowercase
            'commercial', getColorForCategory('shops'),
            'office', getColorForCategory('shops'),
            'retail', getColorForCategory('restaurants'),
            'restaurant', getColorForCategory('restaurants'),
            'cafe', getColorForCategory('cafes'),
            'coffee_shop', getColorForCategory('cafes'),
            'food_court', getColorForCategory('restaurants'),
            'fast_food', getColorForCategory('restaurants'),
            'supermarket', getColorForCategory('restaurants'),
            'deli', getColorForCategory('restaurants'),
            'bakery', getColorForCategory('cafes'),
            'bar', getColorForCategory('bars'),
            'pub', getColorForCategory('bars'),
            'nightclub', getColorForCategory('bars'),
            'hotel', getColorForCategory('bars'),
            'residential', getColorForCategory('cultural'),
            'apartments', getColorForCategory('cultural'),
            'industrial', getColorForCategory('transportation'),
            'warehouse', getColorForCategory('transportation'),
            'school', getColorForCategory('education'),
            'university', getColorForCategory('education'),
            'hospital', getColorForCategory('healthcare'),
            'park', getColorForCategory('parks'),
            // Default dark gray color for all other buildings
            '#444444'
          ],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.7
        },
        layout: {
          visibility: initialVisibility
        }
      });

      // Add outline layer
      mapInstance.addLayer({
        id: 'boston-buildings-outline',
        type: 'line',
        source: 'boston-buildings',
        paint: {
          'line-color': '#000000',
          'line-width': 1,
          'line-opacity': 0.5
        },
        layout: {
          visibility: initialVisibility
        }
      });

      // Add labels layer
      mapInstance.addLayer({
        id: 'boston-buildings-labels',
        type: 'symbol',
        source: 'boston-buildings',
        filter: ['has', 'name'],
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-anchor': 'center',
          'text-offset': [0, 0],
          'text-font': ['Open Sans Regular'],
          visibility: 'none'  // Always keep labels hidden regardless of the main layer visibility
        },
        paint: {
          'text-color': '#FFFFFF',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });

      // Add click handler
      mapInstance.on('click', 'boston-buildings-fill', (e) => {
        if (e.features.length === 0) return;

        const feature = e.features[0];
        const props = feature.properties;

        console.log('BostonBuildingsLayer: Building clicked', props);

        const popupContent = `
          <div style="font-family: sans-serif;">
            <h3 style="margin: 0 0 10px 0;">${props.name || 'Building'}</h3>
            <p><strong>Type:</strong> ${props.building || 'Unknown'}</p>
            <p><strong>Height:</strong> ${props.height ? props.height + ' m' : 'Unknown'}</p>
            ${props.levels ? `<p><strong>Levels:</strong> ${props.levels}</p>` : ''}
            <p><strong>ID:</strong> ${props.id || 'Unknown'}</p>
          </div>
        `;

        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(popupContent)
          .addTo(mapInstance);
      });

      // Add hover handlers
      mapInstance.on('mouseenter', 'boston-buildings-fill', () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });

      mapInstance.on('mouseleave', 'boston-buildings-fill', () => {
        mapInstance.getCanvas().style.cursor = '';
      });

      setIsLoaded(true);
      setIsVisible(pendingVisibility.current);
      logger.info('Successfully initialized with visibility:', initialVisibility);

      // If successful, reset the initialization flags to allow future retries if needed
      initializationAttempted.current = false;
      initializationAttempts.current = 0;

      // Add logging to see what building types we're getting
      const buildingTypes = new Set();
      mapInstance.querySourceFeatures('boston-buildings').forEach(feature => {
        if (feature.properties && feature.properties.building) {
          buildingTypes.add(feature.properties.building.toLowerCase());
        }
      });
      logger.debug('Found building types:', Array.from(buildingTypes));
    } catch (error) {
      logger.error('Error during initialization:', error);
      initializationAttempted.current = false;

      // Schedule a retry if under the max attempts
      if (initializationAttempts.current < MAX_INIT_ATTEMPTS) {
        logger.info(`Will retry initialization (attempt ${initializationAttempts.current}/${MAX_INIT_ATTEMPTS})`);
        setTimeout(attemptInitialization, 2000);
      }
    }
  };

  // Debug function to check layer status
  const debugLayerStatus = () => {
    if (!map?.current) return;

    const mapInstance = map.current;
    const layers = [
      'boston-buildings-fill',
      'boston-buildings-outline',
      'boston-buildings-labels'
    ];

    console.log('=== BOSTON BUILDINGS LAYER STATUS ===');

    // Check if source exists
    try {
      const source = mapInstance.getSource('boston-buildings');
      console.log(`Source 'boston-buildings' exists: ${!!source}`);
    } catch (error) {
      console.log(`Source 'boston-buildings' error: ${error.message}`);
    }

    // Check each layer
    layers.forEach(layerId => {
      try {
        const exists = mapInstance.getLayer(layerId);
        if (exists) {
          const visibility = mapInstance.getLayoutProperty(layerId, 'visibility');
          console.log(`Layer '${layerId}' exists: YES, visibility: ${visibility}`);
        } else {
          console.log(`Layer '${layerId}' exists: NO`);
        }
      } catch (error) {
        console.log(`Layer '${layerId}' error: ${error.message}`);
      }
    });

    // Check state
    console.log(`Component state - isLoaded: ${isLoaded}, isVisible: ${isVisible}`);
    console.log(`Ref state - pendingVisibility: ${pendingVisibility.current}, mapLoaded: ${mapLoaded.current}`);
    console.log('======================================');
  };

  // Function to update layer visibility based on pendingVisibility state
  const updateLayerVisibility = () => {
    if (!map?.current || !isLoaded) {
      logger.debug('Cannot update visibility, map or layers not ready');
      return;
    }

    const mapInstance = map.current;
    const layers = [
      'boston-buildings-fill',
      'boston-buildings-outline'
      // 'boston-buildings-labels' - Removed from toggling to keep labels always hidden
    ];

    const visibility = pendingVisibility.current ? 'visible' : 'none';
    console.log(`Setting Boston Buildings layers to ${visibility}`);

    // Debug before changing
    debugLayerStatus();

    layers.forEach(layer => {
      try {
        if (mapInstance.getLayer(layer)) {
          console.log(`Setting ${layer} to ${visibility}`);
          mapInstance.setLayoutProperty(layer, 'visibility', visibility);
        } else {
          console.warn(`Layer ${layer} not found in map`);
        }
      } catch (error) {
        console.warn(`Error setting visibility for ${layer}:`, error);
      }
    });

    // Ensure labels are always hidden
    if (mapInstance.getLayer('boston-buildings-labels')) {
      mapInstance.setLayoutProperty('boston-buildings-labels', 'visibility', 'none');
    }

    // Debug after changing
    setTimeout(() => {
      console.log('After visibility update:');
      debugLayerStatus();
    }, 100);

    // Update component state
    setIsVisible(pendingVisibility.current);

    // Notify the parent component of the visibility change
    if (window.layerToggleManager &&
        window.layerToggleManager.getAllToggleStates().showBostonBuildings !== pendingVisibility.current) {
      console.log(`BostonBuildingsLayer: Notifying parent of visibility change to ${pendingVisibility.current}`);
      if (window.setBostonBuildingsVisible) {
        window.setBostonBuildingsVisible(pendingVisibility.current);
      }
    }
  };

  // Add global functions to check and toggle the layer status
  useEffect(() => {
    window.checkBostonBuildingsLayer = () => {
      console.log('=== CHECKING BOSTON BUILDINGS LAYER ===');
      debugLayerStatus();
      console.log('=======================================');
    };

    // Add a direct toggle function
    window.toggleBostonBuildingsDirectly = (value) => {
      console.log(`=== DIRECT TOGGLE: Setting Boston Buildings to ${value ? 'visible' : 'hidden'} ===`);

      if (!map?.current || !isLoaded) {
        console.log('Map or layers not ready for direct toggle');
        return;
      }

      const mapInstance = map.current;
      const layers = [
        'boston-buildings-fill',
        'boston-buildings-outline'
      ];

      // Set visibility directly on the layers
      layers.forEach(layerId => {
        try {
          if (mapInstance.getLayer(layerId)) {
            console.log(`Setting ${layerId} to ${value ? 'visible' : 'none'}`);
            mapInstance.setLayoutProperty(layerId, 'visibility', value ? 'visible' : 'none');
          }
        } catch (error) {
          console.warn(`Error setting visibility for ${layerId}:`, error);
        }
      });

      // Update component state
      pendingVisibility.current = value;
      setIsVisible(value);

      // Check the result
      setTimeout(() => {
        debugLayerStatus();
      }, 100);
    };

    // Call it once to check initial state
    setTimeout(() => {
      if (window.checkBostonBuildingsLayer) {
        window.checkBostonBuildingsLayer();
      }
    }, 2000);

    return () => {
      window.checkBostonBuildingsLayer = undefined;
      window.toggleBostonBuildingsDirectly = undefined;
    };
  }, [isLoaded]);

  // Listen for scene restoration events and direct visibility events
  useEffect(() => {
    if (!window.mapEventBus) return;

    const handleSceneRestored = (sceneState) => {
      console.log('%cBostonBuildingsLayer: Scene restored event received', 'background: blue; color: white;');

      // Check if the scene has Boston Buildings state
      const showBostonBuildings =
        sceneState.toggleStates?.layerToggleStates?.showBostonBuildings !== undefined ?
        sceneState.toggleStates.layerToggleStates.showBostonBuildings :
        sceneState.toggleStates?.buildingStates?.showBostonBuildings;

      if (showBostonBuildings !== undefined) {
        console.log(`%cBostonBuildingsLayer: Scene has Boston Buildings state: ${showBostonBuildings}`, 'background: blue; color: white;');
        // Force update visibility if needed
        if (pendingVisibility.current !== showBostonBuildings) {
          console.log(`%cBostonBuildingsLayer: Updating visibility from scene to: ${showBostonBuildings}`, 'background: blue; color: white;');
          pendingVisibility.current = showBostonBuildings;
          updateLayerVisibility();
        }
      }
    };

    // Handle direct visibility events from the global setter
    const handleVisibilityEvent = (data) => {
      console.log(`%cBostonBuildingsLayer: Received visibility event with visible=${data.visible}`, 'background: red; color: white;');

      if (pendingVisibility.current !== data.visible) {
        console.log(`%cBostonBuildingsLayer: Updating visibility from event to: ${data.visible}`, 'background: red; color: white;');
        pendingVisibility.current = data.visible;
        updateLayerVisibility();
      }
    };

    window.mapEventBus.on('sceneRestored', handleSceneRestored);
    window.mapEventBus.on('bostonBuildings:visibility', handleVisibilityEvent);

    return () => {
      window.mapEventBus.off('sceneRestored', handleSceneRestored);
      window.mapEventBus.off('bostonBuildings:visibility', handleVisibilityEvent);
    };
  }, [map, isLoaded]);

  // Handle visibility changes
  useEffect(() => {
    logger.debug('Visibility effect triggered', { visible, isLoaded, mapLoaded: mapLoaded.current });
    logger.debug('Visibility changed to', visible ? 'visible' : 'hidden');

    // Always save the intended visibility state
    pendingVisibility.current = visible;

    if (!map?.current) {
      logger.debug('Map not available, cannot change visibility');
      return;
    }

    if (!isLoaded) {
      logger.debug('Layers not loaded yet, storing visibility for later application');
      // If map is available but layer isn't loaded, attempt initialization
      if (map.current && !initializationAttempted.current) {
        attemptInitialization();
      }
      return;
    }

    // Use the common updateLayerVisibility function
    updateLayerVisibility();

    // If turning on visibility, make sure we're looking at Boston
    if (visible && map?.current) {
      console.log('BostonBuildingsLayer: Visibility changed to visible, checking map position');
      const center = map.current.getCenter();
      const zoom = map.current.getZoom();
      // Only adjust view if we're not already in Boston area
      if (Math.abs(center.lng - (-71.06)) > 0.1 || Math.abs(center.lat - 42.36) > 0.1 || zoom < 14) {
        console.log('BostonBuildingsLayer: Not in Boston area, adjusting view');
        map.current.flyTo({
          center: [-71.06, 42.36], // Boston coordinates
          zoom: 15,
          pitch: 60,
          bearing: -20,
          duration: 2000
        });
      }
    }

    logger.info(`Visibility changed to ${visible ? 'visible' : 'hidden'}`);
  }, [map?.current, visible, isLoaded]);

  // Handle selectedPOI changes
  useEffect(() => {
    if (!map?.current || !isLoaded) return;

    const mapInstance = map.current;

    // Check if the buildings layer exists
    if (!mapInstance.getLayer('boston-buildings-fill')) return;

    if (selectedPOI) {
      console.log('BostonBuildingsLayer: POI selected, changing buildings to gray', selectedPOI);

      // Save the original color expression to restore later
      if (!mapInstance._originalBuildingColors) {
        mapInstance._originalBuildingColors = mapInstance.getPaintProperty('boston-buildings-fill', 'fill-extrusion-color');
      }

      // Get the coordinates of the selected POI
      const coordinates = selectedPOI.coordinates;
      console.log('BostonBuildingsLayer: Highlighting buildings around coordinates:', coordinates);

      // First, save the original color expression if we haven't already
      if (!mapInstance._originalBuildingColors) {
        mapInstance._originalBuildingColors = mapInstance.getPaintProperty('boston-buildings-fill', 'fill-extrusion-color');
      }

      // Highlight buildings around the POI and make all other buildings gray
      // Use a buffer size that's likely to capture just the building at the POI location
      // and maybe a few adjacent ones
      const bufferPixels = 50; // Smaller radius (50 pixels) to focus more on the specific building

      // Query for buildings in the area around the POI
      const buildingsInArea = mapInstance.queryRenderedFeatures(
        [
          [mapInstance.project(coordinates).x - bufferPixels, mapInstance.project(coordinates).y - bufferPixels],
          [mapInstance.project(coordinates).x + bufferPixels, mapInstance.project(coordinates).y + bufferPixels]
        ],
        { layers: ['boston-buildings-fill'] }
      );

      console.log('BostonBuildingsLayer: Found buildings in area:', buildingsInArea.length);

      // Get the color for the POI type
      const poiColor = getColorForCategory(selectedPOI.properties?.type || 'shops');

      if (buildingsInArea.length > 0) {
        console.log('BostonBuildingsLayer: Using distance-based approach for highlighting');

        // Set all buildings to gray first
        console.log('BostonBuildingsLayer: Setting all buildings to gray as base');
        mapInstance.setPaintProperty(
          'boston-buildings-fill',
          'fill-extrusion-color',
          '#AAAAAA' // Gray color for all buildings
        );

        // Set all buildings to semi-transparent
        mapInstance.setPaintProperty(
          'boston-buildings-fill',
          'fill-extrusion-opacity',
          0.4 // Semi-transparent for all buildings
        );

        // As a fallback, also set a simpler approach that will work even if the distance calculation fails
        // This will make buildings within the buffer area use the POI color
        const centerX = mapInstance.project(coordinates).x;
        const centerY = mapInstance.project(coordinates).y;

        // Create a filter for buildings within the buffer area
        const withinBuffer = buildingsInArea.map(building => {
          // Get the building's center point
          const buildingCenter = mapInstance.project(building.geometry.coordinates[0][0]);
          // Calculate distance from POI to building center
          const dx = centerX - buildingCenter.x;
          const dy = centerY - buildingCenter.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          // Return true if the building is within the buffer
          return distance <= bufferPixels;
        });

        // If we have buildings within the buffer, set all buildings to gray
        if (withinBuffer.length > 0) {
          console.log('BostonBuildingsLayer: Setting all buildings to gray as base');
          mapInstance.setPaintProperty(
            'boston-buildings-fill',
            'fill-extrusion-color',
            '#AAAAAA' // Gray color for all buildings
          );

          // Then create a new layer just for the highlighted buildings
          if (!mapInstance.getSource('highlighted-buildings')) {
            // Create a new source for the highlighted buildings
            const highlightedFeatures = buildingsInArea
              .filter((_, index) => withinBuffer[index])
              .map(building => ({
                type: 'Feature',
                geometry: building.geometry,
                properties: building.properties
              }));

            mapInstance.addSource('highlighted-buildings', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: highlightedFeatures
              }
            });

            // Add a new layer for the highlighted buildings
            mapInstance.addLayer({
              id: 'highlighted-buildings-fill',
              type: 'fill-extrusion',
              source: 'highlighted-buildings',
              paint: {
                'fill-extrusion-color': poiColor,
                'fill-extrusion-height': 50, // Fixed height
                'fill-extrusion-base': 0,    // Fixed base height
                'fill-extrusion-opacity': 1.0
              }
            });
          } else {
            // Update the existing source with the new highlighted buildings
            const highlightedFeatures = buildingsInArea
              .filter((_, index) => withinBuffer[index])
              .map(building => ({
                type: 'Feature',
                geometry: building.geometry,
                properties: building.properties
              }));

            mapInstance.getSource('highlighted-buildings').setData({
              type: 'FeatureCollection',
              features: highlightedFeatures
            });

            // Update the fill color
            mapInstance.setPaintProperty(
              'highlighted-buildings-fill',
              'fill-extrusion-color',
              poiColor
            );
          }
        }
      } else {
        // If we couldn't find any buildings, just make all buildings gray
        console.log('BostonBuildingsLayer: No buildings found in area, making all gray');

        mapInstance.setPaintProperty(
          'boston-buildings-fill',
          'fill-extrusion-color',
          '#AAAAAA' // Gray color for all buildings
        );
      }

      // We've removed the circle highlight and only kept the 3D building highlight
    } else if (mapInstance._originalBuildingColors) {
      console.log('BostonBuildingsLayer: Restoring original building colors');

      // Restore original colors
      mapInstance.setPaintProperty(
        'boston-buildings-fill',
        'fill-extrusion-color',
        mapInstance._originalBuildingColors
      );

      // Also restore the original opacity
      mapInstance.setPaintProperty(
        'boston-buildings-fill',
        'fill-extrusion-opacity',
        0.7 // Default opacity
      );

      // Remove the highlighted buildings layer and source if they exist
      if (mapInstance.getLayer('highlighted-buildings-fill')) {
        console.log('BostonBuildingsLayer: Removing highlighted buildings layer');
        mapInstance.removeLayer('highlighted-buildings-fill');
      }

      if (mapInstance.getSource('highlighted-buildings')) {
        console.log('BostonBuildingsLayer: Removing highlighted buildings source');
        mapInstance.removeSource('highlighted-buildings');
      }

      // Also remove any other highlight layers that might exist
      ['highlighted-building-fill', 'highlighted-3d-building-fill'].forEach(layerId => {
        if (mapInstance.getLayer(layerId)) {
          console.log(`BostonBuildingsLayer: Removing ${layerId} layer`);
          mapInstance.removeLayer(layerId);
        }
      });

      ['highlighted-building', 'highlighted-3d-building'].forEach(sourceId => {
        if (mapInstance.getSource(sourceId)) {
          console.log(`BostonBuildingsLayer: Removing ${sourceId} source`);
          mapInstance.removeSource(sourceId);
        }
      });
    }
  }, [map?.current, isLoaded, selectedPOI]);

  // Effect to update building colors based on visible categories
  useEffect(() => {
    const mapInstance = map?.current;
    if (!mapInstance || !isLoaded) {
      logger.debug('Skipping color update - map not ready or not loaded', {
        hasMap: !!mapInstance,
        isLoaded,
        visibleCategories
      });
      return;
    }

    logger.debug('Starting color update with visible categories:', {
      categories: visibleCategories,
      categoryKeys: Object.keys(visibleCategories)
    });

    // Map of building types to POI categories (all lowercase)
    const buildingToPOICategory = {
      'commercial': 'shops',
      'office': 'shops',
      'retail': 'shops',
      'residential': 'cultural',
      'apartments': 'cultural',
      'industrial': 'transportation',
      'warehouse': 'transportation',
      'school': 'education',
      'university': 'education',
      'hospital': 'healthcare',
      'hotel': 'bars',
      'cafe': 'cafes',
      'restaurant': 'restaurants',
      'bar': 'bars',
      'pub': 'bars',
      'park': 'parks'
    };

    try {
      if (!mapInstance.getLayer('boston-buildings-fill')) {
        console.error('BostonBuildingsLayer: Layer boston-buildings-fill not found');
        return;
      }

      // Create a color expression for the buildings
      // Use 'match' expression instead of 'case' for better compatibility
      const colorExpression = ['match', ['get', 'building']];

      // Create a reverse mapping from POI categories to building types
      const categoryToBuildingTypes = {};
      Object.entries(buildingToPOICategory).forEach(([buildingType, category]) => {
        const normalizedCategory = category.toLowerCase();
        if (!categoryToBuildingTypes[normalizedCategory]) {
          categoryToBuildingTypes[normalizedCategory] = [];
        }
        categoryToBuildingTypes[normalizedCategory].push(buildingType);
      });

      logger.debug('Category to building types mapping:', categoryToBuildingTypes);

      // Process each category and its building types
      let hasVisibleCategories = false;
      Object.entries(categoryToBuildingTypes).forEach(([category, buildingTypes]) => {
        const isVisible = visibleCategories[category.toLowerCase()];
        logger.debug(`Processing category ${category}:`, {
          isVisible,
          buildingTypes,
          categoryKey: category.toLowerCase()
        });

        if (isVisible) {
          hasVisibleCategories = true;
          buildingTypes.forEach(buildingType => {
            logger.debug(`Adding color case for building type ${buildingType} (${category})`);
            colorExpression.push(
              buildingType,
              getColorForCategory(category)
            );
          });
        }
      });

      // Add default color for buildings without a category or with hidden categories
      colorExpression.push('#444444');

      // If no categories are visible, use a simple gray color instead of a complex expression
      let finalColorExpression = colorExpression;
      if (!hasVisibleCategories) {
        logger.debug('No visible categories, using simple gray color');
        finalColorExpression = '#444444';
      }

      logger.debug('Applying color expression:', JSON.stringify(finalColorExpression, null, 2));

      // Get current color expression for comparison
      const currentColorExpression = mapInstance.getPaintProperty('boston-buildings-fill', 'fill-extrusion-color');
      logger.debug('Current color expression:', JSON.stringify(currentColorExpression, null, 2));

      // Apply the new color expression
      mapInstance.setPaintProperty(
        'boston-buildings-fill',
        'fill-extrusion-color',
        finalColorExpression
      );

      // Verify the update
      const newColorExpression = mapInstance.getPaintProperty('boston-buildings-fill', 'fill-extrusion-color');
      logger.debug('Successfully updated building colors. New expression:',
        JSON.stringify(newColorExpression, null, 2)
      );
    } catch (error) {
      logger.error('Error updating building colors:', error);
    }
  }, [map?.current, isLoaded, visibleCategories]);

  return null;
};

export default BostonBuildingsLayer;