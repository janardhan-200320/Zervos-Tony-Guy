import validator from 'validator';

/**
 * Validation utility for user inputs
 * Prevents invalid data submission and injection attacks
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Email validation
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  if (!validator.isEmail(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
}

/**
 * Phone number validation (international format)
 */
export function validatePhone(phone: string, locale?: validator.MobilePhoneLocale): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }

  const trimmed = phone.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove common formatting characters
  const cleaned = trimmed.replace(/[\s\-\(\)\.]/g, '');

  if (!validator.isMobilePhone(cleaned, locale || 'any', { strictMode: false })) {
    return { isValid: false, error: 'Invalid phone number' };
  }

  return { isValid: true };
}

/**
 * URL validation
 */
export function validateURL(url: string, requireProtocol: boolean = true): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'URL is required' };
  }

  if (!validator.isURL(trimmed, { 
    require_protocol: requireProtocol,
    protocols: ['http', 'https']
  })) {
    return { isValid: false, error: 'Invalid URL format' };
  }

  return { isValid: true };
}

/**
 * File upload validation
 */
export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // MIME types
  allowedExtensions?: string[]; // file extensions
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): ValidationResult {
  const {
    maxSize = 5 * 1024 * 1024, // Default 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  } = options;

  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  // Validate file size
  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(2);
    return { isValid: false, error: `File size must be less than ${maxMB}MB` };
  }

  // Validate MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { isValid: false, error: `File type ${file.type} is not allowed` };
  }

  // Validate file extension
  if (allowedExtensions.length > 0) {
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!allowedExtensions.includes(extension)) {
      return { isValid: false, error: `File extension ${extension} is not allowed` };
    }
  }

  return { isValid: true };
}

/**
 * Password strength validation
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }

  return { isValid: true };
}

/**
 * Credit card validation (basic)
 */
export function validateCreditCard(cardNumber: string): ValidationResult {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return { isValid: false, error: 'Card number is required' };
  }

  const cleaned = cardNumber.replace(/\s/g, '');

  if (!validator.isCreditCard(cleaned)) {
    return { isValid: false, error: 'Invalid card number' };
  }

  return { isValid: true };
}

/**
 * Alphanumeric validation
 */
export function validateAlphanumeric(value: string, allowSpaces: boolean = false): ValidationResult {
  if (!value || typeof value !== 'string') {
    return { isValid: false, error: 'Value is required' };
  }

  const pattern = allowSpaces ? /^[a-zA-Z0-9\s]+$/ : /^[a-zA-Z0-9]+$/;
  
  if (!pattern.test(value)) {
    return { isValid: false, error: 'Only letters and numbers are allowed' };
  }

  return { isValid: true };
}

/**
 * Required field validation
 */
export function validateRequired(value: any, fieldName: string = 'This field'): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
}

/**
 * Length validation
 */
export function validateLength(
  value: string,
  min?: number,
  max?: number
): ValidationResult {
  if (!value || typeof value !== 'string') {
    return { isValid: false, error: 'Value is required' };
  }

  if (min !== undefined && value.length < min) {
    return { isValid: false, error: `Minimum length is ${min} characters` };
  }

  if (max !== undefined && value.length > max) {
    return { isValid: false, error: `Maximum length is ${max} characters` };
  }

  return { isValid: true };
}
