import { getColorForCategory } from '../../POIDataBar/utils/poiDataManager';
import { mapEventBus } from '../../../../../utils/eventBus';

// Map OSM categories to our standardized category system
const categoryMap = {
  // Amenity types
  'restaurant': 'restaurants',
  'cafe': 'cafes',
  'bar': 'bars',
  'pub': 'bars',
  'shop': 'shops',
  'museum': 'cultural',
  'theatre': 'cultural',
  'cinema': 'cultural',
  'park': 'parks',
  'school': 'education',
  'university': 'education',
  'hospital': 'healthcare',
  'pharmacy': 'healthcare',
  'bus_station': 'transportation',
  'train_station': 'transportation',
  'subway_entrance': 'transportation',

  // Type mappings
  'Restaurant': 'restaurants',
  'Cafe': 'cafes',
  'Bar': 'bars',
  'Pub': 'bars',
  'Shop': 'shops',
  'Museum': 'cultural',
  'Theatre': 'cultural',
  'Cinema': 'cultural',
  'Park': 'parks',
  'School': 'education',
  'University': 'education',
  'Hospital': 'healthcare',
  'Pharmacy': 'healthcare',
  'Bus Station': 'transportation',
  'Train Station': 'transportation',
  'Subway Entrance': 'transportation',

  // Category mappings
  'restaurants': 'restaurants',
  'cafes': 'cafes',
  'bars': 'bars',
  'shops': 'shops',
  'cultural': 'cultural',
  'parks': 'parks',
  'education': 'education',
  'healthcare': 'healthcare',
  'transportation': 'transportation'
};

// Initialize categories and their containers
const initializeCategories = () => {
  const categories = ['restaurants', 'cafes', 'bars', 'shops', 'cultural', 'parks', 'education', 'healthcare', 'transportation'];
  const updatedPOIs = {};
  const updatedCounts = {};

  categories.forEach(category => {
    updatedPOIs[category] = [];
    updatedCounts[category] = 0;
  });

  return { updatedPOIs, updatedCounts };
};

// Extract category from feature properties
const extractCategory = (feature) => {
  let category = 'other';

  // Try to get category from various property fields
  if (feature.properties.category_en) {
    category = feature.properties.category_en;
  } else if (feature.properties.type) {
    category = feature.properties.type;
  } else if (feature.properties.amenity) {
    category = feature.properties.amenity;
  } else if (feature.properties.leisure) {
    category = feature.properties.leisure;
  } else if (feature.properties.shop) {
    category = feature.properties.shop;
  }

  const mappedCategory = categoryMap[category] || 'other';
  return mappedCategory;
};

// Process a single feature into a POI object
const processFeature = (feature) => {
  try {
    const properties = feature.properties || {};
    const category = extractCategory(feature);

    if (!category) {
      console.log('POI Graph: Skipping feature - no valid category:', properties);
      return null;
    }

    // Get coordinates from the feature
    const coordinates = feature.geometry?.coordinates || [];
    if (coordinates.length < 2) {
      console.log('POI Graph: Skipping feature - no valid coordinates:', properties);
      return null;
    }

    // Create POI object with location data
    const poi = {
      name: properties.name || 'Unnamed POI',
      category: category,
      rating: parseFloat(properties.rating) || (1 + Math.random() * 4),
      reviews: parseInt(properties.reviews) || Math.floor(Math.random() * 100),
      color: getColorForCategory(category),
      lngLat: [coordinates[0], coordinates[1]] // Store coordinates for map interaction
    };

    console.log('POI Graph: Processed feature:', poi);
    return poi;
  } catch (error) {
    console.error('POI Graph: Error processing feature:', error);
    return null;
  }
};

