/**
 * OMEGA-P6 Phase 1: Autopilot Telemetry System
 * 
 * Captures learning data from Autopilot self-heal sessions for:
 * - Recipe trust score updates
 * - Fusion weight calibration
 * - Success/failure pattern analysis
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Telemetry event capturing one Autopilot self-heal session
 */
export interface AutopilotTelemetryEvent {
  timestamp: string;
  sessionId: string;
  projectRoot: string;
  recipes: {
    recipeId: string;
    status: 'executed' | 'skipped' | 'failed' | 'rolled-back';
    filesModified: number;
    locChanged: number;
    riskBefore?: number;
    riskAfter?: number;
  }[];
  issues: {
    before: number;
    after: number;
  };
  guardian: {
    ran: boolean;
    canDeploy: boolean;
    gatesPassed: number;
    gatesTotal: number;
    failedGates?: string[];
  };
  brain: {
    before: number;
    after: number;
    improvement: number;
  };
  omsFileRisk?: {
    avgRisk: number;
    criticalFileCount: number;
  };
}

/**
 * Get telemetry directory path, ensuring it exists
 * 
 * @param root Project root directory
 * @returns Absolute path to telemetry directory
 */
export function getTelemetryDir(root: string): string {
  return path.join(root, '.odavl', 'brain-history', 'telemetry', 'autopilot');
}

/**
 * Append telemetry event to JSONL file
 * 
 * @param root Project root directory
 * @param event Telemetry event to append
 */
export async function appendAutopilotTelemetry(
  root: string,
  event: AutopilotTelemetryEvent
): Promise<void> {
  try {
    const telemetryDir = getTelemetryDir(root);
    await fs.mkdir(telemetryDir, { recursive: true });

    const filePath = path.join(telemetryDir, 'events.jsonl');
    const line = JSON.stringify(event) + '\n';

    await fs.appendFile(filePath, line, 'utf8');
  } catch (error) {
    console.warn('[Telemetry] Failed to append event:', error);
  }
}

/**
 * Read recent telemetry events from JSONL file
 * 
 * @param root Project root directory
 * @param limit Maximum number of events to return (default: 50)
 * @returns Array of telemetry events, most recent first
 */
export async function readAutopilotTelemetry(
  root: string,
  limit: number = 50
): Promise<AutopilotTelemetryEvent[]> {
  try {
    const telemetryDir = getTelemetryDir(root);
    const filePath = path.join(telemetryDir, 'events.jsonl');

    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.trim().split('\n').filter((line) => line.length > 0);

    const events = lines
      .map((line) => {
        try {
          return JSON.parse(line) as AutopilotTelemetryEvent;
        } catch {
          return null;
        }
      })
      .filter((event): event is AutopilotTelemetryEvent => event !== null);

    return events.slice(-limit).reverse();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    console.warn('[Telemetry] Failed to read events:', error);
    return [];
  }
}
