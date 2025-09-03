# Get Your Stripe Price IDs - Quick Guide

## You Need These 6 Price IDs (3 tiers × 2 billing cycles):

### For Render Environment Variables:

**Backend Variables:**
```env
STRIPE_TIER1_PRICE_ID=price_XXXXXXXXXXXXX
STRIPE_TIER1_YEARLY_PRICE_ID=price_XXXXXXXXXXXXX
STRIPE_TIER2_PRICE_ID=price_XXXXXXXXXXXXX
STRIPE_TIER2_YEARLY_PRICE_ID=price_XXXXXXXXXXXXX
STRIPE_TIER3_PRICE_ID=price_XXXXXXXXXXXXX
STRIPE_TIER3_YEARLY_PRICE_ID=price_XXXXXXXXXXXXX
```

**Frontend Variables:**
```env
VITE_STRIPE_TIER1_PRICE_ID=price_XXXXXXXXXXXXX
VITE_STRIPE_TIER1_YEARLY_PRICE_ID=price_XXXXXXXXXXXXX
VITE_STRIPE_TIER2_PRICE_ID=price_XXXXXXXXXXXXX
VITE_STRIPE_TIER2_YEARLY_PRICE_ID=price_XXXXXXXXXXXXX
VITE_STRIPE_TIER3_PRICE_ID=price_XXXXXXXXXXXXX
VITE_STRIPE_TIER3_YEARLY_PRICE_ID=price_XXXXXXXXXXXXX
```

## How to Find Them:

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
2. **Navigate to Products**: Click "Products" in the left sidebar
3. **For each product** (Tier 1, Tier 2, Tier 3):
   - Click on the product name
   - You'll see pricing options like:
     - **Monthly**: $X.XX/month - **Price ID: `price_1ABC123...`**
     - **Yearly**: $XX.XX/year - **Price ID: `price_1XYZ789...`**
   - Copy the Price IDs (the ones starting with `price_`)

## Your Product IDs (for reference):
- **Tier 1 Product**: `prod_SwNe9UsmLEEuFp`
- **Tier 2 Product**: `prod_SwNfWcCCokwXEm`  
- **Tier 3 Product**: `prod_SwNff9i888vYia`

## What You Need to Do:
1. Find the Price IDs for each product in Stripe Dashboard
2. Add all 12 environment variables to Render
3. Deploy and test!

**Note**: Price IDs are different from Product IDs. Products can have multiple prices (monthly/yearly), and each price has its own unique Price ID.
