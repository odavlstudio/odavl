/**
 * Global Caching Layer
 * Phase 3B: Cache analysis results, Guardian audits, and Autopilot fixes
 * 
 * Cache keys are based on:
 * - File content hashes (SHA-256)
 * - Detector list
 * - Request parameters
 * 
 * TTL (Time-To-Live): 1 hour default, configurable per category
 * 
 * @example
 * ```typescript
 * import { GlobalCache } from '@odavl/op-layer/cache';
 * 
 * // Cache analysis result
 * const cacheKey = GlobalCache.generateAnalysisKey(workspace, detectors);
 * GlobalCache.set('analysis', cacheKey, analysisResult, 3600000); // 1 hour
 * 
 * // Retrieve cached result
 * const cached = GlobalCache.get('analysis', cacheKey);
 * if (cached) {
 *   console.log('Cache hit! Skipping analysis.');
 *   return cached;
 * }
 * 
 * // Clear expired entries
 * GlobalCache.prune();
 * 
 * // Statistics
 * const stats = GlobalCache.getStats();
 * console.log(`Cache hit ratio: ${stats.hitRatio.toFixed(2)}%`);
 * ```
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Cache entry with TTL and metadata
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number; // milliseconds
  hits: number;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRatio: number; // percentage (0-100)
  categories: {
    analysis: number;
    guardian: number;
    fixes: number;
    patterns: number;
  };
  memoryUsageBytes: number;
}

/**
 * Cache category types
 */
export type CacheCategory = 'analysis' | 'guardian' | 'fixes' | 'patterns';

/**
 * Global cache singleton for ODAVL products
 */
class GlobalCacheManager {
  private analysis = new Map<string, CacheEntry<any>>();
  private guardian = new Map<string, CacheEntry<any>>();
  private fixes = new Map<string, CacheEntry<any>>();
  private patterns = new Map<string, CacheEntry<any>>();

  private hits = 0;
  private misses = 0;

  /**
   * Default TTL: 1 hour (3600000ms)
   */
  private readonly DEFAULT_TTL = 3600000;

  /**
   * Get cache map by category
   */
  private getCategoryMap(category: CacheCategory): Map<string, CacheEntry<any>> {
    switch (category) {
      case 'analysis':
        return this.analysis;
      case 'guardian':
        return this.guardian;
      case 'fixes':
        return this.fixes;
      case 'patterns':
        return this.patterns;
      default:
        throw new Error(`Unknown cache category: ${category}`);
    }
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(category: CacheCategory, key: string, value: T, ttl?: number): void {
    const map = this.getCategoryMap(category);
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl ?? this.DEFAULT_TTL,
      hits: 0,
    };
    map.set(key, entry);
  }

  /**
   * Get cache entry (null if expired or not found)
   */
  get<T>(category: CacheCategory, key: string): T | null {
    const map = this.getCategoryMap(category);
    const entry = map.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      map.delete(key); // Remove expired entry
      this.misses++;
      return null;
    }

