"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoricalAccuracy = exports.StructureScore = exports.ContextScore = exports.PatternStrength = void 0;
exports.calculateConfidence = calculateConfidence;
exports.calculateAdaptiveConfidence = calculateAdaptiveConfidence;
exports.calculateConfidenceWithLearning = calculateAdaptiveConfidence;
exports.recordDetectionOutcome = recordDetectionOutcome;
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
function calculateConfidence(factors) {
    // Normalize all factors to 0-100 range
    const normalizedPattern = clamp(factors.patternMatchStrength, 0, 100);
    const normalizedContext = clamp(factors.contextAppropriate, 0, 100);
    const normalizedStructure = clamp(factors.codeStructure, 0, 100);
    const normalizedHistorical = clamp(factors.historicalAccuracy ?? 75, 0, 100); // Default to 75% if no history
    // Calculate weighted components
    const patternComponent = (normalizedPattern * 0.40);
    const contextComponent = (normalizedContext * 0.30);
    const structureComponent = (normalizedStructure * 0.20);
    const historicalComponent = (normalizedHistorical * 0.10);
    // Final score
    const finalScore = Math.round(patternComponent + contextComponent + structureComponent + historicalComponent);
    // Determine confidence level
    const level = getConfidenceLevel(finalScore);
    // Generate explanation
    const explanation = generateExplanation(factors, finalScore);
    return {
        score: finalScore,
        level,
        breakdown: {
            patternMatch: Math.round(patternComponent),
            context: Math.round(contextComponent),
            structure: Math.round(structureComponent),
            historical: Math.round(historicalComponent)
        },
        explanation
    };
}
/**
 * Get confidence level from score
 */
function getConfidenceLevel(score) {
    if (score >= 90)
        return 'very-high';
    if (score >= 75)
        return 'high';
    if (score >= 50)
        return 'medium';
    if (score >= 30)
        return 'low';
    return 'very-low';
}
/**
 * Generate human-readable explanation
 */
function generateExplanation(factors, finalScore) {
    const parts = [];
    // Pattern strength
    if (factors.patternMatchStrength >= 90) {
        parts.push('exact pattern match');
    }
    else if (factors.patternMatchStrength >= 70) {
        parts.push('strong pattern match');
    }
    else if (factors.patternMatchStrength >= 50) {
        parts.push('moderate pattern match');
    }
    else {
        parts.push('weak pattern match');
    }
    // Context
    if (factors.contextAppropriate >= 80) {
        parts.push('highly appropriate context');
    }
    else if (factors.contextAppropriate >= 60) {
        parts.push('appropriate context');
    }
    else if (factors.contextAppropriate >= 40) {
        parts.push('somewhat appropriate context');
    }
    else {
        parts.push('questionable context');
    }
    // Structure
    if (factors.codeStructure >= 70) {
        parts.push('good code structure');
    }
    else if (factors.codeStructure >= 50) {
        parts.push('acceptable structure');
    }
    else {
        parts.push('poor code structure');
    }
    // Historical accuracy (if available)
    if (factors.historicalAccuracy !== undefined) {
        if (factors.historicalAccuracy >= 85) {
            parts.push('excellent historical accuracy');
        }
        else if (factors.historicalAccuracy >= 70) {
            parts.push('good historical accuracy');
        }
        else if (factors.historicalAccuracy >= 50) {
            parts.push('moderate historical accuracy');
        }
        else {
            parts.push('low historical accuracy');
        }
    }
    return `${finalScore}% confidence: ${parts.join(', ')}`;
}
/**
 * Clamp value between min and max
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
/**
 * Pattern match strength calculators for common scenarios
 */
exports.PatternStrength = {
    /**
     * Exact string match
     */
    exact() {
        return 100;
    },
    /**
     * Regex match with high specificity
     */
    strongRegex() {
        return 90;
    },
    /**
     * Regex match with moderate specificity
     */
    moderateRegex() {
        return 70;
    },
    /**
     * Weak pattern (substring, partial match)
     */
    weak() {
        return 50;
    },
    /**
     * Variable name match (heuristic)
     */
    variableName(name, sensitiveKeywords) {
        const nameLower = name.toLowerCase();
        const exactMatch = sensitiveKeywords.some(kw => nameLower === kw.toLowerCase());
        const partialMatch = sensitiveKeywords.some(kw => nameLower.includes(kw.toLowerCase()));
        if (exactMatch)
            return 100;
        if (partialMatch)
            return 70;
        return 30;
    }
};
/**
 * Context appropriateness calculators
 */
