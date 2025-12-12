/**
 * ODAVL Insight - Unified Detector System
 * Unified system to detect all types of errors
 * 
 * Phase 3B: Lazy Loading Support
 * Use loadDetector() for on-demand loading to optimize cold start
 */

// Phase 3B: Lazy Loading System
export {
  loadDetector,
  loadDetectors,
  preloadCommonDetectors,
  getLoadStats,
  getAverageLoadTime,
  getCacheHitRatio,
  clearCache,
  getCacheSize,
  type DetectorName,
  type DetectorLoadStats,
} from './detector-loader.js';

// Static imports (legacy support - will be tree-shaken if unused)
export { TSDetector } from './ts-detector.js';
export { ESLintDetector } from './eslint-detector.js';
export { ImportDetector } from './import-detector.js';
export { PackageDetector } from './package-detector.js';
export { RuntimeDetector } from './runtime-detector.js';
export { BuildDetector } from './build-detector.js';
export { SecurityDetector } from './security-detector.js';
export { CircularDependencyDetector } from './circular-detector.js';
export { ComponentIsolationDetector } from './isolation-detector.js';
export { PerformanceDetector, PerformanceErrorType } from './performance-detector.js';
export { NetworkDetector } from './network-detector.js';
export { ComplexityDetector, ComplexityErrorType } from './complexity-detector.js';

// NEW: Go Detector (Phase 8 - Dec 2025)
export {
  GoDetector,
  type GoError,
  GoErrorCategory,
  type GoStatistics,
} from './go-detector.js';

// NEW: Rust Detector (Phase 8 - Dec 2025)
export {
  RustDetector,
  type RustError,
  RustErrorCategory,
  type RustStatistics,
} from './rust-detector.js';

// NEW: Architecture Detector (MVP Month 1)
export { 
  ArchitectureDetector, 
  analyzeArchitecture,
  type ArchitectureIssue,
  type ArchitectureMetrics,
  type ArchitectureAnalysisResult,
  type DependencyGraph,
  type LayerConfig,
  type ArchitectureConfig,
} from './architecture-detector.js';

// NEW: Database Detector (MVP Month 1 - Week 3)
export {
  DatabaseDetector,
  analyzeDatabase,
  type DatabaseIssue,
  type DatabaseMetrics,
  type DatabaseAnalysisResult,
  type DatabaseConfig,
} from './database-detector.js';

// NEW: Next.js Detector (MVP Month 2 - Week 5-6)
export {
  NextJSDetector,
  analyzeNextJS,
  type NextJSIssue,
  type NextJSMetrics,
  type NextJSAnalysisResult,
  type NextJSConfig,
} from './nextjs-detector.js';

// NEW: Infrastructure Detector (MVP Month 2 - Week 7-8)
export {
  InfrastructureDetector,
  analyzeInfrastructure,
  type InfrastructureIssue,
  type InfrastructureMetrics,
  type InfrastructureAnalysisResult,
  type InfrastructureConfig,
} from './infrastructure-detector.js';

// Python Language Support (Phase 2 - Week 7)
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

// Java Language Support (Phase 2 - Week 10)
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

// Phase 1 Enhanced Detectors
export { Phase1DetectorSuite } from './phase1-enhanced.js';
export { EnhancedDBDetector } from './enhanced-db-detector.js';
export { SmartSecurityScanner } from './smart-security-scanner.js';

// Phase 3.0 - Context-Aware Detectors (Session 16)
export { ContextAwareSecurityDetector } from './context-aware-security-v3.js';
export { 
    createWrapperDetectionSystem,
    type WrapperDetectionSystem,
    type WrapperInfo,
    type WrapperCallSite,
} from './wrapper-detection-v3.js';
export { ContextAwarePerformanceDetector, FileContext } from './context-aware-performance.js';

// Phase 2 Confidence Scoring & Framework Rules (v2.0.0)
export {
    calculateConfidence,
    PatternStrength,
    ContextScore,
    StructureScore,
    HistoricalAccuracy,
    type ConfidenceFactors,
    type ConfidenceScore
} from './confidence-scoring.js';

export {
    detectFramework,
    getFrameworkRules,
    checkFrameworkRules,
    REACT_RULES,
    EXPRESS_RULES,
    NEXTJS_RULES,
    NODEJS_RULES,
    type Framework,
    type FrameworkDetection,
    type FrameworkRule
} from './framework-rules.js';

export type { TSError } from './ts-detector.js';
export type { ESLintError } from './eslint-detector.js';
export type { ImportError } from './import-detector.js';
export type { PackageError } from './package-detector.js';
export type { RuntimeError } from './runtime-detector.js';
export type { BuildError } from './build-detector.js';
export type { SecurityError, SecurityErrorType } from './security-detector.js';
export type { CircularDependency, CircularStats } from './circular-detector.js';
export type { IsolationIssue, IsolationIssueType, IsolationStats } from './isolation-detector.js';
export type { PerformanceError, PerformanceStatistics, PerformanceDetectorOptions } from './performance-detector.js';
export type { NetworkError, NetworkErrorType, NetworkStatistics } from './network-detector.js';
export type { ComplexityError, ComplexityStatistics } from './complexity-detector.js';

// Phase 1 Enhanced Types
export type { DBConnectionIssue } from './enhanced-db-detector.js';
export type { SecurityIssue as SmartSecurityIssue } from './smart-security-scanner.js';
export type { PerformanceIssue as ContextAwarePerformanceIssue } from './context-aware-performance.js';

// BundleAnalyzer exports
export { BundleAnalyzer } from '../analyzer/bundle-analyzer.js';
export type { BundleAnalysis, ModuleInfo, BundlerConfig } from '../analyzer/bundle-analyzer.js';

