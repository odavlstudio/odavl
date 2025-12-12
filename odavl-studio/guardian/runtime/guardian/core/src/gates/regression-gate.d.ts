/**
 * ODAVL Guardian - Regression Analysis Gate
 * Phase Ω-P2: Baseline comparison and regression detection
 */
import type { GateResult, DeploymentGatesInput } from './deployment-gates';
/**
 * Gate 3: Regression Analysis
 * Block if baseline comparison shows regressions above threshold
 */
export declare function gateRegression(input: DeploymentGatesInput): GateResult;
