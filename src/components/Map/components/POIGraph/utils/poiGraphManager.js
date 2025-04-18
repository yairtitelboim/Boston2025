/**
 * POI Graph Manager
 * Handles POI graph visualization and state management
 */

class POIGraphManager {
  constructor() {
    this.isGraphVisible = false;
    this.currentGraphMode = 'scatter'; // scatter, heatmap, cluster
    this.visualizationSettings = {
      showLabels: true,
      showAxes: true,
      showLegend: true,
      colorScheme: 'default',
      pointSize: 'medium',
      opacity: 0.8
    };
    this.data = {
      scatterData: [],
      categories: [],
      counts: [],
      popularityScores: []
    };
  }

  // Visibility Methods
  isVisible() {
    return this.isGraphVisible;
  }

  setVisible(visible) {
    this.isGraphVisible = visible;
    this.updateVisibility();
  }

  // Graph Mode Methods
  getGraphMode() {
    return this.currentGraphMode;
  }

  setGraphMode(mode) {
    if (['scatter', 'heatmap', 'cluster'].includes(mode)) {
      this.currentGraphMode = mode;
      this.updateVisualization();
    }
  }

  // Visualization Settings Methods
  getVisualizationSettings() {
    return { ...this.visualizationSettings };
  }

  setVisualizationSettings(settings) {
    this.visualizationSettings = {
      ...this.visualizationSettings,
      ...settings
    };
    this.updateVisualization();
  }

  // Data Processing Methods
  processVisiblePOIs(map, graphOnlyMode = false, showOSM = false) {
    if (!map) return null;

    const bounds = map.getBounds();
    const visiblePOIs = [];
    let categoryTotals = {};

    if (showOSM) {
      // Process OSM features from cache
      Object.entries(window.osmFeaturesCache || {}).forEach(([category, features]) => {
        // Filter features within bounds
        const visibleFeatures = features.filter(feature => {
          const [lng, lat] = feature.geometry.coordinates;
          return bounds.contains([lng, lat]);
        });

        categoryTotals[category] = visibleFeatures.length;

        visibleFeatures.forEach(feature => {
          const { properties, geometry } = feature;
          if (!properties || !geometry || geometry.type !== 'Point') return;

          visiblePOIs.push({
            name: properties.name || 'Unnamed POI',
            category: category,
            x: properties.rating || (Math.random() * 4 + 1), // Random rating between 1-5
            y: properties.review_count || Math.floor(Math.random() * 100), // Random review count
            lngLat: geometry.coordinates,
            color: this.getCategoryColor(category)
          });
        });
      });
    } else {
      // Process Miami POIs within bounds
      const features = map.queryRenderedFeatures(undefined, {
        layers: ['miami-pois']
      });

      features.forEach(feature => {
        const { properties, geometry } = feature;
        if (!properties || !geometry) return;

        const category = this.extractCategory(feature);
        categoryTotals[category] = (categoryTotals[category] || 0) + 1;

        if (geometry.type === 'Point') {
          visiblePOIs.push({
            name: properties.name || 'Unnamed POI',
            category: category,
            x: properties.rating || 0,
            y: properties.review_count || 0,
            lngLat: geometry.coordinates,
            color: this.getCategoryColor(category)
          });
        }
      });
    }

    this.data = {
      scatterData: visiblePOIs,
      categories: Object.keys(categoryTotals),
      counts: Object.values(categoryTotals),
      popularityScores: Object.values(categoryTotals).map(count => Math.log(count + 1))
    };

    this.updateVisualization();
    return this.data;
  }

  // Helper Methods
  getCategoryColor(category) {
    const colors = {
      restaurants: '#FF6B6B',
      cafes: '#4ECDC4',
      bars: '#45B7D1',
      shops: '#96CEB4',
      cultural: '#FFEEAD',
      parks: '#88D8B0',
      education: '#FF9F1C',
      healthcare: '#2AB7CA',
      transportation: '#FED766'
    };
    return colors[category] || '#CCCCCC';
  }

  extractCategory(feature) {
    const properties = feature.properties || {};
    const type = properties.type || properties.amenity || properties.leisure || 'unknown';
    
    // Map type to category
    const categoryMap = {
      restaurant: 'restaurants',
      cafe: 'cafes',
      bar: 'bars',
      shop: 'shops',
      museum: 'cultural',
      park: 'parks',
      school: 'education',
      hospital: 'healthcare',
      station: 'transportation'
    };

    return categoryMap[type] || 'other';
  }

  // Private Update Methods
  updateVisibility() {
    if (window.mapEventBus) {
      window.mapEventBus.emit('poiGraph:visibilityChanged', {
        visible: this.isGraphVisible
      });
    }
  }

  updateVisualization() {
    if (window.mapEventBus) {
      window.mapEventBus.emit('poiGraph:visualizationUpdated', {
        mode: this.currentGraphMode,
        settings: this.visualizationSettings,
        data: this.data
      });
    }
  }
}

// Create and export singleton instance
const poiGraphManager = new POIGraphManager();
window.poiGraph = poiGraphManager; // Make available globally
export default poiGraphManager; 