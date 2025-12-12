/**
 * OMEGA-P5 Phase 4 Commit 2: Severity Scaler
 * Risk-weighted severity computation (≤40 LOC)
 */

/**
 * Scale severity by file risk score
 * Formula: effectiveSeverity = baseSeverity * (1 + riskScore)
 * 
 * Examples:
 * - 'critical' (4) in high-risk file (0.8): 4 * 1.8 = 7.2
 * - 'medium' (2) in low-risk file (0.2): 2 * 1.2 = 2.4
 */
export function scaleSeverity(severity: string, riskScore: number): number {
  const baseScore = getSeverityScore(severity);
  return baseScore * (1 + riskScore);
}

function getSeverityScore(severity: string): number {
  if (!severity || typeof severity !== 'string') {
    console.warn('[severity-scaler] Invalid severity value:', severity, 'defaulting to medium');
    return 2; // Default to medium
  }
  switch (severity.toLowerCase()) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    case 'info': return 0.5;
    default: return 2; // Unknown → medium
  }
}
