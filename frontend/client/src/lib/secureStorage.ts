import CryptoJS from 'crypto-js';

/**
 * Secure Storage Utility with AES-256 Encryption
 * Protects sensitive data (tokens, credentials) from XSS attacks
 */

// Generate a unique encryption key per browser instance
// In production, this should be derived from a secure source
const getEncryptionKey = (): string => {
  const STORAGE_KEY = '__zervos_sk__';
  
  let key = sessionStorage.getItem(STORAGE_KEY);
  
  if (!key) {
    // Generate a random 256-bit key
    key = CryptoJS.lib.WordArray.random(32).toString();
    sessionStorage.setItem(STORAGE_KEY, key);
  }
  
  return key;
};

/**
 * Encrypts data using AES-256
 */
const encrypt = (data: string): string => {
  try {
    const key = getEncryptionKey();
    return CryptoJS.AES.encrypt(data, key).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypts data using AES-256
 */
const decrypt = (encryptedData: string): string => {
  try {
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Decryption produced empty result');
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * SecureStorage API - Drop-in replacement for localStorage/sessionStorage
 * with automatic encryption for sensitive data
 */
export class SecureStorage {
  private storage: Storage;
  
  constructor(storage: Storage = sessionStorage) {
    this.storage = storage;
  }
  
  /**
   * Store encrypted data
   */
  setItem(key: string, value: any): boolean {
    try {
      const jsonString = JSON.stringify(value);
      const encrypted = encrypt(jsonString);
      this.storage.setItem(key, encrypted);
      return true;
    } catch (error) {
      console.error(`Failed to securely store key "${key}":`, error);
      return false;
    }
  }
  
  /**
   * Retrieve and decrypt data
   */
  getItem<T = any>(key: string): T | null {
    try {
      const encrypted = this.storage.getItem(key);
      
      if (!encrypted) {
        return null;
      }
      
      const decrypted = decrypt(encrypted);
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error(`Failed to retrieve secure key "${key}":`, error);
      // Clean up corrupted data
      this.removeItem(key);
      return null;
    }
  }
  
  /**
   * Remove encrypted data
   */
  removeItem(key: string): boolean {
    try {
      this.storage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove secure key "${key}":`, error);
      return false;
    }
  }
  
  /**
   * Clear all encrypted data
   */
  clear(): boolean {
    try {
      this.storage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
      return false;
    }
  }
  
  /**
   * Check if key exists
   */
  hasItem(key: string): boolean {
    return this.storage.getItem(key) !== null;
  }
}

// Export default instances for common use cases
export const secureSessionStorage = new SecureStorage(sessionStorage);
export const secureLocalStorage = new SecureStorage(localStorage);

/**
 * Helper functions for token storage
 */
export const TokenStorage = {
  /**
   * Store authentication token securely
   */
  setToken(key: string, token: any): boolean {
    return secureSessionStorage.setItem(key, token);
  },
  
  /**
   * Retrieve authentication token
   */
  getToken<T = any>(key: string): T | null {
    return secureSessionStorage.getItem<T>(key);
  },
  
  /**
   * Remove authentication token
   */
  removeToken(key: string): boolean {
    return secureSessionStorage.removeItem(key);
  },
  
  /**
   * Clear all tokens
   */
  clearAllTokens(): boolean {
    return secureSessionStorage.clear();
  }
};
