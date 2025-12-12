/**
 * Cloud API Client - Integration with Insight Cloud Backend (Phase 4)
 * 
 * Provides typed API calls to ODAVL Insight Cloud for:
 * - Creating analysis jobs
 * - Polling job status
 * - Fetching analysis results
 * - Listing user's projects and analyses
 * 
 * Automatically includes auth tokens from AuthManager.
 */

import type { InsightPlanId } from '@odavl-studio/auth';

/**
 * Backend URL configuration
 */
const BACKEND_URLS = {
  production: 'https://cloud.odavl.studio',
  development: 'http://localhost:3000',
} as const;

function getBackendUrl(): string {
  // TODO: Add configuration setting
  return BACKEND_URLS.production;
}

/**
 * Analysis status from Phase 4 backend
 */
export type AnalysisStatus = 
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED';

/**
 * Analysis issue severity
 */
export type IssueSeverity = 
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'INFO';

/**
 * Analysis job response from POST /api/insight/analysis
 */
export interface AnalysisJob {
  id: string;
  projectId: string;
  status: AnalysisStatus;
  progress: number;
  detectors: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Analysis result from GET /api/insight/analysis/:id
 */
export interface AnalysisResult {
  id: string;
  projectId: string;
  status: AnalysisStatus;
  progress: number;
  detectors: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  duration?: number;
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  issues: AnalysisIssue[];
}

/**
 * Analysis issue (finding)
 */
export interface AnalysisIssue {
  id: string;
  filePath: string;
  line: number;
  column?: number;
  severity: IssueSeverity;
  message: string;
  detector: string;
  ruleId?: string;
  category?: string;
  code?: string;
  suggestion?: string;
  autoFixable: boolean;
  confidence?: number;
}

/**
 * Project summary from GET /api/insight/analyses
 */
export interface ProjectSummary {
  id: string;
  name: string;
  gitUrl?: string;
  gitBranch?: string;
  analysisCount: number;
  lastAnalyzedAt?: string;
}

/**
 * List analyses response
 */
export interface AnalysesList {
  analyses: AnalysisResult[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Error response from backend
 */
export interface ApiError {
  error: string;
  message?: string;
  details?: any;
}

/**
 * API request options
 */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Cloud API Client
 */
export class CloudApiClient {
  private accessToken?: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken;
  }

  /**
   * Update access token (after sign-in or refresh)
   */
  setAccessToken(token: string | undefined): void {
    this.accessToken = token;
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<{ success: true; data: T } | { success: false; error: ApiError }> {
    try {
      const url = `${getBackendUrl()}${path}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data as ApiError,
        };
      }

      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          error: 'NetworkError',
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Create new analysis job
   * POST /api/insight/analysis
   */
  async createAnalysis(input: {
    projectId: string;
    detectors?: string[];
    language?: string;
    path?: string;
  }): Promise<{ success: true; data: AnalysisJob } | { success: false; error: ApiError }> {
    return this.request<AnalysisJob>('/api/insight/analysis', {
      method: 'POST',
      body: input,
    });
  }

  /**
   * Get analysis status and results
   * GET /api/insight/analysis/:id
   */
  async getAnalysis(
    analysisId: string
  ): Promise<{ success: true; data: AnalysisResult } | { success: false; error: ApiError }> {
    return this.request<AnalysisResult>(`/api/insight/analysis/${analysisId}`);
  }

  /**
   * List user's analyses
   * GET /api/insight/analyses
   */
  async listAnalyses(params?: {
    page?: number;
    pageSize?: number;
    projectId?: string;
    status?: AnalysisStatus;
  }): Promise<{ success: true; data: AnalysesList } | { success: false; error: ApiError }> {
    const query = new URLSearchParams();
    
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.projectId) query.set('projectId', params.projectId);
    if (params?.status) query.set('status', params.status);

    const path = `/api/insight/analyses${query.toString() ? `?${query}` : ''}`;
    return this.request<AnalysesList>(path);
  }

  /**
   * Poll analysis until completed or failed
   * 
   * @param analysisId Analysis ID to poll
   * @param onProgress Progress callback (called every 2s)
   * @param maxAttempts Maximum polling attempts (default: 150 = 5 minutes)
   * @returns Final analysis result or error
   */
  async pollAnalysis(
    analysisId: string,
    onProgress?: (progress: number, status: AnalysisStatus) => void,
    maxAttempts: number = 150
  ): Promise<{ success: true; data: AnalysisResult } | { success: false; error: ApiError }> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const result = await this.getAnalysis(analysisId);

      if (!result.success) {
        return result;
      }

      const analysis = result.data;

      // Call progress callback
      if (onProgress) {
        onProgress(analysis.progress, analysis.status);
      }

      // Check if completed
      if (analysis.status === 'COMPLETED' || analysis.status === 'FAILED') {
        return result;
      }

      // Wait 2 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }

    // Timeout
    return {
      success: false,
      error: {
        error: 'PollingTimeout',
        message: 'Analysis did not complete within the expected time',
      },
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}
