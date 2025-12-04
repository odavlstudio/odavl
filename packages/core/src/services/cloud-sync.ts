/**
 * Cloud Sync Service
 * Syncs CLI analysis results to cloud platform
 * 
 * Features:
 * - Upload Insight analysis results
 * - Upload Autopilot ledgers and snapshots
 * - Upload Guardian test results and screenshots
 * - Job queue integration
 * - Progress tracking
 */

import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export enum SyncStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum SyncType {
  INSIGHT_ANALYSIS = 'INSIGHT_ANALYSIS',
  AUTOPILOT_LEDGER = 'AUTOPILOT_LEDGER',
  GUARDIAN_RESULTS = 'GUARDIAN_RESULTS',
  GUARDIAN_SCREENSHOT = 'GUARDIAN_SCREENSHOT',
}

export interface SyncJob {
  id: string;
  type: SyncType;
  status: SyncStatus;
  
  // Source info
  projectId: string;
  organizationId: string;
  
  // File info
  localPath: string;
  cloudUrl?: string;
  fileSize: number;
  
  // Progress
  uploadedBytes: number;
  uploadProgress: number; // 0-100
  
  // Timing
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Metadata
  metadata?: Record<string, unknown>;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface InsightAnalysisResult {
  projectId: string;
  organizationId: string;
  timestamp: Date;
  
  // Analysis data
  detectors: string[];
  totalIssues: number;
  issuesBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  
  // Detailed issues
  issues: Array<{
    detector: string;
    severity: string;
    message: string;
    file: string;
    line: number;
    column?: number;
  }>;
  
  // Metrics
  metrics?: {
    filesAnalyzed: number;
    duration: number;
    codeLines: number;
  };
}

export interface AutopilotLedger {
  projectId: string;
  organizationId: string;
  runId: string;
  timestamp: Date;
  
  // O-D-A-V-L phases
  phases: {
    observe: {
      status: string;
      metrics: Record<string, unknown>;
      duration: number;
    };
    decide: {
      status: string;
      selectedRecipe?: string;
      trustScore?: number;
      duration: number;
    };
    act: {
      status: string;
      filesModified: string[];
      linesChanged: number;
      duration: number;
    };
    verify: {
      status: string;
      qualityImproved: boolean;
      attestation?: string;
      duration: number;
    };
    learn: {
      status: string;
      trustScoreUpdated: boolean;
      duration: number;
    };
  };
  
  // Summary
  success: boolean;
  totalDuration: number;
  improvementScore?: number;
}

export interface GuardianTestResult {
  projectId: string;
  organizationId: string;
  testRunId: string;
  timestamp: Date;
  
  // Test info
  url: string;
  environment: string;
  
  // Results
  tests: {
    accessibility: {
      score: number;
      violations: number;
      passes: number;
    };
    performance: {
      loadTime: number;
      ttfb: number;
      fcp: number;
      lcp: number;
    };
    security: {
      vulnerabilities: number;
      warnings: number;
    };
  };
  
  // Screenshots
  screenshots: string[];
  
  // Overall
  passed: boolean;
  totalTests: number;
  failedTests: number;
}

export class CloudSyncService {
  private static instance: CloudSyncService;
  private syncJobs = new Map<string, SyncJob>();
  private apiEndpoint: string;
  private apiKey?: string;
  
  private constructor() {
    this.apiEndpoint = process.env.ODAVL_CLOUD_API || 'https://api.odavl.studio';
    this.apiKey = process.env.ODAVL_API_KEY;
  }
  
  public static getInstance(): CloudSyncService {
    if (!CloudSyncService.instance) {
      CloudSyncService.instance = new CloudSyncService();
    }
    return CloudSyncService.instance;
  }
  
  /**
   * Upload Insight analysis results
   */
  public async uploadInsightAnalysis(
    result: InsightAnalysisResult,
    localPath: string
  ): Promise<SyncJob> {
    const jobId = this.createJobId('insight');
    
    const job: SyncJob = {
      id: jobId,
      type: SyncType.INSIGHT_ANALYSIS,
      status: SyncStatus.PENDING,
      projectId: result.projectId,
      organizationId: result.organizationId,
      localPath,
      fileSize: 0,
      uploadedBytes: 0,
      uploadProgress: 0,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      metadata: {
        totalIssues: result.totalIssues,
        detectors: result.detectors,
      },
    };
    
    this.syncJobs.set(jobId, job);
    
    // Start upload in background
    this.processUpload(job, result).catch(error => {
      console.error(`Upload failed for job ${jobId}:`, error);
      job.status = SyncStatus.FAILED;
      job.error = error.message;
      this.syncJobs.set(jobId, job);
    });
    
    return job;
  }
  
