/**
 * Core types for Insight CLI
 */

export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type OutputFormat = 'human' | 'json' | 'sarif';

export interface InsightIssue {
  file: string;
  line: number;
  column: number;
  severity: Severity;
  message: string;
  detector: string;
  ruleId?: string;
  suggestedFix?: string;
}

export interface AnalysisResult {
  issues: InsightIssue[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  metadata: {
    analyzedFiles: number;
    duration: number;
    detectors: string[];
  };
}

export interface AnalyzeOptions {
  detectors?: string[];
  changedOnly: boolean;
  ci: boolean;
}

export interface AnalysisEngine {
  analyze(path: string, options: AnalyzeOptions): Promise<AnalysisResult>;
}

export enum ExitCode {
  SUCCESS = 0,
  ISSUES_FOUND = 1,
  INTERNAL_ERROR = 2,
  CONFIG_ERROR = 3,
  RUNTIME_ERROR = 4,
}
