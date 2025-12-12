import { test, expect } from '@playwright/test';

test('billing page loads for authenticated user (mocked)', async ({ page }) => {
  await page.addInitScript(() => {
    document.cookie = "next-auth.session-token=mocked";
  });

  await page.goto('/app/billing');
  await expect(page.locator('h1')).toContainText(/Billing/i);
});

test('checkout API returns 500 when Stripe keys missing', async ({ request }) => {
  const response = await request.post('/api/billing/create-checkout');
  expect(response.status()).toBe(500);
});
