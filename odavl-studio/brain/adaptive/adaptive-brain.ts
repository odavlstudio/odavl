/**
 * Adaptive Brain Evolution Engine - OMEGA-P8 Phase 1
 * Self-evolving intelligence loop that adapts system behavior autonomously
 */

import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { loadAllTelemetry, aggregateTelemetry } from '../telemetry/telemetry-aggregator.js';
import { computeLearningSignals } from '../learning/global-learning-signals.js';
import { computeMetaLearningDecision } from '../learning/meta-learning-engine.js';

/**
 * Adaptive brain state - autonomously evolving system parameters
 */
export interface AdaptiveBrainState {
  /** Fusion weight learning rate (0.05-0.30) */
  fusionLearningRate: number;
  /** Trust score learning rate (0.05-0.30) */
  trustLearningRate: number;
  /** Guardian gate sensitivity level */
  guardianSensitivity: 'low' | 'medium' | 'high' | 'critical';
  /** Autopilot aggressiveness (0-1) */
  autopilotAggressiveness: number;
  /** OMS risk weighting multiplier (0.5-1.5) */
  omsWeightingMultiplier: number;
  /** Timestamp of last state update */
  lastUpdated: string;
}

/**
 * Default adaptive brain state (initial bootstrap values)
 */
const DEFAULT_STATE: AdaptiveBrainState = {
  fusionLearningRate: 0.10,
  trustLearningRate: 0.10,
  guardianSensitivity: 'medium',
  autopilotAggressiveness: 0.5,
  omsWeightingMultiplier: 1.0,
  lastUpdated: new Date().toISOString(),
};

/**
 * Guardian sensitivity strictness ordering
 */
const SENSITIVITY_ORDER = ['low', 'medium', 'high', 'critical'] as const;

/**
 * Choose stricter guardian sensitivity between old and new
 */
function chooseStricterSensitivity(
  old: 'low' | 'medium' | 'high' | 'critical',
  newSens: 'low' | 'medium' | 'high' | 'critical'
): 'low' | 'medium' | 'high' | 'critical' {
  const oldIndex = SENSITIVITY_ORDER.indexOf(old);
  const newIndex = SENSITIVITY_ORDER.indexOf(newSens);
  return oldIndex > newIndex ? old : newSens;
}

/**
 * Clamp value to range [min, max]
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Load previous adaptive brain state from disk
 */
async function loadPreviousState(cwd: string): Promise<AdaptiveBrainState> {
  const statePath = path.join(cwd, '.odavl', 'brain-history', 'adaptive', 'state.json');
  try {
    const content = await fs.readFile(statePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return { ...DEFAULT_STATE };
  }
}

/**
 * Save adaptive brain state atomically (write temp + rename)
 */
async function saveState(cwd: string, state: AdaptiveBrainState): Promise<void> {
  const stateDir = path.join(cwd, '.odavl', 'brain-history', 'adaptive');
  const statePath = path.join(stateDir, 'state.json');
  const tempPath = path.join(stateDir, `state.tmp.${Date.now()}.json`);

  await fs.mkdir(stateDir, { recursive: true });
  await fs.writeFile(tempPath, JSON.stringify(state, null, 2), 'utf8');
  await fs.rename(tempPath, statePath);
}

/**
 * Evolve adaptive brain state based on telemetry and meta-learning
 * 
 * Process:
 * 1. Load aggregated telemetry from all products
 * 2. Compute global learning signals
 * 3. Generate meta-learning decision
 * 4. Load previous state (or use default)
 * 5. Blend old + new values (60% old, 40% new)
 * 6. Apply special rules (guardian strictness, clamping)
 * 7. Save new state atomically
 * 8. Return evolved state
 */
export async function evolveAdaptiveBrainState(
  cwd: string,
  telemetryLimit: number = 200
): Promise<AdaptiveBrainState> {
  // Step 1: Load telemetry and compute meta-learning decision
  const data = await loadAllTelemetry(cwd, telemetryLimit);
  const aggregated = aggregateTelemetry(data);
  
  // Check if we have any telemetry data
  const totalSessions = aggregated.autopilot.sessions + aggregated.insight.sessions + aggregated.guardian.sessions;
  
  // If no data, return previous state (or default)
  if (totalSessions === 0) {
    return await loadPreviousState(cwd);
  }

  const signals = computeLearningSignals(aggregated);
  const decision = computeMetaLearningDecision(signals);

  // Step 2: Load previous state
  const oldState = await loadPreviousState(cwd);

  // Step 3: Blend old + new values (60% old, 40% new)
  const blendedFusionLR = oldState.fusionLearningRate * 0.6 + decision.nextFusionLearningRate * 0.4;
  const blendedTrustLR = oldState.trustLearningRate * 0.6 + decision.nextTrustLearningRate * 0.4;
  const blendedAggressiveness = oldState.autopilotAggressiveness * 0.6 + decision.autopilotAggressiveness * 0.4;
  const blendedOMS = oldState.omsWeightingMultiplier * 0.6 + decision.adaptOMSWeighting * 0.4;

  // Apply special rules and clamping
  const newState: AdaptiveBrainState = {
    fusionLearningRate: clamp(blendedFusionLR, 0.05, 0.30),
    trustLearningRate: clamp(blendedTrustLR, 0.05, 0.30),
    guardianSensitivity: chooseStricterSensitivity(oldState.guardianSensitivity, decision.recommendedGuardianSensitivity),
    autopilotAggressiveness: clamp(blendedAggressiveness, 0, 1),
    omsWeightingMultiplier: clamp(blendedOMS, 0.5, 1.5),
    lastUpdated: new Date().toISOString(),
  };

  // Step 4: Save new state atomically
  await saveState(cwd, newState);

  // Step 5: Return evolved state
  return newState;
}
