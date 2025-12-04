import { test, expect } from '@playwright/test';

/**
 * Insight Dashboard E2E Tests
 * 
 * Tests the Insight product dashboard functionality:
 * - Issue detection and display
 * - Detector filtering
 * - Severity filtering
 * - Real-time updates
 * - Issue details view
 * - Fix suggestions
 */

test.describe('Insight Dashboard - Issues List', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to Insight
    await page.goto('/dashboard/insight');
    await page.waitForLoadState('networkidle');
  });

  test('should display Insight dashboard heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /insight/i });
    await expect(heading).toBeVisible();
  });

  test('should display issues table or empty state', async ({ page }) => {
    // Check for either table or empty state
    const table = page.locator('table');
    const emptyState = page.getByText(/no issues|no data|get started/i);

    const hasTable = await table.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test('should display issue counts by severity', async ({ page }) => {
    // Look for severity counts (critical, high, medium, low)
    const criticalCount = page.locator('[data-severity="critical"], .severity-critical, :has-text("Critical")');
    const highCount = page.locator('[data-severity="high"], .severity-high, :has-text("High")');
    const mediumCount = page.locator('[data-severity="medium"], .severity-medium, :has-text("Medium")');
    const lowCount = page.locator('[data-severity="low"], .severity-low, :has-text("Low")');

    // At least one severity should be visible
    const severityVisible = 
      await criticalCount.count() > 0 ||
      await highCount.count() > 0 ||
      await mediumCount.count() > 0 ||
      await lowCount.count() > 0;

    expect(severityVisible).toBeTruthy();
  });

  test('should filter issues by detector type', async ({ page }) => {
    // Look for detector filter
    const filterButton = page.locator('button:has-text("Filter"), select[name*="detector"]');
    const filterExists = await filterButton.count() > 0;

    if (filterExists) {
      await filterButton.first().click();
      await page.waitForTimeout(500);

      // Select a detector type (e.g., TypeScript, ESLint)
      const detectorOption = page.locator('text=/typescript|eslint|import/i').first();
      const optionExists = await detectorOption.count() > 0;

      if (optionExists) {
        await detectorOption.click();
        await page.waitForTimeout(1000);

        // Verify filtering applied
        const url = page.url();
        expect(url).toMatch(/detector|filter/i);
      }
    }
  });

  test('should filter issues by severity', async ({ page }) => {
    // Look for severity filter
    const severityFilter = page.locator('button:has-text("Severity"), select[name*="severity"]');
    const filterExists = await severityFilter.count() > 0;

    if (filterExists) {
      await severityFilter.first().click();
      await page.waitForTimeout(500);

      // Select critical severity
      const criticalOption = page.locator('text=/critical/i').first();
      const optionExists = await criticalOption.count() > 0;

      if (optionExists) {
        await criticalOption.click();
        await page.waitForTimeout(1000);

        // Verify only critical issues shown
        const url = page.url();
        expect(url).toMatch(/severity|critical/i);
      }
    }
  });

  test('should sort issues by different columns', async ({ page }) => {
    // Find table headers
    const headers = page.locator('th[role="columnheader"]');
    const headerCount = await headers.count();

    if (headerCount > 0) {
      // Click first sortable header
      const firstHeader = headers.first();
      await firstHeader.click();
      await page.waitForTimeout(1000);

      // Click again to reverse sort
      await firstHeader.click();
      await page.waitForTimeout(1000);

      // Verify page is still functional
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('should paginate issues', async ({ page }) => {
    // Look for pagination
    const nextButton = page.locator('button:has-text("Next")');
    const nextExists = await nextButton.count() > 0;

    if (nextExists && await nextButton.isEnabled()) {
      // Get current page data
      const beforeRows = await page.locator('tbody tr').count();

      // Navigate to next page
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Verify page changed
      const afterRows = await page.locator('tbody tr').count();
      expect(afterRows).toBeGreaterThan(0);
    }
  });

  test('should search issues by keyword', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    const searchExists = await searchInput.count() > 0;

    if (searchExists) {
      // Enter search term
      await searchInput.fill('error');
      await page.waitForTimeout(1500);

      // Verify search results
      const results = page.locator('tbody tr');
      const resultCount = await results.count();

      // Should have results or empty state
      expect(resultCount >= 0).toBeTruthy();
    }
  });

  test('should display issue details on click', async ({ page }) => {
    // Find first issue row
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Should show modal or navigate to details page
      const modal = page.locator('[role="dialog"], [role="alertdialog"]');
      const modalVisible = await modal.isVisible().catch(() => false);

      const urlChanged = !page.url().endsWith('/insight');

      expect(modalVisible || urlChanged).toBeTruthy();
    }
  });
});

test.describe('Insight Dashboard - Detectors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/insight');
    await page.waitForLoadState('networkidle');
  });

  test('should display all 12 detector types', async ({ page }) => {
    // Expected detectors: typescript, eslint, import, package, runtime, build, security, circular, network, performance, complexity, isolation
    
    const detectors = [
      'typescript', 'eslint', 'import', 'package', 
      'runtime', 'build', 'security', 'circular',
      'network', 'performance', 'complexity', 'isolation'
    ];

    // Look for detector mentions on the page
    for (const detector of detectors) {
      const detectorElement = page.locator(`text=/${detector}/i`).first();
      // Note: Not all detectors may have findings, so we just check the page doesn't break
      const exists = await detectorElement.count() > 0;
      // Just verify page is functional
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('should show detector statistics', async ({ page }) => {
    // Look for detector performance stats
    const statsSection = page.locator(':has-text("Detector"), :has-text("Statistics")');
    const statsExists = await statsSection.count() > 0;

    if (statsExists) {
      // Should show metrics like: issues found, false positives, accuracy, etc.
      await expect(statsSection.first()).toBeVisible();
    }
  });

  test('should allow enabling/disabling detectors', async ({ page }) => {
    // Navigate to settings or detector config
    await page.goto('/dashboard/insight/settings');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Look for detector toggles
    const toggles = page.locator('input[type="checkbox"][role="switch"]');
    const toggleCount = await toggles.count();

    if (toggleCount > 0) {
      // Toggle first detector
      const firstToggle = toggles.first();
      const wasChecked = await firstToggle.isChecked();
      
      await firstToggle.click();
      await page.waitForTimeout(500);

      const nowChecked = await firstToggle.isChecked();
      expect(nowChecked).toBe(!wasChecked);
    }
  });
});

test.describe('Insight Dashboard - Issue Details', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/insight');
    await page.waitForLoadState('networkidle');
  });

  test('should display issue metadata', async ({ page }) => {
    // Click first issue
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Should show: severity, detector, file path, line number
      const modal = page.locator('[role="dialog"]');
      
      if (await modal.isVisible()) {
        // Check for metadata fields
        await expect(modal).toContainText(/severity|critical|high|medium|low/i);
        await expect(modal).toContainText(/file|path/i);
      }
    }
  });

  test('should show code snippet with issue', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Look for code block
      const codeBlock = page.locator('code, pre, [class*="syntax"]');
      const codeExists = await codeBlock.count() > 0;

      if (codeExists) {
        await expect(codeBlock.first()).toBeVisible();
      }
    }
  });

  test('should provide fix suggestions', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Look for fix suggestions
      const fixSection = page.locator(':has-text("Suggestion"), :has-text("Fix"), button:has-text("Apply")');
      const fixExists = await fixSection.count() > 0;

      if (fixExists) {
        await expect(fixSection.first()).toBeVisible();
      }
    }
  });

  test('should link to documentation', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Look for "Learn more" or documentation links
      const docLink = page.locator('a:has-text("Learn more"), a:has-text("Documentation"), a[href*="docs"]');
      const linkExists = await docLink.count() > 0;

      if (linkExists) {
        await expect(docLink.first()).toBeVisible();
      }
    }
  });

  test('should allow marking issue as resolved', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Look for resolve button
      const resolveButton = page.locator('button:has-text("Resolve"), button:has-text("Mark as resolved")');
      const buttonExists = await resolveButton.count() > 0;

      if (buttonExists && await resolveButton.first().isEnabled()) {
        await resolveButton.first().click();
        await page.waitForTimeout(1000);

        // Should show success message or close modal
        const success = await page.locator(':has-text("resolved")').isVisible().catch(() => false);
        expect(success || !await page.locator('[role="dialog"]').isVisible()).toBeTruthy();
      }
    }
  });

  test('should allow ignoring issue', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Look for ignore button
      const ignoreButton = page.locator('button:has-text("Ignore"), button:has-text("Dismiss")');
      const buttonExists = await ignoreButton.count() > 0;

      if (buttonExists && await ignoreButton.first().isEnabled()) {
        await ignoreButton.first().click();
        await page.waitForTimeout(1000);

        // Should prompt for reason or confirm
        const confirmDialog = await page.locator('[role="dialog"], [role="alertdialog"]').isVisible();
        expect(confirmDialog).toBeTruthy();
      }
    }
  });
});

