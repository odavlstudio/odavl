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
import { loadDetector, DetectorName, getDetectorMetadata } from './detector/detector-loader.js';
import { WorkerPool, Task } from './performance/worker-pool.js';
import * as os from 'node:os';
import * as path from 'node:path';

// Wave 11: Re-export file-parallel executor
export { FileParallelDetectorExecutor } from './execution/file-parallel-detector-executor.js';

/**
 * Phase 1.4.3: Determine if a detector should be skipped based on changed files
 * @param detectorName Detector name
 * @param changedFiles List of changed file paths
 * @returns True if detector should be skipped
 */
export function shouldSkipDetector(detectorName: string, changedFiles: string[]): boolean {
  const metadata = getDetectorMetadata(detectorName as DetectorName);
  
  // Never skip global or workspace detectors
  if (!metadata.scope || metadata.scope === 'global' || metadata.scope === 'workspace') {
    return false;
  }
  
  // If no extensions defined, never skip
  if (!metadata.extensions || metadata.extensions.length === 0) {
    return false;
  }
  
  // If no changed files, skip all file-scoped detectors
  if (changedFiles.length === 0) {
    return true;
  }
  
  // Check if any changed file matches detector's extensions
  const hasMatchingFile = changedFiles.some(file => {
    const ext = path.extname(file).toLowerCase();
    return metadata.extensions!.some(detectorExt => detectorExt.toLowerCase() === ext);
  });
  
  return !hasMatchingFile;
}

/**
 * Context for detector execution
 */
export interface DetectorExecutionContext {
  workspaceRoot: string;
  detectorNames?: string[];
  onProgress?: ProgressCallback;
  filesFilter?: string[]; // Phase 1.4.2: Only analyze these files (for incremental)
  changedFiles?: string[]; // Phase 1.4.3: Changed files for smart skipping
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
  detectorDuration?: number; // Phase 1.4.1: Per-detector execution time in milliseconds
  detectorStatus?: 'success' | 'failed' | 'timeout' | 'skipped'; // Phase 1.4.1: Detector execution status (Phase 1.4.3: added 'skipped')
  detectorsSkipped?: string[]; // Phase 1.4.3: List of skipped detector names
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
    const { workspaceRoot, detectorNames, onProgress, changedFiles } = context;
    
    // Use provided detectors or select defaults
    const detectors = detectorNames || selectDetectors(null);
    const allIssues: any[] = [];
    
    // Phase 1.4.3: Determine which detectors to skip
    const skippedDetectors: string[] = [];
    const detectorsToRun: string[] = [];
    
    if (changedFiles) {
      for (const detector of detectors) {
        if (shouldSkipDetector(detector, changedFiles)) {
          skippedDetectors.push(detector);
        } else {
          detectorsToRun.push(detector);
        }
      }
    } else {
      detectorsToRun.push(...detectors);
    }
    
    // Report skipped detectors
    if (skippedDetectors.length > 0) {
      onProgress?.({
        phase: 'runDetectors',
        total: detectors.length,
        completed: 0,
        detectorsSkipped: skippedDetectors,
        message: `Skipping ${skippedDetectors.length} detectors (no relevant changes)`
      });
    }
    
