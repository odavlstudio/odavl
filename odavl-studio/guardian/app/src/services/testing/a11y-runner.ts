import { chromium, Browser, Page } from 'playwright';
import { prisma } from '@/lib/prisma';
import { emitTestUpdate } from '@/lib/socket';
import { injectAxe, getViolations } from 'axe-playwright';
import type { A11yTestConfig, A11yViolation, A11yTestResult } from '@/types/test-config';

export class A11yRunner {
    private browser: Browser | null = null;

    async initialize(): Promise<void> {
        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async run(testRunId: string, tests: A11yTestConfig[]): Promise<void> {
        const startTime = Date.now();

        try {
            await this.updateStatus(testRunId, 'running');

            if (!this.browser) {
                await this.initialize();
            }

            const context = await this.browser!.newContext({
                viewport: { width: 1920, height: 1080 }
            });

            const results: A11yTestResult[] = [];

            for (const test of tests) {
                const page = await context.newPage();
                const result = await this.runA11yTest(page, test);
                results.push(result);
                await page.close();
            }

            await context.close();

            const duration = Date.now() - startTime;

            // Calculate pass/fail based on violations
            const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
            const criticalViolations = results.reduce(
                (sum, r) => sum + r.violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length,
                0
            );

            await this.completeTestRun(testRunId, {
                status: criticalViolations === 0 ? 'passed' : 'failed',
                duration,
                results,
                totalViolations,
                criticalViolations,
                passedCount: results.filter(r => r.violations.length === 0).length,
                failedCount: results.filter(r => r.violations.length > 0).length
            });
        } catch (error) {
            await this.failTestRun(testRunId, error);
        }
    }

    private async runA11yTest(page: Page, test: A11yTestConfig): Promise<A11yTestResult> {
        try {
            await page.goto(test.url, { waitUntil: 'networkidle' });

            // Inject axe-core
            await injectAxe(page);

            // Configure axe based on test config
            const axeOptions: { rules?: { [key: string]: { enabled: boolean } } } = {};

            if (test.rules) {
                axeOptions.rules = {};

                // Disable specific rules if requested
                if (test.rules.disabled) {
                    test.rules.disabled.forEach(ruleId => {
                        if (axeOptions.rules) {
                            axeOptions.rules[ruleId] = { enabled: false };
                        }
                    });
                }
            }

            // Run axe scan with WCAG level filter
            const violations = await getViolations(page, undefined, axeOptions);

            // Filter by WCAG level if specified
            const filteredViolations = test.wcagLevel
                ? this.filterByWcagLevel(violations, test.wcagLevel)
                : violations;

            // Convert axe violations to our format
            const formattedViolations: A11yViolation[] = filteredViolations.map(v => ({
                id: v.id,
                impact: v.impact as 'minor' | 'moderate' | 'serious' | 'critical',
                description: v.description,
                help: v.help,
                helpUrl: v.helpUrl,
                nodes: v.nodes.map((n: any) => ({
                    html: n.html,
                    target: n.target,
                    failureSummary: n.failureSummary || ''
                }))
            }));

            return {
                testName: test.name,
                url: test.url,
                violations: formattedViolations,
                passes: 0, // axe-playwright doesn't expose passes count
                incomplete: 0, // axe-playwright doesn't expose incomplete count
                wcagLevel: test.wcagLevel || 'AA',
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(
                `A11y test failed for ${test.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    private filterByWcagLevel(violations: any[], level: 'A' | 'AA' | 'AAA'): any[] {
        const wcagTags: { [key: string]: string[] } = {
            'A': ['wcag2a', 'wcag21a'],
            'AA': ['wcag2a', 'wcag21a', 'wcag2aa', 'wcag21aa'],
            'AAA': ['wcag2a', 'wcag21a', 'wcag2aa', 'wcag21aa', 'wcag2aaa', 'wcag21aaa']
        };

        const relevantTags = wcagTags[level] || wcagTags['AA'];

        return violations.filter(v => {
            return v.tags?.some((tag: any) => relevantTags.includes(tag));
        });
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
            results: A11yTestResult[];
            totalViolations: number;
            criticalViolations: number;
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
                errorCount: data.criticalViolations,
                warningCount: data.totalViolations - data.criticalViolations
            },
            include: { project: true }
        });

        emitTestUpdate(testRun.projectId, testRun);
        console.log(
            `[A11y] Test run ${testRunId} completed: ${data.status} ` +
            `(${data.totalViolations} violations, ${data.criticalViolations} critical)`
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
        console.error(`[A11y] Test run ${testRunId} failed:`, error);
    }

    async cleanup(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
