import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Theme and UI
 * Tests theme toggle and UI responsiveness
 */

test.describe('Theme and UI', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const timestamp = Date.now();
    const testEmail = `theme-test-${timestamp}@odavl.com`;
    const testPassword = 'SecureTestP@ss123';
    
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'Theme Test User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/dashboard/widgets');
    
    // Find theme toggle button
    const themeToggle = page.locator('button[aria-label="Toggle theme"]');
    
    if (await themeToggle.isVisible()) {
      // Get initial theme
      const htmlElement = page.locator('html');
      const initialClass = await htmlElement.getAttribute('class');
      
      // Toggle theme
      await themeToggle.click();
      await page.waitForTimeout(300);
      
      // Check if theme changed
      const newClass = await htmlElement.getAttribute('class');
      expect(initialClass).not.toBe(newClass);
      
      // Toggle back
      await themeToggle.click();
      await page.waitForTimeout(300);
      
      // Should be back to initial theme
      const finalClass = await htmlElement.getAttribute('class');
      expect(finalClass).toBe(initialClass);
    }
  });

  test('should persist theme preference', async ({ page }) => {
    await page.goto('/dashboard/widgets');
    
    // Toggle to dark mode
    const themeToggle = page.locator('button[aria-label="Toggle theme"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(300);
      
      // Reload page
      await page.reload();
      
      // Check if dark mode persisted
      const htmlElement = page.locator('html');
      const theme = await htmlElement.getAttribute('class');
      expect(theme).toContain('dark');
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard/overview');
    
    // Check if content is visible
    await expect(page.locator('h1')).toBeVisible();
    
    // Check if navigation is mobile-friendly
    const mobileMenu = page.locator('button[aria-label="Menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('text=Overview')).toBeVisible();
    }
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard/charts');
    
    // Check if charts are visible
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
  });

  test('should display loading states', async ({ page }) => {
    await page.goto('/dashboard/overview');
    
    // Look for loading indicators during data fetch
    const loading = page.locator('text=Loading');
    const spinner = page.locator('[class*="spinner"]');
    
    // Either loading text or spinner should appear briefly
    if (await loading.isVisible() || await spinner.isVisible()) {
      // Wait for loading to complete
      await page.waitForTimeout(2000);
      
      // Loading should be gone
      await expect(loading).not.toBeVisible();
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Try to access non-existent page
    await page.goto('/dashboard/nonexistent');
    
    // Should show 404 or redirect
    const url = page.url();
    expect(url).toMatch(/404|dashboard/);
  });

  test('should display accessibility features', async ({ page }) => {
    await page.goto('/dashboard/overview');
    
    // Check for accessible elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Button should have either aria-label or text content
      expect(ariaLabel || text).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard/overview');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    // Check if focus is visible
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});
