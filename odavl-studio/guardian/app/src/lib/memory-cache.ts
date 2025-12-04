import { LRUCache } from 'lru-cache';
import logger from './logger';

// ===== LRU CACHE CONFIGURATION =====

export interface MemoryCacheConfig {
    ttl?: number; // milliseconds (default: 60000 = 1 minute)
    max?: number; // max items (default: 1000)
}

const DEFAULT_TTL = 60_000; // 1 minute
const DEFAULT_MAX = 1000; // 1000 items

// ===== CACHE INSTANCES =====

// Organization configs cache (hot data, accessed frequently)
const orgConfigCache = new LRUCache<string, any>({
    max: 500,
    ttl: DEFAULT_TTL,
    ttlAutopurge: true,
    updateAgeOnGet: true, // Reset TTL on access
    updateAgeOnHas: false
});

// API key mappings cache (hot data, rate limit checks)
const apiKeyCache = new LRUCache<string, any>({
    max: 2000,
    ttl: DEFAULT_TTL,
    ttlAutopurge: true,
    updateAgeOnGet: true,
    updateAgeOnHas: false
});

// General-purpose cache
const generalCache = new LRUCache<string, any>({
    max: DEFAULT_MAX,
    ttl: DEFAULT_TTL,
    ttlAutopurge: true,
    updateAgeOnGet: true,
    updateAgeOnHas: false
});

// ===== CACHE TYPE ENUM =====

export enum CacheType {
    ORGANIZATION = 'organization',
    API_KEY = 'apiKey',
    GENERAL = 'general'
}

/**
 * Get the appropriate cache instance by type
 */
function getCacheInstance(type: CacheType): LRUCache<string, any> {
    switch (type) {
        case CacheType.ORGANIZATION:
            return orgConfigCache;
        case CacheType.API_KEY:
            return apiKeyCache;
        case CacheType.GENERAL:
        default:
            return generalCache;
    }
}

// ===== CACHE OPERATIONS =====

/**
 * Get value from memory cache
 * @returns Value or undefined if not found
 */
export function memoryCacheGet<T = unknown>(
    key: string,
    type: CacheType = CacheType.GENERAL
): T | undefined {
    try {
        const cache = getCacheInstance(type);
        const value = cache.get(key);
        return value as T | undefined;
    } catch (error) {
        logger.error(`[MemoryCache] Failed to get key "${key}" from ${type}:`, error);
        return undefined;
    }
}

/**
 * Set value in memory cache
 * @param ttl Time-to-live in milliseconds (default: 60000)
 */
export function memoryCacheSet<T = unknown>(
    key: string,
    value: T,
    type: CacheType = CacheType.GENERAL,
    ttl?: number
): boolean {
    try {
        const cache = getCacheInstance(type);
        cache.set(key, value, { ttl });
        return true;
    } catch (error) {
        logger.error(`[MemoryCache] Failed to set key "${key}" in ${type}:`, error);
        return false;
    }
}

/**
 * Check if key exists in memory cache
 */
export function memoryCacheHas(
    key: string,
    type: CacheType = CacheType.GENERAL
): boolean {
    try {
        const cache = getCacheInstance(type);
        return cache.has(key);
    } catch (error) {
        logger.error(`[MemoryCache] Failed to check key "${key}" in ${type}:`, error);
        return false;
    }
}

/**
 * Delete key from memory cache
 */
export function memoryCacheDelete(
    key: string,
    type: CacheType = CacheType.GENERAL
): boolean {
    try {
        const cache = getCacheInstance(type);
        return cache.delete(key);
    } catch (error) {
        logger.error(`[MemoryCache] Failed to delete key "${key}" from ${type}:`, error);
        return false;
    }
}

/**
 * Clear all entries from a specific cache type
 */
export function memoryCacheClear(type: CacheType = CacheType.GENERAL): void {
    try {
        const cache = getCacheInstance(type);
        cache.clear();
        logger.info(`[MemoryCache] Cleared ${type} cache`);
    } catch (error) {
        logger.error(`[MemoryCache] Failed to clear ${type} cache:`, error);
    }
}

/**
 * Clear all memory caches
 */
export function memoryCacheClearAll(): void {
    orgConfigCache.clear();
    apiKeyCache.clear();
    generalCache.clear();
    logger.info('[MemoryCache] Cleared all caches');
}

/**
 * Get cache statistics
 */
