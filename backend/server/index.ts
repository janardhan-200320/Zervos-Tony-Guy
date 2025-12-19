import "dotenv/config";
import express, { NextFunction, type Request, Response } from "express";
import helmet from "helmet";
import { IncomingMessage, ServerResponse } from "http";
import { apiLimiter, authLimiter } from "./config/rate-limits";
import { log, logger } from "./logger";
import {
  applyCoreMiddleware,
  authEventLogger,
  detectSuspiciousActivity,
  logUnauthorizedAccess,
  requestLogger,
  uploadsMiddleware,
} from "./middleware";
import { registerRoutes } from "./routes";
import { serveStatic, setupVite } from "./vite";

const app = express();
declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

applyCoreMiddleware(app);

// Helmet security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (_req: IncomingMessage, res: ServerResponse) => `'nonce-${(res as any).locals.cspNonce}'`],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Security and logging middleware
app.use(requestLogger); // Log all requests
app.use(detectSuspiciousActivity); // Detect malicious patterns
app.use(logUnauthorizedAccess); // Log 401/403 responses
app.use(authEventLogger); // Track auth events

// Apply route-specific rate limits
app.use('/api/auth', authLimiter);
app.use(apiLimiter);

// Serve uploaded files with streaming decryption
app.use('/uploads', uploadsMiddleware());

// Health check endpoint for load balancers
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error('Application error:', {
      error: err.message,
      stack: err.stack,
      status,
      path: _req.path,
      method: _req.method,
      userId: _req.user?.userId,
    });
    
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const standaloneFrontend = process.env.FRONTEND_STANDALONE === "true";
  if (standaloneFrontend) {
    // Frontend served by separate Vite dev server (e.g., :5173). Do not mount Vite middleware or static files here.
  } else if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  // On Windows, SO_REUSEPORT is not supported; only set reusePort on non-Windows
  const listenOptions: any = {
    port,
    host: "0.0.0.0",
  };
  if (process.platform !== "win32") {
    listenOptions.reusePort = true;
  }

  server.listen(listenOptions, () => {
    log(`serving on port ${port}`);
  });
})();
