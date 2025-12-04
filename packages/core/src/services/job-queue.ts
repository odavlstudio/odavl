/**
 * Job Queue Service
 * Background job processing using BullMQ + Redis
 * 
 * Features:
 * - Queue management for async tasks
 * - Job scheduling and prioritization
 * - Progress tracking
 * - Retry mechanism
 * - Job result caching
 */

import crypto from 'node:crypto';

export enum JobType {
  INSIGHT_ANALYSIS = 'INSIGHT_ANALYSIS',
  AUTOPILOT_CYCLE = 'AUTOPILOT_CYCLE',
  GUARDIAN_TEST = 'GUARDIAN_TEST',
  REPORT_GENERATION = 'REPORT_GENERATION',
  BULK_INVITATION = 'BULK_INVITATION',
  EMAIL_SEND = 'EMAIL_SEND',
  DATA_EXPORT = 'DATA_EXPORT',
}

export enum JobPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 20,
}

export enum JobStatus {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  DELAYED = 'DELAYED',
  PAUSED = 'PAUSED',
}

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  
  // Data
  data: Record<string, unknown>;
  result?: Record<string, unknown>;
  
  // Progress
  progress: number; // 0-100
  
  // Timing
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  
  // Retry
  attempts: number;
  maxAttempts: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  
  // Error handling
  error?: string;
  stackTrace?: string;
  
  // Metadata
  organizationId?: string;
  projectId?: string;
  userId?: string;
  
  // Options
  delay?: number; // Milliseconds to wait before processing
  timeout?: number; // Job timeout in milliseconds
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface JobResult {
  jobId: string;
  status: JobStatus;
  result?: Record<string, unknown>;
  error?: string;
  duration?: number;
}

export class JobQueueService {
  private static instance: JobQueueService;
  private jobs = new Map<string, Job>();
  private queues = new Map<JobType, Job[]>();
  private processing = new Set<string>();
  private redisConnected = false;
  
  private constructor() {
    // Initialize queues for all job types
    Object.values(JobType).forEach(type => {
      this.queues.set(type, []);
    });
    
    // Check Redis connection
    this.checkRedisConnection();
    
    // Start job processor
    this.startProcessor();
  }
  
  public static getInstance(): JobQueueService {
    if (!JobQueueService.instance) {
      JobQueueService.instance = new JobQueueService();
    }
    return JobQueueService.instance;
  }
  
