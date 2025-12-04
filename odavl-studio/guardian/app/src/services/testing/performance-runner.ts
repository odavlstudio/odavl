import { chromium, Browser } from 'playwright';
import { prisma } from '@/lib/prisma';
import { emitTestUpdate } from '@/lib/socket';
import type { PerformanceTestConfig, PerformanceTestResult } from '@/types/test-config';

interface LighthouseResult {
    lhr: {
        audits: {
            [key: string]: {
                score: number | null;
                numericValue?: number;
                displayValue?: string;
            };
        };
        categories: {
            performance: { score: number };
            accessibility: { score: number };
            'best-practices': { score: number };
            seo: { score: number };
        };
    };
}

export class PerformanceRunner {
    private browser: Browser | null = null;

    async initialize(): Promise<void> {
        this.browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
    }

    async run(testRunId: string, tests: PerformanceTestConfig[]): Promise<void> {
        const startTime = Date.now();

        try {
            await this.updateStatus(testRunId, 'running');

            if (!this.browser) {
                await this.initialize();
            }

            const results: PerformanceTestResult[] = [];

            for (const test of tests) {
                const result = await this.runPerformanceTest(test);
                results.push(result);
            }

            const duration = Date.now() - startTime;
            const failedBudgets = results.reduce(
                (sum, r) => sum + r.budgetViolations.length,
                0
            );

            await this.completeTestRun(testRunId, {
                status: failedBudgets === 0 ? 'passed' : 'failed',
                duration,
                results,
                failedBudgets,
                passedCount: results.filter(r => r.budgetViolations.length === 0).length,
                failedCount: results.filter(r => r.budgetViolations.length > 0).length
            });
        } catch (error) {
            await this.failTestRun(testRunId, error);
        }
    }

