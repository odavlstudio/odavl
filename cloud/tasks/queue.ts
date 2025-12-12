/**
 * Task Queue - Job queue management
 */

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface Task {
  id: string;
  type: string;
  payload: unknown;
  status: TaskStatus;
  priority: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retries: number;
  maxRetries: number;
}

export class TaskQueue {
  private tasks: Map<string, Task> = new Map();
  private queue: string[] = [];

  enqueue(type: string, payload: unknown, priority = 0): string {
    const task: Task = {
      id: crypto.randomUUID(),
      type,
      payload,
      status: TaskStatus.PENDING,
      priority,
      createdAt: new Date(),
      retries: 0,
      maxRetries: 3,
    };

    this.tasks.set(task.id, task);
    this.queue.push(task.id);
    this.sortQueue();

    return task.id;
  }

  dequeue(): Task | null {
    const taskId = this.queue.shift();
    if (!taskId) return null;

    const task = this.tasks.get(taskId);
    if (task) {
      task.status = TaskStatus.RUNNING;
      task.startedAt = new Date();
    }

    return task || null;
  }

  getStatus(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  updateStatus(taskId: string, status: TaskStatus, error?: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = status;
    if (error) task.error = error;
    if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED) {
      task.completedAt = new Date();
    }
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      const taskA = this.tasks.get(a);
      const taskB = this.tasks.get(b);
      return (taskB?.priority || 0) - (taskA?.priority || 0);
    });
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clearCompleted(): number {
    let cleared = 0;
    for (const [id, task] of this.tasks.entries()) {
      if (task.status === TaskStatus.COMPLETED) {
        this.tasks.delete(id);
        cleared++;
      }
    }
    return cleared;
  }
}
