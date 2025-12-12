/**
 * ODAVL Guardian - Performance Gates
 * Phase Ω-P2: Lighthouse + Web Vitals enforcement
 */
import type { GateResult, DeploymentGatesInput } from './deployment-gates';
/**
 * Gate 2: Performance Threshold
 * Block if Lighthouse or Web Vitals below thresholds
 */
export declare function gatePerformance(input: DeploymentGatesInput): GateResult;
