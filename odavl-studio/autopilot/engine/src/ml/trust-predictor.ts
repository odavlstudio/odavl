/**
 * ML-Enhanced Trust Prediction System for Autopilot
 * 
 * Uses TensorFlow.js to predict recipe success probability
 * Features extracted from:
 * - Historical success rate
 * - Code complexity (LOC, cyclomatic complexity)
 * - File types affected
 * - Time of day / day of week patterns
 * - Previous consecutive failures
 * - Workspace characteristics
 * 
 * Model architecture: Sequential Neural Network
 * - Input: 10 features (normalized)
 * - Hidden layers: 2 dense layers (64 → 32 units)
 * - Output: 1 sigmoid unit (success probability 0-1)
 * 
 * TEMP FIX: TensorFlow.js disabled due to native binding issues in web environments
 * Falling back to heuristic prediction until ML model loading is fixed
 */

// import * as tf from '@tensorflow/tfjs-node'; // DISABLED: Native binding conflicts
import * as fs from 'fs/promises';
import * as path from 'path';

// Type stub for tf.LayersModel (avoid import)
type LayersModel = any;

export interface RecipeFeatures {
  // Historical features
  historicalSuccessRate: number; // 0-1
  totalRuns: number; // Normalized by max runs
  consecutiveFailures: number; // 0-5+
  daysSinceLastRun: number; // Normalized
  
  // Recipe characteristics
  filesAffectedCount: number; // Normalized
  linesOfCodeChanged: number; // Normalized
  complexityScore: number; // 0-10 (McCabe complexity)
  
  // Context features
  isTypescriptFile: number; // 0 or 1 (boolean)
  isTestFile: number; // 0 or 1
  hasBreakingChanges: number; // 0 or 1
}

export interface TrustPrediction {
  predictedTrust: number; // 0-1 (ML model output)
  confidence: number; // 0-1 (model confidence)
  features: RecipeFeatures;
  explanation: string;
  recommendation: 'execute' | 'review' | 'skip';
}

/**
 * ML Trust Predictor
 */
export class MLTrustPredictor {
  private model: LayersModel | null = null;
  private modelPath: string;
  private featureStats: {
    maxRuns: number;
    maxFiles: number;
    maxLOC: number;
    maxDays: number;
  };

  constructor(modelPath?: string) {
    this.modelPath = modelPath || path.join(process.cwd(), '.odavl', 'ml-models', 'trust-predictor-v2');
    this.featureStats = {
      maxRuns: 100,
      maxFiles: 50,
      maxLOC: 1000,
      maxDays: 365,
    };
  }

  /**
   * Load trained model from disk
   * TEMP: Always fails gracefully until TensorFlow.js native binding issue resolved
   */
  async loadModel(): Promise<void> {
    console.warn('[ML] ⚠️  TensorFlow.js disabled (native binding conflict), using heuristic fallback');
    this.model = null;
    // try {
    //   const modelJsonPath = path.join(this.modelPath, 'model.json');
    //   this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`);
    //   console.log('[ML] ✅ Trust prediction model loaded');
    // } catch (error) {
    //   console.warn('[ML] ⚠️  Model not found, using heuristic fallback');
    //   this.model = null;
    // }
  }

