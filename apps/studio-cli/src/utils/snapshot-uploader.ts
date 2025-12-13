/**
 * TASK 7: Hardened Snapshot Uploader (ZCC-Compliant)
 * 
 * Truth Pipeline: Local Insight → Cloud Backend
 * 
 * Features:
 * - ZCC compliance (metadata only, NO source code)
 * - Retry logic with exponential backoff
 * - Robust error handling (auth, network, validation)
 * - Idempotency via snapshot versioning
 * - Optional, silent by default
 * - Clear, non-noisy failure reporting
 * 
 * @see odavl-studio/insight/cloud/app/api/insight/snapshot/route.ts
 */

import chalk from 'chalk';
import * as crypto from 'crypto';

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
}

/**
 * ZCC-Compliant Snapshot Payload
 */
export interface SnapshotPayload {
  snapshotVersion: string;
  snapshotId?: string;
  projectName: string;
  repoUrl?: string;
  totalFiles: number;
  filesAnalyzed: number;
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  riskScore: number;
  detectorsUsed: string[];
  analysisTimeMs: number;
  environment: {
    os: string;
    nodeVersion: string;
    cliVersion: string;
  };
}

/**
 * Upload Result
 */
export type SnapshotUploadResult =
  | { status: 'success'; snapshotId: string; projectId: string; message: string }
  | { status: 'offline'; reason: string }
  | { status: 'error'; code: string; message: string; canRetry: boolean };

/**
 * Upload Options
 */
