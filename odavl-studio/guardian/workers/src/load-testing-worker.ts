/**
 * ODAVL Guardian - Load Testing Worker
 * Week 4 Day 22-24: Load Testing & Performance Under Stress
 * 
 * Features:
 * - k6-based load testing (Go-powered HTTP load generator)
 * - 1000+ concurrent users simulation
 * - Response time percentiles (p50, p90, p95, p99)
 * - Error rate tracking
 * - Throughput analysis (RPS)
 * - Performance degradation detection
 */

import { Worker, Job, type JobProgress } from 'bullmq';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { RedisConnection } from './redis-connection.js';
import { Logger } from './logger.js';

interface LoadTestJobData {
    url: string;
    projectId: string;
    userId: string;
    options?: {
        virtualUsers?: number; // Default: 100
        duration?: string; // Default: '30s' (k6 duration format)
        rampUpTime?: string; // Default: '10s'
        thresholds?: {
            maxResponseTime?: number; // p95 threshold (ms)
            maxErrorRate?: number; // Error rate threshold (%)
            minRPS?: number; // Minimum requests per second
        };
    };
}

interface LoadTestResult {
    jobId: string;
    url: string;
    timestamp: string;
    score: number; // 0-100 (based on thresholds)
    summary: {
        virtualUsers: number;
        duration: string;
        totalRequests: number;
        requestsPerSecond: number;
        failedRequests: number;
        errorRate: number; // percentage
        dataTransferred: string;
    };
    responseTimes: {
        min: number;
        max: number;
        avg: number;
        med: number; // p50
        p90: number;
        p95: number;
        p99: number;
    };
    http: {
        successRate: number;
        statusCodes: Record<string, number>;
        requests: {
            total: number;
            failed: number;
            blocked: number;
        };
    };
    performance: {
        throughput: number; // requests/sec
        bandwidth: number; // bytes/sec
        connectionTime: {
            avg: number;
            max: number;
        };
    };
    thresholdsPassed: boolean;
    failedThresholds: string[];
}

export class LoadTestingWorker {
    private worker: Worker;
    private logger: Logger;
    private connection: RedisConnection;
    private k6ScriptsDir: string;

    constructor() {
        this.logger = new Logger('LoadTestingWorker');
        this.connection = new RedisConnection();
        this.k6ScriptsDir = path.join(process.cwd(), '.odavl', 'k6-scripts');

        this.worker = new Worker(
            'guardian-load-test',
            async (job: Job<LoadTestJobData>) => {
                return await this.processLoadTestJob(job);
            },
            {
                connection: this.connection.getConnection(),
                concurrency: 2, // Limit concurrent load tests
                limiter: {
                    max: 5,
                    duration: 60000, // Max 5 tests per minute
                },
            }
        );

        this.setupEventHandlers();
        this.ensureScriptsDirExists();
    }

    private async ensureScriptsDirExists(): Promise<void> {
        try {
            await fs.mkdir(this.k6ScriptsDir, { recursive: true });
        } catch {
            // Directory exists
        }
    }

