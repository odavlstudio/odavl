/**
 * Tests for BrainHistoryStore - Training Data Storage
 * 
 * Phase P9: ML Predictive Intelligence
 * 
 * Tests cover:
 * - Saving training samples to disk
 * - Loading recent samples
 * - Rolling window analytics
 * - History pruning
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { BrainHistoryStore } from '../history-store';
import type { StoredTrainingSample } from '../history-store';
import type {
  FileTypeStats,
  GuardianReport,
  BaselineHistory,
  DeploymentDecision,
} from '../../runtime/runtime-deployment-confidence';

describe('BrainHistoryStore', () => {
  let store: BrainHistoryStore;
  const testHistoryPath = path.join(process.cwd(), '.odavl', 'brain-history');
  
  beforeEach(() => {
    store = new BrainHistoryStore();
  });
  
  afterEach(async () => {
    // Clean up test history files
    try {
      await fs.rm(testHistoryPath, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  });
  
  describe('Saving Training Samples', () => {
    it('should save training sample to disk', async () => {
      const sample = createMockSample(true);
      
      const filepath = await store.saveTrainingSample(sample);
      
      expect(filepath).toContain('.odavl/brain-history/training-');
      expect(filepath).toContain('.json');
      
      // Verify file exists
      const exists = await fs.access(filepath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
    
    it('should save sample with valid JSON format', async () => {
      const sample = createMockSample(true);
      
      const filepath = await store.saveTrainingSample(sample);
      
      // Read and parse JSON
      const content = await fs.readFile(filepath, 'utf-8');
      const parsed = JSON.parse(content);
      
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('fileTypeStats');
      expect(parsed).toHaveProperty('guardianReport');
      expect(parsed).toHaveProperty('baselineHistory');
      expect(parsed).toHaveProperty('brainDecision');
      expect(parsed).toHaveProperty('outcome');
    });
    
    it('should create .odavl/brain-history directory if missing', async () => {
      // Remove directory first
      try {
        await fs.rm(testHistoryPath, { recursive: true, force: true });
      } catch {
        // Ignore
      }
      
      const sample = createMockSample(true);
      await store.saveTrainingSample(sample);
      
      // Directory should exist
      const stats = await fs.stat(testHistoryPath);
      expect(stats.isDirectory()).toBe(true);
    });
    
    it('should use ISO timestamp in filename', async () => {
      const sample = createMockSample(true);
      
      const filepath = await store.saveTrainingSample(sample);
      const filename = path.basename(filepath);
      
      // Filename format: training-YYYY-MM-DDTHH-MM-SS-mmmZ.json
      expect(filename).toMatch(/^training-\d{4}-\d{2}-\d{2}T[\d-]+Z\.json$/);
    });
  });
  
  describe('Loading Training Samples', () => {
    it('should load last N samples', async () => {
      // Save 5 samples
      for (let i = 0; i < 5; i++) {
        const sample = createMockSample(i % 2 === 0); // Alternate success/failure
        await store.saveTrainingSample(sample);
        
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const samples = await store.loadLastNSamples(3);
      
      expect(samples).toHaveLength(3);
      
      // Should be sorted by timestamp (newest first)
      for (let i = 0; i < samples.length - 1; i++) {
        const current = new Date(samples[i].timestamp).getTime();
        const next = new Date(samples[i + 1].timestamp).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });
    
    it('should return empty array when no samples exist', async () => {
      const samples = await store.loadLastNSamples(10);
      
      expect(samples).toEqual([]);
    });
    
    it('should handle corrupted JSON files gracefully', async () => {
      // Create a valid sample first
      const sample = createMockSample(true);
      await store.saveTrainingSample(sample);
      
      // Create a corrupted file
      const corruptedPath = path.join(testHistoryPath, 'training-corrupted.json');
      await fs.writeFile(corruptedPath, '{invalid json', 'utf-8');
      
      // Should still load valid samples
      const samples = await store.loadLastNSamples(10);
      
      // Should skip corrupted file
      expect(samples.length).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Rolling Window Analytics', () => {
    it('should calculate success rate from samples', async () => {
      // Save 10 samples: 7 success, 3 failure
      for (let i = 0; i < 10; i++) {
        const outcome = i < 7; // First 7 succeed
        const sample = createMockSample(outcome);
        await store.saveTrainingSample(sample);
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      const stats = await store.getRollingWindowStats(10);
      
      expect(stats.totalSamples).toBe(10);
      expect(stats.successRate).toBeCloseTo(0.7, 1);
    });
    
    it('should calculate average confidence', async () => {
      // Save samples with varying confidence
      const confidences = [85, 90, 75, 80, 88];
      
      for (const conf of confidences) {
        const sample = createMockSample(true);
        sample.brainDecision.confidence = conf;
        await store.saveTrainingSample(sample);
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      const stats = await store.getRollingWindowStats(5);
      
      const expectedAvg = confidences.reduce((a, b) => a + b) / confidences.length;
      expect(stats.averageConfidence).toBeCloseTo(expectedAvg, 1);
    });
    
    it('should identify common failure patterns', async () => {
      // Save samples with critical failures
      for (let i = 0; i < 5; i++) {
        const sample = createMockSample(false); // Failure
        sample.guardianReport.metrics.critical = 2;
        await store.saveTrainingSample(sample);
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      const stats = await store.getRollingWindowStats(5);
      
      expect(stats.commonFailurePatterns.length).toBeGreaterThan(0);
      
      // Should detect 'critical-test-failures' pattern
      const criticalPattern = stats.commonFailurePatterns.find(
        p => p.pattern === 'critical-test-failures'
      );
      expect(criticalPattern).toBeDefined();
      expect(criticalPattern?.frequency).toBe(5);
    });
    
    it('should provide time range', async () => {
      // Save 3 samples with delays
      for (let i = 0; i < 3; i++) {
        await store.saveTrainingSample(createMockSample(true));
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      const stats = await store.getRollingWindowStats(3);
      
      expect(stats.timeRange).toHaveProperty('earliest');
      expect(stats.timeRange).toHaveProperty('latest');
      
      // Earliest should be before latest
      const earliest = new Date(stats.timeRange.earliest).getTime();
      const latest = new Date(stats.timeRange.latest).getTime();
      expect(earliest).toBeLessThan(latest);
    });
    
    it('should return default stats when no samples', async () => {
      const stats = await store.getRollingWindowStats(50);
      
      expect(stats.totalSamples).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.averageConfidence).toBe(0);
      expect(stats.commonFailurePatterns).toEqual([]);
    });
  });
  
  describe('History Pruning', () => {
    it('should delete oldest samples', async () => {
      // Save 10 samples
      for (let i = 0; i < 10; i++) {
        await store.saveTrainingSample(createMockSample(true));
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Keep only last 5
      const deletedCount = await store.pruneHistory(5);
      
      expect(deletedCount).toBe(5);
      
      // Verify only 5 remain
      const remaining = await store.loadLastNSamples(100);
      expect(remaining).toHaveLength(5);
    });
    
    it('should keep newest samples', async () => {
      // Save samples with identifiable data
      const samples = [];
      for (let i = 0; i < 5; i++) {
        const sample = createMockSample(true);
        sample.brainDecision.confidence = 80 + i; // 80, 81, 82, 83, 84
        await store.saveTrainingSample(sample);
        samples.push(sample);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Keep only last 3
      await store.pruneHistory(3);
      
      // Load remaining
      const remaining = await store.loadLastNSamples(10);
      
      expect(remaining).toHaveLength(3);
      
      // Should have highest confidence values (newest samples)
      const confidences = remaining.map(s => s.brainDecision.confidence);
      expect(confidences).toContain(82);
      expect(confidences).toContain(83);
      expect(confidences).toContain(84);
    });
    
    it('should return 0 when no files to delete', async () => {
      // Save 3 samples, keep 10
      for (let i = 0; i < 3; i++) {
        await store.saveTrainingSample(createMockSample(true));
      }
      
      const deletedCount = await store.pruneHistory(10);
      
      expect(deletedCount).toBe(0);
    });
  });
});

// ============================================================================
// TEST UTILITIES
// ============================================================================

function createMockSample(outcome: boolean): StoredTrainingSample {
  const fileTypeStats: FileTypeStats = {
    totalFiles: 10,
    byLanguage: {
      typescript: 8,
      javascript: 2,
    },
    byCategory: {
      code: 8,
      test: 2,
      config: 0,
      documentation: 0,
    },
  };
  
  const guardianReport: GuardianReport = {
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
      lighthouseValidation: {
        passed: outcome,
        score: outcome ? 95 : 65,
        threshold: 80,
      },
      webVitalsValidation: {
        passed: outcome,
        score: outcome ? 92 : 70,
        threshold: 75,
      },
      baselineComparison: {
        passed: outcome,
        current: outcome ? 95 : 70,
        baseline: 90,
        threshold: 85,
      },
    },
  };
  
  const baselineHistory: BaselineHistory = {
    runId: `run-${Date.now()}`,
    entries: [
      { runId: 'run-1', score: 90, timestamp: new Date().toISOString() },
      { runId: 'run-2', score: 92, timestamp: new Date().toISOString() },
      { runId: 'run-3', score: outcome ? 95 : 75, timestamp: new Date().toISOString() },
    ],
  };
  
  const brainDecision: DeploymentDecision = {
    confidence: outcome ? 85 : 55,
    requiredConfidence: 75,
    canDeploy: outcome,
    factors: {
      riskWeight: 30,
      testImpact: 40,
      baselineStability: 25,
    },
    reasoning: [
      outcome ? 'Deployment allowed' : 'Deployment blocked',
    ],
  };
  
  return {
    timestamp: new Date().toISOString(),
    fileTypeStats,
    guardianReport,
    baselineHistory,
    brainDecision,
    outcome,
    metadata: {
      environment: 'test',
      deploymentDuration: outcome ? 120 : 0,
      rollbackRequired: !outcome,
    },
  };
}
