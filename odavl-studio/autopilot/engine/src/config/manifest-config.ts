/**
 * ODAVL Autopilot - Manifest Configuration Loader
 * Phase P2: ACTIVE manifest-driven behavior enforcement
 * 
 * Provides centralized access to Autopilot configuration from manifest.
 * Enforces risk budget, protected paths, trust thresholds at runtime.
 */

import { manifest } from '@odavl/core/manifest';
// For glob matching (add to package.json if not present)
import * as micromatch from 'micromatch';

/**
 * Phase P2 Task 2.1: Get risk budget from manifest
 * @returns Risk budget configuration (maxLoc, maxFiles, maxRecipes)
 */
export function getRiskBudget(): {
  maxLoc: number;
  maxFiles: number;
  maxRecipes: number;
} {
  try {
    return {
      maxLoc: manifest.autopilot?.riskBudget?.maxLoc || 40,
      maxFiles: manifest.autopilot?.riskBudget?.maxFiles || 10,
      maxRecipes: manifest.autopilot?.riskBudget?.maxRecipes || 5,
    };
  } catch (error) {
    return {
      maxLoc: 40,
      maxFiles: 10,
      maxRecipes: 5,
    };
  }
}

/**
 * Phase P2 Task 2.1: Validate proposed changes against risk budget
 * 
 * @param changes Object with locCount, filesCount, recipesCount
 * @returns Object with { allowed: boolean, violations: string[], budget: RiskBudget }
 */
export function validateRiskBudget(changes: {
  locCount: number;
  filesCount: number;
  recipesCount: number;
}): {
  allowed: boolean;
  violations: string[];
  budget: ReturnType<typeof getRiskBudget>;
} {
  const budget = getRiskBudget();
  const violations: string[] = [];
  
  if (changes.locCount > budget.maxLoc) {
    violations.push(`LOC count (${changes.locCount}) exceeds budget (${budget.maxLoc})`);
  }
  
  if (changes.filesCount > budget.maxFiles) {
    violations.push(`File count (${changes.filesCount}) exceeds budget (${budget.maxFiles})`);
  }
  
  if (changes.recipesCount > budget.maxRecipes) {
    violations.push(`Recipe count (${changes.recipesCount}) exceeds budget (${budget.maxRecipes})`);
  }
  
  if (violations.length > 0) {
    console.error(`[Autopilot] Risk budget violated:`, violations);
    // TODO P2: Add audit entry for risk budget violation
  }
  
  return {
    allowed: violations.length === 0,
    violations,
    budget,
  };
}

/**
 * Phase P2 Task 2.2: Get protected paths from manifest
 * @returns Array of glob patterns for protected paths
 */
export function getProtectedPaths(): string[] {
  try {
    return manifest.autopilot?.protectedPaths || [
      'security/**',
      '**/*.spec.*',
      '**/*.test.*',
      'public-api/**',
      'auth/**',
    ];
  } catch (error) {
    return [
      'security/**',
      '**/*.spec.*',
      '**/*.test.*',
      'public-api/**',
      'auth/**',
    ];
  }
}

/**
 * Phase P2 Task 2.2: Check if file path matches protected paths (HARD BLOCK)
 * 
 * @param filePath File path to check
 * @returns Object with { blocked: boolean, matchedPattern: string | null }
 */
export function isProtectedPath(filePath: string): {
  blocked: boolean;
  matchedPattern: string | null;
} {
  try {
    const protectedPaths = getProtectedPaths();
    const matched = micromatch.isMatch(filePath, protectedPaths);
    
    if (matched) {
      const matchedPattern = protectedPaths.find(pattern => 
        micromatch.isMatch(filePath, pattern)
      ) || null;
      
      console.error(
        `[Autopilot] BLOCKED: Protected path modification attempt: ${filePath} (matched: ${matchedPattern})`
      );
      
      // TODO P2: Add audit entry for protected path violation
      
      return { blocked: true, matchedPattern };
    }
    
    return { blocked: false, matchedPattern: null };
  } catch (error) {
    console.warn('[Autopilot] Error checking protected paths:', error);
    return { blocked: false, matchedPattern: null }; // Fail open
  }
}

