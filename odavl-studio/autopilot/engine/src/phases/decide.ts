/**
 * DECIDE phase: Selects improvement actions based on trust scores
 * Phase P1: Manifest integration (read-only)
 * Phase P3: ACTIVE manifest enforcement (auto-approval, trust thresholds)
 * @fileoverview Decision-making functionality for ODAVL cycle with auto-approval integration
 */

import * as fsp from "node:fs/promises";
import * as path from "node:path";
import type { Metrics } from "./observe.js";
import { evaluateCommandApproval, logApprovalDecision } from "../policies/autoapprove.js";
import { logPhase } from "./logPhase.js";

// Phase P3: Manifest enforcement
import { shouldAutoApproveRecipe } from '../config/manifest-config.js';

// Phase 3D Round 8: ML predictor upgraded to SimpleTrustPredictor (no TensorFlow.js)
import { SimpleTrustPredictor } from "../ml/simple-trust-predictor.js";

/**
 * Get ML predictor instance (singleton)
 * Phase 3D: Using SimpleTrustPredictor instead of MLTrustPredictor
 */
let mlPredictorInstance: SimpleTrustPredictor | null = null;
async function getMLPredictor(): Promise<SimpleTrustPredictor | null> {
  if (!mlPredictorInstance) {
    try {
      mlPredictorInstance = new SimpleTrustPredictor();
      await mlPredictorInstance.loadModel();
      return mlPredictorInstance;
    } catch (error) {
      console.warn('[DECIDE] ML predictor unavailable, using heuristic fallback');
      return null;
    }
  }
  return mlPredictorInstance;
}

/**
 * Recipe configuration for automated improvements
 */
export interface Recipe {
  id: string;
  name: string;
  description: string;
  trust?: number;
  condition?: RecipeCondition;
  actions: RecipeAction[];
  priority?: number; // Optional priority (higher = more important)
  tags?: string[]; // Optional tags for categorization
}

/**
 * Condition that must be met for recipe to be applicable
 */
export interface RecipeCondition {
  type: 'threshold' | 'any' | 'all';
  rules: Array<{
    metric: string; // e.g., "typescript", "eslint", "security"
    operator: '>' | '>=' | '<' | '<=' | '==' | '!=';
    value: number;
  }>;
}

/**
 * Action to be performed by the recipe
 */
export interface RecipeAction {
  type: 'shell' | 'edit' | 'analyze' | 'command' | 'file-edit' | 'delete';
  command?: string;
  files?: string[];
  description?: string;
  changes?: unknown;
}

/**
 * Trust tracking record for recipe performance
 */
export interface TrustRecord {
  id: string;
  runs: number;
  success: number;
  trust: number;
}


/**
 * Loads available improvement recipes from the .odavl/recipes directory.
 * Each recipe is a JSON file containing automation patterns with trust scores.
 * 
 * @returns Array of recipe objects with id, trust score, and configuration
 */
async function loadRecipes(): Promise<Recipe[]> {
  const ROOT = process.cwd();
  const odavlDir = path.join(ROOT, ".odavl");
  const rDir = path.join(odavlDir, "recipes");
  const list: Recipe[] = [];

  try {
    await fsp.access(rDir);
    const files = await fsp.readdir(rDir);

    for (const f of files) {
      const fp = path.join(rDir, f);
      try {
        const content = await fsp.readFile(fp, "utf8");
        list.push(JSON.parse(content));
      } catch {
        /* ignore malformed recipe files */
      }
    }
  } catch {
    /* directory doesn't exist */
  }

  return list;
}

/**
 * Updates the trust score for a recipe based on execution success.
 * Trust scores range from 0.1 to 1.0, calculated as success_rate with safeguards.
 * Higher trust recipes are prioritized in the DECIDE phase.
 * 
 * @param recipeId - Unique identifier for the recipe
 * @param success - Whether the recipe execution was successful
 */
export async function updateTrust(recipeId: string, success: boolean): Promise<void> {
  const ROOT = process.cwd();
  const trustPath = path.join(ROOT, ".odavl", "recipes-trust.json");
  let arr: TrustRecord[] = [];

  try {
    await fsp.access(trustPath);
    const content = await fsp.readFile(trustPath, "utf8");
    arr = JSON.parse(content);
  } catch {
    /* ignore malformed trust file or missing file */
  }

  let r = arr.find((x) => x.id === recipeId);
  if (!r) {
    r = { id: recipeId, runs: 0, success: 0, trust: 0.8 };
    arr.push(r);
  }

  r.runs++;
  if (success) r.success++;
  r.trust = Math.max(0.1, Math.min(1, r.success / r.runs));

  await fsp.writeFile(trustPath, JSON.stringify(arr, null, 2));
}

/**
 * Evaluates if a recipe's condition is met based on current metrics
 * 
 * @param condition - Recipe condition to evaluate
 * @param metrics - Current code quality metrics
 * @returns true if condition is met, false otherwise
 */
