export * from "./learn.js";
export * from "./training.js";

// Phase P1: Manifest configuration (read-only wiring)
export * from "./config/manifest-config.js";

// Wave 8 Phase 2: Worker Pool for Process Isolation
export { DetectorWorkerPool } from "./core/detector-worker-pool.js";
export { DetectorErrorAggregator } from "./core/error-aggregator.js";
export type {
  DetectorWorkerPoolConfig,
  DetectorResult,
} from "./core/detector-worker-pool.js";
export type {
  NormalizedDetectorError,
  DetectorErrorSeverity,
} from "./core/error-aggregator.js";

// Re-export detector utilities for convenience
export { loadDetector } from "./detector/detector-loader.js";
export type { DetectorName } from "./detector/detector-loader.js";

// Phase 5: Telemetry integration
import { EventEmitter, ODAVLEvent } from '@odavl-studio/telemetry';
const telemetry = new EventEmitter();
export function emitInsightEvent(type: ODAVLEvent, data?: Record<string, unknown>): void {
    telemetry.emit(type, 'insight', data);
}

// Phase 3: Learning System
export * from "./learning/pattern-learning-schema.js";
export * from "./learning/pattern-memory.js";
export { getPatternMemory, resetPatternMemory, PatternMemory } from "./learning/pattern-memory.js";
export type {
    PatternSignature,
    PatternDatabase,
    LearnedPattern,
    PatternQuery,
    PatternUpdate,
    UserCorrection,
    SuggestedFix,
    LearningConfig,
} from "./learning/pattern-learning-schema.js";

// Phase 1 Fix: Ignore patterns for false positive elimination
export * from "./utils/ignore-patterns.js";

// Phase 3 Fix: Performance optimization utilities
export {
    ResultCache,
    GitChangeDetector,
    ParallelDetectorExecutor,
    PerformanceTracker,
    SmartFileFilter,
} from "./utils/performance.js";

// OMEGA-P5 Phase 4 Commit 2: OMS Integration
export { AnalysisEngine } from "./analysis-engine.js";
export { AnalysisContext } from "./analysis-context.js";
export { selectDetectors } from "./detector-router.js";
export { scaleSeverity } from "./severity-scaler.js";
export type { AnalysisResult, AnalysisIssue } from "./analysis-engine.js";
export type { AnalysisContextOptions } from "./analysis-context.js";
