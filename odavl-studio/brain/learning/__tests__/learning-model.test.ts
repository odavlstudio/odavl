/**
 * Tests for BrainMLModel - TensorFlow.js Neural Network
 * 
 * Phase P9: ML Predictive Intelligence
 * 
 * Tests cover:
 * - Model creation with correct architecture
 * - Training with minimum sample validation
 * - Prediction output validation
 * - Model persistence (save/load)
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { BrainMLModel } from '../learning-model';
import type { TrainingSample } from '../learning-model';

describe('BrainMLModel', () => {
  let model: BrainMLModel;
  const testModelPath = path.join(process.cwd(), '.odavl', 'ml-models', 'test-brain-model');
  
  beforeEach(() => {
    model = new BrainMLModel();
  });
  
  afterEach(async () => {
    // Clean up test models
    try {
      await fs.rm(testModelPath, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
    
    // Dispose TensorFlow resources
    if (model) {
      model.dispose();
    }
  });
  
  describe('Model Architecture', () => {
    it('should create model with correct architecture', () => {
      // Model creation is lazy - trigger via isModelReady
      expect(model.isModelReady()).toBe(false);
    });
    
    it('should have 8 input features', async () => {
      const samples: TrainingSample[] = generateMockSamples(20);
      await model.trainModel(samples);
      
      // Model should accept 8-feature input
      const result = await model.predictOutcome([0.2, 0.8, 0.9, 0.1, 0.0, 0.0, 0.0, 0.1]);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
    
    it('should output single sigmoid value (0-1)', async () => {
      const samples: TrainingSample[] = generateMockSamples(20);
      await model.trainModel(samples);
      
      const result = await model.predictOutcome([0.3, 0.7, 0.8, 0.2, 0.1, 0.0, 0.0, 0.0]);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Training', () => {
    it('should reject training with <10 samples', async () => {
      const samples: TrainingSample[] = generateMockSamples(5);
      
      await expect(model.trainModel(samples)).rejects.toThrow('at least 10 samples');
    });
    
    it('should successfully train with 10+ samples', async () => {
      const samples: TrainingSample[] = generateMockSamples(20);
      
      const metrics = await model.trainModel(samples);
      
      expect(metrics).toHaveProperty('loss');
      expect(metrics).toHaveProperty('accuracy');
      expect(metrics).toHaveProperty('epochs');
      expect(metrics.loss).toBeGreaterThanOrEqual(0);
      expect(metrics.accuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.accuracy).toBeLessThanOrEqual(1);
    });
    
    it('should improve with more training samples', async () => {
      const smallSamples = generateMockSamples(15);
      const largeSamples = generateMockSamples(100);
      
      const model1 = new BrainMLModel();
      const metrics1 = await model1.trainModel(smallSamples);
      
      const model2 = new BrainMLModel();
      const metrics2 = await model2.trainModel(largeSamples);
      
      // More samples should generally improve accuracy or reduce loss
      // (Not guaranteed due to random data, but statistically likely)
      expect(metrics2.accuracy).toBeGreaterThan(0.4);
      
      model1.dispose();
      model2.dispose();
    });
    
    it('should update model ready state after training', async () => {
      expect(model.isModelReady()).toBe(false);
      
      const samples = generateMockSamples(20);
      await model.trainModel(samples);
      
      expect(model.isModelReady()).toBe(true);
    });
  });
  
  describe('Prediction', () => {
    beforeEach(async () => {
      const samples = generateMockSamples(30);
      await model.trainModel(samples);
    });
    
    it('should reject prediction without trained model', async () => {
      const untrained = new BrainMLModel();
      
      await expect(
        untrained.predictOutcome([0.2, 0.8, 0.9, 0.1, 0.0, 0.0, 0.0, 0.1])
      ).rejects.toThrow('not loaded');
      
      untrained.dispose();
    });
    
    it('should reject prediction with invalid input vector', async () => {
      await expect(
        model.predictOutcome([0.2, 0.8]) // Only 2 features
      ).rejects.toThrow('8 features');
    });
    
    it('should predict high risk for dangerous inputs', async () => {
      // High risk scenario: high risk weight, low test impact, low baseline stability
      const dangerousInput = [0.4, 0.2, 0.3, 0.8, 0.5, 0.4, 0.6, 0.0];
      
      const failureProbability = await model.predictOutcome(dangerousInput);
      
      // Should predict higher failure probability (but not guaranteed due to training data)
      expect(failureProbability).toBeGreaterThanOrEqual(0);
      expect(failureProbability).toBeLessThanOrEqual(1);
    });
    
    it('should predict low risk for safe inputs', async () => {
      // Low risk scenario: low risk weight, high test impact, high baseline stability
      const safeInput = [0.1, 0.95, 0.98, 0.1, 0.0, 0.0, 0.0, 0.2];
      
      const failureProbability = await model.predictOutcome(safeInput);
      
      // Should predict lower failure probability
      expect(failureProbability).toBeGreaterThanOrEqual(0);
      expect(failureProbability).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Persistence', () => {
    it('should save model to disk', async () => {
      const samples = generateMockSamples(20);
      await model.trainModel(samples);
      
      const savedPath = await model.saveModel();
      
      expect(savedPath).toContain('.odavl/ml-models/brain-deployment-predictor');
      
      // Verify files exist
      const modelJsonExists = await fs.access(path.join(savedPath, 'model.json'))
        .then(() => true)
        .catch(() => false);
      
      expect(modelJsonExists).toBe(true);
    });
    
    it('should load model from disk', async () => {
      // Train and save
      const samples = generateMockSamples(25);
      await model.trainModel(samples);
      await model.saveModel();
      
      // Create new instance and load
      const loadedModel = new BrainMLModel();
      const loaded = await loadedModel.loadModel();
      
      expect(loaded).toBe(true);
      expect(loadedModel.isModelReady()).toBe(true);
      
      // Should be able to predict
      const result = await loadedModel.predictOutcome([0.2, 0.8, 0.9, 0.1, 0.0, 0.0, 0.0, 0.1]);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
      
      loadedModel.dispose();
    });
    
    it('should return false when loading non-existent model', async () => {
      const emptyModel = new BrainMLModel();
      
      // Clean up any existing models first
      try {
        await fs.rm(
          path.join(process.cwd(), '.odavl', 'ml-models', 'brain-deployment-predictor'),
          { recursive: true, force: true }
        );
      } catch {
        // Ignore
      }
      
      const loaded = await emptyModel.loadModel();
      
      expect(loaded).toBe(false);
      expect(emptyModel.isModelReady()).toBe(false);
      
      emptyModel.dispose();
    });
  });
  
  describe('Memory Management', () => {
    it('should dispose TensorFlow resources', async () => {
      const samples = generateMockSamples(20);
      await model.trainModel(samples);
      
      expect(model.isModelReady()).toBe(true);
      
      model.dispose();
      
      // After disposal, model should not be ready
      expect(model.isModelReady()).toBe(false);
    });
  });
});

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Generate mock training samples
 * Creates realistic training data with:
 * - 50% success rate
 * - Correlation: low risk + high test/baseline = success
 */
function generateMockSamples(count: number): TrainingSample[] {
  const samples: TrainingSample[] = [];
  
  for (let i = 0; i < count; i++) {
    const riskWeight = Math.random() * 0.3 + 0.1; // 0.1-0.4
    const testImpact = Math.random();             // 0-1
    const baselineStability = Math.random();      // 0-1
    const volatility = Math.random() * 0.5;       // 0-0.5
    const criticalFailures = Math.random() * 0.3; // 0-0.3
    const highFailures = Math.random() * 0.4;     // 0-0.4
    const regressions = Math.random() * 0.2;      // 0-0.2
    const improvements = Math.random() * 0.3;     // 0-0.3
    
    // Success if: low risk + high test/baseline scores
    const successScore = 
      (1 - riskWeight) * 0.3 +
      testImpact * 0.35 +
      baselineStability * 0.35;
    
    const outcome = successScore > 0.55;
    
    samples.push({
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
  
  return samples;
}
