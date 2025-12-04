/**
 * Pattern Learning System - Database Schema
 * 
 * Stores learned patterns and their historical performance to enable
 * adaptive confidence scoring and continuous improvement.
 * 
 * @module learning/pattern-learning-schema
 * @version 3.0.0
 */

/**
 * Unique pattern signature for tracking across runs
 */
export interface PatternSignature {
    /** Detector that identified this pattern (e.g., 'enhanced-db', 'smart-security') */
    detector: string;

    /** Pattern type (e.g., 'connection-leak', 'hardcoded-secret', 'blocking-operation') */
    patternType: string;

    /** Hash of the pattern characteristics (code structure, context, location) */
    signatureHash: string;

    /** File path where pattern was detected */
    filePath: string;

    /** Line number in file */
    line: number;
}

/**
 * User correction feedback for a detected issue
 */
export interface UserCorrection {
    /** ISO timestamp when correction was made */
    timestamp: string;

    /** Was this a true positive or false positive? */
    isValid: boolean;

    /** Optional user explanation */
    reason?: string;

    /** User ID (for team environments) */
    userId?: string;

    /** Confidence level at time of detection */
    detectedConfidence: number;
}

/**
 * Performance metrics for a learned pattern
 */
export interface PatternPerformance {
    /** Total times pattern was detected */
    detectionCount: number;

    /** Times pattern was confirmed as true positive */
    successCount: number;

    /** Times pattern was marked as false positive */
    failureCount: number;

    /** Times auto-fix was applied successfully */
    autoFixSuccessCount: number;

    /** Times auto-fix failed or was rolled back */
    autoFixFailureCount: number;

    /** Calculated success rate (0-1) */
    successRate: number;

    /** Calculated false positive rate (0-1) */
    falsePositiveRate: number;

    /** Average confidence when detected */
    avgConfidence: number;

    /** Confidence when pattern succeeds */
    avgSuccessConfidence: number;

    /** Confidence when pattern fails */
    avgFailureConfidence: number;
}

/**
 * Context in which pattern was detected
 */
export interface PatternContext {
    /** Framework detected (React, Express, Next.js, etc.) */
    framework?: string;

    /** File type context (api-route, component, server, etc.) */
    fileContext: string;

    /** Surrounding code patterns (error-handling, cleanup, etc.) */
    codeContext: string[];

    /** Import statements present */
    imports: string[];

    /** TypeScript types involved */
    types?: string[];
}

/**
 * Suggested fix for this pattern (if available)
 */
export interface SuggestedFix {
    /** Fix strategy (replace, wrap, extract, etc.) */
    strategy: 'replace' | 'wrap' | 'extract' | 'add-cleanup' | 'add-error-handling';

    /** Code template for the fix */
    template: string;

    /** Confidence in this fix (0-100) */
    confidence: number;

    /** Has this fix been tested? */
    tested: boolean;

    /** Success rate for this fix (0-1) */
    successRate: number;
}

/**
 * Complete learned pattern entry
 */
export interface LearnedPattern {
    /** Unique pattern ID */
    id: string;

    /** Pattern signature for identification */
    signature: PatternSignature;

    /** Performance metrics */
    performance: PatternPerformance;

    /** Detection context */
    context: PatternContext;

    /** User corrections history */
    corrections: UserCorrection[];

    /** Suggested fix (if available) */
    suggestedFix?: SuggestedFix;

    /** ISO timestamp when first detected */
    firstDetected: string;

    /** ISO timestamp when last updated */
    lastUpdated: string;

    /** ISO timestamp when last detected */
    lastSeen: string;

    /** Is pattern currently active (or deprecated)? */
    active: boolean;

    /** Should this pattern be skipped in future detections? */
    skipInFuture: boolean;

    /** Notes or metadata */
    notes?: string;
}

/**
 * Pattern database structure stored in .odavl/learning/patterns.json
 */
export interface PatternDatabase {
    /** Schema version for migrations */
    version: string;

    /** ISO timestamp when database was created */
    created: string;

    /** ISO timestamp when last updated */
    lastUpdated: string;

    /** All learned patterns indexed by pattern ID */
    patterns: Record<string, LearnedPattern>;

    /** Global statistics */
    globalStats: {
        totalPatterns: number;
        activePatterns: number;
        deprecatedPatterns: number;
        totalDetections: number;
        totalCorrections: number;
        overallSuccessRate: number;
        overallFalsePositiveRate: number;
    };

    /** Per-detector statistics */
    detectorStats: Record<string, {
        patternCount: number;
        successRate: number;
        falsePositiveRate: number;
        avgConfidence: number;
    }>;
}

/**
 * Query filters for pattern lookup
 */
export interface PatternQuery {
    /** Filter by detector */
    detector?: string;

    /** Filter by pattern type */
    patternType?: string;

    /** Filter by file path (exact or glob) */
    filePath?: string;

    /** Filter by framework */
    framework?: string;

    /** Minimum success rate threshold */
    minSuccessRate?: number;

    /** Maximum false positive rate threshold */
    maxFalsePositiveRate?: number;

    /** Only active patterns */
    activeOnly?: boolean;

