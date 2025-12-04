import { Worker } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { emitTestUpdate } from '@/lib/socket';
import logger, { logWorker, logError } from '@/lib/logger';
import { E2ERunner } from '@/services/testing/e2e-runner';
import { VisualRegressionRunner } from '@/services/testing/visual-runner';
import { A11yRunner } from '@/services/testing/a11y-runner';
import { I18nRunner } from '@/services/testing/i18n-runner';
import { PerformanceRunner } from '@/services/testing/performance-runner';
import type {
    E2ETestConfig,
    VisualTestConfig,
    A11yTestConfig,
    I18nTestConfig,
    PerformanceTestConfig
} from '@/types/test-config';

interface TestJobData {
    testRunId: string;
    type: 'e2e' | 'visual' | 'a11y' | 'i18n' | 'performance';
    config: E2ETestConfig[] | VisualTestConfig[] | A11yTestConfig[] | I18nTestConfig[] | PerformanceTestConfig[];
}

export class TestWorker {
    private worker: Worker | null = null;
    private runners = {
        e2e: new E2ERunner(),
        visual: new VisualRegressionRunner(),
        a11y: new A11yRunner(),
        i18n: new I18nRunner(),
        performance: new PerformanceRunner()
    };

    async start(): Promise<void> {
        const connection = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD
        };

        this.worker = new Worker<TestJobData>(
            'testQueue',
            async (job) => {
                const startTime = Date.now();
                logger.info(`Processing test job ${job.id} (${job.data.type})`);

                try {
                    await this.processTestJob(job.data);

                    logWorker({
                        name: 'test-worker',
                        jobId: job.id || 'unknown',
                        status: 'completed',
                        duration: Date.now() - startTime
                    });
                } catch (error) {
                    logWorker({
                        name: 'test-worker',
                        jobId: job.id || 'unknown',
                        status: 'failed',
                        duration: Date.now() - startTime,
                        error: error instanceof Error ? error : new Error(String(error))
                    });
                    throw error;
                }
            },
            {
                connection,
                concurrency: 3, // Process up to 3 tests concurrently
                limiter: {
                    max: 10, // Max 10 jobs per duration
                    duration: 60000 // 1 minute
                }
            }
        );

        this.worker.on('completed', (job) => {
            logger.info(`Test job ${job.id} completed successfully`);
        });

        this.worker.on('failed', (job, err) => {
            logError(err, {
                jobId: job?.id,
                workerName: 'test-worker'
            });
        });

        this.worker.on('error', (err) => {
            logError(err, {
                workerName: 'test-worker',
                context: 'worker-error'
            });
        });

        logger.info('Test worker started and listening for jobs');
    }

    private async processTestJob(data: TestJobData): Promise<void> {
        const { testRunId, type, config } = data;

        try {
            // Update test run status
            await this.updateTestRunStatus(testRunId, 'running');

            // Route to appropriate runner
            switch (type) {
                case 'e2e':
                    await this.runners.e2e.run(testRunId, config as E2ETestConfig[]);
                    break;

                case 'visual':
                    await this.runners.visual.run(testRunId, config as VisualTestConfig[]);
                    break;

                case 'a11y':
                    await this.runners.a11y.run(testRunId, config as A11yTestConfig[]);
                    break;

                case 'i18n':
                    await this.runners.i18n.run(testRunId, config as I18nTestConfig[]);
                    break;

                case 'performance':
                    await this.runners.performance.run(testRunId, config as PerformanceTestConfig[]);
                    break;

                default:
                    throw new Error(`Unknown test type: ${type}`);
            }

            console.log(`[test-worker] Test run ${testRunId} (${type}) completed`);
        } catch (error) {
            logError(
                error instanceof Error ? error : new Error(String(error)),
                {
                    testRunId,
                    testType: type,
                    workerName: 'test-worker'
                }
            );

            // Update test run with error
            await this.updateTestRunStatus(testRunId, 'failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            throw error; // Re-throw to mark job as failed
        }
    }

    private async updateTestRunStatus(
        testRunId: string,
        status: string,
        data?: { error?: string }
    ): Promise<void> {
        const testRun = await prisma.testRun.update({
            where: { id: testRunId },
            data: {
                status,
                ...(status === 'running' && { startedAt: new Date() }),
                ...(status === 'failed' && {
                    completedAt: new Date(),
                    results: data as never
                })
            },
            include: { project: true }
        });

        emitTestUpdate(testRun.projectId, testRun);
    }

    async stop(): Promise<void> {
        if (this.worker) {
            await this.worker.close();
            logger.info('Test worker stopped');
        }

        // Cleanup all runners
        await Promise.all([
            this.runners.e2e.cleanup(),
            this.runners.visual.cleanup(),
            this.runners.a11y.cleanup(),
            this.runners.i18n.cleanup(),
            this.runners.performance.cleanup()
        ]);
    }
}

// Start worker if run directly
if (require.main === module) {
    const worker = new TestWorker();

    (async () => {
        try {
            await worker.start();
        } catch (error) {
            logError(
                error instanceof Error ? error : new Error(String(error)),
                { workerName: 'test-worker', context: 'startup' }
            );
            process.exit(1);
        }
    })();

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        logger.info('Test worker received SIGTERM, shutting down...');
        await worker.stop();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        logger.info('Test worker received SIGINT, shutting down...');
        await worker.stop();
        process.exit(0);
    });
}

export default TestWorker;
