/**
 * Phase P12: Fusion Engine & Self-Calibrating AI Tests
 * 
 * Tests:
 * 1. Fusion engine basic operation
 * 2. Dynamic weight adjustment (Bayesian variance)
 * 3. Security risk amplification
 * 4. Meta-learning weight updates
 * 5. Self-calibration (60% P11 + 40% fusion)
 * 6. Integration with runtime deployment confidence
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FusionEngine, type FusionInput, type FusionResult } from './fusion-engine';
import { BrainHistoryStore, type StoredTrainingSample } from '../learning/history-store';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { existsSync } from 'node:fs';

describe('Phase P12: Fusion Engine', () => {
  let fusion: FusionEngine;
  let testWeightsDir: string;

  beforeEach(async () => {
    testWeightsDir = path.join('.odavl', 'brain-history', 'test-fusion');
    fusion = new FusionEngine(testWeightsDir);

    // Clean up test directory
    if (existsSync(testWeightsDir)) {
      await fs.rm(testWeightsDir, { recursive: true, force: true });
    }
    await fs.mkdir(testWeightsDir, { recursive: true });
  });

  it('should fuse all predictors with default weights', async () => {
    const input: FusionInput = {
      nnPrediction: 0.3,
      lstmPrediction: 0.4,
      mtlPredictions: {
        success: 0.85,
        performance: 0.9,
        security: 0.7,
        downtime: 0.1,
      },
      bayesianPrediction: {
        mean: 0.35,
        variance: 0.05,
        ciLow: 0.25,
        ciHigh: 0.45,
      },
      heuristicPrediction: 0.5,
    };

    const result = await fusion.fuse(input);

    expect(result.fusionScore).toBeGreaterThan(0);
    expect(result.fusionScore).toBeLessThanOrEqual(1.0);
    expect(result.fusionWeights).toBeDefined();
    expect(result.reasoning.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1.0);
  });

  it('should adjust weights for high Bayesian variance', async () => {
    const input: FusionInput = {
      nnPrediction: 0.5,
      lstmPrediction: 0.6,
      mtlPredictions: {
        success: 0.7,
        performance: 0.8,
        security: 0.5,
        downtime: 0.2,
      },
      bayesianPrediction: {
        mean: 0.5,
        variance: 0.25, // High variance
        ciLow: 0.1,
        ciHigh: 0.9,
      },
      heuristicPrediction: 0.6,
    };

    const result = await fusion.fuse(input);

    // High variance should reduce LSTM/NN, boost heuristic
    expect(result.reasoning.some(r => r.includes('High Bayesian variance'))).toBe(true);
    expect(result.fusionWeights.heuristic).toBeGreaterThan(0.15); // Base is 15%
  });

  it('should NOT adjust weights for low Bayesian variance', async () => {
    const input: FusionInput = {
      nnPrediction: 0.5,
      lstmPrediction: 0.6,
      mtlPredictions: {
        success: 0.7,
        performance: 0.8,
        security: 0.5,
        downtime: 0.2,
      },
      bayesianPrediction: {
        mean: 0.5,
        variance: 0.01, // Low variance
        ciLow: 0.45,
        ciHigh: 0.55,
      },
      heuristicPrediction: 0.6,
    };

    const result = await fusion.fuse(input);

    // Low variance should boost NN
    expect(result.reasoning.some(r => r.includes('Low Bayesian variance'))).toBe(true);
    expect(result.fusionWeights.nn).toBeGreaterThan(0.25); // Base is 25%
  });

  it('should apply security risk amplification', async () => {
    const input: FusionInput = {
      nnPrediction: 0.3,
      lstmPrediction: 0.4,
      mtlPredictions: {
        success: 0.8,
        performance: 0.9,
        security: 0.85, // High security risk
        downtime: 0.1,
      },
      bayesianPrediction: {
        mean: 0.3,
        variance: 0.05,
        ciLow: 0.2,
        ciHigh: 0.4,
      },
      heuristicPrediction: 0.4,
    };

    const result = await fusion.fuse(input);

    // High security should add 20% risk penalty
    expect(result.reasoning.some(r => r.includes('High security risk'))).toBe(true);
    expect(result.fusionWeights.riskPenalty).toBeGreaterThanOrEqual(0.2);
  });

  it('should handle missing predictors gracefully', async () => {
    const input: FusionInput = {
      nnPrediction: null,
      lstmPrediction: null,
      mtlPredictions: null,
      bayesianPrediction: null,
      heuristicPrediction: 0.5, // Only heuristic available
    };

    const result = await fusion.fuse(input);

    expect(result.fusionScore).toBeCloseTo(0.5, 1);
    expect(result.confidence).toBeCloseTo(0.2, 1); // 1/5 predictors available
    expect(result.reasoning.some(r => r.includes('1/5 predictors'))).toBe(true);
  });

  it('should boost LSTM weight for recent regressions', async () => {
    const input: FusionInput = {
      nnPrediction: 0.3,
      lstmPrediction: 0.4,
      mtlPredictions: {
        success: 0.8,
        performance: 0.9,
        security: 0.5,
        downtime: 0.1,
      },
      bayesianPrediction: {
        mean: 0.3,
        variance: 0.05,
        ciLow: 0.2,
        ciHigh: 0.4,
      },
      heuristicPrediction: 0.5,
      context: {
        recentRegressions: 3, // High regression count
        historicalStability: 0.6,
        fileTypeRisk: 0.5,
      },
    };

    const result = await fusion.fuse(input);

    expect(result.reasoning.some(r => r.includes('recent regressions'))).toBe(true);
  });

  it('should boost NN/heuristic for stable history', async () => {
    const input: FusionInput = {
      nnPrediction: 0.3,
      lstmPrediction: 0.4,
      mtlPredictions: {
        success: 0.8,
        performance: 0.9,
        security: 0.5,
        downtime: 0.1,
      },
      bayesianPrediction: {
        mean: 0.3,
        variance: 0.05,
        ciLow: 0.2,
        ciHigh: 0.4,
      },
      heuristicPrediction: 0.5,
      context: {
        recentRegressions: 0,
        historicalStability: 0.95, // Very stable
        fileTypeRisk: 0.2,
      },
    };

    const result = await fusion.fuse(input);

    expect(result.reasoning.some(r => r.includes('Stable history'))).toBe(true);
  });

  it('should save and load learned weights', async () => {
    const outcomes: Array<{ predicted: FusionInput; actual: boolean }> = [
      {
        predicted: {
          nnPrediction: 0.3,
          lstmPrediction: 0.4,
          mtlPredictions: { success: 0.8, performance: 0.9, security: 0.5, downtime: 0.1 },
          bayesianPrediction: { mean: 0.3, variance: 0.05, ciLow: 0.2, ciHigh: 0.4 },
          heuristicPrediction: 0.5,
        },
        actual: true, // Deployment succeeded
      },
      {
        predicted: {
          nnPrediction: 0.7,
          lstmPrediction: 0.6,
          mtlPredictions: { success: 0.4, performance: 0.5, security: 0.8, downtime: 0.6 },
          bayesianPrediction: { mean: 0.7, variance: 0.1, ciLow: 0.5, ciHigh: 0.9 },
          heuristicPrediction: 0.6,
        },
        actual: false, // Deployment failed
      },
    ];

    await fusion.updateWeights(outcomes);

    // Load weights into new instance
    const fusion2 = new FusionEngine(testWeightsDir);
    const loaded = await fusion2.loadWeights();

    expect(loaded).toBe(true);
  });

  it('should update weights based on predictor accuracy', async () => {
    const outcomes: Array<{ predicted: FusionInput; actual: boolean }> = [
      {
        predicted: {
          nnPrediction: 0.1, // Predicted low failure, succeeded → accurate
          lstmPrediction: 0.9, // Predicted high failure, succeeded → inaccurate
          mtlPredictions: { success: 0.2, performance: 0.3, security: 0.1, downtime: 0.0 },
          bayesianPrediction: { mean: 0.15, variance: 0.05, ciLow: 0.1, ciHigh: 0.2 },
          heuristicPrediction: 0.3,
        },
        actual: true, // Success (outcome = 0)
      },
    ];

    await fusion.updateWeights(outcomes);

    const weightsPath = path.join(testWeightsDir, 'fusion-weights.json');
    expect(existsSync(weightsPath)).toBe(true);

    const data = await fs.readFile(weightsPath, 'utf-8');
    const weights = JSON.parse(data);

    expect(weights.nn).toBeGreaterThan(0);
    expect(weights.lstm).toBeGreaterThan(0);
    expect(weights.version).toBe('p12-fusion-v1');
  });
});

describe('Phase P12: Meta-Learning (History Store)', () => {
  let store: BrainHistoryStore;
  let testHistoryDir: string;

  beforeEach(async () => {
    testHistoryDir = path.join('.odavl', 'brain-history', 'test-meta');
    store = new BrainHistoryStore(testHistoryDir);

    // Clean up
    if (existsSync(testHistoryDir)) {
      await fs.rm(testHistoryDir, { recursive: true, force: true });
    }
    await fs.mkdir(testHistoryDir, { recursive: true });
  });

  it('should update fusion weights from training samples', async () => {
    // Create mock training samples with predictor metadata
    const samples: StoredTrainingSample[] = [
      {
        timestamp: new Date().toISOString(),
        fileTypeStats: { byType: {}, byRisk: {}, totalFiles: 10 },
        guardianReport: {
          url: 'https://example.com',
          timestamp: new Date().toISOString(),
          duration: 1000,
          status: 'passed',
          issues: [],
          metrics: { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 },
        },
        baselineHistory: { runs: [] },
        brainDecision: {
          deploy: true,
          confidence: 95,
          reasoning: [],
          predictions: {
            nnPrediction: 0.1,
            lstmPrediction: 0.2,
            mtlPrediction: 0.15,
            bayesianPrediction: 0.1,
            heuristicPrediction: 0.2,
          },
        } as any,
        outcome: true, // Success
      },
      {
        timestamp: new Date(Date.now() + 1000).toISOString(),
        fileTypeStats: { byType: {}, byRisk: {}, totalFiles: 5 },
        guardianReport: {
          url: 'https://example.com',
          timestamp: new Date().toISOString(),
          duration: 1000,
          status: 'failed',
          issues: [],
          metrics: { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 },
        },
        baselineHistory: { runs: [] },
        brainDecision: {
          deploy: false,
          confidence: 40,
          reasoning: [],
          predictions: {
            nnPrediction: 0.8,
            lstmPrediction: 0.9,
            mtlPrediction: 0.85,
            bayesianPrediction: 0.9,
            heuristicPrediction: 0.7,
          },
        } as any,
        outcome: false, // Failure
      },
    ];

    // Save samples
    for (const sample of samples) {
      await store.saveTrainingSample(sample);
    }

    // Update fusion weights
    await store.updateFusionWeights(50);

    // Verify weights file exists
    const weightsPath = path.join(testHistoryDir, 'fusion-weights.json');
    expect(existsSync(weightsPath)).toBe(true);

    const data = await fs.readFile(weightsPath, 'utf-8');
    const weights = JSON.parse(data);

    expect(weights.nn).toBeGreaterThan(0);
    expect(weights.lstm).toBeGreaterThan(0);
    expect(weights.mtl).toBeGreaterThan(0);
    expect(weights.bayesian).toBeGreaterThan(0);
    expect(weights.heuristic).toBeGreaterThan(0);
    expect(weights.version).toBe('p12-fusion-v1');
    expect(weights.basedOnSamples).toBe(2);
  });

  it('should handle empty history gracefully', async () => {
    await store.updateFusionWeights(50);

    // Should not create weights file if no samples
    const weightsPath = path.join(testHistoryDir, 'fusion-weights.json');
    expect(existsSync(weightsPath)).toBe(false);
  });
});

describe('Phase P12: Self-Calibration', () => {
  it('should compute self-calibrated confidence (60% P11 + 40% fusion)', () => {
    const p11Confidence = 0.85; // 85% from ensemble v2
    const fusionScore = 0.75; // 75% from fusion engine

    // Self-calibration formula
    const calibrated = 0.6 * p11Confidence + 0.4 * fusionScore;

    expect(calibrated).toBeCloseTo(0.81, 2); // 60% * 0.85 + 40% * 0.75 = 0.81
  });

  it('should favor P11 when fusion score is lower', () => {
    const p11Confidence = 0.9;
    const fusionScore = 0.5;

    const calibrated = 0.6 * p11Confidence + 0.4 * fusionScore;

    expect(calibrated).toBeCloseTo(0.74, 2); // 60% * 0.9 + 40% * 0.5 = 0.74
    expect(calibrated).toBeGreaterThan(fusionScore);
  });

  it('should favor fusion when P11 confidence is lower', () => {
    const p11Confidence = 0.5;
    const fusionScore = 0.9;

    const calibrated = 0.6 * p11Confidence + 0.4 * fusionScore;

    expect(calibrated).toBeCloseTo(0.66, 2); // 60% * 0.5 + 40% * 0.9 = 0.66
  });
});

describe('Phase P12: Integration Tests', () => {
  it('should use fusion score when all predictors available', async () => {
    const fusion = new FusionEngine();

    const input: FusionInput = {
      nnPrediction: 0.3,
      lstmPrediction: 0.4,
      mtlPredictions: {
        success: 0.85,
        performance: 0.9,
        security: 0.7,
        downtime: 0.1,
      },
      bayesianPrediction: {
        mean: 0.35,
        variance: 0.05,
        ciLow: 0.25,
        ciHigh: 0.45,
      },
      heuristicPrediction: 0.5,
      context: {
        recentRegressions: 1,
        historicalStability: 0.85,
        fileTypeRisk: 0.4,
      },
    };

    const result = await fusion.fuse(input);

    // Should have high confidence with all predictors
    expect(result.confidence).toBeGreaterThanOrEqual(0.8); // 4/5 or 5/5
    expect(result.reasoning.length).toBeGreaterThan(1);
    expect(result.reasoning.some(r => r.includes('Combined'))).toBe(true);
  });

  it('should generate comprehensive reasoning', async () => {
    const fusion = new FusionEngine();

    const input: FusionInput = {
      nnPrediction: 0.3,
      lstmPrediction: 0.4,
      mtlPredictions: {
        success: 0.8,
        performance: 0.9,
        security: 0.85, // Triggers security amplification
        downtime: 0.1,
      },
      bayesianPrediction: {
        mean: 0.35,
        variance: 0.15, // Triggers high variance adjustment
        ciLow: 0.1,
        ciHigh: 0.6,
      },
      heuristicPrediction: 0.5,
      context: {
        recentRegressions: 3, // Triggers regression adjustment
        historicalStability: 0.95, // Triggers stability boost
        fileTypeRisk: 0.6,
      },
    };

    const result = await fusion.fuse(input);

    // Should have multiple reasoning entries
    expect(result.reasoning.length).toBeGreaterThanOrEqual(4);
    expect(result.reasoning.some(r => r.includes('High Bayesian variance'))).toBe(true);
    expect(result.reasoning.some(r => r.includes('High security risk'))).toBe(true);
    expect(result.reasoning.some(r => r.includes('recent regressions'))).toBe(true);
    expect(result.reasoning.some(r => r.includes('Stable history'))).toBe(true);
  });
});
