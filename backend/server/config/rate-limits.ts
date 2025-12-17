import rateLimit from 'express-rate-limit';
import { logRateLimitExceeded } from '../middleware/rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many auth attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: logRateLimitExceeded,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: logRateLimitExceeded,
});
