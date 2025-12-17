import { randomBytes } from "crypto";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Require secrets at startup to avoid running with unsafe defaults
const isProduction = process.env.NODE_ENV === "production";

let accessSecret = process.env.JWT_ACCESS_SECRET;
let refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!isProduction) {
  if (!accessSecret) {
    accessSecret = randomBytes(32).toString("hex");
    console.warn("Generated ephemeral JWT_ACCESS_SECRET for non-production environment.");
  }
  if (!refreshSecret) {
    refreshSecret = randomBytes(32).toString("hex");
    console.warn("Generated ephemeral JWT_REFRESH_SECRET for non-production environment.");
  }
}

if (!accessSecret || !refreshSecret) {
  throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set");
}

const JWT_ACCESS_SECRET = accessSecret;
const JWT_REFRESH_SECRET = refreshSecret;
let issuer = process.env.JWT_ISSUER;
let audience = process.env.JWT_AUDIENCE;

if (!isProduction) {
  if (!issuer) {
    issuer = "zervos-dev-issuer";
    console.warn("Generated default JWT_ISSUER for non-production environment.");
  }
  if (!audience) {
    audience = "zervos-dev-audience";
    console.warn("Generated default JWT_AUDIENCE for non-production environment.");
  }
}

if (!issuer || !audience) {
  throw new Error("JWT_ISSUER and JWT_AUDIENCE must be set");
}

const JWT_ISSUER = issuer;
const JWT_AUDIENCE = audience;
const JWT_EXPIRY = "24h";
const REFRESH_TOKEN_EXPIRY = "7d";
const LOG_TOKEN_ERRORS = process.env.LOG_TOKEN_ERRORS === "true";

function parseDurationToMs(value: string): number {
  const match = value.match(/^(\d+)([smhd])$/i);
  if (!match) {
    throw new Error(`Invalid duration format: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }
}

const REFRESH_TOKEN_EXPIRY_MS = parseDurationToMs(REFRESH_TOKEN_EXPIRY);

export interface AuthPayload {
  userId: number;
  username: string;
  role?: string;
}

type TokenPayload = AuthPayload & { jti?: string };

// In-memory revocation store with expiry; replace with persistent store (e.g., DB/redis) in production
const revokedRefreshJtis = new Map<string, number>(); // jti -> expiresAt (ms)

function generateJti(): string {
  return randomBytes(16).toString("hex");
}

function cleanupRevokedRefreshTokens(): void {
  const now = Date.now();
  for (const [jti, expiresAt] of revokedRefreshJtis.entries()) {
    if (expiresAt <= now) {
      revokedRefreshJtis.delete(jti);
    }
  }
}

function revokeRefreshJti(jti: string): void {
  revokedRefreshJtis.set(jti, Date.now() + REFRESH_TOKEN_EXPIRY_MS);
  if (revokedRefreshJtis.size > 1000) {
    cleanupRevokedRefreshTokens();
  }
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_EXPIRY,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithm: "HS256",
  });
}

export function generateRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithm: "HS256",
    jwtid: generateJti(),
  });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return decoded as TokenPayload;
  } catch (error) {
    if (LOG_TOKEN_ERRORS) {
      console.error("Access token verification error:", error);
    }
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    const payload = decoded as TokenPayload;
    cleanupRevokedRefreshTokens();
    if (payload.jti) {
      const expiresAt = revokedRefreshJtis.get(payload.jti);
      if (expiresAt && expiresAt > Date.now()) {
        return null;
      }
    }
    return payload;
  } catch (error) {
    if (LOG_TOKEN_ERRORS) {
      console.error("Refresh token verification error:", error);
    }
    return null;
  }
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = payload;
  next();
}

export function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    if (payload) {
      req.user = payload;
    }
  }

  next();
}

export function rotateRefreshToken(refreshToken: string):
  | { accessToken: string; refreshToken: string; payload: AuthPayload }
  | null {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return null;
  }

  if (payload.jti) {
    revokeRefreshJti(payload.jti);
  }

  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, payload };
}
