/**
 * Result Cache - Analysis Result Caching
 * Wave 9: Performance optimization via caching
 */

import * as crypto from 'crypto';

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt?: number;
}

export interface ResultCacheOptions {
  /**
   * Max cache entries (default: 50)
   */
  maxEntries?: number;

  /**
   * TTL in milliseconds (default: 1 hour)
   */
  ttl?: number;
}

export class ResultCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private options: Required<ResultCacheOptions>;

  constructor(options: ResultCacheOptions = {}) {
    this.options = {
      maxEntries: options.maxEntries || 50,
      ttl: options.ttl || 3600000, // 1 hour
    };
  }

  /**
   * Generate cache key from components
   */
  static generateKey(components: string[]): string {
    const data = components.join(':');
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Get cached result
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  /**
   * Set cached result
   */
  set(key: string, data: T): void {
    // Enforce max entries (LRU eviction)
    if (this.cache.size >= this.options.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.options.ttl,
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxEntries: this.options.maxEntries,
      entries: Array.from(this.cache.values()).map(e => ({
        key: e.key,
        age: Date.now() - e.timestamp,
      })),
    };
  }
}
