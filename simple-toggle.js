// simple-toggle.js
const axios = require('axios');

async function simpleToggle() {
  try {
    console.log('Starting simple toggle script...');
    
    // Define the MCP server URL
    const mcpUrl = 'http://localhost:3002/run';
    
    // Navigate to the app and perform all actions in one go
    const response = await axios.post(mcpUrl, {
      action: 'interact',
      url: 'http://localhost:3000',
      options: {
        headless: false,
        timeout: 60000,
        takeScreenshot: true,
        interactions: [
          // Wait for the app to load
          { type: 'wait', ms: 5000 },
          
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
          { type: 'wait', ms: 3000 },
          
          // Make sure the layer menu is expanded
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
          
          // Wait for the menu to expand
          { type: 'wait', ms: 1000 },
          
          // Scroll through the layer menu and find Boston Buildings
          { 
            type: 'evaluate', 
            script: `
              // Get the layer menu container
              const layerMenu = document.querySelector('div[class*="LayerToggleContainer"]');
              if (!layerMenu) {
                console.log('Layer menu not found');
                return false;
              }
              
              console.log('Found layer menu, scrolling to find Boston Buildings');
              
              // Scroll to the bottom to make sure all items are loaded
              layerMenu.scrollTop = layerMenu.scrollHeight;
              
              // Wait a bit for rendering
              return new Promise(resolve => {
                setTimeout(() => {
                  // Now look for the Boston Buildings title
                  const allTitles = Array.from(document.querySelectorAll('div[class*="CategoryTitle"]'));
                  console.log('All titles:', allTitles.map(el => el.textContent));
                  
                  const bostonTitle = allTitles.find(el => 
                    el.textContent.includes('Boston Buildings')
                  );
                  
                  if (bostonTitle) {
                    console.log('Found Boston Buildings title');
                    bostonTitle.scrollIntoView({ behavior: 'auto', block: 'center' });
                    
                    // Wait a bit more for the scrolling to complete
                    setTimeout(() => {
                      // Find the parent section
                      const section = bostonTitle.closest('div[class*="CategorySection"]');
                      if (section) {
                        // Find the checkbox
                        const checkbox = section.querySelector('input[type="checkbox"]');
                        if (checkbox) {
                          console.log('Found checkbox, current state:', checkbox.checked);
                          if (!checkbox.checked) {
                            checkbox.click();
                            console.log('Clicked checkbox');
                            resolve(true);
                          } else {
                            console.log('Checkbox already checked');
                            resolve('already-checked');
                          }
                        } else {
                          console.log('Checkbox not found');
                          resolve(false);
                        }
                      } else {
                        console.log('Section not found');
                        resolve(false);
                      }
                    }, 500);
                  } else {
                    console.log('Boston Buildings title not found');
                    resolve(false);
                  }
                }, 1000);
              });
            `
          },
          
          // Wait for the buildings to appear
          { type: 'wait', ms: 5000 }
        ]
      }
    });
    
    console.log('Script completed successfully!');
    return {
      success: true,
      message: 'Script executed successfully'
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
simpleToggle()
  .then(result => {
    console.log('Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
