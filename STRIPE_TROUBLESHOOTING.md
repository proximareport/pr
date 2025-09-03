# Stripe Configuration Troubleshooting

## Current Issue: "Failed to load subscription configuration"

This error occurs because the new API endpoint `/api/stripe/price-ids` hasn't been deployed yet. Here are the solutions:

## Solution 1: Deploy the New Code (Recommended)

1. **Commit and push your changes:**
   ```bash
   git add .
   git commit -m "Add Stripe price ID API endpoint and fallback"
   git push
   ```

2. **Deploy to Render:**
   - Go to your Render dashboard
   - Trigger a manual deployment
   - Wait for deployment to complete

3. **Test the endpoint:**
   ```bash
   curl https://proximareport.com/api/stripe/price-ids
   ```
   Should return JSON, not HTML.

## Solution 2: Set Frontend Environment Variables (Quick Fix)

If you can't deploy immediately, set these environment variables in your Render dashboard:

### Frontend Environment Variables (VITE_*)
```env
VITE_STRIPE_TIER1_PRICE_ID=price_your_tier1_monthly_price_id
VITE_STRIPE_TIER1_YEARLY_PRICE_ID=price_your_tier1_yearly_price_id
VITE_STRIPE_TIER2_PRICE_ID=price_your_tier2_monthly_price_id
VITE_STRIPE_TIER2_YEARLY_PRICE_ID=price_your_tier2_yearly_price_id
VITE_STRIPE_TIER3_PRICE_ID=price_your_tier3_monthly_price_id
VITE_STRIPE_TIER3_YEARLY_PRICE_ID=price_your_tier3_yearly_price_id
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

### Backend Environment Variables
```env
STRIPE_TIER1_PRICE_ID=price_your_tier1_monthly_price_id
STRIPE_TIER1_YEARLY_PRICE_ID=price_your_tier1_yearly_price_id
STRIPE_TIER2_PRICE_ID=price_your_tier2_monthly_price_id
STRIPE_TIER2_YEARLY_PRICE_ID=price_your_tier2_yearly_price_id
STRIPE_TIER3_PRICE_ID=price_your_tier3_monthly_price_id
STRIPE_TIER3_YEARLY_PRICE_ID=price_your_tier3_yearly_price_id
```

## How to Get Your Price IDs

1. **Go to Stripe Dashboard:**
   - Visit [dashboard.stripe.com](https://dashboard.stripe.com)
   - Navigate to **Products**

2. **For each product (Tier 1, Tier 2, Tier 3):**
   - Click on the product
   - You'll see pricing options like:
     - Monthly: $2.99/month - **Price ID: `price_1ABC123monthly`**
     - Yearly: $23.90/year - **Price ID: `price_1ABC123yearly`**
   - Copy the Price IDs (the ones starting with `price_`)

## Testing the Fix

1. **Check the debug endpoint:**
   ```
   https://proximareport.com/api/stripe-debug
   ```
   Should show all price IDs as `true`.

2. **Test the pricing page:**
   - Go to `/pricing`
   - Should load without "Failed to load subscription configuration" error
   - Try clicking on a subscription tier

## Current Status

- ✅ **Backend API endpoint created** (`/api/stripe/price-ids`)
- ✅ **Frontend hook created** (`useStripeConfig`)
- ✅ **Fallback to environment variables** implemented
- ✅ **Error handling and loading states** added
- ⏳ **Code needs to be deployed** to production

## Next Steps

1. **Get your Price IDs from Stripe Dashboard**
2. **Add environment variables to Render**
3. **Deploy the new code**
4. **Test the subscription flow**

The system will work with either approach:
- **New API endpoint** (after deployment) - more secure and flexible
- **Environment variables** (immediate) - works with current deployment
