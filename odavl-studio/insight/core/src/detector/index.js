"use strict";
/**
 * ODAVL Insight - Unified Detector System
 * Unified system to detect all types of errors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BundleAnalyzer = exports.NODEJS_RULES = exports.NEXTJS_RULES = exports.EXPRESS_RULES = exports.REACT_RULES = exports.checkFrameworkRules = exports.getFrameworkRules = exports.detectFramework = exports.HistoricalAccuracy = exports.StructureScore = exports.ContextScore = exports.PatternStrength = exports.calculateConfidence = exports.FileContext = exports.ContextAwarePerformanceDetector = exports.SmartSecurityScanner = exports.EnhancedDBDetector = exports.Phase1DetectorSuite = exports.ComplexityErrorType = exports.ComplexityDetector = exports.NetworkDetector = exports.PerformanceErrorType = exports.PerformanceDetector = exports.ComponentIsolationDetector = exports.CircularDependencyDetector = exports.SecurityDetector = exports.BuildDetector = exports.RuntimeDetector = exports.PackageDetector = exports.ImportDetector = exports.ESLintDetector = exports.TSDetector = void 0;
var ts_detector_js_1 = require("./ts-detector.js");
Object.defineProperty(exports, "TSDetector", { enumerable: true, get: function () { return ts_detector_js_1.TSDetector; } });
var eslint_detector_js_1 = require("./eslint-detector.js");
Object.defineProperty(exports, "ESLintDetector", { enumerable: true, get: function () { return eslint_detector_js_1.ESLintDetector; } });
var import_detector_js_1 = require("./import-detector.js");
Object.defineProperty(exports, "ImportDetector", { enumerable: true, get: function () { return import_detector_js_1.ImportDetector; } });
var package_detector_js_1 = require("./package-detector.js");
Object.defineProperty(exports, "PackageDetector", { enumerable: true, get: function () { return package_detector_js_1.PackageDetector; } });
var runtime_detector_js_1 = require("./runtime-detector.js");
Object.defineProperty(exports, "RuntimeDetector", { enumerable: true, get: function () { return runtime_detector_js_1.RuntimeDetector; } });
var build_detector_js_1 = require("./build-detector.js");
Object.defineProperty(exports, "BuildDetector", { enumerable: true, get: function () { return build_detector_js_1.BuildDetector; } });
var security_detector_js_1 = require("./security-detector.js");
Object.defineProperty(exports, "SecurityDetector", { enumerable: true, get: function () { return security_detector_js_1.SecurityDetector; } });
var circular_detector_js_1 = require("./circular-detector.js");
Object.defineProperty(exports, "CircularDependencyDetector", { enumerable: true, get: function () { return circular_detector_js_1.CircularDependencyDetector; } });
var isolation_detector_js_1 = require("./isolation-detector.js");
Object.defineProperty(exports, "ComponentIsolationDetector", { enumerable: true, get: function () { return isolation_detector_js_1.ComponentIsolationDetector; } });
var performance_detector_js_1 = require("./performance-detector.js");
Object.defineProperty(exports, "PerformanceDetector", { enumerable: true, get: function () { return performance_detector_js_1.PerformanceDetector; } });
Object.defineProperty(exports, "PerformanceErrorType", { enumerable: true, get: function () { return performance_detector_js_1.PerformanceErrorType; } });
var network_detector_js_1 = require("./network-detector.js");
Object.defineProperty(exports, "NetworkDetector", { enumerable: true, get: function () { return network_detector_js_1.NetworkDetector; } });
var complexity_detector_js_1 = require("./complexity-detector.js");
Object.defineProperty(exports, "ComplexityDetector", { enumerable: true, get: function () { return complexity_detector_js_1.ComplexityDetector; } });
Object.defineProperty(exports, "ComplexityErrorType", { enumerable: true, get: function () { return complexity_detector_js_1.ComplexityErrorType; } });
// Phase 1 Enhanced Detectors
var phase1_enhanced_js_1 = require("./phase1-enhanced.js");
Object.defineProperty(exports, "Phase1DetectorSuite", { enumerable: true, get: function () { return phase1_enhanced_js_1.Phase1DetectorSuite; } });
var enhanced_db_detector_js_1 = require("./enhanced-db-detector.js");
Object.defineProperty(exports, "EnhancedDBDetector", { enumerable: true, get: function () { return enhanced_db_detector_js_1.EnhancedDBDetector; } });
var smart_security_scanner_js_1 = require("./smart-security-scanner.js");
Object.defineProperty(exports, "SmartSecurityScanner", { enumerable: true, get: function () { return smart_security_scanner_js_1.SmartSecurityScanner; } });
var context_aware_performance_js_1 = require("./context-aware-performance.js");
Object.defineProperty(exports, "ContextAwarePerformanceDetector", { enumerable: true, get: function () { return context_aware_performance_js_1.ContextAwarePerformanceDetector; } });
Object.defineProperty(exports, "FileContext", { enumerable: true, get: function () { return context_aware_performance_js_1.FileContext; } });
// Phase 2 Confidence Scoring & Framework Rules (v2.0.0)
var confidence_scoring_js_1 = require("./confidence-scoring.js");
Object.defineProperty(exports, "calculateConfidence", { enumerable: true, get: function () { return confidence_scoring_js_1.calculateConfidence; } });
Object.defineProperty(exports, "PatternStrength", { enumerable: true, get: function () { return confidence_scoring_js_1.PatternStrength; } });
Object.defineProperty(exports, "ContextScore", { enumerable: true, get: function () { return confidence_scoring_js_1.ContextScore; } });
Object.defineProperty(exports, "StructureScore", { enumerable: true, get: function () { return confidence_scoring_js_1.StructureScore; } });
Object.defineProperty(exports, "HistoricalAccuracy", { enumerable: true, get: function () { return confidence_scoring_js_1.HistoricalAccuracy; } });
var framework_rules_js_1 = require("./framework-rules.js");
Object.defineProperty(exports, "detectFramework", { enumerable: true, get: function () { return framework_rules_js_1.detectFramework; } });
Object.defineProperty(exports, "getFrameworkRules", { enumerable: true, get: function () { return framework_rules_js_1.getFrameworkRules; } });
Object.defineProperty(exports, "checkFrameworkRules", { enumerable: true, get: function () { return framework_rules_js_1.checkFrameworkRules; } });
Object.defineProperty(exports, "REACT_RULES", { enumerable: true, get: function () { return framework_rules_js_1.REACT_RULES; } });
Object.defineProperty(exports, "EXPRESS_RULES", { enumerable: true, get: function () { return framework_rules_js_1.EXPRESS_RULES; } });
Object.defineProperty(exports, "NEXTJS_RULES", { enumerable: true, get: function () { return framework_rules_js_1.NEXTJS_RULES; } });
Object.defineProperty(exports, "NODEJS_RULES", { enumerable: true, get: function () { return framework_rules_js_1.NODEJS_RULES; } });
// BundleAnalyzer exports
var bundle_analyzer_js_1 = require("../analyzer/bundle-analyzer.js");
Object.defineProperty(exports, "BundleAnalyzer", { enumerable: true, get: function () { return bundle_analyzer_js_1.BundleAnalyzer; } });
//# sourceMappingURL=index.js.map