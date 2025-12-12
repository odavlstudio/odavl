import { test, expect } from '@playwright/test';

test('homepage loads under 2 seconds', async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  const elapsed = Date.now() - start;
  expect(elapsed).toBeLessThan(2000);
});
