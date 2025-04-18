/**
 * POI data management utilities
 */

// Debug flag - enabled for troubleshooting
const DEBUG_LOGGING = true;

// Helper function for logging that checks DEBUG_LOGGING flag
const log = (message, ...args) => {
  if (DEBUG_LOGGING) {
    console.log(`POI Manager: ${message}`, ...args);
  }
};

const error = (message, error) => {
  console.error(`POI Manager Error: ${message}`, error?.message || error);
};

// Function to check if coordinates are in the current map bounds
export const isInBounds = (coords, bounds) => {
  if (!bounds) return true;
  return (
    coords[0] >= bounds.getWest() &&
    coords[0] <= bounds.getEast() &&
    coords[1] >= bounds.getSouth() &&
    coords[1] <= bounds.getNorth()
  );
};

// Helper function to get the color for a category
export const getColorForCategory = (category) => {
  const colors = {
    restaurants: '#ff9900',
    cafes: '#cc6600',
    bars: '#990099',
    shops: '#0066ff',
    cultural: '#cc3300',
    parks: '#33cc33',
    education: '#ff3333',
    healthcare: '#ff0000',
    transportation: '#666666'
  };
  return colors[category.toLowerCase()] || '#444444';
};

// Helper function to get the maximum count
export const getMaxCount = (poiCounts) => {
  return Math.max(...Object.values(poiCounts), 1); // Ensure we don't divide by zero
};

// Helper function to calculate dynamic width based on the count value
export const calculateDynamicWidth = (count, maxCount) => {
  if (!count) return '32px'; // Minimum width

  // Base width calculation based on the number of digits
  const numDigits = count.toString().length;

  // Min and max widths
  const minWidth = 32;
  const maxWidth = 80;

  // Calculate base width based on number of digits (each digit ~8px + padding)
  const digitWidth = 8; // Approximate width of each digit
  const padding = 16; // Padding (8px on each side)
  const baseWidth = (numDigits * digitWidth) + padding;

  // Scale the width between min and max based on count/maxCount ratio
  const ratio = count / maxCount;

  // Use linear scaling with a logarithmic component for better distribution
  // This gives more width to smaller numbers while still scaling with count
  const logFactor = 0.3 * Math.log10(count + 1); // Logarithmic component
  const linearFactor = 0.7 * ratio; // Linear component
  const scaleFactor = linearFactor + logFactor;

  // Calculate width using both the digit-based approach and the scaling factor
  const scaledWidth = minWidth + (maxWidth - minWidth) * scaleFactor;
  const width = Math.max(baseWidth, scaledWidth);

  // Ensure the width doesn't exceed maxWidth
  const finalWidth = Math.min(width, maxWidth);

  return `${Math.round(finalWidth)}px`;
};

