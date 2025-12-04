/**
 * Redis Cache Client
 * High-performance caching layer for API responses and computed data
 */

import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),

  // Connection settings
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,

  // Performance settings
  lazyConnect: false,
  keepAlive: 30000,

  // Retry strategy
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },

  // Reconnect on error
  reconnectOnError(err: Error) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Reconnect when Redis is in READONLY mode
      return true;
    }
    return false;
  },
};

// Create Redis clients
export const redis = new Redis(redisConfig);
export const redisSubscriber = new Redis(redisConfig); // For pub/sub

// Track cache metrics
const cacheMetrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
};

/**
 * Cache key prefixes for organization
 */
export const CachePrefix = {
  USER: 'user:',
  ORG: 'org:',
  PROJECT: 'project:',
  INSIGHT: 'insight:',
  AUTOPILOT: 'autopilot:',
  GUARDIAN: 'guardian:',
  SESSION: 'session:',
  RATE_LIMIT: 'ratelimit:',
  API_RESPONSE: 'api:',
} as const;

/**
 * Default cache TTL values (in seconds)
 */
export const CacheTTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 1800,          // 30 minutes
  HOUR: 3600,          // 1 hour
  DAY: 86400,          // 24 hours
  WEEK: 604800,        // 7 days
} as const;

/**
 * Get value from cache
 */
export async function cacheGet<T = any>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);

    if (value === null) {
      cacheMetrics.misses++;
      return null;
    }

    cacheMetrics.hits++;
    return JSON.parse(value) as T;
  } catch (error) {
    cacheMetrics.errors++;
    logger.error('Cache get error', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttl: number = CacheTTL.MEDIUM
): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);
    await redis.setex(key, ttl, serialized);

    cacheMetrics.sets++;
    return true;
  } catch (error) {
    cacheMetrics.errors++;
    logger.error('Cache set error', {
      key,
      ttl,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Delete key from cache
 */
export async function cacheDel(key: string | string[]): Promise<boolean> {
  try {
    const keys = Array.isArray(key) ? key : [key];
    await redis.del(...keys);

    cacheMetrics.deletes += keys.length;
    return true;
  } catch (error) {
    cacheMetrics.errors++;
    logger.error('Cache delete error', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Delete keys by pattern (use carefully!)
 */
export async function cacheDelPattern(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    await redis.del(...keys);
    cacheMetrics.deletes += keys.length;

    logger.info('Cache pattern delete', {
      pattern,
      keysDeleted: keys.length,
    });

    return keys.length;
  } catch (error) {
    cacheMetrics.errors++;
    logger.error('Cache pattern delete error', {
      pattern,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 0;
  }
}

/**
 * Check if key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error('Cache exists check error', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Increment counter (useful for rate limiting)
 */
export async function cacheIncrement(
  key: string,
  ttl?: number
): Promise<number> {
  try {
    const value = await redis.incr(key);

    // Set TTL on first increment
    if (value === 1 && ttl) {
      await redis.expire(key, ttl);
    }

    return value;
  } catch (error) {
    logger.error('Cache increment error', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 0;
  }
}

/**
 * Get or set pattern (fetch from cache or compute)
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CacheTTL.MEDIUM
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);

  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch data
  try {
    const data = await fetchFn();

    // Store in cache for next time
    await cacheSet(key, data, ttl);

    return data;
  } catch (error) {
    logger.error('Cache get-or-set error', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Invalidate cache for an entity (delete all related keys)
 */
export async function invalidateEntity(
  prefix: string,
  entityId: string
): Promise<void> {
  const pattern = `${prefix}${entityId}:*`;
  await cacheDelPattern(pattern);

  logger.info('Cache entity invalidated', {
    prefix,
    entityId,
  });
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const total = cacheMetrics.hits + cacheMetrics.misses;
  const hitRate = total > 0
    ? ((cacheMetrics.hits / total) * 100).toFixed(2) + '%'
    : '0%';

  return {
    hits: cacheMetrics.hits,
    misses: cacheMetrics.misses,
    sets: cacheMetrics.sets,
    deletes: cacheMetrics.deletes,
    errors: cacheMetrics.errors,
    hitRate,
    total,
  };
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<{
  connected: boolean;
  latency: number;
}> {
  try {
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;

    return {
      connected: true,
      latency,
    };
  } catch (error) {
    logger.error('Redis connection test failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      connected: false,
      latency: -1,
    };
  }
}

/**
 * Redis event handlers
 */

redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('ready', () => {
  logger.info('Redis client ready');
});

redis.on('error', (err) => {
  cacheMetrics.errors++;
  logger.error('Redis client error', {
    error: err.message,
  });
});

redis.on('close', () => {
  logger.warn('Redis client connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis client reconnecting...');
});

/**
 * Log cache statistics summary
 */
export function logCacheStats() {
  const stats = getCacheStats();

  logger.info('Cache Statistics', stats);

  // Warn if hit rate is low
  const hitRate = parseFloat(stats.hitRate);
  if (hitRate < 50 && stats.total > 100) {
    logger.warn('Low cache hit rate detected', {
      hitRate: stats.hitRate,
      threshold: '50%',
      recommendation: 'Review cache keys and TTL settings',
    });
  }

  // Warn if error rate is high
  if (stats.errors > 10) {
    logger.error('High cache error rate detected', {
      errors: stats.errors,
      threshold: 10,
    });
  }
}

// Log cache stats every 5 minutes in production
let statsInterval: NodeJS.Timeout | null = null;
if (process.env.NODE_ENV === 'production') {
  statsInterval = setInterval(logCacheStats, 5 * 60 * 1000);
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown() {
  logger.info('Closing Redis connections...');
  logCacheStats();

  // 🔧 P1 Fix: Clear stats interval to prevent memory leak
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }

  try {
    await redis.quit();
    await redisSubscriber.quit();
    logger.info('Redis connections closed successfully');
  } catch (error) {
    logger.error('Error closing Redis connections', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('beforeExit', gracefulShutdown);

/**
 * Pub/Sub utilities for real-time updates
 */

export async function publishEvent(channel: string, data: unknown): Promise<void> {
  try {
    await redis.publish(channel, JSON.stringify(data));

    logger.debug('Event published', {
      channel,
      dataSize: JSON.stringify(data).length,
    });
  } catch (error) {
    logger.error('Failed to publish event', {
      channel,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function subscribeToChannel(
  channel: string,
  handler: (message: string) => void
): Promise<void> {
  try {
    await redisSubscriber.subscribe(channel);

    redisSubscriber.on('message', (ch, message) => {
      if (ch === channel) {
        try {
          const data = JSON.parse(message);
          handler(data);
        } catch (error) {
          logger.error('Failed to parse pub/sub message', {
            channel: ch,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    });

    logger.info('Subscribed to channel', { channel });
  } catch (error) {
    logger.error('Failed to subscribe to channel', {
      channel,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
