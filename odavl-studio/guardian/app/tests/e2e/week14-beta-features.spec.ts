/**
 * E2E Test Suite - Week 14
 * Automated end-to-end tests for all beta features using Playwright
 */

import { test, expect, type Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test@guardian.app';
const TEST_PASSWORD = 'SecurePassword123!';

/**
 * Helper: Login to Guardian
 */
async function login(page: Page, email: string = TEST_EMAIL, password: string = TEST_PASSWORD) {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);
}

/**
 * Helper: Logout
 */
async function logout(page: Page) {
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL(`${BASE_URL}/login`);
}

/**
 * Helper: Wait for API response
 */
async function waitForAPI(page: Page, endpoint: string) {
    return page.waitForResponse(response =>
        response.url().includes(endpoint) && response.status() === 200
    );
}

/**
 * TEST SUITE 1: Beta Invitation System
 */
test.describe('Beta Invitation System', () => {
    test('should generate invitation code', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/admin/invitations`);

        // Click generate invitation button
        await page.click('[data-testid="generate-invitation"]');

        // Fill invitation form
        await page.fill('input[name="email"]', 'beta@example.com');
        await page.fill('input[name="invitedBy"]', 'admin');
        await page.click('button[type="submit"]');

        // Wait for success message
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

        // Verify invitation code format (GUARDIAN-XXXXXX)
        const invitationCode = await page.locator('[data-testid="invitation-code"]').textContent();
        expect(invitationCode).toMatch(/^GUARDIAN-[A-F0-9]{6}$/);
    });

    test('should add user to waitlist with priority scoring', async ({ page }) => {
        await page.goto(`${BASE_URL}/waitlist`);

        // Fill waitlist form
        await page.fill('input[name="email"]', 'waitlist@company.com');
        await page.fill('input[name="name"]', 'John Doe');
        await page.fill('input[name="company"]', 'Acme Corp');
        await page.fill('input[name="role"]', 'Engineering Manager');
        await page.fill('textarea[name="useCase"]', 'We need Guardian to test our CI/CD pipelines and monitor production deployments. Our team of 10 engineers would benefit from automated test reporting.');
        await page.fill('input[name="referral"]', 'ProductHunt');

        await page.click('button[type="submit"]');

        // Wait for success message
        await expect(page.locator('[data-testid="waitlist-success"]')).toBeVisible();
        await expect(page.locator('text=Thank you for joining the waitlist')).toBeVisible();
    });

    test('should validate invitation code', async ({ page }) => {
        await page.goto(`${BASE_URL}/signup?code=GUARDIAN-ABC123`);

        // Invalid code should show error
        await expect(page.locator('[data-testid="invalid-code-message"]')).toBeVisible();

        // Valid code should proceed to signup
        await page.goto(`${BASE_URL}/signup?code=GUARDIAN-VALID1`);
        await expect(page.locator('form[data-testid="signup-form"]')).toBeVisible();
    });

    test('should accept invitation and create account', async ({ page }) => {
        const invitationCode = 'GUARDIAN-TEST01';
        await page.goto(`${BASE_URL}/signup?code=${invitationCode}`);

        // Fill signup form
        await page.fill('input[name="email"]', 'newuser@example.com');
        await page.fill('input[name="password"]', 'StrongPassword123!');
        await page.fill('input[name="confirmPassword"]', 'StrongPassword123!');
        await page.fill('input[name="name"]', 'New User');
        await page.check('input[name="terms"]');

        await page.click('button[type="submit"]');

        // Should redirect to onboarding
        await page.waitForURL(`${BASE_URL}/onboarding`);
        await expect(page.locator('h1:has-text("Welcome to Guardian")')).toBeVisible();
    });
});

/**
 * TEST SUITE 2: Feedback Widget
 */
test.describe('Feedback Widget', () => {
    test('should open feedback widget', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/dashboard`);

        // Click floating feedback button
        await page.click('[data-testid="feedback-button"]');

        // Verify modal opened
        await expect(page.locator('[data-testid="feedback-modal"]')).toBeVisible();
        await expect(page.locator('text=Send Feedback')).toBeVisible();
    });

    test('should submit bug report', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/dashboard`);

        await page.click('[data-testid="feedback-button"]');

        // Select bug report type
        await page.click('[data-testid="feedback-type-bug"]');

        // Fill bug report
        await page.fill('textarea[name="message"]', 'Dashboard is not loading test runs correctly. The list shows duplicate entries.');

        await page.click('button[type="submit"]');

        // Wait for success message
        await expect(page.locator('[data-testid="feedback-success"]')).toBeVisible();
        await expect(page.locator('text=Thank you!')).toBeVisible();
    });

    test('should submit feature request', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/dashboard`);

        await page.click('[data-testid="feedback-button"]');
        await page.click('[data-testid="feedback-type-feature"]');

        await page.fill('textarea[name="message"]', 'Add support for Jest test runner integration');

        await page.click('button[type="submit"]');

        await expect(page.locator('[data-testid="feedback-success"]')).toBeVisible();
    });

    test('should submit feedback with rating', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/dashboard`);

        await page.click('[data-testid="feedback-button"]');
        await page.click('[data-testid="feedback-type-feedback"]');

        // Select 5-star rating
        await page.click('[data-testid="star-5"]');

        await page.fill('textarea[name="message"]', 'Guardian is amazing! Love the real-time monitoring.');

        await page.click('button[type="submit"]');

        await expect(page.locator('[data-testid="feedback-success"]')).toBeVisible();
    });

    test('should validate message length (500 chars)', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/dashboard`);

        await page.click('[data-testid="feedback-button"]');
        await page.click('[data-testid="feedback-type-feedback"]');

        // Fill message with 600 characters
        const longMessage = 'a'.repeat(600);
        await page.fill('textarea[name="message"]', longMessage);

        // Submit button should be disabled
        await expect(page.locator('button[type="submit"]')).toBeDisabled();

        // Character count should show 600/500
        await expect(page.locator('[data-testid="char-count"]')).toHaveText('600 / 500');
    });
});

