/**
 * Cloud Compute Runner
 * Job queue interface for executing ODAVL jobs
 */
import type { CloudJob } from '../../shared/types/index.js';
import { cloudLogger } from '../../shared/utils/index.js';

export interface JobRunner {
  enqueue(job: CloudJob): Promise<void>;
  getStatus(jobId: string): Promise<CloudJob | null>;
}

export class LocalJobRunner implements JobRunner {
  private jobs: Map<string, CloudJob> = new Map();

  async enqueue(job: CloudJob): Promise<void> {
    cloudLogger('info', 'Job enqueued', { jobId: job.id, product: job.product });
    this.jobs.set(job.id, job);
  }

  async getStatus(jobId: string): Promise<CloudJob | null> {
    const job = this.jobs.get(jobId);
    if (!job) {
      cloudLogger('warn', 'Job not found', { jobId });
      return null;
    }
    return job;
  }
}

export const jobRunner = new LocalJobRunner();
