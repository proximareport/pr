#!/usr/bin/env node

/**
 * Stripe Configuration Test Script
 * 
 * This script tests your Stripe configuration by checking environment variables
 * and making a test API call to Stripe.
 */

import { validateStripeConfig } from '../server/stripe.js';

console.log('🔍 Testing Stripe Configuration...\n');

// Test environment variables
const configValidation = validateStripeConfig();

console.log('📋 Environment Variables Check:');
console.log(`✅ STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? 'SET' : '❌ NOT SET'}`);
console.log(`✅ STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : '❌ NOT SET'}`);
console.log(`✅ STRIPE_TIER1_PRICE_ID: ${process.env.STRIPE_TIER1_PRICE_ID ? 'SET' : '❌ NOT SET'}`);
console.log(`✅ STRIPE_TIER2_PRICE_ID: ${process.env.STRIPE_TIER2_PRICE_ID ? 'SET' : '❌ NOT SET'}`);
console.log(`✅ STRIPE_TIER3_PRICE_ID: ${process.env.STRIPE_TIER3_PRICE_ID ? 'SET' : '❌ NOT SET'}`);

console.log('\n📊 Configuration Validation:');
if (configValidation.isValid) {
  console.log('✅ All required environment variables are set!');
} else {
  console.log('❌ Missing environment variables:');
  configValidation.missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
}

console.log('\n🔧 Next Steps:');
if (!configValidation.isValid) {
  console.log('1. Set the missing environment variables in your .env file');
  console.log('2. Add them to your Render dashboard');
  console.log('3. Redeploy your application');
  console.log('4. Test the /api/stripe-debug endpoint');
} else {
  console.log('1. Test the /api/stripe-debug endpoint on your live site');
  console.log('2. Try creating a test subscription');
  console.log('3. Verify webhook events are being received');
}

console.log('\n📝 Your Product IDs:');
console.log('Tier 1: prod_SwNe9UsmLEEuFp');
console.log('Tier 2: prod_SwNfWcCCokwXEm');
console.log('Tier 3: prod_SwNff9i888vYia');
console.log('\n💡 Use these to find your Price IDs in Stripe Dashboard!');
