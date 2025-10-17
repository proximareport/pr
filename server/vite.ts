import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Apply Vite middleware only to non-API routes
  app.use((req, res, next) => {
    // Skip API routes and other backend routes
    if (req.path.startsWith('/api/') || 
        req.path.startsWith('/test') || 
        req.path.startsWith('/backend/') || 
        req.path.startsWith('/v1/') ||
        req.path === '/sitemap.xml' || 
        req.path === '/news-sitemap.xml' ||
        req.path === '/robots.txt' || 
        req.path === '/rss.xml' || 
        req.path === '/atom.xml' ||
        req.path === '/ads.txt' || 
        req.path === '/feed.json') {
      return next();
    }
    // Apply Vite middleware to frontend routes
    vite.middlewares(req, res, next);
  });

  // Handle article pages with server-side meta tag injection in development
  app.get("/articles/:slug", async (req, res, next) => {
    const { slug } = req.params;
    
    try {
      // Import getPosts dynamically to avoid circular dependencies
      const { getPosts } = await import('./ghostService.js');
      
      // Fetch the article by slug
      const result = await getPosts(1, 1, `slug:${slug}`);
      const article = result.posts?.[0];
      
      if (article) {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "..",
          "client",
          "index.html",
        );
        
        // Read the index.html file
        let html = await fs.promises.readFile(clientTemplate, 'utf-8');
        
        // Generate article-specific meta tags
        const articleUrl = `https://proximareport.com/articles/${slug}`;
        const articleImage = article.feature_image || 'https://proximareport.com/assets/images/proxima-logo-desktop.png';
        const articleDescription = article.excerpt || article.custom_excerpt || article.title;
        const articleTitle = `${article.title} | Proxima Report`;
        const authorName = article.primary_author?.name || 'Proxima Report';
        const publishedDate = article.published_at;
        
        // Replace meta tags in the HTML
        html = html.replace(
          /<title>.*?<\/title>/,
          `<title>${articleTitle}</title>`
        );
        
        html = html.replace(
          /<meta name="description" content="[^"]*" \/>/,
          `<meta name="description" content="${articleDescription.replace(/"/g, '&quot;')}" />`
        );
        
        // Add/update Open Graph tags
        const ogTags = `
    <meta property="og:title" content="${articleTitle.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${articleDescription.replace(/"/g, '&quot;')}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${articleUrl}" />
    <meta property="og:image" content="${articleImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${article.title.replace(/"/g, '&quot;')}" />
    <meta property="og:site_name" content="Proxima Report" />
    <meta property="og:locale" content="en_US" />
    <meta property="article:published_time" content="${publishedDate}" />
    <meta property="article:author" content="${authorName.replace(/"/g, '&quot;')}" />
    <meta property="article:section" content="${article.primary_tag?.name || 'Space News'}" />
    ${article.tags?.map(tag => `<meta property="article:tag" content="${tag.name.replace(/"/g, '&quot;')}" />`).join('\n    ') || ''}
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${articleTitle.replace(/"/g, '&quot;')}" />
    <meta name="twitter:description" content="${articleDescription.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${articleImage}" />
    <meta name="twitter:image:alt" content="${article.title.replace(/"/g, '&quot;')}" />
    <meta name="twitter:site" content="@proximareport" />
    <meta name="twitter:creator" content="@proximareport" />
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${articleUrl}" />`;
        
        // Insert OG tags before the closing head tag
        html = html.replace('</head>', `${ogTags}\n  </head>`);
        
        // Apply Vite transformations
        html = html.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        
        const page = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } else {
        // Article not found, serve default HTML
        next();
      }
    } catch (error) {
      console.error('Error serving article page in development:', error);
      // Fallback to default HTML
      next();
    }
  });

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip SEO and compliance routes - let them be handled by the API middleware
    if (        req.path === '/sitemap.xml' || 
        req.path === '/news-sitemap.xml' ||
        req.path === '/robots.txt' || 
        req.path === '/rss.xml' || 
        req.path === '/atom.xml' ||
        req.path === '/ads.txt' || 
        req.path === '/feed.json' ||
        req.path === '/news-sitemap.xml' ||
        req.path.startsWith('/api/') || 
        req.path.startsWith('/test') || 
        req.path.startsWith('/backend/') || 
        req.path.startsWith('/v1/')) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Handle article pages with server-side meta tag injection
  app.get("/articles/:slug", async (req, res, next) => {
    const { slug } = req.params;
    
    try {
      // Import getPosts dynamically to avoid circular dependencies
      const { getPosts } = await import('./ghostService.js');
      
      // Fetch the article by slug
      const result = await getPosts(1, 1, `slug:${slug}`);
      const article = result.posts?.[0];
      
      if (article) {
        // Read the index.html file
        const indexPath = path.resolve(distPath, "index.html");
        let html = await fs.promises.readFile(indexPath, 'utf-8');
        
        // Generate article-specific meta tags
        const articleUrl = `https://proximareport.com/articles/${slug}`;
        const articleImage = article.feature_image || 'https://proximareport.com/assets/images/proxima-logo-desktop.png';
        const articleDescription = article.excerpt || article.custom_excerpt || article.title;
        const articleTitle = `${article.title} | Proxima Report`;
        const authorName = article.primary_author?.name || 'Proxima Report';
        const publishedDate = article.published_at;
        
        // Replace meta tags in the HTML
        html = html.replace(
          /<title>.*?<\/title>/,
          `<title>${articleTitle}</title>`
        );
        
        html = html.replace(
          /<meta name="description" content="[^"]*" \/>/,
          `<meta name="description" content="${articleDescription.replace(/"/g, '&quot;')}" />`
        );
        
        // Add/update Open Graph tags
        const ogTags = `
    <meta property="og:title" content="${articleTitle.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${articleDescription.replace(/"/g, '&quot;')}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${articleUrl}" />
    <meta property="og:image" content="${articleImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${article.title.replace(/"/g, '&quot;')}" />
    <meta property="og:site_name" content="Proxima Report" />
    <meta property="og:locale" content="en_US" />
    <meta property="article:published_time" content="${publishedDate}" />
    <meta property="article:author" content="${authorName.replace(/"/g, '&quot;')}" />
    <meta property="article:section" content="${article.primary_tag?.name || 'Space News'}" />
    ${article.tags?.map(tag => `<meta property="article:tag" content="${tag.name.replace(/"/g, '&quot;')}" />`).join('\n    ') || ''}
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${articleTitle.replace(/"/g, '&quot;')}" />
    <meta name="twitter:description" content="${articleDescription.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${articleImage}" />
    <meta name="twitter:image:alt" content="${article.title.replace(/"/g, '&quot;')}" />
    <meta name="twitter:site" content="@proximareport" />
    <meta name="twitter:creator" content="@proximareport" />
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${articleUrl}" />`;
        
        // Insert OG tags before the closing head tag
        html = html.replace('</head>', `${ogTags}\n  </head>`);
        
        res.set('Content-Type', 'text/html');
        res.send(html);
      } else {
        // Article not found, serve default HTML
        res.sendFile(path.resolve(distPath, "index.html"));
      }
    } catch (error) {
      console.error('Error serving article page:', error);
      // Fallback to default HTML
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });

  // Only serve index.html for non-API routes
  app.use("*", (req, res, next) => {
    // Skip SEO and compliance routes - let them be handled by the API middleware
    if (        req.path === '/sitemap.xml' || 
        req.path === '/news-sitemap.xml' ||
        req.path === '/robots.txt' || 
        req.path === '/rss.xml' || 
        req.path === '/atom.xml' ||
        req.path === '/ads.txt' || 
        req.path === '/feed.json' ||
        req.path === '/news-sitemap.xml' ||
        req.path.startsWith('/api/') || 
        req.path.startsWith('/test') || 
        req.path.startsWith('/backend/') || 
        req.path.startsWith('/v1/')) {
      return next();
    }
    
    // For all other routes, serve the frontend
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
