/**
 * ODAVL Guardian - Security Gate
 * Phase Ω-P2: MTL security prediction integration from Brain
 */

import type { GateResult, DeploymentGatesInput } from './deployment-gates';

/**
 * Gate 4: Security Analysis
 * Block if Brain's MTL security prediction indicates high risk
 */
export function gateSecurity(input: DeploymentGatesInput): GateResult {
  const securityThreshold = 0.7; // High risk = 0.7+

  if (input.mtlSecurity === undefined) {
    return {
      pass: true,
      reason: '⚠️ No MTL security prediction available',
      gate: 'security',
    };
  }

  if (input.mtlSecurity < securityThreshold) {
    return {
      pass: true,
      reason: `✓ MTL security risk ${(input.mtlSecurity * 100).toFixed(1)}% below threshold`,
      score: input.mtlSecurity,
      gate: 'security',
    };
  }

  return {
    pass: false,
    reason: `❌ MTL security risk ${(input.mtlSecurity * 100).toFixed(1)}% exceeds safe threshold`,
    score: input.mtlSecurity,
    gate: 'security',
  };
}
