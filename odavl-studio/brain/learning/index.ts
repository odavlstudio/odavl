/**
 * ODAVL Brain - Learning Module
 * 
 * Phase P9: Machine Learning & Predictive Intelligence
 * Phase P10: Advanced ML Upgrade (LSTM + Compression + Ensemble)
 * Phase P11: Multi-Task Learning + Bayesian + Federated History
 * Phase P12: Fusion Engine & Self-Calibrating AI
 * 
 * Provides:
 * - TensorFlow.js neural network for deployment success prediction
 * - LSTM time-series trend analysis (Phase P10)
 * - Multi-Task Learning with 4 prediction heads (Phase P11)
 * - Bayesian uncertainty estimation with Monte Carlo Dropout (Phase P11)
 * - Distributed history sync for federated learning (Phase P11)
 * - Ensemble v2 prediction combining 5 models (Phase P11)
 * - Fusion Engine with dynamic weight learning (Phase P12)
 * - Self-calibrating AI with meta-learning (Phase P12)
 * - Training data storage with gzip compression (Phase P10)
 * - ML-enhanced confidence adjustment
 * - Heuristic fallback predictors
 * 
 * Architecture:
 * - NN: Input(8) → Dense(16,relu) → Dense(8,relu) → Dropout(0.2) → Dense(1,sigmoid)
 * - LSTM: Input(20,4) → LSTM(32) → Dense(16,relu) → Dense(1,sigmoid)
 * - MTL: Shared(32→16→dropout) + 4 heads (success, performance, security, downtime)
 * - Ensemble v2: NN 30%, LSTM 20%, MTL 30%, Heuristic 20% + Bayesian adjustment
 * - Fusion (P12): Adaptive weights learned from deployment outcomes
 * 
 * Storage:
 * - NN Model: .odavl/ml-models/brain-deployment-predictor/
 * - LSTM Model: .odavl/ml-models/brain-lstm-trend/
 * - MTL Model: .odavl/ml-models/brain-mtl/
 * - Fusion Weights: .odavl/brain-history/fusion-weights.json (Phase P12)
 * - Training data: .odavl/brain-history/training-<timestamp>.json[.gz]
 * 
 * Confidence Adjustment:
 * - High failure risk (>0.70) → reduce confidence by 20%
 * - Medium risk (0.40-0.70) → no adjustment
 * - Low failure risk (<0.40) → boost confidence by 10%
 * - Bayesian high variance (>0.05) → +15% risk penalty
 * - Bayesian low variance (<0.02) → -5% risk bonus
 * - Self-calibration (P12): 60% ensemble v2 + 40% fusion score
 */

// Neural Network (Phase P9)
export { BrainMLModel } from './learning-model.js';
export type {
  TrainingSample,
  TrainingMetrics,
  ModelConfig,
} from './learning-model.js';

// LSTM Time-Series Model (Phase P10)
export { BrainLSTMModel } from './learning-model.js';
export type { LSTMSample } from './learning-model.js';

// Multi-Task Learning Model (Phase P11)
export { BrainMTLModel } from './learning-model.js';
export type { MTLSample, MTLPrediction } from './learning-model.js';

// Training Data Storage
export { BrainHistoryStore } from './history-store.js';
export type {
  StoredTrainingSample,
  RollingWindowStats,
} from './history-store.js';

// Predictors & Confidence Adjustment
export {
  buildInputVector,
  predictDeploymentRisk,
  predictFailureProbability,
  predictEnhancedConfidence,
  calculateModelConfidence,
  predictFailureProbabilityEnsemble, // Phase P10: Ensemble v1
  predictWithUncertainty, // Phase P11: Bayesian uncertainty
  predictFailureProbabilityEnsembleV2, // Phase P11: Ensemble v2
} from './predictors.js';

// Ensemble Prediction (Phase P10)
export type { EnsemblePrediction } from './predictors.js';

// Bayesian & Ensemble v2 (Phase P11)
export type { 
  BayesianPrediction,
  EnsembleV2Prediction,
} from './predictors.js';
export type {
  MLInputVector,
  MLPrediction,
  EnhancedConfidence,
} from './predictors.js';

// ============================================================================
// Phase P12: Fusion Engine & Self-Calibrating AI
// ============================================================================

// Fusion Engine
export { FusionEngine } from '../fusion/fusion-engine.js';
export type {
  FusionInput,
  FusionWeights,
  FusionResult,
} from '../fusion/fusion-engine.js';

// Global Learning Signals
export { computeLearningSignals } from './global-learning-signals.js';
export type { GlobalLearningSignals } from './global-learning-signals.js';

// Meta-Learning Engine
export { computeMetaLearningDecision } from './meta-learning-engine.js';
export type { MetaLearningDecision } from './meta-learning-engine.js';

// Telemetry (re-exported for CLI convenience)
export type { AggregatedTelemetry } from '../telemetry/telemetry-aggregator.js';
export { loadAllTelemetry, aggregateTelemetry } from '../telemetry/telemetry-aggregator.js';

// Autopilot Telemetry
export { readAutopilotTelemetry } from '../telemetry/autopilot-telemetry.js';
export type { AutopilotTelemetryEvent } from '../telemetry/autopilot-telemetry.js';

// Recipe Trust Manager
export { updateRecipeTrustFromTelemetry } from '../history/recipe-trust-manager.js';

// Adaptive Brain
export { evolveAdaptiveBrainState } from '../adaptive/adaptive-brain.js';
export type { AdaptiveBrainState } from '../adaptive/adaptive-brain.js';

// Meta-Learning (updateFusionWeights method added to BrainHistoryStore)
// Self-Calibration (integrated into computeDeploymentConfidence in runtime module)

