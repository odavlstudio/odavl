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
/**
 * Run all deployment gates
 */
export declare function runAllGates(input: import('./deployment-gates').DeploymentGatesInput): Promise<import('./deployment-gates').GateResult[]>;
