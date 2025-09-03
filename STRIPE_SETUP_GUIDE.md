# Stripe Subscription Setup Guide

This guide will help you set up the 3-tier subscription system for Proxima Report.

## Prerequisites

1. A Stripe account (create one at [stripe.com](https://stripe.com))
2. Database connection configured
3. Environment variables set up

## Step 1: Set Up Database

Run the database migration to create all required tables:

```bash
# Make the script executable
chmod +x scripts/setup-database.js

# Run the database setup
node scripts/setup-database.js
```

Or manually run the migration:

```bash
npx tsx server/migrate.ts
```

## Step 2: Create Stripe Products and Prices

### 2.1 Create Products in Stripe Dashboard

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Add Product**

Create these 3 products:

#### Tier 1 Supporter
- **Name**: Tier 1 Supporter
- **Description**: Enhanced features and exclusive content
- **Monthly Price**: $2.99/month
- **Yearly Price**: $23.90/year (20% discount)

#### Tier 2 Supporter  
- **Name**: Tier 2 Supporter
- **Description**: Advanced features with Proxihub and Mission Control
- **Monthly Price**: $4.99/month
- **Yearly Price**: $39.90/year (20% discount)

#### Tier 3 Supporter
- **Name**: Tier 3 Supporter  
- **Description**: Ultimate space enthusiast experience
- **Monthly Price**: $9.99/month
- **Yearly Price**: $79.90/year (25% discount)

### 2.2 Get Price IDs

After creating each product, copy the **Price ID** (starts with `price_`) for both monthly and yearly options.

## Step 3: Configure Environment Variables

Add these environment variables to your `.env` file and Render dashboard:

### Server-side (Backend)
```env
STRIPE_SECRET_KEY=sk_live_your-actual-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-actual-webhook-secret
STRIPE_TIER1_PRICE_ID=price_your-tier1-monthly-price-id
STRIPE_TIER2_PRICE_ID=price_your-tier2-monthly-price-id
STRIPE_TIER3_PRICE_ID=price_your-tier3-monthly-price-id
```

### Client-side (Frontend)
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
VITE_STRIPE_TIER1_PRICE_ID=price_your-tier1-monthly-price-id
VITE_STRIPE_TIER1_YEARLY_PRICE_ID=price_your-tier1-yearly-price-id
VITE_STRIPE_TIER2_PRICE_ID=price_your-tier2-monthly-price-id
VITE_STRIPE_TIER2_YEARLY_PRICE_ID=price_your-tier2-yearly-price-id
VITE_STRIPE_TIER3_PRICE_ID=price_your-tier3-monthly-price-id
VITE_STRIPE_TIER3_YEARLY_PRICE_ID=price_your-tier3-yearly-price-id
```

## Step 4: Set Up Webhooks

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to: `https://yourdomain.com/api/stripe-webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Step 5: Test the Setup

### 5.1 Check Stripe Configuration
Visit: `https://yourdomain.com/api/stripe-debug`

This should show:
```json
{
  "stripeConfigured": true,
  "configValidation": {
    "isValid": true,
    "missingVars": []
  },
  "hasSecretKey": true,
  "hasWebhookSecret": true,
  "priceIds": {
    "tier1": true,
    "tier2": true,
    "tier3": true
  }
}
```

### 5.2 Test Subscription Flow
1. Go to your pricing page
2. Click on a subscription tier
3. Complete the Stripe checkout
4. Verify the subscription is created in Stripe Dashboard
5. Check that user's subscription status is updated in your database

## Step 6: Production Checklist

- [ ] Database migration completed
- [ ] All Stripe products and prices created
- [ ] Environment variables set in production
- [ ] Webhook endpoint configured
- [ ] Stripe debug endpoint shows all green
- [ ] Test subscription flow works end-to-end
- [ ] Webhook events are being received
- [ ] User subscription status updates correctly

## Troubleshooting

### Common Issues

1. **"Stripe not configured" error**
   - Check that `STRIPE_SECRET_KEY` is set correctly
   - Verify the API key is valid and has the right permissions

2. **"Invalid price ID" error**
   - Ensure all `STRIPE_TIER*_PRICE_ID` environment variables are set
   - Verify the price IDs exist in your Stripe account

3. **Webhook not receiving events**
   - Check webhook URL is accessible
   - Verify webhook secret is correct
   - Ensure webhook events are selected

4. **Database errors**
   - Run the migration script again
   - Check database connection
   - Verify user has proper permissions

### Debug Endpoints

- `/api/stripe-debug` - Check Stripe configuration
- `/api/session-debug` - Check session status
- `/api/debug/env` - Check environment variables

## Support

If you encounter issues:
1. Check the debug endpoints
2. Review server logs
3. Verify Stripe Dashboard for errors
4. Test with Stripe's test mode first
