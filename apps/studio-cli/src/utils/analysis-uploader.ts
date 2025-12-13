/**
 * Phase 2.2 Task 5: Analysis Upload to ODAVL Cloud
 * 
 * Direct JSON upload for sanitized analysis results.
 * Handles quota limits, offline mode, and error conditions.
 */

import chalk from 'chalk';
import { getHttpClient, ApiError, NetworkError } from './http-client.js';
import { sanitizeIssue, generatePrivacyReport } from './privacy-sanitizer.js';
import {
  createUploadPayload,
  validateUploadPayload,
  estimatePayloadSize,
  type AnalysisUploadPayload,
} from './cloud-contract.js';
import { generateSarif, estimateSarifSize } from './sarif-generator.js';
import { uploadSarifToCloud } from './sarif-uploader.js';
import { getOfflineQueue } from './offline-queue.js';

/**
 * Issue type (from Insight Core)
 */
export interface Issue {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  detector: string;
  ruleId?: string;
  suggestedFix?: string;
}

/**
 * Upload result types
 */
export type UploadResult =
  | { type: 'SUCCESS'; dashboardUrl: string; quotaRemaining: number; uploadId: string }
  | { type: 'OFFLINE'; reason: string }
  | { type: 'ERROR'; errorCode: string; message: string; upgradeUrl?: string };

/**
 * Upload options
 */
export interface UploadOptions {
  workspaceRoot: string;
  projectName?: string;
  branch?: string;
  commit?: string;
  debug?: boolean;
  skipQueue?: boolean; // Phase 2.2 Task 7: Skip auto-queue (used by sync command)
}

/**
 * API response for successful upload
 */
interface UploadSuccessResponse {
  success: true;
  uploadId: string;
  dashboardUrl: string;
  quotaUsed: number;
  quotaRemaining: number;
  timestamp: string;
}

/**
 * API response for upload errors
 */
interface UploadErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: {
    currentUsage?: number;
    planLimit?: number;
    upgradeUrl?: string;
    currentPlan?: string;
    requiredPlan?: string;
  };
}

/**
 * Constants
 */
const MAX_PAYLOAD_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ISSUES = 10000;
const DIRECT_UPLOAD_THRESHOLD = 5000; // Issues

/**
 * Upload sanitized analysis to ODAVL Cloud
 */
export async function uploadAnalysis(
  issues: Issue[],
  options: UploadOptions
): Promise<UploadResult> {
  const { workspaceRoot, projectName, branch, commit, debug } = options;

  // Step 1: Sanitize all issues
  if (debug) {
    console.log(chalk.gray('\n[Upload] Sanitizing issues...'));
  }

  const sanitizedIssues = issues.map((issue) => sanitizeIssue(issue, workspaceRoot));

  // Generate privacy report
  const privacyReport = generatePrivacyReport(issues, sanitizedIssues);

  if (debug) {
    console.log(chalk.gray(`[Upload] Privacy sanitization complete:`));
    console.log(chalk.gray(`  - Total issues: ${privacyReport.totalIssues}`));
    console.log(chalk.gray(`  - Paths sanitized: ${privacyReport.pathsSanitized}`));
    console.log(chalk.gray(`  - Messages sanitized: ${privacyReport.messagesSanitized}`));
    console.log(chalk.gray(`  - Validation passed: ${privacyReport.validationPassed}/${privacyReport.totalIssues}`));
  }

  // Step 2: Check issue count
  if (sanitizedIssues.length > MAX_ISSUES) {
    return {
      type: 'ERROR',
      errorCode: 'TOO_MANY_ISSUES',
      message: `Analysis contains ${sanitizedIssues.length.toLocaleString()} issues (max: ${MAX_ISSUES.toLocaleString()}). Consider filtering by severity.`,
    };
  }

  // Step 3: Build upload payload
  const detectorSet = new Set(sanitizedIssues.map((i) => i.detector));
  const detectorNames = Array.from(detectorSet);
  const payload = createUploadPayload({
    projectId: projectName || 'workspace',
    issues: sanitizedIssues,
    detectors: detectorNames,
    mode: 'sequential', // Default mode
    performance: {
      totalDuration: 0, // Will be set by caller if available
      filesAnalyzed: 0,
      filesCached: 0,
      detectorsSkipped: [],
    },
  });

  // Step 4: Validate payload
  const validation = validateUploadPayload(payload);
  if (!validation.valid) {
    return {
      type: 'ERROR',
      errorCode: 'VALIDATION_FAILED',
      message: `Payload validation failed: ${validation.errors.join(', ')}`,
    };
  }

  // Step 5: Estimate size
  const sizeBytes = estimatePayloadSize(payload);
  const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);

  if (debug) {
    console.log(chalk.gray(`[Upload] Payload size: ${sizeMB} MB`));
    console.log(chalk.gray(`[Upload] Issue count: ${sanitizedIssues.length.toLocaleString()}`));
  }

  // Step 6: Determine upload strategy (direct JSON vs SARIF S3)
  const useSarifUpload = sizeBytes > MAX_PAYLOAD_SIZE || sanitizedIssues.length > DIRECT_UPLOAD_THRESHOLD;

  if (useSarifUpload) {
    if (debug) {
      console.log(chalk.cyan('[Upload] Using SARIF S3 upload for large analysis'));
      console.log(chalk.gray(`  - Payload size: ${sizeMB} MB (threshold: 5 MB)`));
      console.log(chalk.gray(`  - Issue count: ${sanitizedIssues.length.toLocaleString()} (threshold: ${DIRECT_UPLOAD_THRESHOLD.toLocaleString()})`));
    }

    return await uploadViaSarif(sanitizedIssues, payload, options);
  }

  // Step 7: Direct JSON upload (small analyses)
  if (debug) {
    console.log(chalk.gray('[Upload] Using direct JSON upload'));
  }

  const result = await uploadDirectJson(payload, debug);

  // Phase 2.2 Task 7: Auto-queue on OFFLINE
  if (result.type === 'OFFLINE' && !options.skipQueue) {
    await handleOfflineAutoQueue(payload, result.reason, workspaceRoot, debug);
  }

  return result;
}

