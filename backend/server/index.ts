import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import fs from "fs";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { FileEncryption } from "./encryption";
import { logger, log } from "./logger";
import {
  requestLogger,
  authEventLogger,
  detectSuspiciousActivity,
  logUnauthorizedAccess,
  logRateLimitExceeded,
} from "./middleware/logging";

const app = express();

// HTTPS Enforcement in production
if (process.env.NODE_ENV === 'production') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Security middleware
app.use(helmet()); // Add security headers

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting with logging
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: logRateLimitExceeded, // Log rate limit violations
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Security and logging middleware
app.use(requestLogger); // Log all requests
app.use(detectSuspiciousActivity); // Detect malicious patterns
app.use(logUnauthorizedAccess); // Log 401/403 responses
app.use(authEventLogger); // Track auth events

// Apply rate limiting to all routes
app.use(limiter);

// Serve uploaded files with decryption middleware
app.use('/uploads', async (req: Request, res: Response, next: NextFunction) => {
  const filePath = path.join(process.cwd(), 'uploads', req.path.slice(1));
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return next();
  }

  // Check if file is encrypted
  if (FileEncryption.isFileEncrypted(filePath)) {
    const tempPath = path.join(process.cwd(), 'uploads', '.temp', path.basename(filePath));
    const tempDir = path.dirname(tempPath);

    try {
      // Create temp directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Decrypt to temp file
      await FileEncryption.decryptFileInPlace(filePath, `${filePath}.meta`);
      
      // Send decrypted file
      res.sendFile(filePath, (err) => {
        // Re-encrypt after sending
        FileEncryption.encryptFileInPlace(filePath).catch(error => 
          logger.error('Re-encryption failed:', { error, filePath })
        );
        
        if (err) {
          logger.error('Error sending decrypted file:', { error: err, filePath });
          res.status(500).send('Error serving file');
        }
      });
    } catch (error) {
      logger.error('File decryption failed:', { error, filePath });
      return res.status(500).send('Error decrypting file');
    }
  } else {
    // Serve unencrypted file normally
    next();
  }
}, express.static('uploads'));

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
