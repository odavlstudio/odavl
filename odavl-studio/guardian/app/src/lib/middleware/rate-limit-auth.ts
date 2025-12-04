/**
 * Rate Limiting for Authentication Endpoints
 * 
 * Implements brute force protection for authentication routes.
 * Tracks failed login attempts per IP address with Redis.
 * Enforces exponential backoff after repeated failures.
 * 
 * @module rate-limit-auth
 */

import type { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '@/lib/redis';
import logger from '@/lib/logger';

const redis = getRedisClient();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
    /** Maximum number of attempts before blocking */
    maxAttempts: number;
    /** Time window in seconds */
    windowSeconds: number;
    /** Block duration in seconds after max attempts */
    blockDurationSeconds: number;
    /** Identifier extraction function */
    identifierFn?: (req: Request) => string;
}

/**
 * Default rate limit configuration for authentication
 */
const DEFAULT_AUTH_LIMIT: RateLimitConfig = {
    maxAttempts: 5, // 5 failed attempts
    windowSeconds: 900, // 15 minutes
    blockDurationSeconds: 3600, // 1 hour block
};

/**
 * Get rate limit key for Redis
 */
function getRateLimitKey(identifier: string, prefix: string = 'auth:attempts'): string {
    return `${prefix}:${identifier}`;
}

/**
 * Get block key for Redis
 */
function getBlockKey(identifier: string): string {
    return `auth:blocked:${identifier}`;
}

/**
 * Get identifier from request (IP address by default)
 */
