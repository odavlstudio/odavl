/**
 * Shared test utilities and helpers for E2E tests
 * 
 * Provides:
 * - Authentication helpers
 * - Wait utilities
 * - Data generators
 * - Common assertions
 * - Test fixtures
 */

import { Page, expect } from '@playwright/test';

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Log in as test user
 * @param page - Playwright page object
 * @param email - User email (default: test@odavl.studio)
 * @param password - User password (default: TestPassword123!)
 */
export async function login(
  page: Page,
  email: string = 'test@odavl.studio',
  password: string = 'TestPassword123!'
) {
  await page.goto('/login');
  
  // Check if email/password login is available
  const hasEmailLogin = await page.locator('input[type="email"]').isVisible().catch(() => false);
  
  if (hasEmailLogin) {
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  } else {
    // OAuth login - skip for now
    console.warn('OAuth login detected - manual authentication required');
  }
}

/**
 * Log out current user
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  // Click user menu
  await page.click('[data-testid="user-menu-button"]');
  
  // Click logout
  await page.click('[data-testid="logout-button"]');
  
  // Wait for redirect to login page
  await page.waitForURL('**/login', { timeout: 5000 });
}

/**
 * Check if user is authenticated
 * @param page - Playwright page object
 * @returns True if authenticated, false otherwise
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for user menu button (only visible when authenticated)
    const userMenu = page.locator('[data-testid="user-menu-button"]');
    return await userMenu.isVisible({ timeout: 2000 });
  } catch {
    return false;
  }
}

// ============================================================================
// WAIT UTILITIES
// ============================================================================

/**
 * Wait for API response
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to match
 * @param timeout - Timeout in milliseconds (default: 10000)
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 10000
): Promise<any> {
  const response = await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
  
  return response.json();
}

/**
 * Wait for loading spinner to disappear
 * @param page - Playwright page object
 */
export async function waitForLoadingComplete(page: Page) {
  const spinner = page.locator('[data-testid="loading-spinner"]');
  await spinner.waitFor({ state: 'hidden', timeout: 10000 });
}

/**
 * Wait for toast notification
 * @param page - Playwright page object
 * @param message - Expected message (optional)
 */
export async function waitForToast(page: Page, message?: string) {
  const toast = page.locator('[data-testid="toast-notification"]');
  await toast.waitFor({ state: 'visible', timeout: 5000 });
  
  if (message) {
    await expect(toast).toContainText(message);
  }
}

/**
 * Wait for element with retry
 * @param page - Playwright page object
 * @param selector - Element selector
 * @param options - Wait options
 */
export async function waitForElementWithRetry(
  page: Page,
  selector: string,
  options?: { timeout?: number; retries?: number }
) {
  const timeout = options?.timeout || 5000;
  const retries = options?.retries || 3;
  
  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { timeout });
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await page.waitForTimeout(1000);
    }
  }
}

// ============================================================================
// DATA GENERATORS
// ============================================================================

/**
 * Generate random email
 * @param prefix - Email prefix (default: test)
 * @returns Random email address
 */
export function generateRandomEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}@odavl.studio`;
}

/**
 * Generate random project name
 * @returns Random project name
 */
export function generateRandomProjectName(): string {
  const adjectives = ['awesome', 'cool', 'fantastic', 'amazing', 'brilliant'];
  const nouns = ['project', 'app', 'platform', 'service', 'system'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}-${noun}-${num}`;
}

/**
 * Generate random URL
 * @returns Random URL
 */
export function generateRandomUrl(): string {
  const random = Math.floor(Math.random() * 100000);
  return `https://test-${random}.odavl.studio`;
}

// ============================================================================
// COMMON ASSERTIONS
// ============================================================================

/**
 * Assert page title
 * @param page - Playwright page object
 * @param title - Expected title
 */
export async function assertPageTitle(page: Page, title: string) {
  await expect(page).toHaveTitle(new RegExp(title, 'i'));
}

/**
 * Assert URL contains path
 * @param page - Playwright page object
 * @param path - Expected path
 */
export async function assertUrlContains(page: Page, path: string) {
  await expect(page).toHaveURL(new RegExp(path));
}

/**
 * Assert element visible
 * @param page - Playwright page object
 * @param selector - Element selector
 */
