/**
 * ODAVL Autopilot - Phase P6: Enhanced Types with File-Type Metadata
 * 
 * Extends existing Autopilot types to include file-type awareness from Insight.
 * These enhanced types enable risk-based decision making and budgeting.
 */

import type { FileType, FileTypeMetadata } from '@odavl/core/filetypes/file-type-detection';
import type { Metrics } from '../phases/observe';

/**
 * Enhanced issue with file-type metadata from Insight (Phase P5)
 * 
 * Phase P6: Autopilot consumes these fields for:
 * - Blocking critical files (shouldAllowModification)
 * - Risk-weighted budgeting (validateRiskWeightedBudget)
 * - Fix strategy selection (selectFixStrategy)
 */
export interface EnhancedIssue {
  file: string;
  line: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  detector: string;
  category?: string;
  canBeHandedToAutopilot?: boolean;
  confidence?: number;
  suggestion?: string;
  
  // Phase P6: File-type metadata from Insight (Phase P5)
  fileType?: FileType;
  risk?: FileTypeMetadata['risk'];
  usedByProducts?: string[];
}

/**
 * Extended metrics with file-type statistics
 * 
 * Phase P6: Adds risk distribution and file-type breakdown
 * to support risk-weighted budgeting and audit logging.
 */
export interface EnhancedMetrics extends Metrics {
  // Phase P6: File-type statistics
  fileTypeStats?: {
    totalFiles: number;
    byRisk: Record<FileTypeMetadata['risk'], number>;
    byType: Record<FileType, number>;
    blocked: number; // Critical files that cannot be modified
  };
  
  // Phase P6: Risk-weighted impact (for budget enforcement)
  riskWeightedImpact?: number;
  
  // Phase P6: Enhanced details with file-type metadata
  details?: {
    [detector: string]: EnhancedIssue[];
  };
}

/**
 * Recipe with file-type awareness
 * 
 * Phase P6: Recipes can now specify allowed file types and risk limits.
 * This enables safer automation with built-in constraints.
 */
export interface EnhancedRecipe {
  id: string;
  name: string;
  description: string;
  trust?: number;
  priority?: number;
  tags?: string[];
  
  // Phase P6: File-type constraints
  allowedFileTypes?: FileType[];
  blockedFileTypes?: FileType[];
  maxRiskLevel?: FileTypeMetadata['risk']; // 'low' | 'medium' | 'high' (never 'critical')
  
  // Phase P6: Risk budget constraints
  maxWeightedImpact?: number;
  
  // Existing fields
  condition?: {
    type: 'threshold' | 'any' | 'all';
    rules: Array<{
      metric: string;
      operator: '>' | '>=' | '<' | '<=' | '==' | '!=';
      value: number;
    }>;
  };
  actions: Array<{
    type: 'shell' | 'edit' | 'analyze' | 'command' | 'file-edit' | 'delete';
    command?: string;
    files?: string[];
    description?: string;
    changes?: unknown;
  }>;
}

/**
 * Decision result with file-type reasoning
 * 
 * Phase P6: Enhanced decision output that includes file-type metadata
 * for audit logging and compliance tracking.
 */
export interface EnhancedDecision {
  recipeId: string;
  recipeName: string;
  reason: string;
  
  // Phase P6: File-type context
  affectedFiles: Array<{
    filePath: string;
    fileType: FileType;
    risk: FileTypeMetadata['risk'];
    allowed: boolean;
    blockReason?: string;
  }>;
  
  // Phase P6: Risk assessment
  totalWeightedImpact: number;
  budgetAllowed: boolean;
  budgetViolations?: string[];
  
  // Phase P6: Strategy
  fixStrategy: 'safe' | 'rewrite' | 'manual-review-required';
}

/**
 * Execution result with file-type audit trail
 * 
 * Phase P6: Captures complete file-type context for post-execution
 * review and compliance reporting.
 */
export interface EnhancedExecutionResult {
  recipeId: string;
  success: boolean;
  errors?: string[];
  
  // Phase P6: File-type audit
  filesModified: Array<{
    filePath: string;
    fileType: FileType;
    risk: FileTypeMetadata['risk'];
    locChanged: number;
    weight: number;
  }>;
  
  // Phase P6: Budget tracking
  totalWeightedImpact: number;
  budgetRemaining: {
    files: number;
    loc: number;
    recipes: number;
  };
  
  // Phase P6: Audit metadata
  auditLog: string; // JSON export from AutopilotAuditor
}

/**
 * Type guard to check if issue has file-type metadata
 */
export function hasFileTypeMetadata(
  issue: any
): issue is EnhancedIssue & Required<Pick<EnhancedIssue, 'fileType' | 'risk'>> {
  return (
    issue &&
    typeof issue.fileType === 'string' &&
    typeof issue.risk === 'string' &&
    ['critical', 'high', 'medium', 'low'].includes(issue.risk)
  );
}

/**
 * Type guard to check if metrics have file-type statistics
 */
export function hasFileTypeStats(
  metrics: any
): metrics is EnhancedMetrics & Required<Pick<EnhancedMetrics, 'fileTypeStats'>> {
  return (
    metrics &&
    metrics.fileTypeStats &&
    typeof metrics.fileTypeStats.totalFiles === 'number' &&
    typeof metrics.fileTypeStats.byRisk === 'object'
  );
}
