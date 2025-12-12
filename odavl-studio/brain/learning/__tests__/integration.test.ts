/**
 * Integration Tests for Phase P9 ML System
 * 
 * Tests the complete ML workflow:
 * - Train model with historical data
 * - Save training samples
 * - Load model and make predictions
 * - Adjust confidence based on predictions
 * - Verify end-to-end integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { BrainMLModel, type TrainingSample } from '../learning-model';
import { BrainHistoryStore, type StoredTrainingSample } from '../history-store';
import {
  buildInputVector,
  predictEnhancedConfidence,
} from '../predictors';
import { computeDeploymentConfidence } from '../../runtime/runtime-deployment-confidence';
import type {
  FileTypeStats,
  GuardianReport,
  BaselineHistory,
} from '../../runtime/runtime-deployment-confidence';

describe('Phase P9 ML Integration', () => {
  const testPaths = {
    mlModels: path.join(process.cwd(), '.odavl', 'ml-models', 'test-integration'),
    history: path.join(process.cwd(), '.odavl', 'brain-history'),
  };
  
  let mlModel: BrainMLModel;
  let historyStore: BrainHistoryStore;
  
  beforeAll(async () => {
    mlModel = new BrainMLModel();
    historyStore = new BrainHistoryStore();
  });
  
  afterAll(async () => {
    // Clean up test files
    try {
      await fs.rm(testPaths.mlModels, { recursive: true, force: true });
      await fs.rm(testPaths.history, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
    
    if (mlModel) {
      mlModel.dispose();
    }
  });
  
  it('should complete full ML workflow', async () => {
    // 1. Generate training data
    const trainingSamples: TrainingSample[] = [];
    
    for (let i = 0; i < 30; i++) {
      const riskWeight = Math.random() * 0.3 + 0.1;
      const testImpact = Math.random();
      const baselineStability = Math.random();
      const volatility = Math.random() * 0.5;
      const criticalFailures = Math.random() * 0.3;
      const highFailures = Math.random() * 0.4;
      const regressions = Math.random() * 0.2;
      const improvements = Math.random() * 0.3;
      
      // Success more likely with low risk + high test/baseline
      const successScore = 
        (1 - riskWeight) * 0.3 +
        testImpact * 0.35 +
        baselineStability * 0.35;
      
      const outcome = successScore > 0.55;
      
      trainingSamples.push({
        features: [
          riskWeight,
          testImpact,
          baselineStability,
          volatility,
          criticalFailures,
          highFailures,
          regressions,
          improvements,
        ],
        outcome,
      });
    }
    
    // 2. Train model
    const metrics = await mlModel.trainModel(trainingSamples);
    
    expect(metrics.accuracy).toBeGreaterThan(0.4);
    expect(metrics.loss).toBeGreaterThanOrEqual(0);
    expect(mlModel.isModelReady()).toBe(true);
    
    // 3. Make prediction
    const testInput = [0.2, 0.85, 0.9, 0.15, 0.0, 0.1, 0.0, 0.2];
    const failureProbability = await mlModel.predictOutcome(testInput);
    
    expect(failureProbability).toBeGreaterThanOrEqual(0);
    expect(failureProbability).toBeLessThanOrEqual(1);
    
    // 4. Adjust confidence
    const baseConfidence = 80;
    const enhanced = predictEnhancedConfidence({
      confidence: baseConfidence,
      predictionProbability: failureProbability,
      modelConfidence: metrics.accuracy,
    });
    
    expect(enhanced.adjustedConfidence).toBeGreaterThanOrEqual(0);
    expect(enhanced.adjustedConfidence).toBeLessThanOrEqual(100);
    expect(enhanced.mlPrediction.failureProbability).toBe(failureProbability);
  });
  
  it('should integrate with computeDeploymentConfidence', async () => {
    // Create mock inputs
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
    
    // Compute with ML enabled (default)
    const decisionWithML = await computeDeploymentConfidence({
      fileTypeStats,
      guardianReport,
      baselineHistory,
      enableMLPrediction: true,
    });
    
    // Compute without ML
    const decisionWithoutML = await computeDeploymentConfidence({
      fileTypeStats,
      guardianReport,
      baselineHistory,
      enableMLPrediction: false,
    });
    
    // Both should produce valid decisions
    expect(decisionWithML.confidence).toBeGreaterThanOrEqual(0);
    expect(decisionWithML.confidence).toBeLessThanOrEqual(100);
    expect(decisionWithoutML.confidence).toBeGreaterThanOrEqual(0);
    expect(decisionWithoutML.confidence).toBeLessThanOrEqual(100);
    
    // ML version might have mlPrediction metadata (if model trained)
    // Non-ML version should not
    expect(decisionWithoutML.mlPrediction).toBeUndefined();
  });
  
  it('should save and load training history', async () => {
    // Create mock stored sample
    const sample: StoredTrainingSample = {
      timestamp: new Date().toISOString(),
      fileTypeStats: {
        totalFiles: 10,
        byLanguage: { typescript: 8, javascript: 2 },
        byCategory: { code: 8, test: 2, config: 0, documentation: 0 },
      },
      guardianReport: {
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
      },
      baselineHistory: {
        runId: `run-${Date.now()}`,
        entries: [
          { runId: 'run-1', score: 90, timestamp: new Date().toISOString() },
        ],
      },
      brainDecision: {
        confidence: 85,
        requiredConfidence: 75,
        canDeploy: true,
        factors: { riskWeight: 30, testImpact: 40, baselineStability: 25 },
        reasoning: ['Deployment allowed'],
      },
      outcome: true,
    };
    
    // Save sample
    const filepath = await historyStore.saveTrainingSample(sample);
    expect(filepath).toContain('.odavl/brain-history/training-');
    
    // Load samples
    const loaded = await historyStore.loadLastNSamples(10);
    expect(loaded.length).toBeGreaterThan(0);
    
    // Verify sample structure
    const loadedSample = loaded[0];
    expect(loadedSample).toHaveProperty('timestamp');
    expect(loadedSample).toHaveProperty('fileTypeStats');
    expect(loadedSample).toHaveProperty('guardianReport');
    expect(loadedSample).toHaveProperty('baselineHistory');
    expect(loadedSample).toHaveProperty('brainDecision');
    expect(loadedSample).toHaveProperty('outcome');
  });
  
  it('should generate rolling window analytics', async () => {
    // Save multiple samples
    for (let i = 0; i < 10; i++) {
      const outcome = i < 7; // 70% success rate
      
      const sample: StoredTrainingSample = {
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
          runId: `run-${Date.now()}-${i}`,
          entries: [
            { runId: `run-${i}`, score: outcome ? 95 : 75, timestamp: new Date().toISOString() },
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
      
      await historyStore.saveTrainingSample(sample);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Get analytics
    const stats = await historyStore.getRollingWindowStats(10);
    
    expect(stats.totalSamples).toBe(10);
    expect(stats.successRate).toBeCloseTo(0.7, 1);
    expect(stats.averageConfidence).toBeGreaterThan(0);
    expect(stats.commonFailurePatterns.length).toBeGreaterThan(0);
  });
});
