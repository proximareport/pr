# Netlify Deployment Troubleshooting

This guide helps resolve common issues when deploying to Netlify.

## 🚨 Common Build Errors

### Error: `vite: not found`

**Problem**: Netlify can't find the Vite command during build.

**Solutions**:
1. **Use npx**: Change build command to `npm ci && npx vite build`
2. **Install globally**: Add `npm install -g vite` to build command
3. **Use local path**: Use `./node_modules/.bin/vite build`

**Current Fix**: The `netlify.toml` now uses `npx vite build` which should resolve this.

### Error: `npm: not found`

**Problem**: Node.js/npm not available in build environment.

**Solutions**:
1. **Specify Node version**: Add `NODE_VERSION = "18"` to `netlify.toml`
2. **Use .nvmrc**: Create `.nvmrc` file with Node version
3. **Check build settings**: Ensure Node.js is selected in Netlify dashboard

### Error: `Permission denied`

**Problem**: Scripts don't have execute permissions.

**Solutions**:
1. **Make scripts executable**: `chmod +x scripts/*.sh`
2. **Use npm scripts**: Call scripts through package.json instead of directly
3. **Use bash explicitly**: `bash scripts/build-client.sh`

### Error: `Build script returned non-zero exit code`

**Problem**: Build process failed with error code.

**Solutions**:
1. **Check build logs**: Look for specific error messages
2. **Test locally**: Run `npm run build:client` locally first
3. **Simplify build**: Use basic commands like `npm ci && npx vite build`

## 🔧 Build Command Options

### Option 1: Simple (Recommended)
```toml
[build]
  command = "npm ci && npx vite build"
  publish = "dist/public"
```

### Option 2: With Script
```toml
[build]
  command = "bash scripts/build-client.sh"
  publish = "dist/public"
```

### Option 3: NPM Script
```toml
[build]
  command = "npm run build:client:netlify"
  publish = "dist/public"
```

## 🐛 Debugging Steps

### 1. Check Build Logs
- Go to Netlify dashboard
- Click on your site
- Go to "Deploys" tab
- Click on failed deploy
- Check "Build log" for specific errors

### 2. Test Locally
```bash
# Test the exact build command
npm ci && npx vite build

# Check if dist/public is created
ls -la dist/public/
```

### 3. Check Dependencies
```bash
# Ensure all dependencies are in package.json
npm list vite
npm list @vitejs/plugin-react
```

### 4. Verify Node Version
```bash
# Check Node version
node --version

# Should be 18 or higher
```

## 🔍 Environment Variables

### Required for Build
```env
NODE_ENV=production
NODE_VERSION=18
```

### Required for Runtime
```env
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_GHOST_URL=https://your-ghost-site.ghost.io
VITE_GHOST_CONTENT_API_KEY=your-ghost-content-api-key
```

## 📁 File Structure Check

Ensure your project has this structure:
```
your-project/
├── client/
│   ├── src/
│   │   ├── main.tsx
│   │   └── ...
│   └── index.html
├── package.json
├── vite.config.ts
├── netlify.toml
└── .nvmrc
```

## 🛠️ Manual Build Test

Test the build process manually:

```bash
# 1. Clean install
npm ci

# 2. Build client
npx vite build

# 3. Check output
ls -la dist/public/

# 4. Verify index.html exists
cat dist/public/index.html
```

## 📞 Getting Help

### 1. Check Netlify Status
- Visit [status.netlify.com](https://status.netlify.com)
- Check for any service issues

### 2. Netlify Support
- Use Netlify's built-in support chat
- Check [Netlify docs](https://docs.netlify.com)

### 3. Community Help
- [Netlify Community](https://community.netlify.com)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/netlify)

## 🔄 Alternative Deployment

If Netlify continues to have issues:

### Vercel
```bash
npm install -g vercel
vercel
```

### GitHub Pages
```bash
npm run build:client
# Upload dist/public to GitHub Pages
```

### Manual Upload
```bash
npm run build:client
# Upload dist/public folder to any static hosting
```

## ✅ Success Checklist

- [ ] Build command runs locally without errors
- [ ] `dist/public` directory is created
- [ ] `dist/public/index.html` exists
- [ ] All environment variables are set in Netlify
- [ ] Node.js version is specified (18+)
- [ ] No permission errors in build logs
- [ ] Site deploys successfully
- [ ] All routes work correctly
- [ ] API calls work from deployed site 