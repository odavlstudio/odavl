/**
 * ODAVL Brain - Fusion Engine
 * Phase P12: Adaptive Multi-Predictor Fusion with Self-Calibration
 * 
 * Unifies all predictors (NN, LSTM, MTL, Bayesian, Heuristic) into one
 * adaptive reasoning core with dynamic weight learning.
 */

import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import type { AutopilotTelemetryEvent } from '../telemetry/autopilot-telemetry.js';

/**
 * Phase P12: Fusion Engine Input
 */
export interface FusionInput {
  // Phase P9: Neural Network prediction
  nnPrediction: number | null;
  
  // Phase P10: LSTM trend prediction
  lstmPrediction: number | null;
  
  // Phase P11: Multi-Task Learning predictions
  mtlPredictions: {
    success: number;
    performance: number;
    security: number;
    downtime: number;
  } | null;
  
  // Phase P11: Bayesian uncertainty
  bayesianPrediction: {
    mean: number;
    variance: number;
    ciLow: number;
    ciHigh: number;
  } | null;
  
  // Always available: Heuristic fallback
  heuristicPrediction: number;
  
  // Context for dynamic weighting
  context?: {
    recentRegressions?: number;
    historicalStability?: number;
    fileTypeRisk?: number;
  };
}

/**
 * Phase P12: Fusion weights (dynamic, learned from outcomes)
 */
export interface FusionWeights {
  nn: number;
  lstm: number;
  mtl: number;
  bayesian: number;
  heuristic: number;
  riskPenalty: number;
}

/**
 * Phase P12: Fusion Engine Result
 */
export interface FusionResult {
  fusionScore: number; // 0-1, unified deployment risk
  fusionWeights: FusionWeights;
  reasoning: string[];
  confidence: number; // 0-1, confidence in fusion score
}

/**
 * Phase P12: Default fusion weights (learned over time)
 */
const DEFAULT_WEIGHTS: FusionWeights = {
  nn: 0.25,
  lstm: 0.15,
  mtl: 0.30,
  bayesian: 0.15,
  heuristic: 0.15,
  riskPenalty: 0.0,
};

/**
 * Phase P12: Fusion Engine
 * 
 * Dynamically combines all predictors with learned weights.
 * Adapts to Bayesian uncertainty, security risks, and historical patterns.
 */
export class FusionEngine {
  private weights: FusionWeights;
  private weightsPath: string;

  constructor(weightsDir: string = '.odavl/brain-history') {
    this.weights = { ...DEFAULT_WEIGHTS };
    this.weightsPath = path.join(weightsDir, 'fusion-weights.json');
  }

