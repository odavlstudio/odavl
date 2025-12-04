import os from 'os';
import { performance } from 'perf_hooks';
import * as Sentry from '@sentry/nextjs';
import logger from './logger';

// Performance metrics collector
export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: Map<string, number[]> = new Map();
    private readonly maxMetrics = 1000; // Keep last 1000 metrics per key

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    // Record a metric value
    record(key: string, value: number): void {
        if (!this.metrics.has(key)) {
            this.metrics.set(key, []);
        }

        const values = this.metrics.get(key)!;
        values.push(value);

        // Keep only last N metrics
        if (values.length > this.maxMetrics) {
            values.shift();
        }
    }

    // Get statistics for a metric
    getStats(key: string) {
        const values = this.metrics.get(key);
        if (!values || values.length === 0) {
            return null;
        }

        const sorted = [...values].sort((a, b) => a - b);
        const sum = sorted.reduce((acc, val) => acc + val, 0);

        return {
            count: sorted.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: sum / sorted.length,
            p50: sorted[Math.floor(sorted.length * 0.5)],
            p90: sorted[Math.floor(sorted.length * 0.9)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)],
        };
    }

    // Clear metrics
    clear(key?: string): void {
        if (key) {
            this.metrics.delete(key);
        } else {
            this.metrics.clear();
        }
    }

    // Get all metrics
    getAllStats() {
        const result: Record<string, any> = {};
        for (const [key, _] of this.metrics) {
            result[key] = this.getStats(key);
        }
        return result;
    }
}

// System metrics collector
export class SystemMonitor {
    static getMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            rss: Math.round(usage.rss / 1024 / 1024), // MB
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
            external: Math.round(usage.external / 1024 / 1024), // MB
        };
    }

    static getCPUUsage() {
        const cpus = os.cpus();
        const usage = cpus.map((cpu) => {
            const total = Object.values(cpu.times).reduce((acc, val) => acc + val, 0);
            const idle = cpu.times.idle;
            return {
                model: cpu.model,
                usage: Math.round(((total - idle) / total) * 100),
            };
        });

        const avgUsage =
            usage.reduce((acc, cpu) => acc + cpu.usage, 0) / usage.length;

        return {
            cores: cpus.length,
            average: Math.round(avgUsage),
            details: usage,
        };
    }

    static getSystemInfo() {
        return {
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            hostname: os.hostname(),
            uptime: Math.round(os.uptime()), // seconds
            totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
            freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
            loadAverage: os.loadavg(),
        };
    }
}

// Middleware to track API response times
export const performanceMiddleware = (handler: Function) => {
    return async (...args: any[]) => {
        const start = performance.now();
        const monitor = PerformanceMonitor.getInstance();

        try {
            const result = await handler(...args);
            const duration = performance.now() - start;

            // Record metric
            monitor.record('api.response_time', duration);

            // Log slow requests
            if (duration > 1000) {
                logger.warn('Slow API request detected', {
                    duration: `${duration.toFixed(2)}ms`,
                    handler: handler.name || 'anonymous',
                });

                // Track in Sentry
                Sentry.captureMessage(`Slow API request: ${handler.name}`, {
                    level: 'warning',
                    extra: {
                        duration,
                        threshold: 1000,
                    },
                });
            }

            return result;
        } catch (error) {
            const duration = performance.now() - start;
            monitor.record('api.error_time', duration);

            logger.error('API request error', {
                duration: `${duration.toFixed(2)}ms`,
                error: error instanceof Error ? error.message : String(error),
            });

            throw error;
        }
    };
};

// Database query tracker
export class DatabaseMonitor {
    static async trackQuery<T>(
        operation: string,
        table: string,
        query: () => Promise<T>
    ): Promise<T> {
        const start = performance.now();
        const monitor = PerformanceMonitor.getInstance();

        try {
            const result = await query();
            const duration = performance.now() - start;

            // Record metric
            monitor.record(`db.${operation}.${table}`, duration);
            monitor.record('db.query_time', duration);

            // Log slow queries
            if (duration > 500) {
                logger.warn('Slow database query detected', {
                    operation,
                    table,
                    duration: `${duration.toFixed(2)}ms`,
                });

                // Track in Sentry
                Sentry.captureMessage(`Slow DB query: ${operation} on ${table}`, {
                    level: 'warning',
                    extra: {
                        duration,
                        threshold: 500,
                        operation,
                        table,
                    },
                });
            }

            return result;
        } catch (error) {
            const duration = performance.now() - start;

            logger.error('Database query error', {
                operation,
                table,
                duration: `${duration.toFixed(2)}ms`,
                error: error instanceof Error ? error.message : String(error),
            });

            // Track in Sentry
            Sentry.captureException(error, {
                tags: {
                    operation,
                    table,
                },
                extra: {
                    duration,
                },
            });

            throw error;
        }
    }
}

// Worker job tracker
export class WorkerMonitor {
    static async trackJob<T>(
        workerName: string,
        jobId: string,
        job: () => Promise<T>
    ): Promise<T> {
        const start = performance.now();
        const monitor = PerformanceMonitor.getInstance();

        try {
            const result = await job();
            const duration = performance.now() - start;

            // Record metric
            monitor.record(`worker.${workerName}.duration`, duration);
            monitor.record('worker.job_duration', duration);

            logger.info('Worker job completed', {
                workerName,
                jobId,
                duration: `${duration.toFixed(2)}ms`,
            });

            return result;
        } catch (error) {
            const duration = performance.now() - start;

            logger.error('Worker job failed', {
                workerName,
                jobId,
                duration: `${duration.toFixed(2)}ms`,
                error: error instanceof Error ? error.message : String(error),
            });

            // Track in Sentry
            Sentry.captureException(error, {
                tags: {
                    workerName,
                    jobId,
                },
                extra: {
                    duration,
                },
            });

            throw error;
        }
    }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
