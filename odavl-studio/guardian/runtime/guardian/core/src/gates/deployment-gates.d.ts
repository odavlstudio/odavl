/**
 * ODAVL Guardian - Deployment Gates
 * Phase Ω-P2: Production-grade deployment safety gates
 */
export interface GateResult {
    pass: boolean;
    reason: string;
    score?: number;
    gate: string;
}
export interface DeploymentGatesInput {
    brainConfidence?: number;
    brainFusionScore?: number;
    brainReasoning?: string[];
    lighthouseScore?: number;
    performanceScore?: number;
    webVitals?: {
        lcp?: number;
        fid?: number;
        cls?: number;
    };
    baselineComparison?: {
        regressions: number;
        improvements: number;
    };
    mtlSecurity?: number;
    fileTypeRisk?: {
        high: number;
        medium: number;
        low: number;
    };
    fileRiskSummary?: {
        avgRisk: number;
        criticalCount: number;
    };
    changedFiles?: string[];
    thresholds?: {
        confidence?: number;
        lighthouse?: number;
        lcp?: number;
        fid?: number;
        cls?: number;
        maxRegressions?: number;
    };
}
/**
 * Gate 1: Confidence Threshold
 * Block if Brain confidence below required threshold
 *
 * OMEGA-P8: Threshold adjusted by adaptive guardian sensitivity
 */
export declare function gateConfidence(input: DeploymentGatesInput): GateResult;
