const { chromium } = require('playwright');

/**
 * Very simple script to find the Parks layer
 */
async function simpleParksLayerFinder() {
  console.log('Starting simple Parks layer finder...');

  // Launch browser
  const browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Start app
    console.log('1. Starting app...');
    await page.goto('http://localhost:3000');

    // 2. Wait for it to load
    console.log('2. Waiting for map to load...');
    await page.waitForSelector('.mapboxgl-canvas', { timeout: 30000 });
    console.log('Map loaded');

    // Take a screenshot
    await page.screenshot({ path: 'simple-initial.png' });

    // 3. Open Map Layers
    console.log('3. Opening Map Layers...');
    const expandButton = await page.$('button[title="Expand layer menu"]');
    if (expandButton) {
      await expandButton.click();
      console.log('Layer menu expanded');
    } else {
      console.log('Layer menu already expanded');
    }

    // Wait a moment
    await page.waitForTimeout(1000);

    // Take a screenshot
    await page.screenshot({ path: 'simple-menu-expanded.png' });

    // 4. Scroll down to find Parks Layer
    console.log('4. Scrolling to find Parks layer...');

    // Wait a moment for UI to stabilize
    await page.waitForTimeout(2000);

    // Take a screenshot before scrolling
    await page.screenshot({ path: 'simple-before-scroll.png' });

    // Log all elements on the page to see what's available
    console.log('Logging all elements with "layer" in class name...');
    const layerElements = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*'))
        .filter(el => el.className && el.className.toString().toLowerCase().includes('layer'))
        .map(el => ({
          tagName: el.tagName,
          className: el.className.toString(),
          id: el.id,
          text: el.textContent.substring(0, 50) + (el.textContent.length > 50 ? '...' : '')
        }));
    });

    console.log('Layer elements:', layerElements);

    // Try to find and scroll the layer container
    await page.evaluate(() => {
      // Try different selectors
      const selectors = [
        '.LayerToggleContainer',
        '.layer-toggle-container',
        '[class*="LayerToggle"]',
        '[class*="layer-toggle"]',
        // Add more potential selectors
        'div[class*="layer"][class*="container"]',
        'div[class*="Layer"][class*="Container"]'
      ];

      let container = null;

      // Try each selector
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          container = element;
          console.log(`Found container with selector: ${selector}`);
          break;
        }
      }

      // If still not found, try a more generic approach
      if (!container) {
        // Look for any scrollable container that might contain layer toggles
        const potentialContainers = Array.from(document.querySelectorAll('div'))
          .filter(div => {
            const style = window.getComputedStyle(div);
            return (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
                   div.scrollHeight > div.clientHeight;
          });

        console.log(`Found ${potentialContainers.length} scrollable containers`);

        if (potentialContainers.length > 0) {
          // Use the first scrollable container
          container = potentialContainers[0];
          console.log('Using first scrollable container as fallback');
        }
      }

      // Scroll the container if found
      if (container) {
        // Scroll in increments to see content as it appears
        const maxScroll = container.scrollHeight - container.clientHeight;
        const steps = 5;

        for (let i = 1; i <= steps; i++) {
          const scrollAmount = (maxScroll * i) / steps;
          container.scrollTop = scrollAmount;
          console.log(`Scrolled to ${scrollAmount}/${maxScroll} (${Math.round(i/steps*100)}%)`);
        }

        return true;
      }

      console.log('No suitable container found for scrolling');
      return false;
    });

    // Wait a moment after scrolling
    await page.waitForTimeout(2000);

    // Take a screenshot after scrolling
    await page.screenshot({ path: 'simple-scrolled.png' });

    // Log all text content on the page to find Parks
    console.log('Looking for any element containing "Parks"...');
    const parksElements = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*'))
        .filter(el => el.textContent && el.textContent.includes('Parks'))
        .map(el => ({
          tagName: el.tagName,
          className: el.className.toString(),
          id: el.id,
          text: el.textContent.trim().substring(0, 50) + (el.textContent.length > 50 ? '...' : ''),
          isVisible: el.offsetParent !== null
        }));
    });

    console.log('Elements containing "Parks":', parksElements);

    // Try to find visible Parks elements
    const visibleParksElements = parksElements.filter(el => el.isVisible);

    if (visibleParksElements.length > 0) {
      console.log(`Found ${visibleParksElements.length} visible elements containing "Parks"`);
      console.log('First visible Parks element:', visibleParksElements[0]);
    } else {
      console.log('No visible Parks elements found');
    }

    console.log('Simple Parks layer finder completed');

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'simple-error.png' });
  }

  // Keep browser open for inspection
  console.log('Browser will remain open for inspection. Press Ctrl+C to close.');
}

simpleParksLayerFinder().catch(console.error);
