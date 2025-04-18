import { useEffect } from 'react';

const DEBUG_LOGGING = false;

const log = (message, ...args) => {
  if (DEBUG_LOGGING) {
    console.log(message, ...args);
  }
};

const error = (message, error) => {
  console.error(`OSM POI Layer Error: ${message}`, error?.message || error);
};

const OSMPOILayer = ({ map, isVisible = false }) => {
  useEffect(() => {
    if (!map) return;
    
    try {
      const layer = map.getLayer('osm-poi-layer');
      if (layer) {
        map.setLayoutProperty('osm-poi-layer', 'visibility', isVisible ? 'visible' : 'none');
        log('OSM POI layer visibility updated:', isVisible);
      } else {
        error('OSM POI layer not found');
      }
    } catch (err) {
      error('Failed to update OSM POI layer visibility', err);
    }
  }, [map, isVisible]);

  // ... existing code ...
}; 