  /**
   * Upload Autopilot ledger
   */
  public async uploadAutopilotLedger(
    ledger: AutopilotLedger,
    localPath: string
  ): Promise<SyncJob> {
    const jobId = this.createJobId('autopilot');
    
    const job: SyncJob = {
      id: jobId,
      type: SyncType.AUTOPILOT_LEDGER,
      status: SyncStatus.PENDING,
      projectId: ledger.projectId,
      organizationId: ledger.organizationId,
      localPath,
      fileSize: 0,
      uploadedBytes: 0,
      uploadProgress: 0,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      metadata: {
        runId: ledger.runId,
        success: ledger.success,
        filesModified: ledger.phases.act.filesModified.length,
      },
    };
    
    this.syncJobs.set(jobId, job);
    
    // Start upload
    this.processUpload(job, ledger).catch(error => {
      console.error(`Upload failed for job ${jobId}:`, error);
      job.status = SyncStatus.FAILED;
      job.error = error.message;
      this.syncJobs.set(jobId, job);
    });
    
    return job;
  }
  
  /**
   * Upload Guardian test results
   */
  public async uploadGuardianResults(
    results: GuardianTestResult,
    localPath: string
  ): Promise<SyncJob> {
    const jobId = this.createJobId('guardian');
    
    const job: SyncJob = {
      id: jobId,
      type: SyncType.GUARDIAN_RESULTS,
      status: SyncStatus.PENDING,
      projectId: results.projectId,
      organizationId: results.organizationId,
      localPath,
      fileSize: 0,
      uploadedBytes: 0,
      uploadProgress: 0,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      metadata: {
        testRunId: results.testRunId,
        passed: results.passed,
        url: results.url,
        screenshots: results.screenshots.length,
      },
    };
    
    this.syncJobs.set(jobId, job);
    
    // Start upload
    this.processUpload(job, results).catch(error => {
      console.error(`Upload failed for job ${jobId}:`, error);
      job.status = SyncStatus.FAILED;
      job.error = error.message;
      this.syncJobs.set(jobId, job);
    });
    
    return job;
  }
  
  /**
   * Upload screenshot file
   */
  public async uploadScreenshot(
    projectId: string,
    organizationId: string,
    testRunId: string,
    screenshotPath: string
  ): Promise<SyncJob> {
    const jobId = this.createJobId('screenshot');
    
    const stats = await fs.stat(screenshotPath);
    
    const job: SyncJob = {
      id: jobId,
      type: SyncType.GUARDIAN_SCREENSHOT,
      status: SyncStatus.PENDING,
      projectId,
      organizationId,
      localPath: screenshotPath,
      fileSize: stats.size,
      uploadedBytes: 0,
      uploadProgress: 0,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      metadata: {
        testRunId,
        filename: path.basename(screenshotPath),
      },
    };
    
    this.syncJobs.set(jobId, job);
    
    // Start upload
    this.uploadFile(job).catch(error => {
      console.error(`Upload failed for job ${jobId}:`, error);
      job.status = SyncStatus.FAILED;
      job.error = error.message;
      this.syncJobs.set(jobId, job);
    });
    
    return job;
  }
  
  /**
   * Process data upload
   */
  private async processUpload(job: SyncJob, data: unknown): Promise<void> {
    if (!this.apiKey) {
      throw new Error('ODAVL_API_KEY not configured');
    }
    
    job.status = SyncStatus.UPLOADING;
    job.startedAt = new Date();
    this.syncJobs.set(job.id, job);
    
    const endpoint = this.getEndpointForType(job.type);
    const jsonData = JSON.stringify(data);
    job.fileSize = Buffer.byteLength(jsonData);
    
    try {
      const response = await fetch(`${this.apiEndpoint}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Organization-Id': job.organizationId,
          'X-Project-Id': job.projectId,
        },
        body: jsonData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      job.status = SyncStatus.COMPLETED;
      job.completedAt = new Date();
      job.uploadProgress = 100;
      job.uploadedBytes = job.fileSize;
      job.cloudUrl = result.url || result.id;
      
      this.syncJobs.set(job.id, job);
    } catch (error) {
      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = SyncStatus.PENDING;
        this.syncJobs.set(job.id, job);
        
        // Retry after delay
        await new Promise(resolve => setTimeout(resolve, 2000 * job.retryCount));
        return this.processUpload(job, data);
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Upload file (for screenshots)
   */
  private async uploadFile(job: SyncJob): Promise<void> {
    if (!this.apiKey) {
      throw new Error('ODAVL_API_KEY not configured');
    }
    
    job.status = SyncStatus.UPLOADING;
    job.startedAt = new Date();
    this.syncJobs.set(job.id, job);
    
    try {
      const fileBuffer = await fs.readFile(job.localPath);
      const filename = path.basename(job.localPath);
      
      // Get signed upload URL
      const signedUrlResponse = await fetch(
        `${this.apiEndpoint}/api/v1/storage/upload-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            organizationId: job.organizationId,
            projectId: job.projectId,
            filename,
            contentType: 'image/png',
            metadata: job.metadata,
          }),
        }
      );
      
