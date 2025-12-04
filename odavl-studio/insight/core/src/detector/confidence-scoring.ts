/**
 * Phase 2.2: Standardized Confidence Scoring System
 * 
 * Unified confidence scoring formula for all ODAVL Insight detectors.
 * Provides consistent 0-100% confidence scores based on multiple factors.
 * 
 * Formula Breakdown:
 * - Pattern Match Strength: 40%
 * - Context Appropriateness: 30%
 * - Code Structure Analysis: 20%
 * - Historical Accuracy: 10%
 * 
 * @author ODAVL Team
 * @version 2.0.0 (Phase 2)
 */

/**
 * Factors that contribute to confidence score
 */
export interface ConfidenceFactors {
    /**
     * How well the code matches the detection pattern
     * 0 = weak match, 100 = exact match
     */
    patternMatchStrength: number;

    /**
     * How appropriate this issue is for the current context
     * 0 = wrong context, 100 = perfect context
     * Examples: sync ops in scripts (low severity) vs servers (high severity)
     */
    contextAppropriate: number;

    /**
     * Code structure quality indicators
     * 0 = poor structure, 100 = excellent structure
     * Examples: proper error handling, cleanup patterns, type safety
     */
    codeStructure: number;

    /**
     * Historical accuracy from past detections
     * 0 = frequently false positive, 100 = always correct
     * Based on user feedback and corrections
     */
    historicalAccuracy?: number;
}

/**
 * Confidence score result with breakdown
 */
export interface ConfidenceScore {
    /**
     * Final confidence score (0-100)
     */
    score: number;

    /**
     * Confidence level label
     */
    level: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';

    /**
     * Breakdown of score components
     */
    breakdown: {
        patternMatch: number;      // 40% weight
        context: number;           // 30% weight
        structure: number;         // 20% weight
        historical: number;        // 10% weight
    };

    /**
     * Explanation of confidence score
     */
    explanation: string;
}

/**
 * Calculate standardized confidence score
 * 
 * @param factors - Input factors for confidence calculation
 * @returns Confidence score with breakdown and explanation
 * 
 * @example
 * ```typescript
 * const score = calculateConfidence({
 *   patternMatchStrength: 90,  // Strong regex match
 *   contextAppropriate: 80,     // API route context (high severity)
 *   codeStructure: 70,          // Has error handler but no cleanup
 *   historicalAccuracy: 85      // 85% correct in past
 * });
 * // Result: { score: 82, level: 'high', ... }
 * ```
 */
export function calculateConfidence(factors: ConfidenceFactors): ConfidenceScore {
    // Normalize all factors to 0-100 range
    const normalizedPattern = clamp(factors.patternMatchStrength, 0, 100);
    const normalizedContext = clamp(factors.contextAppropriate, 0, 100);
    const normalizedStructure = clamp(factors.codeStructure, 0, 100);
    const normalizedHistorical = clamp(factors.historicalAccuracy ?? 75, 0, 100); // Default 75% (neutral)

    // IMPROVED WEIGHTS: Reduce pattern match weight, increase context weight
    // Pattern match alone doesn't mean real issue - context matters more!
    const patternWeight = 0.30;      // Reduced from 40% to 30%
    const contextWeight = 0.40;      // Increased from 30% to 40%
    const structureWeight = 0.20;    // Keep at 20%
    const historicalWeight = 0.10;   // Keep at 10%

    // Calculate weighted score
    const patternScore = normalizedPattern * patternWeight;
    const contextScore = normalizedContext * contextWeight;
    const structureScore = normalizedStructure * structureWeight;
    const historicalScore = normalizedHistorical * historicalWeight;

    const finalScore = Math.round(patternScore + contextScore + structureScore + historicalScore);

    // Determine confidence level with stricter thresholds
    let level: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
    if (finalScore >= 85) level = 'very-high';      // Increased from 80
    else if (finalScore >= 70) level = 'high';      // Increased from 65
    else if (finalScore >= 50) level = 'medium';    // Keep at 50
    else if (finalScore >= 30) level = 'low';       // Keep at 30
    else level = 'very-low';

    // Generate explanation with context emphasis
    const explanation = generateExplanation2(finalScore, level, {
        patternMatch: normalizedPattern,
        context: normalizedContext,
        structure: normalizedStructure,
        historical: normalizedHistorical,
    });

    return {
        score: finalScore,
        level,
        breakdown: {
            patternMatch: Math.round(patternScore),
            context: Math.round(contextScore),
            structure: Math.round(structureScore),
            historical: Math.round(historicalScore)
        },
        explanation
    };
}

