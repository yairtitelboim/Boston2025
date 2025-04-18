/**
 * Checks if a layer is visible in the map
 * @param {Object} map - Mapbox map instance
 * @param {string} layerId - ID of the layer to check
 * @returns {boolean} - Whether the layer is visible
 */
export const isLayerVisible = (map, layerId) => {
  if (!map || !layerId) return false;
  
  try {
    // Special handling for 3D buildings
    if (layerId === '3d-buildings') {
      return map.getLayoutProperty('3d-buildings', 'visibility') === 'visible';
    }
    
    // Special handling for Boston buildings
    if (layerId === 'boston-buildings') {
      return map.getLayoutProperty('boston-buildings', 'visibility') === 'visible';
    }
    
    // Check if the layer exists first
    if (!map.getLayer(layerId)) {
      console.warn(`Layer ${layerId} not found in map`);
      return false;
    }
    
    // Get the visibility property
    const visibility = map.getLayoutProperty(layerId, 'visibility');
    return visibility === 'visible';
  } catch (error) {
    console.warn(`Error checking visibility for layer ${layerId}:`, error);
    return false;
  }
}; 