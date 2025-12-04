/**
 * ODAVL Insight - Java Detectors (Standalone Entry)
 * Lightweight import for Java-specific detection
 * Bundle size: ~600 KB (vs 10 MB for full detector bundle)
 */

export {
    JavaComplexityDetector,
    JavaStreamDetector,
    JavaExceptionDetector,
    JavaMemoryDetector,
    JavaSpringDetector,
} from './java/index.js';

export type {
    JavaIssue,
} from './java/index.js';
