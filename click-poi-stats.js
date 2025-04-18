// click-poi-stats.js
const axios = require('axios');

async function clickPOIStatsButton() {
  try {
    console.log('Starting POI Stats button click automation...');
    
    // Define the MCP server URL
    const mcpUrl = 'http://localhost:3002/run';
    
    // Step 1: Navigate to the app and wait for it to load
    console.log('Navigating to the app...');
    const response = await axios.post(mcpUrl, {
      action: 'interact',
      url: 'http://localhost:3000',
      options: {
        headless: false,
        waitTime: 20000, // Wait 20 seconds for the map to load
        takeScreenshot: true,
        interactions: []
      }
    });
    
    console.log('App loaded successfully');
    
    // Step 2: Find and click the POI Stats button using a more flexible approach
    console.log('Finding and clicking the POI Stats button...');
    const clickResponse = await axios.post(mcpUrl, {
      action: 'interact',
      url: 'http://localhost:3000',
      options: {
        headless: false,
        waitTime: 5000,
        takeScreenshot: true,
        interactions: [
          {
            type: 'evaluate',
            script: `
              // Try to find the button by text content
              const buttons = Array.from(document.querySelectorAll('button'));
              const poiButton = buttons.find(button => 
                button.textContent.includes('Show POI Stats') || 
                button.textContent.includes('POI Stats')
              );
              
              if (poiButton) {
                console.log('Found POI Stats button, clicking it');
                poiButton.click();
                return true;
              } else {
                console.log('POI Stats button not found');
                return false;
              }
            `,
            description: 'Find and click the POI Stats button'
          }
        ]
      }
    });
    
    if (clickResponse.data.evaluationResults && clickResponse.data.evaluationResults[0]) {
      console.log('POI Stats button clicked successfully');
    } else {
      console.log('Failed to find or click the POI Stats button');
    }
    
    // Step 3: Take a final screenshot to verify
    console.log('Taking final screenshot...');
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
    
    return {
      success: true,
      message: 'POI Stats button interaction completed'
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
clickPOIStatsButton()
  .then(result => {
    console.log('Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
