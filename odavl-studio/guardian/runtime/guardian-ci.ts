/**
 * ODAVL Guardian - CI/CD Integration Layer
 * Phase Ω-P2: Unified deployment decision engine
 */

import type { GateResult, DeploymentGatesInput } from '../core/src/gates/deployment-gates';
import { runAllGates } from '../core/src/gates';

export interface GuardianCIResult {
  canDeploy: boolean;
  finalConfidence: number;
  gates: GateResult[];
  reasoning: string[];
  brainScore?: number;
  fusionScore?: number;
  fileRiskSummary?: { avgRisk: number; criticalCount: number; highRiskCount: number }; // OMEGA-P5 Phase 4
  timestamp: string;
}

/**
 * Run complete Guardian CI/CD check
 * Merges Brain + Fusion + Gates into unified decision
 */
export async function runGuardianCI(
  input: DeploymentGatesInput,
  options?: {
    force?: boolean;
    verbose?: boolean;
  }
): Promise<GuardianCIResult> {
  const timestamp = new Date().toISOString();
  const reasoning: string[] = [];

  try {
    // Step 1: Run all deployment gates
    const gates = await runAllGates(input);

    // Step 2: Check if any gate failed
    const failedGates = gates.filter((g) => !g.pass);
    const allGatesPassed = failedGates.length === 0;

    // Step 3: Compute final confidence
    // Formula: 0.5 * brainConfidence + 0.3 * fusionScore + 0.2 * gatesScore
    const brainScore = input.brainConfidence ?? 0;
    const fusionScore = input.brainFusionScore ?? 0;
    const gatesScore = (gates.filter((g) => g.pass).length / gates.length) * 100;

    const finalConfidence = 0.5 * brainScore + 0.3 * fusionScore + 0.2 * gatesScore;

    // Step 4: Add Brain reasoning if available
    if (input.brainReasoning && input.brainReasoning.length > 0) {
      reasoning.push('🧠 Brain Analysis:');
      reasoning.push(...input.brainReasoning);
    }

    // Step 5: Add gate results to reasoning
    reasoning.push('🛡️ Guardian Gates:');
    gates.forEach((gate) => {
      reasoning.push(`  ${gate.reason}`);
    });

    // Step 6: Determine deployment decision
    let canDeploy = allGatesPassed;

    if (options?.force) {
      canDeploy = true;
      reasoning.push('⚠️ Deployment forced despite gate failures');
    }

    // Step 7: Add final verdict
    if (canDeploy) {
      reasoning.push(`✅ Deployment approved (confidence: ${finalConfidence.toFixed(1)}%)`);
    } else {
      reasoning.push(`❌ Deployment blocked (${failedGates.length} gates failed)`);
    }

    // Step 8: Compute file risk summary from OMS (OMEGA-P5 Phase 4)
    let fileRiskSummary: { avgRisk: number; criticalCount: number; highRiskCount: number } | undefined;
    if (input.changedFiles && input.changedFiles.length > 0) {
      try {
        const { loadOMSContext, resolveFileType } = await import('../../oms/oms-context.js');
        const { computeFileRiskScore } = await import('../../oms/risk/file-risk-index.js');
        const omsContext = await loadOMSContext();
        const risks = input.changedFiles.map(f => computeFileRiskScore({ type: resolveFileType(f) }));
        fileRiskSummary = {
          avgRisk: risks.reduce((s, r) => s + r, 0) / risks.length,
          criticalCount: risks.filter(r => r >= 0.7).length,
          highRiskCount: risks.filter(r => r >= 0.5 && r < 0.7).length,
        };
      } catch { /* OMS unavailable */ }
    }

    return {
      canDeploy,
      finalConfidence,
      gates,
      reasoning,
      brainScore,
      fusionScore,
      fileRiskSummary,
      timestamp,
    };
  } catch (error) {
    reasoning.push(`❌ Guardian CI error: ${error}`);
    return {
      canDeploy: false,
      finalConfidence: 0,
      gates: [],
      reasoning,
      timestamp,
    };
  }
}
