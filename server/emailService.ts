import mail from '@sendgrid/mail';
import crypto from 'crypto';
import { db } from './db';
import { newsletterSubscriptions, newsletterSentHistory, articles } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Initialize with a default empty key - we'll use environment variable in production
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || 'SG.example_key';
mail.setApiKey(SENDGRID_API_KEY);

interface SendNewsletterParams {
  articleId: number;
  subject: string;
  fromEmail: string;
  fromName: string;
}

export async function sendNewsletterEmail(params: SendNewsletterParams): Promise<boolean> {
  try {
    // Get article details
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, params.articleId));

    if (!article) {
      console.error(`Article with ID ${params.articleId} not found`);
      return false;
    }

    // Ensure article is a newsletter and is published
    if (!article.isNewsletter || !article.publishedAt) {
      console.error(`Article is not a newsletter or is not published: ${article.id}`);
      return false;
    }

    // Get active subscribers
    const subscribers = await db
      .select()
      .from(newsletterSubscriptions)
      .where(and(
        eq(newsletterSubscriptions.isActive, true),
        eq(newsletterSubscriptions.isVerified, true)
      ));

    if (subscribers.length === 0) {
      console.log('No active subscribers found');
      return false;
    }

    // Create content from article (simplified for example)
    const htmlContent = `
      <h1>${article.title}</h1>
      <p>${article.summary}</p>
      <p>Read the full article: <a href="https://${process.env.REPLIT_DOMAINS}/articles/${article.slug}">Click here</a></p>
      <hr>
      <p>You are receiving this email because you subscribed to Proxima Report newsletters. 
      <a href="https://${process.env.REPLIT_DOMAINS}/unsubscribe?token=\${unsubscribeToken}">Unsubscribe</a></p>
    `;

    const textContent = `
      ${article.title}
      
      ${article.summary}
      
      Read the full article: https://${process.env.REPLIT_DOMAINS}/articles/${article.slug}
      
      You are receiving this email because you subscribed to Proxima Report newsletters.
      To unsubscribe: https://${process.env.REPLIT_DOMAINS}/unsubscribe?token=\${unsubscribeToken}
    `;

    // Send emails to each subscriber
    const emailPromises = subscribers.map(subscriber => {
      const personalizedHtml = htmlContent.replace('\${unsubscribeToken}', subscriber.unsubscribeToken);
      const personalizedText = textContent.replace('\${unsubscribeToken}', subscriber.unsubscribeToken);

      const msg = {
        to: subscriber.email,
        from: {
          email: params.fromEmail,
          name: params.fromName,
        },
        subject: params.subject,
        text: personalizedText,
        html: personalizedHtml,
      };

      return mail.send(msg);
    });

    // Wait for all emails to be sent
    await Promise.all(emailPromises);

    // Record newsletter sent
    await db.insert(newsletterSentHistory).values({
      articleId: article.id,
      subject: params.subject,
      recipientCount: subscribers.length,
    });

    // Update article to mark as sent
    await db
      .update(articles)
      .set({ newsletterSentAt: new Date() })
      .where(eq(articles.id, article.id));

    return true;
  } catch (error) {
    console.error('Error sending newsletter emails:', error);
    return false;
  }
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function subscribeToNewsletter(email: string, userId?: number): Promise<{success: boolean, message: string}> {
  try {
    const existingSubscription = await db
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.email, email));

    if (existingSubscription.length > 0) {
      if (existingSubscription[0].isActive) {
        return { 
          success: false, 
          message: 'This email is already subscribed to our newsletter.' 
        };
      } else {
        // Reactivate existing subscription
        await db
          .update(newsletterSubscriptions)
          .set({ 
            isActive: true,
            verificationToken: generateToken(),
            unsubscribeToken: generateToken()
          })
          .where(eq(newsletterSubscriptions.id, existingSubscription[0].id));

        return { 
          success: true, 
          message: 'Your subscription has been reactivated. Please check your email to verify.' 
        };
      }
    }

    // Create new subscription
    const verificationToken = generateToken();
    const unsubscribeToken = generateToken();

    await db.insert(newsletterSubscriptions).values({
      email,
      userId: userId || null,
      verificationToken,
      unsubscribeToken,
      isVerified: false, // Requires email verification
      isActive: true,
    });

    // In a real implementation, we would send verification email here
    // For now, we'll just mark it as verified for testing
    if (process.env.NODE_ENV !== 'production') {
      await db
        .update(newsletterSubscriptions)
        .set({ isVerified: true })
        .where(eq(newsletterSubscriptions.email, email));
    }

    return { 
      success: true, 
      message: 'Thanks for subscribing! Please check your email to confirm your subscription.' 
    };
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return { 
      success: false, 
      message: 'An error occurred while processing your subscription. Please try again later.' 
    };
  }
}

export async function unsubscribeFromNewsletter(token: string): Promise<{success: boolean, message: string}> {
  try {
    const [subscription] = await db
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.unsubscribeToken, token));

    if (!subscription) {
      return { 
        success: false, 
        message: 'Invalid unsubscribe link. Please check your email and try again.' 
      };
    }

    await db
      .update(newsletterSubscriptions)
      .set({ isActive: false })
      .where(eq(newsletterSubscriptions.id, subscription.id));

    return { 
      success: true, 
      message: 'You have been successfully unsubscribed from our newsletter.' 
    };
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    return { 
      success: false, 
      message: 'An error occurred while processing your request. Please try again later.' 
    };
  }
}

export async function verifySubscription(token: string): Promise<{success: boolean, message: string}> {
  try {
    const [subscription] = await db
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.verificationToken, token));

    if (!subscription) {
      return { 
        success: false, 
        message: 'Invalid verification link. Please check your email and try again.' 
      };
    }

    await db
      .update(newsletterSubscriptions)
      .set({ 
        isVerified: true,
        verificationToken: null 
      })
      .where(eq(newsletterSubscriptions.id, subscription.id));

    return { 
      success: true, 
      message: 'Your subscription has been successfully verified. Thank you!' 
    };
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return { 
      success: false, 
      message: 'An error occurred while processing your request. Please try again later.' 
    };
  }
}