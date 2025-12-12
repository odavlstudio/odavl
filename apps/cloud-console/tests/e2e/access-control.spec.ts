import { test, expect } from '@playwright/test';

const protectedRoutes = [
  '/app/dashboard',
  '/app/projects',
  '/app/settings',
  '/app/billing',
];

for (const route of protectedRoutes) {
  test(`unauthenticated cannot access ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/auth\/signin/);
  });
}
