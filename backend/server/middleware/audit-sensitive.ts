import { Request, Response, NextFunction } from 'express';
import { logger, SecurityLogger } from '../logger';
import { sanitizeForLogging } from './_shared';

export function auditSensitiveOperation(resource: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    let responded = false;
    const originalJson = res.json.bind(res);

    res.json = function(body: any) {
      try {
        if (responded) return originalJson(body);
        responded = true;

        if (res.statusCode >= 200 && res.statusCode < 300 && (req as any).user?.userId) {
          try {
            const method = req.method;
            const recordId = (req.params as any).id || (body as any)?.id;
            const uid = (req as any).user.userId;

            if (method === 'GET') {
              SecurityLogger.logDataAccess(uid, resource, 'read', recordId);
            } else if (method === 'POST') {
              SecurityLogger.logDataModification(uid, resource, 'create', recordId);
            } else if (method === 'PUT' || method === 'PATCH') {
              const sanitizedBody = sanitizeForLogging(req.body);
              SecurityLogger.logDataModification(uid, resource, 'update', recordId, sanitizedBody);
            } else if (method === 'DELETE') {
              SecurityLogger.logDataDeletion(uid, resource, recordId);
            }
          } catch (error) {
            logger.error('Error logging sensitive operation', { error, resource });
          }
        }
      } catch (error) {
        logger.error('Error in auditSensitiveOperation', { error });
      }

      return originalJson(body);
    } as any;

    next();
  };
}
