/**
 * ODAVL Brain - Runtime Deployment Confidence Engine
 * Phase P8: Compute deployment confidence based on file-type risks, test results, and baseline stability
 * 
 * Core Intelligence Features:
 * - Risk-weighted file-type analysis
 * - Test suite outcome impact scoring
 * - Historical baseline stability tracking
 * - Deployment confidence calculation (0-100)
 * - Automatic deployment blocking for high-risk failures
 * 
 * Decision Formula:
 * confidence = (riskWeight * 0.35) + (testImpact * 0.40) + (baselineStability * 0.25)
 * 
 * Confidence Thresholds:
 * - Critical/High changes: ≥90% required
 * - Medium changes: ≥75% required
 * - Low changes: ≥60% required
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FileTypeStats {
  byType: Record<string, number>;
  byRisk: Record<string, number>;
  totalFiles: number;
}

export interface GuardianReport {
  url: string;
  timestamp: string;
  duration: number;
  status: 'passed' | 'failed';
  issues: Array<{
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
  }>;
  metrics: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  enforcement?: {
    lighthouseValidation?: { passed: boolean; failures: string[] };
    webVitalsValidation?: { passed: boolean; failures: string[] };
    baselineComparison?: {
      passed: boolean;
      regressions: string[];
      improvements: string[];
    };
  };
}

export interface BaselineHistory {
  runs: Array<{
    timestamp: string;
    status: 'passed' | 'failed';
    metrics: {
      performance: number;
      accessibility: number;
      seo: number;
    };
    enforcement: {
      lighthousePassed: boolean;
      webVitalsPassed: boolean;
      baselinePassed: boolean;
    };
  }>;
}

export interface RiskClassification {
  riskCategory: 'critical' | 'high' | 'medium' | 'low';
  riskWeight: number;
  dominantFileTypes: string[];
}

export interface TestImpact {
  score: number;
  criticalFailures: number;
  highFailures: number;
  totalFailures: number;
  cappedBySeverity: boolean;
}

export interface BaselineStability {
  stabilityScore: number;
  volatility: number;
  regressionCount: number;
  improvementCount: number;
  trendDirection: 'improving' | 'stable' | 'degrading';
}

export interface DeploymentDecision {
  confidence: number;
  requiredConfidence: number;
  canDeploy: boolean;
  factors: {
    riskWeight: number;
    testImpact: number;
    baselineStability: number;
  };
  reasoning: string[];
  // Phase P9: ML prediction metadata
  mlPrediction?: {
    failureProbability: number;
    modelConfidence: number;
    adjustedConfidence: number;
    adjustmentReason: string;
  };
}

export interface AuditEntry {
  timestamp: string;
  type: 'riskAnalysis' | 'testImpact' | 'baselineStability' | 'finalScore';
  details: Record<string, unknown>;
}

export interface AuditStats {
  totalEntries: number;
  riskAnalyses: number;
  testImpacts: number;
  baselineStabilities: number;
  finalScores: number;
}

// ============================================================================
// RISK LEVEL CLASSIFICATION
// ============================================================================

/**
 * Classify risk level based on file-type statistics
 * 
 * Weights:
 * - critical/high files: 0.4 (migrations, env, secrets, infrastructure)
 * - medium files: 0.3 (source code, tests, config)
 * - low files: 0.2 (assets, styles)
 * - docs-only: 0.1 (documentation only)
 */
export function classifyRiskLevel(fileTypeStats: FileTypeStats): RiskClassification {
  const { byRisk, byType, totalFiles } = fileTypeStats;
  
  if (totalFiles === 0) {
    return {
      riskCategory: 'low',
      riskWeight: 0.2,
      dominantFileTypes: [],
    };
  }
  
  const criticalCount = byRisk.critical || 0;
  const highCount = byRisk.high || 0;
  const mediumCount = byRisk.medium || 0;
  const lowCount = byRisk.low || 0;
  
  // Check for docs-only change
  const docsCount = byType.documentation || 0;
  if (docsCount === totalFiles) {
    return {
      riskCategory: 'low',
      riskWeight: 0.1,
      dominantFileTypes: ['documentation'],
    };
  }
  
  // Determine risk category based on highest-risk files present
  let riskCategory: 'critical' | 'high' | 'medium' | 'low';
  let riskWeight: number;
  
  if (criticalCount > 0) {
    riskCategory = 'critical';
    riskWeight = 0.4;
  } else if (highCount > 0) {
    riskCategory = 'high';
    riskWeight = 0.4;
  } else if (mediumCount > 0) {
    riskCategory = 'medium';
    riskWeight = 0.3;
  } else {
    riskCategory = 'low';
    riskWeight = 0.2;
  }
  
  // Identify dominant file types (top 3 by count)
  const dominantFileTypes = Object.entries(byType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type);
  
  return {
    riskCategory,
    riskWeight,
    dominantFileTypes,
  };
}

