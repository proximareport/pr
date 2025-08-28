import Stripe from "stripe";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import type { Request, Response } from "express";

// Initialize Stripe with a dummy key if no real key provided
// This allows the server to start without a valid API key
// In production, you should always use a valid API key
export let stripe: Stripe;
try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: "2025-05-28.basil",
  });
} catch (error) {
  console.warn("Stripe initialization failed, payments will not work until a valid API key is provided");
  // @ts-ignore - Create a dummy stripe object to prevent crashes
  stripe = {
    customers: { 
      create: async () => ({ id: 'dummy', object: 'customer' } as any), 
      retrieve: async () => ({ id: 'dummy', object: 'customer' } as any) 
    },
    checkout: { sessions: { create: async () => ({ id: 'dummy', url: 'dummy' } as any) } },
    webhooks: { constructEvent: () => ({ type: 'dummy' } as any) },
    subscriptions: { retrieve: async () => ({ id: 'dummy' } as any), update: async () => ({ id: 'dummy' } as any) },
  };
}

// Price IDs for subscription tiers
export const SUBSCRIPTION_PRICES = {
  tier1: process.env.STRIPE_TIER1_PRICE_ID,
  tier2: process.env.STRIPE_TIER2_PRICE_ID,
  tier3: process.env.STRIPE_TIER3_PRICE_ID,
};

// Create a Stripe checkout session
export async function createStripeCheckoutSession(user: User, priceId: string) {
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
