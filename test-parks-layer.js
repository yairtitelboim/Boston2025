const { chromium } = require('playwright');

/**
 * Test script to verify Parks layer toggle and scene functionality
 * with enhanced debugging
 */
async function testParksLayer() {
  console.log('Starting focused test for Parks layer and scenes...');

  // Launch browser with devtools open for inspection
  const browser = await chromium.launch({
    headless: false,
    devtools: true // Open DevTools for inspection
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Add console logging from the page to our Node.js console
  page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));

  // Add custom debugging to the page
  await page.addInitScript(() => {
    // Override console.log to add timestamps
    const originalLog = console.log;
    console.log = function(...args) {
      const timestamp = new Date().toISOString();
      originalLog.apply(console, [`[${timestamp}]`, ...args]);
    };

    // Add global debugging function
    window.debugLayerState = function(layerName) {
      console.log(`DEBUG ${layerName} LAYER STATE:`);

      // Check layerStateManager
      if (window.layerStateManager) {
        const states = window.layerStateManager.getAllLayerStates();
        console.log(`- layerStateManager state for ${layerName}:`,
          layerName === 'Parks' ? states.showParks :
          layerName === 'BostonBuildings' ? states.showBostonBuildings :
          'unknown');
      } else {
        console.log('- layerStateManager not available');
      }

      // Check layerToggleManager
      if (window.layerToggleManager) {
        const states = window.layerToggleManager.getAllToggleStates();
        console.log(`- layerToggleManager state for ${layerName}:`,
          layerName === 'Parks' ? states.showParks :
          layerName === 'BostonBuildings' ? states.showBostonBuildings :
          'unknown');
      } else {
        console.log('- layerToggleManager not available');
      }

      // Check DOM state using a more compatible approach
      try {
        // Find all category headers
        const categoryHeaders = Array.from(document.querySelectorAll('.CategoryHeader'));

        // Find the one containing the layer name
        const targetHeader = categoryHeaders.find(header =>
          header.textContent.includes(layerName));

        if (targetHeader) {
          // Find the checkbox within this header or its parent
          const checkbox = targetHeader.querySelector('input[type="checkbox"]') ||
                          targetHeader.parentElement.querySelector('input[type="checkbox"]');

          if (checkbox) {
            console.log(`- DOM state for ${layerName}:`, checkbox.checked);
          } else {
            console.log(`- DOM checkbox for ${layerName} not found in header`);
          }
        } else {
          console.log(`- DOM header for ${layerName} not found`);
        }
      } catch (error) {
        console.log(`- Error checking DOM state: ${error.message}`);
      }
    };
  });

  try {
    // Navigate to the app
    console.log('Navigating to the app...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    // Wait for the map to load
    console.log('Waiting for map to load...');
    await page.waitForSelector('.mapboxgl-canvas', { state: 'visible', timeout: 30000 });
    console.log('Map loaded successfully');

    // Take a screenshot of the initial state
    await page.screenshot({ path: 'parks-initial-state.png' });

    // Wait for layer toggles to be available
    await page.waitForTimeout(3000);

    // Expand the layer menu if it's collapsed
    console.log('Expanding layer menu if needed...');
    const expandButton = await page.$('button[title="Expand layer menu"]');
    if (expandButton) {
      await expandButton.click();
      console.log('Layer menu expanded');
      await page.waitForTimeout(1000);
    }

    // Debug initial state
    await page.evaluate(() => {
      console.log('INITIAL STATE:');
      window.debugLayerState('Parks');
      window.debugLayerState('BostonBuildings');
    });

    // Define the Parks layer selector using a more compatible approach with scrolling
    const parksSelector = async () => {
      console.log('Searching for Parks layer toggle...');

      // First, scroll through the layer menu to make sure all layers are visible
      const layerContainer = await page.$('.LayerToggleContainer');
      if (!layerContainer) {
        throw new Error('Layer toggle container not found');
      }

      // Scroll down in the layer menu to find the Parks toggle
      await page.evaluate(() => {
        // Find the layer container
        const container = document.querySelector('.LayerToggleContainer');
        if (container) {
          // Scroll to the bottom to ensure all layers are loaded
          container.scrollTop = container.scrollHeight;
          console.log(`Scrolled layer menu to bottom: ${container.scrollTop}/${container.scrollHeight}`);
        }
      });

      // Wait a bit for any lazy-loaded content
      await page.waitForTimeout(500);

      // Now try to find the Parks toggle
      console.log('Looking for Parks toggle after scrolling...');

      // Try to find by text content first
      const parksToggle = await page.evaluate(() => {
        // Find all category headers
        const headers = Array.from(document.querySelectorAll('.CategoryHeader'));
        console.log(`Found ${headers.length} category headers`);

        // Log all headers for debugging
        headers.forEach((header, index) => {
          console.log(`Header ${index}: ${header.textContent.trim()}`);
        });

        // Find the Parks header
        const parksHeader = headers.find(h => h.textContent.includes('Parks'));
        if (!parksHeader) {
          console.log('Parks header not found');
          return null;
        }

        console.log('Found Parks header:', parksHeader.textContent);

        // Find the checkbox
        const checkbox = parksHeader.querySelector('input[type="checkbox"]') ||
                        parksHeader.closest('.CategorySection').querySelector('input[type="checkbox"]');

        if (!checkbox) {
          console.log('Parks checkbox not found');
          return null;
        }

        console.log('Found Parks checkbox, checked:', checkbox.checked);

        // Return the element selector info so we can find it again
        return {
          headerText: parksHeader.textContent.trim(),
          checkboxChecked: checkbox.checked
        };
      });

      if (!parksToggle) {
        throw new Error('Parks toggle not found after scrolling');
      }

      console.log(`Found Parks toggle with header text: ${parksToggle.headerText}`);

      // Now click on the toggle using the text content
      const parksSection = await page.locator(`text=${parksToggle.headerText}`).first();
      await parksSection.scrollIntoViewIfNeeded();

      // Find the checkbox within this section
      const checkbox = await parksSection.locator('xpath=./ancestor::div[contains(@class, "CategorySection")]').locator('input[type="checkbox"]');

      // Take a screenshot to verify we found the right element
      await page.screenshot({ path: 'parks-toggle-found.png' });

      return checkbox;
    };

    // Get the Parks checkbox element
    const parksCheckbox = await parksSelector();

    // Check initial state of Parks layer
    const initialParksState = await parksCheckbox.isChecked();
    console.log(`Initial Parks layer state: ${initialParksState ? 'ON' : 'OFF'}`);

    // STEP 1: Toggle Parks layer ON (if it's not already)
    if (!initialParksState) {
      console.log('Toggling Parks layer ON...');
      await parksCheckbox.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('Parks layer is already ON');
    }

    // Verify Parks layer is ON
    const parksStateAfterToggle = await parksCheckbox.isChecked();
    console.log(`Parks layer state after toggle: ${parksStateAfterToggle ? 'ON' : 'OFF'}`);

    // Debug state after toggle
    await page.evaluate(() => {
      console.log('STATE AFTER TOGGLE:');
      window.debugLayerState('Parks');
    });

    // Take a screenshot with Parks layer ON
    await page.screenshot({ path: 'parks-layer-on.png' });

    // STEP 2: Open the Scenes panel
    console.log('Opening Scenes panel...');
    await page.click('text=Saved Scenes');
    await page.waitForTimeout(1000);

    // STEP 3: Save a scene with Parks layer ON
    const sceneNameParksOn = `Parks ON ${new Date().toISOString().replace(/:/g, '-')}`;
    console.log(`Saving scene with Parks ON: ${sceneNameParksOn}`);

    await page.fill('input[placeholder="Scene name"]', sceneNameParksOn);
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Debug state after saving scene
    await page.evaluate((sceneName) => {
      console.log(`STATE AFTER SAVING SCENE "${sceneName}":`);
      window.debugLayerState('Parks');
    }, sceneNameParksOn);

    // Take a screenshot after saving the scene
    await page.screenshot({ path: 'parks-scene-saved-on.png' });

    // STEP 4: Toggle Parks layer OFF
    console.log('Toggling Parks layer OFF...');
    // Get a fresh reference to the Parks checkbox
    const parksCheckboxOff = await parksSelector();
    await parksCheckboxOff.click();
    await page.waitForTimeout(1000);

    // Verify Parks layer is OFF
    const parksStateAfterToggleOff = await parksCheckboxOff.isChecked();
    console.log(`Parks layer state after toggle OFF: ${parksStateAfterToggleOff ? 'ON' : 'OFF'}`);

    // Debug state after toggle OFF
    await page.evaluate(() => {
      console.log('STATE AFTER TOGGLE OFF:');
      window.debugLayerState('Parks');
    });

    // Take a screenshot with Parks layer OFF
    await page.screenshot({ path: 'parks-layer-off.png' });

    // STEP 5: Save a scene with Parks layer OFF
    const sceneNameParksOff = `Parks OFF ${new Date().toISOString().replace(/:/g, '-')}`;
    console.log(`Saving scene with Parks OFF: ${sceneNameParksOff}`);

    await page.fill('input[placeholder="Scene name"]', sceneNameParksOff);
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Debug state after saving second scene
    await page.evaluate((sceneName) => {
      console.log(`STATE AFTER SAVING SCENE "${sceneName}":`);
      window.debugLayerState('Parks');
    }, sceneNameParksOff);

    // Take a screenshot after saving the second scene
    await page.screenshot({ path: 'parks-scene-saved-off.png' });

    // STEP 6: Load the first scene (Parks ON)
    console.log(`Loading scene with Parks ON: ${sceneNameParksOn}`);
    await page.click(`text="${sceneNameParksOn}"`);
    await page.waitForTimeout(3000); // Wait longer for the scene to load

    // Verify Parks layer is restored to ON
    const parksCheckboxAfterLoadOn = await parksSelector();
    const parksStateAfterLoadOn = await parksCheckboxAfterLoadOn.isChecked();
    console.log(`Parks layer state after loading ON scene: ${parksStateAfterLoadOn ? 'ON' : 'OFF'}`);

    // Debug state after loading first scene
    await page.evaluate((sceneName) => {
      console.log(`STATE AFTER LOADING SCENE "${sceneName}":`);
      window.debugLayerState('Parks');
    }, sceneNameParksOn);

    // Take a screenshot after loading the first scene
    await page.screenshot({ path: 'parks-scene-loaded-on.png' });

    // STEP 7: Load the second scene (Parks OFF)
    console.log(`Loading scene with Parks OFF: ${sceneNameParksOff}`);
    await page.click(`text="${sceneNameParksOff}"`);
    await page.waitForTimeout(3000); // Wait longer for the scene to load

    // Verify Parks layer is restored to OFF
    const parksCheckboxAfterLoadOff = await parksSelector();
    const parksStateAfterLoadOff = await parksCheckboxAfterLoadOff.isChecked();
    console.log(`Parks layer state after loading OFF scene: ${parksStateAfterLoadOff ? 'ON' : 'OFF'}`);

    // Debug state after loading second scene
    await page.evaluate((sceneName) => {
      console.log(`STATE AFTER LOADING SCENE "${sceneName}":`);
      window.debugLayerState('Parks');
    }, sceneNameParksOff);

    // Take a screenshot after loading the second scene
    await page.screenshot({ path: 'parks-scene-loaded-off.png' });

    // STEP 8: Final verification
    if (parksStateAfterLoadOff === false) {
      console.log('✅ SUCCESS: Parks layer was properly restored to OFF state');
    } else {
      console.error('❌ FAILED: Parks layer was not properly restored to OFF state');
    }

    console.log('\nTest completed!');

  } catch (error) {
    console.error('Test failed with error:', error);
    await page.screenshot({ path: 'parks-error-state.png' });
  } finally {
    // Keep the browser open for inspection
    console.log('Browser will remain open for inspection. Press Ctrl+C to close.');
    // Uncomment the line below to close the browser automatically
    // await browser.close();
  }
}

// Run the test
testParksLayer().catch(console.error);
