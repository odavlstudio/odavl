import { test, expect } from '@playwright/test';

// Mock authentication for dashboard tests
test.use({
  storageState: 'tests/fixtures/auth.json', // Pre-authenticated state
});

test.describe('Dashboard', () => {
  test('should display dashboard overview', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page.getByRole('heading', { name: /welcome to odavl studio/i })).toBeVisible();
    await expect(page.getByText(/autonomous code quality platform/i)).toBeVisible();
  });

  test('should navigate to Insight dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.getByRole('link', { name: /insight/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/insight/);
    await expect(page.getByRole('heading', { name: /insight/i })).toBeVisible();
  });

  test('should navigate to Autopilot dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.getByRole('link', { name: /autopilot/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/autopilot/);
    await expect(page.getByRole('heading', { name: /autopilot/i })).toBeVisible();
  });

  test('should navigate to Guardian dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.getByRole('link', { name: /guardian/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/guardian/);
    await expect(page.getByRole('heading', { name: /guardian/i })).toBeVisible();
  });

  test('should display recent activity section', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page.getByText(/recent activity/i)).toBeVisible();
  });

  test('should display quick actions', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page.getByText(/quick actions/i)).toBeVisible();
  });
});
