/**
 * Task Scheduler - Recurring and cron-style tasks
 */

export interface ScheduledTask {
  id: string;
  type: string;
  payload: unknown;
  schedule: string; // Cron expression
  nextRun: Date;
  lastRun?: Date;
  enabled: boolean;
}

export class TaskScheduler {
  private scheduled: Map<string, ScheduledTask> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  scheduleRecurring(type: string, payload: unknown, intervalMs: number): string {
    const task: ScheduledTask = {
      id: crypto.randomUUID(),
      type,
      payload,
      schedule: `every ${intervalMs}ms`,
      nextRun: new Date(Date.now() + intervalMs),
      enabled: true,
    };

    this.scheduled.set(task.id, task);
    this.startTimer(task.id, intervalMs);

    return task.id;
  }

  scheduleCron(type: string, payload: unknown, cronExpr: string): string {
    const task: ScheduledTask = {
      id: crypto.randomUUID(),
      type,
      payload,
      schedule: cronExpr,
      nextRun: this.parseNextRun(cronExpr),
      enabled: true,
    };

    this.scheduled.set(task.id, task);
    return task.id;
  }

  cancelScheduled(taskId: string): boolean {
    const timer = this.timers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(taskId);
    }
    return this.scheduled.delete(taskId);
  }

  private startTimer(taskId: string, intervalMs: number): void {
    const timer = setInterval(() => {
      const task = this.scheduled.get(taskId);
      if (!task || !task.enabled) {
        this.cancelScheduled(taskId);
        return;
      }

      task.lastRun = new Date();
      task.nextRun = new Date(Date.now() + intervalMs);
      console.log(`Running scheduled task: ${task.type}`);
    }, intervalMs);

    this.timers.set(taskId, timer);
  }

  private parseNextRun(cronExpr: string): Date {
    // Skeleton: Would parse cron expression
    return new Date(Date.now() + 60000); // Default 1 minute
  }

  listScheduled(): ScheduledTask[] {
    return Array.from(this.scheduled.values());
  }

  pauseScheduled(taskId: string): boolean {
    const task = this.scheduled.get(taskId);
    if (!task) return false;
    task.enabled = false;
    return true;
  }

  resumeScheduled(taskId: string): boolean {
    const task = this.scheduled.get(taskId);
    if (!task) return false;
    task.enabled = true;
    return true;
  }
}
