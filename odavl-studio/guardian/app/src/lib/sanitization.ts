/**
 * Input Sanitization Module
 * 
 * Provides comprehensive input sanitization to prevent XSS, injection attacks,
 * and other security vulnerabilities.
 * 
 * @module sanitization
 */

import validator from 'validator';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import logger from './logger';

/**
 * Initialize DOMPurify with JSDOM for server-side usage
 */
const window = new JSDOM('').window;
const purify = createDOMPurify(window);

/**
 * Sanitization configuration
 */
export const SANITIZATION_CONFIG = {
    // HTML sanitization options
    HTML: {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'code', 'pre'],
        ALLOWED_ATTR: ['href', 'title', 'class'],
        ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
    },

    // String sanitization options
    STRING: {
        MAX_LENGTH: 10000,
        TRIM: true,
        ESCAPE_HTML: true,
    },
};

/**
 * Sanitize string input
 * Escapes HTML entities and trims whitespace.
 * 
 * @param {string} input - Input string to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized string
 * 
 * @example
 * const safe = sanitizeInput('<script>alert("XSS")</script>');
 * // Returns: "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
 */
export function sanitizeInput(
    input: string,
    options: {
        maxLength?: number;
        trim?: boolean;
        escapeHtml?: boolean;
    } = {}
): string {
    if (typeof input !== 'string') {
        logger.warn('[Sanitization] Non-string input received', { type: typeof input });
        return '';
    }

    let sanitized = input;

    // Trim whitespace
    if (options.trim !== false) {
        sanitized = sanitized.trim();
    }

    // Escape HTML entities
    if (options.escapeHtml !== false) {
        sanitized = validator.escape(sanitized);
    }

    // Limit length
    const maxLength = options.maxLength || SANITIZATION_CONFIG.STRING.MAX_LENGTH;
    if (sanitized.length > maxLength) {
        logger.warn('[Sanitization] Input truncated', {
            originalLength: sanitized.length,
            maxLength,
        });
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
}

/**
 * Sanitize HTML content
 * Removes dangerous elements and attributes while preserving safe HTML.
 * 
 * @param {string} html - HTML content to sanitize
 * @param {object} options - DOMPurify configuration options
 * @returns {string} Sanitized HTML
 * 
 * @example
 * const safeHtml = sanitizeHtml('<p>Safe content</p><script>alert("XSS")</script>');
 * // Returns: "<p>Safe content</p>"
 */
export function sanitizeHtml(
    html: string,
    options: {
        allowedTags?: string[];
        allowedAttributes?: string[];
    } = {}
): string {
    if (typeof html !== 'string') {
        logger.warn('[Sanitization] Non-string HTML received', { type: typeof html });
        return '';
    }

    const config = {
        ALLOWED_TAGS: options.allowedTags || SANITIZATION_CONFIG.HTML.ALLOWED_TAGS,
        ALLOWED_ATTR: options.allowedAttributes || SANITIZATION_CONFIG.HTML.ALLOWED_ATTR,
        ALLOWED_URI_REGEXP: SANITIZATION_CONFIG.HTML.ALLOWED_URI_REGEXP,
        ALLOW_DATA_ATTR: false,
        ALLOW_ARIA_ATTR: true,
        SAFE_FOR_TEMPLATES: true,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
    };

    const sanitized = String(purify.sanitize(html, config));

    if (sanitized !== html) {
        logger.debug('[Sanitization] HTML content modified', {
            originalLength: html.length,
            sanitizedLength: sanitized.length,
        });
    }

    return sanitized;
}

/**
 * Sanitize object recursively
 * Sanitizes all string values in an object, including nested objects and arrays.
 * 
 * @param {any} obj - Object to sanitize
 * @param {object} options - Sanitization options
 * @returns {any} Sanitized object
 * 
 * @example
 * const safe = sanitizeObject({
 *   name: '<script>alert("XSS")</script>',
 *   details: { bio: 'User bio' }
 * });
 */
export function sanitizeObject(
    obj: any,
    options: {
        maxLength?: number;
        escapeHtml?: boolean;
    } = {}
): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    // Handle strings
    if (typeof obj === 'string') {
        return sanitizeInput(obj, options);
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item, options));
    }

    // Handle objects
    if (typeof obj === 'object') {
        const sanitized: any = {};

        for (const [key, value] of Object.entries(obj)) {
            // Sanitize key
            const safeKey = sanitizeInput(key, { maxLength: 100, escapeHtml: false });

            // Recursively sanitize value
            sanitized[safeKey] = sanitizeObject(value, options);
        }

        return sanitized;
    }

    // Return primitives as-is (numbers, booleans, etc.)
    return obj;
}

