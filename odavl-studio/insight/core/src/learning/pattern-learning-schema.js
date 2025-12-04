"use strict";
/**
 * Pattern Learning System - Database Schema
 *
 * Stores learned patterns and their historical performance to enable
 * adaptive confidence scoring and continuous improvement.
 *
 * @module learning/pattern-learning-schema
 * @version 3.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_LEARNING_CONFIG = void 0;
/**
 * Default learning configuration
 */
exports.DEFAULT_LEARNING_CONFIG = {
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
//# sourceMappingURL=pattern-learning-schema.js.map