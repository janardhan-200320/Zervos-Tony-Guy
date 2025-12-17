import validator from "validator";
import sanitizeHtml from "sanitize-html";

/**
 * Sanitization and validation utilities for input protection
 */

export const InputValidation = {
  /**
   * Validate and sanitize username
   * - 3-32 characters
   * - Alphanumeric, underscores, hyphens only
   */
  sanitizeUsername(input: string): { isValid: boolean; value: string; error?: string } {
    if (!input || typeof input !== "string") {
      return { isValid: false, value: "", error: "Username must be a string" };
    }

    const trimmed = input.trim();

    if (trimmed.length < 3 || trimmed.length > 32) {
      return {
        isValid: false,
        value: "",
        error: "Username must be between 3 and 32 characters",
      };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return {
        isValid: false,
        value: "",
        error: "Username can only contain letters, numbers, underscores, and hyphens",
      };
    }

    return { isValid: true, value: trimmed };
  },

  /**
   * Validate and sanitize email
   */
  sanitizeEmail(input: string): { isValid: boolean; value: string; error?: string } {
    if (!input || typeof input !== "string") {
      return { isValid: false, value: "", error: "Email must be a string" };
    }

    const trimmed = input.trim().toLowerCase();

    if (!validator.isEmail(trimmed)) {
      return { isValid: false, value: "", error: "Invalid email format" };
    }

    // Normalize email
    const normalized = validator.normalizeEmail(trimmed, {
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
    });

    if (!normalized) {
      return { isValid: false, value: "", error: "Email normalization failed" };
    }

    return { isValid: true, value: normalized };
  },

  /**
   * Validate and sanitize password
   * - Minimum 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character
   */
  sanitizePassword(input: string): { isValid: boolean; error?: string } {
    if (!input || typeof input !== "string") {
      return { isValid: false, error: "Password must be a string" };
    }

    if (input.length < 8) {
      return { isValid: false, error: "Password must be at least 8 characters long" };
    }

    if (input.length > 128) {
      return { isValid: false, error: "Password must not exceed 128 characters" };
    }

    if (!/[A-Z]/.test(input)) {
      return {
        isValid: false,
        error: "Password must contain at least one uppercase letter",
      };
    }

    if (!/[a-z]/.test(input)) {
      return {
        isValid: false,
        error: "Password must contain at least one lowercase letter",
      };
    }

    if (!/[0-9]/.test(input)) {
      return { isValid: false, error: "Password must contain at least one number" };
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(input)) {
      return {
        isValid: false,
        error: "Password must contain at least one special character",
      };
    }

    return { isValid: true };
  },

  /**
   * Sanitize text input (removes HTML tags, trims whitespace)
   */
  sanitizeText(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== "string") {
      return "";
    }

    // Remove HTML tags
    let sanitized = sanitizeHtml(input, { allowedTags: [] });

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  },

  /**
   * Sanitize rich HTML (allows safe tags like b, i, em, strong, p, br, ul, li)
   */
  sanitizeRichHTML(input: string, maxLength: number = 5000): string {
    if (!input || typeof input !== "string") {
      return "";
    }

    const sanitized = sanitizeHtml(input, {
      allowedTags: [
        "b",
        "i",
        "em",
        "strong",
        "p",
        "br",
        "ul",
        "li",
        "ol",
        "a",
        "h1",
        "h2",
        "h3",
      ],
      allowedAttributes: {
        a: ["href", "title"],
      },
      allowedIframeHostnames: [],
    });

    // Limit length
    if (sanitized.length > maxLength) {
      return sanitized.substring(0, maxLength);
    }

    return sanitized;
  },

  /**
   * Validate URL
   */
  sanitizeURL(input: string): { isValid: boolean; value: string; error?: string } {
    if (!input || typeof input !== "string") {
      return { isValid: false, value: "", error: "URL must be a string" };
    }

    const trimmed = input.trim();

    if (!validator.isURL(trimmed, { protocols: ["http", "https"], require_protocol: true })) {
      return { isValid: false, value: "", error: "Invalid URL format" };
    }

    return { isValid: true, value: trimmed };
  },

  /**
   * Validate phone number (basic international format)
   */
  sanitizePhoneNumber(input: string): { isValid: boolean; value: string; error?: string } {
    if (!input || typeof input !== "string") {
      return { isValid: false, value: "", error: "Phone number must be a string" };
    }

    const trimmed = input.replace(/\s/g, "");

    if (!validator.isMobilePhone(trimmed)) {
      return { isValid: false, value: "", error: "Invalid phone number format" };
    }

    return { isValid: true, value: trimmed };
  },

  /**
   * Validate number within range
   */
  validateNumber(
    input: any,
    min: number = 0,
    max: number = 1000
  ): { isValid: boolean; value?: number; error?: string } {
    const num = Number(input);

    if (isNaN(num)) {
      return { isValid: false, error: "Input must be a number" };
    }

    if (num < min || num > max) {
      return {
        isValid: false,
        error: `Number must be between ${min} and ${max}`,
      };
    }

    return { isValid: true, value: num };
  },

  /**
   * Sanitize object by removing null/undefined and trimming strings
   */
  sanitizeObject<T extends Record<string, any>>(obj: T): Partial<T> {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (typeof value === "string") {
        sanitized[key] = value.trim();
      } else if (typeof value === "object" && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  },

  /**
   * Escape string for safe database queries (prevent SQL injection)
   */
  escapeSqlString(input: string): string {
    if (!input || typeof input !== "string") {
      return "";
    }

    return input.replace(/'/g, "''").replace(/\\/g, "\\\\");
  },

  /**
   * Validate UUID v4 format
   * Prevents SQL injection through ID parameters
   */
  validateUUID(input: string): { isValid: boolean; error?: string } {
    if (!input || typeof input !== "string") {
      return { isValid: false, error: "UUID must be a string" };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(input)) {
      return { isValid: false, error: "Invalid UUID format" };
    }

    return { isValid: true };
  },
};

/**
 * Validation schemas for common input types
 */
export const ValidationSchemas = {
  username: (input: string) => {
    const result = InputValidation.sanitizeUsername(input);
    if (!result.isValid) throw new Error(result.error);
    return result.value;
  },

  email: (input: string) => {
    const result = InputValidation.sanitizeEmail(input);
    if (!result.isValid) throw new Error(result.error);
    return result.value;
  },

  password: (input: string) => {
    const result = InputValidation.sanitizePassword(input);
    if (!result.isValid) throw new Error(result.error);
    return input;
  },

  url: (input: string) => {
    const result = InputValidation.sanitizeURL(input);
    if (!result.isValid) throw new Error(result.error);
    return result.value;
  },

  phoneNumber: (input: string) => {
    const result = InputValidation.sanitizePhoneNumber(input);
    if (!result.isValid) throw new Error(result.error);
    return result.value;
  },
};
