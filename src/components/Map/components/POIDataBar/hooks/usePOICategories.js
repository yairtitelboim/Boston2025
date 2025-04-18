import { useState, useRef, useEffect, useCallback } from 'react';
import { highlightBuildingAtLocation } from '../utils/buildingHighlighter';

// Set to true for troubleshooting
const DEBUG_LOGGING = true;

// Function to add delay between operations
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export const usePOICategories = (map, visiblePOIs, getColorForCategory) => {
  // Ref to track active individual building highlight for cleanup
  const activeBuildingHighlightRef = useRef(null);

  // Ref to track category highlights - as an object keyed by category
  const activeCategoryHighlightsRef = useRef({});

  // Track which categories are expanded in the UI
  const [expandedCategories, setExpandedCategories] = useState({
    restaurants: true,
    cafes: false,
    bars: false,
    shops: false,
    cultural: false,
    parks: false,
    education: false,
    healthcare: false,
    transportation: false
  });

  // Track which categories are highlighted
  const [highlightedCategories, setHighlightedCategories] = useState({
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

  // Add state for show all items in a category
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

  // Track if all buildings are highlighted
  const [isAllBuildingsHighlighted, setAllBuildingsHighlighted] = useState(false);

  // Track if POI count updates should be paused
  const [pauseCountUpdates, setPauseCountUpdates] = useState(false);

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

  // Function to toggle category expansion
  const toggleCategory = (category) => {
    // Toggle the expanded state of the category
    const newExpandedState = !expandedCategories[category];
    setExpandedCategories(prev => ({
      ...prev,
      [category]: newExpandedState
    }));

    // If we're expanding the category, highlight all POIs in that category
    if (newExpandedState) {
      // First clear any active individual highlight
      if (activeBuildingHighlightRef.current) {
        activeBuildingHighlightRef.current.remove();
        activeBuildingHighlightRef.current = null;
      }

      // Set this category as highlighted
      setHighlightedCategories(prev => ({
        ...prev,
        [category]: true
      }));

      // Highlight this category's POIs without removing other category highlights
      highlightCategoryPOIs(category);
    } else {
      // If we're collapsing, remove highlights for this category only
      if (highlightedCategories[category]) {
        removeCategoryHighlights(category);

        // Mark this category as not highlighted
        setHighlightedCategories(prev => ({
          ...prev,
          [category]: false
        }));
      }
    }
  };

  // Function to toggle showing all items for a category
  const toggleShowAllItems = (category, event) => {
    // Prevent the click from bubbling up to parent elements
    if (event) event.stopPropagation();

    // Toggle showing all items for this category
    setShowAllItems(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Function to highlight all POIs in a category
  const highlightCategoryPOIs = async (category) => {
    if (!map?.current) {
      DEBUG_LOGGING && console.error("Map reference is missing when trying to highlight category POIs");
      return;
    }

    const items = visiblePOIs[category] || [];
    const categoryColor = getColorForCategory(category);

    // Keep a minimal starting log
    DEBUG_LOGGING && console.log(`Highlighting ${items.length} POIs for ${category}`);

    // Filter out POIs without valid coordinates
    const validItems = items.filter(item =>
      item.coordinates &&
      Array.isArray(item.coordinates) &&
      item.coordinates.length === 2
    );

    const hasValidCoordinates = validItems.length > 0;
    if (!hasValidCoordinates) {
      DEBUG_LOGGING && console.log(`No valid POIs to highlight in ${category}`);
      return;
    }

    // First remove any existing highlights for this category
    removeCategoryHighlights(category);

    // Initialize array to store highlights for this category
    activeCategoryHighlightsRef.current[category] = [];

    // Limit the number of POIs to process to avoid overwhelming the map
    // For large datasets, we'll prioritize the first N items
    const MAX_HIGHLIGHTS = 50; // Doubled from 25 to 50 highlights per category
    const itemsToProcess = validItems.length > MAX_HIGHLIGHTS
      ? validItems.slice(0, MAX_HIGHLIGHTS)
      : validItems;

    // Track successful highlights to avoid duplicates
    let successfulHighlights = 0;
    let failedHighlights = 0;

    // Process POIs in smaller batches for better reliability
    const BATCH_SIZE = 3;
    for (let startIndex = 0; startIndex < itemsToProcess.length; startIndex += BATCH_SIZE) {
      const endIndex = Math.min(startIndex + BATCH_SIZE, itemsToProcess.length);
      const batch = itemsToProcess.slice(startIndex, endIndex);

      // Process each item in the batch with small delay between them
      const batchPromises = batch.map((item, index) =>
        new Promise(async resolve => {
          // Add staggered delay within the batch
          await delay(index * 100);

          try {
            // Try to ensure unique IDs by using category, index and timestamp
            const uniqueId = `category-highlight-${category}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;

            const highlight = highlightBuildingAtLocation(
              map,
              item.coordinates,
              categoryColor,
              uniqueId
            );

            if (highlight && typeof highlight.remove === 'function') {
              activeCategoryHighlightsRef.current[category].push(highlight);
              successfulHighlights++;
              resolve(true);
            } else {
              failedHighlights++;
              resolve(false);
            }
          } catch (e) {
            failedHighlights++;
            resolve(false);
          }
        })
      );

      await Promise.all(batchPromises);

      // Small delay between batches to avoid overloading
      await delay(50);
    }

    // Log highlighting statistics (but only if there were any failures to reduce noise)
    const successRate = (successfulHighlights / itemsToProcess.length) * 100;
    if (failedHighlights > 0 || successRate < 100) {
      DEBUG_LOGGING && console.log(`${category} highlight stats: ${successfulHighlights}/${itemsToProcess.length} successful (${successRate.toFixed(0)}%)`);
    }
  };

  // Function to remove category highlights
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

      DEBUG_LOGGING && console.log(`Removed ${highlights.length} highlights from ${category}`);
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

      if (totalRemoved > 0) {
        DEBUG_LOGGING && console.log(`Removed ${totalRemoved} highlights across all categories`);
      }
    }
  };

  // Function to highlight all buildings
  const highlightAllBuildings = async () => {
    if (!map?.current) return;

    // Remove any existing highlights first
    removeAllHighlights();

    // Set the state to indicate all buildings are highlighted
    setAllBuildingsHighlighted(true);

    // Highlight all POIs across all categories
    for (const category of Object.keys(visiblePOIs)) {
      await highlightCategoryPOIs(category);
    }
  };

  // Function to remove all highlights
  const removeAllHighlights = () => {
    // Remove individual building highlight if any
    if (activeBuildingHighlightRef.current) {
      activeBuildingHighlightRef.current.remove();
      activeBuildingHighlightRef.current = null;
    }

    // Remove all category highlights
    removeCategoryHighlights();

    // Reset highlighted categories state
    setHighlightedCategories(prev =>
      Object.keys(prev).reduce((acc, key) => ({
        ...acc,
        [key]: false
      }), {})
    );

    // Reset all buildings highlighted state
    setAllBuildingsHighlighted(false);
  };

  // Function to handle clicking on a POI item
  const handlePOIItemClick = (item) => {
    if (!map?.current || !item.coordinates) return;

    DEBUG_LOGGING && console.log(`Zooming to POI at coordinates:`, item.coordinates);

    // Get the category color for this item's category, not its type
    const categoryForItem = Object.keys(visiblePOIs).find(category =>
      visiblePOIs[category].some(poi => poi.id === item.id)
    ) || item.type?.toLowerCase() || 'default';

    const categoryColor = getColorForCategory(categoryForItem);

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
      DEBUG_LOGGING && console.log('Map movement completed');

      // Attempt to highlight the building after a short delay
      setTimeout(() => {
        try {
          const buildingHighlight = highlightBuildingAtLocation(
            map,
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

  // Cleanup effect
  useEffect(() => {
    return () => {
      removeAllHighlights();
    };
  }, []);

  return {
    expandedCategories,
    highlightedCategories,
    showAllItems,
    isAllBuildingsHighlighted,
    pauseCountUpdates,
    activeBuildingHighlightRef,
    activeCategoryHighlightsRef,
    toggleCategory,
    toggleShowAllItems,
    highlightCategoryPOIs,
    removeCategoryHighlights,
    highlightAllBuildings,
    removeAllHighlights,
    handlePOIItemClick,
    setPauseCountUpdates
  };
}

export default usePOICategories;