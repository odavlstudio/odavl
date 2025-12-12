/**
 * ODAVL Insight Enterprise - Redis Caching Layer
 * Phase 1: Performance & Scale - Week 20
 * 
 * Features:
 * - Detection result caching with TTL
 * - Git-based cache invalidation
 * - Multi-level cache hierarchy (L1 memory, L2 Redis)
 * - Cache warming strategies
 * - Cache statistics and monitoring
 * - Compression for large results
 * - Batch operations for efficiency
 * - Cache key versioning
 * - Automatic cache cleanup
 * - Distributed cache coordination
 * 
 * Performance Goals:
 * - Cache hit rate >80%
 * - 100k LOC analysis in <3s (cached)
 * - 10x speedup for incremental analysis
 * 
 * @module cache/redis-layer
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

// Promisify zlib functions
const compressAsync = promisify(gzip);
const decompressAsync = promisify(gunzip);

// ==================== Types & Interfaces ====================

/**
 * Cache entry metadata
 */
export interface CacheMetadata {
  key: string;
  createdAt: Date;
  expiresAt: Date;
  hits: number;
  size: number; // bytes
  compressed: boolean;
  gitHash?: string; // Git commit hash for invalidation
  version: string; // Schema version
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  totalKeys: number;
  totalSize: number; // bytes
  hits: number;
  misses: number;
  hitRate: number; // 0-1
  evictions: number;
  compressionRatio: number; // compressed/original
  avgLatency: number; // milliseconds
  l1HitRate: number; // Memory cache hit rate
  l2HitRate: number; // Redis cache hit rate
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  // Redis connection
  redisUrl?: string; // Default: redis://localhost:6379
  redisPassword?: string;
  redisDb?: number; // Default: 0
  
  // Memory cache (L1)
  enableMemoryCache: boolean; // Default: true
  maxMemoryCacheSizeMB: number; // Default: 256
  maxMemoryCacheKeys: number; // Default: 1000
  
  // TTL settings
  defaultTtlSeconds: number; // Default: 3600 (1 hour)
  maxTtlSeconds: number; // Default: 86400 (24 hours)
  minTtlSeconds: number; // Default: 300 (5 minutes)
  
  // Compression
  enableCompression: boolean; // Default: true
  compressionThresholdBytes: number; // Default: 1024 (1KB)
  
  // Invalidation
  enableGitInvalidation: boolean; // Default: true
  gitHashCheckInterval: number; // milliseconds, Default: 60000
  
  // Performance
  batchSize: number; // Default: 100
  connectionPoolSize: number; // Default: 10
  commandTimeout: number; // milliseconds, Default: 5000
  
  // Monitoring
  enableMetrics: boolean; // Default: true
  metricsInterval: number; // milliseconds, Default: 10000
}

/**
 * Cache entry
 */
interface CacheEntry<T = any> {
  metadata: CacheMetadata;
  data: T;
}

/**
 * Cache operation result
 */
export interface CacheOperationResult {
  success: boolean;
  key: string;
  latency: number; // milliseconds
  cached?: boolean;
  error?: string;
}

/**
 * Cache warming options
 */
export interface WarmingOptions {
  files: string[]; // Files to pre-analyze
  detectors: string[]; // Detectors to run
  priority: 'high' | 'normal' | 'low';
  maxConcurrent: number; // Default: 4
}

// ==================== Redis Cache Layer ====================

const DEFAULT_CONFIG: CacheConfig = {
  redisUrl: 'redis://localhost:6379',
  redisDb: 0,
  enableMemoryCache: true,
  maxMemoryCacheSizeMB: 256,
  maxMemoryCacheKeys: 1000,
  defaultTtlSeconds: 3600,
  maxTtlSeconds: 86400,
  minTtlSeconds: 300,
  enableCompression: true,
  compressionThresholdBytes: 1024,
  enableGitInvalidation: true,
  gitHashCheckInterval: 60000,
  batchSize: 100,
  connectionPoolSize: 10,
  commandTimeout: 5000,
  enableMetrics: true,
  metricsInterval: 10000,
};

/**
 * Redis-backed caching layer with memory cache (L1) and Redis (L2)
 */
export class RedisCacheLayer extends EventEmitter {
  private config: CacheConfig;
  
  // Mock Redis client (replace with real Redis client in production)
  private redis: Map<string, string>;
  
