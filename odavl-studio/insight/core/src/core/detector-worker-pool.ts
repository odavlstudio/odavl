/**
 * ODAVL Insight - Detector Worker Pool Manager
 * Wave 8 Phase 2 - Process Isolation Infrastructure
 * 
 * Manages a pool of worker threads for executing detectors in isolation.
 * Prevents detector crashes from killing the Brain process.
 * 
 * Features:
 * - Process isolation for heavy detectors
 * - Automatic worker restart on crash
 * - Timeout protection per detector
 * - Parallel detector execution
 * - Error aggregation
 * 
 * @since Wave 8 Phase 2 (December 2025)
 */

import { Worker } from 'node:worker_threads';
import { EventEmitter } from 'node:events';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';
import type {
  ExecuteDetectorMessage,
  DetectorWorkerOutgoingMessage,
  ProgressMessage,
  IssueMessage,
  CompleteMessage,
  ErrorMessage,
} from './worker-protocol.js';
import { DetectorErrorAggregator } from './error-aggregator.js';

/**
 * Configuration for worker pool
 */
export interface DetectorWorkerPoolConfig {
  maxWorkers?: number;        // Default: Math.max(1, cpus / 2)
  workerScript?: string;      // Default: auto-detected detector-worker.cjs
  taskTimeoutMs?: number;     // Default: 300000 (5 minutes)
  verbose?: boolean;          // Default: false
}

/**
 * Result from detector execution
 */
export interface DetectorResult {
  detector: string;
  issues: any[];
  errors: ErrorMessage[];
  durationMs: number;
  timedOut: boolean;
  crashed: boolean;
}

/**
 * Internal worker state
 */
interface WorkerState {
  worker: Worker;
  id: number;
  busy: boolean;
  currentDetector: string | null;
  tasksCompleted: number;
}

/**
 * Worker pool for executing detectors in isolated processes
 */
export class DetectorWorkerPool extends EventEmitter {
  private config: Required<DetectorWorkerPoolConfig>;
  private workers: WorkerState[] = [];
  private taskQueue: ExecuteDetectorMessage[] = [];
  private pendingResults = new Map<string, {
    issues: any[];
    errors: ErrorMessage[];
    startTime: number;
    timeout: NodeJS.Timeout | null;
    resolve: (result: DetectorResult) => void;
    reject: (error: Error) => void;
  }>();
  private errorAggregator = new DetectorErrorAggregator();
  private isShuttingDown = false;
  private nextWorkerId = 0;

  constructor(config: DetectorWorkerPoolConfig = {}) {
    super();

    // Resolve worker script path
    const defaultWorkerScript = this.resolveWorkerScript();

    this.config = {
      maxWorkers: config.maxWorkers ?? Math.max(1, Math.floor(os.cpus().length / 2)),
      workerScript: config.workerScript ?? defaultWorkerScript,
      taskTimeoutMs: config.taskTimeoutMs ?? 300000, // 5 minutes
      verbose: config.verbose ?? false,
    };

    this.log(`Initializing worker pool with ${this.config.maxWorkers} workers`);
    this.log(`Worker script: ${this.config.workerScript}`);

    // Initialize workers
    this.initializeWorkers();
  }

