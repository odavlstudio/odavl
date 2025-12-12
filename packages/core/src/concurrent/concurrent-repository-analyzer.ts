/**
 * Concurrent Repository Analyzer
 * 
 * Analyzes multiple repositories in parallel.
 * Critical for CI/CD pipelines and enterprise deployments.
 * 
 * @since Phase 1 Week 22 (December 2025)
 */

import { EventEmitter } from 'node:events';
import { createWorkerPool } from '../performance/worker-pool';
import { createCache } from '../cache/redis-cache';
import { createIncrementalAnalyzer } from '../analysis/incremental-analyzer';

export interface RepositoryAnalysisOptions {
  maxConcurrent?: number; // Max repos analyzed simultaneously (default: 5)
  timeout?: number; // Timeout per repo in ms (default: 300000 = 5min)
  cache?: boolean; // Enable caching (default: true)
  incremental?: boolean; // Enable incremental analysis (default: true)
  workerCount?: number; // Worker threads per repo (default: CPU count)
}

export interface Repository {
  id: string; // Unique repository identifier
  name: string; // Repository name
  path: string; // Absolute path to repository
  branch?: string; // Branch to analyze (default: current)
  priority?: number; // Analysis priority (1-10, default: 5)
}

export interface AnalysisResult {
  repositoryId: string;
  repository: string;
  success: boolean;
  duration: number; // ms
  issues: any[]; // Detected issues
  metrics: AnalysisMetrics;
  error?: string;
  timestamp: string;
}

export interface AnalysisMetrics {
  filesAnalyzed: number;
  linesOfCode: number;
  issuesFound: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface ConcurrentAnalysisResult {
  repositories: AnalysisResult[];
  summary: AnalysisSummary;
  duration: number;
}

export interface AnalysisSummary {
  total: number;
  successful: number;
  failed: number;
  totalIssues: number;
  totalLOC: number;
  avgDuration: number;
}

/**
 * Concurrent repository analyzer
 */
export class ConcurrentRepositoryAnalyzer extends EventEmitter {
  private options: Required<RepositoryAnalysisOptions>;
  private activeAnalyses = new Map<string, Promise<AnalysisResult>>();
  private cache?: any;
  private workerPool?: any;

  constructor(options: RepositoryAnalysisOptions = {}) {
    super();
    this.options = {
      maxConcurrent: options.maxConcurrent || 5,
      timeout: options.timeout || 300000, // 5 minutes
      cache: options.cache !== false,
      incremental: options.incremental !== false,
      workerCount: options.workerCount || 0, // 0 = use CPU count
    };
  }

  /**
   * Analyze multiple repositories concurrently
   */
  async analyzeRepositories(repositories: Repository[]): Promise<ConcurrentAnalysisResult> {
    const startTime = Date.now();

    // Initialize resources
    await this.initialize();

    // Sort by priority
    const sorted = repositories.sort((a, b) => (b.priority || 5) - (a.priority || 5));

    // Process in batches
    const results: AnalysisResult[] = [];
    for (let i = 0; i < sorted.length; i += this.options.maxConcurrent) {
      const batch = sorted.slice(i, i + this.options.maxConcurrent);
      
      this.emit('batchStart', { batch: Math.floor(i / this.options.maxConcurrent) + 1, repos: batch.length });

      const batchResults = await Promise.all(
        batch.map(repo => this.analyzeRepository(repo))
      );

      results.push(...batchResults);

      this.emit('batchComplete', { completed: results.length, total: sorted.length });
    }

    // Cleanup
    await this.cleanup();

    const duration = Date.now() - startTime;
    const summary = this.generateSummary(results);

    this.emit('complete', { results, summary, duration });

    return {
      repositories: results,
      summary,
      duration,
    };
  }

  /**
   * Analyze single repository
   */
  async analyzeRepository(repo: Repository): Promise<AnalysisResult> {
    const startTime = Date.now();

    this.emit('repoStart', { id: repo.id, name: repo.name });

    try {
      // Check cache
      const cached = this.options.cache
        ? await this.checkCache(repo)
        : null;

      if (cached) {
        this.emit('cacheHit', { id: repo.id });
        return cached;
      }

      // Run analysis with timeout
      const result = await Promise.race([
        this.runAnalysis(repo),
        this.createTimeout(repo.id),
      ]);

      // Cache result
      if (this.options.cache && result.success) {
        await this.cacheResult(repo, result);
      }

      const duration = Date.now() - startTime;
      const finalResult = { ...result, duration };

      this.emit('repoComplete', { id: repo.id, success: true, duration });

      return finalResult;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      const errorResult: AnalysisResult = {
        repositoryId: repo.id,
        repository: repo.name,
        success: false,
        duration,
        issues: [],
        metrics: {
          filesAnalyzed: 0,
          linesOfCode: 0,
          issuesFound: 0,
          cacheHits: 0,
          cacheMisses: 0,
        },
        error: error.message,
        timestamp: new Date().toISOString(),
      };

      this.emit('repoError', { id: repo.id, error: error.message });

      return errorResult;
    }
  }

