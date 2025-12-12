/**
 * @fileoverview Performance optimization utilities for ODAVL Insight
 * 
 * PHASE 3: Speed up analysis from 148s to <15s
 * 
 * Strategies:
 * 1. Result caching (file hash → issues)
 * 2. Parallel detector execution
 * 3. Smart file filtering (git diff)
 * 4. Incremental analysis
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { safeReadFile } from './safe-file-reader';
import { execSync } from 'child_process';

/**
 * Cache entry for detector results
 */
export interface CacheEntry {
    fileHash: string;
    timestamp: number;
    issues: any[];
    detectorVersion: string;
}

/**
 * Cache storage (in-memory + disk persistence)
 */
export class ResultCache {
    private cache: Map<string, CacheEntry> = new Map();
    private cacheDir: string;
    private maxAge: number; // milliseconds

    constructor(workspaceRoot: string, maxAge: number = 3600000) { // 1 hour default
        this.cacheDir = path.join(workspaceRoot, '.odavl', 'cache');
        this.maxAge = maxAge;
        this.ensureCacheDir();
        this.loadFromDisk();
    }

    /**
     * Get cached result if valid
     */
    get(filePath: string, detectorName: string): any[] | null {
        const key = this.getCacheKey(filePath, detectorName);
        const entry = this.cache.get(key);

        if (!entry) return null;

        // Check if cache expired
        if (Date.now() - entry.timestamp > this.maxAge) {
            this.cache.delete(key);
            return null;
        }

        // Check if file changed
        const currentHash = this.hashFile(filePath);
        if (currentHash !== entry.fileHash) {
            this.cache.delete(key);
            return null;
        }

        return entry.issues;
    }

    /**
     * Store result in cache
     */
    set(filePath: string, detectorName: string, issues: any[], detectorVersion: string = '1.0.0'): void {
        const key = this.getCacheKey(filePath, detectorName);
        const entry: CacheEntry = {
            fileHash: this.hashFile(filePath),
            timestamp: Date.now(),
            issues,
            detectorVersion
        };

        this.cache.set(key, entry);
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
        if (fs.existsSync(this.cacheDir)) {
            fs.rmSync(this.cacheDir, { recursive: true });
        }
        this.ensureCacheDir();
    }

    /**
     * Save cache to disk for persistence
     */
    saveToDisk(): void {
        const cacheFile = path.join(this.cacheDir, 'results.json');
        const cacheData = Array.from(this.cache.entries());
        fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
    }

    /**
     * Load cache from disk
     */
    private loadFromDisk(): void {
        const cacheFile = path.join(this.cacheDir, 'results.json');
        if (fs.existsSync(cacheFile)) {
            try {
                const content = safeReadFile(cacheFile);
                if (!content) {
                    console.error('[ResultCache] Failed to read cache file');
                    return;
                }
                const cacheData = JSON.parse(content);
                this.cache = new Map(cacheData);
            } catch (error) {
                console.error('[ResultCache] Failed to load cache:', error);
            }
        }
    }

    /**
     * Get statistics
     */
    getStats(): { size: number; oldestEntry: number; newestEntry: number } {
        let oldest = Date.now();
        let newest = 0;

        for (const entry of this.cache.values()) {
            if (entry.timestamp < oldest) oldest = entry.timestamp;
            if (entry.timestamp > newest) newest = entry.timestamp;
        }

        return {
            size: this.cache.size,
            oldestEntry: oldest,
            newestEntry: newest
        };
    }

    /**
     * Generate cache key
     */
    private getCacheKey(filePath: string, detectorName: string): string {
        return `${detectorName}:${filePath}`;
    }

    /**
     * Hash file content
     */
    private hashFile(filePath: string): string {
        try {
            // Skip large files (>50MB)
            const stats = fs.statSync(filePath);
            if (stats.size > 50 * 1024 * 1024) {
                return '';
            }
            
            const content = safeReadFile(filePath);
            if (!content) {
                return '';
            }
            return crypto.createHash('sha256').update(content).digest('hex');
        } catch (error) {
            return '';
        }
    }

    /**
     * Ensure cache directory exists
     */
    private ensureCacheDir(): void {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }
}

/**
 * Git-based change detector
 */
export class GitChangeDetector {
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Get changed files since last commit
     */
    getChangedFiles(): string[] {
        try {
            const output = execSync('git diff --name-only HEAD', {
                cwd: this.workspaceRoot,
                encoding: 'utf8',
                stdio: 'pipe'
            });

            return output.split('\n').filter(f => f.trim());
        } catch (error) {
            // Not a git repo or git not available
            return [];
        }
    }

