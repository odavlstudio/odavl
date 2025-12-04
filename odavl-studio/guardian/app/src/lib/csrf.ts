/**
 * CSRF Protection Module
 * 
 * Provides Cross-Site Request Forgery protection using cryptographic tokens.
 * Tokens are stored in HTTP-only cookies and validated on state-changing requests.
 * 
 * @module csrf
 */

import crypto from 'crypto';
import { cookies } from 'next/headers';
import logger from './logger';

/**
 * CSRF token configuration
 */
export const CSRF_CONFIG = {
    COOKIE_NAME: 'csrfToken',
    TOKEN_LENGTH: 32, // bytes (256 bits)
    TOKEN_TTL: 3600, // seconds (1 hour)
    COOKIE_OPTIONS: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/',
        maxAge: 3600, // 1 hour
    },
};

/**
 * Generate a cryptographically secure CSRF token
 * 
 * @returns {string} Base64-encoded random token
 * 
 * @example
 * const token = generateCsrfToken();
 * // Returns: "Xq8kF3nP2vL9..."
 */
export function generateCsrfToken(): string {
    const buffer = crypto.randomBytes(CSRF_CONFIG.TOKEN_LENGTH);
    const token = buffer.toString('base64url'); // URL-safe base64

    logger.debug('[CSRF] Generated new token', { tokenLength: token.length });

    return token;
}

/**
 * Validate CSRF token using timing-safe comparison
 * 
 * @param {string} token - Token to validate
 * @param {string} expected - Expected token value
 * @returns {boolean} True if tokens match
 * 
 * @example
 * const isValid = validateCsrfToken(requestToken, storedToken);
 * if (!isValid) {
 *   throw new Error('CSRF token mismatch');
 * }
 */
export function validateCsrfToken(token: string, expected: string): boolean {
    if (!token || !expected) {
        logger.warn('[CSRF] Validation failed - missing token', {
            hasToken: !!token,
            hasExpected: !!expected,
        });
        return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    try {
        const tokenBuffer = Buffer.from(token, 'base64url');
        const expectedBuffer = Buffer.from(expected, 'base64url');

        if (tokenBuffer.length !== expectedBuffer.length) {
            logger.warn('[CSRF] Validation failed - length mismatch');
            return false;
        }

        const isValid = crypto.timingSafeEqual(tokenBuffer, expectedBuffer);

        if (!isValid) {
            logger.warn('[CSRF] Validation failed - token mismatch');
        }

        return isValid;
    } catch (error) {
        logger.error('[CSRF] Validation error', { error });
        return false;
    }
}

/**
 * Get CSRF token from cookies
 * 
 * @returns {string | null} Token value or null if not found
 */
export async function getCsrfTokenFromCookies(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(CSRF_CONFIG.COOKIE_NAME)?.value;

    if (!token) {
        logger.debug('[CSRF] No token found in cookies');
    }

    return token || null;
}

/**
 * Set CSRF token in HTTP-only cookie
 * 
 * @param {string} token - Token to store
 */
export async function setCsrfTokenCookie(token: string): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.set(CSRF_CONFIG.COOKIE_NAME, token, CSRF_CONFIG.COOKIE_OPTIONS);

    logger.debug('[CSRF] Token stored in cookie');
}

/**
 * Get or create CSRF token
 * Returns existing token from cookie or generates a new one.
 * 
 * @returns {Promise<string>} CSRF token
 * 
 * @example
 * // In API route or page component
 * const token = await getOrCreateCsrfToken();
 * // Use token in forms or headers
 */
export async function getOrCreateCsrfToken(): Promise<string> {
    let token = await getCsrfTokenFromCookies();

    if (!token) {
        token = generateCsrfToken();
        await setCsrfTokenCookie(token);
        logger.info('[CSRF] Created new token');
    }

    return token;
}

/**
 * Verify CSRF token from request
 * Checks X-CSRF-Token header against stored cookie value.
 * 
 * @param {Request} request - Next.js request object
 * @returns {Promise<boolean>} True if token is valid
 * 
 * @example
 * // In API route handler
 * export async function POST(request: Request) {
 *   if (!await verifyCsrfToken(request)) {
 *     return Response.json({ error: 'Invalid CSRF token' }, { status: 403 });
 *   }
 *   // Process request...
 * }
 */
export async function verifyCsrfToken(request: Request): Promise<boolean> {
    // Get token from header
    const headerToken = request.headers.get('x-csrf-token');

    if (!headerToken) {
        logger.warn('[CSRF] Verification failed - no header token');
        return false;
    }

    // Get expected token from cookie
    const expectedToken = await getCsrfTokenFromCookies();

    if (!expectedToken) {
        logger.warn('[CSRF] Verification failed - no cookie token');
        return false;
    }

    // Validate tokens match
    const isValid = validateCsrfToken(headerToken, expectedToken);

    if (isValid) {
        logger.debug('[CSRF] Token verified successfully');
    }

    return isValid;
}

/**
 * Refresh CSRF token
 * Generates and stores a new token, replacing the existing one.
 * Should be called after successful authentication or periodically.
 * 
 * @returns {Promise<string>} New CSRF token
 * 
 * @example
 * // After successful login
 * const newToken = await refreshCsrfToken();
 * return Response.json({ token: newToken });
 */
export async function refreshCsrfToken(): Promise<string> {
    const token = generateCsrfToken();
    await setCsrfTokenCookie(token);

    logger.info('[CSRF] Token refreshed');

    return token;
}
