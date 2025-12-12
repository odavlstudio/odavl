import { test, expect } from '@playwright/test';

test('user can load signin page', async ({ page }) => {
  await page.goto('/auth/signin');
  await expect(page).toHaveTitle(/Sign/);
});

test('unauthenticated user is redirected from /app/dashboard', async ({ page }) => {
  await page.goto('/app/dashboard');
  await expect(page).toHaveURL(/auth\/signin/);
});
