import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { auditLogs } from '../shared/schema';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Define format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format with colors for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Define which transports to use
const transports: winston.transport[] = [
  // Console output
  new winston.transports.Console({
    format: consoleFormat,
  }),
  
  // Error logs
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format,
  }),
  
  // All logs
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format,
  }),
  
  // Security events
  new winston.transports.File({
    filename: path.join(logsDir, 'security.log'),
    level: 'warn',
    maxsize: 5242880, // 5MB
    maxFiles: 10, // Keep more security logs
    format,
  }),
];

// Create logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format,
  transports,
});

// Security event types
export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
  ACCOUNT_UPDATED = 'ACCOUNT_UPDATED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
  FILE_DELETE = 'FILE_DELETE',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  DATA_DELETION = 'DATA_DELETION',
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_DESTROYED = 'SESSION_DESTROYED',
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',
}

// Security event logger
export class SecurityLogger {
  static async logEvent(
    eventType: SecurityEventType,
    userId: string | null,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      userId,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      ...details,
    };

    // Log to winston
    logger.warn(`SECURITY_EVENT: ${eventType}`, logEntry);
    
    // Store in database for audit trail (async, don't block)
    this.storeAuditLog(logEntry).catch(err => 
      logger.error('Failed to store audit log:', { error: err.message })
    );
  }

  private static async storeAuditLog(logEntry: Record<string, any>) {
    try {
      const { getDb } = await import('./db');
      const db = getDb();
      
      await db.insert(auditLogs).values({
        eventType: logEntry.eventType,
        userId: logEntry.userId,
        ipAddress: logEntry.ipAddress,
        userAgent: logEntry.userAgent,
        details: logEntry,
      });
    } catch (error: any) {
      // Don't throw - logging should never break the application
      logger.error('Database audit log insertion failed:', { error: error.message });
    }
  }

  // Convenience methods for common events
  static logLoginSuccess(userId: string, ipAddress?: string, userAgent?: string) {
    this.logEvent(SecurityEventType.LOGIN_SUCCESS, userId, {}, ipAddress, userAgent);
  }

  static logLoginFailure(username: string, reason: string, ipAddress?: string, userAgent?: string) {
    this.logEvent(SecurityEventType.LOGIN_FAILURE, null, { username, reason }, ipAddress, userAgent);
  }

  static logLogout(userId: string, ipAddress?: string) {
    this.logEvent(SecurityEventType.LOGOUT, userId, {}, ipAddress);
  }

  static logPermissionDenied(userId: string | null, resource: string, action: string, ipAddress?: string) {
    this.logEvent(SecurityEventType.PERMISSION_DENIED, userId, { resource, action }, ipAddress);
  }

  static logUnauthorizedAccess(path: string, ipAddress?: string, userAgent?: string) {
    this.logEvent(SecurityEventType.UNAUTHORIZED_ACCESS, null, { path }, ipAddress, userAgent);
  }

  static logFileOperation(
    operation: 'upload' | 'download' | 'delete',
    userId: string,
    fileName: string,
    fileSize?: number,
    ipAddress?: string
  ) {
    const eventType = operation === 'upload' ? SecurityEventType.FILE_UPLOAD :
                      operation === 'download' ? SecurityEventType.FILE_DOWNLOAD :
                      SecurityEventType.FILE_DELETE;
    
    this.logEvent(eventType, userId, { fileName, fileSize }, ipAddress);
  }

  static logDataAccess(userId: string, resource: string, action: string, recordId?: number) {
    this.logEvent(SecurityEventType.DATA_ACCESS, userId, { resource, action, recordId });
  }

  static logDataModification(userId: string, resource: string, action: string, recordId?: number, changes?: any) {
    this.logEvent(SecurityEventType.DATA_MODIFICATION, userId, { resource, action, recordId, changes });
  }

  static logDataDeletion(userId: string, resource: string, recordId?: number) {
    this.logEvent(SecurityEventType.DATA_DELETION, userId, { resource, recordId });
  }

  static logSuspiciousActivity(details: Record<string, any>, ipAddress?: string, userAgent?: string) {
    this.logEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, null, details, ipAddress, userAgent);
  }

  static logRateLimitExceeded(ipAddress: string, path: string) {
    this.logEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, null, { path }, ipAddress);
  }

  static logPasswordChange(userId: string, ipAddress?: string) {
    this.logEvent(SecurityEventType.PASSWORD_CHANGE, userId, {}, ipAddress);
  }

  static logAccountCreated(userId: string, username: string, role: string, ipAddress?: string) {
    this.logEvent(SecurityEventType.ACCOUNT_CREATED, userId, { username, role }, ipAddress);
  }

  static logPayment(
    status: 'initiated' | 'completed' | 'failed',
    userId: string,
    amount: number,
    currency: string,
    paymentMethod?: string,
    details?: any
  ) {
    const eventType = status === 'initiated' ? SecurityEventType.PAYMENT_INITIATED :
                      status === 'completed' ? SecurityEventType.PAYMENT_COMPLETED :
                      SecurityEventType.PAYMENT_FAILED;
    
    this.logEvent(eventType, userId, { amount, currency, paymentMethod, ...details });
  }
}

// Export a simple log function for backward compatibility
export const log = (message: string, meta?: any) => {
  logger.info(message, meta);
};
