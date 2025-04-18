// Category color mapping
const categoryColors = {
  restaurants: '#ff9900',
  cafes: '#cc6600',
  bars: '#990099',
  shops: '#0066ff',
  cultural: '#cc3300',
  parks: '#33cc33',
  education: '#ff3333',
  healthcare: '#ff0000'
};

export const getCategoryColor = (category) => {
  const normalizedCategory = category.toLowerCase();
  return categoryColors[normalizedCategory] || '#999999'; // Default gray for unknown categories
};

export const processVisiblePOIs = (map, graphOnlyMode = false, showOSM = false) => {
  if (!map) return null;

  const bounds = map.getBounds();
  const zoom = map.getZoom();
  const visiblePOIs = [];
  let categoryTotals = {};

  // Process POIs within bounds
  const features = map.queryRenderedFeatures(undefined, {
    layers: showOSM ? ['osm-pois'] : ['miami-pois']
  });

  features.forEach(feature => {
    const { properties, geometry } = feature;
    if (!properties || !geometry) return;

    const category = properties.type || 'unknown';
    categoryTotals[category] = (categoryTotals[category] || 0) + 1;

    if (geometry.type === 'Point') {
      visiblePOIs.push({
        name: properties.name || 'Unnamed POI',
        category: category,
        x: properties.rating || 0,
        y: properties.review_count || 0,
        lngLat: geometry.coordinates,
        color: getCategoryColor(category)
      });
    }
  });

  console.log('POIGraph: Processed POIs:', {
    source: showOSM ? 'OSM' : 'Miami',
    total: visiblePOIs.length,
    byCategory: categoryTotals
  });

  return {
    scatterData: visiblePOIs,
    categories: Object.keys(categoryTotals),
    counts: Object.values(categoryTotals),
    popularityScores: Object.values(categoryTotals).map(count => Math.log(count + 1))
  };
}; 