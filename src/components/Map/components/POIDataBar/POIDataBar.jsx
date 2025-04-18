import React, { useState, useEffect, useRef, useCallback, useImperativeHandle } from 'react';
import {
  POIContainer,
  POIHeader,
  POITitle,
  POICategories,
  CollapseButton,
  GlobalStyle,
  POIFooter,
  POIOptionsMenu,
  POIOptionsMenuButton,
  POICountBadge
} from './styles/POIDataBarStyles';
import { CATEGORIES } from './constants';
import { updateVisiblePOIs, getColorForCategory, removeAllHighlights } from './utils/poiDataManager';
import { usePOICategories } from './hooks/usePOICategories';
import POICategoryList from './components/POICategoryList';
import MapInfoPanel from './components/MapInfoPanel';
// import styled from 'styled-components'; // Not needed after removing styled components
import { mapEventBus } from '../../../../utils/eventBus';

// Utility functions for error handling
const error = (message, err) => {
  if (err?.message?.includes('version') || err?.message?.includes('style')) {
    // Suppress common initialization errors
    return;
  }
  // Errors are silently handled
};

// These styled components are used in POICategoryList component
/* const CategoryContainer = styled.div`
  margin-bottom: 8px;
  cursor: pointer;
  opacity: ${props => props.$isActive ? 1 : 0.6};
`;

const CategoryCount = styled.div`
  background: ${props => props.$count > 0 ? '#4CAF50' : '#666'};
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
  min-width: 24px;
  text-align: center;
`; */

