import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
// We now register newsletter routes directly in routes.ts
import { setupVite, serveStatic, log } from "./vite";
import session from 'express-session';
import cors from 'cors';

// Validate required environment variables
const requiredEnvVars = {
  GHOST_URL: process.env.GHOST_URL,
  GHOST_CONTENT_API_KEY: process.env.GHOST_CONTENT_API_KEY
};

console.log('Environment Variables:', {
  ...requiredEnvVars,
  NODE_ENV: process.env.NODE_ENV
});

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  console.error('Server will start but some features may not work properly');
  // Don't exit - let the server start and handle missing vars gracefully
}

const app = express();

// Session configuration with enhanced security
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  name: 'proxima.sid', // Custom session name for security
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Always secure in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    sameSite: 'strict', // Stricter same-site policy
    domain: process.env.NODE_ENV === 'production' ? '.pr-chgf.onrender.com' : undefined
  },
  rolling: true, // Reset expiration on activity
  proxy: process.env.NODE_ENV === 'production' // Trust proxy in production
}));

// Security middleware - Force HTTPS in production
app.use((req, res, next) => {
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.header('host')}${req.url}`);
  }
  next();
});

// Security headers middleware
app.use((req, res, next) => {
  // HSTS - Force HTTPS for 1 year
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://analytics.google.com https://proxima-stem-space.ghost.io; " +
    "frame-src 'self' https://js.stripe.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'none';"
  );
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  
  next();
});

// CORS configuration with security
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize the app
async function initializeApp() {
  try {
    // First register all API routes
    const server = await registerRoutes(app);
    
    // Newsletter and search routes are now directly registered in routes.ts
    // before the Vite middleware

    // Global error handler for API routes
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error("API Error:", err);
      
      // Only send response if headers haven't been sent yet
      if (!res.headersSent) {
        res.status(status).json({ message });
      }
    });

    // Setup Vite AFTER all API routes are registered
    // This ensures the catch-all doesn't interfere with API routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    return server;
  } catch (error) {
    console.error("Error initializing app:", error);
    throw error;
  }
}

// Start the server
initializeApp().then(server => {
  const port = process.env.PORT || 5000;
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
    log(`Environment: ${process.env.NODE_ENV}`);
    log(`Missing env vars: ${missingEnvVars.join(', ') || 'none'}`);
  });
}).catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