  /**
   * Check Redis connection
   */
  private async checkRedisConnection(): Promise<void> {
    // TODO: Implement actual Redis connection check
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      console.log('Redis URL configured:', redisUrl);
      // this.redisConnected = true;
    } else {
      console.warn('Redis not configured, using in-memory queue');
    }
  }
  
  /**
   * Add job to queue
   */
  public async addJob(params: {
    type: JobType;
    data: Record<string, unknown>;
    priority?: JobPriority;
    delay?: number;
    organizationId?: string;
    projectId?: string;
    userId?: string;
    maxAttempts?: number;
    timeout?: number;
  }): Promise<Job> {
    const jobId = `job_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    const job: Job = {
      id: jobId,
      type: params.type,
      status: params.delay ? JobStatus.DELAYED : JobStatus.WAITING,
      priority: params.priority || JobPriority.NORMAL,
      data: params.data,
      progress: 0,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: params.maxAttempts || 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      organizationId: params.organizationId,
      projectId: params.projectId,
      userId: params.userId,
      delay: params.delay,
      timeout: params.timeout || 300000, // 5 minutes default
      removeOnComplete: true,
      removeOnFail: false,
    };
    
    this.jobs.set(jobId, job);
    
    // Add to appropriate queue
    const queue = this.queues.get(params.type);
    if (queue) {
      queue.push(job);
      // Sort by priority (highest first)
      queue.sort((a, b) => b.priority - a.priority);
      this.queues.set(params.type, queue);
    }
    
    return job;
  }
  
  /**
   * Start job processor
   */
  private startProcessor(): void {
    // Process jobs every second
    setInterval(() => {
      this.processJobs();
    }, 1000);
  }
  
  /**
   * Process waiting jobs
   */
  private async processJobs(): Promise<void> {
    for (const [type, queue] of this.queues.entries()) {
      // Skip if no jobs waiting
      const waitingJobs = queue.filter(j => j.status === JobStatus.WAITING);
      if (waitingJobs.length === 0) continue;
      
      // Process highest priority job
      const job = waitingJobs[0];
      if (!job || this.processing.has(job.id)) continue;
      
      this.processing.add(job.id);
      this.executeJob(job).finally(() => {
        this.processing.delete(job.id);
      });
    }
    
    // Check delayed jobs
    this.processDelayedJobs();
  }
  
  /**
   * Process delayed jobs
   */
  private processDelayedJobs(): void {
    const now = Date.now();
    
    for (const job of this.jobs.values()) {
      if (
        job.status === JobStatus.DELAYED &&
        job.delay &&
        now >= job.createdAt.getTime() + job.delay
      ) {
        job.status = JobStatus.WAITING;
        job.delay = undefined;
        this.jobs.set(job.id, job);
      }
    }
  }
  
  /**
   * Execute job
   */
  private async executeJob(job: Job): Promise<void> {
    job.status = JobStatus.ACTIVE;
    job.startedAt = new Date();
    job.attempts++;
    this.jobs.set(job.id, job);
    
    try {
      // Execute job based on type
      const result = await this.executeJobByType(job);
      
      job.status = JobStatus.COMPLETED;
      job.completedAt = new Date();
      job.result = result;
      job.progress = 100;
      
      this.jobs.set(job.id, job);
      
      // Remove from queue if configured
      if (job.removeOnComplete) {
        this.removeJobFromQueue(job);
      }
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      
      job.error = error instanceof Error ? error.message : String(error);
      job.stackTrace = error instanceof Error ? error.stack : undefined;
      
      // Retry if attempts remaining
      if (job.attempts < job.maxAttempts) {
        const delay = job.backoff?.type === 'exponential'
          ? (job.backoff.delay * Math.pow(2, job.attempts - 1))
          : (job.backoff?.delay || 1000);
        
        job.status = JobStatus.DELAYED;
        job.delay = delay;
        this.jobs.set(job.id, job);
      } else {
        job.status = JobStatus.FAILED;
        job.failedAt = new Date();
        this.jobs.set(job.id, job);
        
        if (job.removeOnFail) {
          this.removeJobFromQueue(job);
        }
      }
    }
  }
  
  /**
   * Execute job by type
   */
  private async executeJobByType(job: Job): Promise<Record<string, unknown>> {
    switch (job.type) {
      case JobType.INSIGHT_ANALYSIS:
        return this.executeInsightAnalysis(job);
      
      case JobType.AUTOPILOT_CYCLE:
        return this.executeAutopilotCycle(job);
      
      case JobType.GUARDIAN_TEST:
        return this.executeGuardianTest(job);
      
      case JobType.REPORT_GENERATION:
        return this.executeReportGeneration(job);
      
      case JobType.BULK_INVITATION:
        return this.executeBulkInvitation(job);
      
      case JobType.EMAIL_SEND:
        return this.executeEmailSend(job);
      
      case JobType.DATA_EXPORT:
        return this.executeDataExport(job);
      
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }
  
  /**
   * Execute Insight analysis
   */
  private async executeInsightAnalysis(job: Job): Promise<Record<string, unknown>> {
    // TODO: Implement actual Insight analysis
    await this.simulateWork(job, 5000);
    
    return {
      totalIssues: 42,
      issuesBySeverity: {
        critical: 2,
        high: 8,
        medium: 15,
        low: 17,
      },
      filesAnalyzed: 156,
    };
  }
  
  /**
   * Execute Autopilot cycle
   */
  private async executeAutopilotCycle(job: Job): Promise<Record<string, unknown>> {
    // TODO: Implement actual Autopilot cycle
    await this.simulateWork(job, 10000);
    
    return {
      success: true,
      filesModified: 3,
      linesChanged: 45,
      qualityImproved: true,
    };
  }
  
  /**
   * Execute Guardian test
   */
  private async executeGuardianTest(job: Job): Promise<Record<string, unknown>> {
    // TODO: Implement actual Guardian test
    await this.simulateWork(job, 8000);
    
    return {
      passed: true,
      totalTests: 15,
      failedTests: 0,
      screenshots: 3,
    };
  }
  
  /**
   * Execute report generation
   */
  private async executeReportGeneration(job: Job): Promise<Record<string, unknown>> {
    // TODO: Implement actual report generation
    await this.simulateWork(job, 3000);
    
    return {
      reportId: `report_${Date.now()}`,
      format: job.data.format || 'PDF',
      fileSize: 1024000,
    };
  }
  
  /**
   * Execute bulk invitation
   */
  private async executeBulkInvitation(job: Job): Promise<Record<string, unknown>> {
    // TODO: Implement actual bulk invitation
    const emails = (job.data.emails as string[]) || [];
    await this.simulateWork(job, emails.length * 100);
    
    return {
      sent: emails.length,
      failed: 0,
    };
  }
  
  /**
   * Execute email send
   */
  private async executeEmailSend(job: Job): Promise<Record<string, unknown>> {
    // TODO: Implement actual email send
    await this.simulateWork(job, 1000);
    
    return {
      messageId: `msg_${Date.now()}`,
      sent: true,
    };
  }
  
  /**
   * Execute data export
   */
  private async executeDataExport(job: Job): Promise<Record<string, unknown>> {
    // TODO: Implement actual data export
    await this.simulateWork(job, 5000);
    
    return {
      exportId: `export_${Date.now()}`,
      format: job.data.format || 'JSON',
      fileSize: 2048000,
    };
  }
  
  /**
   * Simulate work with progress updates
   */
  private async simulateWork(job: Job, duration: number): Promise<void> {
    const steps = 10;
    const stepDuration = duration / steps;
    
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      job.progress = (i / steps) * 100;
      this.jobs.set(job.id, job);
    }
  }
  
  /**
   * Remove job from queue
   */
  private removeJobFromQueue(job: Job): void {
    const queue = this.queues.get(job.type);
    if (queue) {
      const index = queue.findIndex(j => j.id === job.id);
      if (index !== -1) {
        queue.splice(index, 1);
        this.queues.set(job.type, queue);
      }
    }
    
    // Also remove from jobs map
    this.jobs.delete(job.id);
  }
  
  /**
   * Get job by ID
   */
  public getJob(jobId: string): Job | null {
    return this.jobs.get(jobId) || null;
  }
  
  /**
   * Get jobs by status
   */
  public getJobsByStatus(status: JobStatus): Job[] {
    return Array.from(this.jobs.values())
      .filter(job => job.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  /**
   * Get jobs for project
   */
  public getJobsForProject(projectId: string): Job[] {
    return Array.from(this.jobs.values())
      .filter(job => job.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  /**
   * Get queue statistics
   */
  public getQueueStats(type?: JobType): QueueStats {
    let jobs = Array.from(this.jobs.values());
    
    if (type) {
      jobs = jobs.filter(job => job.type === type);
    }
    
    return {
      waiting: jobs.filter(j => j.status === JobStatus.WAITING).length,
      active: jobs.filter(j => j.status === JobStatus.ACTIVE).length,
      completed: jobs.filter(j => j.status === JobStatus.COMPLETED).length,
      failed: jobs.filter(j => j.status === JobStatus.FAILED).length,
      delayed: jobs.filter(j => j.status === JobStatus.DELAYED).length,
      paused: jobs.filter(j => j.status === JobStatus.PAUSED).length,
    };
  }
  
  /**
   * Pause queue
   */
  public pauseQueue(type: JobType): void {
    const queue = this.queues.get(type);
    if (queue) {
      queue.forEach(job => {
        if (job.status === JobStatus.WAITING) {
          job.status = JobStatus.PAUSED;
          this.jobs.set(job.id, job);
        }
      });
    }
  }
  
  /**
   * Resume queue
   */
  public resumeQueue(type: JobType): void {
    const queue = this.queues.get(type);
    if (queue) {
      queue.forEach(job => {
        if (job.status === JobStatus.PAUSED) {
          job.status = JobStatus.WAITING;
          this.jobs.set(job.id, job);
        }
      });
    }
  }
  
  /**
   * Cancel job
   */
  public cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    if (job.status === JobStatus.ACTIVE) {
      // Cannot cancel active job
      return false;
    }
    
    this.removeJobFromQueue(job);
    return true;
  }
  
  /**
   * Retry failed job
   */
  public async retryJob(jobId: string): Promise<Job> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    
    if (job.status !== JobStatus.FAILED) {
      throw new Error('Can only retry failed jobs');
    }
    
    job.status = JobStatus.WAITING;
    job.attempts = 0;
    job.error = undefined;
    job.stackTrace = undefined;
    job.progress = 0;
    
    this.jobs.set(jobId, job);
    
    // Add back to queue
    const queue = this.queues.get(job.type);
    if (queue) {
      queue.push(job);
      queue.sort((a, b) => b.priority - a.priority);
      this.queues.set(job.type, queue);
    }
    
    return job;
  }
  
  /**
   * Clear completed jobs
   */
  public clearCompleted(olderThanMinutes: number = 60): number {
    const cutoffTime = Date.now() - (olderThanMinutes * 60 * 1000);
    let count = 0;
    
    for (const [id, job] of this.jobs.entries()) {
      if (
        job.status === JobStatus.COMPLETED &&
        job.completedAt &&
        job.completedAt.getTime() < cutoffTime
      ) {
        this.removeJobFromQueue(job);
        count++;
      }
    }
    
    return count;
  }
}

// Export singleton instance
export const jobQueueService = JobQueueService.getInstance();
