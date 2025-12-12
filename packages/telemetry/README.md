# @odavl-studio/telemetry

Enterprise-grade telemetry, logging, metrics, and observability for ODAVL Studio.

## Features

- **Structured Logging**: Google Cloud–style JSON logs with levels (debug, info, warn, error)
- **Metrics System**: Netflix-style counters and timers, Prometheus/Datadog compatible
- **Event Tracking**: Standardized events across Insight, Autopilot, Guardian
- **Audit Trail**: SHA-256 attestation chain for cryptographic proof
- **Data Export**: JSON export for integration with monitoring platforms

## Usage

```typescript
import { Logger, Metrics, EventEmitter, AuditTrail, Exporter } from '@odavl-studio/telemetry';

// Structured logging
const logger = new Logger();
logger.info('Analysis started', { product: 'insight', detectors: 11 });

// Metrics tracking
const metrics = new Metrics();
metrics.increment('insight.run_count');
const timer = metrics.timer('autopilot.observe_duration_ms');
// ... do work ...
timer.stop();

// Event emission
const emitter = new EventEmitter();
emitter.emit(ODAVLEvent.INSIGHT_ANALYSIS_COMPLETED, 'insight', { issues: 42 });

// Audit trail
const audit = new AuditTrail();
const hash = audit.record('recipe_executed', 'autopilot', recipeContent);

// Export data
const exporter = new Exporter();
exporter.export({ metrics: metrics.export(), events: emitter.getEvents() });
```

## Output Locations

- Logs: `.odavl/logs/odavl.log`
- Audit: `.odavl/audit/trail.jsonl`
- Exports: `.odavl/telemetry/export.json`

## License

MIT
