/**
 * ODAVL Guardian - Visual Regression Worker
 * Week 4 Day 25-28: Visual Testing & CSS Breakage Detection
 * 
 * Playwright-based visual regression testing:
 * - Screenshot capture across viewports
 * - Pixel-perfect comparison (pixelmatch)
 * - CSS breakage detection
 * - Visual diff reporting
 * - Baseline management
 */

import { Worker, Job, type JobProgress } from 'bullmq';
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { RedisConnection } from './redis-connection.js';
import { Logger } from './logger.js';

interface VisualRegressionJobData {
    url: string;
    projectId: string;
    userId: string;
    baselineId?: string; // Optional: Compare against specific baseline
    options?: {
        viewports?: Array<{ width: number; height: number; name: string }>;
        threshold?: number; // Pixel difference threshold (0-1, default: 0.1)
        fullPage?: boolean; // Capture full page or viewport only
        waitForSelector?: string; // Wait for element before capturing
        blocklist?: string[]; // CSS selectors to hide before capture (e.g., ads, timestamps)
    };
}

interface VisualRegressionResult {
    jobId: string;
    url: string;
    timestamp: string;
    hasBaseline: boolean;
    passed: boolean; // True if all viewports pass threshold
    score: number; // 0-100 (100 = perfect match or new baseline)
    viewports: Array<{
        name: string;
        width: number;
        height: number;
        diffPixels: number;
        diffPercentage: number;
        passed: boolean;
        screenshots: {
            current: string; // Path relative to .odavl/visual-regression/
            baseline?: string;
            diff?: string;
        };
    }>;
    summary: {
        totalDiffPixels: number;
        avgDiffPercentage: number;
        maxDiffPercentage: number;
        viewportsTested: number;
        viewportsPassed: number;
        viewportsFailed: number;
    };
    issues: Array<{
        viewport: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        message: string;
        recommendation: string;
    }>;
}

export class VisualRegressionWorker {
    private worker: Worker;
    private logger: Logger;
    private connection: RedisConnection;
    private screenshotsDir: string;
    private baselinesDir: string;
    private diffsDir: string;

    constructor() {
        this.logger = new Logger('VisualRegressionWorker');
        this.connection = new RedisConnection();

        const baseDir = path.join(process.cwd(), '.odavl', 'visual-regression');
        this.screenshotsDir = path.join(baseDir, 'current');
        this.baselinesDir = path.join(baseDir, 'baselines');
        this.diffsDir = path.join(baseDir, 'diffs');

        this.worker = new Worker(
            'guardian-visual-regression',
            async (job: Job<VisualRegressionJobData>) => {
                return await this.processVisualRegressionJob(job);
            },
            {
                connection: this.connection.getConnection(),
                concurrency: 3, // Limited for browser resources
                limiter: {
                    max: 20,
                    duration: 60000, // Max 20 tests per minute
                },
            }
        );

        this.setupEventHandlers();
    }

    private async processVisualRegressionJob(
        job: Job<VisualRegressionJobData>
    ): Promise<VisualRegressionResult> {
        const { url, projectId, userId, baselineId, options = {} } = job.data;
        const jobId = job.id || 'unknown';

        this.logger.info(`Starting visual regression test for ${url} (Job: ${jobId})`);
        await job.updateProgress(5);

        const viewports = options.viewports || [
            { width: 1920, height: 1080, name: 'desktop' },
            { width: 768, height: 1024, name: 'tablet' },
            { width: 375, height: 667, name: 'mobile' },
        ];

        const threshold = options.threshold || 0.1; // 10% difference allowed

        const result: VisualRegressionResult = {
            jobId,
            url,
            timestamp: new Date().toISOString(),
            hasBaseline: false,
            passed: true,
            score: 100,
            viewports: [],
            summary: {
                totalDiffPixels: 0,
                avgDiffPercentage: 0,
                maxDiffPercentage: 0,
                viewportsTested: 0,
                viewportsPassed: 0,
                viewportsFailed: 0,
            },
            issues: [],
        };

        let browser: Browser | null = null;

        try {
            // Ensure directories exist
            await this.ensureDirectories();

            await job.updateProgress(10);

            // Launch browser
            browser = await chromium.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });

            await job.updateProgress(15);