  /**
   * Extract features from recipe metadata
   */
  extractFeatures(recipeData: {
    successRate: number;
    totalRuns: number;
    consecutiveFailures: number;
    lastRunDate?: Date;
    filesAffected: string[];
    locChanged: number;
    complexity: number;
  }): RecipeFeatures {
    const daysSinceLastRun = recipeData.lastRunDate
      ? (Date.now() - recipeData.lastRunDate.getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    const isTypescript = recipeData.filesAffected.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    const isTest = recipeData.filesAffected.some(f => f.includes('.test.') || f.includes('.spec.'));

    return {
      historicalSuccessRate: recipeData.successRate,
      totalRuns: Math.min(recipeData.totalRuns, this.featureStats.maxRuns) / this.featureStats.maxRuns,
      consecutiveFailures: Math.min(recipeData.consecutiveFailures, 5) / 5,
      daysSinceLastRun: Math.min(daysSinceLastRun, this.featureStats.maxDays) / this.featureStats.maxDays,
      filesAffectedCount: Math.min(recipeData.filesAffected.length, this.featureStats.maxFiles) / this.featureStats.maxFiles,
      linesOfCodeChanged: Math.min(recipeData.locChanged, this.featureStats.maxLOC) / this.featureStats.maxLOC,
      complexityScore: Math.min(recipeData.complexity, 10) / 10,
      isTypescriptFile: isTypescript ? 1 : 0,
      isTestFile: isTest ? 1 : 0,
      hasBreakingChanges: recipeData.consecutiveFailures > 0 ? 1 : 0,
    };
  }

  /**
   * Normalize features to 0-1 range
   */
  private normalizeFeatures(features: RecipeFeatures): number[] {
    return [
      features.historicalSuccessRate,
      features.totalRuns,
      features.consecutiveFailures,
      features.daysSinceLastRun,
      features.filesAffectedCount,
      features.linesOfCodeChanged,
      features.complexityScore,
      features.isTypescriptFile,
      features.isTestFile,
      features.hasBreakingChanges,
    ];
  }

  /**
   * Predict trust score using ML model
   * Enhanced with confidence scoring and better heuristics
   */
  async predict(features: RecipeFeatures): Promise<TrustPrediction> {
    // Try ML model first (if available)
    if (this.model) {
      try {
        return await this.predictWithModel(features);
      } catch (error) {
        console.warn('ML prediction failed, falling back to heuristic:', error);
      }
    }

    // Enhanced heuristic fallback with confidence estimation
    return this.predictHeuristic(features);
  }

  /**
   * Enhanced heuristic prediction with confidence scoring
   */
  private predictHeuristic(features: RecipeFeatures): TrustPrediction {
    let trust = 0.5; // Start neutral
    let confidence = 0.7; // Base confidence for heuristics

    // Historical performance (40% weight)
    trust += features.historicalSuccessRate * 0.4;
    
    // Penalize consecutive failures (20% weight)
    trust -= features.consecutiveFailures * 0.2;
    
    // Complexity penalty (15% weight)
    const complexityPenalty = (features.complexityScore * 0.15);
    trust -= complexityPenalty;
    
    // File count penalty (10% weight)
    const filesPenalty = (features.filesAffectedCount * 0.1);
    trust -= filesPenalty;
    
    // LOC penalty (10% weight)
    const locPenalty = (features.linesOfCodeChanged * 0.1);
    trust -= locPenalty;
    
    // TypeScript bonus (5% weight - safer changes)
    if (features.isTypescriptFile === 1) {
      trust += 0.05;
      confidence += 0.1;
    }
    
    // Test file caution
    if (features.isTestFile === 1) {
      trust -= 0.05; // More critical, be cautious
      confidence += 0.05;
    }
    
    // Breaking changes penalty
    if (features.hasBreakingChanges === 1) {
      trust -= 0.15;
      confidence += 0.1; // We're more certain this is risky
    }
    
    // Recency bonus (recently successful = higher trust)
    if (features.daysSinceLastRun < 0.1) { // Recent run
      trust += 0.05;
    }

    // Normalize trust to 0-1 range
    trust = Math.max(0.1, Math.min(1.0, trust));
    confidence = Math.max(0.5, Math.min(1.0, confidence));

    // Determine recommendation based on trust and confidence
    let recommendation: 'execute' | 'review' | 'skip';
    if (trust >= 0.8 && confidence >= 0.7) {
      recommendation = 'execute';
    } else if (trust >= 0.6) {
      recommendation = 'review';
    } else {
      recommendation = 'skip';
    }

    const explanation = this.generateExplanation(features, trust, confidence);

    return {
      predictedTrust: trust,
      confidence,
      features,
      explanation,
      recommendation,
    };
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(features: RecipeFeatures, trust: number, confidence: number): string {
    const factors: string[] = [];
    
    if (features.historicalSuccessRate > 0.8) {
      factors.push('high historical success rate');
    } else if (features.historicalSuccessRate < 0.5) {
      factors.push('low historical success rate');
    }
    
    if (features.consecutiveFailures > 0.4) {
      factors.push(`${Math.round(features.consecutiveFailures * 5)} consecutive failures`);
    }
    
    if (features.complexityScore > 0.7) {
      factors.push('high complexity');
    }
    
    if (features.filesAffectedCount > 0.5) {
      factors.push('many files affected');
    }
    
    if (features.isTypescriptFile === 1) {
      factors.push('TypeScript file (safer)');
    }
    
    if (features.hasBreakingChanges === 1) {
      factors.push('previous breaking changes');
    }

    return factors.length > 0
      ? `Trust: ${(trust * 100).toFixed(1)}% (Confidence: ${(confidence * 100).toFixed(1)}%) - ${factors.join(', ')}`
      : `Trust: ${(trust * 100).toFixed(1)}% (Confidence: ${(confidence * 100).toFixed(1)}%)`;
  }

  /**
   * ML model prediction (if model loaded)
   */
  private async predictWithModel(features: RecipeFeatures): Promise<TrustPrediction> {
    // TEMP FIX: Always use heuristic (TensorFlow disabled)
    return this.heuristicPredict(features);

    // Original ML prediction code (disabled):
    // if (!this.model) {
    //   return this.heuristicPredict(features);
    // }
    // try {
    //   const inputTensor = tf.tensor2d([this.normalizeFeatures(features)]);
    //   const predictionTensor = this.model.predict(inputTensor) as tf.Tensor;
    //   const predictionArray = await predictionTensor.array() as number[][];
    //   const predictedTrust = predictionArray[0][0];
    //   inputTensor.dispose();
    //   predictionTensor.dispose();
    //   const confidence = this.calculateConfidence(features, predictedTrust);
    //   const recommendation = this.getRecommendation(predictedTrust, confidence);
    //   return {
    //     predictedTrust,
    //     confidence,
    //     features,
    //     explanation: this.generateExplanation(features, predictedTrust),
    //     recommendation,
    //   };
    // } catch (error) {
    //   console.error('[ML] Prediction error, falling back to heuristic:', error);
    //   return this.heuristicPredict(features);
    // }
  }

  /**
   * Fallback heuristic prediction (rule-based)
   */
  private heuristicPredict(features: RecipeFeatures): TrustPrediction {
    // Simple weighted average
    let trust = 0;
    trust += features.historicalSuccessRate * 0.4; // 40% weight
    trust += (1 - features.consecutiveFailures) * 0.2; // 20% weight
    trust += (1 - features.complexityScore) * 0.15; // 15% weight
    trust += (features.totalRuns > 0.1 ? 0.15 : 0); // 15% if has runs
    trust += (features.isTestFile ? 0.1 : 0); // 10% bonus for test files

    // Penalties
    if (features.consecutiveFailures > 0.6) trust *= 0.5; // 50% penalty for recent failures
    if (features.hasBreakingChanges) trust *= 0.7; // 30% penalty for breaking changes

    const predictedTrust = Math.max(0.1, Math.min(1, trust));
    const confidence = 0.7; // Lower confidence for heuristic

    return {
      predictedTrust,
      confidence,
      features,
      explanation: 'Heuristic prediction (ML model not available)',
      recommendation: this.getRecommendation(predictedTrust, confidence),
    };
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(features: RecipeFeatures, prediction: number): number {
    let confidence = 0.8; // Base confidence

    // More confidence with more runs
    if (features.totalRuns > 0.5) confidence += 0.1;
    if (features.totalRuns > 0.8) confidence += 0.1;

    // Less confidence with recent failures
    if (features.consecutiveFailures > 0.4) confidence -= 0.2;

    // Less confidence with high complexity
    if (features.complexityScore > 0.7) confidence -= 0.1;

    return Math.max(0.3, Math.min(1, confidence));
  }

  /**
   * Get recommendation based on trust and confidence
   */
  private getRecommendation(trust: number, confidence: number): 'execute' | 'review' | 'skip' {
    if (trust >= 0.8 && confidence >= 0.7) return 'execute'; // High trust + high confidence
    if (trust >= 0.6 && confidence >= 0.6) return 'review'; // Medium trust, review first
    if (trust < 0.3) return 'skip'; // Low trust, skip
    return 'review'; // Default to review
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(features: RecipeFeatures, prediction: number): string {
    const reasons: string[] = [];

    if (features.historicalSuccessRate > 0.8) {
      reasons.push(`✅ High historical success rate (${(features.historicalSuccessRate * 100).toFixed(0)}%)`);
    } else if (features.historicalSuccessRate < 0.4) {
      reasons.push(`❌ Low historical success rate (${(features.historicalSuccessRate * 100).toFixed(0)}%)`);
    }

    if (features.consecutiveFailures > 0.4) {
      const failures = Math.round(features.consecutiveFailures * 5);
      reasons.push(`⚠️  Recent consecutive failures (${failures})`);
    }

    if (features.complexityScore > 0.7) {
      reasons.push(`⚠️  High code complexity (${(features.complexityScore * 10).toFixed(1)}/10)`);
    }

    if (features.totalRuns < 0.1) {
      reasons.push(`ℹ️  New recipe (limited history)`);
    }

    if (features.isTestFile) {
      reasons.push(`✅ Test file (lower risk)`);
    }

    if (features.hasBreakingChanges) {
      reasons.push(`⚠️  May introduce breaking changes`);
    }

    const summaryIcon = prediction >= 0.8 ? '✅' : prediction >= 0.6 ? '⚠️' : '❌';
    return `${summaryIcon} Predicted success: ${(prediction * 100).toFixed(0)}%\n${reasons.join('\n')}`;
  }

  /**
   * Train model on historical data (offline training)
   */
  async trainModel(trainingData: Array<{ features: RecipeFeatures; success: boolean }>): Promise<void> {
    console.log(`[ML] Training model on ${trainingData.length} samples...`);

    // Prepare training data
    const xsTrain = trainingData.map(d => this.normalizeFeatures(d.features));
    const ysTrain = trainingData.map(d => (d.success ? 1 : 0));

    const xs = tf.tensor2d(xsTrain);
    const ys = tf.tensor2d(ysTrain, [ysTrain.length, 1]);

    // Create model
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }),
      ],
    });

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    // Train
    await this.model.fit(xs, ys, {
      epochs: 50,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`[ML] Epoch ${epoch}: loss=${logs?.loss.toFixed(4)}, acc=${logs?.acc.toFixed(4)}`);
          }
        },
      },
    });

    // Save model
    await this.saveModel();

    // Cleanup
    xs.dispose();
    ys.dispose();

    console.log('[ML] ✅ Model training complete');
  }

  /**
   * Save model to disk
   */
  async saveModel(): Promise<void> {
    if (!this.model) {
      throw new Error('No model to save');
    }

    await fs.mkdir(this.modelPath, { recursive: true });
    await this.model.save(`file://${this.modelPath}`);
    console.log(`[ML] 💾 Model saved to ${this.modelPath}`);
  }

  /**
   * Evaluate model accuracy
   */
  async evaluateModel(testData: Array<{ features: RecipeFeatures; success: boolean }>): Promise<{
    accuracy: number;
    loss: number;
  }> {
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    const xsTest = testData.map(d => this.normalizeFeatures(d.features));
    const ysTest = testData.map(d => (d.success ? 1 : 0));

    const xs = tf.tensor2d(xsTest);
    const ys = tf.tensor2d(ysTest, [ysTest.length, 1]);

    const result = this.model.evaluate(xs, ys) as tf.Tensor[];
    const loss = await result[0].data();
    const accuracy = await result[1].data();

    xs.dispose();
    ys.dispose();
    result[0].dispose();
    result[1].dispose();

    return { accuracy: accuracy[0], loss: loss[0] };
  }
}

/**
 * Example usage in Autopilot decide phase:
 * 
 * ```typescript
 * const predictor = new MLTrustPredictor();
 * await predictor.loadModel();
 * 
 * const features = predictor.extractFeatures({
 *   successRate: 0.85,
 *   totalRuns: 42,
 *   consecutiveFailures: 0,
 *   lastRunDate: new Date('2025-11-15'),
 *   filesAffected: ['src/index.ts', 'src/utils.ts'],
 *   locChanged: 127,
 *   complexity: 4.2,
 * });
 * 
 * const prediction = await predictor.predict(features);
 * console.log(prediction.explanation);
 * 
 * if (prediction.recommendation === 'execute') {
 *   // Safe to execute
 * } else if (prediction.recommendation === 'review') {
 *   // Prompt user for confirmation
 * } else {
 *   // Skip this recipe
 * }
 * ```
 */