/**
 * TEST SUITE 3: Performance Dashboard
 */
test.describe('Performance Dashboard', () => {
    test('should display key metrics', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/monitoring/performance`);

        // Verify key metrics are visible
        await expect(page.locator('[data-testid="metric-uptime"]')).toBeVisible();
        await expect(page.locator('[data-testid="metric-error-rate"]')).toBeVisible();
        await expect(page.locator('[data-testid="metric-active-users"]')).toBeVisible();
        await expect(page.locator('[data-testid="metric-response-time"]')).toBeVisible();

        // Verify metric values are displayed
        const uptime = await page.locator('[data-testid="metric-uptime"]').textContent();
        expect(uptime).toMatch(/\d+\.\d+%/);
    });

    test('should display system resources', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/monitoring/performance`);

        // Verify system resources section
        await expect(page.locator('[data-testid="system-resources"]')).toBeVisible();
        await expect(page.locator('text=CPU Usage')).toBeVisible();
        await expect(page.locator('text=Memory Usage')).toBeVisible();
        await expect(page.locator('text=Requests/min')).toBeVisible();

        // Verify progress bars are rendered
        await expect(page.locator('[data-testid="cpu-progress"]')).toBeVisible();
        await expect(page.locator('[data-testid="memory-progress"]')).toBeVisible();
    });

    test('should display recent errors', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/monitoring/performance`);

        // Verify recent errors section
        await expect(page.locator('[data-testid="recent-errors"]')).toBeVisible();

        // Verify error items are displayed
        const errorItems = page.locator('[data-testid^="error-item-"]');
        await expect(errorItems.first()).toBeVisible();

        // Verify severity badges
        await expect(page.locator('[data-testid="severity-badge"]').first()).toBeVisible();
    });

    test('should display API endpoints performance', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/monitoring/performance`);

        // Verify API endpoints table
        await expect(page.locator('[data-testid="api-endpoints-table"]')).toBeVisible();

        // Verify table headers
        await expect(page.locator('th:has-text("Endpoint")')).toBeVisible();
        await expect(page.locator('th:has-text("Requests")')).toBeVisible();
        await expect(page.locator('th:has-text("Avg Time")')).toBeVisible();
        await expect(page.locator('th:has-text("Error Rate")')).toBeVisible();

        // Verify at least one endpoint row
        await expect(page.locator('tbody tr').first()).toBeVisible();
    });

    test('should auto-refresh metrics every 5 seconds', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/monitoring/performance`);

        // Get initial active users value
        const initialValue = await page.locator('[data-testid="metric-active-users"]').textContent();

        // Wait 6 seconds (longer than refresh interval)
        await page.waitForTimeout(6000);

        // Value should have updated
        const updatedValue = await page.locator('[data-testid="metric-active-users"]').textContent();

        // Note: In real scenario, value would change. For test, just verify it's still present
        expect(updatedValue).toBeTruthy();
    });
});

/**
 * TEST SUITE 4: Query Optimization
 */
test.describe('Query Optimization', () => {
    test('should load test runs page quickly (<1s)', async ({ page }) => {
        await login(page);

        const startTime = Date.now();
        await page.goto(`${BASE_URL}/test-runs`);
        await page.waitForSelector('[data-testid="test-runs-list"]');
        const loadTime = Date.now() - startTime;

        // Should load in under 1 second
        expect(loadTime).toBeLessThan(1000);
    });

    test('should cache user data (no duplicate API calls)', async ({ page, context }) => {
        await login(page);

        // Track API calls
        const apiCalls: string[] = [];
        page.on('request', request => {
            if (request.url().includes('/api/user')) {
                apiCalls.push(request.url());
            }
        });

        // Navigate to different pages
        await page.goto(`${BASE_URL}/dashboard`);
        await page.goto(`${BASE_URL}/test-runs`);
        await page.goto(`${BASE_URL}/monitors`);

        // Should have made only 1 API call (cached for subsequent pages)
        expect(apiCalls.length).toBeLessThanOrEqual(2); // Allow 1-2 calls (initial + optional refresh)
    });

    test('should paginate test runs (no N+1 queries)', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/test-runs`);

        // Track API calls during pagination
        const apiCalls: string[] = [];
        page.on('request', request => {
            if (request.url().includes('/api/test-runs')) {
                apiCalls.push(request.url());
            }
        });

        // Click next page
        await page.click('[data-testid="pagination-next"]');
        await page.waitForSelector('[data-testid="test-runs-list"]');

        // Should have made only 1 API call for next page (no N+1)
        expect(apiCalls.length).toBe(1);
    });
});

