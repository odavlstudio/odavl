/**
 * Prometheus Metrics Collector
 * Collects and exports metrics for monitoring
 */

import { Counter, Gauge, Histogram, Registry } from 'prom-client';
import logger from '@/lib/logger';

// Create a Registry which registers all metrics
export const register = new Registry();

// Add default metrics (CPU, memory, event loop lag, etc.)
import { collectDefaultMetrics } from 'prom-client';
collectDefaultMetrics({ register });

/**
 * HTTP Request Metrics
 */
export const httpRequestCounter = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
});

export const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
    registers: [register],
});

export const httpRequestSize = new Histogram({
    name: 'http_request_size_bytes',
    help: 'HTTP request size in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 1000, 5000, 10000, 50000, 100000],
    registers: [register],
});

export const httpResponseSize = new Histogram({
    name: 'http_response_size_bytes',
    help: 'HTTP response size in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000],
    registers: [register],
});

/**
 * Test Execution Metrics
 */
export const testRunsTotal = new Counter({
    name: 'test_runs_total',
    help: 'Total number of test runs',
    labelNames: ['type', 'status'],
    registers: [register],
});

export const testDuration = new Histogram({
    name: 'test_duration_seconds',
    help: 'Test execution duration in seconds',
    labelNames: ['type'],
    buckets: [1, 5, 10, 30, 60, 120, 300],
    registers: [register],
});

export const activeTests = new Gauge({
    name: 'active_tests',
    help: 'Number of currently running tests',
    labelNames: ['type'],
    registers: [register],
});

export const testPassRate = new Gauge({
    name: 'test_pass_rate',
    help: 'Test pass rate (0-1)',
    labelNames: ['type'],
    registers: [register],
});

/**
 * Monitor Metrics
 */
export const monitorChecksTotal = new Counter({
    name: 'monitor_checks_total',
    help: 'Total number of monitor checks',
    labelNames: ['monitor_id', 'status'],
    registers: [register],
});

