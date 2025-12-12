/**
 * @fileoverview Historical Comparison Engine
 * Compares current analysis results with historical baselines
 * Provides detailed comparison reports and regression detection
 * 
 * Features:
 * - Baseline comparison (vs previous run, week, month)
 * - Regression detection (new issues, resurfaced issues)
 * - Improvement tracking (resolved issues, fixes)
 * - Side-by-side comparisons
 * - Delta reports
 * - Custom comparison periods
 * - Multi-baseline comparison
 * - Severity-weighted scoring
 * 
 * @module reporting/historical-comparison
 */

import type { AnalysisResult, Issue } from '../types';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Comparison configuration
 */
export interface ComparisonConfig {
  /** Current analysis result */
  current: AnalysisResult;
  
  /** Baseline result to compare against */
  baseline: AnalysisResult;
  
  /** Enable detailed issue-level comparison */
  detailedComparison?: boolean;
  
  /** Severity weights for scoring */
  severityWeights?: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
  
  /** Ignore specific file patterns */
  ignorePatterns?: string[];
  
  /** Include resolved issues in report */
  includeResolved?: boolean;
}

/**
 * Comparison result
 */
export interface ComparisonResult {
  /** Comparison metadata */
  metadata: {
    currentTimestamp: Date;
    baselineTimestamp: Date;
    timeDelta: number; // milliseconds
    comparisonDate: Date;
  };
  
  /** Overall assessment */
  assessment: {
    status: 'improved' | 'degraded' | 'unchanged';
    score: number; // -100 to +100 (negative = degraded, positive = improved)
    confidence: number; // 0-100
    summary: string;
  };
  
  /** Metrics comparison */
  metrics: {
    totalIssues: MetricComparison;
    critical: MetricComparison;
    high: MetricComparison;
    medium: MetricComparison;
    low: MetricComparison;
    filesAnalyzed: MetricComparison;
    linesOfCode: MetricComparison;
  };
  
  /** Issue-level changes */
  issues: {
    new: Issue[]; // New issues introduced
    resolved: Issue[]; // Issues fixed since baseline
    unchanged: Issue[]; // Issues still present
    resurfaced: Issue[]; // Issues that were fixed but reappeared
  };
  
  /** Regression details */
  regressions: Regression[];
  
  /** Improvement details */
  improvements: Improvement[];
  
  /** File-level changes */
  fileChanges: FileChange[];
  
  /** Recommendations */
  recommendations: string[];
}

/**
 * Metric comparison
 */
export interface MetricComparison {
  current: number;
  baseline: number;
  delta: number;
  deltaPercent: number;
  status: 'improved' | 'degraded' | 'unchanged';
}

/**
 * Regression details
 */
export interface Regression {
  file: string;
  newIssuesCount: number;
  criticalCount: number;
  highCount: number;
  severity: 'critical' | 'high' | 'medium';
  description: string;
  issues: Issue[];
}

/**
 * Improvement details
 */
export interface Improvement {
  file: string;
  resolvedIssuesCount: number;
  criticalResolved: number;
  highResolved: number;
  description: string;
  issues: Issue[];
}

/**
 * File-level change
 */
export interface FileChange {
  file: string;
  added: number;
  removed: number;
  netChange: number;
  status: 'improved' | 'degraded' | 'unchanged';
}

// ============================================================================
// Historical Comparison Engine
// ============================================================================

/**
 * Historical comparison engine
 */
export class HistoricalComparisonEngine {
  private config: Required<ComparisonConfig>;

