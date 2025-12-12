/**
 * ODAVL Autopilot Core - Type Definitions
 * Wave 6 - Deterministic fix engine types
 */

export interface FixPatch {
  file: string;
  start: number;
  end: number;
  replacement: string;
  detector: string;
  ruleId?: string;
  confidence: number; // 0-1
  originalText?: string;
}

export interface AutopilotSummary {
  totalFixes: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  filesModified: number;
  backupPath: string;
}

export interface FixRule {
  name: string;
  detector: string;
  ruleIds: string[];
  confidence: number;
  transform: (issue: any, fileContent: string) => FixPatch | null;
}

export interface BackupMetadata {
  timestamp: string;
  files: string[];
  totalFixes: number;
  insightVersion: string;
  autopilotVersion: string;
}
