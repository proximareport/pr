import Stripe from "stripe";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import type { Request, Response } from "express";

// Initialize Stripe with proper error handling
export let stripe: Stripe;
export let stripeConfigured = false;

try {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }
  
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
  });
  
  // Verify the API key by making a test call
  stripe.customers.list({ limit: 1 }).then(() => {
    stripeConfigured = true;
    console.log("✅ Stripe initialized successfully");
  }).catch((error) => {
    console.error("❌ Stripe API key validation failed:", error.message);
    stripeConfigured = false;
  });
  
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
    webhooks: { constructEvent: () => { throw new Error("Stripe not configured"); } },
    subscriptions: { 
      retrieve: async () => { throw new Error("Stripe not configured"); }, 
      update: async () => { throw new Error("Stripe not configured"); } 
    },
  };
}

// Price IDs for subscription tiers
export const SUBSCRIPTION_PRICES = {
  tier1: process.env.STRIPE_TIER1_PRICE_ID,
  tier2: process.env.STRIPE_TIER2_PRICE_ID,
  tier3: process.env.STRIPE_TIER3_PRICE_ID,
};

// Validate Stripe configuration
export function validateStripeConfig(): { isValid: boolean; missingVars: string[] } {
  const missingVars: string[] = [];
  
  if (!process.env.STRIPE_SECRET_KEY) {
    missingVars.push('STRIPE_SECRET_KEY');
  }
  
  if (!process.env.STRIPE_TIER1_PRICE_ID) {
    missingVars.push('STRIPE_TIER1_PRICE_ID');
  }
  
  if (!process.env.STRIPE_TIER1_YEARLY_PRICE_ID) {
    missingVars.push('STRIPE_TIER1_YEARLY_PRICE_ID');
  }
  
  if (!process.env.STRIPE_TIER2_PRICE_ID) {
    missingVars.push('STRIPE_TIER2_PRICE_ID');
  }
  
  if (!process.env.STRIPE_TIER2_YEARLY_PRICE_ID) {
    missingVars.push('STRIPE_TIER2_YEARLY_PRICE_ID');
  }
  
  if (!process.env.STRIPE_TIER3_PRICE_ID) {
    missingVars.push('STRIPE_TIER3_PRICE_ID');
  }
  
  if (!process.env.STRIPE_TIER3_YEARLY_PRICE_ID) {
    missingVars.push('STRIPE_TIER3_YEARLY_PRICE_ID');
  }
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

// Create a Stripe checkout session
export async function createStripeCheckoutSession(user: User, priceId: string) {
  // Validate Stripe configuration
  const configValidation = validateStripeConfig();
  if (!configValidation.isValid) {
    throw new Error(`Stripe configuration incomplete. Missing: ${configValidation.missingVars.join(', ')}`);
  }
  
  if (!stripeConfigured) {
    throw new Error("Stripe is not properly configured. Please check your API key.");
  }
  
  // Determine which subscription tier the user is purchasing
  let tierName: 'tier1' | 'tier2' | 'tier3';
  if (priceId === process.env.STRIPE_TIER1_PRICE_ID) {
    tierName = 'tier1';
  } else if (priceId === process.env.STRIPE_TIER2_PRICE_ID) {
    tierName = 'tier2';
  } else if (priceId === process.env.STRIPE_TIER3_PRICE_ID) {
    tierName = 'tier3';
  } else {
    throw new Error(`Invalid price ID: ${priceId}. Valid options are: ${process.env.STRIPE_TIER1_PRICE_ID}, ${process.env.STRIPE_TIER2_PRICE_ID}, ${process.env.STRIPE_TIER3_PRICE_ID}`);
  }

  // Create or get Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.username,
      metadata: {
        userId: user.id.toString(),
      },
    });
    customerId = customer.id;
    
    // Update user with Stripe customer ID
    await storage.updateUser(user.id, { stripeCustomerId: customerId });
  }

  // Create the checkout session
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

  return session;
}

// Handle Stripe webhook events
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  
  if (!sig) {
    return res.status(400).send('Missing Stripe signature');
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    console.log('Received webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).send(`Webhook Error: ${errorMessage}`);
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Get the user ID from metadata
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier as 'tier1' | 'tier2' | 'tier3';
  
  if (!userId || !tier) {
    console.error('Missing userId or tier in session metadata');
    return;
  }
  
  // Get the subscription
  if (!session.subscription) {
    console.error('Missing subscription in session');
    return;
  }
  
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );
  
  // Update user with subscription ID and tier
  await storage.updateUser(parseInt(userId), { stripeSubscriptionId: subscription.id });
  
  // Update user membership tier
  await storage.updateUserMembership(parseInt(userId), tier);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Find the user with this subscription
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    // Try to find user by customer ID
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (customer.deleted) {
      console.error('Customer deleted');
      return;
    }
    
    const userIdFromCustomer = customer.metadata?.userId;
    if (!userIdFromCustomer) {
      console.error('Could not find userId in customer metadata');
      return;
    }
    
    // Determine the tier from the price ID
    const priceId = subscription.items.data[0].price.id;
    let tier: 'tier1' | 'tier2' | 'tier3' | 'free' = 'free';
    
    if (priceId.includes('tier1')) {
      tier = 'tier1';
    } else if (priceId.includes('tier2')) {
      tier = 'tier2';
    } else if (priceId.includes('tier3')) {
      tier = 'tier3';
    }
    
    // Update the user's subscription status
    if (subscription.status === 'active') {
      await storage.updateUserMembership(parseInt(userIdFromCustomer), tier);
    } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
      await storage.updateUserMembership(parseInt(userIdFromCustomer), 'free');
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Find the user with this subscription
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    // Try to find user by customer ID
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (customer.deleted) {
      console.error('Customer deleted');
      return;
    }
    
    const userIdFromCustomer = customer.metadata?.userId;
    if (!userIdFromCustomer) {
      console.error('Could not find userId in customer metadata');
      return;
    }
    
    // Update user membership to free
    await storage.updateUserMembership(parseInt(userIdFromCustomer), 'free');
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payment - could downgrade user or send notification
  console.log('Invoice payment failed:', invoice.id);
  
  // If you need to access the subscription from the invoice
  if (invoice.subscription && typeof invoice.subscription === 'string') {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    // Handle failed payment logic here
  }
}
