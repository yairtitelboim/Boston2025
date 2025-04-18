/**
 * Utility to suppress React development warnings
 * This is useful for reducing console noise during development
 */

// Store the original console methods
const originalConsole = {
  error: console.error,
  warn: console.warn,
  log: console.log
};

// List of warning messages to suppress
const suppressPatterns = [
  // Mock response and logging initialization
  'Mock response structure:',
  'Global log level set to:',
  'Log level for',

  // React prop warnings
  'Warning: React does not recognize the',
  'Warning: Invalid prop',
  'Warning: Unknown prop',

  // App.js logs
  'App:',
  'App ',
  'Setting articles',
  'Component function called',
  'fetchArticles called',
  'Skipping fetch due to',
  'Proceeding with fetchArticles',
  'Sending GET request',
  'Received response from',
  'Setting isLoading to false',
  'useEffect triggered',
  'Closing popup',
  'handleArticleUpdate called',
  'Articles updated',
  'Rendering App component',
  // Styled-components warnings
  'styled-components: it looks like an unknown prop',
  // Mapbox warnings
  '[Violation] Added non-passive event listener',
  'Consider marking event handler as \'passive\'',
  'https://www.chromestatus.com/feature/5745543795965952',
  // Common initialization errors
  'Error: layers.miami-pois: missing required property "source"',
  'Error: Layer with id "miami-pois" already exists on this map',
  'Road particles source created',
  'Road particles layer created',
  'Road particles throttle set to level',
  // POI errors during initialization
  'Error removing map layers during cleanup',
  'Error in building highlight process',

  // BostonBuildingsLayer logs
  'BostonBuildingsLayer:',
  'BostonBuildingsLayer ',
  'Starting Initialization',
  'Map loaded',
  'Checking GeoJSON file',
  'GeoJSON file exists',
  'Adding GeoJSON source',
  'Source loaded with',
  'No features found in source',
  'Adding layers',
  'Initial visibility is',
  'Successfully initialized with visibility',
  'Found building types',
  'Visibility effect triggered',
  'Visibility changed to',
  'Map not available, cannot change visibility',
  'Layers not loaded yet',
  'updateLayerVisibility',
  'Skipping color update',
  'Starting color update with visible categories',
  'Category to building types mapping',
  'Processing category',
  'Adding color case for building type',
  'Applying color expression',
  'Current color expression',
  'Successfully updated building colors',
  // Map not available warnings
  'Map not available for toggling',
  'Cannot read properties of undefined',

  // OSMPOILayer logs
  'OSMPOILayer:',
  'OSMPOILayer ',
  'Category visibility update',
  'Map not available',

  // SceneManager logs
  'SceneManager:',
  'SceneManager ',
  'Exposing SceneManager methods globally',
  'SceneManager unmounting',
  'Loading scene via global',
  'Scene loaded successfully',
  'Looking for scene by name',
  'Found scene with',
  'Moving from scene at index',
  'Scene clicked',
  'Map style not fully loaded yet',
  'Map style now loaded',
  'Scene Boston Buildings state',
  'Camera values being applied',
  'Scene updated successfully',
  'Scene deleted successfully',
  'Scene name updated successfully',

  // Map component logs
  'Map: Setting up POI selection handler',
  'Map: POI selection handler set up',
  'Map: Setting up POI selection event listener',
  'Map: Setting up category visibility handler',
  'Map: BostonBuildingsLayer props updated',
  'Map: Cleaning up POI selection handler',
  'Map: Received category visibility update',
  'Map: Resized after POI Graph visibility change',
  'Map: POI Graph visibility changed',
  'Panel collapse state changed to',
  'Panel should be',
  'Forcing initial panel collapse',
  'POIGraph: Processed POIs',
  'POIGraph: Received OSM features',

  // POIDataBar logs
  'POIDataBar:',
  'POIDataBar ',
  'Updating POI counts',
  'Querying visible POI layers',
  'Found',
  'total visible POI features',
  'Total 0 POIs for',
  'combined OSM and Mapbox',
  'Significant count mismatch detected',
  'Applying adjustment factor',
  'Total POIs across all categories',
  'Count discrepancy remains',
  'Categories reordered based on counts',
  'Highlighting POIs for',
  'buildings highlighted',
  'success rate',
  'highlightBuildingAtLocation',
  'For coordinates',
  'Found building layer'
];

/**
 * Suppress specific console warnings and errors
 * @param {boolean} enable - Whether to enable suppression
 */
export const suppressWarnings = (enable = true) => {
  if (!enable) {
    // Restore original console methods
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.log = originalConsole.log;
    return;
  }

  // Override console.error to filter out specific React warnings
  console.error = (...args) => {
    // Special handling for errors with stack traces
    if (args.length > 0) {
      // Check if it's a string message
      if (typeof args[0] === 'string') {
        // Check if the message matches any of our suppression patterns
        if (suppressPatterns.some(pattern => args[0].includes(pattern))) {
          // Suppress this warning
          return;
        }
      }

      // Check for Error objects with specific messages
      if (args[0] instanceof Error) {
        const errorMessage = args[0].message || '';
        const errorStack = args[0].stack || '';

        // Check if the error message or stack trace matches any of our suppression patterns
        if (suppressPatterns.some(pattern =>
            errorMessage.includes(pattern) ||
            errorStack.includes(pattern))) {
          // Suppress this error
          return;
        }

        // Specific checks for the errors you want to suppress
        if (errorMessage.includes('layers.miami-pois: missing required property') ||
            errorMessage.includes('Layer with id "miami-pois" already exists')) {
          // Suppress these specific Mapbox errors
          return;
        }
      }
    }

    // Pass through to original console.error for other messages
    originalConsole.error(...args);
  };

  // Override console.warn to filter out specific warnings
  console.warn = (...args) => {
    if (args.length > 0) {
      // Check if it's a string message
      if (typeof args[0] === 'string') {
        // Check if the message matches any of our suppression patterns
        if (suppressPatterns.some(pattern => args[0].includes(pattern))) {
          // Suppress this warning
          return;
        }
      }

      // Check for Warning objects with specific messages
      if (args[0] instanceof Error) {
        const warningMessage = args[0].message || '';

        // Check if the warning message matches any of our suppression patterns
        if (suppressPatterns.some(pattern => warningMessage.includes(pattern))) {
          // Suppress this warning
          return;
        }
      }

      // Special handling for browser violations (like passive event listener warnings)
      if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('[Violation]')) {
        // Suppress all browser violation warnings
        return;
      }
    }
    // Pass through to original console.warn for other messages
    originalConsole.warn(...args);
  };

  // Override console.log to filter out specific logs
  console.log = (...args) => {
    if (args.length > 0) {
      // Check if it's a string message
      if (typeof args[0] === 'string') {
        // Check if the message matches any of our suppression patterns
        if (suppressPatterns.some(pattern => args[0].includes(pattern))) {
          // Suppress this log
          return;
        }

        // Specific checks for the logs you want to suppress
        if (args[0].includes('Road particles source created') ||
            args[0].includes('Road particles layer created') ||
            args[0].includes('Road particles throttle set to level') ||
            args[0].includes('Mock response structure:') ||
            args[0].includes('Global log level set to:') ||
            args[0].includes('Log level for') ||
            args[0].includes('Map: POI Graph visibility changed') ||
            args[0].includes('POIGraph: Received OSM features')) {
          // Suppress these specific logs
          return;
        }
      }
    }
    // Pass through to original console.log for other messages
    originalConsole.log(...args);
  };
};

export default suppressWarnings;
