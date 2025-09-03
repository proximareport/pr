# Render Environment Variables Setup

## ⚠️ CRITICAL SECURITY NOTICE

**NEVER commit real secrets to version control!** The `render.yaml` file has been cleaned of all sensitive data.

## Required Environment Variables for Render

You must set these environment variables in your Render dashboard:

### Database
```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

### Ghost CMS
```
GHOST_URL=https://your-ghost-site.ghost.io
GHOST_ADMIN_API_KEY=your-actual-ghost-admin-api-key
GHOST_CONTENT_API_KEY=your-actual-ghost-content-api-key
```

### Session Security
```
SESSION_SECRET=your-super-secure-session-secret-min-32-chars
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
```

### Stripe (if using payments)
```
STRIPE_SECRET_KEY=sk_live_your-actual-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-actual-webhook-secret
STRIPE_TIER1_PRICE_ID=price_your-tier1-monthly-price-id
STRIPE_TIER1_YEARLY_PRICE_ID=price_your-tier1-yearly-price-id
STRIPE_TIER2_PRICE_ID=price_your-tier2-monthly-price-id
STRIPE_TIER2_YEARLY_PRICE_ID=price_your-tier2-yearly-price-id
STRIPE_TIER3_PRICE_ID=price_your-tier3-monthly-price-id
STRIPE_TIER3_YEARLY_PRICE_ID=price_your-tier3-yearly-price-id
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
VITE_STRIPE_TIER1_PRICE_ID=price_your-tier1-monthly-price-id
VITE_STRIPE_TIER1_YEARLY_PRICE_ID=price_your-tier1-yearly-price-id
VITE_STRIPE_TIER2_PRICE_ID=price_your-tier2-monthly-price-id
VITE_STRIPE_TIER2_YEARLY_PRICE_ID=price_your-tier2-yearly-price-id
VITE_STRIPE_TIER3_PRICE_ID=price_your-tier3-monthly-price-id
VITE_STRIPE_TIER3_YEARLY_PRICE_ID=price_your-tier3-yearly-price-id
```

### URLs
```
CLIENT_URL=https://proximareport.com
VITE_API_BASE_URL=https://proximareport.com
```

## How to Set Environment Variables in Render

1. Go to your Render dashboard
2. Select your service
3. Go to "Environment" tab
4. Add each variable with its real value
5. Save and redeploy

## Security Best Practices

- Use strong, unique secrets (minimum 32 characters)
- Rotate secrets regularly
- Never share secrets in chat/email
- Use different secrets for different environments
- Monitor for unauthorized access

## Emergency Secret Rotation

If secrets are compromised:
1. Generate new secrets immediately
2. Update all environment variables
3. Redeploy the application
4. Review access logs
5. Update any dependent services
