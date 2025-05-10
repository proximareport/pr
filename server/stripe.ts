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
    apiVersion: "2023-10-16",
  });
} catch (error) {
  console.warn("Stripe initialization failed, payments will not work until a valid API key is provided");
  // @ts-ignore - Create a dummy stripe object to prevent crashes
  stripe = {
    customers: { create: async () => ({}), retrieve: async () => ({}) },
    checkout: { sessions: { create: async () => ({}) } },
    webhooks: { constructEvent: () => ({}) },
    subscriptions: { retrieve: async () => ({}), update: async () => ({}) },
  };
}

// Price IDs for subscription tiers
export const SUBSCRIPTION_PRICES = {
  supporter: process.env.STRIPE_SUPPORTER_PRICE_ID || 'price_supporter',
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
};

// Create a Stripe checkout session
export async function createStripeCheckoutSession(user: User, priceId: string) {
  // Determine which subscription tier the user is purchasing
  let tierName: 'supporter' | 'pro';
  if (priceId === SUBSCRIPTION_PRICES.supporter) {
    tierName = 'supporter';
  } else if (priceId === SUBSCRIPTION_PRICES.pro) {
    tierName = 'pro';
  } else {
    throw new Error('Invalid price ID');
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

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed', err);
    return res.status(400).send('Webhook signature verification failed');
  }

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      // Process the checkout session
      await handleCheckoutSessionCompleted(session);
      break;
      
    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription;
      // Process subscription update
      await handleSubscriptionUpdated(subscription);
      break;
      
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      // Process subscription deletion
      await handleSubscriptionDeleted(deletedSubscription);
      break;
      
    case 'invoice.payment_failed':
      const invoice = event.data.object as Stripe.Invoice;
      // Handle failed payment
      await handlePaymentFailed(invoice);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}

// Helper functions for handling webhook events

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Get the user ID from metadata
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier as 'supporter' | 'pro';
  
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
  await storage.updateUser(parseInt(userId), {
    stripeSubscriptionId: subscription.id,
  });
  
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
    let tier: 'supporter' | 'pro' | 'free' = 'free';
    
    if (priceId === SUBSCRIPTION_PRICES.supporter) {
      tier = 'supporter';
    } else if (priceId === SUBSCRIPTION_PRICES.pro) {
      tier = 'pro';
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
    
    // Update the user to free tier
    await storage.updateUserMembership(parseInt(userIdFromCustomer), 'free');
    
    // Remove subscription ID from user
    await storage.updateUser(parseInt(userIdFromCustomer), {
      stripeSubscriptionId: null,
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Get the subscription
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) {
    console.error('Missing subscription in invoice');
    return;
  }
  
  // Retrieve the subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
  
  // Get the user ID from the subscription metadata
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
    
    // If payment fails repeatedly, the subscription will be marked as unpaid
    // and eventually canceled, which will trigger the subscription.deleted event
    // We don't need to downgrade the user yet, as they may still pay the invoice
    console.log(`Payment failed for user ${userIdFromCustomer} and subscription ${subscriptionId}`);
  }
}
