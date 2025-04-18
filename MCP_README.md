# MCP Server for Browser Automation with Playwright

This MCP (Multi-Channel Protocol) server integrates Playwright with Augment Agent to enable browser automation tasks.

## Setup

1. Install dependencies:
   ```bash
   npm install playwright express
   ```

2. Start the MCP server:
   ```bash
   npm run mcp
   ```

3. To run both your React app and the MCP server simultaneously:
   ```bash
   npm run dev
   ```

## API Endpoints

### `POST /run`

Execute browser automation tasks.

#### Request Body

```json
{
  "action": "captureLogs",
  "url": "http://localhost:3000",
  "options": {
    "headless": false,
    "waitTime": 5000,
    "takeScreenshot": true,
    "captureNetwork": true
  }
}
```

#### Supported Actions

1. **captureLogs**
   - Navigates to the specified URL and captures console logs
   - Options:
     - `headless`: Boolean (default: true) - Run browser in headless mode
     - `waitTime`: Number (default: 5000) - Time to wait for logs in milliseconds
     - `takeScreenshot`: Boolean - Whether to capture a screenshot
     - `captureNetwork`: Boolean - Whether to capture network requests
     - `timeout`: Number (default: 30000) - Navigation timeout in milliseconds

2. **interact**
   - Navigates to the specified URL and performs interactions
   - Options:
     - `headless`: Boolean (default: true) - Run browser in headless mode
     - `takeScreenshot`: Boolean - Whether to capture a screenshot
     - `getContent`: Boolean - Whether to return the page HTML content
     - `interactions`: Array of interaction objects:
       ```json
       [
         { "type": "click", "selector": "#button-id" },
         { "type": "type", "selector": "input[name=search]", "text": "search term" },
         { "type": "wait", "ms": 1000 }
       ]
       ```

## Testing

Run the test script to verify the MCP server is working correctly:

```bash
node test-mcp.js
```

## Integrating with Augment Agent

1. Configure the MCP server URL in Augment Agent settings
2. Use natural language to instruct Agent to perform browser tasks
3. Agent will forward commands to the MCP server, which executes them using Playwright

## Example Commands for Augment Agent

- "Launch Chromium, navigate to http://localhost:3000, and capture the console logs."
- "Open my React app and click the submit button, then take a screenshot."
- "Check if my app is displaying any errors in the console."