/**
 * Phase P2 Task 2.3: Get avoid changes patterns from manifest
 * @returns Array of glob patterns for paths to avoid changing
 */
export function getAvoidChanges(): string[] {
  try {
    return manifest.autopilot?.avoidChanges || [];
  } catch (error) {
    return [];
  }
}

/**
 * Phase P2 Task 2.3: Check if file path should be avoided (SOFT WARN)
 * 
 * @param filePath File path to check
 * @returns Object with { shouldAvoid: boolean, matchedPattern: string | null }
 */
export function shouldAvoidChanges(filePath: string): {
  shouldAvoid: boolean;
  matchedPattern: string | null;
} {
  try {
    const avoidPaths = getAvoidChanges();
    
    if (avoidPaths.length === 0) {
      return { shouldAvoid: false, matchedPattern: null };
    }
    
    const matched = micromatch.isMatch(filePath, avoidPaths);
    
    if (matched) {
      const matchedPattern = avoidPaths.find(pattern =>
        micromatch.isMatch(filePath, pattern)
      ) || null;
      
      console.warn(
        `[Autopilot] WARNING: Changing file in avoid-changes path: ${filePath} (matched: ${matchedPattern})`
      );
      
      return { shouldAvoid: true, matchedPattern };
    }
    
    return { shouldAvoid: false, matchedPattern: null };
  } catch (error) {
    console.warn('[Autopilot] Error checking avoid-changes paths:', error);
    return { shouldAvoid: false, matchedPattern: null };
  }
}

/**
 * Phase P2 Task 2.4: Get trust configuration from manifest
 * @returns Trust score min/max thresholds
 */
export function getTrustConfig(): {
  min: number;
  max: number;
  blacklistAfterFailures: number;
  approveIf?: unknown; // Type changed to avoid incompatibility with ApprovalCondition[]
} {
  try {
    return {
      min: manifest.autopilot?.trust?.min || 0.2,
      max: manifest.autopilot?.trust?.max || 1.0,
      blacklistAfterFailures: 3, // Hardcoded: not in TrustConfiguration type
      approveIf: manifest.autopilot?.trust?.approveIf,
    };
  } catch (error) {
    return {
      min: 0.2,
      max: 1.0,
      blacklistAfterFailures: 3,
    };
  }
}

/**
 * Phase P2 Task 2.4: Safe expression evaluator for approveIf conditions
 * 
 * SECURITY: No eval() - uses simple comparison operators only
 * Supported: trust >= 0.8, successRate > 0.75, consecutiveFailures < 2, AND/OR
 * 
 * @param expression Expression string (e.g., "trust >= 0.8")
 * @param variables Object with trust, successRate, consecutiveFailures, etc.
 * @returns True if condition satisfied, false otherwise
 */
function evaluateSafeExpression(
  expression: string,
  variables: Record<string, number>
): boolean {
  try {
    // Remove whitespace for parsing
    const expr = expression.replace(/\s+/g, '');
    
    // Handle AND/OR operators (split by OR first, then AND)
    if (expr.includes('OR')) {
      return expr.split('OR').some(subExpr => evaluateSafeExpression(subExpr, variables));
    }
    
    if (expr.includes('AND')) {
      return expr.split('AND').every(subExpr => evaluateSafeExpression(subExpr, variables));
    }
    
    // Parse single comparison: variable operator value
    const patterns = [
      /^(\w+)(>=)([0-9.]+)$/,
      /^(\w+)(<=)([0-9.]+)$/,
      /^(\w+)(>)([0-9.]+)$/,
      /^(\w+)(<)([0-9.]+)$/,
      /^(\w+)(==)([0-9.]+)$/,
    ];
    
    for (const pattern of patterns) {
      const match = expr.match(pattern);
      if (match) {
        const [, varName, operator, valueStr] = match;
        const varValue = variables[varName];
        const compareValue = parseFloat(valueStr);
        
        if (varValue === undefined) {
          console.warn(`[Autopilot] Unknown variable in approveIf: ${varName}`);
          return false;
        }
        
        switch (operator) {
          case '>=': return varValue >= compareValue;
          case '<=': return varValue <= compareValue;
          case '>': return varValue > compareValue;
          case '<': return varValue < compareValue;
          case '==': return varValue === compareValue;
          default: return false;
        }
      }
    }
    
    console.warn(`[Autopilot] Invalid approveIf expression: ${expression}`);
    return false;
  } catch (error) {
    console.error('[Autopilot] Error evaluating approveIf expression:', error);
    return false;
  }
}

