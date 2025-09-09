# Ghost API Setup for Topics Page

The Topics page requires Ghost CMS to be properly configured to fetch tags/topics. Here's how to set it up:

## Environment Variables Required

Add these to your `.env` file:

```env
# Ghost CMS Configuration
GHOST_URL=https://your-ghost-site.ghost.io
GHOST_CONTENT_API_KEY=your-ghost-content-api-key
GHOST_ADMIN_API_URL=https://your-ghost-site.ghost.io/ghost/api/admin/
GHOST_ADMIN_API_KEY=your-ghost-admin-api-key
```

## How to Get Ghost API Keys

1. **Content API Key** (for reading content):
   - Go to your Ghost admin panel
   - Navigate to Settings → Integrations
   - Create a new integration or use an existing one
   - Copy the Content API Key

2. **Admin API Key** (for managing content):
   - In the same Integrations section
   - Copy the Admin API Key

## API Endpoints

The Topics page uses these endpoints:

- **Primary**: `/api/ghost/tags` - Fetches tags from Ghost CMS
- **Fallback**: `/api/tags/published` - Uses local database if Ghost is unavailable
- **Default**: Shows default topics if both APIs fail

## Fallback Behavior

If Ghost API is not configured or fails:

1. **First fallback**: Tries local database endpoint
2. **Second fallback**: Shows default topics (Space Exploration, Astronomy, etc.)
3. **Error state**: Shows helpful error message with troubleshooting tips

## Testing the Setup

1. Start your server: `npm run dev`
2. Visit: `http://localhost:5000/api/ghost/tags`
3. You should see JSON data with tags from Ghost
4. If you see an error, check your environment variables

## Troubleshooting

### "No Topics Found" Error

This usually means:
- Ghost API keys are not set in environment variables
- Ghost URL is incorrect
- Ghost site is not accessible
- Network connectivity issues

### Check Environment Variables

You can test your Ghost connection at:
`http://localhost:5000/api/debug/env`

This will show which environment variables are set (without revealing the actual values).

## Default Topics

If Ghost API is unavailable, the page will show these default topics:
- Space Exploration
- Astronomy  
- Technology
- NASA
- SpaceX
- Science
- STEM Education
- Rocket Launches

These topics will still be clickable and will navigate to the tag pages, but won't show actual article counts until Ghost is properly connected.
