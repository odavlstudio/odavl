/**
 * ODAVL Brain v1 - Type Definitions
 * Phase P1: Manifest integration (read-only)
 * Unified types for Insight → Autopilot → Guardian pipeline
 */

// Phase P1: Manifest integration
import type { ODAVLManifest } from '@odavl/core/manifest';

/**
 * Insight Issue - A problem detected by ODAVL Insight
 */
export interface InsightIssue {
  file: string;
  line: number;
  column?: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  detector: string;
  message: string;
  code?: string;
  fix?: string;
}

/**
 * Insight Analysis Result
 */
export interface InsightResult {
  timestamp: string;
  projectRoot: string;
  totalIssues: number;
  issues: InsightIssue[];
  detectors: string[];
  duration: number;
}

/**
 * Autopilot Fix - A change applied by ODAVL Autopilot
 */
export interface AutopilotFix {
  file: string;
  linesChanged: number;
  type: string;
  description: string;
  attestationHash?: string;
}

/**
 * Autopilot Execution Result
 */
export interface AutopilotResult {
  timestamp: string;
  projectRoot: string;
  totalFixes: number;
  fixes: AutopilotFix[];
  changedFiles: string[];
  diffSummary: string;
  attestationHash: string;
  duration: number;
  errors: string[];
}

/**
 * Guardian Test Result
 */
export interface GuardianTestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  message?: string;
  duration?: number;
}

/**
 * Guardian Report
 */
export interface GuardianReport {
  timestamp: string;
  projectRoot: string;
  tests: GuardianTestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  launchReady: boolean;
  duration: number;
  recommendations: string[];
}

/**
 * Brain Pipeline Report - Unified output
 */
export interface BrainPipelineReport {
  timestamp: string;
  projectRoot: string;
  insight: InsightResult;
  autopilot: AutopilotResult;
  guardian: GuardianReport;
  launchScore: number;
  readyForRelease: boolean;
  recommendations: string[];
  totalDuration: number;
}

/**
 * Phase P1: Brain manifest configuration helper
 * TODO P2: Use these settings to control pipeline behavior
 */
export interface BrainManifestConfig {
  learningMode: 'disabled' | 'observe' | 'adaptive' | 'aggressive';
  memoryShortTermLimit: number;
  memoryLongTermLimit: number;
  confidenceThresholds: {
    insight: number;
    autopilot: number;
    guardian: number;
  };
  decisionPolicy: {
    allowDeployIf?: string[];
    autoApproveRecipesIf?: string[];
  };
}

/**
 * Brain Configuration
 */
export interface BrainConfig {
  projectRoot: string;
  skipAutopilot?: boolean;
  skipGuardian?: boolean;
  maxFixes?: number;
  detectors?: string[];
  verbose?: boolean;
}
