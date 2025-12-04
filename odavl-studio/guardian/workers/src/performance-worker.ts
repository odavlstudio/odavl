/**
 * ODAVL Guardian - Performance Worker
 * Week 3 Day 1-3: Lighthouse Integration
 * 
 * Analyzes web performance using Lighthouse
 * Tracks Core Web Vitals, load times, bundle sizes
 */

import { Worker, Job, type JobProgress } from 'bullmq';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { RedisConnection } from './redis-connection.js';
import { Logger } from './logger.js';

interface PerformanceJobData {
    url: string;
    projectId: string;
    userId: string;
    options?: {
        formFactor?: 'mobile' | 'desktop';
        throttling?: 'mobile3G' | 'mobile4G' | 'none';
        categories?: string[];
    };
}

interface PerformanceResult {
    jobId: string;
    url: string;
    timestamp: string;
    scores: {
        performance: number;
        accessibility: number;
        bestPractices: number;
        seo: number;
        pwa: number;
    };
    metrics: {
        firstContentfulPaint: number;
        largestContentfulPaint: number;
        totalBlockingTime: number;
        cumulativeLayoutShift: number;
        speedIndex: number;
        timeToInteractive: number;
    };
    opportunities: Array<{
        id: string;
        title: string;
        description: string;
        score: number;
        savings: number;
    }>;
    diagnostics: Array<{
        id: string;
        title: string;
        description: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
    }>;
    resources: {
        totalSize: number;
        jsSize: number;
        cssSize: number;
        imageSize: number;
        fontSize: number;
        requests: number;
    };
}

export class PerformanceWorker {
    private worker: Worker;
    private logger: Logger;
    private connection: RedisConnection;

    constructor() {
        this.logger = new Logger('PerformanceWorker');
        this.connection = new RedisConnection();

        this.worker = new Worker(
            'guardian-performance',
            async (job: Job<PerformanceJobData>) => {
                return await this.processPerformanceJob(job);
            },
            {
                connection: this.connection.getConnection(),
                concurrency: 2, // Run 2 Lighthouse audits in parallel
                limiter: {
                    max: 10, // Max 10 jobs per minute
                    duration: 60000,
                },
            }
        );

        this.setupEventHandlers();
    }

    private async processPerformanceJob(job: Job<PerformanceJobData>): Promise<PerformanceResult> {
        const { url, projectId, userId, options = {} } = job.data;
        const jobId = job.id || 'unknown';

        this.logger.info(`Starting performance audit for ${url} (Job: ${jobId})`);
        await job.updateProgress(10);

        // Launch Chrome
        const chrome = await chromeLauncher.launch({
            chromeFlags: [
                '--headless',
                '--disable-gpu',
                '--no-sandbox',
                '--disable-dev-shm-usage',
            ],
        });

        try {
            await job.updateProgress(20);

            // Configure Lighthouse options
            const lighthouseOptions = {
                logLevel: 'error' as const,
                output: 'json' as const,
                port: chrome.port,
                onlyCategories: options.categories || [
                    'performance',
                    'accessibility',
                    'best-practices',
                    'seo',
                    'pwa',
                ],
                formFactor: options.formFactor || 'desktop',
                throttling:
                    options.throttling === 'mobile3G'
                        ? {
                              rttMs: 150,
                              throughputKbps: 1.6 * 1024,
                              requestLatencyMs: 150 * 3.75,
                              downloadThroughputKbps: 1.6 * 1024 * 0.9,
                              uploadThroughputKbps: 750 * 0.9,
                              cpuSlowdownMultiplier: 4,
                          }
                        : options.throttling === 'mobile4G'
                          ? {
                                rttMs: 40,
                                throughputKbps: 10 * 1024,
                                requestLatencyMs: 40 * 3.75,
                                downloadThroughputKbps: 10 * 1024 * 0.9,
                                uploadThroughputKbps: 10 * 1024 * 0.9,
                                cpuSlowdownMultiplier: 1,
                            }
                          : undefined,
            };

            await job.updateProgress(30);

            // Run Lighthouse audit
            const result = await lighthouse(url, lighthouseOptions);
            if (!result) {
                throw new Error('Lighthouse returned no results');
            }

            await job.updateProgress(70);

            // Parse Lighthouse results
            const lhr = result.lhr;
            const performanceResult: PerformanceResult = {
                jobId,
                url,
                timestamp: new Date().toISOString(),
                scores: {
                    performance: (lhr.categories.performance?.score || 0) * 100,
                    accessibility: (lhr.categories.accessibility?.score || 0) * 100,
                    bestPractices: (lhr.categories['best-practices']?.score || 0) * 100,
                    seo: (lhr.categories.seo?.score || 0) * 100,
                    pwa: (lhr.categories.pwa?.score || 0) * 100,
                },
                metrics: {
                    firstContentfulPaint:
                        lhr.audits['first-contentful-paint']?.numericValue || 0,
                    largestContentfulPaint:
                        lhr.audits['largest-contentful-paint']?.numericValue || 0,
                    totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue || 0,
                    cumulativeLayoutShift:
                        lhr.audits['cumulative-layout-shift']?.numericValue || 0,
                    speedIndex: lhr.audits['speed-index']?.numericValue || 0,
                    timeToInteractive: lhr.audits['interactive']?.numericValue || 0,
                },
                opportunities: this.extractOpportunities(lhr),
                diagnostics: this.extractDiagnostics(lhr),
                resources: this.extractResourceSummary(lhr),
            };

            await job.updateProgress(90);

            // Store results in Redis for 7 days
            await this.connection.storeResult(
                `performance:${projectId}:${userId}:${jobId}`,
                performanceResult,
                7 * 24 * 60 * 60
            );

            await job.updateProgress(100);

            this.logger.info(
                `Performance audit completed for ${url} - Score: ${performanceResult.scores.performance}/100`
            );

            return performanceResult;
        } catch (error) {
            this.logger.error(`Performance audit failed for ${url}:`, error);
            throw error;
        } finally {
            await chrome.kill();
        }
    }

