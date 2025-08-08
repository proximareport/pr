import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import { ZodError } from "zod";

import { searchArticles, searchUsers, getPopularSearches, saveSearch } from "./searchService";
import { subscribeToNewsletter, unsubscribeFromNewsletter, verifySubscription, sendNewsletterEmail } from "./emailService";
// Note: We will directly register search routes and newsletter routes here
import {
  insertUserSchema,

  insertCommentSchema,
  insertAstronomyPhotoSchema,
  insertJobListingSchema,
  insertAdvertisementSchema,
  insertMediaLibrarySchema,
  updateSiteSettingsSchema,
  insertTaxonomySchema,
  insertArticleTaxonomySchema,
  insertSiteBlockSchema,
  updateSiteBlockSchema,
  type User,
  type MediaLibraryItem,
  type SiteSettings,
  type UpdateSiteSettings,
  type TaxonomyItem,
  type ArticleTaxonomy,
  type SiteBlock,
  type InsertSiteBlock,
  type UpdateSiteBlock,
  advertisements,
  siteBlocks
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
import { 
  getSpaceXUpcomingLaunches, 
  getSpaceXLaunches, 
  getUpcomingLaunches, 
  getPreviousLaunches,
  getISSLocation,
  getISSPassTimes,
  getPeopleInSpace,
  getSpaceEvents,
  getSpacecraft,
  getSpaceAgencies,
  getLaunchPads,
  getSpaceXRockets,
  getSpaceXCompanyInfo,
  getSpaceXStarlink,
  getSpaceNews,
  getSolarSystemBodies,
  getNASAAPOD,
  getSpaceWeather,
  getNearEarthObjects,
  getComprehensiveSpaceData,
  getMarsWeather,
  getMoonPhase,
  getISSPassPredictions,
  getSatelliteTracking,
  getExoplanets,
  getSolarActivity,
  getHubbleImages,
  getEarthquakeData,
  getAdvancedSpaceWeather
} from './launchesService';
import { getFeaturedImages, getGalleryImages, getAvailableTags } from './ghostService';
import { getPosts, getPostBySlug } from './ghostService';
import { ThemeService } from './themeService';

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
    // Check if user is admin - ONLY use session flag for security
    // Admin status should ONLY be set during proper login authentication
    const isAdmin = req.session && req.session.isAdmin === true;
    
    // Admin users can always access everything
    if (isAdmin) {
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

// Removed insecure bypassAuth middleware

const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated
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
  
  // Debug endpoint to check environment variables
  app.get("/api/debug/env", (req: Request, res: Response) => {
    res.json({
      NODE_ENV: process.env.NODE_ENV,
      GHOST_URL: process.env.GHOST_URL,
      GHOST_CONTENT_API_KEY: process.env.GHOST_CONTENT_API_KEY ? 'SET' : 'NOT SET',
      SESSION_SECRET: process.env.SESSION_SECRET ? 'SET' : 'NOT SET',
      CLIENT_URL: process.env.CLIENT_URL,
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
      timestamp: new Date().toISOString()
    });
  });
  
  // Simple health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  
  // ----------------------------------------------------
  // SpaceX Launches API
  // ----------------------------------------------------
  app.get("/api/spacex/upcoming", async (req: Request, res: Response) => {
    try {
      const launches = await getSpaceXUpcomingLaunches();
      res.json(launches);
    } catch (error) {
      console.error('Error fetching SpaceX upcoming launches:', error);
      res.status(500).json({ error: 'Failed to fetch SpaceX upcoming launches' });
    }
  });

  app.get("/api/spacex/launches", async (req: Request, res: Response) => {
    try {
      const launches = await getSpaceXLaunches();
      res.json(launches);
    } catch (error) {
      console.error('Error fetching SpaceX launches:', error);
      res.status(500).json({ error: 'Failed to fetch SpaceX launches' });
    }
  });

  // ----------------------------------------------------
  // The Space Devs Launches API
  // ----------------------------------------------------
  app.get("/api/launches/upcoming", async (req: Request, res: Response) => {
    try {
      const launches = await getUpcomingLaunches();
      res.json(launches);
    } catch (error) {
      console.error('Error fetching upcoming launches:', error);
      res.status(500).json({ error: 'Failed to fetch upcoming launches' });
    }
  });

  app.get("/api/launches/previous", async (req: Request, res: Response) => {
    try {
      const launches = await getPreviousLaunches();
      res.json(launches);
    } catch (error) {
      console.error('Error fetching previous launches:', error);
      res.status(500).json({ error: 'Failed to fetch previous launches' });
    }
  });

  // Comprehensive Space Data API Routes
  
  // ISS Location and Tracking
  app.get("/api/iss/location", async (req: Request, res: Response) => {
    try {
      const location = await getISSLocation();
      res.json(location);
    } catch (error) {
      console.error('Error fetching ISS location:', error);
      res.status(500).json({ error: 'Failed to fetch ISS location' });
    }
  });

  app.get("/api/iss/pass", async (req: Request, res: Response) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'Valid latitude and longitude required' });
      }
      
      const passes = await getISSPassTimes(lat, lon);
      res.json(passes);
    } catch (error) {
      console.error('Error fetching ISS pass times:', error);
      res.status(500).json({ error: 'Failed to fetch ISS pass times' });
    }
  });

  // People in Space
  app.get("/api/space/people", async (req: Request, res: Response) => {
    try {
      const people = await getPeopleInSpace();
      res.json(people);
    } catch (error) {
      console.error('Error fetching people in space:', error);
      res.status(500).json({ error: 'Failed to fetch people in space' });
    }
  });

  // Space Events
  app.get("/api/space/events", async (req: Request, res: Response) => {
    try {
      const events = await getSpaceEvents();
      res.json(events);
    } catch (error) {
      console.error('Error fetching space events:', error);
      res.status(500).json({ error: 'Failed to fetch space events' });
    }
  });

  // Spacecraft
  app.get("/api/space/spacecraft", async (req: Request, res: Response) => {
    try {
      const spacecraft = await getSpacecraft();
      res.json(spacecraft);
    } catch (error) {
      console.error('Error fetching spacecraft:', error);
      res.status(500).json({ error: 'Failed to fetch spacecraft' });
    }
  });

  // Space Agencies
  app.get("/api/space/agencies", async (req: Request, res: Response) => {
    try {
      const agencies = await getSpaceAgencies();
      res.json(agencies);
    } catch (error) {
      console.error('Error fetching space agencies:', error);
      res.status(500).json({ error: 'Failed to fetch space agencies' });
    }
  });

  // Launch Pads
  app.get("/api/space/launchpads", async (req: Request, res: Response) => {
    try {
      const pads = await getLaunchPads();
      res.json(pads);
    } catch (error) {
      console.error('Error fetching launch pads:', error);
      res.status(500).json({ error: 'Failed to fetch launch pads' });
    }
  });

  // SpaceX Data
  app.get("/api/spacex/rockets", async (req: Request, res: Response) => {
    try {
      const rockets = await getSpaceXRockets();
      res.json(rockets);
    } catch (error) {
      console.error('Error fetching SpaceX rockets:', error);
      res.status(500).json({ error: 'Failed to fetch SpaceX rockets' });
    }
  });

  app.get("/api/spacex/company", async (req: Request, res: Response) => {
    try {
      const company = await getSpaceXCompanyInfo();
      res.json(company);
    } catch (error) {
      console.error('Error fetching SpaceX company info:', error);
      res.status(500).json({ error: 'Failed to fetch SpaceX company info' });
    }
  });

  app.get("/api/spacex/starlink", async (req: Request, res: Response) => {
    try {
      const starlink = await getSpaceXStarlink();
      res.json(starlink);
    } catch (error) {
      console.error('Error fetching SpaceX Starlink:', error);
      res.status(500).json({ error: 'Failed to fetch SpaceX Starlink data' });
    }
  });

  // Space News
  app.get("/api/space/news", async (req: Request, res: Response) => {
    try {
      const news = await getSpaceNews();
      res.json(news);
    } catch (error) {
      console.error('Error fetching space news:', error);
      res.status(500).json({ error: 'Failed to fetch space news' });
    }
  });

  // Solar System
  app.get("/api/space/solar-system", async (req: Request, res: Response) => {
    try {
      const bodies = await getSolarSystemBodies();
      res.json(bodies);
    } catch (error) {
      console.error('Error fetching solar system bodies:', error);
      res.status(500).json({ error: 'Failed to fetch solar system bodies' });
    }
  });

  // NASA Data
  app.get("/api/nasa/apod", async (req: Request, res: Response) => {
    try {
      const apod = await getNASAAPOD();
      res.json(apod);
    } catch (error) {
      console.error('Error fetching NASA APOD:', error);
      res.status(500).json({ error: 'Failed to fetch NASA APOD' });
    }
  });

  app.get("/api/nasa/space-weather", async (req: Request, res: Response) => {
    try {
      const weather = await getSpaceWeather();
      res.json(weather);
    } catch (error) {
      console.error('Error fetching space weather:', error);
      res.status(500).json({ error: 'Failed to fetch space weather' });
    }
  });

  app.get("/api/nasa/neo", async (req: Request, res: Response) => {
    try {
      const neo = await getNearEarthObjects();
      res.json(neo);
    } catch (error) {
      console.error('Error fetching near earth objects:', error);
      res.status(500).json({ error: 'Failed to fetch near earth objects' });
    }
  });

  // Comprehensive Space Data Endpoint
  app.get("/api/space/comprehensive", async (req: Request, res: Response) => {
    try {
      const data = await getComprehensiveSpaceData();
      res.json(data);
    } catch (error) {
      console.error('Error fetching comprehensive space data:', error);
      res.status(500).json({ error: 'Failed to fetch comprehensive space data' });
    }
  });

  // NEW API ENDPOINTS FOR ENHANCED MISSION CONTROL

  // Mars Weather Data
  app.get("/api/nasa/mars-weather", async (req: Request, res: Response) => {
    try {
      const weather = await getMarsWeather();
      res.json(weather);
    } catch (error) {
      console.error('Error fetching Mars weather:', error);
      res.status(500).json({ error: 'Failed to fetch Mars weather data' });
    }
  });

  // Moon Phase Data
  app.get("/api/astronomy/moon-phase", async (req: Request, res: Response) => {
    try {
      const moonPhase = await getMoonPhase();
      res.json(moonPhase);
    } catch (error) {
      console.error('Error fetching moon phase:', error);
      res.status(500).json({ error: 'Failed to fetch moon phase data' });
    }
  });

  // ISS Pass Predictions
  app.get("/api/satellites/iss-passes", async (req: Request, res: Response) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'Valid latitude and longitude required' });
      }
      
      const passes = await getISSPassPredictions(lat, lon);
      res.json(passes);
    } catch (error) {
      console.error('Error fetching ISS pass predictions:', error);
      res.status(500).json({ error: 'Failed to fetch ISS pass predictions' });
    }
  });

  // Satellite Tracking
  app.get("/api/satellites/tracking", async (req: Request, res: Response) => {
    try {
      const satellites = await getSatelliteTracking();
      res.json(satellites);
    } catch (error) {
      console.error('Error fetching satellite tracking:', error);
      res.status(500).json({ error: 'Failed to fetch satellite tracking data' });
    }
  });

  // Exoplanets Data
  app.get("/api/nasa/exoplanets", async (req: Request, res: Response) => {
    try {
      const exoplanets = await getExoplanets();
      res.json(exoplanets);
    } catch (error) {
      console.error('Error fetching exoplanets:', error);
      res.status(500).json({ error: 'Failed to fetch exoplanet data' });
    }
  });

  // Solar Activity Monitor
  app.get("/api/space-weather/solar-activity", async (req: Request, res: Response) => {
    try {
      const solarActivity = await getSolarActivity();
      res.json(solarActivity);
    } catch (error) {
      console.error('Error fetching solar activity:', error);
      res.status(500).json({ error: 'Failed to fetch solar activity data' });
    }
  });

  // Hubble Space Telescope Images
  app.get("/api/nasa/hubble-images", async (req: Request, res: Response) => {
    try {
      const images = await getHubbleImages();
      res.json(images);
    } catch (error) {
      console.error('Error fetching Hubble images:', error);
      res.status(500).json({ error: 'Failed to fetch Hubble images' });
    }
  });

  // Earthquake Data
  app.get("/api/earth/earthquakes", async (req: Request, res: Response) => {
    try {
      const earthquakes = await getEarthquakeData();
      res.json(earthquakes);
    } catch (error) {
      console.error('Error fetching earthquake data:', error);
      res.status(500).json({ error: 'Failed to fetch earthquake data' });
    }
  });

  // Advanced Space Weather
  app.get("/api/space-weather/advanced", async (req: Request, res: Response) => {
    try {
      const spaceWeather = await getAdvancedSpaceWeather();
      res.json(spaceWeather);
    } catch (error) {
      console.error('Error fetching advanced space weather:', error);
      res.status(500).json({ error: 'Failed to fetch advanced space weather data' });
    }
  });

  // Register search routes directly
  // Main search endpoint for articles
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      const type = req.query.type as string || 'articles';
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      // Save search query for analytics
      await saveSearch(query);
      
      let results;
      if (type === 'users') {
        results = await searchUsers(query, limit, offset);
      } else {
        results = await searchArticles(query, limit, offset);
      }
      
      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Error performing search" });
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
  
  // Test environment variables
  app.get("/api/newsletter/env-test", async (req: Request, res: Response) => {
    res.json({
      GHOST_ADMIN_API_URL: process.env.GHOST_ADMIN_API_URL,
      hasKey: !!process.env.GHOST_ADMIN_API_KEY,
      keyLength: process.env.GHOST_ADMIN_API_KEY?.length,
      keyStart: process.env.GHOST_ADMIN_API_KEY?.substring(0, 20)
    });
  });

  // Test Ghost API connection
  app.get("/api/newsletter/test", async (req: Request, res: Response) => {
    try {
      const GHOST_ADMIN_API_URL = process.env.GHOST_ADMIN_API_URL;
      const GHOST_ADMIN_API_KEY = process.env.GHOST_ADMIN_API_KEY;
      const GHOST_URL = process.env.GHOST_URL;
      const GHOST_CONTENT_API_KEY = process.env.GHOST_CONTENT_API_KEY;

      if (!GHOST_ADMIN_API_URL || !GHOST_ADMIN_API_KEY) {
        return res.status(500).json({ 
          error: "Missing Ghost API configuration",
          hasUrl: !!GHOST_ADMIN_API_URL,
          hasAdminKey: !!GHOST_ADMIN_API_KEY,
          urlValue: GHOST_ADMIN_API_URL,
          keyLength: GHOST_ADMIN_API_KEY?.length
        });
      }

      console.log('Environment variables check:', {
        GHOST_ADMIN_API_URL,
        GHOST_URL,
        hasAdminKey: !!GHOST_ADMIN_API_KEY,
        hasContentKey: !!GHOST_CONTENT_API_KEY,
        keyLength: GHOST_ADMIN_API_KEY?.length,
        keyStart: GHOST_ADMIN_API_KEY?.substring(0, 10)
      });

      // First test the Content API to see if basic connection works
      let contentApiTest = null;
      if (GHOST_URL && GHOST_CONTENT_API_KEY) {
        try {
          console.log('Testing Content API first...');
          const contentResponse = await axios.get(`${GHOST_URL}/ghost/api/v3/content/posts/?key=${GHOST_CONTENT_API_KEY}&limit=1`);
          contentApiTest = {
            success: true,
            status: contentResponse.status,
            postCount: contentResponse.data?.posts?.length || 0
          };
          console.log('Content API test successful:', contentApiTest);
        } catch (error) {
          contentApiTest = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          console.log('Content API test failed:', contentApiTest);
        }
      }

      // Now test the Admin API with different endpoints
      const possibleEndpoints = [
        'members/',
        'members',
        'posts/',
        'posts',
        'settings/',
        'settings'
      ];
      
      let workingEndpoint = null;
      let adminResponse = null;
      
      for (const endpoint of possibleEndpoints) {
        const testUrl = `${GHOST_ADMIN_API_URL}${endpoint}`;
        console.log(`Testing Admin API endpoint: ${testUrl}`);
        
        try {
          const response = await axios.get(testUrl, {
            headers: {
              'Authorization': `Ghost ${GHOST_ADMIN_API_KEY}`,
              'Content-Type': 'application/json',
              'Accept-Version': 'v5.0'
            },
            validateStatus: function (status) {
              return status < 500; // Accept all status codes less than 500
            }
          });
          
          console.log(`Endpoint ${endpoint} returned status: ${response.status}`);
          
          if (response.status === 200) {
            workingEndpoint = endpoint;
            adminResponse = response;
            break;
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} failed:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
      if (!workingEndpoint || !adminResponse) {
        throw new Error('No working Admin API endpoints found');
      }
      
      console.log(`Using working endpoint: ${workingEndpoint}`);

      console.log('Ghost API test response:', {
        status: adminResponse.status,
        statusText: adminResponse.statusText,
        headers: adminResponse.headers,
        data: typeof adminResponse.data === 'string' ? adminResponse.data.substring(0, 200) + '...' : adminResponse.data
      });

      if (adminResponse.status === 200) {
        res.json({
          success: true,
          status: adminResponse.status,
          workingEndpoint: workingEndpoint,
          memberCount: adminResponse.data?.members?.length || 0,
          contentApiTest: contentApiTest
        });
      } else {
        console.error('Ghost API test returned error status:', adminResponse.status);
        console.error('Response data:', adminResponse.data);
        res.status(500).json({
          error: 'Ghost API test failed',
          status: adminResponse.status,
          statusText: adminResponse.statusText,
          data: adminResponse.data,
          contentApiTest: contentApiTest
        });
      }
    } catch (error) {
      console.error('Ghost API test error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Ghost API error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          headers: error.config?.headers,
          data: error.response?.data
        });
        
        res.status(500).json({
          error: 'Ghost API test failed',
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          data: error.response?.data
        });
      } else {
        res.status(500).json({
          error: 'Ghost API test failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Subscribe to newsletter endpoint
  app.post("/api/newsletter/subscribe", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Valid email is required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }

      // Get Ghost configuration
      const GHOST_ADMIN_API_URL = process.env.GHOST_ADMIN_API_URL;
      const GHOST_ADMIN_API_KEY = process.env.GHOST_ADMIN_API_KEY;

      if (!GHOST_ADMIN_API_URL || !GHOST_ADMIN_API_KEY) {
        console.error('Missing Ghost API configuration for newsletter subscription');
        return res.status(500).json({ message: "Newsletter service is not configured" });
      }

      console.log('Ghost API configuration:', {
        url: GHOST_ADMIN_API_URL,
        hasAdminKey: !!GHOST_ADMIN_API_KEY,
        keyLength: GHOST_ADMIN_API_KEY?.length
      });

      // Create member in Ghost using Admin API
      const memberData = {
        members: [{
          email: email,
          status: 'subscribed'
        }]
      };

      const response = await axios.post(
        `${GHOST_ADMIN_API_URL}members/`,
        memberData,
        {
          headers: {
            'Authorization': `Ghost ${GHOST_ADMIN_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept-Version': 'v5.0'
          }
        }
      );

      console.log('Ghost API response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: typeof response.data === 'string' ? response.data.substring(0, 200) + '...' : response.data
      });

      if (response.status === 201 || response.status === 200) {
        console.log('Successfully subscribed email to newsletter:', email);
        res.status(200).json({ 
          message: "Successfully subscribed to newsletter",
          email: email
        });
      } else {
        console.error('Ghost API returned error status:', response.status);
        console.error('Response data:', response.data);
        throw new Error(`Ghost API returned status ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error('Newsletter subscription error:', error);
      
      if (axios.isAxiosError(error)) {
        // Handle specific Ghost API errors
        if (error.response?.status === 422) {
          // Member already exists
          return res.status(200).json({ 
            message: "You're already subscribed to our newsletter!",
            email: req.body.email
          });
        }
        
        if (error.response?.status === 401) {
          console.error('Ghost API authentication failed');
          return res.status(500).json({ message: "Newsletter service configuration error" });
        }
        
        console.error('Ghost API error details:', {
          status: error.response?.status,
          data: error.response?.data
        });
      }
      
      res.status(500).json({ 
        message: "Failed to subscribe to newsletter. Please try again later.",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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

  // Update current user profile endpoint
  app.put("/api/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const updates = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Get current user
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent changing sensitive fields like role unless admin
      if (updates.role && currentUser.role !== 'admin') {
        delete updates.role;
      }
      
      // Prevent changing ID, email, password through this endpoint
      delete updates.id;
      delete updates.password;
      delete updates.email;
      delete updates.stripeCustomerId;
      delete updates.stripeSubscriptionId;
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, updates);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Error updating user profile" });
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
      
      // Use bcrypt to verify password
      let isMatch = false;
      try {
        isMatch = await bcrypt.compare(password, user.password);
      } catch (compareError) {
        console.error("bcrypt.compare error:", compareError);
        return res.status(500).json({ message: "Error verifying password" });
      }
      
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      req.session.isAdmin = user.role === 'admin';
      
      // Update last login time
      await storage.updateUser(user.id, { lastLoginAt: new Date() });
      
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
  // Helper function to check if user is admin
  function isAdmin(req: Request): boolean {
    return req.session?.user?.role === 'admin';
  }

  // Get all articles
  app.get("/api/articles", async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const showDrafts = req.query.showDrafts === 'true';
      const filter = req.query.filter as string;
      
      let userId: number | undefined;
      let isAdmin = false;
      
      // Check if the request includes a user session
      if (req.session && req.session.userId) {
        userId = req.session.userId;
        
        // Check if user is admin
        const user = await storage.getUser(userId);
        isAdmin = user?.role === 'admin';
      }
      
      let articles;
      let total;
      
      // Handle category filtering
      if (filter && filter.startsWith('category-')) {
        const categorySlug = filter.replace('category-', '');
        console.log('Filtering articles by category:', categorySlug);
        
        try {
          articles = await storage.getArticlesByCategory(categorySlug, limit, (page - 1) * limit);
          total = articles.length; // For now, we'll use the length as total
        } catch (error) {
          console.error('Error filtering articles by category:', error);
          articles = [];
          total = 0;
        }
      } else {
        // Get all articles with pagination
        articles = await storage.getArticles(limit, (page - 1) * limit, showDrafts, isAdmin ? undefined : userId);
        total = articles.length; // For now, we'll use the length as total
      }
      
      // Construct response with pagination info
      const response = {
        articles,
        pagination: {
          page,
          limit,
          total,
          hasMore: total > page * limit
        }
      };
      
      // Log the response data for debugging
      console.log('Articles response:', response);
      
      res.json(response);
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
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
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
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
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
      console.log("Raw job data received:", jobData);
      
      // Set user ID as poster BEFORE validation
      jobData.userId = req.session.userId;
      
      // Clean up optional fields - convert empty strings to null/undefined
      if (jobData.salary === '') jobData.salary = undefined;
      if (jobData.applicationUrl === '') jobData.applicationUrl = undefined;
      if (jobData.expiresAt === '') jobData.expiresAt = undefined;
      
      console.log("Cleaned job data:", jobData);
      
      // Check if user is admin - auto-approve admin posts
      const user = await storage.getUser(req.session.userId);
      if (user?.role === 'admin') {
        jobData.isApproved = true;
      }
      
      // Validate job data (now with userId included)
      try {
        const validatedData = insertJobListingSchema.parse(jobData);
        console.log("Validation successful:", validatedData);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          console.error("Job listing validation error:", validationError.errors);
          console.error("Failed data:", jobData);
          return res.status(400).json({
            message: "Validation error",
            errors: validationError.errors
          });
        }
        throw validationError;
      }
      
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
      if (job.userId !== userId && user?.role !== 'admin') {
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
      if (job.userId !== userId && user?.role !== 'admin') {
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

  // Admin job listing routes
  app.get("/api/admin/job-listings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const includeUnapproved = req.query.includeUnapproved === 'true';
      const jobs = await storage.getJobListings(!includeUnapproved);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching admin job listings:", error);
      res.status(500).json({ message: "Error fetching job listings" });
    }
  });

  app.post("/api/job-listings/:id/approve", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }
      
      const approvedJob = await storage.approveJobListing(id);
      
      if (!approvedJob) {
        return res.status(404).json({ message: "Job listing not found" });
      }
      
      res.json(approvedJob);
    } catch (error) {
      console.error("Error approving job listing:", error);
      res.status(500).json({ message: "Error approving job listing" });
    }
  });

  // ----------------------------------------------------
  // Team Management API
  // ----------------------------------------------------
  
  // Get all team members (public)
  app.get("/api/team-members", async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT tm.*, u.username, u.email, u.profile_picture, u.bio as user_bio
        FROM team_members tm
        LEFT JOIN users u ON tm.user_id = u.id
        WHERE tm.is_active = true
        ORDER BY tm.is_founder DESC, tm.display_order ASC
      `);
      
      const teamMembers = result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        role: row.role,
        bio: row.bio || row.user_bio,
        profile_image_url: row.profile_image_url || row.profile_picture,
        is_founder: row.is_founder,
        display_order: row.display_order,
        expertise: row.expertise || [],
        social_linkedin: row.social_linkedin,
        social_twitter: row.social_twitter,
        social_email: row.social_email,
        user: row.user_id ? {
          id: row.user_id,
          username: row.username,
          email: row.email,
          profile_picture: row.profile_picture,
          bio: row.user_bio
        } : undefined
      }));
      
      res.json(teamMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Error fetching team members" });
    }
  });

  // Get all team members (admin)
  app.get("/api/admin/team-members", requireAdmin, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT tm.*, u.username, u.email, u.profile_picture, u.bio as user_bio
        FROM team_members tm
        LEFT JOIN users u ON tm.user_id = u.id
        ORDER BY tm.is_founder DESC, tm.display_order ASC
      `);
      
      const teamMembers = result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        role: row.role,
        bio: row.bio || row.user_bio,
        profile_image_url: row.profile_image_url || row.profile_picture,
        is_founder: row.is_founder,
        display_order: row.display_order,
        expertise: row.expertise || [],
        social_linkedin: row.social_linkedin,
        social_twitter: row.social_twitter,
        social_email: row.social_email,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: row.user_id ? {
          id: row.user_id,
          username: row.username,
          email: row.email,
          profile_picture: row.profile_picture,
          bio: row.user_bio
        } : undefined
      }));
      
      res.json(teamMembers);
    } catch (error) {
      console.error("Error fetching admin team members:", error);
      res.status(500).json({ message: "Error fetching team members" });
    }
  });

  // Get users for team member selection
  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT id, username, email, profile_picture, bio
        FROM users
        WHERE id NOT IN (SELECT user_id FROM team_members WHERE user_id IS NOT NULL)
        ORDER BY username ASC
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching users for team selection:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // Create team member
  app.post("/api/admin/team-members", requireAdmin, async (req: Request, res: Response) => {
    try {
      const {
        user_id,
        name,
        role,
        bio,
        profile_image_url,
        is_founder,
        display_order,
        expertise,
        social_linkedin,
        social_twitter,
        social_email,
        is_active
      } = req.body;

      if (!name || !role) {
        return res.status(400).json({ message: "Name and role are required" });
      }

      // Check if user_id already exists
      if (user_id) {
        const existingMember = await pool.query(
          "SELECT id FROM team_members WHERE user_id = $1",
          [user_id]
        );
        
        if (existingMember.rows.length > 0) {
          return res.status(400).json({ message: "This user is already a team member" });
        }
      }

      const result = await pool.query(`
        INSERT INTO team_members (
          user_id, name, role, bio, profile_image_url, is_founder, 
          display_order, expertise, social_linkedin, social_twitter, 
          social_email, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        user_id || null,
        name,
        role,
        bio || '',
        profile_image_url || null,
        is_founder || false,
        display_order || 0,
        expertise || [],
        social_linkedin || null,
        social_twitter || null,
        social_email || null,
        is_active !== false,
        req.session.userId
      ]);

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating team member:", error);
      res.status(500).json({ message: "Error creating team member" });
    }
  });

  // Update team member
  app.put("/api/admin/team-members/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team member ID" });
      }

      const {
        user_id,
        name,
        role,
        bio,
        profile_image_url,
        is_founder,
        display_order,
        expertise,
        social_linkedin,
        social_twitter,
        social_email,
        is_active
      } = req.body;

      if (!name || !role) {
        return res.status(400).json({ message: "Name and role are required" });
      }

      // Check if user_id already exists for another team member
      if (user_id) {
        const existingMember = await pool.query(
          "SELECT id FROM team_members WHERE user_id = $1 AND id != $2",
          [user_id, id]
        );
        
        if (existingMember.rows.length > 0) {
          return res.status(400).json({ message: "This user is already linked to another team member" });
        }
      }

      const result = await pool.query(`
        UPDATE team_members SET
          user_id = $1,
          name = $2,
          role = $3,
          bio = $4,
          profile_image_url = $5,
          is_founder = $6,
          display_order = $7,
          expertise = $8,
          social_linkedin = $9,
          social_twitter = $10,
          social_email = $11,
          is_active = $12,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $13
        RETURNING *
      `, [
        user_id || null,
        name,
        role,
        bio || '',
        profile_image_url || null,
        is_founder || false,
        display_order || 0,
        expertise || [],
        social_linkedin || null,
        social_twitter || null,
        social_email || null,
        is_active !== false,
        id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Team member not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(500).json({ message: "Error updating team member" });
    }
  });

  // Delete team member
  app.delete("/api/admin/team-members/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team member ID" });
      }

      const result = await pool.query(
        "DELETE FROM team_members WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Team member not found" });
      }

      res.json({ message: "Team member deleted successfully" });
    } catch (error) {
      console.error("Error deleting team member:", error);
      res.status(500).json({ message: "Error deleting team member" });
    }
  });

  // Reorder team member
  app.post("/api/admin/team-members/:id/reorder", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { direction } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team member ID" });
      }

      if (!['up', 'down'].includes(direction)) {
        return res.status(400).json({ message: "Direction must be 'up' or 'down'" });
      }

      // Get current member
      const currentMember = await pool.query(
        "SELECT * FROM team_members WHERE id = $1",
        [id]
      );

      if (currentMember.rows.length === 0) {
        return res.status(404).json({ message: "Team member not found" });
      }

      const currentOrder = currentMember.rows[0].display_order;
      const isFounder = currentMember.rows[0].is_founder;

      // Find the member to swap with (within the same founder/team category)
      const swapQuery = direction === 'up' 
        ? "SELECT * FROM team_members WHERE display_order < $1 AND is_founder = $2 ORDER BY display_order DESC LIMIT 1"
        : "SELECT * FROM team_members WHERE display_order > $1 AND is_founder = $2 ORDER BY display_order ASC LIMIT 1";

      const swapMember = await pool.query(swapQuery, [currentOrder, isFounder]);

      if (swapMember.rows.length === 0) {
        return res.status(400).json({ message: "Cannot move in that direction" });
      }

      const swapOrder = swapMember.rows[0].display_order;
      const swapId = swapMember.rows[0].id;

      // Perform the swap
      await pool.query("BEGIN");
      
      await pool.query(
        "UPDATE team_members SET display_order = $1 WHERE id = $2",
        [swapOrder, id]
      );
      
      await pool.query(
        "UPDATE team_members SET display_order = $1 WHERE id = $2",
        [currentOrder, swapId]
      );
      
      await pool.query("COMMIT");

      res.json({ message: "Team member reordered successfully" });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Error reordering team member:", error);
      res.status(500).json({ message: "Error reordering team member" });
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
  
  // Get only tags that are used in published articles
  app.get("/api/tags/published", async (req: Request, res: Response) => {
    try {
      // Using raw SQL to efficiently get only tags that are used in published articles
      const query = `
        SELECT DISTINCT t.id, t.name, t.slug, t.description 
        FROM tags t
        JOIN (
          SELECT DISTINCT unnest(tags)::integer as tag_id
          FROM articles
          WHERE published_at IS NOT NULL
        ) a ON t.id = a.tag_id
        ORDER BY t.name
      `;
      
      const result = await pool.query(query);
      console.log(`Found ${result.rows.length} published tags`);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching published tags:", error);
      res.status(500).json({ message: "Error fetching published tags" });
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
      
      // Generate a slug from the name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Create the tag
      const newTag = await storage.createTag({ name, slug, description });
      
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
  // Unified Taxonomy API
  // ----------------------------------------------------
  // Get all taxonomy items (optionally filtered by type)
  app.get("/api/taxonomy", async (req: Request, res: Response) => {
    try {
      const type = req.query.type as 'tag' | 'category' | undefined;
      const taxonomyItems = await storage.getTaxonomyItems(type);
      res.json(taxonomyItems);
    } catch (error) {
      console.error("Error fetching taxonomy items:", error);
      res.status(500).json({ message: "Error fetching taxonomy items" });
    }
  });
  
  // Get a single taxonomy item by ID
  app.get("/api/taxonomy/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid taxonomy item ID" });
      }
      
      const taxonomyItem = await storage.getTaxonomyItem(id);
      
      if (!taxonomyItem) {
        return res.status(404).json({ message: "Taxonomy item not found" });
      }
      
      res.json(taxonomyItem);
    } catch (error) {
      console.error("Error fetching taxonomy item:", error);
      res.status(500).json({ message: "Error fetching taxonomy item" });
    }
  });
  
  // Get taxonomy item by slug
  app.get("/api/taxonomy/slug/:slug", async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug;
      const type = req.query.type as 'tag' | 'category' | undefined;
      
      if (!slug) {
        return res.status(400).json({ message: "Slug is required" });
      }
      
      const taxonomyItem = await storage.getTaxonomyItemBySlug(slug, type);
      
      if (!taxonomyItem) {
        return res.status(404).json({ message: "Taxonomy item not found" });
      }
      
      res.json(taxonomyItem);
    } catch (error) {
      console.error("Error fetching taxonomy item by slug:", error);
      res.status(500).json({ message: "Error fetching taxonomy item" });
    }
  });
  
  // Create a new taxonomy item
  app.post("/api/taxonomy", requireAuth, async (req: Request, res: Response) => {
    try {
      const taxonomyData = req.body;
      
      // Validate data
      try {
        insertTaxonomySchema.parse(taxonomyData);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: validationError.errors
          });
        }
      }
      
      // Check required fields
      if (!taxonomyData.name) {
        return res.status(400).json({ message: "Taxonomy item name is required" });
      }
      
      if (!taxonomyData.type) {
        return res.status(400).json({ message: "Taxonomy item type is required" });
      }
      
      // Check if an item with this name already exists
      const existingItem = await storage.getTaxonomyItemByName(taxonomyData.name, taxonomyData.type);
      if (existingItem) {
        return res.status(400).json({ 
          message: `A ${taxonomyData.type} with this name already exists` 
        });
      }
      
      // Create the taxonomy item
      const newItem = await storage.createTaxonomyItem(taxonomyData);
      
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating taxonomy item:", error);
      res.status(500).json({ message: "Error creating taxonomy item" });
    }
  });
  
  // Update a taxonomy item
  app.patch("/api/taxonomy/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid taxonomy item ID" });
      }
      
      // Check if the item exists
      const taxonomyItem = await storage.getTaxonomyItem(id);
      
      if (!taxonomyItem) {
        return res.status(404).json({ message: "Taxonomy item not found" });
      }
      
      // Check if the updated name already exists (if name is changing)
      if (updates.name && updates.name !== taxonomyItem.name) {
        const existingItem = await storage.getTaxonomyItemByName(
          updates.name, 
          updates.type || taxonomyItem.type
        );
        
        if (existingItem && existingItem.id !== id) {
          return res.status(400).json({ 
            message: `A ${taxonomyItem.type} with this name already exists` 
          });
        }
      }
      
      // Update the taxonomy item
      const updatedItem = await storage.updateTaxonomyItem(id, updates);
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating taxonomy item:", error);
      res.status(500).json({ message: "Error updating taxonomy item" });
    }
  });
  
  // Delete a taxonomy item
  app.delete("/api/taxonomy/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid taxonomy item ID" });
      }
      
      // Check if the item exists
      const taxonomyItem = await storage.getTaxonomyItem(id);
      
      if (!taxonomyItem) {
        return res.status(404).json({ message: "Taxonomy item not found" });
      }
      
      // Delete the taxonomy item and all its relationships
      const success = await storage.deleteTaxonomyItem(id);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete taxonomy item" });
      }
      
      res.json({ message: "Taxonomy item deleted successfully" });
    } catch (error) {
      console.error("Error deleting taxonomy item:", error);
      res.status(500).json({ message: "Error deleting taxonomy item" });
    }
  });
  
  // ----------------------------------------------------
  // Article Taxonomy API
  // ----------------------------------------------------
  // Get all taxonomy items for an article
  app.get("/api/articles/:articleId/taxonomy", async (req: Request, res: Response) => {
    try {
      const articleId = parseInt(req.params.articleId);
      
      if (isNaN(articleId)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      const articleTaxonomy = await storage.getArticleTaxonomy(articleId);
      
      res.json(articleTaxonomy);
    } catch (error) {
      console.error("Error fetching article taxonomy:", error);
      res.status(500).json({ message: "Error fetching article taxonomy" });
    }
  });
  
  // Set/replace all taxonomy items for an article
  app.put("/api/articles/:articleId/taxonomy", requireAuth, async (req: Request, res: Response) => {
    try {
      const articleId = parseInt(req.params.articleId);
      const taxonomyIds = req.body.taxonomyIds as number[];
      
      if (isNaN(articleId)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      if (!Array.isArray(taxonomyIds)) {
        return res.status(400).json({ message: "taxonomyIds must be an array of numbers" });
      }
      
      // Check if the article exists
      const article = await storage.getArticle(articleId);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if user has permission to update this article
      const userId = req.session?.userId;
      const user = userId ? await storage.getUser(userId) : null;
      
      // Check if user has permission to edit the article
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const isAdmin = user.role === 'admin' || user.role === 'editor';
      const isAuthor = article.primaryAuthorId === userId;
      
      if (!isAdmin && !isAuthor) {
        return res.status(403).json({ message: "You don't have permission to update this article's taxonomy" });
      }
      
      // Set the taxonomy items
      await storage.setArticleTaxonomy(articleId, taxonomyIds);
      
      // Get the updated list
      const updatedTaxonomy = await storage.getArticleTaxonomy(articleId);
      
      res.json(updatedTaxonomy);
    } catch (error) {
      console.error("Error updating article taxonomy:", error);
      res.status(500).json({ message: "Error updating article taxonomy" });
    }
  });
  
  // Add a taxonomy item to an article
  app.post("/api/articles/:articleId/taxonomy", requireAuth, async (req: Request, res: Response) => {
    try {
      const articleId = parseInt(req.params.articleId);
      const { taxonomyId, isPrimary } = req.body;
      
      if (isNaN(articleId)) {
        return res.status(400).json({ message: "Invalid article ID" });
      }
      
      if (!taxonomyId || isNaN(parseInt(taxonomyId))) {
        return res.status(400).json({ message: "Valid taxonomy ID is required" });
      }
      
      // Check if the article exists
      const article = await storage.getArticle(articleId);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if user has permission to update this article
      const userId = req.session?.userId;
      const user = userId ? await storage.getUser(userId) : null;
      
      // Check if user has permission to edit the article
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const isAdmin = user.role === 'admin' || user.role === 'editor';
      const isAuthor = article.primaryAuthorId === userId;
      
      if (!isAdmin && !isAuthor) {
        return res.status(403).json({ message: "You don't have permission to update this article's taxonomy" });
      }
      
      // Add the taxonomy item
      const result = await storage.addArticleTaxonomy(articleId, parseInt(taxonomyId), isPrimary);
      
      if (!result) {
        return res.status(500).json({ message: "Failed to add taxonomy to article" });
      }
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Error adding taxonomy to article:", error);
      res.status(500).json({ message: "Error adding taxonomy to article" });
    }
  });
  
  // Remove a taxonomy item from an article
  app.delete("/api/articles/:articleId/taxonomy/:taxonomyId", requireAuth, async (req: Request, res: Response) => {
    try {
      const articleId = parseInt(req.params.articleId);
      const taxonomyId = parseInt(req.params.taxonomyId);
      
      if (isNaN(articleId) || isNaN(taxonomyId)) {
        return res.status(400).json({ message: "Invalid article or taxonomy ID" });
      }
      
      // Check if the article exists
      const article = await storage.getArticle(articleId);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if user has permission to update this article
      const userId = req.session?.userId;
      const user = userId ? await storage.getUser(userId) : null;
      
      // Check if user has permission to edit the article
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const isAdmin = user.role === 'admin' || user.role === 'editor';
      const isAuthor = article.primaryAuthorId === userId;
      
      if (!isAdmin && !isAuthor) {
        return res.status(403).json({ message: "You don't have permission to update this article's taxonomy" });
      }
      
      // Remove the taxonomy item
      const success = await storage.removeArticleTaxonomy(articleId, taxonomyId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to remove taxonomy from article" });
      }
      
      res.json({ message: "Taxonomy item removed from article successfully" });
    } catch (error) {
      console.error("Error removing taxonomy from article:", error);
      res.status(500).json({ message: "Error removing taxonomy from article" });
    }
  });
  
  // Set a taxonomy item as primary for an article
  app.post("/api/articles/:articleId/taxonomy/:taxonomyId/primary", requireAuth, async (req: Request, res: Response) => {
    try {
      const articleId = parseInt(req.params.articleId);
      const taxonomyId = parseInt(req.params.taxonomyId);
      
      if (isNaN(articleId) || isNaN(taxonomyId)) {
        return res.status(400).json({ message: "Invalid article or taxonomy ID" });
      }
      
      // Check if the article exists
      const article = await storage.getArticle(articleId);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if user has permission to update this article
      const userId = req.session?.userId;
      const user = userId ? await storage.getUser(userId) : null;
      
      // Check if user has permission to edit the article
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const isAdmin = user.role === 'admin' || user.role === 'editor';
      const isAuthor = article.primaryAuthorId === userId;
      
      if (!isAdmin && !isAuthor) {
        return res.status(403).json({ message: "You don't have permission to update this article's taxonomy" });
      }
      
      // Set as primary
      const success = await storage.setPrimaryTaxonomy(articleId, taxonomyId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to set primary taxonomy" });
      }
      
      res.json({ message: "Primary taxonomy set successfully" });
    } catch (error) {
      console.error("Error setting primary taxonomy:", error);
      res.status(500).json({ message: "Error setting primary taxonomy" });
    }
  });

  // ----------------------------------------------------
  // Sitemap API
  // ----------------------------------------------------
  // Enhanced XML Sitemap for SEO and Google Ads compliance
  app.get("/sitemap.xml", async (req: Request, res: Response) => {
    try {
      const baseUrl = process.env.SITE_URL || `https://${req.get('host') || 'proximareport.com'}`;
      const currentDate = new Date().toISOString();
      
      let articles = [];
      let categories = [];
      let tags = [];
      let jobListings = [];
      
      try {
        // Get all published articles
        articles = await storage.getArticles(1000, 0, false);
        
        // Get all categories and tags
        categories = await storage.getCategories();
        tags = await storage.getTags();
        
        // Get job listings
        jobListings = await storage.getJobListings(true);
      } catch (dbError) {
        console.error("Database error in sitemap generation, using fallback:", dbError);
        // Use empty arrays for fallback - sitemap will still include static pages
        articles = [];
        categories = [];
        tags = [];
        jobListings = [];
      }
      
      // Build enhanced XML sitemap with proper namespaces
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Important Static Pages -->
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>quarterly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>quarterly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/cookies</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>quarterly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Content Pages -->
  <url>
    <loc>${baseUrl}/launches</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/astronomy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/missioncontrol</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/jobs</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/gallery</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- User Pages -->
  <url>
    <loc>${baseUrl}/subscribe</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/advertise</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/login</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/register</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <!-- Utility Pages -->
  <url>
    <loc>${baseUrl}/sitemap</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  
  <!-- RSS and JSON Feeds -->
  <url>
    <loc>${baseUrl}/rss.xml</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/feed.json</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Articles with enhanced metadata -->`;
      
      // Add articles to sitemap with image and news metadata
      articles.forEach(article => {
        const lastmod = article.updatedAt || article.publishedAt || article.createdAt;
        const publishDate = article.publishedAt || article.createdAt;
        
        sitemap += `
  <url>
    <loc>${baseUrl}/article/${article.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>`;
        
        // Add news metadata for recent articles (last 2 days)
        const articleDate = new Date(publishDate);
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        
        if (articleDate > twoDaysAgo) {
          sitemap += `
    <news:news>
      <news:publication>
        <news:name>Proxima Report</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(publishDate).toISOString()}</news:publication_date>
      <news:title><![CDATA[${article.title}]]></news:title>
    </news:news>`;
        }
        
        // Add image metadata if article has featured image
        if (article.featuredImage) {
          sitemap += `
    <image:image>
      <image:loc>${article.featuredImage}</image:loc>
      <image:title><![CDATA[${article.title}]]></image:title>
      <image:caption><![CDATA[${article.excerpt || article.title}]]></image:caption>
    </image:image>`;
        }
        
        sitemap += `
  </url>`;
      });
      
      // Add categories with enhanced metadata
      categories.forEach(category => {
        sitemap += `
  <url>
    <loc>${baseUrl}/category/${category.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
      });
      
      // Add tags with enhanced metadata
      tags.forEach(tag => {
        sitemap += `
  <url>
    <loc>${baseUrl}/tag/${tag.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
      });
      
      // Add job listings if available
      jobListings.forEach(job => {
        if (job.isActive) {
          sitemap += `
  <url>
    <loc>${baseUrl}/jobs/${job.id}</loc>
    <lastmod>${new Date(job.updatedAt || job.createdAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        }
      });
      
      sitemap += `
</urlset>`;
      
      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).json({ message: "Error generating sitemap" });
    }
  });

  // Sitemap data endpoint for the React component
  app.get("/api/sitemap-data", async (req: Request, res: Response) => {
    try {
      let articles = [];
      let categories = [];
      let tags = [];
      let jobListings = [];
      
      try {
        // Try to get data from database
        articles = await storage.getArticles(1000, 0, false);
        categories = await storage.getCategories();
        tags = await storage.getTags();
        jobListings = await storage.getJobListings(true);
      } catch (dbError) {
        console.error("Database error, using fallback data:", dbError);
        // Provide fallback static data when database is unavailable
        articles = [];
        categories = [
          { id: 1, name: 'Space Exploration', slug: 'space-exploration' },
          { id: 2, name: 'Rocket Technology', slug: 'rocket-technology' },
          { id: 3, name: 'Astronomy', slug: 'astronomy' },
          { id: 4, name: 'Mars Missions', slug: 'mars-missions' },
          { id: 5, name: 'International Space Station', slug: 'iss' }
        ];
        tags = [
          { id: 1, name: 'SpaceX', slug: 'spacex' },
          { id: 2, name: 'NASA', slug: 'nasa' },
          { id: 3, name: 'Mars', slug: 'mars' },
          { id: 4, name: 'Moon', slug: 'moon' },
          { id: 5, name: 'Satellites', slug: 'satellites' }
        ];
        jobListings = [];
      }
      
      // Process articles for sitemap display
      const processedArticles = articles.map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        publishedAt: article.publishedAt || article.createdAt,
        category: article.category || 'Uncategorized'
      }));
      
      // Process categories with article counts
      const processedCategories = categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        count: articles.filter(article => article.category === category.name).length
      }));
      
      // Process tags with article counts
      const processedTags = tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        count: articles.filter(article => 
          article.tags && article.tags.includes(tag.name)
        ).length
      }));
      
      // Process job listings
      const processedJobs = jobListings.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        createdAt: job.createdAt
      }));
      
      const stats = {
        totalArticles: articles.length,
        totalCategories: categories.length,
        totalTags: tags.length,
        totalJobs: jobListings.length,
        lastUpdated: new Date().toISOString()
      };
      
      res.json({
        articles: processedArticles,
        categories: processedCategories,
        tags: processedTags,
        jobListings: processedJobs,
        stats
      });
    } catch (error) {
      console.error("Error fetching sitemap data:", error);
      res.status(500).json({ message: "Error fetching sitemap data" });
    }
  });

  // Robots.txt
  app.get("/robots.txt", (req: Request, res: Response) => {
    const baseUrl = process.env.SITE_URL || `https://${req.get('host') || 'proximareport.com'}`;
    const robots = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# RSS and JSON Feeds
# RSS Feed: ${baseUrl}/rss.xml
# JSON Feed: ${baseUrl}/feed.json

# Google Ads authentication
# ads.txt location: ${baseUrl}/ads.txt

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /register
Disallow: /edit-profile
Disallow: /newsletter/verify
Disallow: /newsletter/unsubscribe
Disallow: /advertiser-dashboard

# Allow important public pages
Allow: /
Allow: /article/
Allow: /category/
Allow: /tag/
Allow: /launches
Allow: /astronomy
Allow: /missioncontrol
Allow: /jobs
Allow: /gallery
Allow: /subscribe
Allow: /advertise
Allow: /sitemap
Allow: /about
Allow: /contact
Allow: /privacy
Allow: /terms
Allow: /cookies
Allow: /ads.txt
Allow: /rss.xml
Allow: /feed.json

# Crawl-delay for politeness
Crawl-delay: 1`;
    
    res.set('Content-Type', 'text/plain');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(robots);
  });

  // Ads.txt for Google Ads and other advertising networks
  app.get("/ads.txt", (req: Request, res: Response) => {
    const adsTxt = `# ads.txt file for Proxima Report
# This file is used to authenticate authorized digital advertising sellers
# Format: domain.com, publisher_id, relationship_type, certification_authority_id

# Google AdSense
google.com, pub-XXXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0

# Google Ad Manager (if using)
# google.com, pub-XXXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0

# Other advertising networks can be added here
# Example:
# openx.com, 123456789, RESELLER, 6ac7d628ccd632a7
# rubiconproject.com, 12345, RESELLER, 0bfd66d529a55807

# Contact information
# Contact: ads@proximareport.com

# This file should be updated when:
# 1. Adding new advertising partners
# 2. Changing publisher IDs
# 3. Modifying relationships with ad networks

# Last updated: ${new Date().toISOString().split('T')[0]}`;
    
    res.set('Content-Type', 'text/plain');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(adsTxt);
  });

  // RSS Feed for articles
  app.get("/rss.xml", async (req: Request, res: Response) => {
    try {
      const baseUrl = process.env.SITE_URL || `https://${req.get('host') || 'proximareport.com'}`;
      const currentDate = new Date().toISOString();
      
      let articles = [];
      
      try {
        // Get latest 50 published articles for RSS feed
        articles = await storage.getArticles(50, 0, false);
      } catch (dbError) {
        console.error("Database error in RSS generation:", dbError);
        // Use empty array for fallback
        articles = [];
      }
      
      // Escape XML special characters
      const escapeXml = (str: string) => {
        if (!str) return '';
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      };

      // Strip HTML tags for plain text content
      const stripHtml = (html: string) => {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').trim();
      };

      // Generate RSS 2.0 feed
      let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Proxima Report</title>
    <link>${baseUrl}</link>
    <description>Your premier destination for space exploration and scientific discovery. Get the latest news on space missions, astronomy, and technological breakthroughs.</description>
    <language>en-US</language>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <pubDate>${currentDate}</pubDate>
    <ttl>60</ttl>
    <generator>Proxima Report CMS</generator>
    <managingEditor>editorial@proximareport.com (Proxima Report Editorial Team)</managingEditor>
    <webMaster>tech@proximareport.com (Proxima Report Technical Team)</webMaster>
    <copyright>© ${new Date().getFullYear()} Proxima Report. All rights reserved.</copyright>
    <category>Science/Technology</category>
    <category>Space Exploration</category>
    <category>Astronomy</category>
    
    <!-- RSS feed discovery -->
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    
    <!-- Channel image -->
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>Proxima Report</title>
      <link>${baseUrl}</link>
      <description>Proxima Report Logo</description>
      <width>144</width>
      <height>144</height>
    </image>`;

      // Add articles to RSS feed
      articles.forEach(article => {
        const pubDate = new Date(article.publishedAt || article.createdAt).toUTCString();
        const link = `${baseUrl}/article/${article.slug}`;
        
        // Create article excerpt/description
        let description = '';
        if (article.excerpt) {
          description = stripHtml(article.excerpt);
        } else if (article.summary) {
          description = stripHtml(article.summary);
        } else if (article.content) {
          // Extract first 200 characters from content
          const contentText = stripHtml(article.content.toString());
          description = contentText.substring(0, 200) + (contentText.length > 200 ? '...' : '');
        }

        rss += `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${link}</link>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${link}</guid>
      <dc:creator>${escapeXml(article.primaryAuthor || 'Proxima Report')}</dc:creator>
      <category>${escapeXml(article.category || 'Space News')}</category>`;
      
      // Add content:encoded for full article content (if available)
      if (article.content) {
        rss += `
      <content:encoded><![CDATA[${article.content.toString()}]]></content:encoded>`;
      }
      
      // Add featured image if available
      if (article.featuredImage) {
        rss += `
      <media:content url="${article.featuredImage}" type="image/jpeg">
        <media:description>${escapeXml(article.title)}</media:description>
      </media:content>
      <enclosure url="${article.featuredImage}" type="image/jpeg" length="0"/>`;
      }
      
      // Add tags if available
      if (article.tags && Array.isArray(article.tags)) {
        article.tags.forEach(tag => {
          rss += `
      <category>${escapeXml(tag.name || tag)}</category>`;
        });
      }
      
      rss += `
    </item>`;
      });
      
      rss += `
  </channel>
</rss>`;
      
      res.set('Content-Type', 'application/rss+xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(rss);
    } catch (error) {
      console.error("Error generating RSS feed:", error);
      res.status(500).json({ message: "Error generating RSS feed" });
    }
  });

  // JSON Feed (modern alternative to RSS)
  app.get("/feed.json", async (req: Request, res: Response) => {
    try {
      const baseUrl = process.env.SITE_URL || `https://${req.get('host') || 'proximareport.com'}`;
      
      let articles = [];
      
      try {
        // Get latest 50 published articles for JSON feed
        articles = await storage.getArticles(50, 0, false);
      } catch (dbError) {
        console.error("Database error in JSON feed generation:", dbError);
        articles = [];
      }

      // Strip HTML tags for plain text content
      const stripHtml = (html: string) => {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').trim();
      };

      const jsonFeed = {
        version: "https://jsonfeed.org/version/1.1",
        title: "Proxima Report",
        home_page_url: baseUrl,
        feed_url: `${baseUrl}/feed.json`,
        description: "Your premier destination for space exploration and scientific discovery. Get the latest news on space missions, astronomy, and technological breakthroughs.",
        icon: `${baseUrl}/favicon.ico`,
        favicon: `${baseUrl}/favicon.ico`,
        language: "en-US",
        authors: [
          {
            name: "Proxima Report Editorial Team",
            url: `${baseUrl}/about`
          }
        ],
        items: articles.map(article => {
          let description = '';
          if (article.excerpt) {
            description = stripHtml(article.excerpt);
          } else if (article.summary) {
            description = stripHtml(article.summary);
          } else if (article.content) {
            const contentText = stripHtml(article.content.toString());
            description = contentText.substring(0, 200) + (contentText.length > 200 ? '...' : '');
          }

          const item = {
            id: `${baseUrl}/article/${article.slug}`,
            url: `${baseUrl}/article/${article.slug}`,
            title: article.title,
            content_html: article.content ? article.content.toString() : description,
            content_text: description,
            summary: description,
            date_published: new Date(article.publishedAt || article.createdAt).toISOString(),
            date_modified: new Date(article.updatedAt || article.publishedAt || article.createdAt).toISOString(),
            authors: [
              {
                name: article.primaryAuthor || 'Proxima Report'
              }
            ],
            tags: []
          };

          // Add featured image
          if (article.featuredImage) {
            item.image = article.featuredImage;
          }

          // Add tags
          if (article.tags && Array.isArray(article.tags)) {
            item.tags = article.tags.map(tag => tag.name || tag);
          }

          // Add category as tag
          if (article.category) {
            item.tags.push(article.category);
          }

          return item;
        })
      };
      
      res.set('Content-Type', 'application/feed+json; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.json(jsonFeed);
    } catch (error) {
      console.error("Error generating JSON feed:", error);
      res.status(500).json({ message: "Error generating JSON feed" });
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
      // Make sure to return all advertisements regardless of their status
      // Here we need to be extra sure we're bypassing all filters to show the ads in the admin view
      const rawAds = await storage.getAdvertisements(page, limit, true, undefined, true); // Get with user details and include all ads
      
      // Add console logging for debugging
      console.log(`Admin advertisements API: Raw ads count: ${rawAds.length}`);
      
      // Make sure advertisements have the isTest flag set correctly
      const ads = rawAds.map(ad => ({
        ...ad,
        // Make sure test advertisements have the isTest flag properly set
        isTest: ad.isTest === true || (ad.adminNotes && ad.adminNotes.includes('test')),
      }));
      
      // More detailed logging about the ads being returned
      if (ads.length > 0) {
        console.log(`Admin advertisements API: Found ${ads.length} advertisements to display`);
        console.log(`Ad Types: Test ads: ${ads.filter(ad => ad.isTest).length}, Regular ads: ${ads.filter(ad => !ad.isTest).length}`);
        console.log(`Ad Statuses: Approved: ${ads.filter(ad => ad.isApproved).length}, Pending: ${ads.filter(ad => !ad.isApproved).length}`);
      } else {
        console.log('Admin advertisements API: No advertisements found in the database');
      }
      
      res.json(ads);
    } catch (error) {
      console.error("Error fetching admin advertisements:", error);
      res.status(500).json({ message: "Error fetching advertisements for admin panel" });
    }
  });
  
  // This endpoint has been removed to eliminate duplication.
  // The implementation at line ~1968 is now the canonical endpoint for creating test advertisements.

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
      // For development, we'll include all ads including test ads
      let ads = await storage.getAdvertisements(
        1, // page
        50, // limit - get enough ads for rotation
        false, // don't include user data here
        placement, // placement 
        true // temporarily include all ads for development
      );
      
      // If no ads are found for specific article placements, try fetching generic "article" ads
      if (ads.length === 0 && (
          placement.startsWith('article_') || 
          placement === 'article_middle' || 
          placement === 'article_sidebar' || 
          placement === 'article_footer'
      )) {
        console.log(`No specific ads found for ${placement}, checking for generic 'article' placement ads`);
        
        // Try to get ads with the generic "article" placement
        ads = await storage.getAdvertisements(1, 50, false, 'article', true);
        
        if (ads.length > 0) {
          console.log(`Found ${ads.length} generic 'article' ads that can be used in ${placement}`);
          ads.forEach(ad => {
            console.log(`Using generic article ad ID ${ad.id}: "${ad.title}" for ${placement}`);
          });
        }
      }
      
      // If no ads are found, log additional information to help diagnose why
      if (ads.length === 0) {
        console.log("Found 0 advertisements (including test ads)");
        
        // Check if there are any ads at all regardless of placement
        const allAds = await storage.getAdvertisements(1, 100, false, undefined, true);
        console.log(`Found ${allAds.length} total ads in the system`);
        
        if (allAds.length > 0) {
          console.log("Available ads (any placement):", 
            allAds.map(ad => `ID ${ad.id}: "${ad.title}" - placement=${ad.placement}, isApproved=${ad.isApproved}, isTest=${ad.isTest}`)
          );
        }
      } else {
        console.log(`Found ${ads.length} ads for placement ${placement}`);
        ads.forEach(ad => {
          console.log(`Serving ad ID ${ad.id}: "${ad.title}" - isApproved=${ad.isApproved}, isTest=${ad.isTest}`);
        });
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
      
      // Debug: Log the data being submitted
      console.log('Test advertisement submission data:', adData);
      
      // Make sure we handle date fields correctly
      try {
        // This should now handle both Date objects and string dates because of our schema extension
        const validatedData = insertAdvertisementSchema.parse(adData);
        
        // After validation, ensure we have proper Date objects
        // The parse step should have already transformed string dates to Date objects
        
        console.log('Validated advertisement data:', validatedData);
        
        // Continue with the validated data
        adData.startDate = validatedData.startDate;
        adData.endDate = validatedData.endDate;
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          console.error('Test advertisement validation error details:', validationError.errors);
          return res.status(400).json({
            message: "Validation error",
            errors: validationError.errors
          });
        }
      }
      
      // Set user ID as owner
      adData.userId = req.session.userId;
      
      // Set test ad properties
      adData.isTest = true;  // Explicitly mark as test advertisement
      adData.isApproved = true;
      adData.paymentStatus = 'paid';
      adData.status = 'approved';
      
      // Add this note to make it clear this is a test ad
      adData.adminNotes = adData.adminNotes || 'Test advertisement created by admin for internal testing';
      
      // Convert string dates to Date objects
      if (adData.startDate && typeof adData.startDate === 'string') {
        adData.startDate = new Date(adData.startDate);
      }
      
      if (adData.endDate && typeof adData.endDate === 'string') {
        adData.endDate = new Date(adData.endDate);
      }
      
      // Create the advertisement
      const newAd = await storage.createAdvertisement(adData);
      
      // Enhanced logging for debugging
      console.log('Created test advertisement:', {
        id: newAd.id,
        title: newAd.title,
        isApproved: newAd.isApproved,
        status: newAd.status,
        isTest: newAd.isTest,
        adminNotes: newAd.adminNotes
      });
      
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
        const validatedData = insertAdvertisementSchema.parse(adData);
        
        // Ensure we have proper Date objects after validation
        adData.startDate = validatedData.startDate;
        adData.endDate = validatedData.endDate;
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          console.error('Advertisement validation error details:', validationError.errors);
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

  // Approve advertisement
  app.post("/api/advertisements/:id/approve", requireAdmin, async (req: Request, res: Response) => {
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
      
      // Approve the advertisement
      const approvedAd = await storage.approveAdvertisement(id);
      
      if (!approvedAd) {
        return res.status(500).json({ message: "Failed to approve advertisement" });
      }
      
      res.json({ 
        message: "Advertisement approved successfully",
        advertisement: approvedAd
      });
    } catch (error) {
      console.error("Error approving advertisement:", error);
      res.status(500).json({ message: "Error approving advertisement" });
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

  // Gift membership endpoint
  app.post("/api/gift-membership", requireAuth, async (req: Request, res: Response) => {
    try {
      const { 
        recipientEmail, 
        recipientName, 
        giftMessage, 
        senderName, 
        tier, 
        duration = 'monthly' 
      } = req.body;
      
      // Validate required fields
      if (!recipientEmail || !recipientName || !tier) {
        return res.status(400).json({ 
          message: "Recipient email, name, and tier are required" 
        });
      }
      
      // Validate tier
      if (!['supporter', 'pro'].includes(tier)) {
        return res.status(400).json({ 
          message: "Invalid tier. Must be 'supporter' or 'pro'" 
        });
      }
      
      // Get the gifter's information
      const gifterId = req.session.userId;
      const gifter = await storage.getUser(gifterId);
      
      if (!gifter) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Determine price ID based on tier and duration
      let priceId = '';
      if (tier === 'supporter') {
        priceId = duration === 'yearly' ? 'price_supporter_yearly' : SUBSCRIPTION_PRICES.supporter;
      } else if (tier === 'pro') {
        priceId = duration === 'yearly' ? 'price_pro_yearly' : SUBSCRIPTION_PRICES.pro;
      }
      
      // Create or get Stripe customer for the gifter
      let customerId = gifter.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: gifter.email,
          name: gifter.username,
          metadata: {
            userId: gifter.id.toString(),
          },
        });
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.updateUser(gifter.id, { stripeCustomerId: customerId });
      }
      
      // Create checkout session for gift
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment', // One-time payment for gift
        success_url: `${process.env.APP_URL || 'http://localhost:5000'}/gift/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:5000'}/pricing`,
        metadata: {
          gifterId: gifter.id.toString(),
          recipientEmail,
          recipientName,
          giftMessage: giftMessage || '',
          senderName: senderName || gifter.username,
          tier,
          duration,
          isGift: 'true'
        },
      });
      
      res.json({ checkoutUrl: session.url });
    } catch (error) {
      console.error("Error creating gift membership:", error);
      res.status(500).json({ message: "Error creating gift membership" });
    }
  });

  // Redeem gift membership endpoint
  app.post("/api/gift/redeem", async (req: Request, res: Response) => {
    try {
      const { giftCode } = req.body;
      
      if (!giftCode) {
        return res.status(400).json({ message: "Gift code is required" });
      }
      
      // Here you would validate the gift code and apply the membership
      // For now, this is a placeholder implementation
      
      res.json({ 
        success: true, 
        message: "Gift membership redeemed successfully!",
        tier: "supporter", // This would come from the gift code
        duration: "monthly"
      });
    } catch (error) {
      console.error("Error redeeming gift:", error);
      res.status(500).json({ message: "Error redeeming gift membership" });
    }
  });

  // Gallery API - Enhanced
  app.get('/api/gallery', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const tag = req.query.tag as string;

      console.log('Gallery API request:', { page, limit, tag });
      
      const result = await getGalleryImages(page, limit, tag);
      console.log('Gallery API response:', {
        itemCount: result.items.length,
        meta: result.meta
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
      res.status(500).json({ 
        error: 'Failed to fetch gallery images',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Gallery Tags API
  app.get('/api/gallery/tags', async (req, res) => {
    try {
      const tags = await getAvailableTags();
      res.json(tags);
    } catch (error) {
      console.error('Error fetching gallery tags:', error);
      res.status(500).json({ 
        error: 'Failed to fetch gallery tags',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Legacy gallery endpoint for backward compatibility
  app.get('/api/gallery/featured', async (req, res) => {
    try {
      const images = await getFeaturedImages();
      res.json(images);
    } catch (error) {
      console.error('Error fetching featured images:', error);
      res.status(500).json({ error: 'Failed to fetch featured images' });
    }
  });

  // Ghost API routes
  app.get("/api/ghost/posts", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filter = req.query.filter as string | undefined;

      console.log('Ghost API request:', { page, limit, filter });
      
      const result = await getPosts(page, limit, filter);
      console.log('Ghost API response:', {
        postCount: result.posts.length,
        firstPost: result.posts[0]?.title,
        meta: result.meta
      });
      
      res.json(result);
    } catch (error) {
      console.error('Ghost API error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch posts',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/ghost/posts/slug/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      if (!slug) {
        return res.status(400).json({ message: "Post slug is required" });
      }
      
      console.log('Fetching post by slug:', slug);
      const post = await getPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching post by slug:", error);
      if (error instanceof Error) {
        res.status(500).json({ 
          message: "Error fetching post",
          details: error.message
        });
      } else {
        res.status(500).json({ message: "Error fetching post" });
      }
    }
  });

  // Initialize theme service
  const themeService = new ThemeService();

  // Theme API routes
  app.get("/api/themes", async (req: Request, res: Response) => {
    try {
      console.log('Fetching themes from theme service...');
      const themes = await themeService.getActiveThemes();
      console.log('Themes returned from service:', {
        count: themes.length,
        themes: themes.map(t => ({ id: t.id, name: t.name, display_name: t.display_name }))
      });
      res.json(themes);
    } catch (error) {
      console.error("Error fetching themes:", error);
      res.status(500).json({ 
        error: 'Failed to fetch themes',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Test endpoint to verify theme service
  app.get("/api/themes/test", async (req: Request, res: Response) => {
    try {
      console.log('Testing theme service...');
      const themes = await themeService.getActiveThemes();
      console.log('Test - Themes returned:', themes.length);
      res.json({ 
        success: true, 
        themeCount: themes.length,
        themes: themes.map(t => ({ id: t.id, name: t.name, display_name: t.display_name }))
      });
    } catch (error) {
      console.error("Test - Error in theme service:", error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/themes/current", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const theme = await themeService.getUserTheme(userId);
      res.json(theme);
    } catch (error) {
      console.error("Error fetching current theme:", error);
      res.status(500).json({ 
        error: 'Failed to fetch current theme',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/themes/set", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { themeName } = req.body;

      if (!themeName || !themeService.isValidThemeName(themeName)) {
        return res.status(400).json({ message: "Invalid theme name" });
      }

      const success = await themeService.setUserTheme(userId, themeName);
      
      if (success) {
        res.json({ message: "Theme updated successfully", themeName });
      } else {
        res.status(400).json({ message: "Failed to update theme" });
      }
    } catch (error) {
      console.error("Error setting theme:", error);
      res.status(500).json({ 
        error: 'Failed to set theme',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/themes/reset", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const success = await themeService.resetUserTheme(userId);
      
      if (success) {
        res.json({ message: "Theme reset to default successfully" });
      } else {
        res.status(400).json({ message: "Failed to reset theme" });
      }
    } catch (error) {
      console.error("Error resetting theme:", error);
      res.status(500).json({ 
        error: 'Failed to reset theme',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Temporary admin endpoint to run role migration
  app.post("/api/admin/migrate-roles", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      // Only allow user "sam" to run this migration
      if (!user || user.username !== 'sam') {
        return res.status(403).json({ message: "Access denied" });
      }

      console.log('Running role-based features migration...');
      
      // Update specific users to admin role
      await db.execute(sql`UPDATE users SET role = 'admin' WHERE username IN ('sam', 'admin', 'tyler', 'jack')`);
      console.log('✅ Updated admin users');

      // Add new columns if they don't exist
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive'`);
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE`);
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT false`);
      console.log('✅ Added subscription columns');

      // Set admin users to pro tier
      await db.execute(sql`UPDATE users SET membership_tier = 'pro' WHERE role = 'admin'`);
      console.log('✅ Updated admin membership tiers');

      console.log('🎉 Role migration completed successfully!');
      res.json({ success: true, message: "Migration completed successfully!" });
    } catch (error) {
      console.error('❌ Migration failed:', error);
      res.status(500).json({ success: false, message: "Migration failed", error: error.message });
    }
  });

  // Site Block API Routes
  app.get("/api/site-block", async (req: Request, res: Response) => {
    try {
      const [siteBlock] = await db.select().from(siteBlocks).limit(1);
      
      if (!siteBlock) {
        // Create default site block if none exists
        const defaultSiteBlock = {
          isEnabled: false,
          title: "Site Temporarily Unavailable",
          subtitle: "We are currently performing maintenance or updates.",
          message: "Our team is working to bring the site back online as quickly as possible. Thank you for your patience.",
          primaryColor: "#4f46e5",
          secondaryColor: "#0f172a",
          showLoginForm: true,
          loginFormTitle: "Admin Access",
          loginFormSubtitle: "Enter your credentials to access the site"
        };
        
        const [newSiteBlock] = await db.insert(siteBlocks).values(defaultSiteBlock).returning();
        res.json(newSiteBlock);
      } else {
        res.json(siteBlock);
      }
    } catch (error) {
      console.error("Error fetching site block:", error);
      res.status(500).json({ error: "Failed to fetch site block settings" });
    }
  });

  app.put("/api/site-block", requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const updateData = updateSiteBlockSchema.parse(req.body);
      
      const [siteBlock] = await db.select().from(siteBlocks).limit(1);
      
      if (siteBlock) {
        const [updatedSiteBlock] = await db
          .update(siteBlocks)
          .set({ ...updateData, updatedBy: userId, updatedAt: new Date() })
          .where(eq(siteBlocks.id, siteBlock.id))
          .returning();
        
        res.json(updatedSiteBlock);
      } else {
        // Create new site block if none exists
        const [newSiteBlock] = await db
          .insert(siteBlocks)
          .values({ ...updateData, createdBy: userId, updatedBy: userId })
          .returning();
        
        res.json(newSiteBlock);
      }
    } catch (error) {
      console.error("Error updating site block:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update site block settings" });
      }
    }
  });

  app.get("/api/site-block/preview", async (req: Request, res: Response) => {
    try {
      const [siteBlock] = await db.select().from(siteBlocks).limit(1);
      
      if (!siteBlock) {
        return res.status(404).json({ error: "Site block not found" });
      }

      // Return the site block data for preview
      res.json(siteBlock);
    } catch (error) {
      console.error("Error fetching site block preview:", error);
      res.status(500).json({ error: "Failed to fetch site block preview" });
    }
  });

  // Create HTTP server
  // This server will be returned to index.ts to serve the app
  const httpServer = createServer(app);

  return httpServer;
}