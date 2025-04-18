/**
 * Centralized logging utility for the application
 * Controls logging output based on environment and log level
 */

// Log levels
export const LOG_LEVELS = {
  NONE: 0,    // No logging
  ERROR: 1,   // Only errors
  WARN: 2,    // Errors and warnings
  INFO: 3,    // Normal information (default in production)
  DEBUG: 4,   // Detailed information (default in development)
  VERBOSE: 5  // Very detailed information
};

// Default log level based on environment
const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'development'
  ? LOG_LEVELS.DEBUG
  : LOG_LEVELS.INFO;

// Current log level - can be changed at runtime
let currentLogLevel = DEFAULT_LOG_LEVEL;

// Component log level overrides
const componentLogLevels = {
  // Examples:
  // 'App': LOG_LEVELS.INFO,
  // 'SceneManager': LOG_LEVELS.WARN,
};

/**
 * Set the global log level
 * @param {number} level - The log level to set
 */
export const setLogLevel = (level) => {
  if (Object.values(LOG_LEVELS).includes(level)) {
    currentLogLevel = level;
    // Silent initialization - no logging
  } else {
    console.error(`Invalid log level: ${level}`);
  }
};

/**
 * Set the log level for a specific component
 * @param {string} component - The component name
 * @param {number} level - The log level to set
 */
export const setComponentLogLevel = (component, level) => {
  if (Object.values(LOG_LEVELS).includes(level)) {
    componentLogLevels[component] = level;
    // Silent initialization - no logging
  } else {
    console.error(`Invalid log level for component ${component}: ${level}`);
  }
};

/**
 * Get the name of a log level
 * @param {number} level - The log level
 * @returns {string} The name of the log level
 */
export const getLogLevelName = (level) => {
  return Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level) || 'UNKNOWN';
};

/**
 * Check if a message should be logged based on its level and component
 * @param {string} component - The component name
 * @param {number} level - The log level of the message
 * @returns {boolean} Whether the message should be logged
 */
const shouldLog = (component, level) => {
  const componentLevel = componentLogLevels[component];
  return level <= (componentLevel !== undefined ? componentLevel : currentLogLevel);
};

/**
 * Create a logger for a specific component
 * @param {string} component - The component name
 * @returns {Object} Logger object with methods for each log level
 */
export const createLogger = (component) => {
  return {
    error: (message, ...args) => {
      if (shouldLog(component, LOG_LEVELS.ERROR)) {
        console.error(`[${component}] ${message}`, ...args);
      }
    },

    warn: (message, ...args) => {
      if (shouldLog(component, LOG_LEVELS.WARN)) {
        console.warn(`[${component}] ${message}`, ...args);
      }
    },

    info: (message, ...args) => {
      if (shouldLog(component, LOG_LEVELS.INFO)) {
        console.log(`[${component}] ${message}`, ...args);
      }
    },

    debug: (message, ...args) => {
      if (shouldLog(component, LOG_LEVELS.DEBUG)) {
        console.log(`[${component}] ${message}`, ...args);
      }
    },

    verbose: (message, ...args) => {
      if (shouldLog(component, LOG_LEVELS.VERBOSE)) {
        console.log(`[${component}] ${message}`, ...args);
      }
    }
  };
};

// Export a default instance for quick access
export default {
  setLogLevel,
  setComponentLogLevel,
  createLogger,
  LOG_LEVELS
};
