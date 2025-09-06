# Production Stripe Setup Guide

## Your Production Product IDs

You have the following **Product IDs** from Stripe:
- **Tier 1**: `prod_T0N6il3QB3a6km`
- **Tier 2**: `prod_T0N7MNBmjkEqxB`
- **Tier 3**: `prod_T0NDfAURa00xvL`

## What You Need to Do

**IMPORTANT**: These are Product IDs, but your application needs **Price IDs**. You need to create prices for each product in your Stripe Dashboard.

### Step 1: Create Prices in Stripe Dashboard

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** section
3. For each product, you need to create a **Price**:

#### For Tier 1 (prod_T0N6il3QB3a6km):
- Create a monthly recurring price (e.g., $9.99/month)
- Copy the **Price ID** (starts with `price_`)

#### For Tier 2 (prod_T0N7MNBmjkEqxB):
- Create a monthly recurring price (e.g., $19.99/month)
- Copy the **Price ID** (starts with `price_`)

#### For Tier 3 (prod_T0NDfAURa00xvL):
- Create a monthly recurring price (e.g., $39.99/month)
- Copy the **Price ID** (starts with `price_`)

### Step 2: Update Environment Variables

Once you have the Price IDs, update your production environment variables:

```bash
# Production Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your-actual-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_TIER1_PRICE_ID=price_your-actual-tier1-price-id
STRIPE_TIER2_PRICE_ID=price_your-actual-tier2-price-id
STRIPE_TIER3_PRICE_ID=price_your-actual-tier3-price-id

# Frontend Environment Variables
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key
VITE_STRIPE_TIER1_PRICE_ID=price_your-actual-tier1-price-id
VITE_STRIPE_TIER2_PRICE_ID=price_your-actual-tier2-price-id
VITE_STRIPE_TIER3_PRICE_ID=price_your-actual-tier3-price-id
```

### Step 3: Test the Configuration

After updating the environment variables, test that the price IDs are being served correctly:

1. Check the `/api/stripe/price-ids` endpoint
2. Verify the frontend can load the pricing information
3. Test a subscription flow (use a test card in production mode)

## Important Notes

- **Product IDs** (`prod_`) are used to group related prices
- **Price IDs** (`price_`) are what you actually use for checkout sessions
- You can create multiple prices for the same product (monthly, yearly, etc.)
- Make sure to use **live** keys (`sk_live_`, `pk_live_`) for production
- Test thoroughly before going live with real customers

## Current Status

✅ Product IDs received  
⏳ Need to create Price IDs in Stripe Dashboard  
⏳ Need to update environment variables  
⏳ Need to test configuration  

Once you have the Price IDs, let me know and I can help you update the configuration!
