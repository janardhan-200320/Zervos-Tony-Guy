import { Request, Response, NextFunction } from 'express';
import type { AuthPayload } from '../auth';
import { logger, SecurityLogger, SecurityEventType } from '../logger';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// Pre-compiled regex patterns for performance
const SUSPICIOUS_PATTERNS = [
  /(\.\.|\/etc\/|\/var\/|\/proc\/|\\\\.\.)/i, // Path traversal
  /(union.*select|insert.*into|delete.*from|drop.*table)/i, // SQL injection
  /(<script|javascript:|onerror=|onclick=|<iframe)/i, // XSS
  /(eval\(|exec\(|system\(|passthru\()/i, // Code injection
  /(base64_decode|gzinflate|str_rot13)/i, // Obfuscation
];

const SENSITIVE_FIELDS = [
  'password', 'token', 'secret', 'apiKey', 'creditCard',
  'ssn', 'pin', 'authorization', 'x-api-key', 'authorization-header'
];
const SENSITIVE_FIELDS_LOWER = SENSITIVE_FIELDS.map(field => field.toLowerCase());
const SENSITIVE_FIELDS_SET = new Set(SENSITIVE_FIELDS_LOWER);

const MAX_BODY_SIZE_FOR_LOGGING = 1000; // bytes
const SUSPICIOUS_USER_AGENTS = ['sqlmap', 'nikto', 'nmap', 'masscan'];

/**
 * Extract client IP address from request, handling proxy headers
 */
function getClientIp(req: Request): string {
  try {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      const ip = ips.split(',')[0]?.trim();
      if (ip && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
        return ip;
      }
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
  } catch (error) {
    logger.error('Error extracting client IP', { error });
    return 'unknown';
  }
}

/**
 * Sanitize sensitive data from objects before logging
 */
function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') return data;

  try {
    const sanitizeRecursive = (obj: any, depth = 0): any => {
      if (depth > 5) return '[TRUNCATED]'; // Prevent deep recursion
      if (obj === null || obj === undefined) return obj;
      if (typeof obj !== 'object') return obj;

      const result: any = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        const keyLower = key.toLowerCase();
        const keyIsSensitive = SENSITIVE_FIELDS_SET.has(keyLower) || SENSITIVE_FIELDS_LOWER.some(field => keyLower.includes(field));
        if (keyIsSensitive) {
          result[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          result[key] = sanitizeRecursive(obj[key], depth + 1);
        } else {
          result[key] = obj[key];
        }
      }
      return result;
    };

    return sanitizeRecursive(data);
  } catch (error) {
    logger.error('Error sanitizing data', { error });
    return '[ERROR_SANITIZING]';
  }
}

/**
 * Check if string contains suspicious patterns
 */
function checkSuspiciousPattern(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  // Limit string length to prevent ReDoS
  const limitedStr = str.substring(0, 500);
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(limitedStr));
}

// Middleware to log all HTTP requests
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const clientIp = getClientIp(req);

  try {
    // Log incoming request
    logger.http(`→ ${req.method} ${req.path}`, {
      ip: clientIp,
      userAgent: req.get('user-agent'),
        userId: req.user?.userId,
    });
  } catch (error) {
    logger.error('Error logging incoming request', { error });
  }

  // Use finish event instead of hijacking res.send
  res.on('finish', () => {
    try {
      const duration = Date.now() - start;
      const level = res.statusCode >= 500 ? 'error' :
        res.statusCode >= 400 ? 'warn' : 'http';

      logger[level](`← ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`, {
        ip: clientIp,
        userId: req.user?.userId,
        duration,
        statusCode: res.statusCode,
      });
    } catch (error) {
      logger.error('Error logging outgoing response', { error });
    }
  });

  // Handle errors that prevent finish event
  res.on('close', () => {
    if (!res.writableFinished) {
      try {
        logger.warn(`Connection closed without finish for ${req.method} ${req.path}`, {
          ip: clientIp,
          userId: req.user?.userId,
        });
      } catch (error) {
        logger.error('Error logging connection close', { error });
      }
    }
  });

  next();
}

// Middleware to track authentication events
export function authEventLogger(req: Request, res: Response, next: NextFunction) {
  const clientIp = getClientIp(req);
  const userAgent = req.get('user-agent');
  let responded = false;

  // Store original json method
  const originalJson = res.json.bind(res);

  res.json = function(body: any) {
    try {
      if (responded) return originalJson(body);
      responded = true;

      const path = req.path;
      const method = req.method;

      // Track login events
      if (path.includes('/login') && method === 'POST') {
        try {
          if (res.statusCode === 200 || res.statusCode === 201) {
            const userId = body.user?.id || req.user?.userId;
            if (userId) {
              SecurityLogger.logLoginSuccess(
                userId,
                clientIp,
                userAgent
              );
            }
          } else {
            SecurityLogger.logLoginFailure(
              req.body?.username || 'unknown',
              body.message || 'Invalid credentials',
              clientIp,
              userAgent
            );
          }
        } catch (error) {
          logger.error('Error logging login event', { error });
        }
      }

      // Track logout events
      if (path.includes('/logout') && method === 'POST' && res.statusCode === 200) {
        try {
          if (req.user?.userId) {
            SecurityLogger.logLogout(req.user.userId, clientIp);
          }
        } catch (error) {
          logger.error('Error logging logout event', { error });
        }
      }

      // Track registration events
      if (path.includes('/register') && method === 'POST' && res.statusCode === 201) {
        try {
          const userId = body.user?.id;
          const username = body.user?.username || req.body?.username;
          if (userId && username) {
            SecurityLogger.logAccountCreated(
              userId,
              username,
              body.user?.role || 'user',
              clientIp
            );
          }
        } catch (error) {
          logger.error('Error logging account creation', { error });
        }
      }
    } catch (error) {
      logger.error('Error in authEventLogger', { error });
    }

    return originalJson(body);
  };

  next();
}

// Middleware to track sensitive data operations
export function auditSensitiveOperation(resource: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    let responded = false;
    const originalJson = res.json.bind(res);

    res.json = function(body: any) {
      try {
        if (responded) return originalJson(body);
        responded = true;

        // Only log successful operations (2xx status)
        if (res.statusCode >= 200 && res.statusCode < 300 && req.user?.userId) {
          try {
            const method = req.method;
            const recordId = req.params.id || body?.id;

            if (method === 'GET') {
              SecurityLogger.logDataAccess(req.user.userId, resource, 'read', recordId);
            } else if (method === 'POST') {
              SecurityLogger.logDataModification(req.user.userId, resource, 'create', recordId);
            } else if (method === 'PUT' || method === 'PATCH') {
              const sanitizedBody = sanitizeForLogging(req.body);
              SecurityLogger.logDataModification(req.user.userId, resource, 'update', recordId, sanitizedBody);
            } else if (method === 'DELETE') {
              SecurityLogger.logDataDeletion(req.user.userId, resource, recordId);
            }
          } catch (error) {
            logger.error('Error logging sensitive operation', { error, resource });
          }
        }
      } catch (error) {
        logger.error('Error in auditSensitiveOperation', { error });
      }

      return originalJson(body);
    };

    next();
  };
}

