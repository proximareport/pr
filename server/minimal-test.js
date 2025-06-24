const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.json({ message: 'Minimal server working!', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API test working!', timestamp: new Date().toISOString() });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Minimal server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
}); 