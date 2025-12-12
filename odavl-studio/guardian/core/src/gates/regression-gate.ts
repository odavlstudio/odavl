/**
 * ODAVL Guardian - Regression Analysis Gate
 * Phase Ω-P2: Baseline comparison and regression detection
 */

import type { GateResult, DeploymentGatesInput } from './deployment-gates';

/**
 * Gate 3: Regression Analysis
 * Block if baseline comparison shows regressions above threshold
 */
export function gateRegression(input: DeploymentGatesInput): GateResult {
  const maxRegressions = input.thresholds?.maxRegressions ?? 0;

  if (!input.baselineComparison) {
    return {
      pass: true,
      reason: '⚠️ No baseline comparison available',
      gate: 'regression',
    };
  }

  const { regressions, improvements } = input.baselineComparison;

  if (regressions <= maxRegressions) {
    return {
      pass: true,
      reason: `✓ ${regressions} regressions, ${improvements} improvements (threshold: ${maxRegressions})`,
      score: regressions,
      gate: 'regression',
    };
  }

  return {
    pass: false,
    reason: `❌ ${regressions} regressions exceed threshold ${maxRegressions}`,
    score: regressions,
    gate: 'regression',
  };
}
