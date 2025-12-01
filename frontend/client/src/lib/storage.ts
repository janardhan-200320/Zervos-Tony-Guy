/**
 * Safe localStorage utilities to prevent runtime errors from corrupt data
 */

export function safeGetItem<T = any>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    try {
      const parsed = JSON.parse(item);
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch (parseError) {
      console.warn(`Failed to parse localStorage key "${key}":`, parseError);
      return fallback;
    }
  } catch (storageError) {
    console.warn(`Failed to access localStorage key "${key}":`, storageError);
    return fallback;
  }
}

export function safeSetItem(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to save to localStorage key "${key}":`, error);
    return false;
  }
}

export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove localStorage key "${key}":`, error);
    return false;
  }
}

export function safeClear(): boolean {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
    return false;
  }
}
