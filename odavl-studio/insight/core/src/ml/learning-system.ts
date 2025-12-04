/**
 * ODAVL Insight ML Learning System
 * Learns from fix history and improves detection accuracy over time
 * 
 * Features:
 * - Fix history tracking
 * - Pattern recognition from successful fixes
 * - Confidence score improvement
 * - False positive reduction
 * - Auto-learning from user feedback
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { EnhancedIssue } from '../analyzer/enhanced-analyzer.js';

export interface FixHistoryEntry {
  id: string;
  timestamp: string;
  issue: {
    type: string;
    message: string;
    file: string;
    line: number;
    severity: string;
    detector: string;
  };
  fix: {
    applied: boolean;
    method: 'auto' | 'manual' | 'ignored';
    success: boolean;
    code_before: string;
    code_after?: string;
    user_feedback?: 'helpful' | 'not-helpful' | 'false-positive';
  };
  context: {
    framework?: string;
    pattern?: string;
    file_type: string;
    surrounding_code: string;
  };
  outcome: {
    resolved: boolean;
    time_to_fix: number; // seconds
    subsequent_issues: number;
  };
}

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
  private history: FixHistoryEntry[] = [];
  private patterns: Map<string, PatternSignature> = new Map();
  private metrics: LearningMetrics;

  constructor(private workspaceRoot: string) {
    const mlDir = path.join(workspaceRoot, '.odavl/ml');
    this.historyPath = path.join(mlDir, 'fix-history.json');
    this.patternsPath = path.join(mlDir, 'learned-patterns.json');
    this.metricsPath = path.join(mlDir, 'learning-metrics.json');
    
    this.metrics = {
      total_fixes: 0,
      successful_fixes: 0,
      false_positives: 0,
      accuracy_improvement: 0,
      patterns_learned: 0,
      confidence_adjustment: [],
    };
  }

  /**
   * Initialize ML system - load existing history and patterns
   */
  async initialize(): Promise<void> {
    await this.ensureDirectories();
    await this.loadHistory();
    await this.loadPatterns();
    await this.loadMetrics();
  }

  /**
   * Record a fix attempt
   */
  async recordFix(
    issue: EnhancedIssue,
    fixResult: {
      applied: boolean;
      method: 'auto' | 'manual' | 'ignored';
      success: boolean;
      code_before: string;
      code_after?: string;
      user_feedback?: 'helpful' | 'not-helpful' | 'false-positive';
    },
    outcome: {
      resolved: boolean;
      time_to_fix: number;
      subsequent_issues: number;
    }
  ): Promise<void> {
    const entry: FixHistoryEntry = {
      id: `fix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      issue: {
        type: issue.original.type || 'unknown',
        message: issue.original.message || '',
        file: issue.original.file || issue.original.filePath || 'unknown',
        line: issue.original.line || issue.original.startLine || 0,
        severity: issue.priority,
        detector: this.getDetectorFromIssue(issue),
      },
      fix: fixResult,
      context: {
        framework: issue.fileContext?.framework,
        pattern: issue.fileContext?.pattern,
        file_type: this.getFileType(issue.original.file || issue.original.filePath || ''),
        surrounding_code: fixResult.code_before,
      },
      outcome,
    };

    this.history.push(entry);
    await this.saveHistory();

    // Update metrics
    this.metrics.total_fixes++;
    if (fixResult.success) {
      this.metrics.successful_fixes++;
    }
    if (fixResult.user_feedback === 'false-positive') {
      this.metrics.false_positives++;
    }

    await this.saveMetrics();

    // Learn from this fix
    await this.learnFromFix(entry);
  }

  /**
   * Learn patterns from successful fixes
   */
  private async learnFromFix(entry: FixHistoryEntry): Promise<void> {
    // Only learn from successful fixes and false positives
    if (!entry.fix.success && entry.fix.user_feedback !== 'false-positive') {
      return;
    }

    const patternId = this.generatePatternId(entry);
    const existingPattern = this.patterns.get(patternId);

    if (existingPattern) {
      // Update existing pattern
      existingPattern.learned_from++;
      existingPattern.last_updated = new Date().toISOString();

      // Adjust confidence based on outcomes
      if (entry.fix.user_feedback === 'false-positive') {
        // Reduce confidence for false positives
        existingPattern.confidence_multiplier = Math.max(
          0.5,
          existingPattern.confidence_multiplier - 0.1
        );
        existingPattern.success_rate = this.calculateSuccessRate(patternId);
      } else if (entry.fix.success) {
        // Increase confidence for successful fixes
        existingPattern.confidence_multiplier = Math.min(
          1.5,
          existingPattern.confidence_multiplier + 0.05
        );
        existingPattern.success_rate = this.calculateSuccessRate(patternId);
      }
    } else {
      // Create new pattern
      const newPattern: PatternSignature = {
        pattern_id: patternId,
        detector: entry.issue.detector,
        issue_type: entry.issue.type,
        code_pattern: this.extractCodePattern(entry.context.surrounding_code),
        context_requirements: this.extractContextRequirements(entry),
        success_rate: entry.fix.success ? 1.0 : 0.0,
        confidence_multiplier: entry.fix.user_feedback === 'false-positive' ? 0.7 : 1.0,
        learned_from: 1,
        last_updated: new Date().toISOString(),
      };

      this.patterns.set(patternId, newPattern);
      this.metrics.patterns_learned++;
    }

    await this.savePatterns();
  }

  /**
   * Adjust issue confidence based on learned patterns
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

  private async loadHistory(): Promise<void> {
    try {
      const data = await fs.readFile(this.historyPath, 'utf-8');
      this.history = JSON.parse(data);
    } catch {
      this.history = [];
    }
  }

  private async saveHistory(): Promise<void> {
    await fs.writeFile(this.historyPath, JSON.stringify(this.history, null, 2));
  }

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

  private generatePatternId(entry: FixHistoryEntry): string {
    return `${entry.issue.detector}_${entry.issue.type}_${entry.context.framework || 'any'}_${entry.context.pattern || 'generic'}`;
  }

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

  private extractCodePattern(code: string): string {
    // Extract pattern by removing specific values/names
    return code
      .replace(/['"`][^'"`]*['"`]/g, 'STRING') // Replace strings
      .replace(/\b\d+\b/g, 'NUMBER') // Replace numbers
      .replace(/\b[a-z][a-zA-Z0-9]*\b/g, 'VAR') // Replace variable names
      .trim()
      .substring(0, 200); // Limit length
  }

  private extractContextRequirements(entry: FixHistoryEntry): string[] {
    const requirements: string[] = [];
    
    if (entry.context.framework) {
      requirements.push(`framework:${entry.context.framework}`);
    }
    if (entry.context.pattern) {
      requirements.push(`pattern:${entry.context.pattern}`);
    }
    if (entry.context.file_type) {
      requirements.push(`filetype:${entry.context.file_type}`);
    }
    
    return requirements;
  }

  private calculateSuccessRate(patternId: string): number {
    const relatedFixes = this.history.filter(entry => 
      this.generatePatternId(entry) === patternId
    );
    
    if (relatedFixes.length === 0) return 0;
    
    const successful = relatedFixes.filter(entry => 
      entry.fix.success && entry.fix.user_feedback !== 'false-positive'
    ).length;
    
    return successful / relatedFixes.length;
  }
}
