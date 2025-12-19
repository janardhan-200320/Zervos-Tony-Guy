import type { Request } from 'express';
import { logger } from '../logger';

export const SUSPICIOUS_PATTERNS = [
  /(\.\.|\/etc\/|\/var\/|\/proc\/|\\\\\.\.)/i,
  /(union.*select|insert.*into|delete.*from|drop.*table)/i,
  /(<script|javascript:|onerror=|onclick=|<iframe)/i,
  /(eval\(|exec\(|system\(|passthru\()/i,
  /(base64_decode|gzinflate|str_rot13)/i,
];

export const SENSITIVE_FIELDS = [
  'password', 'token', 'secret', 'apiKey', 'creditCard',
  'ssn', 'pin', 'authorization', 'x-api-key', 'authorization-header'
];

export const SENSITIVE_FIELDS_LOWER = SENSITIVE_FIELDS.map(field => field.toLowerCase());
export const SENSITIVE_FIELDS_SET = new Set(SENSITIVE_FIELDS_LOWER);

export const MAX_BODY_SIZE_FOR_LOGGING = 1000; // bytes
export const SUSPICIOUS_USER_AGENTS = ['sqlmap', 'nikto', 'nmap', 'masscan'];

export function getClientIp(req: Request): string {
  try {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      const ip = ips.split(',')[0]?.trim();
      if (ip && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
        return ip;
      }
    }
    return (req as any).ip || (req as any).socket?.remoteAddress || 'unknown';
  } catch (error) {
    logger.error('Error extracting client IP', { error });
    return 'unknown';
  }
}

export function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') return data;

  try {
    const sanitizeRecursive = (obj: any, depth = 0): any => {
      if (depth > 5) return '[TRUNCATED]';
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

export function checkSuspiciousPattern(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const limitedStr = str.substring(0, 500);
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(limitedStr));
}