    private async processLoadTestJob(job: Job<LoadTestJobData>): Promise<LoadTestResult> {
        const { url, projectId, userId, options = {} } = job.data;
        const jobId = job.id || 'unknown';

        const virtualUsers = options.virtualUsers || 100;
        const duration = options.duration || '30s';
        const rampUpTime = options.rampUpTime || '10s';

        this.logger.info(
            `Starting load test: ${url} (VUs: ${virtualUsers}, Duration: ${duration}, Job: ${jobId})`
        );

        await job.updateProgress(5);

        // Generate k6 script
        const scriptPath = await this.generateK6Script(url, virtualUsers, duration, rampUpTime, options);

        await job.updateProgress(15);

        // Execute k6
        let k6Output: string;
        try {
            this.logger.info(`Executing k6 script: ${scriptPath}`);
            k6Output = execSync(`k6 run --out json=${scriptPath}.json ${scriptPath}`, {
                encoding: 'utf-8',
                maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            });
        } catch (error: any) {
            // k6 exits with non-zero if thresholds fail, but output is still valid
            k6Output = error.stdout || '';
            this.logger.warn(`k6 exited with non-zero (thresholds may have failed): ${error.message}`);
        }

        await job.updateProgress(85);

        // Parse k6 JSON output
        const jsonOutputPath = `${scriptPath}.json`;
        const metrics = await this.parseK6JsonOutput(jsonOutputPath);

        await job.updateProgress(95);

        // Build result
        const result: LoadTestResult = {
            jobId,
            url,
            timestamp: new Date().toISOString(),
            score: this.calculateScore(metrics, options),
            summary: {
                virtualUsers,
                duration,
                totalRequests: metrics.http_reqs || 0,
                requestsPerSecond: metrics.http_reqs / this.parseDuration(duration),
                failedRequests: metrics.http_req_failed || 0,
                errorRate: ((metrics.http_req_failed || 0) / (metrics.http_reqs || 1)) * 100,
                dataTransferred: this.formatBytes(metrics.data_received || 0),
            },
            responseTimes: {
                min: metrics.http_req_duration_min || 0,
                max: metrics.http_req_duration_max || 0,
                avg: metrics.http_req_duration_avg || 0,
                med: metrics.http_req_duration_med || 0,
                p90: metrics['http_req_duration{p(90)}'] || 0,
                p95: metrics['http_req_duration{p(95)}'] || 0,
                p99: metrics['http_req_duration{p(99)}'] || 0,
            },
            http: {
                successRate:
                    100 - ((metrics.http_req_failed || 0) / (metrics.http_reqs || 1)) * 100,
                statusCodes: metrics.http_req_status_codes || {},
                requests: {
                    total: metrics.http_reqs || 0,
                    failed: metrics.http_req_failed || 0,
                    blocked: metrics.http_req_blocked || 0,
                },
            },
            performance: {
                throughput: metrics.http_reqs / this.parseDuration(duration),
                bandwidth: metrics.data_received / this.parseDuration(duration),
                connectionTime: {
                    avg: metrics.http_req_connecting_avg || 0,
                    max: metrics.http_req_connecting_max || 0,
                },
            },
            thresholdsPassed: this.checkThresholds(metrics, options),
            failedThresholds: this.getFailedThresholds(metrics, options),
        };

        // Store results
        await this.connection.storeResult(
            `load-test:${projectId}:${userId}:${jobId}`,
            result,
            30 * 24 * 60 * 60 // 30 days
        );

        await job.updateProgress(100);

        this.logger.info(
            `Load test completed: ${url} - Score: ${result.score}/100, RPS: ${result.summary.requestsPerSecond.toFixed(2)}, Error Rate: ${result.summary.errorRate.toFixed(2)}%`
        );

        return result;
    }

    private async generateK6Script(
        url: string,
        virtualUsers: number,
        duration: string,
        rampUpTime: string,
        options: LoadTestJobData['options']
    ): Promise<string> {
        const thresholds = options?.thresholds || {};

        const script = `
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
    stages: [
        { duration: '${rampUpTime}', target: ${virtualUsers} }, // Ramp up
        { duration: '${duration}', target: ${virtualUsers} }, // Stay at peak
        { duration: '${rampUpTime}', target: 0 }, // Ramp down
    ],
    thresholds: {
        'http_req_duration': ['p(95)<${thresholds.maxResponseTime || 500}'],
        'errors': ['rate<${(thresholds.maxErrorRate || 5) / 100}'],
        'http_reqs': ['rate>${thresholds.minRPS || 10}'],
    },
};

export default function () {
    const res = http.get('${url}');
    
    const checkRes = check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < ${thresholds.maxResponseTime || 500}ms': (r) => r.timings.duration < ${thresholds.maxResponseTime || 500},
    });
    
    errorRate.add(!checkRes);
    
    sleep(1);
}
`;

        const scriptPath = path.join(
            this.k6ScriptsDir,
            `load-test-${Date.now()}.js`
        );
        await fs.writeFile(scriptPath, script, 'utf-8');

        return scriptPath;
    }

    private async parseK6JsonOutput(jsonPath: string): Promise<Record<string, any>> {
        try {
            const content = await fs.readFile(jsonPath, 'utf-8');
            const lines = content.trim().split('\n');

            const metrics: Record<string, any> = {
                http_req_status_codes: {},
            };

            // Parse JSON lines (k6 outputs newline-delimited JSON)
            for (const line of lines) {
                if (!line.trim()) continue;

                try {
                    const data = JSON.parse(line);

                    if (data.type === 'Metric') {
                        const metricName = data.data.name;
                        const metricData = data.data;

                        if (metricData.type === 'counter') {
                            metrics[metricName] = metricData.value;
                        } else if (metricData.type === 'trend') {
                            metrics[`${metricName}_min`] = metricData.min;
                            metrics[`${metricName}_max`] = metricData.max;
                            metrics[`${metricName}_avg`] = metricData.avg;
                            metrics[`${metricName}_med`] = metricData.med;
                            metrics[`${metricName}{p(90)}`] = metricData['p(90)'];
                            metrics[`${metricName}{p(95)}`] = metricData['p(95)'];
                            metrics[`${metricName}{p(99)}`] = metricData['p(99)'];
                        } else if (metricData.type === 'rate') {
                            metrics[metricName] = metricData.rate;
                        }
                    } else if (data.type === 'Point' && data.metric === 'http_req_status') {
                        const status = data.data.tags.status;
                        metrics.http_req_status_codes[status] = (metrics.http_req_status_codes[status] || 0) + 1;
                    }
                } catch {
                    // Skip invalid JSON lines
                }
            }

            return metrics;
        } catch (error) {
            this.logger.error(`Failed to parse k6 JSON output: ${error}`);
            return {};
        }
    }

