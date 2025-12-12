/**
 * Task Runner - Execute tasks with retry logic
 */

import { Task, TaskStatus } from './queue.js';

export interface TaskHandler {
  (payload: unknown): Promise<unknown>;
}

export class TaskRunner {
  private handlers: Map<string, TaskHandler> = new Map();
  private running: Map<string, AbortController> = new Map();

  registerHandler(type: string, handler: TaskHandler): void {
    this.handlers.set(type, handler);
  }

  async execute(task: Task): Promise<unknown> {
    const handler = this.handlers.get(task.type);
    if (!handler) {
      throw new Error(`No handler registered for task type: ${task.type}`);
    }

    const controller = new AbortController();
    this.running.set(task.id, controller);

    try {
      const result = await handler(task.payload);
      this.running.delete(task.id);
      return result;
    } catch (error) {
      this.running.delete(task.id);
      throw error;
    }
  }

  async retry(task: Task, maxRetries = 3): Promise<unknown> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.execute(task);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  async cancel(taskId: string): Promise<boolean> {
    const controller = this.running.get(taskId);
    if (!controller) return false;

    controller.abort();
    this.running.delete(taskId);
    return true;
  }

  isRunning(taskId: string): boolean {
    return this.running.has(taskId);
  }

  getRunningTasks(): string[] {
    return Array.from(this.running.keys());
  }
}
