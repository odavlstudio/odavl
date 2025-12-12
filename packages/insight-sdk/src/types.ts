/**
 * ODAVL Insight SDK - Type Definitions
 * Wave 5 - Unified schema from Wave 4 production hardening
 */

export interface InsightIssue {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  detector: string;
  ruleId?: string;
  suggestedFix?: string;
}

export interface InsightAnalysisResult {
  issues: InsightIssue[];
  summary: {
    filesAnalyzed: number;
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    elapsedMs: number;
  };
}

export interface AnalysisOptions {
  detectors?: string[];
  severityMinimum?: 'info' | 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
}
