/**
 * ODAVL Guardian - Security Gate
 * Phase Ω-P2: MTL security prediction integration from Brain
 */
import type { GateResult, DeploymentGatesInput } from './deployment-gates';
/**
 * Gate 4: Security Analysis
 * Block if Brain's MTL security prediction indicates high risk
 */
export declare function gateSecurity(input: DeploymentGatesInput): GateResult;
