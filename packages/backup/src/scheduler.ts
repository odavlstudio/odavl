/**
 * Automated Backup Scheduler
 */

import cron from 'node-cron';
import { BackupService } from './backup-service';
import type { BackupConfig } from './types';

export class BackupScheduler {
  private service: BackupService;
  private config: BackupConfig;
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  constructor(config: BackupConfig) {
    this.config = config;
    this.service = new BackupService(config);
  }

  /**
   * Start scheduled backups
   */
  start(): void {
    if (!this.config.schedule?.enabled) {
      throw new Error('Backup scheduling is not enabled');
    }

    const { cron: cronExpression, timezone } = this.config.schedule;

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    // Schedule full backup
    const task = cron.schedule(
      cronExpression,
      async () => {
        console.log(`[${new Date().toISOString()}] Starting scheduled backup...`);
        try {
          const result = await this.service.createBackup('full');
          if (result.success) {
            console.log(
              `[${new Date().toISOString()}] Backup completed: ${result.metadata.id} ` +
              `(${this.formatBytes(result.metadata.size)} in ${result.metadata.duration}ms)`
            );
          } else {
            console.error(
              `[${new Date().toISOString()}] Backup failed: ${result.metadata.error}`
            );
          }
        } catch (error: any) {
          console.error(
            `[${new Date().toISOString()}] Backup error: ${error.message}`
          );
        }
      },
      {
        scheduled: true,
        timezone,
      }
    );

    this.tasks.set('full-backup', task);
    console.log(`Backup scheduler started: ${cronExpression}`);
  }

  /**
   * Stop scheduled backups
   */
  stop(): void {
    for (const [name, task] of this.tasks.entries()) {
      task.stop();
      console.log(`Stopped scheduled task: ${name}`);
    }
    this.tasks.clear();
  }

  /**
   * Trigger manual backup
   */
  async triggerBackup(type: 'full' | 'incremental' = 'full'): Promise<void> {
    console.log(`[${new Date().toISOString()}] Triggering manual ${type} backup...`);
    const result = await this.service.createBackup(type);
    
    if (result.success) {
      console.log(
        `[${new Date().toISOString()}] Backup completed: ${result.metadata.id}`
      );
    } else {
      throw new Error(`Backup failed: ${result.metadata.error}`);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    enabled: boolean;
    schedule: string;
    nextRun?: Date;
    activeTasks: string[];
  } {
    const fullBackupTask = this.tasks.get('full-backup');
    
    return {
      enabled: this.config.schedule?.enabled || false,
      schedule: this.config.schedule?.cron || '',
      nextRun: fullBackupTask ? new Date() : undefined, // TODO: Calculate next run
      activeTasks: Array.from(this.tasks.keys()),
    };
  }

  /**
   * Format bytes
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
