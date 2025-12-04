/**
 * Playwright Fixtures - Custom test fixtures for ODAVL Guardian
 * 
 * Provides:
 * - Authenticated pages (user, admin)
 * - Database helpers
 * - Screenshot comparison
 * - Accessibility testing
 */

import { test as base, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';
import type { Page } from '@playwright/test';

// Test credentials (from seed.ts)
export const TEST_USERS = {
    user: {
        email: 'e2e-test-user@odavl.com',
        password: 'TestPassword123!',
        role: 'user',
    },
    admin: {
        email: 'e2e-test-admin@odavl.com',
        password: 'TestPassword123!',
        role: 'admin',
    },
};

/**
 * Extended test fixtures with authentication and utilities
 */
type Fixtures = {
    authenticatedPage: Page;
    adminPage: Page;
    screenshotHelper: ScreenshotHelper;
    a11yHelper: A11yHelper;
};

export const test = base.extend<Fixtures>({
    /**
     * Authenticated user page
     */
    authenticatedPage: async ({ browser }, use) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        // Login as user
        await page.goto('/api/auth/signin');
        await page.fill('[name="email"]', TEST_USERS.user.email);
        await page.fill('[name="password"]', TEST_USERS.user.password);
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await page.waitForURL('/dashboard', { timeout: 10000 });

        await use(page);

        // Cleanup
        await context.close();
    },

    /**
     * Authenticated admin page
     */
    adminPage: async ({ browser }, use) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        // Login as admin
        await page.goto('/api/auth/signin');
        await page.fill('[name="email"]', TEST_USERS.admin.email);
        await page.fill('[name="password"]', TEST_USERS.admin.password);
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await page.waitForURL('/dashboard', { timeout: 10000 });

        await use(page);

        // Cleanup
        await context.close();
    },

    /**
     * Screenshot comparison helper
     */
    screenshotHelper: async ({ }, use) => {
        await use(new ScreenshotHelper());
    },

    /**
     * Accessibility testing helper
     */
    a11yHelper: async ({ }, use) => {
        await use(new A11yHelper());
    },
});

export { expect };

/**
 * Screenshot Helper - Visual regression testing utilities
 */
class ScreenshotHelper {
    /**
     * Take and compare screenshot with baseline
     */
    async compareScreenshot(
        page: Page,
        name: string,
        options?: {
            fullPage?: boolean;
            maxDiffPixels?: number;
            maxDiffPixelRatio?: number;
        }
    ) {
        const screenshot = await page.screenshot({
            fullPage: options?.fullPage ?? false,
        });

        await expect(screenshot).toMatchSnapshot(`${name}.png`, {
            maxDiffPixels: options?.maxDiffPixels ?? 100,
            maxDiffPixelRatio: options?.maxDiffPixelRatio ?? 0.01,
        });
    }

    /**
     * Take screenshot of specific element
     */
    async compareElementScreenshot(
        page: Page,
        selector: string,
        name: string,
        options?: {
            maxDiffPixels?: number;
            maxDiffPixelRatio?: number;
        }
    ) {
        const element = page.locator(selector);
        await expect(element).toBeVisible();

        const screenshot = await element.screenshot();

        await expect(screenshot).toMatchSnapshot(`${name}.png`, {
            maxDiffPixels: options?.maxDiffPixels ?? 100,
            maxDiffPixelRatio: options?.maxDiffPixelRatio ?? 0.01,
        });
    }

    /**
     * Wait for animations to complete before screenshot
     */
    async waitForStable(page: Page, timeout = 2000) {
        await page.evaluate(() => {
            return new Promise<void>((resolve) => {
                requestIdleCallback(() => resolve(), { timeout: 1000 });
            });
        });
        await page.waitForTimeout(timeout);
    }
}

/**
 * Accessibility Helper - A11y testing utilities
 */
class A11yHelper {
    /**
     * Check page for accessibility violations
     */
    async checkAccessibility(
        page: Page,
        options?: {
            includedRules?: string[];
            excludedRules?: string[];
            detailedReport?: boolean;
        }
    ) {
        // Inject axe-core
        await injectAxe(page);

        // Run accessibility checks
        await checkA11y(
            page,
            undefined,
            {
                detailedReport: options?.detailedReport ?? true,
                detailedReportOptions: {
                    html: true,
                },
                axeOptions: {
                    rules: options?.includedRules
                        ? options.includedRules.reduce((acc, rule) => ({ ...acc, [rule]: { enabled: true } }), {})
                        : undefined,
                },
            },
            false, // Don't throw on violations (we'll handle them manually)
            'v2'
        );
    }

    /**
     * Check specific element for accessibility
     */
    async checkElementAccessibility(
        page: Page,
        selector: string,
        options?: {
            includedRules?: string[];
            detailedReport?: boolean;
        }
    ) {
        await injectAxe(page);

        await checkA11y(
            page,
            selector,
            {
                detailedReport: options?.detailedReport ?? true,
                axeOptions: {
                    rules: options?.includedRules
                        ? options.includedRules.reduce((acc, rule) => ({ ...acc, [rule]: { enabled: true } }), {})
                        : undefined,
                },
            },
            false,
            'v2'
        );
    }

    /**
     * Get accessibility violations count
     */
    async getViolationsCount(page: Page): Promise<number> {
        await injectAxe(page);

        const results = await page.evaluate(async () => {
            // @ts-ignore - axe is injected globally
            const results = await axe.run();
            return results.violations.length;
        });

        return results;
    }
}

/**
 * Common test helpers
 */
export const helpers = {
    /**
     * Login helper
     */
    async login(page: Page, email: string, password: string) {
        await page.goto('/api/auth/signin');
        await page.fill('[name="email"]', email);
        await page.fill('[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard', { timeout: 10000 });
    },

    /**
     * Logout helper
     */
    async logout(page: Page) {
        await page.goto('/api/auth/signout');
        await page.waitForURL('/api/auth/signin', { timeout: 5000 });
    },

    /**
     * Wait for network idle
     */
    async waitForNetworkIdle(page: Page, timeout = 5000) {
        await page.waitForLoadState('networkidle', { timeout });
    },

    /**
     * Fill form helper
     */
    async fillForm(page: Page, fields: Record<string, string>) {
        for (const [name, value] of Object.entries(fields)) {
            await page.fill(`[name="${name}"]`, value);
        }
    },

    /**
     * Wait for toast notification
     */
    async waitForToast(page: Page, text?: string) {
        const toast = page.locator('[role="alert"]');
        await expect(toast).toBeVisible({ timeout: 5000 });

        if (text) {
            await expect(toast).toContainText(text);
        }

        return toast;
    },
};