// ============================================================================
// TEST RESULT IMPACT
// ============================================================================

/**
 * Calculate test impact score from Guardian report
 * 
 * Rules:
 * - Any critical suite failure → cap at 50
 * - Any high-risk suite failure → cap at 65
 * - No failures → full score based on metrics
 * - Score normalized to 0-100
 */
export function calculateTestImpact(guardianReport: GuardianReport): TestImpact {
  const { status, metrics, enforcement } = guardianReport;
  
  const criticalFailures = metrics.critical;
  const highFailures = metrics.high;
  const totalFailures = metrics.totalIssues;
  
  let score = 100;
  let cappedBySeverity = false;
  
  // Apply severity caps
  if (criticalFailures > 0) {
    score = Math.min(score, 50);
    cappedBySeverity = true;
  } else if (highFailures > 0) {
    score = Math.min(score, 65);
    cappedBySeverity = true;
  }
  
  // Apply enforcement penalties
  if (enforcement) {
    if (enforcement.lighthouseValidation && !enforcement.lighthouseValidation.passed) {
      score -= 10;
    }
    if (enforcement.webVitalsValidation && !enforcement.webVitalsValidation.passed) {
      score -= 10;
    }
    if (enforcement.baselineComparison && !enforcement.baselineComparison.passed) {
      score -= 15;
    }
  }
  
  // Apply failure penalty (gradual degradation)
  if (!cappedBySeverity && totalFailures > 0) {
    const penalty = Math.min(30, totalFailures * 3);
    score -= penalty;
  }
  
  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    criticalFailures,
    highFailures,
    totalFailures,
    cappedBySeverity,
  };
}

// ============================================================================
// BASELINE STABILITY
// ============================================================================

/**
 * Calculate baseline stability from historical test runs
 * 
 * Analyzes last 10 runs:
 * - Regression count (baseline failures)
 * - Improvement count (baseline improvements)
 * - Volatility score (0-1, lower is more stable)
 * - Trend direction (improving/stable/degrading)
 */
export function calculateBaselineStability(baselineHistory: BaselineHistory): BaselineStability {
  const { runs } = baselineHistory;
  
  if (runs.length === 0) {
    return {
      stabilityScore: 50,
      volatility: 0.5,
      regressionCount: 0,
      improvementCount: 0,
      trendDirection: 'stable',
    };
  }
  
  // Take last 10 runs
  const recentRuns = runs.slice(-10);
  
  // Count regressions and improvements
  let regressionCount = 0;
  let improvementCount = 0;
  
  for (const run of recentRuns) {
    if (run.enforcement.baselinePassed === false) {
      regressionCount++;
    } else if (run.enforcement.baselinePassed === true) {
      improvementCount++;
    }
  }
  
  // Calculate volatility (0-1, based on performance variance)
  const performanceScores = recentRuns.map(r => r.metrics.performance);
  const avgPerformance = performanceScores.reduce((sum, val) => sum + val, 0) / performanceScores.length;
  const variance = performanceScores.reduce((sum, val) => sum + Math.pow(val - avgPerformance, 2), 0) / performanceScores.length;
  const stdDev = Math.sqrt(variance);
  const volatility = Math.min(1, stdDev / 50); // Normalize to 0-1
  
  // Determine trend direction
  let trendDirection: 'improving' | 'stable' | 'degrading';
  if (improvementCount > regressionCount + 2) {
    trendDirection = 'improving';
  } else if (regressionCount > improvementCount + 2) {
    trendDirection = 'degrading';
  } else {
    trendDirection = 'stable';
  }
  
  // Calculate stability score (0-100)
  let stabilityScore = 100;
  
  // Penalize regressions
  stabilityScore -= regressionCount * 10;
  
  // Reward improvements
  stabilityScore += improvementCount * 5;
  
  // Penalize volatility
  stabilityScore -= volatility * 30;
  
  // Adjust for trend
  if (trendDirection === 'improving') {
    stabilityScore += 10;
  } else if (trendDirection === 'degrading') {
    stabilityScore -= 10;
  }
  
  // Ensure score is within bounds
  stabilityScore = Math.max(0, Math.min(100, stabilityScore));
  
  return {
    stabilityScore,
    volatility,
    regressionCount,
    improvementCount,
    trendDirection,
  };
}

