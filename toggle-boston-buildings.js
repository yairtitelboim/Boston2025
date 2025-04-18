// toggle-boston-buildings.js
const axios = require('axios');

async function toggleBostonBuildings() {
  try {
    console.log('Starting Boston Buildings toggle script...');
    
    // Define the URL of your application
    const appUrl = 'http://localhost:3000'; // Change this to your actual app URL
    
    // Define the MCP server URL
    const mcpUrl = 'http://localhost:3002/run';
    
    // Step 1: Navigate to the application and wait for it to load
    console.log('Navigating to the application...');
    const response = await axios.post(mcpUrl, {
      action: 'interact',
      url: appUrl,
      options: {
        headless: false, // Set to true for headless mode
        timeout: 30000,
        interactions: [
          // Wait for the map to load
          { type: 'wait', ms: 5000 }
        ]
      }
    });
    
    console.log('Application loaded successfully');
    
    // Step 2: Click the "Go to Boston" button
    console.log('Clicking "Go to Boston" button...');
    await axios.post(mcpUrl, {
      action: 'interact',
      url: appUrl,
      options: {
        headless: false,
        timeout: 30000,
        interactions: [
          // Click the "Go to Boston" button
          { 
            type: 'evaluate', 
            script: `
              const bostonButton = document.querySelector('button.mapboxgl-ctrl-boston');
              if (bostonButton) {
                console.log('Found Boston button, clicking it');
                bostonButton.click();
                return true;
              }
              console.log('Boston button not found');
              return false;
            `
          },
          // Wait for the map to zoom
          { type: 'wait', ms: 3000 }
        ]
      }
    });
    
    console.log('Zoomed to Boston');
    
    // Step 3: Make sure the layer menu is expanded
    console.log('Ensuring layer menu is expanded...');
    await axios.post(mcpUrl, {
      action: 'interact',
      url: appUrl,
      options: {
        headless: false,
        timeout: 30000,
        interactions: [
          // Check if the menu is collapsed and expand it if needed
          { 
            type: 'evaluate', 
            script: `
              const expandButton = document.querySelector('button[title="Expand layer menu"]');
              if (expandButton && window.getComputedStyle(expandButton).display !== 'none') {
                console.log('Layer menu is collapsed, expanding it');
                expandButton.click();
                return true;
              }
              console.log('Layer menu is already expanded or expand button not found');
              return false;
            `
          },
          { type: 'wait', ms: 1000 }
        ]
      }
    });
    
    console.log('Layer menu expanded');
    
    // Step 4: Find and toggle the Boston Buildings layer
    console.log('Finding and toggling Boston Buildings layer...');
    const toggleResult = await axios.post(mcpUrl, {
      action: 'interact',
      url: appUrl,
      options: {
        headless: false,
        timeout: 30000,
        interactions: [
          // Direct approach to find and toggle Boston Buildings
          { 
            type: 'evaluate', 
            script: `
              // Function to find and toggle Boston Buildings
              function findAndToggleBostonBuildings() {
                // Get all category titles
                const allTitles = Array.from(document.querySelectorAll('div[class*="CategoryTitle"]'));
                console.log('Found category titles:', allTitles.map(el => el.textContent));
                
                // Find the Boston Buildings title
                const bostonTitle = allTitles.find(el => el.textContent.includes('Boston Buildings'));
                
                if (bostonTitle) {
                  console.log('Found Boston Buildings title');
                  
                  // Scroll to make it visible
                  bostonTitle.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  
                  // Find the parent section
                  const section = bostonTitle.closest('div[class*="CategorySection"]');
                  if (!section) {
                    console.log('Could not find parent section');
                    return false;
                  }
                  
                  // Find the checkbox in this section
                  const checkbox = section.querySelector('input[type="checkbox"]');
                  if (checkbox) {
                    console.log('Found checkbox, current state:', checkbox.checked);
                    
                    // Click the checkbox if it's not already checked
                    if (!checkbox.checked) {
                      checkbox.click();
                      console.log('Clicked checkbox');
                      return true;
                    } else {
                      console.log('Checkbox already checked');
                      return 'already-checked';
                    }
                  } else {
                    console.log('Checkbox not found in section');
                    return false;
                  }
                } else {
                  console.log('Boston Buildings title not found');
                  return false;
                }
              }
              
              // First try to find it directly
              let result = findAndToggleBostonBuildings();
              
              // If not found, scroll through the menu and try again
              if (result === false) {
                console.log('Boston Buildings not found initially, scrolling through menu');
                
                const layerMenu = document.querySelector('div[class*="LayerToggleContainer"]');
                if (layerMenu) {
                  // Scroll down in increments
                  for (let scroll = 0; scroll <= layerMenu.scrollHeight; scroll += 200) {
                    layerMenu.scrollTop = scroll;
                    console.log('Scrolled to position:', scroll);
                    
                    // Wait a bit for rendering
                    // Note: This is a synchronous wait, not ideal but works for this script
                    const startTime = new Date().getTime();
                    while (new Date().getTime() - startTime < 300) {}
                    
                    // Try to find and toggle again
                    result = findAndToggleBostonBuildings();
                    if (result !== false) {
                      break;
                    }
                  }
                }
              }
              
              return result;
            `
          },
          { type: 'wait', ms: 5000 } // Wait for the buildings to appear
        ]
      }
    });
    
    console.log('Boston Buildings layer toggle attempt completed');
    
    // Step 5: Capture a screenshot of the result
    console.log('Capturing final screenshot...');
    const screenshotResponse = await axios.post(mcpUrl, {
      action: 'interact',
      url: appUrl,
      options: {
        headless: false,
        timeout: 30000,
        takeScreenshot: true,
        interactions: [
          // Wait a moment for any animations to complete
          { type: 'wait', ms: 2000 }
        ]
      }
    });
    
    console.log('Script completed successfully!');
    return {
      success: true,
      message: 'Successfully toggled Boston Buildings layer'
    };
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return {
      success: false,
      error: error.message
    };
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
