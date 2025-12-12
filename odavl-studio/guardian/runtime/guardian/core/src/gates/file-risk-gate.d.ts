/**
 * OMEGA-P5 Phase 4 Commit 3: Guardian + OMS Integration
 * OMS-aware file risk gate with dynamic thresholds (≤40 LOC)
 */
import type { GateResult, DeploymentGatesInput } from './deployment-gates';
export declare function gateFileTypeRisk(input: DeploymentGatesInput): Promise<GateResult>;