  /**
   * Resolve worker script path
   * 
   * Uses multi-candidate search strategy to handle both production and test contexts:
   * - Production (dist/index.cjs): __dirname = 'dist' → 'dist/core/detector-worker.cjs'
   * - Test (src/core/*.ts): __dirname = 'src/core' → '../dist/core/detector-worker.cjs'
   * 
   * @returns Absolute path to detector-worker.cjs
   * @throws Error if worker script not found in any candidate location
   */
  private resolveWorkerScript(): string {
    // Multi-candidate search: try production path first (fast path for 99% of cases)
    const candidates = [
      // Production: dist/index.cjs → dist/core/detector-worker.cjs
      path.join(__dirname, 'core', 'detector-worker.cjs'),
      
      // Test (tsx/ts-node): src/core/ → dist/core/detector-worker.cjs
      path.join(__dirname, '../dist/core', 'detector-worker.cjs'),
      
      // Test (deeper nesting): src/core/subdir/ → dist/core/detector-worker.cjs
      path.join(__dirname, '../../dist/core', 'detector-worker.cjs'),
    ];

    // Find first existing path
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return path.resolve(candidate); // Return absolute path
      }
    }

    // None found - throw descriptive error
    throw new Error(
      `Worker script not found. Tried:\n${candidates.map(c => `  - ${c}`).join('\n')}\n` +
      `Current __dirname: ${__dirname}\n` +
      `Ensure 'pnpm build' has been run to generate dist/core/detector-worker.cjs`
    );
  }

  /**
   * Log message (if verbose enabled)
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[WorkerPool] ${message}`);
    }
  }

  /**
   * Initialize worker threads
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.config.maxWorkers; i++) {
      this.createWorker();
    }
  }

  /**
   * Create a new worker
   */
  private createWorker(): WorkerState {
    const workerId = this.nextWorkerId++;
    
    const worker = new Worker(this.config.workerScript, {
      workerData: { workerId },
    });

    const state: WorkerState = {
      worker,
      id: workerId,
      busy: false,
      currentDetector: null,
      tasksCompleted: 0,
    };

    // Handle messages from worker
    worker.on('message', (msg: DetectorWorkerOutgoingMessage) => {
      this.handleWorkerMessage(state, msg);
    });

    // Handle worker errors
    worker.on('error', (error: Error) => {
      this.handleWorkerError(state, error);
    });

    // Handle worker exit
    worker.on('exit', (code: number) => {
      this.handleWorkerExit(state, code);
    });

    this.workers.push(state);
    this.log(`Created worker ${workerId}`);

    return state;
  }

  /**
   * Handle message from worker
   */
  private handleWorkerMessage(state: WorkerState, msg: DetectorWorkerOutgoingMessage): void {
    const pending = this.pendingResults.get(msg.detector);
    if (!pending) {
      this.log(`Received message for unknown detector: ${msg.detector}`);
      return;
    }

    switch (msg.type) {
      case 'progress':
        this.emit('progress', msg as ProgressMessage);
        break;

      case 'issue':
        pending.issues.push((msg as IssueMessage).issue);
        break;

      case 'complete':
        // Clear timeout
        if (pending.timeout) {
          clearTimeout(pending.timeout);
        }

        const durationMs = Date.now() - pending.startTime;
        pending.resolve({
          detector: msg.detector,
          issues: pending.issues,
          errors: pending.errors,
          durationMs,
          timedOut: false,
          crashed: false,
        });

        this.pendingResults.delete(msg.detector);
        this.markWorkerAvailable(state);
        break;

      case 'error':
        pending.errors.push(msg as ErrorMessage);
        this.errorAggregator.add({
          detector: msg.detector,
          severity: 'high',
          code: msg.code,
          message: msg.message,
          timestamp: new Date().toISOString(),
          details: msg.details,
        });
        break;
    }
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(state: WorkerState, error: Error): void {
    this.log(`Worker ${state.id} error: ${error.message}`);

    if (state.currentDetector) {
      this.errorAggregator.addWorkerCrashError(state.currentDetector, null);
      
      const pending = this.pendingResults.get(state.currentDetector);
      if (pending) {
        pending.errors.push({
          type: 'error',
          detector: state.currentDetector,
          code: 'WORKER_ERROR',
          message: error.message,
          details: { error: error.stack },
        });
      }
    }
  }

  /**
   * Handle worker exit
   */
  private handleWorkerExit(state: WorkerState, code: number): void {
    this.log(`Worker ${state.id} exited with code ${code}`);

    // If worker crashed with a task, report error
    if (state.currentDetector && code !== 0) {
      this.errorAggregator.addWorkerCrashError(state.currentDetector, code);
      
      const pending = this.pendingResults.get(state.currentDetector);
      if (pending) {
        if (pending.timeout) {
          clearTimeout(pending.timeout);
        }

        const durationMs = Date.now() - pending.startTime;
        pending.resolve({
          detector: state.currentDetector,
          issues: pending.issues,
          errors: [...pending.errors, {
            type: 'error',
            detector: state.currentDetector,
            code: 'WORKER_CRASH',
            message: `Worker crashed with exit code ${code}`,
            details: { exitCode: code },
          }],
          durationMs,
          timedOut: false,
          crashed: true,
        });

        this.pendingResults.delete(state.currentDetector);
      }
    }

    // Remove from workers array
    const index = this.workers.indexOf(state);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }

    // Create replacement worker (if not shutting down)
    if (!this.isShuttingDown) {
      this.log(`Restarting worker ${state.id}`);
      this.createWorker();
      this.processQueue();
    }
  }

  /**
   * Mark worker as available and process queue
   */
  private markWorkerAvailable(state: WorkerState): void {
    state.busy = false;
    state.currentDetector = null;
    state.tasksCompleted++;
    this.processQueue();
  }

  /**
   * Process queued tasks
   */
  private processQueue(): void {
    if (this.taskQueue.length === 0) {
      return;
    }

    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) {
      return;
    }

    const task = this.taskQueue.shift();
    if (!task) {
      return;
    }

    this.assignTaskToWorker(availableWorker, task);
  }

  /**
   * Assign task to worker
   */
  private assignTaskToWorker(state: WorkerState, msg: ExecuteDetectorMessage): void {
    state.busy = true;
    state.currentDetector = msg.detector;

    this.log(`Assigning ${msg.detector} to worker ${state.id}`);

    // Send message to worker
    state.worker.postMessage(msg);
  }

  /**
   * Execute a single detector in isolated worker
   */
  async executeDetector(
    detector: string,
    workspace: string,
    options?: Record<string, unknown>
  ): Promise<DetectorResult> {
    if (this.isShuttingDown) {
      throw new Error('Worker pool is shutting down');
    }

    return new Promise<DetectorResult>((resolve, reject) => {
      const startTime = Date.now();

      // Create pending result tracker
      const pending = {
        issues: [] as any[],
        errors: [] as ErrorMessage[],
        startTime,
        timeout: setTimeout(() => {
          this.handleTimeout(detector, resolve);
        }, this.config.taskTimeoutMs),
        resolve,
        reject,
      };

      this.pendingResults.set(detector, pending);

      // Create task message
      const msg: ExecuteDetectorMessage = {
        type: 'execute',
        detector,
        workspace,
        options,
      };

      // Try to assign to available worker, otherwise queue
      const availableWorker = this.workers.find(w => !w.busy);
      if (availableWorker) {
        this.assignTaskToWorker(availableWorker, msg);
      } else {
        this.log(`Queueing ${detector} (all workers busy)`);
        this.taskQueue.push(msg);
      }
    });
  }

  /**
   * Handle detector timeout
   */
  private handleTimeout(detector: string, resolve: (result: DetectorResult) => void): void {
    this.log(`Detector ${detector} timed out after ${this.config.taskTimeoutMs}ms`);
    
    this.errorAggregator.addTimeoutError(detector, this.config.taskTimeoutMs);
    
    const pending = this.pendingResults.get(detector);
    if (pending) {
      resolve({
        detector,
        issues: pending.issues,
        errors: [...pending.errors, {
          type: 'error',
          detector,
          code: 'TIMEOUT',
          message: `Detector timed out after ${this.config.taskTimeoutMs}ms`,
          details: { timeoutMs: this.config.taskTimeoutMs },
        }],
        durationMs: this.config.taskTimeoutMs,
        timedOut: true,
        crashed: false,
      });

      this.pendingResults.delete(detector);
    }

    // Terminate worker with timeout
    const workerState = this.workers.find(w => w.currentDetector === detector);
    if (workerState) {
      workerState.worker.terminate();
    }
  }

  /**
   * Execute multiple detectors in parallel
   */
  async executeDetectors(
    detectors: string[],
    workspace: string
  ): Promise<Map<string, DetectorResult>> {
    this.log(`Executing ${detectors.length} detectors in parallel`);

    const results = await Promise.all(
      detectors.map(detector => this.executeDetector(detector, workspace))
    );

    const resultMap = new Map<string, DetectorResult>();
    for (let i = 0; i < detectors.length; i++) {
      resultMap.set(detectors[i], results[i]);
    }

    return resultMap;
  }

  /**
   * Get aggregated errors
   */
  getErrors(): Map<string, import('./error-aggregator.js').NormalizedDetectorError[]> {
    const errors = new Map<string, import('./error-aggregator.js').NormalizedDetectorError[]>();
    
    for (const detector of this.errorAggregator.getDetectorsWithErrors()) {
      errors.set(detector, this.errorAggregator.getErrorsByDetector(detector));
    }

    return errors;
  }

  /**
   * Gracefully shutdown worker pool
   */
  async shutdown(): Promise<void> {
    this.log('Shutting down worker pool');
    this.isShuttingDown = true;

    // Send shutdown message to all workers
    for (const state of this.workers) {
      state.worker.postMessage({ type: 'shutdown' });
    }

    // Wait for all workers to exit (with timeout)
    await Promise.race([
      Promise.all(this.workers.map(state => 
        new Promise<void>(resolve => {
          state.worker.once('exit', () => resolve());
        })
      )),
      new Promise<void>(resolve => setTimeout(resolve, 5000)), // 5 second timeout
    ]);

    // Force terminate any remaining workers
    for (const state of this.workers) {
      await state.worker.terminate();
    }

    this.workers = [];
    this.log('Worker pool shut down');
  }
}
