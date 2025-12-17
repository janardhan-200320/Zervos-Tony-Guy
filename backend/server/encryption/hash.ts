import crypto from "crypto";

export const HashUtils = {
  hash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  },

  hmac(data: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(data).digest("hex");
  },

  verifyHmac(data: string, signature: string, secret: string): boolean {
    try {
      const expected = this.hmac(data, secret);
      const expectedBuf = Buffer.from(expected, "hex");
      const sigBuf = Buffer.from(signature, "hex");
      if (expectedBuf.length !== sigBuf.length) return false;
      return crypto.timingSafeEqual(expectedBuf, sigBuf);
    } catch {
      return false;
    }
  },
};
