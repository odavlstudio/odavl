/**
 * Stream Consumer - Reads telemetry events
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { CloudEvent } from '../../../shared/types/index.js';
import { cloudLogger, formatError } from '../../../shared/utils/index.js';

export class StreamConsumer {
  private telemetryPath = '.odavl/cloud-telemetry/events.jsonl';
  private intelligencePath = '.odavl/cloud-intelligence/stream.jsonl';

  async consume(): Promise<CloudEvent[]> {
    try {
      const content = await fs.readFile(this.telemetryPath, 'utf8');
      const events = content
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line) as CloudEvent);

      cloudLogger('info', 'Events consumed from telemetry', { count: events.length });
      
      await this.writeToIntelligence(events);
      return events;
    } catch (error: unknown) {
      cloudLogger('warn', 'No telemetry events found', { error: formatError(error) });
      return [];
    }
  }

  private async writeToIntelligence(events: CloudEvent[]): Promise<void> {
    await fs.mkdir(path.dirname(this.intelligencePath), { recursive: true });
    const lines = events.map((e) => JSON.stringify(e)).join('\n') + '\n';
    await fs.appendFile(this.intelligencePath, lines, 'utf8');
  }
}
