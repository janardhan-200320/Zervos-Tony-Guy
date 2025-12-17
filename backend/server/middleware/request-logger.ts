import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { getClientIp } from './_shared';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const clientIp = getClientIp(req);

  try {
    logger.http(`→ ${req.method} ${req.path}`, {
      ip: clientIp,
      userAgent: req.get('user-agent'),
      userId: (req as any).user?.userId,
    });
  } catch (error) {
    logger.error('Error logging incoming request', { error });
  }

  res.on('finish', () => {
    try {
      const duration = Date.now() - start;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';
      logger[level](`← ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`, {
        ip: clientIp,
        userId: (req as any).user?.userId,
        duration,
        statusCode: res.statusCode,
      });
    } catch (error) {
      logger.error('Error logging outgoing response', { error });
    }
  });

  res.on('close', () => {
    if (!res.writableFinished) {
      try {
        logger.warn(`Connection closed without finish for ${req.method} ${req.path}`, {
          ip: clientIp,
          userId: (req as any).user?.userId,
        });
      } catch (error) {
        logger.error('Error logging connection close', { error });
      }
    }
  });

  next();
}
