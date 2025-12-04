/**
 * Rate Limiting Middleware
 * Implements rate limiting using Redis and sliding window algorithm
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/redis';

/**
 * Sliding window rate limiter
 */
export async function checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number = 60
): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
    total: number;
}> {
    try {
        const client = getRedisClient();
        const now = Date.now();
        const windowStart = now - windowSeconds * 1000;
        const key = `ratelimit:${identifier}`;

        // Remove old entries
        await client.zremrangebyscore(key, 0, windowStart);

        // Count requests in current window
        const requestCount = await client.zcard(key);

        if (requestCount >= limit) {
            // Rate limit exceeded
            const oldestRequest = await client.zrange(key, 0, 0, 'WITHSCORES');
            const resetTime = oldestRequest.length > 0
                ? Number.parseInt(oldestRequest[1]) + windowSeconds * 1000
                : now + windowSeconds * 1000;

            return {
                allowed: false,
                remaining: 0,
                reset: Math.ceil(resetTime / 1000),
                total: limit,
            };
        }

        // Add current request
        await client.zadd(key, now, `${now}-${Math.random()}`);
        await client.expire(key, windowSeconds * 2); // Set expiration

        return {
            allowed: true,
            remaining: limit - requestCount - 1,
            reset: Math.ceil((now + windowSeconds * 1000) / 1000),
            total: limit,
        };
    } catch (error) {
        logger.error('Rate limit check failed', { error, identifier });
        // On error, allow request (fail open)
        return {
            allowed: true,
            remaining: 0,
            reset: 0,
            total: limit,
        };
    }
}

/**
 * Organization-based rate limiter
 */
export async function checkOrganizationRateLimit(
    organizationId: string
): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
    total: number;
    tier: string;
}> {
    try {
        // Get organization tier
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { tier: true },
        });

        if (!organization) {
            return {
                allowed: false,
                remaining: 0,
                reset: 0,
                total: 0,
                tier: 'unknown',
            };
        }

        // Tier-based limits (requests per minute)
        const limits: Record<string, number> = {
            free: 60,
            pro: 300,
            enterprise: 1000,
        };

        const limit = limits[organization.tier] || 60;
        const result = await checkRateLimit(`org:${organizationId}`, limit, 60);

        return {
            ...result,
            tier: organization.tier,
        };
    } catch (error) {
        logger.error('Organization rate limit check failed', { error, organizationId });
        return {
            allowed: true,
            remaining: 0,
            reset: 0,
            total: 0,
            tier: 'unknown',
        };
    }
}

/**
 * API key-based rate limiter
 */
export async function checkApiKeyRateLimit(
    apiKey: string
): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
    total: number;
    organizationId?: string;
}> {
    try {
        // Get API key details
        const key = await prisma.apiKey.findUnique({
            where: { keyHash: apiKey },
            select: {
                id: true,
                rateLimit: true,
                enabled: true,
                organizationId: true,
            },
        });

        if (!key?.enabled) {
            return {
                allowed: false,
                remaining: 0,
                reset: 0,
                total: 0,
            };
        }

        const result = await checkRateLimit(`apikey:${key.id}`, key.rateLimit, 60);

        // Update last used
        await prisma.apiKey.update({
            where: { id: key.id },
            data: {
                lastUsedAt: new Date(),
                usageCount: { increment: 1 },
            },
        });

        return {
            ...result,
            organizationId: key.organizationId,
        };
    } catch (error) {
        logger.error('API key rate limit check failed', { error });
        return {
            allowed: false,
            remaining: 0,
            reset: 0,
            total: 0,
        };
    }
}

/**
 * Rate limiting middleware for Next.js routes
 */
export async function rateLimitMiddleware(
    request: NextRequest,
    options: {
        type: 'organization' | 'apikey' | 'ip';
        identifier?: string;
        limit?: number;
        windowSeconds?: number;
    }
): Promise<NextResponse | null> {
    try {
        let result: {
            allowed: boolean;
            remaining: number;
            reset: number;
            total: number;
        };

        if (options.type === 'organization' && options.identifier) {
            result = await checkOrganizationRateLimit(options.identifier);
        } else if (options.type === 'apikey' && options.identifier) {
            result = await checkApiKeyRateLimit(options.identifier);
        } else if (options.type === 'ip') {
            const ip = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown';
            const limit = options.limit || 100;
            const windowSeconds = options.windowSeconds || 60;
            result = await checkRateLimit(`ip:${ip}`, limit, windowSeconds);
        } else {
            // Default: allow
            return null;
        }

        // Add rate limit headers
        const headers = new Headers();
        headers.set('X-RateLimit-Limit', result.total.toString());
        headers.set('X-RateLimit-Remaining', result.remaining.toString());
        headers.set('X-RateLimit-Reset', result.reset.toString());

        if (!result.allowed) {
            logger.warn('Rate limit exceeded', {
                type: options.type,
                identifier: options.identifier,
            });

            return NextResponse.json(
                {
                    success: false,
                    error: 'Rate limit exceeded',
                    message: `Too many requests. Please try again after ${new Date(result.reset * 1000).toISOString()}`,
                    rateLimit: {
                        limit: result.total,
                        remaining: result.remaining,
                        reset: result.reset,
                    },
                },
                {
                    status: 429,
                    headers,
                }
            );
        }

        // Rate limit passed - continue with headers
        return null;
    } catch (error) {
        logger.error('Rate limiting middleware error', { error });
        // On error, allow request
        return null;
    }
}

/**
 * Get rate limit status
 */
export async function getRateLimitStatus(
    type: 'organization' | 'apikey',
    identifier: string
) {
    try {
        if (type === 'organization') {
            return await checkOrganizationRateLimit(identifier);
        } else if (type === 'apikey') {
            return await checkApiKeyRateLimit(identifier);
        }
        return null;
    } catch (error) {
        logger.error('Failed to get rate limit status', { error });
        return null;
    }
}

/**
 * Reset rate limit for identifier
 */
export async function resetRateLimit(identifier: string): Promise<boolean> {
    try {
        const client = getRedisClient();
        const key = `ratelimit:${identifier}`;
        await client.del(key);
        logger.info('Rate limit reset', { identifier });
        return true;
    } catch (error) {
        logger.error('Failed to reset rate limit', { error, identifier });
        return false;
    }
}

/**
 * Close Redis connection (deprecated - use closeRedis from @/lib/redis)
 * @deprecated Use closeRedis from @/lib/redis instead
 */
export async function closeRedisConnection() {
    logger.warn('closeRedisConnection is deprecated, use closeRedis from @/lib/redis');
}
