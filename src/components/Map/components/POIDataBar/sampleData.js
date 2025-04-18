import { SAMPLE_POI_DATA } from './constants';

// Flatten the sample data for easier use in the test component
export const flattenedSampleData = Object.entries(SAMPLE_POI_DATA).flatMap(([category, items]) => 
  items.map(item => ({
    name: item.name,
    category: category,
    rating: item.rating,
    reviews: item.popularity, // Using popularity as a proxy for reviews
    lat: item.coordinates[1],
    lng: item.coordinates[0],
    color: getCategoryColor(category)
  }))
);

// Simple function to get a color for each category
function getCategoryColor(category) {
  const colorMap = {
    restaurants: '#FF5733', // Red-orange
    cafes: '#C70039',       // Dark red
    bars: '#900C3F',        // Burgundy
    shops: '#581845',       // Purple
    cultural: '#2471A3',    // Blue
    parks: '#229954',       // Green
    education: '#F1C40F',   // Yellow
    healthcare: '#E67E22',  // Orange
    transportation: '#7D3C98' // Purple
  };
  
  return colorMap[category] || '#777777'; // Default gray
}

export default flattenedSampleData;
