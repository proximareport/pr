import Stripe from "stripe";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import type { Request, Response } from "express";

// Initialize Stripe with proper error handling
export let stripe: Stripe;
export let stripeConfigured = false;

// Subscription price mapping
export const SUBSCRIPTION_PRICES = {
  supporter: process.env.STRIPE_TIER1_PRICE_ID || '',
  pro: process.env.STRIPE_TIER2_PRICE_ID || '',
  enterprise: process.env.STRIPE_TIER3_PRICE_ID || '',
} as const;

// Lazy initialization function
function initializeStripe() {
  if (stripeConfigured) {
    return; // Already initialized
  }
  
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    
    // Debug: Check key format (safely)
    const key = process.env.STRIPE_SECRET_KEY;
    console.log("PRODUCTION Stripe key format check:", {
      length: key.length,
      startsWith: key.startsWith('sk_test_'),
      endsWith: key.slice(-10), // Last 10 characters
      hasSpaces: key.includes(' '),
      hasNewlines: key.includes('\n'),
      firstChars: key.slice(0, 20), // First 20 characters
      lastChars: key.slice(-20), // Last 20 characters
      fullKey: key, // Show the full key for debugging
      keyType: typeof key,
      keyBytes: Buffer.from(key).length
    });
    
    // Debug: Check all environment variables
    console.log("All environment variables containing 'STRIPE':", 
      Object.keys(process.env).filter(k => k.includes('STRIPE')).map(k => `${k}=${process.env[k] ? 'SET' : 'NOT SET'}`));
    
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil",
    });
    
    // Set as configured immediately - we'll validate on first use
    stripeConfigured = true;
    console.log("✅ Stripe initialized successfully");
    
  } catch (error) {
    console.error("❌ Stripe initialization failed:", error.message);
    console.warn("⚠️  Payments will not work until a valid STRIPE_SECRET_KEY is provided");
    
    // @ts-ignore - Create a dummy stripe object to prevent crashes
    stripe = {
      customers: { 
        create: async () => { throw new Error("Stripe not configured"); }, 
        retrieve: async () => { throw new Error("Stripe not configured"); },
        list: async () => { throw new Error("Stripe not configured"); }
      },
      checkout: { sessions: { create: async () => { throw new Error("Stripe not configured"); } } },
      webhooks: { constructEvent: () => { throw new Error("Stripe not configured"); } }
    } as any;
  }
}