  // Memory cache (L1)
  private memoryCache: Map<string, CacheEntry>;
  private memoryCacheSize: number = 0; // bytes
  
  // Statistics
  private stats: CacheStatistics;
  private latencies: number[] = [];
  
  // Git tracking
  private currentGitHash?: string;
  private gitHashCheckInterval?: NodeJS.Timeout;
  
  // Metrics
  private metricsInterval?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize mock Redis (replace with real client)
    this.redis = new Map();
    
    // Initialize memory cache
    this.memoryCache = new Map();
    
    // Initialize statistics
    this.stats = {
      totalKeys: 0,
      totalSize: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
      evictions: 0,
      compressionRatio: 1,
      avgLatency: 0,
      l1HitRate: 0,
      l2HitRate: 0,
    };
  }

  /**
   * Initialize cache layer
   */
  async initialize(): Promise<void> {
    this.emit('initializing');

    // Connect to Redis (mock implementation)
    await this.connectRedis();

    // Get current git hash
    if (this.config.enableGitInvalidation) {
      await this.updateGitHash();
      this.startGitHashMonitoring();
    }

    // Start metrics collection
    if (this.config.enableMetrics) {
      this.startMetricsCollection();
    }

    this.emit('initialized', { config: this.config });
  }

  /**
   * Shutdown cache layer
   */
  async shutdown(): Promise<void> {
    this.emit('shutting-down');

    // Stop monitoring
    if (this.gitHashCheckInterval) {
      clearInterval(this.gitHashCheckInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Flush memory cache
    this.memoryCache.clear();
    this.memoryCacheSize = 0;

    // Disconnect Redis (mock)
    this.redis.clear();

    this.emit('shutdown');
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();

    // Try L1 (memory) cache
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      if (!this.isExpired(memoryEntry.metadata)) {
        this.recordHit(startTime, 'l1');
        memoryEntry.metadata.hits++;
        this.emit('cache-hit', { key, level: 'l1' });
        return memoryEntry.data as T;
      } else {
        // Remove expired entry
        this.memoryCache.delete(key);
        this.memoryCacheSize -= memoryEntry.metadata.size;
      }
    }

    // Try L2 (Redis) cache
    const redisValue = this.redis.get(key);
    if (redisValue) {
      const entry = await this.deserialize<T>(redisValue);
      
      if (!this.isExpired(entry.metadata)) {
        this.recordHit(startTime, 'l2');
        entry.metadata.hits++;
        
        // Promote to L1
        if (this.config.enableMemoryCache) {
          await this.setMemoryCache(key, entry);
        }
        
        this.emit('cache-hit', { key, level: 'l2' });
        return entry.data;
      } else {
        // Remove expired entry
        this.redis.delete(key);
        this.stats.totalKeys--;
      }
    }

    // Cache miss
    this.recordMiss(startTime);
    this.emit('cache-miss', { key });
    return null;
  }

  /**
   * Set cached value
   */
  async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    gitHash?: string
  ): Promise<CacheOperationResult> {
    const startTime = Date.now();

    const ttl = ttlSeconds || this.config.defaultTtlSeconds;
    const clampedTtl = Math.max(
      this.config.minTtlSeconds,
      Math.min(ttl, this.config.maxTtlSeconds)
    );

    const metadata: CacheMetadata = {
      key,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + clampedTtl * 1000),
      hits: 0,
      size: 0, // Will be calculated
      compressed: false,
      gitHash: gitHash || this.currentGitHash,
      version: '1.0',
    };

    const entry: CacheEntry<T> = { metadata, data: value };

    // Serialize and compress
    const serialized = await this.serialize(entry);
    metadata.size = Buffer.byteLength(serialized);

    // Store in Redis (L2)
    this.redis.set(key, serialized);
    this.stats.totalKeys++;
    this.stats.totalSize += metadata.size;

    // Store in memory cache (L1)
    if (this.config.enableMemoryCache) {
      await this.setMemoryCache(key, entry);
    }

    const latency = Date.now() - startTime;
    this.latencies.push(latency);

    this.emit('cache-set', { key, size: metadata.size, ttl: clampedTtl });

    return {
      success: true,
      key,
      latency,
      cached: true,
    };
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<boolean> {
    let deleted = false;

    // Remove from memory cache
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      this.memoryCache.delete(key);
      this.memoryCacheSize -= memoryEntry.metadata.size;
      deleted = true;
    }

    // Remove from Redis
    if (this.redis.has(key)) {
      this.redis.delete(key);
      this.stats.totalKeys--;
      deleted = true;
    }

    if (deleted) {
      this.emit('cache-delete', { key });
    }

    return deleted;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    this.memoryCacheSize = 0;

    // Clear Redis
    this.redis.clear();
    this.stats.totalKeys = 0;
    this.stats.totalSize = 0;

    this.emit('cache-cleared');
  }

  /**
   * Invalidate cache entries by git hash
   */
  async invalidateByGitHash(gitHash: string): Promise<number> {
    let invalidated = 0;

    // Invalidate memory cache
    for (const [key, entry] of this.memoryCache) {
      if (entry.metadata.gitHash === gitHash) {
        this.memoryCache.delete(key);
        this.memoryCacheSize -= entry.metadata.size;
        invalidated++;
      }
    }

    // Invalidate Redis cache
    for (const [key, value] of this.redis) {
      const entry = await this.deserialize(value);
      if (entry.metadata.gitHash === gitHash) {
        this.redis.delete(key);
        this.stats.totalKeys--;
        invalidated++;
      }
    }

    this.emit('cache-invalidated', { gitHash, count: invalidated });

    return invalidated;
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    let invalidated = 0;
    const regex = new RegExp(pattern);

    // Invalidate memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        const entry = this.memoryCache.get(key)!;
        this.memoryCache.delete(key);
        this.memoryCacheSize -= entry.metadata.size;
        invalidated++;
      }
    }

    // Invalidate Redis cache
    for (const key of this.redis.keys()) {
      if (regex.test(key)) {
        this.redis.delete(key);
        this.stats.totalKeys--;
        invalidated++;
      }
    }

    this.emit('cache-invalidated-pattern', { pattern, count: invalidated });

    return invalidated;
  }

  /**
   * Warm cache with pre-computed results
   */
  async warm(options: WarmingOptions): Promise<number> {
    let warmed = 0;

    this.emit('cache-warming-started', { files: options.files.length });

    // Process files in batches
    const batches = this.createBatches(options.files, options.maxConcurrent);

    for (const batch of batches) {
      await Promise.all(
        batch.map(async (file) => {
          // Simulate analysis and cache result
          // In production, call actual detectors
          const key = this.generateKey('analysis', file, options.detectors);
          const result = await this.mockAnalysis(file, options.detectors);
          await this.set(key, result);
          warmed++;
        })
      );
    }

    this.emit('cache-warming-completed', { warmed });

    return warmed;
  }

  /**
   * Get cache statistics
   */
  getStatistics(): CacheStatistics {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    
    const avgLatency = this.latencies.length > 0
      ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
      : 0;

    return {
      ...this.stats,
      hitRate,
      avgLatency,
    };
  }

  /**
   * Generate cache key
   */
  generateKey(...parts: (string | string[])[]): string {
    const normalized = parts.flat().join(':');
    const hash = createHash('sha256').update(normalized).digest('hex');
    return `odavl:${hash.substring(0, 16)}`;
  }

  // ==================== Private Methods ====================

  /**
   * Connect to Redis
   */
  private async connectRedis(): Promise<void> {
    // Mock implementation - replace with real Redis client
    // Example using ioredis:
    // this.redis = new Redis(this.config.redisUrl, {
    //   password: this.config.redisPassword,
    //   db: this.config.redisDb,
    //   lazyConnect: true,
    // });
    // await this.redis.connect();
    
    this.emit('redis-connected');
  }

  /**
   * Set value in memory cache
   */
  private async setMemoryCache<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    // Check if we need to evict entries
    while (
      this.memoryCache.size >= this.config.maxMemoryCacheKeys ||
      this.memoryCacheSize >= this.config.maxMemoryCacheSizeMB * 1024 * 1024
    ) {
      await this.evictMemoryCacheEntry();
    }

    this.memoryCache.set(key, entry as CacheEntry);
    this.memoryCacheSize += entry.metadata.size;
  }

  /**
   * Evict least recently used entry from memory cache
   */
  private async evictMemoryCacheEntry(): Promise<void> {
    // Find LRU entry (oldest with least hits)
    let lruKey: string | null = null;
    let lruEntry: CacheEntry | null = null;
    let minScore = Infinity;

    for (const [key, entry] of this.memoryCache) {
      // Score = age * (1 / (hits + 1))
      const age = Date.now() - entry.metadata.createdAt.getTime();
      const score = age / (entry.metadata.hits + 1);
      
      if (score < minScore) {
        minScore = score;
        lruKey = key;
        lruEntry = entry;
      }
    }

    if (lruKey && lruEntry) {
      this.memoryCache.delete(lruKey);
      this.memoryCacheSize -= lruEntry.metadata.size;
      this.stats.evictions++;
      this.emit('cache-eviction', { key: lruKey, level: 'l1' });
    }
  }

  /**
   * Serialize cache entry
   */
  private async serialize<T>(entry: CacheEntry<T>): Promise<string> {
    const json = JSON.stringify(entry);
    
    if (
      this.config.enableCompression &&
      json.length >= this.config.compressionThresholdBytes
    ) {
      const compressed = await compressAsync(Buffer.from(json));
      entry.metadata.compressed = true;
      return compressed.toString('base64');
    }

    return json;
  }

  /**
   * Deserialize cache entry
   */
  private async deserialize<T>(value: string): Promise<CacheEntry<T>> {
    try {
      // Try JSON first
      const entry = JSON.parse(value) as CacheEntry<T>;
      return entry;
    } catch {
      // Assume compressed
      const decompressed = await decompressAsync(Buffer.from(value, 'base64'));
      return JSON.parse(decompressed.toString()) as CacheEntry<T>;
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(metadata: CacheMetadata): boolean {
    return new Date() > metadata.expiresAt;
  }

  /**
   * Record cache hit
   */
  private recordHit(startTime: number, level: 'l1' | 'l2'): void {
    this.stats.hits++;
    
    if (level === 'l1') {
      this.stats.l1HitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
    } else {
      this.stats.l2HitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
    }

    const latency = Date.now() - startTime;
    this.latencies.push(latency);
  }

  /**
   * Record cache miss
   */
  private recordMiss(startTime: number): void {
    this.stats.misses++;
    const latency = Date.now() - startTime;
    this.latencies.push(latency);
  }

  /**
   * Update current git hash
   */
  private async updateGitHash(): Promise<void> {
    // Mock implementation - replace with real git command
    // Example: const hash = execSync('git rev-parse HEAD').toString().trim();
    this.currentGitHash = 'mock-git-hash-' + Date.now();
  }

  /**
   * Start git hash monitoring
   */
  private startGitHashMonitoring(): void {
    this.gitHashCheckInterval = setInterval(async () => {
      const previousHash = this.currentGitHash;
      await this.updateGitHash();

      if (previousHash && previousHash !== this.currentGitHash) {
        // Git hash changed - invalidate old cache
        await this.invalidateByGitHash(previousHash);
        this.emit('git-hash-changed', { 
          previous: previousHash, 
          current: this.currentGitHash 
        });
      }
    }, this.config.gitHashCheckInterval);
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      const stats = this.getStatistics();
      this.emit('metrics', stats);
      
      // Clear latencies after reporting
      this.latencies = [];
    }, this.config.metricsInterval);
  }

  /**
   * Create batches from array
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Mock analysis for cache warming
   */
  private async mockAnalysis(file: string, detectors: string[]): Promise<any> {
    // Mock implementation - replace with real detector calls
    return {
      file,
      detectors,
      issues: [],
      timestamp: new Date(),
    };
  }
}

// ==================== Factory & Utilities ====================

/**
 * Create Redis cache layer instance
 */
export async function createRedisCacheLayer(
  config?: Partial<CacheConfig>
): Promise<RedisCacheLayer> {
  const cache = new RedisCacheLayer(config);
  await cache.initialize();
  return cache;
}

/**
 * Generate cache key with prefix
 */
export function cacheKey(prefix: string, ...parts: string[]): string {
  return [prefix, ...parts].join(':');
}

/**
 * Calculate cache hit rate percentage
 */
export function calculateHitRatePercentage(stats: CacheStatistics): number {
  return Math.round(stats.hitRate * 100);
}

/**
 * Format cache size for display
 */
export function formatCacheSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
