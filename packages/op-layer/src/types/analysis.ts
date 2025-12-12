/**
 * ODAVL Protocol Layer - Analysis Types
 * Type definitions for code analysis protocol
 */

export type AnalysisKind = 'quick' | 'full' | 'changed-files-only';

export type DetectorId =
  | 'typescript'
  | 'eslint'
  | 'security'
  | 'performance'
  | 'complexity'
  | 'circular'
  | 'import'
  | 'package'
  | 'runtime'
  | 'build'
  | 'network'
  | 'isolation';

export interface AnalysisRequest {
  workspaceRoot: string;
  files?: string[]; // optional: for incremental analysis
  kind?: AnalysisKind;
  detectors?: DetectorId[];
  enabledOnly?: boolean; // optional: filter to only enabled detectors
  metadata?: Record<string, unknown>;
}

export interface AnalysisIssueLocation {
  file: string;
  startLine: number;
  startColumn?: number;
  endLine?: number;
  endColumn?: number;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface AnalysisIssue {
  id: string;
  detector: DetectorId;
  severity: Severity;
  message: string;
  ruleId?: string;
  location?: AnalysisIssueLocation;
  tags?: string[];
  raw?: unknown;
}

export interface AnalysisMetrics {
  [key: string]: number;
}

export interface DetectorStats {
  issues: number;
  tookMs?: number;
}

export interface AnalysisSummary {
  issues: AnalysisIssue[];
  metrics: AnalysisMetrics;
  tookMs?: number;
  detectorStats?: Record<DetectorId, DetectorStats>;
  raw?: unknown;
}
