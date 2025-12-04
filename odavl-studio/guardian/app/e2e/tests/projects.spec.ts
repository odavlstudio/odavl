/**
 * E2E Test Suite: Project Management
 * 
 * Coverage:
 * - Create/edit/delete projects
 * - Project navigation
 * - Project settings
 * - Project switching
 */

import { test, expect, helpers } from '../fixtures';

test.describe('Projects', () => {
    test.describe('Project List', () => {
        test('should display list of projects', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');

            // Wait for projects to load
            await helpers.waitForNetworkIdle(page);

            // Check for projects list
            const projectsList = page.locator('[data-testid="projects-list"], .projects-grid, ul:has(li)');
            await expect(projectsList).toBeVisible();

            // Should see test projects from seed data
            await expect(page.getByText('E2E Test Project Alpha')).toBeVisible();
            await expect(page.getByText('E2E Test Project Beta')).toBeVisible();
        });

        test('should search projects', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await helpers.waitForNetworkIdle(page);

            // Type in search box
            const searchInput = page.locator('[placeholder*="Search"], [type="search"]');
            await searchInput.fill('Alpha');

            // Wait for filtered results
            await page.waitForTimeout(500);

            // Should show only matching projects
            await expect(page.getByText('E2E Test Project Alpha')).toBeVisible();
            await expect(page.getByText('E2E Test Project Beta')).not.toBeVisible();
        });

        test('should filter projects by status', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await helpers.waitForNetworkIdle(page);

            // Find filter dropdown
            const filterSelect = page.locator('select[name="status"], [role="combobox"]').first();

            if (await filterSelect.isVisible()) {
                // Select "Active" filter
                await filterSelect.selectOption('active');

                // Wait for filtered results
                await page.waitForTimeout(500);

                // All visible projects should be active
                const projectCards = page.locator('[data-testid="project-card"]');
                const count = await projectCards.count();

                for (let i = 0; i < count; i++) {
                    const statusBadge = projectCards.nth(i).locator('[data-testid="status-badge"]');
                    await expect(statusBadge).toContainText(/active/i);
                }
            }
        });
    });

    test.describe('Create Project', () => {
        test('should create new project', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');

            // Click "New Project" button
            const newProjectButton = page.locator('button:has-text("New Project"), a:has-text("Create Project")');
            await newProjectButton.click();

            // Wait for create form
            await page.waitForTimeout(1000);

            // Fill project form
            const projectName = `Test Project ${Date.now()}`;
            await page.fill('[name="name"]', projectName);
            await page.fill('[name="description"]', 'Created by E2E test');

            // Submit form
            await page.click('button[type="submit"]:has-text("Create")');

            // Wait for success message
            const toast = await helpers.waitForToast(page);
            await expect(toast).toContainText(/created|success/i);

            // Should navigate to new project or back to list
            await page.waitForTimeout(2000);

            // Verify project appears in list
            await page.goto('/projects');
            await expect(page.getByText(projectName)).toBeVisible();
        });

        test('should validate required fields', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');

            // Click "New Project"
            const newProjectButton = page.locator('button:has-text("New Project"), a:has-text("Create Project")');
            await newProjectButton.click();

            // Wait for form
            await page.waitForTimeout(1000);

            // Submit empty form
            await page.click('button[type="submit"]:has-text("Create")');

            // Should show validation error
            const nameError = page.locator('text=/name.*required/i');
            await expect(nameError.or(page.locator('[name="name"]:invalid'))).toBeVisible();
        });

        test('should prevent duplicate project names', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');

            // Click "New Project"
            const newProjectButton = page.locator('button:has-text("New Project"), a:has-text("Create Project")');
            await newProjectButton.click();

            await page.waitForTimeout(1000);

            // Try to create project with existing name
            await page.fill('[name="name"]', 'E2E Test Project Alpha');
            await page.fill('[name="description"]', 'Duplicate test');

            await page.click('button[type="submit"]:has-text("Create")');

            // Should show error
            const toast = await helpers.waitForToast(page);
            await expect(toast).toContainText(/already exists|duplicate/i);
        });
    });

    test.describe('Edit Project', () => {
        test('should edit project details', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');

            // Click on first project
            await page.getByText('E2E Test Project Alpha').click();

            // Wait for project page
            await page.waitForTimeout(1000);

            // Click "Edit" or "Settings"
            const editButton = page.locator('button:has-text("Edit"), a:has-text("Settings")');
            await editButton.click();

            // Wait for edit form
            await page.waitForTimeout(1000);

            // Update description
            const newDescription = `Updated at ${new Date().toISOString()}`;
            await page.fill('[name="description"]', newDescription);

            // Save changes
            await page.click('button[type="submit"]:has-text("Save")');

            // Wait for success
            const toast = await helpers.waitForToast(page);
            await expect(toast).toContainText(/updated|saved|success/i);

            // Verify changes
            await page.reload();
            await page.waitForTimeout(1000);
            await expect(page.getByText(newDescription)).toBeVisible();
        });

        test('should toggle project settings', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            // Navigate to settings
            const settingsLink = page.locator('a:has-text("Settings"), button:has-text("Settings")');
            await settingsLink.click();

            await page.waitForTimeout(1000);

            // Toggle testing enabled
            const testingToggle = page.locator('[name="testingEnabled"], input[type="checkbox"]').first();
            const initialState = await testingToggle.isChecked();

            await testingToggle.click();

            // Save
            await page.click('button[type="submit"]:has-text("Save")');

            // Wait for success
            await helpers.waitForToast(page);

            // Verify toggle state changed
            await page.reload();
            await page.waitForTimeout(1000);

            const newState = await testingToggle.isChecked();
            expect(newState).toBe(!initialState);
        });
    });

    test.describe('Delete Project', () => {
        test('should delete project with confirmation', async ({ authenticatedPage: page }) => {
            // First, create a project to delete
            await page.goto('/projects');

            const newProjectButton = page.locator('button:has-text("New Project")');
            await newProjectButton.click();
            await page.waitForTimeout(1000);

            const projectName = `Delete Test ${Date.now()}`;
            await page.fill('[name="name"]', projectName);
            await page.click('button[type="submit"]:has-text("Create")');

            await helpers.waitForToast(page);
            await page.waitForTimeout(2000);

            // Now delete it
            await page.goto('/projects');
            await page.getByText(projectName).click();
            await page.waitForTimeout(1000);

            // Click delete button
            const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="Delete"]');
            await deleteButton.click();

            // Wait for confirmation dialog
            await page.waitForTimeout(500);

            // Confirm deletion
            const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")').last();
            await confirmButton.click();

            // Wait for success
            await helpers.waitForToast(page);

            // Should navigate to projects list
            await page.waitForURL(/.*projects/, { timeout: 5000 });

            // Project should not appear in list
            await expect(page.getByText(projectName)).not.toBeVisible();
        });

        test('should cancel project deletion', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            // Click delete
            const deleteButton = page.locator('button:has-text("Delete")');
            await deleteButton.click();

            // Wait for confirmation
            await page.waitForTimeout(500);

            // Cancel deletion
            const cancelButton = page.locator('button:has-text("Cancel")');
            await cancelButton.click();

            // Dialog should close
            await page.waitForTimeout(500);

            // Should still be on project page
            await expect(page).toHaveURL(/.*projects.*alpha/i);
            await expect(page.getByText('E2E Test Project Alpha')).toBeVisible();
        });
    });

    test.describe('Project Navigation', () => {
        test('should navigate between projects', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');

            // Click on first project
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);
            await expect(page).toHaveURL(/.*alpha/i);

            // Go back to projects list
            await page.goBack();
            await page.waitForTimeout(1000);
            await expect(page).toHaveURL(/.*projects/);

            // Click on second project
            await page.getByText('E2E Test Project Beta').click();
            await page.waitForTimeout(1000);
            await expect(page).toHaveURL(/.*beta/i);
        });

        test('should use breadcrumb navigation', async ({ authenticatedPage: page }) => {
            await page.goto('/projects');
            await page.getByText('E2E Test Project Alpha').click();
            await page.waitForTimeout(1000);

            // Click breadcrumb to go back
            const breadcrumb = page.locator('nav[aria-label="Breadcrumb"], .breadcrumb');

            if (await breadcrumb.isVisible()) {
                const projectsLink = breadcrumb.locator('a:has-text("Projects")');
                await projectsLink.click();

                await page.waitForTimeout(1000);
                await expect(page).toHaveURL(/.*projects/);
            }
        });
    });
});
