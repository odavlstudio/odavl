/**
 * OMEGA-P6 Phase 4: Guardian Telemetry System
 * 
 * Captures gate reliability, performance scores, and file-risk patterns
 * from Guardian validation sessions for quality improvement.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Telemetry event capturing one Guardian validation session
 */
export interface GuardianTelemetryEvent {
  timestamp: string;
  workspaceRoot: string;
  totalGates: number;
  gatesPassed: number;
  gatesFailed: number;
  failedGateNames: string[];
  performanceScore?: number;
  brainConfidence?: number;
  fileRiskSummary?: {
    avgRisk: number;
    criticalCount: number;
  };
}

/**
 * Get telemetry directory for Guardian events
 */
export function getGuardianTelemetryDir(root: string): string {
  return path.join(root, '.odavl', 'brain-history', 'telemetry', 'guardian');
}

/**
 * Append Guardian telemetry event to JSONL file
 * 
 * @param root - Project root directory
 * @param event - Telemetry event to append
 */
export async function appendGuardianTelemetry(
  root: string,
  event: GuardianTelemetryEvent
): Promise<void> {
  try {
    const telemetryDir = getGuardianTelemetryDir(root);
    const eventsFile = path.join(telemetryDir, 'events.jsonl');

    // Ensure directory exists
    await fs.mkdir(telemetryDir, { recursive: true });

    // Append as JSONL (one JSON object per line)
    const line = JSON.stringify(event) + '\n';
    await fs.appendFile(eventsFile, line, 'utf-8');
  } catch (error) {
    // Telemetry failures should never break Guardian validation
    console.warn('[GuardianTelemetry] Failed to append event:', error);
  }
}

/**
 * Read last N Guardian telemetry events
 * 
 * @param root - Project root directory
 * @param limit - Maximum number of events to return (default: 50)
 * @returns Array of telemetry events, newest first
 */
export async function readGuardianTelemetry(
  root: string,
  limit: number = 50
): Promise<GuardianTelemetryEvent[]> {
  try {
    const telemetryDir = getGuardianTelemetryDir(root);
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
    const events: GuardianTelemetryEvent[] = [];
    const startIdx = Math.max(0, lines.length - limit);

    for (let i = startIdx; i < lines.length; i++) {
      try {
        const event = JSON.parse(lines[i]);
        events.push(event);
      } catch (parseError) {
        console.warn(`[GuardianTelemetry] Failed to parse line ${i}:`, parseError);
      }
    }

    // Return newest first
    return events.reverse();
  } catch (error) {
    console.warn('[GuardianTelemetry] Failed to read events:', error);
    return [];
  }
}
