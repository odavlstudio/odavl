/**
 * ODAVL Guardian - Phase P7: File-Type Integration
 * 
 * Makes Guardian file-type aware with:
 * - Intelligent test routing based on changed file types
 * - Automatic test skipping (no deployment tests if no infra changed)
 * - Risk-based test prioritization (critical files → priority tests)
 * - Baseline enforcement with file-type sensitivity
 * - Full audit logging with JSON export
 * 
 * Integration Points:
 * - test-orchestrator.ts: Use classifyTestSuitesByFileTypes() before running tests
 * - result-processor.ts: Use validateAgainstBaseline() after test results
 */

import { 
  detectFileType, 
  getFileTypeMetadata,
  type FileType,
  type FileTypeMetadata 
} from '@odavl/core/filetypes/file-type-detection';

/**
 * File-type to test suite mapping
 * 
 * Each file type maps to relevant test suites that should run when that file type changes.
 * Empty array means no tests should run for that file type (e.g., logs, build artifacts).
 */
export const FILETYPE_TEST_MAP: Record<FileType, string[]> = {
  sourceCode: ['unit', 'lint', 'integration'],
  tests: ['meta', 'unit'],
  config: ['smoke', 'integration'],
  schema: ['migration', 'integration'],
  migrations: ['migration', 'integration', 'smoke'],
  infrastructure: ['deployment', 'smoke'],
  env: ['securityScan'],
  secretCandidates: ['securityScan'],
  documentation: ['docs'],
  assets: ['ui'],
  dependencies: ['integration', 'smoke'],
  buildConfig: ['smoke'],
  ciConfig: ['smoke'],
  buildArtifacts: [], // Never tested
  logs: [],           // Never tested
  diagnostics: [],    // Never tested
  coverage: [],       // Never tested
  reports: [],        // Never tested
  database: ['migration', 'integration'],
  vscodeConfig: [],   // Never tested
};

/**
 * Risk-based test priority weights
 * 
 * Used to sort test suites by importance based on file-type risk.
 * Higher risk = run tests first.
 */
export const RISK_TEST_WEIGHTS: Record<FileTypeMetadata['risk'], number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
};

/**
 * Test suite with priority metadata
 */
export interface PrioritizedTestSuite {
  suite: string;
  priority: number;
  reason: string;
  triggeredBy: Array<{
    filePath: string;
    fileType: FileType;
    risk: FileTypeMetadata['risk'];
  }>;
}

/**
 * File-type statistics for a set of changed files
 */
export interface FileTypeStats {
  totalFiles: number;
  byType: Record<FileType, number>;
  byRisk: Record<FileTypeMetadata['risk'], number>;
  highestRisk: FileTypeMetadata['risk'];
  uniqueTypes: FileType[];
}

/**
 * Baseline enforcement mode based on file-type risk
 */
export type BaselineMode = 'strict' | 'adaptive' | 'learning';

/**
 * Baseline policy configuration
 */
export interface BaselinePolicy {
  mode: BaselineMode;
  regressionThreshold?: number; // For adaptive mode (0-1)
  autoUpdate?: boolean;         // For learning mode
}

/**
 * Baseline validation result
 */
export interface BaselineValidation {
  passed: boolean;
  mode: BaselineMode;
  violations: Array<{
    testSuite: string;
    metric: string;
    baseline: number;
    actual: number;
    delta: number;
    severity: 'error' | 'warning';
  }>;
  recommendations: string[];
}

/**
 * Guardian audit log entry
 */