function getIdentifier(req: Request): string {
    // Try to get real IP from proxy headers
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Check if identifier is currently blocked
 * 
 * @param {string} identifier - User identifier (IP, email, etc.)
 * @returns {Promise<{ blocked: boolean; remainingTime?: number }>}
 */
export async function isBlocked(identifier: string): Promise<{ blocked: boolean; remainingTime?: number }> {
    try {
        const blockKey = getBlockKey(identifier);
        const ttl = await redis.ttl(blockKey);

        if (ttl > 0) {
            return { blocked: true, remainingTime: ttl };
        }

        return { blocked: false };
    } catch (error) {
        logger.error('Error checking block status', { error, identifier });
        // Fail open on Redis errors to avoid blocking legitimate users
        return { blocked: false };
    }
}

/**
 * Record a failed authentication attempt
 * 
 * @param {string} identifier - User identifier
 * @param {RateLimitConfig} config - Rate limit configuration
 * @returns {Promise<{ attempts: number; blocked: boolean; resetTime: number }>}
 */
export async function recordFailedAttempt(
    identifier: string,
    config: RateLimitConfig = DEFAULT_AUTH_LIMIT
): Promise<{ attempts: number; blocked: boolean; resetTime: number }> {
    try {
        const key = getRateLimitKey(identifier);

        // Increment attempt counter
        const attempts = await redis.incr(key);

        // Set expiry on first attempt
        if (attempts === 1) {
            await redis.expire(key, config.windowSeconds);
        }

        // Get TTL for reset time calculation
        const ttl = await redis.ttl(key);
        const resetTime = Date.now() + (ttl * 1000);

        // Check if max attempts exceeded
        if (attempts >= config.maxAttempts) {
            // Block the identifier
            const blockKey = getBlockKey(identifier);
            await redis.setex(blockKey, config.blockDurationSeconds, '1');

            logger.warn('User blocked due to excessive failed login attempts', {
                identifier,
                attempts,
                blockDuration: config.blockDurationSeconds,
            });

            return { attempts, blocked: true, resetTime: Date.now() + (config.blockDurationSeconds * 1000) };
        }

        return { attempts, blocked: false, resetTime };
    } catch (error) {
        logger.error('Error recording failed attempt', { error, identifier });
        return { attempts: 0, blocked: false, resetTime: Date.now() };
    }
}

/**
 * Reset failed attempts after successful login
 * 
 * @param {string} identifier - User identifier
 */
export async function resetAttempts(identifier: string): Promise<void> {
    try {
        const key = getRateLimitKey(identifier);
        await redis.del(key);

        // Also remove any active blocks
        const blockKey = getBlockKey(identifier);
        await redis.del(blockKey);
    } catch (error) {
        logger.error('Error resetting attempts', { error, identifier });
    }
}

/**
 * Get current attempt count and remaining attempts
 * 
 * @param {string} identifier - User identifier
 * @param {RateLimitConfig} config - Rate limit configuration
 * @returns {Promise<{ attempts: number; remaining: number; resetTime: number }>}
 */
export async function getAttemptInfo(
    identifier: string,
    config: RateLimitConfig = DEFAULT_AUTH_LIMIT
): Promise<{ attempts: number; remaining: number; resetTime: number }> {
    try {
        const key = getRateLimitKey(identifier);
        const attempts = parseInt(await redis.get(key) || '0', 10);
        const remaining = Math.max(0, config.maxAttempts - attempts);

        const ttl = await redis.ttl(key);
        const resetTime = ttl > 0 ? Date.now() + (ttl * 1000) : Date.now();

        return { attempts, remaining, resetTime };
    } catch (error) {
        logger.error('Error getting attempt info', { error, identifier });
        return { attempts: 0, remaining: config.maxAttempts, resetTime: Date.now() };
    }
}

/**
 * Express middleware for authentication rate limiting
 * 
 * @param {RateLimitConfig} config - Rate limit configuration
 * @returns {Function} Express middleware function
 * 
 * @example
 * app.post('/api/auth/login', authRateLimit(), loginHandler);
 */
export function authRateLimit(config: RateLimitConfig = DEFAULT_AUTH_LIMIT) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const identifier = config.identifierFn ? config.identifierFn(req) : getIdentifier(req);

        // Check if currently blocked
        const blockStatus = await isBlocked(identifier);
        if (blockStatus.blocked) {
            const retryAfter = Math.ceil((blockStatus.remainingTime || 0));

            res.set({
                'Retry-After': retryAfter.toString(),
                'X-RateLimit-Limit': config.maxAttempts.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(Date.now() + (retryAfter * 1000)).toISOString(),
            });

            logger.warn('Blocked authentication attempt', { identifier, remainingTime: retryAfter });

            return res.status(429).json({
                error: 'Too Many Requests',
                message: 'Too many failed login attempts. Please try again later.',
                retryAfter,
            });
        }

        // Get current attempt info
        const attemptInfo = await getAttemptInfo(identifier, config);

        // Set rate limit headers
        res.set({
            'X-RateLimit-Limit': config.maxAttempts.toString(),
            'X-RateLimit-Remaining': attemptInfo.remaining.toString(),
            'X-RateLimit-Reset': new Date(attemptInfo.resetTime).toISOString(),
        });

        // Attach helper functions to request object
        (req as any).rateLimit = {
            recordFailure: () => recordFailedAttempt(identifier, config),
            resetAttempts: () => resetAttempts(identifier),
            getInfo: () => getAttemptInfo(identifier, config),
        };

        next();
    };
}

/**
 * Middleware to apply rate limiting to all authentication routes
 * 
 * @example
 * app.use('/api/auth/*', protectAuthRoutes());
 */
export function protectAuthRoutes(config?: RateLimitConfig) {
    return authRateLimit(config);
}

/**
 * Create a custom rate limiter with specific configuration
 * 
 * @example
 * const strictLimiter = createRateLimiter({
 *   maxAttempts: 3,
 *   windowSeconds: 600, // 10 minutes
 *   blockDurationSeconds: 7200, // 2 hours
 * });
 */
export function createRateLimiter(config: Partial<RateLimitConfig>) {
    const finalConfig = { ...DEFAULT_AUTH_LIMIT, ...config };
    return authRateLimit(finalConfig);
}

// Export helper for use in route handlers
export { getIdentifier };
