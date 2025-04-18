import React, { useState, useEffect, useCallback } from 'react';
import { getColorForCategory, getBuildingTypesForCategory } from '../../utils/colorUtils';

// Set debug logging flag - disabled in production
const DEBUG_LOGGING = false;

// Helper function for logging that checks DEBUG_LOGGING flag
const log = (message, ...args) => {
  if (DEBUG_LOGGING) {
    console.log(`Boston Buildings: ${message}`, ...args);
  }
};

const error = (message, err) => {
  if (err?.message?.includes('version') || err?.message?.includes('style')) {
    // Suppress common initialization errors
    return;
  }
  console.error(`Boston Buildings Error: ${message}`, err?.message || err);
};

const BostonBuildingsLayer = ({ map, visible, selectedPOI, visibleCategories }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const initializeLayer = async () => {
    if (!map?.current) return false;

    try {
      // Check if GeoJSON file exists
      const response = await fetch('/boston_buildings.geojson');
      if (!response.ok) {
        error('GeoJSON file not found or inaccessible');
        return false;
      }

      // Add source
      if (!map.current.getSource('boston-buildings')) {
        map.current.addSource('boston-buildings', {
          type: 'geojson',
          data: '/boston_buildings.geojson'
        });
      }

      // Add layers if they don't exist
      if (!map.current.getLayer('boston-buildings')) {
        map.current.addLayer({
          id: 'boston-buildings',
          type: 'fill-extrusion',
          source: 'boston-buildings',
          paint: {
            'fill-extrusion-color': '#444444',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.6
          },
          layout: {
            visibility: 'none'
          }
        });
      }

      setIsLoaded(true);
      return true;
    } catch (err) {
      error('Failed to initialize layer', err);
      return false;
    }
  };

  const updateLayerVisibility = useCallback(() => {
    if (!map?.current || !isLoaded) return;

    try {
      const visibility = visible ? 'visible' : 'none';
      map.current.setLayoutProperty('boston-buildings', 'visibility', visibility);
    } catch (err) {
      error('Failed to update layer visibility', err);
    }
  }, [map, visible, isLoaded]);

  const updateBuildingColors = useCallback(() => {
    if (!map?.current || !isLoaded) return;

    try {
      const colorExpression = ['match', ['get', 'building']];
      
      // Add color cases for each building type
      Object.entries(visibleCategories).forEach(([category, isVisible]) => {
        if (isVisible) {
          const color = getColorForCategory(category);
          const buildingTypes = getBuildingTypesForCategory(category);
          buildingTypes.forEach(type => {
            colorExpression.push(type);
            colorExpression.push(color);
          });
        }
      });

      // Add default color
      colorExpression.push('#444444');

      map.current.setPaintProperty('boston-buildings', 'fill-extrusion-color', colorExpression);
    } catch (err) {
      error('Failed to update building colors', err);
    }
  }, [map, isLoaded, visibleCategories]);

  // Effect for initialization
  useEffect(() => {
    if (!map?.current || isLoaded) return;

    initializeLayer();
  }, [map, isLoaded]);

  // Effect for visibility changes
  useEffect(() => {
    updateLayerVisibility();
  }, [updateLayerVisibility]);

  // Effect for color updates
  useEffect(() => {
    updateBuildingColors();
  }, [updateBuildingColors]);

  return null;
};

export default BostonBuildingsLayer; 