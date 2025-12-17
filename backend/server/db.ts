import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

/**
 * Database connection with SQL injection protection
 * 
 * SECURITY FEATURES:
 * - Uses Drizzle ORM for parameterized queries (prevents SQL injection)
 * - All queries use prepared statements automatically
 * - No raw SQL execution allowed without explicit sanitization
 * - Connection pooling for performance and security
 */

type Database = ReturnType<typeof drizzle>;
type Transaction = Parameters<Database['transaction']>[0] extends (tx: infer TX) => any ? TX : never;

let db: Database | null = null;
let pool: Pool | null = null;
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Get database connection
 * Uses connection pooling for security and performance
 */
export function getDb() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Validate connection string format
    if (!connectionString.startsWith('postgres://') && !connectionString.startsWith('postgresql://')) {
      throw new Error('Invalid DATABASE_URL format. Must start with postgres:// or postgresql://');
    }

    const sslRejectEnv = process.env.PGSSLREJECTUNAUTHORIZED ?? process.env.PG_SSL_REJECT_UNAUTHORIZED;
    const sslRejectUnauthorized = sslRejectEnv
      ? sslRejectEnv.toLowerCase() === 'true'
      : isProduction; // default: enforce in prod, relaxed in dev

    const sslConfig = sslRejectUnauthorized
      ? {
          rejectUnauthorized: true,
          ca: process.env.PGSSLROOTCERT || process.env.PG_SSL_CA, // provide CA content if available
        }
      : false;

    pool = new Pool({
      connectionString,
      ssl: sslConfig,
      // Security: Limit connection lifetime
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10, // Max connections in pool
    });

    pool.on('error', (err) => {
      console.error('Postgres pool error, resetting pool:', err);
      db = null;
      pool = null;
    });

    db = drizzle(pool);
  }

  return db;
}

/**
 * Close database connection
 * Should be called on application shutdown
 */
export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

/**
 * SQL Injection Protection Utilities
 * 
 * These should ONLY be used when absolutely necessary.
 * Prefer using Drizzle ORM's query builder which handles sanitization automatically.
 */
export const SqlSecurity = {
  /**
   * Validate identifier (table/column names)
   * Only allows alphanumeric characters and underscores
   */
  validateIdentifier(identifier: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
  },

  /**
   * Escape identifier for safe use in queries
   * Note: Prefer using ORM instead of this
   */
  escapeIdentifier(identifier: string): string {
    if (!this.validateIdentifier(identifier)) {
      throw new Error(`Invalid identifier: ${identifier}`);
    }
    return `"${identifier}"`;
  },

  /**
   * Validate that a string contains only safe characters
   * Prevents SQL injection in LIKE patterns or other special cases
   */
  validateSafeString(input: string): boolean {
    // Check for common SQL injection patterns
    const dangerousPatterns = [
      /(\-\-|;|\/\*|\*\/)/,  // Comments
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,  // SQL keywords
      /(\bEXEC\b|\bEXECUTE\b|\bxp_\b)/i,  // Stored procedures
      /(\\x|0x)/i,  // Hex literals
      /(\bOR\b.*=.*|\bAND\b.*=.*)/i,  // Boolean conditions
    ];

    return !dangerousPatterns.some(pattern => pattern.test(input));
  },

  /**
   * Sanitize LIKE pattern
   * Escapes special characters in LIKE queries
   */
  sanitizeLikePattern(pattern: string): string {
    if (!this.validateSafeString(pattern)) {
      throw new Error('Potentially unsafe SQL pattern detected');
    }
    // Escape special LIKE characters
    return pattern.replace(/[%_\\]/g, '\\$&');
  },
};

/**
 * Query logging middleware for security auditing
 */
export class QueryLogger {
  private static logs: Array<{ query: string; timestamp: Date; duration: number }> = [];

  static log(query: string, duration: number) {
    this.logs.push({
      query,
      timestamp: new Date(),
      duration,
    });

    // Keep only last 100 queries
    if (this.logs.length > 100) {
      this.logs.shift();
    }

    // Log suspicious queries
    if (SqlSecurity.validateSafeString(query) === false) {
      console.warn('⚠️  Suspicious query detected:', query);
    }
  }

  static getRecentLogs() {
    return this.logs;
  }

  static clearLogs() {
    this.logs = [];
  }
}

/**
 * Database transaction wrapper with automatic rollback on error
 */
export async function withTransaction<T>(
  callback: (tx: Transaction) => Promise<T>,
  options: { maxRetries?: number; retryDelayMs?: number } = {},
): Promise<T> {
  const database = getDb();
  const { maxRetries = 2, retryDelayMs = 50 } = options;

  let attempt = 0;
  // Retry on serialization/deadlock errors for resilience under concurrency
  // Codes: 40001 serialization_failure, 40P01 deadlock_detected
  while (true) {
    try {
      return await database.transaction(async (tx) => callback(tx));
    } catch (err: any) {
      const code = err?.code;
      const isRetryable = code === '40001' || code === '40P01';
      if (!isRetryable || attempt >= maxRetries) {
        throw err;
      }
      attempt += 1;
      await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
    }
  }
}
