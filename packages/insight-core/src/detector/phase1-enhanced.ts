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

// Export Enhanced DB Detector
export {
    EnhancedDBDetector,
    DBConnectionIssue,
    DBConnectionPattern,
    DB_PATTERNS
} from './enhanced-db-detector';

// Export Smart Security Scanner
export {
    SmartSecurityScanner,
    SecurityIssue,
    SensitivePattern,
    SENSITIVE_PATTERNS
} from './smart-security-scanner';

// Export Context-Aware Performance Detector
export {
    ContextAwarePerformanceDetector,
    PerformanceIssue,
    FileContext
} from './context-aware-performance';

/**
 * Integration helper to use Phase 1 detectors
 */
export class Phase1DetectorSuite {
    private dbDetector: any;
    private securityDetector: any;
    private performanceDetector: any;

    constructor(workspaceRoot: string) {
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
    async detectAll(targetDir?: string) {
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
    async getStatistics(targetDir?: string) {
        const results = await this.detectAll(targetDir);

        return {
            database: this.dbDetector.getSummary?.() || {},
            security: this.securityDetector.getStatistics?.(results.security) || {},
            performance: this.performanceDetector.getStatistics?.(results.performance) || {},
            overall: results.summary
        };
    }
}