export const monitorResponseTime = new Histogram({
    name: 'monitor_response_time_seconds',
    help: 'Monitor response time in seconds',
    labelNames: ['monitor_id'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
    registers: [register],
});

export const activeMonitors = new Gauge({
    name: 'active_monitors',
    help: 'Number of active monitors',
    registers: [register],
});

export const monitorUptime = new Gauge({
    name: 'monitor_uptime',
    help: 'Monitor uptime percentage (0-100)',
    labelNames: ['monitor_id'],
    registers: [register],
});

/**
 * Alert Metrics
 */
export const alertsTotal = new Counter({
    name: 'alerts_total',
    help: 'Total number of alerts',
    labelNames: ['type', 'severity', 'status'],
    registers: [register],
});

export const activeAlerts = new Gauge({
    name: 'active_alerts',
    help: 'Number of active alerts',
    labelNames: ['severity'],
    registers: [register],
});

/**
 * Database Metrics
 */
export const databaseQueryDuration = new Histogram({
    name: 'database_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation', 'model'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
    registers: [register],
});

export const databaseConnections = new Gauge({
    name: 'database_connections',
    help: 'Number of active database connections',
    registers: [register],
});

export const databaseErrors = new Counter({
    name: 'database_errors_total',
    help: 'Total number of database errors',
    labelNames: ['operation', 'error_type'],
    registers: [register],
});

/**
 * Redis Metrics
 */
export const redisOperationDuration = new Histogram({
    name: 'redis_operation_duration_seconds',
    help: 'Redis operation duration in seconds',
    labelNames: ['operation'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1],
    registers: [register],
});

export const redisConnections = new Gauge({
    name: 'redis_connections',
    help: 'Number of active Redis connections',
    registers: [register],
});

export const redisErrors = new Counter({
    name: 'redis_errors_total',
    help: 'Total number of Redis errors',
    labelNames: ['operation'],
    registers: [register],
});

/**
 * Rate Limiting Metrics
 */
export const rateLimitHits = new Counter({
    name: 'rate_limit_hits_total',
    help: 'Total number of rate limit checks',
    labelNames: ['type', 'identifier', 'allowed'],
    registers: [register],
});

export const rateLimitExceeded = new Counter({
    name: 'rate_limit_exceeded_total',
    help: 'Total number of rate limit exceeded events',
    labelNames: ['type', 'identifier'],
    registers: [register],
});

/**
 * Queue Metrics
 */
export const queueJobsTotal = new Counter({
    name: 'queue_jobs_total',
    help: 'Total number of queue jobs',
    labelNames: ['queue', 'status'],
    registers: [register],
});

export const queueJobDuration = new Histogram({
    name: 'queue_job_duration_seconds',
    help: 'Queue job processing duration in seconds',
    labelNames: ['queue', 'job_type'],
    buckets: [1, 5, 10, 30, 60, 120, 300],
    registers: [register],
});

export const queueSize = new Gauge({
    name: 'queue_size',
    help: 'Number of jobs in queue',
    labelNames: ['queue', 'state'],
    registers: [register],
});

/**
 * Organization Metrics
 */
export const organizationsTotal = new Gauge({
    name: 'organizations_total',
    help: 'Total number of organizations',
    labelNames: ['tier'],
    registers: [register],
});

export const apiKeyUsage = new Counter({
    name: 'api_key_usage_total',
    help: 'Total API key usage',
    labelNames: ['organization_id', 'key_id'],
    registers: [register],
});

/**
 * Error Tracking Metrics
 */
export const errorsTotal = new Counter({
    name: 'errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'severity', 'component'],
    registers: [register],
});

export const unhandledErrors = new Counter({
    name: 'unhandled_errors_total',
    help: 'Total number of unhandled errors',
    labelNames: ['type'],
    registers: [register],
});

/**
 * Helper function to record HTTP metrics
 */
export function recordHttpMetrics(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number,
    requestSize?: number,
    responseSize?: number
) {
    try {
        httpRequestCounter.inc({ method, route, status_code: statusCode });
        httpRequestDuration.observe({ method, route, status_code: statusCode }, durationMs / 1000);

        if (requestSize) {
            httpRequestSize.observe({ method, route }, requestSize);
        }

        if (responseSize) {
            httpResponseSize.observe({ method, route }, responseSize);
        }
    } catch (error) {
        logger.error('Failed to record HTTP metrics', { error });
    }
}

/**
 * Helper function to record test metrics
 */
export function recordTestMetrics(
    type: string,
    status: string,
    durationSeconds: number
) {
    try {
        testRunsTotal.inc({ type, status });
        testDuration.observe({ type }, durationSeconds);
    } catch (error) {
        logger.error('Failed to record test metrics', { error });
    }
}

/**
 * Helper function to record monitor metrics
 */
export function recordMonitorMetrics(
    monitorId: string,
    status: string,
    responseTimeSeconds: number
) {
    try {
        monitorChecksTotal.inc({ monitor_id: monitorId, status });
        monitorResponseTime.observe({ monitor_id: monitorId }, responseTimeSeconds);
    } catch (error) {
        logger.error('Failed to record monitor metrics', { error });
    }
}

/**
 * Helper function to record database metrics
 */
export function recordDatabaseMetrics(
    operation: string,
    model: string,
    durationMs: number
) {
    try {
        databaseQueryDuration.observe({ operation, model }, durationMs / 1000);
    } catch (error) {
        logger.error('Failed to record database metrics', { error });
    }
}

/**
 * Export all metrics in Prometheus format
 */
export async function getMetrics(): Promise<string> {
    return register.metrics();
}

/**
 * Get metrics as JSON
 */
export async function getMetricsJSON() {
    const metrics = await register.getMetricsAsJSON();
    return metrics;
}

/**
 * Reset all metrics (useful for testing)
 */
export function resetMetrics() {
    register.resetMetrics();
}

export default {
    register,
    getMetrics,
    getMetricsJSON,
    resetMetrics,
    recordHttpMetrics,
    recordTestMetrics,
    recordMonitorMetrics,
    recordDatabaseMetrics,
};
