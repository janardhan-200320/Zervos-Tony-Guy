import { Request, Response, NextFunction } from 'express';
import { logger, SecurityLogger } from '../logger';
import { getClientIp, checkSuspiciousPattern, MAX_BODY_SIZE_FOR_LOGGING, SUSPICIOUS_USER_AGENTS } from './_shared';

export function detectSuspiciousActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const clientIp = getClientIp(req);
    const userAgent = req.get('user-agent');
    let suspicious = false;
    const suspiciousData: any = {};

    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string' && checkSuspiciousPattern(value)) {
          suspicious = true;
          suspiciousData.queryParam = { [key]: '[SUSPICIOUS_PATTERN]' };
          break;
        }
      }
    }

    if (!suspicious && req.body && typeof req.body === 'object') {
      const contentLength = Number(req.headers['content-length']);
      if (!Number.isNaN(contentLength) && contentLength > MAX_BODY_SIZE_FOR_LOGGING) {
        // skip
      } else {
        const bodyStr = JSON.stringify(req.body);
        if (bodyStr.length < MAX_BODY_SIZE_FOR_LOGGING && checkSuspiciousPattern(bodyStr)) {
          suspicious = true;
          suspiciousData.body = 'suspicious_content_detected';
        }
      }
    }

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
          userId: (req as any).user?.userId,
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
