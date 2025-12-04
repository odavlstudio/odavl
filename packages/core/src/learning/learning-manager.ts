/**
 * ODAVL Learning System Manager
 * Integrates with recipes-trust.json and learning.yml
 * Enables auto-learning from user behavior
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as yaml from 'yaml';

export interface LearningConfig {
  learning_config: {
    code_style: {
      prefer: string[];
      avoid: string[];
    };
    pattern_trust: Record<string, number>;
    auto_adjust: {
      enabled: boolean;
      min_samples: number;
      success_threshold: number;
      failure_threshold: number;
      max_trust: number;
      min_trust: number;
      adjustment_rate: number;
    };
    feedback: {
      collect_metrics: boolean;
      track_user_overrides: boolean;
      override_penalty: number;
      learn_from_rollbacks: boolean;
      rollback_penalty: number;
      learn_from_edits: boolean;
      alternative_bonus: number;
      success_bonus: number;
    };
    project_overrides: {
      enabled: boolean;
      inherit_global: boolean;
      custom_patterns: string[];
    };
  };
  legacy_integration: {
    trust_scores: {
      import_from: string;
      merge_strategy: 'weighted_average' | 'max' | 'min';
      legacy_weight: number;
      new_weight: number;
    };
    gates: {
      import_from: string;
      respect_constraints: boolean;
    };
    history: {
      import_from: string;
      analyze_patterns: boolean;
      learn_from_past: boolean;
    };
  };
  performance: {
    cache_learned_patterns: boolean;
    cache_ttl: number;
    async_learning: boolean;
    batch_updates: boolean;
  };
  monitoring: {
    log_learning_events: boolean;
    log_path: string;
    track_trust_evolution: boolean;
    evolution_path: string;
  };
  safety: {
    require_verification: boolean;
    max_auto_adjustments: number;
    conservative_mode: boolean;
    emergency_stop_threshold: number;
  };
}

export interface RecipeTrust {
  id: string;
  runs: number;
  success: number;
  trust: number;
  consecutiveFailures?: number;
  blacklisted: boolean;
}

export interface TrustEvolution {
  timestamp: string;
  recipe_id: string;
  old_trust: number;
  new_trust: number;
  reason: string;
  runs: number;
  success_rate: number;
}

export class LearningManager {
  private config: LearningConfig | null = null;
  private trustScores: RecipeTrust[] = [];
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Load learning configuration from .odavl/config/learning.yml
   */
  async loadConfig(): Promise<LearningConfig> {
    const configPath = path.join(this.workspaceRoot, '.odavl/config/learning.yml');
    
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      this.config = yaml.parse(content) as LearningConfig;
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load learning config: ${error}`);
    }
  }

  /**
   * Load legacy trust scores from recipes-trust.json
   */
  async loadLegacyTrustScores(): Promise<RecipeTrust[]> {
    if (!this.config) {
      await this.loadConfig();
    }

    const trustPath = path.join(
      this.workspaceRoot,
      this.config!.legacy_integration.trust_scores.import_from
    );

    try {
      const content = await fs.readFile(trustPath, 'utf-8');
      this.trustScores = JSON.parse(content) as RecipeTrust[];
      return this.trustScores;
    } catch (error) {
      console.warn(`Could not load legacy trust scores: ${error}`);
      return [];
    }
  }

  /**
   * Get trust score for a specific recipe
   */
  getTrustScore(recipeId: string): number {
    const recipe = this.trustScores.find(r => r.id === recipeId);
    
    if (!recipe) {
      // Default trust for new recipes
      return 0.5;
    }

    // Check if blacklisted
    if (recipe.blacklisted) {
      return 0.1;
    }

    return recipe.trust;
  }

  /**
   * Update trust score based on run outcome
   */
  async updateTrustScore(
    recipeId: string,
    success: boolean,
    reason?: string
  ): Promise<number> {
    if (!this.config) {
      await this.loadConfig();
    }

    const autoAdjust = this.config!.learning_config.auto_adjust;
    
    if (!autoAdjust.enabled) {
      return this.getTrustScore(recipeId);
    }

    let recipe = this.trustScores.find(r => r.id === recipeId);
    
    if (!recipe) {
      // Create new recipe entry
      recipe = {
        id: recipeId,
        runs: 0,
        success: 0,
        trust: 0.5,
        consecutiveFailures: 0,
        blacklisted: false
      };
      this.trustScores.push(recipe);
    }

    // Update stats
    recipe.runs++;
    if (success) {
      recipe.success++;
      recipe.consecutiveFailures = 0;
    } else {
      recipe.consecutiveFailures = (recipe.consecutiveFailures || 0) + 1;
    }

    const oldTrust = recipe.trust;
    const successRate = recipe.success / recipe.runs;

    // Auto-adjust trust score
    if (recipe.runs >= autoAdjust.min_samples) {
      if (successRate >= autoAdjust.success_threshold) {
        // Increase trust
        recipe.trust = Math.min(
          autoAdjust.max_trust,
          recipe.trust + autoAdjust.adjustment_rate
        );
      } else if (successRate < autoAdjust.failure_threshold) {
        // Decrease trust
        recipe.trust = Math.max(
          autoAdjust.min_trust,
          recipe.trust - autoAdjust.adjustment_rate * 2
        );
      }
    }

    // Blacklist if 3+ consecutive failures
    if (recipe.consecutiveFailures >= 3) {
      recipe.blacklisted = true;
      recipe.trust = 0.1;
    }

    // Log trust evolution
    await this.logTrustEvolution({
      timestamp: new Date().toISOString(),
      recipe_id: recipeId,
      old_trust: oldTrust,
      new_trust: recipe.trust,
      reason: reason || (success ? 'success' : 'failure'),
      runs: recipe.runs,
      success_rate: successRate
    });

    // Save updated trust scores
    await this.saveTrustScores();

    return recipe.trust;
  }

  /**
   * Apply feedback penalty (user override or rollback)
   */
  async applyFeedbackPenalty(
    recipeId: string,
    feedbackType: 'override' | 'rollback'
  ): Promise<number> {
    if (!this.config) {
      await this.loadConfig();
    }

    const feedback = this.config!.learning_config.feedback;
    const recipe = this.trustScores.find(r => r.id === recipeId);
    
    if (!recipe) {
      return 0.5;
    }

    const penalty = feedbackType === 'override'
      ? feedback.override_penalty
      : feedback.rollback_penalty;

    const oldTrust = recipe.trust;
    recipe.trust = Math.max(0.1, recipe.trust + penalty);

    await this.logTrustEvolution({
      timestamp: new Date().toISOString(),
      recipe_id: recipeId,
      old_trust: oldTrust,
      new_trust: recipe.trust,
      reason: `user_${feedbackType}`,
      runs: recipe.runs,
      success_rate: recipe.success / recipe.runs
    });

    await this.saveTrustScores();
    return recipe.trust;
  }

  /**
   * Apply success bonus
   */
  async applySuccessBonus(recipeId: string): Promise<number> {
    if (!this.config) {
      await this.loadConfig();
    }

    const feedback = this.config!.learning_config.feedback;
    const recipe = this.trustScores.find(r => r.id === recipeId);
    
    if (!recipe) {
      return 0.5;
    }

    const oldTrust = recipe.trust;
    recipe.trust = Math.min(0.98, recipe.trust + feedback.success_bonus);

    await this.logTrustEvolution({
      timestamp: new Date().toISOString(),
      recipe_id: recipeId,
      old_trust: oldTrust,
      new_trust: recipe.trust,
      reason: 'verified_success',
      runs: recipe.runs,
      success_rate: recipe.success / recipe.runs
    });

    await this.saveTrustScores();
    return recipe.trust;
  }

  /**
   * Check if pattern should be avoided
   */
  shouldAvoidPattern(pattern: string): boolean {
    if (!this.config) {
      return false;
    }

    return this.config.learning_config.code_style.avoid.includes(pattern);
  }

  /**
   * Check if pattern is preferred
   */
  isPreferredPattern(pattern: string): boolean {
    if (!this.config) {
      return false;
    }

    return this.config.learning_config.code_style.prefer.includes(pattern);
  }

  /**
   * Save updated trust scores
   */
  private async saveTrustScores(): Promise<void> {
    if (!this.config) {
      return;
    }

    const trustPath = path.join(
      this.workspaceRoot,
      this.config.legacy_integration.trust_scores.import_from
    );

    await fs.writeFile(
      trustPath,
      JSON.stringify(this.trustScores, null, 2),
      'utf-8'
    );
  }

  /**
   * Log trust evolution for monitoring
   */
  private async logTrustEvolution(evolution: TrustEvolution): Promise<void> {
    if (!this.config || !this.config.monitoring.track_trust_evolution) {
      return;
    }

    const evolutionPath = path.join(
      this.workspaceRoot,
      this.config.monitoring.evolution_path
    );

    // Ensure directory exists
    await fs.mkdir(path.dirname(evolutionPath), { recursive: true });

    // Append to evolution log
    let evolutions: TrustEvolution[] = [];
    try {
      const content = await fs.readFile(evolutionPath, 'utf-8');
      evolutions = JSON.parse(content);
    } catch {
      // File doesn't exist yet
    }

    evolutions.push(evolution);

    // Keep only last 1000 entries
    if (evolutions.length > 1000) {
      evolutions = evolutions.slice(-1000);
    }

    await fs.writeFile(
      evolutionPath,
      JSON.stringify(evolutions, null, 2),
      'utf-8'
    );
  }

  /**
   * Get learning statistics
   */
  async getStatistics(): Promise<{
    total_recipes: number;
    active_recipes: number;
    blacklisted_recipes: number;
    avg_trust_score: number;
    high_trust_count: number;
    low_trust_count: number;
  }> {
    await this.loadLegacyTrustScores();

    const active = this.trustScores.filter(r => !r.blacklisted);
    const avgTrust = active.reduce((sum, r) => sum + r.trust, 0) / (active.length || 1);

    return {
      total_recipes: this.trustScores.length,
      active_recipes: active.length,
      blacklisted_recipes: this.trustScores.filter(r => r.blacklisted).length,
      avg_trust_score: Math.round(avgTrust * 100) / 100,
      high_trust_count: active.filter(r => r.trust >= 0.8).length,
      low_trust_count: active.filter(r => r.trust < 0.5).length
    };
  }
}
