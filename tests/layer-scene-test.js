// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Test to verify that layer states are properly saved and restored in scenes
 */
test('Layer states are properly saved and restored in scenes', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:3000');
  
  // Wait for the map to load
  await page.waitForSelector('.mapboxgl-canvas', { state: 'visible', timeout: 30000 });
  console.log('Map loaded');
  
  // Wait a bit for all layers to initialize
  await page.waitForTimeout(3000);
  
  // Expand the layer menu if it's collapsed
  const expandButton = await page.$('.LayerToggleContainer button[title="Expand layer menu"]');
  if (expandButton) {
    await expandButton.click();
    console.log('Expanded layer menu');
  }
  
  // Define the layers we want to test
  const layers = [
    { name: 'Parks', selector: 'input[type="checkbox"][aria-label="Toggle Parks"]' },
    { name: 'Boston Buildings', selector: 'input[type="checkbox"][aria-label="Toggle Boston Buildings"]' },
    { name: 'Mapbox 3D Buildings', selector: 'input[type="checkbox"][aria-label="Toggle Mapbox 3D Buildings"]' },
    { name: 'OSM POIs', selector: 'input[type="checkbox"][aria-label="Toggle OSM POIs"]' }
  ];
  
  // Set up initial layer states
  console.log('Setting up initial layer states');
  const initialStates = {};
  
  for (const layer of layers) {
    // Get the current state
    const checkbox = await page.$(layer.selector);
    const isChecked = await checkbox.isChecked();
    initialStates[layer.name] = isChecked;
    
    // Set to a known state (toggle if needed)
    if (!isChecked) {
      console.log(`Turning on ${layer.name}`);
      await checkbox.click();
      await page.waitForTimeout(500); // Wait for the toggle to take effect
    } else {
      console.log(`${layer.name} is already on`);
    }
  }
  
  // Verify all layers are on
  for (const layer of layers) {
    const checkbox = await page.$(layer.selector);
    const isChecked = await checkbox.isChecked();
    console.log(`${layer.name} is ${isChecked ? 'on' : 'off'}`);
    expect(isChecked).toBeTruthy();
  }
  
  // Open the Scenes panel
  console.log('Opening Scenes panel');
  const scenesButton = await page.$('text="Saved Scenes"');
  await scenesButton.click();
  await page.waitForTimeout(1000);
  
  // Save a new scene
  const sceneName = `Test Scene ${new Date().toISOString()}`;
  console.log(`Saving scene: ${sceneName}`);
  
  await page.fill('input[placeholder="Scene name"]', sceneName);
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(1000);
  
  // Toggle all layers off
  console.log('Toggling all layers off');
  for (const layer of layers) {
    const checkbox = await page.$(layer.selector);
    await checkbox.click();
    await page.waitForTimeout(500);
  }
  
  // Verify all layers are off
  for (const layer of layers) {
    const checkbox = await page.$(layer.selector);
    const isChecked = await checkbox.isChecked();
    console.log(`${layer.name} is ${isChecked ? 'on' : 'off'}`);
    expect(isChecked).toBeFalsy();
  }
  
  // Load the saved scene
  console.log(`Loading scene: ${sceneName}`);
  await page.click(`text="${sceneName}"`);
  await page.waitForTimeout(2000); // Wait for the scene to load
  
  // Verify all layers are restored to their original state (on)
  for (const layer of layers) {
    const checkbox = await page.$(layer.selector);
    const isChecked = await checkbox.isChecked();
    console.log(`${layer.name} is ${isChecked ? 'on' : 'off'}`);
    expect(isChecked).toBeTruthy();
  }
  
  // Test the reverse: save with layers off, then turn them on, then restore
  console.log('Testing the reverse scenario');
  
  // Save a new scene with layers off
  const sceneNameReverse = `Test Scene Reverse ${new Date().toISOString()}`;
  console.log(`Saving scene with layers off: ${sceneNameReverse}`);
  
  await page.fill('input[placeholder="Scene name"]', sceneNameReverse);
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(1000);
  
  // Toggle all layers on
  console.log('Toggling all layers on');
  for (const layer of layers) {
    const checkbox = await page.$(layer.selector);
    await checkbox.click();
    await page.waitForTimeout(500);
  }
  
  // Verify all layers are on
  for (const layer of layers) {
    const checkbox = await page.$(layer.selector);
    const isChecked = await checkbox.isChecked();
    console.log(`${layer.name} is ${isChecked ? 'on' : 'off'}`);
    expect(isChecked).toBeTruthy();
  }
  
  // Load the saved scene (with layers off)
  console.log(`Loading scene with layers off: ${sceneNameReverse}`);
  await page.click(`text="${sceneNameReverse}"`);
  await page.waitForTimeout(2000); // Wait for the scene to load
  
  // Verify all layers are restored to their saved state (off)
  for (const layer of layers) {
    const checkbox = await page.$(layer.selector);
    const isChecked = await checkbox.isChecked();
    console.log(`${layer.name} is ${isChecked ? 'on' : 'off'}`);
    expect(isChecked).toBeFalsy();
  }
  
  console.log('Test completed successfully');
});
