/**
 * Redis Cache Service
 * High-performance caching layer for ODAVL Studio
 * 
 * Features:
 * - Key-value caching with TTL
 * - Session storage
 * - Rate limiting counters
 * - Job queue state caching
 * - Analytics data caching
 * - Automatic cache invalidation
 */

import crypto from 'node:crypto';

export enum CacheNamespace {
  SESSION = 'session',
  USER = 'user',
  ORGANIZATION = 'org',
  PROJECT = 'project',
  ANALYTICS = 'analytics',
  SYNC_JOB = 'sync',
  RATE_LIMIT = 'ratelimit',
  API_RESPONSE = 'api',
  QUERY_RESULT = 'query',
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 3600 = 1 hour)
  namespace?: CacheNamespace;
  tags?: string[]; // For group invalidation
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number; // Bytes
}

export interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // Seconds until retry
}

export class RedisCacheService {
  private static instance: RedisCacheService;
  private cache = new Map<string, { value: unknown; expiresAt: number; tags: string[] }>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };
  private redisUrl: string;
  private redisConnected = false;
  
  private constructor() {
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.initRedis();
    
    // Start cleanup interval (every minute)
    setInterval(() => this.cleanupExpired(), 60000);
  }
  
  public static getInstance(): RedisCacheService {
    if (!RedisCacheService.instance) {
      RedisCacheService.instance = new RedisCacheService();
    }
    return RedisCacheService.instance;
  }
  
  /**
   * Initialize Redis connection
   */
  private async initRedis(): Promise<void> {
    try {
      // TODO: Implement actual Redis connection with ioredis
      // const redis = new Redis(this.redisUrl);
      // await redis.ping();
      // this.redisConnected = true;
      console.log('Redis URL configured:', this.redisUrl);
      console.log('Using in-memory cache (upgrade to Redis in production)');
    } catch (error) {
      console.error('Redis connection failed:', error);
      console.log('Falling back to in-memory cache');
    }
  }
  
  /**
   * Generate cache key
   */
  private generateKey(namespace: CacheNamespace, key: string): string {
    return `${namespace}:${key}`;
  }
  
  /**
   * Get value from cache
   */
  public async get<T = unknown>(
    key: string,
    options?: { namespace?: CacheNamespace }
  ): Promise<T | null> {
    const fullKey = this.generateKey(options?.namespace || CacheNamespace.API_RESPONSE, key);
    
    const cached = this.cache.get(fullKey);
    
    if (!cached) {
      this.stats.misses++;
      return null;
    }
    
    // Check expiration
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(fullKey);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return cached.value as T;
  }
  
  /**
   * Set value in cache
   */
  public async set(
    key: string,
    value: unknown,
    options?: CacheOptions
  ): Promise<void> {
    const namespace = options?.namespace || CacheNamespace.API_RESPONSE;
    const ttl = options?.ttl || 3600; // 1 hour default
    const tags = options?.tags || [];
    
    const fullKey = this.generateKey(namespace, key);
    const expiresAt = Date.now() + (ttl * 1000);
    
    this.cache.set(fullKey, {
      value,
      expiresAt,
      tags,
    });
    
    this.stats.sets++;
  }
  
  /**
   * Delete value from cache
   */
  public async delete(
    key: string,
    options?: { namespace?: CacheNamespace }
  ): Promise<boolean> {
    const fullKey = this.generateKey(options?.namespace || CacheNamespace.API_RESPONSE, key);
    const deleted = this.cache.delete(fullKey);
    
    if (deleted) {
      this.stats.deletes++;
    }
    
    return deleted;
  }
  
  /**
   * Check if key exists
   */
  public async exists(
    key: string,
    options?: { namespace?: CacheNamespace }
  ): Promise<boolean> {
    const fullKey = this.generateKey(options?.namespace || CacheNamespace.API_RESPONSE, key);
    const cached = this.cache.get(fullKey);
    
    if (!cached) return false;
    
    // Check expiration
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(fullKey);
      return false;
    }
    
    return true;
  }
  
  /**
   * Invalidate by tag
   */
  public async invalidateByTag(tag: string): Promise<number> {
    let count = 0;
    
    for (const [key, cached] of this.cache.entries()) {
      if (cached.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    this.stats.deletes += count;
    return count;
  }
  
  /**
   * Invalidate by namespace
   */
  public async invalidateByNamespace(namespace: CacheNamespace): Promise<number> {
    let count = 0;
    const prefix = `${namespace}:`;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    this.stats.deletes += count;
    return count;
  }
  
  /**
   * Clear all cache
   */
  public async clear(): Promise<void> {
    const count = this.cache.size;
    this.cache.clear();
    this.stats.deletes += count;
  }
  
  /**
   * Get or set with callback (cache-aside pattern)
   */
  public async getOrSet<T = unknown>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }
    
    // Fetch fresh data
    const value = await fetcher();
    
    // Store in cache
    await this.set(key, value, options);
    
    return value;
  }
  
  /**
   * Increment counter
   */
  public async increment(
    key: string,
    by: number = 1,
    options?: CacheOptions
  ): Promise<number> {
    const current = await this.get<number>(key, options) || 0;
    const newValue = current + by;
    
    await this.set(key, newValue, options);
    
    return newValue;
  }
  
  /**
   * Decrement counter
   */
  public async decrement(
    key: string,
    by: number = 1,
    options?: CacheOptions
  ): Promise<number> {
    return this.increment(key, -by, options);
  }
  
  /**
   * Rate limiting check
   */
  public async checkRateLimit(
    identifier: string,
    options: RateLimitOptions
  ): Promise<RateLimitResult> {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - (options.windowSeconds * 1000);
    
    // Get current count
    const data = await this.get<{ count: number; resetAt: number }>(key, {
      namespace: CacheNamespace.RATE_LIMIT,
    });
    
    if (!data || data.resetAt < now) {
      // New window
      const resetAt = now + (options.windowSeconds * 1000);
      
      await this.set(key, { count: 1, resetAt }, {
        namespace: CacheNamespace.RATE_LIMIT,
        ttl: options.windowSeconds,
      });
      
      return {
        allowed: true,
        remaining: options.maxRequests - 1,
        resetAt: new Date(resetAt),
      };
    }
    
    // Check if limit exceeded
    if (data.count >= options.maxRequests) {
      const retryAfter = Math.ceil((data.resetAt - now) / 1000);
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(data.resetAt),
        retryAfter,
      };
    }
    
    // Increment count
    const newCount = data.count + 1;
    
    await this.set(key, { count: newCount, resetAt: data.resetAt }, {
      namespace: CacheNamespace.RATE_LIMIT,
      ttl: Math.ceil((data.resetAt - now) / 1000),
    });
    
    return {
      allowed: true,
      remaining: options.maxRequests - newCount,
      resetAt: new Date(data.resetAt),
    };
  }
  
  /**
   * Session management
   */
  public async setSession(
    sessionId: string,
    data: Record<string, unknown>,
    ttl: number = 86400 // 24 hours
  ): Promise<void> {
    await this.set(sessionId, data, {
      namespace: CacheNamespace.SESSION,
      ttl,
      tags: ['session'],
    });
  }
  
  public async getSession(sessionId: string): Promise<Record<string, unknown> | null> {
    return this.get<Record<string, unknown>>(sessionId, {
      namespace: CacheNamespace.SESSION,
    });
  }
  
  public async deleteSession(sessionId: string): Promise<boolean> {
    return this.delete(sessionId, {
      namespace: CacheNamespace.SESSION,
    });
  }
  
  /**
   * Cache warming
   */
  public async warm(
    keys: Array<{ key: string; fetcher: () => Promise<unknown>; options?: CacheOptions }>
  ): Promise<void> {
    console.log(`🔥 Warming cache with ${keys.length} keys...`);
    
    await Promise.all(
      keys.map(({ key, fetcher, options }) => 
        this.getOrSet(key, fetcher, options)
      )
    );
    
    console.log('✅ Cache warmed');
  }
  
  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    
    // Calculate approximate memory usage
    let memoryUsage = 0;
    for (const [key, cached] of this.cache.entries()) {
      memoryUsage += key.length * 2; // UTF-16 chars
      memoryUsage += JSON.stringify(cached.value).length * 2;
    }
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      hitRate: Math.round(hitRate * 100) / 100,
      totalKeys: this.cache.size,
      memoryUsage,
    };
  }
  
  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }
  
  /**
   * Cleanup expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }
  
  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    connected: boolean;
    stats: CacheStats;
  }> {
    // Try a test operation
    const testKey = '__health_check__';
    const testValue = Date.now();
    
    try {
      await this.set(testKey, testValue, { ttl: 10 });
      const retrieved = await this.get<number>(testKey);
      await this.delete(testKey);
      
      const healthy = retrieved === testValue;
      
      return {
        healthy,
        connected: this.redisConnected,
        stats: this.getStats(),
      };
    } catch (error) {
      return {
        healthy: false,
        connected: false,
        stats: this.getStats(),
      };
    }
  }
}

// Export singleton instance
export const cacheService = RedisCacheService.getInstance();
