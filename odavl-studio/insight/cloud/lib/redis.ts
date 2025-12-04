/**
 * Redis Client Configuration
 * Using Upstash Redis for serverless-friendly caching
 */

import { Redis } from '@upstash/redis';

// Singleton pattern for Redis client
let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_URL;
    const token = process.env.UPSTASH_REDIS_TOKEN;

    if (!url || !token) {
      throw new Error('Missing Redis configuration. Set UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN');
    }

    redis = new Redis({
      url,
      token,
      automaticDeserialization: true,
    });
  }

  return redis;
}

/**
 * Cache utilities
 */
export class CacheService {
  private redis: Redis;
  private defaultTTL: number = 300; // 5 minutes

  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value as T | null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<boolean> {
    try {
      await this.redis.set(key, value, { ex: ttl });
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Redis DELETE error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  /**
   * Increment counter (for rate limiting)
   */
  async increment(key: string, ttl?: number): Promise<number> {
    try {
      const count = await this.redis.incr(key);
      if (ttl && count === 1) {
        await this.redis.expire(key, ttl);
      }
      return count;
    } catch (error) {
      console.error('Redis INCR error:', error);
      return 0;
    }
  }

  /**
   * Get multiple keys
   */
  async mget<T>(...keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values as (T | null)[];
    } catch (error) {
      console.error('Redis MGET error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple keys
   */
  async mset(keyValues: Record<string, any>): Promise<boolean> {
    try {
      const pairs = Object.entries(keyValues).flat();
      await this.redis.mset(...pairs);
      return true;
    } catch (error) {
      console.error('Redis MSET error:', error);
      return false;
    }
  }

  /**
   * Get keys by pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      console.error('Redis KEYS error:', error);
      return [];
    }
  }

  /**
   * Flush all keys (use with caution!)
   */
  async flushAll(): Promise<boolean> {
    try {
      await this.redis.flushdb();
      return true;
    } catch (error) {
      console.error('Redis FLUSHDB error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const cache = new CacheService();

/**
 * Cache decorator for functions
 */
export function cacheable(ttl: number = 300) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyName}:${JSON.stringify(args)}`;
      
      // Try to get from cache
      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      await cache.set(cacheKey, result, ttl);
      
      return result;
    };
  };
}

export default cache;
