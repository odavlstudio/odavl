import { Registry, Counter, Histogram, Gauge } from 'prom-client';

// Prometheus metrics for monitoring
export const register = new Registry();

// API Request Metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Usage Metrics
export const usageEventsTotal = new Counter({
  name: 'usage_events_total',
  help: 'Total number of usage events',
  labelNames: ['event_type', 'organization_tier'],
  registers: [register],
});

export const quotaExceeded = new Counter({
  name: 'quota_exceeded_total',
  help: 'Total number of quota exceeded events',
  labelNames: ['event_type', 'tier'],
  registers: [register],
});

// Billing Metrics
export const subscriptionsActive = new Gauge({
  name: 'subscriptions_active',
  help: 'Number of active subscriptions by tier',
  labelNames: ['tier'],
  registers: [register],
});

export const revenueTotal = new Counter({
  name: 'revenue_total',
  help: 'Total revenue in cents',
  labelNames: ['tier'],
  registers: [register],
});

// Database Metrics
export const databaseQueriesTotal = new Counter({
  name: 'database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['model', 'operation'],
  registers: [register],
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['model', 'operation'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register],
});

// Error Metrics
export const errorsTotal = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity'],
  registers: [register],
});

// Helper functions
export function recordHttpRequest(
  method: string,
  path: string,
  status: number,
  duration: number
) {
  httpRequestsTotal.inc({ method, path, status: status.toString() });
  httpRequestDuration.observe({ method, path, status: status.toString() }, duration / 1000);
}

export function recordUsageEvent(eventType: string, tier: string) {
  usageEventsTotal.inc({ event_type: eventType, organization_tier: tier });
}

export function recordQuotaExceeded(eventType: string, tier: string) {
  quotaExceeded.inc({ event_type: eventType, tier });
}

export function recordError(type: string, severity: 'low' | 'medium' | 'high' | 'critical') {
  errorsTotal.inc({ type, severity });
}

export function updateActiveSubscriptions(tier: string, count: number) {
  subscriptionsActive.set({ tier }, count);
}

export function recordRevenue(tier: string, amount: number) {
  revenueTotal.inc({ tier }, amount);
}