    // Cache hit
    entry.hits++;
    this.hits++;
    return entry.value as T;
  }

  /**
   * Check if cache has valid (non-expired) entry
   */
  has(category: CacheCategory, key: string): boolean {
    return this.get(category, key) !== null;
  }

  /**
   * Delete cache entry
   */
  delete(category: CacheCategory, key: string): boolean {
    const map = this.getCategoryMap(category);
    return map.delete(key);
  }

  /**
   * Clear all entries in category
   */
  clear(category: CacheCategory): void {
    const map = this.getCategoryMap(category);
    map.clear();
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.analysis.clear();
    this.guardian.clear();
    this.fixes.clear();
    this.patterns.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Prune expired entries from all caches
   * Returns number of entries removed
   */
  prune(): number {
    let pruned = 0;
    const now = Date.now();

    const pruneMap = (map: Map<string, CacheEntry<any>>) => {
      for (const [key, entry] of map.entries()) {
        const age = now - entry.timestamp;
        if (age > entry.ttl) {
          map.delete(key);
          pruned++;
        }
      }
    };

    pruneMap(this.analysis);
    pruneMap(this.guardian);
    pruneMap(this.fixes);
    pruneMap(this.patterns);

    return pruned;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRatio = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;

    // Estimate memory usage (rough approximation)
    const estimateMapSize = (map: Map<string, CacheEntry<any>>): number => {
      let size = 0;
      for (const [key, entry] of map.entries()) {
        size += key.length * 2; // UTF-16 chars
        size += JSON.stringify(entry.value).length * 2;
        size += 32; // Metadata overhead
      }
      return size;
    };

    return {
      totalEntries: this.analysis.size + this.guardian.size + this.fixes.size + this.patterns.size,
      totalHits: this.hits,
      totalMisses: this.misses,
      hitRatio,
      categories: {
        analysis: this.analysis.size,
        guardian: this.guardian.size,
        fixes: this.fixes.size,
        patterns: this.patterns.size,
      },
      memoryUsageBytes:
        estimateMapSize(this.analysis) +
        estimateMapSize(this.guardian) +
        estimateMapSize(this.fixes) +
        estimateMapSize(this.patterns),
    };
  }

  /**
   * Generate cache key for analysis requests
   * Key format: sha256(workspace-root + detector-list + options)
   */
  async generateAnalysisKey(
    workspaceRoot: string,
    detectors: string[],
    options?: Record<string, any>
  ): Promise<string> {
    const fileHashes = await this.hashDirectory(workspaceRoot, 10); // Top 10 files
    const detectorList = detectors.sort().join(',');
    const optionsStr = options ? JSON.stringify(options) : '';

    const payload = `${fileHashes}:${detectorList}:${optionsStr}`;
    return this.hashString(payload);
  }

  /**
   * Generate cache key for Guardian audits
   * Key format: sha256(url + audit-kind + browsers + devices)
   */
  generateGuardianKey(
    url: string,
    kind: string,
    browsers?: string[],
    devices?: string[]
  ): string {
    const browserList = browsers?.sort().join(',') || 'chromium';
    const deviceList = devices?.sort().join(',') || 'desktop';

    const payload = `${url}:${kind}:${browserList}:${deviceList}`;
    return this.hashString(payload);
  }

  /**
   * Generate cache key for fix suggestions
   * Key format: sha256(issue-id + file-path + issue-content)
   */
  generateFixKey(issueId: string, filePath: string, issueContent: string): string {
    const payload = `${issueId}:${filePath}:${issueContent}`;
    return this.hashString(payload);
  }

  /**
   * Hash a directory (sample top N files for performance)
   * Returns concatenated SHA-256 hashes of file contents
   */
  private async hashDirectory(dirPath: string, maxFiles: number = 10): Promise<string> {
    try {
      const files = await this.scanDirectory(dirPath, maxFiles);
      const hashes: string[] = [];

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf8');
          const hash = this.hashString(content);
          hashes.push(hash.substring(0, 16)); // First 16 chars
        } catch {
          // Skip unreadable files
        }
      }

      return hashes.join('-');
    } catch {
      return 'no-files';
    }
  }

  /**
   * Recursively scan directory for files (max N files)
   */
  private async scanDirectory(dirPath: string, maxFiles: number): Promise<string[]> {
    const files: string[] = [];
    const ignorePatterns = ['node_modules', '.git', 'dist', '.next', 'out', '.odavl'];

    const scan = async (dir: string): Promise<void> => {
      if (files.length >= maxFiles) return;

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (files.length >= maxFiles) break;

          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (!ignorePatterns.some((pattern) => entry.name.includes(pattern))) {
              await scan(fullPath);
            }
          } else if (entry.isFile()) {
            // Prioritize source files
            if (
              entry.name.endsWith('.ts') ||
              entry.name.endsWith('.tsx') ||
              entry.name.endsWith('.js') ||
              entry.name.endsWith('.jsx')
            ) {
              files.push(fullPath);
            }
          }
        }
      } catch {
        // Skip unreadable directories
      }
    };

    await scan(dirPath);
    return files.slice(0, maxFiles);
  }

  /**
   * Hash a string using SHA-256
   */
  private hashString(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}

/**
 * Global cache singleton instance
 */
export const GlobalCache = new GlobalCacheManager();

/**
 * Auto-prune expired entries every 5 minutes
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const pruned = GlobalCache.prune();
    if (pruned > 0) {
      console.log(`[GlobalCache] Pruned ${pruned} expired entries`);
    }
  }, 300000); // 5 minutes
}