  /**
   * Run actual analysis
   */
  private async runAnalysis(repo: Repository): Promise<AnalysisResult> {
    // Get analysis scope
    const analyzer = createIncrementalAnalyzer(repo.path);
    const scope = await analyzer.getScope();

    this.emit('scopeDetermined', {
      id: repo.id,
      scope: scope.scope,
      files: scope.totalFiles,
    });

    // Analyze files using worker pool
    const issues: any[] = [];
    let filesAnalyzed = 0;
    let linesOfCode = 0;

    if (this.workerPool) {
      const tasks = scope.files.map(file => ({
        id: file.path,
        type: 'analyze-file',
        data: {
          filePath: file.path,
          detectors: ['typescript', 'eslint', 'security'],
        },
      }));

      const results = await this.workerPool.process(tasks);

      for (const result of results) {
        if (result.success && result.data) {
          issues.push(...result.data.issues);
          filesAnalyzed++;
          linesOfCode += result.data.loc || 0;
        }
      }
    }

    return {
      repositoryId: repo.id,
      repository: repo.name,
      success: true,
      duration: 0, // Will be set by caller
      issues,
      metrics: {
        filesAnalyzed,
        linesOfCode,
        issuesFound: issues.length,
        cacheHits: 0,
        cacheMisses: 0,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check cache for existing result
   */
  private async checkCache(repo: Repository): Promise<AnalysisResult | null> {
    if (!this.cache) return null;

    try {
      const key = `repo:${repo.id}:${repo.branch || 'HEAD'}`;
      return await this.cache.get<AnalysisResult>(key);
    } catch {
      return null;
    }
  }

  /**
   * Cache analysis result
   */
  private async cacheResult(repo: Repository, result: AnalysisResult): Promise<void> {
    if (!this.cache) return;

    try {
      const key = `repo:${repo.id}:${repo.branch || 'HEAD'}`;
      await this.cache.set(key, result, 3600); // 1 hour TTL
    } catch (error: any) {
      this.emit('cacheError', { id: repo.id, error: error.message });
    }
  }

  /**
   * Create timeout promise
   */
  private createTimeout(repoId: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Analysis timeout for repository: ${repoId}`));
      }, this.options.timeout);
    });
  }

  /**
   * Initialize resources
   */
  private async initialize(): Promise<void> {
    // Initialize worker pool
    this.workerPool = await createWorkerPool({
      maxWorkers: this.options.workerCount || undefined,
    });

    // Initialize cache
    if (this.options.cache) {
      this.cache = createCache();
      await this.cache.connect();
    }

    this.emit('initialized');
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    if (this.workerPool) {
      await this.workerPool.shutdown();
    }

    if (this.cache) {
      await this.cache.disconnect();
    }

    this.emit('cleanup');
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(results: AnalysisResult[]): AnalysisSummary {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalIssues = results.reduce((sum, r) => sum + r.metrics.issuesFound, 0);
    const totalLOC = results.reduce((sum, r) => sum + r.metrics.linesOfCode, 0);
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    return {
      total: results.length,
      successful,
      failed,
      totalIssues,
      totalLOC,
      avgDuration,
    };
  }

  /**
   * Get active analyses count
   */
  getActiveCount(): number {
    return this.activeAnalyses.size;
  }

  /**
   * Cancel all analyses
   */
  async cancelAll(): Promise<void> {
    this.activeAnalyses.clear();
    await this.cleanup();
    this.emit('cancelled');
  }
}

/**
 * Helper: Create concurrent analyzer
 */
export function createConcurrentAnalyzer(
  options?: RepositoryAnalysisOptions
): ConcurrentRepositoryAnalyzer {
  return new ConcurrentRepositoryAnalyzer(options);
}

/**
 * Helper: Analyze repositories
 */
export async function analyzeRepositories(
  repositories: Repository[],
  options?: RepositoryAnalysisOptions
): Promise<ConcurrentAnalysisResult> {
  const analyzer = createConcurrentAnalyzer(options);
  return analyzer.analyzeRepositories(repositories);
}

export default ConcurrentRepositoryAnalyzer;
