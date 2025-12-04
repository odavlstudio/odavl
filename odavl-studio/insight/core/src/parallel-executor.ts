/**
 * Parallel Executor
 * 
 * Runs multiple detectors in parallel to reduce overall analysis time.
 * Uses worker threads for CPU-intensive analysis.
 * 
 * Expected Improvement: 50-70% faster analysis
 * Current: 12.5s → Target: 6.2s
 */

import { Worker } from 'node:worker_threads';
import * as os from 'node:os';
import type { Detector, Issue } from '../types';

export interface ParallelExecutorOptions {
  maxWorkers?: number;
  workerTimeout?: number; // ms
}

export class ParallelExecutor {
  private maxWorkers: number;
  private workerTimeout: number;

  constructor(options: ParallelExecutorOptions = {}) {
    this.maxWorkers = options.maxWorkers || Math.min(4, os.cpus().length);
    this.workerTimeout = options.workerTimeout || 30000; // 30s default
  }

  /**
   * Run detectors in parallel
   * 
   * Strategy:
   * 1. Group detectors by execution time (heavy vs light)
   * 2. Run heavy detectors first in parallel (TypeScript, ESLint)
   * 3. Run light detectors in parallel after
   * 
   * @param detectors Array of detectors to run
   * @param workspacePath Path to workspace root
   * @returns Map of detector names to issues found
   */
  async runDetectors(
    detectors: Detector[],
    workspacePath: string
  ): Promise<Map<string, Issue[]>> {
    console.log(`🚀 Running ${detectors.length} detectors in parallel (max ${this.maxWorkers} workers)`);

    const results = new Map<string, Issue[]>();

    // Group detectors by expected execution time
    const heavyDetectors = detectors.filter((d) =>
      ['typescript', 'eslint', 'complexity'].includes(d.name)
    );
    const lightDetectors = detectors.filter((d) =>
      !['typescript', 'eslint', 'complexity'].includes(d.name)
    );

    console.log(`   Heavy detectors: ${heavyDetectors.length} (typescript, eslint, complexity)`);
    console.log(`   Light detectors: ${lightDetectors.length} (all others)`);

    // Run heavy detectors first in parallel (most time-consuming)
    if (heavyDetectors.length > 0) {
      console.log('   Running heavy detectors...');
      const heavyResults = await this.runInParallel(heavyDetectors, workspacePath);
      heavyResults.forEach((issues, name) => results.set(name, issues));
    }

    // Run light detectors in parallel
    if (lightDetectors.length > 0) {
      console.log('   Running light detectors...');
      const lightResults = await this.runInParallel(lightDetectors, workspacePath);
      lightResults.forEach((issues, name) => results.set(name, issues));
    }

    return results;
  }

  /**
   * Run a batch of detectors in parallel
   */
  private async runInParallel(
    detectors: Detector[],
    workspacePath: string
  ): Promise<Map<string, Issue[]>> {
    // Split detectors into chunks for parallel execution
    const chunks = this.chunkArray(detectors, this.maxWorkers);
    const results = new Map<string, Issue[]>();

    // Run chunks in parallel
    await Promise.all(
      chunks.map(async (chunk, chunkIndex) => {
        console.log(`      Chunk ${chunkIndex + 1}: [${chunk.map((d) => d.name).join(', ')}]`);

        for (const detector of chunk) {
          const startTime = Date.now();
          
          try {
            const issues = await this.runWithTimeout(
              () => detector.analyze(workspacePath),
              this.workerTimeout,
              detector.name
            );
            
            const duration = Date.now() - startTime;
            console.log(`      ✓ ${detector.name}: ${issues.length} issues (${duration}ms)`);
            results.set(detector.name, issues);
          } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`      ✗ ${detector.name}: Failed (${duration}ms)`, error);
            results.set(detector.name, []);
          }
        }
      })
    );

    return results;
  }

  /**
   * Run a function with timeout
   */
  private async runWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number,
    detectorName: string
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Detector ${detectorName} timed out after ${timeout}ms`)),
          timeout
        )
      ),
    ]);
  }

  /**
   * Split array into chunks for parallel processing
   */
  private chunkArray<T>(array: T[], chunkCount: number): T[][] {
    const chunkSize = Math.ceil(array.length / chunkCount);
    const chunks: T[][] = [];

    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }

    return chunks;
  }

  /**
   * Get optimal worker count based on system resources
   */
  static getOptimalWorkerCount(): number {
    const cpus = os.cpus().length;
    
    // Use 75% of available CPUs, min 2, max 8
    return Math.max(2, Math.min(8, Math.floor(cpus * 0.75)));
  }

  /**
   * Get system resource information
   */
  static getSystemInfo(): {
    cpus: number;
    freeMem: string;
    totalMem: string;
    platform: string;
  } {
    return {
      cpus: os.cpus().length,
      freeMem: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)}GB`,
      totalMem: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}GB`,
      platform: os.platform(),
    };
  }
}

/**
 * Example usage:
 * 
 * const executor = new ParallelExecutor({ maxWorkers: 4 });
 * const detectors = [
 *   new TypeScriptDetector(),
 *   new ESLintDetector(),
 *   new SecurityDetector(),
 *   // ... more detectors
 * ];
 * 
 * const results = await executor.runDetectors(detectors, '/path/to/workspace');
 * 
 * results.forEach((issues, detectorName) => {
 *   console.log(`${detectorName}: ${issues.length} issues`);
 * });
 */