// ============================================================================
// DEPLOYMENT CONFIDENCE SCORING
// ============================================================================

/**
 * Compute final deployment confidence score
 * 
 * Formula:
 * confidence = (riskWeight * 0.35) + (testImpact * 0.40) + (baselineStability * 0.25)
 * 
 * Phase P9: ML-enhanced confidence adjustment
 * - Predicts deployment failure probability using trained model
 * - Adjusts confidence based on ML prediction
 * - High failure risk (>0.70) → reduce confidence by 20%
 * - Low failure risk (<0.40) → boost confidence by 10%
 * 
 * Thresholds:
 * - Critical/High: ≥90% required
 * - Medium: ≥75% required
 * - Low: ≥60% required
 */
export async function computeDeploymentConfidence({
  fileTypeStats,
  guardianReport,
  baselineHistory,
  enableMLPrediction = true,
  changedFiles, // OMEGA-P5 Phase 4: OMS integration
}: {
  fileTypeStats: FileTypeStats;
  guardianReport: GuardianReport;
  baselineHistory: BaselineHistory;
  enableMLPrediction?: boolean;
  changedFiles?: string[]; // OMEGA-P5 Phase 4: File paths for OMS analysis
}): Promise<DeploymentDecision> {
  // 1. Classify risk level
  const riskClassification = classifyRiskLevel(fileTypeStats);
  
  // 2. Calculate test impact
  const testImpact = calculateTestImpact(guardianReport);
  
  // 3. Calculate baseline stability
  const baselineStability = calculateBaselineStability(baselineHistory);
  
  // 4. Compute weighted confidence score
  const riskWeightContribution = (100 - (riskClassification.riskWeight * 100)) * 0.35;
  const testImpactContribution = testImpact.score * 0.40;
  const baselineStabilityContribution = baselineStability.stabilityScore * 0.25;
  
  let confidence = riskWeightContribution + testImpactContribution + baselineStabilityContribution;
  
  // 4.6. OMEGA-P5 Phase 4: OMS file risk integration
  let omsFileRisk: { avgRisk: number; criticalFileCount: number; typeComposition: number[] } | undefined;
  if (changedFiles && changedFiles.length > 0) {
    try {
      const { loadOMSContext, resolveFileType } = await import('../../oms/oms-context.js');
      const { computeFileRiskScore } = await import('../../oms/risk/file-risk-index.js');
      await loadOMSContext();
      const risks = changedFiles.map(f => computeFileRiskScore({ type: resolveFileType(f) }));
      omsFileRisk = {
        avgRisk: risks.reduce((s, r) => s + r, 0) / risks.length,
        criticalFileCount: risks.filter(r => r >= 0.7).length,
        typeComposition: new Array(20).fill(0), // Placeholder for 20-dim type composition
      };
      // Adjust confidence based on OMS risk
      confidence -= omsFileRisk.criticalFileCount * 4; // 4% penalty per critical file
      confidence -= omsFileRisk.avgRisk * 10; // Up to 10% penalty for high avg risk
      confidence = Math.max(0, Math.min(100, confidence)); // Clamp to 0-100
    } catch { /* OMS unavailable */ }
  }

  // 4.5. Phase P11: MTL + Bayesian + Federated Sync integration
  let mlPrediction: {
    nn?: number;
    lstm?: number;
    mtl?: {
      success: number;
      performance: number;
      security: number;
      downtime: number;
    };
    bayesian?: {
      mean: number;
      variance: number;
      ciLow: number;
      ciHigh: number;
    };
    heuristic: number;
    finalEnsemble: number;
    bayesianAdjustment?: number;
  } | undefined;
  
  if (enableMLPrediction) {
    try {
      // Phase P11: Import ensemble v2 predictor
      const { 
        buildInputVector, 
        predictEnhancedConfidence, 
        predictFailureProbabilityEnsembleV2 
      } = await import('../learning/predictors.js');
      
      // Build input vector from analysis components
      const inputVector = buildInputVector({
        riskClassification,
        testImpact,
        baselineStability,
        omsFileRisk, // OMEGA-P5 Phase 4: Pass OMS data to ML
      });
      
      // Phase P11: Prepare history for LSTM (if available)
      const history = baselineHistory.entries.map((entry, idx) => ({
        riskWeight: riskClassification.riskWeight,
        testImpact: testImpact.score / 100,
        baselineStability: entry.score / 100,
        volatility: baselineStability.volatility,
        outcome: idx < baselineHistory.entries.length - 1 ? 1 : 0, // Historical entries succeeded
      }));
      
      // Phase P11: Use ensemble v2 prediction (NN + LSTM + MTL + Bayesian + Heuristic)
      const ensembleV2 = await predictFailureProbabilityEnsembleV2(
        inputVector.features,
        history
      );
      
      const failureProbability = ensembleV2.ensembleFailureProbability;
      const modelConfidence = 0.90; // Higher confidence for ensemble v2
      
      // Adjust confidence based on ensemble v2 prediction
      const enhanced = predictEnhancedConfidence({
        confidence,
        predictionProbability: failureProbability,
        modelConfidence,
      });
      
      // Update confidence with ML adjustment
      confidence = enhanced.adjustedConfidence;
      
      // Store ML metadata with all predictor details
      mlPrediction = {
        nn: ensembleV2.nnPrediction ?? undefined,
        lstm: ensembleV2.lstmPrediction ?? undefined,
        mtl: ensembleV2.mtlPrediction ?? undefined,
        bayesian: ensembleV2.bayesianPrediction ?? undefined,
        heuristic: ensembleV2.heuristicPrediction,
        finalEnsemble: ensembleV2.ensembleFailureProbability,
        bayesianAdjustment: ensembleV2.bayesianAdjustment,
      };

      // ============================================================================
      // Phase P12: Fusion Engine Integration
      // ============================================================================
      try {
        const { FusionEngine } = await import('../fusion/fusion-engine.js');
        const { FusionInput } = await import('../fusion/fusion-engine.js');

        const fusion = new FusionEngine();

        // Prepare fusion input
        const fusionInput: FusionInput = {
          nnPrediction: ensembleV2.nnPrediction ?? null,
          lstmPrediction: ensembleV2.lstmPrediction ?? null,
          mtlPredictions: ensembleV2.mtlPrediction ?? null,
          bayesianPrediction: ensembleV2.bayesianPrediction ?? null,
          heuristicPrediction: ensembleV2.heuristicPrediction,
          context: {
            recentRegressions: baselineStability.regressionCount,
            historicalStability: baselineStability.stabilityScore / 100,
            fileTypeRisk: riskClassification.riskWeight,
          },
        };

        // Run fusion engine
        const fusionResult = await fusion.fuse(fusionInput);

        // Phase P12: Self-calibrating confidence
        // Formula: 60% P11 ensemble + 40% P12 fusion score
        const p11Confidence = confidence / 100; // Normalize to 0-1
        const fusionConfidence = 0.6 * p11Confidence + 0.4 * fusionResult.fusionScore;
        confidence = fusionConfidence * 100; // Convert back to 0-100

        // Add fusion metadata to ML prediction
        (mlPrediction as any).fusion = {
          fusionScore: fusionResult.fusionScore,
          weights: fusionResult.fusionWeights,
          reasoning: fusionResult.reasoning,
          confidence: fusionResult.confidence,
        };
      } catch (fusionError) {
        // Fusion failed - continue with P11 ensemble confidence
        // Silent failure (fusion is experimental)
      }

    } catch (error) {
      // ML prediction failed - continue with base confidence
      // Silent failure to avoid disrupting deployment decision
      // Could log to .odavl/logs/brain.log if needed
    }
  }
  
  // 5. Determine required confidence threshold
  let requiredConfidence: number;
  if (riskClassification.riskCategory === 'critical' || riskClassification.riskCategory === 'high') {
    requiredConfidence = 90;
  } else if (riskClassification.riskCategory === 'medium') {
    requiredConfidence = 75;
  } else {
    requiredConfidence = 60;
  }
  
  // 6. Make deployment decision
  const canDeploy = confidence >= requiredConfidence;
  
  // 7. Generate reasoning
  const reasoning: string[] = [];
  
  reasoning.push(`Risk level: ${riskClassification.riskCategory} (weight: ${riskClassification.riskWeight})`);
  reasoning.push(`Test impact: ${testImpact.score.toFixed(1)} (${testImpact.totalFailures} failures)`);
  reasoning.push(`Baseline stability: ${baselineStability.stabilityScore.toFixed(1)} (${baselineStability.trendDirection})`);
  reasoning.push(`Confidence: ${confidence.toFixed(1)} / ${requiredConfidence} required`);
  
  // Phase P11: Add ML prediction reasoning with Bayesian uncertainty
  if (mlPrediction) {
    reasoning.push(`🤖 ML Ensemble v2: ${(mlPrediction.finalEnsemble * 100).toFixed(1)}% failure risk`);
    
    if (mlPrediction.mtl) {
      reasoning.push(`   📊 MTL Tasks: Success=${(mlPrediction.mtl.success * 100).toFixed(1)}%, Perf=${(mlPrediction.mtl.performance * 100).toFixed(1)}%, Sec=${(mlPrediction.mtl.security * 100).toFixed(1)}%, Down=${(mlPrediction.mtl.downtime * 100).toFixed(1)}%`);
    }
    
    if (mlPrediction.bayesian) {
      reasoning.push(`   📉 Bayesian Failure Probability: ${(mlPrediction.bayesian.mean * 100).toFixed(1)}% (CI: ${(mlPrediction.bayesian.ciLow * 100).toFixed(1)}% – ${(mlPrediction.bayesian.ciHigh * 100).toFixed(1)}%)`);
      
      if (mlPrediction.bayesianAdjustment && mlPrediction.bayesianAdjustment > 0) {
        reasoning.push(`   📊 Bayesian variance high → added ${(mlPrediction.bayesianAdjustment * 100).toFixed(1)}% risk penalty`);
      } else if (mlPrediction.bayesianAdjustment && mlPrediction.bayesianAdjustment < 0) {
        reasoning.push(`   📊 Bayesian variance low → reduced ${Math.abs(mlPrediction.bayesianAdjustment * 100).toFixed(1)}% risk bonus`);
      }
    }

    // Phase P12: Add fusion reasoning if available
    if ((mlPrediction as any).fusion) {
      const fusion = (mlPrediction as any).fusion;
      reasoning.push(`🧠 Fusion Score: ${(fusion.fusionScore * 100).toFixed(1)}% (P12 Self-Calibration)`);
      reasoning.push(`   🧩 Fusion weights: NN=${(fusion.weights.nn * 100).toFixed(0)}% LSTM=${(fusion.weights.lstm * 100).toFixed(0)}% MTL=${(fusion.weights.mtl * 100).toFixed(0)}% Bayesian=${(fusion.weights.bayesian * 100).toFixed(0)}% Heuristic=${(fusion.weights.heuristic * 100).toFixed(0)}%`);
      
      for (const reason of fusion.reasoning) {
        reasoning.push(`   ${reason}`);
      }
    }
  }
  
  if (testImpact.cappedBySeverity) {
    reasoning.push(`⚠️  Test impact capped due to critical/high severity failures`);
  }
  
  if (baselineStability.volatility > 0.5) {
    reasoning.push(`⚠️  High baseline volatility detected (${(baselineStability.volatility * 100).toFixed(1)}%)`);
  }
  
  if (canDeploy) {
    reasoning.push(`✅ Deployment ALLOWED (confidence meets threshold)`);
  } else {
    reasoning.push(`❌ Deployment BLOCKED (confidence below threshold)`);
  }
  
  return {
    confidence: Math.round(confidence * 10) / 10,
    requiredConfidence,
    canDeploy,
    factors: {
      riskWeight: Math.round(riskWeightContribution * 10) / 10,
      testImpact: Math.round(testImpactContribution * 10) / 10,
      baselineStability: Math.round(baselineStabilityContribution * 10) / 10,
    },
    reasoning,
    mlPrediction, // Phase P9: Attach ML metadata
  };
}

