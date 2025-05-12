import { Express, Request, Response } from "express";
import { db } from "./db";
import { 
  subscribeToNewsletter, 
  verifySubscription, 
  unsubscribeFromNewsletter,
  sendNewsletterEmail
} from "./emailService";
import { 
  searchArticles, 
  searchUsers, 
  getPopularSearches, 
  saveSearch
} from "./searchService";
import { 
  articles, 
  newsletterSubscriptions, 
  newsletterSentHistory, 
  searchHistory
} from "../shared/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import z from "zod";

// Newsletter request schemas
const subscribeSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

const searchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  filters: z.object({}).optional(),
});

const sendNewsletterSchema = z.object({
  articleId: z.number(),
  subject: z.string().min(1, "Subject is required"),
  fromEmail: z.string().email("Valid from email is required"),
  fromName: z.string().min(1, "From name is required"),
});

// Register routes
export function registerNewsletterAndSearchRoutes(app: Express) {
  // Search routes
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      console.log("Search API called with query params:", req.query);
      
      const query = req.query.q as string || "";
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const orderBy = req.query.orderBy as string || "publishedAt";
      const orderDirection = req.query.orderDirection as "asc" | "desc" || "desc";
      const category = req.query.category as string;
      const tags = req.query.tags ? (req.query.tags as string).split(",") : undefined;
      const authorId = req.query.author ? parseInt(req.query.author as string) : undefined;
      const dateFrom = req.query.from ? new Date(req.query.from as string) : undefined;
      const dateTo = req.query.to ? new Date(req.query.to as string) : undefined;
      
      const options = { page, limit, orderBy, orderDirection };
      const filters = { 
        category,
        tags,
        author: authorId,
        dateFrom,
        dateTo
      };
      
      console.log("Calling searchArticles with:", { query, options, filters });
      const results = await searchArticles(query, options, filters);
      console.log("Search results count:", results.total);
      
      // Save search to history if user is logged in
      // @ts-ignore (Access req.session)
      const userId = req.session?.userId;
      if (query && query.trim().length > 0) {
        saveSearch(query, userId || null, results.total, filters);
      }
      
      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Error processing search", error: String(error) });
    }
  });
  
  app.get("/api/search/popular", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const popularSearches = await getPopularSearches(limit);
      res.json(popularSearches);
    } catch (error) {
      console.error("Popular searches error:", error);
      res.status(500).json({ message: "Error fetching popular searches" });
    }
  });
  
  app.post("/api/search/history", async (req: Request, res: Response) => {
    try {
      const { query, filters } = searchSchema.parse(req.body);
      
      // @ts-ignore (Access req.session)
      const userId = req.session?.userId;
      await saveSearch(query, userId || null, 0, filters || {});
      
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Search history error:", error);
      res.status(500).json({ message: "Error saving search history" });
    }
  });
  
  // Newsletter routes
  app.post("/api/newsletter/subscribe", async (req: Request, res: Response) => {
    try {
      const { email } = subscribeSchema.parse(req.body);
      
      // @ts-ignore (Access req.session)
      const userId = req.session?.userId;
      
      const result = await subscribeToNewsletter(email, userId);
      
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Newsletter subscribe error:", error);
      res.status(500).json({ message: "An error occurred while subscribing" });
    }
  });
  
  app.get("/api/newsletter/verify/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const result = await verifySubscription(token);
      
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Newsletter verification error:", error);
      res.status(500).json({ message: "An error occurred while verifying your subscription" });
    }
  });
  
  app.get("/api/newsletter/unsubscribe/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const result = await unsubscribeFromNewsletter(token);
      
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Newsletter unsubscribe error:", error);
      res.status(500).json({ message: "An error occurred while processing your unsubscribe request" });
    }
  });
  
  app.get("/api/newsletter/status/:articleId", async (req: Request, res: Response) => {
    try {
      const articleId = parseInt(req.params.articleId);
      
      const [article] = await db
        .select({
          id: articles.id,
          title: articles.title,
          isNewsletter: articles.isNewsletter,
          newsletterSentAt: articles.newsletterSentAt,
        })
        .from(articles)
        .where(eq(articles.id, articleId));
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Get subscriber count
      const subscriberCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(newsletterSubscriptions)
        .where(
          and(
            eq(newsletterSubscriptions.isVerified, true),
            eq(newsletterSubscriptions.isActive, true)
          )
        );
        
      const subscriberCount = subscriberCountResult[0]?.count || 0;
      
      // Get sent history (if exists)
      const [sentHistory] = await db
        .select()
        .from(newsletterSentHistory)
        .where(eq(newsletterSentHistory.articleId, articleId))
        .orderBy(desc(newsletterSentHistory.sentAt))
        .limit(1);
      
      res.json({
        id: article.id,
        title: article.title,
        isNewsletter: article.isNewsletter,
        sent: !!article.newsletterSentAt,
        sentAt: article.newsletterSentAt,
        subscriberCount,
        sentHistory: sentHistory || null,
      });
    } catch (error) {
      console.error("Newsletter status error:", error);
      res.status(500).json({ message: "Error fetching newsletter status" });
    }
  });
  
  app.get("/api/newsletter/stats", async (req: Request, res: Response) => {
    try {
      // Get subscriber count
      const subscriberCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(newsletterSubscriptions)
        .where(
          and(
            eq(newsletterSubscriptions.isVerified, true),
            eq(newsletterSubscriptions.isActive, true)
          )
        );
        
      const subscriberCount = subscriberCountResult[0]?.count || 0;
      
      // Get total sent newsletters
      const sentCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(newsletterSentHistory);
        
      const sentCount = sentCountResult[0]?.count || 0;
      
      // Get recent sent history
      const recentHistory = await db
        .select({
          id: newsletterSentHistory.id,
          articleId: newsletterSentHistory.articleId,
          sentAt: newsletterSentHistory.sentAt,
          subject: newsletterSentHistory.subject,
          recipientCount: newsletterSentHistory.recipientCount,
          openCount: newsletterSentHistory.openCount,
          clickCount: newsletterSentHistory.clickCount,
        })
        .from(newsletterSentHistory)
        .orderBy(desc(newsletterSentHistory.sentAt))
        .limit(5);
      
      res.json({
        subscriberCount,
        sentCount,
        recentHistory,
      });
    } catch (error) {
      console.error("Newsletter stats error:", error);
      res.status(500).json({ message: "Error fetching newsletter statistics" });
    }
  });
  
  app.post("/api/newsletter/send", async (req: Request, res: Response) => {
    try {
      // First, check if the user is an admin
      // @ts-ignore (Access req.session)
      const isAdmin = req.session?.isAdmin;
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can send newsletters" });
      }
      
      const params = sendNewsletterSchema.parse(req.body);
      
      const result = await sendNewsletterEmail(params);
      
      if (result) {
        res.json({ success: true, message: "Newsletter sent successfully" });
      } else {
        res.status(400).json({ success: false, message: "Failed to send newsletter" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Send newsletter error:", error);
      res.status(500).json({ message: "An error occurred while sending the newsletter" });
    }
  });
}