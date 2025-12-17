import fs from "fs";
import crypto from "crypto";
import { ALGORITHM, FILE_KEY, IV_LENGTH, AUTH_TAG_LENGTH } from "./keys";

export const FileEncryption = {
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

      outputStream.write(iv);
      input.pipe(cipher).pipe(outputStream);

      outputStream.on("finish", async () => {
        try {
          const authTag = cipher.getAuthTag();
          await fs.promises.appendFile(output, authTag);
          resolve({ path: output, iv: iv.toString("base64"), authTag: authTag.toString("base64") });
        } catch (err) {
          reject(err);
        }
      });

      outputStream.on("error", reject);
      input.on("error", reject);
    });
  },

  async decryptFile(inputPath: string, outputPath: string): Promise<void> {
    const stats = await fs.promises.stat(inputPath);
    const fileSize = stats.size;
    if (fileSize < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error("File decryption failed: file too small to contain IV and auth tag");
    }

    const fh = await fs.promises.open(inputPath, "r");
    try {
      const iv = Buffer.alloc(IV_LENGTH);
      await fh.read(iv, 0, IV_LENGTH, 0);

      const authTagBuf = Buffer.alloc(AUTH_TAG_LENGTH);
      await fh.read(authTagBuf, 0, AUTH_TAG_LENGTH, fileSize - AUTH_TAG_LENGTH);
      await fh.close();

      const ciphertextSize = fileSize - IV_LENGTH - AUTH_TAG_LENGTH;
      if (ciphertextSize > 10 * 1024 * 1024) {
        await new Promise<void>((resolve, reject) => {
          const decipher = crypto.createDecipheriv(ALGORITHM, FILE_KEY, iv);
          decipher.setAuthTag(authTagBuf);
          const input = fs.createReadStream(inputPath, { start: IV_LENGTH, end: fileSize - AUTH_TAG_LENGTH - 1 });
          const outputStream = fs.createWriteStream(outputPath);
          input.pipe(decipher).pipe(outputStream);
          outputStream.on("finish", () => resolve());
          outputStream.on("error", (e) => reject(new Error("File decryption failed: " + e.message)));
          input.on("error", (e) => reject(new Error("File decryption failed: " + e.message)));
          decipher.on("error", () => reject(new Error("File decryption failed: authentication error")));
        });
      } else {
        const fileBuffer = await fs.promises.readFile(inputPath);
        const ciphertext = fileBuffer.subarray(IV_LENGTH, fileSize - AUTH_TAG_LENGTH);
        const decipher = crypto.createDecipheriv(ALGORITHM, FILE_KEY, iv);
        decipher.setAuthTag(authTagBuf);
        const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        await fs.promises.writeFile(outputPath, decrypted);
      }
    } catch (err) {
      try { await fh.close(); } catch {}
      throw err;
    }
  },

  async decryptFileToStream(inputPath: string, writable: NodeJS.WritableStream): Promise<void> {
    const stats = await fs.promises.stat(inputPath);
    const fileSize = stats.size;
    if (fileSize < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error("File decryption failed: file too small to contain IV and auth tag");
    }

    const fh = await fs.promises.open(inputPath, "r");
    try {
      const iv = Buffer.alloc(IV_LENGTH);
      await fh.read(iv, 0, IV_LENGTH, 0);

      const authTagBuf = Buffer.alloc(AUTH_TAG_LENGTH);
      await fh.read(authTagBuf, 0, AUTH_TAG_LENGTH, fileSize - AUTH_TAG_LENGTH);
      await fh.close();

      const decipher = crypto.createDecipheriv(ALGORITHM, FILE_KEY, iv);
      decipher.setAuthTag(authTagBuf);

      await new Promise<void>((resolve, reject) => {
        const input = fs.createReadStream(inputPath, { start: IV_LENGTH, end: fileSize - AUTH_TAG_LENGTH - 1 });
        input.pipe(decipher).pipe(writable);

        writable.on("finish", () => resolve());
        writable.on("error", (e) => reject(new Error("File decryption failed: " + e.message)));
        input.on("error", (e) => reject(new Error("File decryption failed: " + e.message)));
        decipher.on("error", () => reject(new Error("File decryption failed: authentication error")));
      });
    } catch (err) {
      try { await fh.close(); } catch {}
      throw err;
    }
  },

  async encryptFileInPlace(filePath: string): Promise<string> {
    const tempPath = `${filePath}.tmp`;
    try {
      await this.encryptFile(filePath, tempPath);
      fs.renameSync(tempPath, filePath);
      return filePath;
    } catch (err) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      throw err;
    }
  },

  async decryptFileInPlace(filePath: string): Promise<void> {
    const tempPath = `${filePath}.tmp`;
    try {
      await this.decryptFile(filePath, tempPath);
      fs.renameSync(tempPath, filePath);
    } catch (err) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      throw err;
    }
  },

  async isFileEncrypted(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(filePath);
      if (stats.size < IV_LENGTH + AUTH_TAG_LENGTH) return false;
      const fh = await fs.promises.open(filePath, "r");
      const iv = Buffer.alloc(IV_LENGTH);
      await fh.read(iv, 0, IV_LENGTH, 0);
      await fh.close();
      return true;
    } catch {
      return false;
    }
  },

  isFileEncryptedSync(filePath: string): boolean {
    try {
      const stats = fs.statSync(filePath);
      return stats.size >= IV_LENGTH + AUTH_TAG_LENGTH;
    } catch {
      return false;
    }
  },
};