// Create scatter data points from POIs
const createScatterData = (updatedPOIs) => {
  const scatterData = [];

  console.log('POI Graph: Creating scatter data from POIs:', updatedPOIs);

  Object.entries(updatedPOIs).forEach(([category, pois]) => {
    console.log(`POI Graph: Processing category ${category} with ${pois.length} POIs`);

    if (pois && pois.length > 0) {
      pois.forEach(poi => {
        if (!poi) return; // Skip null POIs

        const scatterPoint = {
          x: poi.rating,
          y: poi.reviews,
          category: category,
          name: poi.name,
          color: poi.color,
          lngLat: poi.lngLat // Include coordinates in scatter point
        };


        scatterData.push(scatterPoint);
      });
    }
  });

  return scatterData;
};

let osmFeaturesCache = {};

// Subscribe to OSM features updates
mapEventBus.on('osm:features', (event) => {
  // Store OSM features for graph
  osmFeaturesCache = event.features;
});

// Also listen for graph-specific visibility events
mapEventBus.on('osmGraph:visibility', (event) => {
  // Handle graph-specific OSM visibility event
  // No need to update cache, just log for debugging
});

// Generate a deterministic "random" value based on a seed string
// This ensures the same seed always produces the same value
const generateDeterministicValue = (seed, min, max) => {
  // Create a simple hash from the seed string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  // Normalize to a value between 0 and 1
  const normalizedValue = Math.abs(hash) / 2147483647;
  // Scale to the desired range
  return min + normalizedValue * (max - min);
};

// Main function to process visible POI features
export const processVisiblePOIs = (map, graphOnlyMode = false, showOSM = false) => {
  if (!map) return null;

  const bounds = map.getBounds();
  const visiblePOIs = [];
  let categoryTotals = {};

  if (showOSM) {
    // Process OSM data for graph
    // Process OSM features from cache
    Object.entries(osmFeaturesCache).forEach(([category, features]) => {
      // Filter features within bounds
      const visibleFeatures = features.filter(feature => {
        const [lng, lat] = feature.geometry.coordinates;
        return bounds.contains([lng, lat]);
      });

      categoryTotals[category] = visibleFeatures.length;

      visibleFeatures.forEach(feature => {
        const { properties, geometry } = feature;
        if (!properties || !geometry || geometry.type !== 'Point') return;

        // Use the global generateDeterministicValue function

        // Create a unique seed for this POI
        const poiSeed = `${properties.name || ''}${geometry.coordinates[0]}${geometry.coordinates[1]}`;

        // Use actual values if available, otherwise use deterministic "random" values
        const rating = properties.rating || generateDeterministicValue(poiSeed + 'rating', 1, 5);
        const reviewCount = properties.review_count || Math.floor(generateDeterministicValue(poiSeed + 'reviews', 1, 100));

        visiblePOIs.push({
          name: properties.name || 'Unnamed POI',
          category: category,
          x: rating,
          y: reviewCount,
          lngLat: geometry.coordinates,
          color: getColorForCategory(category)
        });
      });
    });
  } else {
    // Process Miami POIs within bounds
    const features = map.queryRenderedFeatures(undefined, {
      layers: ['miami-pois']
    });

    features.forEach(feature => {
      const { properties, geometry } = feature;
      if (!properties || !geometry) return;

      const category = extractCategory(feature);
      categoryTotals[category] = (categoryTotals[category] || 0) + 1;

      if (geometry.type === 'Point') {
        // Use the global generateDeterministicValue function

        // Create a unique seed for this POI
        const poiSeed = `${properties.name || ''}${geometry.coordinates[0]}${geometry.coordinates[1]}`;

        // Use actual values if available, otherwise use deterministic "random" values
        const rating = properties.rating || generateDeterministicValue(poiSeed + 'rating', 1, 5);
        const reviewCount = properties.review_count || Math.floor(generateDeterministicValue(poiSeed + 'reviews', 1, 100));

        visiblePOIs.push({
          name: properties.name || 'Unnamed POI',
          category: category,
          x: rating,
          y: reviewCount,
          lngLat: geometry.coordinates,
          color: getColorForCategory(category)
        });
      }
    });
  }

  // Processing complete

  return {
    scatterData: visiblePOIs,
    categories: Object.keys(categoryTotals),
    counts: Object.values(categoryTotals),
    popularityScores: Object.values(categoryTotals).map(count => Math.log(count + 1))
  };
};