// Process POIs within current map bounds
export const updateVisiblePOIs = (map, bounds, showOSMPOIs, showPOIMarkers, osmFeaturesRef, SAMPLE_POI_DATA) => {
  if (!bounds) return { newVisiblePOIs: {}, newCounts: {} };

  log("Updating POI visibility");

  // List of all categories
  const CATEGORIES = [
    'restaurants', 'cafes', 'bars', 'shops', 'cultural',
    'parks', 'education', 'healthcare', 'transportation'
  ];

  // Query visibility status
  if (map?.current) {
    try {
      const allLayers = map.current.getStyle().layers;
      const buildingLayer = allLayers.find(l => l.id === 'building' || l.id.includes('building'));
      const poiLayers = allLayers.filter(l =>
        l.id.includes('poi') ||
        l.id.includes('marker') ||
        l.id.includes('label')
      );
      const visiblePoiLayers = poiLayers.filter(l => l.layout?.visibility !== 'none');

      log(`Active layers - Buildings: ${buildingLayer?.id || 'none'}, POIs: ${visiblePoiLayers.length}`);
    } catch (e) {
      error("Error checking layer visibility", e);
    }
  }

  // Query visible POI features
  const visibleLayers = map.current?.getStyle().layers
    .filter(layer => layer.id.includes('poi') || layer.id.includes('marker'))
    .map(layer => layer.id) || [];

  const visibleFeatures = map.current?.queryRenderedFeatures(undefined, {
    layers: visibleLayers
  }) || [];

  log(`Processing ${visibleFeatures.length} visible POI features`);

  // Prepare to hold counts for each category
  const newVisiblePOIs = {};
  const newCounts = {};

  // Initialize categories
  CATEGORIES.forEach(category => {
    newVisiblePOIs[category] = [];
    newCounts[category] = 0;
  });

  // Process each category
  CATEGORIES.forEach(category => {
    // Process OSM POIs if enabled
    if (showOSMPOIs && osmFeaturesRef.current[category]?.length > 0) {
      const expandedBounds = {
        west: bounds.getWest() - 0.005,
        east: bounds.getEast() + 0.005,
        south: bounds.getSouth() - 0.005,
        north: bounds.getNorth() + 0.005
      };

      const osmPOIFeatures = osmFeaturesRef.current[category].filter(feature => {
        const coords = feature.geometry.coordinates;
        return (
          coords[0] >= expandedBounds.west &&
          coords[0] <= expandedBounds.east &&
          coords[1] >= expandedBounds.south &&
          coords[1] <= expandedBounds.north
        );
      });

      const osmPOIs = osmPOIFeatures.map(feature => ({
        id: `osm-${feature.properties.id || feature.properties.osm_id || Math.random().toString(36).substr(2, 9)}`,
        name: feature.properties.name || 'Unnamed',
        type: feature.properties.amenity || feature.properties.leisure || feature.properties.shop || category,
        rating: (Math.random() * 2 + 3).toFixed(1),
        popularity: Math.floor(Math.random() * 30) + 70,
        coordinates: feature.geometry.coordinates,
        properties: feature.properties,
        source: 'osm'
      }));

      newVisiblePOIs[category] = [...newVisiblePOIs[category], ...osmPOIs];
      newCounts[category] += osmPOIFeatures.length;
    }

    // Process Mapbox POIs if enabled
    if (showPOIMarkers) {
      const mapboxPOIs = SAMPLE_POI_DATA[category] || [];
      const expandedBounds = {
        west: bounds.getWest() - 0.005,
        east: bounds.getEast() + 0.005,
        south: bounds.getSouth() - 0.005,
        north: bounds.getNorth() + 0.005
      };

      const mapboxPOIsInView = mapboxPOIs.filter(poi =>
        poi.coordinates &&
        poi.coordinates[0] >= expandedBounds.west &&
        poi.coordinates[0] <= expandedBounds.east &&
        poi.coordinates[1] >= expandedBounds.south &&
        poi.coordinates[1] <= expandedBounds.north
      );

      const taggedMapboxPOIs = mapboxPOIsInView.map(poi => ({
        ...poi,
        source: 'mapbox'
      }));

      newVisiblePOIs[category] = [...newVisiblePOIs[category], ...taggedMapboxPOIs];
      newCounts[category] += mapboxPOIsInView.length;
    }

    // Limit to 50 POIs per category for performance
    newVisiblePOIs[category] = newVisiblePOIs[category].slice(0, 50);
  });

  // Handle count discrepancy
  const calculatedTotal = Object.values(newCounts).reduce((sum, count) => sum + (count || 0), 0);

  if (visibleFeatures.length > calculatedTotal * 1.5) {
    log(`Count adjustment needed - Visible: ${visibleFeatures.length}, Calculated: ${calculatedTotal}`);

    const adjustmentFactor = visibleFeatures.length / Math.max(calculatedTotal, 1);
    Object.keys(newCounts).forEach(category => {
      if (newCounts[category] > 0) {
        newCounts[category] = Math.round(newCounts[category] * adjustmentFactor);
      }
    });
  }

  return { updatedPOIs: newVisiblePOIs, updatedCounts: newCounts };
};

export const processVisiblePOIs = (map, graphOnlyMode = false, showOSM = true) => {
  if (!map) {
    log('Map instance not available');
    return null;
  }

  const bounds = map.getBounds();
  if (!bounds) {
    log('Map bounds not available');
    return null;
  }

  const visiblePOIs = getVisiblePOIs(map, bounds, graphOnlyMode, showOSM);
  log(`Found ${visiblePOIs.length} visible POIs`);

  const scatterData = visiblePOIs.map(poi => ({
    x: poi.rating || 0,
    y: poi.reviews || 0,
    name: poi.name,
    category: poi.category,
    color: getColorForCategory(poi.category),
    lngLat: poi.lngLat
  }));

  const categories = [...new Set(visiblePOIs.map(poi => poi.category))];
  log(`Found ${categories.length} unique categories`);

  return {
    scatterData,
    categories
  };
};

