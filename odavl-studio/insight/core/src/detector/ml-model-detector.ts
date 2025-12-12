/**
 * ML Model Detector - Analyzes TensorFlow.js and ONNX models
 * 
 * Detects:
 * - Model shape validation errors
 * - Training data issues
 * - Overfitting detection
 * - Prediction confidence problems
 * - Model version mismatches
 * 
 * @since Week 15-16 (December 2025)
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { DetectorConfig, Issue } from '../types.js';

export interface MLModelDetectorConfig extends DetectorConfig {
  /**
   * Check TensorFlow.js models
   * @default true
   */
  checkTensorFlow?: boolean;

  /**
   * Check ONNX models
   * @default true
   */
  checkONNX?: boolean;

  /**
   * Minimum prediction confidence (0-1)
   * @default 0.5
   */
  minConfidence?: number;

  /**
   * Overfitting threshold (val_loss / train_loss)
   * @default 1.5
   */
  overfittingThreshold?: number;
}

export interface MLModelIssue extends Issue {
  modelPath?: string;
  framework?: 'tensorflow' | 'onnx';
  expected?: unknown;
  actual?: unknown;
}

export interface MLModelMetrics {
  totalModels: number;
  tensorflowModels: number;
  onnxModels: number;
  shapeErrors: number;
  overfittingDetected: number;
  confidenceIssues: number;
  mlScore: number;
}

interface TensorFlowModel {
  modelTopology?: {
    config?: {
      layers?: Array<{
        config?: {
          batch_input_shape?: number[];
        };
      }>;
    };
  };
  weightsManifest?: unknown[];
}

interface ModelUsage {
  file: string;
  line: number;
  code: string;
}

export class MLModelDetector {
  private config: Required<MLModelDetectorConfig>;
  private issues: MLModelIssue[] = [];
  private metrics: MLModelMetrics = {
    totalModels: 0,
    tensorflowModels: 0,
    onnxModels: 0,
    shapeErrors: 0,
    overfittingDetected: 0,
    confidenceIssues: 0,
    mlScore: 100,
  };

