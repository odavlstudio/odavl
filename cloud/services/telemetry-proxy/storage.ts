/**
 * Telemetry storage (JSONL format)
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { CloudEvent } from '../../shared/types/index.js';
import { cloudLogger, formatError } from '../../shared/utils/index.js';

export class TelemetryStorage {
  private storageDir = '.odavl/cloud-telemetry';
  private filename = 'events.jsonl';

  async store(event: CloudEvent): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      const filePath = path.join(this.storageDir, this.filename);
      const line = JSON.stringify(event) + '\n';
      await fs.appendFile(filePath, line, 'utf8');
    } catch (error: unknown) {
      cloudLogger('error', 'Failed to store event', { error: formatError(error) });
    }
  }

  async readAll(): Promise<CloudEvent[]> {
    try {
      const filePath = path.join(this.storageDir, this.filename);
      const content = await fs.readFile(filePath, 'utf8');
      return content
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line) as CloudEvent);
    } catch (error: unknown) {
      cloudLogger('warn', 'No events found', { error: formatError(error) });
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      const filePath = path.join(this.storageDir, this.filename);
      await fs.unlink(filePath);
      cloudLogger('info', 'Telemetry storage cleared');
    } catch (error: unknown) {
      cloudLogger('warn', 'Clear failed', { error: formatError(error) });
    }
  }
}
