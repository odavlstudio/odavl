/**
 * ODAVL Autopilot Recipe Selection Engine
 * Phase Ω-P3: ML + Fusion powered recipe selection
 * Phase Ω-P4: REAL INTELLIGENCE ACTIVATION
 * Phase Ω-P5: OMS v2 File Type Intelligence
 * 
 * Requirements:
 * - Use ML predictor first (ml-predictor-v2)
 * - Fall back to trust-score model
 * - Weight with Brain Fusion Engine
 * - Select top N recipes with full justification
 * - OMS integration for file type risk assessment
 */

import type { AutopilotFixCandidate } from '../../../core/src/intake/insight-intake';
import { FusionEngine } from '../../../../brain/fusion/fusion-engine.js';
import { predictFailureProbabilityEnsemble } from '../../../../brain/learning/predictors.js';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { loadOMSContext, resolveFileType } from '../../../../oms/oms-context.js';
import { computeFileRiskScore } from '../../../../oms/risk/file-risk-index.js';
import type { AdaptiveBrainState } from '../../../../brain/adaptive/adaptive-brain.js';

export interface RecipeScore {
  recipeId: string;
  mlScore: number; // 0-1 from ML predictor
  trustScore: number; // 0-1 from trust history
  fusionScore: number; // 0-1 from Brain Fusion Engine
  finalScore: number; // Weighted blend
  safetyClass: 'safe' | 'review' | 'unsafe';
  justification: string[];
}

export interface SelectedRecipe {
  recipeId: string;
  score: RecipeScore;
  targetCandidates: AutopilotFixCandidate[];
  estimatedImpact: {
    filesAffected: number;
    locChanged: number;
    riskReduction: number; // Estimated % reduction in risk
  };
}

export interface RecipeSelectorOptions {
  maxRecipes?: number;
  minMLScore?: number;
  minTrustScore?: number;
  minFusionScore?: number;
  safetyThreshold?: 'safe' | 'review';
  useFusionEngine?: boolean;
}

// OMEGA-P5: OMS context cache
let cachedOmsContext: Awaited<ReturnType<typeof loadOMSContext>> | null = null;

async function getOmsStatsForCandidates(candidates: AutopilotFixCandidate[]) {
  try {
    if (!cachedOmsContext) {
      cachedOmsContext = await loadOMSContext();
    }

    let totalRisk = 0;
    let totalImportance = 0;
    let count = 0;

    for (const candidate of candidates) {
      const filePath = candidate.finding.file;
      const fileTypeDef = resolveFileType(filePath);
      if (!fileTypeDef) continue;

      const riskScore = computeFileRiskScore({ type: fileTypeDef });
      totalRisk += riskScore;
      totalImportance += fileTypeDef.importance ?? 0.5;
      count++;
    }

    if (count === 0) {
      return { avgRisk: 0.3, avgImportance: 0.5 };
    }

    return {
      avgRisk: totalRisk / count,
      avgImportance: totalImportance / count,
    };
  } catch (error) {
    return { avgRisk: 0.3, avgImportance: 0.5 };
  }
}

export class RecipeSelector {
  private defaultOptions: Required<RecipeSelectorOptions> = {
    maxRecipes: 5,
    minMLScore: 0.6,
    minTrustScore: 0.5,
    minFusionScore: 0.65,
    safetyThreshold: 'safe',
    useFusionEngine: true,
  };

  private adaptiveState: AdaptiveBrainState | null = null;

  /**
   * OMEGA-P8: Load adaptive brain state for dynamic behavior
   */
  async loadAdaptiveState(cwd: string): Promise<void> {
    try {
      const statePath = path.join(cwd, '.odavl', 'brain-history', 'adaptive', 'state.json');
      if (existsSync(statePath)) {
        const content = await readFile(statePath, 'utf8');
        this.adaptiveState = JSON.parse(content);
      }
    } catch {
      this.adaptiveState = null;
    }
  }

