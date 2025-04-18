// test-mcp.js
const axios = require('axios');

async function testMcpServer() {
  try {
    console.log('Testing MCP server...');

    // Test the captureLogs action
    const response = await axios.post('http://localhost:3002/run', {
      action: 'captureLogs',
      url: 'http://localhost:3003', // Our test page URL
      options: {
        headless: false, // Set to true for headless mode
        waitTime: 5000,
        takeScreenshot: true
      }
    });

    console.log('MCP server response:');
    console.log('Status:', response.status);
    console.log('Logs collected:', response.data.logs.length);

    if (response.data.screenshot) {
      console.log('Screenshot captured successfully');
    }

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error testing MCP server:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testMcpServer();
