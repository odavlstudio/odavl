/**
 * ML Recipe Integration - Connect ML Predictor with Autopilot Recipes
 * 
 * Integrates ML trust scoring into recipe selection and execution:
 * 1. Load recipes from .odavl/recipes/
 * 2. Enhance each recipe with ML trust score
 * 3. Sort by ML score (not just legacy trust)
 * 4. Track outcomes for feedback loop
 * 5. A/B test ML vs Legacy scoring
 */

import { MLTrustPredictor, extractFeatures, type MLFeatures, type MLPrediction } from './ml-trust-predictor.js';

export interface Recipe {
  id: string;
  name: string;
  errorType: string;
  trustScore: number;              // Legacy heuristic score (0-1)
  successCount: number;
  failureCount: number;
  lastUsed?: string;
  steps: string[];
  linesChanged?: number;
  filesModified?: number;
}

export interface RecipeWithMLScore extends Recipe {
  mlTrustScore: number;           // ML prediction (0-1)
  mlConfidence: number;           // ML confidence (0-1)
  mlRecommendation: 'auto-apply' | 'review-suggested' | 'manual-only';
  mlReasoning: string[];
  useMLScore: boolean;            // Feature flag
}

export interface RecipeFeedback {
  recipeId: string;
  mlTrustScore: number;
  actualOutcome: boolean;
  timestamp: string;
  features: MLFeatures;
}

/**
 * ML Recipe Manager - Integrates ML scoring with Autopilot recipes
 */
export class MLRecipeManager {
  private mlPredictor: MLTrustPredictor;
  private useML = false; // Feature flag (default: OFF until trained)
  private feedbackLog: RecipeFeedback[] = [];

  constructor() {
    this.mlPredictor = new MLTrustPredictor();
  }

  /**
   * Load and enhance recipes with ML scores
   */
  async selectBestRecipe(
    recipes: Recipe[],
    context: any
  ): Promise<RecipeWithMLScore | null> {
    if (recipes.length === 0) {
      return null;
    }

    // Enhance all recipes with ML scores
    const enhancedRecipes = await Promise.all(
      recipes.map(recipe => this.enhanceWithML(recipe, context))
    );

    // Filter out blacklisted recipes (ML score < 0.2)
    const validRecipes = enhancedRecipes.filter(r => 
      this.useML ? r.mlTrustScore >= 0.2 : r.trustScore >= 0.2
    );

    if (validRecipes.length === 0) {
      return null;
    }

    // Sort by ML score (if enabled) or legacy score
    const sortedRecipes = validRecipes.sort((a, b) => {
      if (this.useML) {
        // Sort by ML score * confidence (weighted)
        const scoreA = a.mlTrustScore * a.mlConfidence;
        const scoreB = b.mlTrustScore * b.mlConfidence;
        return scoreB - scoreA;
      } else {
        // Legacy sorting
        return b.trustScore - a.trustScore;
      }
    });

    return sortedRecipes[0];
  }

  /**
   * Enhance recipe with ML prediction
   */
  private async enhanceWithML(recipe: Recipe, context: any): Promise<RecipeWithMLScore> {
    // Extract features for ML prediction
    const features = extractFeatures(recipe, context);

    // Get ML prediction
    const prediction = await this.mlPredictor.predict(features);

    return {
      ...recipe,
      mlTrustScore: prediction.trustScore,
      mlConfidence: prediction.confidence,
      mlRecommendation: prediction.recommendation,
      mlReasoning: prediction.reasoning,
      useMLScore: this.useML,
    };
  }

  /**
   * Update recipe with actual outcome (feedback loop)
   */
  async updateRecipeOutcome(
    recipeId: string,
    succeeded: boolean,
    context: any
  ): Promise<void> {
    // Find recipe
    const recipe = await this.getRecipe(recipeId);
    if (!recipe) {
      return;
    }

    // Extract features
    const features = extractFeatures(recipe, context);

    // Log feedback
    this.feedbackLog.push({
      recipeId,
      mlTrustScore: features.historicalSuccessRate,
      actualOutcome: succeeded,
      timestamp: new Date().toISOString(),
      features,
    });

    // Update ML model (online learning)
    await this.mlPredictor.updateWithFeedback(features, succeeded);

    console.log(`📊 Feedback logged for recipe ${recipeId}: ${succeeded ? 'SUCCESS' : 'FAILURE'}`);
  }

  /**
   * A/B testing: Compare ML vs Legacy scoring
   */
  async compareMLvsLegacy(recipes: Recipe[], context: any): Promise<{
    mlChoice: RecipeWithMLScore | null;
    legacyChoice: RecipeWithMLScore | null;
    agreement: boolean;
  }> {
    // ML scoring
    this.useML = true;
    const mlChoice = await this.selectBestRecipe(recipes, context);

    // Legacy scoring
    this.useML = false;
    const legacyChoice = await this.selectBestRecipe(recipes, context);

    // Check agreement
    const agreement = mlChoice?.id === legacyChoice?.id;

    return { mlChoice, legacyChoice, agreement };
  }

  /**
   * Get ML vs Legacy comparison metrics
   */
  getABTestMetrics(): {
    mlSuccessRate: number;
    legacySuccessRate: number;
    improvement: number;
  } {
    const mlOutcomes = this.feedbackLog.filter(f => f.mlTrustScore >= 0.65);
    const legacyOutcomes = this.feedbackLog.filter(f => f.mlTrustScore < 0.65);

    const mlSuccess = mlOutcomes.filter(f => f.actualOutcome).length;
    const legacySuccess = legacyOutcomes.filter(f => f.actualOutcome).length;

    const mlSuccessRate = mlOutcomes.length > 0 ? mlSuccess / mlOutcomes.length : 0;
    const legacySuccessRate = legacyOutcomes.length > 0 ? legacySuccess / legacyOutcomes.length : 0;

    return {
      mlSuccessRate,
      legacySuccessRate,
      improvement: mlSuccessRate - legacySuccessRate,
    };
  }

  /**
   * Enable ML scoring (feature flag)
   */
  enableML(): void {
    this.useML = true;
    console.log('✅ ML scoring ENABLED');
  }

  /**
   * Disable ML scoring (fallback to legacy)
   */
  disableML(): void {
    this.useML = false;
    console.log('⚠️  ML scoring DISABLED (using legacy)');
  }

  /**
   * Check if ML is enabled
   */
  isMLEnabled(): boolean {
    return this.useML;
  }

  /**
   * Load ML model from disk
   */
  async loadModel(modelPath: string): Promise<void> {
    await this.mlPredictor.loadModel(modelPath);
    console.log(`🤖 ML model loaded from ${modelPath}`);
  }

  /**
   * Get recipe by ID (placeholder - integrate with actual recipe system)
   */
  private async getRecipe(recipeId: string): Promise<Recipe | null> {
    // TODO: Integrate with actual .odavl/recipes/ system
    return null;
  }

  /**
   * Export feedback log for analysis
   */
  exportFeedback(outputPath: string): void {
    const fs = require('fs');
    fs.writeFileSync(outputPath, JSON.stringify(this.feedbackLog, null, 2));
    console.log(`💾 Exported ${this.feedbackLog.length} feedback samples to ${outputPath}`);
  }
}

/**
 * Factory function for easy integration
 */
export function createMLRecipeManager(): MLRecipeManager {
  return new MLRecipeManager();
}