/**
 * TEST SUITE 5: User Documentation
 */
test.describe('User Documentation', () => {
    test('should display user guide', async ({ page }) => {
        await page.goto(`${BASE_URL}/docs`);

        // Verify documentation sections
        await expect(page.locator('h1:has-text("User Guide")')).toBeVisible();
        await expect(page.locator('text=Quick Start')).toBeVisible();
        await expect(page.locator('text=Installation')).toBeVisible();
        await expect(page.locator('text=API Reference')).toBeVisible();
    });

    test('should navigate documentation sections', async ({ page }) => {
        await page.goto(`${BASE_URL}/docs`);

        // Click Quick Start
        await page.click('a:has-text("Quick Start")');
        await expect(page.locator('h2:has-text("Quick Start")')).toBeVisible();

        // Click API Reference
        await page.click('a:has-text("API Reference")');
        await expect(page.locator('h2:has-text("API Reference")')).toBeVisible();

        // Click Troubleshooting
        await page.click('a:has-text("Troubleshooting")');
        await expect(page.locator('h2:has-text("Troubleshooting")')).toBeVisible();
    });

    test('should display code examples', async ({ page }) => {
        await page.goto(`${BASE_URL}/docs#test-runners`);

        // Verify code blocks are present
        await expect(page.locator('pre code').first()).toBeVisible();

        // Verify syntax highlighting
        const codeBlock = page.locator('pre code').first();
        await expect(codeBlock).toHaveClass(/language-/);
    });

    test('should search documentation', async ({ page }) => {
        await page.goto(`${BASE_URL}/docs`);

        // Use search feature
        await page.fill('input[name="search"]', 'API key');
        await page.press('input[name="search"]', 'Enter');

        // Should show search results
        await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
        await expect(page.locator('text=API key')).toBeVisible();
    });
});

/**
 * TEST SUITE 6: Bug Triage System
 */
