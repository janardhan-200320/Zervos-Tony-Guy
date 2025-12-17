import type { AuthPayload } from '../auth';

declare global {
  namespace Express {
    // Augment Express Request with our auth payload
    interface Request {
      user?: AuthPayload;
    }
  }
}

export {};