function evaluateCondition(condition: RecipeCondition | undefined, metrics: Metrics): boolean {
  if (!condition) return true; // No condition = always applicable

  const results = condition.rules.map(rule => {
    const metricValue = (metrics as any)[rule.metric] ?? 0;

    switch (rule.operator) {
      case '>': return metricValue > rule.value;
      case '>=': return metricValue >= rule.value;
      case '<': return metricValue < rule.value;
      case '<=': return metricValue <= rule.value;
      case '==': return metricValue === rule.value;
      case '!=': return metricValue !== rule.value;
      default: return false;
    }
  });

  // Apply condition type
  if (condition.type === 'all') {
    return results.every(Boolean); // All rules must pass
  } else if (condition.type === 'any') {
    return results.some(Boolean); // At least one rule must pass
  } else { // 'threshold'
    return results.some(Boolean); // Default to 'any' behavior
  }
}

/**
 * Evaluates if a command should be auto-approved based on safety policies
 * 
 * @param command - The command to evaluate
 * @returns Approval decision with enhanced logging
 */
export async function evaluateCommand(command: string): Promise<boolean> {
  const result = await evaluateCommandApproval(command);
  logApprovalDecision(command, result, "DECIDE");

  return result.approved;
}

/**
 * DECIDE phase: Selects the most appropriate improvement action based on metrics and trust scores.
 * 
 * ✅ Phase 3 Update:
 * - Now uses metrics from Insight analysis (observe.ts reads .odavl/insight/latest-analysis.json)
 * - Filters issues by canBeHandedToAutopilot flag
 * - Autopilot = Executor ONLY (no detection)
 * 
 * Round 13: Enhanced with issue-based recipe selection using new recipe system.
 * Returns "noop" if no recipes exist or no conditions match.
 * 
 * @param metrics - Current code quality metrics from OBSERVE phase (sourced from Insight)
 * @returns String identifier of the selected recipe or "noop"
 */
