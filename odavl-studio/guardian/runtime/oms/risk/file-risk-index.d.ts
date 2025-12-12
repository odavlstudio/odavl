/**
 * OMEGA-P5: File Risk Index
 * Real risk scoring system for files based on type + history
 */
import type { FileTypeDefinition } from '../file-types/ts.js';
export interface FileRiskInput {
    type: FileTypeDefinition;
    detectorFailureRate?: number;
    changeFrequency?: number;
}
/**
 * OMEGA-P5 Risk Scoring Formula:
 * score = (riskWeight * 0.5) + (importance * 0.3) + (detectorFailure * 0.15) + (changeFreq * 0.05)
 *
 * OMEGA-P8: Multiplied by adaptive OMS weighting (0.5-1.5)
 */
export declare function computeFileRiskScore(input: FileRiskInput): number;
/**
 * Classify risk level based on score
 * Thresholds: <0.25 low, <0.45 medium, <0.7 high, >=0.7 critical
 */
export declare function classifyRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical';
/**
 * Build risk index for multiple files
 */
export declare function buildRiskIndex(files: Array<{
    path: string;
    type: FileTypeDefinition;
    detectorFailureRate?: number;
    changeFrequency?: number;
}>): Record<string, {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
}>;
