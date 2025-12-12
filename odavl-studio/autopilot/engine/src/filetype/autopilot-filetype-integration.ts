/**
 * ODAVL Autopilot - Phase P6: File-Type Integration
 * 
 * Makes Autopilot file-type aware with:
 * - Risk-based blocking (critical files NEVER modified)
 * - Risk-weighted budgeting (high=3x, medium=2x, low=1x)
 * - Safe fix strategies based on file type
 * - Full audit logging with JSON export
 * 
 * Integration Points:
 * - decide.ts: Use shouldAllowModification() before selecting recipes
 * - act.ts: Use validateRiskWeightedBudget() before executing actions
 * - observe.ts: Enhance Metrics with file-type metadata from Insight
 */

import { 
  detectFileType, 
  getFileTypeMetadata,
  type FileType,
  type FileTypeMetadata 
} from '@odavl/core/filetypes/file-type-detection';

/**
 * File types that Autopilot should NEVER modify (critical risk)
 * See universal-types.ts for full metadata
 */
export const BLOCKED_FILE_TYPES: FileType[] = [
  'env',              // Environment variables (.env, .env.local, etc.)
  'secretCandidates', // Potential secrets (*.pem, *.key, *.p12, etc.)
  'migrations',       // Database migrations (migrations/*, schema.rb, etc.)
  'infrastructure',   // IaC files (*.tf, *.bicep, kubernetes/*, etc.)
];

/**
 * Risk weight multipliers for budget calculations
 * - critical: Infinity (blocked, see BLOCKED_FILE_TYPES)
 * - high: 3x (3 files = 9 budget points)
 * - medium: 2x (2 files = 4 budget points)
 * - low: 1x (1 file = 1 budget point)
 */
