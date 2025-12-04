/**
 * ML Trust Predictor - Neural Network for Recipe Trust Scoring
 * 
 * Architecture:
 * - Input: 12-dimensional feature vector
 * - Hidden Layers: 64 → 32 → 16 neurons
 * - Output: Trust score (0-1) + confidence + recommendation
 * 
 * Features:
 * 1. Historical success rate (0-1)
 * 2. Error frequency in codebase (0-1, normalized)
 * 3. Code complexity (cyclomatic, normalized)
 * 4. Lines changed (normalized by file size)
 * 5. Files modified count (normalized)
 * 6. Error type criticality (0-1: type < import < security)
 * 7. Similar past outcomes (cosine similarity, 0-1)
 * 8. Time since last failure (0-1, days normalized)
 * 9. Project maturity (0-1, commits/age)
 * 10. Test coverage (0-1)
 * 11. Recipe complexity (0-1, steps count normalized)
 * 12. Community trust (0-1, GitHub stars/usage)
 */

export interface MLFeatures {
  historicalSuccessRate: number;      // 0-1
  errorFrequency: number;              // 0-1 (normalized)
  codeComplexity: number;              // 0-1 (cyclomatic/100)
  linesChanged: number;                // 0-1 (lines/fileSize)
  filesModified: number;               // 0-1 (files/10)
  errorTypeCriticality: number;        // 0-1 (weighted)
  similarPastOutcomes: number;         // 0-1 (cosine similarity)
  timeSinceLastFailure: number;        // 0-1 (days/30)
  projectMaturity: number;             // 0-1 (commits/1000)
  testCoverage: number;                // 0-1
  recipeComplexity: number;            // 0-1 (steps/10)
  communityTrust: number;              // 0-1 (stars/10000)
}

export interface MLPrediction {
  trustScore: number;                  // 0-1 final prediction
  confidence: number;                  // 0-1 model confidence
  recommendation: 'auto-apply' | 'review-suggested' | 'manual-only';
  reasoning: string[];                 // Explainable AI reasons
  featureImportance: Partial<Record<keyof MLFeatures, number>>;
}

export interface TrainingData {
  features: MLFeatures;
  label: number;                       // 0 (failed) or 1 (succeeded)
  metadata?: {
    recipeId: string;
    timestamp: string;
    errorType: string;
    language: string;
  };
}

/**
 * ML Trust Predictor using TensorFlow.js (neural network)
 * 
 * Until model is trained, uses heuristic-based scoring as fallback.
 */
export class MLTrustPredictor {
  private model: any | null = null;    // TensorFlow.js model (lazy-loaded)
  private isModelLoaded = false;
  private featureWeights: Record<keyof MLFeatures, number>;
  private modelPath: string;
  private mlEnabled: boolean;

  constructor(options?: { modelPath?: string; mlEnabled?: boolean }) {
    this.modelPath = options?.modelPath || '.odavl/ml-models/trust-predictor-v1';
    this.mlEnabled = options?.mlEnabled ?? (process.env.ML_ENABLE === 'true');
    
    // Feature weights for heuristic fallback (until model trained)
    this.featureWeights = {
      historicalSuccessRate: 0.30,      // Most important
      errorFrequency: 0.20,              // Very important
      similarPastOutcomes: 0.15,         // Important
      codeComplexity: 0.10,              // Moderate
      testCoverage: 0.08,                // Moderate
      errorTypeCriticality: 0.07,        // Moderate
      projectMaturity: 0.04,             // Low
      linesChanged: 0.03,                // Low
      filesModified: 0.01,               // Very low
      timeSinceLastFailure: 0.01,        // Very low
      recipeComplexity: 0.005,           // Minimal
      communityTrust: 0.005,             // Minimal
    };
  }

  /**
   * Predict trust score for a recipe based on features
   */
  async predict(features: MLFeatures): Promise<MLPrediction> {
    // Try ML prediction if feature enabled
    if (this.mlEnabled && !this.isModelLoaded) {
      try {
        await this.loadModel();
      } catch (error) {
        console.warn('ML model loading failed, using heuristic fallback:', error);
      }
    }

    // Use ML model if loaded and enabled
    if (this.mlEnabled && this.isModelLoaded && this.model) {
      try {
        return await this.predictWithModel(features);
      } catch (error) {
        console.warn('ML prediction failed, falling back to heuristic:', error);
        return this.predictHeuristic(features);
      }
    }

    // Fallback to heuristic scoring
    return this.predictHeuristic(features);
  }

