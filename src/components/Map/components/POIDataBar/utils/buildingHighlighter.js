/**
 * Building highlighter utility
 * Handles the core logic for highlighting buildings on the map
 */

import * as turf from '@turf/turf';

// Cache to track buildings that have already been highlighted
const highlightedBuildingsCache = new Map();

// Constants for highlighting
const HIGHLIGHT_HEIGHT_MULTIPLIER = 1.05;  // 5% taller than original
const HIGHLIGHT_SIZE_MULTIPLIER = 1.05;  // 5% larger footprint
const MIN_BASE_HEIGHT = 0.7;
const BUFFER_DISTANCE = 0.5;  // Small buffer for footprint expansion
const Z_INDEX_BASE = 1;
const Z_INDEX_STEP = 10;
const HEIGHT_OFFSET_STEP = 2;  // Increased for better separation

// Track highlighted buildings and their order
const highlightedBuildings = new Set();
let highlightCounter = 0;

// Function to generate a simple cache key for a building feature
const getBuildingCacheKey = (feature) => {
  if (!feature || !feature.geometry) return null;
  
  if (feature.id) return `id-${feature.id}`;
  
  if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates && feature.geometry.coordinates[0]) {
    const coords = feature.geometry.coordinates[0];
    if (coords.length > 1) {
      return `coords-${coords[0][0].toFixed(5)}-${coords[0][1].toFixed(5)}-${coords[1][0].toFixed(5)}-${coords[1][1].toFixed(5)}`;
    }
  }
  
  return `type-${feature.geometry.type}-${Date.now()}`;
};

// Function to highlight building at POI location
export const highlightBuildingAtLocation = (map, coordinates, color, highlightId = 'poi-highlighted-building') => {
  if (!map?.current) return { remove: () => {} };

  console.log(`🏢 Highlighting building at ${coordinates} with color ${color}`);

  // Increment counter for z-indexing
  highlightCounter = (highlightCounter + 1) % 1000;
  const zIndex = Z_INDEX_BASE + (highlightCounter * Z_INDEX_STEP);
  
  const highlightLayerId = `highlight-layer-${highlightId}-${highlightCounter}`;
  const highlightSourceId = `highlight-source-${highlightId}-${highlightCounter}`;

  try {
    const { closestBuilding, cacheKey } = findClosestBuilding(map, coordinates, 'building');
    if (!closestBuilding) {
      console.log('❌ No building found to highlight');
      return { remove: () => {} };
    }

    console.log(`📍 Found building to highlight: ${cacheKey}`);

    // Track this building
    highlightedBuildings.add(cacheKey);

    // Calculate height offset based on how many buildings are highlighted
    const heightOffset = highlightedBuildings.size * HEIGHT_OFFSET_STEP;

    // Prepare the buffered feature
    let bufferedFeature = closestBuilding;
    if (closestBuilding.geometry.type === 'Polygon' || closestBuilding.geometry.type === 'MultiPolygon') {
      try {
        const turfFeature = turf.feature(closestBuilding.geometry);
        const buffered = turf.buffer(turfFeature, BUFFER_DISTANCE, { units: 'meters' });
        if (buffered) {
          const baseHeight = closestBuilding.properties.height || 30;
          bufferedFeature = {
            ...closestBuilding,
            geometry: buffered.geometry,
            properties: {
              ...closestBuilding.properties,
              height: baseHeight * HIGHLIGHT_HEIGHT_MULTIPLIER + heightOffset,
              min_height: (closestBuilding.properties.min_height || 0) * MIN_BASE_HEIGHT,
              original_height: baseHeight,
              highlight_order: highlightCounter
            }
          };
          console.log(`🏗️ Building height adjusted: ${baseHeight} -> ${bufferedFeature.properties.height}`);
        }
      } catch (e) {
        console.warn('Error buffering building geometry:', e);
      }
    }

    // Add highlight layer with enhanced z-fighting prevention
    map.current.addLayer({
      id: highlightLayerId,
      source: highlightSourceId,
      type: 'fill-extrusion',
      paint: {
        'fill-extrusion-color': color,
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15, ['+', ['*', ['get', 'height'], HIGHLIGHT_HEIGHT_MULTIPLIER], heightOffset],
          16, ['+', ['*', ['get', 'height'], HIGHLIGHT_HEIGHT_MULTIPLIER], heightOffset],
          17, ['+', ['*', ['get', 'height'], HIGHLIGHT_HEIGHT_MULTIPLIER], heightOffset]
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15, ['*', ['get', 'min_height'], MIN_BASE_HEIGHT],
          16, ['*', ['get', 'min_height'], MIN_BASE_HEIGHT],
          17, ['*', ['get', 'min_height'], MIN_BASE_HEIGHT]
        ],
        'fill-extrusion-opacity': 0.9,
        'fill-extrusion-vertical-gradient': true,
        'fill-extrusion-translate': [0, 0],
        'fill-extrusion-translate-anchor': 'viewport'
      }
    });

    const removeHighlight = () => {
      if (!map.current) return;
      
      // Remove from tracking
      highlightedBuildings.delete(cacheKey);
      console.log(`🗑️ Removed highlight for building: ${cacheKey}`);
      
      if (map.current.getLayer(highlightLayerId)) {
        map.current.removeLayer(highlightLayerId);
      }
      if (map.current.getSource(highlightSourceId)) {
        map.current.removeSource(highlightSourceId);
      }
    };

    return { remove: removeHighlight };
  } catch (error) {
    console.error('Error in building highlight process:', error);
    return { remove: () => {} };
  }
};

