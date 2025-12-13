/**
 * Phase 1.4.2 – Incremental Core Engine (ICE)
 * Cache Manager for Incremental Analysis
 */

import * as path from 'node:path';
import { ensureDir, readJsonSafe, writeJson, hashFiles } from './fs-utils.js';

export interface FileHashCache {
  [filePath: string]: string; // filePath → hash
}

export interface DetectorResultCache {
  [filePath: string]: {
    [detector: string]: any[]; // detector → issues array
  };
}

export interface IncrementalCacheData {
  files: FileHashCache;
  results: DetectorResultCache;
  version: string; // Cache format version
  timestamp: number; // Last update timestamp
}

/**
 * Incremental Analysis Cache Manager
 * Manages persistent cache in .odavl/.insight-cache/
 */
export class IncrementalCache {
  private cacheDir: string;
  private filesPath: string;
  private resultsPath: string;
  private data: IncrementalCacheData | null = null;

  constructor(workspaceRoot: string) {
    this.cacheDir = path.join(workspaceRoot, '.odavl', '.insight-cache');
    this.filesPath = path.join(this.cacheDir, 'files.json');
    this.resultsPath = path.join(this.cacheDir, 'results.json');
  }

  /**
   * Load cache from disk
   * Auto-resets if corrupted or version mismatch
   */
  async load(): Promise<void> {
    await ensureDir(this.cacheDir);
    
    const files = await readJsonSafe<FileHashCache>(this.filesPath, {});
    const results = await readJsonSafe<DetectorResultCache>(this.resultsPath, {});
    
    this.data = {
      files,
      results,
      version: '1.0',
      timestamp: Date.now()
    };
  }

  /**
   * Save cache to disk
   */
  async save(): Promise<void> {
    if (!this.data) return;
    
    await ensureDir(this.cacheDir);
    this.data.timestamp = Date.now();
    
    await writeJson(this.filesPath, this.data.files);
    await writeJson(this.resultsPath, this.data.results);
  }

  /**
   * Determine which files changed by comparing hashes
   * @param currentFiles Files to analyze
   * @returns Object with changed and unchanged file lists
   */
  async detectChanges(currentFiles: string[]): Promise<{
    changed: string[];
    unchanged: string[];
    newHashes: Map<string, string>;
  }> {
    if (!this.data) await this.load();
    
    const newHashes = await hashFiles(currentFiles);
    const changed: string[] = [];
    const unchanged: string[] = [];
    
    for (const file of currentFiles) {
      const oldHash = this.data!.files[file];
      const newHash = newHashes.get(file) || '';
      
      if (oldHash === newHash && oldHash !== '') {
        unchanged.push(file);
      } else {
        changed.push(file);
      }
    }
    
    return { changed, unchanged, newHashes };
  }

  /**
   * Get cached results for a file and detector
   * @param file File path
   * @param detector Detector name
   * @returns Cached issues or null if not cached
   */
  getCachedResult(file: string, detector: string): any[] | null {
    if (!this.data) return null;
    
    const fileCache = this.data.results[file];
    if (!fileCache) return null;
    
    return fileCache[detector] || null;
  }

  /**
   * Store results for a file and detector
   * @param file File path
   * @param detector Detector name
   * @param issues Issues found
   */
  setCachedResult(file: string, detector: string, issues: any[]): void {
    if (!this.data) return;
    
    if (!this.data.results[file]) {
      this.data.results[file] = {};
    }
    
    this.data.results[file][detector] = issues;
  }

  /**
   * Update file hashes in cache
   * @param hashes Map of file → hash
   */
  updateFileHashes(hashes: Map<string, string>): void {
    if (!this.data) return;
    
    for (const [file, hash] of hashes.entries()) {
      this.data.files[file] = hash;
    }
  }

  /**
   * Clear cache for specific files (when deleted or moved)
   * @param files Files to remove from cache
   */
  clearFiles(files: string[]): void {
    if (!this.data) return;
    
    for (const file of files) {
      delete this.data.files[file];
      delete this.data.results[file];
    }
  }

  /**
   * Reset entire cache
   */
  reset(): void {
    this.data = {
      files: {},
      results: {},
      version: '1.0',
      timestamp: Date.now()
    };
  }
}
