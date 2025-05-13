import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import { ZodError } from "zod";
import { updateArticleStatus } from "./articleStatusRoute";
import { searchArticles, searchUsers, getPopularSearches, saveSearch } from "./searchService";
import { subscribeToNewsletter, unsubscribeFromNewsletter, verifySubscription, sendNewsletterEmail } from "./emailService";
// Note: We will directly register search routes and newsletter routes here
import {
  insertUserSchema,
  insertArticleSchema,
  insertCommentSchema,
  insertAstronomyPhotoSchema,
  insertJobListingSchema,
  insertAdvertisementSchema,
  insertMediaLibrarySchema,
  updateSiteSettingsSchema,
  type User,
  type MediaLibraryItem,
  type SiteSettings,
  type UpdateSiteSettings,
  advertisements
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { handleStripeWebhook, createStripeCheckoutSession, stripe, SUBSCRIPTION_PRICES } from "./stripe";
import session from "express-session";
import { z } from "zod";
import axios from "axios";
import crypto from "crypto";
import path from "path";
import multer from "multer";
import fs from "fs";
import { pipeline } from "stream/promises";
import { v4 as uuidv4 } from "uuid";
import { Readable } from "stream";

// Setup file uploads
const storage_engine = multer.memoryStorage();
const upload = multer({ 
  storage: storage_engine,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Extend Request type to include API key data
declare module 'express-serve-static-core' {
  interface Request {
    apiKeyUserId?: number;
    apiKeyPermissions?: string[];
  }
}

// Configure session middleware
// Note: For production, you'd use a more robust session store
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'proxima_report_secret_key_for_development_only',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    sameSite: 'lax' as const // Helps with CSRF protection
  }
};

declare module 'express-session' {
  interface SessionData {
    userId: number;
    isAdmin: boolean;
  }
}

// Cache of API responses
const apiCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Maintenance mode middleware
const checkMaintenanceMode = async (req: Request, res: Response, next: NextFunction) => {
  // Always allow access to authentication endpoints
  if (req.path === '/api/login' || 
      req.path === '/api/logout' ||
      req.path === '/api/me') {
    return next();
  }

  try {
    // Check if user is admin
    // First check session flag (faster)
    let isAdmin = req.session && req.session.isAdmin === true;
    
    // If not found in session but user is logged in, check database
    if (!isAdmin && req.session?.userId) {
      try {
        // Get user from database to verify role
        const user = await storage.getUser(req.session.userId);
        isAdmin = user?.role === 'admin';
        
        // Update session with correct admin status if needed
        if (isAdmin && !req.session.isAdmin) {
          console.log(`Fixing admin session for user ${user?.username} (${user?.id})`);
          req.session.isAdmin = true;
        }
      } catch (err) {
        console.error("Error checking admin status from database:", err);
      }
    }
    
    // Debug admin state
    console.log("Admin check in middleware:", { 
      sessionExists: !!req.session,
      isAdmin: !!isAdmin,
      userId: req.session?.userId,
      path: req.path
    });
    
    // Admin users can always access everything
    if (isAdmin) {
      console.log("User is admin, allowing access");
      return next();
    }
    
    // Skip maintenance check for admin login and authentication routes
    if (req.path.startsWith('/api/auth') || 
        req.path.startsWith('/admin')) {
      return next();
    }

    // Check maintenance mode setting
    const settings = await storage.getSiteSettings();
    
    if (settings && settings.maintenanceMode) {
      // Special case - always allow essential API endpoints to be accessible
      if (req.path === '/api/site-settings' || req.path === '/api/me' || 
          req.path === '/api/login' || req.path === '/api/register') {
        return next();
      }
      
      if (req.path.startsWith('/api/')) {
        // API route - return JSON response
        console.log("API request during maintenance:", req.path);
        return res.status(503).json({ 
          maintenanceMode: true,
          message: "The site is currently under maintenance. Please try again later." 
        });
      } else {
        // For non-API requests, let the frontend handle maintenance display
        console.log("Allowing frontend maintenance page to render:", req.path);
        return next();
      }
    }
    
    // Not in maintenance mode, proceed normally
    next();
  } catch (error) {
    console.error("Error checking maintenance mode:", error);
    // If we can't check maintenance mode, allow the request to proceed
    next();
  }
};

// Auth middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Testing middleware to bypass auth - ONLY FOR DEVELOPMENT
const bypassAuth = (req: Request, res: Response, next: NextFunction) => {
  // Set the session userId to 1 (admin)
  req.session.userId = 1;
  next();
};

// Modified for testing - DEVELOPMENT ONLY
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // Bypass authentication for testing
  if (process.env.NODE_ENV === 'development') {
    // Set the admin user ID
    req.session.userId = 1;
    next();
    return;
  }
  
  // Normal admin check (in production)
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Check if user exists and has admin role
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
};

const requireAuthor = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || (user.role !== 'author' && user.role !== 'editor' && user.role !== 'admin')) {
    return res.status(403).json({ message: "Author permission required" });
  }
  
  next();
};

