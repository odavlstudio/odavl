/**
 * Global Learning Signals Engine - OMEGA-P7 Phase 2
 * Computes unified cross-product metrics for meta-learning
 */

import type { AggregatedTelemetry } from '../telemetry/telemetry-aggregator.js';

/**
 * Global learning signals computed from aggregated telemetry
 * All values normalized to 0-1 range
 */
export interface GlobalLearningSignals {
  /** Autopilot effectiveness (0=poor, 1=excellent) */
  autopilotQuality: number;
  /** Insight detector reliability (0=poor, 1=excellent) */
  insightDetectorHealth: number;
  /** Guardian gate consistency (0=unstable, 1=stable) */
  guardianGateStability: number;
  /** System risk exposure (0=low, 1=high) */
  riskPressure: number;
  /** Overall improvement opportunity (0=none, 1=high) */
  overallLearningPotential: number;
}

/**
 * Safe number conversion - returns 0 for NaN/undefined
 */
function safeNumber(x: number | undefined | null): number {
  if (x === undefined || x === null || isNaN(x)) return 0;
  return x;
}

/**
 * Compute global learning signals from aggregated telemetry
 * 
 * Formulas:
 * - Autopilot Quality = (avgConfidence/100)*0.6 + (1-avgFileRisk)*0.2 + issuesFixedNorm*0.2
 * - Insight Health = (1-criticalNorm)*0.4 + (1-highNorm)*0.3 + (1-avgFileRisk)*0.3
 * - Guardian Stability = (1-failureRate)*0.6 + (1-avgFileRisk)*0.4
 * - Risk Pressure = avgFileRisk*0.7 + criticalFilesNorm*0.3
 * - Overall Potential = (1-autopilot)*0.3 + (1-insight)*0.3 + (1-guardian)*0.2 + risk*0.2
 */
export function computeLearningSignals(aggregated: AggregatedTelemetry): GlobalLearningSignals {
  // Extract data with safe defaults
  const autopilot = aggregated.autopilot;
  const insight = aggregated.insight;
  const guardian = aggregated.guardian;

  // A) Autopilot Quality (0-1)
  const avgConfidence = safeNumber(autopilot.avgConfidence);
  const autopilotFileRisk = safeNumber(autopilot.avgFileRisk);
  const avgIssuesFixed = safeNumber(autopilot.avgIssuesFixed);
  const issuesFixedNormalized = Math.min(avgIssuesFixed / 10, 1);

  const autopilotQuality =
    (avgConfidence / 100) * 0.6 +
    (1 - autopilotFileRisk) * 0.2 +
    issuesFixedNormalized * 0.2;

  // B) Insight Detector Health (0-1)
  const critical = safeNumber(insight.issuesBySeverity.critical);
  const high = safeNumber(insight.issuesBySeverity.high);
  const medium = safeNumber(insight.issuesBySeverity.medium);
  const low = safeNumber(insight.issuesBySeverity.low);
  const totalIssues = critical + high + medium + low + 1; // +1 to avoid division by zero
  
  const severityCriticalNormalized = critical / totalIssues;
  const severityHighNormalized = high / totalIssues;
  const insightFileRisk = safeNumber(insight.avgFileRisk);

  const insightDetectorHealth =
    (1 - severityCriticalNormalized) * 0.4 +
    (1 - severityHighNormalized) * 0.3 +
    (1 - insightFileRisk) * 0.3;

  // C) Guardian Gate Stability (0-1)
  const failureRate = safeNumber(guardian.failureRate);
  const guardianFileRisk = safeNumber(guardian.avgFileRisk);

  const guardianGateStability =
    (1 - failureRate) * 0.6 +
    (1 - guardianFileRisk) * 0.4;

  // D) Risk Pressure (0-1)
  const avgFileRiskAcrossProducts = (autopilotFileRisk + insightFileRisk + guardianFileRisk) / 3;
  
  const autopilotCriticalFilesNorm = Math.min(safeNumber(autopilot.criticalFilesAvg) / 5, 1);
  const insightCriticalFilesNorm = Math.min(safeNumber(insight.criticalFilesAvg) / 5, 1);
  const guardianCriticalFilesNorm = Math.min(safeNumber(guardian.criticalFilesAvg) / 5, 1);
  const avgCriticalFilesNorm = (autopilotCriticalFilesNorm + insightCriticalFilesNorm + guardianCriticalFilesNorm) / 3;

  const riskPressure =
    avgFileRiskAcrossProducts * 0.7 +
    avgCriticalFilesNorm * 0.3;

  // E) Overall Learning Potential (0-1)
  const overallLearningPotential =
    (1 - autopilotQuality) * 0.3 +
    (1 - insightDetectorHealth) * 0.3 +
    (1 - guardianGateStability) * 0.2 +
    riskPressure * 0.2;

  // Clamp all values to [0, 1] range
  return {
    autopilotQuality: Math.max(0, Math.min(1, safeNumber(autopilotQuality))),
    insightDetectorHealth: Math.max(0, Math.min(1, safeNumber(insightDetectorHealth))),
    guardianGateStability: Math.max(0, Math.min(1, safeNumber(guardianGateStability))),
    riskPressure: Math.max(0, Math.min(1, safeNumber(riskPressure))),
    overallLearningPotential: Math.max(0, Math.min(1, safeNumber(overallLearningPotential))),
  };
}
