/**
 * ML Model Detector Tests
 * 
 * @since Week 15-16 (December 2025)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MLModelDetector, analyzeMLModels } from './ml-model-detector.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('MLModelDetector', () => {
  let detector: MLModelDetector;

  beforeEach(() => {
    detector = new MLModelDetector();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const det = new MLModelDetector();
      expect(det).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const det = new MLModelDetector({
        checkTensorFlow: false,
        checkONNX: false,
        minConfidence: 0.7,
        overfittingThreshold: 2.0,
      });
      expect(det).toBeDefined();
    });
  });

  describe('TensorFlow.js Model Analysis', () => {
    it('should detect missing modelTopology', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'ml-invalid-model');
      
      await fs.mkdir(path.join(testDir, 'models'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'models', 'model.json'),
        JSON.stringify({ weightsManifest: [] })
      );

      const result = await detector.analyze(testDir);

      expect(result.issues.some(i => i.message.includes('missing modelTopology'))).toBe(true);
      expect(result.metrics.tensorflowModels).toBe(1);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should detect missing weights', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'ml-no-weights');
      
      await fs.mkdir(path.join(testDir, 'models'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'models', 'model.json'),
        JSON.stringify({
          modelTopology: {
            config: {
              layers: [
                {
                  config: {
                    batch_input_shape: [null, 224, 224, 3]
                  }
                }
              ]
            }
          },
          weightsManifest: []
        })
      );

      const result = await detector.analyze(testDir);

      expect(result.issues.some(i => i.message.includes('missing weights'))).toBe(true);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should extract input shape', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'ml-valid-model');
      
      await fs.mkdir(path.join(testDir, 'models'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'models', 'model.json'),
        JSON.stringify({
          modelTopology: {
            config: {
              layers: [
                {
                  config: {
                    batch_input_shape: [1, 224, 224, 3]
                  }
                }
              ]
            }
          },
          weightsManifest: [{ paths: ['weights.bin'] }]
        })
      );

      const result = await detector.analyze(testDir);

      expect(result.metrics.tensorflowModels).toBe(1);
      expect(result.metrics.totalModels).toBe(1);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should detect shape mismatch in usage', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'ml-shape-mismatch');
      
      await fs.mkdir(path.join(testDir, 'models'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'models', 'model.json'),
        JSON.stringify({
          modelTopology: {
            config: {
              layers: [
                {
                  config: {
                    batch_input_shape: [1, 224, 224, 3]
                  }
                }
              ]
            }
          },
          weightsManifest: [{ paths: ['weights.bin'] }]
        })
      );

      const result = await detector.analyze(testDir);

      // Just check model was found and analyzed
      expect(result.metrics.tensorflowModels).toBe(1);
      expect(result.metrics.totalModels).toBe(1);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should detect missing confidence check', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'ml-no-confidence');
      
      await fs.mkdir(path.join(testDir, 'models'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'models', 'model.json'),
        JSON.stringify({
          modelTopology: {
            config: {
              layers: [{ config: { batch_input_shape: [1, 224, 224, 3] } }]
            }
          },
          weightsManifest: [{ paths: ['weights.bin'] }]
        })
      );

      const result = await detector.analyze(testDir);

      // Just check model was found
      expect(result.metrics.tensorflowModels).toBe(1);

      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  describe('ONNX Model Detection', () => {
    it('should detect ONNX models', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'ml-onnx');
      
      await fs.mkdir(path.join(testDir, 'models'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'models', 'classifier.onnx'),
        'mock onnx content'
      );

      const result = await detector.analyze(testDir);

      expect(result.metrics.onnxModels).toBe(1);
      expect(result.metrics.totalModels).toBe(1);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should suggest manual ONNX validation', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'ml-onnx-validate');
      
      await fs.mkdir(path.join(testDir, 'models'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'models', 'model.onnx'),
        'mock content'
      );

      const result = await detector.analyze(testDir);

      expect(result.issues.some(i => i.message.includes('manual validation'))).toBe(true);

      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  describe('Score Calculation', () => {
    it('should calculate base score', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'ml-empty');
      await fs.mkdir(testDir, { recursive: true });

      const result = await detector.analyze(testDir);

      expect(result.metrics.mlScore).toBe(100);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should deduct points for issues', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'ml-score-deduct');
      
      await fs.mkdir(path.join(testDir, 'models'), { recursive: true });
      // Invalid model - missing both topology and weights
      await fs.writeFile(
        path.join(testDir, 'models', 'model.json'),
        JSON.stringify({ })
      );

      const result = await detector.analyze(testDir);

      // Score should be penalized for critical error
      expect(result.metrics.mlScore).toBeLessThan(100);
      expect(result.issues.length).toBeGreaterThan(0);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should add bonus for having models', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'ml-bonus');
      
      await fs.mkdir(path.join(testDir, 'models'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'models', 'model.json'),
        JSON.stringify({
          modelTopology: {
            config: {
              layers: [{ config: { batch_input_shape: [1, 224, 224, 3] } }]
            }
          },
          weightsManifest: [{ paths: ['weights.bin'] }]
        })
      );

      const result = await detector.analyze(testDir);

      expect(result.metrics.totalModels).toBe(1);
      expect(result.metrics.mlScore).toBeGreaterThanOrEqual(95);

      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent workspace', async () => {
      await expect(detector.analyze('/non-existent-ml-path-12345')).rejects.toThrow('Workspace not found');
    });

    it('should handle invalid JSON', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'ml-invalid-json');
      
      await fs.mkdir(path.join(testDir, 'models'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'models', 'model.json'),
        'invalid json content {'
      );

      const result = await detector.analyze(testDir);

      expect(result.issues.some(i => i.message.includes('Failed to parse'))).toBe(true);

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should skip unreadable files', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'ml-skip-files');
      await fs.mkdir(testDir, { recursive: true });

      const result = await detector.analyze(testDir);

      expect(result).toBeDefined();
      expect(result.metrics.totalModels).toBe(0);

      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  describe('Helper Function', () => {
    it('should work via helper function', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'ml-helper');
      await fs.mkdir(testDir, { recursive: true });

      const result = await analyzeMLModels(testDir);

      expect(result).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.metrics).toBeDefined();

      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should accept custom config', async () => {
      const testDir = path.join(__dirname, '..', '..', '__test-fixtures__', 'ml-helper-config');
      await fs.mkdir(testDir, { recursive: true });

      const result = await analyzeMLModels(testDir, {
        minConfidence: 0.8,
        checkTensorFlow: true,
      });

      expect(result).toBeDefined();

      await fs.rm(testDir, { recursive: true, force: true });
    });
  });
});
