/**
 * ODAVL Insight Core - Shared Types
 */

/**
 * Issue severity levels
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Base Issue interface - all detectors must return this shape
 */
export interface Issue {
  type: string;
  severity: Severity;
  message: string;
  file: string;
  line?: number;
  endLine?: number; // End line for multi-line issues
  column?: number;
  suggestion?: string;
  suggestions?: string[]; // Multiple suggestions
  code?: string;
  ruleId?: string;
  rule?: string; // Rule name/ID
  category?: string; // Issue category
  codeSnippet?: string; // Code context
  details?: string; // Additional details
}

/**
 * Base detector configuration
 */
export interface DetectorConfig {
  enabled?: boolean;
  severity?: Severity;
  exclude?: string[];
  include?: string[];
  [key: string]: unknown;
}

/**
 * Detector result
 */
export interface DetectorResult {
  issues: Issue[];
  duration: number;
  detectorName: string;
}

/**
 * Analysis context
 */
export interface AnalysisContext {
  workspace: string;
  files?: string[];
  config?: DetectorConfig;
}

/**
 * Analysis result - unified output from analysis runs
 */
export interface AnalysisResult {
  issues: Issue[];
  summary: {
    total: number;
    bySeverity: Record<Severity, number>;
    byDetector: Record<string, number>;
  };
  duration?: number;
  timestamp?: string;
  metrics?: {
    filesAnalyzed?: number;
    linesOfCode?: number;
    duration?: number;
  };
}