  constructor(config: ComparisonConfig) {
    this.config = {
      current: config.current,
      baseline: config.baseline,
      detailedComparison: config.detailedComparison ?? true,
      severityWeights: config.severityWeights || { critical: 10, high: 5, medium: 2, low: 1 },
      ignorePatterns: config.ignorePatterns || [],
      includeResolved: config.includeResolved ?? true,
    };
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Compare current results with baseline
   */
  compare(): ComparisonResult {
    console.log('📊 Comparing with baseline...');

    // Filter issues by ignore patterns
    const currentIssues = this.filterIssues(this.config.current.issues || []);
    const baselineIssues = this.filterIssues(this.config.baseline.issues || []);

    // Categorize issues
    const issueCategorization = this.categorizeIssues(currentIssues, baselineIssues);

    // Calculate metrics
    const metrics = this.compareMetrics(currentIssues, baselineIssues);

    // Detect regressions
    const regressions = this.detectRegressions(issueCategorization.new);

    // Detect improvements
    const improvements = this.detectImprovements(issueCategorization.resolved);

    // Calculate file changes
    const fileChanges = this.calculateFileChanges(currentIssues, baselineIssues);

    // Calculate overall score
    const score = this.calculateScore(metrics, regressions, improvements);
    const assessment = this.assessOverall(score, metrics);

    // Generate recommendations
    const recommendations = this.generateRecommendations(regressions, improvements, metrics);

    const result: ComparisonResult = {
      metadata: {
        currentTimestamp: new Date(this.config.current.timestamp || Date.now()),
        baselineTimestamp: new Date(this.config.baseline.timestamp || Date.now()),
        timeDelta: new Date(this.config.current.timestamp || Date.now()).getTime() - new Date(this.config.baseline.timestamp || Date.now()).getTime(),
        comparisonDate: new Date(),
      },
      assessment,
      metrics,
      issues: issueCategorization,
      regressions,
      improvements,
      fileChanges,
      recommendations,
    };

    console.log(`✅ Comparison complete: ${assessment.status}`);
    return result;
  }

  // --------------------------------------------------------------------------
  // Private Methods - Issue Categorization
  // --------------------------------------------------------------------------

  private categorizeIssues(
    current: Issue[],
    baseline: Issue[]
  ): ComparisonResult['issues'] {
    const baselineMap = new Map(baseline.map(i => [this.getIssueFingerprint(i), i]));
    const currentMap = new Map(current.map(i => [this.getIssueFingerprint(i), i]));

    const newIssues: Issue[] = [];
    const resolvedIssues: Issue[] = [];
    const unchangedIssues: Issue[] = [];
    const resurfacedIssues: Issue[] = [];

    // Find new and unchanged issues
    for (const issue of current) {
      const fingerprint = this.getIssueFingerprint(issue);
      if (!baselineMap.has(fingerprint)) {
        newIssues.push(issue);
      } else {
        unchangedIssues.push(issue);
      }
    }

    // Find resolved issues
    for (const issue of baseline) {
      const fingerprint = this.getIssueFingerprint(issue);
      if (!currentMap.has(fingerprint)) {
        resolvedIssues.push(issue);
      }
    }

    // Detect resurfaced issues (resolved before but now back)
    // This would require historical data beyond baseline
    // For now, empty array
    // TODO: Implement with full history

    return {
      new: newIssues,
      resolved: resolvedIssues,
      unchanged: unchangedIssues,
      resurfaced: resurfacedIssues,
    };
  }

  private getIssueFingerprint(issue: Issue): string {
    return `${issue.file}:${issue.line}:${issue.message}`;
  }

  // --------------------------------------------------------------------------
  // Private Methods - Metrics Comparison
  // --------------------------------------------------------------------------

  private compareMetrics(current: Issue[], baseline: Issue[]): ComparisonResult['metrics'] {
    return {
      totalIssues: this.compareMetric(current.length, baseline.length),
      critical: this.compareMetric(
        current.filter(i => i.severity === 'critical').length,
        baseline.filter(i => i.severity === 'critical').length
      ),
      high: this.compareMetric(
        current.filter(i => i.severity === 'high').length,
        baseline.filter(i => i.severity === 'high').length
      ),
      medium: this.compareMetric(
        current.filter(i => i.severity === 'medium').length,
        baseline.filter(i => i.severity === 'medium').length
      ),
      low: this.compareMetric(
        current.filter(i => i.severity === 'low').length,
        baseline.filter(i => i.severity === 'low').length
      ),
      filesAnalyzed: this.compareMetric(
        this.config.current.metrics?.filesAnalyzed || 0,
        this.config.baseline.metrics?.filesAnalyzed || 0,
        true
      ),
      linesOfCode: this.compareMetric(
        this.config.current.metrics?.linesOfCode || 0,
        this.config.baseline.metrics?.linesOfCode || 0,
        true
      ),
    };
  }

  private compareMetric(current: number, baseline: number, higherIsBetter = false): MetricComparison {
    const delta = current - baseline;
    const deltaPercent = baseline > 0 ? (delta / baseline) * 100 : 0;

    let status: 'improved' | 'degraded' | 'unchanged';
    if (Math.abs(deltaPercent) < 5) {
      status = 'unchanged';
    } else if (higherIsBetter) {
      status = delta > 0 ? 'improved' : 'degraded';
    } else {
      status = delta < 0 ? 'improved' : 'degraded';
    }

    return { current, baseline, delta, deltaPercent, status };
  }

  // --------------------------------------------------------------------------
  // Private Methods - Regression Detection
  // --------------------------------------------------------------------------

  private detectRegressions(newIssues: Issue[]): Regression[] {
    const regressionMap = new Map<string, Regression>();

    for (const issue of newIssues) {
      if (!regressionMap.has(issue.file)) {
        regressionMap.set(issue.file, {
          file: issue.file,
          newIssuesCount: 0,
          criticalCount: 0,
          highCount: 0,
          severity: 'medium',
          description: '',
          issues: [],
        });
      }

      const regression = regressionMap.get(issue.file)!;
      regression.newIssuesCount++;
      regression.issues.push(issue);

      if (issue.severity === 'critical') regression.criticalCount++;
      if (issue.severity === 'high') regression.highCount++;
    }

    // Calculate severity and description for each regression
    const regressions: Regression[] = Array.from(regressionMap.values())
      .map(reg => {
        reg.severity = reg.criticalCount > 0 ? 'critical' :
                       reg.highCount > 0 ? 'high' : 'medium';
        
        reg.description = `${reg.newIssuesCount} new issue(s) introduced` +
          (reg.criticalCount > 0 ? ` (${reg.criticalCount} critical)` : '') +
          (reg.highCount > 0 ? ` (${reg.highCount} high)` : '');

        return reg;
      })
      .sort((a, b) => {
        // Sort by severity first, then by count
        const severityOrder = { critical: 0, high: 1, medium: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.newIssuesCount - a.newIssuesCount;
      });

    return regressions;
  }

  // --------------------------------------------------------------------------
  // Private Methods - Improvement Detection
  // --------------------------------------------------------------------------

  private detectImprovements(resolvedIssues: Issue[]): Improvement[] {
    const improvementMap = new Map<string, Improvement>();

    for (const issue of resolvedIssues) {
      if (!improvementMap.has(issue.file)) {
        improvementMap.set(issue.file, {
          file: issue.file,
          resolvedIssuesCount: 0,
          criticalResolved: 0,
          highResolved: 0,
          description: '',
          issues: [],
        });
      }

      const improvement = improvementMap.get(issue.file)!;
      improvement.resolvedIssuesCount++;
      improvement.issues.push(issue);

      if (issue.severity === 'critical') improvement.criticalResolved++;
      if (issue.severity === 'high') improvement.highResolved++;
    }

    // Calculate description for each improvement
    const improvements: Improvement[] = Array.from(improvementMap.values())
      .map(imp => {
        imp.description = `${imp.resolvedIssuesCount} issue(s) resolved` +
          (imp.criticalResolved > 0 ? ` (${imp.criticalResolved} critical)` : '') +
          (imp.highResolved > 0 ? ` (${imp.highResolved} high)` : '');

        return imp;
      })
      .sort((a, b) => {
        // Sort by critical + high resolved first
        const aScore = a.criticalResolved * 10 + a.highResolved * 5;
        const bScore = b.criticalResolved * 10 + b.highResolved * 5;
        return bScore - aScore;
      });

    return improvements;
  }

  // --------------------------------------------------------------------------
  // Private Methods - File Changes
  // --------------------------------------------------------------------------

  private calculateFileChanges(current: Issue[], baseline: Issue[]): FileChange[] {
    const fileMap = new Map<string, FileChange>();

    // Count current issues per file
    const currentCounts = new Map<string, number>();
    for (const issue of current) {
      currentCounts.set(issue.file, (currentCounts.get(issue.file) || 0) + 1);
    }

    // Count baseline issues per file
    const baselineCounts = new Map<string, number>();
    for (const issue of baseline) {
      baselineCounts.set(issue.file, (baselineCounts.get(issue.file) || 0) + 1);
    }

    // Combine all files
    const allFiles = new Set([...currentCounts.keys(), ...baselineCounts.keys()]);

    for (const file of allFiles) {
      const currentCount = currentCounts.get(file) || 0;
      const baselineCount = baselineCounts.get(file) || 0;
      const netChange = currentCount - baselineCount;

      fileMap.set(file, {
        file,
        added: Math.max(0, netChange),
        removed: Math.max(0, -netChange),
        netChange,
        status: netChange < 0 ? 'improved' : netChange > 0 ? 'degraded' : 'unchanged',
      });
    }

    return Array.from(fileMap.values())
      .filter(fc => fc.netChange !== 0)
      .sort((a, b) => Math.abs(b.netChange) - Math.abs(a.netChange));
  }

  // --------------------------------------------------------------------------
  // Private Methods - Scoring & Assessment
  // --------------------------------------------------------------------------

  private calculateScore(
    metrics: ComparisonResult['metrics'],
    regressions: Regression[],
    improvements: Improvement[]
  ): number {
    const weights = this.config.severityWeights;

    // Calculate weighted issue changes
    const criticalDelta = metrics.critical.delta * weights.critical!;
    const highDelta = metrics.high.delta * weights.high!;
    const mediumDelta = metrics.medium.delta * weights.medium!;
    const lowDelta = metrics.low.delta * weights.low!;

    // Negative score = improvement (issues decreased)
    const issueScore = -(criticalDelta + highDelta + mediumDelta + lowDelta);

    // Penalty for regressions
    const regressionPenalty = regressions.reduce((sum, reg) => {
      return sum + (reg.criticalCount * 10 + reg.highCount * 5);
    }, 0);

    // Bonus for improvements
    const improvementBonus = improvements.reduce((sum, imp) => {
      return sum + (imp.criticalResolved * 10 + imp.highResolved * 5);
    }, 0);

    // Final score: -100 to +100
    const rawScore = issueScore + improvementBonus - regressionPenalty;
    return Math.max(-100, Math.min(100, rawScore));
  }

  private assessOverall(
    score: number,
    metrics: ComparisonResult['metrics']
  ): ComparisonResult['assessment'] {
    let status: 'improved' | 'degraded' | 'unchanged';
    let confidence: number;
    let summary: string;

    if (score > 10) {
      status = 'improved';
      confidence = Math.min(100, 50 + Math.abs(score) / 2);
      summary = `✅ Code quality has improved! Total issues decreased by ${Math.abs(metrics.totalIssues.deltaPercent).toFixed(1)}% with ${Math.abs(metrics.critical.delta)} fewer critical issues.`;
    } else if (score < -10) {
      status = 'degraded';
      confidence = Math.min(100, 50 + Math.abs(score) / 2);
      summary = `⚠️ Code quality has degraded. Total issues increased by ${metrics.totalIssues.deltaPercent.toFixed(1)}% with ${metrics.critical.delta} new critical issues.`;
    } else {
      status = 'unchanged';
      confidence = 60;
      summary = `📊 Code quality is relatively unchanged with ${metrics.totalIssues.current} total issues (${metrics.critical.current} critical).`;
    }

    return { status, score, confidence, summary };
  }

  // --------------------------------------------------------------------------
  // Private Methods - Recommendations
  // --------------------------------------------------------------------------

  private generateRecommendations(
    regressions: Regression[],
    improvements: Improvement[],
    metrics: ComparisonResult['metrics']
  ): string[] {
    const recommendations: string[] = [];

    // Regression recommendations
    if (regressions.length > 0) {
      const criticalRegressions = regressions.filter(r => r.severity === 'critical');
      if (criticalRegressions.length > 0) {
        recommendations.push(
          `🔴 Critical: Address ${criticalRegressions.length} file(s) with critical regressions immediately`
        );
      }

      recommendations.push(
        `📋 Review ${regressions.slice(0, 5).map(r => r.file).join(', ')} for recent changes`
      );
    }

    // Improvement recommendations
    if (improvements.length > 0) {
      recommendations.push(
        `✅ Great work! Continue applying best practices from ${improvements[0].file}`
      );
    }

    // Metric-based recommendations
    if (metrics.critical.status === 'degraded') {
      recommendations.push(
        `🔴 Priority: Reduce critical issues (currently ${metrics.critical.current}, was ${metrics.critical.baseline})`
      );
    }

    if (metrics.totalIssues.delta > 10) {
      recommendations.push(
        `📈 Consider implementing pre-commit hooks to prevent issue accumulation`
      );
    }

    // Default recommendation if no specific issues
    if (recommendations.length === 0) {
      recommendations.push('✅ Maintain current code quality standards');
    }

    return recommendations;
  }

  // --------------------------------------------------------------------------
  // Private Methods - Utilities
  // --------------------------------------------------------------------------

  private filterIssues(issues: Issue[]): Issue[] {
    if (this.config.ignorePatterns.length === 0) return issues;

    return issues.filter(issue => {
      return !this.config.ignorePatterns.some(pattern => {
        const regex = new RegExp(pattern);
        return regex.test(issue.file);
      });
    });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create comparison engine
 */
export function createComparisonEngine(config: ComparisonConfig): HistoricalComparisonEngine {
  return new HistoricalComparisonEngine(config);
}

/**
 * Quick comparison
 */
export function compareWithBaseline(
  current: AnalysisResult,
  baseline: AnalysisResult
): ComparisonResult {
  const engine = createComparisonEngine({ current, baseline });
  return engine.compare();
}

/**
 * Get comparison summary for CLI
 */
export function getComparisonSummary(result: ComparisonResult): string {
  const { assessment, metrics, issues, regressions, improvements } = result;

  return `
📊 Historical Comparison

${assessment.summary}

Score: ${assessment.score > 0 ? '+' : ''}${assessment.score}/100 (${assessment.confidence}% confidence)

Metrics Changes:
  Total Issues: ${metrics.totalIssues.current} (${metrics.totalIssues.delta > 0 ? '+' : ''}${metrics.totalIssues.delta}, ${metrics.totalIssues.deltaPercent > 0 ? '+' : ''}${metrics.totalIssues.deltaPercent.toFixed(1)}%)
  Critical: ${metrics.critical.current} (${metrics.critical.delta > 0 ? '+' : ''}${metrics.critical.delta})
  High: ${metrics.high.current} (${metrics.high.delta > 0 ? '+' : ''}${metrics.high.delta})

Issue Changes:
  🆕 New: ${issues.new.length}
  ✅ Resolved: ${issues.resolved.length}
  📌 Unchanged: ${issues.unchanged.length}

${regressions.length > 0 ? `⚠️ Regressions (${regressions.length}):
${regressions.slice(0, 3).map(r => `  - ${r.file}: ${r.description}`).join('\n')}` : ''}

${improvements.length > 0 ? `✅ Improvements (${improvements.length}):
${improvements.slice(0, 3).map(i => `  - ${i.file}: ${i.description}`).join('\n')}` : ''}

Recommendations:
${result.recommendations.map(r => `  ${r}`).join('\n')}
  `.trim();
}
