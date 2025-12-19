import DOMPurify, { type Config as DomPurifyConfig } from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - The unsanitized HTML string
 * @param options - Optional DOMPurify configuration
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(
  dirty: string | undefined | null,
  options?: DomPurifyConfig
): string {
  if (!dirty) return '';

  const sanitized = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span',
      'div', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
    ...options,
  });

  // DOMPurify returns string | TrustedHTML; we only emit string to avoid type narrowing issues
  return typeof sanitized === 'string' ? sanitized : String(sanitized);
}

/**
 * Sanitizes text content by removing all HTML tags
 * Use this for plain text fields that should never contain HTML
 * @param dirty - The unsanitized text
 * @returns Plain text with all HTML removed
 */
export function sanitizeText(dirty: string | undefined | null): string {
  if (!dirty) return '';

  const sanitized = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  return typeof sanitized === 'string' ? sanitized : String(sanitized);
}

/**
 * React hook for sanitizing HTML in dangerouslySetInnerHTML
 * @param html - The HTML string to sanitize
 * @returns Object compatible with dangerouslySetInnerHTML
 */
export function useSanitizedHtml(html: string | undefined | null) {
  return {
    __html: sanitizeHtml(html),
  };
}

/**
 * Sanitizes URL to prevent javascript: and data: URI XSS attacks
 * @param url - The URL to validate and sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeURL(url: string | undefined | null): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return url;
  } catch {
    // Invalid URL format
    return '';
  }
}

/**
 * Escapes special characters for safe display in HTML context
 * @param str - The string to escape
 * @returns Escaped string safe for HTML display
 */
export function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
