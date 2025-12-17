import { Request, Response } from 'express';
import { logger, SecurityLogger } from '../logger';
import { getClientIp } from './_shared';

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
