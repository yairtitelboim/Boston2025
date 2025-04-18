const { chromium } = require('playwright');

/**
 * Test script to verify Parks layer toggle and scene functionality
 * with detailed logging and appropriate waits
 */
async function testParksScene() {
  console.log('=== STARTING PARKS LAYER SCENE TEST ===');
  
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
    
    // Add global debugging function for layer states
    window.debugLayerStates = function() {
      console.log('=== DEBUG LAYER STATES ===');
      
      // Check layerStateManager
      if (window.layerStateManager) {
        const states = window.layerStateManager.getAllLayerStates();
        console.log('layerStateManager states:', states);
        console.log('Parks layer state:', states.showParks);
      } else {
        console.log('layerStateManager not available');
      }
      
      // Check layerToggleManager
      if (window.layerToggleManager) {
        const states = window.layerToggleManager.getAllToggleStates();
        console.log('layerToggleManager states:', states);
        console.log('Parks layer state:', states.showParks);
      } else {
        console.log('layerToggleManager not available');
      }
      
      // Check SceneManager
      if (window.sceneManager) {
        console.log('SceneManager available');
      } else {
        console.log('SceneManager not available');
      }
      
      console.log('=== END DEBUG LAYER STATES ===');
    };
  });
  
  try {
    // STEP 1: Navigate to the app
    console.log('STEP 1: Navigating to the app...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    
    // Wait for the map to load
    console.log('Waiting for map to load...');
    await page.waitForSelector('.mapboxgl-canvas', { state: 'visible', timeout: 30000 });
    console.log('Map loaded successfully');
    
    // Wait for all components to initialize
    console.log('Waiting for components to initialize...');
    await page.waitForTimeout(5000);
    
    // Take a screenshot of the initial state
    await page.screenshot({ path: 'parks-initial-state.png' });
    
    // Debug initial layer states
    await page.evaluate(() => {
      console.log('Checking initial layer states...');
      if (window.debugLayerStates) {
        window.debugLayerStates();
      } else {
        console.log('debugLayerStates function not available');
      }
    });
    
    // STEP 2: Expand the layer menu if it's collapsed
    console.log('STEP 2: Expanding layer menu...');
    const expandButton = await page.$('button[title="Expand layer menu"]');
    if (expandButton) {
      await expandButton.click();
      console.log('Layer menu expanded');
      await page.waitForTimeout(1000);
    } else {
      console.log('Layer menu already expanded');
    }
    
    // Take a screenshot after expanding the menu
    await page.screenshot({ path: 'parks-menu-expanded.png' });
    
    // STEP 3: Scroll down to find the Parks layer
    console.log('STEP 3: Scrolling to find Parks layer...');
    await page.evaluate(() => {
      // Find the layer container
      const container = document.querySelector('.LayerToggleContainer');
      if (container) {
        // Scroll down in small increments to find the Parks layer
        const maxScrollTop = container.scrollHeight - container.clientHeight;
        const steps = 10;
        const increment = maxScrollTop / steps;
        
        console.log(`Layer container scroll height: ${container.scrollHeight}, client height: ${container.clientHeight}`);
        console.log(`Will scroll in ${steps} steps of ${increment}px each`);
        
        // Log all category headers for debugging
        const headers = Array.from(document.querySelectorAll('.CategoryHeader'));
        console.log(`Found ${headers.length} category headers:`);
        headers.forEach((header, index) => {
          console.log(`Header ${index}: ${header.textContent.trim()}`);
        });
        
        // Scroll down in increments
        for (let i = 0; i <= steps; i++) {
          const scrollTop = Math.min(i * increment, maxScrollTop);
          container.scrollTop = scrollTop;
          console.log(`Scrolled to ${scrollTop}px (${Math.round(scrollTop/maxScrollTop*100)}%)`);
        }
      } else {
        console.log('Layer container not found');
      }
    });
    
    // Wait for scrolling to complete
    await page.waitForTimeout(1000);
    
    // Take a screenshot after scrolling
    await page.screenshot({ path: 'parks-scrolled.png' });
    
    // STEP 4: Find and click the Parks layer toggle
    console.log('STEP 4: Finding Parks layer toggle...');
    
    // Find the Parks layer toggle by text content
    const parksToggle = await page.evaluate(() => {
      // Find all category headers
      const headers = Array.from(document.querySelectorAll('.CategoryHeader'));
      
      // Find the Parks header
      const parksHeader = headers.find(h => h.textContent.includes('Parks'));
      if (!parksHeader) {
        console.log('Parks header not found');
        return null;
      }
      
      console.log('Found Parks header:', parksHeader.textContent);
      
      // Find the checkbox
      const checkbox = parksHeader.querySelector('input[type="checkbox"]');
      if (!checkbox) {
        console.log('Parks checkbox not found');
        return null;
      }
      
      console.log('Found Parks checkbox, checked:', checkbox.checked);
      
      // Return the element info
      return {
        headerText: parksHeader.textContent.trim(),
        checkboxChecked: checkbox.checked,
        headerIndex: headers.indexOf(parksHeader)
      };
    });
    
    if (!parksToggle) {
      throw new Error('Parks toggle not found');
    }
    
    console.log(`Found Parks toggle: ${JSON.stringify(parksToggle)}`);
    
    // Click on the Parks toggle
    console.log('Clicking Parks toggle...');
    
    // Use the index to find the header again
    await page.evaluate((headerIndex) => {
      const headers = Array.from(document.querySelectorAll('.CategoryHeader'));
      const parksHeader = headers[headerIndex];
      if (parksHeader) {
        // Scroll the header into view
        parksHeader.scrollIntoView({ behavior: 'smooth', block: 'center' });
        console.log('Scrolled Parks header into view');
      }
    }, parksToggle.headerIndex);
    
    // Wait for scrolling to complete
    await page.waitForTimeout(1000);
    
    // Take a screenshot with Parks header in view
    await page.screenshot({ path: 'parks-header-in-view.png' });
    
    // Find the Parks toggle by text
    const parksHeader = await page.locator(`.CategoryHeader:has-text("${parksToggle.headerText}")`).first();
    await parksHeader.scrollIntoViewIfNeeded();
    
    // Find the checkbox within this header
    const parksCheckbox = await parksHeader.locator('input[type="checkbox"]').first();
    
    // Check initial state
    const initialParksState = await parksCheckbox.isChecked();
    console.log(`Initial Parks layer state: ${initialParksState ? 'ON' : 'OFF'}`);
    
    // STEP 5: Toggle Parks layer ON (if it's not already)
    console.log('STEP 5: Toggling Parks layer ON...');
    if (!initialParksState) {
      await parksCheckbox.click();
      console.log('Clicked Parks toggle to turn ON');
    } else {
      console.log('Parks layer is already ON');
    }
    
    // Wait for toggle to take effect
    await page.waitForTimeout(2000);
    
    // Verify Parks layer is ON
    const parksStateAfterToggle = await parksCheckbox.isChecked();
    console.log(`Parks layer state after toggle: ${parksStateAfterToggle ? 'ON' : 'OFF'}`);
    
    // Debug layer states after toggle
    await page.evaluate(() => {
      console.log('Checking layer states after toggle...');
      if (window.debugLayerStates) {
        window.debugLayerStates();
      }
    });
    
    // Take a screenshot with Parks layer ON
    await page.screenshot({ path: 'parks-layer-on.png' });
    
    // STEP 6: Open the Scenes panel
    console.log('STEP 6: Opening Scenes panel...');
    await page.click('text=Saved Scenes');
    await page.waitForTimeout(2000);
    
    // Take a screenshot with Scenes panel open
    await page.screenshot({ path: 'parks-scenes-panel.png' });
    
    // STEP 7: Save a scene with Parks layer ON
    const sceneNameParksOn = `Parks ON ${new Date().toISOString().replace(/:/g, '-')}`;
    console.log(`STEP 7: Saving scene with Parks ON: ${sceneNameParksOn}`);
    
    await page.fill('input[placeholder="Scene name"]', sceneNameParksOn);
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(2000);
    
    // Debug layer states after saving scene
    await page.evaluate((sceneName) => {
      console.log(`Checking layer states after saving scene "${sceneName}"...`);
      if (window.debugLayerStates) {
        window.debugLayerStates();
      }
      
      // Check if scene was saved
      const sceneElements = Array.from(document.querySelectorAll('.SceneItem'));
      const sceneNames = sceneElements.map(el => el.textContent);
      console.log('Available scenes:', sceneNames);
    }, sceneNameParksOn);
    
    // Take a screenshot after saving the scene
    await page.screenshot({ path: 'parks-scene-saved-on.png' });
    
    // STEP 8: Toggle Parks layer OFF
    console.log('STEP 8: Toggling Parks layer OFF...');
    await parksCheckbox.click();
    await page.waitForTimeout(2000);
    
    // Verify Parks layer is OFF
    const parksStateAfterToggleOff = await parksCheckbox.isChecked();
    console.log(`Parks layer state after toggle OFF: ${parksStateAfterToggleOff ? 'ON' : 'OFF'}`);
    
    // Debug layer states after toggle OFF
    await page.evaluate(() => {
      console.log('Checking layer states after toggle OFF...');
      if (window.debugLayerStates) {
        window.debugLayerStates();
      }
    });
    
    // Take a screenshot with Parks layer OFF
    await page.screenshot({ path: 'parks-layer-off.png' });
    
    // STEP 9: Save a scene with Parks layer OFF
    const sceneNameParksOff = `Parks OFF ${new Date().toISOString().replace(/:/g, '-')}`;
    console.log(`STEP 9: Saving scene with Parks OFF: ${sceneNameParksOff}`);
    
    await page.fill('input[placeholder="Scene name"]', sceneNameParksOff);
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(2000);
    
    // Debug layer states after saving second scene
    await page.evaluate((sceneName) => {
      console.log(`Checking layer states after saving scene "${sceneName}"...`);
      if (window.debugLayerStates) {
        window.debugLayerStates();
      }
      
      // Check if scene was saved
      const sceneElements = Array.from(document.querySelectorAll('.SceneItem'));
      const sceneNames = sceneElements.map(el => el.textContent);
      console.log('Available scenes:', sceneNames);
    }, sceneNameParksOff);
    
    // Take a screenshot after saving the second scene
    await page.screenshot({ path: 'parks-scene-saved-off.png' });
    
    // STEP 10: Load the first scene (Parks ON)
    console.log(`STEP 10: Loading scene with Parks ON: ${sceneNameParksOn}`);
    await page.click(`text="${sceneNameParksOn}"`);
    await page.waitForTimeout(3000); // Wait longer for the scene to load
    
    // Verify Parks layer is restored to ON
    const parksStateAfterLoadOn = await parksCheckbox.isChecked();
    console.log(`Parks layer state after loading ON scene: ${parksStateAfterLoadOn ? 'ON' : 'OFF'}`);
    
    // Debug layer states after loading first scene
    await page.evaluate((sceneName) => {
      console.log(`Checking layer states after loading scene "${sceneName}"...`);
      if (window.debugLayerStates) {
        window.debugLayerStates();
      }
    }, sceneNameParksOn);
    
    // Take a screenshot after loading the first scene
    await page.screenshot({ path: 'parks-scene-loaded-on.png' });
    
    // STEP 11: Load the second scene (Parks OFF)
    console.log(`STEP 11: Loading scene with Parks OFF: ${sceneNameParksOff}`);
    await page.click(`text="${sceneNameParksOff}"`);
    await page.waitForTimeout(3000); // Wait longer for the scene to load
    
    // Verify Parks layer is restored to OFF
    const parksStateAfterLoadOff = await parksCheckbox.isChecked();
    console.log(`Parks layer state after loading OFF scene: ${parksStateAfterLoadOff ? 'ON' : 'OFF'}`);
    
    // Debug layer states after loading second scene
    await page.evaluate((sceneName) => {
      console.log(`Checking layer states after loading scene "${sceneName}"...`);
      if (window.debugLayerStates) {
        window.debugLayerStates();
      }
    }, sceneNameParksOff);
    
    // Take a screenshot after loading the second scene
    await page.screenshot({ path: 'parks-scene-loaded-off.png' });
    
    // STEP 12: Final verification
    console.log('STEP 12: Final verification...');
    
    // Check if Parks layer was properly restored to OFF
    if (parksStateAfterLoadOff === false) {
      console.log('✅ SUCCESS: Parks layer was properly restored to OFF state');
    } else {
      console.error('❌ FAILED: Parks layer was not properly restored to OFF state');
    }
    
    // Load the ON scene again to verify it works in both directions
    console.log(`Loading scene with Parks ON again: ${sceneNameParksOn}`);
    await page.click(`text="${sceneNameParksOn}"`);
    await page.waitForTimeout(3000);
    
    // Verify Parks layer is restored to ON again
    const parksStateAfterLoadOnAgain = await parksCheckbox.isChecked();
    console.log(`Parks layer state after loading ON scene again: ${parksStateAfterLoadOnAgain ? 'ON' : 'OFF'}`);
    
    // Final verification
    if (parksStateAfterLoadOnAgain === true) {
      console.log('✅ SUCCESS: Parks layer was properly restored to ON state');
    } else {
      console.error('❌ FAILED: Parks layer was not properly restored to ON state');
    }
    
    console.log('\n=== TEST COMPLETED ===');
    console.log('Summary:');
    console.log(`- Initial Parks state: ${initialParksState ? 'ON' : 'OFF'}`);
    console.log(`- After toggle ON: ${parksStateAfterToggle ? 'ON' : 'OFF'}`);
    console.log(`- After toggle OFF: ${parksStateAfterToggleOff ? 'ON' : 'OFF'}`);
    console.log(`- After loading ON scene: ${parksStateAfterLoadOn ? 'ON' : 'OFF'}`);
    console.log(`- After loading OFF scene: ${parksStateAfterLoadOff ? 'ON' : 'OFF'}`);
    console.log(`- After loading ON scene again: ${parksStateAfterLoadOnAgain ? 'ON' : 'OFF'}`);
    
    // Final result
    if (parksStateAfterLoadOff === false && parksStateAfterLoadOnAgain === true) {
      console.log('\n✅ OVERALL TEST RESULT: PASSED');
    } else {
      console.log('\n❌ OVERALL TEST RESULT: FAILED');
    }
    
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
testParksScene().catch(console.error);
