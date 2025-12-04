import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test Configuration for ODAVL Studio Hub
 * 
 * Comprehensive E2E testing setup for:
 * - Authentication flows
 * - Dashboard navigation
 * - Product dashboards (Insight, Autopilot, Guardian)
 * - Multi-browser testing
 * - Visual regression testing
 * - Performance testing
 * - Accessibility testing
 */

// Read from environment or use defaults
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  
  // Test timeout (30 seconds per test)
  timeout: 30000,
  
  // Expect timeout (5 seconds for assertions)
  expect: {
    timeout: 5000,
  },
  
  // Run tests in parallel
  fullyParallel: !CI, // Sequential in CI for stability
  
  // Fail fast in CI
  forbidOnly: CI,
  
  // Retry failed tests
  retries: CI ? 2 : 0,
  
  // Number of workers
  workers: CI ? 2 : undefined, // Auto in local, 2 in CI
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'reports/playwright-html', open: 'never' }],
    ['json', { outputFile: 'reports/playwright-results.json' }],
    ['junit', { outputFile: 'reports/playwright-junit.xml' }],
    ['list'], // Console output
  ],
  
  // Global test settings
  use: {
    // Base URL for navigation
    baseURL: BASE_URL,
    
    // Browser context options
    trace: CI ? 'retain-on-failure' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Navigation timeout
    navigationTimeout: 10000,
    
    // Action timeout
    actionTimeout: 10000,
    
    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'America/New_York',
    
    // Viewport size (desktop)
    viewport: { width: 1280, height: 720 },
    
    // User agent
    userAgent: 'Playwright E2E Tests',
    
    // Permissions
    permissions: [],
    
    // HTTP credentials (if needed)
    httpCredentials: process.env.HTTP_AUTH_USER ? {
      username: process.env.HTTP_AUTH_USER,
      password: process.env.HTTP_AUTH_PASSWORD!,
    } : undefined,
    
    // Ignore HTTPS errors in development
    ignoreHTTPSErrors: !CI,
  },
  
  // Test projects for different browsers and devices
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
    
    // Tablet
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] },
    },
    
    // Edge
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    
    // Branded tests (chromium with specific settings)
    {
      name: 'chromium-slow-network',
      use: {
        ...devices['Desktop Chrome'],
        // Simulate slow 3G network
        launchOptions: {
          args: ['--simulate-slow-3g'],
        },
      },
    },
    
    // Accessibility tests (chromium only)
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Additional accessibility testing
      },
      testMatch: '**/accessibility.spec.ts',
    },
    
    // Visual regression tests
    {
      name: 'visual-regression',
      use: {
        ...devices['Desktop Chrome'],
        // Consistent viewport for visual tests
        viewport: { width: 1280, height: 720 },
      },
      testMatch: '**/visual-regression.spec.ts',
    },
  ],
  
  // Local development server
  webServer: CI ? undefined : {
    command: 'pnpm dev',
    url: BASE_URL,
    timeout: 120000, // 2 minutes to start dev server
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  
  // Global setup and teardown
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
});