export interface GuardianAuditLog {
  timestamp: number;
  action: 'routed' | 'skipped' | 'prioritized' | 'baseline' | 'completed';
  testSuite?: string;
  fileType?: FileType;
  risk?: FileTypeMetadata['risk'];
  reason?: string;
  priority?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Classify test suites based on changed file types
 * 
 * Analyzes which files changed and determines which test suites should run.
 * Returns unique test suites with priority metadata.
 * 
 * @param changedFiles - Array of file paths that were modified
 * @returns Array of test suites to run with priority information
 * 
 * @example
 * ```typescript
 * const suites = classifyTestSuitesByFileTypes([
 *   'src/api/auth.ts',
 *   'infra/main.tf',
 *   'README.md'
 * ]);
 * // → [
 * //   { suite: 'deployment', priority: 100, reason: 'infrastructure files changed' },
 * //   { suite: 'unit', priority: 75, reason: 'sourceCode files changed' },
 * //   { suite: 'docs', priority: 25, reason: 'documentation files changed' }
 * // ]
 * ```
 */
export function classifyTestSuitesByFileTypes(
  changedFiles: string[]
): PrioritizedTestSuite[] {
  const suiteMap = new Map<string, PrioritizedTestSuite>();
  
  for (const filePath of changedFiles) {
    const fileType = detectFileType(filePath);
    const metadata = getFileTypeMetadata(fileType);
    const testSuites = FILETYPE_TEST_MAP[fileType];
    const priority = RISK_TEST_WEIGHTS[metadata.risk];
    
    for (const suite of testSuites) {
      const existing = suiteMap.get(suite);
      
      if (existing) {
        // Upgrade priority if this file has higher risk
        if (priority > existing.priority) {
          existing.priority = priority;
          existing.reason = `${fileType} files changed (${metadata.risk} risk)`;
        }
        
        // Add to triggered files
        existing.triggeredBy.push({ filePath, fileType, risk: metadata.risk });
      } else {
        // Create new suite entry
        suiteMap.set(suite, {
          suite,
          priority,
          reason: `${fileType} files changed (${metadata.risk} risk)`,
          triggeredBy: [{ filePath, fileType, risk: metadata.risk }],
        });
      }
    }
  }
  
  return Array.from(suiteMap.values());
}

/**
 * Get recommended test suites based on file-type statistics
 * 
 * Convenience function that computes stats and classifies suites in one call.
 * 
 * @param changedFiles - Array of file paths that were modified
 * @returns Object with stats and recommended suites
 * 
 * @example
 * ```typescript
 * const { stats, suites } = getRecommendedTestSuites(['src/api.ts', 'README.md']);
 * console.log(`${suites.length} suites for ${stats.totalFiles} files`);
 * ```
 */
export function getRecommendedTestSuites(changedFiles: string[]): {
  stats: FileTypeStats;
  suites: PrioritizedTestSuite[];
} {
  const stats = computeFileTypeStats(changedFiles);
  const suites = classifyTestSuitesByFileTypes(changedFiles);
  
  return { stats, suites };
}

/**
 * Compute file-type statistics for a set of files
 * 
 * @param changedFiles - Array of file paths
 * @returns Statistics about file types and risk levels
 */
export function computeFileTypeStats(changedFiles: string[]): FileTypeStats {
  const byType: Record<string, number> = {};
  const byRisk: Record<string, number> = {};
  const uniqueTypes = new Set<FileType>();
  let highestRiskValue = 0;
  let highestRisk: FileTypeMetadata['risk'] = 'low';
  
  for (const filePath of changedFiles) {
    const fileType = detectFileType(filePath);
    const metadata = getFileTypeMetadata(fileType);
    
    // Count by type
    byType[fileType] = (byType[fileType] || 0) + 1;
    uniqueTypes.add(fileType);
    
    // Count by risk
    byRisk[metadata.risk] = (byRisk[metadata.risk] || 0) + 1;
    
    // Track highest risk
    const riskValue = RISK_TEST_WEIGHTS[metadata.risk];
    if (riskValue > highestRiskValue) {
      highestRiskValue = riskValue;
      highestRisk = metadata.risk;
    }
  }
  
  return {
    totalFiles: changedFiles.length,
    byType: byType as Record<FileType, number>,
    byRisk: byRisk as Record<FileTypeMetadata['risk'], number>,
    highestRisk,
    uniqueTypes: Array.from(uniqueTypes),
  };
}

/**
 * Prioritize test suites by risk level (highest first)
 * 
 * Sorts suites in descending priority order so critical tests run first.
 * 
 * @param testSuites - Unsorted test suites
 * @returns Sorted test suites (highest priority first)
 * 
 * @example
 * ```typescript
 * const sorted = prioritizeTestSuites(suites);
 * // → [deployment (100), unit (75), docs (25)]
 * ```
 */
export function prioritizeTestSuites(
  testSuites: PrioritizedTestSuite[]
): PrioritizedTestSuite[] {
  return [...testSuites].sort((a, b) => {
    // Primary: priority (descending)
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    
    // Secondary: suite name (alphabetical)
    return a.suite.localeCompare(b.suite);
  });
}

/**
 * Determine if a test suite should be skipped based on file-type context
 * 
 * Skips tests that are irrelevant to the changed files.
 * 
 * @param testSuite - Name of test suite to check
 * @param stats - File-type statistics for changed files
 * @returns Object with skip decision and reason
 * 
 * @example
 * ```typescript
 * // Only docs changed
 * const stats = computeFileTypeStats(['README.md']);
 * shouldSkipTestSuite('deployment', stats);
 * // → { skip: true, reason: 'No infrastructure files changed' }
 * 
 * shouldSkipTestSuite('docs', stats);
 * // → { skip: false, reason: 'Documentation tests relevant' }
 * ```
 */
export function shouldSkipTestSuite(
  testSuite: string,
  stats: FileTypeStats
): { skip: boolean; reason: string } {
  // Rule 1: Skip deployment if no infrastructure files
  if (testSuite === 'deployment' && !stats.byType.infrastructure) {
    return {
      skip: true,
      reason: 'No infrastructure files changed',
    };
  }
  
  // Rule 2: Skip migration if no migrations/schema/database files
  if (
    testSuite === 'migration' &&
    !stats.byType.migrations &&
    !stats.byType.schema &&
    !stats.byType.database
  ) {
    return {
      skip: true,
      reason: 'No migration/schema/database files changed',
    };
  }
  
  // Rule 3: Skip UI tests if no assets changed
  if (testSuite === 'ui' && !stats.byType.assets) {
    return {
      skip: true,
      reason: 'No asset files changed',
    };
  }
  
  // Rule 4: Skip docs tests if no documentation changed
  if (testSuite === 'docs' && !stats.byType.documentation) {
    return {
      skip: true,
      reason: 'No documentation files changed',
    };
  }
  
  // Rule 5: Skip security scans if no env/secret files changed
  if (
    testSuite === 'securityScan' &&
    !stats.byType.env &&
    !stats.byType.secretCandidates
  ) {
    return {
      skip: true,
      reason: 'No env or secret candidate files changed',
    };
  }
  
  // Rule 6: Skip heavy integration tests if only low-risk files changed
  if (
    testSuite === 'integration' &&
    stats.highestRisk === 'low' &&
    stats.totalFiles <= 3
  ) {
    return {
      skip: true,
      reason: 'Only low-risk files changed (< 4 files)',
    };
  }
  
  return {
    skip: false,
    reason: 'Test suite relevant to changes',
  };
}

/**
 * Validate test results against baseline with file-type sensitivity
 * 
 * Enforcement modes:
 * - strict: Any regression fails (for critical/high-risk files)
 * - adaptive: Regression allowed within threshold (for medium-risk)
 * - learning: Auto-update baseline (for low-risk files)
 * 
 * @param testResults - Current test results (scores, metrics)
 * @param changedFileTypes - File types that were modified
 * @param baselinePolicy - Policy from manifest or defaults
 * @param baseline - Previous baseline values
 * @returns Validation result with violations and recommendations
 * 
 * @example
 * ```typescript
 * const validation = validateAgainstBaseline(
 *   { performance: 85, accessibility: 90 },
 *   ['infrastructure'],
 *   { mode: 'strict' },
 *   { performance: 90, accessibility: 92 }
 * );
 * // → { passed: false, violations: [...], mode: 'strict' }
 * ```
 */
export function validateAgainstBaseline(
  testResults: Record<string, number>,
  changedFileTypes: FileType[],
  baselinePolicy: BaselinePolicy,
  baseline: Record<string, number>
): BaselineValidation {
  const violations: BaselineValidation['violations'] = [];
  const recommendations: string[] = [];
  
  // Determine strictness based on file types
  const stats = computeFileTypeStats(
    changedFileTypes.map(ft => `dummy.${ft}`) // Dummy paths for type detection
  );
  
  let effectiveMode = baselinePolicy.mode;
  
  // Override mode based on risk
  if (
    stats.byType.infrastructure ||
    stats.byType.migrations ||
    stats.byType.schema
  ) {
    // Critical infrastructure changes → strict mode
    effectiveMode = 'strict';
    recommendations.push(
      'Strict baseline enforcement: infrastructure/migrations/schema files changed'
    );
  } else if (stats.highestRisk === 'low') {
    // Low-risk changes → learning mode (if autoUpdate enabled)
    if (baselinePolicy.autoUpdate) {
      effectiveMode = 'learning';
      recommendations.push('Learning mode: baseline will be updated automatically');
    }
  }
  
  // Check each metric
  for (const [metric, actual] of Object.entries(testResults)) {
    const baselineValue = baseline[metric];
    
    if (baselineValue === undefined) {
      continue; // No baseline for this metric
    }
    
    const delta = actual - baselineValue;
    const deltaPercent = (delta / baselineValue) * 100;
    
    // Regression detected
    if (delta < 0) {
      if (effectiveMode === 'strict') {
        violations.push({
          testSuite: metric,
          metric,
          baseline: baselineValue,
          actual,
          delta: deltaPercent,
          severity: 'error',
        });
      } else if (effectiveMode === 'adaptive') {
        const threshold = baselinePolicy.regressionThreshold || 0.05; // 5% default
        
        if (Math.abs(deltaPercent) > threshold * 100) {
          violations.push({
            testSuite: metric,
            metric,
            baseline: baselineValue,
            actual,
            delta: deltaPercent,
            severity: 'error',
          });
        } else {
          violations.push({
            testSuite: metric,
            metric,
            baseline: baselineValue,
            actual,
            delta: deltaPercent,
            severity: 'warning',
          });
          recommendations.push(
            `Regression within threshold for ${metric}: ${deltaPercent.toFixed(1)}%`
          );
        }
      } else {
        // learning mode: log but don't fail
        recommendations.push(
          `Baseline updated for ${metric}: ${baselineValue} → ${actual}`
        );
      }
    }
  }
  
  return {
    passed: violations.filter(v => v.severity === 'error').length === 0,
    mode: effectiveMode,
    violations,
    recommendations,
  };
}

/**
 * Guardian file-type audit logger
 * 
 * Logs all test routing, skipping, prioritization, and baseline decisions
 * with color-coded console output and JSON export.
 */
export class GuardianFileTypeAuditor {
  private logs: GuardianAuditLog[] = [];
  
