/**
 * Request Signing Module
 * 
 * Provides HMAC-SHA256 request signing for API key authentication.
 * Prevents replay attacks and ensures request integrity.
 * 
 * @module request-signing
 */

import crypto from 'crypto';
import logger from './logger';

/**
 * Signing configuration
 */
export const SIGNING_CONFIG = {
    ALGORITHM: 'sha256',
    TIMESTAMP_WINDOW: 300, // 5 minutes (in seconds)
    NONCE_TTL: 600, // 10 minutes (in seconds)
};

/**
 * In-memory nonce store
 * TODO: Replace with Redis for distributed systems
 */
const nonceStore = new Map<string, number>();

/**
 * Sign request with HMAC-SHA256
 * 
 * @param {object} params - Signing parameters
 * @returns {string} HMAC signature
 * 
 * @example
 * const signature = signRequest({
 *   method: 'POST',
 *   path: '/api/users',
 *   body: JSON.stringify({ name: 'John' }),
 *   timestamp: Date.now(),
 *   nonce: 'random-value',
 *   secretKey: 'api-secret-key',
 * });
 */
export function signRequest(params: {
    method: string;
    path: string;
    body?: string;
    timestamp: number;
    nonce: string;
    secretKey: string;
}): string {
    const { method, path, body, timestamp, nonce, secretKey } = params;

    // Create message to sign
    const message = [
        method.toUpperCase(),
        path,
        timestamp.toString(),
        nonce,
        body || '',
    ].join('\n');

    // Generate HMAC-SHA256 signature
    const hmac = crypto.createHmac(SIGNING_CONFIG.ALGORITHM, secretKey);
    hmac.update(message);
    const signature = hmac.digest('base64');

    logger.debug('[RequestSigning] Signed request', {
        method,
        path,
        timestamp,
        signatureLength: signature.length,
    });

    return signature;
}

/**
 * Validate request signature
 * 
 * @param {object} params - Validation parameters
 * @returns {object} Validation result
 * 
 * @example
 * const { valid, error } = validateSignature({
 *   method: 'POST',
 *   path: '/api/users',
 *   body: requestBody,
 *   signature: request.headers.get('x-signature'),
 *   timestamp: Number(request.headers.get('x-timestamp')),
 *   nonce: request.headers.get('x-nonce'),
 *   secretKey: apiKey.secret,
 * });
 */
export function validateSignature(params: {
    method: string;
    path: string;
    body?: string;
    signature: string | null;
    timestamp: number;
    nonce: string | null;
    secretKey: string;
}): { valid: boolean; error?: string } {
    const { method, path, body, signature, timestamp, nonce, secretKey } = params;

    // Check required fields
    if (!signature) {
        logger.warn('[RequestSigning] Missing signature');
        return { valid: false, error: 'Missing signature header' };
    }

    if (!nonce) {
        logger.warn('[RequestSigning] Missing nonce');
        return { valid: false, error: 'Missing nonce header' };
    }

    if (!timestamp || Number.isNaN(timestamp)) {
        logger.warn('[RequestSigning] Invalid timestamp');
        return { valid: false, error: 'Invalid timestamp header' };
    }

    // Check timestamp window (prevent replay attacks)
    const now = Date.now();
    const diff = Math.abs(now - timestamp);

    if (diff > SIGNING_CONFIG.TIMESTAMP_WINDOW * 1000) {
        logger.warn('[RequestSigning] Timestamp out of window', {
            timestamp,
            now,
            diff,
            window: SIGNING_CONFIG.TIMESTAMP_WINDOW,
        });
        return { valid: false, error: 'Request timestamp expired' };
    }

    // Check nonce (prevent replay attacks)
    if (nonceStore.has(nonce)) {
        logger.warn('[RequestSigning] Nonce already used (replay attack)', { nonce });
        return { valid: false, error: 'Nonce already used' };
    }

    // Compute expected signature
    const expectedSignature = signRequest({
        method,
        path,
        body,
        timestamp,
        nonce,
        secretKey,
    });

    // Timing-safe comparison
    try {
        const signatureBuffer = Buffer.from(signature, 'base64');
        const expectedBuffer = Buffer.from(expectedSignature, 'base64');

        if (signatureBuffer.length !== expectedBuffer.length) {
            logger.warn('[RequestSigning] Signature length mismatch');
            return { valid: false, error: 'Invalid signature' };
        }

        const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

        if (isValid) {
            // Store nonce to prevent replay
            nonceStore.set(nonce, Date.now());

            logger.info('[RequestSigning] Signature validated successfully');

            return { valid: true };
        } else {
            logger.warn('[RequestSigning] Signature mismatch');
            return { valid: false, error: 'Invalid signature' };
        }
    } catch (error) {
        logger.error('[RequestSigning] Validation error', { error });
        return { valid: false, error: 'Signature validation failed' };
    }
}

/**
 * Clean up expired nonces
 * Should be called periodically (e.g., every minute)
 */
export function cleanupNonces(): void {
    const now = Date.now();
    const ttl = SIGNING_CONFIG.NONCE_TTL * 1000;
    let cleaned = 0;

    for (const [nonce, timestamp] of nonceStore.entries()) {
        if (now - timestamp > ttl) {
            nonceStore.delete(nonce);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        logger.debug('[RequestSigning] Cleaned up expired nonces', { cleaned });
    }
}

/**
 * Generate random nonce
 * 
 * @returns {string} Base64-encoded random nonce
 */
export function generateNonce(): string {
    return crypto.randomBytes(16).toString('base64url');
}

/**
 * Middleware for request signature validation
 * 
 * @example
 * // In API route
 * export async function POST(request: Request) {
 *   const validation = await validateRequestSignature(request, apiKey.secret);
 *   if (!validation.valid) {
 *     return Response.json({ error: validation.error }, { status: 401 });
 *   }
 *   // Process request...
 * }
 */
export async function validateRequestSignature(
    request: Request,
    secretKey: string
): Promise<{ valid: boolean; error?: string }> {
    const signature = request.headers.get('x-signature');
    const timestamp = Number(request.headers.get('x-timestamp'));
    const nonce = request.headers.get('x-nonce');

    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname + url.search;

    // Get body for POST/PUT/PATCH
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
            body = await request.text();
        } catch (error) {
            logger.error('[RequestSigning] Failed to read request body', { error });
            return { valid: false, error: 'Failed to read request body' };
        }
    }

    return validateSignature({
        method,
        path,
        body,
        signature,
        timestamp,
        nonce,
        secretKey,
    });
}

// Cleanup nonces every minute
setInterval(cleanupNonces, 60000);