/**
 * Upload analysis via direct JSON (small analyses)
 */
async function uploadDirectJson(
  payload: AnalysisUploadPayload,
  debug?: boolean
): Promise<UploadResult> {
  const httpClient = getHttpClient({ debug });

  try {
    if (debug) {
      console.log(chalk.gray('[Upload] Uploading to ODAVL Cloud...'));
    }

    const response = await httpClient.post<UploadSuccessResponse | UploadErrorResponse>(
      '/api/cli/analysis/upload',
      payload,
      { requiresAuth: true, skipRetry: false }
    );

    // Handle error response
    if (!response.success) {
      const errorResponse = response as UploadErrorResponse;
      return handleUploadError(errorResponse);
    }

    // Success
    const successResponse = response as UploadSuccessResponse;

    if (debug) {
      console.log(chalk.gray(`[Upload] Upload successful (ID: ${successResponse.uploadId})`));
    }

    return {
      type: 'SUCCESS',
      dashboardUrl: successResponse.dashboardUrl,
      quotaRemaining: successResponse.quotaRemaining,
      uploadId: successResponse.uploadId,
    };
  } catch (error: any) {
    return handleUploadException(error, debug);
  }
}

/**
 * Upload analysis via SARIF S3 (large analyses)
 */
async function uploadViaSarif(
  sanitizedIssues: Issue[],
  basePayload: AnalysisUploadPayload,
  options: UploadOptions
): Promise<UploadResult> {
  const { debug } = options;
  const httpClient = getHttpClient({ debug });

  try {
    // Step 1: Generate SARIF from sanitized issues
    if (debug) {
      console.log(chalk.gray('[Upload] Generating SARIF report...'));
    }

    const sarif = generateSarif(sanitizedIssues);
    const sarifSizeBytes = estimateSarifSize(sarif);

    if (debug) {
      console.log(chalk.gray(`[Upload] SARIF size: ${(sarifSizeBytes / 1024 / 1024).toFixed(2)} MB`));
    }

    // Step 2: Upload SARIF to S3
    if (debug) {
      console.log(chalk.gray('[Upload] Uploading SARIF to S3...'));
    }

    const analysisId = generateAnalysisId();
    const sarifResult = await uploadSarifToCloud({
      httpClient,
      analysisId,
      sarif,
      estimatedSizeBytes: sarifSizeBytes,
      debug,
    });

    // Handle SARIF upload failure
    if (sarifResult.type === 'OFFLINE') {
      const offlineResult = {
        type: 'OFFLINE' as const,
        reason: sarifResult.message || 'Cannot reach cloud storage',
      };
      
      // Phase 2.2 Task 7: Auto-queue on OFFLINE
      if (!options.skipQueue) {
        await handleOfflineAutoQueue(basePayload, offlineResult.reason, options.workspaceRoot, debug);
      }
      
      return offlineResult;
    }

    if (sarifResult.type === 'ERROR') {
      return {
        type: 'ERROR',
        errorCode: sarifResult.errorCode || 'SARIF_UPLOAD_FAILED',
        message: sarifResult.message || 'Failed to upload SARIF report',
      };
    }

    // Step 3: Send metadata payload with sarifUrl (no issues array)
    if (debug) {
      console.log(chalk.gray('[Upload] SARIF uploaded successfully'));
      console.log(chalk.gray('[Upload] Sending metadata to ODAVL Cloud...'));
    }

    const metadataPayload = {
      ...basePayload,
      issues: undefined, // Remove issues array
      sarifUrl: sarifResult.sarifUrl!, // Add SARIF reference
      analysisId, // Add analysis ID for idempotency
    };

    const response = await httpClient.post<UploadSuccessResponse | UploadErrorResponse>(
      '/api/cli/analysis/upload',
      metadataPayload,
      { requiresAuth: true, skipRetry: false }
    );

    // Handle error response
    if (!response.success) {
      const errorResponse = response as UploadErrorResponse;
      return handleUploadError(errorResponse);
    }

    // Success
    const successResponse = response as UploadSuccessResponse;

    if (debug) {
      console.log(chalk.gray(`[Upload] Upload successful (ID: ${successResponse.uploadId})`));
    }

    return {
      type: 'SUCCESS',
      dashboardUrl: successResponse.dashboardUrl,
      quotaRemaining: successResponse.quotaRemaining,
      uploadId: successResponse.uploadId,
    };
  } catch (error: any) {
    return handleUploadException(error, debug);
  }
}