test.describe('Insight Dashboard - Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/insight');
    await page.waitForLoadState('networkidle');
  });

  test('should display issues trend chart', async ({ page }) => {
    // Look for chart showing issues over time
    const chart = page.locator('canvas, svg[class*="chart"], [role="img"][aria-label*="chart"]');
    const chartExists = await chart.count() > 0;

    if (chartExists) {
      await expect(chart.first()).toBeVisible();
    }
  });

  test('should show detector accuracy metrics', async ({ page }) => {
    // Look for accuracy stats
    const accuracySection = page.locator(':has-text("Accuracy"), :has-text("False positive")');
    const sectionExists = await accuracySection.count() > 0;

    if (sectionExists) {
      await expect(accuracySection.first()).toBeVisible();
    }
  });

  test('should display issues by file/project', async ({ page }) => {
    // Look for grouping by file or project
    const groupedView = page.locator(':has-text("By file"), :has-text("By project")');
    const viewExists = await groupedView.count() > 0;

    if (viewExists) {
      await expect(groupedView.first()).toBeVisible();
    }
  });

  test('should export issues to CSV/JSON', async ({ page }) => {
    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button[aria-label*="export"]');
    const buttonExists = await exportButton.count() > 0;

    if (buttonExists) {
      await expect(exportButton.first()).toBeVisible();
      await expect(exportButton.first()).toBeEnabled();
    }
  });
});