/**
 * Sanitize email address
 * Validates and normalizes email addresses.
 * 
 * @param {string} email - Email address to sanitize
 * @returns {string | null} Sanitized email or null if invalid
 * 
 * @example
 * const email = sanitizeEmail(' USER@EXAMPLE.COM ');
 * // Returns: "user@example.com"
 */
export function sanitizeEmail(email: string): string | null {
    if (typeof email !== 'string') {
        return null;
    }

    const trimmed = email.trim().toLowerCase();

    if (!validator.isEmail(trimmed)) {
        logger.warn('[Sanitization] Invalid email address', { email: trimmed });
        return null;
    }

    const normalized = validator.normalizeEmail(trimmed, {
        all_lowercase: true,
        gmail_remove_dots: false,
    });

    return normalized || null;
}

/**
 * Sanitize URL
 * Validates and normalizes URLs.
 * 
 * @param {string} url - URL to sanitize
 * @param {object} options - URL validation options
 * @returns {string | null} Sanitized URL or null if invalid
 * 
 * @example
 * const url = sanitizeUrl('https://example.com/path');
 * // Returns: "https://example.com/path"
 */
export function sanitizeUrl(
    url: string,
    options: {
        protocols?: string[];
        requireProtocol?: boolean;
    } = {}
): string | null {
    if (typeof url !== 'string') {
        return null;
    }

    const trimmed = url.trim();

    const isValid = validator.isURL(trimmed, {
        protocols: options.protocols || ['http', 'https'],
        require_protocol: options.requireProtocol !== false,
        require_valid_protocol: true,
        allow_underscores: false,
        allow_trailing_dot: false,
        allow_protocol_relative_urls: false,
    });

    if (!isValid) {
        logger.warn('[Sanitization] Invalid URL', { url: trimmed });
        return null;
    }

    return trimmed;
}

/**
 * Sanitize filename
 * Removes dangerous characters and path traversal attempts.
 * 
 * @param {string} filename - Filename to sanitize
 * @returns {string} Safe filename
 * 
 * @example
 * const safe = sanitizeFilename('../../../etc/passwd');
 * // Returns: "etc_passwd"
 */
export function sanitizeFilename(filename: string): string {
    if (typeof filename !== 'string') {
        return '';
    }

    // Remove path traversal attempts
    let safe = filename.replaceAll('..', '');

    // Remove path separators
    safe = safe.replaceAll('/', '_').replaceAll('\\', '_');

    // Remove dangerous characters (control chars 0x00-0x1f)
    // eslint-disable-next-line no-control-regex
    safe = safe.replaceAll(/[<>:"|?*\x00-\x1f]/g, '');

    // Limit length
    if (safe.length > 255) {
        const ext = safe.split('.').pop() || '';
        const name = safe.substring(0, 255 - ext.length - 1);
        safe = `${name}.${ext}`;
    }

    return safe || 'unnamed';
}

/**
 * Validate and sanitize integer
 * 
 * @param {any} value - Value to parse as integer
 * @param {object} options - Validation options
 * @returns {number | null} Sanitized integer or null if invalid
 * 
 * @example
 * const num = sanitizeInteger('42', { min: 0, max: 100 });
 * // Returns: 42
 */
export function sanitizeInteger(
    value: any,
    options: {
        min?: number;
        max?: number;
        defaultValue?: number;
    } = {}
): number | null {
    const num = Number.parseInt(String(value), 10);

    if (Number.isNaN(num)) {
        return options.defaultValue ?? null;
    }

    if (options.min !== undefined && num < options.min) {
        logger.warn('[Sanitization] Integer below minimum', { value: num, min: options.min });
        return options.min;
    }

    if (options.max !== undefined && num > options.max) {
        logger.warn('[Sanitization] Integer above maximum', { value: num, max: options.max });
        return options.max;
    }

    return num;
}