  /**
   * Select optimal recipes for fix candidates
   */
  async selectRecipes(
    candidates: AutopilotFixCandidate[],
    options?: RecipeSelectorOptions
  ): Promise<SelectedRecipe[]> {
    const opts = { ...this.defaultOptions, ...options };

    // OMEGA-P8: Apply adaptive aggressiveness to thresholds
    if (this.adaptiveState) {
      const baseThreshold = 0.6;
      const adaptiveThreshold = Math.max(0.4, baseThreshold - (this.adaptiveState.autopilotAggressiveness * 0.15));
      opts.minMLScore = Math.min(opts.minMLScore, adaptiveThreshold);
      opts.minFusionScore = Math.min(opts.minFusionScore, adaptiveThreshold + 0.05);

      // Aggressive mode: allow 'review' recipes if aggressiveness >= 0.7
      if (this.adaptiveState.autopilotAggressiveness >= 0.7) {
        opts.safetyThreshold = 'review';
      }
    }

    const selected: SelectedRecipe[] = [];

    // Group candidates by recipe
    const grouped = this.groupByRecipe(candidates);

    // Score each recipe
    for (const [recipeId, recipeCandidates] of grouped) {
      const score = await this.scoreRecipe(recipeId, recipeCandidates);

      // Filter by thresholds
      if (
        score.mlScore < opts.minMLScore ||
        score.trustScore < opts.minTrustScore ||
        score.fusionScore < opts.minFusionScore
      ) {
        continue;
      }

      // Safety gate
      if (!this.meetsSafetyThreshold(score.safetyClass, opts.safetyThreshold)) {
        continue;
      }

      selected.push({
        recipeId,
        score,
        targetCandidates: recipeCandidates,
        estimatedImpact: this.estimateImpact(recipeCandidates),
      });
    }

    // Sort by final score descending
    selected.sort((a, b) => b.score.finalScore - a.score.finalScore);

    // Return top N
    return selected.slice(0, opts.maxRecipes);
  }

  /**
   * Score a recipe with ML + Trust + Fusion (OMEGA-P4 + OMEGA-P5)
   */
  private async scoreRecipe(recipeId: string, candidates: AutopilotFixCandidate[]): Promise<RecipeScore> {
    const mlScore = await this.getMLScore(recipeId, candidates);
    const trustScore = await this.getTrustScore(recipeId);
    const fusionScore = await this.getFusionScore(recipeId, candidates, mlScore, trustScore);

    // Weighted blend: 40% ML + 30% Trust + 30% Fusion
    const finalScore = mlScore * 0.4 + trustScore * 0.3 + fusionScore * 0.3;

    const safetyClass = this.classifySafety(finalScore, mlScore, trustScore);
    const justification = this.generateJustification(recipeId, mlScore, trustScore, fusionScore, safetyClass);

    return {
      recipeId,
      mlScore,
      trustScore,
      fusionScore,
      finalScore,
      safetyClass,
      justification,
    };
  }

  /**
   * Get ML predictor score for recipe (OMEGA-P4 + OMEGA-P5: OMS)
   */
  private async getMLScore(_recipeId: string, candidates: AutopilotFixCandidate[]): Promise<number> {
    try {
      const avgPriority = candidates.reduce((sum, c) => sum + c.priority, 0) / candidates.length;

      // OMEGA-P5: OMS integration
      const { avgRisk: omsRisk, avgImportance } = await getOmsStatsForCandidates(candidates);

      const inputVector = [
        omsRisk,                    // OMS-derived risk
        avgPriority / 100,
        0.8,
        0.2,
        0,
        0,
        0,
        candidates.length / 10,
      ];

      const prediction = await predictFailureProbabilityEnsemble(inputVector);
      const baseScore = 1 - prediction.ensembleFailureProbability;
      return baseScore * (0.7 + avgImportance * 0.3);
    } catch (error) {
      const avgPriority = candidates.reduce((sum, c) => sum + c.priority, 0) / candidates.length;
      const avgRisk = candidates.reduce((sum, c) => sum + c.riskWeight, 0) / candidates.length;
      return (avgPriority / 100) * 0.7 + (1 - avgRisk) * 0.3;
    }
  }

  /**
   * Get trust score from history
   */
  private async getTrustScore(recipeId: string): Promise<number> {
    try {
      const trustPath = path.join(process.cwd(), '.odavl/recipes-trust.json');
      if (!existsSync(trustPath)) {
        return this.getDefaultTrust(recipeId);
      }

      const content = await readFile(trustPath, 'utf8');
      const trustHistory = JSON.parse(content);

      if (trustHistory[recipeId]) {
        return trustHistory[recipeId].successRate || 0.6;
      }

      return this.getDefaultTrust(recipeId);
    } catch (error) {
      return this.getDefaultTrust(recipeId);
    }
  }