export const getVisiblePOIs = (map, bounds, graphOnlyMode = false, showOSM = true) => {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const visiblePOIs = [];

  try {
    const features = map.querySourceFeatures('composite', {
      sourceLayer: 'poi_label',
      filter: ['all',
        ['>=', 'rating', 1],
        ['>=', 'review_count', 1]
      ]
    });

    if (features?.length > 0) {
      log(`Found ${features.length} POI features`);

      features.forEach(feature => {
        const coordinates = feature.geometry.coordinates;
        if (coordinates[0] >= sw.lng && coordinates[0] <= ne.lng &&
            coordinates[1] >= sw.lat && coordinates[1] <= ne.lat) {
          visiblePOIs.push({
            name: feature.properties.name,
            category: feature.properties.type,
            rating: feature.properties.rating,
            reviews: feature.properties.review_count,
            lngLat: coordinates
          });
        }
      });
    }
  } catch (error) {
    console.warn('Error querying POI features:', error);
  }

  if (showOSM) {
    try {
      const osmFeatures = map.querySourceFeatures('osm-pois', {
        sourceLayer: 'osm_pois',
        filter: ['all',
          ['>=', 'rating', 1],
          ['>=', 'review_count', 1]
        ]
      });

      if (osmFeatures?.length > 0) {
        log(`Found ${osmFeatures.length} OSM POI features`);

        osmFeatures.forEach(feature => {
          const coordinates = feature.geometry.coordinates;
          if (coordinates[0] >= sw.lng && coordinates[0] <= ne.lng &&
              coordinates[1] >= sw.lat && coordinates[1] <= ne.lat) {
            visiblePOIs.push({
              name: feature.properties.name,
              category: feature.properties.amenity || feature.properties.shop || 'other',
              rating: feature.properties.rating,
              reviews: feature.properties.review_count,
              lngLat: coordinates
            });
          }
        });
      }
    } catch (error) {
      console.warn('Error querying OSM POI features:', error);
    }
  }

  return visiblePOIs;
};

export const highlightBuildingAtLocation = async (map, coordinates, id, color) => {
  if (!map?.current || !coordinates || coordinates.length !== 2) {
    return false;
  }

  try {
    // Wait for map to be loaded
    if (!map.current.loaded()) {
      await new Promise(resolve => {
        map.current.once('load', resolve);
      });
    }

    // Check if map style is loaded
    if (!map.current.isStyleLoaded()) {
      log('Map style not loaded yet, skipping highlight');
      return false;
    }

    const [lng, lat] = coordinates;
    const point = map.current.project([lng, lat]);
    const features = map.current.queryRenderedFeatures(point, {
      layers: ['building']
    });

    if (!features?.length) {
      log('No building found at coordinates:', coordinates);
      return false;
    }

    const buildingId = features[0].id;
    const existingFilter = map.current.getFilter('building-highlighted') || ['in', 'id'];

    // Remove old highlight for this category if it exists
    const newFilter = ['in', 'id'];
    existingFilter.slice(2).forEach(id => {
      if (!id.startsWith(id)) {
        newFilter.push(id);
      }
    });
    newFilter.push(buildingId);

    // Update the highlight layer
    if (!map.current.getLayer('building-highlighted')) {
      map.current.addLayer({
        id: 'building-highlighted',
        type: 'fill',
        source: 'composite',
        'source-layer': 'building',
        paint: {
          'fill-color': color,
          'fill-opacity': 0.5
        },
        filter: newFilter
      });
    } else {
      map.current.setFilter('building-highlighted', newFilter);
      map.current.setPaintProperty('building-highlighted', 'fill-color', color);
    }

    return true;
  } catch (error) {
    console.warn('Error highlighting building:', error);
    return false;
  }
};

export const removeHighlight = (map, id) => {
  if (!map?.current || !map.current.loaded()) {
    return;
  }

  try {
    const layer = map.current.getLayer('building-highlighted');
    if (layer) {
      const existingFilter = map.current.getFilter('building-highlighted') || ['in', 'id'];
      const newFilter = ['in', 'id'];

      // Keep all highlights except those starting with the given id
      existingFilter.slice(2).forEach(existingId => {
        if (!existingId.startsWith(id)) {
          newFilter.push(existingId);
        }
      });

      map.current.setFilter('building-highlighted', newFilter);
    }
  } catch (error) {
    console.warn('Error removing highlight:', error);
  }
};

export const removeAllHighlights = (map) => {
  if (!map?.current || !map.current.loaded()) {
    return;
  }

  try {
    const layer = map.current.getLayer('building-highlighted');
    if (layer) {
      map.current.setFilter('building-highlighted', ['in', 'id']);
    }
  } catch (error) {
    console.warn('Error removing all highlights:', error);
  }
};