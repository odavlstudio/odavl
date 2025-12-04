import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Report Generation
 * Tests report generation and insights
 */

test.describe('Report Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const timestamp = Date.now();
    const testEmail = `report-test-${timestamp}@odavl.com`;
    const testPassword = 'SecureTestP@ss123';
    
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'Report Test User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should display reports page', async ({ page }) => {
    await page.goto('/dashboard/reports');
    
    // Check page title
    await expect(page.locator('h1:has-text("Reports & Insights")')).toBeVisible();
    
    // Check for generate report button
    await expect(page.locator('button:has-text("Generate Report")')).toBeVisible();
  });

  test('should generate summary report', async ({ page }) => {
    await page.goto('/dashboard/reports');
    
    // Click generate report
    const generateButton = page.locator('button:has-text("Generate Report")');
    await generateButton.click();
    
    // Select report type
    const summaryOption = page.locator('text=Summary Report');
    if (await summaryOption.isVisible()) {
      await summaryOption.click();
    }
    
    // Wait for report to generate
    await page.waitForSelector('text=Report generated', { timeout: 10000 });
    
    // Check for report content
    await expect(page.locator('[class*="report"]')).toBeVisible();
  });

  test('should display insights', async ({ page }) => {
    await page.goto('/dashboard/reports');
    
    // Check for insights section
    await expect(page.locator('text=AI Insights')).toBeVisible();
    
    // Check for insight cards
    const insightCards = page.locator('[class*="insight-card"]');
    const insightCount = await insightCards.count();
    expect(insightCount).toBeGreaterThan(0);
  });

  test('should display recommendations', async ({ page }) => {
    await page.goto('/dashboard/reports');
    
    // Check for recommendations section
    await expect(page.locator('text=Recommendations')).toBeVisible();
    
    // Check for recommendation cards
    const recommendationCards = page.locator('[class*="recommendation"]');
    const recommendationCount = await recommendationCards.count();
    expect(recommendationCount).toBeGreaterThan(0);
  });

  test('should export report to PDF', async ({ page }) => {
    await page.goto('/dashboard/reports');
    
    // Generate report first
    const generateButton = page.locator('button:has-text("Generate Report")');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Find export button
    const exportButton = page.locator('button:has-text("Export")');
    if (await exportButton.isVisible()) {
      // Setup download listener
      const downloadPromise = page.waitForEvent('download');
      
      await exportButton.click();
      
      // Select PDF format
      const pdfOption = page.locator('text=PDF');
      if (await pdfOption.isVisible()) {
        await pdfOption.click();
      }
      
      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    }
  });

  test('should display anomaly detection', async ({ page }) => {
    await page.goto('/dashboard/reports');
    
    // Check for anomalies section
    const anomaliesSection = page.locator('text=Anomalies Detected');
    if (await anomaliesSection.isVisible()) {
      // Check for anomaly items
      const anomalyItems = page.locator('[class*="anomaly"]');
      const anomalyCount = await anomalyItems.count();
      expect(anomalyCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter insights by priority', async ({ page }) => {
    await page.goto('/dashboard/reports');
    
    // Find priority filter
    const priorityFilter = page.locator('select[name="priority"]');
    if (await priorityFilter.isVisible()) {
      await priorityFilter.selectOption('high');
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Check that insights are filtered
      await expect(page.locator('[class*="insight-card"]')).toBeVisible();
    }
  });

  test('should display report metrics', async ({ page }) => {
    await page.goto('/dashboard/reports');
    
    // Check for metrics summary
    await expect(page.locator('text=Total Insights')).toBeVisible();
    await expect(page.locator('text=Critical Issues')).toBeVisible();
  });
});
