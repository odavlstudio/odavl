/**
 * Redis Configuration
 * Centralized Redis client management
 */

import Redis from 'ioredis';
import logger from '@/lib/logger';

// Singleton Redis client
let redisClient: Redis | null = null;

/**
 * Redis connection options
 */
const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),

    // Connection settings
    connectTimeout: 10000,
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },

    // Keep-alive settings
    keepAlive: 30000,

    // Enable offline queue
    enableOfflineQueue: true,

    // Reconnection settings
    maxRetriesPerRequest: 3,

    // TLS settings (if needed)
    ...(process.env.REDIS_TLS === 'true' && {
        tls: {
            rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false',
        },
    }),
};

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis {
    if (!redisClient) {
        redisClient = new Redis(redisOptions);

        // Connection events
        redisClient.on('connect', () => {
            logger.info('Redis client connected');
        });

        redisClient.on('ready', () => {
            logger.info('Redis client ready');
        });

        redisClient.on('error', (error) => {
            logger.error('Redis client error', { error });
        });

        redisClient.on('close', () => {
            logger.warn('Redis connection closed');
        });

        redisClient.on('reconnecting', () => {
            logger.info('Redis client reconnecting');
        });

        redisClient.on('end', () => {
            logger.warn('Redis connection ended');
            redisClient = null;
        });
    }

    return redisClient;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        logger.info('Redis connection closed gracefully');
    }
}

/**
 * Check Redis connection health
 */
export async function checkRedisHealth(): Promise<boolean> {
    try {
        const client = getRedisClient();
        await client.ping();
        return true;
    } catch (error) {
        logger.error('Redis health check failed', { error });
        return false;
    }
}

/**
 * Redis key patterns for different use cases
 */
export const RedisKeys = {
    // Rate limiting keys
    rateLimit: (identifier: string) => `ratelimit:${identifier}`,
    orgRateLimit: (organizationId: string) => `ratelimit:org:${organizationId}`,
    apiKeyRateLimit: (apiKeyId: string) => `ratelimit:apikey:${apiKeyId}`,
    ipRateLimit: (ip: string) => `ratelimit:ip:${ip}`,

    // Usage tracking keys
    usage: (organizationId: string, period: string) =>
        `usage:${organizationId}:${period}`,
    apiKeyUsage: (apiKeyId: string, period: string) =>
        `usage:apikey:${apiKeyId}:${period}`,

    // Cache keys
    cache: (key: string) => `cache:${key}`,
    userCache: (userId: string) => `cache:user:${userId}`,
    orgCache: (organizationId: string) => `cache:org:${organizationId}`,

    // Session keys
    session: (sessionId: string) => `session:${sessionId}`,

    // Lock keys (for distributed locking)
    lock: (resource: string) => `lock:${resource}`,
};

/**
 * Redis TTL presets
 */
export const RedisTTL = {
    // Rate limiting (1 minute window)
    rateLimit: 120, // 2 minutes to keep history

    // Usage tracking
    hourly: 3600 * 2, // 2 hours
    daily: 86400 * 2, // 2 days
    monthly: 86400 * 35, // 35 days

    // Cache
    shortCache: 300, // 5 minutes
    mediumCache: 1800, // 30 minutes
    longCache: 3600, // 1 hour

    // Session
    session: 86400 * 7, // 7 days

    // Lock
    lock: 30, // 30 seconds
};

/**
 * Graceful shutdown handler
 */
export async function setupRedisShutdown(): Promise<void> {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

    signals.forEach((signal) => {
        process.on(signal, async () => {
            logger.info(`Received ${signal}, closing Redis connection...`);
            await closeRedis();
            process.exit(0);
        });
    });
}

export default {
    getRedisClient,
    closeRedis,
    checkRedisHealth,
    RedisKeys,
    RedisTTL,
    setupRedisShutdown,
};
