/**
 * ODAVL Telemetry — Data Exporter
 * Export logs, metrics, events to JSON
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { MetricData } from './metrics.js';
import type { Event } from './events.js';

export interface ExportData {
  timestamp: string;
  metrics?: MetricData;
  events?: Event[];
  logs?: unknown[];
}

export class Exporter {
  private exportPath: string;

  constructor(workspaceRoot: string = process.cwd()) {
    const exportDir = join(workspaceRoot, '.odavl', 'telemetry');
    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true });
    }
    this.exportPath = join(exportDir, 'export.json');
  }

  /**
   * Export telemetry data to JSON
   * Compatible with Datadog, Prometheus, Grafana
   */
  export(data: ExportData): void {
    const payload = {
      ...data,
      timestamp: new Date().toISOString()
    };
    writeFileSync(this.exportPath, JSON.stringify(payload, null, 2));
  }

  /**
   * Export to custom path
   */
  exportTo(path: string, data: ExportData): void {
    const payload = {
      ...data,
      timestamp: new Date().toISOString()
    };
    writeFileSync(path, JSON.stringify(payload, null, 2));
  }
}
