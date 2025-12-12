/**
 * ODAVL Guardian - Gates Exports
 * Phase Ω-P2: Centralized gate exports
 * Phase Ω-P6 Phase 4: Telemetry integration
 */

export * from './deployment-gates';
export { gatePerformance } from './performance-gate';
export { gateRegression } from './regression-gate';
export { gateSecurity } from './security-gate';
export { gateFileTypeRisk } from './file-risk-gate';

import { appendGuardianTelemetry } from '../../telemetry/guardian-telemetry.js';

/**
 * Run all deployment gates
 */
export async function runAllGates(
  input: import('./deployment-gates').DeploymentGatesInput
): Promise<import('./deployment-gates').GateResult[]> {
  const { gateConfidence } = await import('./deployment-gates');
  const { gatePerformance } = await import('./performance-gate');
  const { gateRegression } = await import('./regression-gate');
  const { gateSecurity } = await import('./security-gate');
  const { gateFileTypeRisk } = await import('./file-risk-gate');

  const results = [
    gateConfidence(input),
    gatePerformance(input),
    gateRegression(input),
    gateSecurity(input),
    gateFileTypeRisk(input),
  ];

  // OMEGA-P6 Phase 4: Emit telemetry after gates evaluated
  await emitGuardianTelemetry(results, input);

  return results;
}

/**
 * Emit Guardian telemetry for learning and quality improvement
 */
async function emitGuardianTelemetry(
  results: import('./deployment-gates').GateResult[],
  input: import('./deployment-gates').DeploymentGatesInput
): Promise<void> {
  try {
    const gatesPassed = results.filter(r => r.pass).length;
    const gatesFailed = results.length - gatesPassed;
    const failedGateNames = results.filter(r => !r.pass).map(r => r.gate);

    await appendGuardianTelemetry(process.cwd(), {
      timestamp: new Date().toISOString(),
      workspaceRoot: process.cwd(),
      totalGates: results.length,
      gatesPassed,
      gatesFailed,
      failedGateNames,
      performanceScore: input.performanceScore,
      brainConfidence: input.brainConfidence,
      fileRiskSummary: input.fileRiskSummary,
    });
  } catch {
    // Telemetry failures never break gate validation
  }
}