// Validate Stripe configuration
export function validateStripeConfig(): { isValid: boolean; missingVars: string[] } {
  const missingVars: string[] = [];
  if (!process.env.STRIPE_SECRET_KEY) { missingVars.push('STRIPE_SECRET_KEY'); }
  if (!process.env.STRIPE_TIER1_PRICE_ID) { missingVars.push('STRIPE_TIER1_PRICE_ID'); }
  // Yearly Price IDs are optional (disabled for now)
  // if (!process.env.STRIPE_TIER1_YEARLY_PRICE_ID) {
  //   missingVars.push('STRIPE_TIER1_YEARLY_PRICE_ID');
  // }
  if (!process.env.STRIPE_TIER2_PRICE_ID) { missingVars.push('STRIPE_TIER2_PRICE_ID'); }
  // Yearly Price IDs are optional (disabled for now)
  // if (!process.env.STRIPE_TIER2_YEARLY_PRICE_ID) {
  //   missingVars.push('STRIPE_TIER2_YEARLY_PRICE_ID');
  // }
  if (!process.env.STRIPE_TIER3_PRICE_ID) { missingVars.push('STRIPE_TIER3_PRICE_ID'); }
  // Yearly Price IDs are optional (disabled for now)
  // if (!process.env.STRIPE_TIER3_YEARLY_PRICE_ID) {
  //   missingVars.push('STRIPE_TIER3_YEARLY_PRICE_ID');
  // }
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

// Create a Stripe checkout session
export async function createStripeCheckoutSession(user: User, priceId: string) {
  console.log("Creating checkout session for user:", user?.username, "priceId:", priceId);
  console.log("Stripe configured status:", stripeConfigured);
  
  // Initialize Stripe if not already done
  if (!stripeConfigured) {
    console.log("Initializing Stripe...");
    initializeStripe();
    console.log("Stripe initialization completed. Configured:", stripeConfigured);
  } else {
    console.log("Stripe already configured, skipping initialization");
  }
  
  // Validate Stripe configuration
  const configValidation = validateStripeConfig();
  if (!configValidation.isValid) {
    console.error("Stripe validation failed:", configValidation.missingVars);
    throw new Error(`Stripe configuration incomplete. Missing: ${configValidation.missingVars.join(', ')}`);
  }
  
  if (!stripeConfigured) {
    throw new Error("Stripe is not properly configured. Please check your API key.");
  }

  // Determine tier name from price ID
  let tierName = 'unknown';
  if (priceId === process.env.STRIPE_TIER1_PRICE_ID) {
    tierName = 'tier1';
  } else if (priceId === process.env.STRIPE_TIER2_PRICE_ID) {
    tierName = 'tier2';
  } else if (priceId === process.env.STRIPE_TIER3_PRICE_ID) {
    tierName = 'tier3';
  }

  // Get or create Stripe customer
  let customerId: string;
  
  // Check if user already has a Stripe customer ID
  if (user.stripeCustomerId) {
    try {
      // Verify the customer still exists in Stripe
      await stripe.customers.retrieve(user.stripeCustomerId);
      customerId = user.stripeCustomerId;
      console.log("Using existing Stripe customer ID:", customerId);
    } catch (error) {
      console.log("Existing customer ID invalid, creating new customer:", error.message);
      // Customer doesn't exist, create a new one
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: {
          userId: user.id.toString(),
          username: user.username
        }
      });
      
      customerId = customer.id;
      console.log("Created new Stripe customer with ID:", customerId);
      
      // Update user record with new Stripe customer ID
      await storage.updateUser(user.id, { stripeCustomerId: customerId });
      console.log("Updated user record with new Stripe customer ID");
    }
  } else {
    // Create new Stripe customer
    console.log("Creating new Stripe customer for user:", user.username);
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.username,
      metadata: {
        userId: user.id.toString(),
        username: user.username
      }
    });
    
    customerId = customer.id;
    console.log("Created Stripe customer with ID:", customerId);
    
    // Update user record with Stripe customer ID
    await storage.updateUser(user.id, { stripeCustomerId: customerId });
    console.log("Updated user record with Stripe customer ID");
  }

  // Create the checkout session
  console.log("Creating Stripe checkout session with customerId:", customerId);
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.APP_URL || 'http://localhost:5000'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:5000'}/subscription/cancel`,
      metadata: {
        userId: user.id.toString(),
        tier: tierName,
      },
    });

    console.log("✅ Stripe checkout session created successfully:", session.id);
    return session;
  } catch (error) {
    console.error("❌ Error creating Stripe checkout session:", error);
    throw error;
  }
}

// Handle Stripe webhook events
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(400).send('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received Stripe webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);
        
        // Update user subscription status
        if (session.metadata?.userId) {
          const userId = parseInt(session.metadata.userId);
          const tier = session.metadata.tier;
          
          // Update user's subscription status
          await storage.updateUserMembership(userId, tier as any);
          await storage.updateUserStripeInfo(userId, {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string
          });
          
          console.log(`Updated user ${userId} subscription to ${tier}`);
        }
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription.id);
        // Handle subscription updates
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', deletedSubscription.id);
        // Handle subscription cancellation
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Get user subscription status
export async function getUserSubscription(userId: number) {
  const subscription = await storage.getUserSubscription(userId);
  return subscription;
}

// Cancel user subscription
export async function cancelUserSubscription(userId: number) {
  const subscription = await storage.getUserSubscription(userId);
  
  if (!subscription?.stripeSubscriptionId) {
    throw new Error('No active subscription found');
  }

  // Cancel the subscription in Stripe
  await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
  
  // Update local subscription status - set membership back to free
  await storage.updateUserMembership(userId, 'free');

  return { success: true };
}
