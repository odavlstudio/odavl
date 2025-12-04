/**
 * Type definitions for ODAVL Cloud Client
 */

import { z } from 'zod';

// ============================================
// Configuration
// ============================================

export interface CloudClientConfig {
  /** Base URL for ODAVL Cloud API (default: https://api.odavl.io) */
  baseUrl?: string;
  
  /** API Key for authentication */
  apiKey?: string;
  
  /** Enable offline queue (default: true) */
  offlineQueue?: boolean;
  
  /** Retry configuration */
  retry?: {
    retries?: number;
    retryDelay?: number;
    retryCondition?: (error: any) => boolean;
  };
  
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

// ============================================
// Authentication
// ============================================

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
}

export interface DeviceAuthResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

// ============================================
// Insight API
// ============================================

export interface InsightRunPayload {
  workspacePath: string;
  workspaceName?: string;
  timestamp: string;
  issues: any[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  detectors: string[];
}

export interface InsightIssue {
  detector: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  filePath: string;
  line?: number;
  column?: number;
  code?: string;
  fix?: string;
}

// ============================================
// Autopilot API
// ============================================

export interface AutopilotRunPayload {
  runId: string;
  workspacePath: string;
  workspaceName?: string;
  timestamp: string;
  phases: string[];
  ledger?: any;
  status: string;
}

// ============================================
// Guardian API
// ============================================

export interface GuardianTestPayload {
  productPath: string;
  productName?: string;
  productType: string;
  timestamp: string;
  readinessScore: number;
  status: string;
  issues: any[];
  autoFixable: number;
}

// ============================================
// Usage Tracking
// ============================================

export interface UsageCheckResponse {
  period: string;
  scope: string;
  startDate: string;
  endDate: string;
  usage: {
    total: number;
    byProduct: {
      insight?: number;
      autopilot?: number;
      guardian?: number;
    };
    byUser?: any;
  };
  limits: {
    total: number;
    insight: number;
    autopilot: number;
    guardian: number;
  };
  remaining: {
    total: number;
    insight: number;
    autopilot: number;
    guardian: number;
  };
  percentage: {
    total: number;
    insight: number;
    autopilot: number;
    guardian: number;
  };
}

export interface UsageIncrementPayload {
  product: string;
  action: string;
  endpoint: string;
  ipAddress?: string;
  apiKeyId?: string;
  billable?: boolean;
  credits?: number;
}

// ============================================
// File Upload
// ============================================

export interface FileUploadOptions {
  filePath: string;
  contentType?: string;
  metadata?: Record<string, any>;
  compress?: boolean;
}

export interface FileUploadResponse {
  url: string;
  key: string;
  bucket: string;
  size: number;
  contentType: string;
}

// ============================================
// Cloud Runner
// ============================================

export interface JobCreatePayload {
  type: 'insight' | 'autopilot' | 'guardian';
  projectId: string;
  config: Record<string, any>;
  repoUrl?: string;
  branch?: string;
  commit?: string;
}

export interface JobStatusResponse {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: any;
}

// ============================================
// API Response
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
  };
}

// ============================================
// Zod Schemas (Runtime validation)
// ============================================

export const InsightRunSchema = z.object({
  projectId: z.string(),
  detectors: z.array(z.string()),
  results: z.object({
    totalIssues: z.number(),
    criticalCount: z.number(),
    highCount: z.number(),
    mediumCount: z.number(),
    lowCount: z.number(),
    linesOfCode: z.number().optional(),
    filesScanned: z.number(),
    duration: z.number(),
  }),
  issues: z.array(z.any()),
});

export const AutopilotRunSchema = z.object({
  projectId: z.string(),
  phase: z.enum(['observe', 'decide', 'act', 'verify', 'learn']),
  status: z.enum(['success', 'failure', 'partial']),
  filesModified: z.number(),
  linesChanged: z.number(),
  recipesUsed: z.array(z.string()),
  ledger: z.record(z.any()),
  snapshotUrl: z.string().optional(),
});

export const GuardianTestSchema = z.object({
  projectId: z.string(),
  testType: z.enum(['accessibility', 'performance', 'security', 'all']),
  targetUrl: z.string().optional(),
  score: z.number().optional(),
  issues: z.record(z.any()),
  screenshotUrls: z.array(z.string()),
  metrics: z.object({
    lcp: z.number().optional(),
    fid: z.number().optional(),
    cls: z.number().optional(),
    ttfb: z.number().optional(),
  }).optional(),
});