    /** Sort by field */
    sortBy?: 'successRate' | 'detectionCount' | 'lastSeen' | 'confidence';

    /** Sort direction */
    sortOrder?: 'asc' | 'desc';

    /** Limit results */
    limit?: number;
}

/**
 * Pattern update operations
 */
export interface PatternUpdate {
    /** Pattern ID to update */
    patternId: string;

    /** Increment detection count */
    recordDetection?: boolean;

    /** Record a success */
    recordSuccess?: boolean;

    /** Record a failure */
    recordFailure?: boolean;

    /** Add user correction */
    addCorrection?: UserCorrection;

    /** Update suggested fix */
    updateFix?: SuggestedFix;

    /** Mark as deprecated */
    deprecate?: boolean;

    /** Skip in future detections */
    skipInFuture?: boolean;

    /** Add notes */
    notes?: string;
}

/**
 * Learning system configuration
 */
export interface LearningConfig {
    /** Enable pattern learning */
    enabled: boolean;

    /** Minimum detections before pattern is considered stable */
    minDetectionsForStability: number;

    /** Deprecate patterns not seen in X days */
    deprecateAfterDays: number;

    /** Auto-skip patterns with false positive rate > threshold */
    autoSkipThreshold: number;

    /** Confidence boost for high-performing patterns (0-1) */
    confidenceBoost: number;

    /** Confidence penalty for low-performing patterns (0-1) */
    confidencePenalty: number;

    /** Enable auto-fix suggestions */
    enableAutoFixSuggestions: boolean;

    /** Minimum confidence for auto-fix (0-100) */
    autoFixMinConfidence: number;

    /** Database file path */
    databasePath: string;
}

/**
 * Default learning configuration
 */
export const DEFAULT_LEARNING_CONFIG: LearningConfig = {
    enabled: true,
    minDetectionsForStability: 10,
    deprecateAfterDays: 90,
    autoSkipThreshold: 0.7, // Skip if >70% false positive rate
    confidenceBoost: 0.15, // +15% confidence for high performers
    confidencePenalty: 0.25, // -25% confidence for low performers
    enableAutoFixSuggestions: true,
    autoFixMinConfidence: 85,
    databasePath: '.odavl/learning/patterns.json',
};

/**
 * Example pattern database structure:
 * 
 * ```json
 * {
 *   "version": "3.0.0",
 *   "created": "2025-01-09T...",
 *   "lastUpdated": "2025-01-09T...",
 *   "patterns": {
 *     "db-connection-leak-abc123": {
 *       "id": "db-connection-leak-abc123",
 *       "signature": {
 *         "detector": "enhanced-db",
 *         "patternType": "connection-leak",
 *         "signatureHash": "sha256-abc123...",
 *         "filePath": "src/api/users.ts",
 *         "line": 42
 *       },
 *       "performance": {
 *         "detectionCount": 15,
 *         "successCount": 14,
 *         "failureCount": 1,
 *         "autoFixSuccessCount": 12,
 *         "autoFixFailureCount": 0,
 *         "successRate": 0.93,
 *         "falsePositiveRate": 0.07,
 *         "avgConfidence": 87,
 *         "avgSuccessConfidence": 89,
 *         "avgFailureConfidence": 72
 *       },
 *       "context": {
 *         "framework": "express",
 *         "fileContext": "api-route",
 *         "codeContext": ["no-error-handling", "no-cleanup"],
 *         "imports": ["pg", "express"],
 *         "types": ["Request", "Response"]
 *       },
 *       "corrections": [
 *         {
 *           "timestamp": "2025-01-08T...",
 *           "isValid": true,
 *           "reason": "Confirmed connection leak in production",
 *           "userId": "dev-123",
 *           "detectedConfidence": 87
 *         }
 *       ],
 *       "suggestedFix": {
 *         "strategy": "add-cleanup",
 *         "template": "finally { await client.end(); }",
 *         "confidence": 92,
 *         "tested": true,
 *         "successRate": 0.95
 *       },
 *       "firstDetected": "2025-01-01T...",
 *       "lastUpdated": "2025-01-09T...",
 *       "lastSeen": "2025-01-09T...",
 *       "active": true,
 *       "skipInFuture": false
 *     }
 *   },
 *   "globalStats": {
 *     "totalPatterns": 127,
 *     "activePatterns": 115,
 *     "deprecatedPatterns": 12,
 *     "totalDetections": 1543,
 *     "totalCorrections": 89,
 *     "overallSuccessRate": 0.88,
 *     "overallFalsePositiveRate": 0.12
 *   },
 *   "detectorStats": {
 *     "enhanced-db": {
 *       "patternCount": 42,
 *       "successRate": 0.91,
 *       "falsePositiveRate": 0.09,
 *       "avgConfidence": 86
 *     },
 *     "smart-security": {
 *       "patternCount": 38,
 *       "successRate": 0.85,
 *       "falsePositiveRate": 0.15,
 *       "avgConfidence": 82
 *     },
 *     "context-aware-performance": {
 *       "patternCount": 47,
 *       "successRate": 0.88,
 *       "falsePositiveRate": 0.12,
 *       "avgConfidence": 84
 *     }
 *   }
 * }
 * ```
 */