  /**
   * Phase P12: Load learned weights from disk
   */
  async loadWeights(): Promise<boolean> {
    try {
      if (!existsSync(this.weightsPath)) {
        return false;
      }

      const data = await readFile(this.weightsPath, 'utf-8');
      const loaded = JSON.parse(data);

      this.weights = {
        nn: loaded.nn ?? DEFAULT_WEIGHTS.nn,
        lstm: loaded.lstm ?? DEFAULT_WEIGHTS.lstm,
        mtl: loaded.mtl ?? DEFAULT_WEIGHTS.mtl,
        bayesian: loaded.bayesian ?? DEFAULT_WEIGHTS.bayesian,
        heuristic: loaded.heuristic ?? DEFAULT_WEIGHTS.heuristic,
        riskPenalty: loaded.riskPenalty ?? DEFAULT_WEIGHTS.riskPenalty,
      };

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Phase P12: Save learned weights to disk
   */
  async saveWeights(): Promise<void> {
    const dirPath = path.dirname(this.weightsPath);

    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }

    const data = {
      ...this.weights,
      lastUpdated: new Date().toISOString(),
      version: 'p12-fusion-v1',
    };

    await writeFile(this.weightsPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Phase P12: Run fusion engine with all predictors
   */
  async fuse(input: FusionInput): Promise<FusionResult> {
    // Load learned weights
    await this.loadWeights();

    const reasoning: string[] = [];
    let adjustedWeights = { ...this.weights };

    // Phase P12: Dynamic weight adjustment based on Bayesian uncertainty
    if (input.bayesianPrediction) {
      const variance = input.bayesianPrediction.variance;

      if (variance > 0.1) {
        // High variance → reduce LSTM and NN impact
        adjustedWeights.lstm *= 0.6;
        adjustedWeights.nn *= 0.7;
        adjustedWeights.heuristic *= 1.3;
        reasoning.push('🔴 Fusion: High Bayesian variance → down-weighting LSTM & NN, boosting heuristic');
      } else if (variance < 0.03) {
        // Low variance → trust ML models more
        adjustedWeights.nn *= 1.2;
        adjustedWeights.lstm *= 1.1;
        adjustedWeights.heuristic *= 0.8;
        reasoning.push('🟢 Fusion: Low Bayesian variance → boosting NN & LSTM confidence');
      }
    }

    // Phase P12: Security risk amplification (MTL security head)
    if (input.mtlPredictions && input.mtlPredictions.security > 0.7) {
      adjustedWeights.riskPenalty += 0.2;
      reasoning.push(`🔒 Fusion: High security risk (${(input.mtlPredictions.security * 100).toFixed(1)}%) → adding 20% risk penalty`);
    }

    // Phase P12: Stability-based adjustment
    if (input.context) {
      if (input.context.recentRegressions && input.context.recentRegressions > 2) {
        adjustedWeights.lstm *= 1.3;
        reasoning.push(`📉 Fusion: ${input.context.recentRegressions} recent regressions → amplifying LSTM trend weight`);
      }

      if (input.context.historicalStability && input.context.historicalStability > 0.9) {
        adjustedWeights.nn *= 1.2;
        adjustedWeights.heuristic *= 1.1;
        reasoning.push('📈 Fusion: Stable history → boosting NN & heuristic');
      }
    }

    // Phase P12: Normalize adjusted weights
    const totalWeight =
      adjustedWeights.nn +
      adjustedWeights.lstm +
      adjustedWeights.mtl +
      adjustedWeights.bayesian +
      adjustedWeights.heuristic;

    const normalizedWeights: FusionWeights = {
      nn: adjustedWeights.nn / totalWeight,
      lstm: adjustedWeights.lstm / totalWeight,
      mtl: adjustedWeights.mtl / totalWeight,
      bayesian: adjustedWeights.bayesian / totalWeight,
      heuristic: adjustedWeights.heuristic / totalWeight,
      riskPenalty: adjustedWeights.riskPenalty,
    };

    // Phase P12: Compute weighted fusion score
    let fusionScore = 0;
    let availablePredictors = 0;

    if (input.nnPrediction !== null) {
      fusionScore += input.nnPrediction * normalizedWeights.nn;
      availablePredictors++;
    }

    if (input.lstmPrediction !== null) {
      fusionScore += input.lstmPrediction * normalizedWeights.lstm;
      availablePredictors++;
    }

    if (input.mtlPredictions) {
      fusionScore += input.mtlPredictions.success * normalizedWeights.mtl;
      availablePredictors++;
    }

    if (input.bayesianPrediction) {
      fusionScore += input.bayesianPrediction.mean * normalizedWeights.bayesian;
      availablePredictors++;
    }

    // Heuristic always available
    fusionScore += input.heuristicPrediction * normalizedWeights.heuristic;
    availablePredictors++;

    // Phase P12: Apply risk penalty
    fusionScore = Math.min(1.0, fusionScore + normalizedWeights.riskPenalty);

    // Phase P12: Confidence based on predictor availability
    const confidence = availablePredictors / 5; // Max 5 predictors

    reasoning.push(`🧠 Fusion: Combined ${availablePredictors}/5 predictors → score ${(fusionScore * 100).toFixed(1)}%`);

    return {
      fusionScore,
      fusionWeights: normalizedWeights,
      reasoning,
      confidence,
    };
  }

  /**
   * Phase P12: Update weights based on historical accuracy
   * 
   * @param outcomes - Array of {predicted, actual} pairs from last N deployments
   */
  async updateWeights(outcomes: Array<{ predicted: FusionInput; actual: boolean }>): Promise<void> {
    if (outcomes.length === 0) {
      return;
    }

    // Phase P12: Compute per-predictor accuracy
    const accuracy = {
      nn: [] as number[],
      lstm: [] as number[],
      mtl: [] as number[],
      bayesian: [] as number[],
      heuristic: [] as number[],
    };

    for (const { predicted, actual } of outcomes) {
      const actualValue = actual ? 0 : 1; // 0 = success, 1 = failure

      if (predicted.nnPrediction !== null) {
        const error = Math.abs(predicted.nnPrediction - actualValue);
        accuracy.nn.push(1 - error);
      }

      if (predicted.lstmPrediction !== null) {
        const error = Math.abs(predicted.lstmPrediction - actualValue);
        accuracy.lstm.push(1 - error);
      }

      if (predicted.mtlPredictions) {
        const error = Math.abs(predicted.mtlPredictions.success - actualValue);
        accuracy.mtl.push(1 - error);
      }

      if (predicted.bayesianPrediction) {
        const error = Math.abs(predicted.bayesianPrediction.mean - actualValue);
        accuracy.bayesian.push(1 - error);
      }

      const heuristicError = Math.abs(predicted.heuristicPrediction - actualValue);
      accuracy.heuristic.push(1 - heuristicError);
    }

    // Phase P12: Compute mean accuracy per predictor
    const meanAccuracy = {
      nn: accuracy.nn.length > 0 ? accuracy.nn.reduce((a, b) => a + b) / accuracy.nn.length : 0.5,
      lstm: accuracy.lstm.length > 0 ? accuracy.lstm.reduce((a, b) => a + b) / accuracy.lstm.length : 0.5,
      mtl: accuracy.mtl.length > 0 ? accuracy.mtl.reduce((a, b) => a + b) / accuracy.mtl.length : 0.5,
      bayesian: accuracy.bayesian.length > 0 ? accuracy.bayesian.reduce((a, b) => a + b) / accuracy.bayesian.length : 0.5,
      heuristic: accuracy.heuristic.reduce((a, b) => a + b) / accuracy.heuristic.length,
    };

    // Phase P12: Adjust weights proportionally to accuracy
    const totalAccuracy =
      meanAccuracy.nn + meanAccuracy.lstm + meanAccuracy.mtl + meanAccuracy.bayesian + meanAccuracy.heuristic;

    this.weights = {
      nn: meanAccuracy.nn / totalAccuracy,
      lstm: meanAccuracy.lstm / totalAccuracy,
      mtl: meanAccuracy.mtl / totalAccuracy,
      bayesian: meanAccuracy.bayesian / totalAccuracy,
      heuristic: meanAccuracy.heuristic / totalAccuracy,
      riskPenalty: 0.0, // Reset risk penalty
    };

    await this.saveWeights();
  }

  /**
   * OMEGA-P6 Phase 3: Update fusion weights from telemetry events
   * 
   * Learns optimal predictor weights from real-world deployment outcomes.
   * Uses exponential smoothing with success rate calculation.
   * 
   * Algorithm:
   * 1. Aggregate success/failure per predictor from telemetry
   * 2. Compute success rate per predictor
   * 3. Update: newWeight = oldWeight * 0.8 + successRate * 0.2
   * 4. Normalize: sum(weights) = 1
   * 5. Clamp: [0.05, 0.70] per weight
   * 6. Save atomically to fusion-weights.json
   */
  async updateFusionWeightsFromTelemetry(events: AutopilotTelemetryEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    try {
      // Load current weights
      await this.loadWeights();
      const oldWeights = { ...this.weights };

      // Aggregate success/failure per predictor
      const predictorStats = {
        nn: { successes: 0, failures: 0 },
        lstm: { successes: 0, failures: 0 },
        mtl: { successes: 0, failures: 0 },
        bayesian: { successes: 0, failures: 0 },
        heuristic: { successes: 0, failures: 0 },
      };

      for (const event of events) {
        const success = event.guardian.canDeploy && event.brain.improvement >= 0;

        // For now, assume all predictors participated (real implementation would track per-predictor)
        // This is a simplified aggregation - in production, each predictor's contribution would be tracked
        if (success) {
          predictorStats.nn.successes++;
          predictorStats.lstm.successes++;
          predictorStats.mtl.successes++;
          predictorStats.bayesian.successes++;
          predictorStats.heuristic.successes++;
        } else {
          predictorStats.nn.failures++;
          predictorStats.lstm.failures++;
          predictorStats.mtl.failures++;
          predictorStats.bayesian.failures++;
          predictorStats.heuristic.failures++;
        }
      }

      // Compute success rate per predictor
      const successRates: Record<string, number> = {};
      for (const [predictor, stats] of Object.entries(predictorStats)) {
        const total = stats.successes + stats.failures;
        successRates[predictor] = total > 0 ? stats.successes / total : 0.5;
      }

      // OMEGA-P8: Load adaptive learning rate for fusion weight updates
      let fusionLearningRate = 0.2; // Default: 20% new, 80% old
      try {
        const adaptiveStatePath = path.join(process.cwd(), '.odavl', 'brain-history', 'adaptive', 'state.json');
        if (existsSync(adaptiveStatePath)) {
          const adaptiveContent = await readFile(adaptiveStatePath, 'utf8');
          const adaptiveState = JSON.parse(adaptiveContent);
          fusionLearningRate = adaptiveState.fusionLearningRate || 0.2;
        }
      } catch {
        // Use default learning rate
      }

      // Update weights: newWeight = oldWeight * (1 - fusionLR) + successRate * fusionLR
      const newWeights: Record<string, number> = {};
      for (const predictor of ['nn', 'lstm', 'mtl', 'bayesian', 'heuristic']) {
        newWeights[predictor] = 
          oldWeights[predictor as keyof FusionWeights] * (1 - fusionLearningRate) + 
          successRates[predictor] * fusionLearningRate;
      }

      // Normalize: sum(weights) = 1
      const totalWeight = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
      for (const key in newWeights) {
        newWeights[key] /= totalWeight;
      }

      // Clamp each weight to [0.05, 0.70]
      for (const key in newWeights) {
        newWeights[key] = Math.max(0.05, Math.min(0.70, newWeights[key]));
      }

      // Re-normalize after clamping
      const totalAfterClamp = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
      for (const key in newWeights) {
        newWeights[key] /= totalAfterClamp;
      }

      // Update weights object
      this.weights = {
        nn: newWeights.nn,
        lstm: newWeights.lstm,
        mtl: newWeights.mtl,
        bayesian: newWeights.bayesian,
        heuristic: newWeights.heuristic,
        riskPenalty: oldWeights.riskPenalty, // Preserve risk penalty
      };

      // Save atomically (temp file + rename)
      const dirPath = path.dirname(this.weightsPath);
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }

      const tempPath = this.weightsPath + '.tmp';
      const data = {
        ...this.weights,
        lastUpdated: new Date().toISOString(),
        version: 'omega-p6-fusion-v1',
        telemetryEventsProcessed: events.length,
      };

      await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      await rename(tempPath, this.weightsPath);

    } catch (error) {
      console.warn('[FusionEngine] Failed to update weights from telemetry:', error);
    }
  }
}
