import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for ODAVL Guardian E2E Tests
 * 
 * Coverage:
 * - User workflows (login, create project, run tests, view monitors)
 * - Visual regression testing (screenshot comparison)
 * - Cross-browser testing (Chromium, Firefox, WebKit)
 * - Mobile viewport testing (responsive design)
 * - Accessibility testing (axe-core integration)
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './e2e',

    /* Run tests in files in parallel */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Opt out of parallel tests on CI */
    workers: process.env.CI ? 1 : undefined,

    /* Reporter to use */
    reporter: [
        ['html', { outputFolder: 'reports/playwright', open: 'never' }],
        ['json', { outputFile: 'reports/playwright/results.json' }],
        ['junit', { outputFile: 'reports/playwright/junit.xml' }],
        ['list']
    ],

    /* Shared settings for all the projects below */
    use: {
        /* Base URL to use in actions like `await page.goto('/')` */
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3003',

        /* Collect trace when retrying the failed test */
        trace: 'on-first-retry',

        /* Screenshot on failure */
        screenshot: 'only-on-failure',

        /* Video on failure */
        video: 'retain-on-failure',

        /* Maximum time each action such as `click()` can take */
        actionTimeout: 15000,

        /* Maximum time each navigation can take */
        navigationTimeout: 30000,
    },

    /* Configure projects for major browsers */
    projects: [
        // Desktop Browsers
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 }
            },
        },

        {
            name: 'firefox',
            use: {
                ...devices['Desktop Firefox'],
                viewport: { width: 1920, height: 1080 }
            },
        },

        {
            name: 'webkit',
            use: {
                ...devices['Desktop Safari'],
                viewport: { width: 1920, height: 1080 }
            },
        },

        // Mobile Browsers
        {
            name: 'mobile-chrome',
            use: {
                ...devices['Pixel 5'],
            },
        },

        {
            name: 'mobile-safari',
            use: {
                ...devices['iPhone 13'],
            },
        },

        // Tablet
        {
            name: 'tablet',
            use: {
                ...devices['iPad Pro'],
            },
        },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'pnpm dev',
        url: 'http://localhost:3003',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000, // 2 minutes
        stdout: 'pipe',
        stderr: 'pipe',
    },

    /* Global setup/teardown */
    globalSetup: './e2e/global-setup.ts',
    globalTeardown: './e2e/global-teardown.ts',

    /* Timeout for each test */
    timeout: 60 * 1000, // 1 minute

    /* Maximum time for the entire test run */
    globalTimeout: 30 * 60 * 1000, // 30 minutes

    /* Expect timeout */
    expect: {
        timeout: 10 * 1000, // 10 seconds
    },
});
