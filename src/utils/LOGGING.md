# Logging System Documentation

## Overview

This application uses a centralized logging system to control console output across different components. The system allows for:

1. Global log level control
2. Component-specific log level control
3. Different log levels for development and production environments
4. Consistent log formatting

## Log Levels

The system supports the following log levels (from least to most verbose):

- `NONE`: No logging
- `ERROR`: Only errors
- `WARN`: Errors and warnings
- `INFO`: Normal information (default in production)
- `DEBUG`: Detailed information (default in development)
- `VERBOSE`: Very detailed information

## Usage

### Basic Usage

Import the logger creator in your component:

```javascript
import { createLogger } from '../utils/logging';

// Create a logger for your component
const logger = createLogger('ComponentName');

// Use the logger methods
logger.error('This is an error message');
logger.warn('This is a warning message');
logger.info('This is an info message');
logger.debug('This is a debug message');
logger.verbose('This is a verbose message');
```

### Configuration

The logging system is configured in `src/utils/loggingConfig.js`. This file sets the global log level and component-specific log levels based on the environment.

To change the log level for a specific component, modify the `initializeLogging` function:

```javascript
// Set component-specific log levels
setComponentLogLevel('ComponentName', LOG_LEVELS.DEBUG);
```

## Benefits

- **Reduced Console Noise**: By controlling log levels, you can reduce the amount of console output in production.
- **Focused Debugging**: You can increase the log level for specific components during development.
- **Consistent Formatting**: All logs follow a consistent format with component name prefixes.
- **Environment Awareness**: Different log levels can be set for development and production.

## Best Practices

1. **Use Appropriate Log Levels**:
   - `error`: For errors that affect functionality
   - `warn`: For potential issues or deprecated features
   - `info`: For important state changes or events
   - `debug`: For detailed information useful during development
   - `verbose`: For very detailed tracing information

2. **Include Context**: When logging objects or arrays, include them as separate arguments:
   ```javascript
   logger.debug('User data:', userData);
   ```

3. **Avoid Expensive Operations**: For verbose logs that might include expensive operations, check the log level first:
   ```javascript
   if (logger.isVerboseEnabled()) {
     const expensiveData = calculateExpensiveData();
     logger.verbose('Expensive data:', expensiveData);
   }
   ```

4. **Group Related Logs**: Use console groups for related logs in development:
   ```javascript
   logger.groupCollapsed('Operation X');
   logger.debug('Step 1');
   logger.debug('Step 2');
   logger.groupEnd();
   ```
