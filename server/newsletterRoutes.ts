import { Express, Request, Response } from "express";
import { subscribeToNewsletter, unsubscribeFromNewsletter, verifySubscription, sendNewsletterEmail } from "./emailService";
import { searchArticles, searchUsers, getPopularSearches } from "./searchService";
import { newsletterSubscriptions, articles } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export function registerNewsletterAndSearchRoutes(app: Express) {
  // Search endpoints
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      const { q, type = 'articles', page = '1', limit = '10', orderBy = 'publishedAt', orderDirection = 'desc', category, tags, author, dateFrom, dateTo } = req.query;
      
      if (!q) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      // Format filters
      const filters: any = {};
      if (category) filters.category = category as string;
      if (author) filters.author = parseInt(author as string);
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);
      if (tags) filters.tags = Array.isArray(tags) ? tags as string[] : [tags as string];
      
      // Format options
      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        orderBy: orderBy as string,
        orderDirection: (orderDirection as string === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc'
      };
      
      // Get user ID if authenticated
      const userId = req.session?.userId;
      const isAdmin = req.session?.isAdmin;
      
      let results;
      if (type === 'users' && isAdmin) {
        // Only admins can search users
        results = await searchUsers(q as string, options, true);
      } else if (type === 'users') {
        // Regular users get limited user search
        results = await searchUsers(q as string, options, false);
      } else {
        // Default to article search
        results = await searchArticles(q as string, options, filters, userId);
      }
      
      res.json(results);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ message: "Error performing search", error: (error as Error).message });
    }
  });
  
  app.get("/api/search/popular", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string || '5');
      const popularSearches = await getPopularSearches(limit);
      res.json(popularSearches);
    } catch (error) {
      res.status(500).json({ message: "Error fetching popular searches", error: (error as Error).message });
    }
  });
  
  // Newsletter subscriptions
  app.post("/api/newsletter/subscribe", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Pass user ID if authenticated
      const userId = req.session?.userId;
      
      const result = await subscribeToNewsletter(email, userId);
      
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      res.status(500).json({ message: "Error subscribing to newsletter", error: (error as Error).message });
    }
  });
  
  app.get("/api/newsletter/verify/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }
      
      const result = await verifySubscription(token);
      
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      res.status(500).json({ message: "Error verifying subscription", error: (error as Error).message });
    }
  });
  
  app.get("/api/newsletter/unsubscribe/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: "Unsubscribe token is required" });
      }
      
      const result = await unsubscribeFromNewsletter(token);
      
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      res.status(500).json({ message: "Error unsubscribing from newsletter", error: (error as Error).message });
    }
  });
  
  // Get newsletter status for an article
  app.get("/api/newsletter/status/:articleId", async (req: Request, res: Response) => {
    try {
      const { articleId } = req.params;
      
      if (!articleId) {
        return res.status(400).json({ message: "Article ID is required" });
      }
      
      const [article] = await db
        .select({
          isNewsletter: articles.isNewsletter,
          newsletterSentAt: articles.newsletterSentAt
        })
        .from(articles)
        .where(eq(articles.id, parseInt(articleId)));
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json({
        isNewsletter: article.isNewsletter,
        sent: article.newsletterSentAt !== null,
        sentAt: article.newsletterSentAt
      });
    } catch (error) {
      res.status(500).json({ message: "Error getting newsletter status", error: (error as Error).message });
    }
  });
  
  // Get newsletter subscription count
  app.get("/api/newsletter/stats", async (req: Request, res: Response) => {
    try {
      const [{ count }] = await db
        .select({
          count: db.fn.count<number>(newsletterSubscriptions.id)
        })
        .from(newsletterSubscriptions)
        .where(and(
          eq(newsletterSubscriptions.isActive, true),
          eq(newsletterSubscriptions.isVerified, true)
        ));
      
      res.json({
        subscriberCount: Number(count)
      });
    } catch (error) {
      res.status(500).json({ message: "Error getting newsletter stats", error: (error as Error).message });
    }
  });
  
  // Send newsletter (admin only)
  app.post("/api/newsletter/send", async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (!req.session?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }
      
      const { articleId, subject, fromEmail, fromName } = req.body;
      
      if (!articleId || !subject || !fromEmail || !fromName) {
        return res.status(400).json({ message: "All fields are required: articleId, subject, fromEmail, fromName" });
      }
      
      const success = await sendNewsletterEmail({
        articleId,
        subject,
        fromEmail,
        fromName
      });
      
      if (success) {
        res.json({ message: "Newsletter sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send newsletter" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error sending newsletter", error: (error as Error).message });
    }
  });
}