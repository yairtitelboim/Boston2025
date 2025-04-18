// direct-playwright.js
const { chromium } = require('playwright');

async function toggleBostonBuildings() {
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
    await page.waitForTimeout(10000);
    console.log('Page loaded');

    // Wait for the map to initialize
    await page.waitForTimeout(5000);

    // Click the "Go to Boston" button using JavaScript evaluation
    console.log('Clicking "Go to Boston" button...');
    const buttonClicked = await page.evaluate(() => {
      const bostonButton = document.querySelector('button.mapboxgl-ctrl-boston');
      if (bostonButton) {
        console.log('Found Boston button, clicking it via JavaScript');
        bostonButton.click();
        return true;
      }
      console.log('Boston button not found');
      return false;
    });

    if (buttonClicked) {
      console.log('Clicked Boston button via JavaScript');
    } else {
      console.log('Failed to click Boston button');
    }

    // Wait for the map to zoom
    await page.waitForTimeout(3000);

    // Make sure the layer menu is expanded
    console.log('Ensuring layer menu is expanded...');
    const expandButton = await page.locator('button[title="Expand layer menu"]').first();
    if (await expandButton.isVisible()) {
      await expandButton.click();
      console.log('Expanded layer menu');
    } else {
      console.log('Expand button not visible or menu already expanded');
    }

    // Wait for the menu to expand
    await page.waitForTimeout(1000);

    // Find and scroll to the Boston Buildings section
    console.log('Finding Boston Buildings section...');

    // First, get the layer menu container
    const layerMenu = await page.locator('div[class*="LayerToggleContainer"]').first();

    // Scroll through the menu to find Boston Buildings
    let found = false;
    let maxScrollAttempts = 10;
    let scrollAttempt = 0;

    while (!found && scrollAttempt < maxScrollAttempts) {
      scrollAttempt++;
      console.log(`Scroll attempt ${scrollAttempt}/${maxScrollAttempts}`);

      // Scroll down in the menu
      await layerMenu.evaluate((el, scrollAttempt) => {
        el.scrollTop = scrollAttempt * 300; // Scroll by 300px each time
        return el.scrollTop;
      }, scrollAttempt);

      // Wait for the scroll to take effect
      await page.waitForTimeout(500);

      // Check if Boston Buildings is visible
      const bostonTitles = await page.locator('div[class*="CategoryTitle"]:has-text("Boston Buildings")').all();
      if (bostonTitles.length > 0) {
        console.log('Found Boston Buildings section');
        found = true;

        // Scroll to make it visible
        await bostonTitles[0].scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        // Find the parent section
        const section = await bostonTitles[0].locator('xpath=ancestor::div[contains(@class, "CategorySection")]').first();

        // Find the checkbox in this section
        const checkbox = await section.locator('input[type="checkbox"]').first();

        // Check if it's already checked
        const isChecked = await checkbox.isChecked();
        console.log('Checkbox is currently', isChecked ? 'checked' : 'unchecked');

        // Toggle if needed
        if (!isChecked) {
          await checkbox.click();
          console.log('Clicked checkbox to enable Boston Buildings');
        } else {
          console.log('Boston Buildings already enabled');
        }
      }
    }

    if (!found) {
      console.log('Could not find Boston Buildings section after multiple scroll attempts');
    }

    // Wait to see the result
    await page.waitForTimeout(5000);

    // Take a screenshot
    await page.screenshot({ path: 'result.png' });
    console.log('Screenshot saved to result.png');

    console.log('Script completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Run the function
toggleBostonBuildings()
  .then(result => {
    console.log('Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
