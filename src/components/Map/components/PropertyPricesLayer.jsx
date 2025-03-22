import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

// Helper function to normalize neighborhood names for comparison
const normalizeNeighborhoodName = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

// Array of Mapbox green spaces layers
const greenSpacesLayers = [
  'landuse',
  'park',
  'park-label',
  'national-park',
  'natural',
  'golf-course',
  'pitch',
  'grass'
];

const PropertyPricesLayer = ({ map, showPropertyPrices }) => {
  const [propertyData, setPropertyData] = useState(null);
  const [boundariesData, setBoundariesData] = useState(null);
  const [combinedData, setCombinedData] = useState(null);
  const eventListenersAttached = useRef(false);

  // Function to toggle visibility of green spaces layers
  const toggleGreenSpacesLayers = (visible) => {
    if (!map.current) return;
    
    greenSpacesLayers.forEach(layerId => {
      if (map.current.getLayer(layerId)) {
        map.current.setLayoutProperty(
          layerId,
          'visibility',
          visible ? 'visible' : 'none'
        );
      }
    });
  };

  // Fetch both data sources
  useEffect(() => {
    if (!map.current) return;

    // Fetch property prices data
    fetch('/property_prices.geojson')
      .then(response => response.json())
      .then(data => {
        setPropertyData(data);
        console.log('Available Property Data:', 
          data.features.map(f => f.properties.name).sort().join(', '));
      })
      .catch(error => {
        console.error('Error loading property prices data:', error);
      });

    // Fetch neighborhood boundaries data
    fetch('/LA_Times_Neighborhood_Boundaries.geojson')
      .then(response => response.json())
      .then(data => {
        setBoundariesData(data);
        console.log('LA Times Neighborhoods:', 
          data.features.map(f => f.properties.name).sort().join(', '));
      })
      .catch(error => {
        console.error('Error loading neighborhood boundaries data:', error);
      });

    // Add cleanup for existing event listeners
    return () => {
      cleanupEventListeners();
    };
  }, [map]);

  // Function to clean up event listeners
  const cleanupEventListeners = () => {
    if (map.current) {
      // Remove all event listeners
      map.current.off('mousemove', 'property-prices-fill');
      map.current.off('mouseleave', 'property-prices-fill');
      map.current.off('click', 'property-prices-fill');
      map.current.off('mouseenter', 'property-prices-fill');
      map.current.off('mouseleave', 'property-prices-fill');
      
      // Close any open popups
      const popups = document.querySelectorAll('.property-price-popup');
      popups.forEach(popup => {
        popup.remove();
      });
    }
  };

  // Combine the data when both sources are loaded
  useEffect(() => {
    if (!propertyData || !boundariesData || !map.current) return;

    // Create a map of property data by normalized neighborhood name
    const propertyDataMap = {};
    propertyData.features.forEach(feature => {
      const normalizedName = normalizeNeighborhoodName(feature.properties.name);
      propertyDataMap[normalizedName] = feature.properties;
    });

    // Track matches and mismatches
    const matches = [];
    const mismatches = [];

    // Combine the data
    const combined = {
      type: 'FeatureCollection',
      features: boundariesData.features.map((feature, index) => {
        const normalizedName = normalizeNeighborhoodName(feature.properties.name);
        const propertyData = propertyDataMap[normalizedName];

        if (propertyData) {
          matches.push(`${feature.properties.name} -> ${propertyData.name}`);
        } else {
          mismatches.push(feature.properties.name);
        }

        return {
          type: 'Feature',
          id: index, // Add a unique ID for each feature
          geometry: feature.geometry,
          properties: {
            ...feature.properties,
            feature_id: index, // Add feature_id to properties as well for easier access
            avg_price: propertyData?.avg_price || 0,
            price_level: propertyData?.price_level || 0,
            color: propertyData?.color || '#ffffff',
            original_name: feature.properties.name,
            property_name: propertyData?.name || null
          }
        };
      })
    };

    console.log('=== Neighborhood Matching Results ===');
    console.log('Matches:', matches.length);
    matches.forEach(m => console.log('Match:', m));
    console.log('\nMismatches:', mismatches.length);
    console.log('Missing data for:', mismatches.join(', '));

    setBoundariesData(boundariesData);
    setCombinedData(combined);

    // Clean up existing event listeners before adding new ones
    cleanupEventListeners();

    // Add source and layers if they don't exist
    if (!map.current.getSource('property-prices')) {
      map.current.addSource('property-prices', {
        type: 'geojson',
        data: combined,
        generateId: false // We're providing our own IDs
      });

      // Enhanced color and opacity settings with more variation
      map.current.addLayer({
        id: 'property-prices-fill',
        type: 'fill',
        source: 'property-prices',
        paint: {
          // Updated color scale with dark blue shades for dark mode compatibility
          'fill-color': [
            'case',
            ['==', ['get', 'price_level'], 0], 'rgba(0, 0, 0, 0)', // Transparent for no data
            [
              'step',
              ['get', 'price_level'],
              'rgba(10, 50, 120, 0.4)', // Level 1: Dark blue (affordable)
              1.5, 'rgba(20, 70, 150, 0.5)', 
              2, 'rgba(30, 90, 180, 0.6)',
              2.5, 'rgba(40, 110, 200, 0.65)',
              3, 'rgba(50, 130, 220, 0.7)', 
              3.5, 'rgba(60, 130, 210, 0.75)',
              4, 'rgba(50, 120, 200, 0.8)',
              4.5, 'rgba(40, 100, 180, 0.85)',
              5, 'rgba(30, 80, 160, 0.9)'   // Level 5: Deeper blue (most expensive)
            ]
          ],
          // Adjusted opacity for better visibility on dark backgrounds
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.6,  // Reduced hover opacity but still more visible than regular state
            [
              'interpolate',
              ['linear'],
              ['get', 'price_level'],
              0, 0,         // Completely transparent for no data
              1, 0.45,      // Reduced from 0.85
              2, 0.42,      // Reduced from 0.75
              3, 0.39,      // Reduced from 0.65
              4, 0.36,      // Reduced from 0.55
              5, 0.33       // Reduced from 0.45
            ]
          ]
        }
      });

      // Remove boundary lines by setting very low opacity or not adding the layer at all
      // If you want to completely remove the layer, you can comment this out
      map.current.addLayer({
        id: 'property-prices-line',
        type: 'line',
        source: 'property-prices',
        paint: {
          'line-color': 'rgba(0, 0, 0, 0)',
          'line-width': 0,
          'line-opacity': 0
        }
      });
    } else {
      // Update existing source
      map.current.getSource('property-prices').setData(combined);
    }

    // Only attach event listeners if they haven't been attached yet
    if (!eventListenersAttached.current) {
      // Add hover effect
      let hoveredStateId = null;

      map.current.on('mousemove', 'property-prices-fill', (e) => {
        if (e.features.length > 0) {
          const feature = e.features[0];
          const featureId = feature.id !== undefined ? feature.id : feature.properties.feature_id;
          
          if (featureId === undefined) {
            console.warn('Feature has no ID, cannot apply hover state', feature);
            return;
          }

          if (hoveredStateId !== null) {
            try {
              map.current.setFeatureState(
                { source: 'property-prices', id: hoveredStateId },
                { hover: false }
              );
            } catch (error) {
              console.warn('Error clearing previous hover state:', error);
            }
          }
          
          hoveredStateId = featureId;
          
          try {
            map.current.setFeatureState(
              { source: 'property-prices', id: hoveredStateId },
              { hover: true }
            );
          } catch (error) {
            console.warn('Error setting hover state:', error, 'for feature ID:', hoveredStateId);
          }
        }
      });

      map.current.on('mouseleave', 'property-prices-fill', () => {
        if (hoveredStateId !== null) {
          try {
            map.current.setFeatureState(
              { source: 'property-prices', id: hoveredStateId },
              { hover: false }
            );
          } catch (error) {
            console.warn('Error clearing hover state on mouseleave:', error);
          }
        }
        hoveredStateId = null;
      });

      // Set the flag to indicate event listeners are attached
      eventListenersAttached.current = true;

      // Add click handler for popup with fixed close button
      map.current.on('click', 'property-prices-fill', (e) => {
        // Close any existing popups first
        const existingPopups = document.querySelectorAll('.mapboxgl-popup');
        existingPopups.forEach(popup => {
          popup.remove();
        });

        if (e.features.length > 0) {
          const feature = e.features[0];
          const coordinates = e.lngLat;
          const price = feature.properties.avg_price ? 
            `$${feature.properties.avg_price.toLocaleString()}` : 
            'No price data';
          
          const priceLevel = feature.properties.price_level || 0;
          const priceTier = priceLevel === 0 ? 'No data' :
                            priceLevel === 1 ? 'Very Affordable' :
                            priceLevel === 2 ? 'Affordable' :
                            priceLevel === 3 ? 'Moderate' :
                            priceLevel === 4 ? 'Expensive' :
                            'Very Expensive';

          // Create a styled popup with properly working close button
          new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: true,
            maxWidth: '300px',
            className: 'property-price-popup'
          })
            .setLngLat(coordinates)
            .setHTML(`
              <div style="padding: 10px 12px;">
                <h3 style="margin: 0 0 10px 0; font-size: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.2); padding-bottom: 8px;">${feature.properties.name}</h3>
                <p style="margin: 4px 0; font-size: 14px;">
                  <strong>Average Price:</strong> ${price}
                </p>
                <p style="margin: 8px 0 4px 0; font-size: 14px;">
                  <strong>Price Tier:</strong> 
                  <span style="display: inline-block; margin-left: 8px; padding: 2px 8px; border-radius: 4px; background-color: ${
                    priceLevel === 0 ? '#222222' : 
                    priceLevel === 1 ? 'rgba(10, 50, 120, 0.7)' : 
                    priceLevel === 2 ? 'rgba(30, 90, 180, 0.75)' : 
                    priceLevel === 3 ? 'rgba(50, 130, 220, 0.8)' : 
                    priceLevel === 4 ? 'rgba(50, 120, 200, 0.85)' : 
                    'rgba(30, 80, 160, 0.9)'
                  }; color: #ffffff; font-weight: 500;">${priceTier}</span>
                </p>
              </div>
            `)
            .addTo(map.current);
        }
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'property-prices-fill', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'property-prices-fill', () => {
        map.current.getCanvas().style.cursor = '';
      });

      // Add CSS for custom popup styling
      if (!document.getElementById('property-price-popup-style')) {
        const style = document.createElement('style');
        style.id = 'property-price-popup-style';
        style.innerHTML = `
          .property-price-popup .mapboxgl-popup-content {
            background-color: rgba(10, 25, 50, 0.9);
            color: #ffffff;
            border-radius: 6px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
          }
          .property-price-popup .mapboxgl-popup-close-button {
            font-size: 18px;
            right: 8px;
            top: 4px;
            color: #ffffff;
            z-index: 100;
          }
          .property-price-popup .mapboxgl-popup-close-button:hover {
            background-color: transparent;
            color: #4da6ff;
          }
          .property-price-popup h3 {
            color: #ffffff;
            font-weight: 500;
          }
          .property-price-popup p {
            color: rgba(255, 255, 255, 0.8);
          }
          .property-price-popup strong {
            color: #ffffff;
          }
        `;
        document.head.appendChild(style);
      }
    }

    // Update property prices layer visibility
    map.current.setLayoutProperty(
      'property-prices-fill',
      'visibility',
      showPropertyPrices ? 'visible' : 'none'
    );
    map.current.setLayoutProperty(
      'property-prices-line',
      'visibility',
      showPropertyPrices ? 'visible' : 'none'
    );

    // Toggle green spaces layers visibility to match property prices layer
    toggleGreenSpacesLayers(showPropertyPrices);

    // Cleanup
    return () => {
      if (map.current) {
        // Clean up event listeners
        cleanupEventListeners();
        
        // Reset the flag when component is unmounting
        eventListenersAttached.current = false;
        
        if (map.current.getLayer('property-prices-line')) {
          map.current.removeLayer('property-prices-line');
        }
        if (map.current.getLayer('property-prices-fill')) {
          map.current.removeLayer('property-prices-fill');
        }
        if (map.current.getSource('property-prices')) {
          map.current.removeSource('property-prices');
        }
        
        // Remove custom CSS on unmount
        const styleElement = document.getElementById('property-price-popup-style');
        if (styleElement) {
          styleElement.remove();
        }
      }
    };
  }, [map, propertyData, boundariesData, showPropertyPrices]);

  // Additional effect to handle visibility changes when showPropertyPrices changes
  useEffect(() => {
    if (!map.current) return;
    
    // Check if the layers exist before trying to update visibility
    if (map.current.getLayer('property-prices-fill') && map.current.getLayer('property-prices-line')) {
      // Update property prices layer visibility
      map.current.setLayoutProperty(
        'property-prices-fill',
        'visibility',
        showPropertyPrices ? 'visible' : 'none'
      );
      map.current.setLayoutProperty(
        'property-prices-line',
        'visibility',
        showPropertyPrices ? 'visible' : 'none'
      );
      
      // Toggle green spaces layers visibility to match property prices layer
      toggleGreenSpacesLayers(showPropertyPrices);
    }
  }, [showPropertyPrices]);

  return null;
};

export default PropertyPricesLayer; 