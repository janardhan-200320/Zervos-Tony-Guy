import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOptions } from '../config/cors';
import { jsonLimit, formLimit } from '../config/body';
import { shouldTrustProxy } from '../config/trust-proxy';

export function applyCoreMiddleware(app: express.Express) {
  if (shouldTrustProxy) {
    app.set('trust proxy', 1);
  }

  if (process.env.NODE_ENV === 'production') {
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        return res.redirect(`https://${req.header('host')}${req.url}`);
      }
      return next();
    });
  }

  app.use(helmet());
  app.use(cors(corsOptions));

  app.use(express.json({
    limit: jsonLimit,
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }));

  app.use(express.urlencoded({ extended: false, limit: formLimit }));
}