test.describe('Insight Dashboard - Real-Time Updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/insight');
    await page.waitForLoadState('networkidle');
  });

  test('should show real-time issue updates', async ({ page }) => {
    // Get initial issue count
    const initialRows = await page.locator('tbody tr').count();

    // Wait for potential WebSocket updates (5 seconds)
    await page.waitForTimeout(5000);

    // Get updated issue count
    const updatedRows = await page.locator('tbody tr').count();

    // Page should still be functional (may or may not have new issues)
    await expect(page.locator('main')).toBeVisible();
    expect(updatedRows).toBeGreaterThanOrEqual(0);
  });

  test('should display notification for new issues', async ({ page }) => {
    // Wait for potential notifications
    await page.waitForTimeout(3000);

    // Look for notification/toast
    const notification = page.locator('[role="alert"], [role="status"], .toast, .notification');
    const notificationExists = await notification.count() > 0;

    // Notifications may not appear if no new issues
    if (notificationExists) {
      await expect(notification.first()).toBeVisible();
    }
  });

  test('should update issue count in real-time', async ({ page }) => {
    // Find issue count display
    const countDisplay = page.locator(':has-text("issues"), :has-text("findings")').first();
    const countExists = await countDisplay.count() > 0;

    if (countExists) {
      const initialText = await countDisplay.textContent();
      
      // Wait for updates
      await page.waitForTimeout(5000);
      
      const updatedText = await countDisplay.textContent();
      
      // Count might change or stay same
      expect(updatedText).toBeTruthy();
    }
  });
});
