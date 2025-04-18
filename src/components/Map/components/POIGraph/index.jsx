import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend as ChartLegend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Pie, Scatter, Line } from 'react-chartjs-2';
import { getColorForCategory, highlightBuildingAtLocation, removeAllHighlights } from '../POIDataBar/utils/poiDataManager';
import * as turf from '@turf/turf';
import { SAMPLE_POI_DATA } from '../POIDataBar/constants';
import { processVisiblePOIs } from './utils/poiDataProcessor';
import Legend from './Legend';
import TopList from './TopList';
import { mapEventBus } from '../../../../utils/eventBus';

// Custom animation plugin for smoother transitions
const transitionPlugin = {
  id: 'transitionPlugin',
  beforeUpdate: function(chart) {
    // Only apply to our POI Graph
    if (!chart.canvas || !chart.canvas.closest) return;

    // Get the current animation options
    const options = chart.options.animation || {};

    // Enhance the animation for faster transitions
    chart.options.animation = {
      ...options,
      tension: {
        duration: 600,  // Faster tension animation
        easing: 'easeOutQuad',
        from: 0,
        to: 0.3,  // Less tension for faster animation
        loop: false
      }
    };
  }
};

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  ChartLegend,
  Filler,  // Required for fill: true option
  transitionPlugin  // Register our custom plugin
);

// Styled components
const GraphContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 45%;
  background-color: rgba(22, 22, 22, 0.9);
  color: white;
  z-index: 10;
  display: flex;
  flex-direction: column;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transform: ${props => props.$isVisible ? 'translateY(0)' : 'translateY(100%)'};
  transition: transform 0.3s ease-in-out;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: ${props => props.$isVisible ? 'auto' : 'none'};
  opacity: ${props => props.$isVisible ? 1 : 0};
`;

const GraphHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const GraphTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
`;

const POICounter = styled.span`
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
  background-color: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
  margin-left: 10px;
  cursor: pointer;
  position: relative;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  opacity: 0.7;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  z-index: 20;

  &:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
  }

  &:active {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const GraphContent = styled.div`
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ChartContainer = styled.div.attrs({
  className: 'poi-graph-container'
})`
  flex: 1;
  position: relative;
  min-height: 0;
  width: 100%;
`;

const ControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const RefreshButton = styled.button`
  background: transparent;
  color: white;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const StatsContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;

  h4 {
    margin: 0 0 8px 0;
    opacity: 0.8;
    font-size: 14px;
    font-weight: 400;
  }

  p {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }

  small {
    display: block;
    margin-top: 4px;
    opacity: 0.6;
  }
`;

const ToggleButton = styled.button`
  position: absolute;
  bottom: 60px;  // About an inch from bottom
  right: 10px;   // Right side of screen
  background-color: rgba(22, 22, 22, 0.9);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 9;

  &:hover {
    background-color: rgba(42, 42, 42, 0.9);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

// Add a tab system for charts
const TabContainer = styled.div`
  display: flex;
  margin-bottom: 16px;
`;

const Tab = styled.button`
  padding: 8px 16px;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  border: none;
  border-bottom: 2px solid ${props => props.$active ? '#FF4500' : 'transparent'};
  color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

// Sample data for testing
const generateSampleData = () => {
  const categories = ['Restaurants', 'Cafes', 'Bars', 'Shops', 'Cultural', 'Parks'];
  const counts = [45, 32, 17, 53, 12, 8];
  const popularityScores = [8.2, 7.9, 9.1, 6.7, 8.5, 9.3];

  // Generate scatter plot data (rating vs reviews)
  const scatterData = [];
  const categoryColors = {
    'Restaurants': '#ff9900',
    'Cafes': '#cc6600',
    'Bars': '#990099',
    'Shops': '#0066ff',
    'Cultural': '#cc3300',
    'Parks': '#33cc33'
  };

  // Generate 50 sample POIs with random ratings and review counts
  for (let i = 0; i < 50; i++) {
    const categoryIndex = Math.floor(Math.random() * categories.length);
    const category = categories[categoryIndex];

    scatterData.push({
      x: 1 + Math.random() * 4, // Rating from 1-5
      y: Math.floor(Math.random() * 100), // Number of reviews
      category: category,
      color: categoryColors[category]
    });
  }

  return {
    categories,
    counts,
    popularityScores,
    scatterData
  };
};

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const LiveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
  </svg>
);

// Set debug logging flag
const DEBUG_LOGGING = false;

// Helper function for logging that checks DEBUG_LOGGING flag
const log = (...args) => {
  if (DEBUG_LOGGING) {
    console.log(...args);
  }
};

