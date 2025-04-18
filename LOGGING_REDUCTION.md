# Logging Reduction Implementation

## Overview

This document outlines the changes made to reduce excessive logging in the Mapbox application. The implementation includes a centralized logging system with configurable log levels and a warning suppression utility.

## Files Created

1. **src/utils/logging.js**
   - Centralized logging utility with support for different log levels
   - Component-specific log level control
   - Methods for each log level (error, warn, info, debug, verbose)

2. **src/utils/loggingConfig.js**
   - Configuration for global and component-specific log levels
   - Set to ERROR level for all components to minimize logging

3. **src/utils/suppressWarnings.js**
   - Utility to suppress specific React warnings and errors
   - Filters out common warnings related to props, styled-components, and Mapbox

4. **src/utils/LOGGING.md**
   - Documentation for the logging system
   - Usage examples and best practices

## Files Modified

1. **src/index.js**
   - Added initialization of the logging system
   - Added warning suppression

2. **src/App.js**
   - Replaced direct console.log calls with logger methods
   - Categorized logs by severity

3. **src/components/Map/components/SceneManager.jsx**
   - Replaced direct console.log calls with logger methods
   - Reduced verbosity of scene management logs

4. **src/components/Map/components/BostonBuildingsLayer.jsx**
   - Replaced direct console.log calls with logger methods
   - Reduced verbosity of building layer initialization and updates

5. **src/components/Map/index.jsx**
   - Removed inline console.log statements for BostonBuildingsLayer

## Key Features

1. **Centralized Logging Control**
   - Global log level setting (ERROR in development, NONE in production)
   - Component-specific log level overrides
   - Consistent log format across the application

2. **Warning Suppression**
   - Filters out common React warnings about props
   - Suppresses styled-components warnings
   - Hides Mapbox initialization errors and warnings
   - Removes POI-related error messages during initialization
   - Handles error objects with stack traces
   - Specifically targets 'miami-pois' layer errors
   - Suppresses 'Road particles' creation messages

3. **Performance Optimization**
   - Reduced console output in both development and production
   - Minimal overhead from logging operations

## Usage

The logging system and warning suppression are automatically initialized in `src/index.js`. No additional configuration is needed for basic usage.

### Customizing Log Levels

To adjust log levels for specific components, modify `src/utils/loggingConfig.js`:

```javascript
// Example: Allow more verbose logging for a specific component
setComponentLogLevel('ComponentName', LOG_LEVELS.DEBUG);
```

### Customizing Warning Suppression

To modify which warnings are suppressed, edit the `suppressPatterns` array in `src/utils/suppressWarnings.js`:

```javascript
// Example: Add a new pattern to suppress
suppressPatterns.push('Your warning pattern here');
```

### Temporarily Disabling Warning Suppression

For debugging purposes, you can temporarily disable warning suppression:

```javascript
// In your code or browser console
import suppressWarnings from './utils/suppressWarnings';
suppressWarnings(false); // Restore original console behavior
```

## Benefits

1. **Cleaner Console Output**
   - Significantly reduced noise in the browser console
   - Important messages are more visible
   - Easier debugging experience

2. **Better Performance**
   - Reduced overhead from excessive logging
   - Fewer DOM updates from console operations

3. **Improved Developer Experience**
   - Focus on relevant messages
   - Customizable logging levels for different components
   - Documentation for logging best practices
