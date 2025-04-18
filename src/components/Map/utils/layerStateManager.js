/**
 * Layer State Manager
 *
 * A global utility to track and manage the state of all map layers.
 * This provides a central place for components to register their layer states
 * and for the SceneManager to access those states when saving/loading scenes.
 */

// Initialize the state object
const layerStates = {
  // Transportation layers
  showTransportation: false,
  showRoads: false,

  // Public Transit layers
  showOSMTransit: false,
  showTransitStops: false,
  showTransitRoutes: false,

  // Bike Network layers
  showOSMBike: false,
  showBikeLanes: false,
  showBikePaths: false,
  showBikeParking: false,

  // Pedestrian Network layers
  showOSMPedestrian: false,
  showPedestrianPaths: false,
  showPedestrianCrossings: false,

  // POI layers
  showPOIMarkers: true,
  showOSMPOIs: false,

  // Building layers
  showBostonBuildings: false,
  show3DBuildings: false,

  // Other layers
  showZoningLayer: false,
  showPlanningAnalysis: false,
  showAdaptiveReuse: false,
  showDevelopmentPotential: false,
  showNeighborhoodBoundaries: false,
  showNeighborhoodLabels: false,
  showPropertyPrices: false,
  showParks: false,
  showEmployment: false,
  showEmploymentLabels: false,
  showLocalZones: false,
  showLocalZoneBoundaries: false,
  showLocalZoneLabels: false,

  // POI Graph state
  poiGraphOpen: false,
  poiVisibleCategories: {},
  poiGraphShowOSM: false,
  poiGraphShowCurve: false,
  poiGraphShowRadius: false,

  // Callback registry for state changes
  _callbacks: {}
};

// Setter functions registry
const setterFunctions = {};

/**
 * Register a layer state and its setter function
 * @param {string} layerKey - The key for the layer state
 * @param {function} setterFn - The React setState function for this layer
 * @param {boolean} initialValue - The initial value of the layer state
 */
const registerLayer = (layerKey, setterFn, initialValue) => {
  if (layerKey in layerStates) {
    layerStates[layerKey] = initialValue;
  } else {
    console.warn(`Adding new layer state: ${layerKey}`);
    layerStates[layerKey] = initialValue;
  }

  setterFunctions[layerKey] = setterFn;

  console.log(`Registered layer: ${layerKey}, initial state: ${initialValue}`);
  return true;
};

/**
 * Update a layer's state
 * @param {string} layerKey - The key for the layer state
 * @param {boolean} value - The new value
 */
const updateLayerState = (layerKey, value) => {
  if (!(layerKey in layerStates)) {
    console.warn(`Updating unknown layer state: ${layerKey}`);
    layerStates[layerKey] = value;
    return false;
  }

  // Update the state
  layerStates[layerKey] = value;

  // Notify any registered callbacks
  if (layerKey in layerStates._callbacks) {
    layerStates._callbacks[layerKey].forEach(callback => {
      try {
        callback(value);
      } catch (error) {
        console.error(`Error in callback for ${layerKey}:`, error);
      }
    });
  }

  return true;
};

/**
 * Get all layer states
 * @returns {Object} The current state of all layers
 */
const getAllLayerStates = () => {
  // Create a copy without the _callbacks property
  const stateCopy = { ...layerStates };
  delete stateCopy._callbacks;
  return stateCopy;
};

/**
 * Set multiple layer states at once
 * @param {Object} states - Object containing layer keys and their new values
 */
const setAllLayerStates = (states) => {
  if (!states || typeof states !== 'object') {
    console.error('Invalid states object provided to setAllLayerStates');
    return false;
  }

  console.log('Setting all layer states:', states);

  // Update each layer state and call its setter function if available
  Object.entries(states).forEach(([key, value]) => {
    // Skip internal properties
    if (key.startsWith('_')) return;

    // Update our internal state
    layerStates[key] = value;

    // Call the React setter function if available
    if (setterFunctions[key]) {
      try {
        setterFunctions[key](value);
        console.log(`Updated ${key} to ${value} (with setter)`);
      } catch (error) {
        console.error(`Error calling setter for ${key}:`, error);
      }
    } else {
      console.log(`Updated ${key} to ${value} (no setter available)`);
    }

    // Notify any registered callbacks
    if (layerStates._callbacks[key]) {
      layerStates._callbacks[key].forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error(`Error in callback for ${key}:`, error);
        }
      });
    }
  });

  return true;
};

/**
 * Register a callback for when a layer state changes
 * @param {string} layerKey - The key for the layer state
 * @param {function} callback - The callback function
 */
const onLayerStateChange = (layerKey, callback) => {
  if (!(layerKey in layerStates)) {
    console.warn(`Registering callback for unknown layer: ${layerKey}`);
    layerStates[layerKey] = false;
  }

  if (!layerStates._callbacks[layerKey]) {
    layerStates._callbacks[layerKey] = [];
  }

  layerStates._callbacks[layerKey].push(callback);
  return true;
};

/**
 * Remove a callback for a layer state
 * @param {string} layerKey - The key for the layer state
 * @param {function} callback - The callback function to remove
 */
const offLayerStateChange = (layerKey, callback) => {
  if (!(layerKey in layerStates) || !layerStates._callbacks[layerKey]) {
    return false;
  }

  layerStates._callbacks[layerKey] = layerStates._callbacks[layerKey].filter(cb => cb !== callback);
  return true;
};

// Create and export the layer state manager
const layerStateManager = {
  registerLayer,
  updateLayerState,
  getAllLayerStates,
  setAllLayerStates,
  onLayerStateChange,
  offLayerStateChange
};

// Make it available globally
window.layerStateManager = layerStateManager;

export default layerStateManager;
