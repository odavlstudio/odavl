import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Dashboard Navigation
 * Tests navigation between dashboard sections
 */

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const timestamp = Date.now();
    const testEmail = `nav-test-${timestamp}@odavl.com`;
    const testPassword = 'SecureTestP@ss123';
    
    // Register user
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'Nav Test User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should display dashboard navigation', async ({ page }) => {
    await page.goto('/dashboard/overview');
    
    // Check for navigation items
    await expect(page.locator('text=Overview')).toBeVisible();
    await expect(page.locator('text=Charts')).toBeVisible();
    await expect(page.locator('text=Reports')).toBeVisible();
    await expect(page.locator('text=Widgets')).toBeVisible();
    await expect(page.locator('text=Team')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
  });

  test('should navigate to Overview page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Overview');
    
    await page.waitForURL('/dashboard/overview', { timeout: 5000 });
    await expect(page).toHaveURL('/dashboard/overview');
    
    // Check for overview content
    await expect(page.locator('h1:has-text("Dashboard Overview")')).toBeVisible();
  });

  test('should navigate to Charts page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Charts');
    
    await page.waitForURL('/dashboard/charts', { timeout: 5000 });
    await expect(page).toHaveURL('/dashboard/charts');
    
    // Check for charts content
    await expect(page.locator('h1:has-text("Analytics Charts")')).toBeVisible();
  });

  test('should navigate to Reports page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Reports');
    
    await page.waitForURL('/dashboard/reports', { timeout: 5000 });
    await expect(page).toHaveURL('/dashboard/reports');
    
    // Check for reports content
    await expect(page.locator('h1:has-text("Reports & Insights")')).toBeVisible();
  });

  test('should navigate to Widgets page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Widgets');
    
    await page.waitForURL('/dashboard/widgets', { timeout: 5000 });
    await expect(page).toHaveURL('/dashboard/widgets');
    
    // Check for widgets content
    await expect(page.locator('h1:has-text("Custom Widgets")')).toBeVisible();
  });

  test('should navigate to Team page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Team');
    
    await page.waitForURL('/dashboard/team', { timeout: 5000 });
    await expect(page).toHaveURL('/dashboard/team');
  });

  test('should navigate to Settings page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Settings');
    
    await page.waitForURL('/dashboard/settings', { timeout: 5000 });
    await expect(page).toHaveURL('/dashboard/settings');
  });

  test('should highlight active navigation item', async ({ page }) => {
    await page.goto('/dashboard/charts');
    
    // Charts should be highlighted (active)
    const chartsLink = page.locator('a:has-text("Charts")');
    await expect(chartsLink).toHaveClass(/active|text-blue|bg-blue/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard/overview');
    
    // Check if navigation is visible or has mobile menu
    const mobileMenu = page.locator('button[aria-label="Menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('text=Overview')).toBeVisible();
    }
  });

  test('should navigate using browser back/forward', async ({ page }) => {
    await page.goto('/dashboard/overview');
    await page.click('text=Charts');
    await page.waitForURL('/dashboard/charts');
    
    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/dashboard/overview');
    
    // Go forward
    await page.goForward();
    await expect(page).toHaveURL('/dashboard/charts');
  });
});
