// serve-test-page.js
const express = require('express');
const path = require('path');

const app = express();

// Serve the test page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-page.html'));
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Test page server running at http://localhost:${PORT}`);
});