export function memoryCacheStats(type: CacheType = CacheType.GENERAL) {
    const cache = getCacheInstance(type);
    return {
        size: cache.size,
        max: cache.max,
        calculatedSize: cache.calculatedSize
    };
}

/**
 * Get all cache statistics
 */
export function memoryCacheAllStats() {
    return {
        organization: memoryCacheStats(CacheType.ORGANIZATION),
        apiKey: memoryCacheStats(CacheType.API_KEY),
        general: memoryCacheStats(CacheType.GENERAL)
    };
}

// ===== CACHE WRAPPER (GET-OR-SET PATTERN) =====

/**
 * Get value from memory cache, or compute and cache it if missing
 * @param key Cache key
 * @param fetcher Function to compute value if not in cache
 * @param type Cache type (default: GENERAL)
 * @param ttl Time-to-live in milliseconds
 * @returns Cached or freshly computed value
 */
export async function memoryCacheGetOrSet<T = unknown>(
    key: string,
    fetcher: () => Promise<T> | T,
    type: CacheType = CacheType.GENERAL,
    ttl?: number
): Promise<T> {
    // Try to get from cache first
    const cached = memoryCacheGet<T>(key, type);
    if (cached !== undefined) {
        return cached;
    }

    // Cache miss - compute value
    const value = await fetcher();

    // Store in cache
    memoryCacheSet(key, value, type, ttl);

    return value;
}

// ===== COMMON CACHE KEY PATTERNS =====

/**
 * Cache key generators for common Guardian resources
 */
export const MemoryCacheKeys = {
    // Organization configs (hot data)
    orgConfig: (orgId: string) => `org:${orgId}:config`,
    orgQuota: (orgId: string) => `org:${orgId}:quota`,
    orgTier: (orgId: string) => `org:${orgId}:tier`,

    // API key mappings (hot data for rate limiting)
    apiKeyOrg: (apiKey: string) => `apikey:${apiKey}:org`,
    apiKeyScopes: (apiKey: string) => `apikey:${apiKey}:scopes`,
    apiKeyRateLimit: (apiKey: string) => `apikey:${apiKey}:ratelimit`,

    // User/member data
    memberRole: (orgId: string, email: string) => `member:${orgId}:${email}:role`,
    memberPerms: (orgId: string, email: string) => `member:${orgId}:${email}:perms`,

    // Feature flags
    featureFlag: (orgId: string, flag: string) => `feature:${orgId}:${flag}`,

    // Recent activity (short TTL)
    recentActivity: (userId: string) => `activity:${userId}:recent`,

    // Configuration
    systemConfig: (key: string) => `config:${key}`
} as const;

// ===== HELPER: MULTI-LEVEL CACHING =====

/**
 * Two-level cache: Memory (L1) + Redis (L2)
 * Checks memory cache first, then Redis, then computes value
 * 
 * @example
 * const orgConfig = await multiLevelCache(
 *   'org:123:config',
 *   async () => await fetchOrgConfig('123'),
 *   { memoryTTL: 60000, redisTTL: 300 }
 * );
 */
export async function multiLevelCache<T = unknown>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
        memoryType?: CacheType;
        memoryTTL?: number; // milliseconds
        redisTTL?: number; // seconds
        redisPrefix?: string;
    } = {}
): Promise<T> {
    const {
        memoryType = CacheType.GENERAL,
        memoryTTL = DEFAULT_TTL,
        redisTTL,
        redisPrefix
    } = options;

    // L1: Check memory cache
    const memCached = memoryCacheGet<T>(key, memoryType);
    if (memCached !== undefined) {
        return memCached;
    }

    // L2: Check Redis cache (if TTL specified)
    if (redisTTL !== undefined) {
        // Import Redis cache functions lazily to avoid circular deps
        const { cacheGet, cacheSet } = await import('./cache');

        const redisCached = await cacheGet<T>(key, {
            ttl: redisTTL,
            prefix: redisPrefix
        });

        if (redisCached !== null) {
            // Populate memory cache from Redis
            memoryCacheSet(key, redisCached, memoryType, memoryTTL);
            return redisCached;
        }
    }

    // Cache miss - compute value
    const value = await fetcher();

    // Store in both caches
    memoryCacheSet(key, value, memoryType, memoryTTL);

    if (redisTTL !== undefined) {
        const { cacheSet } = await import('./cache');
        void cacheSet(key, value, { ttl: redisTTL, prefix: redisPrefix });
    }

    return value;
}