export const RISK_WEIGHTS: Record<FileTypeMetadata['risk'], number> = {
  critical: Infinity, // Blocked
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Fix strategies based on file type risk level
 * - critical: manual-review-required (should never reach Autopilot)
 * - high: safe (conservative fixes only)
 * - medium: safe (standard fixes)
 * - low: rewrite (aggressive refactoring allowed)
 */
export type FixStrategy = 'safe' | 'rewrite' | 'manual-review-required';

/**
 * Result of file modification permission check
 */
export interface ModificationPermission {
  /** Whether modification is allowed */
  allowed: boolean;
  /** File type of the target file */
  fileType: FileType;
  /** Risk level of the file type */
  risk: FileTypeMetadata['risk'];
  /** Products that use this file type */
  usedByProducts: string[];
  /** Reason for blocking (if blocked) */
  blockReason?: string;
  /** Recommended fix strategy */
  fixStrategy: FixStrategy;
}

/**
 * File with associated risk metadata
 */
export interface FileWithRisk {
  filePath: string;
  fileType: FileType;
  risk: FileTypeMetadata['risk'];
  locChanged?: number; // Optional: lines of code changed
}

/**
 * Result of risk-weighted budget validation
 */
export interface RiskBudgetValidation {
  /** Whether budget allows the changes */
  allowed: boolean;
  /** Total weighted budget impact */
  weightedImpact: number;
  /** Budget limits from manifest */
  budget: {
    maxFiles: number;
    maxLoc: number;
    maxRecipes: number;
  };
  /** Violations (if any) */
  violations: string[];
  /** Per-file risk breakdown */
  breakdown: Array<{
    filePath: string;
    fileType: FileType;
    risk: FileTypeMetadata['risk'];
    weight: number;
    locChanged: number;
  }>;
}

/**
 * Audit log entry for Autopilot decisions
 */
export interface AutopilotAuditLog {
  timestamp: number;
  action: 'blocked' | 'budget' | 'strategy' | 'allowed';
  filePath?: string;
  fileType?: FileType;
  risk?: FileTypeMetadata['risk'];
  reason?: string;
  weight?: number;
  fixStrategy?: FixStrategy;
  metadata?: Record<string, unknown>;
}

/**
 * Check if a file can be modified by Autopilot
 * 
 * CRITICAL FILE BLOCKING:
 * - Blocks all critical-risk files (env, secretCandidates, migrations, infrastructure)
 * - Returns recommended fix strategy for allowed files
 * 
 * @param filePath - Absolute or relative file path
 * @returns ModificationPermission with allowed/blocked status and metadata
 * 
 * @example
 * ```typescript
 * const perm = shouldAllowModification('.env');
 * // → { allowed: false, fileType: 'env', risk: 'critical', 
 * //     blockReason: "Critical file type 'env' requires manual review", ... }
 * 
 * const perm2 = shouldAllowModification('src/index.ts');
 * // → { allowed: true, fileType: 'sourceCode', risk: 'medium', 
 * //     fixStrategy: 'safe', ... }
 * ```
 */
export function shouldAllowModification(filePath: string): ModificationPermission {
  const fileType = detectFileType(filePath);
  const metadata = getFileTypeMetadata(fileType);
  
  // Critical risk files are ALWAYS blocked
  const isBlocked = BLOCKED_FILE_TYPES.includes(fileType);
  
  return {
    allowed: !isBlocked,
    fileType,
    risk: metadata.risk,
    usedByProducts: metadata.usedBy,
    blockReason: isBlocked 
      ? `Critical file type '${fileType}' requires manual review — Autopilot cannot modify this file`
      : undefined,
    fixStrategy: selectFixStrategy(fileType),
  };
}

/**
 * Select recommended fix strategy based on file type risk
 * 
 * Strategy Matrix:
 * - critical → manual-review-required (should be blocked upstream)
 * - high → safe (conservative fixes only, e.g., formatting, unused imports)
 * - medium → safe (standard fixes, e.g., simple refactors, type annotations)
 * - low → rewrite (aggressive refactoring, e.g., full rewrites for tests/docs)
 * 
 * @param fileType - File type to determine strategy for
 * @returns Recommended fix strategy
 * 
 * @example
 * ```typescript
 * selectFixStrategy('env')          // → 'manual-review-required'
 * selectFixStrategy('sourceCode')   // → 'safe'
 * selectFixStrategy('tests')        // → 'safe' (tests are medium risk)
 * selectFixStrategy('documentation') // → 'rewrite' (docs are low risk)
 * ```
 */
export function selectFixStrategy(fileType: FileType): FixStrategy {
  const metadata = getFileTypeMetadata(fileType);
  
  switch (metadata.risk) {
    case 'critical':
      return 'manual-review-required';
    case 'high':
    case 'medium':
      return 'safe';
    case 'low':
      return 'rewrite';
  }
}

/**
 * Calculate risk-weighted budget impact for a set of files
 * 
 * Weighted Calculation:
 * - Each file contributes: weight × (1 for file count + normalized LOC)
 * - High-risk files count 3x, medium 2x, low 1x
 * - Example: 1 high-risk file with 20 LOC = 3 × (1 + 20/40) = 4.5 budget points
 * 
 * @param files - Files with risk metadata and optional LOC changes
 * @returns Total weighted budget impact (normalized to file count)
 * 
 * @example
 * ```typescript
 * const impact = calculateWeightedImpact([
 *   { filePath: 'src/api.ts', fileType: 'sourceCode', risk: 'high', locChanged: 20 },
 *   { filePath: 'README.md', fileType: 'documentation', risk: 'low', locChanged: 10 },
 * ]);
 * // high (3x): 3 × (1 + 20/40) = 4.5
 * // low (1x): 1 × (1 + 10/40) = 1.25
 * // Total: 5.75 budget impact
 * ```
 */
export function calculateWeightedImpact(files: FileWithRisk[]): number {
  let totalImpact = 0;
  
  for (const file of files) {
    const weight = RISK_WEIGHTS[file.risk];
    
    // Skip blocked files (critical risk = Infinity weight)
    if (weight === Infinity) {
      continue;
    }
    
    // Base impact: 1 per file
    let fileImpact = 1;
    
    // Add LOC contribution (normalized to 40 LOC baseline)
    if (file.locChanged !== undefined && file.locChanged > 0) {
      fileImpact += file.locChanged / 40; // 40 LOC = 1 full file equivalent
    }
    
    totalImpact += weight * fileImpact;
  }
  
  return totalImpact;
}

/**
 * Validate changes against risk-weighted budget
 * 
 * Budget Enforcement:
 * - Uses manifest.autopilot.riskBudget (maxFiles, maxLoc, maxRecipes)
 * - Applies risk weights to file count (high=3x, medium=2x, low=1x)
 * - Blocks if weighted file count > maxFiles
 * - Blocks if total LOC > maxLoc (across all files)
 * - Returns detailed breakdown for audit logging
 * 
 * @param changes - Files to be modified with risk metadata
 * @param recipesCount - Number of recipes being executed
 * @param budget - Risk budget from manifest (maxFiles, maxLoc, maxRecipes)
 * @returns RiskBudgetValidation with allowed/blocked status and breakdown
 * 
 * @example
 * ```typescript
 * const validation = validateRiskWeightedBudget(
 *   [
 *     { filePath: 'src/api.ts', fileType: 'sourceCode', risk: 'high', locChanged: 20 },
 *     { filePath: 'src/utils.ts', fileType: 'sourceCode', risk: 'medium', locChanged: 15 },
 *   ],
 *   2, // 2 recipes
 *   { maxFiles: 10, maxLoc: 40, maxRecipes: 5 }
 * );
 * // Weighted impact: (3 × 1.5) + (2 × 1.375) = 7.25
 * // allowed: true (7.25 ≤ 10 maxFiles)
 * ```
 */
export function validateRiskWeightedBudget(
  changes: FileWithRisk[],
  recipesCount: number,
  budget: { maxFiles: number; maxLoc: number; maxRecipes: number }
): RiskBudgetValidation {
  const violations: string[] = [];
  const breakdown: RiskBudgetValidation['breakdown'] = [];
  
  // Calculate weighted impact
  let weightedFileCount = 0;
  let totalLoc = 0;
  
  for (const file of changes) {
    const weight = RISK_WEIGHTS[file.risk];
    
    // Critical files should be blocked upstream (shouldn't reach here)
    if (weight === Infinity) {
      violations.push(
        `Critical file ${file.filePath} (type: ${file.fileType}) cannot be modified by Autopilot`
      );
      breakdown.push({
        filePath: file.filePath,
        fileType: file.fileType,
        risk: file.risk,
        weight: Infinity,
        locChanged: file.locChanged || 0,
      });
      continue;
    }
    
    // Base impact: 1 file
    let fileImpact = 1;
    
    // Add LOC contribution (normalized)
    if (file.locChanged !== undefined && file.locChanged > 0) {
      fileImpact += file.locChanged / 40;
      totalLoc += file.locChanged;
    }
    
    weightedFileCount += weight * fileImpact;
    
    breakdown.push({
      filePath: file.filePath,
      fileType: file.fileType,
      risk: file.risk,
      weight: weight * fileImpact,
      locChanged: file.locChanged || 0,
    });
  }
  
  // Check violations
  if (weightedFileCount > budget.maxFiles) {
    violations.push(
      `Weighted file count (${weightedFileCount.toFixed(2)}) exceeds budget (${budget.maxFiles})`
    );
  }
  
  if (totalLoc > budget.maxLoc) {
    violations.push(
      `Total LOC (${totalLoc}) exceeds budget (${budget.maxLoc})`
    );
  }
  
  if (recipesCount > budget.maxRecipes) {
    violations.push(
      `Recipe count (${recipesCount}) exceeds budget (${budget.maxRecipes})`
    );
  }
  
  return {
    allowed: violations.length === 0,
    weightedImpact: weightedFileCount,
    budget,
    violations,
    breakdown,
  };
}

/**
 * Audit logger for Autopilot file-type decisions
 * 
 * Logs all blocking decisions, budget impacts, and strategy selections.
 * Provides color-coded console output and JSON export for compliance.
 */
export class AutopilotAuditor {
  private logs: AutopilotAuditLog[] = [];
  
  /**
   * Log a blocked modification attempt
   */
  logBlocked(filePath: string, fileType: FileType, risk: FileTypeMetadata['risk'], reason: string): void {
    console.error(
      `[Autopilot] ❌ BLOCKED: ${filePath} (${fileType}, ${risk} risk) — ${reason}`
    );
    
    this.logs.push({
      timestamp: Date.now(),
      action: 'blocked',
      filePath,
      fileType,
      risk,
      reason,
    });
  }
  
  /**
   * Log risk budget impact for a file
   */
  logBudgetImpact(
    filePath: string, 
    fileType: FileType, 
    risk: FileTypeMetadata['risk'], 
    weight: number
  ): void {
    const emoji = risk === 'high' ? '🔴' : risk === 'medium' ? '🟡' : '🟢';
    console.log(
      `[Autopilot] ${emoji} Budget impact: ${filePath} → +${weight.toFixed(2)} (${risk} risk, ${fileType})`
    );
    
    this.logs.push({
      timestamp: Date.now(),
      action: 'budget',
      filePath,
      fileType,
      risk,
      weight,
    });
  }
  
  /**
   * Log fix strategy selection
   */
  logStrategy(
    filePath: string, 
    fileType: FileType, 
    risk: FileTypeMetadata['risk'], 
    strategy: FixStrategy
  ): void {
    const strategyEmoji = strategy === 'safe' ? '✅' : strategy === 'rewrite' ? '🔄' : '⚠️';
    console.log(
      `[Autopilot] ${strategyEmoji} Strategy: ${filePath} → ${strategy} (${risk} risk, ${fileType})`
    );
    
    this.logs.push({
      timestamp: Date.now(),
      action: 'strategy',
      filePath,
      fileType,
      risk,
      fixStrategy: strategy,
    });
  }
  
  /**
   * Log allowed modification
   */
  logAllowed(
    filePath: string, 
    fileType: FileType, 
    risk: FileTypeMetadata['risk'], 
    reason: string
  ): void {
    console.log(
      `[Autopilot] ✅ ALLOWED: ${filePath} (${fileType}, ${risk} risk) — ${reason}`
    );
    
    this.logs.push({
      timestamp: Date.now(),
      action: 'allowed',
      filePath,
      fileType,
      risk,
      reason,
    });
  }
  
  /**
   * Get all audit logs
   */
  getLogs(): AutopilotAuditLog[] {
    return [...this.logs];
  }
  
  /**
   * Export audit logs as JSON string
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }
  
  /**
   * Clear all logs (useful for testing)
   */
  clear(): void {
    this.logs = [];
  }
  
  /**
   * Get statistics about decisions made
   */
  getStats(): {
    total: number;
    blocked: number;
    allowed: number;
    budgetChecks: number;
    strategySelections: number;
  } {
    return {
      total: this.logs.length,
      blocked: this.logs.filter(l => l.action === 'blocked').length,
      allowed: this.logs.filter(l => l.action === 'allowed').length,
      budgetChecks: this.logs.filter(l => l.action === 'budget').length,
      strategySelections: this.logs.filter(l => l.action === 'strategy').length,
    };
  }
}

// Singleton instance for global audit logging
let globalAuditorInstance: AutopilotAuditor | null = null;

/**
 * Get the global Autopilot auditor instance (singleton)
 */
export function getAutopilotAuditor(): AutopilotAuditor {
  if (!globalAuditorInstance) {
    globalAuditorInstance = new AutopilotAuditor();
  }
  return globalAuditorInstance;
}

// TODO Phase P7: Guardian Integration
// After Autopilot applies fixes, send file-type statistics to Guardian
// to determine which test suites to run based on changed file types.
// Example: If infrastructure files modified → run deployment tests
//          If sourceCode modified → run unit tests
//          If config modified → run integration tests

// TODO Phase P8: Brain Integration  
// After budget validation, send weighted risk impact to Brain for
// deployment decision and confidence threshold adjustment.
// Example: High-risk changes (weight > 5) → require 90% confidence
//          Medium-risk changes (weight 2-5) → require 75% confidence
//          Low-risk changes (weight < 2) → require 60% confidence