    private parseDuration(duration: string): number {
        const match = duration.match(/^(\d+)([smh])$/);
        if (!match) return 30; // Default 30 seconds

        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 3600;
            default:
                return 30;
        }
    }

    private formatBytes(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    private checkThresholds(
        metrics: Record<string, any>,
        thresholds?: LoadTestJobData['options']
    ): boolean {
        if (!thresholds?.thresholds) return true;

        const p95 = metrics['http_req_duration{p(95)}'] || 0;
        const errorRate = ((metrics.http_req_failed || 0) / (metrics.http_reqs || 1)) * 100;
        const rps = metrics.http_reqs / this.parseDuration('30s');

        const checks = [
            !thresholds.thresholds?.maxResponseTime || p95 <= thresholds.thresholds.maxResponseTime,
            !thresholds.thresholds?.maxErrorRate || errorRate <= thresholds.thresholds.maxErrorRate,
            !thresholds.thresholds?.minRPS || rps >= thresholds.thresholds.minRPS,
        ];

        return checks.every(Boolean);
    }

    private getFailedThresholds(
        metrics: Record<string, any>,
        thresholds?: LoadTestJobData['options']
    ): string[] {
        if (!thresholds?.thresholds) return [];

        const failed: string[] = [];
        const p95 = metrics['http_req_duration{p(95)}'] || 0;
        const errorRate = ((metrics.http_req_failed || 0) / (metrics.http_reqs || 1)) * 100;
        const rps = metrics.http_reqs / this.parseDuration('30s');

        if (thresholds.thresholds?.maxResponseTime && p95 > thresholds.thresholds.maxResponseTime) {
            failed.push(`p95 response time exceeded: ${p95.toFixed(2)}ms > ${thresholds.thresholds.maxResponseTime}ms`);
        }
        if (thresholds.thresholds?.maxErrorRate && errorRate > thresholds.thresholds.maxErrorRate) {
            failed.push(`Error rate exceeded: ${errorRate.toFixed(2)}% > ${thresholds.thresholds.maxErrorRate}%`);
        }
        if (thresholds.thresholds?.minRPS && rps < thresholds.thresholds.minRPS) {
            failed.push(`RPS below minimum: ${rps.toFixed(2)} < ${thresholds.thresholds.minRPS}`);
        }

        return failed;
    }

    private calculateScore(
        metrics: Record<string, any>,
        thresholds?: LoadTestJobData['options']
    ): number {
        let score = 100;

        const p95 = metrics['http_req_duration{p(95)}'] || 0;
        const errorRate = ((metrics.http_req_failed || 0) / (metrics.http_reqs || 1)) * 100;

        // Deduct for high response times
        if (p95 > 200) score -= 10;
        if (p95 > 500) score -= 15;
        if (p95 > 1000) score -= 25;

        // Deduct for error rate
        if (errorRate > 1) score -= 10;
        if (errorRate > 5) score -= 20;
        if (errorRate > 10) score -= 30;

        // Deduct for failed thresholds
        if (thresholds) {
            const failedCount = this.getFailedThresholds(metrics, thresholds).length;
            score -= failedCount * 15;
        }

        return Math.max(0, Math.min(100, score));
    }

    private setupEventHandlers(): void {
        this.worker.on('completed', (job: Job, result: LoadTestResult) => {
            this.logger.info(
                `Job ${job.id} completed - URL: ${result.url}, Score: ${result.score}/100, RPS: ${result.summary.requestsPerSecond.toFixed(2)}`
            );
        });

        this.worker.on('failed', (job: Job | undefined, error: Error) => {
            this.logger.error(`Job ${job?.id} failed:`, error.message);
        });

        this.worker.on('progress', (job: Job, progress: JobProgress) => {
            this.logger.debug(`Job ${job.id} progress: ${progress}%`);
        });

        this.worker.on('error', (error: Error) => {
            this.logger.error('Worker error:', error);
        });
    }

    async start(): Promise<void> {
        this.logger.info('Load Testing Worker started - Listening for jobs...');
    }

    async stop(): Promise<void> {
        await this.worker.close();
        await this.connection.disconnect();
        this.logger.info('Load Testing Worker stopped');
    }
}

// Start worker if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const worker = new LoadTestingWorker();
    await worker.start();

    process.on('SIGINT', async () => {
        console.log('Shutting down Load Testing Worker...');
        await worker.stop();
        process.exit(0);
    });
}
