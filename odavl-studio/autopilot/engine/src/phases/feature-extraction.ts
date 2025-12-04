/**
 * Feature Extraction for ML Trust Prediction (Week 9-10)
 * Converts recipe + metrics into 12-dimensional ML feature vector
 */

import type { Recipe } from './decide.js';
import type { Metrics } from './observe.js';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

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

/**
 * Extract ML features from recipe and metrics
 */
export async function extractFeaturesFromRecipe(
  recipe: Recipe,
  metrics: Metrics
): Promise<MLFeatures> {
  // 1. Historical success rate (from .odavl/recipes-trust.json)
  const trustData = await loadTrustData();
  const recipeStats = trustData[recipe.id] || { runs: 0, success: 0 };
  const historicalSuccessRate = recipeStats.runs > 0 
    ? recipeStats.success / recipeStats.runs 
    : 0.5; // Neutral for new recipes

  // 2. Error frequency (normalized by total issues)
  const errorFrequency = metrics.totalIssues > 0
    ? Math.min(1, (metrics.eslint + metrics.typescript) / 100) // Cap at 100 issues = 1.0
    : 0;

  // 3. Code complexity (from metrics or estimate)
  const codeComplexity = metrics.complexity 
    ? Math.min(1, metrics.complexity / 100) // Cyclomatic complexity / 100
    : 0.5; // Default medium complexity

  // 4. Lines changed (estimate from recipe actions)
  const estimatedLinesChanged = estimateChangedLines(recipe);
  const linesChanged = Math.min(1, estimatedLinesChanged / 100); // Normalize to 100 lines

  // 5. Files modified (from recipe actions)
  const filesModified = Math.min(1, countModifiedFiles(recipe) / 10); // Normalize to 10 files

  // 6. Error type criticality (TypeScript < ESLint < Security)
  const errorTypeCriticality = determineErrorCriticality(metrics);

  // 7. Similar past outcomes (cosine similarity with history)
  const similarPastOutcomes = await calculateSimilarity(recipe, metrics);

  // 8. Time since last failure (from .odavl/history.json)
  const timeSinceLastFailure = await getTimeSinceFailure(recipe.id);

  // 9. Project maturity (Git commits / age)
  const projectMaturity = await calculateProjectMaturity();

  // 10. Test coverage (from metrics or estimate)
  const testCoverage = metrics.complexity ? (metrics.complexity / 100) : 0.5; // Use complexity as proxy

  // 11. Recipe complexity (number of actions / 10)
  const recipeComplexity = Math.min(1, recipe.actions.length / 10);

  // 12. Community trust (GitHub stars / usage)
  const communityTrust = recipe.trust ?? 0.5; // Use stored trust or default

  return {
    historicalSuccessRate,
    errorFrequency,
    codeComplexity,
    linesChanged,
    filesModified,
    errorTypeCriticality,
    similarPastOutcomes,
    timeSinceLastFailure,
    projectMaturity,
    testCoverage,
    recipeComplexity,
    communityTrust,
  };
}

/**
 * Determine error type and map to criticality score
 */
export function determineErrorType(metrics: Metrics): string {
  if (metrics.security > 0) return 'security';
  if (metrics.imports > 0) return 'import';
  if (metrics.typescript > 0) return 'typescript';
  if (metrics.eslint > 0) return 'eslint';
  return 'other';
}

function determineErrorCriticality(metrics: Metrics): number {
  // Security: 1.0 (highest)
  if (metrics.security > 0) return 1.0;
  
  // Import errors: 0.7 (high - breaks builds)
  if (metrics.imports > 0) return 0.7;
  
  // TypeScript errors: 0.5 (medium)
  if (metrics.typescript > 0) return 0.5;
  
  // ESLint warnings: 0.3 (low)
  if (metrics.eslint > 0) return 0.3;
  
  return 0.2; // Other
}

/**
 * Load trust data from .odavl/recipes-trust.json
 */
async function loadTrustData(): Promise<Record<string, { runs: number; success: number }>> {
  try {
    const trustPath = path.join(process.cwd(), '.odavl/recipes-trust.json');
    const content = await fsp.readFile(trustPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {}; // No trust data yet
  }
}

/**
 * Estimate lines changed from recipe actions
 */
function estimateChangedLines(recipe: Recipe): number {
  let total = 0;
  for (const action of recipe.actions) {
    if (action.type === 'edit' || action.type === 'file-edit') {
      total += 20; // Assume ~20 lines per edit action
    } else if (action.type === 'shell') {
      total += 5; // Shell commands typically change less
    }
  }
  return total;
}

/**
 * Count modified files from recipe actions
 */
function countModifiedFiles(recipe: Recipe): number {
  const files = new Set<string>();
  for (const action of recipe.actions) {
    if (action.files) {
      action.files.forEach(f => files.add(f));
    }
  }
  return files.size || 1; // At least 1 file
}

/**
 * Calculate similarity with past successful recipes (cosine similarity)
 */
async function calculateSimilarity(recipe: Recipe, _metrics: Metrics): Promise<number> {
  try {
    const historyPath = path.join(process.cwd(), '.odavl/history.json');
    const history = JSON.parse(await fsp.readFile(historyPath, 'utf-8'));
    
    // Find similar successful runs (same error type, similar metrics)
    const similarRuns = history.runs?.filter((r: any) => 
      r.success && r.recipeId === recipe.id
    ) || [];

    if (similarRuns.length === 0) return 0.3; // No history = low similarity
    
    // Calculate average similarity (simple heuristic: success count / total runs)
    return Math.min(1, similarRuns.length / 10);
  } catch {
    return 0.3; // Default low similarity
  }
}

/**
 * Get time since last failure for this recipe (in days, normalized to 0-1)
 */
async function getTimeSinceFailure(recipeId: string): Promise<number> {
  try {
    const historyPath = path.join(process.cwd(), '.odavl/history.json');
    const history = JSON.parse(await fsp.readFile(historyPath, 'utf-8'));
    
    const failures = history.runs?.filter((r: any) => 
      !r.success && r.recipeId === recipeId
    ) || [];

    if (failures.length === 0) return 1.0; // No failures = 1.0
    
    const lastFailure = failures[failures.length - 1];
    const daysSince = (Date.now() - new Date(lastFailure.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    
    return Math.min(1, daysSince / 30); // Normalize to 30 days
  } catch {
    return 0.8; // Default: assume recent success
  }
}

/**
 * Calculate project maturity (Git commits / age)
 */
async function calculateProjectMaturity(): Promise<number> {
  try {
    const { execSync } = await import('node:child_process');
    
    // Get commit count
    const commitCount = parseInt(
      execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim()
    );
    
    // Get repository age in days
    const firstCommit = execSync('git log --reverse --format=%ct | head -1', { encoding: 'utf-8' }).trim();
    const ageDays = (Date.now() / 1000 - parseInt(firstCommit)) / (60 * 60 * 24);
    
    // Maturity = commits per day, normalized
    const maturity = (commitCount / ageDays) * 100; // Scale to 0-1 range
    return Math.min(1, maturity);
  } catch {
    return 0.5; // Default medium maturity
  }
}
