/**
 * Logging configuration for the application
 * This file sets up the default logging levels for different components
 */

import { setLogLevel, setComponentLogLevel, LOG_LEVELS } from './logging';

// Set the global log level based on environment
const globalLogLevel = process.env.NODE_ENV === 'development'
  ? LOG_LEVELS.ERROR  // Only errors in development
  : LOG_LEVELS.NONE; // No logging in production

// Initialize logging with global level
export const initializeLogging = () => {
  // Set global log level
  setLogLevel(globalLogLevel);

  // Set component-specific log levels - only show errors for all components
  setComponentLogLevel('App', LOG_LEVELS.ERROR);
  setComponentLogLevel('SceneManager', LOG_LEVELS.ERROR);
  setComponentLogLevel('BostonBuildingsLayer', LOG_LEVELS.ERROR);
  setComponentLogLevel('LayerToggle', LOG_LEVELS.ERROR);
  setComponentLogLevel('POIDataBar', LOG_LEVELS.ERROR);
  setComponentLogLevel('OSMPOILayer', LOG_LEVELS.ERROR);
  setComponentLogLevel('MapComponent', LOG_LEVELS.ERROR);
};

export default { initializeLogging };