const requireEditor = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || (user.role !== 'editor' && user.role !== 'admin')) {
    return res.status(403).json({ message: "Editor permission required" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Use session middleware
  app.use(session(sessionConfig));
  
  // Register search routes directly
  // Main search endpoint for articles
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
      
      // Also search for users if the query is not empty
      let userResults = [];
      if (query && query.trim().length > 0) {
        const userOptions = { 
          page: 1, 
          limit: 5, // Limit user results to 5 
          orderBy: "username", 
          orderDirection: "asc" as "asc" | "desc"
        };
        const userSearchResults = await searchUsers(query, userOptions);
        userResults = userSearchResults.data;
        console.log("User search results count:", userSearchResults.total);
      }

      // Save search to history if user is logged in
      const userId = req.session?.userId;
      if (query && query.trim().length > 0) {
        saveSearch(query, userId || null, results.total, filters);
      }
      
      // Return combined results with users
      res.json({
        ...results,
        users: userResults
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Error processing search", error: String(error) });
    }
  });
  
  // Search suggestions for autocomplete
  app.get("/api/search/suggestions", async (req: Request, res: Response) => {
    try {
      console.log("Search suggestions API called with query params:", req.query);
      const query = req.query.q as string || "";
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      if (!query || query.trim().length < 2) {
        return res.json({ data: [] });
      }
      
      // Get article suggestions based on the query
      const results = await searchArticles(query, {
        page: 1,
        limit,
        orderBy: 'publishedAt',
        orderDirection: 'desc'
      });
      
      // Format the results to match the expected structure
      const suggestions = results.data.map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        category: article.category,
        publishedAt: article.publishedAt
      }));
      
      res.json({ data: suggestions });
    } catch (error) {
      console.error("Search suggestions error:", error);
      res.status(500).json({ message: "Error fetching search suggestions" });
    }
  });
  
  // Popular searches endpoint
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
  
  // Endpoint for saving search history
  app.post("/api/search/history", async (req: Request, res: Response) => {
    try {
      const query = req.body.query;
      const filters = req.body.filters || {};
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const userId = req.session?.userId;
      await saveSearch(query, userId || null, 0, filters);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Search history error:", error);
      res.status(500).json({ message: "Error saving search history" });
    }
  });
  
  // ---------------------------------------------------------------------------
  // Newsletter Routes
  // ---------------------------------------------------------------------------
  
  // Subscribe to newsletter endpoint
  app.post("/api/newsletter/subscribe", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Valid email is required" });
      }
      
      // Get user ID if logged in
      const userId = req.session?.userId;
      
      const result = await subscribeToNewsletter(email, userId);
      res.json(result);
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      res.status(500).json({ message: "Error processing subscription request" });
    }
  });
  
  // Verify newsletter subscription with token
  app.get("/api/newsletter/verify/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }
      
      const result = await verifySubscription(token);
      res.json(result);
    } catch (error) {
      console.error("Newsletter verification error:", error);
      res.status(500).json({ message: "Error verifying subscription" });
    }
  });
  
  // Unsubscribe from newsletter with token
  app.get("/api/newsletter/unsubscribe/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: "Unsubscribe token is required" });
      }
      
      const result = await unsubscribeFromNewsletter(token);
      res.json(result);
    } catch (error) {
      console.error("Newsletter unsubscribe error:", error);
      res.status(500).json({ message: "Error processing unsubscribe request" });
    }
  });
  
  // Get newsletter status for an article
  app.get("/api/newsletter/status/:articleId", async (req: Request, res: Response) => {
    try {
      const articleId = parseInt(req.params.articleId);
      
      if (isNaN(articleId)) {
        return res.status(400).json({ message: "Valid article ID is required" });
      }
      
      const article = await storage.getArticleById(articleId);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json({
        id: article.id,
        sentAsNewsletter: article.sentAsNewsletter || false,
        newsletterSentAt: article.newsletterSentAt || null
      });
    } catch (error) {
      console.error("Newsletter status error:", error);
      res.status(500).json({ message: "Error getting newsletter status" });
    }
  });
  
  // Get newsletter statistics
  app.get("/api/newsletter/stats", async (req: Request, res: Response) => {
    try {
      // This would typically come from the database
      const stats = await storage.getNewsletterStats();
      res.json(stats);
    } catch (error) {
      console.error("Newsletter stats error:", error);
      res.status(500).json({ message: "Error fetching newsletter statistics" });
    }
  });
  
  // Send newsletter for an article
  app.post("/api/newsletter/send", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { articleId, subject, fromEmail, fromName } = req.body;
      
      if (!articleId || !subject || !fromEmail || !fromName) {
        return res.status(400).json({ 
          message: "Article ID, subject, from email, and from name are required" 
        });
      }
      
      const article = await storage.getArticleById(articleId);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if article has already been sent as newsletter
      if (article.sentAsNewsletter) {
        return res.status(400).json({ 
          message: "This article has already been sent as a newsletter" 
        });
      }
      
      const sent = await sendNewsletterEmail({
        articleId,
        subject,
        fromEmail,
        fromName
      });
      
      if (sent) {
        // Update article to mark as sent
        await storage.updateArticle(articleId, {
          sentAsNewsletter: true,
          newsletterSentAt: new Date()
        });
        
        res.json({ success: true, message: "Newsletter sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send newsletter" });
      }
    } catch (error) {
      console.error("Send newsletter error:", error);
      res.status(500).json({ message: "Error sending newsletter" });
    }
  });

  // API endpoint for checking login status
  app.get("/api/me", (req: Request, res: Response) => {
    if (req.session.userId) {
      storage.getUser(req.session.userId)
        .then(user => {
          if (user) {
            res.json(user);
          } else {
            // User doesn't exist anymore but has a session
            req.session.destroy(() => {});
            res.status(401).json({ message: "Not authenticated" });
          }
        })
        .catch(err => {
          console.error("Error fetching user:", err);
          res.status(500).json({ message: "Server error" });
        });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // User login endpoint
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if we have either username or email, and password
      if ((!username && !email) || !password) {
        return res.status(400).json({ message: "Username/email and password are required" });
      }
      
      let user;
      
      // Try to find user by email first if provided
      if (email) {
        const normalizedEmail = email.toLowerCase();
        user = await storage.getUserByEmail(normalizedEmail);
      }
      
      // If no user found by email or email wasn't provided, try username
      if (!user && username) {
        const normalizedUsername = username.toLowerCase();
        user = await storage.getUserByUsername(normalizedUsername);
      }
      
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      // Special case for development with a known password format
      if (user.password === "hashed_" + password) {
        req.session.userId = user.id;
        req.session.isAdmin = user.role === 'admin';
        return res.json(user);
      }
      
      // Handle case where password might be stored in different formats (uppercase, etc)
      const normalizedPassword = password.toLowerCase();
      
      let isMatch = false;
      try {
        isMatch = await bcrypt.compare(normalizedPassword, user.password);
      } catch (compareError) {
        console.error("bcrypt.compare error:", compareError);
        return res.status(500).json({ message: "Error verifying password" });
      }
      
      if (!isMatch) {
        // If the login fails, try with the raw password as fallback (for fixing cross-device issues)
        try {
          isMatch = await bcrypt.compare(password, user.password);
        } catch (fallbackError) {
          console.error("Fallback bcrypt.compare error:", fallbackError);
        }
        
        if (!isMatch) {
          return res.status(400).json({ message: "Invalid credentials" });
        }
      }
      
      req.session.userId = user.id;
      req.session.isAdmin = user.role === 'admin';
      
      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Error during login" });
    }
  });

  // User registration endpoint
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const userData = req.body;
      
      // Validate user data
      try {
        insertUserSchema.parse(userData);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: validationError.errors
          });
        }
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists if provided
      if (userData.email) {
        const existingEmail = await storage.getUserByEmail(userData.email.toLowerCase());
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }
      
      // Hash password
      let hashedPassword;
      try {
        hashedPassword = await bcrypt.hash(userData.password, 10);
      } catch (hashError) {
        console.error("Password hashing error:", hashError);
        return res.status(500).json({ message: "Error creating user account" });
      }
      
      // Create user with hashed password
      const newUser = await storage.createUser({
        ...userData,
        username: userData.username.toLowerCase(),
        email: userData.email ? userData.email.toLowerCase() : null,
        password: hashedPassword,
        role: 'user' // Default role for new registrations
      });
      
      // Set session (auto login)
      req.session.userId = newUser.id;
      req.session.isAdmin = false; // New users aren't admins
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Error during registration" });
    }
  });

  // User logout endpoint
  app.post("/api/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Error during logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // ----------------------------------------------------
  // Articles API
  // ----------------------------------------------------
  // Get all articles
  app.get("/api/articles", async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const showDrafts = req.query.showDrafts === 'true';
      
      let userId: number | undefined;
      let isAdmin = false;
      
      // Check if the request includes a user session
      if (req.session && req.session.userId) {
        userId = req.session.userId;
        
        // Check if user is admin
        const user = await storage.getUser(userId);
        isAdmin = user?.role === 'admin';
      }
      
      // This is the main logic - users can only see their drafts or published content
      // Admin users can see all content if showDrafts is true
      // Note: getArticles only supports pagination parameters
      const articles = await storage.getArticles(limit, (page - 1) * limit);
      
      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Error fetching articles" });
    }
  });

  // Get recent articles - simpler version without pagination
  app.get("/api/articles/recent", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      // Get recent published articles
      const articles = await storage.getRecentArticles(limit);
      
      res.json(articles);
    } catch (error) {
      console.error("Error fetching recent articles:", error);
      res.status(500).json({ message: "Error fetching recent articles" });
    }
  });

  // Get single article by ID
  app.get("/api/articles/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      const article = await storage.getArticleById(id);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if article is draft and if user has permission to view it
      if (article.status === 'draft') {
        const userId = req.session?.userId;
        const user = userId ? await storage.getUser(userId) : null;
        
        // Only authors or admins can view drafts
        if (!userId || (user?.role !== 'admin')) {
          return res.status(403).json({ message: "You don't have permission to view this draft article" });
        }
      }
      
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Error fetching article" });
    }
  });

  // Get single article by slug
  app.get("/api/articles/slug/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      if (!slug) {
        return res.status(400).json({ message: "Article slug is required" });
      }
      
      const article = await storage.getArticleBySlug(slug);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if article is draft and if user has permission to view it
      if (article.status === 'draft') {
        const userId = req.session?.userId;
        const user = userId ? await storage.getUser(userId) : null;
        
        // Only authors or admins can view drafts
        if (!userId || (user?.role !== 'admin')) {
          return res.status(403).json({ message: "You don't have permission to view this draft article" });
        }
      }
      
      res.json(article);
    } catch (error) {
      console.error("Error fetching article by slug:", error);
      res.status(500).json({ message: "Error fetching article" });
    }
  });

  // Create new article
  app.post("/api/articles", requireAuth, async (req: Request, res: Response) => {
    try {
      const articleData = req.body;
      
      // Validate article data
      try {
        insertArticleSchema.parse(articleData);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: validationError.errors
          });
        }
      }
      
      // Check if user exists and has permission to create articles
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Users can create articles if they're an author, editor, or admin
      if (user.role !== 'author' && user.role !== 'editor' && user.role !== 'admin') {
        return res.status(403).json({ message: "You don't have permission to create articles" });
      }
      
      // Ensure the primary author is set to the current user if not specified
      if (!articleData.primaryAuthorId) {
        articleData.primaryAuthorId = userId;
      }
      
      // Create the article
      const newArticle = await storage.createArticle(articleData);
      
      res.status(201).json(newArticle);
    } catch (error) {
      console.error("Error creating article:", error);
      res.status(500).json({ message: "Error creating article" });
    }
  });

  // Update article
  app.patch("/api/articles/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      // Check if article exists
      const article = await storage.getArticleById(id);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if user has permission to update this article
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only allow update if user is an author of the article, or an admin
      const isAuthor = (article.authorId === userId || article.primaryAuthorId === userId);
      
      if (!isAuthor && user.role !== 'admin' && user.role !== 'editor') {
        return res.status(403).json({ message: "You don't have permission to update this article" });
      }
      
      // If status is changing from draft to published, set publishedAt
      if (article.status === 'draft' && updates.status === 'published' && !updates.publishedAt) {
        updates.publishedAt = new Date();
      }
      
      // Update the article
      const updatedArticle = await storage.updateArticle(id, updates);
      
      res.json(updatedArticle);
    } catch (error) {
      console.error("Error updating article:", error);
      res.status(500).json({ message: "Error updating article" });
    }
  });

  // Delete article
  app.delete("/api/articles/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      // Check if article exists
      const article = await storage.getArticleById(id);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if user has permission to delete this article
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only allow delete if user is the primary author of the article, or an admin
      if (article.primaryAuthorId !== userId && user.role !== 'admin') {
        return res.status(403).json({ message: "You don't have permission to delete this article" });
      }
      
      // Delete the article
      await storage.deleteArticle(id);
      
      res.json({ message: "Article deleted successfully" });
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ message: "Error deleting article" });
    }
  });

  // Update article status (special endpoint that uses direct SQL for performance)
  app.patch("/api/articles/:id/status", requireAuth, updateArticleStatus);

  // Get article comments
  app.get("/api/articles/:id/comments", async (req: Request, res: Response) => {
    try {
      const articleId = parseInt(req.params.id);
      
      if (isNaN(articleId)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      const comments = await storage.getCommentsByArticleId(articleId);
      
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Error fetching comments" });
    }
  });

  // Add comment to article
  app.post("/api/articles/:id/comments", requireAuth, async (req: Request, res: Response) => {
    try {
      const articleId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (isNaN(articleId)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      if (!content) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      // Check if article exists
      const article = await storage.getArticleById(articleId);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Create comment data
      const commentData = {
        articleId,
        userId: req.session.userId,
        content,
        createdAt: new Date()
      };
      
      // Validate comment data
      try {
        insertCommentSchema.parse(commentData);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: validationError.errors
          });
        }
      }
      
      // Create the comment
      const newComment = await storage.createComment(commentData);
      
      res.status(201).json(newComment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Error creating comment" });
    }
  });

  // Delete comment
  app.delete("/api/comments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }
      
      // Check if comment exists
      const comment = await storage.getComment(id);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Check if user has permission to delete this comment
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only allow delete if user is the author of the comment, or an admin
      if (comment.userId !== userId && user.role !== 'admin') {
        return res.status(403).json({ message: "You don't have permission to delete this comment" });
      }
      
      // Delete the comment
      await storage.deleteComment(id);
      
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Error deleting comment" });
    }
  });

  // ----------------------------------------------------
  // Users API
  // ----------------------------------------------------
  // Get users (admin only)
  app.get("/api/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const allUsers = await storage.getAllUsers();
      
      // Manual pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = allUsers.slice(startIndex, endIndex);
      
      res.json({
        users: paginatedUsers,
        total: allUsers.length,
        page,
        totalPages: Math.ceil(allUsers.length / limit)
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Error fetching user" });
    }
  });
  
  // Get user by username
  app.get("/api/users/username/:username", async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const user = await storage.getUserByUsername(username.toLowerCase());
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user by username:", error);
      res.status(500).json({ message: "Error fetching user" });
    }
  });
  
  // Get user profile by username
  app.get("/api/users/profile/:username", async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const user = await storage.getUserByUsername(username.toLowerCase());
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return safe user profile data (omit sensitive data)
      const userProfile = {
        id: user.id,
        username: user.username,
        bio: user.bio,
        profilePicture: user.profilePicture,
        themePreference: user.themePreference,
        profileCustomization: user.profileCustomization,
        membershipTier: user.membershipTier,
        createdAt: user.createdAt,
        isAdmin: user.role === 'admin',
        isEditor: user.role === 'editor',
        isAuthor: user.role === 'author'
      };
      
      res.json(userProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Error fetching user profile" });
    }
  });

  // Update user
  app.patch("/api/users/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if user exists
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has permission to update this user
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found" });
      }
      
      // Only allow update if user is updating themselves, or is an admin
      if (id !== userId && currentUser.role !== 'admin') {
        return res.status(403).json({ message: "You don't have permission to update this user" });
      }
      
      // Prevent non-admins from changing their role
      if (updates.role && id === userId && currentUser.role !== 'admin') {
        delete updates.role;
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(id, updates);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Error updating user" });
    }
  });

  // Change password
  app.patch("/api/users/:id/password", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { currentPassword, newPassword } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Check if user exists
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has permission to change this password
      const userId = req.session.userId;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found" });
      }
      
      // Only allow password change if user is changing their own password, or is an admin
      if (id !== userId && currentUser.role !== 'admin') {
        return res.status(403).json({ message: "You don't have permission to change this user's password" });
      }
      
      // Verify current password (skip for admins changing another user's password)
      if (id === userId) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!isMatch) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update the password
      await storage.updateUser(id, { password: hashedPassword });
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Error changing password" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if user exists
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent deleting yourself
      if (id === req.session.userId) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }
      
      // Delete the user
      await storage.deleteUser(id);
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user" });
    }
  });

  // Get articles by user
  app.get("/api/users/:id/articles", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const showDrafts = req.query.showDrafts === 'true';
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if current user has permission to view drafts
      const currentUserId = req.session?.userId;
      let canViewDrafts = false;
      
      if (currentUserId) {
        // Users can view their own drafts, and admins can view all drafts
        const currentUser = await storage.getUser(currentUserId);
        canViewDrafts = currentUserId === userId || (currentUser?.role === 'admin');
      }
      
      // Get the articles (only show drafts if allowed)
      const articles = await storage.getArticlesByAuthor(
        userId, 
        page, 
        limit, 
        showDrafts && canViewDrafts
      );
      
      res.json(articles);
    } catch (error) {
      console.error("Error fetching user articles:", error);
      res.status(500).json({ message: "Error fetching user articles" });
    }
  });

  // ----------------------------------------------------
  // Astronomy Photos API
  // ----------------------------------------------------
  app.get("/api/astronomy-photos", async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const photos = await storage.getAstronomyPhotos(page, limit);
      
      res.json(photos);
    } catch (error) {
      console.error("Error fetching astronomy photos:", error);
      res.status(500).json({ message: "Error fetching astronomy photos" });
    }
  });

  app.get("/api/astronomy-photos/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid photo ID" });
      }
      
      const photo = await storage.getAstronomyPhoto(id);
      
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      res.json(photo);
    } catch (error) {
      console.error("Error fetching astronomy photo:", error);
      res.status(500).json({ message: "Error fetching astronomy photo" });
    }
  });

  app.post("/api/astronomy-photos", requireAuth, async (req: Request, res: Response) => {
    try {
      const photoData = req.body;
      
      // Validate photo data
      try {
        insertAstronomyPhotoSchema.parse(photoData);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: validationError.errors
          });
        }
      }
      
      // Set user ID as submitter
      photoData.submitterId = req.session.userId;
      
      // Create the photo
      const newPhoto = await storage.createAstronomyPhoto(photoData);
      
      res.status(201).json(newPhoto);
    } catch (error) {
      console.error("Error creating astronomy photo:", error);
      res.status(500).json({ message: "Error creating astronomy photo" });
    }
  });

  app.patch("/api/astronomy-photos/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid photo ID" });
      }
      
      // Check if photo exists
      const photo = await storage.getAstronomyPhoto(id);
      
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      // Update the photo
      const updatedPhoto = await storage.updateAstronomyPhoto(id, updates);
      
      res.json(updatedPhoto);
    } catch (error) {
      console.error("Error updating astronomy photo:", error);
      res.status(500).json({ message: "Error updating astronomy photo" });
    }
  });

  app.delete("/api/astronomy-photos/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid photo ID" });
      }
      
      // Check if photo exists
      const photo = await storage.getAstronomyPhoto(id);
      
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      // Delete the photo
      await storage.deleteAstronomyPhoto(id);
      
      res.json({ message: "Astronomy photo deleted successfully" });
    } catch (error) {
      console.error("Error deleting astronomy photo:", error);
      res.status(500).json({ message: "Error deleting astronomy photo" });
    }
  });

  // ----------------------------------------------------
  // Job Listings API
  // ----------------------------------------------------
  app.get("/api/job-listings", async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const jobs = await storage.getJobListings(page, limit);
      
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching job listings:", error);
      res.status(500).json({ message: "Error fetching job listings" });
    }
  });

  app.get("/api/job-listings/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }
      
      const job = await storage.getJobListing(id);
      
      if (!job) {
        return res.status(404).json({ message: "Job listing not found" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching job listing:", error);
      res.status(500).json({ message: "Error fetching job listing" });
    }
  });

  app.post("/api/job-listings", requireAuth, async (req: Request, res: Response) => {
    try {
      const jobData = req.body;
      
      // Validate job data
      try {
        insertJobListingSchema.parse(jobData);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: validationError.errors
          });
        }
      }
      
      // Set user ID as poster
      jobData.posterId = req.session.userId;
      
      // Create the job listing
      const newJob = await storage.createJobListing(jobData);
      
      res.status(201).json(newJob);
    } catch (error) {
      console.error("Error creating job listing:", error);
      res.status(500).json({ message: "Error creating job listing" });
    }
  });

  app.patch("/api/job-listings/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }
      
      // Check if job exists
      const job = await storage.getJobListing(id);
      
      if (!job) {
        return res.status(404).json({ message: "Job listing not found" });
      }
      
      // Check if user has permission to update this job
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      // Only allow update if user is the poster of the job, or an admin
      if (job.posterId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "You don't have permission to update this job listing" });
      }
      
      // Update the job listing
      const updatedJob = await storage.updateJobListing(id, updates);
      
      res.json(updatedJob);
    } catch (error) {
      console.error("Error updating job listing:", error);
      res.status(500).json({ message: "Error updating job listing" });
    }
  });

  app.delete("/api/job-listings/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }
      
      // Check if job exists
      const job = await storage.getJobListing(id);
      
      if (!job) {
        return res.status(404).json({ message: "Job listing not found" });
      }
      
      // Check if user has permission to delete this job
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      // Only allow delete if user is the poster of the job, or an admin
      if (job.posterId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "You don't have permission to delete this job listing" });
      }
      
      // Delete the job listing
      await storage.deleteJobListing(id);
      
      res.json({ message: "Job listing deleted successfully" });
    } catch (error) {
      console.error("Error deleting job listing:", error);
      res.status(500).json({ message: "Error deleting job listing" });
    }
  });

  // ----------------------------------------------------
  // Categories and Tags API
  // ----------------------------------------------------
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  app.post("/api/categories", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }
      
      // Check if category already exists
      const existingCategory = await storage.getCategoryByName(name);
      if (existingCategory) {
        return res.status(400).json({ message: "Category already exists" });
      }
      
      // Create the category
      const newCategory = await storage.createCategory({ name, description });
      
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Error creating category" });
    }
  });

  app.patch("/api/categories/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { name, description } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }
      
      // Check if name already exists
      const existingCategory = await storage.getCategoryByName(name);
      if (existingCategory && existingCategory.id !== id) {
        return res.status(400).json({ message: "A category with this name already exists" });
      }
      
      // Update the category
      const updatedCategory = await storage.updateCategory(id, { name, description });
      
      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Error updating category" });
    }
  });

  app.delete("/api/categories/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      // Delete the category directly
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found or could not be deleted" });
      }
      
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Error deleting category" });
    }
  });

  app.get("/api/tags", async (req: Request, res: Response) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Error fetching tags" });
    }
  });

  app.post("/api/tags", requireAuth, async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Tag name is required" });
      }
      
      // Check if tag already exists
      const existingTag = await storage.getTagByName(name);
      if (existingTag) {
        return res.status(400).json({ message: "Tag already exists" });
      }
      
      // Create the tag
      const newTag = await storage.createTag({ name, description });
      
      res.status(201).json(newTag);
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Error creating tag" });
    }
  });

  app.patch("/api/tags/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { name, description } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }
      
      if (!name) {
        return res.status(400).json({ message: "Tag name is required" });
      }
      
      // Check if tag exists
      const tag = await storage.getTag(id);
      
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      // Check if new name already exists (if name is changing)
      if (name !== tag.name) {
        const existingTag = await storage.getTagByName(name);
        if (existingTag) {
          return res.status(400).json({ message: "A tag with this name already exists" });
        }
      }
      
      // Update the tag
      const updatedTag = await storage.updateTag(id, { name, description });
      
      res.json(updatedTag);
    } catch (error) {
      console.error("Error updating tag:", error);
      res.status(500).json({ message: "Error updating tag" });
    }
  });

  app.delete("/api/tags/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }
      
      // Check if tag exists
      const tag = await storage.getTag(id);
      
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      // Delete the tag
      await storage.deleteTag(id);
      
      res.json({ message: "Tag deleted successfully" });
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Error deleting tag" });
    }
  });

  // ----------------------------------------------------
  // Advertisements API
  // ----------------------------------------------------
  app.get("/api/advertisements", requireAdmin, async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const ads = await storage.getAdvertisements(page, limit);
      
      res.json(ads);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      res.status(500).json({ message: "Error fetching advertisements" });
    }
  });
  
  // Special endpoint for admin advertisement management
  app.get("/api/admin/advertisements", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get all advertisements with their user details for the admin panel
      const page = 1; // Always start at page 1
      const limit = 100; // Get a large number of ads
      
      // For admin panel, we want to include all advertisements, including unapproved and test ads
      const ads = await storage.getAdvertisements(page, limit, true, undefined, true); // Get with user details and include all ads
      
      // Add console logging for debugging
      console.log(`Admin advertisements API: Found ${ads.length} advertisements (including test advertisements)`);
      
      res.json(ads);
    } catch (error) {
      console.error("Error fetching admin advertisements:", error);
      res.status(500).json({ message: "Error fetching advertisements for admin panel" });
    }
  });
  
  // Admin endpoint for creating test advertisements
  app.post("/api/admin/test-advertisement", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get the advertisement data
      const adData = req.body;
      
      // Set user ID as the admin who's creating it
      adData.userId = req.session.userId;
      
      // Set it as a test advertisement and make it pre-approved
      adData.isTest = true;
      adData.isApproved = true;
      adData.status = 'approved';
      adData.paymentStatus = 'paid';
      
      // Convert string dates to Date objects
      if (adData.startDate && typeof adData.startDate === 'string') {
        adData.startDate = new Date(adData.startDate);
      }
      
      if (adData.endDate && typeof adData.endDate === 'string') {
        adData.endDate = new Date(adData.endDate);
      }
      
      // Create the test advertisement
      const newAd = await storage.createAdvertisement(adData);
      
      console.log('Created test advertisement:', newAd);
      
      res.status(201).json(newAd);
    } catch (error) {
      console.error("Error creating test advertisement:", error);
      res.status(500).json({ message: "Error creating test advertisement", error: String(error) });
    }
  });

  // Get ads for a specific placement (sidebar, banner, etc.)
  app.get("/api/advertisements/:placement", async (req: Request, res: Response) => {
    try {
      const { placement } = req.params;
      const includeNotApproved = req.query.includeNotApproved === 'true';
      
      // Check if user is admin to determine if unapproved ads should be included
      const userId = req.session?.userId;
      const user = userId ? await storage.getUser(userId) : null;
      const isAdmin = user?.role === 'admin';
      
      console.log("Fetching advertisements for placement:", placement);
      console.log("Running advertisement query with params:", { placement, includeNotApproved: isAdmin && includeNotApproved });
      
      // Fetch approved ads for the requested placement
      // (or include unapproved if user is admin and requested them)
      const ads = await storage.getAdvertisements(
        1, // page
        50, // limit - get enough ads for rotation
        false, // don't include user data here
        placement, // placement 
        isAdmin && includeNotApproved // include unapproved if admin
      );
      
      // If no approved ads are found, and this is for the frontend display, 
      // log additional information to help diagnose why no ads are showing
      if (ads.length === 0 && !includeNotApproved) {
        console.log("Found 0 advertisements (approved only)");
        
        // Check if there are any ads at all for this placement (approved or not)
        const allAds = await storage.getAdvertisements(1, 50, false, placement, true);
        console.log(`Found ${allAds.length} ads for placement ${placement}, of which ${allAds.filter(ad => ad.isApproved).length} are actually approved`);
        
        if (allAds.length === 0) {
          console.log(`No ads found for placement ${placement}`);
        } else {
          console.log(`No approved ads found for placement ${placement}, checking if any exist regardless of approval`);
          // Remove the call to countAdvertisementsByPlacement which doesn't exist
          console.log(`Found ${allAds.length} total ads (including unapproved) for placement ${placement}`);
          
          if (allAds.length > 0) {
            console.log("Unapproved ad example:", JSON.stringify(allAds[0]));
          }
        }
      }
      
      res.json(ads);
    } catch (error) {
      console.error("Error fetching advertisements by placement:", error);
      res.status(500).json({ message: "Error fetching advertisements" });
    }
  });

  app.get("/api/advertisements/id/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid advertisement ID" });
      }
      
      const ad = await storage.getAdvertisementById(id);
      
      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      // Check if user has permission to view this ad (owners or admins)
      const userId = req.session?.userId;
      const user = userId ? await storage.getUser(userId) : null;
      const isOwner = userId && ad.userId === userId;
      const isAdmin = user?.role === 'admin';
      
      // If not approved, only allow owner or admin to view
      if (!ad.isApproved && !isOwner && !isAdmin) {
        return res.status(403).json({ message: "This advertisement is not approved for viewing" });
      }
      
      res.json(ad);
    } catch (error) {
      console.error("Error fetching advertisement:", error);
      res.status(500).json({ message: "Error fetching advertisement" });
    }
  });

  // Special endpoint for admins to create test advertisements
  app.post("/api/admin/test-advertisement", requireAdmin, async (req: Request, res: Response) => {
    try {
      const adData = req.body;
      
      // Validate advertisement data
      try {
        insertAdvertisementSchema.parse(adData);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: validationError.errors
          });
        }
      }
      
      // Set user ID as owner
      adData.userId = req.session.userId;
      
      // Set test ad properties
      adData.isTest = true;
      adData.isApproved = true;
      adData.paymentStatus = 'paid';
      adData.status = 'approved';
      
      // Create the advertisement
      const newAd = await storage.createAdvertisement(adData);
      
      res.status(201).json(newAd);
    } catch (error) {
      console.error("Error creating test advertisement:", error);
      res.status(500).json({ message: "Error creating test advertisement" });
    }
  });

  app.post("/api/advertisements", requireAuth, async (req: Request, res: Response) => {
    try {
      const adData = req.body;
      
      // Validate advertisement data
      try {
        insertAdvertisementSchema.parse(adData);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: validationError.errors
          });
        }
      }
      
      // Set user ID as owner
      adData.userId = req.session.userId;
      
      // Get the user to check role and handle test ads
      const user = await storage.getUser(req.session.userId);
      
      // Check if this is a test advertisement (only admins can create test ads)
      const isTestAd = req.body.isTest === true && user?.role === 'admin';
      
      // Set approval and test status
      adData.isApproved = user?.role === 'admin' ? true : false;
      adData.isTest = isTestAd;
      
      // For test ads created by admins, automatically set payment as complete
      if (isTestAd) {
        adData.paymentStatus = 'paid';
        adData.status = 'approved';
      }
      
      // Create the advertisement
      const newAd = await storage.createAdvertisement(adData);
      
      res.status(201).json(newAd);
    } catch (error) {
      console.error("Error creating advertisement:", error);
      res.status(500).json({ message: "Error creating advertisement" });
    }
  });

  app.patch("/api/advertisements/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid advertisement ID" });
      }
      
      // Check if ad exists
      const ad = await storage.getAdvertisementById(id);
      
      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      // Check if user has permission to update this ad
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      // Determine if the user has permission to edit this ad
      const isOwner = ad.userId === userId;
      const isAdmin = user?.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "You don't have permission to update this advertisement" });
      }
      
      // If not admin, don't allow changing approval status
      if (!isAdmin && updates.hasOwnProperty('isApproved')) {
        delete updates.isApproved;
      }
      
      // Update the advertisement
      const updatedAd = await storage.updateAdvertisement(id, updates);
      
      res.json(updatedAd);
    } catch (error) {
      console.error("Error updating advertisement:", error);
      res.status(500).json({ message: "Error updating advertisement" });
    }
  });

  app.delete("/api/advertisements/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid advertisement ID" });
      }
      
      // Check if ad exists
      const ad = await storage.getAdvertisementById(id);
      
      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      // Check if user has permission to delete this ad
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      // Only allow delete if user is the owner of the ad, or an admin
      if (ad.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "You don't have permission to delete this advertisement" });
      }
      
      // Delete the advertisement
      await storage.deleteAdvertisement(id);
      
      res.json({ message: "Advertisement deleted successfully" });
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      res.status(500).json({ message: "Error deleting advertisement" });
    }
  });

  // ----------------------------------------------------
  // API Keys API
  // ----------------------------------------------------
  app.get("/api/api-keys", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const apiKeys = await storage.getApiKeysByUser(userId);
      
      // Don't return the actual key values, only metadata
      const safeApiKeys = apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        createdAt: key.createdAt,
        lastUsed: key.lastUsed,
        permissions: key.permissions
      }));
      
      res.json(safeApiKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Error fetching API keys" });
    }
  });

  app.post("/api/api-keys", requireAuth, async (req: Request, res: Response) => {
    try {
      const { name, permissions } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "API key name is required" });
      }
      
      // Validate permissions
      const validPermissions = ['read', 'write', 'admin'];
      const invalidPermissions = permissions ? permissions.filter(p => !validPermissions.includes(p)) : [];
      
      if (invalidPermissions.length > 0) {
        return res.status(400).json({ 
          message: `Invalid permissions: ${invalidPermissions.join(', ')}. Valid permissions are: ${validPermissions.join(', ')}` 
        });
      }
      
      // Generate a random API key
      const apiKey = crypto.randomBytes(32).toString('hex');
      
      // Create the API key
      const newApiKey = await storage.createApiKey({
        userId: req.session.userId,
        name,
        key: apiKey,
        permissions: permissions || ['read'] // Default to read-only
      });
      
      // Return the full key only on creation - it won't be retrievable later
      res.status(201).json({
        id: newApiKey.id,
        name: newApiKey.name,
        key: apiKey, // Only returned once, during creation
        createdAt: newApiKey.createdAt,
        permissions: newApiKey.permissions
      });
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({ message: "Error creating API key" });
    }
  });

  app.delete("/api/api-keys/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid API key ID" });
      }
      
      // Check if API key exists
      const apiKey = await storage.getApiKey(id);
      
      if (!apiKey) {
        return res.status(404).json({ message: "API key not found" });
      }
      
      // Check if user has permission to delete this API key
      const userId = req.session.userId;
      
      if (apiKey.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this API key" });
      }
      
      // Delete the API key
      await storage.deleteApiKey(id);
      
      res.json({ message: "API key deleted successfully" });
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ message: "Error deleting API key" });
    }
  });

  // ----------------------------------------------------
  // Media Library API
  // ----------------------------------------------------
  app.get("/api/media", async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const type = req.query.type as string;
      const search = req.query.search as string;
      
      let media;
      if (type) {
        media = await storage.getMediaLibraryItemsByType(type, req.session?.userId);
      } else {
        media = await storage.getMediaLibraryItems(req.session?.userId);
      }
      
      // Apply search filter if provided
      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        media = media.filter(item => 
          item.fileName.toLowerCase().includes(searchLower) ||
          (item.altText && item.altText.toLowerCase().includes(searchLower)) ||
          (item.caption && item.caption.toLowerCase().includes(searchLower)) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
      }
      
      // Manual pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMedia = media.slice(startIndex, endIndex);
      
      res.json({
        media: paginatedMedia,
        total: media.length,
        page,
        totalPages: Math.ceil(media.length / limit)
      });
    } catch (error) {
      console.error("Error fetching media items:", error);
      res.status(500).json({ message: "Error fetching media items" });
    }
  });

  app.get("/api/media/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid media ID" });
      }
      
      const mediaItem = await storage.getMediaItem(id);
      
      if (!mediaItem) {
        return res.status(404).json({ message: "Media item not found" });
      }
      
      res.json(mediaItem);
    } catch (error) {
      console.error("Error fetching media item:", error);
      res.status(500).json({ message: "Error fetching media item" });
    }
  });

  app.post("/api/media", requireAuth, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const { originalname, mimetype, buffer, size } = req.file;
      
      // Create a unique filename to prevent collisions
      const fileName = `${Date.now()}-${originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Determine media type from mimetype
      let type = 'other';
      if (mimetype.startsWith('image/')) {
        type = 'image';
      } else if (mimetype.startsWith('video/')) {
        type = 'video';
      } else if (mimetype.startsWith('audio/')) {
        type = 'audio';
      } else if (mimetype === 'application/pdf') {
        type = 'document';
      }
      
      // Create directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Write file to disk
      const filePath = path.join(uploadDir, fileName);
      await pipeline(Readable.from(buffer), fs.createWriteStream(filePath));
      
      // Create URL for the uploaded file
      const url = `/uploads/${fileName}`;
      
      // Create media item in database
      const mediaData = {
        userId: req.session.userId || 0,
        fileName: fileName,
        fileUrl: url,
        fileSize: size,
        fileType: type as "image" | "video" | "document" | "audio",
        mimeType: mimetype,
        description: originalname,
        altText: originalname,
        isPublic: true
      };
      
      // Validate media data
      try {
        insertMediaLibrarySchema.parse(mediaData);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          // Clean up file if validation fails
          fs.unlinkSync(filePath);
          
          return res.status(400).json({
            message: "Validation error",
            errors: validationError.errors
          });
        }
      }
      
      // Save media item to database
      const mediaItem = await storage.createMediaItem(mediaData);
      
      res.status(201).json(mediaItem);
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({ message: "Error uploading media" });
    }
  });

  app.patch("/api/media/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { altText, description, title } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid media ID" });
      }
      
      // Check if media item exists
      const mediaItem = await storage.getMediaItem(id);
      
      if (!mediaItem) {
        return res.status(404).json({ message: "Media item not found" });
      }
      
      // Check if user has permission to update this media item
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (mediaItem.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "You don't have permission to update this media item" });
      }
      
      // Update the media item
      const updatedItem = await storage.updateMediaItem(id, {
        altText,
        description,
        title
      });
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating media item:", error);
      res.status(500).json({ message: "Error updating media item" });
    }
  });

  app.delete("/api/media/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid media ID" });
      }
      
      // Check if media item exists
      const mediaItem = await storage.getMediaItem(id);
      
      if (!mediaItem) {
        return res.status(404).json({ message: "Media item not found" });
      }
      
      // Check if user has permission to delete this media item
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (mediaItem.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "You don't have permission to delete this media item" });
      }
      
      // Delete the file
      const filePath = path.join(process.cwd(), 'public', mediaItem.fileUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Delete the media item from database
      await storage.deleteMediaItem(id);
      
      res.json({ message: "Media item deleted successfully" });
    } catch (error) {
      console.error("Error deleting media item:", error);
      res.status(500).json({ message: "Error deleting media item" });
    }
  });

  // ----------------------------------------------------
  // Site Settings API
  // ----------------------------------------------------
  app.get("/api/site-settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getSiteSettings();
      
      if (!settings) {
        return res.status(404).json({ message: "Site settings not found" });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ message: "Error fetching site settings" });
    }
  });

  app.patch("/api/site-settings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const updates = req.body;
      
      // Validate site settings updates
      try {
        updateSiteSettingsSchema.parse(updates);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: validationError.errors
          });
        }
      }
      
      // Get current settings to get the ID
      const currentSettings = await storage.getSiteSettings();
      
      if (!currentSettings) {
        return res.status(404).json({ message: "Site settings not found" });
      }
      
      // Update site settings with the correct ID and admin user ID
      const updatedSettings = await storage.updateSiteSettings(
        currentSettings.id, 
        updates, 
        req.session.userId
      );
      
      if (!updatedSettings) {
        return res.status(500).json({ message: "Failed to update site settings" });
      }
      
      console.log("Site settings updated successfully:", updatedSettings);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating site settings:", error);
      res.status(500).json({ message: "Error updating site settings" });
    }
  });

  // ----------------------------------------------------
  // Emergency Banner API
  // ----------------------------------------------------
  app.get("/api/emergency-banner", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getSiteSettings();
      
      if (!settings) {
        return res.status(404).json({ message: "Site settings not found" });
      }
      
      // Only return emergency banner if it's enabled
      if (settings.emergencyBannerEnabled) {
        res.json({
          message: settings.emergencyBannerMessage,
          level: settings.emergencyBannerLevel,
          enabled: true
        });
      } else {
        res.json({ enabled: false });
      }
    } catch (error) {
      console.error("Error fetching emergency banner:", error);
      res.status(500).json({ message: "Error fetching emergency banner" });
    }
  });

  app.patch("/api/emergency-banner", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { enabled, message, level } = req.body;
      
      if (enabled === undefined) {
        return res.status(400).json({ message: "Enabled status is required" });
      }
      
      if (enabled && !message) {
        return res.status(400).json({ message: "Message is required when enabling the emergency banner" });
      }
      
      // Get current site settings first
      const settings = await storage.getSiteSettings();
      
      if (!settings) {
        return res.status(404).json({ message: "Site settings not found" });
      }
      
      // Update emergency banner settings
      const updates: Partial<SiteSettings> = {
        emergencyBannerEnabled: enabled
      };
      
      if (message !== undefined) {
        updates.emergencyBannerMessage = message;
      }
      
      if (level !== undefined) {
        updates.emergencyBannerLevel = level;
      }
      
      const updatedSettings = await storage.updateSiteSettings(
        settings.id, 
        updates,
        req.session.userId
      );
      
      if (!updatedSettings) {
        return res.status(500).json({ message: "Failed to update settings" });
      }
      
      res.json({
        message: updatedSettings.emergencyBannerMessage,
        level: updatedSettings.emergencyBannerLevel,
        enabled: updatedSettings.emergencyBannerEnabled
      });
    } catch (error) {
      console.error("Error updating emergency banner:", error);
      res.status(500).json({ message: "Error updating emergency banner" });
    }
  });

  // Add a dedicated endpoint for deactivating the emergency banner
  app.post("/api/emergency-banner/deactivate", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get current site settings first
      const settings = await storage.getSiteSettings();
      
      if (!settings) {
        return res.status(404).json({ message: "Site settings not found" });
      }
      
      // Disable the emergency banner
      const updatedSettings = await storage.updateSiteSettings(
        settings.id, 
        { emergencyBannerEnabled: false },
        req.session.userId
      );
      
      if (!updatedSettings) {
        return res.status(500).json({ message: "Failed to update settings" });
      }
      
      res.json({
        success: true,
        enabled: false,
        message: "Emergency banner has been deactivated"
      });
    } catch (error) {
      console.error("Error deactivating emergency banner:", error);
      res.status(500).json({ message: "Error deactivating emergency banner" });
    }
  });

  // ----------------------------------------------------
  // Stripe webhook handler for subscription events
  // ----------------------------------------------------
  app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

  // Create Stripe checkout session for subscriptions
  app.post("/api/create-checkout-session", requireAuth, async (req: Request, res: Response) => {
    try {
      const { priceId, successUrl, cancelUrl } = req.body;
      
      if (!priceId || !successUrl || !cancelUrl) {
        return res.status(400).json({ 
          message: "Price ID, success URL, and cancel URL are required" 
        });
      }
      
      // Validate price ID
      if (!SUBSCRIPTION_PRICES.includes(priceId)) {
        return res.status(400).json({ 
          message: `Invalid price ID. Valid options are: ${SUBSCRIPTION_PRICES.join(', ')}` 
        });
      }
      
      // Get user information
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create checkout session
      const session = await createStripeCheckoutSession({
        userId,
        email: user.email || undefined,
        priceId,
        successUrl,
        cancelUrl
      });
      
      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Error creating checkout session" });
    }
  });

  // Get user subscription status
  app.get("/api/subscription", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get subscription information
      const subscription = await storage.getUserSubscription(userId);
      
      if (!subscription) {
        return res.json({ active: false });
      }
      
      res.json({
        active: subscription.status === 'active',
        tier: subscription.tier,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Error fetching subscription" });
    }
  });

  // Cancel subscription
  app.post("/api/subscription/cancel", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get subscription information
      const subscription = await storage.getUserSubscription(userId);
      
      if (!subscription || subscription.status !== 'active') {
        return res.status(400).json({ message: "No active subscription found" });
      }
      
      // Cancel the subscription at the end of the billing period
      const stripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        { cancel_at_period_end: true }
      );
      
      // Update subscription in database
      await storage.updateUserSubscription(userId, {
        cancelAtPeriodEnd: true
      });
      
      res.json({ 
        message: "Subscription will be canceled at the end of the billing period",
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ message: "Error canceling subscription" });
    }
  });

  // Resume canceled subscription
  app.post("/api/subscription/resume", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get subscription information
      const subscription = await storage.getUserSubscription(userId);
      
      if (!subscription || subscription.status !== 'active') {
        return res.status(400).json({ message: "No active subscription found" });
      }
      
      if (!subscription.cancelAtPeriodEnd) {
        return res.status(400).json({ message: "Subscription is not scheduled for cancellation" });
      }
      
      // Resume the subscription by unsetting cancel_at_period_end
      await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        { cancel_at_period_end: false }
      );
      
      // Update subscription in database
      await storage.updateUserSubscription(userId, {
        cancelAtPeriodEnd: false
      });
      
      res.json({ message: "Subscription resumed successfully" });
    } catch (error) {
      console.error("Error resuming subscription:", error);
      res.status(500).json({ message: "Error resuming subscription" });
    }
  });

  // Create HTTP server
  // This server will be returned to index.ts to serve the app
  const httpServer = createServer(app);

  return httpServer;
}