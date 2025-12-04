/**
 * E2E Test Suite: Accessibility Testing
 * 
 * Coverage:
 * - WCAG 2.1 Level AA compliance
 * - Keyboard navigation
 * - Screen reader support
 * - Focus management
 * - Color contrast
 * - ARIA attributes
 */

import { test, expect, helpers } from '../fixtures';

test.describe('Accessibility', () => {
    test.describe('WCAG Compliance', () => {
        test('should pass accessibility checks on dashboard', async ({ authenticatedPage: page, a11yHelper }) => {
            await page.goto('/dashboard');
            await helpers.waitForNetworkIdle(page);

            // Run accessibility checks
            await a11yHelper.checkAccessibility(page, {
                detailedReport: true,
            });
        });

        test('should pass accessibility checks on projects page', async ({ authenticatedPage: page, a11yHelper }) => {
            await page.goto('/projects');
            await helpers.waitForNetworkIdle(page);

            await a11yHelper.checkAccessibility(page);
        });

        test('should pass accessibility checks on monitors page', async ({ authenticatedPage: page, a11yHelper }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const monitorsTab = page.locator('a:has-text("Monitors")');
            await monitorsTab.click();
            await helpers.waitForNetworkIdle(page);

            await a11yHelper.checkAccessibility(page);
        });

        test('should pass accessibility checks on tests page', async ({ authenticatedPage: page, a11yHelper }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            const testsTab = page.locator('a:has-text("Tests")');
            await testsTab.click();
            await helpers.waitForNetworkIdle(page);

            await a11yHelper.checkAccessibility(page);
        });

        test('should pass accessibility checks on settings page', async ({ authenticatedPage: page, a11yHelper }) => {
            await page.goto('/settings');
            await helpers.waitForNetworkIdle(page);

            await a11yHelper.checkAccessibility(page);
        });

        test('should pass accessibility checks on login page', async ({ page, a11yHelper }) => {
            await page.goto('/api/auth/signin');
            await helpers.waitForNetworkIdle(page);

            await a11yHelper.checkAccessibility(page);
        });

        test('should have no critical accessibility violations', async ({ authenticatedPage: page, a11yHelper }) => {
            await page.goto('/dashboard');
            await helpers.waitForNetworkIdle(page);

            const violationsCount = await a11yHelper.getViolationsCount(page);

            // Log violations count (should be 0)
            console.log(`Accessibility violations: ${violationsCount}`);

            expect(violationsCount).toBe(0);
        });
    });

    test.describe('Keyboard Navigation', () => {
        test('should navigate with Tab key', async ({ authenticatedPage: page }) => {
            await page.goto('/dashboard');

            // Tab through interactive elements
            await page.keyboard.press('Tab');

            // First focusable element should have focus
            const firstFocusable = page.locator(':focus');
            await expect(firstFocusable).toBeVisible();

            // Tab again
            await page.keyboard.press('Tab');

            // Focus should move to next element
            const secondFocusable = page.locator(':focus');
            await expect(secondFocusable).toBeVisible();

            // Verify we can tab through at least 5 elements
            for (let i = 0; i < 5; i++) {
                await page.keyboard.press('Tab');
                const focused = page.locator(':focus');
                await expect(focused).toBeVisible();
            }
        });

        test('should navigate backwards with Shift+Tab', async ({ authenticatedPage: page }) => {
            await page.goto('/dashboard');

            // Tab forward
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');

            // Get current focused element
            const currentText = await page.locator(':focus').textContent();

            // Tab backwards
            await page.keyboard.press('Shift+Tab');

            // Focus should have moved to previous element
            const previousText = await page.locator(':focus').textContent();

            expect(previousText).not.toBe(currentText);
        });

        test('should activate buttons with Enter key', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');

            // Tab to "New Project" button
            let attempts = 0;
            while (attempts < 20) {
                await page.keyboard.press('Tab');
                const focused = page.locator(':focus');
                const text = await focused.textContent();

                if (text?.includes('New Project') || text?.includes('Create')) {
                    // Press Enter
                    await page.keyboard.press('Enter');

                    // Form should open
                    await page.waitForTimeout(1000);
                    const form = page.locator('form, [role="dialog"]');
                    await expect(form).toBeVisible();

                    break;
                }

                attempts++;
            }
        });

        test('should activate buttons with Space key', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');

            // Tab to a button
            let attempts = 0;
            while (attempts < 20) {
                await page.keyboard.press('Tab');
                const focused = page.locator(':focus');
                const role = await focused.getAttribute('role');
                const tagName = await focused.evaluate(el => el.tagName.toLowerCase());

                if (tagName === 'button' || role === 'button') {
                    // Get button text
                    const buttonText = await focused.textContent();

                    // Press Space
                    await page.keyboard.press('Space');

                    // Button should activate
                    await page.waitForTimeout(500);

                    // Some change should occur (modal opens, page navigates, etc.)
                    break;
                }

                attempts++;
            }
        });

        test('should navigate lists with Arrow keys', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await helpers.waitForNetworkIdle(page);

            // Find first project in list
            const firstProject = page.locator('[data-testid="project-card"], li[role="listitem"]').first();

            if (await firstProject.isVisible()) {
                // Click to focus
                await firstProject.click();

                // Press Down arrow
                await page.keyboard.press('ArrowDown');

                // Focus should move to next item
                const focused = page.locator(':focus');
                await expect(focused).toBeVisible();
            }
        });

        test('should close modals with Escape key', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');

            const newProjectButton = page.locator('button:has-text("New Project")');
            if (await newProjectButton.isVisible()) {
                await newProjectButton.click();
                await page.waitForTimeout(1000);

                // Modal should be open
                const modal = page.locator('[role="dialog"]');
                await expect(modal).toBeVisible();

                // Press Escape
                await page.keyboard.press('Escape');

                // Modal should close
                await page.waitForTimeout(500);
                await expect(modal).not.toBeVisible();
            }
        });

        test('should trap focus in modals', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');

            const newProjectButton = page.locator('button:has-text("New Project")');
            if (await newProjectButton.isVisible()) {
                await newProjectButton.click();
                await page.waitForTimeout(1000);

                const modal = page.locator('[role="dialog"]');
                await expect(modal).toBeVisible();

                // Tab through modal
                for (let i = 0; i < 10; i++) {
                    await page.keyboard.press('Tab');

                    // Focus should stay within modal
                    const focused = page.locator(':focus');
                    const isInModal = await focused.evaluate((el, modalEl) => {
                        return modalEl?.contains(el) ?? false;
                    }, await modal.elementHandle());

                    expect(isInModal).toBeTruthy();
                }
            }
        });
    });

    test.describe('Screen Reader Support', () => {
        test('should have proper heading hierarchy', async ({ authenticatedPage: page }) => {
            await page.goto('/dashboard');

            // Check heading levels
            const h1 = await page.locator('h1').count();
            expect(h1).toBeGreaterThan(0); // At least one h1

            // h1 should come before h2
            const firstH1 = page.locator('h1').first();
            const firstH2 = page.locator('h2').first();

            if (await firstH2.isVisible()) {
                const h1Position = await firstH1.evaluate(el => el.getBoundingClientRect().top);
                const h2Position = await firstH2.evaluate(el => el.getBoundingClientRect().top);

                expect(h1Position).toBeLessThan(h2Position);
            }
        });

        test('should have alt text for images', async ({ authenticatedPage: page }) => {
            await page.goto('/dashboard');

            // Find all images
            const images = page.locator('img');
            const count = await images.count();

            if (count > 0) {
                for (let i = 0; i < count; i++) {
                    const img = images.nth(i);
                    const alt = await img.getAttribute('alt');

                    // Images should have alt attribute (can be empty for decorative images)
                    expect(alt).not.toBeNull();
                }
            }
        });

        test('should have labels for form inputs', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');

            const newProjectButton = page.locator('button:has-text("New Project")');
            if (await newProjectButton.isVisible()) {
                await newProjectButton.click();
                await page.waitForTimeout(1000);

                // Find all inputs
                const inputs = page.locator('input, textarea, select');
                const count = await inputs.count();

                for (let i = 0; i < count; i++) {
                    const input = inputs.nth(i);

                    // Input should have aria-label or associated label
                    const ariaLabel = await input.getAttribute('aria-label');
                    const ariaLabelledBy = await input.getAttribute('aria-labelledby');
                    const id = await input.getAttribute('id');

                    // Check for associated label
                    let hasLabel = false;
                    if (id) {
                        const label = page.locator(`label[for="${id}"]`);
                        hasLabel = await label.count() > 0;
                    }

                    expect(ariaLabel || ariaLabelledBy || hasLabel).toBeTruthy();
                }
            }
        });

        test('should have proper ARIA roles', async ({ authenticatedPage: page }) => {
            await page.goto('/dashboard');

            // Check for proper semantic HTML or ARIA roles

            // Navigation should have role="navigation" or be <nav>
            const nav = page.locator('nav, [role="navigation"]');
            await expect(nav).toBeVisible();

            // Main content should have role="main" or be <main>
            const main = page.locator('main, [role="main"]');
            await expect(main).toBeVisible();

            // Buttons should be <button> or have role="button"
            const buttons = await page.locator('button, [role="button"]').count();
            expect(buttons).toBeGreaterThan(0);
        });

        test('should announce page changes', async ({ authenticatedPage: page }) => {
            await page.goto('/dashboard');

            // Check for aria-live regions
            const liveRegion = page.locator('[aria-live], [role="status"], [role="alert"]');

            if (await liveRegion.count() > 0) {
                // Live regions exist for announcements
                await expect(liveRegion.first()).toBeInViewport();
            }
        });

        test('should have descriptive link text', async ({ authenticatedPage: page }) => {
            await page.goto('/dashboard');

            // Find all links
            const links = page.locator('a');
            const count = await links.count();

            for (let i = 0; i < count; i++) {
                const link = links.nth(i);
                const text = await link.textContent();
                const ariaLabel = await link.getAttribute('aria-label');

                // Links should have text or aria-label
                expect(text || ariaLabel).toBeTruthy();

                // Avoid generic text like "click here"
                if (text) {
                    expect(text.toLowerCase()).not.toMatch(/^(click here|read more|link)$/);
                }
            }
        });
    });

    test.describe('Focus Management', () => {
        test('should show focus indicators', async ({ authenticatedPage: page }) => {
            await page.goto('/dashboard');

            // Tab to first interactive element
            await page.keyboard.press('Tab');

            // Get focused element
            const focused = page.locator(':focus');
            await expect(focused).toBeVisible();

            // Check for focus indicator (outline, ring, etc.)
            const outlineStyle = await focused.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                    outline: styles.outline,
                    outlineWidth: styles.outlineWidth,
                    boxShadow: styles.boxShadow,
                };
            });

            // Should have some focus indicator
            const hasFocusIndicator =
                outlineStyle.outline !== 'none' ||
                parseFloat(outlineStyle.outlineWidth) > 0 ||
                outlineStyle.boxShadow !== 'none';

            expect(hasFocusIndicator).toBeTruthy();
        });

        test('should restore focus after modal closes', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');

            const newProjectButton = page.locator('button:has-text("New Project")');
            if (await newProjectButton.isVisible()) {
                // Focus button
                await newProjectButton.focus();
                const buttonText = await newProjectButton.textContent();

                // Click to open modal
                await newProjectButton.click();
                await page.waitForTimeout(1000);

                // Close modal with Escape
                await page.keyboard.press('Escape');
                await page.waitForTimeout(500);

                // Focus should return to button
                const focused = page.locator(':focus');
                const focusedText = await focused.textContent();

                expect(focusedText).toBe(buttonText);
            }
        });

        test('should skip to main content', async ({ authenticatedPage: page }) => {
            await page.goto('/dashboard');

            // Look for "Skip to main content" link
            const skipLink = page.locator('a:has-text("Skip to main content"), a:has-text("Skip to content")');

            if (await skipLink.count() > 0) {
                // Press Tab (skip link should be first focusable element)
                await page.keyboard.press('Tab');

                const focused = page.locator(':focus');
                const text = await focused.textContent();

                expect(text?.toLowerCase()).toMatch(/skip.*content/);

                // Press Enter to activate
                await page.keyboard.press('Enter');

                // Focus should move to main content
                await page.waitForTimeout(500);
                const newFocused = page.locator(':focus');
                const mainContent = page.locator('main, [role="main"]');

                const isInMain = await newFocused.evaluate((el, mainEl) => {
                    return mainEl?.contains(el) ?? false;
                }, await mainContent.elementHandle());

                expect(isInMain).toBeTruthy();
            }
        });
    });

    test.describe('Color Contrast', () => {
        test('should have sufficient color contrast', async ({ authenticatedPage: page, a11yHelper }) => {
            await page.goto('/dashboard');
            await helpers.waitForNetworkIdle(page);

            // Run accessibility check focusing on color contrast
            await a11yHelper.checkAccessibility(page, {
                includedRules: ['color-contrast'],
                detailedReport: true,
            });
        });

        test('should maintain contrast in dark mode', async ({ authenticatedPage: page, a11yHelper }) => {
            await page.goto('/dashboard');

            // Enable dark mode
            const darkModeToggle = page.locator('[aria-label*="dark mode"], [data-testid="theme-toggle"]');
            if (await darkModeToggle.isVisible()) {
                await darkModeToggle.click();
                await page.waitForTimeout(1000);

                // Check color contrast in dark mode
                await a11yHelper.checkAccessibility(page, {
                    includedRules: ['color-contrast'],
                    detailedReport: true,
                });
            }
        });
    });

    test.describe('Error Handling', () => {
        test('should announce form errors to screen readers', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');

            const newProjectButton = page.locator('button:has-text("New Project")');
            if (await newProjectButton.isVisible()) {
                await newProjectButton.click();
                await page.waitForTimeout(1000);

                // Submit empty form
                await page.click('button[type="submit"]:has-text("Create")');
                await page.waitForTimeout(500);

                // Error message should have appropriate role
                const error = page.locator('[role="alert"], [aria-invalid="true"]');
                await expect(error).toBeVisible();
            }
        });

        test('should mark invalid fields with aria-invalid', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');

            const newProjectButton = page.locator('button:has-text("New Project")');
            if (await newProjectButton.isVisible()) {
                await newProjectButton.click();
                await page.waitForTimeout(1000);

                // Submit empty form
                await page.click('button[type="submit"]:has-text("Create")');
                await page.waitForTimeout(500);

                // Invalid field should have aria-invalid
                const invalidField = page.locator('[aria-invalid="true"]');
                await expect(invalidField).toBeVisible();
            }
        });
    });
});
