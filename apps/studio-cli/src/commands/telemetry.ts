/**
 * ODAVL CLI — Telemetry Commands
 * Observability and metrics management
 */

import { Command } from 'commander';
import { Logger, Metrics, EventEmitter, Exporter } from '@odavl-studio/telemetry';

export function createTelemetryCommand(): Command {
  const telemetry = new Command('telemetry')
    .description('Telemetry and observability management')
    .alias('tel');

  telemetry
    .command('export')
    .description('Export telemetry data to JSON')
    .option('-o, --output <path>', 'Output path', '.odavl/telemetry/export.json')
    .action((options) => {
      const metrics = new Metrics();
      const emitter = new EventEmitter();
      const exporter = new Exporter();
      
      exporter.exportTo(options.output, {
        metrics: metrics.export(),
        events: emitter.getEvents()
      });
      
      console.log(`✅ Telemetry exported to ${options.output}`);
    });

  telemetry
    .command('logs')
    .description('View recent logs')
    .option('-n, --lines <number>', 'Number of lines', '20')
    .action(() => {
      console.log('📋 Viewing logs: .odavl/logs/odavl.log');
      console.log('(Stub: Production would tail log file)');
    });

  return telemetry;
}