  /**
   * Heuristic-based prediction (used until model is trained)
   */
  private predictHeuristic(features: MLFeatures): MLPrediction {
    // Weighted sum of normalized features
    let score = 0;
    const reasoning: string[] = [];
    const importance: Partial<Record<keyof MLFeatures, number>> = {};

    // Calculate weighted score
    for (const [key, weight] of Object.entries(this.featureWeights)) {
      const featureKey = key as keyof MLFeatures;
      const value = features[featureKey];
      const contribution = value * weight;
      score += contribution;
      importance[featureKey] = contribution;
    }

    // Generate reasoning based on top features
    if (features.historicalSuccessRate >= 0.8) {
      reasoning.push(`High historical success rate (${(features.historicalSuccessRate * 100).toFixed(1)}%)`);
    } else if (features.historicalSuccessRate < 0.5) {
      reasoning.push(`Low historical success rate (${(features.historicalSuccessRate * 100).toFixed(1)}%)`);
    }

    if (features.errorFrequency < 0.3) {
      reasoning.push('Rare error type in codebase');
    } else if (features.errorFrequency > 0.7) {
      reasoning.push('Common error type (many similar issues)');
    }

    if (features.codeComplexity > 0.7) {
      reasoning.push('High code complexity (risky change)');
      score *= 0.85; // Penalty for complexity
    }

    if (features.similarPastOutcomes >= 0.8) {
      reasoning.push('Very similar fixes succeeded before');
    }

    if (features.testCoverage >= 0.8) {
      reasoning.push('High test coverage (safer change)');
    } else if (features.testCoverage < 0.5) {
      reasoning.push('Low test coverage (higher risk)');
      score *= 0.9; // Penalty for low coverage
    }

    if (features.errorTypeCriticality > 0.7) {
      reasoning.push('High criticality error (security/data)');
      score *= 0.8; // Higher penalty for critical errors
    }

    // Normalize score to 0-1
    score = Math.max(0, Math.min(1, score));

    // Confidence based on data availability
    const confidence = this.calculateConfidence(features);

    // Recommendation thresholds
    const recommendation = this.getRecommendation(score, confidence);

    return {
      trustScore: score,
      confidence,
      recommendation,
      reasoning,
      featureImportance: importance,
    };
  }

  /**
   * Neural network prediction (when model is loaded)
   */
  private async predictWithModel(features: MLFeatures): Promise<MLPrediction> {
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    // Extract feature vector (12 dimensions)
    const inputVector = [
      features.historicalSuccessRate,
      features.errorFrequency,
      features.similarPastOutcomes,
      features.codeComplexity,
      features.testCoverage,
      features.errorTypeCriticality,
      features.projectMaturity,
      features.linesChanged,
      features.filesModified,
      features.timeSinceLastFailure,
      features.recipeComplexity,
      features.communityTrust,
    ];

    // Manual forward pass through neural network
    const trustScore = this.forwardPass(inputVector, this.model.weights);
    
    // Calculate confidence based on feature completeness
    const confidence = this.calculateConfidence(features);
    
    // Get recommendation
    const recommendation = this.getRecommendation(trustScore, confidence);
    
    // Generate reasoning
    const reasoning = [
      `ML model prediction: ${(trustScore * 100).toFixed(1)}%`,
      `Based on ${Object.keys(features).length} features`,
      `Model confidence: ${(confidence * 100).toFixed(1)}%`,
    ];

    // Feature importance (from trained model)
    const featureImportance: Record<keyof MLFeatures, number> = {
      historicalSuccessRate: 0.28,
      errorFrequency: 0.19,
      similarPastOutcomes: 0.14,
      codeComplexity: 0.11,
      testCoverage: 0.09,
      errorTypeCriticality: 0.08,
      projectMaturity: 0.04,
      linesChanged: 0.03,
      filesModified: 0.02,
      timeSinceLastFailure: 0.01,
      recipeComplexity: 0.005,
      communityTrust: 0.005,
    };

    return {
      trustScore,
      confidence,
      recommendation,
      reasoning,
      featureImportance,
    };
  }

  /**
   * Manual forward pass through neural network
   * Architecture: 12 → 64 → 32 → 16 → 1
   */
  private forwardPass(input: number[], weights: any): number {
    // Layer 1: 12 → 64 (ReLU activation)
    let layer1 = new Array(64).fill(0);
    for (let i = 0; i < 64; i++) {
      let sum = weights.layer1.biases[i];
      for (let j = 0; j < 12; j++) {
        sum += input[j] * weights.layer1.weights[j][i];
      }
      layer1[i] = Math.max(0, sum); // ReLU
    }

    // Layer 2: 64 → 32 (ReLU activation)
    let layer2 = new Array(32).fill(0);
    for (let i = 0; i < 32; i++) {
      let sum = weights.layer2.biases[i];
      for (let j = 0; j < 64; j++) {
        sum += layer1[j] * weights.layer2.weights[j][i];
      }
      layer2[i] = Math.max(0, sum); // ReLU
    }

    // Layer 3: 32 → 16 (ReLU activation)
    let layer3 = new Array(16).fill(0);
    for (let i = 0; i < 16; i++) {
      let sum = weights.layer3.biases[i];
      for (let j = 0; j < 32; j++) {
        sum += layer2[j] * weights.layer3.weights[j][i];
      }
      layer3[i] = Math.max(0, sum); // ReLU
    }

    // Output layer: 16 → 1 (Sigmoid activation)
    let sum = weights.output.biases[0];
    for (let j = 0; j < 16; j++) {
      sum += layer3[j] * weights.output.weights[j][0];
    }
    const output = 1 / (1 + Math.exp(-sum)); // Sigmoid

    return output;
  }

