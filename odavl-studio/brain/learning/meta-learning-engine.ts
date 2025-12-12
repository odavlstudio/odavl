/**
 * Meta-Learning Engine - OMEGA-P7 Phase 3
 * Generates adaptive decisions for system evolution based on global learning signals
 */

import type { GlobalLearningSignals } from './global-learning-signals.js';

/**
 * Meta-learning decision for adaptive system behavior
 * Guides fusion weights, trust scores, OMS, autopilot strategy, and guardian sensitivity
 */
export interface MetaLearningDecision {
  /** Fusion weight learning rate (0.05-0.30, higher = faster adaptation) */
  nextFusionLearningRate: number;
  /** Trust score learning rate (0.05-0.30, higher = faster trust updates) */
  nextTrustLearningRate: number;
  /** Recommended guardian gate sensitivity level */
  recommendedGuardianSensitivity: 'low' | 'medium' | 'high' | 'critical';
  /** Autopilot aggressiveness (0-1, higher = more changes per cycle) */
  autopilotAggressiveness: number;
  /** OMS risk weighting multiplier (0.5-1.5, higher = more risk-aware) */
  adaptOMSWeighting: number;
  /** Human-readable reasoning trace explaining each decision */
  reasoning: string[];
}

/**
 * Clamp value to range [min, max]
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute meta-learning decision from global learning signals
 * 
 * Decision Rules:
 * 1. Fusion LR: Higher when system unstable (instability = (1-quality)*0.5 + risk*0.5)
 * 2. Trust LR: Higher when autopilot struggling or risk high (pressure = (1-quality)*0.4 + risk*0.6)
 * 3. Guardian Sensitivity: Thresholds based on stability (<0.4=critical, <0.6=high, <0.8=medium, else=low)
 * 4. Autopilot Aggressiveness: Direct mapping to overall learning potential
 * 5. OMS Weighting: Amplify when risk high, reduce when stable (1.0 + (risk - 0.5))
 * 6. Reasoning: Explain each decision with numeric justification
 */
export function computeMetaLearningDecision(signals: GlobalLearningSignals): MetaLearningDecision {
  const reasoning: string[] = [];

  // 1) Fusion Learning Rate
  const fusionBase = 0.10;
  const instability = (1 - signals.autopilotQuality) * 0.5 + signals.riskPressure * 0.5;
  const nextFusionLearningRate = clamp(fusionBase + instability * 0.20, 0.05, 0.30);

  if (instability > 0.4) {
    reasoning.push(`Fusion learning rate increased due to instability (${instability.toFixed(2)})`);
  } else if (instability < 0.2) {
    reasoning.push(`Fusion learning rate reduced due to system stability (${instability.toFixed(2)})`);
  }

  // 2) Trust Learning Rate
  const trustBase = 0.10;
  const pressure = (1 - signals.autopilotQuality) * 0.4 + signals.riskPressure * 0.6;
  const nextTrustLearningRate = clamp(trustBase + pressure * 0.20, 0.05, 0.30);

  if (pressure > 0.5) {
    reasoning.push(`Trust learning rate elevated due to system pressure (${pressure.toFixed(2)})`);
  }

  // 3) Guardian Sensitivity
  let recommendedGuardianSensitivity: 'low' | 'medium' | 'high' | 'critical';
  if (signals.guardianGateStability < 0.40) {
    recommendedGuardianSensitivity = 'critical';
    reasoning.push(`Guardian stability critically low (${signals.guardianGateStability.toFixed(2)}) → sensitivity: critical`);
  } else if (signals.guardianGateStability < 0.60) {
    recommendedGuardianSensitivity = 'high';
    reasoning.push(`Guardian stability below 0.60 (${signals.guardianGateStability.toFixed(2)}) → sensitivity: high`);
  } else if (signals.guardianGateStability < 0.80) {
    recommendedGuardianSensitivity = 'medium';
    reasoning.push(`Guardian stability moderate (${signals.guardianGateStability.toFixed(2)}) → sensitivity: medium`);
  } else {
    recommendedGuardianSensitivity = 'low';
    reasoning.push(`Guardian stability high (${signals.guardianGateStability.toFixed(2)}) → sensitivity: low`);
  }

  // 4) Autopilot Aggressiveness
  const autopilotAggressiveness = signals.overallLearningPotential;

  if (autopilotAggressiveness > 0.7) {
    reasoning.push(`High learning potential (${autopilotAggressiveness.toFixed(2)}) → autopilot set to aggressive mode`);
  } else if (autopilotAggressiveness < 0.3) {
    reasoning.push(`Low learning potential (${autopilotAggressiveness.toFixed(2)}) → autopilot set to conservative mode`);
  }

  // 5) OMS Weight Adaptation
  const adaptOMSWeighting = clamp(1.0 + (signals.riskPressure - 0.5), 0.5, 1.5);

  if (signals.riskPressure > 0.6) {
    reasoning.push(`OMS weighting boosted due to high risk pressure (${signals.riskPressure.toFixed(2)})`);
  } else if (signals.riskPressure < 0.3) {
    reasoning.push(`OMS weighting reduced due to low risk pressure (${signals.riskPressure.toFixed(2)})`);
  }

  // Add overall health summary
  if (signals.autopilotQuality > 0.75 && signals.insightDetectorHealth > 0.75 && signals.guardianGateStability > 0.75) {
    reasoning.push('System operating at high quality across all products');
  } else if (signals.autopilotQuality < 0.5 || signals.insightDetectorHealth < 0.5 || signals.guardianGateStability < 0.5) {
    reasoning.push('System requires attention: quality metrics below 0.50');
  }

  return {
    nextFusionLearningRate,
    nextTrustLearningRate,
    recommendedGuardianSensitivity,
    autopilotAggressiveness,
    adaptOMSWeighting,
    reasoning,
  };
}