    // Execute each detector sequentially (existing behavior)
    let completed = 0;
    for (const detectorName of detectorsToRun) {
      // Phase 1.4.1: Track detector execution time
      const detectorStart = performance.now();
      try {
        const Detector = await loadDetector(detectorName as DetectorName);
        const detector = new Detector();
        const issues = await detector.detect(workspaceRoot);
        allIssues.push(...issues.map((issue: any) => ({ ...issue, detector: detectorName })));
        
        // Phase 1.4.1: Report timing for successful execution
        const detectorDuration = performance.now() - detectorStart;
        completed++;
        onProgress?.({
          phase: 'runDetectors',
          total: detectorsToRun.length, // Phase 1.4.3: Report against detectors actually run
          completed,
          detectorName,
          detectorDuration,
          detectorStatus: 'success',
          message: `Completed ${detectorName} (${completed}/${detectorsToRun.length})`
        });
      } catch (error: any) {
        // Phase 1.4.1: Report timing for failed execution
        const detectorDuration = performance.now() - detectorStart;
        console.error(`[AnalysisEngine] Detector ${detectorName} failed:`, error.message);
        
        completed++;
        onProgress?.({
          phase: 'runDetectors',
          total: detectorsToRun.length, // Phase 1.4.3: Report against detectors actually run
          completed,
          detectorName,
          detectorDuration,
          detectorStatus: 'failed',
          message: `Failed: ${detectorName}`
        });
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
    const { workspaceRoot, detectorNames, onProgress, changedFiles } = context;
    
    // Use provided detectors or select defaults
    const detectors = detectorNames || selectDetectors(null);
    
    // Phase 1.4.3: Smart detector skipping based on changed files
    const detectorsToRun: string[] = [];
    const skippedDetectors: string[] = [];
    
    if (changedFiles) {
      for (const detector of detectors) {
        if (shouldSkipDetector(detector, changedFiles)) {
          skippedDetectors.push(detector);
        } else {
          detectorsToRun.push(detector);
        }
      }
      
      // Report skipped detectors
      if (skippedDetectors.length > 0) {
        onProgress?.({ 
          phase: 'runDetectors', 
          detectorsSkipped: skippedDetectors,
          message: `Skipping ${skippedDetectors.length} detectors (no relevant changes)`
        });
      }
    } else {
      detectorsToRun.push(...detectors);
    }
    
    // Report start
    onProgress?.({ phase: 'runDetectors', total: detectorsToRun.length, completed: 0, message: 'Starting detector execution...' });
    
    // Choose execution mode
    if (this.useWorkerPool) {
      return this.runWithWorkerPool(workspaceRoot, detectorsToRun, onProgress);
    }
    
    // Fallback: Promise-based execution
    return this.runWithPromises(workspaceRoot, detectorsToRun, onProgress);
  }
  
  private async runWithPromises(workspaceRoot: string, detectors: string[], onProgress?: ProgressCallback): Promise<any[]> {
    const allIssues: any[] = [];
    let completed = 0;
    const DETECTOR_TIMEOUT_MS = 60000; // Phase 1.3: 60 second timeout per detector
    
    // Phase 1.3: Timeout protection wrapper
    const runDetectorWithTimeout = async (detectorName: string): Promise<any[]> => {
      return Promise.race([
        (async () => {
          const Detector = await loadDetector(detectorName as DetectorName);
          const detector = new Detector();
          return await detector.detect(workspaceRoot);
        })(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Detector timeout after ${DETECTOR_TIMEOUT_MS}ms`)), DETECTOR_TIMEOUT_MS)
        )
      ]);
    };
    
    // Process detectors in batches of maxConcurrency
    for (let i = 0; i < detectors.length; i += this.maxConcurrency) {
      const batch = detectors.slice(i, i + this.maxConcurrency);
      
      const results = await Promise.allSettled(
        batch.map(async (detectorName) => {
          // Phase 1.4.1: Track detector execution time
          const detectorStart = performance.now();
          try {
            const issues = await runDetectorWithTimeout(detectorName);
            const detectorDuration = performance.now() - detectorStart;
            
            // Report progress
            completed++;
            onProgress?.({ 
              phase: 'runDetectors', 
              total: detectors.length, 
              completed, 
              detectorName,
              detectorDuration, // Phase 1.4.1: Include timing
              detectorStatus: 'success', // Phase 1.4.1: Include status
              message: `Completed ${detectorName} (${completed}/${detectors.length})`
            });
            
            return issues.map((issue: any) => ({ ...issue, detector: detectorName }));
          } catch (error: any) {
            const detectorDuration = performance.now() - detectorStart;
            
            // Phase 1.3: Clear error logging with actionable message
            const isTimeout = error.message?.includes('timeout');
            const errorType = isTimeout ? 'TIMEOUT' : 'ERROR';
            console.error(`[${errorType}] Detector ${detectorName} failed: ${error.message}`);
            
            completed++;
            onProgress?.({ 
              phase: 'runDetectors', 
              total: detectors.length, 
              completed, 
              detectorName,
              detectorDuration, // Phase 1.4.1: Include timing even on failure
              detectorStatus: isTimeout ? 'timeout' : 'failed', // Phase 1.4.1: Include status
              message: `Failed: ${detectorName} (${errorType})`
            });
            return [];
          }
        })
      );
      
      // Phase 1.3: Collect successful results and log rejected ones (no silent failures)
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allIssues.push(...result.value);
        } else {
          // Phase 1.3: Log rejected promises (previously silent)
          console.error('[ParallelDetectorExecutor] Promise rejected:', result.reason?.message || result.reason);
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