  /**
   * Log test suite routing decision
   */
  logRoutedSuites(suites: PrioritizedTestSuite[], stats: FileTypeStats): void {
    console.log(
      `\n[Guardian] 🧠 Routed ${suites.length} test suites based on ${stats.totalFiles} changed files`
    );
    console.log(`[Guardian]    File types: ${stats.uniqueTypes.join(', ')}`);
    console.log(`[Guardian]    Highest risk: ${stats.highestRisk}`);
    
    this.logs.push({
      timestamp: Date.now(),
      action: 'routed',
      reason: `${suites.length} suites routed for ${stats.totalFiles} files`,
      metadata: {
        suites: suites.map(s => s.suite),
        fileTypes: stats.uniqueTypes,
        highestRisk: stats.highestRisk,
      },
    });
  }
  
  /**
   * Log skipped test suite
   */
  logSkippedSuite(suite: string, reason: string): void {
    console.log(`[Guardian] ⏭️  Skipped suite "${suite}" — ${reason}`);
    
    this.logs.push({
      timestamp: Date.now(),
      action: 'skipped',
      testSuite: suite,
      reason,
    });
  }
  
  /**
   * Log test priority ordering
   */
  logPriorityOrder(suites: PrioritizedTestSuite[]): void {
    console.log(`\n[Guardian] 📊 Test execution order (priority-based):`);
    
    for (let i = 0; i < suites.length; i++) {
      const s = suites[i];
      const emoji = s.priority >= 75 ? '🔺' : s.priority >= 50 ? '🟡' : '🟢';
      console.log(
        `[Guardian]    ${i + 1}. ${emoji} ${s.suite} (priority: ${s.priority}) — ${s.reason}`
      );
    }
    
    this.logs.push({
      timestamp: Date.now(),
      action: 'prioritized',
      reason: 'Test suites ordered by risk-based priority',
      metadata: {
        order: suites.map(s => ({ suite: s.suite, priority: s.priority })),
      },
    });
  }
  
