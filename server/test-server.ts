import express from 'express';

const app = express();
const port = parseInt(process.env.PORT || '5000');

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Backend server is running!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

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
    DATABASE_URL: process.env.DATABASE_URL ? '***HIDDEN***' : 'NOT_SET',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Database URL set: ${process.env.DATABASE_URL ? 'YES' : 'NO'}`);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
}); 