export async function decide(metrics: Metrics): Promise<string> {
  // Check if there are any issues to fix
  // ✅ Phase 3: totalIssues comes from Insight's analysis, not local detection
  if (metrics.totalIssues === 0) {
    logPhase("DECIDE", "No issues detected by Insight → noop", "info");
    return "noop";
  }

  // ✅ Phase 3: Prefer fixableIssues (canBeHandedToAutopilot = true) if available
  if (metrics.fixableIssues !== undefined && metrics.fixableIssues === 0) {
    logPhase("DECIDE", `${metrics.totalIssues} issues found, but 0 fixable by Autopilot → noop`, "info");
    return "noop";
  }

  // Round 13: Issue-based decision logic
  // Prioritize based on detector with most issues
  const detectorCounts = {
    complexity: (metrics as any).complexity || 0,
    performance: (metrics as any).performance || 0,
    imports: (metrics as any).imports || 0,
    build: (metrics as any).build || 0,
  };

  logPhase("DECIDE", `Issue counts from Insight: ${JSON.stringify(detectorCounts)}`, "info");
  if (metrics.fixableIssues !== undefined) {
    logPhase("DECIDE", `Fixable issues (canBeHandedToAutopilot): ${metrics.fixableIssues}`, "info");
  }

  // Select recipe based on highest issue count
  let selectedRecipe = "noop";

  if (detectorCounts.imports > 0) {
    selectedRecipe = "remove-unused-imports";
    logPhase("DECIDE", `Selected: ${selectedRecipe} (${detectorCounts.imports} import issues)`, "info");
  } else if (detectorCounts.performance > 0) {
    selectedRecipe = "optimize-loops";
    logPhase("DECIDE", `Selected: ${selectedRecipe} (${detectorCounts.performance} performance issues)`, "info");
  } else if (detectorCounts.complexity > 0) {
    selectedRecipe = "reduce-nesting";
    logPhase("DECIDE", `Selected: ${selectedRecipe} (${detectorCounts.complexity} complexity issues)`, "info");
  } else if (detectorCounts.build > 0) {
    selectedRecipe = "fix-build-config";
    logPhase("DECIDE", `Selected: ${selectedRecipe} (${detectorCounts.build} build issues)`, "info");
  }

  if (selectedRecipe === "noop") {
    logPhase("DECIDE", "No applicable recipes for current issues → noop", "info");
    return "noop";
  }

  // Phase P3: Check if recipe should be auto-approved based on manifest
  const autoApprovalCheck = shouldAutoApproveRecipe({
    trust: 0.8, // Default trust for new recipe system
    successRate: 0.8, // Default success rate
    consecutiveFailures: 0, // No failures yet
  });

  if (!autoApprovalCheck.approved) {
    logPhase("DECIDE", `❌ AUTO-APPROVAL REJECTED: ${selectedRecipe}`, "warn");
    logPhase("DECIDE", `   Reason: ${autoApprovalCheck.reason}`, "warn");
    // TODO P3: Add audit entry for rejected recipe
    // Continue execution but log the rejection (soft enforcement)
  } else {
    logPhase("DECIDE", `✓ Recipe auto-approved: ${selectedRecipe} (${autoApprovalCheck.reason})`, "info");
  }

  return selectedRecipe;

  // Legacy code for reference (old recipe system)
  const recipes = await loadRecipes();
  if (!recipes.length) {
    logPhase("DECIDE", "No recipes available", "warn");
    return "noop";
  }

  // Filter recipes where conditions match current metrics
  const applicableRecipes = recipes.filter(recipe =>
    evaluateCondition(recipe.condition, metrics)
  );

  if (!applicableRecipes.length) {
    logPhase("DECIDE", "No recipes match current metrics → noop", "info");
    return "noop";
  }

  // Try adaptive trust prediction (heuristic-based, no real ML model yet)
  const mlPredictor = await getMLPredictor();
  
  let sorted: Recipe[];
  
  if (mlPredictor && mlPredictor !== null) {
    // Use heuristic predictions for trust scores
    logPhase("DECIDE", "Using adaptive heuristic trust scoring", "info");
    
    const recipesWithPredictions = await Promise.all(
      applicableRecipes.map(async (recipe) => {
        // Extract features from recipe and metrics
        const features = mlPredictor!.extractFeatures({
          successRate: recipe.trust ?? 0.5,
          totalRuns: 0, // Will be loaded from trust records
          consecutiveFailures: 0, // Will be loaded from trust records
          filesAffected: recipe.actions.flatMap(a => a.files ?? []),
          locChanged: estimateLOC(recipe),
          complexity: estimateComplexity(recipe),
        });
        
        const prediction = await mlPredictor!.predict(features);
        
        return {
          recipe,
          mlTrust: prediction.predictedTrust,
          confidence: prediction.confidence,
          recommendation: prediction.recommendation,
          explanation: prediction.explanation,
        };
      })
    );
    
    // Sort by ML trust (primary), confidence (secondary), priority (tertiary)
    sorted = recipesWithPredictions
      .sort((a, b) => {
        const trustDiff = b.mlTrust - a.mlTrust;
        if (Math.abs(trustDiff) > 0.05) return trustDiff;
        
        const confidenceDiff = b.confidence - a.confidence;
        if (Math.abs(confidenceDiff) > 0.05) return confidenceDiff;
        
        return (b.recipe.priority ?? 0) - (a.recipe.priority ?? 0);
      })
      .map(p => p.recipe);
    
    const bestPrediction = recipesWithPredictions.find(p => p.recipe.id === sorted[0].id);
    logPhase(
      "DECIDE",
      `Selected (ML): ${sorted[0].name} (ML trust ${(bestPrediction!.mlTrust * 100).toFixed(1)}%, confidence ${(bestPrediction!.confidence * 100).toFixed(1)}%, recommendation: ${bestPrediction!.recommendation})`,
      "info"
    );
    logPhase("DECIDE", `\n${bestPrediction!.explanation}`, "info");
  } else {
    // Fallback: Sort by stored trust (primary) and priority (secondary)
    sorted = [...applicableRecipes].sort((a, b) => {
      const trustDiff = (b.trust ?? 0) - (a.trust ?? 0);
      if (Math.abs(trustDiff) > 0.01) return trustDiff;
      return (b.priority ?? 0) - (a.priority ?? 0);
    });
    
    logPhase(
      "DECIDE",
      `Selected (heuristic): ${sorted[0].name} (trust ${((sorted[0].trust ?? 0) * 100).toFixed(1)}%, priority ${sorted[0].priority ?? 0})`,
      "info"
    );
  }

  const best = sorted[0];

  // Log example command evaluation (ACT phase will use this)
  if (best.actions.length > 0) {
    evaluateCommand(best.actions[0].command ?? 'echo noop');
  }

  return best.id;
}

// ML feature extraction (not used yet - coming in Week 9-10)

/**
 * Estimate lines of code that would be changed by recipe
 */
function estimateLOC(recipe: Recipe): number {
  // Rough heuristic: file edits = 50 LOC, shell commands = 10 LOC
  let loc = 0;
  for (const action of recipe.actions) {
    if (action.type === 'edit' || action.type === 'file-edit') {
      loc += (action.files?.length ?? 1) * 50;
    } else if (action.type === 'shell' || action.type === 'command') {
      loc += 10;
    }
  }
  return loc;
}

/**
 * Estimate complexity score of recipe (0-10 scale)
 */
function estimateComplexity(recipe: Recipe): number {
  let complexity = 0;
  
  // Action type complexity weights
  const weights = {
    'shell': 3,
    'command': 3,
    'edit': 5,
    'file-edit': 5,
    'analyze': 2,
    'delete': 4,
  };
  
  for (const action of recipe.actions) {
    complexity += weights[action.type as keyof typeof weights] ?? 3;
  }
  
  // Normalize to 0-10 scale (assume max 5 actions)
  return Math.min(10, complexity / (recipe.actions.length || 1));
}
