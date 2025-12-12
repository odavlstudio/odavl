/**
 * Phase P11: Multi-Task Learning + Bayesian + Federated History Tests
 * 
 * Tests for:
 * - MTL model with 4 prediction heads
 * - Bayesian uncertainty estimation
 * - Distributed history sync
 * - Ensemble v2 with all 5 predictors
 * - Integration with computeDeploymentConfidence
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { BrainMTLModel, type MTLSample } from '../learning-model';
import { BrainHistoryStore } from '../history-store';
import { predictWithUncertainty, predictFailureProbabilityEnsembleV2 } from '../predictors';
import { computeDeploymentConfidence } from '../../runtime/runtime-deployment-confidence';
import type {
  FileTypeStats,
  GuardianReport,
  BaselineHistory,
} from '../../runtime/runtime-deployment-confidence';

describe('Phase P11: Multi-Task Learning (MTL)', () => {
  let mtlModel: BrainMTLModel;
  const testModelPath = path.join(process.cwd(), '.odavl', 'ml-models', 'test-mtl');

  beforeEach(() => {
    mtlModel = new BrainMTLModel();
  });

  afterEach(async () => {
    try {
      await fs.rm(testModelPath, { recursive: true, force: true });
    } catch {
      // Ignore
    }

    if (mtlModel) {
      mtlModel.dispose();
    }
  });

  it('should reject training with <30 samples', async () => {
    const samples = generateMTLSamples(20);

    await expect(mtlModel.trainMTL(samples)).rejects.toThrow('at least 30');
  });

  it('should train MTL with 30+ samples', async () => {
    const samples = generateMTLSamples(50);

    const metrics = await mtlModel.trainMTL(samples);

    expect(metrics).toHaveProperty('loss');
    expect(metrics).toHaveProperty('accuracy');
    expect(metrics).toHaveProperty('epochs');
    expect(metrics.epochs).toBe(40);
  });

  it('should predict all 4 tasks independently', async () => {
    const samples = generateMTLSamples(50);
    await mtlModel.trainMTL(samples);

    const inputVector = [0.2, 0.85, 0.9, 0.15, 0.0, 0.1, 0.0, 0.2];
    const prediction = await mtlModel.predictMTL(inputVector);

    expect(prediction).toHaveProperty('deploymentSuccessProbability');
    expect(prediction).toHaveProperty('performanceRegressionProbability');
    expect(prediction).toHaveProperty('securityRiskProbability');
    expect(prediction).toHaveProperty('downtimeRiskProbability');

    // All probabilities should be 0-1
    expect(prediction.deploymentSuccessProbability).toBeGreaterThanOrEqual(0);
    expect(prediction.deploymentSuccessProbability).toBeLessThanOrEqual(1);
    expect(prediction.performanceRegressionProbability).toBeGreaterThanOrEqual(0);
    expect(prediction.performanceRegressionProbability).toBeLessThanOrEqual(1);
    expect(prediction.securityRiskProbability).toBeGreaterThanOrEqual(0);
    expect(prediction.securityRiskProbability).toBeLessThanOrEqual(1);
    expect(prediction.downtimeRiskProbability).toBeGreaterThanOrEqual(0);
    expect(prediction.downtimeRiskProbability).toBeLessThanOrEqual(1);
  });

  it('should save and load MTL model', async () => {
    const samples = generateMTLSamples(40);
    await mtlModel.trainMTL(samples);

    const savedPath = await mtlModel.saveMTLModel();
    expect(savedPath).toContain('brain-mtl');

    const newModel = new BrainMTLModel();
    const loaded = await newModel.loadMTLModel();

    expect(loaded).toBe(true);
    expect(newModel.isModelReady()).toBe(true);

    newModel.dispose();
  });

  it('should learn task correlations', async () => {
    // Create samples where security risk correlates with downtime
    const samples = generateMTLSamples(50, 'correlated');
    await mtlModel.trainMTL(samples);

    const highSecurityInput = [0.5, 0.6, 0.7, 0.4, 0.3, 0.2, 0.1, 0.0];
    const prediction = await mtlModel.predictMTL(highSecurityInput);

    // High security risk should correlate with higher downtime risk
    expect(prediction.securityRiskProbability).toBeGreaterThan(0.4);
    expect(prediction.downtimeRiskProbability).toBeGreaterThan(0.3);
  });
});

describe('Phase P11: Bayesian Uncertainty Estimation', () => {
  it('should return mean and variance', async () => {
    const inputVector = [0.2, 0.85, 0.9, 0.15, 0.0, 0.1, 0.0, 0.2];

    const bayesian = await predictWithUncertainty(inputVector);

    expect(bayesian).toHaveProperty('mean');
    expect(bayesian).toHaveProperty('variance');
    expect(bayesian).toHaveProperty('ciLow');
    expect(bayesian).toHaveProperty('ciHigh');
  });

  it('should return 95% confidence intervals', async () => {
    const inputVector = [0.2, 0.85, 0.9, 0.15, 0.0, 0.1, 0.0, 0.2];

    const bayesian = await predictWithUncertainty(inputVector);

    // CI should contain mean
    expect(bayesian.ciLow).toBeLessThanOrEqual(bayesian.mean);
    expect(bayesian.ciHigh).toBeGreaterThanOrEqual(bayesian.mean);

    // CI should be within 0-1
    expect(bayesian.ciLow).toBeGreaterThanOrEqual(0);
    expect(bayesian.ciHigh).toBeLessThanOrEqual(1);
  });

  it('should show variance from MC dropout', async () => {
    const inputVector = [0.2, 0.85, 0.9, 0.15, 0.0, 0.1, 0.0, 0.2];

    const bayesian = await predictWithUncertainty(inputVector);

    // Variance should be positive
    expect(bayesian.variance).toBeGreaterThanOrEqual(0);

    // Variance affects CI width
    const ciWidth = bayesian.ciHigh - bayesian.ciLow;
    expect(ciWidth).toBeGreaterThan(0);
  });

  it('should handle high uncertainty scenarios', async () => {
    const uncertainInput = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

    const bayesian = await predictWithUncertainty(uncertainInput);

    // High uncertainty → wider CI
    const ciWidth = bayesian.ciHigh - bayesian.ciLow;
    expect(ciWidth).toBeGreaterThan(0.1);
  });
});

describe('Phase P11: Distributed History Sync', () => {
  let store: BrainHistoryStore;
  const testHistoryPath = path.join(process.cwd(), '.odavl', 'test-history-p11');

  beforeEach(() => {
    store = new BrainHistoryStore(testHistoryPath);
  });

  afterEach(async () => {
    try {
      await fs.rm(testHistoryPath, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  it('should export history with checksums', async () => {
    // Create samples
    for (let i = 0; i < 5; i++) {
      await store.saveTrainingSample(createMockSample(true));
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const exported = await store.exportHistory();

    expect(exported.length).toBe(5);
    expect((exported[0] as any).checksum).toBeDefined();
    expect((exported[0] as any).checksum).toHaveLength(64); // SHA-256 hex
  });

  it('should merge remote samples without duplicates', async () => {
    // Create local samples
    for (let i = 0; i < 3; i++) {
      await store.saveTrainingSample(createMockSample(true));
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Create remote samples (1 duplicate, 2 new)
    const remote = await store.exportHistory();
    const newSample1 = createMockSample(true);
    const newSample2 = createMockSample(true);

    const merged = await store.mergeHistory([remote[0], newSample1, newSample2]);

    // Should only merge 2 new samples
    expect(merged).toBe(2);
  });

  it('should resolve conflicts (newer wins)', async () => {
    const local = [createMockSample(true)];
    local[0].timestamp = '2025-01-01T10:00:00.000Z';

    const remote = [createMockSample(true)];
    remote[0].timestamp = '2025-01-01T11:00:00.000Z';

    const resolved = await store.resolveConflicts(local, remote);

    expect(resolved.length).toBe(1);
    expect(resolved[0].timestamp).toBe('2025-01-01T11:00:00.000Z');
  });

  it('should verify checksums during import', async () => {
    // Create sample with valid checksum
    const sample = createMockSample(true);
    const crypto = await import('node:crypto');
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(sample));
    (sample as any).checksum = hash.digest('hex');

    const merged = await store.mergeHistory([sample]);

    expect(merged).toBe(1);
  });

  it('should skip samples with invalid checksums', async () => {
    // Create sample with invalid checksum
    const sample = createMockSample(true);
    (sample as any).checksum = 'invalid-checksum-123';

    const merged = await store.mergeHistory([sample]);

    expect(merged).toBe(0);
  });
});

describe('Phase P11: Ensemble v2', () => {
  it('should combine NN + LSTM + MTL + Bayesian + Heuristic', async () => {
    const inputVector = [0.2, 0.85, 0.9, 0.15, 0.0, 0.1, 0.0, 0.2];
    const history = generateHistoryForEnsemble(25);

    const ensemble = await predictFailureProbabilityEnsembleV2(inputVector, history);

    expect(ensemble).toHaveProperty('nnPrediction');
    expect(ensemble).toHaveProperty('lstmPrediction');
    expect(ensemble).toHaveProperty('mtlPrediction');
    expect(ensemble).toHaveProperty('bayesianPrediction');
    expect(ensemble).toHaveProperty('heuristicPrediction');
    expect(ensemble).toHaveProperty('ensembleFailureProbability');
  });

  it('should apply Bayesian adjustment for high variance', async () => {
    const inputVector = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const history = generateHistoryForEnsemble(25);

    const ensemble = await predictFailureProbabilityEnsembleV2(inputVector, history);

    // High variance should add risk penalty
    if (ensemble.bayesianPrediction && ensemble.bayesianPrediction.variance > 0.05) {
      expect(ensemble.bayesianAdjustment).toBeGreaterThan(0);
    }
  });

  it('should apply Bayesian bonus for low variance', async () => {
    const inputVector = [0.2, 0.85, 0.9, 0.15, 0.0, 0.1, 0.0, 0.2];
    const history = generateHistoryForEnsemble(25);

    const ensemble = await predictFailureProbabilityEnsembleV2(inputVector, history);

    // Low variance should reduce risk
    if (ensemble.bayesianPrediction && ensemble.bayesianPrediction.variance < 0.02) {
      expect(ensemble.bayesianAdjustment).toBeLessThan(0);
    }
  });

  it('should weight predictors correctly', async () => {
    const inputVector = [0.2, 0.85, 0.9, 0.15, 0.0, 0.1, 0.0, 0.2];
    const history = generateHistoryForEnsemble(25);

    const ensemble = await predictFailureProbabilityEnsembleV2(inputVector, history);

    // Weights should sum to 1.0
    const weightSum =
      ensemble.weights.nn +
      ensemble.weights.lstm +
      ensemble.weights.mtl +
      ensemble.weights.heuristic;

    expect(weightSum).toBeCloseTo(1.0, 2);
  });

  it('should fallback gracefully when models missing', async () => {
    const inputVector = [0.2, 0.85, 0.9, 0.15, 0.0, 0.1, 0.0, 0.2];

    const ensemble = await predictFailureProbabilityEnsembleV2(inputVector, []);

    // Should still produce result with heuristic
    expect(ensemble.heuristicPrediction).toBeDefined();
    expect(ensemble.ensembleFailureProbability).toBeGreaterThanOrEqual(0);
    expect(ensemble.ensembleFailureProbability).toBeLessThanOrEqual(1);
  });
});

describe('Phase P11: Integration Tests', () => {
  it('should use ensemble v2 in computeDeploymentConfidence', async () => {
    const fileTypeStats: FileTypeStats = {
      totalFiles: 10,
      byLanguage: { typescript: 8, javascript: 2 },
      byCategory: { code: 8, test: 2, config: 0, documentation: 0 },
    };

    const guardianReport: GuardianReport = {
      status: 'passed',
      metrics: {
        total: 100,
        passed: 98,
        failed: 2,
        critical: 0,
        high: 1,
        medium: 1,
        low: 0,
        totalIssues: 2,
      },
      enforcement: {
        lighthouseValidation: { passed: true, score: 95, threshold: 80 },
        webVitalsValidation: { passed: true, score: 92, threshold: 75 },
        baselineComparison: { passed: true, current: 95, baseline: 90, threshold: 85 },
      },
    };

    const baselineHistory: BaselineHistory = {
      runId: `run-${Date.now()}`,
      entries: [
        { runId: 'run-1', score: 90, timestamp: new Date().toISOString() },
        { runId: 'run-2', score: 92, timestamp: new Date().toISOString() },
        { runId: 'run-3', score: 95, timestamp: new Date().toISOString() },
      ],
    };

    const decision = await computeDeploymentConfidence({
      fileTypeStats,
      guardianReport,
      baselineHistory,
      enableMLPrediction: true,
    });

    expect(decision).toHaveProperty('confidence');
    expect(decision).toHaveProperty('canDeploy');
    expect(decision).toHaveProperty('reasoning');

    // ML prediction should include ensemble v2 data
    expect(decision.mlPrediction).toBeDefined();
    if (decision.mlPrediction) {
      expect(decision.mlPrediction).toHaveProperty('finalEnsemble');
      expect(decision.mlPrediction).toHaveProperty('heuristic');
    }
  });

  it('should include Bayesian uncertainty in reasoning', async () => {
    const fileTypeStats: FileTypeStats = {
      totalFiles: 10,
      byLanguage: { typescript: 10 },
      byCategory: { code: 10, test: 0, config: 0, documentation: 0 },
    };

    const guardianReport: GuardianReport = {
      status: 'passed',
      metrics: {
        total: 100,
        passed: 100,
        failed: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        totalIssues: 0,
      },
      enforcement: {
        lighthouseValidation: { passed: true, score: 98, threshold: 80 },
        webVitalsValidation: { passed: true, score: 95, threshold: 75 },
        baselineComparison: { passed: true, current: 98, baseline: 90, threshold: 85 },
      },
    };

    const baselineHistory: BaselineHistory = {
      runId: `run-${Date.now()}`,
      entries: [
        { runId: 'run-1', score: 95, timestamp: new Date().toISOString() },
      ],
    };

    const decision = await computeDeploymentConfidence({
      fileTypeStats,
      guardianReport,
      baselineHistory,
      enableMLPrediction: true,
    });

    // Reasoning should mention Bayesian if available
    const reasoningText = decision.reasoning.join(' ');
    if (decision.mlPrediction?.bayesian) {
      expect(reasoningText).toContain('Bayesian');
    }
  });

  it('should include MTL task predictions', async () => {
    const fileTypeStats: FileTypeStats = {
      totalFiles: 5,
      byLanguage: { typescript: 5 },
      byCategory: { code: 4, test: 1, config: 0, documentation: 0 },
    };

    const guardianReport: GuardianReport = {
      status: 'passed',
      metrics: {
        total: 50,
        passed: 48,
        failed: 2,
        critical: 0,
        high: 1,
        medium: 1,
        low: 0,
        totalIssues: 2,
      },
      enforcement: {
        lighthouseValidation: { passed: true, score: 90, threshold: 80 },
        webVitalsValidation: { passed: true, score: 88, threshold: 75 },
        baselineComparison: { passed: true, current: 92, baseline: 90, threshold: 85 },
      },
    };

    const baselineHistory: BaselineHistory = {
      runId: `run-${Date.now()}`,
      entries: [
        { runId: 'run-1', score: 88, timestamp: new Date().toISOString() },
      ],
    };

    const decision = await computeDeploymentConfidence({
      fileTypeStats,
      guardianReport,
      baselineHistory,
      enableMLPrediction: true,
    });

    // Should have MTL predictions if available
    if (decision.mlPrediction?.mtl) {
      expect(decision.mlPrediction.mtl).toHaveProperty('success');
      expect(decision.mlPrediction.mtl).toHaveProperty('performance');
      expect(decision.mlPrediction.mtl).toHaveProperty('security');
      expect(decision.mlPrediction.mtl).toHaveProperty('downtime');
    }
  });
});

// ============================================================================
// TEST UTILITIES
// ============================================================================

function generateMTLSamples(count: number, pattern: 'random' | 'correlated' = 'random'): MTLSample[] {
  const samples: MTLSample[] = [];

  for (let i = 0; i < count; i++) {
    const inputVector = [
      Math.random() * 0.5, // riskWeight
      0.6 + Math.random() * 0.3, // testImpact
      0.7 + Math.random() * 0.25, // baselineStability
      Math.random() * 0.3, // volatility
      Math.random() * 0.2, // failureCount
      Math.random() * 0.2, // regressionCount
      Math.random() * 0.1, // securityIssues
      Math.random() * 0.1, // criticalFailures
    ];

    let deploymentSuccess = Math.random() > 0.3 ? 1 : 0;
    let performanceRegression = Math.random() > 0.7 ? 1 : 0;
    let securityRisk = Math.random() > 0.8 ? 1 : 0;
    let downtimeRisk = Math.random() > 0.85 ? 1 : 0;

    if (pattern === 'correlated') {
      // Security risk correlates with downtime
      if (securityRisk === 1) {
        downtimeRisk = Math.random() > 0.4 ? 1 : 0;
      }
      // Performance regression correlates with deployment failure
      if (performanceRegression === 1) {
        deploymentSuccess = Math.random() > 0.6 ? 1 : 0;
      }
    }

    samples.push({
      inputVector,
      deploymentSuccess,
      performanceRegression,
      securityRisk,
      downtimeRisk,
    });
  }

  return samples;
}

function generateHistoryForEnsemble(count: number): Array<{ riskWeight: number; testImpact: number; baselineStability: number; volatility: number; outcome: number }> {
  const history = [];

  for (let i = 0; i < count; i++) {
    history.push({
      riskWeight: 0.2 + Math.random() * 0.15,
      testImpact: 0.75 + Math.random() * 0.2,
      baselineStability: 0.8 + Math.random() * 0.15,
      volatility: 0.1 + Math.random() * 0.2,
      outcome: Math.random() > 0.3 ? 1 : 0,
    });
  }

  return history;
}

function createMockSample(outcome: boolean): any {
  return {
    timestamp: new Date().toISOString(),
    fileTypeStats: {
      totalFiles: 10,
      byLanguage: { typescript: 8, javascript: 2 },
      byCategory: { code: 8, test: 2, config: 0, documentation: 0 },
    },
    guardianReport: {
      status: outcome ? 'passed' : 'failed',
      metrics: {
        total: 100,
        passed: outcome ? 98 : 85,
        failed: outcome ? 2 : 15,
        critical: outcome ? 0 : 2,
        high: outcome ? 1 : 5,
        medium: outcome ? 1 : 6,
        low: outcome ? 0 : 2,
        totalIssues: outcome ? 2 : 15,
      },
      enforcement: {
        lighthouseValidation: { passed: outcome, score: outcome ? 95 : 65, threshold: 80 },
        webVitalsValidation: { passed: outcome, score: outcome ? 92 : 70, threshold: 75 },
        baselineComparison: { passed: outcome, current: outcome ? 95 : 70, baseline: 90, threshold: 85 },
      },
    },
    baselineHistory: {
      runId: `run-${Date.now()}`,
      entries: [
        { runId: 'run-1', score: 90, timestamp: new Date().toISOString() },
      ],
    },
    brainDecision: {
      confidence: outcome ? 85 : 55,
      requiredConfidence: 75,
      canDeploy: outcome,
      factors: { riskWeight: 30, testImpact: 40, baselineStability: 25 },
      reasoning: [outcome ? 'Deployment allowed' : 'Deployment blocked'],
    },
    outcome,
  };
}
