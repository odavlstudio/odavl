import { chromium, Browser, Page } from 'playwright';
import { prisma } from '@/lib/prisma';
import { emitTestUpdate } from '@/lib/socket';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { E2ETestStep, E2ETestOptions } from '@/types/test-config';

export interface E2ETest {
    url: string;
    steps: E2ETestStep[];
    options?: E2ETestOptions;
}

// Re-export for convenience
export type { E2ETestStep } from '@/types/test-config';

export interface TestResult {
    passed: boolean;
    error?: string;
    screenshot?: string;
    duration: number;
}

export class E2ERunner {
    private browser: Browser | null = null;
    private readonly videoDir = join(process.cwd(), '.guardian', 'videos');
    private readonly screenshotDir = join(process.cwd(), '.guardian', 'screenshots');

    constructor() {
        // Ensure directories exist
        try {
            mkdirSync(this.videoDir, { recursive: true });
            mkdirSync(this.screenshotDir, { recursive: true });
        } catch {
            // Directories already exist
        }
    }

    async initialize(options?: E2ETestOptions): Promise<void> {
        this.browser = await chromium.launch({
            headless: options?.headless !== false,
            slowMo: options?.slowMo || 0,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async run(testRunId: string, tests: E2ETest[]): Promise<void> {
        const startTime = Date.now();

        try {
            await this.updateStatus(testRunId, 'running');

            // Get test options from first test (or use defaults)
            const options = tests[0]?.options;

            if (!this.browser) {
                await this.initialize(options);
            }

            const contextOptions: { viewport: { width: number; height: number }; recordVideo?: { dir: string } } = {
                viewport: options?.viewport || { width: 1920, height: 1080 }
            };

            // Enable video recording if requested
            if (options?.video) {
                contextOptions.recordVideo = { dir: this.videoDir };
            }

            const context = await this.browser!.newContext(contextOptions);

            const results: TestResult[] = [];
            const screenshots: string[] = [];
            let videoPath: string | undefined;

            for (const test of tests) {
                const page = await context.newPage();
                const result = await this.executeTest(page, test);

                results.push(result);
                if (result.screenshot) {
                    screenshots.push(result.screenshot);
                }

                await page.close();
            }

            // Save video if enabled
            if (options?.video) {
                const video = context.pages()[0]?.video();
                if (video) {
                    videoPath = await video.path();
                }
            }

            await context.close();

            const duration = Date.now() - startTime;
            const passedCount = results.filter(r => r.passed).length;
            const failedCount = results.filter(r => !r.passed).length;

            await this.completeTestRun(testRunId, {
                status: failedCount === 0 ? 'passed' : 'failed',
                duration,
                results,
                screenshots,
                passedCount,
                failedCount,
                video: videoPath
            });
        } catch (error) {
            await this.failTestRun(testRunId, error);
        }
    }

    private async executeTest(page: Page, test: E2ETest): Promise<TestResult> {
        const startTime = Date.now();

        try {
            await page.goto(test.url, { waitUntil: 'networkidle' });

            for (const step of test.steps) {
                await this.executeStep(page, step);
            }

            return {
                passed: true,
                duration: Date.now() - startTime
            };
        } catch (error) {
            const screenshot = await page.screenshot({
                fullPage: true,
                type: 'png'
            });

            return {
                passed: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                screenshot: screenshot.toString('base64'),
                duration: Date.now() - startTime
            };
        }
    }

    private async executeStep(page: Page, step: E2ETestStep): Promise<void> {
        const timeout = step.timeout || 30000;

        switch (step.type) {
            case 'goto':
                if (!step.value) throw new Error('goto requires value (URL)');
                await page.goto(step.value.toString(), {
                    waitUntil: step.waitUntil || 'networkidle',
                    timeout
                });
                break;

            case 'click':
                if (!step.selector) throw new Error('click requires selector');
                await page.click(step.selector, { timeout });
                break;

            case 'fill':
                if (!step.selector || step.value === undefined) {
                    throw new Error('fill requires selector and value');
                }
                await page.fill(step.selector, step.value.toString(), { timeout });
                break;

            case 'wait':
                await page.waitForTimeout(timeout);
                break;

            case 'screenshot': {
                const screenshotOptions = step.screenshot || { fullPage: true };
                const timestamp = Date.now();
                const path = join(this.screenshotDir, `screenshot-${timestamp}.png`);

                await page.screenshot({
                    ...screenshotOptions,
                    path
                });
                break;
            }

            case 'assert':
                if (!step.selector) throw new Error('assert requires selector');

                if (step.assertion) {
                    switch (step.assertion.type) {
                        case 'visible':
                            await page.waitForSelector(step.selector, {
                                state: 'visible',
                                timeout
                            });
                            break;

                        case 'hidden':
                            await page.waitForSelector(step.selector, {
                                state: 'hidden',
                                timeout
                            });
                            break;

                        case 'text': {
                            const element = await page.waitForSelector(step.selector, { timeout });
                            if (!element) throw new Error(`Element ${step.selector} not found`);

                            const text = await element.textContent();
                            const expected = step.assertion.expected?.toString();

                            if (text !== expected) {
                                throw new Error(
                                    `Text assertion failed: expected "${expected}", got "${text}"`
                                );
                            }
                            break;
                        }

                        case 'count': {
                            const elements = await page.$$(step.selector);
                            const actual = elements.length;
                            const expected = Number(step.assertion.expected);

                            if (actual !== expected) {
                                throw new Error(
                                    `Count assertion failed: expected ${expected}, got ${actual}`
                                );
                            }
                            break;
                        }

                        case 'attribute': {
                            if (!step.assertion.attribute) {
                                throw new Error('attribute assertion requires attribute name');
                            }

                            const element = await page.waitForSelector(step.selector, { timeout });
                            if (!element) throw new Error(`Element ${step.selector} not found`);

                            const value = await element.getAttribute(step.assertion.attribute);
                            const expected = step.assertion.expected?.toString();

                            if (value !== expected) {
                                throw new Error(
                                    `Attribute "${step.assertion.attribute}" assertion failed: ` +
                                    `expected "${expected}", got "${value}"`
                                );
                            }
                            break;
                        }

                        case 'url': {
                            const currentUrl = page.url();
                            const expected = step.assertion.expected?.toString();

                            if (expected && !currentUrl.includes(expected)) {
                                throw new Error(
                                    `URL assertion failed: expected URL to contain "${expected}", ` +
                                    `got "${currentUrl}"`
                                );
                            }
                            break;
                        }

                        default:
                            throw new Error(`Unknown assertion type: ${step.assertion.type}`);
                    }
                } else {
                    // Default: just wait for element to be visible
                    await page.waitForSelector(step.selector, {
                        state: 'visible',
                        timeout
                    });
                }
                break;

            case 'hover':
                if (!step.selector) throw new Error('hover requires selector');
                await page.hover(step.selector, { timeout });
                break;

            case 'select':
                if (!step.selector || step.value === undefined) {
                    throw new Error('select requires selector and value');
                }
                await page.selectOption(step.selector, step.value.toString(), { timeout });
                break;

            case 'keyboard':
                if (!step.key) throw new Error('keyboard requires key');
                await page.keyboard.press(step.key);
                break;

            case 'scroll': {
                if (step.selector) {
                    // Scroll to element
                    const element = await page.waitForSelector(step.selector, { timeout });
                    if (element) {
                        await element.scrollIntoViewIfNeeded();
                    }
                } else {
                    // Scroll by value (default: bottom of page)
                    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                }
                break;
            }

            default:
                throw new Error(`Unknown action: ${step.type}`);
        }
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
            results: TestResult[];
            screenshots: string[];
            passedCount: number;
            failedCount: number;
            video?: string;
        }
    ): Promise<void> {
        const updateData: {
            status: string;
            completedAt: Date;
            duration: number;
            results: never;
            screenshots: string[];
            passedCount: number;
            failedCount: number;
        } = {
            status: data.status,
            completedAt: new Date(),
            duration: data.duration,
            results: data.results as never,
            screenshots: data.screenshots,
            passedCount: data.passedCount,
            failedCount: data.failedCount
        };

        // Note: video path could be stored in results metadata if needed

        const testRun = await prisma.testRun.update({
            where: { id: testRunId },
            data: updateData,
            include: { project: true }
        });

        emitTestUpdate(testRun.projectId, testRun);
        console.log(`[E2E] Test run ${testRunId} completed: ${data.status}`);
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
        console.error(`[E2E] Test run ${testRunId} failed:`, error);
    }

    async cleanup(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
