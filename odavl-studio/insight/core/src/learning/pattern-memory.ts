/**
 * Pattern Memory System - Core Learning Engine
 * 
 * Manages learned patterns, tracks performance, and provides adaptive
 * confidence scoring based on historical data.
 * 
 * @module learning/pattern-memory
 * @version 3.0.0
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import type {
    PatternDatabase,
    LearnedPattern,
    PatternSignature,
    PatternQuery,
    PatternUpdate,
    UserCorrection,
    LearningConfig,
} from './pattern-learning-schema.js';
import { DEFAULT_LEARNING_CONFIG } from './pattern-learning-schema.js';

/**
 * Pattern Memory - Manages learned patterns and adaptive scoring
 */
export class PatternMemory {
    private database: PatternDatabase;
    private config: LearningConfig;
    private dirty = false; // Track if database needs saving

    constructor(config: Partial<LearningConfig> = {}) {
        this.config = { ...DEFAULT_LEARNING_CONFIG, ...config };
        this.database = this.loadDatabase();
    }

    /**
     * Load pattern database from disk
     */
    private loadDatabase(): PatternDatabase {
        const dbPath = this.config.databasePath;

        if (!existsSync(dbPath)) {
            return this.createEmptyDatabase();
        }

        try {
            const content = readFileSync(dbPath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.warn(`[PatternMemory] Failed to load database, creating new one:`, error);
            return this.createEmptyDatabase();
        }
    }

    /**
     * Create empty pattern database
     */
    private createEmptyDatabase(): PatternDatabase {
        return {
            version: '3.0.0',
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            patterns: {},
            globalStats: {
                totalPatterns: 0,
                activePatterns: 0,
                deprecatedPatterns: 0,
                totalDetections: 0,
                totalCorrections: 0,
                overallSuccessRate: 0,
                overallFalsePositiveRate: 0,
            },
            detectorStats: {},
        };
    }

    /**
     * Save database to disk
     */
    private saveDatabase(): void {
        if (!this.dirty) return;

        const dbPath = this.config.databasePath;
        const dbDir = dirname(dbPath);

        // Ensure directory exists
        if (!existsSync(dbDir)) {
            mkdirSync(dbDir, { recursive: true });
        }

        this.database.lastUpdated = new Date().toISOString();
        writeFileSync(dbPath, JSON.stringify(this.database, null, 2), 'utf-8');
        this.dirty = false;
    }

    /**
     * Generate unique pattern ID from signature
     */
    private generatePatternId(signature: PatternSignature): string {
        const hash = createHash('sha256')
            .update(`${signature.detector}:${signature.patternType}:${signature.filePath}:${signature.line}`)
            .digest('hex')
            .slice(0, 16);
        return `${signature.detector}-${signature.patternType}-${hash}`;
    }

    /**
     * Generate signature hash for pattern matching
     */
    private generateSignatureHash(signature: PatternSignature): string {
        return createHash('sha256')
            .update(JSON.stringify({
                detector: signature.detector,
                patternType: signature.patternType,
                filePath: signature.filePath,
                line: signature.line,
            }))
            .digest('hex');
    }

    /**
     * Record a successful detection (true positive)
     */
    recordSuccess(
        signature: PatternSignature,
        confidence: number,
        context: LearnedPattern['context']
    ): void {
        const patternId = this.generatePatternId(signature);
        const pattern = this.getOrCreatePattern(patternId, signature, context);

        pattern.performance.detectionCount++;
        pattern.performance.successCount++;
        pattern.performance.avgConfidence =
            (pattern.performance.avgConfidence * (pattern.performance.detectionCount - 1) + confidence) /
            pattern.performance.detectionCount;
        pattern.performance.avgSuccessConfidence =
            (pattern.performance.avgSuccessConfidence * (pattern.performance.successCount - 1) + confidence) /
            pattern.performance.successCount;

        this.updatePerformanceMetrics(pattern);
        pattern.lastSeen = new Date().toISOString();
        pattern.lastUpdated = new Date().toISOString();

        this.updateGlobalStats();
        this.dirty = true;
        this.saveDatabase();
    }

    /**
     * Record a failed detection (false positive)
     */
    recordFailure(
        signature: PatternSignature,
        confidence: number,
        context: LearnedPattern['context']
    ): void {
        const patternId = this.generatePatternId(signature);
        const pattern = this.getOrCreatePattern(patternId, signature, context);

        pattern.performance.detectionCount++;
        pattern.performance.failureCount++;
        pattern.performance.avgConfidence =
            (pattern.performance.avgConfidence * (pattern.performance.detectionCount - 1) + confidence) /
            pattern.performance.detectionCount;
        pattern.performance.avgFailureConfidence =
            (pattern.performance.avgFailureConfidence * (pattern.performance.failureCount - 1) + confidence) /
            pattern.performance.failureCount;

        this.updatePerformanceMetrics(pattern);
        pattern.lastSeen = new Date().toISOString();
        pattern.lastUpdated = new Date().toISOString();

        // Auto-skip if false positive rate exceeds threshold
        if (
            pattern.performance.falsePositiveRate > this.config.autoSkipThreshold &&
            pattern.performance.detectionCount >= this.config.minDetectionsForStability
        ) {
            pattern.skipInFuture = true;
            pattern.notes = `Auto-skipped: FP rate ${(pattern.performance.falsePositiveRate * 100).toFixed(1)}% exceeds threshold`;
        }

        this.updateGlobalStats();
        this.dirty = true;
        this.saveDatabase();
    }

    /**
     * Record user correction feedback
     */
    learnFromCorrection(
        signature: PatternSignature,
        isValid: boolean,
        detectedConfidence: number,
        reason?: string,
        userId?: string
    ): void {
        const patternId = this.generatePatternId(signature);
        const pattern = this.database.patterns[patternId];

        if (!pattern) {
            console.warn(`[PatternMemory] Cannot add correction: pattern not found`);
            return;
        }

        const correction: UserCorrection = {
            timestamp: new Date().toISOString(),
            isValid,
            reason,
            userId,
            detectedConfidence,
        };

        pattern.corrections.push(correction);

        // Update performance based on correction
        if (isValid) {
            pattern.performance.successCount++;
        } else {
            pattern.performance.failureCount++;
        }

        this.updatePerformanceMetrics(pattern);
        pattern.lastUpdated = new Date().toISOString();

        this.updateGlobalStats();
        this.dirty = true;
        this.saveDatabase();
    }

    /**
     * Get pattern accuracy (0-1)
     */
    getPatternAccuracy(signature: PatternSignature): number {
        const patternId = this.generatePatternId(signature);
        const pattern = this.database.patterns[patternId];

        if (!pattern || pattern.performance.detectionCount === 0) {
            // Return detector-level accuracy if pattern not learned yet
            const detector = signature.detector;
            const detectorStats = this.database.detectorStats[detector];
            return detectorStats?.successRate ?? 0.75; // Default 75%
        }

        return pattern.performance.successRate;
    }

    /**
     * Adjust confidence based on pattern history
     */
    adjustConfidence(signature: PatternSignature, baseConfidence: number): number {
        if (!this.config.enabled) return baseConfidence;

        const patternId = this.generatePatternId(signature);
        const pattern = this.database.patterns[patternId];

        // If pattern not learned yet, return base confidence
        if (!pattern || pattern.performance.detectionCount < this.config.minDetectionsForStability) {
            return baseConfidence;
        }

        // Skip if pattern marked to skip
        if (pattern.skipInFuture) {
            return 0; // Zero confidence = skip this issue
        }

        const successRate = pattern.performance.successRate;
        const falsePositiveRate = pattern.performance.falsePositiveRate;

        // High-performing pattern: boost confidence
        if (successRate >= 0.9 && pattern.performance.detectionCount >= 20) {
            return Math.min(100, baseConfidence + this.config.confidenceBoost * 100);
        }

        // Low-performing pattern: penalize confidence
        if (falsePositiveRate >= 0.5 && pattern.performance.detectionCount >= 10) {
            return Math.max(0, baseConfidence - this.config.confidencePenalty * 100);
        }

        // Moderate adjustment based on success rate
        const adjustment = (successRate - 0.75) * 20; // -15 to +5 range
        return Math.max(0, Math.min(100, baseConfidence + adjustment));
    }

    /**
     * Get or create pattern entry
     */
    private getOrCreatePattern(
        patternId: string,
        signature: PatternSignature,
        context: LearnedPattern['context']
    ): LearnedPattern {
        if (this.database.patterns[patternId]) {
            return this.database.patterns[patternId];
        }

        const now = new Date().toISOString();
        const newPattern: LearnedPattern = {
            id: patternId,
            signature: {
                ...signature,
                signatureHash: this.generateSignatureHash(signature),
            },
            performance: {
                detectionCount: 0,
                successCount: 0,
                failureCount: 0,
                autoFixSuccessCount: 0,
                autoFixFailureCount: 0,
                successRate: 0,
                falsePositiveRate: 0,
                avgConfidence: 0,
                avgSuccessConfidence: 0,
                avgFailureConfidence: 0,
            },
            context,
            corrections: [],
            firstDetected: now,
            lastUpdated: now,
            lastSeen: now,
            active: true,
            skipInFuture: false,
        };

        this.database.patterns[patternId] = newPattern;
        this.database.globalStats.totalPatterns++;
        this.database.globalStats.activePatterns++;

        // Initialize detector stats if needed
        if (!this.database.detectorStats[signature.detector]) {
            this.database.detectorStats[signature.detector] = {
                patternCount: 0,
                successRate: 0,
                falsePositiveRate: 0,
                avgConfidence: 0,
            };
        }
        this.database.detectorStats[signature.detector].patternCount++;

        return newPattern;
    }

    /**
     * Update pattern performance metrics
     */
    private updatePerformanceMetrics(pattern: LearnedPattern): void {
        const total = pattern.performance.detectionCount;
        if (total === 0) return;

        pattern.performance.successRate = pattern.performance.successCount / total;
        pattern.performance.falsePositiveRate = pattern.performance.failureCount / total;
    }

    /**
     * Update global statistics
     */
    private updateGlobalStats(): void {
        const patterns = Object.values(this.database.patterns);
        const activePatterns = patterns.filter((p) => p.active);

        let totalDetections = 0;
        let totalSuccesses = 0;
        let totalFailures = 0;
        let totalCorrections = 0;

        for (const pattern of patterns) {
            totalDetections += pattern.performance.detectionCount;
            totalSuccesses += pattern.performance.successCount;
            totalFailures += pattern.performance.failureCount;
            totalCorrections += pattern.corrections.length;
        }

        this.database.globalStats = {
            totalPatterns: patterns.length,
            activePatterns: activePatterns.length,
            deprecatedPatterns: patterns.length - activePatterns.length,
            totalDetections,
            totalCorrections,
            overallSuccessRate: totalDetections > 0 ? totalSuccesses / totalDetections : 0,
            overallFalsePositiveRate: totalDetections > 0 ? totalFailures / totalDetections : 0,
        };

        // Update detector stats
        const detectorGroups = new Map<string, LearnedPattern[]>();
        for (const pattern of patterns) {
            const detector = pattern.signature.detector;
            if (!detectorGroups.has(detector)) {
                detectorGroups.set(detector, []);
            }
            detectorGroups.get(detector)!.push(pattern);
        }

        for (const [detector, detectorPatterns] of detectorGroups) {
            let detectorDetections = 0;
            let detectorSuccesses = 0;
            let detectorFailures = 0;
            let detectorConfidenceSum = 0;

            for (const pattern of detectorPatterns) {
                detectorDetections += pattern.performance.detectionCount;
                detectorSuccesses += pattern.performance.successCount;
                detectorFailures += pattern.performance.failureCount;
                detectorConfidenceSum +=
                    pattern.performance.avgConfidence * pattern.performance.detectionCount;
            }

            this.database.detectorStats[detector] = {
                patternCount: detectorPatterns.length,
                successRate: detectorDetections > 0 ? detectorSuccesses / detectorDetections : 0,
                falsePositiveRate: detectorDetections > 0 ? detectorFailures / detectorDetections : 0,
                avgConfidence: detectorDetections > 0 ? detectorConfidenceSum / detectorDetections : 0,
            };
        }
    }

    /**
     * Query patterns by criteria
     */
    queryPatterns(query: PatternQuery): LearnedPattern[] {
        let results = Object.values(this.database.patterns);

        // Apply filters
        if (query.detector) {
            results = results.filter((p) => p.signature.detector === query.detector);
        }

        if (query.patternType) {
            results = results.filter((p) => p.signature.patternType === query.patternType);
        }

        if (query.filePath) {
            results = results.filter((p) => p.signature.filePath.includes(query.filePath!));
        }

        if (query.framework) {
            results = results.filter((p) => p.context.framework === query.framework);
        }

        if (query.minSuccessRate !== undefined) {
            results = results.filter((p) => p.performance.successRate >= query.minSuccessRate!);
        }

        if (query.maxFalsePositiveRate !== undefined) {
            results = results.filter((p) => p.performance.falsePositiveRate <= query.maxFalsePositiveRate!);
        }

        if (query.activeOnly) {
            results = results.filter((p) => p.active && !p.skipInFuture);
        }

        // Sort results
        if (query.sortBy) {
            results.sort((a, b) => {
                let aVal: number, bVal: number;

                switch (query.sortBy) {
                    case 'successRate':
                        aVal = a.performance.successRate;
                        bVal = b.performance.successRate;
                        break;
                    case 'detectionCount':
                        aVal = a.performance.detectionCount;
                        bVal = b.performance.detectionCount;
                        break;
                    case 'confidence':
                        aVal = a.performance.avgConfidence;
                        bVal = b.performance.avgConfidence;
                        break;
                    case 'lastSeen':
                        aVal = new Date(a.lastSeen).getTime();
                        bVal = new Date(b.lastSeen).getTime();
                        break;
                    default:
                        return 0;
                }

                return query.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
            });
        }

        // Limit results
        if (query.limit) {
            results = results.slice(0, query.limit);
        }

        return results;
    }

    /**
     * Update pattern with new data
     */
    updatePattern(update: PatternUpdate): void {
        const pattern = this.database.patterns[update.patternId];
        if (!pattern) {
            console.warn(`[PatternMemory] Cannot update: pattern not found`);
            return;
        }

        if (update.recordDetection) {
            pattern.performance.detectionCount++;
            pattern.lastSeen = new Date().toISOString();
        }

        if (update.recordSuccess) {
            pattern.performance.successCount++;
        }

        if (update.recordFailure) {
            pattern.performance.failureCount++;
        }

        if (update.addCorrection) {
            pattern.corrections.push(update.addCorrection);
            this.database.globalStats.totalCorrections++;
        }

        if (update.updateFix) {
            pattern.suggestedFix = update.updateFix;
        }

        if (update.deprecate) {
            pattern.active = false;
            this.database.globalStats.activePatterns--;
            this.database.globalStats.deprecatedPatterns++;
        }

        if (update.skipInFuture !== undefined) {
            pattern.skipInFuture = update.skipInFuture;
        }

        if (update.notes) {
            pattern.notes = update.notes;
        }

        this.updatePerformanceMetrics(pattern);
        pattern.lastUpdated = new Date().toISOString();

        this.updateGlobalStats();
        this.dirty = true;
        this.saveDatabase();
    }

    /**
     * Get detector-level statistics
     */
    getDetectorStats(detector: string) {
        return this.database.detectorStats[detector] || null;
    }

    /**
     * Get global statistics
     */
    getGlobalStats() {
        return this.database.globalStats;
    }

    /**
     * Get database snapshot (for inspection/debugging)
     */
    getDatabaseSnapshot(): PatternDatabase {
        // Phase 3B: Use structuredClone() for database export
        return structuredClone(this.database);
    }

    /**
     * Force save database
     */
    flush(): void {
        this.dirty = true;
        this.saveDatabase();
    }

    /**
     * Clean up deprecated patterns (run periodically)
     */
    cleanupDeprecatedPatterns(): number {
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - this.config.deprecateAfterDays * 24 * 60 * 60 * 1000);

        let removedCount = 0;
        for (const [patternId, pattern] of Object.entries(this.database.patterns)) {
            const lastSeen = new Date(pattern.lastSeen);
            if (!pattern.active && lastSeen < cutoffDate) {
                delete this.database.patterns[patternId];
                removedCount++;
            }
        }

        if (removedCount > 0) {
            this.updateGlobalStats();
            this.dirty = true;
            this.saveDatabase();
        }

        return removedCount;
    }
}

/**
 * Global singleton instance (optional - can create multiple instances)
 */
let globalInstance: PatternMemory | null = null;

export function getPatternMemory(config?: Partial<LearningConfig>): PatternMemory {
    if (!globalInstance) {
        globalInstance = new PatternMemory(config);
    }
    return globalInstance;
}

export function resetPatternMemory(): void {
    globalInstance = null;
}
