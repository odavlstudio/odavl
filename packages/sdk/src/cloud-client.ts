/**
 * ODAVL Cloud Client - Unified HTTP client for Cloud APIs
 * Phase 3C: Auto-detection (local OPLayer → cloud fallback)
 */

// CRITICAL: Types must be inline to avoid static imports of @odavl/oplayer
interface AnalysisRequest {
  workspace: string;
  detectors?: string[];
  language?: string;
  options?: Record<string, any>;
}

interface AnalysisSummary {
  totalIssues: number;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  issues: Array<{
    path: string;
    detector: string;
    severity: string;
    message: string;
    line?: number;
    column?: number;
  }>;
}

interface GuardianAuditRequest {
  url: string;
  suites?: string[];
  options?: Record<string, any>;
}

interface GuardianAuditResult {
  url: string;
  passed: boolean;
  score: number;
  suites: Array<{
    name: string;
    passed: boolean;
    tests: Array<{
      name: string;
      passed: boolean;
      message?: string;
    }>;
  }>;
}

// ============================================================================
// Cloud API Configuration
// ============================================================================

export interface CloudConfig {
  /**
   * Base URLs for cloud services
   * Default: localhost development URLs
   */
  insightUrl?: string;
  guardianUrl?: string;
  autopilotUrl?: string;

  /**
   * API key for authentication (future use)
   */
  apiKey?: string;

  /**
   * Request timeout in milliseconds
   * Default: 60000 (60 seconds)
   */
  timeout?: number;

  /**
   * Enable retry on failure
   * Default: true
   */
  enableRetry?: boolean;

  /**
   * Max retry attempts
   * Default: 3
   */
  maxRetries?: number;
}

const DEFAULT_CONFIG: Required<CloudConfig> = {
  insightUrl: process.env.INSIGHT_CLOUD_URL || 'http://localhost:3001',
  guardianUrl: process.env.GUARDIAN_CLOUD_URL || 'http://localhost:3002',
  autopilotUrl: process.env.AUTOPILOT_CLOUD_URL || 'http://localhost:3003',
  apiKey: process.env.ODAVL_API_KEY || '',
  timeout: 60000,
  enableRetry: true,
  maxRetries: 3,
};

// ============================================================================
// Generic HTTP Client with Retry Logic
// ============================================================================

interface CloudResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    duration: number;
    timestamp: string;
    cached?: boolean;
  };
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  retries: number = DEFAULT_CONFIG.maxRetries
): Promise<CloudResponse<T>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        DEFAULT_CONFIG.timeout
      );

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result: CloudResponse<T> = await response.json();
      return result;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on abort (timeout)
      if (lastError.name === 'AbortError') {
        throw new Error(`Request timeout after ${DEFAULT_CONFIG.timeout}ms`);
      }

      // Don't retry on validation errors (4xx)
      if (lastError.message.includes('400')) {
        throw lastError;
      }

      // Log retry attempt
      if (attempt < retries) {
        console.warn(
          `[ODAVL Cloud Client] Retry ${attempt + 1}/${retries}:`,
          lastError.message
        );
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError || new Error('Request failed after all retries');
}

// ============================================================================
// Cloud Client Class
// ============================================================================

export class CloudClient {
  private config: Required<CloudConfig>;

  constructor(config: CloudConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Call Insight Cloud API - Analysis
   */
  async analyze(
    request: AnalysisRequest
  ): Promise<AnalysisSummary> {
    const url = `${this.config.insightUrl}/api/analyze`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetchWithRetry<AnalysisSummary>(
      url,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      },
      this.config.enableRetry ? this.config.maxRetries : 0
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.message || response.error || 'Analysis failed'
      );
    }

    return response.data;
  }

  /**
   * Call Guardian Cloud API - Audit
   */
  async audit(
    request: GuardianAuditRequest
  ): Promise<GuardianAuditResult> {
    const url = `${this.config.guardianUrl}/api/audit`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetchWithRetry<GuardianAuditResult>(
      url,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      },
      this.config.enableRetry ? this.config.maxRetries : 0
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || response.error || 'Audit failed');
    }

    return response.data;
  }

  /**
   * Call Autopilot Cloud API - Fix
   */
  async fix(request: {
    workspaceRoot: string;
    mode?: 'observe' | 'decide' | 'act' | 'verify' | 'learn' | 'loop';
    maxFiles?: number;
    maxLOC?: number;
    recipe?: string;
  }): Promise<Record<string, unknown>> {
    const url = `${this.config.autopilotUrl}/api/fix`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetchWithRetry<Record<string, unknown>>(
      url,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      },
      this.config.enableRetry ? this.config.maxRetries : 0
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || response.error || 'Fix failed');
    }

    return response.data;
  }

  /**
   * Health check for Insight Cloud
   */
  async checkInsightHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.insightUrl}/api/analyze`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Health check for Guardian Cloud
   */
  async checkGuardianHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.guardianUrl}/api/audit`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Health check for Autopilot Cloud
   */
  async checkAutopilotHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.autopilotUrl}/api/fix`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CloudConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalClient: CloudClient | null = null;

/**
 * Get global CloudClient instance
 */
export function getCloudClient(config?: CloudConfig): CloudClient {
  if (!globalClient) {
    globalClient = new CloudClient(config);
  } else if (config) {
    globalClient.updateConfig(config);
  }
  return globalClient;
}
