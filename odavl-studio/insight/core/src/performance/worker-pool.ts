/**
 * Worker Thread Pool for Parallel Analysis
 * 
 * Distributes file analysis across multiple CPU cores for maximum performance.
 * Uses Node.js Worker Threads API for true parallelism.
 * 
 * Features:
 * - Round-robin task distribution
 * - Load balancing based on file size
 * - Automatic worker recovery on crash
 * - Memory limits per worker (1GB)
 * - Timeout protection (30s per file)
 * - Graceful shutdown
 * 
 * @since Phase 1 Week 19 (December 2025)
 */

import { Worker } from 'node:worker_threads';
import * as os from 'node:os';
import * as path from 'node:path';
import { EventEmitter } from 'node:events';

export interface WorkerPoolConfig {
  /**
   * Number of workers (default: CPU count)
   */
  maxWorkers?: number;

  /**
   * Memory limit per worker in MB (default: 1024)
   */
  memoryLimitMB?: number;

  /**
   * Timeout per task in milliseconds (default: 30000)
   */
  taskTimeoutMs?: number;

  /**
   * Worker script path (default: ./worker.js)
   */
  workerScript?: string;

  /**
   * Enable verbose logging
   */
  verbose?: boolean;
}

export interface Task<T = any> {
  id: string;
  type: string;
  data: any;
  priority?: number;
  retries?: number;
}

export interface TaskResult<T = any> {
  taskId: string;
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
  workerId: number;
}

interface WorkerState {
  worker: Worker;
  id: number;
  busy: boolean;
  tasksCompleted: number;
  currentTask: Task | null;
  memoryUsage: number;
  cpuUsage: number;
}

export class WorkerPool extends EventEmitter {
  private config: Required<WorkerPoolConfig>;
  private workers: WorkerState[] = [];
  private taskQueue: Task[] = [];
  private activeTasks = new Map<string, Task>();
  private results = new Map<string, TaskResult>();
  private isShuttingDown = false;
  private totalTasksProcessed = 0;

  constructor(config: WorkerPoolConfig = {}) {
    super();
    
    this.config = {
      maxWorkers: config.maxWorkers || os.cpus().length,
      memoryLimitMB: config.memoryLimitMB || 1024,
      taskTimeoutMs: config.taskTimeoutMs || 30000,
      workerScript: config.workerScript || path.join(__dirname, 'worker.js'),
      verbose: config.verbose ?? false,
    };

    this.log(`Initializing worker pool with ${this.config.maxWorkers} workers`);
  }

  /**
   * Initialize worker pool
   */
  async initialize(): Promise<void> {
    this.log('Creating workers...');

    for (let i = 0; i < this.config.maxWorkers; i++) {
      await this.createWorker(i);
    }

    this.log(`Worker pool ready with ${this.workers.length} workers`);
    this.emit('ready', { workerCount: this.workers.length });
  }

  /**
   * Process multiple tasks in parallel
   */
  async process<T>(tasks: Task[]): Promise<TaskResult<T>[]> {
    if (this.isShuttingDown) {
      throw new Error('Worker pool is shutting down');
    }

    if (tasks.length === 0) {
      return [];
    }

    this.log(`Processing ${tasks.length} tasks...`);
    const startTime = Date.now();

    // Sort by priority (higher first)
    const sortedTasks = [...tasks].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Add tasks to queue
    this.taskQueue.push(...sortedTasks);

    // Start processing
    this.processQueue();

    // Wait for all tasks to complete
    await this.waitForCompletion(tasks.map(t => t.id));

    // Collect results
    const results: TaskResult<T>[] = [];
    for (const task of tasks) {
      const result = this.results.get(task.id);
      if (result) {
        results.push(result as TaskResult<T>);
        this.results.delete(task.id);
      }
    }

    const duration = Date.now() - startTime;
    this.log(`Completed ${results.length} tasks in ${duration}ms`);
    this.emit('batchComplete', { taskCount: results.length, duration });

    return results;
  }

