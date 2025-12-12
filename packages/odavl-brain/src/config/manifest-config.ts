/**
 * ODAVL Brain - Manifest Configuration Loader
 * Phase P2: ACTIVE manifest-driven behavior enforcement
 * 
 * Provides centralized access to Brain configuration from manifest.
 * Enforces learning modes, memory limits, confidence thresholds, and decision policies.
 */

import { manifest } from '@odavl/core/manifest';

/**
 * Phase P2 Task 4.1: Get learning mode from manifest
 * @returns Learning mode ('disabled' | 'observe' | 'adaptive' | 'aggressive')
 */
export function getLearningMode(): 'disabled' | 'observe' | 'adaptive' | 'aggressive' {
  try {
    return (manifest.brain?.learningMode || 'adaptive') as 'disabled' | 'observe' | 'adaptive' | 'aggressive';
  } catch (error) {
    return 'adaptive';
  }
}

/**
 * Phase P2 Task 4.1: Check if Brain should record patterns (disabled/observe = read-only)
 * @returns True if Brain can modify its knowledge base
 */
export function canModifyKnowledge(): boolean {
  const mode = getLearningMode();
  // 'disabled' and 'observe' are read-only modes
  return mode === 'adaptive' || mode === 'aggressive';
}

/**
 * Phase P2 Task 4.2: Get memory limits from manifest
 * @returns Memory configuration
 */
export function getMemoryLimits(): {
  shortTermLimit: number;
  longTermLimit: number;
  evictionPolicy: 'lru' | 'fifo';
} {
  try {
    const memory = manifest.brain?.memory as any;
    return {
      shortTermLimit: memory?.shortTermLimit || 100,
      longTermLimit: memory?.longTermLimit || 10000,
      evictionPolicy: (memory?.evictionPolicy as 'lru' | 'fifo') || 'lru',
    };
  } catch (error) {
    return {
      shortTermLimit: 100,
      longTermLimit: 10000,
      evictionPolicy: 'lru',
    };
  }
}

/**
 * Phase P2 Task 4.2: Enforce memory limits with eviction
 * 
 * @param currentCount Current number of memory entries
 * @param limit Memory limit
 * @returns Object with { shouldEvict: boolean, itemsToEvict: number, policy: string }
 */
export function enforceMemoryLimit(
  currentCount: number,
  limit: number,
  type: 'shortTerm' | 'longTerm'
): {
  shouldEvict: boolean;
  itemsToEvict: number;
  policy: 'lru' | 'fifo';
} {
  const config = getMemoryLimits();
  const effectiveLimit = type === 'shortTerm' ? config.shortTermLimit : config.longTermLimit;
  
  const shouldEvict = currentCount > effectiveLimit;
  const itemsToEvict = shouldEvict ? currentCount - effectiveLimit : 0;
  
  if (shouldEvict) {
    console.warn(
      `[Brain] Memory limit exceeded for ${type}: ${currentCount} > ${effectiveLimit}. ` +
      `Evicting ${itemsToEvict} entries using ${config.evictionPolicy} policy.`
    );
    // TODO P2: Add audit entry for memory eviction
  }
  
  return {
    shouldEvict,
    itemsToEvict,
    policy: config.evictionPolicy,
  };
}

/**
 * Phase P2 Task 4.3: Get confidence thresholds from manifest
 * @returns Confidence thresholds for each product
 */
export function getConfidenceThresholds(): {
  insight: number;
  autopilot: number;
  guardian: number;
} {
  try {
    const thresholds = manifest.brain?.confidenceThresholds;
    return {
      insight: thresholds?.insight || 0.6,
      autopilot: thresholds?.autopilot || 0.8,
      guardian: thresholds?.guardian || 0.9,
    };
  } catch (error) {
    return {
      insight: 0.6,
      autopilot: 0.8,
      guardian: 0.9,
    };
  }
}

/**
 * Phase P2 Task 4.3: Validate confidence score against product threshold
 * 
 * @param product Product name
 * @param confidence Confidence score (0-1)
 * @returns Object with { meetsThreshold: boolean, threshold: number, confidence: number }
 */
export function validateConfidence(
  product: 'insight' | 'autopilot' | 'guardian',
  confidence: number
): {
  meetsThreshold: boolean;
  threshold: number;
  confidence: number;
} {
  const thresholds = getConfidenceThresholds();
  const threshold = thresholds[product];
  const meetsThreshold = confidence >= threshold;
  
  if (!meetsThreshold) {
    console.warn(
      `[Brain] Confidence check failed for ${product}: ${confidence.toFixed(2)} < ${threshold}`
    );
  }
  
  return {
    meetsThreshold,
    threshold,
    confidence,
  };
}

/**
 * Phase P2 Task 4.4: Get decision policy from manifest
 * @returns Decision policy configuration with expression arrays
 */
export function getDecisionPolicy(): {
  allowDeployIf: string[];
  autoApproveRecipesIf: string[];
} {
  try {
    const policy = manifest.brain?.decisionPolicy;
    return {
      allowDeployIf: (policy?.allowDeployIf || [
        'guardian.launchReady === true',
        'insight.totalIssues === 0',
      ]) as string[],
      autoApproveRecipesIf: (policy?.autoApproveRecipesIf || [
        'trust > 0.8',
        'previousSuccesses >= 5',
      ]) as string[],
    };
  } catch (error) {
    return {
      allowDeployIf: [
        'guardian.launchReady === true',
        'insight.totalIssues === 0',
      ],
      autoApproveRecipesIf: [
        'trust > 0.8',
        'previousSuccesses >= 5',
      ],
    };
  }
}

