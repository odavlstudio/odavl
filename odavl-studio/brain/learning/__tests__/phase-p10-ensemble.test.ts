/**
 * Phase P10: Advanced ML Features Tests
 * 
 * Tests for:
 * - LSTM trend prediction
 * - Gzip compression
 * - Ensemble prediction system
 * - Integration with computeDeploymentConfidence
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { BrainLSTMModel, type LSTMSample } from '../learning-model';
import { BrainHistoryStore } from '../history-store';
import { predictFailureProbabilityEnsemble } from '../predictors';
import { computeDeploymentConfidence } from '../../runtime/runtime-deployment-confidence';
import type {
  FileTypeStats,
  GuardianReport,
  BaselineHistory,
} from '../../runtime/runtime-deployment-confidence';

describe('Phase P10: LSTM Trend Prediction', () => {
  let lstmModel: BrainLSTMModel;
  const testModelPath = path.join(process.cwd(), '.odavl', 'ml-models', 'test-lstm');

  beforeEach(() => {
    lstmModel = new BrainLSTMModel();
  });

  afterEach(async () => {
    try {
      await fs.rm(testModelPath, { recursive: true, force: true });
    } catch {
      // Ignore
    }

    if (lstmModel) {
      lstmModel.dispose();
    }
  });

  it('should reject training with <20 samples', async () => {
    const samples = generateLSTMSamples(15);

    await expect(lstmModel.trainLSTM(samples)).rejects.toThrow('at least 20');
  });

  it('should train LSTM with 20+ samples', async () => {
    const samples = generateLSTMSamples(30);

    const metrics = await lstmModel.trainLSTM(samples);

    expect(metrics).toHaveProperty('loss');
    expect(metrics).toHaveProperty('accuracy');
    expect(metrics).toHaveProperty('epochs');
    expect(metrics.loss).toBeGreaterThanOrEqual(0);
    expect(metrics.accuracy).toBeGreaterThanOrEqual(0);
  });

  it('should predict trend from recent samples', async () => {
    const samples = generateLSTMSamples(30);
    await lstmModel.trainLSTM(samples);

    const prediction = await lstmModel.predictTrend(samples);

    expect(prediction).toBeGreaterThanOrEqual(0);
    expect(prediction).toBeLessThanOrEqual(1);
  });

  it('should save and load LSTM model', async () => {
    const samples = generateLSTMSamples(25);
    await lstmModel.trainLSTM(samples);

    const savedPath = await lstmModel.saveLSTMModel();
    expect(savedPath).toContain('brain-lstm-trend');

    const newModel = new BrainLSTMModel();
    const loaded = await newModel.loadLSTMModel();

    expect(loaded).toBe(true);
    expect(newModel.isModelReady()).toBe(true);

    newModel.dispose();
  });

  it('should identify improving trends', async () => {
    const samples = generateLSTMSamples(30, 'improving');
    await lstmModel.trainLSTM(samples);

    const recentSamples = samples.slice(-20);
    const prediction = await lstmModel.predictTrend(recentSamples);

    // Improving trend should predict lower failure probability
    expect(prediction).toBeLessThan(0.5);
  });

  it('should identify degrading trends', async () => {
    const samples = generateLSTMSamples(30, 'degrading');
    await lstmModel.trainLSTM(samples);

    const recentSamples = samples.slice(-20);
    const prediction = await lstmModel.predictTrend(recentSamples);

    // Degrading trend should predict higher failure probability
    expect(prediction).toBeGreaterThan(0.4);
  });
});

describe('Phase P10: Gzip Compression', () => {
  let store: BrainHistoryStore;
  const testHistoryPath = path.join(process.cwd(), '.odavl', 'test-history-p10');

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

  it('should compress samples older than 30 days', async () => {
    // Create old samples (simulate with file modification time)
    for (let i = 0; i < 60; i++) {
      const sample = createMockSample(true);
      await store.saveTrainingSample(sample);
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const compressed = await store.compressOldSamples(0); // 0 days = compress all except last 50

    expect(compressed).toBeGreaterThan(0);
    expect(compressed).toBeLessThanOrEqual(10); // Should compress ~10 files (60 - 50 kept)
  });

  it('should keep last 50 samples uncompressed', async () => {
    // Create 60 samples
    for (let i = 0; i < 60; i++) {
      await store.saveTrainingSample(createMockSample(true));
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    await store.compressOldSamples(0);

    // Check that recent samples are still JSON
    const files = await fs.readdir(testHistoryPath);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.endsWith('.json.gz'));
    const gzipFiles = files.filter(f => f.endsWith('.json.gz'));

    expect(jsonFiles.length).toBeGreaterThanOrEqual(50);
    expect(gzipFiles.length).toBeGreaterThan(0);
  });

  it('should decompress sample correctly', async () => {
    const sample = createMockSample(true);
    const filepath = await store.saveTrainingSample(sample);

    // Compress manually
    await store.compressOldSamples(0);

    // Find compressed file
    const files = await fs.readdir(testHistoryPath);
    const compressedFile = files.find(f => f.endsWith('.json.gz'));

    if (compressedFile) {
      const compressedPath = path.join(testHistoryPath, compressedFile);
      const decompressed = await store.decompressSample(compressedPath);

      expect(decompressed).toHaveProperty('timestamp');
      expect(decompressed).toHaveProperty('outcome');
    }
  });

  it('should decompress regular JSON files', async () => {
    const sample = createMockSample(true);
    const filepath = await store.saveTrainingSample(sample);

    const decompressed = await store.decompressSample(filepath);

    expect(decompressed).toHaveProperty('timestamp');
    expect(decompressed.outcome).toBe(true);
  });
});

describe('Phase P10: Ensemble Prediction', () => {
  it('should combine all models when available', async () => {
    const inputVector = [0.2, 0.85, 0.9, 0.15, 0.0, 0.1, 0.0, 0.2];
    const history = generateHistoryForEnsemble(25);

    const ensemble = await predictFailureProbabilityEnsemble(inputVector, history);

    expect(ensemble).toHaveProperty('nnPrediction');
    expect(ensemble).toHaveProperty('lstmPrediction');
    expect(ensemble).toHaveProperty('heuristicPrediction');
    expect(ensemble).toHaveProperty('ensembleFailureProbability');

    expect(ensemble.heuristicPrediction).toBeGreaterThanOrEqual(0);
    expect(ensemble.heuristicPrediction).toBeLessThanOrEqual(1);
  });

  it('should handle missing LSTM model', async () => {
    const inputVector = [0.2, 0.85, 0.9, 0.15, 0.0, 0.1, 0.0, 0.2];
    const history = generateHistoryForEnsemble(5); // Too few for LSTM

    const ensemble = await predictFailureProbabilityEnsemble(inputVector, history);

    // LSTM should be null
    expect(ensemble.lstmPrediction).toBeNull();

    // Weights should redistribute
    expect(ensemble.weights.lstm).toBe(0);
    expect(ensemble.weights.nn + ensemble.weights.heuristic).toBeCloseTo(1.0, 1);
  });

  it('should fallback to heuristic when all models missing', async () => {
    const inputVector = [0.4, 0.2, 0.3, 0.8, 0.7, 0.6, 0.8, 0.0];

    const ensemble = await predictFailureProbabilityEnsemble(inputVector, []);

    // Only heuristic should be available
    expect(ensemble.weights.heuristic).toBe(1.0);
    expect(ensemble.ensembleFailureProbability).toBe(ensemble.heuristicPrediction);
  });

  it('should weight predictions correctly with all models', async () => {
    const inputVector = [0.2, 0.85, 0.9, 0.15, 0.0, 0.1, 0.0, 0.2];
    const history = generateHistoryForEnsemble(25);

    const ensemble = await predictFailureProbabilityEnsemble(inputVector, history);

    // Check weights sum to 1.0
    const weightSum = ensemble.weights.nn + ensemble.weights.lstm + ensemble.weights.heuristic;
    expect(weightSum).toBeCloseTo(1.0, 2);

    // Ensemble should be weighted average
    if (ensemble.nnPrediction !== null && ensemble.lstmPrediction !== null) {
      const expectedEnsemble =
        ensemble.nnPrediction * ensemble.weights.nn +
        ensemble.lstmPrediction * ensemble.weights.lstm +
        ensemble.heuristicPrediction * ensemble.weights.heuristic;

      expect(ensemble.ensembleFailureProbability).toBeCloseTo(expectedEnsemble, 2);
    }
  });

  it('should produce ensemble within 0-1 range', async () => {
    const inputVector = [0.4, 0.1, 0.2, 0.9, 1.0, 1.0, 1.0, 0.0];
    const history = generateHistoryForEnsemble(25);

    const ensemble = await predictFailureProbabilityEnsemble(inputVector, history);

    expect(ensemble.ensembleFailureProbability).toBeGreaterThanOrEqual(0);
    expect(ensemble.ensembleFailureProbability).toBeLessThanOrEqual(1);
  });
});

describe('Phase P10: Integration Tests', () => {
  it('should use ensemble prediction in computeDeploymentConfidence', async () => {
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

    // ML prediction should be present (even if models not trained)
    expect(decision.mlPrediction).toBeDefined();
  });

  it('should handle ensemble gracefully without trained models', async () => {
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

    // Should not throw, even without trained models
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.confidence).toBeLessThanOrEqual(100);
  });

  it('should disable ML prediction when flag is false', async () => {
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
      enableMLPrediction: false, // Disable ML
    });

    // ML prediction should be undefined
    expect(decision.mlPrediction).toBeUndefined();
  });
});

// ============================================================================
// TEST UTILITIES
// ============================================================================

function generateLSTMSamples(count: number, trend: 'stable' | 'improving' | 'degrading' = 'stable'): LSTMSample[] {
  const samples: LSTMSample[] = [];

  for (let i = 0; i < count; i++) {
    let riskWeight = 0.2 + Math.random() * 0.1;
    let testImpact = 0.8 + Math.random() * 0.15;
    let baselineStability = 0.85 + Math.random() * 0.1;

    // Apply trend
    if (trend === 'improving') {
      const improvement = (i / count) * 0.15;
      testImpact = Math.min(1, testImpact + improvement);
      baselineStability = Math.min(1, baselineStability + improvement);
      riskWeight = Math.max(0.1, riskWeight - improvement);
    } else if (trend === 'degrading') {
      const degradation = (i / count) * 0.15;
      testImpact = Math.max(0.5, testImpact - degradation);
      baselineStability = Math.max(0.6, baselineStability - degradation);
      riskWeight = Math.min(0.4, riskWeight + degradation);
    }

    const volatility = 0.1 + Math.random() * 0.2;

    // Success if metrics are good
    const successScore = testImpact * 0.4 + baselineStability * 0.4 + (1 - riskWeight) * 0.2;
    const outcome = successScore > 0.65 ? 1 : 0;

    samples.push({
      riskWeight,
      testImpact,
      baselineStability,
      volatility,
      outcome,
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
      outcome: Math.random() > 0.3 ? 1 : 0, // 70% success rate
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
