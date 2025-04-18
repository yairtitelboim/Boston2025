// open-poi-graph.js
const axios = require('axios');

async function openPOIGraph() {
  try {
    console.log('Starting POI Graph automation...');
    
    // Define the MCP server URL
    const mcpUrl = 'http://localhost:3002/run';
    
    // Step 1: Navigate to the app and wait for it to load
    console.log('Navigating to the app...');
    const response = await axios.post(mcpUrl, {
      action: 'interact',
      url: 'http://localhost:3000',
      options: {
        headless: false,
        waitTime: 10000, // Wait 10 seconds for the map to load
        takeScreenshot: true,
        interactions: []
      }
    });
    
    console.log('App loaded successfully');
    
    // Step 2: Find and click the POI Graph toggle button
    console.log('Finding and clicking the POI Graph toggle button...');
    const clickResponse = await axios.post(mcpUrl, {
      action: 'interact',
      url: 'http://localhost:3000',
      options: {
        headless: false,
        waitTime: 5000,
        takeScreenshot: true,
        interactions: [
          {
            type: 'click',
            selector: 'button:has-text("Show POI Stats")',
            description: 'Click the POI Graph toggle button'
          }
        ]
      }
    });
    
    console.log('POI Graph toggle button clicked');
    
    // Step 3: Verify the POI Graph is open
    console.log('Verifying POI Graph is open...');
    const verifyResponse = await axios.post(mcpUrl, {
      action: 'captureLogs',
      url: 'http://localhost:3000',
      options: {
        headless: false,
        waitTime: 5000,
        takeScreenshot: true
      }
    });
    
    console.log('Verification complete');
    
    // Save the final screenshot
    if (verifyResponse.data.screenshot) {
      console.log('POI Graph opened successfully');
    }
    
    return {
      success: true,
      message: 'POI Graph opened successfully'
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
openPOIGraph()
  .then(result => {
    console.log('Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
