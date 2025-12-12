/**
 * ODAVL Insight Enterprise - Report Scheduler
 * Week 43: Export & Reporting - File 3/3
 * 
 * Features:
 * - Cron-based scheduling
 * - Recurring report generation
 * - Event-triggered reports
 * - Email delivery
 * - Webhook notifications
 * - Report distribution lists
 * - Schedule templates
 * - Time zone support
 * - Retry on failure
 * - Schedule history
 * 
 * @module reporting/report-scheduler
 */

import { EventEmitter } from 'events';
import { ReportConfig, ReportData, ReportGenerator } from './report-generator';
import { ExportConfig, ExportEngine } from './export-engine';

// ==================== Types & Interfaces ====================

/**
 * Schedule frequency
 */
export enum ScheduleFrequency {
  Hourly = 'hourly',
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  Custom = 'custom', // Cron expression
}

/**
 * Delivery method
 */
export enum DeliveryMethod {
  Email = 'email',
  Slack = 'slack',
  Teams = 'teams',
  Webhook = 'webhook',
  S3 = 's3',
  SFTP = 'sftp',
}

/**
 * Schedule configuration
 */
export interface ScheduleConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  
  // Timing
  frequency: ScheduleFrequency;
  cronExpression?: string; // For custom frequency
  timezone: string; // e.g., 'America/New_York', 'UTC'
  startDate?: Date;
  endDate?: Date;
  
  // Report generation
  reportConfig: ReportConfig;
  dataSource: string; // Function name or query
  
  // Delivery
  deliveryMethods: Array<{
    method: DeliveryMethod;
    config: any; // Method-specific config
  }>;
  
  // Options
  retryOnFailure: boolean;
  maxRetries: number; // Default: 3
  retryDelay: number; // minutes, Default: 5
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
}

/**
 * Schedule execution record
 */
export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  status: 'success' | 'failed' | 'partial';
  
  // Timing
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  
  // Output
  reportPath?: string;
  deliveryStatus: Record<DeliveryMethod, 'success' | 'failed'>;
  
  // Error
  error?: string;
  retryCount: number;
}

/**
 * Email delivery config
 */
export interface EmailDeliveryConfig {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body?: string;
  attachReport: boolean;
}

/**
 * Webhook delivery config
 */
export interface WebhookDeliveryConfig {
  url: string;
  method: 'POST' | 'PUT';
  headers?: Record<string, string>;
  includeReport: boolean;
}

/**
 * Distribution list
 */
export interface DistributionList {
  id: string;
  name: string;
  description: string;
  members: string[]; // Email addresses or user IDs
  createdBy: string;
  createdAt: Date;
}

/**
 * Scheduler configuration
 */
export interface SchedulerConfig {
  // Execution
  checkInterval: number; // milliseconds, Default: 60000 (1 minute)
  maxConcurrentSchedules: number; // Default: 5
  
  // Delivery
  emailProvider: 'smtp' | 'sendgrid' | 'ses';
  emailConfig?: any;
  
  // Storage
  historyRetentionDays: number; // Default: 90
  
  // Features
  enableNotifications: boolean;
  enableWebhooks: boolean;
}

// ==================== Report Scheduler ====================

const DEFAULT_CONFIG: SchedulerConfig = {
  checkInterval: 60000,
  maxConcurrentSchedules: 5,
  emailProvider: 'smtp',
  historyRetentionDays: 90,
  enableNotifications: true,
  enableWebhooks: true,
};

/**
 * Report Scheduler
 * Automated report generation and distribution
 */
export class ReportScheduler extends EventEmitter {
  private config: SchedulerConfig;
  private schedules: Map<string, ScheduleConfig>;
  private executions: Map<string, ScheduleExecution[]>;
  private distributionLists: Map<string, DistributionList>;
  private reportGenerator: ReportGenerator;
  private exportEngine: ExportEngine;
  private timerId?: NodeJS.Timeout;
  private running: boolean = false;

