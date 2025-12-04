import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display sign-in page', async ({ page }) => {
    await page.goto('/auth/signin');
    
    await expect(page).toHaveTitle(/Sign In/i);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('should show GitHub OAuth button', async ({ page }) => {
    await page.goto('/auth/signin');
    
    const githubButton = page.getByRole('button', { name: /continue with github/i });
    await expect(githubButton).toBeVisible();
  });

  test('should show Google OAuth button', async ({ page }) => {
    await page.goto('/auth/signin');
    
    const googleButton = page.getByRole('button', { name: /continue with google/i });
    await expect(googleButton).toBeVisible();
  });

  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to sign-in
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test('should preserve callback URL after sign-in redirect', async ({ page }) => {
    await page.goto('/dashboard/insight');
    
    // Should redirect with callback URL
    await expect(page).toHaveURL(/callbackUrl=%2Fdashboard%2Finsight/);
  });
});
