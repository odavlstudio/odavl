import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});

test('auth page styling does not crash due to CSP', async ({ page }) => {
  await page.goto('/auth/signin');
  await expect(page.locator('form')).toBeVisible();
});