    /**
     * Get untracked files
     */
    getUntrackedFiles(): string[] {
        try {
            const output = execSync('git ls-files --others --exclude-standard', {
                cwd: this.workspaceRoot,
                encoding: 'utf8',
                stdio: 'pipe'
            });

            return output.split('\n').filter(f => f.trim());
        } catch (error) {
            return [];
        }
    }

    /**
     * Get all relevant files for incremental analysis
     */
    getRelevantFiles(): string[] {
        const changed = this.getChangedFiles();
        const untracked = this.getUntrackedFiles();
        return [...new Set([...changed, ...untracked])];
    }

    /**
     * Check if git is available
     */
    isGitAvailable(): boolean {
        try {
            execSync('git --version', {
                cwd: this.workspaceRoot,
                stdio: 'ignore'
            });
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Parallel executor for detectors
 */
export class ParallelDetectorExecutor {
    private maxConcurrency: number;

    constructor(maxConcurrency: number = 4) {
        this.maxConcurrency = maxConcurrency;
    }

    /**
     * Execute detectors in parallel batches
     */
    async executeParallel<T>(
        detectors: Array<() => Promise<T>>
    ): Promise<T[]> {
        const results: T[] = [];
        
        for (let i = 0; i < detectors.length; i += this.maxConcurrency) {
            const batch = detectors.slice(i, i + this.maxConcurrency);
            const batchResults = await Promise.all(batch.map(d => d()));
            results.push(...batchResults);
        }

        return results;
    }

    /**
     * Execute with timeout
     */
    async executeWithTimeout<T>(
        fn: () => Promise<T>,
        timeoutMs: number
    ): Promise<T | null> {
        return Promise.race([
            fn(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
        ]);
    }
}

/**
 * Performance metrics tracker
 */
export class PerformanceTracker {
    private metrics: Map<string, number[]> = new Map();

    /**
     * Start timing operation
     */
    start(operation: string): () => void {
        const startTime = Date.now();
        
        return () => {
            const duration = Date.now() - startTime;
            const existing = this.metrics.get(operation) || [];
            existing.push(duration);
            this.metrics.set(operation, existing);
        };
    }

    /**
     * Record duration directly
     */
    record(operation: string, durationMs: number): void {
        const existing = this.metrics.get(operation) || [];
        existing.push(durationMs);
        this.metrics.set(operation, existing);
    }

    /**
     * Get statistics for operation
     */
    getStats(operation: string): { avg: number; min: number; max: number; count: number } | null {
        const durations = this.metrics.get(operation);
        if (!durations || durations.length === 0) return null;

        return {
            avg: durations.reduce((a, b) => a + b, 0) / durations.length,
            min: Math.min(...durations),
            max: Math.max(...durations),
            count: durations.length
        };
    }

    /**
     * Get all metrics
     */
    getAllStats(): Record<string, ReturnType<PerformanceTracker['getStats']>> {
        const result: Record<string, any> = {};
        for (const [operation, _] of this.metrics) {
            result[operation] = this.getStats(operation);
        }
        return result;
    }

    /**
     * Clear metrics
     */
    clear(): void {
        this.metrics.clear();
    }

    /**
     * Export to JSON
     */
    export(): string {
        return JSON.stringify(this.getAllStats(), null, 2);
    }
}

/**
 * Smart file filter - combines ignore patterns + git changes
 */
export class SmartFileFilter {
    private gitDetector: GitChangeDetector;
    private incrementalMode: boolean;

    constructor(workspaceRoot: string, incrementalMode: boolean = false) {
        this.gitDetector = new GitChangeDetector(workspaceRoot);
        this.incrementalMode = incrementalMode;
    }

    /**
     * Filter files based on strategy
     */
    filterFiles(allFiles: string[]): string[] {
        if (!this.incrementalMode || !this.gitDetector.isGitAvailable()) {
            return allFiles;
        }

        const relevantFiles = this.gitDetector.getRelevantFiles();
        if (relevantFiles.length === 0) {
            // No changes detected, return all files (might be first run)
            return allFiles;
        }

        // Filter to only changed files
        const changedSet = new Set(relevantFiles);
        return allFiles.filter(f => {
            const relative = path.relative(process.cwd(), f);
            return changedSet.has(relative);
        });
    }
}
