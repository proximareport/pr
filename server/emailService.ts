import { db } from "./db";
import { v4 as uuidv4 } from "uuid";
import { MailService } from "@sendgrid/mail";
import { 
  articles, 
  newsletterSubscriptions, 
  newsletterSentHistory,
  users
} from "../shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

// Initialize SendGrid client
const mailService = new MailService();

// Check if SendGrid API key is set
const hasSendGridKey = !!process.env.SENDGRID_API_KEY;

if (hasSendGridKey) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY!);
} else {
  console.warn("SENDGRID_API_KEY not set. Email functionality will be simulated for development purposes.");
}

// Interfaces
interface SendNewsletterParams {
  articleId: number;
  subject: string;
  fromEmail: string;
  fromName: string;
}

/**
 * Send newsletter email for a specific article to all subscribers
 */
export async function sendNewsletterEmail(params: SendNewsletterParams): Promise<boolean> {
  try {
    // Get the article
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, params.articleId));

    if (!article) {
      console.error(`Article with ID ${params.articleId} not found`);
      return false;
    }

    // Get active subscribers
    const subscribers = await db
      .select()
      .from(newsletterSubscriptions)
      .where(
        and(
          eq(newsletterSubscriptions.isVerified, true),
          eq(newsletterSubscriptions.isActive, true)
        )
      );

    if (subscribers.length === 0) {
      console.log("No subscribers found for newsletter");
      return false;
    }

    // Prepare article content
    const articleUrl = `${process.env.BASE_URL || 'https://proximareport.com'}/articles/${article.slug}`;
    
    // Generate HTML content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4f46e5;">Proxima Report</h1>
        </div>
        
        ${article.featuredImage ? `
          <div style="margin-bottom: 20px;">
            <img src="${article.featuredImage}" alt="${article.title}" style="max-width: 100%; height: auto; border-radius: 8px;" />
          </div>
        ` : ''}
        
        <h2 style="color: #1f2937; margin-bottom: 10px;">${article.title}</h2>
        
        <div style="color: #4b5563; margin-bottom: 20px;">
          <p>${article.summary}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${articleUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Read Full Article</a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>You're receiving this email because you subscribed to Proxima Report newsletters.</p>
          <p>To unsubscribe, <a href="${process.env.BASE_URL || 'https://proximareport.com'}/newsletter/unsubscribe/{token}" style="color: #4f46e5;">click here</a>.</p>
        </div>
      </div>
    `;

    if (!hasSendGridKey) {
      // When no API key is set, log the emails for development purposes
      console.log("DEVELOPMENT MODE: Would send newsletter emails to", subscribers.length, "subscribers");
      console.log("Newsletter subject:", params.subject);
      console.log("Newsletter article:", article.title);
      console.log("First few subscribers:", subscribers.slice(0, 3).map(s => s.email));
      
      // Still record the history in development mode
      await db.insert(newsletterSentHistory).values({
        articleId: params.articleId,
        recipientCount: subscribers.length,
        subject: params.subject,
      });
      
      // Update the article to mark it as sent
      await db
        .update(articles)
        .set({
          newsletterSentAt: new Date(),
        })
        .where(eq(articles.id, params.articleId));
        
      return true;
    }

    // Send emails to each subscriber when API key is available
    const emailPromises = subscribers.map(subscriber => {
      // Replace the token placeholder with the actual unsubscribe token
      const personalizedHtml = htmlContent.replace('{token}', subscriber.unsubscribeToken);
      
      return mailService.send({
        to: subscriber.email,
        from: {
          email: params.fromEmail,
          name: params.fromName
        },
        subject: params.subject,
        html: personalizedHtml,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      });
    });

    await Promise.all(emailPromises);

    // Record the newsletter sending in history
    await db.insert(newsletterSentHistory).values({
      articleId: params.articleId,
      recipientCount: subscribers.length,
      subject: params.subject,
    });

    // Update the article to mark it as sent
    await db
      .update(articles)
      .set({
        newsletterSentAt: new Date(),
      })
      .where(eq(articles.id, params.articleId));

    return true;
  } catch (error) {
    console.error("Error sending newsletter:", error);
    return false;
  }
}

/**
 * Generate a random token for subscription verification/unsubscribe
 */
export function generateToken(): string {
  return uuidv4();
}

/**
 * Subscribe to newsletter
 */
export async function subscribeToNewsletter(email: string, userId?: number): Promise<{success: boolean, message: string}> {
  try {
    // Check if already subscribed
    const existingSubscription = await db
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.email, email));

    if (existingSubscription.length > 0) {
      // If already subscribed but not verified, resend verification
      if (!existingSubscription[0].isVerified) {
        const verificationToken = generateToken();
        const unsubscribeToken = existingSubscription[0].unsubscribeToken;
        
        await db
          .update(newsletterSubscriptions)
          .set({
            verificationToken,
            userId: userId || existingSubscription[0].userId,
          })
          .where(eq(newsletterSubscriptions.id, existingSubscription[0].id));
        
        // Send verification email (implementation similar to sendNewsletterEmail)
        await sendVerificationEmail(email, verificationToken);
        
        return {
          success: true,
          message: "Verification email has been resent. Please check your inbox."
        };
      }
      
      // If already verified, just return success
      return {
        success: true,
        message: "You are already subscribed to our newsletter."
      };
    }
    
    // Create new subscription
    const verificationToken = generateToken();
    const unsubscribeToken = generateToken();
    
    await db.insert(newsletterSubscriptions).values({
      email,
      userId: userId || undefined,
      verificationToken,
      unsubscribeToken,
    });
    
    // Send verification email
    await sendVerificationEmail(email, verificationToken);
    
    return {
      success: true,
      message: "Thank you for subscribing! Please check your email to verify your subscription."
    };
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    return {
      success: false,
      message: "An error occurred while subscribing. Please try again."
    };
  }
}

/**
 * Verify newsletter subscription with token
 */
export async function verifySubscription(token: string): Promise<{success: boolean, message: string}> {
  try {
    const [subscription] = await db
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.verificationToken, token));
    
    if (!subscription) {
      return {
        success: false,
        message: "Invalid verification token."
      };
    }
    
    await db
      .update(newsletterSubscriptions)
      .set({
        isVerified: true,
        verificationToken: null,
      })
      .where(eq(newsletterSubscriptions.id, subscription.id));
    
    return {
      success: true,
      message: "Your subscription has been verified successfully."
    };
  } catch (error) {
    console.error("Error verifying subscription:", error);
    return {
      success: false,
      message: "An error occurred while verifying your subscription."
    };
  }
}

/**
 * Unsubscribe from newsletter
 */
export async function unsubscribeFromNewsletter(token: string): Promise<{success: boolean, message: string}> {
  try {
    const [subscription] = await db
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.unsubscribeToken, token));
    
    if (!subscription) {
      return {
        success: false,
        message: "Invalid unsubscribe token."
      };
    }
    
    await db
      .update(newsletterSubscriptions)
      .set({
        isActive: false,
      })
      .where(eq(newsletterSubscriptions.id, subscription.id));
    
    return {
      success: true,
      message: "You have been unsubscribed from our newsletter."
    };
  } catch (error) {
    console.error("Error unsubscribing from newsletter:", error);
    return {
      success: false,
      message: "An error occurred while processing your unsubscribe request."
    };
  }
}

/**
 * Send verification email for newsletter subscription
 */
async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  try {
    const verificationUrl = `${process.env.BASE_URL || 'https://proximareport.com'}/newsletter/verify/${token}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4f46e5;">Proxima Report</h1>
        </div>
        
        <h2 style="color: #1f2937; margin-bottom: 10px;">Verify Your Newsletter Subscription</h2>
        
        <div style="color: #4b5563; margin-bottom: 20px;">
          <p>Thank you for subscribing to the Proxima Report newsletter. Please click the button below to verify your email address.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Subscription</a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>If you did not request this subscription, you can ignore this email.</p>
        </div>
      </div>
    `;
    
    if (!hasSendGridKey) {
      // When no API key is set, log the email for development purposes
      console.log("DEVELOPMENT MODE: Would send verification email to:", email);
      console.log("Email Subject: Verify Your Proxima Report Newsletter Subscription");
      console.log("Verification URL:", verificationUrl);
      
      // In development, always return success
      return true;
    }
    
    // Actually send the email when API key is available
    await mailService.send({
      to: email,
      from: {
        email: "newsletter@proximareport.com",
        name: "Proxima Report"
      },
      subject: "Verify Your Proxima Report Newsletter Subscription",
      html: htmlContent,
    });
    
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
}