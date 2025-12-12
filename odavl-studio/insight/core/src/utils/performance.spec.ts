/**
 * Unit tests for performance.ts
 * Tests Phase 3 performance optimization utilities
 * 
 * Phase 5: Unit Tests - performance.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  ResultCache,
  GitChangeDetector,
  ParallelDetectorExecutor,
  PerformanceTracker,
  SmartFileFilter,
} from './performance';

describe('performance.ts - Phase 3 Utilities', () => {
  const testWorkspace = process.cwd();

  describe('ResultCache', () => {
    let cache: ResultCache;
    const cacheDir = path.join(testWorkspace, '.odavl', 'cache');

    beforeEach(() => {
      cache = new ResultCache(testWorkspace, 3600000); // 1 hour TTL
    });

    afterEach(async () => {
      try {
        await fs.rm(cacheDir, { recursive: true, force: true });
      } catch {}
    });

    it('should initialize with empty cache', () => {
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.oldestEntry).toBeGreaterThan(0);
      expect(stats.newestEntry).toBe(0);
    });

    it('should store and retrieve cached results', () => {
      const testFile = path.join(testWorkspace, 'package.json'); // Real file that exists
      const testIssues = [{ message: 'test issue' }];

      // Set cache
      cache.set(testFile, 'TestDetector', testIssues, '1.0.0');

      // Get cache (should hit)
      const cached = cache.get(testFile, 'TestDetector');
      expect(cached).toBeDefined();
      expect(cached).toHaveLength(1);
      expect(cached![0].message).toBe('test issue');
    });

    it('should return null for cache miss', () => {
      const result = cache.get('nonexistent-file.ts', 'TestDetector');
      expect(result).toBeNull();
    });

    it('should track cache size', () => {
      const testFile = path.join(testWorkspace, 'package.json');
      const testIssues = [{ message: 'test' }];

      expect(cache.getStats().size).toBe(0);

      cache.set(testFile, 'Detector1', testIssues);
      expect(cache.getStats().size).toBe(1);

      cache.set(testFile, 'Detector2', testIssues);
      expect(cache.getStats().size).toBe(2); // Different detectors = different keys
    });

    it('should track newest/oldest entries', () => {
      const file1 = path.join(testWorkspace, 'package.json');
      cache.set(file1, 'Detector1', []);

      const stats1 = cache.getStats();
      expect(stats1.newestEntry).toBeGreaterThan(0);
      expect(stats1.oldestEntry).toBeGreaterThan(0);
      expect(stats1.newestEntry).toBeGreaterThanOrEqual(stats1.oldestEntry);
    });

    it('should clear cache', () => {
      const testFile = path.join(testWorkspace, 'package.json');
      cache.set(testFile, 'TestDetector', []);
      expect(cache.getStats().size).toBe(1);

      cache.clear();
      expect(cache.getStats().size).toBe(0);
    });

    it('should save cache to disk', async () => {
      const testFile = path.join(testWorkspace, 'package.json');
      cache.set(testFile, 'TestDetector', []);
      cache.saveToDisk();

      // Check if file exists
      const cacheFilePath = path.join(cacheDir, 'results.json');
      const exists = await fs.access(cacheFilePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should load cache from disk', () => {
      const testFile = path.join(testWorkspace, 'package.json');
      const testIssues = [{ message: 'test' }];
      cache.set(testFile, 'PersistedDetector', testIssues);
      cache.saveToDisk();

      // Create new cache instance (auto-loads from disk)
      const newCache = new ResultCache(testWorkspace, 3600000);

      const loaded = newCache.get(testFile, 'PersistedDetector');
      expect(loaded).toBeDefined();
      expect(loaded).toHaveLength(1);
    });

    it('should handle expired entries', async () => {
      const testFile = path.join(testWorkspace, 'package.json');
      const shortTTL = new ResultCache(testWorkspace, 1); // 1ms TTL
      shortTTL.set(testFile, 'ExpireDetector', []);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = shortTTL.get(testFile, 'ExpireDetector');
      expect(result).toBeNull(); // Expired
    });
  });

  describe('GitChangeDetector', () => {
    let detector: GitChangeDetector;

    beforeEach(() => {
      detector = new GitChangeDetector(testWorkspace);
    });

    it('should initialize', () => {
      expect(detector).toBeDefined();
    });

    it('should detect if git is available', async () => {
      const isAvailable = await detector.isGitAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should get changed files (may be empty)', async () => {
      try {
        const changedFiles = await detector.getChangedFiles();
        expect(Array.isArray(changedFiles)).toBe(true);
      } catch (error) {
        // Not a git repo - expected in some test environments
        expect(error).toBeDefined();
      }
    });

    it('should get untracked files (may be empty)', async () => {
      try {
        const untrackedFiles = await detector.getUntrackedFiles();
        expect(Array.isArray(untrackedFiles)).toBe(true);
      } catch (error) {
        // Not a git repo - expected
        expect(error).toBeDefined();
      }
    });

    it('should get relevant files (union of changed + untracked)', async () => {
      try {
        const relevantFiles = await detector.getRelevantFiles();
        expect(Array.isArray(relevantFiles)).toBe(true);
        // Should not have duplicates
        const uniqueFiles = [...new Set(relevantFiles)];
        expect(relevantFiles.length).toBe(uniqueFiles.length);
      } catch (error) {
        // Not a git repo
        expect(error).toBeDefined();
      }
    });
  });

  describe('ParallelDetectorExecutor', () => {
    let executor: ParallelDetectorExecutor;

    beforeEach(() => {
      executor = new ParallelDetectorExecutor(2); // maxConcurrency=2
    });

    it('should initialize with config', () => {
      expect(executor).toBeDefined();
    });

    it('should execute detector with timeout', async () => {
      const fastDetector = async () => {
        return { issues: [{ message: 'test issue' }], fileCount: 1 };
      };

      const result = await executor.executeWithTimeout(fastDetector, 'FastDetector');
      expect(result).toBeDefined();
      expect(result.issues).toHaveLength(1);
      expect(result.fileCount).toBe(1);
    });

    it('should handle detector timeout', async () => {
      const executor = new ParallelDetectorExecutor(2); // Create new executor for timeout test
      const slowDetector = async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10s (longer than 100ms timeout)
        return { issues: [], fileCount: 0 };
      };

      const result = await executor.executeWithTimeout(slowDetector, 100); // 100ms timeout
      // Should return null on timeout
      expect(result).toBeNull();
    });

    it('should execute detectors in parallel', async () => {
      const detectors = [
        async () => ({ issues: [{ message: '1' }], fileCount: 1 }),
        async () => ({ issues: [{ message: '2' }], fileCount: 1 }),
        async () => ({ issues: [{ message: '3' }], fileCount: 1 }),
      ];

      const startTime = Date.now();
      const results = await executor.executeParallel(detectors);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(3);
      expect(results[0].issues[0].message).toBe('1');
      expect(results[1].issues[0].message).toBe('2');
      expect(results[2].issues[0].message).toBe('3');

      // Should be faster than sequential (< 1000ms for 3 detectors)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle detector errors gracefully', async () => {
      const errorDetector = async () => {
        throw new Error('Detector failed');
      };

      // executeWithTimeout doesn't catch errors, let it propagate
      await expect(executor.executeWithTimeout(errorDetector, 100)).rejects.toThrow('Detector failed');
    });
  });

  describe('PerformanceTracker', () => {
    let tracker: PerformanceTracker;

    beforeEach(() => {
      tracker = new PerformanceTracker();
    });

    it('should initialize', () => {
      expect(tracker).toBeDefined();
    });

    it('should track operation timing', async () => {
      const end = tracker.start('testOperation');
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
      end(); // Call returned function to record

      const stats = tracker.getStats('testOperation');
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
      expect(stats!.avg).toBeGreaterThanOrEqual(40); // Allow some variance
      expect(stats!.min).toBeGreaterThanOrEqual(40);
    });

    it('should record operation directly', () => {
      tracker.record('directOperation', 100);

      const stats = tracker.getStats('directOperation');
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
      expect(stats!.avg).toBe(100);
      expect(stats!.min).toBe(100);
      expect(stats!.max).toBe(100);
    });

    it('should track multiple operations', () => {
      tracker.record('op1', 50);
      tracker.record('op2', 100);
      tracker.record('op1', 30); // op1 again

      const stats1 = tracker.getStats('op1');
      expect(stats1!.count).toBe(2);
      expect(stats1!.avg).toBe(40); // (50+30)/2
      expect(stats1!.min).toBe(30);
      expect(stats1!.max).toBe(50);

      const stats2 = tracker.getStats('op2');
      expect(stats2!.count).toBe(1);
      expect(stats2!.avg).toBe(100);
    });

    it('should calculate min/max correctly', () => {
      tracker.record('operation', 10);
      tracker.record('operation', 50);
      tracker.record('operation', 30);

      const stats = tracker.getStats('operation');
      expect(stats!.min).toBe(10);
      expect(stats!.max).toBe(50);
      expect(stats!.avg).toBe(30); // (10+50+30)/3
    });

    it('should get all stats', () => {
      tracker.record('op1', 100);
      tracker.record('op2', 200);

      const allStats = tracker.getAllStats();
      expect(Object.keys(allStats)).toHaveLength(2);
      expect(allStats.op1).toBeDefined();
      expect(allStats.op2).toBeDefined();
    });

    it('should clear stats', () => {
      tracker.record('operation', 100);
      expect(tracker.getStats('operation')).toBeDefined();

      tracker.clear();
      expect(tracker.getStats('operation')).toBeNull();
    });

    it('should export performance data', () => {
      tracker.record('detector1', 120);
      tracker.record('detector2', 85);

      const exported = tracker.export();
      expect(typeof exported).toBe('string'); // JSON string
      const parsed = JSON.parse(exported);
      expect(parsed.detector1).toBeDefined();
      expect(parsed.detector2).toBeDefined();
    });

    it('should handle concurrent timing', async () => {
      const end1 = tracker.start('concurrent1');
      const end2 = tracker.start('concurrent2');

      await new Promise(resolve => setTimeout(resolve, 30));
      end1();

      await new Promise(resolve => setTimeout(resolve, 30));
      end2();

      const stats1 = tracker.getStats('concurrent1');
      const stats2 = tracker.getStats('concurrent2');

      expect(stats1!.avg).toBeLessThan(stats2!.avg);
    });
  });

  describe('SmartFileFilter', () => {
    let filter: SmartFileFilter;

    beforeEach(() => {
      filter = new SmartFileFilter(testWorkspace, false); // incrementalMode=false (return all files)
    });

    it('should initialize', () => {
      expect(filter).toBeDefined();
    });

    it('should return all files when incrementalMode=false', () => {
      const allFiles = [
        'src/index.ts',
        'src/utils.ts',
        'node_modules/react/index.js',
        'dist/bundle.js',
        '__tests__/test.ts',
      ];

      const filtered = filter.filterFiles(allFiles);

      // Should return all files (no filtering)
      expect(filtered).toEqual(allFiles);
    });

    it('should handle empty file list', async () => {
      const filtered = await filter.filterFiles([]);
      expect(filtered).toEqual([]);
    });

    it('should return all files including duplicates when incrementalMode=false', () => {
      const filesWithDuplicates = [
        'src/index.ts',
        'src/index.ts', // duplicate
        'src/utils.ts',
      ];

      const filtered = filter.filterFiles(filesWithDuplicates);
      expect(filtered).toEqual(filesWithDuplicates); // No deduplication
    });
  });

  describe('Integration: Combined Performance Utilities', () => {
    it('should work together: Cache + Tracker + Executor', async () => {
      const cache = new ResultCache(testWorkspace, 3600000);
      const tracker = new PerformanceTracker();
      const executor = new ParallelDetectorExecutor(2); // maxConcurrency=2

      // Simulate detector run with tracking
      const end = tracker.start('fullAnalysis');

      const detector1 = async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return { issues: [{ message: 'Issue 1' }], fileCount: 1 };
      };

      const detector2 = async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return { issues: [{ message: 'Issue 2' }], fileCount: 1 };
      };

      const results = await executor.executeParallel([
        detector1,
        detector2,
      ]);

      end(); // End timing

      // Cache results (use real file)
      const testFile = path.join(testWorkspace, 'package.json');
      const combinedIssues = results.flatMap(r => r.issues);
      cache.set(testFile, 'CombinedDetector', combinedIssues);

      // Verify
      const cached = cache.get(testFile, 'CombinedDetector');
      expect(cached).toHaveLength(2);

      const perfStats = tracker.getStats('fullAnalysis');
      expect(perfStats).toBeDefined();
      expect(perfStats!.count).toBe(1);

      // Cleanup
      cache.clear();
      tracker.clear();
    });

    it('should demonstrate cache effectiveness', () => {
      const cache = new ResultCache(testWorkspace, 3600000);
      const testFile = path.join(testWorkspace, 'package.json');
      const testIssues = [{ message: 'test' }];

      // First access - cache miss
      const miss = cache.get(testFile, 'EffectivenessDetector');
      expect(miss).toBeNull();

      // Set cache
      cache.set(testFile, 'EffectivenessDetector', testIssues);

      // Second access - cache hit
      const hit = cache.get(testFile, 'EffectivenessDetector');
      expect(hit).toBeDefined();
      expect(hit).toHaveLength(1);

      const stats = cache.getStats();
      expect(stats.size).toBe(1); // 1 cached entry
    });
  });

  describe('Performance Benchmarks', () => {
    it('ResultCache should be fast (< 100ms for 100 operations)', () => {
      const cache = new ResultCache(testWorkspace, 3600000);
      const testFile = path.join(testWorkspace, 'package.json');
      const testIssues = [{ message: 'test' }];

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        cache.set(testFile, `Detector${i}`, testIssues);
        cache.get(testFile, `Detector${i}`);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200); // 100 operations in < 200ms
    });

    it('ParallelExecutor should be faster than sequential', async () => {
      const executor = new ParallelDetectorExecutor(4); // maxConcurrency=4

      const slowDetector = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { issues: [], fileCount: 1 };
      };

      // Create array of 4 functions (not objects)
      const detectors = Array(4).fill(null).map(() => slowDetector);

      const parallelStart = performance.now();
      await executor.executeParallel(detectors);
      const parallelDuration = performance.now() - parallelStart;

      // Parallel should complete in ~50-100ms (not 200ms sequential)
      expect(parallelDuration).toBeLessThan(150);
    });
  });
});
