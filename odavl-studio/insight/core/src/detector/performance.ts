/**
 * ODAVL Insight - Performance Detector (Standalone Entry)
 * Lightweight import for performance-specific detection
 * Bundle size: ~600 KB (vs 10 MB for full detector bundle)
 */

export { PerformanceDetector, PerformanceErrorType } from './performance-detector.js';
export type { 
    PerformanceError, 
    PerformanceStatistics, 
    PerformanceDetectorOptions 
} from './performance-detector.js';

// Context-aware performance (v3.0)
export { ContextAwarePerformanceDetector, FileContext } from './context-aware-performance.js';
export type { PerformanceIssue as ContextAwarePerformanceIssue } from './context-aware-performance.js';
