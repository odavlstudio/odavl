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

// ML System V2 - Neural Network Trust Scoring
export { MLTrustPredictor, extractFeatures } from './ml-trust-predictor.js';
export type { MLFeatures, MLPrediction, TrainingData } from './ml-trust-predictor.js';

// GitHub Data Mining for ML Training
export { GitHubAPIClient } from './github-api-client.js';
export type { 
    GitHubSearchOptions, 
    GitHubRepository, 
    GitHubCommit, 
    CommitDiff 
} from './github-api-client.js';

// Data Collection Orchestration
export { GitHubDataMiner } from './data-collection.js';
export type { 
    GitHubFixSample, 
    DataCollectionProgress 
} from './data-collection.js';

// Recipe ML Integration
export { MLRecipeManager, createMLRecipeManager } from './ml-recipe-integration.js';
export type { 
    Recipe, 
    RecipeWithMLScore, 
    RecipeFeedback 
} from './ml-recipe-integration.js';
