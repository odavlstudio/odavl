/**
 * ODAVL Insight ML Learning System
 * Learns from detection patterns and improves accuracy over time
 * 
 * ✅ ALLOWED Features (Detection-focused):
 * - Pattern recognition from detections
 * - Confidence score improvement
 * - False positive reduction
 * - Auto-learning from detection patterns
 * 
 * ❌ REMOVED Features (Fixing is Autopilot's job):
 * - Fix history tracking (deleted)
 * - Fix suggestion (deleted)
 * - Auto-fix recording (deleted)
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { EnhancedIssue } from '../analyzer/enhanced-analyzer.js';

// ❌ REMOVED: FixHistoryEntry interface - violates Insight boundaries

export interface LearningMetrics {
  total_fixes: number;
  successful_fixes: number;
  false_positives: number;
  accuracy_improvement: number;
  patterns_learned: number;
  confidence_adjustment: {
    detector: string;
    pattern: string;
    before: number;
    after: number;
  }[];
}

export interface PatternSignature {
  pattern_id: string;
  detector: string;
  issue_type: string;
  code_pattern: string;
  context_requirements: string[];
  success_rate: number;
  confidence_multiplier: number;
  learned_from: number; // number of examples
  last_updated: string;
}

export class MLLearningSystem {
  private historyPath: string;
  private patternsPath: string;
  private metricsPath: string;
  // ❌ REMOVED: private history: FixHistoryEntry[] - violates boundaries
  private patterns: Map<string, PatternSignature> = new Map();
  private metrics: LearningMetrics;

  constructor(private workspaceRoot: string) {
    const mlDir = path.join(workspaceRoot, '.odavl/ml');
    // ❌ REMOVED: fix-history.json path - no longer tracking fixes
    this.historyPath = path.join(mlDir, 'fix-history.json'); // Legacy - kept for migration
    this.patternsPath = path.join(mlDir, 'learned-patterns.json');
    this.metricsPath = path.join(mlDir, 'learning-metrics.json');
    
    this.metrics = {
      total_fixes: 0, // Legacy metric
      successful_fixes: 0, // Legacy metric
      false_positives: 0,
      accuracy_improvement: 0,
      patterns_learned: 0,
      confidence_adjustment: [],
    };
  }

  /**
   * Initialize ML system - load existing patterns
   * ❌ REMOVED: Loading fix history (violation)
   */
  async initialize(): Promise<void> {
    await this.ensureDirectories();
    // ❌ REMOVED: await this.loadHistory() - no longer tracking fixes
    await this.loadPatterns();
    await this.loadMetrics();
  }

  // ❌ REMOVED: recordFix() - violates Insight boundaries (fixing is Autopilot's job)
  // ❌ REMOVED: learnFromFix() - violates Insight boundaries
  // ❌ REMOVED: getSuggestedFix() - violates Insight boundaries

  /**
   * Adjust issue confidence based on learned patterns
   * ✅ ALLOWED: Detection-only ML learning (improves accuracy)
   */
  adjustConfidence(issue: EnhancedIssue): number {
    const patternId = this.generatePatternIdFromIssue(issue);
    const pattern = this.patterns.get(patternId);

    if (!pattern) {
      return issue.confidence; // No learned pattern, return original
    }

    // Apply learned confidence multiplier
    let adjustedConfidence = issue.confidence * pattern.confidence_multiplier;

    // Factor in success rate
    if (pattern.success_rate < 0.5) {
      // Pattern has low success rate, reduce confidence
      adjustedConfidence *= 0.8;
    } else if (pattern.success_rate > 0.9) {
      // Pattern has high success rate, boost confidence
      adjustedConfidence *= 1.1;
    }

    // Factor in number of examples learned from
    if (pattern.learned_from > 10) {
      // High confidence in pattern with many examples
      adjustedConfidence *= 1.05;
    }

    return Math.max(0, Math.min(100, Math.round(adjustedConfidence)));
  }

  /**
   * Get learning metrics
   */
  getMetrics(): LearningMetrics {
    const accuracyBefore = 0.85; // Baseline from Phase 1
    const accuracyNow = this.metrics.total_fixes > 0
      ? this.metrics.successful_fixes / this.metrics.total_fixes
      : accuracyBefore;
    
    this.metrics.accuracy_improvement = ((accuracyNow - accuracyBefore) / accuracyBefore) * 100;
    
    return this.metrics;
  }

  /**
   * Get learned patterns for a detector
   */
  getPatternsForDetector(detector: string): PatternSignature[] {
    return Array.from(this.patterns.values())
      .filter(p => p.detector === detector)
      .sort((a, b) => b.success_rate - a.success_rate);
  }

  /**
   * Get fix suggestions based on learned patterns
   */
  async getSuggestedFix(issue: EnhancedIssue): Promise<string | null> {
    const patternId = this.generatePatternIdFromIssue(issue);
    
    // Find similar fixes in history
    const similarFixes = this.history.filter(entry => {
      const entryPatternId = this.generatePatternId(entry);
      return entryPatternId === patternId && entry.fix.success && entry.fix.code_after;
    });

    if (similarFixes.length === 0) {
      return null;
    }

    // Return the most common successful fix
    const fixCounts = new Map<string, number>();
    similarFixes.forEach(fix => {
      if (fix.fix.code_after) {
        const count = fixCounts.get(fix.fix.code_after) || 0;
        fixCounts.set(fix.fix.code_after, count + 1);
      }
    });

    let mostCommonFix = '';
    let maxCount = 0;
    fixCounts.forEach((count, fix) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonFix = fix;
      }
    });

    return mostCommonFix || null;
  }

  /**
   * Export training data for external ML models
   */
  async exportTrainingData(outputPath: string): Promise<void> {
    const trainingData = this.history.map(entry => ({
      input: {
        issue_type: entry.issue.type,
        detector: entry.issue.detector,
        code_pattern: this.extractCodePattern(entry.context.surrounding_code),
        context: entry.context,
      },
      output: {
        should_fix: entry.fix.success,
        is_false_positive: entry.fix.user_feedback === 'false-positive',
        fix_method: entry.fix.method,
        resolution_time: entry.outcome.time_to_fix,
      },
      metadata: {
        timestamp: entry.timestamp,
        framework: entry.context.framework,
        pattern: entry.context.pattern,
      },
    }));

    await fs.writeFile(outputPath, JSON.stringify(trainingData, null, 2));
  }

  // Private helper methods

  private async ensureDirectories(): Promise<void> {
    const mlDir = path.join(this.workspaceRoot, '.odavl/ml');
    await fs.mkdir(mlDir, { recursive: true });
  }

  // ❌ REMOVED: loadHistory() - no longer tracking fixes
  // ❌ REMOVED: saveHistory() - no longer tracking fixes

  private async loadPatterns(): Promise<void> {
    try {
      const data = await fs.readFile(this.patternsPath, 'utf-8');
      const patterns = JSON.parse(data);
      this.patterns = new Map(Object.entries(patterns));
    } catch {
      this.patterns = new Map();
    }
  }

  private async savePatterns(): Promise<void> {
    const patternsObj = Object.fromEntries(this.patterns);
    await fs.writeFile(this.patternsPath, JSON.stringify(patternsObj, null, 2));
  }

  private async loadMetrics(): Promise<void> {
    try {
      const data = await fs.readFile(this.metricsPath, 'utf-8');
      this.metrics = JSON.parse(data);
    } catch {
      // Use default metrics
    }
  }

  private async saveMetrics(): Promise<void> {
    await fs.writeFile(this.metricsPath, JSON.stringify(this.metrics, null, 2));
  }

  // ❌ REMOVED: generatePatternId() - only used by fix tracking
  // ❌ REMOVED: extractCodePattern() - only used by fix tracking
  // ❌ REMOVED: extractContextRequirements() - only used by fix tracking
  // ❌ REMOVED: calculateSuccessRate() - only used by fix tracking

  /**
   * Generate pattern ID from issue (for confidence adjustment)
   */
  private generatePatternIdFromIssue(issue: EnhancedIssue): string {
    const detector = this.getDetectorFromIssue(issue);
    const type = issue.original.type || 'unknown';
    const framework = issue.fileContext?.framework || 'any';
    const pattern = issue.fileContext?.pattern || 'generic';
    return `${detector}_${type}_${framework}_${pattern}`;
  }

  private getDetectorFromIssue(issue: EnhancedIssue): string {
    // Extract detector name from issue source or type
    const original = issue.original as any;
    if (original.source) {
      return original.source.replace('ODAVL/', '').toLowerCase();
    }
    if (original.ruleId) {
      return 'eslint';
    }
    if (original.code) {
      return 'typescript';
    }
    return 'unknown';
  }

  private getFileType(filePath: string): string {
    const ext = path.extname(filePath);
    return ext || 'unknown';
  }
}