exports.ContextScore = {
    /**
     * API route context (high severity for blocking ops)
     */
    apiRoute() {
        return 95;
    },
    /**
     * Server context (high severity)
     */
    server() {
        return 90;
    },
    /**
     * Component/UI context (medium severity)
     */
    component() {
        return 70;
    },
    /**
     * Test file (low severity, often acceptable)
     */
    testFile() {
        return 30;
    },
    /**
     * Build script (very low severity, sync ops expected)
     */
    buildScript() {
        return 20;
    },
    /**
     * CLI script (low severity, sync ops acceptable)
     */
    cliScript() {
        return 25;
    },
    /**
     * Configuration file (very low severity)
     */
    config() {
        return 15;
    }
};
/**
 * Code structure analysis
 */
exports.StructureScore = {
    /**
     * Has proper error handling
     */
    hasErrorHandling(code) {
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
    hasCleanup(code) {
        const patterns = [
            /finally\s*\{/,
            /\.finally\s*\(/,
            /return\s*\(\s*\)\s*=>\s*\{/ // React cleanup
        ];
        const hasAny = patterns.some(p => p.test(code));
        return hasAny ? 40 : 0;
    },
    /**
     * Has TypeScript type annotations
     */
    hasTypeAnnotations(code) {
        const hasTypes = /:\s*\w+(\[\]|\<.*?\>)?/.test(code);
        return hasTypes ? 20 : 0;
    },
    /**
     * Has documentation comments
     */
    hasDocumentation(code) {
        const hasJSDoc = /\/\*\*[\s\S]*?\*\//.test(code);
        return hasJSDoc ? 10 : 0;
    },
    /**
     * Calculate total structure score
     */
    calculate(code) {
        return Math.min(100, this.hasErrorHandling(code) +
            this.hasCleanup(code) +
            this.hasTypeAnnotations(code) +
            this.hasDocumentation(code));
    }
};
/**
 * Historical accuracy tracker (Phase 3 will implement full learning)
 * For now, returns defaults based on detector type
 */
exports.HistoricalAccuracy = {
    /**
     * Get default accuracy for detector type
     */
    getDefault(detectorType) {
        const defaults = {
            database: 85, // Enhanced DB detector is quite accurate
            security: 75, // Security can have false positives
            performance: 70, // Performance depends heavily on context
            runtime: 65 // Runtime errors are harder to predict
        };
        return defaults[detectorType] ?? 70;
    }
};
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
async function calculateAdaptiveConfidence(baseFactors, signature) {
    // Try to load pattern memory (lazy load to avoid circular dependencies)
    let adjustedFactors = { ...baseFactors };
    try {
        // Dynamic import to avoid circular dependency
        const { getPatternMemory } = await Promise.resolve().then(() => __importStar(require('../learning/pattern-memory.js')));
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
            level: baseScore.level, // Reuse level from base score
            breakdown: baseScore.breakdown,
            explanation: baseScore.explanation + learningNote
        };
    }
    catch (error) {
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
async function recordDetectionOutcome(signature, wasCorrect, confidence, context) {
    try {
        const { getPatternMemory } = await Promise.resolve().then(() => __importStar(require('../learning/pattern-memory.js')));
        const memory = getPatternMemory();
        if (wasCorrect) {
            memory.recordSuccess(signature, confidence, context ?? {
                framework: undefined,
                fileContext: 'unknown',
                codeContext: [],
                imports: [],
            });
        }
        else {
            memory.recordFailure(signature, confidence, context ?? {
                framework: undefined,
                fileContext: 'unknown',
                codeContext: [],
                imports: [],
            });
        }
        memory.flush();
    }
    catch (error) {
        console.debug('[AdaptiveConfidence] Failed to record outcome:', error);
    }
}
//# sourceMappingURL=confidence-scoring.js.map