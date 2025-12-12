/**
 * Wave 10 Enhanced + Wave 11: Detector Execution Abstraction
 * 
 * Provides pluggable interface for detector execution strategies.
 * - Sequential: Original behavior (default)
 * - Parallel (Promise): Simple Promise.allSettled concurrency (Wave 10)
 * - Parallel (Worker Pool): True multi-threaded execution (Wave 10)
 * - File-Parallel: Per-file parallelism with worker pool (Wave 11)
 */

import { selectDetectors } from './detector-router.js';
import { loadDetector, DetectorName } from './detector/detector-loader.js';
import { WorkerPool, Task } from './performance/worker-pool.js';
import * as os from 'node:os';

// Wave 11: Re-export file-parallel executor
export { FileParallelDetectorExecutor } from './execution/file-parallel-detector-executor.js';

/**
 * Context for detector execution
 */
export interface DetectorExecutionContext {
  workspaceRoot: string;
  detectorNames?: string[];
  onProgress?: ProgressCallback;
}

/**
 * Progress callback for streaming updates
 */
export type ProgressCallback = (event: ProgressEvent) => void;

export interface ProgressEvent {
  phase: 'collectFiles' | 'runDetectors' | 'aggregateResults' | 'complete';
  completed?: number;
  total?: number;
  message?: string;
  detectorName?: string;
}

/**
 * Result from detector execution
 */
export interface DetectorExecutionResult {
  detector: string;
  issues: any[];
  error?: string;
}

/**
 * Abstract interface for detector execution strategies
 */
export interface DetectorExecutor {
  /**
   * Execute detectors on the workspace
   * @param context Execution context with workspace root and optional detector list
   * @returns Array of issues from all detectors
   */
  runDetectors(context: DetectorExecutionContext): Promise<any[]>;
  
  /**
   * Cleanup resources (optional)
   */
  shutdown?(): Promise<void>;
}

/**
 * Sequential detector execution (current default behavior)
 * 
 * Runs detectors one at a time in the main thread.
 * This maintains exact compatibility with existing behavior.
 */
export class SequentialDetectorExecutor implements DetectorExecutor {
  async runDetectors(context: DetectorExecutionContext): Promise<any[]> {
    const { workspaceRoot, detectorNames } = context;
    
    // Use provided detectors or select defaults
    const detectors = detectorNames || selectDetectors(null);
    const allIssues: any[] = [];
    
    // Execute each detector sequentially (existing behavior)
    for (const detectorName of detectors) {
      try {
        const Detector = await loadDetector(detectorName as DetectorName);
        const detector = new Detector();
        const issues = await detector.detect(workspaceRoot);
        allIssues.push(...issues.map((issue: any) => ({ ...issue, detector: detectorName })));
      } catch (error: any) {
        console.error(`[AnalysisEngine] Detector ${detectorName} failed:`, error.message);
      }
    }
    
    return allIssues;
  }
}

/**
 * Parallel detector execution with optional worker pool (Wave 10 Enhanced)
 * 
 * Two modes:
 * 1. Promise-based (default): Simple Promise.allSettled concurrency
 * 2. Worker pool: True multi-threaded execution via worker-pool.ts
 * 
 * Worker pool provides better performance for large workspaces but has overhead.
 * Falls back to Promise-based if worker pool fails to initialize.
 */
export class ParallelDetectorExecutor implements DetectorExecutor {
  private maxConcurrency: number;
  private useWorkerPool: boolean;
  private workerPool: WorkerPool | null = null;
  private workerPoolInitialized = false;

  constructor(options: { maxConcurrency?: number; useWorkerPool?: boolean } = {}) {
    // Default to CPU count or 4, whichever is less (safety limit)
    this.maxConcurrency = options.maxConcurrency || Math.min(4, os.cpus().length);
    this.useWorkerPool = options.useWorkerPool ?? false;
  }
  
