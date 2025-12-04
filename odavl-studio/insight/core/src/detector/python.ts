/**
 * ODAVL Insight - Python Detectors (Standalone Entry)
 * Lightweight import for Python-specific detection
 * Bundle size: ~700 KB (vs 10 MB for full detector bundle)
 */

export {
    PythonTypeDetector,
    PythonSecurityDetector,
    PythonComplexityDetector,
    PythonImportsDetector,
    PythonBestPracticesDetector,
} from './python/index.js';

export type {
    PythonTypeIssue,
    PythonSecurityIssue,
    PythonComplexityIssue,
    PythonImportsIssue,
    PythonBestPracticesIssue,
} from './python/index.js';
