/**
 * Style Manager
 * Handles map style and visualization settings
 */

class StyleManager {
  constructor() {
    this.currentTheme = 'default';
    this.customColors = {};
    this.visualEffects = {
      shadows: true,
      highlights: true,
      transitions: true,
      animations: true
    };
    this.layerStyles = new Map();
  }

  // Theme Methods
  getCurrentTheme() {
    return this.currentTheme;
  }

  setTheme(theme) {
    this.currentTheme = theme;
    this.applyTheme();
  }

  // Color Methods
  getCustomColors() {
    return { ...this.customColors };
  }

  setCustomColors(colors) {
    this.customColors = { ...colors };
    this.applyColors();
  }

  // Visual Effects Methods
  getVisualEffects() {
    return { ...this.visualEffects };
  }

  setVisualEffects(effects) {
    this.visualEffects = {
      ...this.visualEffects,
      ...effects
    };
    this.applyEffects();
  }

  // Layer Style Methods
  setLayerStyle(layerId, style) {
    this.layerStyles.set(layerId, style);
    this.applyLayerStyle(layerId);
  }

  getLayerStyle(layerId) {
    return this.layerStyles.get(layerId);
  }

  // Theme Application Methods
  applyTheme() {
    const themes = {
      default: {
        background: '#111111',
        water: '#222222',
        land: '#111111',
        roads: '#333333',
        buildings: '#444444',
        labels: '#FFFFFF'
      },
      light: {
        background: '#FFFFFF',
        water: '#AADAFF',
        land: '#F5F5F5',
        roads: '#FFFFFF',
        buildings: '#E0E0E0',
        labels: '#000000'
      },
      dark: {
        background: '#000000',
        water: '#001F3F',
        land: '#111111',
        roads: '#222222',
        buildings: '#333333',
        labels: '#FFFFFF'
      },
      satellite: {
        background: '#000000',
        water: '#000B14',
        land: '#141414',
        roads: '#FFD700',
        buildings: '#4A4A4A',
        labels: '#FFFFFF'
      }
    };

    const themeColors = themes[this.currentTheme] || themes.default;

    if (window.map) {
      const map = window.map;
      
      // Apply base colors
      if (map.getLayer('background')) {
        map.setPaintProperty('background', 'background-color', themeColors.background);
      }
      
      if (map.getLayer('water')) {
        map.setPaintProperty('water', 'fill-color', themeColors.water);
      }
      
      if (map.getLayer('land')) {
        map.setPaintProperty('land', 'background-color', themeColors.land);
      }

      // Apply road colors
      ['road-primary', 'road-secondary', 'road-street'].forEach(layer => {
        if (map.getLayer(layer)) {
          map.setPaintProperty(layer, 'line-color', themeColors.roads);
        }
      });

      // Apply building colors
      const buildingLayers = ['osm-buildings-3d', 'buildings-3d-layer', 'boston-buildings'];
      buildingLayers.forEach(layer => {
        if (map.getLayer(layer)) {
          map.setPaintProperty(layer, 'fill-extrusion-color', themeColors.buildings);
        }
      });

      // Apply label colors
      const labelLayers = map.getStyle().layers.filter(layer => 
        layer.id.includes('label') || layer.id.includes('text')
      );
      
      labelLayers.forEach(layer => {
        if (map.getLayer(layer.id)) {
          map.setPaintProperty(layer.id, 'text-color', themeColors.labels);
        }
      });
    }

    // Notify theme change
    if (window.mapEventBus) {
      window.mapEventBus.emit('style:themeChanged', {
        theme: this.currentTheme,
        colors: themeColors
      });
    }
  }

  // Color Application Methods
  applyColors() {
    if (!window.map) return;

    const map = window.map;
    Object.entries(this.customColors).forEach(([layerId, color]) => {
      if (map.getLayer(layerId)) {
        // Determine the appropriate paint property based on layer type
        const layer = map.getStyle().layers.find(l => l.id === layerId);
        if (!layer) return;

        switch (layer.type) {
          case 'fill':
            map.setPaintProperty(layerId, 'fill-color', color);
            break;
          case 'line':
            map.setPaintProperty(layerId, 'line-color', color);
            break;
          case 'symbol':
            map.setPaintProperty(layerId, 'text-color', color);
            break;
          case 'fill-extrusion':
            map.setPaintProperty(layerId, 'fill-extrusion-color', color);
            break;
          case 'circle':
            map.setPaintProperty(layerId, 'circle-color', color);
            break;
        }
      }
    });

    // Notify color change
    if (window.mapEventBus) {
      window.mapEventBus.emit('style:colorsChanged', {
        colors: this.customColors
      });
    }
  }

  // Effects Application Methods
  applyEffects() {
    if (!window.map) return;

    const map = window.map;
    const layers = map.getStyle().layers;

    layers.forEach(layer => {
      if (!map.getLayer(layer.id)) return;

      // Apply shadow effects
      if (this.visualEffects.shadows) {
        if (layer.type === 'fill-extrusion') {
          map.setPaintProperty(layer.id, 'fill-extrusion-opacity', 0.8);
          map.setPaintProperty(layer.id, 'fill-extrusion-vertical-gradient', true);
        }
      }

      // Apply highlight effects
      if (this.visualEffects.highlights) {
        if (layer.type === 'symbol') {
          map.setPaintProperty(layer.id, 'text-halo-width', 1);
          map.setPaintProperty(layer.id, 'text-halo-color', '#000000');
        }
      }

      // Apply transition effects
      if (this.visualEffects.transitions) {
        map.setPaintProperty(layer.id, 'transition-duration', 300);
      }
    });

    // Notify effects change
    if (window.mapEventBus) {
      window.mapEventBus.emit('style:effectsChanged', {
        effects: this.visualEffects
      });
    }
  }

  // Layer Style Application Methods
  applyLayerStyle(layerId) {
    if (!window.map) return;

    const map = window.map;
    const style = this.layerStyles.get(layerId);
    if (!style || !map.getLayer(layerId)) return;

    Object.entries(style).forEach(([property, value]) => {
      try {
        if (property.startsWith('layout-')) {
          map.setLayoutProperty(layerId, property.replace('layout-', ''), value);
        } else if (property.startsWith('paint-')) {
          map.setPaintProperty(layerId, property.replace('paint-', ''), value);
        }
      } catch (error) {
        console.warn(`Could not apply style property ${property} to layer ${layerId}:`, error);
      }
    });

    // Notify layer style change
    if (window.mapEventBus) {
      window.mapEventBus.emit('style:layerStyleChanged', {
        layerId,
        style
      });
    }
  }
}

// Create and export singleton instance
const styleManager = new StyleManager();
window.styleManager = styleManager; // Make available globally
export default styleManager; 