/**
 * Get confidence level from score
 */
function getConfidenceLevel(score: number): ConfidenceScore['level'] {
    if (score >= 90) return 'very-high';
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    if (score >= 30) return 'low';
    return 'very-low';
}

/**
 * Generate human-readable explanation (enhanced version)
 */
function generateExplanation2(
    score: number,
    level: ConfidenceScore['level'],
    breakdown: { patternMatch: number; context: number; structure: number; historical: number }
): string {
    const parts: string[] = [];

    // Pattern strength
    if (breakdown.patternMatch >= 90) {
        parts.push('exact pattern match');
    } else if (breakdown.patternMatch >= 70) {
        parts.push('strong pattern match');
    } else if (breakdown.patternMatch >= 50) {
        parts.push('moderate pattern match');
    } else {
        parts.push('weak pattern match');
    }

    // Context (more important now)
    if (breakdown.context >= 80) {
        parts.push('highly appropriate context');
    } else if (breakdown.context >= 60) {
        parts.push('appropriate context');
    } else if (breakdown.context >= 40) {
        parts.push('questionable context');
    } else {
        parts.push('wrong context - likely false positive');
    }

    // Structure
    if (breakdown.structure >= 70) {
        parts.push('good code structure');
    } else if (breakdown.structure >= 50) {
        parts.push('acceptable structure');
    } else {
        parts.push('poor structure');
    }

    return `${score}% ${level}: ${parts.join(', ')}`;
}

/**
 * Generate human-readable explanation
 */
