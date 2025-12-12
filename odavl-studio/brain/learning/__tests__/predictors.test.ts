/**
 * Tests for ML Predictors & Confidence Adjustment
 * 
 * Phase P9: ML Predictive Intelligence
 * 
 * Tests cover:
 * - Input vector construction
 * - Risk level prediction
 * - Heuristic failure probability
 * - Enhanced confidence adjustment
 * - Model confidence calculation
 */

import { describe, it, expect } from 'vitest';
import {
  buildInputVector,
  predictDeploymentRisk,
  predictFailureProbability,
  predictEnhancedConfidence,
  calculateModelConfidence,
} from '../predictors';
import type {
  RiskClassification,
  TestImpact,
  BaselineStability,
} from '../../runtime/runtime-deployment-confidence';

describe('ML Predictors', () => {
  describe('buildInputVector', () => {
    it('should create 8-feature vector', () => {
      const input = {
        riskClassification: createMockRisk('medium', 0.25),
        testImpact: createMockTestImpact(85),
        baselineStability: createMockBaseline(90),
      };
      
      const vector = buildInputVector(input);
      
      expect(vector.features).toHaveLength(8);
      expect(vector.featureNames).toHaveLength(8);
    });
    
    it('should normalize features to 0-1 range', () => {
      const input = {
        riskClassification: createMockRisk('high', 0.35),
        testImpact: createMockTestImpact(75),
        baselineStability: createMockBaseline(80),
      };
      
      const vector = buildInputVector(input);
      
      // All features should be 0-1
      for (const feature of vector.features) {
        expect(feature).toBeGreaterThanOrEqual(0);
        expect(feature).toBeLessThanOrEqual(1);
      }
    });
    
    it('should handle extreme values', () => {
      const input = {
        riskClassification: createMockRisk('critical', 0.4),
        testImpact: createMockTestImpact(0, { critical: 10, high: 8 }),
        baselineStability: createMockBaseline(0, { volatility: 1.0, regressions: 10 }),
      };
      
      const vector = buildInputVector(input);
      
      // Should clamp values to 0-1
      for (const feature of vector.features) {
        expect(feature).toBeGreaterThanOrEqual(0);
        expect(feature).toBeLessThanOrEqual(1);
      }
    });
  });
  
  describe('predictDeploymentRisk', () => {
    it('should classify low risk correctly', () => {
      const inputVector = [0.1, 0.95, 0.98, 0.05, 0.0, 0.0, 0.0, 0.2];
      
      const risk = predictDeploymentRisk(inputVector);
      
      expect(risk).toBe('low');
    });
    
    it('should classify medium risk correctly', () => {
      const inputVector = [0.25, 0.75, 0.7, 0.3, 0.1, 0.1, 0.1, 0.1];
      
      const risk = predictDeploymentRisk(inputVector);
      
      expect(risk).toBe('medium');
    });
    
    it('should classify high risk correctly', () => {
      const inputVector = [0.35, 0.5, 0.5, 0.6, 0.3, 0.2, 0.3, 0.0];
      
      const risk = predictDeploymentRisk(inputVector);
      
      expect(risk).toBe('high');
    });
    
    it('should classify critical risk correctly', () => {
      const inputVector = [0.4, 0.2, 0.3, 0.8, 0.7, 0.6, 0.8, 0.0];
      
      const risk = predictDeploymentRisk(inputVector);
      
      expect(risk).toBe('critical');
    });
  });
  
  describe('predictFailureProbability', () => {
    it('should predict low failure for safe deployments', () => {
      const safeInput = [0.1, 0.95, 0.98, 0.05, 0.0, 0.0, 0.0, 0.2];
      
      const probability = predictFailureProbability(safeInput);
      
      expect(probability).toBeGreaterThanOrEqual(0);
      expect(probability).toBeLessThan(0.4);
    });
    
    it('should predict high failure for dangerous deployments', () => {
      const dangerousInput = [0.4, 0.2, 0.3, 0.8, 0.7, 0.6, 0.8, 0.0];
      
      const probability = predictFailureProbability(dangerousInput);
      
      expect(probability).toBeGreaterThan(0.6);
      expect(probability).toBeLessThanOrEqual(1);
    });
    
    it('should weight critical failures heavily', () => {
      const withCritical = [0.2, 0.8, 0.9, 0.2, 0.8, 0.1, 0.0, 0.1]; // High critical failures
      const withoutCritical = [0.2, 0.8, 0.9, 0.2, 0.0, 0.1, 0.0, 0.1]; // No critical failures
      
      const probWithCritical = predictFailureProbability(withCritical);
      const probWithoutCritical = predictFailureProbability(withoutCritical);
      
      // Critical failures should significantly increase failure probability
      expect(probWithCritical).toBeGreaterThan(probWithoutCritical);
      expect(probWithCritical - probWithoutCritical).toBeGreaterThan(0.3);
    });
    
    it('should return value between 0-1', () => {
      const extremeInput = [1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0];
      
      const probability = predictFailureProbability(extremeInput);
      
      expect(probability).toBeGreaterThanOrEqual(0);
      expect(probability).toBeLessThanOrEqual(1);
    });
  });
  
  describe('predictEnhancedConfidence', () => {
    it('should reduce confidence for high failure risk (>0.70)', () => {
      const baseConfidence = 80;
      const highFailureRisk = 0.75;
      
      const enhanced = predictEnhancedConfidence({
        confidence: baseConfidence,
        predictionProbability: highFailureRisk,
        modelConfidence: 0.85,
      });
      
      expect(enhanced.adjustedConfidence).toBeLessThan(baseConfidence);
      
      // Should reduce by ~20%
      const expectedReduction = baseConfidence * 0.2;
      expect(enhanced.adjustedConfidence).toBeCloseTo(baseConfidence - expectedReduction, 0);
      
      expect(enhanced.adjustmentReason).toContain('high failure risk');
      expect(enhanced.adjustmentReason).toContain('reduced by 20%');
    });
    
    it('should not adjust confidence for medium failure risk (0.40-0.70)', () => {
      const baseConfidence = 75;
      const mediumFailureRisk = 0.55;
      
      const enhanced = predictEnhancedConfidence({
        confidence: baseConfidence,
        predictionProbability: mediumFailureRisk,
        modelConfidence: 0.85,
      });
      
      expect(enhanced.adjustedConfidence).toBe(baseConfidence);
      expect(enhanced.adjustmentReason).toContain('moderate risk');
      expect(enhanced.adjustmentReason).toContain('no adjustment');
    });
    
    it('should boost confidence for low failure risk (<0.40)', () => {
      const baseConfidence = 85;
      const lowFailureRisk = 0.25;
      
      const enhanced = predictEnhancedConfidence({
        confidence: baseConfidence,
        predictionProbability: lowFailureRisk,
        modelConfidence: 0.9,
      });
      
      expect(enhanced.adjustedConfidence).toBeGreaterThan(baseConfidence);
      
      // Should boost by ~10%
      const expectedBoost = baseConfidence * 0.1;
      expect(enhanced.adjustedConfidence).toBeCloseTo(baseConfidence + expectedBoost, 0);
      
      expect(enhanced.adjustmentReason).toContain('low failure risk');
      expect(enhanced.adjustmentReason).toContain('boosted by 10%');
    });
    
    it('should clamp adjusted confidence to 0-100', () => {
      // Test clamping at lower bound
      const lowConfidence = 15;
      const highRisk = 0.85;
      
      const enhancedLow = predictEnhancedConfidence({
        confidence: lowConfidence,
        predictionProbability: highRisk,
        modelConfidence: 0.8,
      });
      
      expect(enhancedLow.adjustedConfidence).toBeGreaterThanOrEqual(0);
      
      // Test clamping at upper bound
      const highConfidence = 95;
      const lowRisk = 0.2;
      
      const enhancedHigh = predictEnhancedConfidence({
        confidence: highConfidence,
        predictionProbability: lowRisk,
        modelConfidence: 0.9,
      });
      
      expect(enhancedHigh.adjustedConfidence).toBeLessThanOrEqual(100);
    });
    
    it('should include ML prediction metadata', () => {
      const enhanced = predictEnhancedConfidence({
        confidence: 80,
        predictionProbability: 0.6,
        modelConfidence: 0.85,
      });
      
      expect(enhanced).toHaveProperty('originalConfidence');
      expect(enhanced).toHaveProperty('adjustedConfidence');
      expect(enhanced).toHaveProperty('adjustmentReason');
      expect(enhanced).toHaveProperty('mlPrediction');
      
      expect(enhanced.mlPrediction).toHaveProperty('failureProbability');
      expect(enhanced.mlPrediction).toHaveProperty('confidence');
      expect(enhanced.mlPrediction).toHaveProperty('riskLevel');
    });
  });
  
  describe('calculateModelConfidence', () => {
    it('should use accuracy as base confidence', () => {
      const confidence = calculateModelConfidence({
        accuracy: 0.85,
        loss: 0.3,
        sampleSize: 100,
      });
      
      expect(confidence).toBeCloseTo(0.85, 1);
    });
    
    it('should penalize high loss (>0.5)', () => {
      const lowLossConf = calculateModelConfidence({
        accuracy: 0.85,
        loss: 0.3,
        sampleSize: 100,
      });
      
      const highLossConf = calculateModelConfidence({
        accuracy: 0.85,
        loss: 0.7,
        sampleSize: 100,
      });
      
      expect(highLossConf).toBeLessThan(lowLossConf);
    });
    
    it('should penalize small sample sizes', () => {
      const largeConf = calculateModelConfidence({
        accuracy: 0.85,
        loss: 0.3,
        sampleSize: 200,
      });
      
      const mediumConf = calculateModelConfidence({
        accuracy: 0.85,
        loss: 0.3,
        sampleSize: 75,
      });
      
      const smallConf = calculateModelConfidence({
        accuracy: 0.85,
        loss: 0.3,
        sampleSize: 30,
      });
      
      expect(mediumConf).toBeLessThan(largeConf);
      expect(smallConf).toBeLessThan(mediumConf);
    });
    
    it('should return value between 0-1', () => {
      const confidence = calculateModelConfidence({
        accuracy: 0.95,
        loss: 0.2,
        sampleSize: 500,
      });
      
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });
});

// ============================================================================
// TEST UTILITIES
// ============================================================================

function createMockRisk(
  category: 'low' | 'medium' | 'high' | 'critical',
  riskWeight: number
): RiskClassification {
  return {
    riskCategory: category,
    riskWeight,
    dominantFileTypes: ['typescript', 'javascript'],
  };
}

function createMockTestImpact(
  score: number,
  overrides?: { critical?: number; high?: number }
): TestImpact {
  return {
    score,
    criticalFailures: overrides?.critical ?? 0,
    highFailures: overrides?.high ?? 0,
    totalFailures: (overrides?.critical ?? 0) + (overrides?.high ?? 0),
    cappedBySeverity: (overrides?.critical ?? 0) > 0,
  };
}

function createMockBaseline(
  score: number,
  overrides?: { volatility?: number; regressions?: number }
): BaselineStability {
  return {
    stabilityScore: score,
    volatility: overrides?.volatility ?? 0.1,
    regressionCount: overrides?.regressions ?? 0,
    improvementCount: 1,
    trendDirection: score > 80 ? 'improving' : 'degrading',
  };
}