// ============================================================================
// BRAIN DEPLOYMENT AUDITOR
// ============================================================================

/**
 * Auditor for Brain deployment confidence decisions
 * Logs all analysis steps with color-coded console output + JSON export
 */
export class BrainDeploymentAuditor {
  private entries: AuditEntry[] = [];
  private runId: string;
  
  constructor() {
    this.runId = `brain-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  
  logRiskAnalysis(risk: RiskClassification): void {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      type: 'riskAnalysis',
      details: {
        category: risk.riskCategory,
        weight: risk.riskWeight,
        dominantFileTypes: risk.dominantFileTypes,
      },
    };
    
    this.entries.push(entry);
    
    console.log(`[Brain] 🧠 Risk analysis: ${risk.riskCategory} (weight: ${risk.riskWeight})`);
    console.log(`[Brain] 📊 Dominant file types: ${risk.dominantFileTypes.join(', ')}`);
  }
  
  logTestImpact(impact: TestImpact): void {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      type: 'testImpact',
      details: {
        score: impact.score,
        criticalFailures: impact.criticalFailures,
        highFailures: impact.highFailures,
        totalFailures: impact.totalFailures,
        capped: impact.cappedBySeverity,
      },
    };
    
    this.entries.push(entry);
    
    console.log(`[Brain] 📊 Test impact score: ${impact.score.toFixed(1)}`);
    
    if (impact.cappedBySeverity) {
      console.log(`[Brain] ⚠️  Score capped due to critical/high severity failures`);
    }
  }
  
  logBaselineStability(stability: BaselineStability): void {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      type: 'baselineStability',
      details: {
        score: stability.stabilityScore,
        volatility: stability.volatility,
        regressions: stability.regressionCount,
        improvements: stability.improvementCount,
        trend: stability.trendDirection,
      },
    };
    
    this.entries.push(entry);
    
    console.log(`[Brain] 📊 Baseline stability: ${stability.stabilityScore.toFixed(1)} (${stability.trendDirection})`);
    
    if (stability.volatility > 0.5) {
      console.log(`[Brain] ⚠️  High volatility: ${(stability.volatility * 100).toFixed(1)}%`);
    }
  }
  
  logFinalScore(decision: DeploymentDecision): void {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      type: 'finalScore',
      details: {
        confidence: decision.confidence,
        required: decision.requiredConfidence,
        canDeploy: decision.canDeploy,
        factors: decision.factors,
        reasoning: decision.reasoning,
      },
    };
    
    this.entries.push(entry);
    
    console.log(`[Brain] 📊 Final confidence: ${decision.confidence.toFixed(1)} / ${decision.requiredConfidence} required`);
    console.log(`[Brain] 📊 Factors: risk=${decision.factors.riskWeight.toFixed(1)} test=${decision.factors.testImpact.toFixed(1)} baseline=${decision.factors.baselineStability.toFixed(1)}`);
    
    if (decision.canDeploy) {
      console.log(`[Brain] ✅ Deployment ALLOWED`);
    } else {
      console.log(`[Brain] ❌ Deployment BLOCKED`);
    }
  }
  
  export(): string {
    const auditDir = '.odavl/audit';
    const auditPath = path.join(auditDir, `brain-deployment-${this.runId}.json`);
    
    const auditData = {
      runId: this.runId,
      timestamp: new Date().toISOString(),
      entries: this.entries,
      stats: this.getStats(),
    };
    
    // Ensure directory exists (sync for simplicity in this context)
    try {
      if (!require('fs').existsSync(auditDir)) {
        require('fs').mkdirSync(auditDir, { recursive: true });
      }
      require('fs').writeFileSync(auditPath, JSON.stringify(auditData, null, 2), 'utf8');
    } catch (error) {
      console.warn(`[Brain] ⚠️  Failed to export audit log:`, error);
    }
    
    return auditPath;
  }
  
  getStats(): AuditStats {
    return {
      totalEntries: this.entries.length,
      riskAnalyses: this.entries.filter(e => e.type === 'riskAnalysis').length,
      testImpacts: this.entries.filter(e => e.type === 'testImpact').length,
      baselineStabilities: this.entries.filter(e => e.type === 'baselineStability').length,
      finalScores: this.entries.filter(e => e.type === 'finalScore').length,
    };
  }
  
  clear(): void {
    this.entries = [];
  }
}

// ============================================================================
// SINGLETON AUDITOR
// ============================================================================

let auditorInstance: BrainDeploymentAuditor | null = null;

export function getBrainDeploymentAuditor(): BrainDeploymentAuditor {
  if (!auditorInstance) {
    auditorInstance = new BrainDeploymentAuditor();
  }
  return auditorInstance;
}

// TODO Phase P9: ML-Based Learning Model
// Introduce ML-based learning model:
// - Predict regression patterns from historical data
// - Predict deployment failure probability using TensorFlow.js
// - Weight confidence using rolling-window success scores
// - Store learning samples to .odavl/brain-history/
// - Train model on successful vs failed deployments
// - Use model to adjust confidence thresholds dynamically
// Integration point: computeDeploymentConfidence() should call ML predictor
