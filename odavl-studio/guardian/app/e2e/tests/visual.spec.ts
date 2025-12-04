/**
 * E2E Test Suite: Visual Regression Testing
 * 
 * Coverage:
 * - Page screenshots
 * - Component screenshots
 * - Cross-browser visual consistency
 * - Responsive design
 * - Dark mode
 */

import { test, expect } from '../fixtures';

test.describe('Visual Regression', () => {
    test.describe('Page Screenshots', () => {
        test('should match dashboard page screenshot', async ({ authenticatedPage: page, screenshotHelper }) => {
            await page.goto('/dashboard');
            await screenshotHelper.waitForStable(page);

            // Compare full page screenshot
            await screenshotHelper.compareScreenshot(page, 'dashboard-page', {
                fullPage: true,
                maxDiffPixels: 200,
            });
        });

        test('should match projects page screenshot', async ({ authenticatedPage: page, screenshotHelper }) => {
            await page.goto('/projects');
            await screenshotHelper.waitForStable(page);

            await screenshotHelper.compareScreenshot(page, 'projects-page', {
                fullPage: true,
                maxDiffPixels: 200,
            });
        });

        test('should match monitors page screenshot', async ({ authenticatedPage: page, screenshotHelper }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const monitorsTab = page.locator('a:has-text("Monitors")');
            await monitorsTab.click();
            await screenshotHelper.waitForStable(page);

            await screenshotHelper.compareScreenshot(page, 'monitors-page', {
                fullPage: true,
                maxDiffPixels: 200,
            });
        });

        test('should match tests page screenshot', async ({ authenticatedPage: page, screenshotHelper }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const testsTab = page.locator('a:has-text("Tests")');
            await testsTab.click();
            await screenshotHelper.waitForStable(page);

            await screenshotHelper.compareScreenshot(page, 'tests-page', {
                fullPage: true,
                maxDiffPixels: 200,
            });
        });

        test('should match settings page screenshot', async ({ authenticatedPage: page, screenshotHelper }) => {
            await page.goto('/settings');
            await screenshotHelper.waitForStable(page);

            await screenshotHelper.compareScreenshot(page, 'settings-page', {
                fullPage: true,
                maxDiffPixels: 200,
            });
        });
    });

    test.describe('Component Screenshots', () => {
        test('should match navigation bar', async ({ authenticatedPage: page, screenshotHelper }) => {
            await page.goto('/dashboard');
            await screenshotHelper.waitForStable(page);

            // Screenshot nav bar only
            await screenshotHelper.compareElementScreenshot(
                page,
                'nav, header',
                'navbar',
                { maxDiffPixels: 50 }
            );
        });

        test('should match project card', async ({ authenticatedPage: page, screenshotHelper }) => {
            await page.goto('/projects');
            await screenshotHelper.waitForStable(page);

            // Screenshot first project card
            const firstCard = page.locator('[data-testid="project-card"]').first();
            if (await firstCard.isVisible()) {
                const screenshot = await firstCard.screenshot();
                await expect(screenshot).toMatchSnapshot('project-card.png', {
                    maxDiffPixels: 50,
                });
            }
        });

        test('should match monitor status card', async ({ authenticatedPage: page, screenshotHelper }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const monitorsTab = page.locator('a:has-text("Monitors")');
            await monitorsTab.click();
            await screenshotHelper.waitForStable(page);

            // Screenshot monitor card
            const monitorCard = page.locator('[data-testid="monitor-card"]').first();
            if (await monitorCard.isVisible()) {
                const screenshot = await monitorCard.screenshot();
                await expect(screenshot).toMatchSnapshot('monitor-card.png', {
                    maxDiffPixels: 50,
                });
            }
        });

        test('should match test result card', async ({ authenticatedPage: page, screenshotHelper }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const testsTab = page.locator('a:has-text("Tests")');
            await testsTab.click();
            await screenshotHelper.waitForStable(page);

            // Screenshot test result
            const testCard = page.locator('[data-testid="test-run-item"]').first();
            if (await testCard.isVisible()) {
                const screenshot = await testCard.screenshot();
                await expect(screenshot).toMatchSnapshot('test-result-card.png', {
                    maxDiffPixels: 50,
                });
            }
        });

        test('should match form inputs', async ({ authenticatedPage: page, screenshotHelper }) => {
            await page.goto('/projects');

            const newProjectButton = page.locator('button:has-text("New Project")');
            if (await newProjectButton.isVisible()) {
                await newProjectButton.click();
                await screenshotHelper.waitForStable(page);

                // Screenshot form
                const form = page.locator('form, [role="dialog"]');
                if (await form.isVisible()) {
                    const screenshot = await form.screenshot();
                    await expect(screenshot).toMatchSnapshot('project-form.png', {
                        maxDiffPixels: 100,
                    });
                }
            }
        });

        test('should match modal dialogs', async ({ authenticatedPage: page, screenshotHelper }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            // Open delete confirmation modal
            const deleteButton = page.locator('button:has-text("Delete")');
            if (await deleteButton.isVisible()) {
                await deleteButton.click();
                await page.waitForTimeout(500);

                // Screenshot modal
                const modal = page.locator('[role="dialog"], [role="alertdialog"]');
                if (await modal.isVisible()) {
                    const screenshot = await modal.screenshot();
                    await expect(screenshot).toMatchSnapshot('delete-confirmation-modal.png', {
                        maxDiffPixels: 50,
                    });
                }

                // Close modal
                const cancelButton = page.locator('button:has-text("Cancel")');
                await cancelButton.click();
            }
        });

        test('should match toast notifications', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');

            const newProjectButton = page.locator('button:has-text("New Project")');
            if (await newProjectButton.isVisible()) {
                await newProjectButton.click();
                await page.waitForTimeout(1000);

                // Submit empty form to trigger error toast
                await page.click('button[type="submit"]:has-text("Create")');
                await page.waitForTimeout(500);

                // Screenshot toast
                const toast = page.locator('[role="alert"]');
                if (await toast.isVisible()) {
                    const screenshot = await toast.screenshot();
                    await expect(screenshot).toMatchSnapshot('error-toast.png', {
                        maxDiffPixels: 50,
                    });
                }
            }
        });
    });

    test.describe('Responsive Design', () => {
        test('should match dashboard on mobile (375x667)', async ({ authenticatedPage: page, screenshotHelper }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/dashboard');
            await screenshotHelper.waitForStable(page);

            await screenshotHelper.compareScreenshot(page, 'dashboard-mobile-375', {
                fullPage: true,
                maxDiffPixels: 200,
            });
        });

        test('should match dashboard on tablet (768x1024)', async ({ authenticatedPage: page, screenshotHelper }) => {
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.goto('/dashboard');
            await screenshotHelper.waitForStable(page);

            await screenshotHelper.compareScreenshot(page, 'dashboard-tablet-768', {
                fullPage: true,
                maxDiffPixels: 200,
            });
        });

        test('should match dashboard on desktop (1920x1080)', async ({ authenticatedPage: page, screenshotHelper }) => {
            await page.setViewportSize({ width: 1920, height: 1080 });
            await page.goto('/dashboard');
            await screenshotHelper.waitForStable(page);

            await screenshotHelper.compareScreenshot(page, 'dashboard-desktop-1920', {
                fullPage: true,
                maxDiffPixels: 200,
            });
        });

        test('should match projects page on mobile', async ({ authenticatedPage: page, screenshotHelper }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/projects');
            await screenshotHelper.waitForStable(page);

            await screenshotHelper.compareScreenshot(page, 'projects-mobile-375', {
                fullPage: true,
                maxDiffPixels: 200,
            });
        });

        test('should handle hamburger menu on mobile', async ({ authenticatedPage: page, screenshotHelper }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/dashboard');
            await screenshotHelper.waitForStable(page);

            // Click hamburger menu
            const menuButton = page.locator('button[aria-label*="menu"], [data-testid="mobile-menu-button"]');
            if (await menuButton.isVisible()) {
                await menuButton.click();
                await page.waitForTimeout(500);

                // Screenshot open menu
                await screenshotHelper.compareScreenshot(page, 'mobile-menu-open', {
                    fullPage: false,
                    maxDiffPixels: 100,
                });
            }
        });
    });

    test.describe('Dark Mode', () => {
        test('should match dashboard in dark mode', async ({ authenticatedPage: page, screenshotHelper }) => {
            // Enable dark mode (adjust selector based on your implementation)
            await page.goto('/dashboard');

            const darkModeToggle = page.locator('[aria-label*="dark mode"], [data-testid="theme-toggle"]');
            if (await darkModeToggle.isVisible()) {
                await darkModeToggle.click();
                await screenshotHelper.waitForStable(page);

                await screenshotHelper.compareScreenshot(page, 'dashboard-dark-mode', {
                    fullPage: true,
                    maxDiffPixels: 300, // Higher tolerance for theme changes
                });
            }
        });

        test('should match projects page in dark mode', async ({ authenticatedPage: page, screenshotHelper }) => {
            await page.goto('/projects');

            const darkModeToggle = page.locator('[aria-label*="dark mode"], [data-testid="theme-toggle"]');
            if (await darkModeToggle.isVisible()) {
                await darkModeToggle.click();
                await screenshotHelper.waitForStable(page);

                await screenshotHelper.compareScreenshot(page, 'projects-dark-mode', {
                    fullPage: true,
                    maxDiffPixels: 300,
                });
            }
        });
    });

    test.describe('Animation States', () => {
        test('should match loading state', async ({ authenticatedPage: page, screenshotHelper }) => {
            // Navigate to page that shows loading indicator
            await page.goto('/dashboard');

            // Capture loading state (adjust timing based on your implementation)
            const loadingIndicator = page.locator('[data-testid="loading"], .loading, [role="progressbar"]');
            if (await loadingIndicator.isVisible({ timeout: 1000 })) {
                const screenshot = await loadingIndicator.screenshot();
                await expect(screenshot).toMatchSnapshot('loading-indicator.png', {
                    maxDiffPixels: 50,
                });
            }
        });

        test('should match empty state', async ({ authenticatedPage: page }) => {
            // Create a new project with no data
            await page.goto('/projects');

            const newProjectButton = page.locator('button:has-text("New Project")');
            if (await newProjectButton.isVisible()) {
                await newProjectButton.click();
                await page.waitForTimeout(1000);

                const projectName = `Empty Project ${Date.now()}`;
                await page.fill('[name="name"]', projectName);
                await page.click('button[type="submit"]:has-text("Create")');

                await page.waitForTimeout(2000);

                // Navigate to tests (should be empty)
                const testsTab = page.locator('a:has-text("Tests")');
                await testsTab.click();
                await page.waitForTimeout(1000);

                // Screenshot empty state
                const emptyState = page.locator('[data-testid="empty-state"], .empty-state');
                if (await emptyState.isVisible()) {
                    const screenshot = await emptyState.screenshot();
                    await expect(screenshot).toMatchSnapshot('empty-state-tests.png', {
                        maxDiffPixels: 50,
                    });
                }
            }
        });

        test('should match error state', async ({ authenticatedPage: page }) => {
            // Trigger error by invalid action
            await page.goto('/projects');

            const newProjectButton = page.locator('button:has-text("New Project")');
            if (await newProjectButton.isVisible()) {
                await newProjectButton.click();
                await page.waitForTimeout(1000);

                // Submit form without required fields
                await page.click('button[type="submit"]:has-text("Create")');
                await page.waitForTimeout(500);

                // Screenshot form with errors
                const form = page.locator('form, [role="dialog"]');
                if (await form.isVisible()) {
                    const screenshot = await form.screenshot();
                    await expect(screenshot).toMatchSnapshot('form-error-state.png', {
                        maxDiffPixels: 100,
                    });
                }
            }
        });
    });

    test.describe('Cross-Browser Consistency', () => {
        test('should match dashboard across browsers', async ({ page, screenshotHelper }) => {
            // This test runs on all configured browsers (chromium, firefox, webkit)
            await page.goto('/api/auth/signin');
            await page.fill('[name="email"]', 'e2e-test-user@odavl.com');
            await page.fill('[name="password"]', 'TestPassword123!');
            await page.click('button[type="submit"]');

            await page.waitForURL('/dashboard', { timeout: 10000 });
            await screenshotHelper.waitForStable(page);

            // Screenshot will be compared across browsers
            await screenshotHelper.compareScreenshot(page, 'dashboard-cross-browser', {
                fullPage: true,
                maxDiffPixels: 500, // Higher tolerance for browser differences
            });
        });
    });
});