  private async initializeWorkerPool(): Promise<void> {
    if (this.workerPoolInitialized) return;
    
    try {
      this.workerPool = new WorkerPool({
        maxWorkers: this.maxConcurrency,
        verbose: false,
      });
      await this.workerPool.initialize();
      this.workerPoolInitialized = true;
    } catch (error: any) {
      console.warn('[ParallelDetectorExecutor] Worker pool init failed, falling back to Promise mode:', error.message);
      this.workerPool = null;
      this.useWorkerPool = false;
    }
  }

  async runDetectors(context: DetectorExecutionContext): Promise<any[]> {
    const { workspaceRoot, detectorNames, onProgress } = context;
    
    // Use provided detectors or select defaults
    const detectors = detectorNames || selectDetectors(null);
    
    // Report start
    onProgress?.({ phase: 'runDetectors', total: detectors.length, completed: 0, message: 'Starting detector execution...' });
    
    // Choose execution mode
    if (this.useWorkerPool) {
      return this.runWithWorkerPool(workspaceRoot, detectors, onProgress);
    }
    
    // Fallback: Promise-based execution
    return this.runWithPromises(workspaceRoot, detectors, onProgress);
  }
  
  private async runWithPromises(workspaceRoot: string, detectors: string[], onProgress?: ProgressCallback): Promise<any[]> {
    const allIssues: any[] = [];
    let completed = 0;
    
    // Process detectors in batches of maxConcurrency
    for (let i = 0; i < detectors.length; i += this.maxConcurrency) {
      const batch = detectors.slice(i, i + this.maxConcurrency);
      
      const results = await Promise.allSettled(
        batch.map(async (detectorName) => {
          try {
            const Detector = await loadDetector(detectorName as DetectorName);
            const detector = new Detector();
            const issues = await detector.detect(workspaceRoot);
            
            // Report progress
            completed++;
            onProgress?.({ 
              phase: 'runDetectors', 
              total: detectors.length, 
              completed, 
              detectorName,
              message: `Completed ${detectorName} (${completed}/${detectors.length})`
            });
            
            return issues.map((issue: any) => ({ ...issue, detector: detectorName }));
          } catch (error: any) {
            console.error(`[AnalysisEngine] Detector ${detectorName} failed:`, error.message);
            completed++;
            onProgress?.({ phase: 'runDetectors', total: detectors.length, completed, detectorName, message: `Failed: ${detectorName}` });
            return [];
          }
        })
      );
      
      // Collect successful results
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allIssues.push(...result.value);
        }
      }
    }
    
    return allIssues;
  }
  
  private async runWithWorkerPool(workspaceRoot: string, detectors: string[], onProgress?: ProgressCallback): Promise<any[]> {
    await this.initializeWorkerPool();
    
    // If worker pool failed to init, fall back to promises
    if (!this.workerPool) {
      return this.runWithPromises(workspaceRoot, detectors, onProgress);
    }
    
    // Create tasks for worker pool
    const tasks: Task[] = detectors.map((detectorName, index) => ({
      id: `detector-${index}-${detectorName}`,
      type: 'run-detector',
      data: { workspaceRoot, detectorName },
      priority: index === 0 ? 10 : 1, // First detector gets priority
    }));
    
    // Execute with worker pool
    const results = await this.workerPool.process(tasks);
    let completed = 0;
    
    const allIssues: any[] = [];
    for (const result of results) {
      completed++;
      const detectorName = detectors[completed - 1];
      
      if (result.success && result.data) {
        const issues = result.data.map((issue: any) => ({ ...issue, detector: detectorName }));
        allIssues.push(...issues);
      } else if (result.error) {
        console.error(`[ParallelDetectorExecutor] Detector ${detectorName} failed:`, result.error);
      }
      
      onProgress?.({ 
        phase: 'runDetectors', 
        total: detectors.length, 
        completed,
        detectorName,
        message: `Completed ${detectorName} (${completed}/${detectors.length})`
      });
    }
    
    return allIssues;
  }
  
  async shutdown(): Promise<void> {
    if (this.workerPool) {
      await this.workerPool.shutdown();
      this.workerPool = null;
      this.workerPoolInitialized = false;
    }
  }
}
