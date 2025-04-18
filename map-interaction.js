// map-interaction.js
const axios = require('axios');

async function interactWithMap() {
  try {
    console.log('Starting map interaction script...');

    // Define the URL of your application
    const appUrl = 'http://localhost:3000'; // Change this to your actual app URL

    // Define the MCP server URL
    const mcpUrl = 'http://localhost:3002/run';

    // Step 1: Navigate to the application and wait for it to load
    console.log('Navigating to the application...');
    const initialResponse = await axios.post(mcpUrl, {
      action: 'interact',
      url: appUrl,
      options: {
        headless: false, // Set to true for headless mode
        timeout: 30000,
        waitTime: 5000,
        takeScreenshot: true,
        interactions: [
          // Wait for the map to load
          { type: 'wait', ms: 5000 }
        ]
      }
    });

    console.log('Initial page load complete. Taking screenshot...');

    // Step 2: Click the "Go to Boston" button and wait for the map to zoom
    console.log('Clicking "Go to Boston" button...');
    const bostonResponse = await axios.post(mcpUrl, {
      action: 'interact',
      url: appUrl,
      options: {
        headless: false,
        timeout: 30000,
        takeScreenshot: true,
        interactions: [
          // Click the "Go to Boston" button
          { type: 'click', selector: '.mapboxgl-ctrl-boston' },
          // Wait for the map to zoom
          { type: 'wait', ms: 3000 }
        ]
      }
    });

    console.log('Zoomed to Boston. Taking screenshot...');

    // Step 3: Open the layer menu if it's collapsed
    console.log('Opening layer menu if collapsed...');
    const layerMenuResponse = await axios.post(mcpUrl, {
      action: 'interact',
      url: appUrl,
      options: {
        headless: false,
        timeout: 30000,
        takeScreenshot: true,
        interactions: [
          // Click the expand button if the menu is collapsed
          { type: 'click', selector: 'button[title="Expand layer menu"]' },
          // Wait for the menu to expand
          { type: 'wait', ms: 1000 }
        ]
      }
    });

    console.log('Layer menu opened. Taking screenshot...');

    // Step 4: Find and toggle on the Boston Buildings layer
    console.log('Toggling Boston Buildings layer...');
    const toggleResponse = await axios.post(mcpUrl, {
      action: 'interact',
      url: appUrl,
      options: {
        headless: false,
        timeout: 30000,
        takeScreenshot: true,
        interactions: [
          // First, make sure we're clicking in the layer menu to activate it
          { type: 'click', selector: 'div[class*="LayerToggleContainer"]' },
          { type: 'wait', ms: 500 },

          // Execute JavaScript to scroll through the layer menu to find Boston Buildings
          {
            type: 'evaluate',
            script: `
              // Get the layer menu container
              const layerMenu = document.querySelector('div[class*="LayerToggleContainer"]');
              if (!layerMenu) {
                console.log('Layer menu not found');
                return false;
              }

              // Log all category titles for debugging
              const allTitles = Array.from(document.querySelectorAll('div[class*="CategoryTitle"]'));
              console.log('Found category titles:', allTitles.map(el => el.textContent));

              // Scroll down gradually to find the Boston Buildings section
              let found = false;
              let scrollAmount = 0;
              const maxScroll = layerMenu.scrollHeight;

              // Function to check if Boston Buildings is visible
              const checkForBostonBuildings = () => {
                const bostonTitle = Array.from(document.querySelectorAll('div[class*="CategoryTitle"]'))
                  .find(el => el.textContent.includes('Boston Buildings'));
                if (bostonTitle) {
                  console.log('Found Boston Buildings section');
                  bostonTitle.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  return true;
                }
                return false;
              };

              // First check if it's already visible
              if (checkForBostonBuildings()) {
                return true;
              }

              // Scroll down in increments to find it
              while (scrollAmount < maxScroll && !found) {
                scrollAmount += 200; // Scroll by 200px each time
                layerMenu.scrollTop = scrollAmount;
                console.log('Scrolling to:', scrollAmount);

                // Check if Boston Buildings is now visible
                found = checkForBostonBuildings();

                if (found) break;
              }

              return found;
            `
          },
          { type: 'wait', ms: 1000 },

          // Click directly on the toggle switch for Boston Buildings
          {
            type: 'evaluate',
            script: `
              // Find the Boston Buildings title
              const bostonTitle = Array.from(document.querySelectorAll('div[class*="CategoryTitle"]'))
                .find(el => el.textContent.includes('Boston Buildings'));

              if (bostonTitle) {
                console.log('Found Boston Buildings title element:', bostonTitle);

                // Find the parent header
                const header = bostonTitle.closest('div[class*="CategoryHeader"]');
                if (header) {
                  console.log('Found header element:', header);

                  // Try multiple approaches to find the toggle

                  // Approach 1: Find the toggle switch in the same header
                  let toggleContainer = header.querySelector('div[class*="ToggleSwitch"]');
                  let toggle = toggleContainer ? toggleContainer.querySelector('input[type="checkbox"]') : null;

                  // Approach 2: If not found, try to find any checkbox within the header
                  if (!toggle) {
                    toggle = header.querySelector('input[type="checkbox"]');
                    console.log('Using fallback approach to find toggle:', toggle);
                  }

                  // Approach 3: If still not found, look for the toggle in the parent section
                  if (!toggle) {
                    const section = header.closest('div[class*="CategorySection"]');
                    if (section) {
                      toggle = section.querySelector('input[type="checkbox"]');
                      console.log('Using section-level approach to find toggle:', toggle);
                    }
                  }

                  if (toggle) {
                    console.log('Found toggle switch, current state:', toggle.checked);
                    // Click the toggle if it's not already checked
                    if (!toggle.checked) {
                      // Try direct click first
                      toggle.click();
                      console.log('Clicked toggle switch');
                      return true;
                    } else {
                      console.log('Toggle already checked');
                      return 'already-checked';
                    }
                  } else {
                    // If we can't find the toggle, try clicking the header itself
                    // as it might be the entire clickable area
                    console.log('Toggle not found, clicking the header instead');
                    header.click();
                    return 'clicked-header';
                  }
                }
              }
              console.log('Boston Buildings title or toggle switch not found');
              return false;
            `
          },
          { type: 'wait', ms: 5000 } // Wait for the buildings to appear
        ]
      }
    });

    console.log('Boston Buildings layer toggled. Taking final screenshot...');

    // Step 5: Capture logs to verify the actions
    console.log('Capturing console logs...');
    const logsResponse = await axios.post(mcpUrl, {
      action: 'captureLogs',
      url: appUrl,
      options: {
        headless: false,
        waitTime: 5000,
        takeScreenshot: true
      }
    });

    console.log('Map interaction complete!');
    console.log(`Captured ${logsResponse.data.logs.length} console logs`);

    // Print some of the logs related to the Boston Buildings layer
    const bostonLogs = logsResponse.data.logs.filter(log =>
      log.text.includes('Boston') || log.text.includes('building')
    );

    console.log('\nRelevant logs:');
    bostonLogs.forEach(log => {
      console.log(`[${log.type}] ${log.text}`);
    });

    return {
      success: true,
      message: 'Successfully interacted with the map and toggled Boston Buildings layer'
    };
  } catch (error) {
    console.error('Error interacting with map:', error.message);
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
interactWithMap()
  .then(result => {
    console.log('Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
