import React, { useEffect, useRef, useState } from 'react';

/**
 * POISynchronizer component
 *
 * This component synchronizes interactions between the POI Graph and POI Data Bar.
 * It listens for events from the POI Graph and triggers appropriate actions in the POI Data Bar.
 *
 * Phase 3: Full bidirectional synchronization between POI Graph and POI Data Bar
 * - When a POI is selected in the graph, the Data Bar opens and highlights the POI
 * - Improved visual feedback and error handling
 * - Enhanced DOM traversal to find and interact with POI elements
 * - Direct DOM manipulation for reliable synchronization
 */
const POISynchronizer = ({ map, poiDataBarRef, poiData2Ref }) => {
  // Keep track of initialization
  const isInitialized = useRef(false);
  // Track the last selected POI for retry attempts
  const [lastSelectedPOI, setLastSelectedPOI] = useState(null);
  // Track retry attempts
  const retryCount = useRef(0);
  const maxRetries = 5;
  // Track if we're currently in a retry cycle
  const isRetrying = useRef(false);
  // Track if we've successfully found the POI Data Bar
  const foundPOIDataBar = useRef(false);

  // Debug logging helper - clean and focused logs
  const debug = (message, data) => {
    // Use a consistent, clean format for logs
    console.log(`%c[POI-SYNC] ${message}`, 'background: #4a148c; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;', data || '');
  };

  // Only log important events to keep the console clean
  const logImportant = (message, data) => {
    console.log(`%c[POI-SYNC-IMPORTANT] ${message}`, 'background: #d81b60; color: white; padding: 3px 6px; border-radius: 3px; font-weight: bold;', data || '');
  };

  // Function to process POI selection and synchronize with POI Data Bar
  const processPOISelection = (poi) => {
    // Don't rely solely on the ref - try direct DOM access first
    const poiContainer = document.getElementById('poi-data-container') ||
                         document.querySelector('.poi-container');

    if (!poiContainer && !poiDataBarRef.current) {
      debug('POI Data Bar is not available by any means, will retry');
      scheduleRetry(poi);
      return;
    }

    debug('Processing POI selection', {
      name: poi.name,
      category: poi.category,
      coordinates: poi.coordinates
    });

    // Phase 3: Step 1 - Open the POI Data Bar with improved handling
    try {
      // First try using the ref methods
      if (typeof poiDataBarRef.current.expand === 'function') {
        debug('Expanding POI Data Bar using ref method');
        poiDataBarRef.current.expand();
      } else {
        // Fallback to direct DOM manipulation with multiple strategies
        debug('Expanding POI Data Bar using DOM manipulation');

        // Strategy 1: Try by ID
        const poiContainer = document.getElementById('poi-data-container');
        if (poiContainer) {
          debug('Found POI container by ID, expanding');
          poiContainer.style.width = '300px';

          // Force a reflow to ensure the style is applied immediately
          void poiContainer.offsetWidth;
        } else {
          // Strategy 2: Try by class name
          const poiContainerByClass = document.querySelector('.poi-container');
          if (poiContainerByClass) {
            debug('Found POI container by class, expanding');
            poiContainerByClass.style.width = '300px';

            // Force a reflow
            void poiContainerByClass.offsetWidth;
          } else {
            // Strategy 3: Try to find any element that might be the POI container
            const possibleContainers = document.querySelectorAll('[class*="poi"]');
            debug(`Found ${possibleContainers.length} possible POI containers`);

            if (possibleContainers.length > 0) {
              // Try the first one that looks like a container
              for (const container of possibleContainers) {
                if (container.clientWidth < 100) { // It's likely collapsed
                  debug('Found a collapsed POI-like container, expanding');
                  container.style.width = '300px';
                  break;
                }
              }
            } else {
              debug('Could not find POI Data Bar container element, will retry');
              scheduleRetry(poi);
              return;
            }
          }
        }
      }
    } catch (err) {
      debug('Error expanding POI Data Bar', err);
      scheduleRetry(poi);
      return;
    }

    // Phase 3: Step 2 - Open the correct category with improved handling
    try {
      const category = poi.category.toLowerCase();
      debug(`Opening category: ${category}`);

      if (typeof poiDataBarRef.current.openCategory === 'function') {
        debug('Opening category using ref method');
        poiDataBarRef.current.openCategory(category);
      } else {
        debug('openCategory method not available, trying alternative approaches');
        // Try to find and click the category header directly with multiple strategies
        setTimeout(() => {
          try {
            // Strategy 1: Look for category headers with the specific class
            const categoryHeaders = document.querySelectorAll('.poi-category-header');
            debug(`Found ${categoryHeaders.length} category headers by class`);

            // Find the header that matches our category
            let categoryHeader = null;
            categoryHeaders.forEach(header => {
              const headerText = header.textContent.toLowerCase();
              if (headerText.includes(category)) {
                categoryHeader = header;
              }
            });

            if (categoryHeader) {
              debug(`Found matching category header for ${category}, clicking it`);
              categoryHeader.click();
            } else {
              // Strategy 2: Look for any element that might be a category header
              debug('No matching category header found by class, trying broader search');
              const allHeaders = document.querySelectorAll('div[class*="category"], div[class*="poi"] > div');

              for (const header of allHeaders) {
                const headerText = header.textContent.toLowerCase();
                if (headerText.includes(category)) {
                  debug(`Found matching header element for ${category} in broader search, clicking it`);
                  header.click();
                  break;
                }
              }

              // Strategy 3: If we still can't find it, try clicking the POI Data Bar title to ensure it's fully expanded
              const poiTitle = document.getElementById('poi-data-title');
              if (poiTitle) {
                debug('Clicking POI title to ensure full expansion');
                poiTitle.click();

                // Try again after a short delay
                setTimeout(() => {
                  const categoryHeadersRetry = document.querySelectorAll('.poi-category-header');
                  for (const header of categoryHeadersRetry) {
                    const headerText = header.textContent.toLowerCase();
                    if (headerText.includes(category)) {
                      debug(`Found matching category header on retry, clicking it`);
                      header.click();
                      break;
                    }
                  }
                }, 200);
              }
            }
          } catch (err) {
            debug('Error finding and clicking category header', err);
          }
        }, 300); // Small delay to ensure the POI Data Bar is fully expanded
      }
    } catch (err) {
      debug('Error opening category', err);
    }

    // Phase 3: Step 3 - Highlight the selected POI with improved handling
    try {
      setTimeout(() => {
        debug(`Highlighting POI: ${poi.name}`);

        if (typeof poiDataBarRef.current.highlightPOI === 'function') {
          debug('Highlighting POI using ref method');
          poiDataBarRef.current.highlightPOI(poi);
        } else {
          debug('highlightPOI method not available, trying alternative approaches');
          // Try to find and click the POI item directly with multiple strategies
          try {
            // Strategy 1: Look for POI items with the specific class
            const poiItems = document.querySelectorAll('.poi-item');
            debug(`Found ${poiItems.length} POI items by class`);

            // Find the item that matches our POI
            let matchingItem = null;
            let bestMatchScore = 0;

            poiItems.forEach(item => {
              const itemText = item.textContent.toLowerCase();
              const poiNameLower = poi.name.toLowerCase();

              // Calculate a match score based on text similarity
              if (itemText.includes(poiNameLower)) {
                // Perfect match if the item text contains the exact POI name
                const score = poiNameLower.length / itemText.length; // Higher score for closer matches
                if (score > bestMatchScore) {
                  bestMatchScore = score;
                  matchingItem = item;
                }
              }
            });

            if (matchingItem) {
              debug(`Found matching POI item for ${poi.name} with score ${bestMatchScore}, clicking it`);
              matchingItem.click();

              // Add visual highlight to the item
              try {
                matchingItem.style.backgroundColor = 'rgba(255, 69, 0, 0.2)'; // Highlight with a subtle orange background
                matchingItem.style.boxShadow = '0 0 0 2px rgba(255, 69, 0, 0.5)';

                // Remove the highlight after a few seconds
                setTimeout(() => {
                  matchingItem.style.backgroundColor = '';
                  matchingItem.style.boxShadow = '';
                }, 3000);
              } catch (styleErr) {
                debug('Error applying highlight style', styleErr);
              }
            } else {
              // Strategy 2: Look for any element that might contain the POI name
              debug('No matching POI item found by class, trying broader search');
              const allPossibleItems = document.querySelectorAll('div[class*="poi"] div, li');

              for (const item of allPossibleItems) {
                const itemText = item.textContent.toLowerCase();
                if (itemText.includes(poi.name.toLowerCase()) && !itemText.includes('category')) {
                  debug(`Found matching element for ${poi.name} in broader search, clicking it`);
                  item.click();

                  // Add visual highlight
                  try {
                    item.style.backgroundColor = 'rgba(255, 69, 0, 0.2)';
                    item.style.boxShadow = '0 0 0 2px rgba(255, 69, 0, 0.5)';

                    setTimeout(() => {
                      item.style.backgroundColor = '';
                      item.style.boxShadow = '';
                    }, 3000);
                  } catch (styleErr) {
                    debug('Error applying highlight style', styleErr);
                  }

                  break;
                }
              }
            }
          } catch (err) {
            debug('Error finding and clicking POI item', err);
          }
        }
      }, 600); // Longer delay to ensure the category is fully expanded
    } catch (err) {
      debug('Error highlighting POI', err);
    }

    // Reset retry state since we've successfully processed the POI
    isRetrying.current = false;
  };

  // Function to schedule a retry attempt
  const scheduleRetry = (poi) => {
    if (retryCount.current >= maxRetries) {
      debug(`Maximum retry attempts (${maxRetries}) reached, giving up`);
      isRetrying.current = false;
      return;
    }

    isRetrying.current = true;
    retryCount.current++;

    const delay = 500 * retryCount.current; // Increasing delay with each retry
    debug(`Scheduling retry attempt ${retryCount.current}/${maxRetries} in ${delay}ms`);

    setTimeout(() => {
      debug(`Executing retry attempt ${retryCount.current}`);
      processPOISelection(poi);
    }, delay);
  };

  // Function to handle POI selection from the graph
  const handlePOISelection = (event) => {
    logImportant('POI selected from graph', { name: event?.poi?.name, category: event?.poi?.category });

    if (!event || !event.poi) {
      debug('Invalid POI selection event - missing poi data');
      return;
    }

    const { poi } = event;

    // Store the selected POI for retry attempts
    setLastSelectedPOI(poi);

    // Reset retry counter when a new POI is selected
    if (!isRetrying.current) {
      retryCount.current = 0;
    }

    // Emit an event to show the POIData2 component
    logImportant('Emitting event to show POIData2');
    window.mapEventBus.emit('poigraph:show_poi_data2', { show: true });

    // Try to use the POIData2 component first (our test component)
    if (poiData2Ref && poiData2Ref.current) {
      logImportant('Using POIData2 component via ref');
      try {
        // Call the openDataBar method on the POIData2 component
        poiData2Ref.current.openDataBar();

        // Call the highlightPOI method on the POIData2 component
        poiData2Ref.current.highlightPOI(poi);

        // Mark that we've successfully found the POI Data Bar
        foundPOIDataBar.current = true;

        // Return here - we want to prioritize POIData2 over the original POIDataBar
        return;
      } catch (refErr) {
        logImportant('Error using POIData2 ref', refErr);
        // Continue with direct DOM manipulation if ref approach fails
      }
    }

    // DIRECT APPROACH: Try to directly trigger the POI Data Bar's event handler
    try {
      debug('Attempting direct POI Data Bar interaction');

      // First, try to find the POI Data Bar (try POIData2 first, then fall back to original)
      let poiContainer = document.getElementById('poi-data2-container') ||
                         document.querySelector('.poi-data2-container');

      // If we can't find POIData2, try the original POI Data Bar
      if (!poiContainer) {
        poiContainer = document.getElementById('poi-data-container') ||
                      document.querySelector('.poi-container');
      }

      if (poiContainer) {
        poiContainer.style.width = '300px';

        // Force a reflow
        void poiContainer.offsetWidth;

        // Try to click the POI Data Bar title to ensure it's fully expanded
        const poiTitle = document.getElementById('poi-data-title');
        if (poiTitle) {
          debug('Clicking POI title to ensure full expansion');
          poiTitle.click();
        }

        // Also try to click the collapse button if it's in collapsed state
        const collapseButton = document.getElementById('poi-data-collapse-button');
        if (collapseButton && collapseButton.textContent.includes('▶')) { // Right arrow character
          debug('Found collapse button in collapsed state, clicking it');
          collapseButton.click();
        }

        // Directly emit the event that the POI Data Bar listens for
        window.mapEventBus.emit('poigraph:poi_selected', { poi });
        debug('Directly emitted poigraph:poi_selected event to POI Data Bar');
      }
    } catch (directErr) {
      debug('Error in direct POI Data Bar interaction', directErr);
    }

    // Phase 3 Enhancement: Ensure OSM POIs layer is visible when a POI is selected
    // This ensures that when a user clicks on a POI in the graph, they can see it on the map
    try {
      // Emit an event to toggle on the OSM POIs layer
      window.mapEventBus.emit('osmLayer:request_visibility', { visible: true });
      debug('Requested OSM POIs layer to be visible');

      // Add visual indicator on the map
      if (map && poi.coordinates) {
        addVisualIndicator(poi);
      }
    } catch (err) {
      debug('Error requesting OSM POIs visibility', err);
    }

    // Process the POI selection as a fallback
    processPOISelection(poi);
  };

  // Function to handle POI selection from the Data Bar
  const handlePOIDataBarSelection = (event) => {
    debug('POI selected from Data Bar', event);

    if (!event || !event.poi) {
      debug('Invalid POI Data Bar selection event - missing poi data');
      return;
    }

    // No need to process this event further as the POI Data Bar already handles the UI updates
    // This is mainly for logging and future enhancements
  };

  // Initialize event listeners
  useEffect(() => {
    if (!map || isInitialized.current) return;

    debug('Initializing POI Synchronizer');

    // Check if we can find the POI Data Bar directly in the DOM
    const poiContainer = document.getElementById('poi-data-container') ||
                         document.querySelector('.poi-container');
    if (poiContainer) {
      debug('Found POI Data Bar in DOM during initialization');
    } else if (!poiDataBarRef) {
      debug('POI Data Bar not found in DOM and ref not provided, will try again later');
    }

    // Listen for POI selection events from the graph
    const unsubscribeGraph = window.mapEventBus.on('poigraph:poi_selected', handlePOISelection);
    debug('Event listener registered for poigraph:poi_selected');

    // Listen for POI selection events from the Data Bar
    const unsubscribeDataBar = window.mapEventBus.on('poidatabar:poi_selected', handlePOIDataBarSelection);
    debug('Event listener registered for poidatabar:poi_selected');

    // Listen for POI Data Bar visibility changes
    const unsubscribeVisibility = window.mapEventBus.on('poidatabar:visibility_changed', (event) => {
      debug('POI Data Bar visibility changed', event);
      // This can be used for future enhancements
    });

    // Add a DOM mutation observer to detect changes in the POI Data Bar
    // This helps us detect when categories are expanded/collapsed or POIs are highlighted
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          // The POI Data Bar's style has changed (expanded/collapsed)
          debug('POI Data Bar style changed', {
            target: mutation.target.className || mutation.target.id || 'unknown',
            style: mutation.target.style.cssText
          });
        } else if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // New nodes were added to the POI Data Bar (category expanded or POI added)
          debug('POI Data Bar content changed', {
            target: mutation.target.className || mutation.target.id || 'unknown',
            addedNodes: mutation.addedNodes.length
          });
        }
      }
    });

    // Start observing the POI Data Bar container if available
    setTimeout(() => {
      const poiContainer = document.getElementById('poi-data-container') || document.querySelector('.poi-container');
      if (poiContainer) {
        observer.observe(poiContainer, {
          attributes: true,
          childList: true,
          subtree: true,
          attributeFilter: ['style', 'class']
        });
        debug('Mutation observer attached to POI Data Bar');
      }
    }, 1000); // Delay to ensure the container is available

    isInitialized.current = true;

    // Cleanup function
    return () => {
      debug('Cleaning up event listeners');
      if (typeof unsubscribeGraph === 'function') unsubscribeGraph();
      if (typeof unsubscribeDataBar === 'function') unsubscribeDataBar();
      if (typeof unsubscribeVisibility === 'function') unsubscribeVisibility();
      observer.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Retry processing when the POI Data Bar ref becomes available
  useEffect(() => {
    if (lastSelectedPOI && poiDataBarRef && poiDataBarRef.current) {
      debug('POI Data Bar ref is now available, retrying with last selected POI');
      processPOISelection(lastSelectedPOI);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poiDataBarRef, lastSelectedPOI]);

  // Add a visual indicator when a POI is selected
  const addVisualIndicator = (poi) => {
    if (!map || !poi || !poi.coordinates) return;

    try {
      // Create a pulsing circle at the POI location
      const pulseId = `poi-sync-pulse-${Date.now()}`;

      // Check if the map has the source already
      if (map.getSource(pulseId)) {
        debug('Pulse source already exists, removing it');
        map.removeLayer(`${pulseId}-layer`);
        map.removeSource(pulseId);
      }

      // Add a new source for the pulse
      map.addSource(pulseId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: poi.coordinates
          },
          properties: {}
        }
      });

      // Add a pulsing circle layer
      map.addLayer({
        id: `${pulseId}-layer`,
        type: 'circle',
        source: pulseId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'pulse'],
            0, 5,
            1, 25
          ],
          'circle-color': poi.category ? getColorForCategory(poi.category) : '#FF4500',
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['get', 'pulse'],
            0, 0.7,
            1, 0
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF'
        }
      });

      // Animate the pulse
      let start = null;
      const duration = 2000; // 2 seconds per pulse

      function animatePulse(timestamp) {
        if (!start) start = timestamp;
        const progress = (timestamp - start) / duration;

        // Update the pulse property
        if (map.getSource(pulseId)) {
          map.getSource(pulseId).setData({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: poi.coordinates
            },
            properties: {
              pulse: progress % 1 // Cycle between 0 and 1
            }
          });
        }

        // Continue the animation
        if (progress < 3) { // Run for 3 cycles
          requestAnimationFrame(animatePulse);
        } else {
          // Remove the pulse after animation completes
          setTimeout(() => {
            if (map.getLayer(`${pulseId}-layer`)) {
              map.removeLayer(`${pulseId}-layer`);
            }
            if (map.getSource(pulseId)) {
              map.removeSource(pulseId);
            }
          }, 500);
        }
      }

      // Start the animation
      requestAnimationFrame(animatePulse);

    } catch (err) {
      debug('Error adding visual indicator', err);
    }
  };

  // Helper function to get color for category
  const getColorForCategory = (category) => {
    const categoryColors = {
      restaurants: '#ff9900',
      cafes: '#cc6600',
      bars: '#990099',
      shops: '#0066ff',
      cultural: '#cc3300',
      parks: '#33cc33',
      default: '#FF4500'
    };

    return categoryColors[category.toLowerCase()] || categoryColors.default;
  };

  // This component doesn't render anything
  return null;
};

export default POISynchronizer;
