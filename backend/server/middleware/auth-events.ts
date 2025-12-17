import { Request, Response, NextFunction } from 'express';
import { logger, SecurityLogger } from '../logger';
import { getClientIp } from './_shared';

export function authEventLogger(req: Request, res: Response, next: NextFunction) {
  const clientIp = getClientIp(req);
  const userAgent = req.get('user-agent');
  let responded = false;

  const originalJson = res.json.bind(res);

  res.json = function(body: any) {
    try {
      if (responded) return originalJson(body);
      responded = true;

      const path = req.path;
      const method = req.method;

      if (path.includes('/login') && method === 'POST') {
        try {
          if (res.statusCode === 200 || res.statusCode === 201) {
            const userId = (body as any).user?.id || (req as any).user?.userId;
            if (userId) {
              SecurityLogger.logLoginSuccess(userId, clientIp, userAgent);
            }
          } else {
            SecurityLogger.logLoginFailure(
              (req.body as any)?.username || 'unknown',
              (body as any).message || 'Invalid credentials',
              clientIp,
              userAgent
            );
          }
        } catch (error) {
          logger.error('Error logging login event', { error });
        }
      }

      if (path.includes('/logout') && method === 'POST' && res.statusCode === 200) {
        try {
          const uid = (req as any).user?.userId;
          if (uid) {
            SecurityLogger.logLogout(uid, clientIp);
          }
        } catch (error) {
          logger.error('Error logging logout event', { error });
        }
      }

      if (path.includes('/register') && method === 'POST' && res.statusCode === 201) {
        try {
          const userId = (body as any).user?.id;
          const username = (body as any).user?.username || (req.body as any)?.username;
          if (userId && username) {
            SecurityLogger.logAccountCreated(userId, username, (body as any).user?.role || 'user', clientIp);
          }
        } catch (error) {
          logger.error('Error logging account creation', { error });
        }
      }
    } catch (error) {
      logger.error('Error in authEventLogger', { error });
    }

    return originalJson(body);
  } as any;

  next();
}
