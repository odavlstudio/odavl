/**
 * OMEGA-P7 Phase 1: Telemetry Aggregation Engine
 * Unified aggregator for all ODAVL telemetry (Autopilot, Insight, Guardian).
 */

import type { AutopilotTelemetryEvent } from './autopilot-telemetry.js';
import type { InsightTelemetryEvent } from '../../insight/telemetry/insight-telemetry.js';
import type { GuardianTelemetryEvent } from '../../guardian/telemetry/guardian-telemetry.js';
import { readAutopilotTelemetry } from './autopilot-telemetry.js';
import { readInsightTelemetry } from '../../insight/telemetry/insight-telemetry.js';
import { readGuardianTelemetry } from '../../guardian/telemetry/guardian-telemetry.js';

/**
 * Aggregated telemetry metrics across all products
 */
export interface AggregatedTelemetry {
  autopilot: { sessions: number; avgConfidence: number; avgIssuesFixed: number; avgFileRisk: number; criticalFilesAvg: number };
  insight: { sessions: number; avgIssues: number; issuesBySeverity: { critical: number; high: number; medium: number; low: number }; avgFileRisk: number; criticalFilesAvg: number };
  guardian: { sessions: number; failureRate: number; mostFailedGate: string | null; avgPerformanceScore: number | null; avgFileRisk: number; criticalFilesAvg: number };
}

export interface AllTelemetryData {
  autopilot: AutopilotTelemetryEvent[];
  insight: InsightTelemetryEvent[];
  guardian: GuardianTelemetryEvent[];
}

/**
 * Load all telemetry from workspace
 */
export async function loadAllTelemetry(workspaceRoot: string, limit: number = 100): Promise<AllTelemetryData> {
  try {
    const [autopilot, insight, guardian] = await Promise.all([
      readAutopilotTelemetry(workspaceRoot, limit).catch(() => []),
      readInsightTelemetry(workspaceRoot, limit).catch(() => []),
      readGuardianTelemetry(workspaceRoot, limit).catch(() => []),
    ]);
    return { autopilot, insight, guardian };
  } catch (error) {
    console.warn('[TelemetryAggregator] Failed to load:', error);
    return { autopilot: [], insight: [], guardian: [] };
  }
}

function aggregateAutopilot(events: AutopilotTelemetryEvent[]) {
  if (events.length === 0) return { sessions: 0, avgConfidence: 0, avgIssuesFixed: 0, avgFileRisk: 0, criticalFilesAvg: 0 };
  let totalConfidence = 0, totalIssuesFixed = 0, totalFileRisk = 0, totalCriticalFiles = 0, eventsWithRisk = 0;
  for (const event of events) {
    totalConfidence += event.brain.improvement;
    totalIssuesFixed += event.issues.before - event.issues.after;
    if (event.omsFileRisk) { totalFileRisk += event.omsFileRisk.avgRisk; totalCriticalFiles += event.omsFileRisk.criticalFileCount; eventsWithRisk++; }
  }
  return { sessions: events.length, avgConfidence: totalConfidence / events.length, avgIssuesFixed: totalIssuesFixed / events.length, avgFileRisk: eventsWithRisk > 0 ? totalFileRisk / eventsWithRisk : 0, criticalFilesAvg: eventsWithRisk > 0 ? totalCriticalFiles / eventsWithRisk : 0 };
}

function aggregateInsight(events: InsightTelemetryEvent[]) {
  if (events.length === 0) return { sessions: 0, avgIssues: 0, issuesBySeverity: { critical: 0, high: 0, medium: 0, low: 0 }, avgFileRisk: 0, criticalFilesAvg: 0 };
  let totalIssues = 0, totalFileRisk = 0, totalCriticalFiles = 0, eventsWithRisk = 0;
  const severityTotals = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const event of events) {
    totalIssues += event.issuesFound;
    severityTotals.critical += event.issuesBySeverity.critical; severityTotals.high += event.issuesBySeverity.high;
    severityTotals.medium += event.issuesBySeverity.medium; severityTotals.low += event.issuesBySeverity.low;
    if (event.fileRiskSummary) { totalFileRisk += event.fileRiskSummary.avgRisk; totalCriticalFiles += event.fileRiskSummary.criticalCount; eventsWithRisk++; }
  }
  return { sessions: events.length, avgIssues: totalIssues / events.length, issuesBySeverity: { critical: Math.round(severityTotals.critical / events.length), high: Math.round(severityTotals.high / events.length), medium: Math.round(severityTotals.medium / events.length), low: Math.round(severityTotals.low / events.length) }, avgFileRisk: eventsWithRisk > 0 ? totalFileRisk / eventsWithRisk : 0, criticalFilesAvg: eventsWithRisk > 0 ? totalCriticalFiles / eventsWithRisk : 0 };
}

export function getMostFailedGate(events: GuardianTelemetryEvent[]): string | null {
  if (events.length === 0) return null;
  const failureCounts: Record<string, number> = {};
  for (const event of events) for (const gateName of event.failedGateNames) failureCounts[gateName] = (failureCounts[gateName] || 0) + 1;
  const entries = Object.entries(failureCounts);
  return entries.length === 0 ? null : entries.sort((a, b) => b[1] - a[1])[0][0];
}

function aggregateGuardian(events: GuardianTelemetryEvent[]) {
  if (events.length === 0) return { sessions: 0, failureRate: 0, mostFailedGate: null, avgPerformanceScore: null, avgFileRisk: 0, criticalFilesAvg: 0 };
  let totalGatesFailed = 0, totalGates = 0, totalPerformanceScore = 0, eventsWithPerformance = 0;
  let totalFileRisk = 0, totalCriticalFiles = 0, eventsWithRisk = 0;
  for (const event of events) {
    totalGatesFailed += event.gatesFailed; totalGates += event.totalGates;
    if (event.performanceScore !== undefined && event.performanceScore !== null) { totalPerformanceScore += event.performanceScore; eventsWithPerformance++; }
    if (event.fileRiskSummary) { totalFileRisk += event.fileRiskSummary.avgRisk; totalCriticalFiles += event.fileRiskSummary.criticalCount; eventsWithRisk++; }
  }
  return { sessions: events.length, failureRate: totalGates > 0 ? totalGatesFailed / totalGates : 0, mostFailedGate: getMostFailedGate(events), avgPerformanceScore: eventsWithPerformance > 0 ? totalPerformanceScore / eventsWithPerformance : null, avgFileRisk: eventsWithRisk > 0 ? totalFileRisk / eventsWithRisk : 0, criticalFilesAvg: eventsWithRisk > 0 ? totalCriticalFiles / eventsWithRisk : 0 };
}

/**
 * Aggregate all telemetry into unified metrics
 */
export function aggregateTelemetry(data: AllTelemetryData): AggregatedTelemetry {
  try {
    return { autopilot: aggregateAutopilot(data.autopilot), insight: aggregateInsight(data.insight), guardian: aggregateGuardian(data.guardian) };
  } catch (error) {
    console.warn('[TelemetryAggregator] Failed:', error);
    return { autopilot: { sessions: 0, avgConfidence: 0, avgIssuesFixed: 0, avgFileRisk: 0, criticalFilesAvg: 0 }, insight: { sessions: 0, avgIssues: 0, issuesBySeverity: { critical: 0, high: 0, medium: 0, low: 0 }, avgFileRisk: 0, criticalFilesAvg: 0 }, guardian: { sessions: 0, failureRate: 0, mostFailedGate: null, avgPerformanceScore: null, avgFileRisk: 0, criticalFilesAvg: 0 } };
  }
}