  /**
   * Log baseline validation decision
   */
  logBaselineDecision(validation: BaselineValidation, changedFileTypes: FileType[]): void {
    const emoji = validation.passed ? '✅' : '⚠️';
    const status = validation.passed ? 'PASSED' : 'FAILED';
    
    console.log(
      `\n[Guardian] ${emoji} Baseline validation ${status} (mode: ${validation.mode})`
    );
    
    if (validation.violations.length > 0) {
      console.log(`[Guardian]    Violations:`);
      for (const v of validation.violations) {
        const symbol = v.severity === 'error' ? '❌' : '⚠️';
        console.log(
          `[Guardian]      ${symbol} ${v.metric}: ${v.actual} (baseline: ${v.baseline}, delta: ${v.delta.toFixed(1)}%)`
        );
      }
    }
    
    if (validation.recommendations.length > 0) {
      console.log(`[Guardian]    Recommendations:`);
      for (const rec of validation.recommendations) {
        console.log(`[Guardian]      💡 ${rec}`);
      }
    }
    
    this.logs.push({
      timestamp: Date.now(),
      action: 'baseline',
      reason: `Baseline ${validation.mode} mode: ${status}`,
      metadata: {
        passed: validation.passed,
        mode: validation.mode,
        violations: validation.violations.length,
        changedFileTypes,
      },
    });
  }
  
