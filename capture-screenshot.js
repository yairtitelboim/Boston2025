// capture-screenshot.js
const axios = require('axios');
const fs = require('fs');

async function captureScreenshot() {
  try {
    console.log('Starting screenshot capture...');
    
    // Define the MCP server URL
    const mcpUrl = 'http://localhost:3002/run';
    
    // Capture logs and screenshot
    const response = await axios.post(mcpUrl, {
      action: 'captureLogs',
      url: 'http://localhost:3000',
      options: {
        headless: false,
        waitTime: 10000,
        takeScreenshot: true
      }
    });
    
    console.log(`Captured ${response.data.logs.length} logs`);
    
    // Save the screenshot if available
    if (response.data.screenshot) {
      // Extract the base64 data
      const base64Data = response.data.screenshot.replace(/^data:image\/jpeg;base64,/, '');
      
      // Save to file
      fs.writeFileSync('app-screenshot.jpg', base64Data, 'base64');
      console.log('Screenshot saved to app-screenshot.jpg');
    }
    
    // Print some of the logs
    console.log('\nRelevant logs:');
    const relevantLogs = response.data.logs.filter(log => 
      log.text.includes('Boston') || log.text.includes('building') || log.text.includes('map')
    );
    
    relevantLogs.forEach(log => {
      console.log(`[${log.type}] ${log.text}`);
    });
    
    return {
      success: true,
      message: 'Screenshot captured successfully'
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
captureScreenshot()
  .then(result => {
    console.log('Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