function generateExplanation(factors: ConfidenceFactors, finalScore: number): string {
    const parts: string[] = [];

    // Pattern strength
    if (factors.patternMatchStrength >= 90) {
        parts.push('exact pattern match');
    } else if (factors.patternMatchStrength >= 70) {
        parts.push('strong pattern match');
    } else if (factors.patternMatchStrength >= 50) {
        parts.push('moderate pattern match');
    } else {
        parts.push('weak pattern match');
    }

    // Context
    if (factors.contextAppropriate >= 80) {
        parts.push('highly appropriate context');
    } else if (factors.contextAppropriate >= 60) {
        parts.push('appropriate context');
    } else if (factors.contextAppropriate >= 40) {
        parts.push('somewhat appropriate context');
    } else {
        parts.push('questionable context');
    }

    // Structure
    if (factors.codeStructure >= 70) {
        parts.push('good code structure');
    } else if (factors.codeStructure >= 50) {
        parts.push('acceptable structure');
    } else {
        parts.push('poor code structure');
    }

    // Historical accuracy (if available)
    if (factors.historicalAccuracy !== undefined) {
        if (factors.historicalAccuracy >= 85) {
            parts.push('excellent historical accuracy');
        } else if (factors.historicalAccuracy >= 70) {
            parts.push('good historical accuracy');
        } else if (factors.historicalAccuracy >= 50) {
            parts.push('moderate historical accuracy');
        } else {
            parts.push('low historical accuracy');
        }
    }

    return `${finalScore}% confidence: ${parts.join(', ')}`;
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Pattern match strength calculators for common scenarios
 */
export const PatternStrength = {
    /**
     * Exact string match
     */
    exact(): number {
        return 100;
    },

    /**
     * Regex match with high specificity
     */
    strongRegex(): number {
        return 90;
    },

    /**
     * Regex match with moderate specificity
     */
    moderateRegex(): number {
        return 70;
    },

    /**
     * Weak pattern (substring, partial match)
     */
    weak(): number {
        return 50;
    },

    /**
     * Variable name match (heuristic)
     */
    variableName(name: string, sensitiveKeywords: string[]): number {
        const nameLower = name.toLowerCase();
        const exactMatch = sensitiveKeywords.some(kw => nameLower === kw.toLowerCase());
        const partialMatch = sensitiveKeywords.some(kw => nameLower.includes(kw.toLowerCase()));

        if (exactMatch) return 100;
        if (partialMatch) return 70;
        return 30;
    }
};

/**
 * Context appropriateness calculators
 */
export const ContextScore = {
    /**
     * API route context (high severity for blocking ops)
     */
    apiRoute(): number {
        return 95;
    },

    /**
     * Server context (high severity)
     */
    server(): number {
        return 90;
    },

    /**
     * Component/UI context (medium severity)
     */
    component(): number {
        return 70;
    },

    /**
     * Test file (low severity, often acceptable)
     */
    testFile(): number {
        return 30;
    },

    /**
     * Build script (very low severity, sync ops expected)
     */
    buildScript(): number {
        return 20;
    },

    /**
     * CLI script (low severity, sync ops acceptable)
     */
    cliScript(): number {
        return 25;
    },

    /**
     * Configuration file (very low severity)
     */
    config(): number {
        return 15;
    }
};

/**
 * Code structure analysis
 */
export const StructureScore = {
    /**
     * Has proper error handling
     */
    hasErrorHandling(code: string): number {
        const patterns = [
            /try\s*\{[\s\S]*?\}\s*catch/,
            /\.catch\s*\(/,
            /\.on\s*\(\s*['"]error['"]/
        ];

        const hasAny = patterns.some(p => p.test(code));
        return hasAny ? 30 : 0;
    },

    /**
     * Has cleanup/finally block
     */
    hasCleanup(code: string): number {
        const patterns = [
            /finally\s*\{/,
            /\.finally\s*\(/,
            /return\s*\(\s*\)\s*=>\s*\{/  // React cleanup
        ];

        const hasAny = patterns.some(p => p.test(code));
        return hasAny ? 40 : 0;
    },

    /**
     * Has TypeScript type annotations
     */
    hasTypeAnnotations(code: string): number {
        const hasTypes = /:\s*\w+(\[\]|\<.*?\>)?/.test(code);
        return hasTypes ? 20 : 0;
    },

    /**
     * Has documentation comments
     */
    hasDocumentation(code: string): number {
        const hasJSDoc = /\/\*\*[\s\S]*?\*\//.test(code);
        return hasJSDoc ? 10 : 0;
    },

    /**
     * Calculate total structure score
     */
    calculate(code: string): number {
        return Math.min(100,
            this.hasErrorHandling(code) +
            this.hasCleanup(code) +
            this.hasTypeAnnotations(code) +
            this.hasDocumentation(code)
        );
    }
};

/**
 * Historical accuracy tracker (Phase 3 will implement full learning)
 * For now, returns defaults based on detector type
 */
export const HistoricalAccuracy = {
    /**
     * Get default accuracy for detector type
     */
    getDefault(detectorType: 'database' | 'security' | 'performance' | 'runtime'): number {
        const defaults = {
            database: 85,      // Enhanced DB detector is quite accurate
            security: 75,      // Security can have false positives
            performance: 70,   // Performance depends heavily on context
            runtime: 65        // Runtime errors are harder to predict
        };

        return defaults[detectorType] ?? 70;
    }
};

/**
 * Phase 3.1.4: Adaptive Confidence with Pattern Learning
 * Adjusts confidence scores based on historical pattern performance
 * 
 * @module confidence-scoring/adaptive
 * @version 3.0.0
 */

import type { PatternSignature } from '../learning/pattern-learning-schema.js';

/**
 * Calculate confidence with adaptive learning adjustment
 * 
 * This extends the base confidence calculation by incorporating
 * real-world pattern performance from the Pattern Memory database.
 * 
 * @param baseFactors - Standard confidence factors
 * @param signature - Pattern signature for historical lookup
 * @returns Enhanced confidence score with learning adjustment
 * 
 * @example
 * ```typescript
 * const signature: PatternSignature = {
 *   detector: 'enhanced-db',
 *   patternType: 'connection-leak',
 *   signatureHash: '',
 *   filePath: '/src/api/users.ts',
 *   line: 42
 * };
 * 
 * const score = await calculateAdaptiveConfidence({
 *   patternMatchStrength: 90,
 *   contextAppropriate: 85,
 *   codeStructure: 70,
 *   historicalAccuracy: 75
 * }, signature);
 * 
 * // If pattern has 95% success rate in database, score will be boosted
 * // If pattern has 40% success rate, score will be reduced
 * ```
 */
export async function calculateAdaptiveConfidence(
    baseFactors: ConfidenceFactors,
    signature: PatternSignature
): Promise<ConfidenceScore> {
    // Try to load pattern memory (lazy load to avoid circular dependencies)
    let adjustedFactors = { ...baseFactors };

    try {
        // Dynamic import to avoid circular dependency
        const { getPatternMemory } = await import('../learning/pattern-memory.js');
        const memory = getPatternMemory();

        // Get historical accuracy from learned patterns
        const patternAccuracy = memory.getPatternAccuracy(signature);

        // Override historical accuracy with real data
        if (patternAccuracy > 0) {
            adjustedFactors.historicalAccuracy = patternAccuracy * 100; // Convert 0-1 to 0-100
        }

        // Calculate base score
        const baseScore = calculateConfidence(adjustedFactors);

        // Apply adaptive adjustment from pattern memory
        const adjustedScore = memory.adjustConfidence(signature, baseScore.score);

        // Build learning note if score was adjusted
        let learningNote = '';
        if (adjustedScore !== baseScore.score) {
            const adjustmentSign = adjustedScore > baseScore.score ? '+' : '';
            const adjustmentAmount = (adjustedScore - baseScore.score).toFixed(0);
            const accuracyPercent = Math.round(patternAccuracy * 100);
            learningNote = ` (adjusted ${adjustmentSign}${adjustmentAmount}% based on ${accuracyPercent}% historical accuracy)`;
        }

        return {
            score: Math.round(adjustedScore),
            level: baseScore.level,  // Reuse level from base score
            breakdown: baseScore.breakdown,
            explanation: baseScore.explanation + learningNote
        };

    } catch (error: unknown) {
        // If pattern memory not available, fall back to base calculation
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.debug(`[AdaptiveConfidence] Pattern memory not available: ${errorMsg}, using base confidence`);
        return calculateConfidence(adjustedFactors);
    }
}

/**
 * Record detection outcome for learning
 * 
 * Call this after user confirms or rejects an issue to
 * feed data back into the Pattern Memory system.
 * 
 * @param signature - Pattern signature
 * @param wasCorrect - Was the detection a true positive?
 * @param confidence - Confidence score at detection time
 * 
 * @example
 * ```typescript
 * // User confirmed this was a real connection leak
 * await recordDetectionOutcome(signature, true, 87);
 * 
 * // User marked this as false positive
 * await recordDetectionOutcome(signature, false, 65);
 * ```
 */
export async function recordDetectionOutcome(
    signature: PatternSignature,
    wasCorrect: boolean,
    confidence: number,
    context?: { framework?: string; fileContext?: string; codeContext?: string[]; imports?: string[] }
): Promise<void> {
    try {
        const { getPatternMemory } = await import('../learning/pattern-memory.js');
        const memory = getPatternMemory();

        const safeContext = {
            framework: context?.framework || '',
            fileContext: context?.fileContext || 'unknown',
            codeContext: context?.codeContext || [],
            imports: context?.imports || [],
        };

        if (wasCorrect) {
            memory.recordSuccess(signature, confidence, safeContext);
        } else {
            memory.recordFailure(signature, confidence, safeContext);
        }

        memory.flush();
    } catch (error) {
        console.debug('[AdaptiveConfidence] Failed to record outcome:', error);
    }
}

/**
 * Export adaptive confidence as default for Phase 3+
 * Detectors should migrate to use calculateAdaptiveConfidence
 * for best results with learning system.
 */
export { calculateAdaptiveConfidence as calculateConfidenceWithLearning };

