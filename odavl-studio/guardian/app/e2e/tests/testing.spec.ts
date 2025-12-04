/**
 * E2E Test Suite: Test Execution
 * 
 * Coverage:
 * - Run E2E tests
 * - Run visual regression tests
 * - Run accessibility tests
 * - View test results
 * - Test history
 */

import { test, expect, helpers } from '../fixtures';

test.describe('Test Execution', () => {
    test.describe('Run Tests', () => {
        test('should run E2E test successfully', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            // Navigate to tests tab
            const testsTab = page.locator('a:has-text("Tests"), button:has-text("Tests")');
            await testsTab.click();

            await page.waitForTimeout(1000);

            // Click "Run Test" button
            const runTestButton = page.locator('button:has-text("Run Test"), button:has-text("New Test")');
            await runTestButton.click();

            // Wait for test configuration form
            await page.waitForTimeout(1000);

            // Select test type
            const testTypeSelect = page.locator('select[name="type"], [role="combobox"]').first();
            await testTypeSelect.selectOption('e2e');

            // Configure test (if additional fields available)
            const urlInput = page.locator('[name="url"], [placeholder*="URL"]');
            if (await urlInput.isVisible()) {
                await urlInput.fill('https://example.com');
            }

            // Start test
            await page.click('button[type="submit"]:has-text("Run"), button:has-text("Start")');

            // Wait for test to start
            const toast = await helpers.waitForToast(page);
            await expect(toast).toContainText(/started|running|queued/i);

            // Wait for test to complete (with timeout)
            await page.waitForTimeout(5000);

            // Check for completion indicator
            const statusIndicator = page.locator('[data-testid="test-status"], .status-badge');
            await expect(statusIndicator).toBeVisible({ timeout: 30000 });
        });

        test('should run visual regression test', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const testsTab = page.locator('a:has-text("Tests")');
            await testsTab.click();
            await page.waitForTimeout(1000);

            const runTestButton = page.locator('button:has-text("Run Test")');
            await runTestButton.click();
            await page.waitForTimeout(1000);

            // Select visual regression test
            const testTypeSelect = page.locator('select[name="type"]');
            await testTypeSelect.selectOption('visual');

            // Configure screenshots
            const urlInput = page.locator('[name="url"]');
            if (await urlInput.isVisible()) {
                await urlInput.fill('https://example.com');
            }

            // Start test
            await page.click('button:has-text("Run")');
            await helpers.waitForToast(page);

            // Wait for test completion
            await page.waitForTimeout(5000);
        });

        test('should run accessibility test', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const testsTab = page.locator('a:has-text("Tests")');
            await testsTab.click();
            await page.waitForTimeout(1000);

            const runTestButton = page.locator('button:has-text("Run Test")');
            await runTestButton.click();
            await page.waitForTimeout(1000);

            // Select accessibility test
            const testTypeSelect = page.locator('select[name="type"]');
            await testTypeSelect.selectOption('a11y');

            // Configure test
            const urlInput = page.locator('[name="url"]');
            if (await urlInput.isVisible()) {
                await urlInput.fill('https://example.com');
            }

            // Start test
            await page.click('button:has-text("Run")');
            await helpers.waitForToast(page);

            await page.waitForTimeout(5000);
        });

        test('should handle test errors gracefully', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const testsTab = page.locator('a:has-text("Tests")');
            await testsTab.click();
            await page.waitForTimeout(1000);

            const runTestButton = page.locator('button:has-text("Run Test")');
            await runTestButton.click();
            await page.waitForTimeout(1000);

            // Enter invalid URL
            const urlInput = page.locator('[name="url"]');
            if (await urlInput.isVisible()) {
                await urlInput.fill('invalid-url');

                await page.click('button:has-text("Run")');

                // Should show validation error
                const error = page.locator('[role="alert"], .error-message');
                await expect(error).toBeVisible({ timeout: 5000 });
            }
        });
    });

    test.describe('Test Results', () => {
        test('should display test results list', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const testsTab = page.locator('a:has-text("Tests"), a:has-text("History")');
            await testsTab.click();
            await page.waitForTimeout(1000);

            // Should see list of test runs (from seed data)
            const testRunsList = page.locator('[data-testid="test-runs-list"], .test-runs, table');
            await expect(testRunsList).toBeVisible();

            // Should see at least one test run
            const testRunItems = page.locator('[data-testid="test-run-item"], tr:has(td)');
            await expect(testRunItems.first()).toBeVisible();
        });

        test('should filter tests by type', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const testsTab = page.locator('a:has-text("Tests")');
            await testsTab.click();
            await page.waitForTimeout(1000);

            // Filter by E2E tests
            const filterSelect = page.locator('select[name="type"], [aria-label*="Filter"]');
            if (await filterSelect.isVisible()) {
                await filterSelect.selectOption('e2e');
                await page.waitForTimeout(500);

                // All visible tests should be E2E type
                const testItems = page.locator('[data-testid="test-run-item"]');
                const count = await testItems.count();

                for (let i = 0; i < count; i++) {
                    const typeLabel = testItems.nth(i).locator('[data-testid="test-type"]');
                    await expect(typeLabel).toContainText(/e2e/i);
                }
            }
        });

        test('should filter tests by status', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const testsTab = page.locator('a:has-text("Tests")');
            await testsTab.click();
            await page.waitForTimeout(1000);

            // Filter by passed tests
            const statusFilter = page.locator('select[name="status"]');
            if (await statusFilter.isVisible()) {
                await statusFilter.selectOption('passed');
                await page.waitForTimeout(500);

                // All visible tests should be passed
                const statusBadges = page.locator('[data-testid="test-status"]');
                const count = await statusBadges.count();

                for (let i = 0; i < count; i++) {
                    await expect(statusBadges.nth(i)).toContainText(/passed|success/i);
                }
            }
        });

        test('should view detailed test results', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const testsTab = page.locator('a:has-text("Tests")');
            await testsTab.click();
            await page.waitForTimeout(1000);

            // Click on first test run
            const firstTestRun = page.locator('[data-testid="test-run-item"], tr:has(td)').first();
            await firstTestRun.click();

            // Wait for details page
            await page.waitForTimeout(1000);

            // Should see test details
            await expect(page.locator('[data-testid="test-details"], .test-details')).toBeVisible();

            // Should see test metadata
            await expect(page.locator('text=/duration|time|status/i')).toBeVisible();
        });

        test('should display test screenshots (visual tests)', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const testsTab = page.locator('a:has-text("Tests")');
            await testsTab.click();
            await page.waitForTimeout(1000);

            // Find visual regression test
            const visualTest = page.locator('[data-testid="test-type"]:has-text("visual")').first();

            if (await visualTest.isVisible()) {
                await visualTest.click();
                await page.waitForTimeout(1000);

                // Should see screenshots section
                const screenshotsSection = page.locator('[data-testid="screenshots"], .screenshots');
                await expect(screenshotsSection).toBeVisible();

                // Should see at least one screenshot
                const screenshots = page.locator('img[alt*="screenshot"], [data-testid="screenshot-image"]');
                await expect(screenshots.first()).toBeVisible();
            }
        });

        test('should export test results', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const testsTab = page.locator('a:has-text("Tests")');
            await testsTab.click();
            await page.waitForTimeout(1000);

            // Click export button
            const exportButton = page.locator('button:has-text("Export"), button[aria-label*="Export"]');

            if (await exportButton.isVisible()) {
                // Setup download listener
                const downloadPromise = page.waitForEvent('download');

                await exportButton.click();

                // Wait for download
                const download = await downloadPromise;

                // Verify download
                expect(download.suggestedFilename()).toMatch(/\.(json|csv|pdf)$/);
            }
        });
    });

    test.describe('Test History', () => {
        test('should display test history timeline', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const historyTab = page.locator('a:has-text("History"), a:has-text("Timeline")');

            if (await historyTab.isVisible()) {
                await historyTab.click();
                await page.waitForTimeout(1000);

                // Should see timeline
                const timeline = page.locator('[data-testid="timeline"], .timeline');
                await expect(timeline).toBeVisible();
            }
        });

        test('should compare test results', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const testsTab = page.locator('a:has-text("Tests")');
            await testsTab.click();
            await page.waitForTimeout(1000);

            // Select two tests for comparison
            const compareButton = page.locator('button:has-text("Compare"), button[aria-label*="Compare"]');

            if (await compareButton.isVisible()) {
                // Select first test
                const firstCheckbox = page.locator('[type="checkbox"]').nth(0);
                await firstCheckbox.check();

                // Select second test
                const secondCheckbox = page.locator('[type="checkbox"]').nth(1);
                await secondCheckbox.check();

                // Click compare
                await compareButton.click();
                await page.waitForTimeout(1000);

                // Should see comparison view
                const comparison = page.locator('[data-testid="comparison"], .comparison');
                await expect(comparison).toBeVisible();
            }
        });
    });

    test.describe('Real-time Updates', () => {
        test('should show real-time test progress', async ({ authenticatedPage: page }) => {
            // Note: This test requires WebSocket connection
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const testsTab = page.locator('a:has-text("Tests")');
            await testsTab.click();
            await page.waitForTimeout(1000);

            // Start a test
            const runTestButton = page.locator('button:has-text("Run Test")');
            if (await runTestButton.isVisible()) {
                await runTestButton.click();
                await page.waitForTimeout(1000);

                const testTypeSelect = page.locator('select[name="type"]');
                await testTypeSelect.selectOption('e2e');

                await page.click('button:has-text("Run")');

                // Wait for progress indicator
                const progressBar = page.locator('[role="progressbar"], .progress-bar');
                await expect(progressBar).toBeVisible({ timeout: 10000 });

                // Status should update in real-time
                const statusText = page.locator('[data-testid="test-status"]');
                await expect(statusText).toContainText(/running|in progress/i, { timeout: 5000 });
            }
        });
    });
});