      if (!signedUrlResponse.ok) {
        throw new Error(`Failed to get upload URL: ${signedUrlResponse.statusText}`);
      }
      
      const { uploadUrl, fileUrl } = await signedUrlResponse.json();
      
      // Upload file to signed URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
        },
        body: fileBuffer,
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`File upload failed: ${uploadResponse.statusText}`);
      }
      
      job.status = SyncStatus.COMPLETED;
      job.completedAt = new Date();
      job.uploadProgress = 100;
      job.uploadedBytes = job.fileSize;
      job.cloudUrl = fileUrl;
      
      this.syncJobs.set(job.id, job);
    } catch (error) {
      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = SyncStatus.PENDING;
        this.syncJobs.set(job.id, job);
        
        // Retry after delay
        await new Promise(resolve => setTimeout(resolve, 2000 * job.retryCount));
        return this.uploadFile(job);
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Get endpoint for sync type
   */
  private getEndpointForType(type: SyncType): string {
    switch (type) {
      case SyncType.INSIGHT_ANALYSIS:
        return '/api/v1/sync/insight';
      case SyncType.AUTOPILOT_LEDGER:
        return '/api/v1/sync/autopilot';
      case SyncType.GUARDIAN_RESULTS:
        return '/api/v1/sync/guardian';
      default:
        throw new Error(`Unknown sync type: ${type}`);
    }
  }
  
  /**
   * Create job ID
   */
  private createJobId(prefix: string): string {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
  
  /**
   * Get sync job status
   */
  public getSyncJob(jobId: string): SyncJob | null {
    return this.syncJobs.get(jobId) || null;
  }
  
  /**
   * Get all sync jobs for project
   */
  public getSyncJobsForProject(projectId: string): SyncJob[] {
    return Array.from(this.syncJobs.values())
      .filter(job => job.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  /**
   * Get sync statistics
   */
  public getSyncStats(organizationId?: string): {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    uploading: number;
    byType: Record<SyncType, number>;
  } {
    let jobs = Array.from(this.syncJobs.values());
    
    if (organizationId) {
      jobs = jobs.filter(job => job.organizationId === organizationId);
    }
    
    const total = jobs.length;
    const completed = jobs.filter(j => j.status === SyncStatus.COMPLETED).length;
    const failed = jobs.filter(j => j.status === SyncStatus.FAILED).length;
    const pending = jobs.filter(j => j.status === SyncStatus.PENDING).length;
    const uploading = jobs.filter(j => j.status === SyncStatus.UPLOADING).length;
    
    const byType = {} as Record<SyncType, number>;
    Object.values(SyncType).forEach(type => {
      byType[type] = jobs.filter(j => j.type === type).length;
    });
    
    return {
      total,
      completed,
      failed,
      pending,
      uploading,
      byType,
    };
  }
  
  /**
   * Retry failed job
   */
  public async retryJob(jobId: string): Promise<void> {
    const job = this.syncJobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    
    if (job.status !== SyncStatus.FAILED) {
      throw new Error('Can only retry failed jobs');
    }
    
    job.status = SyncStatus.PENDING;
    job.retryCount = 0;
    job.error = undefined;
    this.syncJobs.set(jobId, job);
    
    // TODO: Re-trigger upload based on job type
  }
  
  /**
   * Cancel pending job
   */
  public cancelJob(jobId: string): void {
    const job = this.syncJobs.get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    
    if (job.status !== SyncStatus.PENDING) {
      throw new Error('Can only cancel pending jobs');
    }
    
    this.syncJobs.delete(jobId);
  }
  
  /**
   * Clear completed jobs older than specified days
   */
  public clearOldJobs(daysToKeep: number = 7): number {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    let deletedCount = 0;
    
    for (const [id, job] of this.syncJobs.entries()) {
      if (
        job.status === SyncStatus.COMPLETED &&
        job.completedAt &&
        job.completedAt < cutoffDate
      ) {
        this.syncJobs.delete(id);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }
}

// Export singleton instance
export const cloudSyncService = CloudSyncService.getInstance();
