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
  type User
} from "@shared/schema";
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
  
  // Get all users (for coauthor selection or admin dashboard depending on query param)
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const { userId } = req.session;
      const isForAdmin = req.query.admin === 'true';
      const users = await storage.getAllUsers();
      
      if (isForAdmin) {
        // Check if user is admin for detailed user info
        const requestingUser = await storage.getUser(userId);
        
        if (requestingUser?.role !== 'admin') {
          return res.status(403).json({ message: "Unauthorized: Admin access required" });
        }
        
        // Return comprehensive user data for admin dashboard
        const formattedUsers = users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          membershipTier: user.membershipTier,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          hasStripeAccount: !!user.stripeCustomerId
        }));
        
        res.json(formattedUsers);
      } else {
        // Return simplified user data (only what's needed for coauthor UI)
        const simplifiedUsers = users.map(user => ({
          id: user.id,
          username: user.username,
          profilePicture: user.profilePicture
        }));
        
        res.json(simplifiedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update user role (admin only)
  app.patch("/api/users/:userId/role", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.session;
      const targetUserId = parseInt(req.params.userId);
      const { role } = req.body;
      
      // Validate role
      if (!['user', 'author', 'editor', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      // Prevent admins from downgrading themselves
      if (userId === targetUserId && role !== 'admin') {
        return res.status(400).json({ message: "Cannot downgrade your own admin role" });
      }
      
      // Update user role
      const updatedUser = await storage.updateUser(targetUserId, { role });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role 
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Error updating user role" });
    }
  });
  
  // Update user membership tier (admin only)
  app.patch("/api/users/:userId/membership", requireAuth, requireAdmin, async (req, res) => {
    try {
      const targetUserId = parseInt(req.params.userId);
      const { tier } = req.body;
      
      // Validate membership tier
      if (!['free', 'supporter', 'pro'].includes(tier)) {
        return res.status(400).json({ message: "Invalid membership tier" });
      }
      
      // Update user membership
      const updatedUser = await storage.updateUserMembership(targetUserId, tier as 'free' | 'supporter' | 'pro');
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        id: updatedUser.id,
        username: updatedUser.username,
        membershipTier: updatedUser.membershipTier 
      });
    } catch (error) {
      console.error("Error updating user membership:", error);
      res.status(500).json({ message: "Error updating user membership" });
    }
  });
  
  app.put("/api/me", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const updateSchema = z.object({
        username: z.string().optional(),
        email: z.string().email().optional(),
        bio: z.string().max(500).optional(),
        profilePicture: z.string().optional(),
        themePreference: z.string().optional(),
        profileCustomization: z.any().optional(), // Allow any JSON structure
      });
      
      const updateData = updateSchema.parse(req.body);
      console.log("Updating user profile:", updateData);
      
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
  // Profile picture upload endpoint
  app.post("/api/users/profile-picture", requireAuth, async (req, res) => {
    try {
      // For now simply return success
      // In a production app, we would handle file upload and storage
      res.json({ success: true, profilePicture: req.body.profilePicture || "" });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      res.status(500).json({ message: "Error uploading profile picture" });
    }
  });
  
  // Change password endpoint
  app.post("/api/users/password", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const changePasswordSchema = z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      });
      
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      
      // Get current user with password
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Update user with new password
      await storage.updateUser(userId, { password: hashedPassword });
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: error.format() 
        });
      }
      
      console.error('Error changing password:', error);
      res.status(500).json({ message: "Error changing password" });
    }
  });

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
  
  // Get all articles (published and drafts) - for admin/editors only
  app.get("/api/articles/all", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
        return res.status(403).json({ message: "Only admins and editors can view all articles" });
      }
      
      // Use storage getArticles function without filtering by published status
      const allArticles = await storage.getAllArticles();
      
      // Enhance articles with author information
      const enhancedArticles = await Promise.all(allArticles.map(async (article) => {
        // Fetch authors for all articles
        const authors = await storage.getArticleAuthors(article.id);
        // Map to a simplified author structure
        const authorData = authors.map(authorRecord => ({
          id: authorRecord.userId,
          username: authorRecord.user.username,
          profilePicture: authorRecord.user.profilePicture,
          role: authorRecord.role
        }));
        
        return {
          ...article,
          authors: authorData
        };
      }));
      
      res.json(enhancedArticles);
    } catch (error) {
      console.error("Error fetching all articles:", error);
      res.status(500).json({ message: "Error fetching all articles" });
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
      
      // Check if preview mode is requested and if article is a draft
      const isPreview = req.query.preview === 'true';
      const isDraft = article.status === 'draft';
      
      // If article is a draft, enforce access control
      if (isDraft) {
        // Check if this is a preview request, otherwise reject
        if (!isPreview) {
          return res.status(404).json({ message: "Article not found" });
        }
        
        // For preview mode, check authentication through session
        if (!req.session || !req.session.userId) {
          return res.status(401).json({ message: "Authentication required to preview drafts" });
        }
        
        // Check user permissions for viewing drafts
        const userId = req.session.userId;
        if (!userId) {
          return res.status(401).json({ message: "Authentication required to preview drafts" });
        }
        
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        
        // Only admins, editors, or the article's authors can view drafts
        const isAdmin = user.role === 'admin';
        const isEditor = user.role === 'editor';
        const isAuthor = user.role === 'author';
        
        // If the user is an author, check if they are one of the article's authors
        let isArticleAuthor = false;
        if (isAuthor) {
          const authors = await storage.getArticleAuthors(article.id);
          isArticleAuthor = authors.some(author => author.user.id === userId);
        }
        
        // If not authorized to view draft, return 403
        if (!(isAdmin || isEditor || (isAuthor && isArticleAuthor))) {
          return res.status(403).json({ 
            message: "You don't have permission to view this draft article" 
          });
        }
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
  
  // Dedicated endpoint for updating article status
  app.patch("/api/articles/:id/status", requireAuth, async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const userId = req.session.userId!;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Validate status value
      const validStatuses = ['draft', 'needs_edits', 'good_to_publish', 'do_not_publish', 'published'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const user = await storage.getUser(userId);
      
      // Only admin and editor roles can change article status
      if (user!.role !== 'admin' && user!.role !== 'editor') {
        return res.status(403).json({ message: "Only administrators and editors can change article status" });
      }
      
      // Verify article exists
      const article = await storage.getArticleById(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if published status is changing
      const isPublishing = status === 'published' && article.status !== 'published';
      
      // Prepare update data
      const updateData: Partial<typeof articles.$inferSelect> = { status };
      
      // Set publishedAt timestamp when publishing
      if (isPublishing) {
        updateData.publishedAt = new Date();
      }
      
      // Update the article
      const updatedArticle = await storage.updateArticle(articleId, updateData);
      
      res.json(updatedArticle);
    } catch (error) {
      console.error("Error updating article status:", error);
      res.status(500).json({ message: "Error updating article status" });
    }
  });
  
  app.delete("/api/articles/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      // Get the user to check their role
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const { id } = req.params;
      const articleId = parseInt(id);
      
      const article = await storage.getArticleById(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if user has permission to delete this article
      const isAdmin = user.role === 'admin';
      const isEditor = user.role === 'editor';
      
      // If the user is an author, check if they are the article's author
      let isArticleAuthor = false;
      if (user.role === 'author') {
        const authors = await storage.getArticleAuthors(article.id);
        isArticleAuthor = authors.some(author => author.user.id === userId);
      }
      
      // Determine if user has permission to delete
      // Admins can delete any article
      // Editors can delete any article
      // Authors can only delete their own drafts, not published articles
      const canDelete = isAdmin || 
                       isEditor || 
                       (user.role === 'author' && isArticleAuthor && article.status === 'draft');
      
      if (!canDelete) {
        return res.status(403).json({ 
          message: "You don't have permission to delete this article. Only admins, editors, or the article's authors (for drafts only) can delete it." 
        });
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
  
  app.get("/api/advertisements/:placement", async (req, res) => {
    try {
      const { placement } = req.params;
      const adsForPlacement = await storage.getAdvertisements(placement);
      
      // If multiple ads exist for this placement, randomly select one
      if (adsForPlacement.length > 0) {
        const randomIndex = Math.floor(Math.random() * adsForPlacement.length);
        res.json(adsForPlacement[randomIndex]);
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Error fetching advertisement by placement:", error);
      res.status(500).json({ message: "Error fetching advertisement" });
    }
  });

  app.post("/api/advertisements/:id/impression", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementAdImpression(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording impression:", error);
      res.status(500).json({ message: "Error recording impression" });
    }
  });

  app.post("/api/advertisements/:id/click", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementAdClick(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording click:", error);
      res.status(500).json({ message: "Error recording click" });
    }
  });
  
  // File upload advertisement route
  app.post("/api/advertisements/upload", requireAuth, upload.single('image'), async (req, res) => {
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
  
  // JSON API advertisement route with optional imageUrl
  app.post("/api/advertisements", requireAuth, async (req, res) => {
    try {
      // Validate request
      const { title, imageUrl, linkUrl, placement, startDate, endDate, userId } = req.body;
      
      if (!title || !linkUrl || !placement || !startDate || !endDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Calculate price based on placement and duration
      let price = 0;
      const durationDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
      
      switch (placement) {
        case 'homepage':
          price = 2000 * durationDays; // $20/day
          break;
        case 'sidebar':
          price = 1000 * durationDays; // $10/day
          break;
        case 'article':
          price = 1500 * durationDays; // $15/day
          break;
        case 'newsletter':
          price = 3000 * durationDays; // $30/day
          break;
        default:
          price = 1000 * durationDays; // $10/day default
      }
      
      // Create the advertisement with status fields
      const adData = {
        title,
        imageUrl,
        linkUrl,
        placement,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        userId: userId || req.session.userId,
        price,
      };
      
      const ad = await storage.createAdvertisementWithStatus({
        ...adData,
        isApproved: false,
        status: 'pending',
        paymentStatus: 'pending',
      });
      
      res.status(201).json(ad);
    } catch (error) {
      console.error("Error creating advertisement:", error);
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
  
  // Advertisement Routes
  
  // Get all advertisements
  app.get("/api/advertisements", async (req, res) => {
    try {
      const placement = req.query.placement as string | undefined;
      const ads = await storage.getAdvertisements(placement);
      
      // Filter to only include approved and active ads
      const now = new Date();
      const activeAds = ads.filter(ad => 
        ad.isApproved && 
        new Date(ad.startDate) <= now && 
        new Date(ad.endDate) >= now
      );
      
      res.json(activeAds);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      res.status(500).json({ message: "Error fetching advertisements" });
    }
  });
  
  // Get all advertisements (admin only)
  app.get("/api/advertisements/all", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin' && user?.role !== 'editor') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const ads = await storage.getAdvertisements();
      
      // Include user information with each ad
      const enhancedAds = await Promise.all(ads.map(async (ad) => {
        const adUser = await storage.getUser(ad.userId);
        return {
          ...ad,
          user: adUser ? {
            username: adUser.username,
            email: adUser.email
          } : undefined
        };
      }));
      
      res.json(enhancedAds);
    } catch (error) {
      console.error("Error fetching all advertisements:", error);
      res.status(500).json({ message: "Error fetching all advertisements" });
    }
  });
  
  // URL for create advertisement is maintained in our already defined route above
  
  // Approve advertisement (admin only)
  app.post("/api/advertisements/:id/approve", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin' && user?.role !== 'editor') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const adId = parseInt(req.params.id);
      
      // Get the advertisement first to check its payment status
      const existingAd = await storage.getAdvertisementById(adId);
      if (!existingAd) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      // Only approve if payment is complete or update status accordingly
      let updateData: Partial<any> = { 
        isApproved: true,
        adminNotes: null // Clear any previous rejection notes
      };
      
      if (existingAd.paymentStatus === 'complete') {
        updateData.status = 'active';
      } else {
        updateData.status = 'approved_pending_payment';
      }
      
      // Update the advertisement
      const ad = await storage.updateAdvertisement(adId, updateData);
      
      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      res.json(ad);
    } catch (error) {
      console.error("Error approving advertisement:", error);
      res.status(500).json({ message: "Error approving advertisement" });
    }
  });
  
  // Reject advertisement (admin only)
  app.post("/api/advertisements/:id/reject", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin' && user?.role !== 'editor') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const adId = parseInt(req.params.id);
      const { adminNotes } = req.body;
      
      if (!adminNotes) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }
      
      // Update to set isApproved to false and add admin notes
      const ad = await storage.updateAdvertisement(adId, { 
        isApproved: false, 
        status: 'rejected',
        adminNotes 
      });
      
      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      res.json(ad);
    } catch (error) {
      console.error("Error rejecting advertisement:", error);
      res.status(500).json({ message: "Error rejecting advertisement" });
    }
  });
  
  // Delete advertisement (admin only or owner)
  app.delete("/api/advertisements/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      const adId = parseInt(req.params.id);
      
      // Get the ad to check ownership
      const ad = await storage.getAdvertisementById(adId);
      
      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      // Allow admins/editors or the owner to delete
      if (user?.role !== 'admin' && user?.role !== 'editor' && ad.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const success = await storage.deleteAdvertisement(adId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete advertisement" });
      }
      
      res.json({ message: "Advertisement deleted successfully" });
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      res.status(500).json({ message: "Error deleting advertisement" });
    }
  });
  
  // Record ad click
  app.post("/api/advertisements/:id/click", async (req, res) => {
    try {
      const adId = parseInt(req.params.id);
      await storage.incrementAdClick(adId);
      
      // Return a 204 No Content
      res.status(204).end();
    } catch (error) {
      console.error("Error recording advertisement click:", error);
      res.status(500).json({ message: "Error recording advertisement click" });
    }
  });
  
  // Record ad impression
  app.post("/api/advertisements/:id/impression", async (req, res) => {
    try {
      const adId = parseInt(req.params.id);
      await storage.incrementAdImpression(adId);
      
      // Return a 204 No Content
      res.status(204).end();
    } catch (error) {
      console.error("Error recording advertisement impression:", error);
      res.status(500).json({ message: "Error recording advertisement impression" });
    }
  });
  
  // Get advertisements for the logged-in user
  app.get("/api/advertisements/user", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const ads = await storage.getAdvertisementsByUser(userId);
      res.json(ads);
    } catch (error) {
      console.error("Error fetching user advertisements:", error);
      res.status(500).json({ message: "Error fetching user advertisements" });
    }
  });
  
  // Cancel advertisement (user can cancel their own ads)
  app.post("/api/advertisements/:id/cancel", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const adId = parseInt(req.params.id);
      
      const ad = await storage.getAdvertisementById(adId);
      
      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      if (ad.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedAd = await storage.updateAdvertisement(adId, { 
        status: 'cancelled',
        adminNotes: 'Cancelled by advertiser'
      });
      
      res.json(updatedAd);
    } catch (error) {
      console.error("Error cancelling advertisement:", error);
      res.status(500).json({ message: "Error cancelling advertisement" });
    }
  });
  
  // Create checkout session for advertisement
  app.post("/api/advertisements/:id/checkout", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const adId = parseInt(req.params.id);
      
      // Get the advertisement
      const ad = await storage.getAdvertisementById(adId);
      
      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      // Ensure the user owns the advertisement
      if (ad.userId !== userId) {
        return res.status(403).json({ message: "You don't own this advertisement" });
      }
      
      // Ensure the advertisement is in a state that requires payment
      if (ad.paymentStatus === 'complete') {
        return res.status(400).json({ message: "This advertisement has already been paid for" });
      }
      
      if (!ad.price) {
        return res.status(400).json({ message: "This advertisement doesn't have a price set" });
      }
      
      // Create a Stripe checkout session or simulate one in development
      let checkoutUrl;
      
      // Since we're using placeholder Stripe for development, simulate the checkout process
      
      // Get placement label for display purposes
      let placementLabel = "Unknown";
      switch (ad.placement) {
        case 'homepage': placementLabel = "Homepage"; break;
        case 'sidebar': placementLabel = "Sidebar"; break;
        case 'article': placementLabel = "In-Article"; break;
        case 'newsletter': placementLabel = "Newsletter"; break;
      }
      
      // For development without Stripe, simulate a checkout URL and successful payment
      const simulatedPaymentId = `sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Build the success URL with query parameters for identification
      checkoutUrl = `${req.protocol}://${req.get('host')}/advertise-success?ad_id=${ad.id}&payment_id=${simulatedPaymentId}`;
      
      // Update the advertisement payment status to complete and set appropriate status
      await storage.updateAdvertisement(adId, {
        paymentStatus: 'complete',
        paymentId: simulatedPaymentId,
        status: 'active', // Or 'pending' if not approved yet
      });
      
      res.json({ checkoutUrl });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Error creating checkout session" });
    }
  });
  
  // Process advertisement payment (legacy endpoint)
  app.post("/api/advertisements/:id/pay", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const adId = parseInt(req.params.id);
      
      const ad = await storage.getAdvertisementById(adId);
      
      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      if (ad.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      if (ad.paymentStatus === 'paid') {
        return res.status(400).json({ message: "Payment already processed" });
      }
      
      // TODO: In a production environment, integrate with Stripe for real payments
      // For now, we'll simulate successful payment
      
      // Simulate Stripe checkout:
      if (process.env.STRIPE_SECRET_KEY) {
        try {
          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
              {
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: `Advertisement: ${ad.title}`,
                    description: `${ad.placement} placement from ${new Date(ad.startDate).toLocaleDateString()} to ${new Date(ad.endDate).toLocaleDateString()}`,
                  },
                  unit_amount: ad.price || 1000, // Default to $10 if no price set
                },
                quantity: 1,
              },
            ],
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/advertiser-dashboard?payment=success`,
            cancel_url: `${req.protocol}://${req.get('host')}/advertiser-dashboard?payment=cancelled`,
          });
          
          return res.json({ checkoutUrl: session.url });
        } catch (stripeError) {
          console.error("Stripe error:", stripeError);
        }
      }
      
      // If no Stripe or Stripe fails, simulate a successful payment
      const updatedAd = await storage.updateAdvertisement(adId, {
        paymentStatus: 'paid',
        paymentId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        // Auto-approve for demo purposes - in production, this would still require admin review
        isApproved: true,
        status: 'approved',
      });
      
      res.json(updatedAd);
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Error processing payment" });
    }
  });
  
  // Update advertisement (admin or owner)
  app.patch("/api/advertisements/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      const adId = parseInt(req.params.id);
      
      // Get the ad to check ownership
      const ad = await storage.getAdvertisementById(adId);
      
      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      // Allow admins/editors or the owner to update
      if (user?.role !== 'admin' && user?.role !== 'editor' && ad.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { title, imageUrl, linkUrl, placement, startDate, endDate, status, adminNotes } = req.body;
      
      // Users can only update certain fields, admins can update all
      const updateData: any = {};
      
      if (user?.role === 'admin' || user?.role === 'editor') {
        // Admin updates
        if (title) updateData.title = title;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (linkUrl) updateData.linkUrl = linkUrl;
        if (placement) updateData.placement = placement;
        if (startDate) updateData.startDate = new Date(startDate);
        if (endDate) updateData.endDate = new Date(endDate);
        if (status) updateData.status = status;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
      } else {
        // Regular user updates (limited fields)
        if (title) updateData.title = title;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (linkUrl) updateData.linkUrl = linkUrl;
      }
      
      const updatedAd = await storage.updateAdvertisement(adId, updateData);
      
      if (!updatedAd) {
        return res.status(500).json({ message: "Failed to update advertisement" });
      }
      
      res.json(updatedAd);
    } catch (error) {
      console.error("Error updating advertisement:", error);
      res.status(500).json({ message: "Error updating advertisement" });
    }
  });
  
  // External API Routes with caching
  
  // SpaceX API route for launch data
  // SpaceX API routes
  app.get("/api/spacex/launches", async (req, res) => {
    try {
      const cacheKey = '/api/spacex/launches';
      const now = Date.now();
      
      // Check if we have a cached response that's still valid
      if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_TTL) {
        return res.json(apiCache[cacheKey].data);
      }
      
      // Otherwise, fetch fresh data
      const response = await axios.get('https://api.spacexdata.com/v5/launches/past');
      
      // Enhance response with rocket and launchpad data where needed
      const enhancedData = await Promise.all(
        response.data.map(async (launch: any) => {
          // If we need additional data for this launch
          if (!launch.rocket?.name && launch.rocket) {
            try {
              const rocketResponse = await axios.get(`https://api.spacexdata.com/v4/rockets/${launch.rocket}`);
              launch.rocket = { id: launch.rocket, name: rocketResponse.data.name };
            } catch (err) {
              console.error("Error fetching rocket data:", err);
            }
          }
          
          if (!launch.launchpad?.name && launch.launchpad) {
            try {
              const launchpadResponse = await axios.get(`https://api.spacexdata.com/v4/launchpads/${launch.launchpad}`);
              launch.launchpad = { 
                id: launch.launchpad, 
                name: launchpadResponse.data.name,
                locality: launchpadResponse.data.locality,
                region: launchpadResponse.data.region
              };
            } catch (err) {
              console.error("Error fetching launchpad data:", err);
            }
          }
          
          return launch;
        })
      );
      
      // Cache the response
      apiCache[cacheKey] = {
        data: enhancedData,
        timestamp: now
      };
      
      res.json(enhancedData);
    } catch (error) {
      console.error("Error fetching SpaceX launch data:", error);
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
      const response = await axios.get(`https://api.spacexdata.com/v5/launches/${id}`);
      const launch = response.data;
      
      // Enhance with rocket and launchpad data
      if (launch.rocket) {
        try {
          const rocketResponse = await axios.get(`https://api.spacexdata.com/v4/rockets/${launch.rocket}`);
          launch.rocket = { 
            id: launch.rocket, 
            name: rocketResponse.data.name,
            type: rocketResponse.data.type,
            company: rocketResponse.data.company,
            height: rocketResponse.data.height,
            diameter: rocketResponse.data.diameter
          };
        } catch (err) {
          console.error("Error fetching rocket data:", err);
        }
      }
      
      if (launch.launchpad) {
        try {
          const launchpadResponse = await axios.get(`https://api.spacexdata.com/v4/launchpads/${launch.launchpad}`);
          launch.launchpad = { 
            id: launch.launchpad, 
            name: launchpadResponse.data.name,
            full_name: launchpadResponse.data.full_name,
            locality: launchpadResponse.data.locality,
            region: launchpadResponse.data.region,
            latitude: launchpadResponse.data.latitude,
            longitude: launchpadResponse.data.longitude
          };
        } catch (err) {
          console.error("Error fetching launchpad data:", err);
        }
      }
      
      // Cache the response
      apiCache[cacheKey] = {
        data: launch,
        timestamp: now
      };
      
      res.json(launch);
    } catch (error) {
      console.error("Error fetching SpaceX launch:", error);
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
      const response = await axios.get('https://api.spacexdata.com/v5/launches/upcoming');
      
      // Enhance response with rocket and launchpad data
      const enhancedData = await Promise.all(
        response.data.map(async (launch: any) => {
          // If we need additional data for this launch
          if (!launch.rocket?.name && launch.rocket) {
            try {
              const rocketResponse = await axios.get(`https://api.spacexdata.com/v4/rockets/${launch.rocket}`);
              launch.rocket = { id: launch.rocket, name: rocketResponse.data.name };
            } catch (err) {
              console.error("Error fetching rocket data:", err);
            }
          }
          
          if (!launch.launchpad?.name && launch.launchpad) {
            try {
              const launchpadResponse = await axios.get(`https://api.spacexdata.com/v4/launchpads/${launch.launchpad}`);
              launch.launchpad = { 
                id: launch.launchpad, 
                name: launchpadResponse.data.name,
                locality: launchpadResponse.data.locality,
                region: launchpadResponse.data.region
              };
            } catch (err) {
              console.error("Error fetching launchpad data:", err);
            }
          }
          
          return launch;
        })
      );
      
      // Cache the response
      apiCache[cacheKey] = {
        data: enhancedData,
        timestamp: now
      };
      
      res.json(enhancedData);
    } catch (error) {
      console.error("Error fetching upcoming SpaceX launches:", error);
      res.status(500).json({ message: "Error fetching upcoming SpaceX launches" });
    }
  });
  
  // Fetch SpaceX rockets
  app.get("/api/spacex/rockets", async (req, res) => {
    try {
      const cacheKey = '/api/spacex/rockets';
      const now = Date.now();
      
      // Check if we have a cached response that's still valid
      if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_TTL) {
        return res.json(apiCache[cacheKey].data);
      }
      
      // Otherwise, fetch fresh data
      const response = await axios.get('https://api.spacexdata.com/v4/rockets');
      
      // Cache the response
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: now
      };
      
      res.json(response.data);
    } catch (error) {
      console.error("Error fetching SpaceX rockets:", error);
      res.status(500).json({ message: "Error fetching SpaceX rockets" });
    }
  });
  
  // The Space Devs Launch Library API - Get all upcoming launches
  app.get("/api/launches/upcoming", async (req, res) => {
    try {
      const cacheKey = '/api/launches/upcoming';
      const now = Date.now();
      
      // Check if we have a cached response that's still valid
      if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_TTL) {
        return res.json(apiCache[cacheKey].data);
      }
      
      // Otherwise, fetch fresh data with backup URL pattern
      try {
        console.log("Fetching upcoming launches from Space Devs");
        const response = await axios.get('https://ll.thespacedevs.com/2.2.0/launch/upcoming/', {
          headers: {
            'User-Agent': 'Proxima-Report/1.0',
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        });
        
        // Cache the response
        apiCache[cacheKey] = {
          data: response.data,
          timestamp: now
        };
        
        console.log(`Space Devs upcoming launches: Found ${response.data?.results?.length || 0} launches`);
        res.json(response.data);
      } catch (innerError) {
        console.error("Failed with primary URL, trying alternative:", innerError);
        
        // Try alternative URL
        const response = await axios.get('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/', {
          headers: {
            'User-Agent': 'Proxima-Report/1.0',
            'Accept': 'application/json'
          },
          timeout: 10000
        });
        
        // Cache the response
        apiCache[cacheKey] = {
          data: response.data,
          timestamp: now
        };
        
        console.log(`Space Devs upcoming launches (alt URL): Found ${response.data?.results?.length || 0} launches`);
        res.json(response.data);
      }
    } catch (error) {
      const err = error as any;
      console.error("Error fetching upcoming launches from The Space Devs:", 
        err.response ? `Status: ${err.response.status}` : err.message);
      res.status(500).json({ message: "Error fetching upcoming launches" });
    }
  });
  
  // The Space Devs Launch Library API - Get all previous launches
  app.get("/api/launches/previous", async (req, res) => {
    try {
      const cacheKey = '/api/launches/previous';
      const now = Date.now();
      
      // Check if we have a cached response that's still valid
      if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_TTL) {
        return res.json(apiCache[cacheKey].data);
      }
      
      // Otherwise, fetch fresh data with backup URL pattern
      try {
        console.log("Fetching previous launches from Space Devs");
        const response = await axios.get('https://ll.thespacedevs.com/2.2.0/launch/previous/', {
          headers: {
            'User-Agent': 'Proxima-Report/1.0',
            'Accept': 'application/json'
          },
          timeout: 10000,
          params: {
            limit: 20 // Limit to 20 previous launches to improve performance
          }
        });
        
        // Cache the response
        apiCache[cacheKey] = {
          data: response.data,
          timestamp: now
        };
        
        console.log(`Space Devs previous launches: Found ${response.data?.results?.length || 0} launches`);
        res.json(response.data);
      } catch (innerError) {
        console.error("Failed with primary URL, trying alternative:", innerError);
        
        // Try alternative URL
        const response = await axios.get('https://lldev.thespacedevs.com/2.2.0/launch/previous/', {
          headers: {
            'User-Agent': 'Proxima-Report/1.0',
            'Accept': 'application/json'
          },
          timeout: 10000,
          params: {
            limit: 20 // Limit to 20 previous launches to improve performance
          }
        });
        
        // Cache the response
        apiCache[cacheKey] = {
          data: response.data,
          timestamp: now
        };
        
        console.log(`Space Devs previous launches (alt URL): Found ${response.data?.results?.length || 0} launches`);
        res.json(response.data);
      }
    } catch (error) {
      const err = error as any;
      console.error("Error fetching previous launches from The Space Devs:", 
        err.response ? `Status: ${err.response.status}` : err.message);
      res.status(500).json({ message: "Error fetching previous launches" });
    }
  });
  
  // The Space Devs Launch Library API - Get launch details by ID
  app.get("/api/launches/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const cacheKey = `/api/launches/${id}`;
      const now = Date.now();
      
      // Check if we have a cached response that's still valid
      if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_TTL) {
        return res.json(apiCache[cacheKey].data);
      }
      
      // Otherwise, fetch fresh data
      const response = await axios.get(`https://ll.thespacedevs.com/2.2.0/launch/${id}/`, {
        headers: {
          'User-Agent': 'Proxima-Report/1.0'
        }
      });
      
      // Cache the response
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: now
      };
      
      res.json(response.data);
    } catch (error) {
      console.error(`Error fetching launch details for ID ${req.params.id}:`, error);
      res.status(500).json({ message: "Error fetching launch details" });
    }
  });
  
  // ISS Current Location API
  app.get("/api/iss/location", async (req, res) => {
    try {
      const cacheKey = '/api/iss/location';
      const now = Date.now();
      
      // Much longer cache period to avoid rate limiting
      // Open Notify has very strict rate limits
      const ISS_CACHE_TTL = 120 * 1000; // 2 minutes
      
      // Check if we have a cached response that's still valid
      if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < ISS_CACHE_TTL) {
        return res.json(apiCache[cacheKey].data);
      }
      
      // Otherwise, fetch fresh data with timeout and better error handling
      try {
        console.log("Fetching ISS location data");
        const response = await axios.get('http://api.open-notify.org/iss-now.json', {
          timeout: 5000 // 5 second timeout
        });
        
        // Cache the response
        apiCache[cacheKey] = {
          data: response.data,
          timestamp: now
        };
        
        console.log("Successfully fetched ISS location data");
        res.json(response.data);
      } catch (innerError) {
        const err = innerError as any;
        // If we have a rate limit error or any error with a response, and have cached data
        if (err.response && err.response.status === 429 && apiCache[cacheKey]) {
          console.warn("Rate limited on ISS API, using cached data");
          res.json(apiCache[cacheKey].data);
        } else if (apiCache[cacheKey]) {
          // Use stale cache if available, regardless of error
          console.warn("Error fetching ISS location, using stale cache:", err.message || err);
          res.json(apiCache[cacheKey].data);
        } else {
          // If no cached data, throw to outer catch
          throw innerError;
        }
      }
    } catch (error) {
      const err = error as any;
      console.error("Error in ISS location route:", err.message || err);
      
      // Default fallback with fixed position if no cache is available
      const fallbackData = {
        message: "success",
        timestamp: Math.floor(Date.now() / 1000),
        iss_position: {
          latitude: "0.0000",
          longitude: "0.0000"
        }
      };
      
      // Cache this fallback with a short TTL
      const ISS_CACHE_TTL = 120 * 1000; // 2 minutes
      apiCache['/api/iss/location'] = {
        data: fallbackData,
        timestamp: Date.now() - (ISS_CACHE_TTL - 10000) // Set to expire in 10 seconds
      };
      
      res.json(fallbackData);
    }
  });
  
  // People in Space API
  app.get("/api/space/people", async (req, res) => {
    try {
      const cacheKey = '/api/space/people';
      const now = Date.now();
      
      // Cache for a day as astronaut info doesn't change that often
      const PEOPLE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
      
      // Check if we have a cached response that's still valid
      if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < PEOPLE_CACHE_TTL) {
        return res.json(apiCache[cacheKey].data);
      }
      
      // Otherwise, fetch fresh data with better error handling
      try {
        console.log("Fetching people in space data");
        const response = await axios.get('http://api.open-notify.org/astros.json', {
          timeout: 5000 // 5 second timeout
        });
        
        // Cache the response
        apiCache[cacheKey] = {
          data: response.data,
          timestamp: now
        };
        
        console.log(`Successfully fetched people in space data, found ${response.data.number} people`);
        res.json(response.data);
      } catch (innerError) {
        const err = innerError as any;
        
        // If we have a rate limit error or timeout, but have cached data
        if ((err.response && err.response.status === 429) && apiCache[cacheKey]) {
          console.warn("Rate limited on People in Space API, using cached data");
          res.json(apiCache[cacheKey].data);
        } else if (apiCache[cacheKey]) {
          // Use stale cache for any other error if available
          console.warn("Error fetching people in space, using stale cache:", err.message || err);
          res.json(apiCache[cacheKey].data);
        } else {
          // If no cached data, throw to outer catch
          throw innerError;
        }
      }
    } catch (error) {
      const err = error as any;
      console.error("Error in people in space route:", err.message || err);
      
      // Default data with ISS crew if no cache is available
      // Using current known ISS crew members - this is verifiable public information
      const fallbackData = {
        message: "success",
        number: 7,
        people: [
          { name: "Oleg Kononenko", craft: "ISS" },
          { name: "Nikolai Chub", craft: "ISS" },
          { name: "Tracy C. Dyson", craft: "ISS" },
          { name: "Suni Williams", craft: "ISS" },
          { name: "Butch Wilmore", craft: "ISS" },
          { name: "Andreas Mogensen", craft: "ISS" },
          { name: "Konstantin Borisov", craft: "ISS" }
        ]
      };
      
      // Cache this fallback with a short TTL
      const currentTime = Date.now();
      const PEOPLE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
      apiCache['/api/space/people'] = {
        data: fallbackData,
        timestamp: currentTime - (PEOPLE_CACHE_TTL - 3600000) // Set to expire in 1 hour
      };
      
      res.json(fallbackData);
    }
  });
  
  // Direct access to The Space Devs API 
  app.get("/api/thespacedevs/:endpoint", async (req, res) => {
    try {
      const { endpoint } = req.params;
      const cacheKey = `/api/thespacedevs/${endpoint}`;
      const now = Date.now();
      
      // Check if we have a cached response that's still valid
      if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_TTL) {
        return res.json(apiCache[cacheKey].data);
      }
      
      // Determine complete URL with or without trailing slash
      let url = `https://ll.thespacedevs.com/2.2.0/${endpoint}`;
      if (!url.endsWith('/')) {
        url += '/';
      }
      
      console.log(`Fetching from Space Devs API: ${url}`);
      
      // Fetch with a longer timeout
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Proxima-Report/1.0',
          'Accept': 'application/json'
        },
        params: req.query,
        timeout: 10000 // 10 second timeout
      });
      
      // Log the response data shape for debugging
      console.log(`Space Devs API response status: ${response.status}`);
      console.log(`Space Devs API data shape:`, Object.keys(response.data));
      
      // Cache the response
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: now
      };
      
      res.json(response.data);
    } catch (error) {
      const err = error as any;  // Type assertion for TS compatibility
      console.error(`Error fetching from The Space Devs API (${req.params.endpoint}):`, 
        err.response ? `Status: ${err.response.status}, Data: ${JSON.stringify(err.response.data)}` : err.message);
      res.status(500).json({ message: "Error fetching data from The Space Devs API" });
    }
  });
  
  // NASA API route
  // NASA APOD (Astronomy Picture of the Day) API
  app.get("/api/nasa/apod", async (req, res) => {
    try {
      const cacheKey = '/api/nasa/apod';
      const now = Date.now();
      
      // Check if we have a cached response that's still valid
      if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_TTL) {
        return res.json(apiCache[cacheKey].data);
      }
      
      // Use the DEMO_KEY if no API key is provided
      const nasa_api_key = process.env.NASA_API_KEY || 'DEMO_KEY';
      
      // Otherwise, fetch fresh data
      const response = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${nasa_api_key}`);
      
      // Cache the response
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: now
      };
      
      res.json(response.data);
    } catch (error) {
      console.error("Error fetching NASA APOD:", error);
      res.status(500).json({ message: "Error fetching NASA data" });
    }
  });
  
  // NASA Earth Imagery API
  app.get("/api/nasa/earth", async (req, res) => {
    try {
      const { lat, lon } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const cacheKey = `/api/nasa/earth?lat=${lat}&lon=${lon}`;
      const now = Date.now();
      
      // Check if we have a cached response that's still valid
      if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_TTL) {
        return res.json(apiCache[cacheKey].data);
      }
      
      // Use the DEMO_KEY if no API key is provided
      const nasa_api_key = process.env.NASA_API_KEY || 'DEMO_KEY';
      
      // Fetch data from NASA API
      const response = await axios.get(
        `https://api.nasa.gov/planetary/earth/imagery?lon=${lon}&lat=${lat}&date=2022-01-01&dim=0.15&api_key=${nasa_api_key}`
      );
      
      // Cache the response
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: now
      };
      
      res.json(response.data);
    } catch (error) {
      console.error("Error fetching NASA Earth imagery:", error);
      res.status(500).json({ message: "Error fetching NASA Earth imagery" });
    }
  });
  
  // NASA Epic API (Earth Polychromatic Imaging Camera)
  app.get("/api/nasa/epic", async (req, res) => {
    try {
      const cacheKey = '/api/nasa/epic';
      const now = Date.now();
      
      // Check if we have a cached response that's still valid
      if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_TTL) {
        return res.json(apiCache[cacheKey].data);
      }
      
      // Use the DEMO_KEY if no API key is provided
      const nasa_api_key = process.env.NASA_API_KEY || 'DEMO_KEY';
      
      // Fetch the latest natural color images
      const response = await axios.get(
        `https://api.nasa.gov/EPIC/api/natural?api_key=${nasa_api_key}`
      );
      
      // Cache the response
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: now
      };
      
      res.json(response.data);
    } catch (error) {
      console.error("Error fetching NASA EPIC data:", error);
      res.status(500).json({ message: "Error fetching NASA EPIC data" });
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
  
  app.get("/api/stripe/verify-session", requireAuth, async (req, res) => {
    try {
      const { session_id } = req.query;
      
      if (!session_id) {
        return res.status(400).json({ success: false, message: "Session ID is required" });
      }
      
      // Retrieve session from Stripe
      const session = await stripe.checkout.sessions.retrieve(session_id as string);
      
      if (!session) {
        return res.status(404).json({ success: false, message: "Session not found" });
      }
      
      // Check if the session was successful
      if (session.payment_status !== "paid") {
        return res.status(400).json({ success: false, message: "Payment not completed" });
      }
      
      // Get the subscription from the session
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      
      // Determine the tier based on the price ID
      const priceId = subscription.items.data[0].price.id;
      let tier: "supporter" | "pro" = "supporter";
      
      if (priceId === SUBSCRIPTION_PRICES.pro) {
        tier = "pro";
      }
      
      // Update the user's membership tier if not already updated by webhook
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (user && user.membershipTier !== tier) {
        await storage.updateUserMembership(userId, tier);
        
        // Update or set stripe info
        if (!user.stripeCustomerId || !user.stripeSubscriptionId) {
          await storage.updateUserStripeInfo(userId, {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string
          });
        }
      }
      
      res.json({ 
        success: true, 
        tier,
        customerId: session.customer,
        subscriptionId: session.subscription
      });
    } catch (error: any) {
      console.error("Error verifying session:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error verifying subscription", 
        error: error.message 
      });
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
