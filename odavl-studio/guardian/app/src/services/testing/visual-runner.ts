import { chromium, Browser, Page } from 'playwright';
import { prisma } from '@/lib/prisma';
import { emitTestUpdate } from '@/lib/socket';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import type { VisualTestConfig, VisualDiffResult } from '@/types/test-config';

export class VisualRegressionRunner {
    private browser: Browser | null = null;
    private readonly baselineDir = join(process.cwd(), '.guardian', 'visual-baselines');
    private readonly currentDir = join(process.cwd(), '.guardian', 'visual-current');
    private readonly diffDir = join(process.cwd(), '.guardian', 'visual-diffs');

    constructor() {
        // Ensure directories exist
        [this.baselineDir, this.currentDir, this.diffDir].forEach(dir => {
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
        });
    }

    async initialize(): Promise<void> {
        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async run(testRunId: string, tests: VisualTestConfig[]): Promise<void> {
        const startTime = Date.now();

        try {
            await this.updateStatus(testRunId, 'running');

            if (!this.browser) {
                await this.initialize();
            }

            const context = await this.browser!.newContext({
                viewport: { width: 1920, height: 1080 }
            });

            const results: VisualDiffResult[] = [];

            for (const test of tests) {
                const page = await context.newPage();
                const result = await this.runVisualTest(page, test);
                results.push(result);
                await page.close();
            }

            await context.close();

            const duration = Date.now() - startTime;
            const passedCount = results.filter(r => r.match).length;
            const failedCount = results.filter(r => !r.match).length;

            await this.completeTestRun(testRunId, {
                status: failedCount === 0 ? 'passed' : 'failed',
                duration,
                results,
                passedCount,
                failedCount
            });
        } catch (error) {
            await this.failTestRun(testRunId, error);
        }
    }

    private async runVisualTest(page: Page, test: VisualTestConfig): Promise<VisualDiffResult> {
        try {
            await page.goto(test.url, { waitUntil: 'networkidle' });

            // Wait for any animations to complete
            await page.waitForTimeout(1000);

            const testName = this.sanitizeTestName(test.name);
            const baselinePath = join(this.baselineDir, `${testName}.png`);
            const currentPath = join(this.currentDir, `${testName}.png`);
            const diffPath = join(this.diffDir, `${testName}-diff.png`);

            // Capture current screenshot
            if (test.selectors && test.selectors.length > 0) {
                // Capture specific elements
                await this.captureElements(page, test.selectors, currentPath);
            } else {
                // Capture full page
                await page.screenshot({
                    path: currentPath,
                    fullPage: test.fullPage !== false
                });
            }

            // Check if baseline exists
            if (!existsSync(baselinePath)) {
                // First run: save as baseline
                writeFileSync(baselinePath, readFileSync(currentPath));
                return {
                    testName: test.name,
                    match: true,
                    pixelDifference: 0,
                    diffPercentage: 0,
                    baselinePath,
                    currentPath
                };
            }

            // Compare with baseline
            const diffResult = await this.compareImages(
                baselinePath,
                currentPath,
                diffPath,
                test.threshold || 0.1
            );

            return {
                testName: test.name,
                match: diffResult.match,
                pixelDifference: diffResult.pixelDifference,
                diffPercentage: diffResult.diffPercentage,
                baselinePath,
                currentPath,
                diffPath: diffResult.match ? undefined : diffPath
            };
        } catch (error) {
            throw new Error(
                `Visual test failed for ${test.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    private async captureElements(page: Page, selectors: string[], outputPath: string): Promise<void> {
        // Capture first matching element
        const element = await page.$(selectors[0]);
        if (!element) {
            throw new Error(`Element not found: ${selectors[0]}`);
        }

        await element.screenshot({ path: outputPath });
    }

    private async compareImages(
        baselinePath: string,
        currentPath: string,
        diffPath: string,
        threshold: number
    ): Promise<{ match: boolean; pixelDifference: number; diffPercentage: number }> {
        const baseline = PNG.sync.read(readFileSync(baselinePath));
        const current = PNG.sync.read(readFileSync(currentPath));

        const { width, height } = baseline;

        if (current.width !== width || current.height !== height) {
            throw new Error(
                `Image dimensions mismatch: baseline (${width}x${height}) ` +
                `vs current (${current.width}x${current.height})`
            );
        }

        const diff = new PNG({ width, height });

        const pixelDifference = pixelmatch(
            baseline.data,
            current.data,
            diff.data,
            width,
            height,
            { threshold }
        );

        const totalPixels = width * height;
        const diffPercentage = (pixelDifference / totalPixels) * 100;

        // Save diff image if there are differences
        if (pixelDifference > 0) {
            writeFileSync(diffPath, PNG.sync.write(diff));
        }

        return {
            match: pixelDifference === 0,
            pixelDifference,
            diffPercentage
        };
    }

    private sanitizeTestName(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    private async updateStatus(testRunId: string, status: string): Promise<void> {
        const testRun = await prisma.testRun.update({
            where: { id: testRunId },
            data: { status },
            include: { project: true }
        });

        emitTestUpdate(testRun.projectId, testRun);
    }

    private async completeTestRun(
        testRunId: string,
        data: {
            status: string;
            duration: number;
            results: VisualDiffResult[];
            passedCount: number;
            failedCount: number;
        }
    ): Promise<void> {
        const testRun = await prisma.testRun.update({
            where: { id: testRunId },
            data: {
                status: data.status,
                completedAt: new Date(),
                duration: data.duration,
                results: data.results as never,
                passedCount: data.passedCount,
                failedCount: data.failedCount
            },
            include: { project: true }
        });

        emitTestUpdate(testRun.projectId, testRun);
        console.log(`[Visual] Test run ${testRunId} completed: ${data.status}`);
    }

    private async failTestRun(testRunId: string, error: unknown): Promise<void> {
        const testRun = await prisma.testRun.update({
            where: { id: testRunId },
            data: {
                status: 'failed',
                completedAt: new Date(),
                results: {
                    error: error instanceof Error ? error.message : 'Unknown error'
                } as never
            },
            include: { project: true }
        });

        emitTestUpdate(testRun.projectId, testRun);
        console.error(`[Visual] Test run ${testRunId} failed:`, error);
    }

    async cleanup(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