  private getDefaultTrust(recipeId: string): number {
    const defaultTrust: Record<string, number> = {
      'fix-typescript-errors': 0.85,
      'fix-eslint-errors': 0.9,
      'organize-imports': 0.95,
      'remove-unused-vars': 0.8,
      'fix-async-await': 0.75,
    };
    return defaultTrust[recipeId] || 0.6;
  }

  /**
   * Get Fusion Engine score (OMEGA-P4 + OMEGA-P5)
   */
  private async getFusionScore(
    _recipeId: string,
    candidates: AutopilotFixCandidate[],
    mlScore: number,
    trustScore: number
  ): Promise<number> {
    try {
      const avgRisk = candidates.reduce((sum, c) => sum + c.riskWeight, 0) / candidates.length;
      
      // OMEGA-P5: OMS-derived risk
      const { avgRisk: omsRisk } = await getOmsStatsForCandidates(candidates);

      const fusionEngine = new FusionEngine();
      const prediction = await predictFailureProbabilityEnsemble([avgRisk, 0, 0, 0, 0, 0, 0, 0]);

      const fusionInput = {
        nnPrediction: mlScore,
        lstmPrediction: null,
        mtlPredictions: {
          success: mlScore,
          performance: trustScore,
          security: 1 - omsRisk,
          downtime: 0.05,
        },
        bayesianPrediction: null,
        heuristicPrediction: prediction.heuristicPrediction,
        context: {
          recentRegressions: 0,
          historicalStability: trustScore,
          fileTypeRisk: omsRisk,
        },
      };

      const fusionResult = await fusionEngine.fuse(fusionInput);
      return fusionResult.fusionScore;
    } catch {
      return mlScore * 0.6 + trustScore * 0.4;
    }
  }

  private classifySafety(
    finalScore: number,
    mlScore: number,
    trustScore: number
  ): 'safe' | 'review' | 'unsafe' {
    if (finalScore >= 0.8 && mlScore >= 0.7 && trustScore >= 0.7) return 'safe';
    if (finalScore >= 0.6 && mlScore >= 0.5 && trustScore >= 0.5) return 'review';
    return 'unsafe';
  }

  private generateJustification(
    recipeId: string,
    mlScore: number,
    trustScore: number,
    fusionScore: number,
    safetyClass: string
  ): string[] {
    const justification: string[] = [];
    justification.push(`Recipe: ${recipeId}`);
    justification.push(`ML Score: ${(mlScore * 100).toFixed(1)}% (Brain ensemble prediction)`);
    justification.push(`Trust Score: ${(trustScore * 100).toFixed(1)}% (historical success rate)`);
    justification.push(`Fusion Score: ${(fusionScore * 100).toFixed(1)}% (multi-model blend)`);
    justification.push(`Safety: ${this.getSafetyDescription(safetyClass)}`);
    return justification;
  }

  private getSafetyDescription(safetyClass: string): string {
    const descriptions = {
      safe: 'Safe for automatic execution',
      review: 'Recommended for human review',
      unsafe: 'High risk - manual intervention required',
    };
    return descriptions[safetyClass as keyof typeof descriptions] || 'Unknown';
  }

  private meetsSafetyThreshold(actual: string, threshold: string): boolean {
    const levels = ['unsafe', 'review', 'safe'];
    const actualLevel = levels.indexOf(actual);
    const thresholdLevel = levels.indexOf(threshold);
    return actualLevel >= thresholdLevel;
  }

  private groupByRecipe(candidates: AutopilotFixCandidate[]): Map<string, AutopilotFixCandidate[]> {
    const groups = new Map<string, AutopilotFixCandidate[]>();

    for (const candidate of candidates) {
      // Use first potential recipe as grouping key
      const recipeId = candidate.potentialRecipes[0] || 'unknown';
      if (!groups.has(recipeId)) {
        groups.set(recipeId, []);
      }
      groups.get(recipeId)!.push(candidate);
    }

    return groups;
  }

  private estimateImpact(candidates: AutopilotFixCandidate[]): {
    filesAffected: number;
    locChanged: number;
    riskReduction: number;
  } {
    const uniqueFiles = new Set(candidates.map((c) => c.finding.file));
    const totalRisk = candidates.reduce((sum, c) => sum + c.riskWeight, 0);
    const avgRisk = totalRisk / candidates.length;

    return {
      filesAffected: uniqueFiles.size,
      locChanged: candidates.length * 5, // Estimate
      riskReduction: avgRisk * 100, // Estimated % reduction
    };
  }
}
