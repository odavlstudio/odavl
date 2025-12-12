/**
 * ML-Enhanced Detector
 * Integrates machine learning and predictive analysis with existing detectors
 */

import { EnhancedIssue } from '../analyzer/enhanced-analyzer.js';
import { MLLearningSystem } from './learning-system.js';
import { PredictiveAnalysisEngine, FileRiskScore } from './predictive-analysis.js';

export interface MLEnhancedIssue extends EnhancedIssue {
  ml_adjusted_confidence: number;
  predicted_recurrence: boolean;
  similar_fixes_count: number;
  suggested_fix?: string;
  risk_context?: {
    file_risk_score: number;
    predicted_issues: number;
  };
}

export interface MLAnalysisReport {
  timestamp: string;
  issues: MLEnhancedIssue[];
  learning_metrics: {
    total_fixes: number;
    accuracy_improvement: number;
    patterns_learned: number;
  };
  predictive_insights: {
    high_risk_files: FileRiskScore[];
    proactive_recommendations: string[];
  };
  summary: {
    total_issues: number;
    ml_adjusted_issues: number;
    confidence_boost: number;
    false_positives_reduced: number;
  };
}

export class MLEnhancedDetector {
  private learningSystem: MLLearningSystem;
  private predictiveEngine: PredictiveAnalysisEngine;
  private initialized: boolean = false;

  constructor(private workspaceRoot: string) {
    this.learningSystem = new MLLearningSystem(workspaceRoot);
    this.predictiveEngine = new PredictiveAnalysisEngine(workspaceRoot);
  }

  /**
   * Initialize ML systems
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🤖 Initializing ML systems...');
    
    await Promise.all([
      this.learningSystem.initialize(),
      this.predictiveEngine.initialize(),
    ]);

    this.initialized = true;
    console.log('✅ ML systems ready');
  }

  /**
   * Enhance issues with ML analysis
   */
  async enhanceIssues(issues: EnhancedIssue[]): Promise<MLEnhancedIssue[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const enhanced: MLEnhancedIssue[] = [];

    for (const issue of issues) {
      // Adjust confidence based on learned patterns
      const ml_adjusted_confidence = this.learningSystem.adjustConfidence(issue);

      // ❌ REMOVED: getSuggestedFix() - violates Insight boundaries
      // Fix suggestion is Autopilot's responsibility, not Insight's

      // Get file risk context
      const file = issue.original.file || issue.original.filePath || '';
      const highRiskFiles = this.predictiveEngine.getHighRiskFiles();
      const fileRisk = highRiskFiles.find(f => f.file === file);

      const mlEnhanced: MLEnhancedIssue = {
        ...issue,
        ml_adjusted_confidence,
        predicted_recurrence: fileRisk ? fileRisk.risk_score > 60 : false,
        similar_fixes_count: 0, // ❌ REMOVED: Fix tracking violates boundaries
        suggested_fix: undefined, // ❌ REMOVED: Fix suggestion is Autopilot's job
        risk_context: fileRisk ? {
          file_risk_score: fileRisk.risk_score,
          predicted_issues: fileRisk.predicted_issues.length,
        } : undefined,
      };

      enhanced.push(mlEnhanced);
    }

    // Sort by ML-adjusted confidence
    return enhanced.sort((a, b) => b.ml_adjusted_confidence - a.ml_adjusted_confidence);
  }

  /**
   * Generate comprehensive ML analysis report
   */
  async generateReport(issues: EnhancedIssue[]): Promise<MLAnalysisReport> {
    const mlEnhanced = await this.enhanceIssues(issues);
    const learningMetrics = this.learningSystem.getMetrics();
    const highRiskFiles = this.predictiveEngine.getHighRiskFiles();
    const proactive_recommendations = this.predictiveEngine.getProactiveRecommendations();

    // Calculate summary metrics
    const originalAvgConfidence = issues.reduce((sum, i) => sum + i.confidence, 0) / issues.length;
    const mlAvgConfidence = mlEnhanced.reduce((sum, i) => sum + i.ml_adjusted_confidence, 0) / mlEnhanced.length;
    const confidence_boost = ((mlAvgConfidence - originalAvgConfidence) / originalAvgConfidence) * 100;

    // Count issues filtered out by ML (low confidence after adjustment)
    const ml_adjusted_issues = mlEnhanced.filter(i => i.ml_adjusted_confidence >= 70).length;
    const false_positives_reduced = issues.length - ml_adjusted_issues;

    return {
      timestamp: new Date().toISOString(),
      issues: mlEnhanced,
      learning_metrics: {
        total_fixes: learningMetrics.total_fixes,
        accuracy_improvement: learningMetrics.accuracy_improvement,
        patterns_learned: learningMetrics.patterns_learned,
      },
      predictive_insights: {
        high_risk_files: highRiskFiles,
        proactive_recommendations: proactive_recommendations,
      },
      summary: {
        total_issues: issues.length,
        ml_adjusted_issues,
        confidence_boost: Math.round(confidence_boost * 10) / 10,
        false_positives_reduced,
      },
    };
  }

  // ❌ REMOVED: recordFix() method - violates Insight boundaries
  // Fix recording is Autopilot's responsibility, not Insight's

  /**
   * Get learning system (for advanced operations)
   */
  getLearningSystem(): MLLearningSystem {
    return this.learningSystem;
  }

  /**
   * Get predictive engine (for advanced operations)
   */
  getPredictiveEngine(): PredictiveAnalysisEngine {
    return this.predictiveEngine;
  }
}
