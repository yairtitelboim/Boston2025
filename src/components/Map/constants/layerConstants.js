export const COLORS = {
  roads: '#4A90E2',      // Blue
  publicTransit: '#9B59B6', // Purple
  bikeInfra: '#2ECC71',    // Green
  pedestrian: '#E67E22',    // Orange
  default: '#666666',        // Default gray color
  transit: '#9B59B6',  // Purple
  bike: '#2ECC71',     // Green
  pedestrian: '#E67E22' // Orange
};

export const TRANSPORTATION_CATEGORIES = {
  roads: ['road-simple', 'bridge-simple', 'tunnel-simple', 'road-label-simple']
};

export const ZONING_LAYER_IDS = [
  'zoning-fill',
  'zoning-outline',
  'zoning-hover',
  'zoning-inner-glow',
  'zoning-hover-glow'
];

export const DEFAULT_EXPANDED_CATEGORIES = {
  publicTransit: true,
  bikeNetwork: true,
  pedestrianNetwork: true,
  transportation: true,
  planning: true,
  parks: true,
  employment: true,
  neighborhoods: true,
  localZones: true,
  bostonBuildings: true,
  mapbox3DBuildings: true
}; 