const POIGraph = ({ map, showPOIMarkers, setShowPOIMarkers, showOSMPOIs, setShowOSMPOIs, graphOnlyMode, setGraphOnlyMode, onCategoryVisibilityChange, poiDataBarRef }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [data, setData] = useState(generateSampleData());
  const [isLive, setIsLive] = useState(true);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  // Track which categories are visible
  const [visibleCategories, setVisibleCategories] = useState({});
  const [showOSM, setShowOSM] = useState(false);
  // New state for curve mode
  const [showCurve, setShowCurve] = useState(false);
  // New state for radius toggle
  const [showRadius, setShowRadius] = useState(false);
  // New state for TopList filters
  const [filters, setFilters] = useState({ minRating: 0, minReviews: 0 });
  // Track max values for sliders
  const [maxValues, setMaxValues] = useState({ maxRating: 5, maxReviews: 100 });
  const mapRef = useRef(map);
  const chartRef = useRef(null);
  const categoryMenuRef = useRef(null);

  // Initialize visible categories when data changes
  useEffect(() => {
    if (data && data.categories) {
      const initialVisibleCategories = {};
      data.categories.forEach(category => {
        const normalizedCategory = category.toLowerCase();
        initialVisibleCategories[normalizedCategory] = true;
      });
      setVisibleCategories(initialVisibleCategories);
      log('POI Graph: Initialized visible categories:', initialVisibleCategories);

      mapEventBus.emit('poigraph:categoryVisibility', {
        categories: initialVisibleCategories
      });
    }
  }, [data]);

  // Clean up logs and add OSM toggle handler
  useEffect(() => {
    if (visibleCategories && Object.keys(visibleCategories).length > 0) {
      log('POI Graph: Category visibility changed:', visibleCategories);

      mapEventBus.emit('poigraph:categoryVisibility', {
        categories: visibleCategories
      });
    }
  }, [visibleCategories]);

  // Update map reference when it changes
  useEffect(() => {
    log('POI Graph: Map reference updated');
    mapRef.current = map;

    // If OSM Data mode is already active, ensure map labels are hidden
    if (showOSM && mapRef.current?.current) {
      console.log('%c[OSM DATA] Hiding map labels on map reference update', 'background: #4caf50; color: white;');
      toggleMapLabels(false);
    }
  }, [map, showOSM]);

  // Register POI Graph states with layerStateManager
  useEffect(() => {
    if (window.layerStateManager) {
      // Register visibility state
      window.layerStateManager.registerLayer('poiGraphOpen', setIsVisible, isVisible);

      // Register OSM data mode state
      window.layerStateManager.registerLayer('poiGraphShowOSM', setShowOSM, showOSM);

      // Register curve mode state
      window.layerStateManager.registerLayer('poiGraphShowCurve', setShowCurve, showCurve);

      // Register radius mode state
      window.layerStateManager.registerLayer('poiGraphShowRadius', setShowRadius, showRadius);

      // Register visible categories
      window.layerStateManager.updateLayerState('poiVisibleCategories', visibleCategories);

      console.log('%c[POI Graph] Registered states with layerStateManager', 'background: #4caf50; color: white;');
    }
  }, [isVisible, showOSM, showCurve, showRadius, visibleCategories]);

  // Listen for OSM layer visibility changes from LayerToggle
  useEffect(() => {
    const unsubscribeOsmLayer = mapEventBus.on('osmLayer:visibility', (event) => {
      // If LayerToggle turned off OSM POIs, also turn off OSM data in the graph
      if (!event.visible && showOSM) {
        setShowOSM(false);
      }
    });

    // Listen for scene loading events
    const unsubscribeSceneLoading = mapEventBus.on('scene:loading', (event) => {
      console.log('%c[POI Graph] Scene loading event received', 'background: #4caf50; color: white;', event);
    });

    // Listen for scene applied events
    const unsubscribeSceneApplied = mapEventBus.on('scene:applied', (event) => {
      console.log('%c[POI Graph] Scene applied event received', 'background: #4caf50; color: white;', event);

      // Check if the scene has POI Graph state information
      if (event.scene && event.scene.toggleStates) {
        const { toggleStates } = event.scene;

        // Update POI Graph visibility if specified in the scene
        if (toggleStates.poiGraphOpen !== undefined) {
          console.log('%c[POI Graph] Setting visibility from scene:', 'background: #4caf50; color: white;', toggleStates.poiGraphOpen);
          setIsVisible(toggleStates.poiGraphOpen);
        }

        // Update OSM data mode if specified in the scene
        if (toggleStates.poiGraphShowOSM !== undefined) {
          console.log('%c[POI Graph] Setting OSM data mode from scene:', 'background: #4caf50; color: white;', toggleStates.poiGraphShowOSM);
          setShowOSM(toggleStates.poiGraphShowOSM);
        }

        // Update curve mode if specified in the scene
        if (toggleStates.poiGraphShowCurve !== undefined) {
          console.log('%c[POI Graph] Setting curve mode from scene:', 'background: #4caf50; color: white;', toggleStates.poiGraphShowCurve);
          setShowCurve(toggleStates.poiGraphShowCurve);
        }

        // Update radius mode if specified in the scene
        if (toggleStates.poiGraphShowRadius !== undefined) {
          console.log('%c[POI Graph] Setting radius mode from scene:', 'background: #4caf50; color: white;', toggleStates.poiGraphShowRadius);
          setShowRadius(toggleStates.poiGraphShowRadius);
        }

        // Update visible categories if specified in the scene
        if (toggleStates.poiVisibleCategories) {
          console.log('%c[POI Graph] Setting visible categories from scene:', 'background: #4caf50; color: white;', toggleStates.poiVisibleCategories);
          setVisibleCategories(toggleStates.poiVisibleCategories);
        }
      }
    });

    return () => {
      unsubscribeOsmLayer();
      unsubscribeSceneLoading();
      unsubscribeSceneApplied();
    };
  }, [showOSM]);

  // Function to toggle category visibility
  // When a category is clicked, it becomes the only visible one (hiding all others)
  // If the category is already the only visible one, show all categories again
  const toggleCategory = (category) => {
    setVisibleCategories(prev => {
      // Check if this category is already the only visible one
      const isOnlyVisibleCategory = Object.entries(prev).every(([cat, isVisible]) =>
        cat === category ? isVisible : !isVisible
      );

      // If it's already the only visible category, show all categories
      if (isOnlyVisibleCategory) {
        const allVisible = {};
        Object.keys(prev).forEach(cat => {
          allVisible[cat] = true;
        });
        log('POI Graph: Showing all categories');
        return allVisible;
      }
      // Otherwise, make this the only visible category
      else {
        const onlyThisVisible = {};
        Object.keys(prev).forEach(cat => {
          onlyThisVisible[cat] = (cat === category);
        });
        log('POI Graph: Making category the only visible one:', { category });
        return onlyThisVisible;
      }
    });
  };

  // Function to update Boston Buildings layer filtering
  const updateBostonBuildingsFiltering = (categories) => {
    // Access the map instance correctly - map is passed as a prop and is a ref to the Mapbox instance
    if (!map || !map.current) {
      log('POI Graph: Map instance not found');
      return;
    }

    const mapInstance = map.current;

    // Check if the layer exists
    try {
      if (!mapInstance.getStyle().layers.some(layer => layer.id === 'boston-buildings-fill')) {
        log('POI Graph: Boston Buildings layer not found in map style');
        return;
      }
    } catch (error) {
      log('POI Graph: Error checking for Boston Buildings layer:', error);
      return;
    }

    log('POI Graph: Updating Boston Buildings filtering', categories);

    // Create a filter expression for the buildings layer
    // Start with the default case (show buildings with no specific category)
    const filterExpression = ['any'];

    // Map of building types to POI categories
    const buildingToPOICategory = {
      'commercial': 'shops',
      'office': 'shops',
      'retail': 'restaurants',
      'restaurant': 'restaurants',
      'cafe': 'cafes',
      'coffee_shop': 'cafes',
      'food_court': 'restaurants',
      'fast_food': 'restaurants',
      'supermarket': 'restaurants',
      'deli': 'restaurants',
      'bakery': 'cafes',
      'bar': 'bars',
      'pub': 'bars',
      'nightclub': 'bars',
      'hotel': 'bars',
      'residential': 'cultural',
      'apartments': 'cultural',
      'industrial': 'transportation',
      'warehouse': 'transportation',
      'school': 'education',
      'university': 'education',
      'hospital': 'healthcare',
      'park': 'parks'
    };

    // Create a reverse mapping from POI categories to building types
    const categoryToBuildingTypes = {};
    Object.entries(buildingToPOICategory).forEach(([buildingType, category]) => {
      const normalizedCategory = category.toLowerCase();
      if (!categoryToBuildingTypes[normalizedCategory]) {
        categoryToBuildingTypes[normalizedCategory] = [];
      }
      categoryToBuildingTypes[normalizedCategory].push(buildingType.toLowerCase());
    });

    log('POI Graph: Category to building types mapping:', categoryToBuildingTypes);

    // Add filter conditions for visible categories
    Object.entries(categories).forEach(([category, isVisible]) => {
      const normalizedCategory = category.toLowerCase();
      // Skip categories that are not visible
      if (!isVisible) {
        log(`POI Graph: Category ${category} is not visible, skipping its building types`);
        return;
      }

      // Get all building types for this category
      const buildingTypes = categoryToBuildingTypes[normalizedCategory];
      if (!buildingTypes || buildingTypes.length === 0) {
        log(`POI Graph: No building types found for category ${category}`);
        return;
      }

      log(`POI Graph: Adding filter conditions for category ${category}:`, buildingTypes);

      // Add each building type to the filter expression
      buildingTypes.forEach(buildingType => {
        filterExpression.push(['==', ['downcase', ['get', 'building']], buildingType]);
      });
    });

    // Always include buildings with no specific category (using the default color)
    // Only if we want to show buildings without categories
    const showDefaultBuildings = true; // You can make this a state variable if needed
    if (showDefaultBuildings) {
      filterExpression.push(['!', ['has', 'building']]);
    }

    // Apply the filter to the buildings layer
    try {
      // Check if the filter expression has any conditions
      if (filterExpression.length <= 1) {
        log('POI Graph: No filter conditions, showing all buildings');
        // If no categories are visible, show only buildings with no specific category
        mapInstance.setFilter('boston-buildings-fill', ['!', ['has', 'building']]);
      } else {
        log('POI Graph: Applying filter to Boston Buildings layer:', filterExpression);
        mapInstance.setFilter('boston-buildings-fill', filterExpression);
      }
    } catch (error) {
      log('POI Graph: Error applying filter to Boston Buildings layer:', error);
    }
  };

  // Handle visibility changes and emit events for map resizing
  useEffect(() => {
    log('POI Graph: Visibility changed to:', isVisible);

    // Emit event for map container to adjust its size
    mapEventBus.emit('poigraph:visibility', {
      isVisible,
      height: '40%'
    });

    // If the graph is now visible, trigger a map resize after animation
    if (isVisible && mapRef.current?.current) {
      setTimeout(() => {
        mapRef.current.current.resize();
        log('POI Graph: Triggered map resize');
      }, 300);
    }
  }, [isVisible]);

  // Handle marker selection from map
  useEffect(() => {
    log('POI Graph: Setting up marker selection handler');

    const unsubscribe = mapEventBus.on('marker:selected', (event) => {
      log('POI Graph: Received marker selection event:', event);
      const { coordinates, properties } = event;

      // Find matching point in scatter data
      const datasets = prepareScatterDatasets(data.scatterData || []);
      log('POI Graph: Current datasets:', {
        count: datasets.length,
        points: datasets.map(d => d.data.length),
        categories: datasets.map(d => d.label)
      });

      let matchingPoint = null;
      let matchingDatasetIndex = -1;
      let matchingPointIndex = -1;

      for (let i = 0; i < datasets.length; i++) {
        const dataset = datasets[i];
        log(`POI Graph: Searching dataset ${i} (${dataset.label}) for matching point`);

        const point = dataset.data.find((p, index) => {
          const matches = p.lngLat &&
            Math.abs(p.lngLat[0] - coordinates[0]) < 0.0001 &&
            Math.abs(p.lngLat[1] - coordinates[1]) < 0.0001;

          if (matches) {
            matchingDatasetIndex = i;
            matchingPointIndex = index;
            log(`POI Graph: Found matching point in dataset ${i} at index ${index}:`, p);
          }

          return matches;
        });

        if (point) {
          matchingPoint = point;
          break;
        }
      }

      if (matchingPoint) {
        log('POI Graph: Found matching point:', {
          point: matchingPoint,
          datasetIndex: matchingDatasetIndex,
          pointIndex: matchingPointIndex
        });

        setSelectedPOI(matchingPoint);

        // Update the chart to highlight the selected point and dim others
        if (chartRef.current) {
          const chart = chartRef.current;
          const meta = chart.getDatasetMeta(0);

          log('POI Graph: Updating chart highlighting:', {
            totalPoints: meta.data.length,
            selectedIndex: matchingPointIndex
          });

          // Dim all points first
          meta.data.forEach((point, index) => {
            const pointData = chart.data.datasets[0].data[index];
            point.options.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            point.options.borderColor = 'rgba(255, 255, 255, 0.2)';
            point.options.radius = 5;
          });

          // Highlight the selected point
          const selectedPoint = meta.data[matchingPointIndex];
          if (selectedPoint) {
            log('POI Graph: Highlighting selected point:', {
              index: matchingPointIndex,
              options: selectedPoint.options
            });

            selectedPoint.options.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            selectedPoint.options.borderColor = '#ffffff';
            selectedPoint.options.borderWidth = 3;
            selectedPoint.options.radius = 7;
          }

          chart.update();

          // Reset after animation
          setTimeout(() => {
            log('POI Graph: Resetting chart highlighting');
            meta.data.forEach(point => {
              point.options.backgroundColor = 'rgba(255, 255, 255, 0.5)';
              point.options.borderColor = 'rgba(255, 255, 255, 0.5)';
              point.options.borderWidth = 1;
              point.options.radius = 5;
            });
            chart.update();
          }, 4000);
        } else {
          log('POI Graph: Chart reference not available');
        }
      } else {
        log('POI Graph: No matching point found for coordinates:', coordinates);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [data.scatterData]);

  // Function to directly manipulate the POI Data Bar
  const forceOpenPOIDataBar = () => {
    console.log('%c[POI_GRAPH_DEBUG] Attempting to force open POI Data Bar', 'background: #ff9800; color: white; font-size: 16px; padding: 5px;');

    try {
      // Try to find the POI container by ID first (most reliable)
      const poiContainer = document.getElementById('poi-data-container');
      if (poiContainer) {
        console.log('%c[POI_GRAPH_DEBUG] Found POI container by ID, expanding it', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;');
        poiContainer.style.width = '300px';

        // Force a reflow to ensure the style is applied immediately
        void poiContainer.offsetWidth;

        // Try to find the collapse button by ID
        const collapseButton = document.getElementById('poi-data-collapse-button');
        if (collapseButton && collapseButton.textContent.includes('▶')) {
          console.log('%c[POI_GRAPH_DEBUG] Found collapse button by ID, clicking it', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;');
          collapseButton.click();
          return true;
        }
      } else {
        // Fall back to class name
        const poiContainerByClass = document.querySelector('.poi-container');
        if (poiContainerByClass) {
          console.log('%c[POI_GRAPH_DEBUG] Found POI container by class, expanding it', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;');
          poiContainerByClass.style.width = '300px';

          // Try to find the collapse button within the container
          const collapseButton = poiContainerByClass.querySelector('button');
          if (collapseButton && collapseButton.textContent.includes('▶')) {
            console.log('%c[POI_GRAPH_DEBUG] Found collapse button by class, clicking it', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;');
            collapseButton.click();
            return true;
          }

          // Try to find the title as a last resort
          const poiTitle = document.getElementById('poi-data-title');
          if (poiTitle) {
            console.log('%c[POI_GRAPH_DEBUG] Found POI title, clicking it', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;');
            poiTitle.click();
            return true;
          }

          return true; // At least we expanded the container
        } else {
          console.warn('%c[POI_GRAPH_DEBUG] Could not find POI container by any means', 'background: red; color: white; font-size: 16px; padding: 5px;');
        }
      }
    } catch (err) {
      console.error('%c[POI_GRAPH_DEBUG] Error directly manipulating POI Data Bar:', 'background: red; color: white; font-size: 16px; padding: 5px;', err);
    }

    return false;
  };

  // Handle POI selection
  const handlePOISelect = (poi) => {
    if (!poi) {
      log('POI Graph: No POI selected');
      return;
    }

    log('POI Graph: POI selected:', {
      name: poi.name,
      category: poi.category,
      coordinates: poi.lngLat,
      fullPOI: poi
    });

    setSelectedPOI(poi);

    // Force chart to update to show the selected point with a white border
    if (chartRef.current) {
      log('POI Graph: Updating chart to highlight selected POI');

      // First update to apply the selection
      chartRef.current.update();

      // Then force a second update after a short delay to ensure the highlighting is applied
      setTimeout(() => {
        if (chartRef.current) {
          // Ensure the selected point is marked in the current datasets
          const datasets = chartRef.current.data.datasets;
          let foundPoint = false;

          datasets.forEach(dataset => {
            if (dataset.data) {
              dataset.data.forEach(point => {
                if (point && point.name === poi.name && point.category === poi.category) {
                  // Ensure isSelected is true
                  point.isSelected = true;
                  foundPoint = true;
                  log('POI Graph: Found and marked selected point in dataset');
                }
              });
            }
          });

          if (foundPoint) {
            chartRef.current.update();
          } else {
            log('POI Graph: Selected point not found in current datasets');
          }
        }
      }, 50);
    }

    // If we have a map instance and POI coordinates, pan to the selected POI
    if (mapRef.current?.current && poi.lngLat) {
      log('POI Graph: Emitting poi:selected event with data:', {
        coordinates: poi.lngLat,
        properties: {
          name: poi.name,
          type: poi.category,
          lngLat: poi.lngLat
        }
      });

      // First, try to directly open the POI Data Bar before emitting any events
      // This ensures the POI Data Bar is expanded before we try to highlight the POI
      console.log('%c[POI_GRAPH_DEBUG] Attempting to force open POI Data Bar before emitting events', 'background: #ff9800; color: white; font-size: 16px; padding: 5px;');
      const dataBarOpened = forceOpenPOIDataBar();
      console.log('%c[POI_GRAPH_DEBUG] Force open result:', 'background: #ff9800; color: white; font-size: 16px; padding: 5px;', dataBarOpened ? 'Success' : 'Failed');

      // Emit event for map to handle POI selection
      mapEventBus.emit('poi:selected', {
        coordinates: poi.lngLat,
        properties: {
          name: poi.name,
          type: poi.category,
          lngLat: poi.lngLat
        }
      });

      // Emit a new event for POI Data Bar to handle POI selection
      console.log('%c[POI_GRAPH_DEBUG] Emitting poigraph:poi_selected event to open Data Bar', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;', {
        poi: {
          id: `graph-poi-${poi.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
          name: poi.name,
          type: poi.category,
          category: poi.category,
          coordinates: poi.lngLat,
          rating: poi.x, // In scatter data, x is rating
          reviews: poi.y, // In scatter data, y is reviews
          popularity: (poi.x * poi.y) / 25, // Calculate a popularity score for the bar
          properties: {
            name: poi.name,
            type: poi.category
          }
        }
      });

      // Also try to directly manipulate the POI Data Bar as a fallback
      try {
        console.log('%c[POI_GRAPH_DEBUG] DOM structure before searching for POI container:', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;');

        // Log all elements with class names containing 'poi' for debugging
        const allPOIElements = document.querySelectorAll('[class*="poi"], [class*="POI"]');
        console.log('%c[POI_GRAPH_DEBUG] Found ' + allPOIElements.length + ' elements with "poi" in class name:', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;');
        allPOIElements.forEach((el, index) => {
          console.log(`%c[POI_GRAPH_DEBUG] POI Element ${index}:`, 'background: #4caf50; color: white; font-size: 16px; padding: 5px;', {
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            width: el.style.width,
            display: el.style.display,
            visibility: el.style.visibility,
            computedStyle: window.getComputedStyle(el).display
          });
        });

        // Try to find the POI container using the class name
        const poiContainer = document.querySelector('.poi-container');
        console.log('%c[POI_GRAPH_DEBUG] POI container search result:', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;',
          poiContainer ? 'Found' : 'Not found');

        if (poiContainer) {
          console.log('%c[POI_GRAPH_DEBUG] POI container details:', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;', {
            tagName: poiContainer.tagName,
            className: poiContainer.className,
            id: poiContainer.id,
            width: poiContainer.style.width,
            display: poiContainer.style.display,
            visibility: poiContainer.style.visibility,
            computedStyle: window.getComputedStyle(poiContainer).display,
            children: poiContainer.children.length
          });

          console.log('%c[POI_GRAPH_DEBUG] Directly expanding POI Data Bar via DOM', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;');
          poiContainer.style.width = '300px';

          // Force a reflow to ensure the style is applied immediately
          void poiContainer.offsetWidth;

          // Verify the width was set correctly
          console.log('%c[POI_GRAPH_DEBUG] Container width after setting:', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;', {
            styleWidth: poiContainer.style.width,
            computedWidth: window.getComputedStyle(poiContainer).width
          });

          // Try multiple approaches to find and click the collapse button
          // 1. Try by ID first (most reliable)
          const collapseButtonById = document.getElementById('poi-data-collapse-button');
          console.log('%c[POI_GRAPH_DEBUG] Collapse button by ID search result:', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;',
            collapseButtonById ? 'Found' : 'Not found');

          if (collapseButtonById) {
            console.log('%c[POI_GRAPH_DEBUG] Collapse button details:', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;', {
              textContent: collapseButtonById.textContent,
              innerHTML: collapseButtonById.innerHTML,
              isCollapsed: collapseButtonById.textContent.includes('▶')
            });
          }

          if (collapseButtonById && collapseButtonById.textContent.includes('▶')) {
            console.log('%c[POI_GRAPH_DEBUG] Clicking collapse button (by ID) to expand', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;');
            collapseButtonById.click();
          } else {
            // 2. Try by selector within the container
            const allButtons = poiContainer.querySelectorAll('button');
            console.log('%c[POI_GRAPH_DEBUG] Found ' + allButtons.length + ' buttons in container', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;');

            allButtons.forEach((btn, index) => {
              console.log(`%c[POI_GRAPH_DEBUG] Button ${index}:`, 'background: #4caf50; color: white; font-size: 16px; padding: 5px;', {
                textContent: btn.textContent,
                innerHTML: btn.innerHTML,
                className: btn.className
              });
            });

            const collapseButton = poiContainer.querySelector('button');
            if (collapseButton && collapseButton.textContent.includes('▶')) {
              console.log('%c[POI_GRAPH_DEBUG] Clicking collapse button (by selector) to expand', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;');
              collapseButton.click();
            } else {
              // 3. Try clicking the title as a last resort
              const poiTitle = document.getElementById('poi-data-title');
              console.log('%c[POI_GRAPH_DEBUG] POI title search result:', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;',
                poiTitle ? 'Found' : 'Not found');

              if (poiTitle) {
                console.log('%c[POI_GRAPH_DEBUG] Clicking POI title as fallback', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;');
                poiTitle.click();
              } else {
                // 4. Last resort: try to find any element with 'poi' in the class name and click it
                if (allPOIElements.length > 0) {
                  console.log('%c[POI_GRAPH_DEBUG] Trying to click first POI element as last resort', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;');
                  try {
                    allPOIElements[0].click();
                  } catch (clickErr) {
                    console.error('%c[POI_GRAPH_DEBUG] Error clicking first POI element:', 'background: red; color: white; font-size: 16px; padding: 5px;', clickErr);
                  }
                } else {
                  console.warn('%c[POI_GRAPH_DEBUG] Could not find any clickable elements in POI Data Bar', 'background: red; color: white; font-size: 16px; padding: 5px;');
                }
              }
            }
          }
        } else {
          // If we can't find the container by class name, try to find it by other means
          console.warn('%c[POI_GRAPH_DEBUG] Could not find POI container element by class name, trying alternatives', 'background: orange; color: white; font-size: 16px; padding: 5px;');

          // Try to find by ID
          const containerById = document.getElementById('poi-data-container');
          if (containerById) {
            console.log('%c[POI_GRAPH_DEBUG] Found POI container by ID', 'background: #4caf50; color: white; font-size: 16px; padding: 5px;');
            containerById.style.width = '300px';
          } else {
            console.warn('%c[POI_GRAPH_DEBUG] Could not find POI container by any means', 'background: red; color: white; font-size: 16px; padding: 5px;');
          }
        }
      } catch (err) {
        console.error('%c[POI_GRAPH_DEBUG] Error directly manipulating POI Data Bar:', 'background: red; color: white; font-size: 16px; padding: 5px;', err);
      }

      // First try to use the POI Data Bar ref if available
      console.log('%c[POI Graph] Checking POI Data Bar ref:', 'background: #ff9800; color: white;', {
        refExists: !!poiDataBarRef,
        currentExists: !!(poiDataBarRef && poiDataBarRef.current),
        refType: poiDataBarRef ? typeof poiDataBarRef : 'undefined',
        currentType: poiDataBarRef && poiDataBarRef.current ? typeof poiDataBarRef.current : 'undefined',
        methods: poiDataBarRef && poiDataBarRef.current ? Object.keys(poiDataBarRef.current) : []
      });

      if (poiDataBarRef && poiDataBarRef.current) {
        console.log('%c[POI Graph] Using POI Data Bar ref to expand', 'background: #4caf50; color: white;');

        // Call the expand method on the POI Data Bar component
        try {
          console.log('%c[POI Graph] Calling expand() method', 'background: #4caf50; color: white;');
          poiDataBarRef.current.expand();
        } catch (err) {
          console.error('[POI Graph] Error calling expand() method:', err);
        }

        // Find the category for this POI and open it
        const category = poi.category.toLowerCase();
        try {
          console.log(`%c[POI Graph] Opening category ${category} via ref`, 'background: #4caf50; color: white;');
          poiDataBarRef.current.openCategory(category);
        } catch (err) {
          console.error(`[POI Graph] Error calling openCategory(${category}) method:`, err);
        }

        // Highlight the POI in the Data Bar
        try {
          console.log(`%c[POI Graph] Highlighting POI ${poi.name} via ref`, 'background: #4caf50; color: white;');
          poiDataBarRef.current.highlightPOI(poi);
        } catch (err) {
          console.error(`[POI Graph] Error calling highlightPOI() method:`, err);
        }
      } else {
        // Fallback to direct DOM manipulation if ref is not available
        console.log('%c[POI Graph] POI Data Bar ref not available, falling back to DOM manipulation', 'background: #4caf50; color: white;');

        try {
          const poiContainer = document.querySelector('.poi-container');
          if (poiContainer) {
            console.log('%c[POI Graph] Directly expanding POI Data Bar via DOM', 'background: #4caf50; color: white;');
            poiContainer.style.width = '300px';

            // Also try to click the collapse button if it's collapsed
            const collapseButton = poiContainer.querySelector('button');
            if (collapseButton && collapseButton.textContent.includes('▶')) {
              console.log('%c[POI Graph] Clicking collapse button to expand', 'background: #4caf50; color: white;');
              collapseButton.click();
            }
          }
        } catch (err) {
          console.error('[POI Graph] Error directly manipulating POI Data Bar:', err);
        }
      }

      // Then emit the event for the React component to handle
      mapEventBus.emit('poigraph:poi_selected', {
        poi: {
          id: `graph-poi-${poi.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
          name: poi.name,
          type: poi.category,
          category: poi.category,
          coordinates: poi.lngLat,
          rating: poi.x, // In scatter data, x is rating
          reviews: poi.y, // In scatter data, y is reviews
          popularity: (poi.x * poi.y) / 25, // Calculate a popularity score for the bar
          properties: {
            name: poi.name,
            type: poi.category
          }
        }
      });

      // Pan to the POI location
      log('POI Graph: Panning map to POI location:', poi.lngLat);
      mapRef.current.current.flyTo({
        center: poi.lngLat,
        zoom: Math.max(mapRef.current.current.getZoom(), 15),
        duration: 1000
      });

      // Clear any existing highlights
      removeAllHighlights(mapRef.current.current);

      // Wait for the map to finish moving before attempting to highlight the building
      mapRef.current.current.once('moveend', () => {
        log('POI Graph: Map movement completed, highlighting building');

        // Get the color for this POI's category
        const categoryColor = getColorForCategory(poi.category || 'default');

        // Create a unique ID for this highlight
        const highlightId = `poi-graph-highlight-${Date.now()}`;

        // Attempt to highlight the building after a short delay to ensure the map has settled
        setTimeout(async () => {
          try {
            // Log the map and coordinates for debugging
            log('POI Graph: Attempting to highlight building at:', poi.lngLat, 'with color:', categoryColor);

            // Use the highlightBuildingAtLocation function to highlight the building
            const success = await highlightBuildingAtLocation(
              mapRef.current.current,  // Pass the actual map instance, not the ref
              poi.lngLat,
              highlightId,
              categoryColor
            );

            if (success) {
              log('POI Graph: Building highlighted successfully');
            } else {
              log('POI Graph: No building found at location');

              // Try to add a fallback highlight if no building is found
              try {
                // Create a simple circle highlight at the POI location
                const circleId = `poi-graph-circle-${Date.now()}`;
                if (!mapRef.current.current.getSource(circleId)) {
                  mapRef.current.current.addSource(circleId, {
                    type: 'geojson',
                    data: {
                      type: 'Feature',
                      geometry: {
                        type: 'Point',
                        coordinates: poi.lngLat
                      },
                      properties: {}
                    }
                  });

                  mapRef.current.current.addLayer({
                    id: circleId,
                    type: 'circle',
                    source: circleId,
                    paint: {
                      'circle-radius': 10,
                      'circle-color': categoryColor,
                      'circle-opacity': 0.6,
                      'circle-stroke-width': 2,
                      'circle-stroke-color': '#ffffff'
                    }
                  });

                  log('POI Graph: Added fallback circle highlight');
                }
              } catch (circleErr) {
                console.error('Error adding fallback circle highlight:', circleErr);
              }
            }
          } catch (err) {
            console.error('Error highlighting building:', err);
          }
        }, 300);
      });
    } else {
      log('POI Graph: Cannot emit event - missing map or coordinates:', {
        hasMap: !!mapRef.current,
        hasMapCurrent: !!(mapRef.current && mapRef.current.current),
        hasCoordinates: !!poi.lngLat
      });
    }
  };

  // Update graph data from map when available
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.current) {
      return;
    }

    const mapInstance = mapRef.current.current;

    const updateDataFromMap = () => {
      log('POIGraph: Live update triggered', {
        isLive,
        graphOnlyMode,
        showOSM
      });

      // If in graph-only mode, we still want to update the graph even if markers are hidden

      const result = processVisiblePOIs(mapInstance, graphOnlyMode, showOSM);
      if (result) {
        log('POIGraph: New data processed:', {
          categories: result.categories.length,
          dataPoints: result.scatterData ? result.scatterData.length : 0,
          source: showOSM ? 'OSM' : 'Miami'
        });
        setData(result);
      }
    };

    // Define map change handlers
    const handleMapMove = () => {
      if (!isLive) return;
      log('POI Graph: Map move detected');
      updateDataFromMap();
    };

    const handleMapZoom = () => {
      if (!isLive) return;
      log('POI Graph: Map zoom detected');
      updateDataFromMap();
    };

    const handleMapIdle = () => {
      if (!isLive) return;
      log('POI Graph: Map idle detected');
        updateDataFromMap();
    };

    // Add event listeners for map changes
    log('POI Graph: Setting up map event listeners');
    mapInstance.on('moveend', handleMapMove);
    mapInstance.on('zoomend', handleMapZoom);
    mapInstance.on('idle', handleMapIdle);

    // Initial update if visible and live
    if (isVisible && isLive) {
      log('POI Graph: Performing initial update');
      updateDataFromMap();
    }

    // Update when graph-only mode changes
    if (graphOnlyMode) {
      log('POI Graph: Graph-only mode is active, updating data');
      // Make sure POI markers are hidden in graph-only mode
      if (mapInstance.getLayer('miami-pois')) {
        mapInstance.setLayoutProperty('miami-pois', 'visibility', 'none');
      }
      // Hide all Mapbox POI layers
      ['poi-label', 'natural-point-label', 'water-point-label'].forEach(layerId => {
        if (mapInstance.getLayer(layerId)) {
          log(`POI Graph: Hiding ${layerId} layer in useEffect`);
          mapInstance.setLayoutProperty(layerId, 'visibility', 'none');
        }
      });
      // Then update the data
      updateDataFromMap();
    }

    // Cleanup
    return () => {
      log('POI Graph: Removing map event listeners');
      mapInstance.off('moveend', handleMapMove);
      mapInstance.off('zoomend', handleMapZoom);
      mapInstance.off('idle', handleMapIdle);
    };
  }, [isVisible, isLive, graphOnlyMode, showPOIMarkers, showOSM]);

  // Handle refresh button click
  const handleRefresh = () => {
    if (!mapRef.current || !mapRef.current.current) {
      return;
    }

    log('POIGraph: Manual refresh requested');
    const result = processVisiblePOIs(mapRef.current.current, graphOnlyMode, showOSM);
    if (result) {
      log('POIGraph: New data from manual refresh:', {
        categories: result.categories.length,
        dataPoints: result.scatterData ? result.scatterData.length : 0,
        source: showOSM ? 'OSM' : 'Miami'
      });
      setData(result);
    }
  };

  // Toggle live updates
  const toggleLive = () => {
    log('POI Graph: Toggling live mode from', isLive, 'to', !isLive);
    setIsLive(!isLive);
  };

  // Toggle graph-only mode (keep graph updating but hide markers)
  const toggleGraphOnly = () => {
    const newGraphOnlyMode = !graphOnlyMode;
    log('POI Graph: Toggling graph-only mode from', graphOnlyMode, 'to', newGraphOnlyMode);

    // Update state
    setGraphOnlyMode(newGraphOnlyMode);

    // If enabling graph-only mode, hide markers but keep graph updating
    if (newGraphOnlyMode) {
      // Save current marker visibility state before hiding
      log('POI Graph: Hiding POI markers for graph-only mode');

      // This will trigger the OSMPOILayer to remove its markers
      setShowPOIMarkers(false);

      // Force a refresh of the graph data with the new mode
      setTimeout(() => {
        if (mapRef.current?.current) {
          log('POI Graph: Refreshing data in graph-only mode');

          // Make sure all POI layers are hidden
          const mapInstance = mapRef.current.current;

          // Hide the miami-pois layer
          if (mapInstance.getLayer('miami-pois')) {
            mapInstance.setLayoutProperty('miami-pois', 'visibility', 'none');
          }

          // Hide all Mapbox POI layers
          ['poi-label', 'natural-point-label', 'water-point-label'].forEach(layerId => {
            if (mapInstance.getLayer(layerId)) {
              log(`POI Graph: Hiding ${layerId} layer`);
              mapInstance.setLayoutProperty(layerId, 'visibility', 'none');
            }
          });

          // Then get the data for the graph
          const result = processVisiblePOIs(mapInstance, true, showOSM);
          if (result) {
            log('POI Graph: Updated data with', result.scatterData?.length || 0, 'points in graph-only mode');
            setData(result);
          }
        }
      }, 100); // Small delay to ensure state updates have been applied
    } else {
      // If disabling graph-only mode, show markers again
      log('POI Graph: Showing POI markers again');
      setShowPOIMarkers(true);

      // Force a refresh of the graph data with normal mode
      setTimeout(() => {
        if (mapRef.current?.current) {
          log('POI Graph: Refreshing data in normal mode');

          // Restore visibility of all POI layers
          const mapInstance = mapRef.current.current;

          // Show the miami-pois layer
          if (mapInstance.getLayer('miami-pois')) {
            mapInstance.setLayoutProperty('miami-pois', 'visibility', 'visible');
          }

          // Show all Mapbox POI layers
          ['poi-label', 'natural-point-label', 'water-point-label'].forEach(layerId => {
            if (mapInstance.getLayer(layerId)) {
              log(`POI Graph: Showing ${layerId} layer`);
              mapInstance.setLayoutProperty(layerId, 'visibility', 'visible');
            }
          });

          const result = processVisiblePOIs(mapInstance, false, showOSM);
          if (result) {
            log('POI Graph: Updated data with', result.scatterData?.length || 0, 'points in normal mode');
            setData(result);
          }
        }
      }, 100); // Small delay to ensure state updates have been applied
    }
  };

  // Style for active/inactive state
  const getButtonStyle = (active) => ({
    opacity: active ? 1 : 0.5,
    backgroundColor: active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
  });

  // Chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      },
      title: {
        display: true,
        text: 'POI Distribution',
        color: 'rgba(255, 255, 255, 0.8)',
        font: {
          size: 16
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      },
      title: {
        display: true,
        text: 'POI Popularity Score',
        color: 'rgba(255, 255, 255, 0.8)',
        font: {
          size: 16
        }
      }
    }
  };

  // Bar chart data
  const barChartData = {
    labels: data.categories,
    datasets: [
      {
        label: 'Number of POIs',
        data: data.counts,
        backgroundColor: [
          '#ff9900', // Restaurants
          '#cc6600', // Cafes
          '#990099', // Bars
          '#0066ff', // Shops
          '#cc3300', // Cultural
          '#33cc33'  // Parks
        ],
        borderWidth: 0
      }
    ]
  };

  // Pie chart data
  const pieChartData = {
    labels: data.categories,
    datasets: [
      {
        label: 'Popularity Score',
        data: data.popularityScores,
        backgroundColor: [
          '#ff9900', // Restaurants
          '#cc6600', // Cafes
          '#990099', // Bars
          '#0066ff', // Shops
          '#cc3300', // Cultural
          '#33cc33'  // Parks
        ],
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.2)'
      }
    ]
  };

  // Calculate total POIs
  const totalPOIs = data.counts.reduce((sum, count) => sum + count, 0);

  // Calculate highest popularity
  const highestPopularity = Math.max(...data.popularityScores);
  const highestPopularityCategory = data.categories[
    data.popularityScores.indexOf(highestPopularity)
  ];

  // Icon components
  const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  // Update scatter chart options to handle point clicks
  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,  // Much faster animation
      easing: 'easeOutQuad',  // Quicker easing function
      animateScale: true,  // Animate point size changes
      animateRotate: false  // No rotation animation to speed up
    },
    transitions: {
      active: {
        animation: {
          duration: 300  // Match the main animation duration
        }
      }
    },
    plugins: {
      legend: {
        display: false,  // Always hide the Chart.js legend, use our custom Legend component instead
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = context.raw;
            if (!point) return '';

            if (showCurve) {
              // For bell curve mode
              const datasetLabel = context.dataset.label;

              // Check if this is a POI point on a curve
              if (point.curveType) {
                if (point.curveType === 'rating') {
                  return `${point.name} (${point.category}) - Rating: ${point.x.toFixed(1)}, Reviews: ${point.originalY}`;
                } else if (point.curveType === 'reviews') {
                  return `${point.name} (${point.category}) - Rating: ${point.originalY.toFixed(1)}, Reviews: ${point.x}`;
                }
              }

              // Otherwise it's a curve point
              if (datasetLabel === 'Bell Curve') {
                return `Rating: ${point.x.toFixed(2)}, Relative Frequency: ${point.y.toFixed(4)}`;
              } else if (datasetLabel === 'Reviews Distribution') {
                return `Reviews: ${point.x.toFixed(0)}, Relative Frequency: ${point.y.toFixed(4)}`;
              }
              return `Value: ${point.x.toFixed(2)}, Relative Frequency: ${point.y.toFixed(4)}`;
            } else {
              // For scatter mode
              const rating = typeof point.y === 'number' ? point.y.toFixed(1) : point.y;
              const reviews = typeof point.x === 'number' ? point.x : 0;
              return `${point.name || 'POI'} (${point.category}) - Rating: ${rating}, Reviews: ${reviews}`;
            }
          }
        }
      }
    },
    elements: {
      point: {
        // We'll use a custom point style for selected points
        pointStyle: function(context) {
          const point = context.raw;
          if (showCurve) return 'circle';

          // For selected points, we'll create a custom point style with a white ring
          if (point && point.isSelected) {
            // Create a custom point style with a white ring
            const canvas = document.createElement('canvas');
            const size = 30; // Larger canvas size for more prominence
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            // Draw the white outer circle (ring)
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/2 - 1, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.fill();

            // Draw the inner colored circle (using the point's color)
            // Make the inner circle smaller (1/3 of the size) to create a more prominent white ring
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/6, 0, 2 * Math.PI);
            ctx.fillStyle = context.dataset.backgroundColor;
            ctx.fill();

            return canvas;
          }

          return 'circle';
        },
        // Dynamic radius based on selection state
        radius: function(context) {
          const point = context.raw;
          if (showCurve) return 0;
          if (point && point.isSelected) {
            return 10; // Larger radius for selected points
          }
          return 5; // Normal radius for unselected points
        },
        hoverRadius: function(context) {
          const point = context.raw;
          if (showCurve) return 0;
          if (point && point.isSelected) {
            return 12; // Larger hover radius for selected points
          }
          return 7; // Normal hover radius for unselected points
        },
        // No border needed since we're using a custom point style
        borderWidth: 0,
        borderColor: 'rgba(255, 255, 255, 0)'
      },
      line: {
        tension: 0.4,
        borderWidth: 1.5,  // Thinner line
        fill: false,
        borderDash: [],  // Solid line
        capBezierPoints: true  // Smoother line
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: showCurve ? 'Probability Density' : 'Rating (stars)',
          color: 'rgba(255, 255, 255, 0.7)'
        },
        min: showCurve ? 0 : undefined,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: (value) => {
            if (showCurve) {
              return value.toExponential(1);
            } else {
              return typeof value === 'number' ? value.toFixed(1) : value;
            }
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        title: {
          display: true,
          text: showCurve ? 'Value' : 'Number of Reviews',
          color: 'rgba(255, 255, 255, 0.7)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: (value) => {
            if (showCurve) {
              return value.toFixed(1);
            } else {
              return value;
            }
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    onClick: (event, elements) => {
      // Handle clicks in both modes
      if (elements.length === 0) {
        return;
      }

      log('POI Graph: Chart click detected:', {
        elements,
        hasElements: elements.length > 0
      });

      if (elements.length > 0) {
        const element = elements[0];

        // Skip if clicked on the Bell Curve dataset
        if (showCurve && element.datasetIndex === 0) {
          log('POI Graph: Clicked on Bell Curve, ignoring');
          return;
        }

        const datasets = showCurve
          ? prepareScatterDatasets(data.scatterData || [], true)
          : prepareScatterDatasets(data.scatterData || []);

        // Adjust datasetIndex for Bell Curve mode (skip the curve dataset)
        const datasetIndex = showCurve ? element.datasetIndex - 1 : element.datasetIndex;
        const dataset = datasets[datasetIndex];

        log('POI Graph: Dataset found:', {
          originalDatasetIndex: element.datasetIndex,
          adjustedDatasetIndex: datasetIndex,
          pointIndex: element.index,
          dataset: dataset
        });

        if (!dataset || !dataset.data) {
          log('POI Graph: No dataset or data found');
          return;
        }

        const point = dataset.data[element.index];
        if (!point) {
          log('POI Graph: No point found at index:', element.index);
          return;
        }

        log('POI Graph: Point clicked:', point);
        handlePOISelect(point);
      }
    }
  };

  // Function to calculate normal distribution value (bell curve)
  const normalDistribution = (x, mean, stdDev) => {
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
           Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
  };

  // Function to generate bell curve points
  const createBellCurve = (values, numPoints = 200) => {
    console.log(`%c[CURVE MODE] Generating bell curve for ${values.length} values`, 'background: #9c27b0; color: white;');

    if (!values || values.length === 0) {
      console.error('No values provided for curve generation');
      return [];
    }

    // Calculate mean and standard deviation
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance) || 1; // Prevent division by zero

    console.log(`%c[CURVE MODE] Distribution statistics: mean=${mean.toFixed(2)}, stdDev=${stdDev.toFixed(2)}`, 'background: #9c27b0; color: white;');

    // Find min and max values with a buffer
    const min = Math.max(0, mean - 3 * stdDev);
    const max = mean + 3 * stdDev;

    console.log(`%c[CURVE MODE] Curve range: [${min.toFixed(2)}, ${max.toFixed(2)}]`, 'background: #9c27b0; color: white;');

    const points = [];
    const step = (max - min) / numPoints;

    console.log(`%c[CURVE MODE] Step size for curve: ${step.toFixed(4)}`, 'background: #9c27b0; color: white;');

    for (let i = 0; i <= numPoints; i++) {
      const x = min + (step * i);
      const y = normalDistribution(x, mean, stdDev);
      points.push({ x, y });

      // Log a few sample points
      if (i === 0 || i === Math.floor(numPoints / 2) || i === numPoints) {
        console.log(`%c[CURVE MODE] Point ${i}: x=${x.toFixed(2)}, y=${y.toExponential(4)}`, 'background: #9c27b0; color: white;');
      }
    }

    console.log(`%c[CURVE MODE] Generated ${points.length} points for bell curve`, 'background: #9c27b0; color: white;');

    return points;
  };

  // Function to generate histogram data from values
  const generateHistogram = (values, numBins = 20) => {
    console.log(`%c[CURVE MODE] Generating histogram with ${values.length} values and ${numBins} bins`, 'background: #9c27b0; color: white;');

    if (!values || values.length === 0) {
      console.error(`%c[CURVE MODE] No values provided for histogram`, 'background: red; color: white;');
      return [];
    }

    // Find min and max values
    let min = Math.min(...values);
    let max = Math.max(...values);

    // Add a small buffer to the range
    const range = max - min;
    min = Math.max(0, min - range * 0.05);
    max = max + range * 0.05;

    console.log(`%c[CURVE MODE] Histogram range: [${min.toFixed(2)}, ${max.toFixed(2)}]`, 'background: #9c27b0; color: white;');

    // Create bins
    const binWidth = (max - min) / numBins;
    const bins = Array(numBins).fill(0);
    const binCenters = [];

    // Calculate bin centers
    for (let i = 0; i < numBins; i++) {
      binCenters.push(min + binWidth * (i + 0.5));
    }

    // Count values in each bin
    values.forEach(value => {
      if (value >= min && value <= max) {
        const binIndex = Math.min(numBins - 1, Math.floor((value - min) / binWidth));
        bins[binIndex]++;
      }
    });

    // Normalize bins to get probability density
    const totalCount = values.length;
    const normalizedBins = bins.map(count => count / (totalCount * binWidth));

    // Create points for the histogram
    const points = [];
    for (let i = 0; i < numBins; i++) {
      points.push({
        x: binCenters[i],
        y: normalizedBins[i]
      });
    }

    // Log some sample points
    if (points.length > 0) {
      console.log(`%c[CURVE MODE] Histogram sample points:`, 'background: #9c27b0; color: white;');
      console.log(`%c[CURVE MODE] First bin: x=${points[0].x.toFixed(2)}, y=${points[0].y.toFixed(4)}`, 'background: #9c27b0; color: white;');
      console.log(`%c[CURVE MODE] Middle bin: x=${points[Math.floor(numBins/2)].x.toFixed(2)}, y=${points[Math.floor(numBins/2)].y.toFixed(4)}`, 'background: #9c27b0; color: white;');
      console.log(`%c[CURVE MODE] Last bin: x=${points[numBins-1].x.toFixed(2)}, y=${points[numBins-1].y.toFixed(4)}`, 'background: #9c27b0; color: white;');
    }

    console.log(`%c[CURVE MODE] Generated ${points.length} histogram points`, 'background: #9c27b0; color: white;');
    return points;
  };


  // Prepare scatter chart datasets with dynamic axis ranges and selection state
  // If curveMode is true, transform the data into bell curves
  const prepareScatterDatasets = (scatterData, curveMode = false) => {
    if (!scatterData || scatterData.length === 0) return [];

    const categories = {};
    let minRating = 5;
    let maxRating = 1;
    let minReviews = Number.MAX_SAFE_INTEGER;
    let maxReviews = 0;

    // For curve mode calculations
    const allRatings = [];
    const allReviews = [];

    // Get current filter values
    const { minRating: filterMinRating, minReviews: filterMinReviews } = filters;

    // Track highest values for slider max values
    let highestRating = 5; // Default max rating
    let highestReviews = 100; // Default max reviews

    scatterData.forEach(point => {
      if (!point) return;

      const categoryLowerCase = point.category?.toLowerCase();
      if (!visibleCategories[categoryLowerCase]) {
        log('POI Graph: Skipping hidden category point:', categoryLowerCase);
        return;
      }

      // In the data, x is rating and y is reviews
      const rating = parseFloat(point.x);
      const reviews = parseInt(point.y, 10);

      // Skip invalid data points
      if (isNaN(rating) || isNaN(reviews)) return;

      // Track highest values for slider max values
      highestRating = Math.max(highestRating, rating);
      highestReviews = Math.max(highestReviews, reviews);

      // Skip points that don't meet the filter criteria
      if (rating < filterMinRating || reviews < filterMinReviews) {
        log(`POI Graph: Filtering out point with rating ${rating} and reviews ${reviews}`);
        return;
      }

      // Collect all values for curve mode (only for points that pass the filter)
      allRatings.push(rating);
      allReviews.push(reviews);

      // Only log when in curve mode and limit to first 5 points to avoid excessive logging
      if (curveMode && allRatings.length <= 5) {
        console.log(`%c[CURVE MODE] Processing point: rating=${rating}, reviews=${reviews}`, 'background: #9c27b0; color: white;');
      }

      if (!isNaN(rating)) {
        minRating = Math.min(minRating, rating);
        maxRating = Math.max(maxRating, rating);
      }

      if (!isNaN(reviews)) {
        minReviews = Math.min(minReviews, reviews);
        maxReviews = Math.max(maxReviews, reviews);
      }

      if (!categories[point.category]) {
        categories[point.category] = {
          label: point.category,
          data: [],
          backgroundColor: point.color,
          pointRadius: 5,
          pointHoverRadius: 7
        };
      }

      categories[point.category].data.push({
        x: reviews,
        y: rating,
        name: point.name,
        category: point.category,
        lngLat: point.lngLat,
        isSelected: selectedPOI && selectedPOI.name === point.name
      });
    });

    if (minRating <= maxRating) {
      scatterOptions.scales.y.min = Math.floor(minRating);
      scatterOptions.scales.y.max = Math.ceil(maxRating);
    }

    if (minReviews <= maxReviews) {
      scatterOptions.scales.x.min = Math.floor(minReviews);
      scatterOptions.scales.x.max = Math.ceil(maxReviews * 1.1);
    }

    // If curve mode is enabled, transform the data into bell curves
    if (curveMode && allRatings.length > 0 && allReviews.length > 0) {
      console.log(`%c[CURVE MODE] Generating bell curves for ${allRatings.length} ratings and ${allReviews.length} reviews`, 'background: #9c27b0; color: white;');

      // Update y-axis scale for curve mode
      scatterOptions.scales.y.min = 0;
      // Don't set max to allow auto-scaling
      scatterOptions.scales.y.max = undefined;

      // Generate bell curves
      const ratingCurveData = createBellCurve(allRatings);
      const reviewsCurveData = createBellCurve(allReviews);

      // Generate histograms for comparison
      const ratingHistogramData = generateHistogram(allRatings);
      const reviewsHistogramData = generateHistogram(allReviews);

      // Find the maximum y values to normalize
      let maxRatingY = 0;
      let maxReviewsY = 0;

      // Find max y values in both curves and histograms
      ratingCurveData.forEach(point => {
        maxRatingY = Math.max(maxRatingY, point.y);
      });

      ratingHistogramData.forEach(point => {
        maxRatingY = Math.max(maxRatingY, point.y);
      });

      reviewsCurveData.forEach(point => {
        maxReviewsY = Math.max(maxReviewsY, point.y);
      });

      reviewsHistogramData.forEach(point => {
        maxReviewsY = Math.max(maxReviewsY, point.y);
      });

      console.log(`%c[CURVE MODE] Max Y values - Ratings: ${maxRatingY.toFixed(4)}, Reviews: ${maxReviewsY.toFixed(4)}`, 'background: #9c27b0; color: white;');

      // Normalize the y values to make the curves more visible
      ratingCurveData.forEach(point => {
        point.y = point.y / maxRatingY;
      });

      reviewsCurveData.forEach(point => {
        point.y = point.y / maxReviewsY;
      });

      // Calculate mean and standard deviation for ratings and reviews
      const ratingMean = allRatings.reduce((sum, val) => sum + val, 0) / allRatings.length;
      const ratingVariance = allRatings.reduce((sum, val) => sum + Math.pow(val - ratingMean, 2), 0) / allRatings.length;
      const ratingStdDev = Math.sqrt(ratingVariance) || 1;

      const reviewsMean = allReviews.reduce((sum, val) => sum + val, 0) / allReviews.length;
      const reviewsVariance = allReviews.reduce((sum, val) => sum + Math.pow(val - reviewsMean, 2), 0) / allReviews.length;
      const reviewsStdDev = Math.sqrt(reviewsVariance) || 1;

      // Create just a single bell curve dataset for ratings
      const ratingCurve = {
        label: 'Bell Curve',
        data: ratingCurveData,
        backgroundColor: 'transparent',  // No fill
        borderColor: 'rgba(255, 99, 132, 0.8)',  // Slightly transparent
        borderWidth: 1.5,  // Much thinner line
        pointRadius: 0,
        pointHoverRadius: 0,
        showLine: true,
        fill: false,  // No fill
        tension: 0.2,  // Less smoothing for more accurate curve
        type: 'line',  // Force line type
        cubicInterpolationMode: 'monotone',
        order: 2,  // Draw below points
        yAxisID: 'y',
        spanGaps: false,  // Don't connect points with gaps
        stepped: false,  // Don't use stepped line
        segment: {
          borderColor: ctx => 'rgba(255, 99, 132, 0.8)', // Slightly transparent
          borderWidth: 1.5 // Ensure consistent width
        },
        hidden: false,  // Show on chart
        hideInLegendAndTooltip: true,  // Hide only in legend
        // These properties ensure the curve doesn't appear in our custom Legend component
        skipInLegend: true,
        skipInCustomLegend: true
      };

      // Create POI scatter datasets grouped by category
      const poiDatasets = [];

      // Process each category
      Object.entries(categories).forEach(([category, dataset]) => {
        // Create a single dataset for each category with points on the rating curve
        const ratingPoints = [];

        // Group points by rating (rounded to 1 decimal place) to handle similar ratings
        const ratingGroups = {};
        dataset.data.forEach(point => {
          const rating = point.y; // Rating value (y in scatter is rating)
          const roundedRating = Math.round(rating * 10) / 10; // Round to 1 decimal place
          if (!ratingGroups[roundedRating]) {
            ratingGroups[roundedRating] = [];
          }
          ratingGroups[roundedRating].push(point);
        });

        // Process each rating group
        Object.entries(ratingGroups).forEach(([roundedRating, points]) => {
          const rating = parseFloat(roundedRating);

          // Calculate the exact y position on the bell curve
          const exactY = normalDistribution(rating, ratingMean, ratingStdDev) / maxRatingY;

          // Distribute points horizontally within each rating group
          points.forEach((point, index) => {
            // Calculate horizontal spread based on number of points with this rating
            const totalInGroup = points.length;
            let horizontalOffset = 0;

            if (totalInGroup > 1) {
              // Create a spread that's proportional to the number of points
              // More points = wider spread
              const spreadWidth = Math.min(0.8, totalInGroup * 0.1); // Wider spread, cap at 0.8

              // Use a more natural distribution pattern
              // For odd number of points, center one at the exact rating
              // For even number of points, distribute evenly around the rating
              if (totalInGroup % 2 === 1) { // Odd number of points
                const middleIndex = Math.floor(totalInGroup / 2);
                if (index === middleIndex) {
                  horizontalOffset = 0; // Center point exactly at the rating
                } else if (index < middleIndex) {
                  // Points to the left of center
                  const position = index / middleIndex;
                  horizontalOffset = -spreadWidth * (1 - position * 0.5);
                } else {
                  // Points to the right of center
                  const position = (index - middleIndex - 1) / (totalInGroup - middleIndex - 1);
                  horizontalOffset = spreadWidth * (0.5 + position * 0.5);
                }
              } else { // Even number of points
                // Distribute evenly around the center
                const position = index / (totalInGroup - 1);
                horizontalOffset = ((position * 2) - 1) * spreadWidth;
              }
            }

            // Check if this point should be selected
            const shouldBeSelected = point.isSelected ||
                                    (selectedPOI &&
                                     selectedPOI.name === point.name &&
                                     selectedPOI.category === point.category);

            if (shouldBeSelected) {
              console.log(`%c[CURVE MODE] Found point to highlight in Bell Curve mode: ${point.name}`, 'background: #9c27b0; color: white;');
            }

            // Add point to rating curve dataset
            ratingPoints.push({
              x: rating + horizontalOffset, // Rating value with horizontal spread
              y: exactY, // Exact height on the bell curve
              name: point.name,
              category: point.category,
              lngLat: point.lngLat,
              originalX: point.x, // Original review count
              originalY: point.y, // Original rating
              // Ensure isSelected is properly transferred from OSM Data mode to Bell Curve mode
              isSelected: shouldBeSelected
            });
          });
        });

        // Check if any points in this category are selected
        const hasSelectedPoints = ratingPoints.some(point => point.isSelected);
        if (hasSelectedPoints) {
          console.log(`%c[CURVE MODE] Category ${category} has selected points`, 'background: #9c27b0; color: white;');
        }

        // Create a single dataset for this category with points on the rating curve
        // Use the same styling as in OSM Data mode for consistency
        poiDatasets.push({
          label: category,
          data: ratingPoints,
          backgroundColor: dataset.backgroundColor,
          borderColor: 'transparent',  // No border for consistency with OSM Data mode
          // Dynamic point radius based on selection state
          pointRadius: (context) => {
            const point = context.raw;
            if (point && point.isSelected) {
              return 10; // Larger radius for selected points
            }
            return 5; // Normal radius for unselected points
          },
          // Dynamic hover radius based on selection state
          pointHoverRadius: (context) => {
            const point = context.raw;
            if (point && point.isSelected) {
              return 12; // Larger hover radius for selected points
            }
            return 7; // Normal hover radius for unselected points
          },
          borderWidth: 0,  // No border
          showLine: false,
          type: 'scatter',
          order: 1,  // Draw on top of the curve
          // Use custom point style function instead of fixed 'circle'
          pointStyle: (context) => {
            const point = context.raw;
            if (point && point.isSelected) {
              // Create a custom point style with a white ring
              const canvas = document.createElement('canvas');
              const size = 40; // Larger canvas size for more prominence
              canvas.width = size;
              canvas.height = size;
              const ctx = canvas.getContext('2d');

              // Draw the white outer circle (ring)
              ctx.beginPath();
              ctx.arc(size/2, size/2, size/2 - 1, 0, 2 * Math.PI);
              ctx.fillStyle = 'rgba(255, 255, 255, 1)';
              ctx.fill();

              // Draw the inner colored circle
              ctx.beginPath();
              ctx.arc(size/2, size/2, size/4, 0, 2 * Math.PI);
              ctx.fillStyle = dataset.backgroundColor;
              ctx.fill();

              return canvas;
            }
            return 'circle';
          },
          hoverBorderWidth: 0,  // No border on hover
          hoverBorderColor: 'transparent'  // No border color
        });
      });

      console.log(`%c[CURVE MODE] Returning curve datasets with ${poiDatasets.length} POI datasets`, 'background: #9c27b0; color: white;');
      return [ratingCurve, ...poiDatasets];
    }

    // Update max values state if needed
    if (highestRating > maxValues.maxRating || highestReviews > maxValues.maxReviews) {
      // Round up to nearest 10 for reviews
      const roundedMaxReviews = Math.ceil(highestReviews / 10) * 10;
      setMaxValues({
        maxRating: Math.ceil(highestRating),
        maxReviews: roundedMaxReviews
      });

      log('POI Graph: Updated max values for sliders:', {
        maxRating: Math.ceil(highestRating),
        maxReviews: roundedMaxReviews
      });
    }

    log('POI Graph: Prepared scatter datasets:', {
      totalCategories: Object.keys(categories).length,
      visibleCategories: Object.keys(categories),
      filteredPoints: Object.values(categories).reduce((sum, cat) => sum + cat.data.length, 0)
    });

    return Object.values(categories);
  };

  // Handle toggle visibility
  const handleVisibilityChange = (newVisibility) => {
    log('POI Graph: Visibility changed:', newVisibility);
    setIsVisible(newVisibility);
  };

  // Get category counts from scatter data
  const getCategoryData = () => {
    if (!data.scatterData) return [];

    const counts = {};
    data.scatterData.forEach(point => {
      if (point.category) {
        counts[point.category] = (counts[point.category] || 0) + 1;
      }
    });

    // Get the datasets from the current mode
    const datasets = showCurve
      ? prepareScatterDatasets(data.scatterData || [], true)
      : prepareScatterDatasets(data.scatterData || []);

    // Create category data from the datasets
    const categoryData = Object.entries(counts).map(([name, count]) => ({
      name,
      count
    }));

    return categoryData;
  };

  // Update scatter plot when category visibility or curve mode changes
  useEffect(() => {
    log('POI Graph: Category visibility or curve mode changed, updating scatter plot');
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [visibleCategories, showCurve]);

  // Helper function to toggle map label layers
  const toggleMapLabels = (visible) => {
    if (!mapRef.current?.current) return;

    const map = mapRef.current.current;
    const style = map.getStyle();

    // Find all label layers in the map style
    const labelLayers = style.layers.filter(layer => {
      // Match layers that have 'label' in their id or are symbol layers typically used for labels
      return (
        layer.id.includes('label') ||
        (layer.type === 'symbol' && layer.layout && layer.layout['text-field'])
      );
    });

    console.log(`%c[OSM DATA] Found ${labelLayers.length} label layers to toggle`, 'background: #4caf50; color: white;');

    // Toggle visibility for each label layer
    labelLayers.forEach(layer => {
      try {
        map.setLayoutProperty(layer.id, 'visibility', visible ? 'visible' : 'none');
        console.log(`%c[OSM DATA] Set ${layer.id} visibility to ${visible ? 'visible' : 'none'}`, 'background: #4caf50; color: white;');
      } catch (error) {
        console.error(`Error toggling label layer ${layer.id}:`, error);
      }
    });
  };

  // Toggle OSM data
  const toggleOSM = () => {
    const newShowOSM = !showOSM;
    setShowOSM(newShowOSM);

    // Emit event to update OSM data in the graph
    mapEventBus.emit('osmGraph:visibility', { visible: newShowOSM });

    // Toggle map labels - hide when OSM Data is on, show when it's off
    toggleMapLabels(!newShowOSM);
    console.log(`%c[OSM DATA] Toggled map labels to ${!newShowOSM ? 'visible' : 'hidden'}`, 'background: #4caf50; color: white;');

    // Also toggle the map markers by directly updating the showOSMPOIs state
    if (newShowOSM) {
      // Auto-enable OSM POIs in map layer
      // Directly call the setter function passed as a prop
      setShowOSMPOIs(true);

      // Also update through layerStateManager for good measure
      if (window.layerStateManager) {
        window.layerStateManager.updateLayerState('showOSMPOIs', true);
      }

      // Force a direct update to the OSMPOILayer
      mapEventBus.emit('osm:visibility', { visible: true });
    }
  };

  // Update radius circle when selected POI changes
  useEffect(() => {
    console.log(`%c[RADIUS] useEffect triggered - showRadius: ${showRadius}, selectedPOI: ${selectedPOI ? selectedPOI.name : 'null'}`, 'background: #ff9800; color: white;');

    if (showRadius && selectedPOI) {
      console.log(`%c[RADIUS] Conditions met to add radius circle from useEffect`, 'background: #ff9800; color: white;');
      addRadiusCircle(selectedPOI);
    } else if (showRadius) {
      console.log(`%c[RADIUS] showRadius is true but no selectedPOI`, 'background: #ff9800; color: white;');
    } else if (selectedPOI) {
      console.log(`%c[RADIUS] selectedPOI exists but showRadius is false`, 'background: #ff9800; color: white;');
    }
  }, [selectedPOI, showRadius]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      log('POI Graph: Cleaning up');

      // Clear any active building highlights
      if (mapRef.current?.current) {
        try {
          removeAllHighlights(mapRef.current.current);
          log('POI Graph: Removed all building highlights on cleanup');

          // Also remove any fallback circle highlights
          const circleLayers = mapRef.current.current.getStyle().layers
            .filter(layer => layer.id.startsWith('poi-graph-circle-'))
            .map(layer => layer.id);

          circleLayers.forEach(layerId => {
            try {
              const sourceId = mapRef.current.current.getLayer(layerId).source;
              mapRef.current.current.removeLayer(layerId);
              if (sourceId) {
                mapRef.current.current.removeSource(sourceId);
              }
              log(`POI Graph: Removed fallback circle layer: ${layerId}`);
            } catch (e) {
              console.error(`Error removing fallback circle layer ${layerId}:`, e);
            }
          });

          // Remove radius circle
          removeRadiusCircle();

          // Restore map labels if they were hidden
          if (showOSM) {
            console.log('%c[OSM DATA] Restoring map labels on cleanup', 'background: #4caf50; color: white;');
            toggleMapLabels(true);
          }
        } catch (err) {
          console.error('Error during POI Graph cleanup:', err);
        }
      }
    };
  }, [showOSM]);

  // Toggle curve mode with smooth animation
  const toggleCurve = () => {
    const newShowCurve = !showCurve;

    // Log the change with more details for debugging
    console.log(`%c[CURVE MODE] Toggling bell curve mode from ${showCurve} to ${newShowCurve}`, 'background: #9c27b0; color: white; font-size: 14px; padding: 3px;');

    // Store the current selected POI for reference
    const currentSelectedPOI = selectedPOI;
    console.log(`%c[CURVE MODE] Current selected POI:`, 'background: #9c27b0; color: white;', currentSelectedPOI);

    // If we have a chart reference, prepare for animation
    if (chartRef.current) {
      // Get the current chart instance
      const chart = chartRef.current;

      // Prepare the chart for a direct transition without resetting
      // This is the key to making points move directly from one position to another

      // First, get the current datasets
      const currentDatasets = chart.data.datasets;

      // Prepare the new datasets but don't apply them yet
      const newDatasets = newShowCurve
        ? prepareScatterDatasets(data.scatterData || [], true)
        : prepareScatterDatasets(data.scatterData || []);

      // Store the current positions for animation reference
      const pointMap = new Map();

      // Try to create a mapping between points in both modes
      try {
        // Map current points by name and category for quick lookup
        currentDatasets.forEach(dataset => {
          if (dataset.data) {
            dataset.data.forEach(point => {
              if (point && point.name && point.category) {
                const key = `${point.name}-${point.category}`;
                pointMap.set(key, {
                  currentX: point.x,
                  currentY: point.y
                });
              }
            });
          }
        });

        console.log(`%c[CURVE MODE] Mapped ${pointMap.size} points for direct transition`, 'background: #9c27b0; color: white;');
      } catch (e) {
        console.log(`%c[CURVE MODE] Error mapping positions: ${e.message}`, 'background: #9c27b0; color: white;');
      }
    }

    // Update the state to trigger re-render
    setShowCurve(newShowCurve);

    // If we have a selected POI, log it for debugging
    if (selectedPOI) {
      console.log(`%c[CURVE MODE] Selected POI before chart update: ${selectedPOI.name}, category: ${selectedPOI.category}`, 'background: #9c27b0; color: white;');
    }

    // Force update of the chart with animation when mode changes
    setTimeout(() => {
      if (chartRef.current) {
        // Get the chart instance
        const chart = chartRef.current;

        // Set animation mode to 'active' for faster transitions
        chart.options.animation = {
          ...chart.options.animation,
          mode: 'active',
          duration: 300,  // Much faster animation
          easing: 'easeOutQuad'  // Quicker easing
        };

        // Apply the animation
        chart.update('active');

        // After update, ensure selected POI is still highlighted
        if (selectedPOI) {
          console.log(`%c[CURVE MODE] Ensuring selected POI ${selectedPOI.name} remains highlighted`, 'background: #9c27b0; color: white;');

          // Force multiple updates to ensure highlighting is applied
          // First update immediately
          if (chartRef.current) {
            chartRef.current.update();
          }

          // Then another update after a short delay
          setTimeout(() => {
            if (chartRef.current) {
              // Force redraw of the selected point
              const datasets = chartRef.current.data.datasets;
              datasets.forEach(dataset => {
                if (dataset.data) {
                  dataset.data.forEach(point => {
                    if (point && point.name === selectedPOI.name && point.category === selectedPOI.category) {
                      // Ensure isSelected is true
                      point.isSelected = true;
                      console.log(`%c[CURVE MODE] Found and marked selected point in dataset`, 'background: #9c27b0; color: white;');
                    }
                  });
                }
              });

              chartRef.current.update();
            }
          }, 50);

          // And a final update after everything has settled
          setTimeout(() => {
            if (chartRef.current) {
              chartRef.current.update();
            }
          }, 150);
        }

        // Log animation status
        console.log(`%c[CURVE MODE] Animation applied with duration ${chart.options.animation.duration}ms`, 'background: #9c27b0; color: white;');
      }
    }, 50);

    // Log chart data for debugging
    if (data && data.scatterData) {
      console.log(`%c[CURVE MODE] Current data points: ${data.scatterData.length}`, 'background: #9c27b0; color: white;');

      // Extract ratings and reviews for analysis
      const ratings = [];
      const reviews = [];

      data.scatterData.forEach(point => {
        if (point) {
          // In the data, x is rating and y is reviews
          const rating = parseFloat(point.x);
          const review = parseInt(point.y, 10);

          if (!isNaN(rating)) ratings.push(rating);
          if (!isNaN(review)) reviews.push(review);
        }
      });

      console.log(`%c[CURVE MODE] Extracted ${ratings.length} ratings and ${reviews.length} reviews for analysis`, 'background: #9c27b0; color: white;');

      // Log basic statistics
      if (ratings.length > 0) {
        const ratingMean = ratings.reduce((sum, val) => sum + val, 0) / ratings.length;
        const ratingMin = Math.min(...ratings);
        const ratingMax = Math.max(...ratings);
        console.log(`%c[CURVE MODE] Ratings stats: mean=${ratingMean.toFixed(2)}, range=[${ratingMin.toFixed(2)}, ${ratingMax.toFixed(2)}]`, 'background: #9c27b0; color: white;');
      }

      if (reviews.length > 0) {
        const reviewsMean = reviews.reduce((sum, val) => sum + val, 0) / reviews.length;
        const reviewsMin = Math.min(...reviews);
        const reviewsMax = Math.max(...reviews);
        console.log(`%c[CURVE MODE] Reviews stats: mean=${reviewsMean.toFixed(2)}, range=[${reviewsMin.toFixed(2)}, ${reviewsMax.toFixed(2)}]`, 'background: #9c27b0; color: white;');
      }

      // Log a sample of the data
      if (data.scatterData.length > 0) {
        console.log(`%c[CURVE MODE] Sample data point:`, 'background: #9c27b0; color: white;');
        console.log(data.scatterData[0]);
      }
    }

    // Force chart update with a direct data update approach
    if (chartRef.current) {
      console.log(`%c[CURVE MODE] Updating chart reference with direct data update`, 'background: #9c27b0; color: white;');

      // Force a complete data refresh
      setTimeout(() => {
        if (chartRef.current) {
          // Get fresh datasets with the current mode
          const freshDatasets = newShowCurve
            ? prepareScatterDatasets(data.scatterData || [], true)
            : prepareScatterDatasets(data.scatterData || []);

          // Directly set the datasets
          chartRef.current.data.datasets = freshDatasets;

          // If we have a selected POI, ensure it's marked in the datasets
          if (selectedPOI) {
            console.log(`%c[CURVE MODE] Ensuring selected POI is marked in fresh datasets`, 'background: #9c27b0; color: white;');

            // Find and mark the selected point
            let foundSelected = false;
            chartRef.current.data.datasets.forEach(dataset => {
              if (dataset.data) {
                dataset.data.forEach(point => {
                  if (point && point.name === selectedPOI.name && point.category === selectedPOI.category) {
                    point.isSelected = true;
                    foundSelected = true;
                    console.log(`%c[CURVE MODE] Marked selected point in fresh datasets: ${point.name}`, 'background: #9c27b0; color: white;');
                  }
                });
              }
            });

            if (!foundSelected) {
              console.log(`%c[CURVE MODE] Warning: Could not find selected POI in fresh datasets`, 'background: #9c27b0; color: red;');
            }
          }

          // Update the chart with the fresh data
          chartRef.current.update();
        }
      }, 50);
    } else {
      console.log(`%c[CURVE MODE] Chart reference not available`, 'background: #9c27b0; color: white;');
    }
  };

  // Toggle radius circle around selected POI
  const toggleRadius = () => {
    const newShowRadius = !showRadius;
    setShowRadius(newShowRadius);

    // Add detailed console logs for debugging
    console.log(`%c[RADIUS] Toggling 1-minute walk radius from ${showRadius} to ${newShowRadius}`, 'background: #ff9800; color: white; font-size: 14px; padding: 3px;');
    console.log(`%c[RADIUS] Selected POI:`, 'background: #ff9800; color: white;', selectedPOI);

    // If enabling radius and we have a selected POI, add the radius circle
    if (newShowRadius && selectedPOI) {
      console.log(`%c[RADIUS] Adding radius circle for POI:`, 'background: #ff9800; color: white;', selectedPOI.name, selectedPOI.lngLat);
      addRadiusCircle(selectedPOI);
    } else {
      // If disabling radius, remove the radius circle
      console.log(`%c[RADIUS] Removing radius circle. newShowRadius=${newShowRadius}, selectedPOI=${selectedPOI ? 'exists' : 'null'}`, 'background: #ff9800; color: white;');
      removeRadiusCircle();
    }
  };

  // Handle filter changes from TopList
  const handleFilterChange = (newFilters) => {
    // Only log significant changes to reduce console noise
    if (Math.abs(filters.minRating - newFilters.minRating) > 0.1 ||
        Math.abs(filters.minReviews - newFilters.minReviews) > 5) {
      console.log(`%c[TOP LIST] Quality filter applied: min rating = ${newFilters.minRating.toFixed(1)}, min reviews = ${newFilters.minReviews}`, 'background: #2196f3; color: white;');
    }

    setFilters(newFilters);

    // Update the chart to reflect the new filters
    // Use requestAnimationFrame for smoother updates
    if (chartRef.current) {
      requestAnimationFrame(() => {
        chartRef.current.update('none'); // Use 'none' mode for fastest updates
      });
    }
  };

  // Add a half-mile radius circle around the selected POI
  const addRadiusCircle = (poi) => {
    console.log(`%c[RADIUS] addRadiusCircle called with POI:`, 'background: #ff9800; color: white;', poi);

    if (!mapRef.current?.current) {
      console.log(`%c[RADIUS] Error: mapRef.current.current is null or undefined`, 'background: #ff9800; color: white;');
      return;
    }

    if (!poi?.lngLat) {
      console.log(`%c[RADIUS] Error: poi.lngLat is null or undefined`, 'background: #ff9800; color: white;');
      return;
    }

    console.log(`%c[RADIUS] Map reference:`, 'background: #ff9800; color: white;', mapRef.current.current);
    console.log(`%c[RADIUS] POI coordinates:`, 'background: #ff9800; color: white;', poi.lngLat);

    // Remove any existing radius circle first
    removeRadiusCircle();

    try {
      // Create a unique ID for this radius circle
      const radiusId = 'poi-radius-circle';
      const radiusSourceId = 'poi-radius-circle-source';

      console.log(`%c[RADIUS] Creating buffer with turf.js`, 'background: #ff9800; color: white;');

      // Create a 1-minute walk radius circle (approximately 0.05 miles or 80 meters)
      const point = turf.point(poi.lngLat);
      const buffered = turf.buffer(point, 0.05, { units: 'miles' });

      console.log(`%c[RADIUS] Buffer created:`, 'background: #ff9800; color: white;', buffered);

      // Add source for the radius circle
      if (!mapRef.current.current.getSource(radiusSourceId)) {
        console.log(`%c[RADIUS] Adding new source: ${radiusSourceId}`, 'background: #ff9800; color: white;');
        mapRef.current.current.addSource(radiusSourceId, {
          type: 'geojson',
          data: buffered
        });
      } else {
        console.log(`%c[RADIUS] Updating existing source: ${radiusSourceId}`, 'background: #ff9800; color: white;');
        mapRef.current.current.getSource(radiusSourceId).setData(buffered);
      }

      // Add layer for the radius circle if it doesn't exist
      if (!mapRef.current.current.getLayer(radiusId)) {
        console.log(`%c[RADIUS] Adding new layer: ${radiusId}`, 'background: #ff9800; color: white;');
        // First add a fill layer for the radius circle
        mapRef.current.current.addLayer({
          id: `${radiusId}-fill`,
          type: 'fill',
          source: radiusSourceId,
          paint: {
            'fill-color': '#ffffff',
            'fill-opacity': 0.05
          }
        });

        // Then add a more visible line layer
        mapRef.current.current.addLayer({
          id: radiusId,
          type: 'line',
          source: radiusSourceId,
          paint: {
            'line-color': '#ffffff',
            'line-width': 3,  // Increased from 2 to 3
            'line-dasharray': [4, 4],  // Changed from [2, 2] to [4, 4] for more visible dashes
            'line-opacity': 1.0  // Increased from 0.8 to 1.0 for full opacity
          }
        });

        console.log(`%c[RADIUS] Successfully added radius circle layer`, 'background: #ff9800; color: white;');
      } else {
        console.log(`%c[RADIUS] Layer ${radiusId} already exists`, 'background: #ff9800; color: white;');
      }
    } catch (err) {
      console.error(`%c[RADIUS] Error adding radius circle:`, 'background: #ff9800; color: red;', err);
    }
  };

  // Remove the radius circle
  const removeRadiusCircle = () => {
    console.log(`%c[RADIUS] removeRadiusCircle called`, 'background: #ff9800; color: white;');

    if (!mapRef.current?.current) {
      console.log(`%c[RADIUS] Error: mapRef.current.current is null or undefined`, 'background: #ff9800; color: white;');
      return;
    }

    try {
      const radiusId = 'poi-radius-circle';
      const radiusSourceId = 'poi-radius-circle-source';

      console.log(`%c[RADIUS] Checking for existing layer: ${radiusId}`, 'background: #ff9800; color: white;');

      // Remove the layers and source if they exist
      // First check and remove the line layer
      if (mapRef.current.current.getLayer(radiusId)) {
        console.log(`%c[RADIUS] Removing line layer: ${radiusId}`, 'background: #ff9800; color: white;');
        mapRef.current.current.removeLayer(radiusId);
      } else {
        console.log(`%c[RADIUS] Line layer ${radiusId} does not exist`, 'background: #ff9800; color: white;');
      }

      // Then check and remove the fill layer
      const fillLayerId = `${radiusId}-fill`;
      if (mapRef.current.current.getLayer(fillLayerId)) {
        console.log(`%c[RADIUS] Removing fill layer: ${fillLayerId}`, 'background: #ff9800; color: white;');
        mapRef.current.current.removeLayer(fillLayerId);
      } else {
        console.log(`%c[RADIUS] Fill layer ${fillLayerId} does not exist`, 'background: #ff9800; color: white;');
      }

      console.log(`%c[RADIUS] Checking for existing source: ${radiusSourceId}`, 'background: #ff9800; color: white;');

      if (mapRef.current.current.getSource(radiusSourceId)) {
        console.log(`%c[RADIUS] Removing source: ${radiusSourceId}`, 'background: #ff9800; color: white;');
        mapRef.current.current.removeSource(radiusSourceId);
      } else {
        console.log(`%c[RADIUS] Source ${radiusSourceId} does not exist`, 'background: #ff9800; color: white;');
      }

      console.log(`%c[RADIUS] Successfully removed radius circle`, 'background: #ff9800; color: white;');
    } catch (err) {
      console.error(`%c[RADIUS] Error removing radius circle:`, 'background: #ff9800; color: red;', err);
    }
  };

  return (
    <>
      <ToggleButton
        onClick={() => handleVisibilityChange(!isVisible)}
        style={{
          opacity: isVisible ? 0 : 1,
          transform: isVisible ? 'translateY(-100px)' : 'none',
          transition: 'opacity 0.3s, transform 0.3s',
          pointerEvents: isVisible ? 'none' : 'auto'
        }}
      >
        <ChartIcon />
        Show POI Stats
      </ToggleButton>

      <GraphContainer $isVisible={isVisible}>
        <GraphHeader>
          <GraphTitle>
            {showCurve ? 'POI Distribution Bell Curves' : 'POI Ratings vs. Number of Reviews'}
            <POICounter>
              {data.scatterData ? data.scatterData.length : 0} POIs
            </POICounter>
          </GraphTitle>
          <HeaderControls>
            {showOSM && !showCurve && (
              <TopList
                visible={true}
                onFilterChange={handleFilterChange}
                maxRating={maxValues.maxRating}
                maxReviews={maxValues.maxReviews}
              />
            )}
            <RefreshButton
              onClick={toggleLive}
              style={getButtonStyle(isLive)}
              title={isLive ? 'Disable live updates' : 'Enable live updates'}
            >
              <LiveIcon />
              Live
            </RefreshButton>
            <RefreshButton
              onClick={toggleGraphOnly}
              style={getButtonStyle(graphOnlyMode)}
              title={graphOnlyMode ? 'Show markers on map' : 'Hide markers but keep graph updating'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Graph Only
            </RefreshButton>
            <RefreshButton
              onClick={toggleOSM}
              style={getButtonStyle(showOSM)}
              title={showOSM ? 'Hide OSM data' : 'Show OSM data'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              OSM Data
            </RefreshButton>
            <RefreshButton
              onClick={toggleCurve}
              style={getButtonStyle(showCurve)}
              title={showCurve ? 'Show scatter plot' : 'Show bell curve distribution'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              Bell Curve
            </RefreshButton>
            <RefreshButton
              onClick={toggleRadius}
              style={getButtonStyle(showRadius)}
              title={showRadius ? 'Hide 1-minute walk radius' : 'Show 1-minute walk radius around selected POI'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Radius
            </RefreshButton>
            <RefreshButton
              onClick={handleRefresh}
              style={getButtonStyle(!isLive)}
              disabled={isLive}
              title={isLive ? 'Disabled during live updates' : 'Manually refresh data'}
            >
              <RefreshIcon />
              Refresh
            </RefreshButton>
            <CloseButton
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                log('POI Graph: Close button clicked, setting visible to false');
                handleVisibilityChange(false);
              }}
              title="Close POI Stats"
            >
              ×
            </CloseButton>
          </HeaderControls>
        </GraphHeader>

        <GraphContent>
          <ChartContainer>
            {data.scatterData && data.scatterData.length > 0 ? (
              showCurve ? (
                <Line
                  ref={chartRef}
                  options={{
                    ...scatterOptions,
                    animation: {
                      ...scatterOptions.animation,
                      duration: 300,  // Much faster animation
                      easing: 'easeOutQuad',  // Quicker easing
                    },
                    transitions: {
                      active: {
                        animation: {
                          duration: 300,  // Match main animation duration
                          easing: 'easeOutQuad'
                        }
                      },
                      resize: {
                        animation: {
                          duration: 200  // Even faster resize
                        }
                      },
                      show: {
                        animations: {
                          x: {
                            duration: 300,
                            from: NaN  // Use current position
                          },
                          y: {
                            duration: 300,
                            from: NaN  // Use current position
                          }
                        }
                      },
                      hide: {
                        animations: {
                          x: {
                            duration: 300,
                            to: NaN  // Use target position
                          },
                          y: {
                            duration: 300,
                            to: NaN  // Use target position
                          }
                        }
                      }
                    },
                    elements: {
                      point: {
                        // We'll use a custom point style for selected points in Bell Curve mode too
                        pointStyle: function(context) {
                          const point = context.raw;
                          const datasetLabel = context.dataset.label;

                          // For Bell Curve dataset, use default style
                          if (datasetLabel === 'Bell Curve') {
                            return 'circle';
                          }

                          // For selected points, create a custom point style with a white ring
                          if (point && point.isSelected) {
                            console.log(`%c[CURVE MODE] Rendering selected point in Bell Curve mode: ${point.name}`, 'background: #9c27b0; color: white;');

                            // Create a custom point style with a white ring
                            const canvas = document.createElement('canvas');
                            const size = 40; // Even larger canvas size for more prominence
                            canvas.width = size;
                            canvas.height = size;
                            const ctx = canvas.getContext('2d');

                            // Draw the white outer circle (ring) - make it thicker
                            ctx.beginPath();
                            ctx.arc(size/2, size/2, size/2 - 1, 0, 2 * Math.PI);
                            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
                            ctx.fill();

                            // Draw the inner colored circle (using the point's color) - make it smaller for more prominent white ring
                            ctx.beginPath();
                            ctx.arc(size/2, size/2, size/4, 0, 2 * Math.PI); // Smaller inner circle (1/4 instead of 1/6)
                            ctx.fillStyle = context.dataset.backgroundColor;
                            ctx.fill();

                            return canvas;
                          }

                          return 'circle';
                        },
                        radius: (context) => {
                          // For curve lines, hide points
                          // For POI points, show them
                          const datasetLabel = context.dataset.label;
                          if (datasetLabel === 'Bell Curve') {
                            return 0; // Hide curve points
                          }
                          // Check if point is selected
                          const dataIndex = context.dataIndex;
                          const dataset = context.dataset;
                          if (dataIndex !== undefined && dataset.data[dataIndex]?.isSelected) {
                            return 10; // Larger radius for selected points (same as OSM Data)
                          }
                          return 5; // Show POI points (same as OSM Data)
                        },
                        hoverRadius: (context) => {
                          const datasetLabel = context.dataset.label;
                          if (datasetLabel === 'Bell Curve') {
                            return 0; // Hide curve points
                          }
                          return 7; // Show POI points on hover (same as OSM Data)
                        },
                        // No border needed since we're using a custom point style
                        borderWidth: 0,
                        borderColor: 'transparent'
                      },
                      line: {
                        tension: 0.4,
                        borderWidth: 1.5,  // Thinner line to match the curve dataset
                        fill: false,  // No fill for consistency
                        borderDash: [],  // Solid line
                        capBezierPoints: true  // Smoother line
                      }
                    },
                    scales: {
                      y: {
                        type: 'linear',
                        beginAtZero: true,
                        max: 1.1,  // Add some space at the top
                        title: {
                          display: true,
                          text: 'Relative Frequency',
                          color: 'rgba(255, 255, 255, 0.9)',
                          font: {
                            size: 14,
                            weight: 'bold'
                          }
                        },
                        grid: {
                          color: 'rgba(255, 255, 255, 0.15)',
                          lineWidth: 1
                        },
                        ticks: {
                          color: 'rgba(255, 255, 255, 0.8)',
                          font: {
                            size: 12
                          },
                          callback: function(value) {
                            // Format y-axis ticks to be more readable
                            return value.toFixed(1);
                          }
                        }
                      },
                      x: {
                        type: 'linear',
                        min: 0,  // Start at 0
                        max: 5.5,  // End at 5.5 (slightly above max rating of 5)
                        title: {
                          display: true,
                          text: 'Rating Value',
                          color: 'rgba(255, 255, 255, 0.9)',
                          font: {
                            size: 14,
                            weight: 'bold'
                          }
                        },
                        grid: {
                          color: 'rgba(255, 255, 255, 0.15)',
                          lineWidth: 1
                        },
                        ticks: {
                          color: 'rgba(255, 255, 255, 0.8)',
                          font: {
                            size: 12
                          },
                          stepSize: 1,  // Show ticks at every integer
                          max: 5
                        }
                      }
                    },
                    plugins: {
                      tooltip: {
                        callbacks: {
                          title: function(tooltipItems) {
                            // Show POI name as tooltip title
                            const dataPoint = tooltipItems[0].raw;
                            return dataPoint.name || 'Unknown';
                          },
                          label: function(context) {
                            const dataPoint = context.raw;
                            if (context.dataset.label === 'Bell Curve') {
                              return `Value: ${context.parsed.x.toFixed(2)}`;
                            }
                            // Show original rating and review count
                            return [
                              `Rating: ${dataPoint.originalY.toFixed(2)}`,
                              `Reviews: ${dataPoint.originalX}`
                            ];
                          }
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                          weight: 'bold',
                          size: 14
                        },
                        bodyFont: {
                          size: 13
                        },
                        padding: 10,
                        cornerRadius: 6
                      },
                      legend: {
                        display: false,  // Hide Chart.js legend, use our custom Legend component instead
                        position: 'top',
                        labels: {
                          color: 'rgba(255, 255, 255, 0.9)',
                          font: {
                            size: 13,
                            weight: 'bold'
                          },
                          padding: 15,
                          usePointStyle: true,
                          pointStyleWidth: 12
                        }
                      }
                    }
                  }}
                  data={{ datasets: prepareScatterDatasets(data.scatterData || [], true) }}
                />
              ) : (
                <Scatter
                  ref={chartRef}
                  options={scatterOptions}
                  data={{ datasets: prepareScatterDatasets(data.scatterData || []) }}
                />
              )
            ) : (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: 'rgba(255,255,255,0.5)'
              }}>
                No POI data available. Try moving the map or clicking refresh.
              </div>
            )}
          </ChartContainer>
        </GraphContent>

        <Legend
          categories={getCategoryData()}
          onToggleCategory={toggleCategory}
          visibleCategories={visibleCategories}
        />
      </GraphContainer>
    </>
  );
};

export default POIGraph;