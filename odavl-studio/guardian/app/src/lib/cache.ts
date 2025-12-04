import Redis from 'ioredis';
import logger from './logger';

// Redis client singleton
let redisClient: Redis | null = null;

/**
 * Get Redis client instance (singleton pattern)
 */
export function getRedisClient(): Redis {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        redisClient = new Redis(redisUrl, {
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true // Don't connect until first operation
        });

        redisClient.on('connect', () => {
            logger.info('[Redis] Connected successfully');
        });

        redisClient.on('error', (err) => {
            logger.error('[Redis] Connection error:', err);
        });

        redisClient.on('close', () => {
            logger.warn('[Redis] Connection closed');
        });

        redisClient.on('reconnecting', () => {
            logger.info('[Redis] Reconnecting...');
        });
    }

    return redisClient;
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
    try {
        const client = getRedisClient();
        await client.ping();
        return true;
    } catch (error) {
        logger.error('[Redis] Health check failed:', error);
        return false;
    }
}

/**
 * Disconnect Redis client (useful for cleanup)
 */
export async function disconnectRedis(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        logger.info('[Redis] Disconnected');
    }
}

// ===== CACHE CONFIGURATION =====

export interface CacheConfig {
    ttl?: number; // seconds (default: 300 = 5 minutes)
    prefix?: string; // key prefix (default: 'guardian')
}

const DEFAULT_TTL = 300; // 5 minutes
const DEFAULT_PREFIX = 'guardian';

/**
 * Generate cache key with prefix
 */
function generateKey(key: string, prefix: string = DEFAULT_PREFIX): string {
    return `${prefix}:${key}`;
}

// ===== CACHE OPERATIONS =====

/**
 * Get value from cache
 * @returns Parsed value or null if not found/error
 */
export async function cacheGet<T = unknown>(
    key: string,
    config: CacheConfig = {}
): Promise<T | null> {
    try {
        const client = getRedisClient();
        const fullKey = generateKey(key, config.prefix);
        const value = await client.get(fullKey);

        if (!value) {
            return null;
        }

        return JSON.parse(value) as T;
    } catch (error) {
        logger.error(`[Cache] Failed to get key "${key}":`, error);
        return null;
    }
}

/**
 * Set value in cache
 * @param ttl Time-to-live in seconds (default: 300)
 */
export async function cacheSet<T = unknown>(
    key: string,
    value: T,
    config: CacheConfig = {}
): Promise<boolean> {
    try {
        const client = getRedisClient();
        const fullKey = generateKey(key, config.prefix);
        const ttl = config.ttl ?? DEFAULT_TTL;
        const serialized = JSON.stringify(value);

        await client.set(fullKey, serialized, 'EX', ttl);
        return true;
    } catch (error) {
        logger.error(`[Cache] Failed to set key "${key}":`, error);
        return false;
    }
}

/**
 * Delete key from cache
 */
export async function cacheDelete(
    key: string,
    config: CacheConfig = {}
): Promise<boolean> {
    try {
        const client = getRedisClient();
        const fullKey = generateKey(key, config.prefix);
        await client.del(fullKey);
        return true;
    } catch (error) {
        logger.error(`[Cache] Failed to delete key "${key}":`, error);
        return false;
    }
}

/**
 * Delete multiple keys matching a pattern
 * @param pattern Glob pattern (e.g., "user:*")
 */
export async function cacheDeletePattern(
    pattern: string,
    config: CacheConfig = {}
): Promise<number> {
    try {
        const client = getRedisClient();
        const fullPattern = generateKey(pattern, config.prefix);

        // Use SCAN to avoid blocking Redis
        const keys: string[] = [];
        let cursor = '0';

        do {
            const [newCursor, foundKeys] = await client.scan(
                cursor,
                'MATCH',
                fullPattern,
                'COUNT',
                100
            );
            cursor = newCursor;
            keys.push(...foundKeys);
        } while (cursor !== '0');

        if (keys.length > 0) {
            await client.del(...keys);
        }

        return keys.length;
    } catch (error) {
        logger.error(`[Cache] Failed to delete pattern "${pattern}":`, error);
        return 0;
    }
}

/**
 * Check if key exists in cache
 */
export async function cacheExists(
    key: string,
    config: CacheConfig = {}
): Promise<boolean> {
    try {
        const client = getRedisClient();
        const fullKey = generateKey(key, config.prefix);
        const exists = await client.exists(fullKey);
        return exists === 1;
    } catch (error) {
        logger.error(`[Cache] Failed to check existence of "${key}":`, error);
        return false;
    }
}

