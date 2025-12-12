/**
 * Worker Pool - Parallel task execution
 */

import { TaskQueue, TaskStatus } from './queue.js';
import { TaskRunner } from './runner.js';

export interface WorkerPoolConfig {
  maxWorkers: number;
  pollInterval?: number;
}

export interface WorkerStatus {
  id: string;
  status: 'idle' | 'busy';
  currentTask?: string;
  tasksProcessed: number;
}

export class WorkerPool {
  private queue: TaskQueue;
  private runner: TaskRunner;
  private workers: Map<string, WorkerStatus> = new Map();
  private config: Required<WorkerPoolConfig>;
  private polling = false;

  constructor(config: WorkerPoolConfig) {
    this.config = {
      maxWorkers: config.maxWorkers,
      pollInterval: config.pollInterval || 1000,
    };
    this.queue = new TaskQueue();
    this.runner = new TaskRunner();
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.config.maxWorkers; i++) {
      const worker: WorkerStatus = {
        id: `worker-${i}`,
        status: 'idle',
        tasksProcessed: 0,
      };
      this.workers.set(worker.id, worker);
    }
  }

  start(): void {
    if (this.polling) return;
    this.polling = true;
    this.poll();
  }

  stop(): void {
    this.polling = false;
  }

  private async poll(): Promise<void> {
    if (!this.polling) return;

    const idleWorker = this.getIdleWorker();
    if (idleWorker) {
      const task = this.queue.dequeue();
      if (task) {
        await this.processTask(idleWorker, task);
      }
    }

    setTimeout(() => this.poll(), this.config.pollInterval);
  }

  private getIdleWorker(): WorkerStatus | null {
    for (const worker of this.workers.values()) {
      if (worker.status === 'idle') return worker;
    }
    return null;
  }

  private async processTask(worker: WorkerStatus, task: { id: string; type: string; payload: unknown }): Promise<void> {
    worker.status = 'busy';
    worker.currentTask = task.id;

    try {
      await this.runner.execute(task as never);
      this.queue.updateStatus(task.id, TaskStatus.COMPLETED);
      worker.tasksProcessed++;
    } catch (error) {
      this.queue.updateStatus(task.id, TaskStatus.FAILED, error instanceof Error ? error.message : String(error));
    } finally {
      worker.status = 'idle';
      worker.currentTask = undefined;
    }
  }

  getStatus(): { total: number; idle: number; busy: number; tasksProcessed: number } {
    const workers = Array.from(this.workers.values());
    return {
      total: workers.length,
      idle: workers.filter((w) => w.status === 'idle').length,
      busy: workers.filter((w) => w.status === 'busy').length,
      tasksProcessed: workers.reduce((sum, w) => sum + w.tasksProcessed, 0),
    };
  }
}