/**
 * Generate unique analysis ID for idempotency
 */
function generateAnalysisId(): string {
  // Simple UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Handle API error responses
 */
function handleUploadError(response: UploadErrorResponse): UploadResult {
  const { error, message, details } = response;

  // INVALID_TOKEN - user needs to login
  if (error === 'INVALID_TOKEN' || error === 'UNAUTHORIZED') {
    return {
      type: 'ERROR',
      errorCode: 'INVALID_TOKEN',
      message: 'Authentication required. Run: odavl auth login',
    };
  }

  // QUOTA_EXCEEDED - user hit plan limits
  if (error === 'QUOTA_EXCEEDED') {
    return {
      type: 'ERROR',
      errorCode: 'QUOTA_EXCEEDED',
      message: `Monthly quota exceeded. ${details?.currentUsage || 0} / ${details?.planLimit || 0} analyses used.`,
      upgradeUrl: details?.upgradeUrl || 'https://odavl.com/pricing',
    };
  }

  // PLAN_LIMIT - feature not available on current plan
  if (error === 'PLAN_LIMIT' || error === 'INSUFFICIENT_PLAN') {
    const currentPlan = details?.currentPlan || 'FREE';
    const requiredPlan = details?.requiredPlan || 'PRO';
    return {
      type: 'ERROR',
      errorCode: 'PLAN_LIMIT',
      message: `This feature requires ${requiredPlan} plan (current: ${currentPlan})`,
      upgradeUrl: details?.upgradeUrl || 'https://odavl.com/pricing',
    };
  }

  // VALIDATION_ERROR - payload validation failed on server
  if (error === 'VALIDATION_ERROR') {
    return {
      type: 'ERROR',
      errorCode: 'VALIDATION_ERROR',
      message: message || 'Payload validation failed on server',
    };
  }

  // Generic error
  return {
    type: 'ERROR',
    errorCode: error || 'UPLOAD_FAILED',
    message: message || 'Upload failed with unknown error',
  };
}

/**
 * Handle exceptions during upload
 */
function handleUploadException(error: any, debug?: boolean): UploadResult {
  if (debug) {
    console.log(chalk.gray(`[Upload] Exception: ${error.constructor.name}`));
  }

  // Network errors - offline mode
  if (error instanceof NetworkError) {
    return {
      type: 'OFFLINE',
      reason: error.message || 'Cannot reach ODAVL Cloud servers',
    };
  }

  // API errors - specific error codes
  if (error instanceof ApiError) {
    // 401 - Authentication required
    if (error.statusCode === 401) {
      return {
        type: 'ERROR',
        errorCode: 'INVALID_TOKEN',
        message: 'Authentication required. Run: odavl auth login',
      };
    }

    // 403 - Forbidden (plan limits)
    if (error.statusCode === 403) {
      return {
        type: 'ERROR',
        errorCode: 'FORBIDDEN',
        message: error.message || 'Access denied. Check your plan limits.',
      };
    }

    // 413 - Payload too large
    if (error.statusCode === 413) {
      return {
        type: 'ERROR',
        errorCode: 'PAYLOAD_TOO_LARGE',
        message: 'Payload too large. Use SARIF upload for large analyses.',
      };
    }

    // 429 - Rate limited
    if (error.statusCode === 429) {
      return {
        type: 'ERROR',
        errorCode: 'RATE_LIMITED',
        message: 'Rate limit exceeded. Please try again later.',
      };
    }

    // 500+ - Server error
    if (error.statusCode >= 500) {
      return {
        type: 'OFFLINE',
        reason: `Server error (${error.statusCode}). Will retry later.`,
      };
    }

    // Generic API error
    return {
      type: 'ERROR',
      errorCode: error.errorCode || `HTTP_${error.statusCode}`,
      message: error.message || `HTTP ${error.statusCode} error`,
    };
  }

  // Unknown error
  return {
    type: 'ERROR',
    errorCode: 'UNKNOWN_ERROR',
    message: error.message || 'An unexpected error occurred during upload',
  };
}

/**
 * Format upload result for display
 */
export function formatUploadResult(result: UploadResult): string {
  if (result.type === 'SUCCESS') {
    return (
      chalk.green.bold('✓ Analysis uploaded successfully!\n\n') +
      chalk.white('Dashboard: ') +
      chalk.blue.underline(result.dashboardUrl) +
      '\n' +
      chalk.white(`Quota Remaining: ${result.quotaRemaining.toLocaleString()} analyses\n`) +
      chalk.gray(`Upload ID: ${result.uploadId}`)
    );
  }

  if (result.type === 'OFFLINE') {
    return (
      chalk.yellow.bold('⚠️  Cannot reach ODAVL Cloud\n\n') +
      chalk.white(`Reason: ${result.reason}\n`) +
      chalk.gray('Your analysis has been saved locally.\n') +
      chalk.gray('Run "odavl insight sync" when online to upload.')
    );
  }

  if (result.type === 'ERROR') {
    let errorMsg =
      chalk.red.bold('✗ Upload failed\n\n') +
      chalk.white(`Error: ${result.message}\n`) +
      chalk.gray(`Code: ${result.errorCode}`);

    if (result.upgradeUrl) {
      errorMsg += '\n\n' + chalk.cyan('Upgrade: ') + chalk.blue.underline(result.upgradeUrl);
    }

    return errorMsg;
  }

  return chalk.red('Unknown upload result');
}

/**
 * Check if upload is available (user authenticated)
 */
export async function isUploadAvailable(): Promise<boolean> {
  try {
    const { isAuthenticated } = await import('../commands/auth-v2.js');
    return await isAuthenticated();
  } catch {
    return false;
  }
}

/**
 * Handle offline auto-queue
 * 
 * Phase 2.2 Task 7: Automatically queue failed uploads for retry.
 * Only queues for OFFLINE status, not for auth/quota/plan errors.
 * 
 * @param payload Upload payload to queue
 * @param reason Offline reason
 * @param workspaceRoot Workspace root directory
 * @param debug Debug mode
 */
async function handleOfflineAutoQueue(
  payload: AnalysisUploadPayload,
  reason: string,
  workspaceRoot: string,
  debug?: boolean
): Promise<void> {
  try {
    const queue = getOfflineQueue(workspaceRoot);
    const entryId = await queue.enqueue(payload, reason);

    if (debug) {
      console.log(chalk.gray(`[Queue] Analysis queued for retry (ID: ${entryId})`));
      console.log(chalk.gray(`[Queue] Queue location: ${queue.getQueuePath()}`));
    }
  } catch (error: any) {
    // Never crash on queue failure
    if (debug) {
      console.error(chalk.red(`[Queue] Failed to enqueue: ${error.message}`));
    }
  }
}