// Middleware to detect suspicious activity patterns
export function detectSuspiciousActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const clientIp = getClientIp(req);
    const userAgent = req.get('user-agent');
    let suspicious = false;
    const suspiciousData: any = {};

    // Check URL parameters
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string' && checkSuspiciousPattern(value)) {
          suspicious = true;
          suspiciousData.queryParam = { [key]: '[SUSPICIOUS_PATTERN]' };
          break; // Log only first suspicious param for performance
        }
      }
    }

    // Check request body (with size limit)
    if (!suspicious && req.body && typeof req.body === 'object') {
      const contentLength = Number(req.headers['content-length']);
      if (!Number.isNaN(contentLength) && contentLength > MAX_BODY_SIZE_FOR_LOGGING) {
        // Skip heavy bodies to avoid expensive stringify
      } else {
        const bodyStr = JSON.stringify(req.body);
        if (bodyStr.length < MAX_BODY_SIZE_FOR_LOGGING && checkSuspiciousPattern(bodyStr)) {
          suspicious = true;
          suspiciousData.body = 'suspicious_content_detected';
        }
      }
    }

    // Check User-Agent for known attack tools
    if (!suspicious && userAgent) {
      const userAgentLower = userAgent.toLowerCase();
      if (SUSPICIOUS_USER_AGENTS.some(agent => userAgentLower.includes(agent))) {
        suspicious = true;
        suspiciousData.userAgent = '[SUSPICIOUS_AGENT]';
      }
    }

    if (suspicious) {
      try {
        SecurityLogger.logSuspiciousActivity(
          {
            path: req.path,
            method: req.method,
            ...suspiciousData,
          },
          clientIp,
          userAgent
        );

        logger.warn('Suspicious activity detected', {
          ip: clientIp,
          path: req.path,
          method: req.method,
          userId: req.user?.userId,
        });
      } catch (error) {
        logger.error('Error logging suspicious activity', { error });
      }
    }
  } catch (error) {
    logger.error('Error in detectSuspiciousActivity', { error });
  }

  next();
}

// Middleware to log unauthorized access attempts
export function logUnauthorizedAccess(req: Request, res: Response, next: NextFunction) {
  const clientIp = getClientIp(req);
  const userAgent = req.get('user-agent');
  res.on('finish', () => {
    try {
      if (res.statusCode === 401 || res.statusCode === 403) {
        SecurityLogger.logUnauthorizedAccess(
          req.path,
          clientIp,
          userAgent
        );

        if (req.user?.userId && res.statusCode === 403) {
          SecurityLogger.logPermissionDenied(
            req.user.userId,
            req.path,
            req.method,
            clientIp
          );
        }
      }
    } catch (error) {
      logger.error('Error in logUnauthorizedAccess', { error });
    }
  });

  next();
}

// Middleware to log rate limit exceeded
export function logRateLimitExceeded(req: Request, res: Response) {
  try {
    const clientIp = getClientIp(req);
    SecurityLogger.logRateLimitExceeded(clientIp, req.path);
    logger.warn('Rate limit exceeded', {
      ip: clientIp,
      path: req.path,
      method: req.method,
    });
  } catch (error) {
    logger.error('Error logging rate limit exceeded', { error });
  }
}