  /**
   * Log test run completion
   */
  logCompleted(duration: number, totalTests: number, passed: boolean): void {
    const emoji = passed ? '✅' : '❌';
    const status = passed ? 'PASSED' : 'FAILED';
    
    console.log(
      `\n[Guardian] ${emoji} Test run ${status} — ${totalTests} suites in ${(duration / 1000).toFixed(1)}s`
    );
    
    this.logs.push({
      timestamp: Date.now(),
      action: 'completed',
      reason: `Test run completed: ${status}`,
      metadata: {
        duration,
        totalTests,
        passed,
      },
    });
  }
  
  /**
   * Get all audit logs
   */
  getLogs(): GuardianAuditLog[] {
    return [...this.logs];
  }
  
  /**
   * Export audit logs as JSON string
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }
  
  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }
  
  /**
   * Get statistics about audit events
   */
  getStats(): {
    total: number;
    routed: number;
    skipped: number;
    prioritized: number;
    baselineChecks: number;
    completed: number;
  } {
    return {
      total: this.logs.length,
      routed: this.logs.filter(l => l.action === 'routed').length,
      skipped: this.logs.filter(l => l.action === 'skipped').length,
      prioritized: this.logs.filter(l => l.action === 'prioritized').length,
      baselineChecks: this.logs.filter(l => l.action === 'baseline').length,
      completed: this.logs.filter(l => l.action === 'completed').length,
    };
  }
}

// Singleton instance for global audit logging
let globalAuditorInstance: GuardianFileTypeAuditor | null = null;

/**
 * Get the global Guardian auditor instance (singleton)
 */
export function getGuardianFileTypeAuditor(): GuardianFileTypeAuditor {
  if (!globalAuditorInstance) {
    globalAuditorInstance = new GuardianFileTypeAuditor();
  }
  return globalAuditorInstance;
}

// TODO Phase P8: Brain Integration
// After Guardian test run completes, send risk-weighted file-type statistics
// and test results to Brain for deployment decision making.
//
// Integration Example:
// ```typescript
// const brainContext = {
//   fileTypeStats: stats,
//   testResults: { passed: 15, failed: 2 },
//   highestRisk: stats.highestRisk,
//   weightedImpact: calculateWeightedImpact(stats), // From Autopilot P6
// };
// const confidence = await brainClient.getDeploymentConfidence(brainContext);
// ```
//
// Confidence Thresholds:
// - critical/high-risk changes → require 90% test pass rate
// - medium-risk changes → require 75% test pass rate
// - low-risk changes → allow 60% test pass rate
//
// Brain Decision Matrix:
// - If confidence < threshold → block deployment
// - If regression in strict mode → block deployment
// - If critical tests fail → block deployment regardless of confidence