export interface SnapshotUploadOptions {
  workspaceRoot: string;
  projectName?: string;
  repoUrl?: string;
  analysisTimeMs?: number;
  cliVersion?: string;
  debug?: boolean;
  silent?: boolean;
  cloudUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

const DEFAULT_CLOUD_URL = 'https://your-app.vercel.app';
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000;
const RETRY_MAX_DELAY = 10000;
const SNAPSHOT_VERSION = '1.0.0';

function calculateRiskScore(issues: Issue[]): number {
  if (issues.length === 0) return 0;
  const weights = { critical: 10, high: 5, medium: 2, low: 1, info: 0.5 };
  let totalWeight = 0;
  for (const issue of issues) {
    totalWeight += weights[issue.severity] || 0;
  }
  const rawScore = Math.log10(totalWeight + 1) * 20;
  return Math.min(100, Math.round(rawScore));
}

function generateIssueFingerprint(issues: Issue[]): string {
  const counts = {
    critical: issues.filter((i) => i.severity === 'critical').length,
    high: issues.filter((i) => i.severity === 'high').length,
    medium: issues.filter((i) => i.severity === 'medium').length,
    low: issues.filter((i) => i.severity === 'low').length,
    info: issues.filter((i) => i.severity === 'info').length,
  };
  const detectors = Array.from(new Set(issues.map((i) => i.detector))).sort();
  const fingerprintInput = JSON.stringify({ counts, detectors });
  return crypto.createHash('sha256').update(fingerprintInput).digest('hex').substring(0, 16);
}

function generateSnapshotId(
  projectName: string,
  repoUrl: string | undefined,
  timestamp: Date,
  issueFingerprint: string
): string {
  const roundedTimestamp = new Date(timestamp);
  roundedTimestamp.setSeconds(0, 0);
  const idInput = [
    projectName,
    repoUrl || '',
    roundedTimestamp.toISOString(),
    issueFingerprint,
  ].join('|');
  const hash = crypto.createHash('sha256').update(idInput).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-5${hash.substring(13, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

export function createSnapshotPayload(
  issues: Issue[],
  options: SnapshotUploadOptions
): SnapshotPayload {
  const counts = {
    critical: issues.filter((i) => i.severity === 'critical').length,
    high: issues.filter((i) => i.severity === 'high').length,
    medium: issues.filter((i) => i.severity === 'medium').length,
    low: issues.filter((i) => i.severity === 'low').length,
    info: issues.filter((i) => i.severity === 'info').length,
  };
  const uniqueFiles = new Set(issues.map((i) => i.file));
  const filesAnalyzed = uniqueFiles.size;
  const uniqueDetectors = Array.from(new Set(issues.map((i) => i.detector))).sort();
  const riskScore = calculateRiskScore(issues);
  const environment = {
    os: process.platform,
    nodeVersion: process.version,
    cliVersion: options.cliVersion || '2.0.0',
  };
  const timestamp = new Date();
  const issueFingerprint = generateIssueFingerprint(issues);
  const snapshotId = generateSnapshotId(
    options.projectName || 'workspace',
    options.repoUrl,
    timestamp,
    issueFingerprint
  );
  return {
    snapshotVersion: SNAPSHOT_VERSION,
    snapshotId,
    projectName: options.projectName || 'workspace',
    repoUrl: options.repoUrl,
    totalFiles: filesAnalyzed,
    filesAnalyzed,
    totalIssues: issues.length,
    criticalCount: counts.critical,
    highCount: counts.high,
    mediumCount: counts.medium,
    lowCount: counts.low,
    infoCount: counts.info,
    riskScore,
    detectorsUsed: uniqueDetectors,
    analysisTimeMs: options.analysisTimeMs || 0,
    environment,
  };
}

function validateSnapshot(payload: SnapshotPayload): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!payload.projectName || payload.projectName.length === 0) {
    errors.push('projectName is required');
  }
  if (payload.projectName.length > 255) {
    errors.push('projectName too long (max 255 chars)');
  }
  const countFields = ['totalFiles', 'filesAnalyzed', 'totalIssues', 'criticalCount', 'highCount', 'mediumCount', 'lowCount', 'infoCount'];
  for (const field of countFields) {
    const value = payload[field as keyof SnapshotPayload];
    if (typeof value === 'number' && value < 0) {
      errors.push(`${field} cannot be negative`);
    }
  }
  if (payload.riskScore < 0 || payload.riskScore > 100) {
    errors.push('riskScore must be between 0 and 100');
  }
  if (!Array.isArray(payload.detectorsUsed) || payload.detectorsUsed.length === 0) {
    errors.push('detectorsUsed must be a non-empty array');
  }
  if (payload.analysisTimeMs < 0) {
    errors.push('analysisTimeMs cannot be negative');
  }
  if (!payload.environment?.os || !payload.environment?.nodeVersion || !payload.environment?.cliVersion) {
    errors.push('environment metadata is incomplete');
  }
  return { valid: errors.length === 0, errors };
}

function getRetryDelay(attempt: number): number {
  const delay = RETRY_BASE_DELAY * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(delay + jitter, RETRY_MAX_DELAY);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get authentication cookie for cloud uploads
 * Retrieves stored session token from SecureStorage
 */
async function getAuthCookie(): Promise<string | null> {
  try {
    const { SecureStorage } = await import('./secure-storage.js');
    const storage = new SecureStorage();
    const token = await storage.loadToken();
    
    if (!token) {
      return null;
    }
    
    // Check if token is expired
    const expiresAt = new Date(token.expiresAt);
    const now = new Date();
    
    if (expiresAt <= now) {
      // Token expired
      return null;
    }
    
    // Return session token (NextAuth format)
    return token.token;
  } catch (error) {
    // Storage unavailable or error reading token
    return null;
  }
}

export async function uploadSnapshot(
  issues: Issue[],
  options: SnapshotUploadOptions
): Promise<SnapshotUploadResult> {
  const {
    debug = false,
    silent = true,
    cloudUrl = DEFAULT_CLOUD_URL,
    timeout = DEFAULT_TIMEOUT,
    maxRetries = DEFAULT_MAX_RETRIES,
  } = options;
  const payload = createSnapshotPayload(issues, options);
  if (debug) {
    console.log(chalk.gray('[Snapshot] Created ZCC-compliant payload'));
    console.log(chalk.gray(`  - Project: ${payload.projectName}`));
    console.log(chalk.gray(`  - Issues: ${payload.totalIssues}`));
    console.log(chalk.gray(`  - Risk Score: ${payload.riskScore}`));
    console.log(chalk.gray(`  - Detectors: ${payload.detectorsUsed.join(', ')}`));
  }
  const validation = validateSnapshot(payload);
  if (!validation.valid) {
    return {
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: `Invalid snapshot: ${validation.errors.join(', ')}`,
      canRetry: false,
    };
  }
  const authCookie = await getAuthCookie();
  if (!authCookie) {
    if (debug) {
      console.log(chalk.gray('[Snapshot] No auth cookie found (user not signed in)'));
    }
    return {
      status: 'error',
      code: 'NO_AUTH',
      message: 'Not signed in. Cloud upload disabled.',
      canRetry: false,
    };
  }
  let lastError: any = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (debug && attempt > 0) {
        console.log(chalk.gray(`[Snapshot] Retry attempt ${attempt}/${maxRetries}`));
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(`${cloudUrl}/api/insight/snapshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `next-auth.session-token=${authCookie}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (response.ok && data.success) {
        if (!silent) {
          console.log(chalk.green('✓ Snapshot uploaded to cloud'));
        }
        if (debug) {
          console.log(chalk.gray(`[Snapshot] Upload successful (ID: ${data.snapshotId})`));
        }
        return {
          status: 'success',
          snapshotId: data.snapshotId,
          projectId: data.projectId,
          message: data.message,
        };
      }
      if (response.status === 401) {
        return {
          status: 'error',
          code: 'AUTH_EXPIRED',
          message: 'Session expired. Please sign in again.',
          canRetry: false,
        };
      }
      if (response.status === 400) {
        const violations = data.violations?.join(', ') || '';
        return {
          status: 'error',
          code: 'ZCC_VIOLATION',
          message: `ZCC Violation: ${data.message || violations}`,
          canRetry: false,
        };
      }
      if (response.status >= 500) {
        lastError = new Error(`Server error: ${response.status}`);
        if (attempt < maxRetries) {
          const delay = getRetryDelay(attempt);
          if (debug) {
            console.log(chalk.gray(`[Snapshot] Server error, retrying in ${delay}ms...`));
          }
          await sleep(delay);
          continue;
        }
      }
      return {
        status: 'error',
        code: data.error || 'UNKNOWN_ERROR',
        message: data.message || `HTTP ${response.status} error`,
        canRetry: false,
      };
    } catch (error: any) {
      lastError = error;
      if (error.name === 'AbortError' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        if (attempt < maxRetries) {
          const delay = getRetryDelay(attempt);
          if (debug) {
            console.log(chalk.gray(`[Snapshot] Network error, retrying in ${delay}ms...`));
          }
          await sleep(delay);
          continue;
        }
        return {
          status: 'offline',
          reason: 'Cannot reach cloud server (check network connection)',
        };
      }
      return {
        status: 'error',
        code: 'UPLOAD_FAILED',
        message: error.message || 'Failed to upload snapshot',
        canRetry: false,
      };
    }
  }
  return {
    status: 'offline',
    reason: lastError?.message || 'Upload failed after retries',
  };
}

export function formatSnapshotResult(result: SnapshotUploadResult, silent: boolean = true): string | null {
  if (result.status === 'success') {
    return null;
  }
  if (result.status === 'offline') {
    if (silent) return null;
    return chalk.yellow(`⚠️  Cloud offline: ${result.reason}`);
  }
  if (result.status === 'error') {
    if (silent) return null;
    let msg = chalk.red(`✗ Cloud upload failed: ${result.message}`);
    if (result.code === 'NO_AUTH' || result.code === 'AUTH_EXPIRED') {
      msg += '\n' + chalk.gray('Tip: Sign in via browser at https://cloud.odavl.studio');
    }
    if (result.code === 'ZCC_VIOLATION') {
      msg += '\n' + chalk.gray('This is a bug - please report to ODAVL team');
    }
    return msg;
  }
  return null;
}

export async function isCloudAvailable(): Promise<boolean> {
  const authCookie = await getAuthCookie();
  return authCookie !== null;
}
