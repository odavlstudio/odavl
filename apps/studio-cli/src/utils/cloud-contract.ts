/**
 * Phase 2.1: Cloud Upload Contract (Design Only - NO IMPLEMENTATION)
 * 
 * This file defines the data structures for cloud uploads.
 * NO network calls are made in Phase 2.1.
 */

import { z } from 'zod';
import type { SanitizedIssue } from '../utils/privacy-sanitizer.js';

/**
 * API Version for upload contract
 * Allows future breaking changes without disrupting existing clients
 */
export const CLOUD_API_VERSION = 'v1';

/**
 * Analysis upload payload schema (Zod validation)
 * 
 * This schema enforces:
 * - Required fields for cloud ingestion
 * - Data types and formats
 * - Size limits for performance
 */
export const AnalysisUploadPayloadSchema = z.object({
  // Metadata
  version: z.literal('v1').describe('API version for backward compatibility'),
  analysisId: z.string().uuid().describe('Client-generated UUID for idempotency'),
  projectId: z.string().min(1).describe('Cloud project identifier'),
  timestamp: z.string().datetime().describe('ISO 8601 timestamp'),
  cliVersion: z.string().describe('CLI version (e.g., "2.0.0")'),
  
  // Configuration
  detectors: z.array(z.string()).min(1).max(50).describe('Detectors executed'),
  mode: z.enum(['sequential', 'parallel', 'file-parallel']).describe('Execution mode'),
  
  // Results (sanitized only)
  issues: z.array(z.object({
    file: z.string().describe('MUST be relative path (validated)'),
    line: z.number().int().min(0),
    column: z.number().int().min(0),
    message: z.string().min(1).max(500).describe('Sanitized message'),
    severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
    detector: z.string(),
    ruleId: z.string().optional(),
  })).max(10000).describe('Max 10,000 issues per upload'),
  
  // Performance metrics
  performance: z.object({
    totalDuration: z.number().describe('Total analysis time (ms)'),
    filesAnalyzed: z.number().int().min(0),
    filesCached: z.number().int().min(0),
    detectorsSkipped: z.array(z.string()),
  }),
  
  // SARIF attachment (optional, for large reports)
  sarifUrl: z.string().url().optional().describe('Pre-signed S3 URL for SARIF file'),
});

/**
 * TypeScript type for upload payload
 * Inferred from Zod schema for type safety
 */
export type AnalysisUploadPayload = z.infer<typeof AnalysisUploadPayloadSchema>;

/**
 * Upload response schema (what cloud API returns)
 */
export const UploadResponseSchema = z.discriminatedUnion('success', [
  // Success response
  z.object({
    success: z.literal(true),
    analysisId: z.string().uuid(),
    dashboardUrl: z.string().url().describe('Link to view results in dashboard'),
    quotaRemaining: z.number().int().min(0).describe('Uploads remaining in plan'),
  }),
  
  // Error response
  z.object({
    success: z.literal(false),
    error: z.enum([
      'QUOTA_EXCEEDED',
      'INVALID_TOKEN',
      'PLAN_LIMIT',
      'PAYLOAD_TOO_LARGE',
      'VALIDATION_ERROR',
      'INTERNAL_ERROR',
    ]),
    message: z.string(),
    upgradeUrl: z.string().url().optional().describe('Link to upgrade plan'),
  }),
]);

export type UploadResponse = z.infer<typeof UploadResponseSchema>;

/**
 * Create upload payload from analysis results
 * 
 * NOTE: This is a helper function for Phase 2.2 (when upload is implemented).
 * Phase 2.1 only defines the contract.
 * 
 * @param options - Payload creation options
 * @returns Validated upload payload
 */
export function createUploadPayload(options: {
  projectId: string;
  issues: SanitizedIssue[];
  detectors: string[];
  mode: 'sequential' | 'parallel' | 'file-parallel';
  performance: {
    totalDuration: number;
    filesAnalyzed: number;
    filesCached: number;
    detectorsSkipped: string[];
  };
  sarifUrl?: string;
}): AnalysisUploadPayload {
  const payload: AnalysisUploadPayload = {
    version: 'v1',
    analysisId: crypto.randomUUID(), // Client-generated for idempotency
    projectId: options.projectId,
    timestamp: new Date().toISOString(),
    cliVersion: '2.0.0', // TODO: Read from package.json in Phase 2.2
    detectors: options.detectors,
    mode: options.mode,
    issues: options.issues,
    performance: options.performance,
    sarifUrl: options.sarifUrl,
  };
  
  // Validate against schema (throws if invalid)
  AnalysisUploadPayloadSchema.parse(payload);
  
  return payload;
}

/**
 * Validate upload payload before transmission
 * 
 * Security checks:
 * - No absolute paths in issues
 * - Payload size within limits
 * - All required fields present
 * 
 * @param payload - Payload to validate
 * @returns Validation result
 */
export function validateUploadPayload(payload: AnalysisUploadPayload): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check 1: Validate against Zod schema
  const result = AnalysisUploadPayloadSchema.safeParse(payload);
  if (!result.success) {
    errors.push(...result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
  }
  
  // Check 2: Ensure no absolute paths in issues
  for (const issue of payload.issues) {
    if (issue.file.startsWith('/') || /^[A-Z]:\\/i.test(issue.file)) {
      errors.push(`Absolute path detected: ${issue.file}`);
    }
  }
  
  // Check 3: Payload size limit (5MB JSON)
  const payloadJson = JSON.stringify(payload);
  const sizeBytes = new Blob([payloadJson]).size;
  const sizeMB = sizeBytes / (1024 * 1024);
  if (sizeMB > 5) {
    errors.push(`Payload too large: ${sizeMB.toFixed(2)}MB (max 5MB)`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Size estimation for payload (before creating it)
 * Helps decide whether to use SARIF S3 upload
 * 
 * @param issueCount - Number of issues
 * @returns Estimated size in MB
 */
export function estimatePayloadSize(issueCount: number): number {
  // Average issue size: ~200 bytes (file path + message + metadata)
  const avgIssueBytes = 200;
  const overheadBytes = 1024; // Metadata + performance data
  
  const totalBytes = (issueCount * avgIssueBytes) + overheadBytes;
  const totalMB = totalBytes / (1024 * 1024);
  
  return totalMB;
}

/**
 * Determine upload strategy based on issue count
 * 
 * @param issueCount - Number of issues
 * @returns Upload strategy
 */
export function determineUploadStrategy(issueCount: number): {
  strategy: 'direct' | 'sarif-s3';
  reason: string;
} {
  const estimatedSize = estimatePayloadSize(issueCount);
  
  if (estimatedSize > 1) {
    return {
      strategy: 'sarif-s3',
      reason: `Payload too large (${estimatedSize.toFixed(2)}MB), use SARIF S3 upload`,
    };
  }
  
  if (issueCount > 5000) {
    return {
      strategy: 'sarif-s3',
      reason: 'Issue count too high, use SARIF S3 upload',
    };
  }
  
  return {
    strategy: 'direct',
    reason: 'Payload within limits, use direct upload',
  };
}
