/**
 * Intelligent Test Result Caching System
 * 
 * Caches Guardian test results to avoid redundant testing
 * Uses content-based hashing to detect changes
 * 
 * Benefits:
 * - Faster CI/CD pipelines (skip tests for unchanged code)
 * - Reduced API costs (Lighthouse, axe-core)
 * - Historical trend tracking
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface CachedTestResult {
  url: string;
  contentHash: string; // SHA-256 hash of page HTML + CSS + JS
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
  results: {
    accessibility?: any;
    performance?: any;
    seo?: any;
    security?: any;
    [key: string]: any;
  };
  metadata: {
    userAgent: string;
    viewport: { width: number; height: number };
    networkCondition?: string;
    locale?: string;
  };
}

export interface CacheOptions {
  ttl?: number; // Default: 24 hours
  cacheDir?: string; // Default: .guardian/cache
  forceRefresh?: boolean; // Skip cache
  compareStrategy?: 'content-hash' | 'timestamp' | 'both';
}

export class GuardianCache {
  private cacheDir: string;
  private defaultTTL: number;

  constructor(options: CacheOptions = {}) {
    this.cacheDir = options.cacheDir || path.join(process.cwd(), '.guardian', 'cache');
    this.defaultTTL = options.ttl || 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Initialize cache directory
   */
  async init(): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  /**
   * Generate content hash from page resources
   */
  async generateContentHash(page: any): Promise<string> {
    try {
      const content = await page.evaluate(() => {
        // Collect HTML, CSS, and inline JS
        const html = document.documentElement.outerHTML;
        
        // Collect all inline styles
        const styles = Array.from(document.styleSheets)
          .filter(sheet => !sheet.href) // Only inline styles
          .map(sheet => {
            try {
              return Array.from(sheet.cssRules || [])
                .map(rule => rule.cssText)
                .join('');
            } catch {
              return '';
            }
          })
          .join('');

        // Collect inline scripts
        const scripts = Array.from(document.scripts)
          .filter(script => !script.src) // Only inline scripts
          .map(script => script.textContent || '')
          .join('');

        return { html, styles, scripts };
      });

      // Combine all content
      const combined = content.html + content.styles + content.scripts;
      
      // Generate SHA-256 hash
      return crypto.createHash('sha256').update(combined).digest('hex');
    } catch (error) {
      console.error('[Cache] Failed to generate content hash:', error);
      return crypto.createHash('sha256').update(Date.now().toString()).digest('hex');
    }
  }

  /**
   * Get cache key for URL
   */
  private getCacheKey(url: string): string {
    return crypto.createHash('md5').update(url).digest('hex');
  }

  /**
   * Get cache file path
   */
  private getCachePath(url: string): string {
    const key = this.getCacheKey(url);
    return path.join(this.cacheDir, `${key}.json`);
  }

  /**
   * Check if cached result is valid
   */
  private isValid(cached: CachedTestResult, contentHash: string, options: CacheOptions): boolean {
    const now = Date.now();
    const age = now - new Date(cached.timestamp).getTime();

    // Check TTL
    if (age > (options.ttl || this.defaultTTL)) {
      return false;
    }

    // Check content hash
    if (options.compareStrategy !== 'timestamp' && cached.contentHash !== contentHash) {
      return false;
    }

    return true;
  }

  /**
   * Get cached test result
   */
  async get(url: string, contentHash: string, options: CacheOptions = {}): Promise<CachedTestResult | null> {
    if (options.forceRefresh) {
      return null;
    }

    try {
      const cachePath = this.getCachePath(url);
      const data = await fs.readFile(cachePath, 'utf-8');
      const cached: CachedTestResult = JSON.parse(data);

      if (this.isValid(cached, contentHash, options)) {
        console.log(`[Cache] ✅ Hit for ${url} (age: ${Math.round((Date.now() - new Date(cached.timestamp).getTime()) / 1000 / 60)}min)`);
        return cached;
      } else {
        console.log(`[Cache] ❌ Miss for ${url} (expired or content changed)`);
        return null;
      }
    } catch (error) {
      // Cache miss or read error
      return null;
    }
  }

  /**
   * Store test result in cache
   */
  async set(url: string, contentHash: string, results: any, metadata: any, ttl?: number): Promise<void> {
    try {
      await this.init();

      const cached: CachedTestResult = {
        url,
        contentHash,
        timestamp: new Date(),
        ttl: ttl || this.defaultTTL,
        results,
        metadata,
      };

      const cachePath = this.getCachePath(url);
      await fs.writeFile(cachePath, JSON.stringify(cached, null, 2));
      
      console.log(`[Cache] 💾 Stored result for ${url}`);
    } catch (error) {
      console.error('[Cache] Failed to store result:', error);
    }
  }

  /**
   * Clear cache for specific URL
   */
  async clear(url: string): Promise<void> {
    try {
      const cachePath = this.getCachePath(url);
      await fs.unlink(cachePath);
      console.log(`[Cache] 🗑️  Cleared cache for ${url}`);
    } catch (error) {
      // File doesn't exist or error deleting
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(f => fs.unlink(path.join(this.cacheDir, f)))
      );
      console.log(`[Cache] 🗑️  Cleared ${files.length} cached result(s)`);
    } catch (error) {
      console.error('[Cache] Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalCached: number;
    totalSize: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      let totalSize = 0;
      let oldestEntry: Date | null = null;
      let newestEntry: Date | null = null;

      for (const file of jsonFiles) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;

        const data = await fs.readFile(filePath, 'utf-8');
        const cached: CachedTestResult = JSON.parse(data);
        const timestamp = new Date(cached.timestamp);

        if (!oldestEntry || timestamp < oldestEntry) {
          oldestEntry = timestamp;
        }
        if (!newestEntry || timestamp > newestEntry) {
          newestEntry = timestamp;
        }
      }

      return {
        totalCached: jsonFiles.length,
        totalSize,
        oldestEntry,
        newestEntry,
      };
    } catch (error) {
      return {
        totalCached: 0,
        totalSize: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }
  }

  /**
   * Prune expired cache entries
   */
  async prune(): Promise<number> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      let pruned = 0;

      for (const file of jsonFiles) {
        const filePath = path.join(this.cacheDir, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const cached: CachedTestResult = JSON.parse(data);

        const age = Date.now() - new Date(cached.timestamp).getTime();
        if (age > cached.ttl) {
          await fs.unlink(filePath);
          pruned++;
        }
      }

      console.log(`[Cache] 🧹 Pruned ${pruned} expired cache entry/entries`);
      return pruned;
    } catch (error) {
      console.error('[Cache] Failed to prune cache:', error);
      return 0;
    }
  }

  /**
   * Compare two cached results (for diffing)
   */
  async diff(url: string, previousHash?: string): Promise<{
    hasChanges: boolean;
    changedMetrics: string[];
    previous: CachedTestResult | null;
    previousContentHash: string | null;
  }> {
    try {
      const cachePath = this.getCachePath(url);
      const data = await fs.readFile(cachePath, 'utf-8');
      const current: CachedTestResult = JSON.parse(data);

      if (!previousHash) {
        return {
          hasChanges: true,
          changedMetrics: [],
          previous: null,
          previousContentHash: null,
        };
      }

      // Simple content hash comparison
      const hasChanges = current.contentHash !== previousHash;

      return {
        hasChanges,
        changedMetrics: [], // TODO: Implement detailed metric comparison
        previous: null, // TODO: Store historical results
        previousContentHash: previousHash,
      };
    } catch (error) {
      return {
        hasChanges: true,
        changedMetrics: [],
        previous: null,
        previousContentHash: null,
      };
    }
  }

  /**
   * Get cache hit rate (for monitoring)
   */
  async getHitRate(): Promise<{ hits: number; misses: number; rate: number }> {
    // TODO: Implement hit/miss tracking in metadata
    return { hits: 0, misses: 0, rate: 0 };
  }
}

/**
 * Example usage in Guardian CLI:
 * 
 * ```typescript
 * const cache = new GuardianCache({ ttl: 24 * 60 * 60 * 1000 });
 * await cache.init();
 * 
 * const contentHash = await cache.generateContentHash(page);
 * const cached = await cache.get(url, contentHash);
 * 
 * if (cached) {
 *   console.log('Using cached results');
 *   return cached.results;
 * }
 * 
 * // Run tests
 * const results = await runAllTests(page);
 * 
 * // Cache results
 * await cache.set(url, contentHash, results, metadata);
 * ```
 */
