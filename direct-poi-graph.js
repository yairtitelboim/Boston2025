// direct-poi-graph.js
const { chromium } = require('playwright');

async function openPOIGraph() {
  console.log('Starting direct Playwright script...');

  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the app
    console.log('Navigating to the application...');
    await page.goto('http://localhost:3000', { timeout: 60000 });

    // Wait for the page to load without relying on networkidle
    console.log('Waiting for page to load...');
    await page.waitForTimeout(15000);
    console.log('Page loaded');

    // Wait for the map to initialize - just wait a bit longer instead of looking for a specific element
    console.log('Waiting for map to initialize...');
    await page.waitForTimeout(20000);
    console.log('Map should be initialized by now');

    // Look for the POI Graph toggle button
    console.log('Looking for POI Graph toggle button...');

    // Wait a bit more for all UI elements to load
    await page.waitForTimeout(5000);

    // Try to find the button by text content
    const poiButton = await page.getByText('Show POI Stats');

    if (await poiButton.count() > 0) {
      console.log('Found POI Graph toggle button, clicking it...');
      await poiButton.click();
      console.log('Clicked POI Graph toggle button');

      // Wait for the POI Graph to open
      console.log('Waiting for POI Graph to open...');
      await page.waitForTimeout(3000);

      // Check if the graph is visible
      const graphContainer = await page.$('div[class*="GraphContainer"]');
      if (graphContainer) {
        const isVisible = await graphContainer.isVisible();
        console.log('POI Graph visible:', isVisible);

        if (isVisible) {
          console.log('POI Graph opened successfully');

          // Take a screenshot
          await page.screenshot({ path: 'poi-graph-open.png' });
          console.log('Screenshot saved to poi-graph-open.png');

          // Wait to see the result
          await page.waitForTimeout(10000);

          return { success: true };
        } else {
          console.log('POI Graph container found but not visible');
          return { success: false, error: 'POI Graph not visible' };
        }
      } else {
        console.log('Could not find POI Graph container');
        return { success: false, error: 'POI Graph container not found' };
      }
    } else {
      console.log('Could not find POI Graph toggle button');

      // Take a screenshot to see what's on the page
      await page.screenshot({ path: 'page-state.png' });
      console.log('Screenshot saved to page-state.png');

      return { success: false, error: 'POI Graph toggle button not found' };
    }
  } catch (error) {
    console.error('Error:', error);

    // Take a screenshot on error
    try {
      await page.screenshot({ path: 'error-state.png' });
      console.log('Error screenshot saved to error-state.png');
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError);
    }

    return { success: false, error: error.message };
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Run the function
openPOIGraph()
  .then(result => {
    console.log('Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
