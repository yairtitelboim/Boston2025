import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  POIDataBarContainer,
  POIDataHeader,
  POIDataTitle,
  CollapseButton,
  ExpandButton,
  POICategory,
  POICategoryHeader,
  POICategoryIcon,
  POICategoryTitle,
  POIDetailItem,
  POIDetailTitle,
  POIDetailDescription,
  POIDataContent,
  POIStatsBar,
  POICountBadge,
  createGlobalStyles
} from './styles/POIDataBarStyles';
import styled from 'styled-components';
import mapboxgl from 'mapbox-gl';
import { CATEGORIES, getColorForCategory, getIconForCategory } from './utils/categoryUtils';
import { getMaxCount, calculateDynamicWidth } from './utils/widthUtils';
import { togglePOIMarkerVisibility, highlightAllActivePOIs } from './utils/poiVisibilityUtils';
import { updateVisiblePOIs } from './utils/poiDataManager';
import { highlightPOIBuildings } from './utils/buildingHighlighter';

// Debug logging utility
const debug = (message, data) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 POIDataBar: ${message}`, data ? data : '');
  }
};

// Sample POI data for demonstration when OSM data is not available
const SAMPLE_POI_DATA = {
  restaurants: [
    { id: 1, name: "Harbor Bistro", type: "Fine Dining", rating: 4.8, popularity: 92, coordinates: [-71.0495, 42.3601] },
    { id: 2, name: "Seafood Central", type: "Seafood", rating: 4.5, popularity: 88, coordinates: [-71.0515, 42.3585] },
    { id: 3, name: "The Waterfront Café", type: "Casual", rating: 4.2, popularity: 75, coordinates: [-71.0375, 42.3615] },
    { id: 4, name: "Ocean Grill", type: "Fine Dining", rating: 4.6, popularity: 82, coordinates: [-71.0455, 42.3555] },
    { id: 5, name: "Harbor View Restaurant", type: "Seafood", rating: 4.3, popularity: 78, coordinates: [-71.0335, 42.3645] },
    { id: 6, name: "Dockside Diner", type: "Casual", rating: 4.0, popularity: 70, coordinates: [-71.0495, 42.3515] },
    { id: 7, name: "Financial District Bistro", type: "Fine Dining", rating: 4.7, popularity: 89, coordinates: [-71.0569, 42.3555] },
    { id: 8, name: "Chinatown Express", type: "Chinese", rating: 4.2, popularity: 83, coordinates: [-71.0608, 42.3512] },
    { id: 9, name: "North End Italian", type: "Italian", rating: 4.9, popularity: 95, coordinates: [-71.0543, 42.3647] },
    { id: 10, name: "Seaport Lobster", type: "Seafood", rating: 4.6, popularity: 91, coordinates: [-71.0477, 42.3518] },
    { id: 11, name: "Back Bay Grill", type: "American", rating: 4.4, popularity: 86, coordinates: [-71.0772, 42.3503] },
    { id: 12, name: "South Station Cafe", type: "Cafe", rating: 4.1, popularity: 77, coordinates: [-71.0552, 42.3518] }
  ],
  cafes: [
    { id: 1, name: "Waterfront Coffee", type: "Coffee Shop", rating: 4.7, popularity: 90, coordinates: [-71.0485, 42.3605] },
    { id: 2, name: "Harbor Espresso", type: "Coffee Shop", rating: 4.4, popularity: 85, coordinates: [-71.0525, 42.3595] },
    { id: 3, name: "North End Café", type: "Coffee Shop", rating: 4.6, popularity: 88, coordinates: [-71.0545, 42.3645] }
  ],
  bars: [
    { id: 1, name: "Waterfront Brewery", type: "Pub", rating: 4.5, popularity: 87, coordinates: [-71.0495, 42.3610] },
    { id: 2, name: "Harbor Cocktail Lounge", type: "Cocktail Bar", rating: 4.8, popularity: 92, coordinates: [-71.0515, 42.3590] },
    { id: 3, name: "Downtown Wine Bar", type: "Wine Bar", rating: 4.6, popularity: 89, coordinates: [-71.0565, 42.3550] }
  ],
  shops: [
    { id: 1, name: "Seaport Market", type: "Grocery", rating: 4.3, popularity: 82, coordinates: [-71.0475, 42.3605] },
    { id: 2, name: "Harbor Boutique", type: "Clothing", rating: 4.6, popularity: 88, coordinates: [-71.0515, 42.3585] },
    { id: 3, name: "Downtown Books", type: "Bookstore", rating: 4.5, popularity: 86, coordinates: [-71.0555, 42.3555] }
  ],
  cultural: [
    { id: 1, name: "Harbor View Theater", type: "Performing Arts", rating: 4.6, popularity: 85, coordinates: [-71.0685, 42.3605] },
    { id: 2, name: "Maritime Museum", type: "Museum", rating: 4.3, popularity: 70, coordinates: [-71.0505, 42.3595] },
    { id: 3, name: "Harbor IMAX", type: "Cinema", rating: 4.5, popularity: 88, coordinates: [-71.0465, 42.3525] },
    { id: 4, name: "Boston Aquarium", type: "Attraction", rating: 4.7, popularity: 92, coordinates: [-71.0495, 42.3595] },
    { id: 5, name: "Harbor Park", type: "Recreation", rating: 4.1, popularity: 75, coordinates: [-71.0425, 42.3655] },
    { id: 6, name: "Symphony Hall", type: "Performing Arts", rating: 4.8, popularity: 89, coordinates: [-71.0856, 42.3429] },
    { id: 7, name: "Museum of Fine Arts", type: "Museum", rating: 4.7, popularity: 88, coordinates: [-71.0941, 42.3397] },
    { id: 8, name: "Charles Cinema", type: "Cinema", rating: 4.2, popularity: 80, coordinates: [-71.0699, 42.3512] },
    { id: 9, name: "Boston Common", type: "Park", rating: 4.5, popularity: 92, coordinates: [-71.0661, 42.3551] },
    { id: 10, name: "Faneuil Hall", type: "Historic Site", rating: 4.6, popularity: 94, coordinates: [-71.0554, 42.3606] }
  ],
  parks: [
    { id: 1, name: "Harbor Park", type: "Urban Park", rating: 4.5, popularity: 89, coordinates: [-71.0495, 42.3610] },
    { id: 2, name: "Waterfront Gardens", type: "Garden", rating: 4.7, popularity: 90, coordinates: [-71.0515, 42.3590] },
    { id: 3, name: "Boston Common", type: "Urban Park", rating: 4.8, popularity: 95, coordinates: [-71.0661, 42.3551] }
  ],
  education: [
    { id: 1, name: "Harbor Elementary", type: "School", rating: 4.2, popularity: 78, coordinates: [-71.0495, 42.3610] },
    { id: 2, name: "Boston University", type: "University", rating: 4.6, popularity: 92, coordinates: [-71.1097, 42.3505] },
    { id: 3, name: "Waterfront Library", type: "Library", rating: 4.4, popularity: 86, coordinates: [-71.0515, 42.3590] }
  ],
  healthcare: [
    { id: 1, name: "Harbor Medical Center", type: "Hospital", rating: 4.5, popularity: 88, coordinates: [-71.0495, 42.3610] },
    { id: 2, name: "Waterfront Clinic", type: "Clinic", rating: 4.3, popularity: 82, coordinates: [-71.0515, 42.3590] },
    { id: 3, name: "Downtown Pharmacy", type: "Pharmacy", rating: 4.2, popularity: 80, coordinates: [-71.0555, 42.3555] }
  ],
  transportation: [
    { id: 1, name: "Ferry Terminal", type: "Water Transit", rating: 4.4, popularity: 90, coordinates: [-71.0475, 42.3615] },
    { id: 2, name: "Harbor Shuttle Stop", type: "Public Transit", rating: 4.1, popularity: 78, coordinates: [-71.0525, 42.3575] },
    { id: 3, name: "Water Taxi Dock", type: "Water Transit", rating: 4.3, popularity: 85, coordinates: [-71.0455, 42.3635] },
    { id: 4, name: "Harborwalk Bike Rental", type: "Bike Share", rating: 4.2, popularity: 75, coordinates: [-71.0515, 42.3495] },
    { id: 5, name: "Harbor Bus Terminal", type: "Public Transit", rating: 4.0, popularity: 70, coordinates: [-71.0515, 42.3665] },
    { id: 6, name: "South Station", type: "Train Station", rating: 4.5, popularity: 93, coordinates: [-71.0551, 42.3521] },
    { id: 7, name: "North Station", type: "Train Station", rating: 4.4, popularity: 89, coordinates: [-71.0617, 42.3663] },
    { id: 8, name: "Downtown Crossing T", type: "Subway", rating: 4.0, popularity: 88, coordinates: [-71.0602, 42.3556] },
    { id: 9, name: "Copley Square T", type: "Subway", rating: 4.1, popularity: 85, coordinates: [-71.0778, 42.3504] },
    { id: 10, name: "Haymarket T", type: "Subway", rating: 3.9, popularity: 82, coordinates: [-71.0582, 42.3633] },
    { id: 11, name: "Logan Airport Shuttle", type: "Airport Shuttle", rating: 4.2, popularity: 87, coordinates: [-71.0465, 42.3668] },
    { id: 12, name: "Seaport Bike Share", type: "Bike Share", rating: 4.3, popularity: 79, coordinates: [-71.0477, 42.3526] }
  ]
};

// Function to check if coordinates are in the current map bounds
const isInBounds = (coords, bounds) => {
  if (!bounds) return true;
  return (
    coords[0] >= bounds.getWest() &&
    coords[0] <= bounds.getEast() &&
    coords[1] >= bounds.getSouth() &&
    coords[1] <= bounds.getNorth()
  );
};

const POIDataBar = ({ map, showOSMPOIs, setShowOSMPOIs, showPOIMarkers, setShowPOIMarkers }) => {
  const [isPOIDataBarCollapsed, setIsPOIDataBarCollapsed] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({
    restaurants: false,
    cafes: false,
    bars: false,
    shops: false,
    cultural: false,
    parks: false,
    education: false,
    healthcare: false,
    transportation: false
  });

  // Add state to track which categories have expanded item lists
  const [showAllItems, setShowAllItems] = useState({
    restaurants: false,
    cafes: false,
    bars: false,
    shops: false,
    cultural: false,
    parks: false,
    education: false,
    healthcare: false,
    transportation: false
  });

  // Add state to track whether to show all categories or just the first three
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Initialize counts with 0 for all categories
  const [poiCounts, setPoiCounts] = useState({});

  // Add state for sorted categories - initially same as CATEGORIES
  const [sortedCategories, setSortedCategories] = useState([...CATEGORIES]);

  // Initialize with sample data
  const [visiblePOIs, setVisiblePOIs] = useState(
    CATEGORIES.reduce((acc, category) => {
      acc[category] = SAMPLE_POI_DATA[category]?.slice(0, 5) || [];
      return acc;
    }, {})
  );

  const [lastUpdated, setLastUpdated] = useState(null);
  const [osmDataLoaded, setOsmDataLoaded] = useState({});
  const osmFeaturesRef = useRef({});

  // State to track previous positions of categories
  const [prevCategoryPositions, setPrevCategoryPositions] = useState({});
  const [positionChanges, setPositionChanges] = useState({});

  // Ref to track active building highlight for cleanup
  const activeBuildingHighlightRef = useRef(null);
  // Ref to track category highlights - changed to an object keyed by category
  const activeCategoryHighlightsRef = useRef({});

  // Add state to track which categories are currently highlighted
  const [highlightedCategories, setHighlightedCategories] = useState(
    CATEGORIES.reduce((acc, category) => {
      acc[category] = false;
      return acc;
    }, {})
  );

  // Add state to track if all buildings are highlighted
  const [allBuildingsHighlighted, setAllBuildingsHighlighted] = useState(false);

  // Add state to track if POI markers are visible
  const [arePOIMarkersVisible, setArePOIMarkersVisible] = useState(true);

  // Add state to track if POI count updates should be paused
  const [pauseCountUpdates, setPauseCountUpdates] = useState(false);

  // Load OSM data when component mounts
  useEffect(() => {
    if (!showOSMPOIs) return;

    const loadOSMData = async () => {
      try {
        for (const category of CATEGORIES) {
          // Skip transportation as it's handled differently in the sample data
          if (category === 'transportation') continue;

          try {
            const response = await fetch(`/data/osm/${category}.geojson`);

            if (!response.ok) {
              console.log(`POIDataBar: No OSM data available for ${category}`);
              continue;
            }

            const data = await response.json();
            if (data && data.features && data.features.length > 0) {
              console.log(`POIDataBar: Loaded ${data.features.length} OSM features for ${category}`);

              // Store the OSM features
              osmFeaturesRef.current[category] = data.features.filter(f =>
                f.geometry && f.geometry.coordinates &&
                Array.isArray(f.geometry.coordinates) &&
                f.geometry.coordinates.length === 2);

              // Mark category as loaded
              setOsmDataLoaded(prev => ({
                ...prev,
                [category]: true
              }));
            }
          } catch (err) {
            console.error(`POIDataBar: Error loading OSM data for ${category}:`, err);
          }
        }
      } catch (error) {
        console.error("POIDataBar: Error loading OSM data:", error);
      }
    };

    loadOSMData();
  }, [showOSMPOIs]);

  // Log map reference for debugging
  useEffect(() => {
    console.log("POIDataBar received map ref:", map);
    console.log("POIDataBar showOSMPOIs:", showOSMPOIs);
  }, [map, showOSMPOIs]);

  // Connect directly to map events using a run-once effect
  useEffect(() => {
    // Create a stable reference to the update function
    const handleMapMoveOrZoom = () => {
      if (!map?.current) return;

      // Skip updates if paused by the highlight all button
      if (pauseCountUpdates) {
        console.log("POI counts update skipped - updates are paused");
        return;
      }

      try {
        const bounds = map.current.getBounds();
        if (!bounds) return;

        console.log("Updating POI counts based on current map view");

        // Prepare to hold counts for each category
        const newVisiblePOIs = {};
        const newCounts = {};

        // DIRECT APPROACH: First try to directly query visible POI features from the map
        // This is more accurate than our manual filtering because it includes what's actually rendered
        const visibleLayers = map.current.getStyle().layers
          .filter(layer => layer.id.includes('poi') || layer.id.includes('marker'))
          .map(layer => layer.id);

        console.log("Querying visible POI layers:", visibleLayers);

        // Query all POI features currently visible in the viewport
        const visibleFeatures = map.current.queryRenderedFeatures(undefined, {
          layers: visibleLayers
        });

        console.log(`Found ${visibleFeatures.length} total visible POI features on the map`);

        // Now process each category using our existing logic (as a fallback)
        // But also incorporate the direct map query results for more accuracy
        CATEGORIES.forEach(category => {
          // Start with empty arrays for each category
          newVisiblePOIs[category] = [];
          newCounts[category] = 0;

          // STEP 1: First get OSM POIs if enabled
          if (showOSMPOIs && osmFeaturesRef.current[category] && osmFeaturesRef.current[category].length > 0) {
            // Filter OSM features within bounds with a wider buffer to match visible map area
            // We'll use a slightly larger bound to account for markers near the edge that might be visible
            const expandedBounds = {
              west: bounds.getWest() - 0.005,
              east: bounds.getEast() + 0.005,
              south: bounds.getSouth() - 0.005,
              north: bounds.getNorth() + 0.005
            };

            const osmPOIFeatures = osmFeaturesRef.current[category].filter(feature => {
              const coords = feature.geometry.coordinates;
              return (
                coords[0] >= expandedBounds.west &&
                coords[0] <= expandedBounds.east &&
                coords[1] >= expandedBounds.south &&
                coords[1] <= expandedBounds.north
              );
            });

            // Convert OSM features to our display format
            const osmPOIs = osmPOIFeatures.map(feature => ({
              id: `osm-${feature.properties.id || feature.properties.osm_id || Math.random().toString(36).substr(2, 9)}`,
              name: feature.properties.name || 'Unnamed',
              type: feature.properties.amenity || feature.properties.leisure || feature.properties.shop || category,
              rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3.0 and 5.0
              popularity: Math.floor(Math.random() * 30) + 70, // Random popularity between 70 and 99
              coordinates: feature.geometry.coordinates,
              properties: feature.properties,
              source: 'osm'
            }));

            // Add OSM POIs to the category's visible POIs
            newVisiblePOIs[category] = [...newVisiblePOIs[category], ...osmPOIs];

            // Update count (will be combined with Mapbox POIs later)
            newCounts[category] += osmPOIFeatures.length;

            console.log(`Found ${osmPOIFeatures.length} OSM POIs for ${category}`);
          }

          // STEP 2: Then add Mapbox POIs if they should be visible
          if (showPOIMarkers) {
            // Get Mapbox POIs from sample data (in a real app, these would come from Mapbox)
            const mapboxPOIs = SAMPLE_POI_DATA[category] || [];

            // Use expanded bounds for more accurate marker detection
            const expandedBounds = {
              west: bounds.getWest() - 0.005,
              east: bounds.getEast() + 0.005,
              south: bounds.getSouth() - 0.005,
              north: bounds.getNorth() + 0.005
            };

            // Filter to only include those in current view (with expanded bounds)
            const mapboxPOIsInView = mapboxPOIs.filter(poi =>
              poi.coordinates &&
              poi.coordinates[0] >= expandedBounds.west &&
              poi.coordinates[0] <= expandedBounds.east &&
              poi.coordinates[1] >= expandedBounds.south &&
              poi.coordinates[1] <= expandedBounds.north
            );

            // Add a source property to distinguish them
            const taggedMapboxPOIs = mapboxPOIsInView.map(poi => ({
              ...poi,
              source: 'mapbox'
            }));

            // Add Mapbox POIs to the category's visible POIs
            newVisiblePOIs[category] = [...newVisiblePOIs[category], ...taggedMapboxPOIs];

            // Update the count (combined with OSM POIs)
            newCounts[category] += mapboxPOIsInView.length;

            console.log(`Found ${mapboxPOIsInView.length} Mapbox POIs for ${category}`);
          }

          // Limit to 50 POIs per category for performance when displaying in panel
          newVisiblePOIs[category] = newVisiblePOIs[category].slice(0, 50);

          // Log the combined count for this category
          console.log(`Total ${newCounts[category]} POIs for ${category} (combined OSM and Mapbox)`);
        });

        // If we have a significant mismatch between our count and actual visible features,
        // attempt to reconcile by using the direct query count
        const calculatedTotal = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
        if (visibleFeatures.length > calculatedTotal * 1.5) {
          console.log(`Significant count mismatch detected: calculated=${calculatedTotal}, visible=${visibleFeatures.length}`);

          // Proportionally adjust counts to better reflect visible reality
          const adjustmentFactor = visibleFeatures.length / Math.max(calculatedTotal, 1);
          console.log(`Applying adjustment factor of ${adjustmentFactor.toFixed(2)} to category counts`);

          Object.keys(newCounts).forEach(category => {
            if (newCounts[category] > 0) {
              // Round to integer after scaling
              newCounts[category] = Math.round(newCounts[category] * adjustmentFactor);
            }
          });
        }

        // Update state
        setVisiblePOIs(newVisiblePOIs);
        setPoiCounts(newCounts);
        setLastUpdated(new Date().toLocaleTimeString());

        // Calculate and log the total count across all categories
        const totalCount = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
        console.log(`Total POIs across all categories: ${totalCount}`);

        // Double-check with the direct count from the map
        if (Math.abs(totalCount - visibleFeatures.length) > 5) {
          console.warn(`Count discrepancy remains: panel shows ${totalCount}, map has approximately ${visibleFeatures.length} visible POIs`);
        }
      } catch (error) {
        console.error("POIDataBar: Error in handleMapMoveOrZoom:", error);
      }
    };

    // Function to set up event listeners
    const setupMapListeners = () => {
      if (map?.current) {
        console.log("POIDataBar: Setting up map listeners");

        // Remove any existing listeners to avoid duplicates
        map.current.off('moveend', handleMapMoveOrZoom);
        map.current.off('zoomend', handleMapMoveOrZoom);

        // Add fresh listeners
        map.current.on('moveend', handleMapMoveOrZoom);
        map.current.on('zoomend', handleMapMoveOrZoom);

        // Initial update
        handleMapMoveOrZoom();

        console.log("POIDataBar: Map listeners set up successfully");
      }
    };

    // Try immediately
    if (map?.current?.loaded()) {
      setupMapListeners();
    } else if (map?.current) {
      // Wait for load
      map.current.once('load', setupMapListeners);
    }

    // Try again after a short delay to ensure map is ready
    const timeoutId = setTimeout(() => {
      if (map?.current) {
        setupMapListeners();
      }
    }, 1000);

    return () => {
      // Clean up
      clearTimeout(timeoutId);
      if (map?.current) {
        map.current.off('moveend', handleMapMoveOrZoom);
        map.current.off('zoomend', handleMapMoveOrZoom);
      }

      // Remove any active building highlight
      if (activeBuildingHighlightRef.current) {
        try {
          activeBuildingHighlightRef.current.remove();
        } catch (e) {
          console.warn('Error removing building highlight during cleanup:', e);
        }
        activeBuildingHighlightRef.current = null;
      }

      // Remove highlighted building layer if it exists
      if (map?.current) {
        try {
          if (map.current.getLayer('highlighted-building-layer')) {
            map.current.removeLayer('highlighted-building-layer');
          }
          if (map.current.getSource('highlighted-building-source')) {
            map.current.removeSource('highlighted-building-source');
          }
        } catch (e) {
          console.warn('Error removing map layers during cleanup:', e);
        }
      }
    };
  }, [map, showOSMPOIs, osmDataLoaded, pauseCountUpdates]);

  // Update POI counts when OSM toggle changes
  useEffect(() => {
    // Only trigger if map is available
    if (map?.current) {
      console.log("POIDataBar: OSM toggle changed to", showOSMPOIs);

      // Force an update of the POI counts by simulating a map move
      if (map.current.getBounds) {
        try {
          const bounds = map.current.getBounds();
          const center = map.current.getCenter();

          // Trigger a small movement to force update
          map.current.easeTo({
            center: [center.lng + 0.0001, center.lat + 0.0001],
            duration: 10
          });
        } catch (error) {
          console.error("POIDataBar: Error triggering update on OSM toggle change:", error);
        }
      }
    }
  }, [showOSMPOIs, map]);

  // Add an effect to manage category highlights when expandedCategories changes
  useEffect(() => {
    // For each category, check if it's expanded and should be highlighted
    Object.keys(expandedCategories).forEach(category => {
      // If the category is expanded but not highlighted, highlight it
      if (expandedCategories[category] && !highlightedCategories[category]) {
        // Queue this asynchronously to avoid state update conflicts
        setTimeout(() => {
          setHighlightedCategories(prev => ({
            ...prev,
            [category]: true
          }));
          highlightCategoryPOIs(category);
        }, 0);
      }
      // If the category is not expanded but highlighted, remove highlights
      else if (!expandedCategories[category] && highlightedCategories[category]) {
        // Queue this asynchronously to avoid state update conflicts
        setTimeout(() => {
          setHighlightedCategories(prev => ({
            ...prev,
            [category]: false
          }));
          removeCategoryHighlights(category);
        }, 0);
      }
    });
  }, [expandedCategories]); // This effect runs when expandedCategories changes

  // Cleanup effect for when component unmounts
  useEffect(() => {
    return () => {
      // Remove any active building highlight
      if (activeBuildingHighlightRef.current) {
        try {
          activeBuildingHighlightRef.current.remove();
        } catch (e) {
          console.warn('Error removing building highlight during cleanup:', e);
        }
        activeBuildingHighlightRef.current = null;
      }

      // Remove all category highlights
      try {
        Object.keys(activeCategoryHighlightsRef.current).forEach(category => {
          const highlights = activeCategoryHighlightsRef.current[category] || [];
          highlights.forEach(highlight => {
            if (highlight?.remove) highlight.remove();
          });
        });

        // Clear all references
        activeCategoryHighlightsRef.current = {};
      } catch (e) {
        console.warn('Error removing category highlights during cleanup:', e);
      }

      // Remove any mapbox layers that might still be present
      if (map?.current) {
        try {
          // Check for individual highlight
          if (map.current.getLayer('individual-poi-highlight')) {
            map.current.removeLayer('individual-poi-highlight');
          }
          if (map.current.getSource('individual-poi-highlight-source')) {
            map.current.removeSource('individual-poi-highlight-source');
          }

          // Check for category highlights by pattern
          const layerIds = map.current.getStyle().layers.map(layer => layer.id);
          layerIds.forEach(id => {
            if (id.startsWith('category-highlight-')) {
              map.current.removeLayer(id);
            }
          });

          // Same for sources
          const sourceIds = Object.keys(map.current.getStyle().sources);
          sourceIds.forEach(id => {
            if (id.startsWith('category-highlight-')) {
              map.current.removeSource(id);
            }
          });
        } catch (e) {
          console.warn('Error removing map layers during cleanup:', e);
        }
      }
    };
  }, []);

  // Sort categories whenever POI counts change
  useEffect(() => {
    // Create a copy of the categories array with their counts
    const categoriesWithCounts = CATEGORIES.map(category => ({
      category,
      count: poiCounts[category] || 0
    }));

    // Sort by count in descending order
    categoriesWithCounts.sort((a, b) => b.count - a.count);

    // Extract just the category names in the new order
    const newSortedCategories = categoriesWithCounts.map(item => item.category);

    // Use a timeout to create a slight delay before reordering
    // This makes the animation feel more dramatic
    const reorderTimer = setTimeout(() => {
      // Update state with the new order
      setSortedCategories(newSortedCategories);
      console.log("POIDataBar: Categories reordered based on counts");
    }, 300);

    return () => clearTimeout(reorderTimer);
  }, [poiCounts]);

  // Track category position changes
  useEffect(() => {
    // Create an object mapping each category to its current position
    const currentPositions = {};
    sortedCategories.forEach((cat, index) => {
      currentPositions[cat] = index;
    });

    // Compare with previous positions to detect changes
    const changes = {};
    CATEGORIES.forEach(cat => {
      const prevPos = prevCategoryPositions[cat];
      const currPos = currentPositions[cat];

      // If position exists and has changed
      if (prevPos !== undefined && currPos !== undefined && prevPos !== currPos) {
        const moved = prevPos > currPos ? 'up' : 'down';
        changes[cat] = {
          prevPos,
          currPos,
          moved,
          timestamp: Date.now()
        };
      }
    });

    // Update position changes if there were any
    if (Object.keys(changes).length > 0) {
      setPositionChanges(prev => ({...prev, ...changes}));

      // Clear position changes after animation duration
      const timerId = setTimeout(() => {
        setPositionChanges({});
      }, 3000); // Increased to 3 seconds to match longer animations

      return () => clearTimeout(timerId);
    }

    // Update previous positions
    setPrevCategoryPositions(currentPositions);
  }, [sortedCategories]);

  const toggleCategory = (category) => {
    // Toggle the expanded state of the category
    const newExpandedState = !expandedCategories[category];
    setExpandedCategories({
      ...expandedCategories,
      [category]: newExpandedState
    });

    // If we're expanding the category, highlight all POIs in that category
    if (newExpandedState) {
      // First clear any active individual highlight
      if (activeBuildingHighlightRef.current) {
        activeBuildingHighlightRef.current.remove();
        activeBuildingHighlightRef.current = null;
      }

      // Set this category as highlighted
      setHighlightedCategories({
        ...highlightedCategories,
        [category]: true
      });

      // Highlight this category's POIs without removing other category highlights
      highlightCategoryPOIs(category);
    } else {
      // If we're collapsing, remove highlights for this category only
      if (highlightedCategories[category]) {
        removeCategoryHighlights(category);

        // Mark this category as not highlighted
        setHighlightedCategories({
          ...highlightedCategories,
          [category]: false
        });
      }
    }
  };

  // Function to highlight all POIs in a category
  const highlightCategoryPOIs = (category) => {
    if (!map?.current) {
      console.error("Map reference is missing when trying to highlight category POIs");
      return;
    }

    const items = visiblePOIs[category] || [];
    const categoryColor = getColorForCategory(category);

    // Keep only this summary log
    console.log(`🏢 Highlighting POIs for ${category}: ${items.length} items with color ${categoryColor}`);

    // Filter out POIs without valid coordinates
    const validItems = items.filter(item =>
      item.coordinates &&
      Array.isArray(item.coordinates) &&
      item.coordinates.length === 2
    );

    if (validItems.length === 0) {
      console.log(`❌ No valid POIs to highlight in ${category}`);
      return;
    }

    // First remove any existing highlights for this category
    removeCategoryHighlights(category);

    // Initialize array to store highlights for this category
    activeCategoryHighlightsRef.current[category] = [];

    // Limit the number of POIs to process to avoid overwhelming the map
    // For large datasets, we'll prioritize the first N items
    const MAX_HIGHLIGHTS = 50; // Increased from 25 to 50 highlights per category
    const itemsToProcess = validItems.length > MAX_HIGHLIGHTS
      ? validItems.slice(0, MAX_HIGHLIGHTS)
      : validItems;

    // Process POIs in batches for better performance
    const processBatch = (startIndex, batchSize) => {
      const endIndex = Math.min(startIndex + batchSize, itemsToProcess.length);
      const batch = itemsToProcess.slice(startIndex, endIndex);

      // Create a unique ID for each POI highlight to track them
      const batchPromises = batch.map((item, index) => {
        const actualIndex = startIndex + index;
        return new Promise(resolve => {
          // Stagger the highlighting to avoid overloading the map
          setTimeout(() => {
            try {
              const highlight = highlightBuildingAtLocation(
                item.coordinates,
                categoryColor,
                `category-highlight-${category}-${actualIndex}`
              );
              resolve(highlight);
            } catch (e) {
              console.error(`Error highlighting building for ${item.name}`);
              resolve(null);
            }
          }, index * 20); // 20ms delay between each highlight in the batch
        });
      });

      // Process the batch and then start the next batch if needed
      return Promise.all(batchPromises).then(highlights => {
        // Filter out null values and store valid highlights
        const validHighlights = highlights.filter(h => h !== null);
        activeCategoryHighlightsRef.current[category] = [
          ...activeCategoryHighlightsRef.current[category],
          ...validHighlights
        ];

        // Process next batch if available
        if (endIndex < itemsToProcess.length) {
          return processBatch(endIndex, batchSize);
        } else {
          // Final summary log with actual results
          console.log(`✅ ${category}: ${activeCategoryHighlightsRef.current[category].length}/${itemsToProcess.length} buildings highlighted (${Math.round(activeCategoryHighlightsRef.current[category].length/itemsToProcess.length*100)}% success rate)`);
        }
      });
    };

    // Start processing in batches of 5
    processBatch(0, 5).catch(err => {
      console.error("Error creating category highlights:", err);
    });
  };

  // Function to remove category highlights - can be for a specific category or all
  const removeCategoryHighlights = (category = null) => {
    if (category) {
      // Only remove highlights for the specified category
      const highlights = activeCategoryHighlightsRef.current[category] || [];

      highlights.forEach(highlight => {
        if (highlight && typeof highlight.remove === 'function') {
          try {
            highlight.remove();
          } catch (err) {
            // Silent error handling
          }
        }
      });

      // Clear the highlights for this category
      activeCategoryHighlightsRef.current[category] = [];

      console.log(`🗑️ ${category}: removed ${highlights.length} highlights`);
    } else {
      // Remove all category highlights
      const categories = Object.keys(activeCategoryHighlightsRef.current);
      let totalRemoved = 0;

      categories.forEach(cat => {
        const highlights = activeCategoryHighlightsRef.current[cat] || [];
        totalRemoved += highlights.length;

        highlights.forEach(highlight => {
          if (highlight && typeof highlight.remove === 'function') {
            try {
              highlight.remove();
            } catch (err) {
              // Silent error handling
            }
          }
        });

        // Clear the highlights for this category
        activeCategoryHighlightsRef.current[cat] = [];
      });

      console.log(`🗑️ Removed ${totalRemoved} highlights across all categories`);
    }
  };

  const toggleShowAllItems = (category, event) => {
    // Prevent the click from bubbling up to parent elements
    event.stopPropagation();

    // Toggle showing all items for this category
    setShowAllItems({
      ...showAllItems,
      [category]: !showAllItems[category]
    });
  };

  const renderPOIItems = (category) => {
    const items = visiblePOIs[category] || [];
    const categoryColor = getColorForCategory(category);

    if (items.length === 0) {
      return (
        <POIDetailItem
          color="#6b7280"
          style={{ cursor: 'default' }}
        >
          <POIDetailTitle>No {category} in current view</POIDetailTitle>
          <POIDetailDescription>
            Try zooming out or panning the map to see more POIs.
          </POIDetailDescription>
        </POIDetailItem>
      );
    }

    // Show only first 3 items if not expanded
    const displayItems = showAllItems[category] ? items : items.slice(0, 3);
    const hasMoreItems = items.length > 3;

    return (
      <>
        {displayItems.map(item => {
          const hasCoordinates = item.coordinates && Array.isArray(item.coordinates) && item.coordinates.length === 2;

          return (
            <POIDetailItem
              key={item.id}
              color={categoryColor}
              onClick={hasCoordinates ? () => handlePOIItemClick(item) : undefined}
              style={!hasCoordinates ? { opacity: 0.7, cursor: 'default' } : {}}
            >
              <POIDetailTitle>
                {item.name}
                {hasCoordinates && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.6)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      stroke="currentColor"
                      fill="none"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="10" r="3" />
                      <path d="M12 21l-8-8a8 8 0 1 1 16 0l-8 8z" />
                    </svg>
                    <span style={{ marginLeft: '3px' }}>Locate</span>
                  </span>
                )}
              </POIDetailTitle>
              <POIDetailDescription>
                {item.type} {item.rating ? `• Rating: ${item.rating}` : ''}
                {item.properties?.phone ? ` • ${item.properties.phone}` : ''}
                {!hasCoordinates && (
                  <span style={{
                    display: 'block',
                    marginTop: '4px',
                    fontSize: '11px',
                    fontStyle: 'italic',
                    color: 'rgba(255,255,255,0.5)'
                  }}>
                    No location data available
                  </span>
                )}
              </POIDetailDescription>
              {item.popularity && <POIStatsBar value={item.popularity} color={categoryColor} />}
            </POIDetailItem>
          );
        })}

        {/* Show/Hide more items button */}
        {hasMoreItems && (
          <div
            onClick={(e) => toggleShowAllItems(category, e)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              marginTop: '6px',
              marginBottom: '4px',
              transition: 'background-color 0.2s ease',
              borderRadius: '6px',
              backgroundColor: 'rgba(255,255,255,0.05)',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
          >
            {showAllItems[category] ? (
              <>
                <span>Show Less</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginLeft: '6px' }}>
                  <path d="M7 14l5-5 5 5z" />
                </svg>
              </>
            ) : (
              <>
                <span>Show All {items.length} Items</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginLeft: '6px' }}>
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </>
            )}
          </div>
        )}
      </>
    );
  };

  // Create a badge showing OSM or Sample based on data source
  const renderDataSourceBadge = (category) => {
    const isOSM = showOSMPOIs && osmDataLoaded[category];
    return (
      <span style={{
        fontSize: '9px',
        padding: '2px 4px',
        borderRadius: '4px',
        marginLeft: '4px',
        backgroundColor: isOSM ? 'rgba(0, 128, 0, 0.2)' : 'rgba(128, 128, 128, 0.2)',
        color: isOSM ? '#33cc33' : '#999999'
      }}>
        {isOSM ? 'OSM' : 'Sample'}
      </span>
    );
  };

  // Function to highlight building at POI location
  const highlightBuildingAtLocation = (coordinates, color, highlightId = 'poi-highlighted-building') => {
    if (!map?.current) {
      console.error("⛔ Map reference missing in highlightBuildingAtLocation");
      return { remove: () => {} };
    }

    console.log(`🏗️ [highlightBuildingAtLocation] Called with ID: ${highlightId}, color: ${color}`);
    console.log(`For coordinates:`, coordinates);

    try {
      // Define the possible building layer IDs to check
      const possibleBuildingLayers = [
        'building',
        'harbor-buildings-3d'
      ];

      // Find the first available building layer
      let buildingLayerId = null;
      for (const layerId of possibleBuildingLayers) {
        if (map.current.getLayer(layerId)) {
          buildingLayerId = layerId;
          console.log(`Found building layer: ${buildingLayerId}`);
          break;
        }
      }

      // If no building layer is found, try to find it by name
      if (!buildingLayerId) {
        const availableLayers = map.current.getStyle().layers.map(layer => layer.id);
        console.log('Available map layers:', availableLayers.join(', '));

        const buildingLayer = map.current.getStyle().layers.find(layer =>
          layer.id.includes('building')
        );

        if (buildingLayer) {
          buildingLayerId = buildingLayer.id;
          console.log(`Found building layer by name search: ${buildingLayerId}`);
        } else {
          console.error('❌ No building layer found in map layers');
          return { remove: () => {} };
        }
      }

      // First, check if there are any existing highlighted buildings with the same ID and clean them up
      const cleanupExistingHighlight = () => {
        // Check if the specific layer exists
        if (map.current.getLayer(highlightId)) {
          console.log(`Removing existing layer: ${highlightId}`);
          map.current.removeLayer(highlightId);
        }

        // Check if the specific source exists
        if (map.current.getSource(`${highlightId}-source`)) {
          console.log(`Removing existing source: ${highlightId}-source`);
          map.current.removeSource(`${highlightId}-source`);
        }
      };

      // Clean up any existing highlights with the same ID
      cleanupExistingHighlight();

      // Define a consistently unique ID for the highlighted building layer
      const highlightLayerId = highlightId;
      const highlightSourceId = `${highlightId}-source`;

      // Custom function to find the closest building to the POI
      const findClosestBuilding = () => {
        // Get the screen coordinates for the POI
        const center = map.current.project(coordinates);
        const initialSearchRadius = 50; // Increased from 30px for better results

        // First try a direct search within a small radius
        let features = map.current.queryRenderedFeatures(
          [
            [center.x - initialSearchRadius, center.y - initialSearchRadius],
            [center.x + initialSearchRadius, center.y + initialSearchRadius]
          ],
          { layers: [buildingLayerId] }
        );

        // If no features found, try progressively wider searches
        if (features.length === 0) {
          // Try multiple increasing radii to find buildings
          const searchRadii = [100, 150, 200, 300];

          for (const radius of searchRadii) {
            features = map.current.queryRenderedFeatures(
              [
                [center.x - radius, center.y - radius],
                [center.x + radius, center.y + radius]
              ],
              { layers: [buildingLayerId] }
            );

            if (features.length > 0) {
              break; // Exit the loop once we find buildings
            }
          }
        }

        // If still no buildings found, try other layers or return empty
        if (features.length === 0) {
          // Last resort: try to find any other building layer on the map
          const buildingLayers = map.current.getStyle().layers
            .filter(layer =>
              layer.id.includes('building') ||
              layer.id.includes('structure') ||
              layer.id.includes('3d')
            )
            .map(layer => layer.id);

          // Try each alternative building layer
          for (const altLayerId of buildingLayers) {
            if (altLayerId === buildingLayerId) continue; // Skip the one we already tried

            features = map.current.queryRenderedFeatures(
              [
                [center.x - 200, center.y - 200],
                [center.x + 200, center.y + 200]
              ],
              { layers: [altLayerId] }
            );

            if (features.length > 0) {
              buildingLayerId = altLayerId; // Update the building layer ID for future reference
              break;
            }
          }
        }

        if (features.length === 0) {
          return null;
        }

        // Find closest building by calculating distance to each building's centroid
        let closestBuilding = null;
        let minDistance = Infinity;
        let failedFeatures = 0;

        features.forEach((feature, idx) => {
          // Skip features with invalid geometries
          if (!feature.geometry || !feature.geometry.coordinates) {
            failedFeatures++;
            return;
          }

          try {
            let coords;

            // Handle different geometry types
            if (feature.geometry.type === 'Polygon' && Array.isArray(feature.geometry.coordinates[0])) {
              coords = feature.geometry.coordinates[0];
            } else if (feature.geometry.type === 'MultiPolygon' &&
                      Array.isArray(feature.geometry.coordinates[0]) &&
                      Array.isArray(feature.geometry.coordinates[0][0])) {
              coords = feature.geometry.coordinates[0][0];
            } else if (feature.geometry.type === 'Point') {
              // Handle point geometries (some building layers may use points)
              closestBuilding = feature;
              return; // Exit the forEach loop early
            } else {
              // Skip geometries we can't process
              failedFeatures++;
              return;
            }

            if (!coords || coords.length === 0) {
              failedFeatures++;
              return;
            }

            // Calculate centroid of the building
            const centerX = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
            const centerY = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;

            // Calculate distance from POI to building centroid
            const dist = Math.sqrt(
              Math.pow(centerX - coordinates[0], 2) +
              Math.pow(centerY - coordinates[1], 2)
            );

            // Update if this is the closest building so far
            if (dist < minDistance) {
              minDistance = dist;
              closestBuilding = feature;
            }
          } catch (error) {
            failedFeatures++;
          }
        });

        // If we didn't find a closest building but have features, use the first valid one
        if (!closestBuilding && features.length > 0) {
          for (const feature of features) {
            if (feature.geometry) {
              closestBuilding = feature;
              break;
            }
          }
        }

        return closestBuilding;
      };

      // Find the closest building to highlight
      const closestBuilding = findClosestBuilding();

      if (!closestBuilding) {
        return { remove: () => {} };
      }

      // Create a source with just this building
      try {
        map.current.addSource(highlightSourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [closestBuilding]
          }
        });
      } catch (error) {
        console.error('Error adding highlight source');
        return { remove: () => {} };
      }

      // Add a new layer for the highlighted building
      try {
        map.current.addLayer({
          id: highlightLayerId,
          source: highlightSourceId,
          type: 'fill-extrusion',
          paint: {
            'fill-extrusion-color': color,
            'fill-extrusion-height': [
              'case',
              ['has', 'height'], ['get', 'height'],
              ['has', 'min_height'], ['get', 'min_height'],
              30  // Default height if none specified
            ],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0,  // Start with 0 opacity for animation
            'fill-extrusion-opacity-transition': {
              duration: 300,  // Faster transition for better responsiveness
              delay: 0
            }
          }
        });
      } catch (error) {
        console.error('Error adding highlight layer');

        // Clean up the source if we failed to add the layer
        if (map.current.getSource(highlightSourceId)) {
          map.current.removeSource(highlightSourceId);
        }

        return { remove: () => {} };
      }

      // The opacity for category highlights should be lower than for single POI
      const targetOpacity = highlightId.includes('category') ? 0.7 : 0.9;

      // Add a brief delay before animating the opacity
      // This ensures the layer is fully added to the map
      setTimeout(() => {
        try {
          if (map.current && map.current.getLayer(highlightLayerId)) {
            // Set full opacity for maximum visibility
            map.current.setPaintProperty(highlightLayerId, 'fill-extrusion-opacity', targetOpacity);
          }
        } catch (error) {
          console.warn('Error animating highlight opacity');
        }
      }, 50);  // Shorter delay for better responsiveness

      // Return a removal function
      return {
        remove: () => {
          try {
            if (!map.current) return;

            // First animate opacity down
            if (map.current.getLayer(highlightLayerId)) {
              map.current.setPaintProperty(highlightLayerId, 'fill-extrusion-opacity', 0);

              // Then remove after animation completes
              setTimeout(() => {
                try {
                  cleanupExistingHighlight();
                } catch (e) {
                  console.warn('Error during highlight cleanup:', e);
                }
              }, 500);
            } else {
              // If layer is already gone, just clean up sources
              if (map.current.getSource(highlightSourceId)) {
                map.current.removeSource(highlightSourceId);
              }
            }
          } catch (e) {
            console.warn('Error removing building highlight:', e);
          }
        }
      };
    } catch (error) {
      console.error('Error in building highlight process:', error);
      return { remove: () => {} };
    }
  };

  // Initialize global styles once when component mounts
  useEffect(() => {
    // Apply global styles for popups
    createGlobalStyles();
  }, []);

  // Function to handle clicking on a POI item
  const handlePOIItemClick = (item) => {
    if (!map?.current || !item.coordinates) return;

    console.log(`POIDataBar: Zooming to POI at coordinates:`, item.coordinates);

    // Get the category color for this item's category, not its type
    const categoryForItem = Object.keys(visiblePOIs).find(category =>
      visiblePOIs[category].some(poi => poi.id === item.id)
    ) || item.type?.toLowerCase() || 'default';

    const categoryColor = getColorForCategory(categoryForItem);

    console.log(`Using color for category ${categoryForItem}:`, categoryColor);

    // Keep category highlights but remove individual POI highlight
    if (activeBuildingHighlightRef.current) {
      activeBuildingHighlightRef.current.remove();
      activeBuildingHighlightRef.current = null;
    }

    // Remove any existing popups
    const existingPopups = document.querySelectorAll('.mapboxgl-popup');
    existingPopups.forEach(popup => popup.remove());

    // Zoom to the POI location
    map.current.flyTo({
      center: item.coordinates,
      zoom: 17, // Close enough to see the POI clearly
      essential: true,
      duration: 1000 // 1 second animation
    });

    // Wait for the map to finish moving before attempting to highlight the building
    map.current.once('moveend', () => {
      console.log('✅ Map movement completed');

      // Attempt to highlight the building after a short delay
      setTimeout(() => {
        try {
          const buildingHighlight = highlightBuildingAtLocation(
            item.coordinates,
            categoryColor,
            'individual-poi-highlight'
          );
          if (buildingHighlight && typeof buildingHighlight.remove === 'function') {
            activeBuildingHighlightRef.current = buildingHighlight;
          }
        } catch (e) {
          console.error('Error highlighting building:', e);
        }
      }, 300);
    });
  };

  // Wrapper function for togglePOIMarkerVisibility
  const handleTogglePOIMarkerVisibility = (event) => {
    togglePOIMarkerVisibility(
      event,
      map,
      arePOIMarkersVisible,
      setArePOIMarkersVisible,
      setShowPOIMarkers,
      setShowOSMPOIs
    );
  };

  // Wrapper function for highlightAllActivePOIs
  const handleHighlightAllActivePOIs = () => {
    highlightAllActivePOIs(
      allBuildingsHighlighted,
      setAllBuildingsHighlighted,
      setPauseCountUpdates,
      visiblePOIs,
      activeBuildingHighlightRef,
      removeCategoryHighlights,
      setHighlightedCategories,
      highlightCategoryPOIs,
      highlightedCategories
    );
  };

  const handleHighlightAllPOIs = async () => {
    if (!map) return;

    // Collect all POI categories to highlight
    const categoriesToHighlight = [];
    Object.entries(poiCounts).forEach(([category, count]) => {
      if (expandedCategories.has(category) && count > 0) {
        categoriesToHighlight.push(category);
      }
    });

    if (categoriesToHighlight.length === 0) {
      console.log("No categories selected for highlighting");
      return;
    }

    console.log(`🔍 Highlighting POIs for categories: ${categoriesToHighlight.join(', ')}`);

    // Clear any existing highlights
    removeCategoryHighlights();

    // Collect all POIs to highlight
    const poisToHighlight = [];
    categoriesToHighlight.forEach(category => {
      const categoryPOIs = visiblePOIs[category] || [];
      categoryPOIs.forEach(poi => {
        if (poi.coordinates && Array.isArray(poi.coordinates) && poi.coordinates.length === 2) {
          poisToHighlight.push({
            coordinates: poi.coordinates,
            category: category
          });
        }
      });
    });

    console.log(`Found ${poisToHighlight.length} POIs to highlight`);

    // Use our own highlighting function to create larger, more visible highlights
    poisToHighlight.forEach((poi, index) => {
      const layerId = `highlight-all-${index}`;
      const color = getColorForCategory(poi.category);

      // Create a large, bright highlight for each POI
      const highlight = highlightBuildingAtLocation(
        poi.coordinates,
        color,
        layerId
      );

      // Store the highlight for cleanup
      if (highlight) {
        if (!activeCategoryHighlightsRef.current['all']) {
          activeCategoryHighlightsRef.current['all'] = [];
        }
        activeCategoryHighlightsRef.current['all'].push(highlight);
      }
    });

    console.log(`✅ Created ${poisToHighlight.length} building highlights`);
  };

  return (
    <>
      <POIDataBarContainer $isCollapsed={isPOIDataBarCollapsed}>
        <POIDataHeader>
          <POIDataTitle style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span
              onClick={handleTogglePOIMarkerVisibility}
              style={{
                cursor: 'pointer',
                opacity: arePOIMarkersVisible ? 1 : 0.6,
                transition: 'opacity 0.2s ease',
                position: 'relative',
              }}
              title={arePOIMarkersVisible ? "Click to hide POI markers on map" : "Click to show POI markers on map"}
            >
              POI Data
              <span style={{
                position: 'absolute',
                bottom: '-3px',
                left: 0,
                width: '100%',
                height: '2px',
                background: arePOIMarkersVisible ? '#3b82f6' : 'rgba(255,255,255,0.3)',
                transition: 'background 0.2s ease',
              }}></span>
            </span>
            <span
              onClick={handleHighlightAllActivePOIs}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '10px',
                backgroundColor: allBuildingsHighlighted ? 'rgba(59, 130, 246, 0.9)' : '#3b82f6',
                color: 'white',
                borderRadius: '12px',
                padding: '1px 8px',
                fontSize: '11px',
                fontWeight: 'bold',
                minWidth: '32px',
                cursor: 'pointer',
                border: allBuildingsHighlighted ? '1px solid white' : 'none',
                boxShadow: allBuildingsHighlighted ? '0 0 8px rgba(59, 130, 246, 0.8)' : 'none',
                position: 'relative',
                // Calculate width directly based on number of digits
                width: (() => {
                  const count = Object.values(poiCounts).reduce((sum, count) => sum + count, 0);
                  const numDigits = count.toString().length;
                  // Each digit gets ~8px + padding
                  return `${Math.max(32, (numDigits * 8) + 16)}px`;
                })(),
                transition: 'all 0.3s ease-in-out'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = allBuildingsHighlighted
                  ? 'rgba(59, 130, 246, 1)'
                  : 'rgba(59, 130, 246, 0.8)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.7)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = allBuildingsHighlighted
                  ? 'rgba(59, 130, 246, 0.9)'
                  : '#3b82f6';
                e.currentTarget.style.boxShadow = allBuildingsHighlighted
                  ? '0 0 8px rgba(59, 130, 246, 0.8)'
                  : 'none';
              }}
              title={allBuildingsHighlighted
                ? "Click to remove highlights and resume count updates"
                : "Click to highlight all buildings and pause count updates"}
            >
              {Object.values(poiCounts).reduce((sum, count) => sum + count, 0)}
              {allBuildingsHighlighted && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  backgroundColor: '#ff3333',
                  color: 'white',
                  borderRadius: '50%',
                  width: '10px',
                  height: '10px',
                  fontSize: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid white',
                  boxShadow: '0 0 4px rgba(255, 0, 0, 0.5)'
                }}></span>
              )}
            </span>
          </POIDataTitle>
          <CollapseButton
            onClick={() => setIsPOIDataBarCollapsed(!isPOIDataBarCollapsed)}
            $isCollapsed={isPOIDataBarCollapsed}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L10.83 12l4.58 4.59L14 18l-6-6 6-6 1.41 1.41z"/>
            </svg>
          </CollapseButton>
        </POIDataHeader>

        <POIDataContent>
          {/* Display only first three categories or all categories based on state */}
          {(showAllCategories ? sortedCategories : sortedCategories.slice(0, 3)).map((category, index) => {
            // Determine animation and styling based on position and movement
            const positionClass = '';
            const moveClass = positionChanges[category]
              ? (positionChanges[category].moved === 'up' ? 'move-up' : 'move-down')
              : '';

            return (
              <POICategory
                key={category}
                className={`${positionClass} ${moveClass}`}
                style={{
                  transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease',
                  transform: `translateY(0)`,
                  opacity: 1,
                  position: 'relative',
                  zIndex: sortedCategories.length - index, // Higher z-index for top categories
                  animationDelay: `${index * 0.08}s`, // Slightly longer delay between items
                  borderLeft: positionChanges[category] ?
                    (positionChanges[category].moved === 'up' ? '4px solid rgba(50, 205, 50, 0.8)' : '4px solid rgba(255, 165, 0, 0.8)') :
                    'none',
                  boxShadow: positionChanges[category] ?
                    '0 0 10px rgba(255, 255, 255, 0.2)' :
                    'none',
                }}
              >
                <POICategoryHeader
                  onClick={() => toggleCategory(category)}
                  $isExpanded={expandedCategories[category]}
                  style={{
                    transition: 'background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
                    transform: expandedCategories[category] ? 'scale(1.02)' : 'scale(1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    // Add a glowing effect when the category is highlighted
                    boxShadow: highlightedCategories[category]
                      ? `0 0 8px ${getColorForCategory(category)}80, inset 0 0 3px ${getColorForCategory(category)}80`
                      : 'none',
                    borderLeft: highlightedCategories[category]
                      ? `4px solid ${getColorForCategory(category)}`
                      : positionChanges[category]
                        ? (positionChanges[category].moved === 'up' ? '4px solid rgba(50, 205, 50, 0.8)' : '4px solid rgba(255, 165, 0, 0.8)')
                        : 'none',
                    // Make the background color slightly tinted with the category color when highlighted
                    background: highlightedCategories[category]
                      ? `linear-gradient(90deg, rgba(30, 41, 59, 0.6) 0%, ${getColorForCategory(category)}15 100%)`
                      : 'rgba(30, 41, 59, 0.6)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <POICategoryIcon>
                      {getIconForCategory(category)}
                    </POICategoryIcon>
                    <span>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                      {renderDataSourceBadge(category)}

                      {/* Position change indicator */}
                      {positionChanges[category] && (
                        <span style={{
                          fontSize: '10px',
                          marginLeft: '4px',
                          color: positionChanges[category].moved === 'up' ? 'rgba(50, 205, 50, 0.9)' : 'rgba(255, 165, 0, 0.9)',
                          fontWeight: 'bold',
                        }}>
                          {positionChanges[category].moved === 'up' ? '↑' : '↓'}
                          {Math.abs(positionChanges[category].currPos - positionChanges[category].prevPos)}
                        </span>
                      )}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <POICountBadge
                      color={getColorForCategory(category)}
                      count={poiCounts[category]}
                      isTopThree={false}
                      className={positionChanges[category] ? 'count-changed' : ''}
                      style={{
                        marginRight: '10px',
                        // Calculate width directly based on number of digits
                        width: (() => {
                          const count = poiCounts[category] || 0;
                          const numDigits = count.toString().length;
                          // Each digit gets ~8px + padding
                          return `${Math.max(32, (numDigits * 8) + 16)}px`;
                        })(),
                        // Add transition for smooth width changes
                        transition: 'width 0.5s ease-in-out, background-color 0.3s ease',
                        // Add a subtle indicator that counts are paused
                        opacity: pauseCountUpdates ? 0.9 : 1,
                        boxShadow: pauseCountUpdates ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.3)' : 'none',
                      }}
                    >
                      {poiCounts[category] || 0}
                    </POICountBadge>

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="16"
                      height="16"
                      style={{
                        transform: expandedCategories[category] ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </POICategoryHeader>

                {expandedCategories[category] && (
                  <div style={{
                    marginTop: '8px',
                    paddingLeft: '12px',
                    animation: 'slideDown 0.3s ease-out forwards',
                    overflow: 'hidden',
                  }}>
                    {renderPOIItems(category)}
                  </div>
                )}
              </POICategory>
            );
          })}

          {/* Show More/Less button - only display if there are more than 3 categories */}
          {sortedCategories.length > 3 && (
            <div
              style={{
                padding: '10px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                margin: '8px 0',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              onClick={() => setShowAllCategories(!showAllCategories)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.5)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: '500' }}>
                {showAllCategories
                  ? `Show Less (${sortedCategories.length - 3} less)`
                  : `Show More (${sortedCategories.length - 3} more)`}
              </span>
            </div>
          )}
        </POIDataContent>
      </POIDataBarContainer>

      <ExpandButton
        onClick={() => setIsPOIDataBarCollapsed(false)}
        $isCollapsed={isPOIDataBarCollapsed}
        title="Expand POI data panel"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
        </svg>
      </ExpandButton>
    </>
  );
};

export default POIDataBar;