    private async runPerformanceTest(
        test: PerformanceTestConfig
    ): Promise<PerformanceTestResult> {
        const context = await this.browser!.newContext({
            viewport: test.device === 'mobile'
                ? { width: 375, height: 667 }
                : { width: 1920, height: 1080 },
            userAgent: test.device === 'mobile'
                ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
                : undefined
        });

        // Apply network throttling
        if (test.throttling && test.throttling.network !== 'none') {
            const tempPage = await context.newPage();
            const cdpSession = await context.newCDPSession(tempPage);

            const throttlingValue = test.throttling.network === 'fast3G' ? '3g' :
                test.throttling.network === '4G' ? '4g' : 'none';
            await this.applyThrottling(cdpSession, throttlingValue);
            await tempPage.close();
        }

        const page = await context.newPage();

        try {
            // Navigate and collect performance metrics
            await page.goto(test.url, { waitUntil: 'networkidle', timeout: 60000 });

            // Get Core Web Vitals using PerformanceObserver
            const metrics = await page.evaluate(() => {
                return new Promise<{
                    fcp: number;
                    lcp: number;
                    tti: number;
                    cls: number;
                    tbt: number;
                }>((resolve) => {
                    const metrics = {
                        fcp: 0,
                        lcp: 0,
                        tti: 0,
                        cls: 0,
                        tbt: 0
                    };

                    // First Contentful Paint
                    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry;
                    if (fcpEntry) {
                        metrics.fcp = fcpEntry.startTime;
                    }

                    // Largest Contentful Paint
                    const observer = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
                        if (lastEntry) {
                            metrics.lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
                        }
                    });
                    observer.observe({ type: 'largest-contentful-paint', buffered: true });

                    // Cumulative Layout Shift
                    let clsValue = 0;
                    const clsObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            const layoutShiftEntry = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
                            if (!layoutShiftEntry.hadRecentInput) {
                                clsValue += layoutShiftEntry.value || 0;
                            }
                        }
                        metrics.cls = clsValue;
                    });
                    clsObserver.observe({ type: 'layout-shift', buffered: true });

                    // Approximate TTI (Time to Interactive) using Load event
                    metrics.tti = performance.timing.domInteractive - performance.timing.navigationStart;

                    // Approximate TBT (Total Blocking Time) using long tasks
                    const longTaskObserver = new PerformanceObserver((list) => {
                        let tbtValue = 0;
                        for (const entry of list.getEntries()) {
                            const duration = entry.duration;
                            if (duration > 50) {
                                tbtValue += duration - 50;
                            }
                        }
                        metrics.tbt = tbtValue;
                    });
                    longTaskObserver.observe({ type: 'longtask', buffered: true });

                    // Give observers time to collect data
                    setTimeout(() => {
                        observer.disconnect();
                        clsObserver.disconnect();
                        longTaskObserver.disconnect();
                        resolve(metrics);
                    }, 2000);
                });
            });

            // Check against budgets
            const budgetViolations: PerformanceTestResult['budgetViolations'] = [];
            const budgets = test.budgets || {};

            if (budgets.fcp && metrics.fcp > budgets.fcp) {
                budgetViolations.push({
                    metric: 'FCP',
                    actual: metrics.fcp,
                    budget: budgets.fcp,
                    exceeded: metrics.fcp - budgets.fcp
                });
            }

            if (budgets.lcp && metrics.lcp > budgets.lcp) {
                budgetViolations.push({
                    metric: 'LCP',
                    actual: metrics.lcp,
                    budget: budgets.lcp,
                    exceeded: metrics.lcp - budgets.lcp
                });
            }

            if (budgets.tti && metrics.tti > budgets.tti) {
                budgetViolations.push({
                    metric: 'TTI',
                    actual: metrics.tti,
                    budget: budgets.tti,
                    exceeded: metrics.tti - budgets.tti
                });
            }

            if (budgets.cls && metrics.cls > budgets.cls) {
                budgetViolations.push({
                    metric: 'CLS',
                    actual: metrics.cls,
                    budget: budgets.cls,
                    exceeded: metrics.cls - budgets.cls
                });
            }

            if (budgets.tbt && metrics.tbt > budgets.tbt) {
                budgetViolations.push({
                    metric: 'TBT',
                    actual: metrics.tbt,
                    budget: budgets.tbt,
                    exceeded: metrics.tbt - budgets.tbt
                });
            }

            await page.close();
            await context.close();

            return {
                testName: test.name,
                url: test.url,
                device: test.device || 'desktop',
                metrics: { ...metrics, speedIndex: 0 },
                scores: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 },
                budgetViolations,
                timestamp: new Date()
            };
        } catch (error) {
            await page.close();
            await context.close();

            return {
                testName: test.name,
                url: test.url,
                device: test.device || 'desktop',
                metrics: { fcp: 0, lcp: 0, tti: 0, cls: 0, tbt: 0, speedIndex: 0 },
                scores: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 },
                budgetViolations: [
                    {
                        metric: 'ERROR',
                        actual: 0,
                        budget: 0,
                        exceeded: 0
                    }
                ],
                timestamp: new Date()
            };
        }
    }

    private async applyThrottling(
        cdpSession: any,
        throttling: '3g' | '4g' | 'none'
    ): Promise<void> {
        const profiles = {
            '3g': {
                offline: false,
                downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
                uploadThroughput: (750 * 1024) / 8, // 750 Kbps
                latency: 150 // 150ms
            },
            '4g': {
                offline: false,
                downloadThroughput: (4 * 1024 * 1024) / 8, // 4 Mbps
                uploadThroughput: (3 * 1024 * 1024) / 8, // 3 Mbps
                latency: 50 // 50ms
            },
            none: {
                offline: false,
                downloadThroughput: -1,
                uploadThroughput: -1,
                latency: 0
            }
        };

        const profile = profiles[throttling];
        await cdpSession.send('Network.emulateNetworkConditions', profile);
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
            results: PerformanceTestResult[];
            failedBudgets: number;
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
                failedCount: data.failedCount,
                errorCount: data.failedBudgets
            },
            include: { project: true }
        });

        emitTestUpdate(testRun.projectId, testRun);
        console.log(
            `[performance] Test run ${testRunId} completed: ${data.status} ` +
            `(${data.failedBudgets} budget violations)`
        );
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
        console.error(`[performance] Test run ${testRunId} failed:`, error);
    }

    async cleanup(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