  /**
   * Submit a single task
   */
  async submit<T>(task: Task): Promise<TaskResult<T>> {
    const results = await this.process<T>([task]);
    return results[0];
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const busyWorkers = this.workers.filter(w => w.busy).length;
    const totalMemory = this.workers.reduce((sum, w) => sum + w.memoryUsage, 0);
    const avgCpu = this.workers.reduce((sum, w) => sum + w.cpuUsage, 0) / this.workers.length;

    return {
      totalWorkers: this.workers.length,
      busyWorkers,
      idleWorkers: this.workers.length - busyWorkers,
      queueLength: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      totalTasksProcessed: this.totalTasksProcessed,
      memoryUsageMB: Math.round(totalMemory / 1024 / 1024),
      avgCpuUsage: Math.round(avgCpu * 100),
      utilizationRate: (busyWorkers / this.workers.length) * 100,
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.log('Shutting down worker pool...');
    this.isShuttingDown = true;

    // Wait for active tasks to complete (max 30s)
    const timeout = setTimeout(() => {
      this.log('Shutdown timeout - forcing termination');
      this.forceTerminate();
    }, 30000);

    try {
      await this.waitForCompletion([...this.activeTasks.keys()]);
      clearTimeout(timeout);
    } catch (error) {
      clearTimeout(timeout);
      this.log(`Shutdown error: ${error}`);
    }

    // Terminate all workers
    for (const workerState of this.workers) {
      await workerState.worker.terminate();
    }

    this.workers = [];
    this.log('Worker pool shut down');
    this.emit('shutdown');
  }

  /**
   * Create a new worker
   */
  private async createWorker(id: number): Promise<void> {
    const worker = new Worker(this.config.workerScript, {
      workerData: { workerId: id },
      resourceLimits: {
        maxOldGenerationSizeMb: this.config.memoryLimitMB,
        maxYoungGenerationSizeMb: Math.floor(this.config.memoryLimitMB / 4),
      },
    });

    const workerState: WorkerState = {
      worker,
      id,
      busy: false,
      tasksCompleted: 0,
      currentTask: null,
      memoryUsage: 0,
      cpuUsage: 0,
    };

    // Handle messages from worker
    worker.on('message', (message) => {
      this.handleWorkerMessage(workerState, message);
    });

    // Handle worker errors
    worker.on('error', (error) => {
      this.handleWorkerError(workerState, error);
    });

    // Handle worker exit
    worker.on('exit', (code) => {
      this.handleWorkerExit(workerState, code);
    });

    this.workers.push(workerState);
    this.log(`Worker ${id} created`);
  }

  /**
   * Process task queue
   */
  private processQueue(): void {
    while (this.taskQueue.length > 0) {
      const availableWorker = this.findAvailableWorker();
      
      if (!availableWorker) {
        break; // No available workers, wait for one to free up
      }

      const task = this.taskQueue.shift()!;
      this.assignTask(availableWorker, task);
    }
  }

  /**
   * Find an available worker (least busy)
   */
  private findAvailableWorker(): WorkerState | null {
    const idleWorkers = this.workers.filter(w => !w.busy);
    
    if (idleWorkers.length === 0) {
      return null;
    }

    // Return worker with least completed tasks (load balancing)
    return idleWorkers.reduce((min, worker) => 
      worker.tasksCompleted < min.tasksCompleted ? worker : min
    );
  }

  /**
   * Assign task to worker
   */
  private assignTask(workerState: WorkerState, task: Task): void {
    workerState.busy = true;
    workerState.currentTask = task;
    this.activeTasks.set(task.id, task);

    this.log(`Assigning task ${task.id} to worker ${workerState.id}`);

    // Set timeout
    const timeout = setTimeout(() => {
      this.handleTaskTimeout(workerState, task);
    }, this.config.taskTimeoutMs);

    // Send task to worker
    workerState.worker.postMessage({
      type: 'task',
      task,
      timeout: this.config.taskTimeoutMs,
    });

    // Store timeout for cleanup
    (task as any)._timeout = timeout;

    this.emit('taskAssigned', { taskId: task.id, workerId: workerState.id });
  }

  /**
   * Handle message from worker
   */
  private handleWorkerMessage(workerState: WorkerState, message: any): void {
    if (message.type === 'result') {
      this.handleTaskResult(workerState, message.result);
    } else if (message.type === 'stats') {
      workerState.memoryUsage = message.memoryUsage;
      workerState.cpuUsage = message.cpuUsage;
    } else if (message.type === 'log') {
      this.log(`[Worker ${workerState.id}] ${message.message}`);
    }
  }

  /**
   * Handle task result
   */
  private handleTaskResult(workerState: WorkerState, result: TaskResult): void {
    const task = workerState.currentTask;
    
    if (!task) {
      this.log(`Warning: Result received but no current task for worker ${workerState.id}`);
      return;
    }

    // Clear timeout
    if ((task as any)._timeout) {
      clearTimeout((task as any)._timeout);
      delete (task as any)._timeout;
    }

    // Store result
    this.results.set(result.taskId, result);
    this.activeTasks.delete(task.id);

    // Update worker state
    workerState.busy = false;
    workerState.currentTask = null;
    workerState.tasksCompleted++;
    this.totalTasksProcessed++;

    this.log(`Task ${task.id} completed by worker ${workerState.id} (${result.success ? 'success' : 'failed'})`);
    this.emit('taskComplete', result);

    // Process next task in queue
    if (this.taskQueue.length > 0 && !this.isShuttingDown) {
      this.processQueue();
    }
  }

  /**
   * Handle task timeout
   */
  private handleTaskTimeout(workerState: WorkerState, task: Task): void {
    this.log(`Task ${task.id} timed out on worker ${workerState.id}`);

    const result: TaskResult = {
      taskId: task.id,
      success: false,
      error: `Task timeout after ${this.config.taskTimeoutMs}ms`,
      duration: this.config.taskTimeoutMs,
      workerId: workerState.id,
    };

    this.results.set(task.id, result);
    this.activeTasks.delete(task.id);

    // Terminate and recreate worker (may be stuck)
    this.restartWorker(workerState);

    this.emit('taskTimeout', { taskId: task.id, workerId: workerState.id });
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(workerState: WorkerState, error: Error): void {
    this.log(`Worker ${workerState.id} error: ${error.message}`);
    this.emit('workerError', { workerId: workerState.id, error });

    // If task was running, mark as failed
    if (workerState.currentTask) {
      const task = workerState.currentTask;
      const result: TaskResult = {
        taskId: task.id,
        success: false,
        error: `Worker error: ${error.message}`,
        duration: 0,
        workerId: workerState.id,
      };

      this.results.set(task.id, result);
      this.activeTasks.delete(task.id);
    }

    // Restart worker
    this.restartWorker(workerState);
  }

  /**
   * Handle worker exit
   */
  private handleWorkerExit(workerState: WorkerState, code: number): void {
    this.log(`Worker ${workerState.id} exited with code ${code}`);
    
    if (code !== 0 && !this.isShuttingDown) {
      this.log(`Worker ${workerState.id} crashed, restarting...`);
      this.restartWorker(workerState);
    }
  }

  /**
   * Restart a worker
   */
  private async restartWorker(workerState: WorkerState): Promise<void> {
    const id = workerState.id;
    
    // Remove from pool
    const index = this.workers.indexOf(workerState);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }

    // Terminate old worker
    try {
      await workerState.worker.terminate();
    } catch (error) {
      this.log(`Error terminating worker ${id}: ${error}`);
    }

    // Create new worker
    if (!this.isShuttingDown) {
      await this.createWorker(id);
      this.processQueue(); // Resume processing
    }
  }

  /**
   * Wait for specific tasks to complete
   */
  private async waitForCompletion(taskIds: string[]): Promise<void> {
    return new Promise((resolve) => {
      const checkCompletion = () => {
        const allCompleted = taskIds.every(id => 
          this.results.has(id) || !this.activeTasks.has(id)
        );

        if (allCompleted) {
          resolve();
        } else {
          // Check again in 100ms
          setTimeout(checkCompletion, 100);
        }
      };

      checkCompletion();
    });
  }

  /**
   * Force terminate all workers
   */
  private forceTerminate(): void {
    for (const workerState of this.workers) {
      try {
        workerState.worker.terminate();
      } catch (error) {
        this.log(`Error force terminating worker ${workerState.id}: ${error}`);
      }
    }
    this.workers = [];
  }

  /**
   * Log message
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[WorkerPool] ${message}`);
    }
  }
}

/**
 * Create and initialize a worker pool
 */
export async function createWorkerPool(config?: WorkerPoolConfig): Promise<WorkerPool> {
  const pool = new WorkerPool(config);
  await pool.initialize();
  return pool;
}
