// click-poi-stats-direct.js
const { chromium } = require('playwright');

async function clickPOIStatsButton() {
  console.log('Starting direct Playwright script to click POI Stats button...');

  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the app with a more lenient strategy
    console.log('Navigating to the application...');
    try {
      await page.goto('http://localhost:3000', { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
    } catch (navError) {
      console.warn('Navigation warning:', navError.message);
      // Continue anyway - the page might be partially loaded
    }
    
    // Wait for the page to load
    console.log('Waiting for page to load...');
    await page.waitForTimeout(20000);
    console.log('Page should be loaded by now');

    // Take a screenshot of the current state
    await page.screenshot({ path: 'page-loaded.png' });
    console.log('Screenshot saved to page-loaded.png');

    // Try to find the POI Stats button using JavaScript evaluation
    console.log('Looking for POI Stats button...');
    const buttonFound = await page.evaluate(() => {
      // Try different strategies to find the button
      
      // 1. Look for button with exact text
      let buttons = Array.from(document.querySelectorAll('button'));
      let poiButton = buttons.find(button => 
        button.textContent.trim() === 'Show POI Stats'
      );
      
      // 2. Look for button containing the text
      if (!poiButton) {
        poiButton = buttons.find(button => 
          button.textContent.includes('POI Stats')
        );
      }
      
      // 3. Look for any element that might be the button
      if (!poiButton) {
        const allElements = Array.from(document.querySelectorAll('*'));
        poiButton = allElements.find(el => 
          el.textContent && 
          el.textContent.includes('POI Stats') && 
          (el.tagName === 'BUTTON' || 
           el.tagName === 'DIV' || 
           el.tagName === 'SPAN' || 
           el.tagName === 'A')
        );
      }
      
      // If found, click it
      if (poiButton) {
        console.log('Found POI Stats button:', poiButton.outerHTML);
        poiButton.click();
        return true;
      }
      
      // Log all buttons for debugging
      console.log('All buttons on page:', 
        buttons.map(b => ({
          text: b.textContent.trim(),
          html: b.outerHTML.substring(0, 100) + '...'
        }))
      );
      
      return false;
    });
    
    if (buttonFound) {
      console.log('POI Stats button found and clicked via JavaScript');
      
      // Wait for any UI changes
      await page.waitForTimeout(5000);
      
      // Take a screenshot after clicking
      await page.screenshot({ path: 'after-click.png' });
      console.log('Screenshot saved to after-click.png');
      
      return { success: true };
    } else {
      console.log('Could not find POI Stats button via JavaScript');
      
      // Try a more direct approach - look for elements with specific text
      console.log('Trying alternative approaches...');
      
      // Look for text
      const textElement = await page.getByText('Show POI Stats', { exact: false });
      if (await textElement.count() > 0) {
        console.log('Found element with POI Stats text, clicking it...');
        await textElement.click();
        
        // Wait and take screenshot
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'after-text-click.png' });
        console.log('Screenshot saved to after-text-click.png');
        
        return { success: true };
      }
      
      // Take a screenshot of the failure state
      await page.screenshot({ path: 'button-not-found.png' });
      console.log('Screenshot saved to button-not-found.png');
      
      return { success: false, error: 'POI Stats button not found' };
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
    // Wait a bit before closing to see the result
    await page.waitForTimeout(10000);
    
    // Close the browser
    await browser.close();
  }
}

// Run the function
clickPOIStatsButton()
  .then(result => {
    console.log('Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