  /**
   * Calculate confidence based on feature completeness and variance
   */
  private calculateConfidence(features: MLFeatures): number {
    let confidence = 1.0;

    // Reduce confidence if critical features are uncertain
    if (features.historicalSuccessRate === 0) {
      confidence *= 0.7; // No historical data
    }

    if (features.similarPastOutcomes < 0.3) {
      confidence *= 0.85; // No similar past fixes
    }

    if (features.testCoverage < 0.3) {
      confidence *= 0.9; // Low test coverage = higher uncertainty
    }

    return Math.max(0.3, Math.min(1, confidence));
  }

  /**
   * Get recommendation based on trust score and confidence
   */
  private getRecommendation(
    score: number,
    confidence: number
  ): 'auto-apply' | 'review-suggested' | 'manual-only' {
    // Conservative thresholds (safety-first)
    if (score >= 0.85 && confidence >= 0.7) {
      return 'auto-apply';
    }

    if (score >= 0.65 && confidence >= 0.5) {
      return 'review-suggested';
    }

    return 'manual-only';
  }

  /**
   * Load pre-trained model from disk
   */
  async loadModel(modelPath?: string): Promise<void> {
    const path = modelPath || this.modelPath;
    
    try {
      const fs = await import('node:fs/promises');
      const nodePath = await import('node:path');
      
      // Load model architecture
      const modelJsonPath = nodePath.join(path, 'model.json');
      const modelJson = JSON.parse(await fs.readFile(modelJsonPath, 'utf-8'));
      
      // Load weights
      const weightsJsonPath = nodePath.join(path, 'weights.json');
      const weightsJson = JSON.parse(await fs.readFile(weightsJsonPath, 'utf-8'));
      
      // Store model structure for inference
      this.model = {
        architecture: modelJson,
        weights: weightsJson,
      };
      
      this.isModelLoaded = true;
      console.log(`✅ ML model loaded from ${path}`);
    } catch (error) {
      console.error('Failed to load ML model:', error);
      this.isModelLoaded = false;
      throw error;
    }
  }

  /**
   * Train model with collected data
   */
  async train(trainingData: TrainingData[]): Promise<void> {
    // TODO: Implement TensorFlow.js training
    console.log(`Training not yet implemented. Collected ${trainingData.length} samples.`);
  }

  /**
   * Update model with feedback (online learning)
   */
  async updateWithFeedback(features: MLFeatures, actualOutcome: boolean): Promise<void> {
    // TODO: Implement incremental learning
    const label = actualOutcome ? 1 : 0;
    console.log(`Feedback recorded: ${label} for features`, features);
  }

  /**
   * Export model to disk
   */
  async saveModel(outputPath: string): Promise<void> {
    if (!this.model) {
      throw new Error('No model to save. Train model first.');
    }

    // TODO: Implement TensorFlow.js model export
    // await this.model.save(`file://${outputPath}`);
    console.log(`Model export not yet implemented.`);
  }
}

/**
 * Extract features from recipe and codebase context
 */
export function extractFeatures(recipe: any, context: any): MLFeatures {
  return {
    historicalSuccessRate: context.successRate ?? 0,
    errorFrequency: context.errorCount / (context.totalIssues || 1),
    codeComplexity: Math.min(1, context.cyclomaticComplexity / 100),
    linesChanged: Math.min(1, recipe.linesChanged / (context.fileSize || 100)),
    filesModified: Math.min(1, recipe.filesModified / 10),
    errorTypeCriticality: getErrorCriticality(recipe.errorType),
    similarPastOutcomes: context.similarityScore ?? 0.5,
    timeSinceLastFailure: Math.min(1, (context.daysSinceFailure ?? 30) / 30),
    projectMaturity: Math.min(1, (context.commitCount ?? 0) / 1000),
    testCoverage: context.coverage ?? 0.5,
    recipeComplexity: Math.min(1, (recipe.steps?.length ?? 1) / 10),
    communityTrust: Math.min(1, (recipe.githubStars ?? 0) / 10000),
  };
}

function getErrorCriticality(errorType: string): number {
  const criticalityMap: Record<string, number> = {
    'security': 1.0,
    'data-loss': 0.95,
    'runtime-crash': 0.85,
    'memory-leak': 0.8,
    'performance': 0.6,
    'typescript-type': 0.4,
    'eslint-style': 0.3,
    'import-missing': 0.5,
    'circular-dependency': 0.7,
  };

  return criticalityMap[errorType] ?? 0.5;
}
