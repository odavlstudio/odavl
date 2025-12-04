/**
 * E2E Test Suite: Authentication Flows
 * 
 * Coverage:
 * - User registration
 * - Login/logout
 * - Password reset
 * - Session persistence
 * - Protected routes
 */

import { test, expect, helpers } from '../fixtures';

test.describe('Authentication', () => {
    test.describe('Login', () => {
        test('should login with valid credentials', async ({ page }) => {
            await page.goto('/api/auth/signin');

            // Fill login form
            await page.fill('[name="email"]', 'e2e-test-user@odavl.com');
            await page.fill('[name="password"]', 'TestPassword123!');

            // Submit form
            await page.click('button[type="submit"]');

            // Wait for redirect to dashboard
            await page.waitForURL('/dashboard', { timeout: 10000 });

            // Verify we're on dashboard
            await expect(page).toHaveURL(/.*dashboard/);
            await expect(page.locator('h1')).toContainText('Dashboard');
        });

        test('should show error for invalid credentials', async ({ page }) => {
            await page.goto('/api/auth/signin');

            // Fill with invalid credentials
            await page.fill('[name="email"]', 'invalid@example.com');
            await page.fill('[name="password"]', 'wrongpassword');

            // Submit form
            await page.click('button[type="submit"]');

            // Wait for error message
            const errorMessage = page.locator('[role="alert"]');
            await expect(errorMessage).toBeVisible({ timeout: 5000 });
            await expect(errorMessage).toContainText(/invalid credentials|incorrect password/i);
        });

        test('should show validation errors for empty fields', async ({ page }) => {
            await page.goto('/api/auth/signin');

            // Submit empty form
            await page.click('button[type="submit"]');

            // Check for validation errors
            const emailError = page.locator('text=/email.*required/i');
            const passwordError = page.locator('text=/password.*required/i');

            await expect(emailError.or(page.locator('[name="email"]:invalid'))).toBeVisible();
            await expect(passwordError.or(page.locator('[name="password"]:invalid'))).toBeVisible();
        });

        test('should remember me checkbox persist session', async ({ page, context }) => {
            await page.goto('/api/auth/signin');

            // Login with remember me
            await page.fill('[name="email"]', 'e2e-test-user@odavl.com');
            await page.fill('[name="password"]', 'TestPassword123!');

            // Check "Remember me" if available
            const rememberCheckbox = page.locator('[name="remember"]');
            if (await rememberCheckbox.isVisible()) {
                await rememberCheckbox.check();
            }

            await page.click('button[type="submit"]');
            await page.waitForURL('/dashboard', { timeout: 10000 });

            // Close and reopen browser
            await page.close();
            const newPage = await context.newPage();
            await newPage.goto('/dashboard');

            // Should still be logged in
            await expect(newPage).toHaveURL(/.*dashboard/);
        });
    });

    test.describe('Logout', () => {
        test('should logout successfully', async ({ authenticatedPage: page }) => {
            // User is already logged in via fixture
            await expect(page).toHaveURL(/.*dashboard/);

            // Click logout button (adjust selector based on your UI)
            const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout")');
            await logoutButton.click();

            // Wait for redirect to login page
            await page.waitForURL(/.*signin/, { timeout: 5000 });

            // Verify we're logged out
            await expect(page).toHaveURL(/.*signin/);
        });

        test('should not access protected routes after logout', async ({ authenticatedPage: page }) => {
            // Logout
            await helpers.logout(page);

            // Try to access dashboard
            await page.goto('/dashboard');

            // Should redirect to login
            await page.waitForURL(/.*signin/, { timeout: 5000 });
            await expect(page).toHaveURL(/.*signin/);
        });
    });

    test.describe('Protected Routes', () => {
        test('should redirect unauthenticated user to login', async ({ page }) => {
            await page.goto('/dashboard');

            // Should redirect to login
            await page.waitForURL(/.*signin/, { timeout: 5000 });
            await expect(page).toHaveURL(/.*signin/);
        });

        test('should allow access to protected routes when authenticated', async ({ authenticatedPage: page }) => {
            // Try to access various protected routes
            const protectedRoutes = [
                '/dashboard',
                '/projects',
                '/monitors',
                '/settings',
            ];

            for (const route of protectedRoutes) {
                await page.goto(route);

                // Should NOT redirect to login
                await expect(page).not.toHaveURL(/.*signin/);

                // Wait a bit to ensure no redirect happens
                await page.waitForTimeout(1000);
                await expect(page).toHaveURL(new RegExp(route));
            }
        });

        test('should restrict admin routes to admins only', async ({ authenticatedPage: page, adminPage }) => {
            // Regular user should NOT see admin options
            await page.goto('/admin');

            // Should get 403 or redirect to dashboard
            await page.waitForTimeout(2000);
            const url = page.url();
            expect(url).toMatch(/403|forbidden|dashboard/i);

            // Admin user should access admin routes
            await adminPage.goto('/admin');
            await adminPage.waitForTimeout(2000);
            await expect(adminPage).toHaveURL(/.*admin/);
        });
    });

    test.describe('Session Management', () => {
        test('should maintain session across page reloads', async ({ authenticatedPage: page }) => {
            await expect(page).toHaveURL(/.*dashboard/);

            // Reload page
            await page.reload();

            // Should still be logged in
            await page.waitForTimeout(2000);
            await expect(page).toHaveURL(/.*dashboard/);
            await expect(page.locator('h1')).toContainText('Dashboard');
        });

        test('should handle concurrent sessions', async ({ browser }) => {
            const context1 = await browser.newContext();
            const context2 = await browser.newContext();

            const page1 = await context1.newPage();
            const page2 = await context2.newPage();

            // Login in both contexts
            await helpers.login(page1, 'e2e-test-user@odavl.com', 'TestPassword123!');
            await helpers.login(page2, 'e2e-test-user@odavl.com', 'TestPassword123!');

            // Both should be logged in
            await expect(page1).toHaveURL(/.*dashboard/);
            await expect(page2).toHaveURL(/.*dashboard/);

            // Logout from one
            await helpers.logout(page1);

            // Other session should still be active
            await page2.reload();
            await page2.waitForTimeout(2000);
            await expect(page2).toHaveURL(/.*dashboard/);

            // Cleanup
            await context1.close();
            await context2.close();
        });

        test('should expire session after timeout', async ({ authenticatedPage: page }) => {
            // Note: This test requires short session timeout in test environment
            // Skip if session timeout is too long
            test.skip(process.env.SESSION_TIMEOUT_MINUTES !== '1', 'Session timeout too long for testing');

            await expect(page).toHaveURL(/.*dashboard/);

            // Wait for session to expire (adjust based on your timeout)
            await page.waitForTimeout(65000); // 65 seconds

            // Try to navigate
            await page.goto('/projects');

            // Should redirect to login
            await page.waitForURL(/.*signin/, { timeout: 5000 });
            await expect(page).toHaveURL(/.*signin/);
        });
    });
});
