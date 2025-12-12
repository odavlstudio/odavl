/**
 * ODAVL Brain - ML Predictors
 * Phase P9: Confidence adjustment using ML predictions
 * 
 * Builds input vectors and adjusts confidence scores
 * based on predicted failure probability
 */

import type { RiskClassification, TestImpact, BaselineStability } from '../runtime/runtime-deployment-confidence';

/**
 * Input vector for ML model (8 features)
 */
export interface MLInputVector {
  features: number[];
  featureNames: string[];
}

/**
 * ML prediction result
 */
export interface MLPrediction {
  failureProbability: number; // 0-1 (probability deployment will fail)
  confidence: number; // 0-1 (model's confidence in prediction)
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Enhanced confidence result
 */
export interface EnhancedConfidence {
  originalConfidence: number;
  adjustedConfidence: number;
  adjustmentReason: string;
  mlPrediction: MLPrediction;
}

/**
 * Build input vector from Brain analysis components
 */
export function buildInputVector({
  riskClassification,
  testImpact,
  baselineStability,
  omsFileRisk, // OMEGA-P5 Phase 4: OMS integration
}: {
  riskClassification: RiskClassification;
  testImpact: TestImpact;
  baselineStability: BaselineStability;
  omsFileRisk?: { avgRisk: number; criticalFileCount: number; typeComposition: number[] };
}): MLInputVector {
  const features = [
    // Feature 1: Risk weight (0.1-0.4)
    riskClassification.riskWeight,
    
    // Feature 2: Test impact score (0-100, normalized to 0-1)
    testImpact.score / 100,
    
    // Feature 3: Baseline stability score (0-100, normalized to 0-1)
    baselineStability.stabilityScore / 100,
    
    // Feature 4: Volatility (0-1)
    baselineStability.volatility,
    
    // Feature 5: Critical failures count (normalized by dividing by 10)
    Math.min(testImpact.criticalFailures / 10, 1),
    
    // Feature 6: High failures count (normalized by dividing by 10)
    Math.min(testImpact.highFailures / 10, 1),
    
    // Feature 7: Regression count (normalized by dividing by 5)
    Math.min(baselineStability.regressionCount / 5, 1),
    
    // Feature 8: Improvement count (normalized by dividing by 5)
    Math.min(baselineStability.improvementCount / 5, 1),
    
    // OMEGA-P5 Phase 4: OMS features (9-11)
    omsFileRisk?.avgRisk ?? 0.5, // Feature 9: Average file risk
    omsFileRisk?.criticalFileCount ?? 0, // Feature 10: Critical file count
    ...(omsFileRisk?.typeComposition ?? new Array(20).fill(0)), // Features 11-30: Type composition (20-dim)
  ];

  const featureNames = [
    'riskWeight',
    'testImpact',
    'baselineStability',
    'volatility',
    'criticalFailures',
    'highFailures',
    'regressionCount',
    'improvementCount',
    'omsAvgRisk', // OMEGA-P5 Phase 4
    'omsCriticalFileCount', // OMEGA-P5 Phase 4
    ...Array.from({ length: 20 }, (_, i) => `omsTypeComp${i}`), // OMEGA-P5 Phase 4
  ];

  return { features, featureNames };
}

/**
 * Predict deployment risk level based on input vector
 */
export function predictDeploymentRisk(inputVector: MLInputVector): MLPrediction['riskLevel'] {
  const [riskWeight, testImpact, baselineStability, volatility, criticalFailures, highFailures] = inputVector.features;

  // Calculate composite risk score
  const riskScore = 
    (riskWeight * 0.3) +
    ((1 - testImpact) * 0.25) +
    ((1 - baselineStability) * 0.2) +
    (volatility * 0.15) +
    (criticalFailures * 0.05) +
    (highFailures * 0.05);

  // Classify risk level
  if (riskScore > 0.7) return 'critical';
  if (riskScore > 0.5) return 'high';
  if (riskScore > 0.3) return 'medium';
  return 'low';
}

/**
 * Predict failure probability using heuristic model (fallback if ML unavailable)
 */
export function predictFailureProbability(inputVector: MLInputVector): number {
  const [
    riskWeight,
    testImpact,
    baselineStability,
    volatility,
    criticalFailures,
    highFailures,
    regressionCount,
  ] = inputVector.features;

  // Heuristic failure probability calculation
  let failureProbability = 0;

  // Critical failures are strong indicators
  if (criticalFailures > 0.5) {
    failureProbability += 0.4;
  }

  // High failures
  if (highFailures > 0.5) {
    failureProbability += 0.25;
  }

  // Risk weight
  failureProbability += riskWeight * 0.15;

  // Test impact (inverted - low impact = higher failure risk)
  failureProbability += (1 - testImpact) * 0.1;

  // Baseline stability (inverted)
  failureProbability += (1 - baselineStability) * 0.05;

  // Volatility
  failureProbability += volatility * 0.03;

  // Regressions
  failureProbability += regressionCount * 0.02;

  // Ensure 0-1 range
  return Math.max(0, Math.min(1, failureProbability));
}

/**
 * Adjust confidence score based on ML prediction
 * 
 * Adjustment rules:
 * - failureProbability > 0.70 → lower confidence by 20%
 * - failureProbability 0.40-0.70 → no change
 * - failureProbability < 0.40 → boost confidence by 10%
 */
export function predictEnhancedConfidence({
  confidence,
  predictionProbability,
  modelConfidence = 0.8,
}: {
  confidence: number;
  predictionProbability: number;
  modelConfidence?: number;
}): EnhancedConfidence {
  const failureProbability = predictionProbability;
  let adjustedConfidence = confidence;
  let adjustmentReason = 'No ML adjustment';

  // High failure risk → reduce confidence
  if (failureProbability > 0.70) {
    const reduction = confidence * 0.20; // 20% reduction
    adjustedConfidence = Math.max(0, confidence - reduction);
    adjustmentReason = `ML predicts high failure risk (${(failureProbability * 100).toFixed(1)}%), reduced confidence by 20%`;
  }
  // Medium failure risk → no change
  else if (failureProbability >= 0.40) {
    adjustedConfidence = confidence;
    adjustmentReason = `ML predicts moderate risk (${(failureProbability * 100).toFixed(1)}%), no adjustment`;
  }
  // Low failure risk → boost confidence
  else {
    const boost = confidence * 0.10; // 10% boost
    adjustedConfidence = Math.min(100, confidence + boost);
    adjustmentReason = `ML predicts low failure risk (${(failureProbability * 100).toFixed(1)}%), boosted confidence by 10%`;
  }

  const riskLevel = predictDeploymentRisk({ 
    features: [failureProbability, 0, 0, 0, 0, 0, 0, 0], 
    featureNames: [] 
  });

  return {
    originalConfidence: confidence,
    adjustedConfidence,
    adjustmentReason,
    mlPrediction: {
      failureProbability,
      confidence: modelConfidence,
      riskLevel,
    },
  };
}

/**
 * Build ML prediction with confidence level
 */
export function buildMLPrediction(
  failureProbability: number,
  modelConfidence: number,
  inputVector: MLInputVector
): MLPrediction {
  const riskLevel = predictDeploymentRisk(inputVector);

  return {
    failureProbability,
    confidence: modelConfidence,
    riskLevel,
  };
}

/**
 * Calculate model confidence based on training metrics
 */
export function calculateModelConfidence(trainingMetrics: {
  accuracy: number;
  loss: number;
  sampleSize: number;
}): number {
  const { accuracy, loss, sampleSize } = trainingMetrics;

  // Base confidence from accuracy
  let confidence = accuracy;

  // Penalize high loss
  if (loss > 0.5) {
    confidence *= 0.8;
  }

  // Penalize small sample size
  if (sampleSize < 50) {
    confidence *= 0.7;
  } else if (sampleSize < 100) {
    confidence *= 0.85;
  }

  return Math.max(0, Math.min(1, confidence));
}

// ============================================================================
// Phase P10: ENSEMBLE PREDICTION SYSTEM
// ============================================================================

/**
 * Phase P10: Ensemble prediction combining multiple models
 */
export interface EnsemblePrediction {
  nnPrediction: number | null;      // Neural network prediction (Phase P9)
  lstmPrediction: number | null;    // LSTM trend prediction (Phase P10)
  heuristicPrediction: number;      // Heuristic fallback (always available)
  ensembleFailureProbability: number; // Weighted average
  weights: {
    nn: number;
    lstm: number;
    heuristic: number;
  };
}

/**
 * Phase P10: Predict failure probability using ensemble of models
 * 
 * Weights:
 * - NN: 50%, LSTM: 30%, Heuristic: 20% (all models available)
 * - NN: 50%, Heuristic: 50% (LSTM missing)
 * - LSTM: 50%, Heuristic: 50% (NN missing)
 * - Heuristic: 100% (both models missing)
 */
export async function predictFailureProbabilityEnsemble(
  inputVector: number[],
  history: Array<{ riskWeight: number; testImpact: number; baselineStability: number; volatility: number; outcome: number }> = []
): Promise<EnsemblePrediction> {
  // Always compute heuristic (fallback)
  const heuristicPrediction = predictFailureProbability(inputVector);

  let nnPrediction: number | null = null;
  let lstmPrediction: number | null = null;

  // Try to load and use Neural Network (Phase P9)
  try {
    const { BrainMLModel } = await import('./learning-model.js');
    const nnModel = new BrainMLModel();
    const loaded = await nnModel.loadModel();

    if (loaded && nnModel.isModelReady()) {
      nnPrediction = await nnModel.predictOutcome(inputVector);
    }

    nnModel.dispose();
  } catch {
    // NN not available
  }

  // Try to load and use LSTM (Phase P10)
  try {
    const { BrainLSTMModel } = await import('./learning-model.js');

    if (history.length >= 20) {
      const lstmModel = new BrainLSTMModel();
      const loaded = await lstmModel.loadLSTMModel();

      if (loaded && lstmModel.isModelReady()) {
        lstmPrediction = await lstmModel.predictTrend(history);
      }

      lstmModel.dispose();
    }
  } catch {
    // LSTM not available
  }

  // Determine weights based on available models
  let weights = { nn: 0, lstm: 0, heuristic: 0 };
  let ensembleFailureProbability = 0;

  if (nnPrediction !== null && lstmPrediction !== null) {
    // All models available
    weights = { nn: 0.50, lstm: 0.30, heuristic: 0.20 };
    ensembleFailureProbability =
      nnPrediction * weights.nn +
      lstmPrediction * weights.lstm +
      heuristicPrediction * weights.heuristic;
  } else if (nnPrediction !== null) {
    // Only NN available
    weights = { nn: 0.50, lstm: 0, heuristic: 0.50 };
    ensembleFailureProbability =
      nnPrediction * weights.nn +
      heuristicPrediction * weights.heuristic;
  } else if (lstmPrediction !== null) {
    // Only LSTM available
    weights = { nn: 0, lstm: 0.50, heuristic: 0.50 };
    ensembleFailureProbability =
      lstmPrediction * weights.lstm +
      heuristicPrediction * weights.heuristic;
  } else {
    // Only heuristic available
    weights = { nn: 0, lstm: 0, heuristic: 1.0 };
    ensembleFailureProbability = heuristicPrediction;
  }

  return {
    nnPrediction,
    lstmPrediction,
    heuristicPrediction,
    ensembleFailureProbability,
    weights,
  };
}

/**
 * Phase P11: Bayesian Uncertainty Estimation Result
 */
export interface BayesianPrediction {
  mean: number;
  variance: number;
  ciLow: number; // 95% CI lower bound
  ciHigh: number; // 95% CI upper bound
}

/**
 * Phase P11: Bayesian uncertainty estimation using Monte Carlo Dropout
 * Runs model inference 20 times with dropout enabled to estimate uncertainty
 */
export async function predictWithUncertainty(
  inputVector: number[]
): Promise<BayesianPrediction> {
  const { BrainMLModel } = await import('./learning-model.js');
  const mlModel = new BrainMLModel();

  try {
    const loaded = await mlModel.loadModel();
    if (!loaded || !mlModel.isModelReady()) {
      // Fallback to heuristic with high uncertainty
      const heuristic = predictFailureProbability(inputVector);
      return {
        mean: heuristic,
        variance: 0.10, // High uncertainty for heuristic
        ciLow: Math.max(0, heuristic - 0.15),
        ciHigh: Math.min(1, heuristic + 0.15),
      };
    }

    // Run 20 MC dropout iterations
    const predictions: number[] = [];
    for (let i = 0; i < 20; i++) {
      const pred = await mlModel.predictOutcome(inputVector);
      predictions.push(pred);
    }

    // Calculate statistics
    const mean = predictions.reduce((sum, p) => sum + p, 0) / predictions.length;
    const variance = predictions.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / predictions.length;
    const stdDev = Math.sqrt(variance);

    // 95% confidence interval (mean ± 1.96*stdDev)
    const ciLow = Math.max(0, mean - 1.96 * stdDev);
    const ciHigh = Math.min(1, mean + 1.96 * stdDev);

    mlModel.dispose();

    return { mean, variance, ciLow, ciHigh };
  } catch {
    // Error during prediction
    const heuristic = predictFailureProbability(inputVector);
    return {
      mean: heuristic,
      variance: 0.10,
      ciLow: Math.max(0, heuristic - 0.15),
      ciHigh: Math.min(1, heuristic + 0.15),
    };
  }
}

/**
 * Phase P11: Enhanced Ensemble Prediction with MTL + Bayesian
 */
export interface EnsembleV2Prediction {
  nnPrediction: number | null;
  lstmPrediction: number | null;
  mtlPrediction: {
    success: number;
    performance: number;
    security: number;
    downtime: number;
  } | null;
  bayesianPrediction: BayesianPrediction | null;
  heuristicPrediction: number;
  ensembleFailureProbability: number;
  weights: {
    nn: number;
    lstm: number;
    mtl: number;
    heuristic: number;
  };
  bayesianAdjustment: number; // Risk penalty/bonus based on variance
}

/**
 * Phase P11: Ensemble v2 - Combines NN + LSTM + MTL + Bayesian + Heuristic
 * 
 * Weights:
 * - NN: 30%
 * - LSTM: 20%
 * - MTL (success head): 30%
 * - Heuristic: 20%
 * 
 * Bayesian Adjustment:
 * - High variance (>0.05): +0.15 risk penalty
 * - Low variance (<0.02): -0.05 risk bonus
 */
export async function predictFailureProbabilityEnsembleV2(
  inputVector: number[],
  history: Array<{ riskWeight: number; testImpact: number; baselineStability: number; volatility: number; outcome: number }> = []
): Promise<EnsembleV2Prediction> {
  // Always compute heuristic
  const heuristicPrediction = predictFailureProbability(inputVector);

  let nnPrediction: number | null = null;
  let lstmPrediction: number | null = null;
  let mtlPrediction: { success: number; performance: number; security: number; downtime: number } | null = null;
  let bayesianPrediction: BayesianPrediction | null = null;

  // Try NN (Phase P9)
  try {
    const { BrainMLModel } = await import('./learning-model.js');
    const nnModel = new BrainMLModel();
    if (await nnModel.loadModel() && nnModel.isModelReady()) {
      nnPrediction = await nnModel.predictOutcome(inputVector);
    }
    nnModel.dispose();
  } catch {}

  // Try LSTM (Phase P10)
  try {
    if (history.length >= 20) {
      const { BrainLSTMModel } = await import('./learning-model.js');
      const lstmModel = new BrainLSTMModel();
      if (await lstmModel.loadLSTMModel() && lstmModel.isModelReady()) {
        lstmPrediction = await lstmModel.predictTrend(history);
      }
      lstmModel.dispose();
    }
  } catch {}

  // Try MTL (Phase P11)
  try {
    const { BrainMTLModel } = await import('./learning-model.js');
    const mtlModel = new BrainMTLModel();
    if (await mtlModel.loadMTLModel() && mtlModel.isModelReady()) {
      const mtlResult = await mtlModel.predictMTL(inputVector);
      mtlPrediction = {
        success: mtlResult.deploymentSuccessProbability,
        performance: mtlResult.performanceRegressionProbability,
        security: mtlResult.securityRiskProbability,
        downtime: mtlResult.downtimeRiskProbability,
      };
    }
    mtlModel.dispose();
  } catch {}

  // Try Bayesian (Phase P11)
  try {
    bayesianPrediction = await predictWithUncertainty(inputVector);
  } catch {}

  // Calculate raw ensemble score
  let rawScore = 0;
  let weights = { nn: 0, lstm: 0, mtl: 0, heuristic: 0.20 };

  if (nnPrediction !== null && lstmPrediction !== null && mtlPrediction !== null) {
    // All models available
    weights = { nn: 0.30, lstm: 0.20, mtl: 0.30, heuristic: 0.20 };
    rawScore =
      nnPrediction * 0.30 +
      lstmPrediction * 0.20 +
      (1 - mtlPrediction.success) * 0.30 + // Convert success to failure prob
      heuristicPrediction * 0.20;
  } else if (mtlPrediction !== null) {
    // MTL + heuristic
    weights = { nn: 0, lstm: 0, mtl: 0.50, heuristic: 0.50 };
    rawScore = (1 - mtlPrediction.success) * 0.50 + heuristicPrediction * 0.50;
  } else if (nnPrediction !== null && lstmPrediction !== null) {
    // NN + LSTM + heuristic
    weights = { nn: 0.40, lstm: 0.30, mtl: 0, heuristic: 0.30 };
    rawScore = nnPrediction * 0.40 + lstmPrediction * 0.30 + heuristicPrediction * 0.30;
  } else if (nnPrediction !== null) {
    // NN + heuristic
    weights = { nn: 0.50, lstm: 0, mtl: 0, heuristic: 0.50 };
    rawScore = nnPrediction * 0.50 + heuristicPrediction * 0.50;
  } else {
    // Heuristic only
    weights = { nn: 0, lstm: 0, mtl: 0, heuristic: 1.0 };
    rawScore = heuristicPrediction;
  }

  // Apply Bayesian adjustment
  let bayesianAdjustment = 0;
  if (bayesianPrediction) {
    if (bayesianPrediction.variance > 0.05) {
      // High uncertainty → add risk penalty
      bayesianAdjustment = 0.15;
    } else if (bayesianPrediction.variance < 0.02) {
      // Low uncertainty → reduce risk
      bayesianAdjustment = -0.05;
    }
  }

  const ensembleFailureProbability = Math.max(0, Math.min(1, rawScore + bayesianAdjustment));

  return {
    nnPrediction,
    lstmPrediction,
    mtlPrediction,
    bayesianPrediction,
    heuristicPrediction,
    ensembleFailureProbability,
    weights,
    bayesianAdjustment,
  };
}
