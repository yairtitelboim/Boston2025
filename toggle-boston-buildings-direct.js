// toggle-boston-buildings-direct.js
const { chromium } = require('playwright');

async function toggleBostonBuildings() {
  console.log('Starting Boston Buildings toggle script...');

  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the app
    console.log('Navigating to the application...');
    await page.goto('http://localhost:3000', { timeout: 60000 });
    // Wait for the page to load
    await page.waitForTimeout(10000);
    console.log('Page loaded');

    // Make sure the layer menu is expanded
    console.log('Ensuring layer menu is expanded...');
    const expandButton = await page.locator('button[title="Expand layer menu"]').first();
    if (await expandButton.isVisible()) {
      // Use JavaScript to click the button to avoid any interception issues
      await page.evaluate(() => {
        const button = document.querySelector('button[title="Expand layer menu"]');
        if (button) button.click();
      });
      console.log('Expanded layer menu');
      await page.waitForTimeout(1000);
    } else {
      console.log('Expand button not visible or menu already expanded');
    }

    // Use JavaScript to find and click the Boston Buildings toggle
    console.log('Looking for Boston Buildings toggle...');
    const result = await page.evaluate(() => {
      // Function to scroll the layer menu and find Boston Buildings
      function findBostonBuildingsToggle() {
        // Get all category titles
        const allTitles = Array.from(document.querySelectorAll('div[class*="CategoryTitle"]'));
        console.log('Found titles:', allTitles.map(el => el.textContent));

        // Find the Boston Buildings title
        const bostonTitle = allTitles.find(el => el.textContent.includes('Boston Buildings'));
        if (bostonTitle) {
          console.log('Found Boston Buildings title');
          return bostonTitle;
        }
        return null;
      }

      // Get the layer menu container - try multiple approaches
      let layerMenu = document.querySelector('div[class*="LayerToggleContainer"]');

      // If not found, try other selectors
      if (!layerMenu) {
        console.log('Layer menu not found with class name, trying alternative selectors');

        // Try to find by role or other attributes
        const possibleMenus = [
          ...document.querySelectorAll('div[role="menu"]'),
          ...document.querySelectorAll('div.layer-menu'),
          ...document.querySelectorAll('div[class*="layer"][class*="menu"]'),
          ...document.querySelectorAll('div[class*="Layer"][class*="Menu"]'),
          ...document.querySelectorAll('div[class*="Map"] > div:not([class*="mapboxgl"])')
        ];

        console.log(`Found ${possibleMenus.length} potential menu elements`);

        // If we found potential menus, use the first one
        if (possibleMenus.length > 0) {
          layerMenu = possibleMenus[0];
        }
      }

      // If still not found, try to find any element that might contain layer toggles
      if (!layerMenu) {
        console.log('Still no layer menu found, looking for any element with toggles');

        // Look for elements with checkboxes that might be the layer menu
        const elementsWithCheckboxes = Array.from(document.querySelectorAll('div'))
          .filter(div => div.querySelectorAll('input[type="checkbox"]').length > 0);

        console.log(`Found ${elementsWithCheckboxes.length} elements with checkboxes`);

        // Use the element with the most checkboxes as it's likely the layer menu
        if (elementsWithCheckboxes.length > 0) {
          layerMenu = elementsWithCheckboxes.sort((a, b) =>
            b.querySelectorAll('input[type="checkbox"]').length -
            a.querySelectorAll('input[type="checkbox"]').length
          )[0];
        }
      }

      // If we still can't find the menu, look for Boston Buildings directly
      if (!layerMenu) {
        console.log('Layer menu not found, looking for Boston Buildings directly');

        // Try to find any element containing "Boston Buildings" text
        const bostonElements = Array.from(document.querySelectorAll('*'))
          .filter(el => el.textContent && el.textContent.includes('Boston Buildings'));

        console.log(`Found ${bostonElements.length} elements containing 'Boston Buildings' text`);

        if (bostonElements.length > 0) {
          // Try to find a checkbox near these elements
          for (const el of bostonElements) {
            // Look for a checkbox in the parent elements
            let current = el;
            let found = false;

            // Go up to 5 levels up to find a checkbox
            for (let i = 0; i < 5; i++) {
              if (!current) break;

              const checkbox = current.querySelector('input[type="checkbox"]');
              if (checkbox) {
                console.log('Found checkbox near Boston Buildings text');
                checkbox.click();
                found = true;
                break;
              }

              current = current.parentElement;
            }

            if (found) {
              return { success: true, action: 'direct-toggle' };
            }
          }
        }

        return { success: false, reason: 'menu-not-found' };
      }

      // Scroll to the bottom of the menu to make sure all items are loaded
      layerMenu.scrollTop = layerMenu.scrollHeight;
      console.log('Scrolled to bottom of layer menu');

      // Wait a bit for rendering and then look for Boston Buildings
      return new Promise(resolve => {
        setTimeout(() => {
          const bostonTitle = findBostonBuildingsToggle();

          if (!bostonTitle) {
            resolve({ success: false, reason: 'title-not-found' });
            return;
          }

          // Find the parent section
          const section = bostonTitle.closest('div[class*="CategorySection"]');
          if (!section) {
            resolve({ success: false, reason: 'section-not-found' });
            return;
          }

          // Scroll the title into view
          bostonTitle.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Wait for the scroll to complete
          setTimeout(() => {
            // Find the checkbox in this section
            const checkbox = section.querySelector('input[type="checkbox"]');
            if (!checkbox) {
              resolve({ success: false, reason: 'checkbox-not-found' });
              return;
            }

            // Check if it's already checked
            const isChecked = checkbox.checked;
            console.log('Checkbox is currently', isChecked ? 'checked' : 'unchecked');

            // Click the checkbox if it's not already checked
            if (!isChecked) {
              checkbox.click();
              console.log('Clicked checkbox');
              resolve({ success: true, action: 'toggled-on' });
            } else {
              console.log('Checkbox already checked');
              resolve({ success: true, action: 'already-on' });
            }
          }, 500);
        }, 1000);
      });
    });

    console.log('Toggle result:', result);

    // Wait to see the result
    await page.waitForTimeout(5000);

    // Take a screenshot
    await page.screenshot({ path: 'boston-buildings-result.png' });
    console.log('Screenshot saved to boston-buildings-result.png');

    return { success: true, result };
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
    console.log('Final result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
