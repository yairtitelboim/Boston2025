/**
 * POI Data Manager Utility
 * Handles updating and managing POI data visibility and counts
 */

class POIDataManager {
  constructor() {
    this.visibleCategories = new Set();
    this.filterSettings = {};
    this.highlightedCategories = new Set();
    this.poiCounts = {};
    this.visiblePOIs = {};
  }

  // State Management Methods
  getVisibleCategories() {
    return Array.from(this.visibleCategories);
  }

  setVisibleCategories(categories) {
    this.visibleCategories = new Set(categories);
    this.updateVisibility();
  }

  getFilterSettings() {
    return { ...this.filterSettings };
  }

  setFilterSettings(settings) {
    this.filterSettings = { ...settings };
    this.updateFilters();
  }

  getHighlightedCategories() {
    return Array.from(this.highlightedCategories);
  }

  setHighlightedCategories(categories) {
    this.highlightedCategories = new Set(categories);
    this.updateHighlights();
  }

  // POI Data Update Methods
  updateVisiblePOIs(map) {
    if (!map) {
      console.warn('Map reference not available for POI update');
      return { updatedPOIs: {}, updatedCounts: {} };
    }

    try {
      const bounds = map.getBounds();
      if (!bounds) {
        console.warn('Map bounds not available');
        return { updatedPOIs: {}, updatedCounts: {} };
      }

      // Query all visible POI features from the map
      const visibleFeatures = map.queryRenderedFeatures(undefined, {
        layers: map.getStyle().layers
          .filter(layer => layer.id.includes('poi') || layer.id.includes('marker'))
          .map(layer => layer.id)
      });

      // Initialize containers for results
      const updatedPOIs = {};
      const updatedCounts = {};

      // Process visible features
      visibleFeatures.forEach(feature => {
        if (!feature.properties) return;

        // Determine the category based on feature properties
        const category = this.determineCategory(feature.properties);
        if (!category) return;

        // Initialize category arrays if they don't exist
        if (!updatedPOIs[category]) {
          updatedPOIs[category] = [];
          updatedCounts[category] = 0;
        }

        // Create standardized POI object
        const poi = {
          id: feature.id || `poi-${Math.random().toString(36).substr(2, 9)}`,
          name: feature.properties.name || 'Unnamed Location',
          type: feature.properties.type || category,
          coordinates: feature.geometry.coordinates,
          properties: feature.properties,
          source: feature.source || 'mapbox'
        };

        // Add to category collection if it's visible
        if (this.visibleCategories.has(category)) {
          updatedPOIs[category].push(poi);
          updatedCounts[category]++;
        }
      });

      this.visiblePOIs = updatedPOIs;
      this.poiCounts = updatedCounts;

      return { updatedPOIs, updatedCounts };
    } catch (error) {
      console.error('Error updating POI data:', error);
      return { updatedPOIs: {}, updatedCounts: {} };
    }
  }

  // Helper Methods
  determineCategory(properties) {
    if (!properties) return null;

    // Common property keys that might indicate category
    const categoryKeys = ['amenity', 'leisure', 'shop', 'building', 'tourism'];

    // Check each key for a matching category
    for (const key of categoryKeys) {
      const value = properties[key];
      if (!value) continue;

      // Map common values to categories
      switch (value.toLowerCase()) {
        case 'restaurant':
        case 'fast_food':
        case 'food_court':
          return 'restaurants';

        case 'cafe':
        case 'coffee_shop':
          return 'cafes';

        case 'bar':
        case 'pub':
        case 'nightclub':
          return 'bars';

        case 'shop':
        case 'mall':
        case 'supermarket':
        case 'convenience':
          return 'shops';

        case 'museum':
        case 'theatre':
        case 'cinema':
        case 'arts_centre':
          return 'cultural';

        case 'park':
        case 'garden':
        case 'playground':
          return 'parks';

        case 'school':
        case 'university':
        case 'library':
          return 'education';

        case 'hospital':
        case 'clinic':
        case 'doctors':
        case 'pharmacy':
          return 'healthcare';

        case 'bus_station':
        case 'train_station':
        case 'subway_entrance':
        case 'taxi':
          return 'transportation';

        default:
          // Try to match based on the value itself
          if (value.includes('restaurant')) return 'restaurants';
          if (value.includes('cafe')) return 'cafes';
          if (value.includes('bar')) return 'bars';
          if (value.includes('shop')) return 'shops';
          if (value.includes('museum') || value.includes('theatre')) return 'cultural';
          if (value.includes('park')) return 'parks';
          if (value.includes('school') || value.includes('education')) return 'education';
          if (value.includes('hospital') || value.includes('health')) return 'healthcare';
          if (value.includes('transport') || value.includes('station')) return 'transportation';
      }
    }

    return null;
  }

  // Private Methods
  updateVisibility() {
    // Implement visibility update logic
    console.log('Updating POI visibility for categories:', this.visibleCategories);
  }

  updateFilters() {
    // Implement filter update logic
    console.log('Updating POI filters:', this.filterSettings);
  }

  updateHighlights() {
    // Implement highlight update logic
    console.log('Updating POI highlights:', this.highlightedCategories);
  }
}

// Create and export singleton instance
const poiDataManager = new POIDataManager();
window.poiDataManager = poiDataManager; // Make available globally
export default poiDataManager; 