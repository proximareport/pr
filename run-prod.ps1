# Set environment variables for production
$env:NODE_ENV = "production"
$env:GHOST_URL = "https://proxima-report.ghost.io"
$env:GHOST_CONTENT_API_KEY = "dcc78244feda64ba082fb51fff"
$env:SESSION_SECRET = "your-super-secret-session-key-change-this-in-production"

# Run the server
npm run prod 