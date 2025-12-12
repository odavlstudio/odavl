/**
 * ODAVL Guardian - CI/CD Integration Layer
 * Phase Ω-P2: Unified deployment decision engine
 */
import type { GateResult, DeploymentGatesInput } from '../core/src/gates/deployment-gates';
export interface GuardianCIResult {
    canDeploy: boolean;
    finalConfidence: number;
    gates: GateResult[];
    reasoning: string[];
    brainScore?: number;
    fusionScore?: number;
    fileRiskSummary?: {
        avgRisk: number;
        criticalCount: number;
        highRiskCount: number;
    };
    timestamp: string;
}
/**
 * Run complete Guardian CI/CD check
 * Merges Brain + Fusion + Gates into unified decision
 */
export declare function runGuardianCI(input: DeploymentGatesInput, options?: {
    force?: boolean;
    verbose?: boolean;
}): Promise<GuardianCIResult>;
