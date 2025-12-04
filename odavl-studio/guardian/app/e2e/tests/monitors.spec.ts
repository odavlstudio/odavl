/**
 * E2E Test Suite: Monitor Management
 * 
 * Coverage:
 * - Create/edit/delete monitors
 * - View monitor status
 * - Monitor checks
 * - Alerts
 */

import { test, expect, helpers } from '../fixtures';

test.describe('Monitors', () => {
    test.describe('Monitor List', () => {
        test('should display list of monitors', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            // Navigate to monitors
            const monitorsTab = page.locator('a:has-text("Monitors")');
            await monitorsTab.click();

            await page.waitForTimeout(1000);

            // Should see monitors list (from seed data)
            const monitorsList = page.locator('[data-testid="monitors-list"], .monitors');
            await expect(monitorsList).toBeVisible();

            // Should see test monitors
            await expect(page.getByText('Homepage Health Check')).toBeVisible();
            await expect(page.getByText('API Endpoint Check')).toBeVisible();
        });

        test('should display monitor status indicators', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const monitorsTab = page.locator('a:has-text("Monitors")');
            await monitorsTab.click();
            await page.waitForTimeout(1000);

            // Check for status indicators
            const statusIndicators = page.locator('[data-testid="monitor-status"], .status-badge');
            await expect(statusIndicators.first()).toBeVisible();

            // Should show "up", "down", or "paused"
            const firstStatus = await statusIndicators.first().textContent();
            expect(firstStatus?.toLowerCase()).toMatch(/up|down|paused|active/);
        });

        test('should filter monitors by status', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const monitorsTab = page.locator('a:has-text("Monitors")');
            await monitorsTab.click();
            await page.waitForTimeout(1000);

            // Filter by "up" status
            const filterSelect = page.locator('select[name="status"], [role="combobox"]');
            if (await filterSelect.isVisible()) {
                await filterSelect.selectOption('up');
                await page.waitForTimeout(500);

                // All visible monitors should be "up"
                const statusBadges = page.locator('[data-testid="monitor-status"]');
                const count = await statusBadges.count();

                for (let i = 0; i < count; i++) {
                    await expect(statusBadges.nth(i)).toContainText(/up|active/i);
                }
            }
        });
    });

    test.describe('Create Monitor', () => {
        test('should create HTTP monitor', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const monitorsTab = page.locator('a:has-text("Monitors")');
            await monitorsTab.click();
            await page.waitForTimeout(1000);

            // Click "New Monitor"
            const newMonitorButton = page.locator('button:has-text("New Monitor"), button:has-text("Create")');
            await newMonitorButton.click();
            await page.waitForTimeout(1000);

            // Fill monitor form
            await page.fill('[name="name"]', `Test Monitor ${Date.now()}`);
            await page.fill('[name="url"]', 'https://example.com');

            // Select monitor type
            const typeSelect = page.locator('select[name="type"]');
            if (await typeSelect.isVisible()) {
                await typeSelect.selectOption('http');
            }

            // Set interval (if available)
            const intervalInput = page.locator('[name="interval"]');
            if (await intervalInput.isVisible()) {
                await intervalInput.fill('60');
            }

            // Submit
            await page.click('button[type="submit"]:has-text("Create")');

            // Wait for success
            const toast = await helpers.waitForToast(page);
            await expect(toast).toContainText(/created|success/i);

            // Should see new monitor in list
            await page.waitForTimeout(2000);
            await expect(page.getByText('Test Monitor')).toBeVisible();
        });

        test('should validate monitor URL', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const monitorsTab = page.locator('a:has-text("Monitors")');
            await monitorsTab.click();
            await page.waitForTimeout(1000);

            const newMonitorButton = page.locator('button:has-text("New Monitor")');
            await newMonitorButton.click();
            await page.waitForTimeout(1000);

            // Fill with invalid URL
            await page.fill('[name="name"]', 'Invalid Monitor');
            await page.fill('[name="url"]', 'not-a-url');

            // Submit
            await page.click('button[type="submit"]:has-text("Create")');

            // Should show validation error
            const error = page.locator('[role="alert"], .error-message');
            await expect(error).toBeVisible({ timeout: 5000 });
            await expect(error).toContainText(/invalid.*url|valid.*url/i);
        });

        test('should configure monitor intervals', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const monitorsTab = page.locator('a:has-text("Monitors")');
            await monitorsTab.click();
            await page.waitForTimeout(1000);

            const newMonitorButton = page.locator('button:has-text("New Monitor")');
            await newMonitorButton.click();
            await page.waitForTimeout(1000);

            // Configure different intervals
            await page.fill('[name="name"]', 'Frequent Check');
            await page.fill('[name="url"]', 'https://api.example.com');

            const intervalInput = page.locator('[name="interval"]');
            if (await intervalInput.isVisible()) {
                // Try 30 seconds (minimum)
                await intervalInput.fill('30');

                await page.click('button[type="submit"]:has-text("Create")');

                // Should succeed or show minimum interval error
                await page.waitForTimeout(2000);
            }
        });
    });

    test.describe('Edit Monitor', () => {
        test('should edit monitor configuration', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const monitorsTab = page.locator('a:has-text("Monitors")');
            await monitorsTab.click();
            await page.waitForTimeout(1000);

            // Click on first monitor
            await page.getByText('Homepage Health Check').click();
            await page.waitForTimeout(1000);

            // Click edit button
            const editButton = page.locator('button:has-text("Edit"), button[aria-label*="Edit"]');
            await editButton.click();
            await page.waitForTimeout(1000);

            // Update interval
            const intervalInput = page.locator('[name="interval"]');
            if (await intervalInput.isVisible()) {
                await intervalInput.fill('120');

                await page.click('button[type="submit"]:has-text("Save")');

                // Wait for success
                await helpers.waitForToast(page);

                // Verify change
                await page.reload();
                await page.waitForTimeout(1000);
                await expect(page.getByText('120')).toBeVisible();
            }
        });

        test('should pause and resume monitor', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const monitorsTab = page.locator('a:has-text("Monitors")');
            await monitorsTab.click();
            await page.waitForTimeout(1000);

            await page.getByText('Homepage Health Check').click();
            await page.waitForTimeout(1000);

            // Pause monitor
            const pauseButton = page.locator('button:has-text("Pause")');
            if (await pauseButton.isVisible()) {
                await pauseButton.click();
                await helpers.waitForToast(page);

                // Status should update to "paused"
                const statusBadge = page.locator('[data-testid="monitor-status"]');
                await expect(statusBadge).toContainText(/paused/i);

                // Resume monitor
                const resumeButton = page.locator('button:has-text("Resume")');
                await resumeButton.click();
                await helpers.waitForToast(page);

                // Status should update to "active"
                await expect(statusBadge).toContainText(/active|up/i);
            }
        });
    });

    test.describe('Delete Monitor', () => {
        test('should delete monitor with confirmation', async ({ authenticatedPage: page }) => {
            // Create a monitor to delete
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const monitorsTab = page.locator('a:has-text("Monitors")');
            await monitorsTab.click();
            await page.waitForTimeout(1000);

            const newMonitorButton = page.locator('button:has-text("New Monitor")');
            await newMonitorButton.click();
            await page.waitForTimeout(1000);

            const monitorName = `Delete Test ${Date.now()}`;
            await page.fill('[name="name"]', monitorName);
            await page.fill('[name="url"]', 'https://example.com');

            await page.click('button[type="submit"]:has-text("Create")');
            await helpers.waitForToast(page);
            await page.waitForTimeout(2000);

            // Now delete it
            await page.getByText(monitorName).click();
            await page.waitForTimeout(1000);

            const deleteButton = page.locator('button:has-text("Delete")');
            await deleteButton.click();

            // Confirm deletion
            await page.waitForTimeout(500);
            const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")').last();
            await confirmButton.click();

            // Wait for success
            await helpers.waitForToast(page);

            // Should navigate back to monitors list
            await page.waitForTimeout(2000);
            await expect(page.getByText(monitorName)).not.toBeVisible();
        });
    });

    test.describe('Monitor Checks', () => {
        test('should display check history', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const monitorsTab = page.locator('a:has-text("Monitors")');
            await monitorsTab.click();
            await page.waitForTimeout(1000);

            await page.getByText('Homepage Health Check').click();
            await page.waitForTimeout(1000);

            // Should see checks history
            const checksHistory = page.locator('[data-testid="checks-history"], .checks');
            await expect(checksHistory).toBeVisible();

            // Should see at least one check (from seed data)
            const checkItems = page.locator('[data-testid="check-item"], tr:has(td)');
            await expect(checkItems.first()).toBeVisible();
        });

        test('should display response time chart', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const monitorsTab = page.locator('a:has-text("Monitors")');
            await monitorsTab.click();
            await page.waitForTimeout(1000);

            await page.getByText('Homepage Health Check').click();
            await page.waitForTimeout(1000);

            // Should see response time chart
            const chart = page.locator('[data-testid="response-time-chart"], .chart, svg');
            await expect(chart).toBeVisible({ timeout: 5000 });
        });

        test('should display uptime percentage', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const monitorsTab = page.locator('a:has-text("Monitors")');
            await monitorsTab.click();
            await page.waitForTimeout(1000);

            await page.getByText('Homepage Health Check').click();
            await page.waitForTimeout(1000);

            // Should see uptime percentage
            const uptime = page.locator('[data-testid="uptime"], text=/uptime/i');
            await expect(uptime).toBeVisible();

            // Should be a percentage
            const uptimeText = await uptime.textContent();
            expect(uptimeText).toMatch(/\d+(\.\d+)?%/);
        });
    });

    test.describe('Alerts', () => {
        test('should display alerts list', async ({ authenticatedPage: page }) => {
            await page.goto('/alerts');

            await page.waitForTimeout(1000);

            // Should see alerts page
            await expect(page.locator('h1, h2')).toContainText(/alerts/i);

            // Alerts list should be visible
            const alertsList = page.locator('[data-testid="alerts-list"], .alerts');
            await expect(alertsList).toBeVisible();
        });

        test('should filter alerts by severity', async ({ authenticatedPage: page }) => {
            await page.goto('/alerts');
            await page.waitForTimeout(1000);

            // Filter by critical alerts
            const severityFilter = page.locator('select[name="severity"]');
            if (await severityFilter.isVisible()) {
                await severityFilter.selectOption('critical');
                await page.waitForTimeout(500);

                // All visible alerts should be critical
                const severityBadges = page.locator('[data-testid="alert-severity"]');
                const count = await severityBadges.count();

                for (let i = 0; i < count; i++) {
                    await expect(severityBadges.nth(i)).toContainText(/critical/i);
                }
            }
        });

        test('should acknowledge alert', async ({ authenticatedPage: page }) => {
            await page.goto('/alerts');
            await page.waitForTimeout(1000);

            // Click on first alert
            const firstAlert = page.locator('[data-testid="alert-item"]').first();
            if (await firstAlert.isVisible()) {
                await firstAlert.click();
                await page.waitForTimeout(1000);

                // Acknowledge alert
                const ackButton = page.locator('button:has-text("Acknowledge")');
                if (await ackButton.isVisible()) {
                    await ackButton.click();

                    // Wait for success
                    await helpers.waitForToast(page);

                    // Alert should be marked as acknowledged
                    const status = page.locator('[data-testid="alert-status"]');
                    await expect(status).toContainText(/acknowledged/i);
                }
            }
        });
    });
});
