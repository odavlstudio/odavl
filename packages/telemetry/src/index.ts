/**
 * @odavl-studio/telemetry
 * Enterprise-grade observability for ODAVL Studio
 */

export { Logger, type LogLevel, type LogEntry } from './logger.js';
export { Metrics, type Timer, type MetricData } from './metrics.js';
export { EventEmitter, ODAVLEvent, type Event } from './events.js';

// Insight-specific telemetry
export type {
  InsightEvent,
  InsightEventType,
  InsightEventBase,
  InsightAnalysisStartedEvent,
  InsightAnalysisCompletedEvent,
  InsightCloudAnalysisStartedEvent,
  InsightCloudAnalysisCompletedEvent,
  InsightExtensionScanTriggeredEvent,
  InsightCLIScanTriggeredEvent,
  InsightPlanUpgradedEvent,
  InsightLimitHitEvent,
  InsightUpgradePromptShownEvent,
} from './insight-events.js';

export {
  InsightTelemetryClient,
  getInsightTelemetry,
  configureInsightTelemetry,
  trackInsightEvent,
  flushInsightTelemetry,
  type TelemetryConfig,
} from './insight-telemetry.js';