const POIDataBar = React.forwardRef(({ map /* mapContext */ }, ref) => {
  // UI State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // const [searchText, setSearchText] = useState(''); // Not used in this component
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showMapInfo, setShowMapInfo] = useState(false);

  // Data State
  const [visiblePOIs, setVisiblePOIs] = useState({});
  const [poiCounts, setPoiCounts] = useState({});
  const [sortedCategories, setSortedCategories] = useState([]);
  const [positionChanges, setPositionChanges] = useState({});
  const [pauseCountUpdates, setPauseCountUpdates] = useState(false);

  // Refs
  const containerRef = useRef(null);
  const updateInterval = useRef(null);
  const previousPositions = useRef({});
  const mapRef = useRef(map);

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => {
    const methods = {
      expand: () => {
        if (isCollapsed) {
          setIsCollapsed(false);

          // Also try direct DOM manipulation as a backup
          try {
            if (containerRef.current) {
              containerRef.current.style.width = '300px';
            }
          } catch (err) {
            // Silently handle error
          }
        }
      },
      openCategory: (category) => {
        if (!expandedCategories[category]) {
          toggleCategory(category);
        }
      },
      highlightPOI: (poi) => {
        if (poi) {
          handlePOIItemClick(poi);
        }
      }
    };

    return methods;
  });

  // Update POI data
  const updatePOIData = useCallback(() => {
    if (!mapRef.current || pauseCountUpdates) return;

    try {
      const { updatedPOIs, updatedCounts } = updateVisiblePOIs(mapRef.current);

      setVisiblePOIs(updatedPOIs);
      setPoiCounts(() => {
        const newPositions = {};
        const categoriesArray = [...CATEGORIES];
        categoriesArray.sort((a, b) => (updatedCounts[b] || 0) - (updatedCounts[a] || 0));

        categoriesArray.forEach((category, index) => {
          newPositions[category] = index;
        });

        // Calculate position changes
        const changes = {};
        Object.keys(newPositions).forEach(category => {
          if (previousPositions.current[category] !== undefined &&
              newPositions[category] !== previousPositions.current[category]) {
            changes[category] = {
              prevPos: previousPositions.current[category],
              currPos: newPositions[category],
              moved: newPositions[category] < previousPositions.current[category] ? 'up' : 'down'
            };
          }
        });

        setSortedCategories(categoriesArray);
        previousPositions.current = { ...newPositions };
        setPositionChanges(changes);

        return updatedCounts;
      });
    } catch (err) {
      error('Failed to update POI data', err);
    }
  }, [pauseCountUpdates]);

  // Custom hook to manage category highlighting and expansion
  const {
    expandedCategories,
    highlightedCategories,
    showAllItems,
    toggleCategory,
    toggleShowAllItems,
    handlePOIItemClick,
    highlightAllActivePOIs,
    removeAllHighlights,
    isAllBuildingsHighlighted
  } = usePOICategories(map, visiblePOIs);

  // Initialize and clean up
  useEffect(() => {
    // Update map reference when it changes
    mapRef.current = map;

    if (map) {
      // Load POI data when map is available
      updatePOIData();

      // Set up update interval (every 5 seconds)
      updateInterval.current = setInterval(updatePOIData, 5000);
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
      removeAllHighlights();
    };
  }, [map, updatePOIData, removeAllHighlights]);

  // Listen for POI selection events from POI Graph
  useEffect(() => {
    if (!mapEventBus) return;

    const unsubscribe = mapEventBus.on('poigraph:poi_selected', (event) => {
      if (!event.poi) {
        return;
      }

      const { poi } = event;

      // Ensure the POI Data Bar is expanded
      if (isCollapsed) {
        // First update the React state
        setIsCollapsed(false);

        // Force the POI Data Bar to be visible with direct DOM manipulation
        // This is a fallback in case the React state update doesn't trigger the UI change immediately
        try {
          const poiContainer = document.querySelector('.poi-container');
          if (poiContainer) {
            poiContainer.style.width = '300px';

            // Force a reflow to ensure the style is applied immediately
            void poiContainer.offsetWidth;
          }
        } catch (err) {
          // Silently handle error
        }
      }

      // Find the category for this POI
      const category = poi.category.toLowerCase();

      // Make sure this category exists in our data
      if (!visiblePOIs[category]) {
        // Add this POI to the appropriate category
        setVisiblePOIs(prev => ({
          ...prev,
          [category]: [...(prev[category] || []), poi]
        }));
      } else {
        // Check if this POI already exists in the category
        const existingPOIIndex = visiblePOIs[category].findIndex(p =>
          p.coordinates &&
          poi.coordinates &&
          p.coordinates[0] === poi.coordinates[0] &&
          p.coordinates[1] === poi.coordinates[1] &&
          p.name === poi.name
        );

        if (existingPOIIndex === -1) {
          // Add this POI to the category if it doesn't exist
          setVisiblePOIs(prev => ({
            ...prev,
            [category]: [...prev[category], poi]
          }));
        }
      }

      // Expand the category
      if (!expandedCategories[category]) {
        toggleCategory(category);
      }

      // Trigger the POI item click handler to highlight the building
      setTimeout(() => {
        handlePOIItemClick(poi);
      }, 300); // Small delay to ensure the category is expanded
    });

    return () => {
      unsubscribe();
    };
  }, [isCollapsed, expandedCategories, visiblePOIs, toggleCategory, handlePOIItemClick]);



  // Toggle collapse state
  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);

    // Direct DOM manipulation to ensure the UI updates
    try {
      if (containerRef.current) {
        const newWidth = newCollapsedState ? '60px' : '300px';
        containerRef.current.style.width = newWidth;

        // Force a reflow to ensure the style is applied immediately
        void containerRef.current.offsetWidth;
      }
    } catch (err) {
      // Silently handle error
    }
  };

  // Toggle pause state
  const togglePauseUpdates = () => {
    setPauseCountUpdates(!pauseCountUpdates);
  };

  // Get icon for category (using simple emoji for now)
  const getIconForCategory = (category) => {
    const icons = {
      restaurants: '🍽️',
      cafes: '☕',
      bars: '🍸',
      shops: '🛍️',
      cultural: '🏛️',
      parks: '🌳',
      education: '🎓',
      healthcare: '🏥',
      transportation: '🚆'
    };

    return icons[category] || '📍';
  };

  // Render data source badge
  const renderDataSourceBadge = (category) => {
    const hasOSMData = visiblePOIs[category]?.some(item => item.source === 'osm');
    const hasMapboxData = visiblePOIs[category]?.some(item => item.source === 'mapbox');

    if (!hasOSMData && !hasMapboxData) return null;

    return (
      <span style={{
        marginLeft: '6px',
        fontSize: '9px',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: '2px 4px',
        borderRadius: '3px',
        color: 'rgba(255,255,255,0.7)'
      }}>
        {hasOSMData && hasMapboxData ? 'OSM+MB' : hasOSMData ? 'OSM' : 'MB'}
      </span>
    );
  };

  // Options menu items
  const optionsMenuItems = [
    {
      label: pauseCountUpdates ? 'Resume Updates' : 'Pause Updates',
      onClick: togglePauseUpdates,
      icon: pauseCountUpdates ? '▶️' : '⏸️'
    },
    {
      label: isAllBuildingsHighlighted ? 'Hide All Highlights' : 'Highlight All POIs',
      onClick: isAllBuildingsHighlighted ? removeAllHighlights : highlightAllActivePOIs,
      icon: isAllBuildingsHighlighted ? '🔍' : '🔆'
    },
    {
      label: showMapInfo ? 'Hide Map Info' : 'Show Map Info',
      onClick: () => setShowMapInfo(!showMapInfo),
      icon: '🗺️'
    }
  ];

  // This function is used by the handleCategoryClick function
  // We're keeping it for future use
  /* const highlightCategoryPOIs = async (category, pois) => {
    if (!mapRef.current || !pois?.length) return;

    try {
      removeAllHighlights(mapRef.current);

      const batchSize = 5;
      for (let i = 0; i < pois.length; i += batchSize) {
        const batch = pois.slice(i, i + batchSize);
        await Promise.all(batch.map(async (poi, index) => {
          const id = `category-highlight-${category}-${i + index}`;
          const color = getColorForCategory(category);
          await highlightBuildingAtLocation(mapRef.current, poi.coordinates, id, color);
        }));
      }
    } catch (err) {
      error('Failed to highlight POIs', err);
    }
  }; */

  // This function is used by the POICategoryList component
  // We're keeping it for future use
  /* const handleCategoryClick = async (category) => {
    if (!mapRef.current) {
      return;
    }

    const pois = visiblePOIs[category] || [];
    await highlightCategoryPOIs(category, pois);
  }; */

  useEffect(() => {
    if (!mapRef.current) return;

    const handleMapMoveOrZoom = () => {
      updatePOIData();
    };

    try {
      mapRef.current.on('moveend', handleMapMoveOrZoom);
      mapRef.current.on('zoomend', handleMapMoveOrZoom);
    } catch (err) {
      error('Failed to set up map listeners', err);
    }

    return () => {
      try {
        if (mapRef.current) {
          mapRef.current.off('moveend', handleMapMoveOrZoom);
          mapRef.current.off('zoomend', handleMapMoveOrZoom);
          removeAllHighlights(mapRef.current);
        }
      } catch (err) {
        error('Failed to clean up map listeners', err);
      }
    };
  }, [mapRef, updatePOIData, removeAllHighlights]);

  return (
    <>
      <GlobalStyle />
      <POIContainer
        ref={containerRef}
        $isCollapsed={isCollapsed}
        className="poi-container"
        id="poi-data-container"
        style={{ transition: 'width 0.3s ease-in-out' }}
      >
        <POIHeader>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <POITitle
              onClick={toggleCollapse}
              style={{ cursor: 'pointer' }}
              id="poi-data-title"
            >
              POI Data
            </POITitle>
            <POICountBadge
              $isTotal
              style={{
                marginLeft: '12px',
                // Calculate width directly based on number of digits
                width: (() => {
                  const count = Object.values(poiCounts).reduce((a, b) => a + (b || 0), 0);
                  const numDigits = count.toString().length;
                  // Each digit gets ~10px + padding for total badge (slightly larger)
                  return `${Math.max(40, (numDigits * 10) + 20)}px`;
                })()
              }}
            >
              {Object.values(poiCounts).reduce((a, b) => a + (b || 0), 0)}
            </POICountBadge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <POIOptionsMenuButton
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              style={{ marginRight: '10px' }}
            >
              ⚙️
            </POIOptionsMenuButton>

            {showOptionsMenu && (
              <POIOptionsMenu>
                {optionsMenuItems.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      item.onClick();
                      setShowOptionsMenu(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderBottom: index < optionsMenuItems.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ marginRight: '8px' }}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </POIOptionsMenu>
            )}

            <CollapseButton
              onClick={toggleCollapse}
              style={{
                backgroundColor: isCollapsed ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)',
                padding: '8px',
                borderRadius: '4px'
              }}
              id="poi-data-collapse-button"
            >
              {isCollapsed ? '▶' : '◀'}
            </CollapseButton>
          </div>
        </POIHeader>

        <POICategories>
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>Loading POI data...</div>
          ) : (
            <>
              <POICategoryList
                sortedCategories={sortedCategories}
                positionChanges={positionChanges}
                expandedCategories={expandedCategories}
                highlightedCategories={highlightedCategories}
                poiCounts={poiCounts}
                pauseCountUpdates={pauseCountUpdates}
                visiblePOIs={visiblePOIs}
                showAllItems={showAllItems}
                getIconForCategory={getIconForCategory}
                getColorForCategory={getColorForCategory}
                renderDataSourceBadge={renderDataSourceBadge}
                toggleCategory={toggleCategory}
                toggleShowAllItems={toggleShowAllItems}
                handlePOIItemClick={handlePOIItemClick}
              />

              <MapInfoPanel
                map={map}
                isVisible={showMapInfo}
                onToggle={() => setShowMapInfo(!showMapInfo)}
              />
            </>
          )}
        </POICategories>

        <POIFooter>
          <div style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
            padding: '5px'
          }}>
            {pauseCountUpdates && 'Updates paused'}
          </div>
        </POIFooter>
      </POIContainer>
    </>
  );
});

export default POIDataBar;