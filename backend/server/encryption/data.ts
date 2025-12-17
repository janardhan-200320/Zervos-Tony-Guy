import crypto from "crypto";
import { ALGORITHM, IV_LENGTH, KEY } from "./keys";

export const DataEncryption = {
  encrypt(text: string): string {
    if (!text) return "";

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();
    return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
  },

  decrypt(encryptedText: string): string {
    if (!encryptedText) return "";

    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(parts[0], "base64");
    const authTag = Buffer.from(parts[1], "base64");
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  },

  isEncrypted(text: string): boolean {
    if (!text || typeof text !== "string") return false;
    const parts = text.split(":");
    return parts.length === 3;
  },

  encryptFields<T extends Record<string, any>>(obj: T, fields: ReadonlyArray<keyof T>): T {
    const encrypted = { ...obj };
    for (const field of fields) {
      if (encrypted[field] && typeof encrypted[field] === "string") {
        if (!this.isEncrypted(encrypted[field] as string)) {
          encrypted[field] = this.encrypt(encrypted[field] as string) as any;
        }
      }
    }
    return encrypted;
  },

  decryptFields<T extends Record<string, any>>(obj: T, fields: ReadonlyArray<keyof T>): T {
    const decrypted = { ...obj };
    for (const field of fields) {
      if (decrypted[field] && typeof decrypted[field] === "string") {
        if (this.isEncrypted(decrypted[field] as string)) {
          try {
            decrypted[field] = this.decrypt(decrypted[field] as string) as any;
          } catch {
            // ignore field-level decrypt errors
          }
        }
      }
    }
    return decrypted;
  },
};
