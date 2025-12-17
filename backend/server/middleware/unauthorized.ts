import { Request, Response, NextFunction } from 'express';
import { logger, SecurityLogger } from '../logger';
import { getClientIp } from './_shared';

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

        const uid = (req as any).user?.userId;
        if (uid && res.statusCode === 403) {
          SecurityLogger.logPermissionDenied(
            uid,
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
