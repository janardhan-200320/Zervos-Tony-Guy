import crypto from "crypto";

export const ALGORITHM = "aes-256-gcm";
export const IV_LENGTH = 16;
export const AUTH_TAG_LENGTH = 16;

function parseKey(hex: string | undefined, name: string): Buffer {
  if (!hex) {
    throw new Error(`${name} must be set to a 64-character hex string`);
  }
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(`${name} must be a 64-character hex string`);
  }
  return Buffer.from(hex, "hex");
}

const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY;
const FILE_ENCRYPTION_KEY_HEX = process.env.FILE_ENCRYPTION_KEY;

export const KEY = parseKey(ENCRYPTION_KEY_HEX, "ENCRYPTION_KEY");
export const FILE_KEY = parseKey(FILE_ENCRYPTION_KEY_HEX, "FILE_ENCRYPTION_KEY");

export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}