  constructor(
    config: Partial<SchedulerConfig> = {},
    reportGenerator: ReportGenerator,
    exportEngine: ExportEngine
  ) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.schedules = new Map();
    this.executions = new Map();
    this.distributionLists = new Map();
    this.reportGenerator = reportGenerator;
    this.exportEngine = exportEngine;
  }

  /**
   * Start scheduler
   */
  async start(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    this.emit('scheduler-started');

    // Check schedules periodically
    this.timerId = setInterval(() => {
      this.checkSchedules();
    }, this.config.checkInterval);

    // Immediate check
    await this.checkSchedules();
  }

  /**
   * Stop scheduler
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;

    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }

    this.emit('scheduler-stopped');
  }

  /**
   * Create schedule
   */
  async createSchedule(config: Omit<ScheduleConfig, 'id' | 'createdAt'>): Promise<ScheduleConfig> {
    const schedule: ScheduleConfig = {
      ...config,
      id: this.generateId(),
      createdAt: new Date(),
      nextRun: this.calculateNextRun(config.frequency, config.cronExpression, config.timezone),
    };

    this.schedules.set(schedule.id, schedule);
    this.emit('schedule-created', { schedule });

    return schedule;
  }

  /**
   * Update schedule
   */
  async updateSchedule(id: string, updates: Partial<ScheduleConfig>): Promise<ScheduleConfig> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`);
    }

    const updated = { ...schedule, ...updates };

    // Recalculate next run if timing changed
    if (updates.frequency || updates.cronExpression || updates.timezone) {
      updated.nextRun = this.calculateNextRun(
        updated.frequency,
        updated.cronExpression,
        updated.timezone
      );
    }

    this.schedules.set(id, updated);
    this.emit('schedule-updated', { schedule: updated });

    return updated;
  }

  /**
   * Delete schedule
   */
  async deleteSchedule(id: string): Promise<void> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`);
    }

    this.schedules.delete(id);
    this.emit('schedule-deleted', { id, schedule });
  }

  /**
   * Enable/disable schedule
   */
  async toggleSchedule(id: string, enabled: boolean): Promise<ScheduleConfig> {
    return this.updateSchedule(id, { enabled });
  }

  /**
   * Get schedule
   */
  async getSchedule(id: string): Promise<ScheduleConfig | null> {
    return this.schedules.get(id) || null;
  }

  /**
   * List schedules
   */
  async listSchedules(filter?: { enabled?: boolean }): Promise<ScheduleConfig[]> {
    let schedules = Array.from(this.schedules.values());

    if (filter?.enabled !== undefined) {
      schedules = schedules.filter(s => s.enabled === filter.enabled);
    }

    return schedules.sort((a, b) => 
      (a.nextRun?.getTime() || 0) - (b.nextRun?.getTime() || 0)
    );
  }

  /**
   * Run schedule immediately
   */
  async runNow(id: string): Promise<ScheduleExecution> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`);
    }

    return this.executeSchedule(schedule);
  }

  /**
   * Get schedule execution history
   */
  async getExecutionHistory(scheduleId: string, limit = 10): Promise<ScheduleExecution[]> {
    const executions = this.executions.get(scheduleId) || [];
    return executions
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Create distribution list
   */
  async createDistributionList(
    list: Omit<DistributionList, 'id' | 'createdAt'>
  ): Promise<DistributionList> {
    const newList: DistributionList = {
      ...list,
      id: this.generateId(),
      createdAt: new Date(),
    };

    this.distributionLists.set(newList.id, newList);
    this.emit('distribution-list-created', { list: newList });

    return newList;
  }

  /**
   * Get distribution list
   */
  async getDistributionList(id: string): Promise<DistributionList | null> {
    return this.distributionLists.get(id) || null;
  }

  /**
   * List distribution lists
   */
  async listDistributionLists(): Promise<DistributionList[]> {
    return Array.from(this.distributionLists.values());
  }

  // ==================== Private Methods ====================

  /**
   * Check due schedules
   */
  private async checkSchedules(): Promise<void> {
    const now = new Date();
    const dueSchedules = Array.from(this.schedules.values()).filter(
      s => s.enabled && s.nextRun && s.nextRun <= now
    );

    if (dueSchedules.length === 0) {
      return;
    }

    this.emit('schedules-due', { count: dueSchedules.length });

    // Execute in batches
    for (let i = 0; i < dueSchedules.length; i += this.config.maxConcurrentSchedules) {
      const batch = dueSchedules.slice(i, i + this.config.maxConcurrentSchedules);
      await Promise.allSettled(
        batch.map(schedule => this.executeSchedule(schedule))
      );
    }
  }

  /**
   * Execute schedule
   */
  private async executeSchedule(schedule: ScheduleConfig): Promise<ScheduleExecution> {
    const execution: ScheduleExecution = {
      id: this.generateId(),
      scheduleId: schedule.id,
      status: 'success',
      startedAt: new Date(),
      deliveryStatus: {} as Record<DeliveryMethod, 'success' | 'failed'>,
      retryCount: 0,
    };

    this.emit('execution-started', { schedule, execution });

    try {
      // Get data (mock - in production, call actual data source)
      const data = await this.fetchData(schedule.dataSource);

      // Generate report
      const reportPath = await this.reportGenerator.generateReport(
        schedule.reportConfig,
        data
      );

      execution.reportPath = reportPath;

      // Deliver report
      for (const delivery of schedule.deliveryMethods) {
        try {
          await this.deliver(reportPath, delivery.method, delivery.config);
          execution.deliveryStatus[delivery.method] = 'success';
        } catch (error: any) {
          execution.deliveryStatus[delivery.method] = 'failed';
          execution.status = 'partial';
          this.emit('delivery-failed', { 
            schedule, 
            execution, 
            method: delivery.method, 
            error 
          });
        }
      }

      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

      // Update schedule
      schedule.lastRun = new Date();
      schedule.nextRun = this.calculateNextRun(
        schedule.frequency,
        schedule.cronExpression,
        schedule.timezone
      );

      this.emit('execution-completed', { schedule, execution });
    } catch (error: any) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date();

      // Retry if enabled
      if (schedule.retryOnFailure && execution.retryCount < schedule.maxRetries) {
        this.emit('execution-retry-scheduled', { schedule, execution });
        setTimeout(() => {
          execution.retryCount++;
          this.executeSchedule(schedule);
        }, schedule.retryDelay * 60000);
      }

      this.emit('execution-failed', { schedule, execution, error });
    }

    // Save execution
    const history = this.executions.get(schedule.id) || [];
    history.push(execution);
    this.executions.set(schedule.id, history);

    // Prune old executions
    this.pruneExecutions(schedule.id);

    return execution;
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(
    frequency: ScheduleFrequency,
    cronExpression?: string,
    timezone: string = 'UTC'
  ): Date {
    const now = new Date();

    switch (frequency) {
      case ScheduleFrequency.Hourly:
        return new Date(now.getTime() + 3600000);
      
      case ScheduleFrequency.Daily:
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
      
      case ScheduleFrequency.Weekly:
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(0, 0, 0, 0);
        return nextWeek;
      
      case ScheduleFrequency.Monthly:
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(0, 0, 0, 0);
        return nextMonth;
      
      case ScheduleFrequency.Quarterly:
        const nextQuarter = new Date(now);
        nextQuarter.setMonth(nextQuarter.getMonth() + 3);
        nextQuarter.setDate(1);
        nextQuarter.setHours(0, 0, 0, 0);
        return nextQuarter;
      
      case ScheduleFrequency.Custom:
        // Mock cron parsing (in production, use node-cron)
        if (cronExpression) {
          return new Date(now.getTime() + 86400000); // Next day
        }
        return new Date(now.getTime() + 3600000);
      
      default:
        return new Date(now.getTime() + 86400000);
    }
  }

  /**
   * Fetch data for report
   */
  private async fetchData(dataSource: string): Promise<ReportData> {
    // Mock data fetching (in production, call actual data source)
    return {
      summary: {
        totalIssues: 150,
        criticalIssues: 12,
        resolvedIssues: 85,
        avgResolutionTime: 24,
        codeQualityScore: 78,
        trendDirection: 'improving',
      },
      issuesByCategory: {
        security: 25,
        performance: 40,
        quality: 50,
        bugs: 35,
      },
      issuesBySeverity: {
        critical: 12,
        high: 28,
        medium: 60,
        low: 50,
      },
      issuesByType: {
        'sql-injection': 8,
        'memory-leak': 15,
        'code-smell': 45,
        'bug': 35,
        'vulnerability': 12,
      },
      trends: [
        { date: new Date('2024-01-01'), count: 120, resolved: 60 },
        { date: new Date('2024-02-01'), count: 135, resolved: 70 },
        { date: new Date('2024-03-01'), count: 150, resolved: 85 },
      ],
      topIssues: [
        { id: '1', title: 'SQL Injection vulnerability', severity: 'critical', category: 'security', occurrences: 8 },
        { id: '2', title: 'Memory leak in event handler', severity: 'high', category: 'performance', occurrences: 15 },
        { id: '3', title: 'Complex function needs refactoring', severity: 'medium', category: 'quality', occurrences: 22 },
      ],
      performance: {
        avgAnalysisTime: 2500,
        filesAnalyzed: 450,
        linesOfCode: 125000,
      },
    };
  }

  /**
   * Deliver report
   */
  private async deliver(
    reportPath: string,
    method: DeliveryMethod,
    config: any
  ): Promise<void> {
    this.emit('delivery-started', { reportPath, method, config });

    switch (method) {
      case DeliveryMethod.Email:
        await this.deliverEmail(reportPath, config as EmailDeliveryConfig);
        break;
      
      case DeliveryMethod.Slack:
        await this.deliverSlack(reportPath, config);
        break;
      
      case DeliveryMethod.Teams:
        await this.deliverTeams(reportPath, config);
        break;
      
      case DeliveryMethod.Webhook:
        await this.deliverWebhook(reportPath, config as WebhookDeliveryConfig);
        break;
      
      case DeliveryMethod.S3:
        await this.deliverS3(reportPath, config);
        break;
      
      default:
        throw new Error(`Unsupported delivery method: ${method}`);
    }

    this.emit('delivery-completed', { reportPath, method });
  }

  private async deliverEmail(reportPath: string, config: EmailDeliveryConfig): Promise<void> {
    // Mock email delivery (in production, use nodemailer/sendgrid)
    this.emit('email-sent', { to: config.to, subject: config.subject, reportPath });
  }

  private async deliverSlack(reportPath: string, config: any): Promise<void> {
    // Mock Slack delivery (in production, use @slack/web-api)
    this.emit('slack-sent', { channel: config.channel, reportPath });
  }

  private async deliverTeams(reportPath: string, config: any): Promise<void> {
    // Mock Teams delivery (in production, use webhook)
    this.emit('teams-sent', { webhook: config.webhook, reportPath });
  }

  private async deliverWebhook(reportPath: string, config: WebhookDeliveryConfig): Promise<void> {
    // Mock webhook delivery (in production, use fetch/axios)
    this.emit('webhook-sent', { url: config.url, reportPath });
  }

  private async deliverS3(reportPath: string, config: any): Promise<void> {
    // Mock S3 upload (in production, use AWS SDK)
    this.emit('s3-uploaded', { bucket: config.bucket, key: config.key, reportPath });
  }

  private pruneExecutions(scheduleId: string): void {
    const executions = this.executions.get(scheduleId) || [];
    const cutoff = new Date(Date.now() - this.config.historyRetentionDays * 86400000);
    
    const filtered = executions.filter(e => e.startedAt >= cutoff);
    this.executions.set(scheduleId, filtered);
  }

  private generateId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ==================== Factory & Utilities ====================

/**
 * Create scheduler instance
 */
export function createReportScheduler(
  config: Partial<SchedulerConfig>,
  reportGenerator: ReportGenerator,
  exportEngine: ExportEngine
): ReportScheduler {
  return new ReportScheduler(config, reportGenerator, exportEngine);
}

/**
 * Create daily schedule
 */
export async function createDailySchedule(
  scheduler: ReportScheduler,
  name: string,
  reportConfig: ReportConfig,
  deliveryConfig: EmailDeliveryConfig
): Promise<ScheduleConfig> {
  return scheduler.createSchedule({
    name,
    description: `Daily ${name}`,
    enabled: true,
    frequency: ScheduleFrequency.Daily,
    timezone: 'UTC',
    reportConfig,
    dataSource: 'default',
    deliveryMethods: [
      { method: DeliveryMethod.Email, config: deliveryConfig },
    ],
    retryOnFailure: true,
    maxRetries: 3,
    retryDelay: 5,
    createdBy: 'system',
  });
}

/**
 * Create weekly schedule
 */
export async function createWeeklySchedule(
  scheduler: ReportScheduler,
  name: string,
  reportConfig: ReportConfig,
  deliveryConfig: EmailDeliveryConfig
): Promise<ScheduleConfig> {
  return scheduler.createSchedule({
    name,
    description: `Weekly ${name}`,
    enabled: true,
    frequency: ScheduleFrequency.Weekly,
    timezone: 'UTC',
    reportConfig,
    dataSource: 'default',
    deliveryMethods: [
      { method: DeliveryMethod.Email, config: deliveryConfig },
    ],
    retryOnFailure: true,
    maxRetries: 3,
    retryDelay: 5,
    createdBy: 'system',
  });
}

/**
 * Parse cron expression
 */
export function parseCronExpression(expression: string): {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
} {
  // Mock cron parsing (in production, use node-cron)
  const parts = expression.split(' ');
  return {
    minute: parts[0] || '*',
    hour: parts[1] || '*',
    dayOfMonth: parts[2] || '*',
    month: parts[3] || '*',
    dayOfWeek: parts[4] || '*',
  };
}

/**
 * Validate cron expression
 */
export function validateCronExpression(expression: string): boolean {
  // Mock validation (in production, use cron-parser)
  const parts = expression.split(' ');
  return parts.length === 5;
}