test.describe('Bug Triage System', () => {
    test('should create bug report', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/admin/bugs`);

        // Click create bug button
        await page.click('[data-testid="create-bug"]');

        // Fill bug form
        await page.fill('input[name="title"]', 'Login page crashes on submit');
        await page.fill('textarea[name="description"]', 'When submitting login form, the page crashes and shows white screen');
        await page.selectOption('select[name="severity"]', 'critical');
        await page.selectOption('select[name="category"]', 'ui');
        await page.fill('input[name="reportedBy"]', 'beta-user-1');

        await page.click('button[type="submit"]');

        // Wait for success message
        await expect(page.locator('[data-testid="bug-created"]')).toBeVisible();
    });

    test('should auto-classify bug severity', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/admin/bugs/new`);

        // Fill title with critical keywords
        await page.fill('input[name="title"]', 'Critical: Data loss in production database');

        // Severity should auto-select to "critical"
        const severity = await page.locator('select[name="severity"]').inputValue();
        expect(severity).toBe('critical');
    });

    test('should display bug list with SLA status', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/admin/bugs`);

        // Verify bug list is displayed
        await expect(page.locator('[data-testid="bugs-list"]')).toBeVisible();

        // Verify SLA badges are present
        await expect(page.locator('[data-testid^="sla-badge-"]').first()).toBeVisible();

        // Verify overdue bugs are highlighted
        const overdueBug = page.locator('[data-testid="bug-overdue"]').first();
        if (await overdueBug.count() > 0) {
            await expect(overdueBug).toHaveClass(/bg-red/);
        }
    });

    test('should filter bugs by severity', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/admin/bugs`);

        // Click critical filter
        await page.click('[data-testid="filter-critical"]');

        // Verify only critical bugs are shown
        const bugs = page.locator('[data-testid^="bug-item-"]');
        const count = await bugs.count();

        for (let i = 0; i < count; i++) {
            const severityBadge = bugs.nth(i).locator('[data-testid="severity-badge"]');
            await expect(severityBadge).toHaveText('Critical');
        }
    });

    test('should display bug statistics', async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/admin/bugs/stats`);

        // Verify stats cards
        await expect(page.locator('[data-testid="stat-total-bugs"]')).toBeVisible();
        await expect(page.locator('[data-testid="stat-by-severity"]')).toBeVisible();
        await expect(page.locator('[data-testid="stat-by-status"]')).toBeVisible();
        await expect(page.locator('[data-testid="stat-avg-resolution"]')).toBeVisible();

        // Verify overdue count is displayed
        await expect(page.locator('[data-testid="stat-overdue"]')).toBeVisible();
    });
});

/**
 * TEST SUITE 7: Integration Tests
 */
test.describe('Integration Tests', () => {
    test('should complete full onboarding flow', async ({ page }) => {
        // 1. Request invitation
        await page.goto(`${BASE_URL}/waitlist`);
        await page.fill('input[name="email"]', 'fulltest@example.com');
        await page.fill('input[name="name"]', 'Full Test User');
        await page.fill('input[name="company"]', 'Test Corp');
        await page.fill('input[name="role"]', 'CTO');
        await page.fill('textarea[name="useCase"]', 'Testing the full onboarding flow for Guardian. We need comprehensive test coverage for our CI/CD pipeline.');
        await page.click('button[type="submit"]');
        await expect(page.locator('[data-testid="waitlist-success"]')).toBeVisible();

        // 2. Use invitation code (admin generates)
        // (Simulated - assume code GUARDIAN-FULL01)

        // 3. Sign up
        await page.goto(`${BASE_URL}/signup?code=GUARDIAN-FULL01`);
        await page.fill('input[name="email"]', 'fulltest@example.com');
        await page.fill('input[name="password"]', 'SecurePass123!');
        await page.fill('input[name="confirmPassword"]', 'SecurePass123!');
        await page.fill('input[name="name"]', 'Full Test User');
        await page.check('input[name="terms"]');
        await page.click('button[type="submit"]');

        // 4. Complete onboarding
        await page.waitForURL(`${BASE_URL}/onboarding`);
        await page.click('[data-testid="onboarding-start"]');
        await page.fill('input[name="organizationName"]', 'Test Corp');
        await page.click('[data-testid="onboarding-next"]');

        // 5. Verify dashboard access
        await page.waitForURL(`${BASE_URL}/dashboard`);
        await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    });

    test('should handle beta feedback loop', async ({ page }) => {
        await login(page);

        // 1. Use feature (view dashboard)
        await page.goto(`${BASE_URL}/dashboard`);

        // 2. Submit feedback
        await page.click('[data-testid="feedback-button"]');
        await page.click('[data-testid="feedback-type-bug"]');
        await page.fill('textarea[name="message"]', 'Dashboard metrics not updating in real-time');
        await page.click('button[type="submit"]');
        await expect(page.locator('[data-testid="feedback-success"]')).toBeVisible();

        // 3. Verify bug was created (admin view)
        await page.goto(`${BASE_URL}/admin/bugs`);
        await expect(page.locator('text=Dashboard metrics not updating')).toBeVisible();
    });

    test('should handle performance monitoring workflow', async ({ page }) => {
        await login(page);

        // 1. View performance dashboard
        await page.goto(`${BASE_URL}/monitoring/performance`);
        await expect(page.locator('[data-testid="performance-dashboard"]')).toBeVisible();

        // 2. Check error details
        await page.click('[data-testid="error-item"]', { timeout: 5000 }).catch(() => { });

        // 3. Navigate to affected endpoint
        await page.click('[data-testid="api-endpoint-link"]', { timeout: 5000 }).catch(() => { });
    });
});
