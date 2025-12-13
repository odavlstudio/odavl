/**
 * ODAVL Insight - Baseline Types and Schema
 * 
 * Defines baseline storage format and validation logic.
 */

import type { InsightIssue } from '../types.js';

export const BASELINE_SCHEMA_VERSION = '1.0.0';

/**
 * Baseline metadata
 */
export interface BaselineMetadata {
  createdAt: string; // ISO 8601 timestamp
  createdBy: string; // CLI version
  projectName?: string;
  gitCommit?: string;
  gitBranch?: string;
  totalFiles: number;
  totalIssues: number;
  autoCreated?: boolean; // True if auto-created on first use
}

/**
 * Baseline configuration snapshot
 */
export interface BaselineConfig {
  detectors: string[];
  ignorePatterns?: string[];
}

/**
 * Baseline issue with fingerprint
 */
export interface BaselineIssue extends InsightIssue {
  fingerprint: string;
  codeContext?: {
    snippet: string;
    hash: string;
  };
  firstSeen: string; // ISO 8601 timestamp
}

/**
 * Complete baseline structure
 */
export interface Baseline {
  version: string;
  metadata: BaselineMetadata;
  config: BaselineConfig;
  issues: BaselineIssue[];
}

/**
 * Validates baseline schema
 */
export function validateBaseline(data: unknown): data is Baseline {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const baseline = data as Record<string, unknown>;

  // Check version
  if (typeof baseline.version !== 'string') {
    return false;
  }

  // Check metadata
  if (!baseline.metadata || typeof baseline.metadata !== 'object') {
    return false;
  }
  const meta = baseline.metadata as Record<string, unknown>;
  if (
    typeof meta.createdAt !== 'string' ||
    typeof meta.createdBy !== 'string' ||
    typeof meta.totalFiles !== 'number' ||
    typeof meta.totalIssues !== 'number'
  ) {
    return false;
  }

  // Check config
  if (!baseline.config || typeof baseline.config !== 'object') {
    return false;
  }
  const config = baseline.config as Record<string, unknown>;
  if (!Array.isArray(config.detectors)) {
    return false;
  }

  // Check issues array
  if (!Array.isArray(baseline.issues)) {
    return false;
  }

  // Validate each issue has required fields
  for (const issue of baseline.issues) {
    if (
      !issue ||
      typeof issue !== 'object' ||
      typeof (issue as Record<string, unknown>).fingerprint !== 'string' ||
      typeof (issue as Record<string, unknown>).file !== 'string' ||
      typeof (issue as Record<string, unknown>).line !== 'number' ||
      typeof (issue as Record<string, unknown>).severity !== 'string' ||
      typeof (issue as Record<string, unknown>).message !== 'string' ||
      typeof (issue as Record<string, unknown>).detector !== 'string' ||
      typeof (issue as Record<string, unknown>).firstSeen !== 'string'
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Error class for baseline-related errors
 */
export class BaselineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BaselineError';
  }
}

export class BaselineValidationError extends BaselineError {
  constructor(message: string) {
    super(message);
    this.name = 'BaselineValidationError';
  }
}

export class BaselineNotFoundError extends BaselineError {
  constructor(name: string) {
    super(`Baseline '${name}' not found`);
    this.name = 'BaselineNotFoundError';
  }
}
