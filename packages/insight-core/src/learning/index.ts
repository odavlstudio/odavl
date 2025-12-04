/**
 * Pattern Learning System - Public API
 * @module learning
 * @version 3.0.0
 */

export * from './pattern-learning-schema.js';
export * from './pattern-memory.js';
export { getPatternMemory, resetPatternMemory, PatternMemory } from './pattern-memory.js';
export type {
    PatternSignature,
    PatternDatabase,
    LearnedPattern,
    PatternQuery,
    PatternUpdate,
    UserCorrection,
    SuggestedFix,
    LearningConfig,
    PatternContext,
    PatternPerformance,
} from './pattern-learning-schema.js';