export async function assertElementVisible(page: Page, selector: string) {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
}

/**
 * Assert element has text
 * @param page - Playwright page object
 * @param selector - Element selector
 * @param text - Expected text
 */
export async function assertElementText(page: Page, selector: string, text: string) {
  const element = page.locator(selector);
  await expect(element).toContainText(text);
}

/**
 * Assert table has rows
 * @param page - Playwright page object
 * @param tableSelector - Table selector
 * @param minRows - Minimum expected rows
 */
export async function assertTableHasRows(
  page: Page,
  tableSelector: string,
  minRows: number = 1
) {
  const rows = page.locator(`${tableSelector} tbody tr`);
  const count = await rows.count();
  expect(count).toBeGreaterThanOrEqual(minRows);
}

// ============================================================================
// TEST FIXTURES
// ============================================================================

/**
 * Test user credentials
 */
export const TEST_USER = {
  email: 'test@odavl.studio',
  password: 'TestPassword123!',
  name: 'Test User',
};

/**
 * Test project data
 */
export const TEST_PROJECT = {
  id: 'test-project-123',
  name: 'Test Project',
  slug: 'test-project',
  language: 'typescript',
  framework: 'nextjs',
  repositoryUrl: 'https://github.com/odavl/test-project',
};

/**
 * Test issue data
 */
export const TEST_ISSUE = {
  detector: 'typescript',
  severity: 'high',
  message: 'Type error: Property "foo" does not exist',
  filePath: 'src/components/Button.tsx',
  lineNumber: 42,
  columnNumber: 12,
};

/**
 * Test autopilot run data
 */
export const TEST_AUTOPILOT_RUN = {
  status: 'success',
  duration: 300,
  filesModified: 5,
  linesChanged: 42,
  issuesFixed: 3,
};

/**
 * Test guardian test data
 */
export const TEST_GUARDIAN_TEST = {
  url: 'https://test.odavl.studio',
  environment: 'staging',
  status: 'passed',
  performanceScore: 95,
  accessibilityScore: 98,
  securityScore: 92,
  seoScore: 90,
};

// ============================================================================
// NETWORK HELPERS
// ============================================================================

/**
 * Mock API response
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to match
 * @param response - Mock response data
 */
export async function mockApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  response: any
) {
  await page.route(urlPattern, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Simulate slow network
 * @param page - Playwright page object
 * @param delayMs - Delay in milliseconds (default: 1000)
 */
export async function simulateSlowNetwork(page: Page, delayMs: number = 1000) {
  await page.route('**/*', async (route) => {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

/**
 * Simulate network error
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to match
 */
export async function simulateNetworkError(page: Page, urlPattern: string | RegExp) {
  await page.route(urlPattern, async (route) => {
    await route.abort('failed');
  });
}

// ============================================================================
// SCREENSHOT HELPERS
// ============================================================================

/**
 * Take full page screenshot
 * @param page - Playwright page object
 * @param name - Screenshot name
 */
export async function takeFullPageScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true,
  });
}

/**
 * Take element screenshot
 * @param page - Playwright page object
 * @param selector - Element selector
 * @param name - Screenshot name
 */
export async function takeElementScreenshot(
  page: Page,
  selector: string,
  name: string
) {
  const element = page.locator(selector);
  await element.screenshot({
    path: `test-results/screenshots/${name}.png`,
  });
}

// ============================================================================
// ACCESSIBILITY HELPERS
// ============================================================================

/**
 * Check for accessibility violations
 * @param page - Playwright page object
 * @returns Accessibility violations
 */
export async function checkAccessibility(page: Page): Promise<any> {
  // Inject axe-core
  await page.addScriptTag({
    url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js',
  });

  // Run axe
  const violations = await page.evaluate(() => {
    return (window as any).axe.run();
  });

  return violations;
}

/**
 * Assert no accessibility violations
 * @param page - Playwright page object
 */
export async function assertNoAccessibilityViolations(page: Page) {
  const violations = await checkAccessibility(page);
  
  if (violations.violations.length > 0) {
    console.error('Accessibility violations:', violations.violations);
  }
  
  expect(violations.violations).toHaveLength(0);
}
