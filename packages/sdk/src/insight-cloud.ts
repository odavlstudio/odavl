/**
 * ODAVL Insight Cloud SDK
 * 
 * Clean, type-safe API client for ODAVL Insight Cloud backend.
 * Used by:
 * - VS Code Extension (Phase 6)
 * - CLI (future)
 * - External integrators
 * 
 * Consolidates logic from Phase 6 extension's cloud-client.ts.
 */

/**
 * Analysis status from backend
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
 * Analysis job (initial response from POST /api/insight/analysis)
 */
export interface InsightAnalysisJob {
  id: string;
  projectId: string;
  status: AnalysisStatus;
  progress: number;
  detectors: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Analysis result (full response from GET /api/insight/analysis/:id)
 */
export interface InsightAnalysisResult {
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
  issues: InsightCloudIssue[];
}

/**
 * Analysis issue (finding from cloud backend)
 */
export interface InsightCloudIssue {
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
 * Project (workspace analyzed in cloud)
 */
export interface InsightProject {
  id: string;
  name: string;
  gitUrl?: string;
  gitBranch?: string;
  analysisCount: number;
  lastAnalyzedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * List analyses response
 */
export interface InsightAnalysesList {
  analyses: InsightAnalysisResult[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * List projects response
 */
export interface InsightProjectsList {
  projects: InsightProject[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * List issues response (with filters)
 */
export interface InsightIssuesList {
  issues: InsightCloudIssue[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Error response from backend
 */
export interface InsightApiError {
  error: string;
  message?: string;
  details?: any;
  statusCode?: number;
}

/**
 * Success response wrapper
 */
export interface InsightSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Error response wrapper
 */
export interface InsightErrorResponse {
  success: false;
  error: InsightApiError;
}

/**
 * Response type (success or error)
 */
export type InsightResponse<T> = InsightSuccessResponse<T> | InsightErrorResponse;

/**
 * SDK configuration
 */
export interface InsightCloudConfig {
  /**
   * Cloud backend URL
   * @default 'https://cloud.odavl.studio'
   */
  baseUrl?: string;

  /**
   * JWT access token for authentication
   * (managed externally, passed to SDK)
   */
  accessToken?: string;

  /**
   * Request timeout in milliseconds
   * @default 30000 (30s)
   */
  timeout?: number;
}

/**
 * API request options
 */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
}

/**
 * ODAVL Insight Cloud Client
 * 
 * Usage:
 * ```typescript
 * import { createInsightClient } from '@odavl-studio/sdk/insight-cloud';
 * 
 * const client = createInsightClient({
 *   accessToken: 'your-jwt-token'
 * });
 * 
 * const result = await client.listProjects();
 * if (result.success) {
 *   console.log(result.data.projects);
 * }
 * ```
 */
export class InsightCloudClient {
  private baseUrl: string;
  private accessToken?: string;
  private timeout: number;

  constructor(config: InsightCloudConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://cloud.odavl.studio';
    this.accessToken = config.accessToken;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Update access token (after sign-in or refresh)
   */
  setAccessToken(token: string | undefined): void {
    this.accessToken = token;
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<InsightResponse<T>> {
    try {
      const url = `${this.baseUrl}${path}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            ...data,
            statusCode: response.status,
          } as InsightApiError,
        };
      }

      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            error: 'TimeoutError',
            message: `Request timed out after ${this.timeout}ms`,
            statusCode: 408,
          },
        };
      }

      return {
        success: false,
        error: {
          error: 'NetworkError',
          message: error instanceof Error ? error.message : String(error),
          statusCode: 0,
        },
      };
    }
  }

  // ===== Project Methods =====

  /**
   * List user's projects
   * GET /api/insight/projects
   */
  async listProjects(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<InsightResponse<InsightProjectsList>> {
    const query = new URLSearchParams();
    
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.search) query.set('search', params.search);

    const path = `/api/insight/projects${query.toString() ? `?${query}` : ''}`;
    return this.request<InsightProjectsList>(path);
  }

  /**
   * Get single project by ID
   * GET /api/insight/projects/:id
   */
  async getProject(projectId: string): Promise<InsightResponse<InsightProject>> {
    return this.request<InsightProject>(`/api/insight/projects/${projectId}`);
  }

  /**
   * Create new project
   * POST /api/insight/projects
   */
  async createProject(input: {
    name: string;
    gitUrl?: string;
    gitBranch?: string;
  }): Promise<InsightResponse<InsightProject>> {
    return this.request<InsightProject>('/api/insight/projects', {
      method: 'POST',
      body: input,
    });
  }

  // ===== Analysis Methods =====

  /**
   * Create new analysis job
   * POST /api/insight/analysis
   */
  async startAnalysis(input: {
    projectId: string;
    detectors?: string[];
    language?: string;
    path?: string;
  }): Promise<InsightResponse<InsightAnalysisJob>> {
    return this.request<InsightAnalysisJob>('/api/insight/analysis', {
      method: 'POST',
      body: input,
    });
  }

  /**
   * Get analysis status and results
   * GET /api/insight/analysis/:id
   */
  async getAnalysis(analysisId: string): Promise<InsightResponse<InsightAnalysisResult>> {
    return this.request<InsightAnalysisResult>(`/api/insight/analysis/${analysisId}`);
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
  }): Promise<InsightResponse<InsightAnalysesList>> {
    const query = new URLSearchParams();
    
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.projectId) query.set('projectId', params.projectId);
    if (params?.status) query.set('status', params.status);

    const path = `/api/insight/analyses${query.toString() ? `?${query}` : ''}`;
    return this.request<InsightAnalysesList>(path);
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
  ): Promise<InsightResponse<InsightAnalysisResult>> {
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
        statusCode: 408,
      },
    };
  }

  // ===== Issue Methods =====

  /**
   * List issues for analysis with filters
   * GET /api/insight/analyses/:id/issues
   */
  async listIssues(
    analysisId: string,
    params?: {
      page?: number;
      pageSize?: number;
      severity?: IssueSeverity;
      detector?: string;
      category?: string;
      autoFixable?: boolean;
    }
  ): Promise<InsightResponse<InsightIssuesList>> {
    const query = new URLSearchParams();
    
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.severity) query.set('severity', params.severity);
    if (params?.detector) query.set('detector', params.detector);
    if (params?.category) query.set('category', params.category);
    if (params?.autoFixable !== undefined) query.set('autoFixable', String(params.autoFixable));

    const path = `/api/insight/analyses/${analysisId}/issues${query.toString() ? `?${query}` : ''}`;
    return this.request<InsightIssuesList>(path);
  }

  /**
   * Get single issue by ID
   * GET /api/insight/issues/:id
   */
  async getIssue(issueId: string): Promise<InsightResponse<InsightCloudIssue>> {
    return this.request<InsightCloudIssue>(`/api/insight/issues/${issueId}`);
  }
}

/**
 * Factory function to create Insight Cloud client
 * 
 * @example
 * ```typescript
 * const client = createInsightClient({
 *   accessToken: 'jwt-token'
 * });
 * 
 * const projects = await client.listProjects();
 * ```
 */
export function createInsightClient(config: InsightCloudConfig = {}): InsightCloudClient {
  return new InsightCloudClient(config);
}
