import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';
import { useMapLogic } from '../../hooks/useMapLogic';
import BuildingPopup from './BuildingPopup';
import { MapContext } from './MapContext';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

function Map({ articles = [], onArticleUpdate }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const selectedBuildingLayerId = 'selected-building';
  const [mapLoaded, setMapLoaded] = useState(false);

  const {
    lng, lat, zoom, selectedArticle, popupCoordinates, handleMapLoad,
    handleValidate, handleMatchResults, showComparison, validationError, 
    isValidating, retryCount, MAX_RETRIES, lastValidationTime, 
    showTypewriter, matchedResults, validatedData, validationScore,
    handleAnalysis, getBuildingShape, handleBackToOriginal,
    handleMarkerClick
  } = useMapLogic(map, mapContainer, articles, onArticleUpdate);

  const createMarkers = () => {
    console.log('Creating markers for', articles.length, 'articles');
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    articles.forEach(article => {
      if (!article.location?.latitude || !article.location?.longitude) {
        console.log('Skipping article without location');
        return;
      }

      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      Object.assign(markerElement.style, {
        width: '15px',
        height: '15px',
        backgroundColor: '#FF4136',
        borderRadius: '50%',
        cursor: 'pointer',
        boxShadow: '0 0 10px rgba(0,0,0,0.9)',
        zIndex: '1'
      });

      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center'
      })
        .setLngLat([article.location.longitude, article.location.latitude])
        .addTo(map.current);

      markerElement.addEventListener('click', () => {
        console.log('Marker clicked:', article.location.address);
        handleMarkerClick(article);
      });

      markersRef.current.push(marker);
    });
    
    console.log('Created', markersRef.current.length, 'markers');
  };

  // Initialize map
  useEffect(() => {
    console.log('Map initialization effect triggered');
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [-98.5795, 39.8283],
      zoom: 3,
      pitch: 45,
      bearing: -17.6,
      antialias: true,
      minZoom: 15,
      maxZoom: 20,
      maxBounds: [[-180, -85], [180, 85]],
      preserveDrawingBuffer: false,
      renderWorldCopies: false,
      trackResize: true,
      fadeDuration: 0,
      transformRequest: (url, resourceType) => {
        if (resourceType === 'Tile') {
          // Only proceed with streets-v8 tiles
          if (url.includes('mapbox.mapbox-streets-v8')) {
            return {
              url: url
            };
          }
          // Skip other tile requests without causing errors
          return {
            url: url,
            cancel: true
          };
        }
        // Allow all other requests to proceed normally
        return {
          url: url
        };
      }
    });

    // Optimize performance by limiting tile loading
    map.current.on('style.load', () => {
      map.current.setConfigProperty('basemap', 'lightPreset', 'dusk');




      // Add the building source with optimized settings
      map.current.addSource('composite-3d-buildings', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-streets-v8',
        maxzoom: 15,
        minzoom: 15, // Only load tiles at zoom levels we need
        tileSize: 512, // Larger tiles = fewer requests
        tolerance: 0.5 // Simplify geometries
      });

      // Add source for selected building with optimized settings
      map.current.addSource('selected-building', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        maxzoom: 20,
        tolerance: 0.5,
        buffer: 0 // Reduce memory usage
      });

      // Add 3D buildings layer with visibility conditions
      map.current.addLayer({
        'id': '3d-buildings',
        'type': 'fill-extrusion',
        'source': 'composite-3d-buildings',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'paint': {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'coalesce',
            ['get', 'height'],
            0
          ],
          'fill-extrusion-base': [
            'coalesce',
            ['get', 'base_height'],
            0
          ],
          'fill-extrusion-opacity': 0.8
        },
        'minzoom': 15,
        'maxzoom': 20
      });

      // Optimize tile loading
      map.current.on('sourcedataloading', (e) => {
        if (e.isSourceLoaded) return;
        
        // Cancel unnecessary tile requests
        const zoom = map.current.getZoom();
        if (zoom < 15 || zoom > 20) {
          e.preventDefault();
        }
      });

      // Add selected building layer
      map.current.addLayer({
        'id': 'selected-building',
        'type': 'model',
        'source': 'selected-building',
        'slot': 'middle',
        'paint': {
          'model-opacity': 1.0,
          'model-color': '#FF4136',
          'model-cast-shadows': true,
          'model-emissive-strength': 2.0,
          'model-color-mix-intensity': 1.0,
          'model-ambient-occlusion-intensity': 0.3,
          'model-ambient-occlusion-constant': 0.7
        }
      });
    });

    // Optimize the load event
    map.current.on('load', () => {
      console.log('Map load event triggered');
      handleMapLoad();
      
      // Enable atmosphere and fog with reduced settings
      map.current.setFog({
        'range': [1, 8],
        'color': '#242B4B',
        'horizon-blend': 0.2
      });

      createMarkers();

      map.current.flyTo({
        center: [lng, lat],
        zoom: zoom + 0.5,
        pitch: 45,
        bearing: -17.6,
        duration: 4000,
        essential: true
      });

      setMapLoaded(true);
    });

    // Clean up resources
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [handleMapLoad, lat, lng, zoom]);

  // Update markers when articles change
  useEffect(() => {
    if (map.current?.loaded()) {
      createMarkers();
    }
  }, [articles]);

  // Constants for source and layer names
  const BUILDING_SOURCE_ID = 'selected-building';
  const BUILDING_LAYER_ID = 'selected-building';

  // Helper function to ensure source exists
  const ensureSource = () => {
    if (!map.current) return null;
    
    try {
      let source = map.current.getSource(BUILDING_SOURCE_ID);
      if (!source) {
        // Create source if it doesn't exist
        map.current.addSource(BUILDING_SOURCE_ID, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
        
        // Create layer if it doesn't exist
        if (!map.current.getLayer(BUILDING_LAYER_ID)) {
          map.current.addLayer({
            id: BUILDING_LAYER_ID,
            type: 'fill-extrusion',
            source: BUILDING_SOURCE_ID,
            paint: {
              'fill-extrusion-color': '#0066FF',
              'fill-extrusion-opacity': 0.8,
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'base_height']
            }
          });
        }
        
        source = map.current.getSource(BUILDING_SOURCE_ID);
      }
      return source;
    } catch (error) {
      console.error('Error ensuring source exists:', error);
      return null;
    }
  };

  // Helper function to validate coordinates
  const isValidCoordinate = (coord) => {
    return Array.isArray(coord) && 
           coord.length === 2 && 
           !isNaN(coord[0]) && 
           !isNaN(coord[1]) &&
           Math.abs(coord[0]) <= 180 && 
           Math.abs(coord[1]) <= 90;
  };

  // Helper function to validate and clean GeoJSON
  const createValidGeoJSON = (buildingShape) => {
    if (!buildingShape || !buildingShape.geometry) return null;

    try {
      const coordinates = buildingShape.geometry.coordinates;
      if (!Array.isArray(coordinates) || !coordinates.length) return null;

      // Validate all coordinates
      const validCoordinates = coordinates[0].filter(isValidCoordinate);
      if (validCoordinates.length < 3) return null;

      return {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {
            height: 30,
            base_height: 0
          },
          geometry: {
            type: 'Polygon',
            coordinates: [validCoordinates]
          }
        }]
      };
    } catch (error) {
      console.error('Error creating GeoJSON:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!map.current || !map.current.loaded()) return;

    try {
      if (selectedArticle) {
        const buildingShape = getBuildingShape(selectedArticle);
        console.log('Building shape:', buildingShape); // Debug log
        
        const validGeoJSON = createValidGeoJSON(buildingShape);
        console.log('Valid GeoJSON:', validGeoJSON); // Debug log
        
        if (validGeoJSON) {
          const source = ensureSource();
          if (source) {
            source.setData(validGeoJSON);
          } else {
            console.warn('Failed to get or create source');
          }
        } else {
          console.warn('Invalid building shape data');
        }
      } else {
        // Clear selection
        const source = ensureSource();
        if (source) {
          source.setData({
            type: 'FeatureCollection',
            features: []
          });
        }
      }
    } catch (error) {
      console.error('Error updating building highlight:', error);
    }
  }, [selectedArticle, getBuildingShape]);

  const cleanupBuildingLayers = () => {
    if (!map.current) return;
    
    try {
      const layersToRemove = [
        'clip-layer',
        'highlighted-building',
        'highlighted-building-glow-outer',
        'highlighted-building-edges'
      ];
      
      layersToRemove.forEach(layerId => {
        if (map.current.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
      });

      ['clip-area', 'highlighted-building'].forEach(sourceId => {
        if (map.current.getSource(sourceId)) {
          map.current.removeSource(sourceId);
        }
      });
    } catch (error) {
      console.error('Error cleaning up building layers:', error);
    }
  };

  return (
    <MapContext.Provider value={{ map, getBuildingShape }}>
      <div className="relative w-full h-screen">
        <div ref={mapContainer} className="w-full h-full" />
        {selectedArticle && popupCoordinates && (
          <BuildingPopup
            selectedArticle={selectedArticle}
            popupCoordinates={popupCoordinates}
            handleBackToOriginal={handleBackToOriginal}
            handleValidate={handleValidate}
            handleMatchResults={handleMatchResults}
            showComparison={showComparison}
            validationError={validationError}
            isValidating={isValidating}
            retryCount={retryCount}
            MAX_RETRIES={MAX_RETRIES}
            lastValidationTime={lastValidationTime}
            showTypewriter={showTypewriter}
            matchedResults={matchedResults}
            validatedData={validatedData}
            validationScore={validationScore}
            handleAnalysis={handleAnalysis}
          />
        )}
      </div>
    </MapContext.Provider>
  );
}

export default Map;

