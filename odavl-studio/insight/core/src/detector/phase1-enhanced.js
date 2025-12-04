"use strict";
/**
 * Phase 1 Enhanced Detectors - Export Module
 *
 * This module exports the three enhanced detectors from Phase 1:
 * 1. EnhancedDBDetector - Smart DB connection leak detection
 * 2. SmartSecurityScanner - Intelligent sensitive data detection
 * 3. ContextAwarePerformanceDetector - Context-aware blocking operations
 *
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phase1DetectorSuite = exports.FileContext = exports.ContextAwarePerformanceDetector = exports.SENSITIVE_PATTERNS = exports.SmartSecurityScanner = exports.DB_PATTERNS = exports.EnhancedDBDetector = void 0;
// Export Enhanced DB Detector
var enhanced_db_detector_1 = require("./enhanced-db-detector");
Object.defineProperty(exports, "EnhancedDBDetector", { enumerable: true, get: function () { return enhanced_db_detector_1.EnhancedDBDetector; } });
Object.defineProperty(exports, "DB_PATTERNS", { enumerable: true, get: function () { return enhanced_db_detector_1.DB_PATTERNS; } });
// Export Smart Security Scanner
var smart_security_scanner_1 = require("./smart-security-scanner");
Object.defineProperty(exports, "SmartSecurityScanner", { enumerable: true, get: function () { return smart_security_scanner_1.SmartSecurityScanner; } });
Object.defineProperty(exports, "SENSITIVE_PATTERNS", { enumerable: true, get: function () { return smart_security_scanner_1.SENSITIVE_PATTERNS; } });
// Export Context-Aware Performance Detector
var context_aware_performance_1 = require("./context-aware-performance");
Object.defineProperty(exports, "ContextAwarePerformanceDetector", { enumerable: true, get: function () { return context_aware_performance_1.ContextAwarePerformanceDetector; } });
Object.defineProperty(exports, "FileContext", { enumerable: true, get: function () { return context_aware_performance_1.FileContext; } });
/**
 * Integration helper to use Phase 1 detectors
 */
class Phase1DetectorSuite {
    dbDetector;
    securityDetector;
    performanceDetector;
    constructor(workspaceRoot) {
        const { EnhancedDBDetector } = require('./enhanced-db-detector');
        const { SmartSecurityScanner } = require('./smart-security-scanner');
        const { ContextAwarePerformanceDetector } = require('./context-aware-performance');
        this.dbDetector = new EnhancedDBDetector(workspaceRoot);
        this.securityDetector = new SmartSecurityScanner(workspaceRoot);
        this.performanceDetector = new ContextAwarePerformanceDetector(workspaceRoot);
    }
    /**
     * Run all Phase 1 enhanced detectors
     */
    async detectAll(targetDir) {
        const [dbIssues, securityIssues, performanceIssues] = await Promise.all([
            this.dbDetector.detect(targetDir),
            this.securityDetector.detect(targetDir),
            this.performanceDetector.detect(targetDir)
        ]);
        return {
            database: dbIssues,
            security: securityIssues,
            performance: performanceIssues,
            summary: {
                totalIssues: dbIssues.length + securityIssues.length + performanceIssues.length,
                byCategory: {
                    database: dbIssues.length,
                    security: securityIssues.length,
                    performance: performanceIssues.length
                }
            }
        };
    }
    /**
     * Get statistics from all detectors
     */
    async getStatistics(targetDir) {
        const results = await this.detectAll(targetDir);
        return {
            database: this.dbDetector.getSummary?.() || {},
            security: this.securityDetector.getStatistics?.(results.security) || {},
            performance: this.performanceDetector.getStatistics?.(results.performance) || {},
            overall: results.summary
        };
    }
}
exports.Phase1DetectorSuite = Phase1DetectorSuite;
//# sourceMappingURL=phase1-enhanced.js.map