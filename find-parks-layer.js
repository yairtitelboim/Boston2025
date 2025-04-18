const { chromium } = require('playwright');

/**
 * Simple script to find the Parks layer and toggle it
 */
async function findParksLayer() {
  console.log('=== STARTING PARKS LAYER FINDER ===');
  
  // Launch browser with devtools open for inspection
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Add console logging from the page to our Node.js console
  page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
  
  try {
    // Navigate to the app
    console.log('Navigating to the app...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    
    // Wait for the map to load
    console.log('Waiting for map to load...');
    await page.waitForSelector('.mapboxgl-canvas', { state: 'visible', timeout: 30000 });
    console.log('Map loaded successfully');
    
    // Wait for all components to initialize
    console.log('Waiting for components to initialize...');
    await page.waitForTimeout(3000);
    
    // Take a screenshot of the initial state
    await page.screenshot({ path: 'parks-finder-initial.png' });
    
    // Expand the layer menu if it's collapsed
    console.log('Expanding layer menu...');
    const expandButton = await page.$('button[title="Expand layer menu"]');
    if (expandButton) {
      await expandButton.click();
      console.log('Layer menu expanded');
      await page.waitForTimeout(1000);
    } else {
      console.log('Layer menu already expanded');
    }
    
    // Take a screenshot after expanding the menu
    await page.screenshot({ path: 'parks-finder-menu-expanded.png' });
    
    // Log all category headers to see what's available
    console.log('Logging all category headers...');
    const headers = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('.CategoryHeader'));
      return headers.map((header, index) => ({
        index,
        text: header.textContent.trim()
      }));
    });
    
    console.log('Found category headers:', headers);
    
    // Scroll through the layer menu to find all headers
    console.log('Scrolling through layer menu...');
    await page.evaluate(() => {
      const container = document.querySelector('.LayerToggleContainer');
      if (container) {
        // Scroll to the bottom
        container.scrollTop = container.scrollHeight;
        console.log(`Scrolled to bottom: ${container.scrollTop}/${container.scrollHeight}`);
      }
    });
    
    // Wait for scrolling to complete
    await page.waitForTimeout(1000);
    
    // Take a screenshot after scrolling
    await page.screenshot({ path: 'parks-finder-scrolled.png' });
    
    // Log all category headers again after scrolling
    console.log('Logging all category headers after scrolling...');
    const headersAfterScroll = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('.CategoryHeader'));
      return headers.map((header, index) => ({
        index,
        text: header.textContent.trim()
      }));
    });
    
    console.log('Found category headers after scrolling:', headersAfterScroll);
    
    // Try to find the Parks header
    const parksHeaderIndex = headersAfterScroll.findIndex(h => h.text.includes('Parks'));
    
    if (parksHeaderIndex >= 0) {
      console.log(`Found Parks header at index ${parksHeaderIndex}`);
      
      // Click on the Parks header to make sure it's in view
      await page.evaluate((index) => {
        const headers = Array.from(document.querySelectorAll('.CategoryHeader'));
        if (headers[index]) {
          headers[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
          console.log(`Scrolled Parks header into view`);
        }
      }, parksHeaderIndex);
      
      // Wait for scrolling to complete
      await page.waitForTimeout(1000);
      
      // Take a screenshot with Parks header in view
      await page.screenshot({ path: 'parks-finder-header-in-view.png' });
      
      // Try to find the checkbox
      console.log('Looking for Parks checkbox...');
      const parksCheckbox = await page.evaluate((index) => {
        const headers = Array.from(document.querySelectorAll('.CategoryHeader'));
        const parksHeader = headers[index];
        
        if (!parksHeader) {
          console.log('Parks header not found');
          return null;
        }
        
        // Try to find the checkbox in different ways
        let checkbox = parksHeader.querySelector('input[type="checkbox"]');
        
        if (!checkbox) {
          // Try parent
          const section = parksHeader.closest('.CategorySection');
          if (section) {
            checkbox = section.querySelector('input[type="checkbox"]');
          }
        }
        
        if (!checkbox) {
          console.log('Parks checkbox not found');
          return null;
        }
        
        console.log('Found Parks checkbox, checked:', checkbox.checked);
        
        // Return the checkbox info
        return {
          checked: checkbox.checked,
          // Get the path to the checkbox for later use
          path: getElementPath(checkbox)
        };
      }, parksHeaderIndex);
      
      if (parksCheckbox) {
        console.log(`Found Parks checkbox: ${JSON.stringify(parksCheckbox)}`);
        
        // Try to click the checkbox using the path
        console.log('Clicking Parks checkbox...');
        
        // Use a more direct approach to find and click the checkbox
        const allCheckboxes = await page.$$('input[type="checkbox"]');
        console.log(`Found ${allCheckboxes.length} checkboxes on the page`);
        
        // Find the checkbox near the Parks header
        const parksHeaderElement = await page.$$('.CategoryHeader')[parksHeaderIndex];
        const boundingBox = await parksHeaderElement.boundingBox();
        
        console.log(`Parks header bounding box: ${JSON.stringify(boundingBox)}`);
        
        // Find checkboxes near the Parks header
        let closestCheckbox = null;
        let minDistance = Infinity;
        
        for (const checkbox of allCheckboxes) {
          const checkboxBox = await checkbox.boundingBox();
          
          if (checkboxBox) {
            // Calculate distance between checkbox and header
            const distance = Math.sqrt(
              Math.pow(checkboxBox.x - boundingBox.x, 2) +
              Math.pow(checkboxBox.y - boundingBox.y, 2)
            );
            
            console.log(`Checkbox at (${checkboxBox.x}, ${checkboxBox.y}), distance: ${distance}`);
            
            if (distance < minDistance) {
              minDistance = distance;
              closestCheckbox = checkbox;
            }
          }
        }
        
        if (closestCheckbox) {
          console.log(`Found closest checkbox, distance: ${minDistance}`);
          
          // Check if it's already checked
          const isChecked = await closestCheckbox.isChecked();
          console.log(`Parks checkbox is ${isChecked ? 'checked' : 'unchecked'}`);
          
          // Click the checkbox
          await closestCheckbox.click();
          console.log('Clicked Parks checkbox');
          
          // Wait for toggle to take effect
          await page.waitForTimeout(1000);
          
          // Check if it's now toggled
          const isCheckedAfter = await closestCheckbox.isChecked();
          console.log(`Parks checkbox is now ${isCheckedAfter ? 'checked' : 'unchecked'}`);
          
          // Take a screenshot after toggling
          await page.screenshot({ path: 'parks-finder-toggled.png' });
          
          console.log('Parks layer toggle successful!');
        } else {
          console.log('Could not find a checkbox near the Parks header');
        }
      } else {
        console.log('Could not find Parks checkbox');
      }
    } else {
      console.log('Parks header not found in the list');
      
      // Try a different approach - look for any element containing "Parks"
      console.log('Looking for any element containing "Parks"...');
      
      const parksElements = await page.evaluate(() => {
        // Find all elements containing "Parks"
        const elements = Array.from(document.querySelectorAll('*'));
        const parksElements = elements.filter(el => 
          el.textContent && 
          el.textContent.includes('Parks') && 
          el.textContent.length < 50 // Avoid large text blocks
        );
        
        return parksElements.map(el => ({
          tagName: el.tagName,
          className: el.className,
          text: el.textContent.trim(),
          isVisible: el.offsetParent !== null
        }));
      });
      
      console.log('Found elements containing "Parks":', parksElements);
      
      // Try to click on the first visible element containing "Parks"
      const visibleParksElement = parksElements.find(el => el.isVisible);
      
      if (visibleParksElement) {
        console.log(`Trying to click on visible Parks element: ${JSON.stringify(visibleParksElement)}`);
        
        await page.click(`text="${visibleParksElement.text}"`);
        console.log('Clicked on Parks element');
        
        // Take a screenshot after clicking
        await page.screenshot({ path: 'parks-finder-clicked.png' });
      } else {
        console.log('No visible Parks element found');
      }
    }
    
    console.log('\n=== PARKS LAYER FINDER COMPLETED ===');
    
  } catch (error) {
    console.error('Script failed with error:', error);
    await page.screenshot({ path: 'parks-finder-error.png' });
  } finally {
    // Keep the browser open for inspection
    console.log('Browser will remain open for inspection. Press Ctrl+C to close.');
  }
}

// Helper function to get a unique path to an element
function getElementPath(element) {
  return `
    function getElementByPath() {
      const headers = Array.from(document.querySelectorAll('.CategoryHeader'));
      const parksHeader = headers.find(h => h.textContent.includes('Parks'));
      if (!parksHeader) return null;
      
      const section = parksHeader.closest('.CategorySection');
      if (!section) return null;
      
      return section.querySelector('input[type="checkbox"]');
    }
  `;
}

// Run the script
findParksLayer().catch(console.error);
