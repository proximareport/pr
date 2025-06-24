import express from 'express';

const app = express();
const port = parseInt(process.env.PORT || '5000');

app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test server is working!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

app.get('/api/env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    GHOST_URL: process.env.GHOST_URL,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
}); 