/**
 * Get time-to-live (TTL) for a key
 * @returns TTL in seconds, -1 if no expiry, -2 if key doesn't exist
 */
export async function cacheTTL(
    key: string,
    config: CacheConfig = {}
): Promise<number> {
    try {
        const client = getRedisClient();
        const fullKey = generateKey(key, config.prefix);
        return await client.ttl(fullKey);
    } catch (error) {
        logger.error(`[Cache] Failed to get TTL for "${key}":`, error);
        return -2;
    }
}

/**
 * Clear all cache keys with the configured prefix
 * ⚠️ Use with caution in production
 */
export async function cacheClear(config: CacheConfig = {}): Promise<number> {
    const pattern = '*';
    return await cacheDeletePattern(pattern, config);
}

// ===== CACHE WRAPPER (GET-OR-SET PATTERN) =====

/**
 * Get value from cache, or compute and cache it if missing
 * @param key Cache key
 * @param fetcher Function to compute value if not in cache
 * @param config Cache configuration
 * @returns Cached or freshly computed value
 */
export async function cacheGetOrSet<T = unknown>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig = {}
): Promise<T> {
    // Try to get from cache first
    const cached = await cacheGet<T>(key, config);
    if (cached !== null) {
        return cached;
    }

    // Cache miss - compute value
    const value = await fetcher();

    // Store in cache (fire-and-forget, don't block on cache write)
    void cacheSet(key, value, config);

    return value;
}

// ===== COMMON CACHE KEY PATTERNS =====

/**
 * Cache key generators for common Guardian resources
 */
export const CacheKeys = {
    // Organization keys
    organization: (id: string) => `org:${id}`,
    organizationBySlug: (slug: string) => `org:slug:${slug}`,
    organizationMembers: (orgId: string) => `org:${orgId}:members`,
    organizationQuota: (orgId: string) => `org:${orgId}:quota`,

    // Project keys
    project: (id: string) => `project:${id}`,
    projectsByOrg: (orgId: string) => `org:${orgId}:projects`,

    // Test run keys
    testRun: (id: string) => `test:${id}`,
    testRunsByProject: (projectId: string) => `project:${projectId}:tests`,
    testRunStats: (projectId: string) => `project:${projectId}:stats`,

    // Monitor keys
    monitor: (id: string) => `monitor:${id}`,
    monitorsByProject: (projectId: string) => `project:${projectId}:monitors`,
    monitorStatus: (monitorId: string) => `monitor:${monitorId}:status`,

    // Alert keys
    alerts: (orgId: string) => `org:${orgId}:alerts`,
    unresolvedAlerts: () => `alerts:unresolved`,

    // API key keys
    apiKey: (key: string) => `apikey:${key}`,
    apiKeyByOrg: (orgId: string) => `org:${orgId}:apikeys`,

    // Analytics keys
    analytics: (orgId: string, period: string) => `analytics:${orgId}:${period}`,
    dashboardStats: (orgId: string) => `dashboard:${orgId}:stats`
} as const;

// ===== CACHE TTL CONSTANTS =====

export const CACHE_TTL = {
    SHORT: 120, // 2 minutes - frequently updated data
    MEDIUM: 300, // 5 minutes - moderate update frequency
    LONG: 600, // 10 minutes - slowly changing data
    HOUR: 3600, // 1 hour - analytics/reports
    DAY: 86400 // 24 hours - rarely changing data
} as const;

// ===== HIGH-LEVEL CACHING HELPERS =====

/**
 * Cache project-specific data
 */
export async function cacheProject<T>(
    projectId: string,
    dataType: string,
    ttl: number,
    fetcher: () => Promise<T>
): Promise<T> {
    const key = `project:${projectId}:${dataType}`;
    return cacheGetOrSet(key, fetcher, { ttl });
}

/**
 * Invalidate all cache entries for a project
 */
export async function invalidateProject(projectId: string): Promise<number> {
    const pattern = `project:${projectId}:*`;
    return cacheDeletePattern(pattern);
}

/**
 * Cache monitor-specific data
 */
export async function cacheMonitor<T>(
    monitorId: string,
    dataType: string,
    ttl: number,
    fetcher: () => Promise<T>
): Promise<T> {
    const key = `monitor:${monitorId}:${dataType}`;
    return cacheGetOrSet(key, fetcher, { ttl });
}

/**
 * Invalidate all cache entries for a monitor
 */
export async function invalidateMonitor(monitorId: string): Promise<number> {
    const pattern = `monitor:${monitorId}:*`;
    return cacheDeletePattern(pattern);
}
