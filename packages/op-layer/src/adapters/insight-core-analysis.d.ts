/**
 * Manual type declarations for InsightCoreAnalysisAdapter
 * (Avoids TypeScript errors with external @odavl-studio/insight-core)
 */

import type { AnalysisAdapter } from '../protocols/analysis.js';

/**
 * Adapter that wraps Insight Core's 12 detectors
 * Maps protocol DetectorId → Insight Core detector implementations
 */
export declare class InsightCoreAnalysisAdapter implements AnalysisAdapter {
  analyze(request: import('../types/analysis.js').AnalysisRequest): Promise<import('../types/analysis.js').AnalysisSummary>;
}
