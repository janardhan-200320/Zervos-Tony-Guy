import crypto from "crypto";
import fs from "fs";

/**
 * Encryption Utilities for Data Protection
 * 
 * SECURITY FEATURES:
 * - AES-256-GCM for data encryption (authenticated encryption)
 * - Separate encryption keys for different data types
 * - IV (Initialization Vector) generated per encryption
 * - Authentication tags to prevent tampering
 * - File encryption for uploads
 */

// Require strong keys in production; fail fast if missing/invalid
const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY;
const FILE_ENCRYPTION_KEY_HEX = process.env.FILE_ENCRYPTION_KEY;

function parseKey(hex: string | undefined, name: string): Buffer {
  if (!hex) {
    throw new Error(`${name} must be set to a 64-character hex string`);
  }
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(`${name} must be a 64-character hex string`);
  }
  return Buffer.from(hex, "hex");
}

const KEY = parseKey(ENCRYPTION_KEY_HEX, "ENCRYPTION_KEY");
const FILE_KEY = parseKey(FILE_ENCRYPTION_KEY_HEX, "FILE_ENCRYPTION_KEY");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Data Encryption Utilities
 */
export const DataEncryption = {
  /**
   * Encrypt sensitive text data
   * Returns: base64 string in format: iv:authTag:encryptedData
   */
  encrypt(text: string): string {
    if (!text) return "";

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData
    return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
  },

  /**
   * Decrypt sensitive text data
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return "";

    try {
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
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt data");
    }
  },

  /**
   * Check if a string is encrypted (has our format)
   */
  isEncrypted(text: string): boolean {
    if (!text || typeof text !== "string") return false;
    const parts = text.split(":");
    return parts.length === 3;
  },

  /**
   * Encrypt sensitive fields in an object
   * @param obj - Object with fields to encrypt
   * @param fields - Array of field names to encrypt
   */
  encryptFields<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[]
  ): T {
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

  /**
   * Decrypt sensitive fields in an object
   * @param obj - Object with encrypted fields
   * @param fields - Array of field names to decrypt
   */
  decryptFields<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[]
  ): T {
    const decrypted = { ...obj };

    for (const field of fields) {
      if (decrypted[field] && typeof decrypted[field] === "string") {
        if (this.isEncrypted(decrypted[field] as string)) {
          try {
            decrypted[field] = this.decrypt(decrypted[field] as string) as any;
          } catch (error) {
            console.error(`Failed to decrypt field ${String(field)}:`, error);
          }
        }
      }
    }

    return decrypted;
  },
};

/**
 * File Encryption Utilities
 */
export const FileEncryption = {
  /**
   * Encrypt a file
   * @param inputPath - Path to file to encrypt
   * @param outputPath - Path to save encrypted file
   * @returns Metadata needed for decryption (IV and auth tag)
   */
  async encryptFile(
    inputPath: string,
    outputPath?: string
  ): Promise<{ path: string; iv: string; authTag: string }> {
    return new Promise((resolve, reject) => {
      const output = outputPath || `${inputPath}.enc`;
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, FILE_KEY, iv);

      const input = fs.createReadStream(inputPath);
      const outputStream = fs.createWriteStream(output);

      // Write IV at the beginning of the file
      outputStream.write(iv);

      input.pipe(cipher).pipe(outputStream);

      outputStream.on("finish", () => {
        try {
          const authTag = cipher.getAuthTag();
          // Append auth tag to the end of the file so decrypt can read both header and footer
          fs.appendFile(output, authTag, (err) => {
            if (err) return reject(err);
            resolve({
              path: output,
              iv: iv.toString("base64"),
              authTag: authTag.toString("base64"),
            });
          });
        } catch (error) {
          reject(error);
        }
      });

      outputStream.on("error", reject);
      input.on("error", reject);
    });
  },

  /**
   * Decrypt a file
   * @param inputPath - Path to encrypted file
   * @param outputPath - Path to save decrypted file
   */
  async decryptFile(
    inputPath: string,
    outputPath: string
  ): Promise<void> {
    const fileBuffer = await fs.promises.readFile(inputPath);

    if (fileBuffer.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error("File decryption failed: file too small to contain IV and auth tag");
    }

    const iv = fileBuffer.subarray(0, IV_LENGTH);
    const authTagBuf = fileBuffer.subarray(fileBuffer.length - AUTH_TAG_LENGTH);
    const ciphertext = fileBuffer.subarray(IV_LENGTH, fileBuffer.length - AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, FILE_KEY, iv);
    decipher.setAuthTag(authTagBuf);

    try {
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      await fs.promises.writeFile(outputPath, decrypted);
    } catch (error) {
      throw new Error("File decryption failed: authentication error");
    }
  },

  /**
   * Encrypt file in place (writes IV at head, auth tag at tail)
   * @param filePath - Path to file
   * @returns Path to encrypted file
   */
  async encryptFileInPlace(filePath: string): Promise<string> {
    const tempPath = `${filePath}.tmp`;

    try {
      await this.encryptFile(filePath, tempPath);
      fs.renameSync(tempPath, filePath);
      return filePath;
    } catch (error) {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      throw error;
    }
  },

  /**
   * Decrypt file that was encrypted in place
   * @param filePath - Path to encrypted file
   */
  async decryptFileInPlace(filePath: string): Promise<void> {
    const tempPath = `${filePath}.tmp`;

    try {
      await this.decryptFile(filePath, tempPath);
      fs.renameSync(tempPath, filePath);
    } catch (error) {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      throw error;
    }
  },

  /**
   * Check if file is encrypted (has metadata)
   */
  isFileEncrypted(filePath: string): boolean {
    try {
      const stats = fs.statSync(filePath);
      return stats.size >= IV_LENGTH + AUTH_TAG_LENGTH;
    } catch {
      return false;
    }
  },
};

/**
 * Hash utilities for one-way encryption
 */
export const HashUtils = {
  /**
   * Create SHA-256 hash
   */
  hash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  },

  /**
   * Create HMAC signature
   */
  hmac(data: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(data).digest("hex");
  },

  /**
   * Verify HMAC signature
   */
  verifyHmac(data: string, signature: string, secret: string): boolean {
    try {
      const expected = this.hmac(data, secret);
      const expectedBuf = Buffer.from(expected, "hex");
      const sigBuf = Buffer.from(signature, "hex");

      if (expectedBuf.length !== sigBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, sigBuf);
    } catch {
      return false;
    }
  },
};

/**
 * Generate secure encryption keys
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Example usage and documentation
 */
export const EncryptionExamples = {
  dataEncryption: () => {
    const sensitive = "user@example.com";
    const encrypted = DataEncryption.encrypt(sensitive);
    const decrypted = DataEncryption.decrypt(encrypted);
    console.log("Original:", sensitive);
    console.log("Encrypted:", encrypted);
    console.log("Decrypted:", decrypted);
  },

  fieldEncryption: () => {
    const user = {
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
    };

    const encrypted = DataEncryption.encryptFields(user, ["email", "phone"]);
    const decrypted = DataEncryption.decryptFields(encrypted, ["email", "phone"]);

    console.log("Original:", user);
    console.log("Encrypted:", encrypted);
    console.log("Decrypted:", decrypted);
  },
};
