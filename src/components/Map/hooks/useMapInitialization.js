import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAP_CONFIG, BOSTON_HARBOR_BOUNDS } from '../constants';
import { formatWaterData, formatAIConsensusData } from '../components/PopupCards';
import { mockDisagreementData } from '../constants/mockData';
import { handlePanelCollapse } from '../hooks/mapAnimations';  // Import the handlePanelCollapse function
import { initializeHarborLayers, updateHarborLighting } from '../utils/harborLayers';

const DEBUG_LOGGING = false;

const log = (...args) => {
  if (DEBUG_LOGGING) {
    console.log(...args);
  }
};

export const useMapInitialization = (map, mapContainer) => {
  useEffect(() => {
    if (!map.current) {
      log('Initializing map...');

      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v10',
          center: [-71.0589, 42.3601],
          zoom: 12,
          pitch: 45,
          bearing: 0
        });

        // Navigation controls removed as requested

        map.current.on('load', () => {
          log('Map load event fired');

          try {
            // Check if style is loaded
            if (map.current.isStyleLoaded()) {
              initializeLayers();
            } else {
              map.current.once('style.load', initializeLayers);
            }
          } catch (error) {
            log('Error during map load:', error);
          }
        });

        const initializeLayers = () => {
          try {
            // Check if layers already exist before adding
            if (!map.current.getLayer('miami-pois')) {
              // Add POI layers
              map.current.addLayer({
                'id': 'miami-pois',
                'type': 'symbol',
                // ... rest of layer config
              });
            }

            // Set default visibility for 3D buildings
            const buildingLayers = ['3d-buildings', 'harbor-buildings-3d'];
            buildingLayers.forEach(layerId => {
              if (map.current.getLayer(layerId)) {
                map.current.setLayoutProperty(layerId, 'visibility', 'none');
              }
            });

            log('Map initialization complete');
          } catch (error) {
            log('Error initializing layers:', error);
          }
        };
      } catch (error) {
        log('Error creating map:', error);
      }
    }

    return () => {
      if (map.current) {
        log('Cleaning up map...');
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
};