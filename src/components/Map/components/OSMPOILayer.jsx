import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { mapEventBus } from '../../../utils/eventBus';

// Helper function to convert hex color to rgba with opacity
const hexToRgba = (hex, opacity) => {
  // Remove the hash if it exists
  hex = hex.replace('#', '');

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Return rgba color string
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const categories = [
  'restaurants',
  'cafes',
  'bars',
  'shops',
  'cultural',
  'parks',
  'education',
  'healthcare'
];

const colors = {
  restaurants: '#ff9900',
  cafes: '#cc6600',
  bars: '#990099',
  shops: '#0066ff',
  cultural: '#cc3300',
  parks: '#33cc33',
  education: '#ff3333',
  healthcare: '#ff0000'
};

// Maximum markers to display per category
const MAX_MARKERS_PER_CATEGORY = 100;

// Minimum zoom level to show markers
const MIN_ZOOM_LEVEL = 12;

const OSMPOILayer = ({ map, visible, onPOIClick }) => {
  const markersRef = useRef({});
  const [initialized, setInitialized] = useState(false);
  const loadAttemptsRef = useRef(0);
  const featuresRef = useRef({});
  const [isVisible, setIsVisible] = useState(visible);
  const [categoryVisibility, setCategoryVisibility] = useState({});
  const currentZoomRef = useRef(0);
  const activePopupRef = useRef(null);

  // Handle OSM visibility toggle from LayerToggle component
  useEffect(() => {
    // Update visibility based on the prop
    setIsVisible(visible);

    // Emit current features when visibility changes
    if (visible) {
      const allFeatures = {};
      categories.forEach(category => {
        allFeatures[category] = featuresRef.current[category] || [];
      });
      mapEventBus.emit('osm:features', { features: allFeatures });
    }

    if (!visible) {
      removeAllMarkers();
    } else if (initialized) {
      updateVisibleMarkers();
    }
  }, [visible, initialized]);

  // Listen for graph visibility changes
  useEffect(() => {
    const unsubscribe = mapEventBus.on('osmGraph:visibility', (event) => {
      // Handle graph visibility event

      // Emit features for the graph
      if (event.visible) {
        const allFeatures = {};
        categories.forEach(category => {
          allFeatures[category] = featuresRef.current[category] || [];
        });
        mapEventBus.emit('osm:features', { features: allFeatures });
      }
    });

    return () => unsubscribe();
  }, [initialized]);

  // Listen for direct visibility commands
  useEffect(() => {
    const unsubscribe = mapEventBus.on('osm:visibility', (event) => {
      // Handle direct visibility command

      // Update local visibility state
      setIsVisible(event.visible);

      // Emit features if becoming visible
      if (event.visible) {
        const allFeatures = {};
        categories.forEach(category => {
          allFeatures[category] = featuresRef.current[category] || [];
        });
        mapEventBus.emit('osm:features', { features: allFeatures });

        // Update markers if initialized
        if (initialized) {
          updateVisibleMarkers();
        }
      } else {
        // Remove markers if becoming invisible
        removeAllMarkers();
      }
    });

    return () => unsubscribe();
  }, [initialized]);

  // Handle category visibility changes
  useEffect(() => {
    const unsubscribe = mapEventBus.on('poigraph:categoryVisibility', (event) => {
      const { categories } = event;
      console.log('OSMPOILayer: Category visibility update:', categories);
      setCategoryVisibility(categories);

      if (!isVisible) return;

      // Update marker visibility based on category
      Object.entries(markersRef.current).forEach(([category, markers]) => {
        const categoryLower = category.toLowerCase();
        const isVisible = categories[categoryLower];

        console.log('OSMPOILayer: Updating visibility for category:', {
          category: categoryLower,
          isVisible,
          markerCount: markers.length
        });

        markers.forEach(marker => {
          if (isVisible) {
            marker.getElement().style.display = 'block';
          } else {
            marker.getElement().style.display = 'none';
          }
        });
      });
    });

    return () => unsubscribe();
  }, [isVisible]);

  // Force initialization after a delay if the load event doesn't fire
  useEffect(() => {
    const mapInstance = map?.current;

    if (!mapInstance) {
      return;
    }

    // Check map status

    // Force initialization after a short delay if not already initialized
    if (!initialized) {
      const timer = setTimeout(() => {
        if (!initialized) {
          initializeData();
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [map, initialized]);

  // Main initialization effect
  useEffect(() => {
    const mapInstance = map?.current;

    if (!mapInstance) {
      return;
    }

    // Initialize with current visibility state

    // Add zoom change listener to update markers based on zoom level
    const handleZoomEnd = () => {
      const zoom = mapInstance.getZoom();
      currentZoomRef.current = zoom;


      if (initialized && visible) {
        updateVisibleMarkers();
      }
    };

    // Add move end listener to update markers based on map bounds
    const handleMoveEnd = () => {
      if (initialized && visible) {
        updateVisibleMarkers();
      }
    };

    // Add event listeners
    mapInstance.on('zoomend', handleZoomEnd);
    mapInstance.on('moveend', handleMoveEnd);

    // Store initial zoom
    currentZoomRef.current = mapInstance.getZoom();

    // Attempt to initialize markers
    const checkMapAndInitialize = () => {
      loadAttemptsRef.current++;
      if (mapInstance.loaded()) {
        initializeData();
      } else if (loadAttemptsRef.current < 5) {
        setTimeout(checkMapAndInitialize, 500);
      } else {
        initializeData();
      }
    };

    // Try to initialize if not already done
    if (!initialized) {
      checkMapAndInitialize();
    } else if (visible) {
      // Update markers if already initialized and visible
      updateVisibleMarkers();
    } else {
      // Remove all markers if not visible
      removeAllMarkers();
    }

    // Cleanup function
    return () => {
      if (mapInstance) {
        mapInstance.off('zoomend', handleZoomEnd);
        mapInstance.off('moveend', handleMoveEnd);
      }

      // Remove active popup if any
      if (activePopupRef.current) {
        activePopupRef.current.remove();
        activePopupRef.current = null;
      }

      removeAllMarkers();
    };
  }, [map, visible, initialized]);

  // Remove all markers from the map
  const removeAllMarkers = () => {
    // Remove all markers from the map
    Object.keys(markersRef.current).forEach(category => {
      const markers = markersRef.current[category] || [];
      markers.forEach(marker => {
        marker.remove();
      });
    });
    markersRef.current = {};
  };

  // Function to create and update visible markers based on map bounds and zoom
  const updateVisibleMarkers = () => {
    const mapInstance = map?.current;
    if (!mapInstance || !initialized || !isVisible) return;

    const bounds = mapInstance.getBounds();
    const zoom = mapInstance.getZoom();

    // If zoom is too low, remove all markers and return
    if (zoom < MIN_ZOOM_LEVEL) {
      removeAllMarkers();
      return;
    }

    // Remove existing markers first
    removeAllMarkers();

    // Create new markers for features in the current viewport
    categories.forEach(category => {
      const categoryLower = category.toLowerCase();
      // Skip if category is not visible
      if (categoryVisibility[categoryLower] === false) return;

      const features = featuresRef.current[category] || [];
      const visibleFeatures = features
        .filter(feature => {
          const [lng, lat] = feature.geometry.coordinates;
          return bounds.contains([lng, lat]);
        })
        .slice(0, MAX_MARKERS_PER_CATEGORY);



      // Sort by importance (could be based on rating, popularity, etc.)
      // Here we just use a random sort as an example
      const sortedFeatures = visibleFeatures.sort(() => Math.random() - 0.5);

      // Limit the number of markers per category
      const limitedFeatures = sortedFeatures.slice(0, MAX_MARKERS_PER_CATEGORY);

      // Create markers for the limited set of features
      const markers = [];
      limitedFeatures.forEach(feature => {
        try {
          const coordinates = feature.geometry.coordinates;

          // Create a DOM element for the marker
          const el = document.createElement('div');
          el.className = `osm-poi-marker osm-poi-${category}`;
          // Make markers twice as large (15px)
          el.style.width = '10px';
          el.style.height = '10px';
          el.style.borderRadius = '50%';

          // Use full opacity
          const colorRgba = hexToRgba(colors[category], 1);
          el.style.backgroundColor = colorRgba;

          // Increase white stroke to match larger size
          el.style.border = '0px solid white';
          el.style.boxShadow = '0 0 8px rgba(0,0,0,0.5)';

          // Create the marker
          const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'center'
          })
            .setLngLat(coordinates)
            .setPopup(
              new mapboxgl.Popup({
                offset: 25,
                closeButton: true,
                closeOnClick: false,  // Don't close when map is clicked
                maxWidth: '300px'     // Wider popup for better readability
              })
                .setHTML(`
                  <h3>${feature.properties.name || 'Unnamed'}</h3>
                  <p><strong>Category:</strong> ${category}</p>
                  ${feature.properties.address ? `<p><strong>Address:</strong> ${feature.properties.address}</p>` : ''}
                  ${feature.properties.phone ? `<p><strong>Phone:</strong> ${feature.properties.phone}</p>` : ''}
                  ${feature.properties.website ? `<p><strong>Website:</strong> <a href="${feature.properties.website}" target="_blank">${feature.properties.website}</a></p>` : ''}
                `)
            );

          // Add click handler
          el.addEventListener('click', (e) => {
            // Prevent event propagation to avoid map click
            e.stopPropagation();



            // Close any currently open popup
            if (activePopupRef.current) {
              activePopupRef.current.remove();
            }

            // Track the new popup
            activePopupRef.current = marker.getPopup();

            // Call the onPOIClick callback
            onPOIClick({
              features: [{
                ...feature,
                layer: { id: `osm-${category}-marker` },
                source: `osm-${category}`
              }]
            });
          });

          // Add to map
          marker.addTo(mapInstance);
          markers.push(marker);
        } catch (error) {
          // Silently continue on error
        }
      });

      // Store current markers
      markersRef.current[category] = markers;
    });
  };

  // Function to load GeoJSON data without creating all markers immediately
  const initializeData = async () => {
    const mapInstance = map?.current;
    if (!mapInstance) return;

    // Initialize data for all categories

    // Load data for all categories
    for (const category of categories) {
      try {
        const url = `/data/osm/${category}.geojson`;
        const response = await fetch(url);
        if (!response.ok) {
          continue;
        }

        const data = await response.json();

        if (!data.features || data.features.length === 0) {
          continue;
        }

        // Store features for later use
        featuresRef.current[category] = data.features.filter(feature =>
          feature.geometry && feature.geometry.coordinates);


      } catch (error) {
        // Silently continue on error
      }
    }

    setInitialized(true);

    // Update visible markers if needed
    if (visible) {
      updateVisibleMarkers();
    }
  };

  return null;
};

export default OSMPOILayer;