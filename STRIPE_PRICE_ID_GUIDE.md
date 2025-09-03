# How to Get Stripe Price IDs

You have the Product IDs, now you need to get the Price IDs for each subscription tier.

## Your Current Product IDs:
- **Tier 1**: `prod_SwNe9UsmLEEuFp`
- **Tier 2**: `prod_SwNfWcCCokwXEm` 
- **Tier 3**: `prod_SwNff9i888vYia`

## How to Get Price IDs:

### Method 1: Stripe Dashboard
1. Go to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products**
3. Click on each product (Tier 1, Tier 2, Tier 3)
4. You'll see the pricing options for each product
5. Copy the **Price ID** (starts with `price_`) for both monthly and yearly options

### Method 2: Stripe CLI (if you have it installed)
```bash
# List all prices for a specific product
stripe prices list --product=prod_SwNe9UsmLEEuFp
stripe prices list --product=prod_SwNfWcCCokwXEm
stripe prices list --product=prod_SwNff9i888vYia
```

### Method 3: API Call
You can also get them via API:
```bash
curl -u sk_live_your_secret_key: \
  https://api.stripe.com/v1/prices?product=prod_SwNe9UsmLEEuFp
```

## What You Need to Find:

For each product, you need **2 Price IDs**:
- **Monthly Price ID** (e.g., `price_1ABC123monthly`)
- **Yearly Price ID** (e.g., `price_1ABC123yearly`)

## Environment Variables to Set:

Once you have the Price IDs, add them to your environment variables:

### Server-side (Backend)
```env
STRIPE_TIER1_PRICE_ID=price_your_tier1_monthly_price_id
STRIPE_TIER2_PRICE_ID=price_your_tier2_monthly_price_id
STRIPE_TIER3_PRICE_ID=price_your_tier3_monthly_price_id
```

### Client-side (Frontend)
```env
VITE_STRIPE_TIER1_PRICE_ID=price_your_tier1_monthly_price_id
VITE_STRIPE_TIER1_YEARLY_PRICE_ID=price_your_tier1_yearly_price_id
VITE_STRIPE_TIER2_PRICE_ID=price_your_tier2_monthly_price_id
VITE_STRIPE_TIER2_YEARLY_PRICE_ID=price_your_tier2_yearly_price_id
VITE_STRIPE_TIER3_PRICE_ID=price_your_tier3_monthly_price_id
VITE_STRIPE_TIER3_YEARLY_PRICE_ID=price_your_tier3_yearly_price_id
```

## Quick Check:
After setting the environment variables, visit:
`https://proximareport.com/api/stripe-debug`

This should show all price IDs as `true` instead of `false`.

## Example of What You're Looking For:
In your Stripe Dashboard, when you click on a product, you should see something like:
- **Monthly**: $2.99/month - Price ID: `price_1ABC123monthly`
- **Yearly**: $23.90/year - Price ID: `price_1ABC123yearly`

Copy those Price IDs (the ones starting with `price_`) and add them to your environment variables.