// Function to find the closest building to a POI
const findClosestBuilding = (map, coordinates, buildingLayerId) => {
  // Get the screen coordinates for the POI
  const center = map.current.project(coordinates);
  const initialSearchRadius = 75; // Increased from 50px for better initial coverage
  
  // Search radii to try, from small to large (in pixels)
  const searchRadii = [20, 50, 100, 200, 350, 500, 750, 1000]; // Increased radii with more intermediate values
  let features = [];
  
  // Keep track of which radiuses produced results (for debugging)
  const radiusResults = {};
  
  // First try a direct search within a small radius
  features = map.current.queryRenderedFeatures(
    [
      [center.x - initialSearchRadius, center.y - initialSearchRadius],
      [center.x + initialSearchRadius, center.y + initialSearchRadius]
    ],
    { layers: [buildingLayerId] }
  );
  
  // If no features found, try progressively wider searches
  if (features.length === 0) {
    // Try multiple increasing radii to find buildings
    for (const radius of searchRadii) {
      // Use a slightly larger box for the search area
      const searchBox = [
        [center.x - radius * 1.2, center.y - radius * 1.2], // 20% larger box
        [center.x + radius * 1.2, center.y + radius * 1.2]
      ];
      
      features = map.current.queryRenderedFeatures(searchBox, { layers: [buildingLayerId] });
      
      // Log which radius found buildings (for debugging)
      if (features.length > 0) {
        radiusResults[radius] = features.length;
        break; // Exit once we find buildings
      }
    }
  }
  
  // Occasional debug logging for search radius results (only 10% of attempts to avoid spam)
  if (Math.random() < 0.1 && Object.keys(radiusResults).length > 0) {
    const logRadiusResults = Object.entries(radiusResults)
      .map(([radius, count]) => `${radius}px: ${count}`)
      .join(', ');
    console.log(`🔍 Building search results by radius: ${logRadiusResults}`);
  }
  
  if (features.length === 0) {
    return { closestBuilding: null, cacheKey: null };
  }
  
  // Filter out any non-building features
  features = features.filter(feature => 
    feature && feature.geometry && 
    (feature.geometry.type === 'Polygon' || 
     feature.geometry.type === 'MultiPolygon' ||
     feature.geometry.type === 'Point')
  );
  
  // Find closest building by calculating distance to each building
  let closestBuilding = null;
  let minDistance = Infinity;
  let cacheKey = null;
  
  features.forEach((feature) => {
    // Skip features with invalid geometries
    if (!feature.geometry || !feature.geometry.coordinates) {
      return;
    }
    
    try {
      // Get a cache key for this building
      const featureCacheKey = getBuildingCacheKey(feature);
      
      // Calculate the center point of the building
      const center = calculateFeatureCenter(feature);
      if (!center) return;
      
      // Calculate distance from POI to building center
      const dist = calculateDistance(center, coordinates);
      
      // Apply an area factor to prefer larger buildings when distances are similar
      let areaPenalty = 1.0;
      
      // For polygons, calculate approximate area and apply a slight preference for larger buildings
      if ((feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') && 
          feature.properties && feature.properties.area) {
        const area = feature.properties.area;
        areaPenalty = 1.0 / (1.0 + Math.log(1 + Math.min(area / 1000, 2)));
      }
      
      const adjustedDist = dist * areaPenalty;
      
      // Update if this is the closest building so far
      if (adjustedDist < minDistance) {
        minDistance = adjustedDist;
        closestBuilding = feature;
        cacheKey = featureCacheKey;
      }
    } catch (error) {
      // Skip this feature on error
    }
  });
  
  // If we didn't find a closest building but have features, use the first valid one
  if (!closestBuilding && features.length > 0) {
    for (const feature of features) {
      if (feature.geometry) {
        closestBuilding = feature;
        cacheKey = getBuildingCacheKey(feature);
        break;
      }
    }
  }
  
  return { closestBuilding, cacheKey };
};

// Helper function to calculate the center point of a feature
const calculateFeatureCenter = (feature) => {
  if (!feature || !feature.geometry || !feature.geometry.coordinates) {
    return null;
  }
  
  try {
    const type = feature.geometry.type;
    
    if (type === 'Point') {
      return feature.geometry.coordinates;
    }
    
    if (type === 'Polygon') {
      const coords = feature.geometry.coordinates[0];
      if (!coords || coords.length === 0) return null;
      
      let sumX = 0, sumY = 0, n = 0;
      for (let i = 0; i < coords.length; i++) {
        if (Array.isArray(coords[i]) && coords[i].length >= 2) {
          sumX += coords[i][0];
          sumY += coords[i][1];
          n++;
        }
      }
      
      return n > 0 ? [sumX / n, sumY / n] : null;
    }
    
    if (type === 'MultiPolygon') {
      let sumX = 0, sumY = 0, totalPoints = 0;
      
      // Process each polygon in the multipolygon
      for (let i = 0; i < feature.geometry.coordinates.length; i++) {
        const polygon = feature.geometry.coordinates[i];
        if (!polygon || !polygon[0]) continue;
        
        const coords = polygon[0];
        let polygonSumX = 0, polygonSumY = 0, n = 0;
        
        for (let j = 0; j < coords.length; j++) {
          if (Array.isArray(coords[j]) && coords[j].length >= 2) {
            polygonSumX += coords[j][0];
            polygonSumY += coords[j][1];
            n++;
          }
        }
        
        if (n > 0) {
          // Weight by number of points
          sumX += polygonSumX;
          sumY += polygonSumY;
          totalPoints += n;
        }
      }
      
      return totalPoints > 0 ? [sumX / totalPoints, sumY / totalPoints] : null;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

// Helper function to calculate distance between two coordinate pairs
const calculateDistance = (point1, point2) => {
  return Math.sqrt(
    Math.pow(point1[0] - point2[0], 2) + 
    Math.pow(point1[1] - point2[1], 2)
  );
};

// Helper function to find the highest layer
const findHighestLayer = (map) => {
  const layers = map.getStyle().layers;
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    if (!layer.id.includes('label') && !layer.id.includes('symbol')) {
      return layer.id;
    }
  }
  return undefined;
}; 