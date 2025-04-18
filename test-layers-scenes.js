const { chromium } = require('playwright');

/**
 * Test script to verify layer toggle and scene functionality
 */
async function testLayersAndScenes() {
  console.log('Starting test for layers and scenes...');

  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the app
    console.log('Navigating to the app...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    // Wait for the map to load
    console.log('Waiting for map to load...');
    await page.waitForSelector('.mapboxgl-canvas', { state: 'visible', timeout: 30000 });
    console.log('Map loaded successfully');

    // Take a screenshot of the initial state
    await page.screenshot({ path: 'initial-state.png' });

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

    // Take a screenshot after expanding the menu
    await page.screenshot({ path: 'layer-menu-expanded.png' });

    // Define the layers we want to test with more reliable selectors
    const layers = [
      { name: 'Parks', selector: '.CategorySection:has-text("Parks") input[type="checkbox"]' },
      { name: 'Boston Buildings', selector: '.CategorySection:has-text("Boston Buildings") input[type="checkbox"]' },
      { name: 'OSM POIs', selector: '.CategorySection:has-text("OSM POIs") input[type="checkbox"]' }
    ];

    // Toggle all layers ON
    console.log('Toggling all test layers ON...');
    for (const layer of layers) {
      console.log(`Toggling ${layer.name} ON...`);

      // Find the checkbox directly
      const checkbox = await page.locator(layer.selector).first();
      await page.waitForTimeout(500); // Wait for UI to stabilize

      // Check if it's already on
      const isChecked = await checkbox.isChecked();
      console.log(`${layer.name} is currently ${isChecked ? 'ON' : 'OFF'}`);

      // Toggle if needed
      if (!isChecked) {
        await checkbox.click();
        console.log(`Clicked to turn ${layer.name} ON`);
        await page.waitForTimeout(1000); // Wait longer for the toggle to take effect
      }
    }

    // Take a screenshot with all layers ON
    await page.screenshot({ path: 'all-layers-on.png' });

    // Open the Scenes panel
    console.log('Opening Scenes panel...');
    await page.click('text=Saved Scenes');
    await page.waitForTimeout(1000);

    // Save a new scene
    const sceneName = `Test Scene ${new Date().toISOString().replace(/:/g, '-')}`;
    console.log(`Saving scene: ${sceneName}`);

    await page.fill('input[placeholder="Scene name"]', sceneName);
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Take a screenshot after saving the scene
    await page.screenshot({ path: 'scene-saved.png' });

    // Toggle all layers OFF
    console.log('Toggling all test layers OFF...');
    for (const layer of layers) {
      console.log(`Toggling ${layer.name} OFF...`);

      // Find the checkbox directly
      const checkbox = await page.locator(layer.selector).first();
      await page.waitForTimeout(500); // Wait for UI to stabilize

      // Check if it's on
      const isChecked = await checkbox.isChecked();
      console.log(`${layer.name} is currently ${isChecked ? 'ON' : 'OFF'}`);

      // Toggle if needed
      if (isChecked) {
        await checkbox.click();
        console.log(`Clicked to turn ${layer.name} OFF`);
        await page.waitForTimeout(1000); // Wait longer for the toggle to take effect
      }
    }

    // Take a screenshot with all layers OFF
    await page.screenshot({ path: 'all-layers-off.png' });

    // Load the saved scene
    console.log(`Loading scene: ${sceneName}`);
    await page.click(`text="${sceneName}"`);
    await page.waitForTimeout(3000); // Wait for the scene to load

    // Take a screenshot after loading the scene
    await page.screenshot({ path: 'scene-loaded.png' });

    // Verify all layers are restored to their original state (ON)
    console.log('Verifying layers are restored to ON state...');
    let allLayersRestored = true;

    for (const layer of layers) {
      // Find the checkbox directly
      const checkbox = await page.locator(layer.selector).first();
      await page.waitForTimeout(500); // Wait for UI to stabilize

      // Check if it's on
      const isChecked = await checkbox.isChecked();
      console.log(`${layer.name} is ${isChecked ? 'ON' : 'OFF'} after scene restoration`);

      if (!isChecked) {
        console.error(`❌ FAILED: ${layer.name} was not restored to ON state`);
        allLayersRestored = false;
      }
    }

    if (allLayersRestored) {
      console.log('✅ SUCCESS: All layers were properly restored to ON state');
    } else {
      console.error('❌ FAILED: Some layers were not properly restored');
    }

    // Test the reverse: save with layers off, then turn them on, then restore
    console.log('\nTesting the reverse scenario...');

    // Save a new scene with layers off
    const sceneNameReverse = `Test Scene Reverse ${new Date().toISOString().replace(/:/g, '-')}`;
    console.log(`Saving scene with layers OFF: ${sceneNameReverse}`);

    await page.fill('input[placeholder="Scene name"]', sceneNameReverse);
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Toggle all layers ON again
    console.log('Toggling all test layers ON again...');
    for (const layer of layers) {
      console.log(`Toggling ${layer.name} ON...`);

      // Find the checkbox directly
      const checkbox = await page.locator(layer.selector).first();
      await page.waitForTimeout(500); // Wait for UI to stabilize

      // Check if it's already on
      const isChecked = await checkbox.isChecked();
      console.log(`${layer.name} is currently ${isChecked ? 'ON' : 'OFF'}`);

      // Toggle if needed
      if (!isChecked) {
        await checkbox.click();
        console.log(`Clicked to turn ${layer.name} ON`);
        await page.waitForTimeout(1000); // Wait longer for the toggle to take effect
      }
    }

    // Take a screenshot with all layers ON again
    await page.screenshot({ path: 'all-layers-on-again.png' });

    // Load the saved scene (with layers off)
    console.log(`Loading scene with layers OFF: ${sceneNameReverse}`);
    await page.click(`text="${sceneNameReverse}"`);
    await page.waitForTimeout(3000); // Wait for the scene to load

    // Take a screenshot after loading the scene
    await page.screenshot({ path: 'scene-loaded-reverse.png' });

    // Verify all layers are restored to their saved state (OFF)
    console.log('Verifying layers are restored to OFF state...');
    let allLayersRestoredReverse = true;

    for (const layer of layers) {
      // Find the checkbox directly
      const checkbox = await page.locator(layer.selector).first();
      await page.waitForTimeout(500); // Wait for UI to stabilize

      // Check if it's off
      const isChecked = await checkbox.isChecked();
      console.log(`${layer.name} is ${isChecked ? 'ON' : 'OFF'} after scene restoration`);

      if (isChecked) {
        console.error(`❌ FAILED: ${layer.name} was not restored to OFF state`);
        allLayersRestoredReverse = false;
      }
    }

    if (allLayersRestoredReverse) {
      console.log('✅ SUCCESS: All layers were properly restored to OFF state');
    } else {
      console.error('❌ FAILED: Some layers were not properly restored');
    }

    console.log('\nTest completed!');

  } catch (error) {
    console.error('Test failed with error:', error);
    await page.screenshot({ path: 'error-state.png' });
  } finally {
    // Close browser
    await browser.close();
  }
}

// Run the test
testLayersAndScenes().catch(console.error);
