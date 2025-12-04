/**
 * Result Cache
 * 
 * Caches analysis results for unchanged files to avoid re-analysis.
 * Stores results with file hashes for cache invalidation.
 * 
 * Expected Improvement: Near-instant results for cached files (99% faster)
 * Current: 12.5s → Target: <100ms for fully cached runs
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Issue } from '../types';

export interface CachedResult {
  filePath: string;
  fileHash: string;
  issues: Issue[];
  detectorName: string;
  timestamp: number;
  analysisTime: number; // ms
}

export interface CacheStats {
  totalEntries: number;
  cacheSize: string;
  hitRate: number; // 0-1
  avgAnalysisTime: number; // ms
}

export class ResultCache {
  private cache: Map<string, CachedResult>;
  private cacheFile: string;
  private hits = 0;
  private misses = 0;

  constructor(cacheDir = '.odavl/cache') {
    this.cacheFile = path.join(cacheDir, 'results.json');
    this.cache = new Map();
  }

  /**
   * Load cache from disk
   */
  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.cacheFile, 'utf-8');
      const data = JSON.parse(content) as CachedResult[];

      this.cache = new Map(data.map((cr) => [this.getCacheKey(cr.filePath, cr.detectorName), cr]));

      console.log(`💎 Loaded result cache: ${this.cache.size} entries`);
    } catch {
      // No cache exists
      console.log('💎 No result cache found, starting fresh');
      this.cache = new Map();
    }
  }

  /**
   * Get cached result for a file
   * 
   * @param filePath Path to file
   * @param fileHash Current hash of file content
   * @param detectorName Name of detector
   * @returns Cached issues if found and hash matches, null otherwise
   */
  getCached(filePath: string, fileHash: string, detectorName: string): Issue[] | null {
    const key = this.getCacheKey(filePath, detectorName);
    const cached = this.cache.get(key);

    if (!cached) {
      this.misses++;
      return null;
    }

    // Check if hash matches (file hasn't changed)
    if (cached.fileHash !== fileHash) {
      this.misses++;
      return null;
    }

    // Cache hit!
    this.hits++;
    console.log(`      ⚡ Cache hit: ${path.basename(filePath)} (${detectorName})`);
    return cached.issues;
  }

  /**
   * Store result in cache
   */
  set(
    filePath: string,
    fileHash: string,
    issues: Issue[],
    detectorName: string,
    analysisTime: number
  ): void {
    const key = this.getCacheKey(filePath, detectorName);

    this.cache.set(key, {
      filePath,
      fileHash,
      issues,
      detectorName,
      timestamp: Date.now(),
      analysisTime,
    });
  }

  /**
   * Save cache to disk
   */
  async save(): Promise<void> {
    const cacheDir = path.dirname(this.cacheFile);
    await fs.mkdir(cacheDir, { recursive: true });

    const data = Array.from(this.cache.values());
    await fs.writeFile(this.cacheFile, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`💾 Saved result cache: ${data.length} entries`);
  }

  /**
   * Clear cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;

    try {
      await fs.unlink(this.cacheFile);
      console.log('🗑️  Result cache cleared');
    } catch {
      // Cache file doesn't exist
    }
  }

  /**
   * Remove entries for a specific file (when file is deleted)
   */
  removeFile(filePath: string): void {
    const keysToDelete: string[] = [];

    for (const [key, cached] of this.cache) {
      if (cached.filePath === filePath) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Remove old entries (older than specified days)
   */
  removeOldEntries(daysOld: number): void {
    const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const keysToDelete: string[] = [];

    for (const [key, cached] of this.cache) {
      if (cached.timestamp < cutoff) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`🗑️  Removed ${keysToDelete.length} old cache entries (>${daysOld} days)`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalQueries = this.hits + this.misses;
    const hitRate = totalQueries > 0 ? this.hits / totalQueries : 0;

    const entries = Array.from(this.cache.values());
    const avgAnalysisTime =
      entries.length > 0
        ? entries.reduce((sum, e) => sum + e.analysisTime, 0) / entries.length
        : 0;

    return {
      totalEntries: this.cache.size,
      cacheSize: `${(JSON.stringify(entries).length / 1024).toFixed(2)}KB`,
      hitRate,
      avgAnalysisTime,
    };
  }

  /**
   * Print cache statistics
   */
  printStats(): void {
    const stats = this.getStats();
    const totalQueries = this.hits + this.misses;

    console.log('\n💎 Result Cache Statistics:');
    console.log(`   Total entries:    ${stats.totalEntries}`);
    console.log(`   Cache size:       ${stats.cacheSize}`);
    
    if (totalQueries > 0) {
      console.log(`   Queries:          ${totalQueries}`);
      console.log(`   Hits:             ${this.hits} (${(stats.hitRate * 100).toFixed(1)}%)`);
      console.log(`   Misses:           ${this.misses} (${((1 - stats.hitRate) * 100).toFixed(1)}%)`);
      console.log(`   Avg analysis:     ${stats.avgAnalysisTime.toFixed(0)}ms`);
      
      // Calculate time saved
      const timeSaved = this.hits * stats.avgAnalysisTime;
      if (timeSaved > 1000) {
        console.log(`   ⚡ Time saved:     ${(timeSaved / 1000).toFixed(2)}s`);
      } else {
        console.log(`   ⚡ Time saved:     ${timeSaved.toFixed(0)}ms`);
      }
    }
  }

  /**
   * Get cache key for a file + detector combination
   */
  private getCacheKey(filePath: string, detectorName: string): string {
    return `${filePath}:${detectorName}`;
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }

  /**
   * Reset hit/miss counters
   */
  resetCounters(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

/**
 * Example usage:
 * 
 * const cache = new ResultCache();
 * await cache.load();
 * 
 * // Check cache before analysis
 * const cached = cache.getCached(filePath, fileHash, 'typescript');
 * 
 * if (cached) {
 *   // Use cached results (instant!)
 *   return cached;
 * } else {
 *   // Analyze file
 *   const issues = await detector.analyze(filePath);
 *   
 *   // Store in cache
 *   cache.set(filePath, fileHash, issues, 'typescript', analysisTime);
 *   
 *   return issues;
 * }
 * 
 * // Save cache for next run
 * await cache.save();
 * cache.printStats();
 * 
 * // Example output:
 * // First run:  1,247 files analyzed (~12.5s)
 * // Next run:   0 files analyzed, 1,247 cached (<100ms) - 99% faster!
 * // After edit: 1 file analyzed, 1,246 cached (~10ms + 90ms = 100ms) - 99% faster!
 */