            // Test each viewport
            for (let i = 0; i < viewports.length; i++) {
                const viewport = viewports[i];
                const progressStart = 15 + (i / viewports.length) * 65;
                const progressEnd = 15 + ((i + 1) / viewports.length) * 65;

                await job.updateProgress(progressStart);

                this.logger.info(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`);

                const viewportResult = await this.testViewport(
                    browser,
                    url,
                    viewport,
                    projectId,
                    userId,
                    jobId,
                    baselineId,
                    threshold,
                    options
                );

                result.viewports.push(viewportResult);
                result.summary.viewportsTested++;

                if (viewportResult.passed) {
                    result.summary.viewportsPassed++;
                } else {
                    result.summary.viewportsFailed++;
                    result.passed = false;
                }

                result.summary.totalDiffPixels += viewportResult.diffPixels;
                result.summary.maxDiffPercentage = Math.max(
                    result.summary.maxDiffPercentage,
                    viewportResult.diffPercentage
                );

                await job.updateProgress(progressEnd);
            }

            // Calculate average
            result.summary.avgDiffPercentage =
                result.summary.totalDiffPixels /
                (result.viewports.reduce((sum, v) => sum + v.width * v.height, 0) || 1);

            // Calculate score
            result.score = this.calculateScore(result);

            // Check if baseline exists
            result.hasBaseline = result.viewports.some((v) => v.screenshots.baseline !== undefined);

            await job.updateProgress(85);

            // Generate issues
            this.generateIssues(result);

            await job.updateProgress(90);

            // Store results
            await this.connection.storeResult(
                `visual-regression:${projectId}:${userId}:${jobId}`,
                result,
                30 * 24 * 60 * 60 // 30 days
            );

            await job.updateProgress(100);

            this.logger.info(
                `Visual regression test completed for ${url} - ` +
                `${result.summary.viewportsPassed}/${result.summary.viewportsTested} passed, ` +
                `avg diff: ${result.summary.avgDiffPercentage.toFixed(2)}%`
            );

            return result;
        } catch (error) {
            this.logger.error(`Visual regression test failed for ${url}:`, error);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    private async testViewport(
        browser: Browser,
        url: string,
        viewport: { width: number; height: number; name: string },
        projectId: string,
        userId: string,
        jobId: string,
        baselineId: string | undefined,
        threshold: number,
        options: VisualRegressionJobData['options']
    ): Promise<VisualRegressionResult['viewports'][number]> {
        const page = await browser.newPage({
            viewport: { width: viewport.width, height: viewport.height },
        });

        try {
            // Navigate to URL
            await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: 30000,
            });

            // Wait for specific selector if provided
            if (options?.waitForSelector) {
                await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
            }

            // Hide blocklisted elements (e.g., timestamps, ads)
            if (options?.blocklist && options.blocklist.length > 0) {
                await page.evaluate((selectors) => {
                    selectors.forEach((selector) => {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach((el) => {
                            (el as HTMLElement).style.visibility = 'hidden';
                        });
                    });
                }, options.blocklist);
            }

            // Capture current screenshot
            const timestamp = Date.now();
            const screenshotFilename = `${projectId}-${viewport.name}-${timestamp}.png`;
            const screenshotPath = path.join(this.screenshotsDir, screenshotFilename);

            await page.screenshot({
                path: screenshotPath,
                fullPage: options?.fullPage !== false,
            });

            // Find baseline
            const baselinePath = await this.findBaseline(
                projectId,
                userId,
                viewport.name,
                baselineId
            );

            let diffPixels = 0;
            let diffPercentage = 0;
            let passed = true;
            let diffPath: string | undefined;

            if (baselinePath) {
                // Compare with baseline
                const comparison = await this.compareScreenshots(
                    baselinePath,
                    screenshotPath,
                    viewport.name,
                    timestamp
                );

                diffPixels = comparison.diffPixels;
                diffPercentage = comparison.diffPercentage;
                diffPath = comparison.diffPath;
                passed = diffPercentage <= threshold;
            } else {
                // No baseline - this becomes the baseline
                await this.saveBaseline(screenshotPath, projectId, userId, viewport.name);
            }

            return {
                name: viewport.name,
                width: viewport.width,
                height: viewport.height,
                diffPixels,
                diffPercentage,
                passed,
                screenshots: {
                    current: path.relative(
                        path.join(process.cwd(), '.odavl'),
                        screenshotPath
                    ),
                    baseline: baselinePath
                        ? path.relative(path.join(process.cwd(), '.odavl'), baselinePath)
                        : undefined,
                    diff: diffPath
                        ? path.relative(path.join(process.cwd(), '.odavl'), diffPath)
                        : undefined,
                },
            };
        } finally {
            await page.close();
        }
    }

    private async findBaseline(
        projectId: string,
        userId: string,
        viewportName: string,
        baselineId?: string
    ): Promise<string | null> {
        try {
            if (baselineId) {
                // Look for specific baseline
                const specificPath = path.join(
                    this.baselinesDir,
                    `${projectId}-${viewportName}-${baselineId}.png`
                );
                await fs.access(specificPath);
                return specificPath;
            }

            // Find latest baseline
            const files = await fs.readdir(this.baselinesDir);
            const pattern = `${projectId}-${viewportName}-`;
            const matchingFiles = files
                .filter((f) => f.startsWith(pattern))
                .sort()
                .reverse();

            if (matchingFiles.length > 0) {
                return path.join(this.baselinesDir, matchingFiles[0]);
            }

            return null;
        } catch {
            return null;
        }
    }

    private async saveBaseline(
        screenshotPath: string,
        projectId: string,
        userId: string,
        viewportName: string
    ): Promise<void> {
        const baselineFilename = `${projectId}-${viewportName}-baseline.png`;
        const baselinePath = path.join(this.baselinesDir, baselineFilename);
        await fs.copyFile(screenshotPath, baselinePath);
        this.logger.info(`Saved new baseline: ${baselineFilename}`);
    }

    private async compareScreenshots(
        baselinePath: string,
        currentPath: string,
        viewportName: string,
        timestamp: number
    ): Promise<{ diffPixels: number; diffPercentage: number; diffPath: string }> {
        // Read images
        const baseline = PNG.sync.read(await fs.readFile(baselinePath));
        const current = PNG.sync.read(await fs.readFile(currentPath));

        // Ensure same dimensions
        if (baseline.width !== current.width || baseline.height !== current.height) {
            throw new Error(
                `Screenshot dimensions mismatch: baseline ${baseline.width}x${baseline.height}, ` +
                `current ${current.width}x${current.height}`
            );
        }

        // Create diff image
        const diff = new PNG({ width: baseline.width, height: baseline.height });

        // Compare pixels
        const diffPixels = pixelmatch(
            baseline.data,
            current.data,
            diff.data,
            baseline.width,
            baseline.height,
            { threshold: 0.1 } // Sensitivity
        );

        const totalPixels = baseline.width * baseline.height;
        const diffPercentage = (diffPixels / totalPixels) * 100;

        // Save diff image
        const diffFilename = `diff-${viewportName}-${timestamp}.png`;
        const diffPath = path.join(this.diffsDir, diffFilename);
        await fs.writeFile(diffPath, PNG.sync.write(diff));

        return { diffPixels, diffPercentage, diffPath };
    }

    private calculateScore(result: VisualRegressionResult): number {
        if (!result.hasBaseline) {
            return 100; // New baseline, no comparison
        }

        // Score based on average diff percentage
        const avgDiff = result.summary.avgDiffPercentage;
        if (avgDiff === 0) return 100;
        if (avgDiff < 0.5) return 95;
        if (avgDiff < 1) return 90;
        if (avgDiff < 2) return 80;
        if (avgDiff < 5) return 70;
        if (avgDiff < 10) return 50;
        return Math.max(0, 50 - avgDiff * 2);
    }

    private generateIssues(result: VisualRegressionResult): void {
        result.viewports.forEach((viewport) => {
            if (!viewport.passed) {
                const severity =
                    viewport.diffPercentage > 20
                        ? 'critical'
                        : viewport.diffPercentage > 10
                        ? 'high'
                        : viewport.diffPercentage > 5
                        ? 'medium'
                        : 'low';

                result.issues.push({
                    viewport: viewport.name,
                    severity,
                    message: `Visual regression detected: ${viewport.diffPercentage.toFixed(2)}% difference (${viewport.diffPixels} pixels)`,
                    recommendation:
                        severity === 'critical'
                            ? 'Critical visual changes detected. Review diff image and update baseline if intentional.'
                            : 'Visual changes detected. Verify if intentional and update baseline accordingly.',
                });
            }
        });
    }

    private async ensureDirectories(): Promise<void> {
        await fs.mkdir(this.screenshotsDir, { recursive: true });
        await fs.mkdir(this.baselinesDir, { recursive: true });
        await fs.mkdir(this.diffsDir, { recursive: true });
    }

    private setupEventHandlers(): void {
        this.worker.on('completed', (job: Job, result: VisualRegressionResult) => {
            this.logger.info(
                `Job ${job.id} completed - ${result.summary.viewportsPassed}/${result.summary.viewportsTested} passed, ` +
                `score: ${result.score}/100`
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
        await this.ensureDirectories();
        this.logger.info('Visual Regression Worker started - Listening for jobs...');
    }

    async stop(): Promise<void> {
        await this.worker.close();
        await this.connection.disconnect();
        this.logger.info('Visual Regression Worker stopped');
    }
}

// Start worker if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const worker = new VisualRegressionWorker();
    await worker.start();

    process.on('SIGINT', async () => {
        console.log('Shutting down Visual Regression Worker...');
        await worker.stop();
        process.exit(0);
    });
}
