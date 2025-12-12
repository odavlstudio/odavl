/**
 * OMEGA-P6 Phase 4: Insight Telemetry System
 * 
 * Captures detection quality and file-risk patterns from Insight analysis
 * sessions for Brain learning and quality improvement.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Telemetry event capturing one Insight analysis session
 */
export interface InsightTelemetryEvent {
  timestamp: string;
  workspaceRoot: string;
  filesAnalyzed: number;
  detectorsRun: string[];
  issuesFound: number;
  issuesBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  fileRiskSummary?: {
    avgRisk: number;
    criticalCount: number;
  };
}

/**
 * Get telemetry directory for Insight events
 */
export function getInsightTelemetryDir(root: string): string {
  return path.join(root, '.odavl', 'brain-history', 'telemetry', 'insight');
}

/**
 * Append Insight telemetry event to JSONL file
 * 
 * @param root - Project root directory
 * @param event - Telemetry event to append
 */
export async function appendInsightTelemetry(
  root: string,
  event: InsightTelemetryEvent
): Promise<void> {
  try {
    const telemetryDir = getInsightTelemetryDir(root);
    const eventsFile = path.join(telemetryDir, 'events.jsonl');

    // Ensure directory exists
    await fs.mkdir(telemetryDir, { recursive: true });

    // Append as JSONL (one JSON object per line)
    const line = JSON.stringify(event) + '\n';
    await fs.appendFile(eventsFile, line, 'utf-8');
  } catch (error) {
    // Telemetry failures should never break Insight analysis
    console.warn('[InsightTelemetry] Failed to append event:', error);
  }
}

/**
 * Read last N Insight telemetry events
 * 
 * @param root - Project root directory
 * @param limit - Maximum number of events to return (default: 50)
 * @returns Array of telemetry events, newest first
 */
export async function readInsightTelemetry(
  root: string,
  limit: number = 50
): Promise<InsightTelemetryEvent[]> {
  try {
    const telemetryDir = getInsightTelemetryDir(root);
    const eventsFile = path.join(telemetryDir, 'events.jsonl');

    // Check if file exists
    try {
      await fs.access(eventsFile);
    } catch {
      return [];
    }

    // Read all lines
    const content = await fs.readFile(eventsFile, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l.length > 0);

    // Parse JSONL (last N lines)
    const events: InsightTelemetryEvent[] = [];
    const startIdx = Math.max(0, lines.length - limit);

    for (let i = startIdx; i < lines.length; i++) {
      try {
        const event = JSON.parse(lines[i]);
        events.push(event);
      } catch (parseError) {
        console.warn(`[InsightTelemetry] Failed to parse line ${i}:`, parseError);
      }
    }

    // Return newest first
    return events.reverse();
  } catch (error) {
    console.warn('[InsightTelemetry] Failed to read events:', error);
    return [];
  }
}
