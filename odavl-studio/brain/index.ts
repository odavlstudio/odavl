/**
 * @odavl-studio/brain - Central brain module exports
 */

// Global Learning Signals (OMEGA-P7 Phase 2)
export { computeLearningSignals } from './learning/global-learning-signals.js';
export type { GlobalLearningSignals } from './learning/global-learning-signals.js';

// Meta-Learning Engine (OMEGA-P7 Phase 3)
export { computeMetaLearningDecision } from './learning/meta-learning-engine.js';
export type { MetaLearningDecision } from './learning/meta-learning-engine.js';

// Adaptive Brain Evolution (OMEGA-P8 Phase 1)
export { evolveAdaptiveBrainState } from './adaptive/adaptive-brain.js';
export type { AdaptiveBrainState } from './adaptive/adaptive-brain.js';