/**
 * Phase P2 Task 4.4: Safe expression evaluator for decision policy
 * 
 * SECURITY: No eval() - uses simple comparison operators only
 * Supported variables: guardian.*, insight.*, trust, previousSuccesses, etc.
 * Supported operators: ===, !==, >=, <=, >, <, AND, OR
 * 
 * @param expression Expression string
 * @param context Variables object (nested properties supported with dot notation)
 * @returns True if condition satisfied, false otherwise
 */
function evaluateDecisionExpression(
  expression: string,
  context: Record<string, any>
): boolean {
  try {
    const expr = expression.replace(/\s+/g, '');
    
    // Handle AND/OR operators
    if (expr.includes('AND')) {
      return expr.split('AND').every(subExpr => evaluateDecisionExpression(subExpr, context));
    }
    
    if (expr.includes('OR')) {
      return expr.split('OR').some(subExpr => evaluateDecisionExpression(subExpr, context));
    }
    
    // Parse single comparison with dot notation support
    const patterns = [
      /^([\w.]+)(===)(true|false|[0-9.]+)$/,
      /^([\w.]+)(!==)(true|false|[0-9.]+)$/,
      /^([\w.]+)(>=)([0-9.]+)$/,
      /^([\w.]+)(<=)([0-9.]+)$/,
      /^([\w.]+)(>)([0-9.]+)$/,
      /^([\w.]+)(<)([0-9.]+)$/,
    ];
    
    for (const pattern of patterns) {
      const match = expr.match(pattern);
      if (match) {
        const [, varPath, operator, valueStr] = match;
        
        // Resolve nested properties (e.g., "guardian.launchReady")
        const varValue = varPath.split('.').reduce((obj, key) => obj?.[key], context);
        
        if (varValue === undefined) {
          console.warn(`[Brain] Unknown variable in decision policy: ${varPath}`);
          return false;
        }
        
        // Parse comparison value
        let compareValue: any = valueStr;
        if (valueStr === 'true') compareValue = true;
        else if (valueStr === 'false') compareValue = false;
        else compareValue = parseFloat(valueStr);
        
        // Perform comparison
        switch (operator) {
          case '===': return varValue === compareValue;
          case '!==': return varValue !== compareValue;
          case '>=': return Number(varValue) >= Number(compareValue);
          case '<=': return Number(varValue) <= Number(compareValue);
          case '>': return Number(varValue) > Number(compareValue);
          case '<': return Number(varValue) < Number(compareValue);
          default: return false;
        }
      }
    }
    
    console.warn(`[Brain] Invalid decision policy expression: ${expression}`);
    return false;
  } catch (error) {
    console.error('[Brain] Error evaluating decision expression:', error);
    return false;
  }
}

/**
 * Phase P2 Task 4.4: Check if deployment should be allowed based on decision policy
 * 
 * @param context Current system state (guardian.launchReady, insight.totalIssues, etc.)
 * @returns Object with { allowed: boolean, satisfiedConditions: string[], failedConditions: string[] }
 */
export function shouldAllowDeployment(
  context: Record<string, any>
): {
  allowed: boolean;
  satisfiedConditions: string[];
  failedConditions: string[];
} {
  const policy = getDecisionPolicy();
  const satisfiedConditions: string[] = [];
  const failedConditions: string[] = [];
  
  for (const condition of policy.allowDeployIf) {
    if (evaluateDecisionExpression(condition, context)) {
      satisfiedConditions.push(condition);
    } else {
      failedConditions.push(condition);
    }
  }
  
  const allowed = failedConditions.length === 0;
  
  if (!allowed) {
    console.error('[Brain] Deployment blocked by decision policy:', failedConditions);
    // TODO P2: Add audit entry for deployment block
  } else {
    console.log('[Brain] Deployment allowed by decision policy:', satisfiedConditions);
  }
  
  return {
    allowed,
    satisfiedConditions,
    failedConditions,
  };
}

/**
 * Phase P2 Task 4.4: Check if recipe should be auto-approved based on decision policy
 * 
 * @param context Recipe metadata (trust, previousSuccesses, etc.)
 * @returns Object with { approved: boolean, satisfiedConditions: string[], failedConditions: string[] }
 */
export function shouldAutoApproveRecipe(
  context: Record<string, any>
): {
  approved: boolean;
  satisfiedConditions: string[];
  failedConditions: string[];
} {
  const policy = getDecisionPolicy();
  const satisfiedConditions: string[] = [];
  const failedConditions: string[] = [];
  
  for (const condition of policy.autoApproveRecipesIf) {
    if (evaluateDecisionExpression(condition, context)) {
      satisfiedConditions.push(condition);
    } else {
      failedConditions.push(condition);
    }
  }
  
  const approved = failedConditions.length === 0;
  
  if (approved) {
    console.log('[Brain] Recipe auto-approved:', satisfiedConditions);
  }
  
  return {
    approved,
    satisfiedConditions,
    failedConditions,
  };
}

/**
 * Phase P1: Check if Brain should learn from current execution
 * @returns True if learning is enabled
 */
export function shouldLearn(): boolean {
  const mode = getLearningMode();
  return mode !== 'disabled';
}

/**
 * Phase P1: Get aggressiveness level for learning
 * @returns Number from 0-100 indicating aggressiveness
 */
export function getAggressiveness(): number {
  const mode = getLearningMode();
  switch (mode) {
    case 'disabled':
      return 0;
    case 'observe':
      return 25;
    case 'adaptive':
      return 50;
    case 'aggressive':
      return 100;
    default:
      return 50;
  }
}
