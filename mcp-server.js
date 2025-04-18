// mcp-server.js
const express = require('express');
const { chromium } = require('playwright');
require('dotenv').config();

const app = express();
app.use(express.json());

// Root endpoint for health check
app.get('/', (req, res) => {
  res.json({
    status: 'MCP server is running',
    endpoints: {
      run: '/run - Execute browser actions'
    }
  });
});

// Endpoint to trigger browser actions
app.post('/run', async (req, res) => {
  const { action, url, options } = req.body;
  console.log(`Received request for action: ${action}, URL: ${url}`);

  try {
    if (action === 'captureLogs') {
      const browser = await chromium.launch({ headless: options?.headless !== false });
      const context = await browser.newContext();
      const page = await context.newPage();

      // Collect logs from the page console
      let logs = [];
      page.on('console', msg => {
        const logEntry = {
          type: msg.type(),
          text: msg.text(),
          timestamp: new Date().toISOString()
        };
        console.log(`Browser log: [${logEntry.type}] ${logEntry.text}`);
        logs.push(logEntry);
      });

      // Collect network requests if requested
      let requests = [];
      if (options?.captureNetwork) {
        page.on('request', request => {
          requests.push({
            url: request.url(),
            method: request.method(),
            resourceType: request.resourceType(),
            timestamp: new Date().toISOString()
          });
        });
      }

      // Navigate to the URL
      console.log(`Navigating to ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: options?.timeout || 30000 });

      // Wait for any logs or actions to complete
      const waitTime = options?.waitTime || 5000;
      console.log(`Waiting for ${waitTime}ms to collect logs`);
      await page.waitForTimeout(waitTime);

      // Take screenshot if requested
      let screenshot = null;
      if (options?.takeScreenshot) {
        screenshot = await page.screenshot({ type: 'jpeg', quality: 80 });
        screenshot = `data:image/jpeg;base64,${screenshot.toString('base64')}`;
      }

      await browser.close();
      console.log(`Browser closed, collected ${logs.length} logs`);

      return res.json({
        success: true,
        logs,
        requests: options?.captureNetwork ? requests : undefined,
        screenshot
      });
    }
    else if (action === 'interact') {
      // Handle interactive browser actions
      const browser = await chromium.launch({ headless: options?.headless !== false });
      const context = await browser.newContext();
      const page = await context.newPage();

      // Navigate to the URL with a more lenient strategy
      try {
        console.log(`Navigating to ${url} with domcontentloaded strategy`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: options?.timeout || 60000 });

        // Wait additional time after basic load
        const waitTime = options?.initialWaitTime || 10000;
        console.log(`Waiting additional ${waitTime}ms after basic page load`);
        await page.waitForTimeout(waitTime);
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Continue anyway - the page might be partially loaded
      }

      // Perform interactions if specified
      if (options?.interactions && Array.isArray(options.interactions)) {
        for (const interaction of options.interactions) {
          if (interaction.type === 'click' && interaction.selector) {
            await page.click(interaction.selector);
          } else if (interaction.type === 'type' && interaction.selector && interaction.text) {
            await page.fill(interaction.selector, interaction.text);
          } else if (interaction.type === 'wait' && interaction.ms) {
            await page.waitForTimeout(interaction.ms);
          } else if (interaction.type === 'evaluate' && interaction.script) {
            // Execute JavaScript in the page context
            const result = await page.evaluate(interaction.script);
            console.log(`Evaluated script result: ${result}`);
          }
        }
      }

      // Take screenshot after interactions
      let screenshot = null;
      if (options?.takeScreenshot) {
        screenshot = await page.screenshot({ type: 'jpeg', quality: 80 });
        screenshot = `data:image/jpeg;base64,${screenshot.toString('base64')}`;
      }

      // Get page content if requested
      const content = options?.getContent ? await page.content() : null;

      await browser.close();

      return res.json({
        success: true,
        screenshot,
        content
      });
    }
    else {
      return res.status(400).json({
        success: false,
        error: 'Unknown action',
        supportedActions: ['captureLogs', 'interact']
      });
    }
  } catch (error) {
    console.error('Error executing browser action:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

const PORT = process.env.MCP_PORT || 3002;
app.listen(PORT, () => {
  console.log(`MCP server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /         - Server info');
  console.log('  POST /run      - Execute browser actions');
});