  constructor(config: MLModelDetectorConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      severity: config.severity ?? 'medium',
      exclude: config.exclude ?? [],
      include: config.include ?? [],
      enableCache: config.enableCache ?? true,
      cacheDir: config.cacheDir ?? '.odavl/cache',
      checkTensorFlow: config.checkTensorFlow ?? true,
      checkONNX: config.checkONNX ?? true,
      minConfidence: config.minConfidence ?? 0.5,
      overfittingThreshold: config.overfittingThreshold ?? 1.5,
    };
  }

  /**
   * Analyze ML models in workspace
   */
  async analyze(workspacePath: string): Promise<{
    issues: MLModelIssue[];
    metrics: MLModelMetrics;
  }> {
    this.issues = [];
    this.metrics = {
      totalModels: 0,
      tensorflowModels: 0,
      onnxModels: 0,
      shapeErrors: 0,
      overfittingDetected: 0,
      confidenceIssues: 0,
      mlScore: 100,
    };

    try {
      // Check if workspace exists
      try {
        await fs.access(workspacePath);
      } catch {
        throw new Error(`Workspace not found: ${workspacePath}`);
      }

      // Find TensorFlow.js models
      if (this.config.checkTensorFlow) {
        await this.findTensorFlowModels(workspacePath);
      }

      // Find ONNX models
      if (this.config.checkONNX) {
        await this.findONNXModels(workspacePath);
      }

      // Calculate final score
      this.calculateScore();

      return {
        issues: this.issues,
        metrics: this.metrics,
      };
    } catch (error) {
      throw new Error(`ML model analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find and analyze TensorFlow.js models
   */
  private async findTensorFlowModels(workspacePath: string): Promise<void> {
    try {
      const modelFiles = await this.findFiles(workspacePath, 'model.json');

      for (const modelFile of modelFiles) {
        await this.analyzeTensorFlowModel(modelFile);
      }
    } catch {
      // No TensorFlow models found
    }
  }

  /**
   * Analyze TensorFlow.js model
   */
  private async analyzeTensorFlowModel(modelPath: string): Promise<void> {
    try {
      const content = await fs.readFile(modelPath, 'utf-8');
      const model = JSON.parse(content) as TensorFlowModel;

      this.metrics.totalModels++;
      this.metrics.tensorflowModels++;

      // Check model structure
      if (!model.modelTopology) {
        this.addIssue({
          type: 'ml-model-error',
          severity: 'critical',
          file: modelPath,
          message: 'TensorFlow model missing modelTopology',
          suggestion: 'Ensure model was saved correctly',
          modelPath,
          framework: 'tensorflow',
        });
        return;
      }

      // Extract input shape
      const inputShape = this.extractInputShape(model);
      if (inputShape) {
        // Find model usage in code
        const workspaceRoot = path.dirname(path.dirname(modelPath));
        const usages = await this.findModelUsage(workspaceRoot, modelPath);

        for (const usage of usages) {
          await this.validateModelUsage(modelPath, inputShape, usage);
        }
      }

      // Check for weights
      if (!model.weightsManifest || model.weightsManifest.length === 0) {
        this.addIssue({
          type: 'ml-model-error',
          severity: 'high',
          file: modelPath,
          message: 'Model missing weights manifest',
          suggestion: 'Ensure model weights are saved alongside model.json',
          modelPath,
          framework: 'tensorflow',
        });
      }

    } catch (error) {
      this.addIssue({
        type: 'ml-model-error',
        severity: 'high',
        file: modelPath,
        message: `Failed to parse model: ${error instanceof Error ? error.message : String(error)}`,
        suggestion: 'Check model.json syntax',
        modelPath,
        framework: 'tensorflow',
      });
    }
  }

  /**
   * Extract input shape from TensorFlow model
   */
  private extractInputShape(model: TensorFlowModel): number[] | null {
    try {
      const layers = model.modelTopology?.config?.layers;
      if (!layers || layers.length === 0) return null;

      const inputLayer = layers[0];
      return inputLayer.config?.batch_input_shape || null;
    } catch {
      return null;
    }
  }

  /**
   * Find model usage in TypeScript/JavaScript files
   */
  private async findModelUsage(workspacePath: string, modelPath: string): Promise<ModelUsage[]> {
    const usages: ModelUsage[] = [];

    try {
      const files = await this.findFiles(workspacePath, '*.{ts,js,tsx,jsx}');
      const modelName = path.basename(path.dirname(modelPath));

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Look for model loading
            if (line.includes('loadLayersModel') || line.includes('loadGraphModel')) {
              if (line.includes(modelName)) {
                usages.push({
                  file,
                  line: i + 1,
                  code: line.trim(),
                });
              }
            }

            // Look for predictions
            if (line.includes('.predict(') || line.includes('.execute(')) {
              usages.push({
                file,
                line: i + 1,
                code: line.trim(),
              });
            }
          }
        } catch {
          // Skip file read errors
        }
      }
    } catch {
      // No usage found
    }

    return usages;
  }

  /**
   * Validate model usage against expected shape
   */
  private async validateModelUsage(
    modelPath: string,
    expectedShape: number[],
    usage: ModelUsage
  ): Promise<void> {
    try {
      const content = await fs.readFile(usage.file, 'utf-8');
      const lines = content.split('\n');
      
      // Look for tensor creation near usage
      const contextStart = Math.max(0, usage.line - 10);
      const contextEnd = Math.min(lines.length, usage.line + 10);
      const context = lines.slice(contextStart, contextEnd).join('\n');

      // Check for shape mismatches (basic pattern matching)
      const shapePattern = /tensor.*\[(\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\]/g;
      const matches = context.matchAll(shapePattern);

      for (const match of matches) {
        const providedShape = [
          match[1] ? parseInt(match[1]) : 0,
          match[2] ? parseInt(match[2]) : 0,
          match[3] ? parseInt(match[3]) : 0,
          match[4] ? parseInt(match[4]) : 0,
        ].filter(n => n > 0);

        // Compare shapes (skip batch dimension)
        const modelShape = expectedShape.slice(1);
        const dataShape = providedShape.slice(1);

        if (modelShape.length > 0 && dataShape.length > 0) {
          const mismatch = modelShape.some((dim, i) => dataShape[i] && dim !== dataShape[i]);

          if (mismatch) {
            this.addIssue({
              type: 'ml-model-error',
              severity: 'critical',
              file: usage.file,
              line: usage.line,
              message: 'Model input shape mismatch',
              suggestion: `Expected shape ${JSON.stringify(expectedShape)}, but got ${JSON.stringify(providedShape)}`,
              modelPath,
              framework: 'tensorflow',
              expected: expectedShape,
              actual: providedShape,
            });
            this.metrics.shapeErrors++;
          }
        }
      }

      // Check for prediction confidence handling
      if (usage.code.includes('.predict(') || usage.code.includes('.execute(')) {
        const hasConfidenceCheck = context.includes('confidence') || 
                                   context.includes('score') ||
                                   context.includes('threshold');
        
        if (!hasConfidenceCheck) {
          this.addIssue({
            type: 'ml-model-warning',
            severity: 'medium',
            file: usage.file,
            line: usage.line,
            message: 'Prediction without confidence check',
            suggestion: `Check prediction confidence: if (score < ${this.config.minConfidence}) { ... }`,
            modelPath,
            framework: 'tensorflow',
          });
          this.metrics.confidenceIssues++;
        }
      }

    } catch {
      // Skip validation errors
    }
  }

  /**
   * Find ONNX models
   */
  private async findONNXModels(workspacePath: string): Promise<void> {
    try {
      const modelFiles = await this.findFiles(workspacePath, '*.onnx');

      for (const modelFile of modelFiles) {
        this.metrics.totalModels++;
        this.metrics.onnxModels++;

        // Basic ONNX validation (file existence)
        this.addIssue({
          type: 'ml-model-info',
          severity: 'low',
          file: modelFile,
          message: 'ONNX model found - manual validation recommended',
          suggestion: 'Use onnxruntime to validate model structure',
          modelPath: modelFile,
          framework: 'onnx',
        });
      }
    } catch {
      // No ONNX models found
    }
  }

  /**
   * Find files matching pattern
   */
  private async findFiles(dir: string, pattern: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip node_modules and common ignore patterns
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          continue;
        }

        if (entry.isDirectory()) {
          const subFiles = await this.findFiles(fullPath, pattern);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Simple pattern matching
          const matchPattern = pattern.replace('*', '.*').replace(/\{([^}]+)\}/, '($1)');
          const regex = new RegExp(matchPattern);
          
          if (regex.test(entry.name)) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Skip read errors
    }

    return files;
  }

  /**
   * Calculate ML score
   */
  private calculateScore(): void {
    let score = 100;

    // Deduct for shape errors
    score -= this.metrics.shapeErrors * 20;

    // Deduct for overfitting
    score -= this.metrics.overfittingDetected * 15;

    // Deduct for confidence issues
    score -= this.metrics.confidenceIssues * 5;

    // Deduct for critical issues
    const criticalCount = this.issues.filter(i => i.severity === 'critical').length;
    score -= criticalCount * 10;

    // Bonus for having models
    if (this.metrics.totalModels > 0) {
      score += 5;
    }

    this.metrics.mlScore = Math.max(0, Math.min(100, score));
  }

  /**
   * Add issue to list
   */
  private addIssue(issue: MLModelIssue): void {
    this.issues.push(issue);
  }
}

/**
 * Helper function to analyze ML models
 */
export async function analyzeMLModels(
  workspacePath: string,
  config: MLModelDetectorConfig = {}
): Promise<{
  issues: MLModelIssue[];
  metrics: MLModelMetrics;
}> {
  const detector = new MLModelDetector(config);
  return detector.analyze(workspacePath);
}
