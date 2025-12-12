/**
 * ODAVL Cloud Client - Main API client
 * 
 * Features:
 * - Automatic authentication
 * - Retry with exponential backoff
 * - Offline queue
 * - Usage quota checking
 * - Type-safe API calls
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { AuthManager } from './auth';
import { OfflineQueue, QueuedRequest } from './queue';
import {
  AuthenticationError,
  QuotaExceededError,
  NetworkError,
  ValidationError,
  RateLimitError,
} from './errors';
import type {
  CloudClientConfig,
  ApiResponse,
  InsightRunPayload,
  AutopilotRunPayload,
  GuardianTestPayload,
  UsageCheckResponse,
  UsageIncrementPayload,
  FileUploadOptions,
  FileUploadResponse,
  JobCreatePayload,
  JobStatusResponse,
} from './types';

export class ODAVLCloudClient {
  private config: Required<CloudClientConfig>;
  private httpClient: AxiosInstance;
  private authManager: AuthManager;
  private offlineQueue: OfflineQueue;

  constructor(config: CloudClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'https://api.odavl.io',
      apiKey: config.apiKey || '',
      offlineQueue: config.offlineQueue !== false,
      retry: {
        retries: 3,
        retryDelay: 1000,
        ...config.retry,
      },
      timeout: config.timeout || 30000,
      debug: config.debug || false,
    };

    this.authManager = new AuthManager(this.config.baseUrl);
    this.offlineQueue = new OfflineQueue();

    // Create HTTP client with retry
    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ODAVL-CLI/2.0',
      },
    });

    // Configure axios-retry
    axiosRetry(this.httpClient, {
      retries: this.config.retry.retries,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error: AxiosError) => {
        // Retry on network errors or 5xx errors
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status ? error.response.status >= 500 : false)
        );
      },
    });

    // Add auth interceptor
    this.httpClient.interceptors.request.use(async (config) => {
      const authHeaders = await this.authManager.getAuthHeaders();
      // Properly merge headers by setting each key
      Object.entries(authHeaders).forEach(([key, value]) => {
        config.headers.set(key, value);
      });
      return config;
    });

    // Add error handler interceptor
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  /**
   * Handle API errors
   */
  private async handleError(error: AxiosError): Promise<never> {
    // Network error (offline)
    if (!error.response) {
      // Queue request if offline queue is enabled
      if (this.config.offlineQueue && error.config) {
        await this.offlineQueue.enqueue(
          error.config.url || '',
          error.config.method || 'GET',
          error.config.data,
          error.config.headers as Record<string, string>
        );
      }
      throw new NetworkError('Network error. Request queued for retry.');
    }

    const status = error.response.status;
    const data = error.response.data as any;

    // Authentication error
    if (status === 401) {
      throw new AuthenticationError(
        data?.error?.message || 'Authentication required. Run: odavl login'
      );
    }

    // Quota exceeded
    if (status === 429 && data?.error?.code === 'QUOTA_EXCEEDED') {
      throw new QuotaExceededError(
        data.error.message,
        data.error.details.current,
        data.error.details.limit,
        data.error.details.upgradeUrl
      );
    }

    // Rate limit
    if (status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
      throw new RateLimitError(
        'Rate limit exceeded. Please try again later.',
        retryAfter
      );
    }

    // Validation error
    if (status === 400) {
      throw new ValidationError(
        data?.error?.message || 'Validation error',
        data?.error?.details
      );
    }

    // Generic error
    throw error;
  }

  // ============================================
  // Authentication
  // ============================================

  async login(apiKey: string): Promise<void> {
    return this.authManager.loginWithApiKey(apiKey);
  }

  async loginDevice(): Promise<{
    userCode: string;
    verificationUri: string;
    expiresIn: number;
  }> {
    return this.authManager.loginWithDeviceFlow();
  }

  async logout(): Promise<void> {
    return this.authManager.logout();
  }

  async isAuthenticated(): Promise<boolean> {
    return this.authManager.isAuthenticated();
  }

  // ============================================
  // Usage Tracking
  // ============================================

  async checkUsage(
    period: 'day' | 'week' | 'month' = 'month',
    scope: 'user' | 'org' = 'user'
  ): Promise<UsageCheckResponse> {
    const response = await this.httpClient.get<ApiResponse<UsageCheckResponse>>(
      `/api/v1/usage?period=${period}&scope=${scope}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to check usage');
    }

    return response.data.data!;
  }

  // ============================================
  // Workspace Storage
  // ============================================

  async uploadWorkspace(name: string, path: string): Promise<any> {
    const response = await this.httpClient.post<ApiResponse<any>>(
      '/api/v1/workspaces/upload',
      { workspaceName: name, workspacePath: path }
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to upload workspace');
    }

    return response.data;
  }

  async downloadWorkspace(name: string, path: string): Promise<any> {
    const response = await this.httpClient.get<ApiResponse<any>>(
      `/api/v1/workspaces/download/${name}?path=${encodeURIComponent(path)}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to download workspace');
    }

    return response.data;
  }

  async syncWorkspace(name: string, path: string, options: any): Promise<any> {
    const response = await this.httpClient.post<ApiResponse<any>>(
      '/api/v1/workspaces/sync',
      { workspaceName: name, workspacePath: path, ...options }
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to sync workspace');
    }

    return response.data;
  }

  async listWorkspaces(): Promise<any> {
    const response = await this.httpClient.get<ApiResponse<any>>(
      '/api/v1/workspaces'
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to list workspaces');
    }

    return response.data;
  }

  async deleteWorkspace(name: string): Promise<void> {
    const response = await this.httpClient.delete<ApiResponse<any>>(
      `/api/v1/workspaces/${name}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to delete workspace');
    }
  }

  async getLocalMetadata(path: string): Promise<any> {
    // TODO: Implement local metadata reading
    throw new Error('Not implemented');
  }

  async getRemoteMetadata(name: string): Promise<any> {
    // TODO: Implement remote metadata fetching
    throw new Error('Not implemented');
  }

  async incrementUsage(payload: UsageIncrementPayload): Promise<void> {
    await this.httpClient.post('/api/v1/usage/increment', payload);
  }

  // ============================================
  // Insight API
  // ============================================

  async uploadInsightRun(payload: InsightRunPayload): Promise<string> {
    const response = await this.httpClient.post<ApiResponse<{ id: string }>>(
      '/api/v1/insight/results',
      payload
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to upload Insight run');
    }

    return response.data.data!.id;
  }

  // ============================================
  // Autopilot API
  // ============================================

  async uploadAutopilotRun(payload: AutopilotRunPayload): Promise<string> {
    const response = await this.httpClient.post<ApiResponse<{ id: string }>>(
      '/api/v1/autopilot/runs',
      payload
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to upload Autopilot run');
    }

    return response.data.data!.id;
  }

  // ============================================
  // Guardian API
  // ============================================

  async uploadGuardianTest(payload: GuardianTestPayload): Promise<string> {
    const response = await this.httpClient.post<ApiResponse<{ id: string }>>(
      '/api/v1/guardian/tests',
      payload
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to upload Guardian test');
    }

    return response.data.data!.id;
  }

  // ============================================
  // File Upload
  // ============================================

  async uploadFile(options: FileUploadOptions): Promise<FileUploadResponse> {
    // Implementation will be added after Storage SDK is ready
    throw new Error('File upload not implemented yet');
  }

  // ============================================
  // Cloud Runner
  // ============================================

  async createJob(payload: JobCreatePayload): Promise<string> {
    const response = await this.httpClient.post<ApiResponse<{ jobId: string }>>(
      '/jobs',
      payload
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to create job');
    }

    return response.data.data!.jobId;
  }

  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const response = await this.httpClient.get<ApiResponse<JobStatusResponse>>(
      `/jobs/${jobId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to get job status');
    }

    return response.data.data!;
  }

  async waitForJob(
    jobId: string,
    onProgress?: (progress: number) => void
  ): Promise<JobStatusResponse> {
    let status: JobStatusResponse;

    do {
      status = await this.getJobStatus(jobId);

      if (onProgress) {
        onProgress(status.progress);
      }

      if (status.status === 'completed' || status.status === 'failed') {
        break;
      }

      // Wait 2 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } while (true);

    return status;
  }

  // ============================================
  // Offline Queue Management
  // ============================================

  async syncOfflineQueue(): Promise<{ success: number; failed: number }> {
    if (!this.config.offlineQueue) {
      return { success: 0, failed: 0 };
    }

    return this.offlineQueue.process(async (req: QueuedRequest) => {
      await this.httpClient.request({
        url: req.url,
        method: req.method as any,
        data: req.data,
        headers: req.headers,
      });
    });
  }

  getQueueSize(): number {
    return this.offlineQueue.size();
  }

  async clearQueue(): Promise<void> {
    return this.offlineQueue.clear();
  }
}
