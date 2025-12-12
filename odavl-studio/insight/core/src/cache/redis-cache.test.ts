/**
 * Redis Cache Tests
 * 
 * Test suite for RedisCache class.
 * 
 * @since Phase 1 Week 20 (December 2025)
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { RedisCache, createCache, createCacheFromEnv } from './redis-cache';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('RedisCache', () => {
  let cache: RedisCache;
  let testDir: string;

  beforeAll(async () => {
    // Create temp directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'redis-cache-test-'));
  });

  beforeEach(async () => {
    cache = createCache();
    await cache.connect();
    await cache.invalidateAll(); // Clean slate
    cache.resetStats();
  });

  afterEach(async () => {
    await cache.disconnect();
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Connection', () => {
    it('should connect to Redis', async () => {
      const newCache = createCache();
      await newCache.connect();
      expect(newCache).toBeDefined();
      await newCache.disconnect();
    });

    it('should disconnect from Redis', async () => {
      const newCache = createCache();
      await newCache.connect();
      await newCache.disconnect();
      // Should not throw
    });
  });

  describe('Basic Operations', () => {
    it('should set and get value', async () => {
      await cache.set('test-key', { foo: 'bar' });
      const value = await cache.get<{ foo: string }>('test-key');

      expect(value).toEqual({ foo: 'bar' });
    });

    it('should return null for missing key', async () => {
      const value = await cache.get('non-existent');
      expect(value).toBeNull();
    });

    it('should delete key', async () => {
      await cache.set('test-key', 'value');
      await cache.del('test-key');
      const value = await cache.get('test-key');

      expect(value).toBeNull();
    });

    it('should check if key exists', async () => {
      await cache.set('test-key', 'value');
      
      const exists = await cache.exists('test-key');
      const notExists = await cache.exists('non-existent');

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });
  });

  describe('TTL Management', () => {
    it('should respect TTL', async () => {
      await cache.set('test-key', 'value', 1); // 1 second TTL
      
      const immediate = await cache.get('test-key');
      expect(immediate).toBe('value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const expired = await cache.get('test-key');
      expect(expired).toBeNull();
    }, 3000);

    it('should get TTL for key', async () => {
      await cache.set('test-key', 'value', 60);
      const ttl = await cache.getTTL('test-key');

      expect(ttl).toBeGreaterThan(50);
      expect(ttl).toBeLessThanOrEqual(60);
    });

    it('should extend TTL', async () => {
      await cache.set('test-key', 'value', 10);
      await cache.extendTTL('test-key', 60);
      const ttl = await cache.getTTL('test-key');

      expect(ttl).toBeGreaterThan(50);
    });
  });

  describe('Get or Set', () => {
    it('should get from cache if exists', async () => {
      await cache.set('test-key', 'cached-value');
      
      let factoryCalled = false;
      const entry = await cache.getOrSet('test-key', async () => {
        factoryCalled = true;
        return 'new-value';
      });

      expect(entry.value).toBe('cached-value');
      expect(entry.hit).toBe(true);
      expect(factoryCalled).toBe(false);
    });

    it('should compute and cache if missing', async () => {
      let factoryCalled = false;
      const entry = await cache.getOrSet('test-key', async () => {
        factoryCalled = true;
        return 'computed-value';
      });

      expect(entry.value).toBe('computed-value');
      expect(entry.hit).toBe(false);
      expect(factoryCalled).toBe(true);

      // Should be cached now
      const cached = await cache.get('test-key');
      expect(cached).toBe('computed-value');
    });
  });

  describe('File Caching', () => {
    it('should cache file analysis', async () => {
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 42;', 'utf-8');

      const analysis = { issues: [], lines: 1 };
      await cache.cacheFileAnalysis(testFile, analysis);

      const cached = await cache.getCachedFileAnalysis(testFile);
      expect(cached).toEqual(analysis);
    });

    it('should invalidate cache when file changes', async () => {
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 42;', 'utf-8');

      await cache.cacheFileAnalysis(testFile, { issues: [] });

      // Modify file
      await fs.writeFile(testFile, 'const y = 100;', 'utf-8');

      const cached = await cache.getCachedFileAnalysis(testFile);
      expect(cached).toBeNull(); // Invalidated
    });

    it('should invalidate specific file', async () => {
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, 'const x = 42;', 'utf-8');

      await cache.cacheFileAnalysis(testFile, { issues: [] });
      await cache.invalidateFile(testFile);

      const cached = await cache.getCachedFileAnalysis(testFile);
      expect(cached).toBeNull();
    });

    it('should invalidate directory', async () => {
      const file1 = path.join(testDir, 'file1.ts');
      const file2 = path.join(testDir, 'file2.ts');
      
      await fs.writeFile(file1, 'const x = 1;', 'utf-8');
      await fs.writeFile(file2, 'const y = 2;', 'utf-8');

      await cache.cacheFileAnalysis(file1, { issues: [] });
      await cache.cacheFileAnalysis(file2, { issues: [] });

      await cache.invalidateDirectory(testDir);

      const cached1 = await cache.getCachedFileAnalysis(file1);
      const cached2 = await cache.getCachedFileAnalysis(file2);

      expect(cached1).toBeNull();
      expect(cached2).toBeNull();
    });
  });

  describe('Batch Operations', () => {
    it('should batch get', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      const values = await cache.mget<string>(['key1', 'key2', 'key3', 'key4']);

      expect(values).toEqual(['value1', 'value2', 'value3', null]);
    });

    it('should batch set', async () => {
      await cache.mset({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      });

      const value1 = await cache.get('key1');
      const value2 = await cache.get('key2');
      const value3 = await cache.get('key3');

      expect(value1).toBe('value1');
      expect(value2).toBe('value2');
      expect(value3).toBe('value3');
    });
  });

  describe('Statistics', () => {
    it('should track hits and misses', async () => {
      await cache.set('key1', 'value');

      await cache.get('key1'); // hit
      await cache.get('key2'); // miss
      await cache.get('key1'); // hit

      const stats = await cache.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });

    it('should track latency', async () => {
      await cache.set('key1', 'value');
      await cache.get('key1');

      const stats = await cache.getStats();

      expect(stats.avgLatency).toBeGreaterThan(0);
      expect(stats.avgLatency).toBeLessThan(100); // Should be <100ms
    });

    it('should report key count', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      const stats = await cache.getStats();

      expect(stats.keys).toBe(3);
    });

    it('should reset stats', async () => {
      await cache.set('key1', 'value');
      await cache.get('key1');

      cache.resetStats();
      const stats = await cache.getStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('Invalidation', () => {
    it('should invalidate all caches', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      await cache.invalidateAll();

      const value1 = await cache.get('key1');
      const value2 = await cache.get('key2');

      expect(value1).toBeNull();
      expect(value2).toBeNull();
    });
  });

  describe('Configuration', () => {
    it('should use custom options', async () => {
      const customCache = createCache({
        keyPrefix: 'custom:',
        ttl: 300,
      });

      await customCache.connect();
      await customCache.set('test', 'value');
      
      // Should have custom prefix
      const value = await customCache.get('test');
      expect(value).toBe('value');

      await customCache.disconnect();
    });

    it('should create cache from environment', () => {
      process.env.REDIS_HOST = 'localhost';
      process.env.REDIS_PORT = '6379';

      const envCache = createCacheFromEnv();
      expect(envCache).toBeInstanceOf(RedisCache);

      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;
    });
  });

  describe('Error Handling', () => {
    it('should handle get errors gracefully', async () => {
      // Simulate error by disconnecting
      await cache.disconnect();

      const value = await cache.get('test');
      expect(value).toBeNull(); // Should not throw
    });

    it('should handle set errors gracefully', async () => {
      await cache.disconnect();

      // Should not throw
      await cache.set('test', 'value');
    });
  });

  describe('Data Types', () => {
    it('should cache objects', async () => {
      const obj = {
        name: 'John',
        age: 30,
        nested: { foo: 'bar' },
      };

      await cache.set('obj', obj);
      const cached = await cache.get<typeof obj>('obj');

      expect(cached).toEqual(obj);
    });

    it('should cache arrays', async () => {
      const arr = [1, 2, 3, 4, 5];

      await cache.set('arr', arr);
      const cached = await cache.get<typeof arr>('arr');

      expect(cached).toEqual(arr);
    });

    it('should cache complex structures', async () => {
      const complex = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        meta: {
          count: 2,
          page: 1,
        },
      };

      await cache.set('complex', complex);
      const cached = await cache.get<typeof complex>('complex');

      expect(cached).toEqual(complex);
    });
  });
});