    private extractOpportunities(lhr: any): PerformanceResult['opportunities'] {
        const opportunities: PerformanceResult['opportunities'] = [];

        const opportunityAudits = [
            'render-blocking-resources',
            'unused-css-rules',
            'unused-javascript',
            'modern-image-formats',
            'offscreen-images',
            'unminified-css',
            'unminified-javascript',
            'efficient-animated-content',
            'duplicated-javascript',
            'legacy-javascript',
        ];

        for (const auditId of opportunityAudits) {
            const audit = lhr.audits[auditId];
            if (audit && audit.score !== null && audit.score < 1) {
                opportunities.push({
                    id: auditId,
                    title: audit.title,
                    description: audit.description,
                    score: audit.score * 100,
                    savings: audit.numericValue || 0,
                });
            }
        }

        return opportunities.sort((a, b) => b.savings - a.savings).slice(0, 10);
    }

    private extractDiagnostics(lhr: any): PerformanceResult['diagnostics'] {
        const diagnostics: PerformanceResult['diagnostics'] = [];

        const diagnosticAudits = [
            'bootup-time',
            'mainthread-work-breakdown',
            'network-rtt',
            'network-server-latency',
            'dom-size',
            'critical-request-chains',
        ];

        for (const auditId of diagnosticAudits) {
            const audit = lhr.audits[auditId];
            if (audit && audit.score !== null && audit.score < 0.9) {
                let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
                if (audit.score < 0.5) severity = 'critical';
                else if (audit.score < 0.7) severity = 'high';
                else if (audit.score < 0.9) severity = 'medium';

                diagnostics.push({
                    id: auditId,
                    title: audit.title,
                    description: audit.description,
                    severity,
                });
            }
        }

        return diagnostics;
    }

    private extractResourceSummary(lhr: any): PerformanceResult['resources'] {
        const resourceAudit = lhr.audits['resource-summary'];
        const details = resourceAudit?.details?.items || [];

        const summary = {
            totalSize: 0,
            jsSize: 0,
            cssSize: 0,
            imageSize: 0,
            fontSize: 0,
            requests: 0,
        };

        for (const item of details) {
            const size = item.transferSize || 0;
            const requests = item.requestCount || 0;

            summary.requests += requests;

            switch (item.resourceType) {
                case 'script':
                    summary.jsSize += size;
                    break;
                case 'stylesheet':
                    summary.cssSize += size;
                    break;
                case 'image':
                    summary.imageSize += size;
                    break;
                case 'font':
                    summary.fontSize += size;
                    break;
            }

            summary.totalSize += size;
        }

        return summary;
    }

    private setupEventHandlers(): void {
        this.worker.on('completed', (job: Job, result: PerformanceResult) => {
            this.logger.info(`Job ${job.id} completed - URL: ${result.url}`);
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

        this.worker.on('stalled', (jobId: string) => {
            this.logger.warn(`Job ${jobId} stalled`);
        });
    }

    async start(): Promise<void> {
        this.logger.info('Performance Worker started - Listening for jobs...');
    }

    async stop(): Promise<void> {
        await this.worker.close();
        await this.connection.disconnect();
        this.logger.info('Performance Worker stopped');
    }
}

// Start worker if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const worker = new PerformanceWorker();
    await worker.start();

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('Shutting down Performance Worker...');
        await worker.stop();
        process.exit(0);
    });
}