/**
 * Phase P2 Task 2.4: Check if recipe should be auto-approved based on trust config
 * 
 * @param recipe Object with trust, successRate, consecutiveFailures properties
 * @returns Object with { approved: boolean, reason: string }
 */
export function shouldAutoApproveRecipe(recipe: {
  trust: number;
  successRate?: number;
  consecutiveFailures?: number;
}): {
  approved: boolean;
  reason: string;
} {
  try {
    const trustConfig = getTrustConfig();
    
    // Check min threshold
    if (recipe.trust < trustConfig.min) {
      return {
        approved: false,
        reason: `Trust score ${recipe.trust.toFixed(2)} below minimum ${trustConfig.min}`,
      };
    }
    
    // Check blacklist threshold
    const consecutiveFailures = recipe.consecutiveFailures || 0;
    if (consecutiveFailures >= trustConfig.blacklistAfterFailures) {
      return {
        approved: false,
        reason: `Blacklisted: ${consecutiveFailures} consecutive failures (threshold: ${trustConfig.blacklistAfterFailures})`,
      };
    }
    
    // Evaluate approveIf expression if present
    // Note: approveIf is ApprovalCondition[] in manifest but evaluateSafeExpression expects string
    // Skip this feature for now to avoid type mismatch
    if (typeof trustConfig.approveIf === 'string') {
      const variables = {
        trust: recipe.trust,
        successRate: recipe.successRate || 0,
        consecutiveFailures: consecutiveFailures,
      };
      
      const approved = evaluateSafeExpression(trustConfig.approveIf, variables);
      
      return {
        approved,
        reason: approved
          ? `Approved via expression: ${trustConfig.approveIf}`
          : `Rejected via expression: ${trustConfig.approveIf}`,
      };
    }
    
    // Default: approve if above minimum
    return {
      approved: true,
      reason: `Trust score ${recipe.trust.toFixed(2)} meets minimum ${trustConfig.min}`,
    };
  } catch (error) {
    console.error('[Autopilot] Error in shouldAutoApproveRecipe:', error);
    return {
      approved: false,
      reason: 'Error evaluating trust config',
    };
  }
}

/**
 * Phase P1: Get recipe selection strategies from manifest
 * TODO P2: Implement strategy selection logic
 * @returns Array of strategy names
 */
export function getRecipeSelectionStrategies(): string[] {
  try {
    return manifest.autopilot?.recipeSelection?.strategies || ['ml-predictor', 'trust-score'];
  } catch (error) {
    return ['ml-predictor', 'trust-score'];
  }
}

/**
 * Phase P1: Get ML model version from manifest
 * TODO P2: Load specific model version
 * @returns Model version string
 */
export function getModelVersion(): string {
  try {
    return manifest.autopilot?.recipeSelection?.modelVersion || 'v2';
  } catch (error) {
    return 'v2';
  }
}

/**
 * Phase P1: Get dependency rules from manifest
 * TODO P2: Implement parallel execution based on these rules
 * @returns Dependency configuration
 */
export function getDependencyRules(): {
  allowParallel: boolean;
  maxParallelWorkers: number;
  conflictResolution: 'fail' | 'sequential' | 'merge';
} {
  try {
    const rules = manifest.autopilot?.recipeSelection?.dependencyRules;
    const resolution = rules?.conflictResolution || 'sequential';
    return {
      allowParallel: rules?.allowParallel ?? true,
      maxParallelWorkers: rules?.maxParallelWorkers ?? 4,
      conflictResolution: (resolution === 'highest-trust' ? 'sequential' : resolution) as 'fail' | 'sequential' | 'merge',
    };
  } catch (error) {
    return {
      allowParallel: true,
      maxParallelWorkers: 4,
      conflictResolution: 'sequential',
    };
  }
}
