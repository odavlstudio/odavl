import { chromium, Browser, Page } from 'playwright';
import { prisma } from '@/lib/prisma';
import { emitTestUpdate } from '@/lib/socket';
import type { I18nTestConfig, I18nTestResult } from '@/types/test-config';

export class I18nRunner {
    private browser: Browser | null = null;
    private readonly rtlLanguages = ['ar', 'he', 'fa', 'ur'];

    async initialize(): Promise<void> {
        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async run(testRunId: string, tests: I18nTestConfig[]): Promise<void> {
        const startTime = Date.now();

        try {
            await this.updateStatus(testRunId, 'running');

            if (!this.browser) {
                await this.initialize();
            }

            const context = await this.browser!.newContext({
                viewport: { width: 1920, height: 1080 }
            });

            const results: I18nTestResult[] = [];

            for (const test of tests) {
                for (const language of test.languages) {
                    for (const pagePath of test.pages) {
                        const page = await context.newPage();
                        const result = await this.runI18nTest(page, test, language, pagePath);
                        results.push(result);
                        await page.close();
                    }
                }
            }

            await context.close();

            const duration = Date.now() - startTime;
            const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
            const highSeverityIssues = results.reduce(
                (sum, r) => sum + r.issues.filter(i => i.severity === 'high').length,
                0
            );

            await this.completeTestRun(testRunId, {
                status: highSeverityIssues === 0 ? 'passed' : 'failed',
                duration,
                results,
                totalIssues,
                highSeverityIssues,
                passedCount: results.filter(r => r.issues.length === 0).length,
                failedCount: results.filter(r => r.issues.length > 0).length
            });
        } catch (error) {
            await this.failTestRun(testRunId, error);
        }
    }

    private async runI18nTest(
        page: Page,
        test: I18nTestConfig,
        language: string,
        pagePath: string
    ): Promise<I18nTestResult> {
        const url = `${test.baseUrl}/${language}${pagePath}`;
        const issues: I18nTestResult['issues'] = [];

        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

            // Check for missing translations
            if (test.checks.missingTranslations) {
                const missingKeys = await this.checkMissingTranslations(page);
                issues.push(...missingKeys);
            }

            // Check for broken links
            if (test.checks.brokenLinks) {
                const brokenLinks = await this.checkBrokenLinks(page);
                issues.push(...brokenLinks);
            }

            // Check RTL layout for RTL languages
            if (test.checks.rtlLayout && this.rtlLanguages.includes(language)) {
                const rtlIssues = await this.checkRtlLayout(page);
                issues.push(...rtlIssues);
            }

            // Check for text overflow
            if (test.checks.textOverflow) {
                const overflowIssues = await this.checkTextOverflow(page);
                issues.push(...overflowIssues);
            }

            return {
                testName: test.name,
                language,
                url,
                issues
            };
        } catch (error) {
            issues.push({
                type: 'missing_translation',
                severity: 'high',
                message: `Failed to load page: ${error instanceof Error ? error.message : 'Unknown error'}`
            });

            return {
                testName: test.name,
                language,
                url,
                issues
            };
        }
    }

    private async checkMissingTranslations(page: Page): Promise<I18nTestResult['issues']> {
        const issues: I18nTestResult['issues'] = [];

        try {
            // Check for untranslated keys (common patterns: {{key}}, {key}, __KEY__)
            const untranslatedKeys = await page.evaluate(() => {
                const patterns = [
                    /\{\{[a-z._]+\}\}/gi,
                    /\{[a-z._]+\}/gi,
                    /__[A-Z_]+__/g
                ];

                const bodyText = document.body.innerText;
                const matches: string[] = [];

                patterns.forEach(pattern => {
                    const found = bodyText.match(pattern);
                    if (found) {
                        matches.push(...found);
                    }
                });

                return [...new Set(matches)];
            });

            untranslatedKeys.forEach((key: string) => {
                issues.push({
                    type: 'missing_translation',
                    severity: 'high',
                    message: `Untranslated key found: ${key}`
                });
            });
        } catch {
            // Ignore errors in translation check
        }

        return issues;
    }

    private async checkBrokenLinks(page: Page): Promise<I18nTestResult['issues']> {
        const issues: I18nTestResult['issues'] = [];

        try {
            // Check for links with href="#" or empty href
            const invalidLinks = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a[href]'));
                return links
                    .filter(link => {
                        const href = link.getAttribute('href');
                        return !href || href === '#' || href === 'javascript:void(0)';
                    })
                    .map(link => ({
                        href: link.getAttribute('href') || '',
                        text: link.textContent?.trim() || ''
                    }));
            });

            invalidLinks.forEach((link: { href: string; text: string }) => {
                issues.push({
                    type: 'broken_link',
                    severity: 'medium',
                    message: `Invalid link: "${link.text}" (href: "${link.href}")`
                });
            });
        } catch {
            // Ignore errors in link check
        }

        return issues;
    }

    private async checkRtlLayout(page: Page): Promise<I18nTestResult['issues']> {
        const issues: I18nTestResult['issues'] = [];

        try {
            // Check if html has dir="rtl"
            const hasRtlDir = await page.evaluate(() => {
                const html = document.documentElement;
                return html.getAttribute('dir') === 'rtl';
            });

            if (!hasRtlDir) {
                issues.push({
                    type: 'rtl_issue',
                    severity: 'high',
                    message: 'RTL language detected but <html> element missing dir="rtl" attribute'
                });
            }
        } catch {
            // Ignore errors in RTL check
        }

        return issues;
    }

    private async checkTextOverflow(page: Page): Promise<I18nTestResult['issues']> {
        const issues: I18nTestResult['issues'] = [];

        try {
            // Check for elements with text overflow
            const overflowElements = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('*'));
                return elements
                    .filter(el => {
                        const style = window.getComputedStyle(el);
                        return (
                            style.overflow === 'hidden' &&
                            el.scrollHeight > el.clientHeight
                        );
                    })
                    .map(el => ({
                        tag: el.tagName.toLowerCase(),
                        text: el.textContent?.substring(0, 50) || ''
                    }));
            });

            overflowElements.forEach((el: { tag: string; text: string }) => {
                issues.push({
                    type: 'text_overflow',
                    severity: 'low',
                    message: `Text overflow detected in <${el.tag}>: "${el.text}..."`
                });
            });
        } catch {
            // Ignore errors in overflow check
        }

        return issues;
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
            results: I18nTestResult[];
            totalIssues: number;
            highSeverityIssues: number;
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
                errorCount: data.highSeverityIssues,
                warningCount: data.totalIssues - data.highSeverityIssues
            },
            include: { project: true }
        });

        emitTestUpdate(testRun.projectId, testRun);
        console.log(
            `[i18n] Test run ${testRunId} completed: ${data.status} ` +
            `(${data.totalIssues} issues, ${data.highSeverityIssues} high severity)`
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
        console.error(`[i18n] Test run ${testRunId} failed:`, error);
    }

    async cleanup(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
