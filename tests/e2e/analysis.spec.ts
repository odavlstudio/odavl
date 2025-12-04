import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Analysis Workflow
 * Tests the complete analysis execution workflow
 */

test.describe('Analysis Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const timestamp = Date.now();
    const testEmail = `analysis-test-${timestamp}@odavl.com`;
    const testPassword = 'SecureTestP@ss123';
    
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'Analysis Test User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should display analysis overview', async ({ page }) => {
    await page.goto('/dashboard/overview');
    
    // Check for metric cards
    await expect(page.locator('text=Total Issues')).toBeVisible();
    await expect(page.locator('text=Critical')).toBeVisible();
    await expect(page.locator('text=Health Score')).toBeVisible();
    await expect(page.locator('text=Files Analyzed')).toBeVisible();
  });

  test('should display issues trend chart', async ({ page }) => {
    await page.goto('/dashboard/overview');
    
    // Wait for chart to load
    await page.waitForSelector('.recharts-wrapper', { timeout: 10000 });
    
    // Check if chart is visible
    const chart = page.locator('.recharts-wrapper');
    await expect(chart).toBeVisible();
  });

  test('should display severity distribution', async ({ page }) => {
    await page.goto('/dashboard/overview');
    
    // Wait for pie chart
    await page.waitForSelector('.recharts-pie', { timeout: 10000 });
    
    // Check if pie chart is visible
    const pieChart = page.locator('.recharts-pie');
    await expect(pieChart).toBeVisible();
  });

  test('should export metrics to CSV', async ({ page }) => {
    await page.goto('/dashboard/overview');
    
    // Find export button
    const exportButton = page.locator('button:has-text("Export")');
    if (await exportButton.isVisible()) {
      // Setup download listener
      const downloadPromise = page.waitForEvent('download');
      
      await exportButton.click();
      
      // Select CSV format
      const csvOption = page.locator('text=CSV');
      if (await csvOption.isVisible()) {
        await csvOption.click();
      }
      
      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    }
  });

  test('should filter charts by date range', async ({ page }) => {
    await page.goto('/dashboard/charts');
    
    // Look for date range selector
    const dateRangeButton = page.locator('button:has-text("Last 7 days")');
    if (await dateRangeButton.isVisible()) {
      await dateRangeButton.click();
      
      // Select different range
      const last30Days = page.locator('text=Last 30 days');
      if (await last30Days.isVisible()) {
        await last30Days.click();
        
        // Wait for chart to reload
        await page.waitForTimeout(1000);
        
        // Check if chart updated
        await expect(page.locator('.recharts-wrapper')).toBeVisible();
      }
    }
  });

  test('should display all chart types', async ({ page }) => {
    await page.goto('/dashboard/charts');
    
    // Wait for charts to load
    await page.waitForSelector('.recharts-wrapper', { timeout: 10000 });
    
    // Check for multiple charts
    const charts = page.locator('.recharts-wrapper');
    const chartCount = await charts.count();
    
    expect(chartCount).toBeGreaterThanOrEqual(5);
  });

  test('should hover over chart data points', async ({ page }) => {
    await page.goto('/dashboard/charts');
    
    // Wait for chart
    await page.waitForSelector('.recharts-wrapper', { timeout: 10000 });
    
    // Hover over chart area
    const chartArea = page.locator('.recharts-wrapper').first();
    await chartArea.hover();
    
    // Check for tooltip
    await page.waitForSelector('.recharts-tooltip-wrapper', { timeout: 5000 });
    const tooltip = page.locator('.recharts-tooltip-wrapper');
    await expect(tooltip).toBeVisible();
  });

  test('should display recent issues widget', async ({ page }) => {
    await page.goto('/dashboard/widgets');
    
    // Check for recent issues widget
    await expect(page.locator('text=Recent Issues')).toBeVisible();
    
    // Check for issue items
    const issueItems = page.locator('[class*="issue"]');
    const issueCount = await issueItems.count();
    expect(issueCount).toBeGreaterThan(0);
  });

  test('should display system status widget', async ({ page }) => {
    await page.goto('/dashboard/widgets');
    
    // Check for system status widget
    await expect(page.locator('text=System Status')).toBeVisible();
    
    // Check for service status indicators
    await expect(page.locator('text=Analysis Engine')).toBeVisible();
    await expect(page.locator('text=Database')).toBeVisible();
  });

  test('should toggle between grid and list view', async ({ page }) => {
    await page.goto('/dashboard/widgets');
    
    // Find layout toggle
    const layoutToggle = page.locator('button[aria-label*="layout"]');
    if (await layoutToggle.isVisible()) {
      await layoutToggle.click();
      
      // Wait for layout change
      await page.waitForTimeout(500);
      
      // Toggle back
      await layoutToggle.click();
    }
  });

  test('should enable edit mode', async ({ page }) => {
    await page.goto('/dashboard/widgets');
    
    // Find edit mode toggle
    const editButton = page.locator('button:has-text("Edit")');
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Check for edit mode indicators
      await expect(page.locator('text=Edit Mode')).toBeVisible();
      await expect(page.locator('button:has-text("Save")')).toBeVisible();
    }
  });

  test('should display quick actions', async ({ page }) => {
    await page.goto('/dashboard/widgets');
    
    // Check for quick actions widget
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    
    // Check for action buttons
    await expect(page.locator('button:has-text("Run Analysis")')).toBeVisible();
    await expect(page.locator('button:has-text("Generate Report")')).toBeVisible();
  });

  test('should display activity timeline', async ({ page }) => {
    await page.goto('/dashboard/widgets');
    
    // Check for activity timeline widget
    await expect(page.locator('text=Activity Timeline')).toBeVisible();
    
    // Check for activity items
    const activityItems = page.locator('[class*="activity"]');
    const activityCount = await activityItems.count();
    expect(activityCount).toBeGreaterThan(0);
  });

  test('should display top contributors', async ({ page }) => {
    await page.goto('/dashboard/widgets');
    
    // Check for top contributors widget
    await expect(page.locator('text=Top Contributors')).toBeVisible();
    
    // Check for contributor items
    const contributorItems = page.locator('[class*="contributor"]');
    const contributorCount = await contributorItems.count();
    expect(contributorCount).toBeGreaterThan(0);
  });
});
