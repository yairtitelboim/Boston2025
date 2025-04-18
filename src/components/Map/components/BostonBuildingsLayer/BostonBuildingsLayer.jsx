import React, { useState, useEffect, useRef } from 'react';

const DEBUG_LOGGING = false;

const log = (...args) => {
  if (DEBUG_LOGGING) {
    console.log(...args);
  }
};

const BostonBuildingsLayer = ({ map, visible, selectedPOI, visibleCategories }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(visible);
  const initAttempts = useRef(0);

  useEffect(() => {
    if (!map?.current || isLoaded || initAttempts.current >= 3) return;

    const initializeLayer = async () => {
      try {
        initAttempts.current++;
        log(`BostonBuildingsLayer: Starting initialization (Attempt ${initAttempts.current})`);

        // Check if GeoJSON file exists
        const response = await fetch('/boston-buildings.geojson');
        if (!response.ok) {
          throw new Error(`Failed to load GeoJSON: ${response.status}`);
        }

        // Add source if it doesn't exist
        if (!map.current.getSource('boston-buildings')) {
          map.current.addSource('boston-buildings', {
            type: 'geojson',
            data: '/boston-buildings.geojson'
          });
        }

        // Add layers with initial visibility
        const visibility = visible ? 'visible' : 'none';
        
        if (!map.current.getLayer('boston-buildings')) {
          map.current.addLayer({
            id: 'boston-buildings',
            type: 'fill-extrusion',
            source: 'boston-buildings',
            layout: {
              visibility
            },
            paint: {
              'fill-extrusion-color': '#444444',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.6
            }
          });
        }

        setIsLoaded(true);
        log('BostonBuildingsLayer: Initialization complete');
      } catch (error) {
        log('BostonBuildingsLayer: Initialization error:', error);
      }
    };

    initializeLayer();
  }, [map, visible, isLoaded]);

  // Rest of the component code...
}; 