import { test, expect } from '@playwright/test';

test.describe('Internationalization', () => {
  test('should default to English locale', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveURL(/\/en/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('should switch to Arabic locale', async ({ page }) => {
    await page.goto('/');
    
    // Click language switcher
    await page.getByRole('button', { name: /english/i }).click();
    await page.getByRole('option', { name: /العربية/i }).click();
    
    await expect(page).toHaveURL(/\/ar/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('should display translated content in Arabic', async ({ page }) => {
    await page.goto('/ar');
    
    await expect(page.getByText(/مرحباً بك في ODAVL Studio/i)).toBeVisible();
    await expect(page.getByText(/منصة جودة الكود التلقائية/i)).toBeVisible();
  });

  test('should switch to Spanish locale', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: /english/i }).click();
    await page.getByRole('option', { name: /español/i }).click();
    
    await expect(page).toHaveURL(/\/es/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });

  test('should display translated content in Spanish', async ({ page }) => {
    await page.goto('/es');
    
    await expect(page.getByText(/bienvenido a odavl studio/i)).toBeVisible();
  });

  test('should preserve locale when navigating', async ({ page }) => {
    await page.goto('/ar');
    
    await page.getByRole('link', { name: /لوحة التحكم/i }).click();
    
    await expect(page).toHaveURL(/\/ar\/dashboard/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  });

  test('should apply RTL styles for Arabic', async ({ page }) => {
    await page.goto('/ar');
    
    const body = page.locator('body');
    const direction = await body.evaluate((el) => 
      window.getComputedStyle(el).direction
    );
    
    expect(direction).toBe('rtl');
  });
});
