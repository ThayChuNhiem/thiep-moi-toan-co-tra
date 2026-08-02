const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from root directory
app.use(express.static(__dirname));

// Fallback routing to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Explicitly bind to 0.0.0.0 for Render health checker
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on 0.0.0.0:${PORT}`);
});
