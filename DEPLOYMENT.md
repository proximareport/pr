# Deployment Guide

This guide covers deploying the Proxima Report application to various platforms.

## 🚀 Netlify Deployment (Frontend)

### Prerequisites
- Your code pushed to a Git repository (GitHub, GitLab, Bitbucket)
- A Netlify account
- Your backend deployed and accessible

### Step 1: Connect to Netlify

1. **Go to Netlify Dashboard**
   - Visit [netlify.com](https://netlify.com)
   - Sign in to your account

2. **Import from Git**
   - Click "New site from Git"
   - Choose your Git provider (GitHub, GitLab, Bitbucket)
   - Select your repository

3. **Configure Build Settings**
   Netlify will automatically detect the settings from `netlify.toml`:
   - **Build command**: `npm run build:client`
   - **Publish directory**: `dist/public`
   - **Node version**: 18 (or higher)

### Step 2: Set Environment Variables

In your Netlify dashboard, go to **Site settings > Environment variables** and add:

```env
# Required: Backend API URL
VITE_API_BASE_URL=https://your-backend-domain.com

# Required: Ghost CMS
VITE_GHOST_URL=https://your-ghost-site.ghost.io
VITE_GHOST_CONTENT_API_KEY=your-ghost-content-api-key

# Optional: Stripe (if using payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# Optional: Analytics
VITE_SENTRY_DSN=your-sentry-dsn
```

### Step 3: Deploy

1. **Automatic Deployment**
   - Netlify will automatically build and deploy when you push to your main branch
   - You can also trigger manual deploys from the dashboard

2. **Preview Deployments**
   - Netlify creates preview deployments for pull requests
   - Perfect for testing changes before merging

### Step 4: Custom Domain (Optional)

1. **Add Custom Domain**
   - Go to **Site settings > Domain management**
   - Click "Add custom domain"
   - Follow the DNS configuration instructions

2. **SSL Certificate**
   - Netlify automatically provides SSL certificates
   - No additional configuration needed

## 🔧 Backend Deployment Options

### Option 1: Railway (Recommended)

1. **Connect to Railway**
   - Visit [railway.app](https://railway.app)
   - Connect your GitHub account
   - Import your repository

2. **Configure Environment**
   - Add environment variables in Railway dashboard
   - Set `NODE_ENV=production`

3. **Deploy**
   - Railway automatically detects Node.js projects
   - Deploys on every push to main branch

### Option 2: Render

1. **Create Web Service**
   - Visit [render.com](https://render.com)
   - Create a new Web Service
   - Connect your repository

2. **Configure Build**
   - **Build Command**: `npm run build:server`
   - **Start Command**: `npm start`
   - **Environment**: Node

3. **Set Environment Variables**
   - Add all required environment variables
   - Set `NODE_ENV=production`

### Option 3: Heroku

1. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set DATABASE_URL=your-database-url
   # Add other environment variables
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 4: Vercel

1. **Import Project**
   - Visit [vercel.com](https://vercel.com)
   - Import your repository
   - Configure as Node.js project

2. **Set Root Directory**
   - Set to project root (not client folder)
   - Vercel will handle the build automatically

## 🗄️ Database Setup

### PostgreSQL Options

1. **Railway PostgreSQL**
   - Create PostgreSQL service in Railway
   - Automatically provides connection string

2. **Neon (Recommended)**
   - Visit [neon.tech](https://neon.tech)
   - Create a new project
   - Get connection string

3. **Supabase**
   - Visit [supabase.com](https://supabase.com)
   - Create a new project
   - Use the PostgreSQL connection string

4. **Heroku Postgres**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

### Database Migration

After setting up your database:

1. **Get connection string**
2. **Set DATABASE_URL environment variable**
3. **Run migrations**:
   ```bash
   npm run db:push
   ```

## 🔐 Environment Variables Reference

### Frontend (Netlify)
```env
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_GHOST_URL=https://your-ghost-site.ghost.io
VITE_GHOST_CONTENT_API_KEY=your-ghost-content-api-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
VITE_SENTRY_DSN=your-sentry-dsn
```

### Backend
```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Session
SESSION_SECRET=your-super-secret-session-key

# Ghost CMS
GHOST_URL=https://your-ghost-site.ghost.io
GHOST_CONTENT_API_KEY=your-ghost-content-api-key

# Email
SENDGRID_API_KEY=your-sendgrid-api-key

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Environment
NODE_ENV=production
```

## 🧪 Testing Deployment

### Frontend Testing
1. **Check build logs** in Netlify dashboard
2. **Test all routes** work correctly
3. **Verify API calls** to backend
4. **Test theme switching**
5. **Check responsive design**

### Backend Testing
1. **Check server logs**
2. **Test API endpoints** with Postman or curl
3. **Verify database connections**
4. **Test authentication flow**

### Common Issues

1. **CORS Errors**
   - Ensure backend allows requests from your Netlify domain
   - Check `cors` configuration in server

2. **Environment Variables**
   - Verify all variables are set correctly
   - Check for typos in variable names

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed

4. **Database Connection**
   - Ensure DATABASE_URL is correct
   - Check database is accessible from deployment platform

## 📊 Monitoring

### Netlify Analytics
- Built-in analytics in Netlify dashboard
- Page views, unique visitors, bandwidth usage

### Backend Monitoring
- Use platform-specific monitoring (Railway, Render, etc.)
- Set up error tracking with Sentry
- Monitor database performance

## 🔄 Continuous Deployment

### Automatic Deployments
- Both frontend and backend deploy automatically on git push
- Preview deployments for pull requests
- Easy rollback to previous versions

### Manual Deployments
- Trigger manual deploys from platform dashboards
- Useful for testing or emergency fixes

## 🆘 Troubleshooting

### Build Issues
1. Check build logs for specific errors
2. Verify all dependencies are in package.json
3. Ensure Node.js version is compatible

### Runtime Issues
1. Check server logs for errors
2. Verify environment variables are set
3. Test database connectivity

### Performance Issues
1. Enable caching headers (already configured in netlify.toml)
2. Optimize images and assets
3. Monitor database query performance

## 📞 Support

If you encounter issues:
1. Check the platform-specific documentation
2. Review build and runtime logs
3. Test locally to isolate issues
4. Create issues in the repository for bugs 