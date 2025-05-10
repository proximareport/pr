import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import {
  insertUserSchema,
  insertArticleSchema,
  insertCommentSchema,
  insertAstronomyPhotoSchema,
  insertJobListingSchema,
  insertAdvertisementSchema,
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { handleStripeWebhook, createStripeCheckoutSession } from "./stripe";
import session from "express-session";
import { z } from "zod";
import axios from "axios";
import crypto from "crypto";
import path from "path";
import multer from "multer";
import fs from "fs";
import { pipeline } from "stream/promises";
import { v4 as uuidv4 } from "uuid";

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

// Auth middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId || !req.session.isAdmin) {
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
  
  // User Routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Set session
      req.session.userId = newUser.id;
      req.session.isAdmin = newUser.role === "admin";
      
      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.format() });
      }
      res.status(500).json({ message: "Server error during registration" });
    }
  });
  
  app.post("/api/login", async (req, res) => {
    try {
      console.log("Login attempt for:", req.body.email);
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log("User not found:", email);
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      console.log("User found, checking password...");
      
      // Add this for debugging - log password length and hash format
      console.log("Password length:", password?.length);
      console.log("Stored hash type:", typeof user.password);
      console.log("Stored hash length:", user.password?.length);
      
      // Check if the password has been hashed (should start with $2a$ or $2b$ for bcrypt)
      if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        console.log("WARNING: Password doesn't appear to be properly hashed!");
        return res.status(500).json({ message: "Server error: invalid password format" });
      }
      
      // Normalize the password - trim whitespace to handle copy-paste issues
      const normalizedPassword = password.trim();
      
      // Check password with extra error handling
      let isMatch = false;
      try {
        isMatch = await bcrypt.compare(normalizedPassword, user.password);
        console.log("Password match result:", isMatch);
      } catch (compareError) {
        console.error("bcrypt.compare error:", compareError);
        return res.status(500).json({ message: "Error verifying password" });
      }
      
      if (!isMatch) {
        // If the login fails, try with the raw password as fallback (for fixing cross-device issues)
        try {
          isMatch = await bcrypt.compare(password, user.password);
          console.log("Fallback password match result:", isMatch);
        } catch (fallbackError) {
          console.error("Fallback bcrypt.compare error:", fallbackError);
        }
        
        if (!isMatch) {
          return res.status(400).json({ message: "Invalid credentials" });
        }
      }
      
      // Update last login
      await storage.updateUser(user.id, { lastLoginAt: new Date() });
      
      // Set session
      req.session.userId = user.id;
      req.session.isAdmin = user.role === "admin";
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      console.log("Login successful for:", email);
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error during login" });
    }
  });
  
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Successfully logged out" });
    });
  });
  
  app.get("/api/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get all users (for coauthor selection)
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Return simplified user data (only what's needed for UI)
      const simplifiedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        profilePicture: user.profilePicture
      }));
      
      res.json(simplifiedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/me", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const updateSchema = z.object({
        username: z.string().optional(),
        email: z.string().email().optional(),
        bio: z.string().max(150).optional(),
        profilePicture: z.string().optional(),
        themePreference: z.string().optional(),
        profileCustomization: z.record(z.any()).optional(),
      });
      
      const updateData = updateSchema.parse(req.body);
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.format() });
      }
      res.status(500).json({ message: "Server error updating profile" });
    }
  });
  
  // Get user profile by username
  app.get("/api/users/profile/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Error fetching user profile" });
    }
  });
  
  // Get all users (for admin purposes)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Return users without passwords
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  
  // API Key Routes
  app.get("/api/api-keys", requireAuth, async (req, res) => {
    try {
      const apiKeys = await storage.getApiKeysByUser(req.session.userId!);
      // Don't return the actual key values for security
      const safeKeys = apiKeys.map(key => ({
        ...key,
        key: key.key.substring(0, 8) + "..." + key.key.substring(key.key.length - 4)
      }));
      res.json(safeKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/api-keys", requireAuth, async (req, res) => {
    try {
      const { name, permissions } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "API key name is required" });
      }
      
      const apiKey = await storage.createApiKey(
        req.session.userId!, 
        name, 
        permissions || ["read:articles"]
      );
      
      // Return the full key only once at creation time
      res.status(201).json(apiKey);
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/api-keys/:id", requireAuth, async (req, res) => {
    try {
      const apiKey = await storage.getApiKey(parseInt(req.params.id));
      
      if (!apiKey) {
        return res.status(404).json({ message: "API key not found" });
      }
      
      if (apiKey.userId !== req.session.userId && !req.session.isAdmin) {
        return res.status(403).json({ message: "You don't have permission to delete this API key" });
      }
      
      await storage.deleteApiKey(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // API Endpoint authentication middleware with API key
  const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers["x-api-key"] as string;
    
    if (!apiKey) {
      return next(); // Continue to session auth if no API key
    }
    
    try {
      const storedKey = await storage.getApiKeyByValue(apiKey);
      
      if (!storedKey) {
        return res.status(401).json({ message: "Invalid API key" });
      }
      
      // Update last used timestamp
      await storage.updateApiKeyLastUsed(storedKey.id);
      
      // Attach user ID and permissions to request
      req.apiKeyUserId = storedKey.userId;
      req.apiKeyPermissions = storedKey.permissions;
      
      return next();
    } catch (error) {
      console.error("API key authentication error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  
  // Article Routes
  app.get("/api/articles", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const articles = await storage.getArticles(limit, offset);
      
      // Enhance collaborative articles with author information
      const enhancedArticles = await Promise.all(articles.map(async (article) => {
        if (article.isCollaborative) {
          // Fetch authors for collaborative articles
          const authors = await storage.getArticleAuthors(article.id);
          // Map to a simplified author structure
          const authorData = authors.map(authorRecord => ({
            id: authorRecord.user.id,
            username: authorRecord.user.username,
            profilePicture: authorRecord.user.profilePicture,
            role: authorRecord.role
          }));
          
          return {
            ...article,
            authors: authorData
          };
        }
        return article;
      }));
      
      res.json(enhancedArticles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      // More detailed error logging
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(500).json({ message: "Error fetching articles" });
    }
  });
  
  // Get all draft articles - requires admin or editor role
  app.get("/api/articles/drafts", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
        return res.status(403).json({ message: "Only admins and editors can view all drafts" });
      }
      
      const drafts = await storage.getArticlesByStatus('draft');
      
      // Enhance drafts with author information
      const enhancedDrafts = await Promise.all(drafts.map(async (draft) => {
        // Fetch authors for all drafts
        const authors = await storage.getArticleAuthors(draft.id);
        // Map to a simplified author structure
        const authorData = authors.map(authorRecord => ({
          id: authorRecord.user.id,
          username: authorRecord.user.username,
          profilePicture: authorRecord.user.profilePicture,
          role: authorRecord.role
        }));
        
        return {
          ...draft,
          authors: authorData
        };
      }));
      
      res.json(enhancedDrafts);
    } catch (error) {
      console.error("Error fetching draft articles:", error);
      res.status(500).json({ message: "Error fetching draft articles" });
    }
  });
  
  // Get current user's draft articles - works for any authenticated user
  app.get("/api/articles/drafts/me", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      // Authors can only see their own drafts
      const drafts = await storage.getAuthorDrafts(userId);
      
      // Enhance drafts with author information
      const enhancedDrafts = await Promise.all(drafts.map(async (draft) => {
        // Fetch authors for all drafts
        const authors = await storage.getArticleAuthors(draft.id);
        // Map to a simplified author structure
        const authorData = authors.map(authorRecord => ({
          id: authorRecord.user.id,
          username: authorRecord.user.username,
          profilePicture: authorRecord.user.profilePicture,
          role: authorRecord.role
        }));
        
        return {
          ...draft,
          authors: authorData
        };
      }));
      
      res.json(enhancedDrafts);
    } catch (error) {
      console.error("Error fetching your draft articles:", error);
      res.status(500).json({ message: "Error fetching your draft articles" });
    }
  });
  
  app.get("/api/articles/featured", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const featuredArticles = await storage.getFeaturedArticles(limit);
      
      // Enhance collaborative articles with author information
      const enhancedArticles = await Promise.all(featuredArticles.map(async (article) => {
        if (article.isCollaborative) {
          // Fetch authors for collaborative articles
          const authors = await storage.getArticleAuthors(article.id);
          // Map to a simplified author structure
          const authorData = authors.map(authorRecord => ({
            id: authorRecord.user.id,
            username: authorRecord.user.username,
            profilePicture: authorRecord.user.profilePicture,
            role: authorRecord.role
          }));
          
          return {
            ...article,
            authors: authorData
          };
        }
        return article;
      }));
      
      res.json(enhancedArticles);
    } catch (error) {
      console.error("Error fetching featured articles:", error);
      res.status(500).json({ message: "Error fetching featured articles" });
    }
  });
  
  app.get("/api/articles/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const articles = await storage.getArticlesByCategory(category);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Error fetching articles by category" });
    }
  });
  
  app.get("/api/articles/tag/:tag", async (req, res) => {
    try {
      const { tag } = req.params;
      const allArticles = await storage.getArticles(100); // Get a reasonably large set
      
      // Filter articles that have the specified tag
      const filteredArticles = allArticles.filter(article => 
        article.tags && Array.isArray(article.tags) && article.tags.includes(tag)
      );
      
      res.json(filteredArticles);
    } catch (error) {
      res.status(500).json({ message: "Error fetching articles by tag" });
    }
  });
  
  app.get("/api/articles/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const articles = await storage.searchArticles(query);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Error searching articles" });
    }
  });
  
  app.get("/api/articles/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const article = await storage.getArticleBySlug(slug);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // If article is collaborative, fetch all authors
      if (article.isCollaborative) {
        const authors = await storage.getArticleAuthors(article.id);
        // Map to a simplified author structure
        const authorData = authors.map(authorRecord => ({
          id: authorRecord.user.id,
          username: authorRecord.user.username,
          profilePicture: authorRecord.user.profilePicture,
          role: authorRecord.role
        }));
        
        // Return with authors data
        res.json({
          ...article,
          authors: authorData
        });
      } else {
        // Return standard article data
        res.json(article);
      }
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Error fetching article" });
    }
  });
  
  // Get draft articles (only for authors/editors/admins)
  app.get("/api/articles/drafts", requireAuthor, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      let articles: any[] = [];
      if (user && (user.role === 'admin' || user.role === 'editor')) {
        // Admins and editors can see all drafts
        articles = await storage.getArticlesByStatus('draft');
      } else if (user) {
        // Authors can only see their own drafts or articles they're collaborating on
        articles = await storage.getAuthorDrafts(userId);
      }
      
      res.json(articles);
    } catch (error) {
      console.error("Error fetching draft articles:", error);
      res.status(500).json({ message: "Error fetching draft articles" });
    }
  });
  
  app.post("/api/articles", requireAuthor, async (req, res) => {
    try {
      if (!req.session.isAdmin) {
        return res.status(403).json({ message: "Only admins can create articles" });
      }
      
      // Custom validation for the content field to handle different formats
      const contentValidator = z.union([
        z.array(z.any()), // Accept array format for Google Docs-style editor
        z.record(z.any()), // Accept object format for other editors
      ]);
      
      // Create a schema that completely ignores publishedAt in validation
      // We'll handle it separately
      const modifiedSchema = insertArticleSchema
        .omit({ publishedAt: true })
        .extend({
          content: contentValidator,
        });
      
      // Parse and validate (without publishedAt)
      const articleData = modifiedSchema.parse(req.body);
      
      // Handle publishedAt separately - convert from ISO string to Date
      let publishedAt = undefined;
      if (req.body.publishedAt) {
        try {
          publishedAt = new Date(req.body.publishedAt);
        } catch (e) {
          console.error("Invalid publishedAt date:", e);
        }
      }
      
      // Extract authors data from the request if present
      const { authors } = req.body;
      
      const newArticle = await storage.createArticle({
        ...articleData,
        publishedAt,
        primaryAuthorId: req.session.userId!,
        // Pass authors array to the storage method if it exists
        authors: authors && Array.isArray(authors) ? authors : undefined
      });
      
      res.status(201).json(newArticle);
    } catch (error: any) {
      if (error instanceof ZodError) {
        console.error("Validation error:", error.issues);
        console.error("Full request body:", req.body);
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: error.format(),
          issues: error.issues,
          fields: Object.keys(req.body),
        });
      }
      console.error("Server error creating article:", error);
      
      // Enhanced database error handling
      if (error.code === '23505') {
        // Handle all unique constraint violations
        if (error.constraint === 'articles_slug_unique') {
          return res.status(400).json({ 
            message: "slug already exists",
            error: "An article with this slug already exists. Please choose a different slug.",
            detail: error.detail,
            code: "DUPLICATE_SLUG"
          });
        } else {
          return res.status(400).json({
            message: "Unique constraint violation",
            error: error.detail || "A duplicate value was found in the database",
            code: "UNIQUE_CONSTRAINT_VIOLATION"
          });
        }
      }
      
      res.status(500).json({ 
        message: "Error creating article", 
        error: error.message || "Unknown server error" 
      });
    }
  });
  
  app.put("/api/articles/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const articleId = parseInt(id);
      const userId = req.session.userId!;
      
      const article = await storage.getArticleById(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Get user data to check role
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Get article authors to check if user is an author
      const articleAuthors = await storage.getArticleAuthors(articleId);
      const isArticleAuthor = articleAuthors.some(author => author.user.id === userId);
      
      // Determine if user has permission to edit this article
      const canEdit = user.role === 'admin' || 
                     user.role === 'editor' || 
                     (user.role === 'author' && isArticleAuthor);
      
      if (!canEdit) {
        return res.status(403).json({ 
          message: "You don't have permission to edit this article. Only admins, editors, or the article's authors can edit it." 
        });
      }
      
      // Custom validator for content that accepts both array and object formats
      const contentValidator = z.union([
        z.array(z.any()),  // For Google Docs-style editor
        z.record(z.any()), // For legacy editors
      ]).optional();
      
      // Update schema that excludes publishedAt for validation
      const updateSchema = z.object({
        title: z.string().optional(),
        slug: z.string().optional(),
        summary: z.string().optional(),
        content: contentValidator,
        featuredImage: z.string().optional(),
        isBreaking: z.boolean().optional(),
        readTime: z.number().optional(),
        tags: z.array(z.string()).optional(),
        category: z.string().optional(),
        status: z.string().optional(),
      });
      
      // Parse and validate (without publishedAt)
      const updateData = updateSchema.parse(req.body);
      
      // Prepare final update data - we'll add publishedAt after validation
      const finalUpdateData: { 
        [key: string]: any; 
        publishedAt?: Date;
      } = { ...updateData };
      
      // Check if trying to publish an article
      if (updateData.status === 'published' && article.status !== 'published') {
        // Only editors and admins can publish
        const canPublish = user.role === 'admin' || user.role === 'editor';
        if (!canPublish) {
          return res.status(403).json({ 
            message: "Only editors and admins can publish articles. Save as draft instead." 
          });
        }
        
        // Set publishedAt date when article is being published
        const publishedAt = new Date();
        finalUpdateData.publishedAt = publishedAt;
      } else {
        // Handle publishedAt separately - convert from ISO string to Date
        let publishedAt = undefined;
        if (req.body.publishedAt) {
          try {
            publishedAt = new Date(req.body.publishedAt);
          } catch (e) {
            console.error("Invalid publishedAt date:", e);
          }
        }
        
        if (publishedAt) {
          finalUpdateData.publishedAt = publishedAt;
        }
      }
      
      // Extract authors data
      const { authors } = req.body;
      
      // Update the article in the database with our final data
      const updatedArticle = await storage.updateArticle(articleId, finalUpdateData);
      
      // If this is a collaborative article and there are authors, update the authors
      // Only editors and admins can manage authors
      if (updatedArticle && updatedArticle.isCollaborative && authors && Array.isArray(authors) && 
          (user.role === 'admin' || user.role === 'editor')) {
        // First remove all existing authors to avoid duplicates
        // Don't worry about removing the primary author, they'll be added back
        const existingAuthors = await storage.getArticleAuthors(articleId);
        for (const author of existingAuthors) {
          await storage.removeAuthorFromArticle(articleId, author.userId);
        }
        
        // Now add the primary author and all coauthors
        await storage.addAuthorToArticle(articleId, updatedArticle.primaryAuthorId, "primary");
        
        // Add all coauthors
        for (const author of authors) {
          if (author.id !== updatedArticle.primaryAuthorId) {
            await storage.addAuthorToArticle(articleId, author.id, author.role || "coauthor");
          }
        }
      } else if (updatedArticle && updatedArticle.isCollaborative && authors && Array.isArray(authors)) {
        // If authors are trying to update coauthors, inform them they don't have permission
        if (user.role === 'author') {
          console.log("Author attempting to update collaborators - not permitted");
          // We don't return an error, we just don't update the authors list
        }
      }
      
      if (!updatedArticle) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(updatedArticle);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Validation error:", error.issues);
        console.error("Full request body:", req.body);
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: error.format(),
          issues: error.issues,
          fields: Object.keys(req.body), 
        });
      }
      console.error("Server error updating article:", error);
      
      // Enhanced database error handling
      if (error.code === '23505') {
        // Handle all unique constraint violations
        if (error.constraint === 'articles_slug_unique') {
          return res.status(400).json({ 
            message: "slug already exists",
            error: "An article with this slug already exists. Please choose a different slug.",
            detail: error.detail,
            code: "DUPLICATE_SLUG"
          });
        } else {
          return res.status(400).json({
            message: "Unique constraint violation",
            error: error.detail || "A duplicate value was found in the database",
            code: "UNIQUE_CONSTRAINT_VIOLATION"
          });
        }
      }
      
      res.status(500).json({ 
        message: "Error updating article", 
        error: error.message || "Unknown server error" 
      });
    }
  });
  
  app.delete("/api/articles/:id", requireAuth, async (req, res) => {
    try {
      if (!req.session.isAdmin) {
        return res.status(403).json({ message: "Only admins can delete articles" });
      }
      
      const { id } = req.params;
      const articleId = parseInt(id);
      
      const article = await storage.getArticleById(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      await storage.deleteArticle(articleId);
      res.json({ message: "Article deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting article" });
    }
  });
  
  // Comment Routes
  app.get("/api/articles/:articleId/comments", async (req, res) => {
    try {
      const { articleId } = req.params;
      const comments = await storage.getCommentsByArticle(parseInt(articleId));
      
      // For each comment, get replies
      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const replies = await storage.getCommentReplies(comment.id);
          return { ...comment, replies };
        })
      );
      
      res.json(commentsWithReplies);
    } catch (error) {
      res.status(500).json({ message: "Error fetching comments" });
    }
  });
  
  app.post("/api/comments", requireAuth, async (req, res) => {
    try {
      const commentData = insertCommentSchema.parse(req.body);
      
      // Check if article exists
      const article = await storage.getArticleById(commentData.articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // If it's a reply, check if parent comment exists
      if (commentData.parentId) {
        const parentComment = await storage.getCommentById(commentData.parentId);
        if (!parentComment) {
          return res.status(404).json({ message: "Parent comment not found" });
        }
      }
      
      const newComment = await storage.createComment({
        ...commentData,
        userId: req.session.userId!, // Using userId instead of authorId
      });
      
      res.status(201).json(newComment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.format() });
      }
      res.status(500).json({ message: "Error creating comment" });
    }
  });
  
  app.put("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const commentId = parseInt(id);
      
      const comment = await storage.getCommentById(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Check if user is the author or admin
      if (comment.authorId !== req.session.userId && !req.session.isAdmin) {
        return res.status(403).json({ message: "Not authorized to update this comment" });
      }
      
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      const updatedComment = await storage.updateComment(commentId, content);
      res.json(updatedComment);
    } catch (error) {
      res.status(500).json({ message: "Error updating comment" });
    }
  });
  
  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const commentId = parseInt(id);
      
      const comment = await storage.getCommentById(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Check if user is the author or admin
      if (comment.authorId !== req.session.userId && !req.session.isAdmin) {
        return res.status(403).json({ message: "Not authorized to delete this comment" });
      }
      
      await storage.deleteComment(commentId);
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting comment" });
    }
  });
  
  // Vote Routes
  app.post("/api/comments/:commentId/vote", requireAuth, async (req, res) => {
    try {
      const { commentId } = req.params;
      const { voteType } = req.body;
      
      if (voteType !== "up" && voteType !== "down") {
        return res.status(400).json({ message: "Vote type must be 'up' or 'down'" });
      }
      
      const comment = await storage.getCommentById(parseInt(commentId));
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      await storage.addVote(req.session.userId!, parseInt(commentId), voteType);
      res.json({ message: "Vote added successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error adding vote" });
    }
  });
  
  app.delete("/api/comments/:commentId/vote", requireAuth, async (req, res) => {
    try {
      const { commentId } = req.params;
      
      const comment = await storage.getCommentById(parseInt(commentId));
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      await storage.removeVote(req.session.userId!, parseInt(commentId));
      res.json({ message: "Vote removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error removing vote" });
    }
  });
  
  app.get("/api/comments/:commentId/vote", requireAuth, async (req, res) => {
    try {
      const { commentId } = req.params;
      
      const vote = await storage.getVote(req.session.userId!, parseInt(commentId));
      res.json(vote || { voteType: null });
    } catch (error) {
      res.status(500).json({ message: "Error getting vote" });
    }
  });
  
  // Astronomy Photo Routes
  app.get("/api/astronomy-photos", async (req, res) => {
    try {
      const photos = await storage.getAstronomyPhotos();
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: "Error fetching astronomy photos" });
    }
  });
  
  app.post("/api/astronomy-photos", requireAuth, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }
      
      // Validate the other fields
      const photoSchema = z.object({
        title: z.string(),
        description: z.string().optional(),
        location: z.string().optional(),
        equipmentUsed: z.string().optional(),
      });
      
      const photoData = photoSchema.parse(req.body);
      
      // Generate filename and save the image
      const fileExt = path.extname(req.file.originalname);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = `/uploads/astronomy/${fileName}`;
      const fullPath = path.join(process.cwd(), 'public', filePath);
      
      // Ensure directory exists
      await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
      
      // Save file
      await fs.promises.writeFile(fullPath, req.file.buffer);
      
      // Create record in database
      const photo = await storage.createAstronomyPhoto({
        title: photoData.title,
        description: photoData.description || '',
        imageUrl: filePath,
        userId: req.session.userId!,
        location: photoData.location,
        equipmentUsed: photoData.equipmentUsed,
      });
      
      res.status(201).json(photo);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.format() });
      }
      res.status(500).json({ message: "Error creating astronomy photo" });
    }
  });
  
  app.post("/api/astronomy-photos/:id/approve", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const photo = await storage.approveAstronomyPhoto(parseInt(id));
      
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      res.json(photo);
    } catch (error) {
      res.status(500).json({ message: "Error approving photo" });
    }
  });
  
  // Job Listing Routes
  app.get("/api/job-listings", async (req, res) => {
    try {
      const listings = await storage.getJobListings();
      res.json(listings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching job listings" });
    }
  });
  
  app.post("/api/job-listings", requireAuth, async (req, res) => {
    try {
      const listingData = insertJobListingSchema.parse(req.body);
      
      const listing = await storage.createJobListing({
        ...listingData,
        userId: req.session.userId!,
      });
      
      res.status(201).json(listing);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.format() });
      }
      res.status(500).json({ message: "Error creating job listing" });
    }
  });
  
  app.post("/api/job-listings/:id/approve", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const listing = await storage.approveJobListing(parseInt(id));
      
      if (!listing) {
        return res.status(404).json({ message: "Job listing not found" });
      }
      
      res.json(listing);
    } catch (error) {
      res.status(500).json({ message: "Error approving job listing" });
    }
  });
  
  // Advertisement Routes
  app.get("/api/advertisements", async (req, res) => {
    try {
      const placement = req.query.placement as string;
      const ads = await storage.getAdvertisements(placement);
      res.json(ads);
    } catch (error) {
      res.status(500).json({ message: "Error fetching advertisements" });
    }
  });
  
  app.post("/api/advertisements", requireAuth, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }
      
      // Validate the other fields
      const adSchema = z.object({
        title: z.string(),
        linkUrl: z.string().url(),
        placement: z.string(),
        startDate: z.string().transform(str => new Date(str)),
        endDate: z.string().transform(str => new Date(str)),
      });
      
      const adData = adSchema.parse(req.body);
      
      // Generate filename and save the image
      const fileExt = path.extname(req.file.originalname);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = `/uploads/ads/${fileName}`;
      const fullPath = path.join(process.cwd(), 'public', filePath);
      
      // Ensure directory exists
      await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
      
      // Save file
      await fs.promises.writeFile(fullPath, req.file.buffer);
      
      // Create record in database
      const ad = await storage.createAdvertisement({
        title: adData.title,
        imageUrl: filePath,
        linkUrl: adData.linkUrl,
        placement: adData.placement,
        startDate: adData.startDate,
        endDate: adData.endDate,
        userId: req.session.userId!,
      });
      
      res.status(201).json(ad);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.format() });
      }
      res.status(500).json({ message: "Error creating advertisement" });
    }
  });
  
  app.post("/api/advertisements/:id/approve", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const ad = await storage.approveAdvertisement(parseInt(id));
      
      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      res.json(ad);
    } catch (error) {
      res.status(500).json({ message: "Error approving advertisement" });
    }
  });
  
  // Emergency Banner Routes
  app.get("/api/emergency-banner", async (req, res) => {
    try {
      const banner = await storage.getActiveBanner();
      res.json(banner || null);
    } catch (error) {
      res.status(500).json({ message: "Error fetching emergency banner" });
    }
  });
  
  app.post("/api/emergency-banner", requireAdmin, async (req, res) => {
    try {
      const { message, type, expiresAt } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Banner message is required" });
      }
      
      const banner = await storage.createBanner(
        message,
        type || "info",
        req.session.userId!,
        expiresAt ? new Date(expiresAt) : undefined
      );
      
      res.status(201).json(banner);
    } catch (error) {
      res.status(500).json({ message: "Error creating emergency banner" });
    }
  });
  
  app.post("/api/emergency-banner/:id/deactivate", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deactivateBanner(parseInt(id));
      res.json({ message: "Banner deactivated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deactivating banner" });
    }
  });
  
  // Category Routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });
  
  // External API Routes with caching
  
  // SpaceX API route for launch data
  app.get("/api/spacex/launches", async (req, res) => {
    try {
      const cacheKey = '/api/spacex/launches';
      const now = Date.now();
      
      // Check if we have a cached response that's still valid
      if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_TTL) {
        return res.json(apiCache[cacheKey].data);
      }
      
      // Otherwise, fetch fresh data
      const response = await axios.get('https://api.spacexdata.com/v4/launches');
      
      // Cache the response
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: now
      };
      
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Error fetching SpaceX launch data" });
    }
  });
  
  app.get("/api/spacex/launch/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const cacheKey = `/api/spacex/launch/${id}`;
      const now = Date.now();
      
      // Check if we have a cached response that's still valid
      if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_TTL) {
        return res.json(apiCache[cacheKey].data);
      }
      
      // Otherwise, fetch fresh data
      const response = await axios.get(`https://api.spacexdata.com/v4/launches/${id}`);
      
      // Cache the response
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: now
      };
      
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Error fetching SpaceX launch" });
    }
  });
  
  app.get("/api/spacex/upcoming", async (req, res) => {
    try {
      const cacheKey = '/api/spacex/upcoming';
      const now = Date.now();
      
      // Check if we have a cached response that's still valid
      if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_TTL) {
        return res.json(apiCache[cacheKey].data);
      }
      
      // Otherwise, fetch fresh data
      const response = await axios.get('https://api.spacexdata.com/v4/launches/upcoming');
      
      // Cache the response
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: now
      };
      
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Error fetching upcoming SpaceX launches" });
    }
  });
  
  // NASA API route
  app.get("/api/nasa/apod", async (req, res) => {
    try {
      const cacheKey = '/api/nasa/apod';
      const now = Date.now();
      
      // Check if we have a cached response that's still valid
      if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_TTL) {
        return res.json(apiCache[cacheKey].data);
      }
      
      // Otherwise, fetch fresh data
      const nasa_api_key = process.env.NASA_API_KEY || '';
      const response = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${nasa_api_key}`);
      
      // Cache the response
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: now
      };
      
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Error fetching NASA data" });
    }
  });
  
  // Stripe Routes
  app.post("/api/stripe/webhook", async (req, res) => {
    try {
      await handleStripeWebhook(req, res);
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(500).end();
    }
  });
  
  app.post("/api/stripe/create-checkout-session", requireAuth, async (req, res) => {
    try {
      const { priceId } = req.body;
      
      if (!priceId) {
        return res.status(400).json({ message: "Price ID is required" });
      }
      
      // Get the user
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create the checkout session
      const session = await createStripeCheckoutSession(user, priceId);
      
      res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe checkout error:", error);
      res.status(500).json({ message: "Error creating checkout session" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
