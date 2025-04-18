import { debugLog, debugWarn } from './MapDebug';

export const initializeMapStyles = async (map) => {
  if (!map.isStyleLoaded()) {
    await new Promise(resolve => map.once('style.load', resolve));
  }

  // Style water in the base map layers
  const waterLayers = [
    'water',
    'water-shadow',
    'waterway',
    'water-depth',
    'water-pattern'
  ];

  waterLayers.forEach(layerId => {
    if (!map.getLayer(layerId)) return;

    try {
      const layer = map.getLayer(layerId);
      if (!layer) return;

      // Handle fill layers
      if (layer.type === 'fill') {
        map.setPaintProperty(layerId, 'fill-color', '#001f3d');
        map.setPaintProperty(layerId, 'fill-opacity', 0.8);
      }

      // Handle line layers
      if (layer.type === 'line') {
        map.setPaintProperty(layerId, 'line-color', '#001f3d');
        map.setPaintProperty(layerId, 'line-opacity', 0.8);
      }
    } catch (error) {
      debugWarn(`Could not style water layer ${layerId}:`, error);
    }
  });

  // Style parks and green areas
  const parkLayers = [
    'landuse',
    'park',
    'park-label',
    'national-park',
    'natural',
    'golf-course',
    'pitch',
    'grass'
  ];

  parkLayers.forEach(layerId => {
    if (!map.getLayer(layerId)) return;

    try {
      const layer = map.getLayer(layerId);
      if (!layer) return;

      if (layer.type === 'fill') {
        map.setPaintProperty(layerId, 'fill-color', '#063006'); // Specific dark green color
        map.setPaintProperty(layerId, 'fill-opacity', 0.6); // Higher opacity for better visibility
      }
      if (layer.type === 'symbol' && map.getPaintProperty(layerId, 'background-color') !== undefined) {
        map.setPaintProperty(layerId, 'background-color', '#063006'); // Updated to match the fill color
      }
    } catch (error) {
      debugWarn(`Could not style park layer ${layerId}:`, error);
    }
  });

  // Log available transportation layers
  const layers = map.getStyle().layers;
  const transportationLayers = layers.filter(layer => {
    const layerId = layer.id.toLowerCase();
    return layerId.includes('road') ||
           layerId.includes('transit') ||
           layerId.includes('railway') ||
           layerId.includes('highway') ||
           layerId.includes('bridge') ||
           layerId.includes('tunnel') ||
           layerId.includes('traffic') ||
           layerId.includes('transportation');
  });
  debugLog('Transportation-related layers:', transportationLayers);
};