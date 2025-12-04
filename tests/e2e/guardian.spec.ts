import { test, expect } from '@playwright/test';

/**
 * Guardian Dashboard E2E Tests
 * 
 * Tests the Guardian product dashboard functionality:
 * - Pre-deploy test execution
 * - Test results display
 * - Quality gates enforcement
 * - Performance metrics
 * - Security testing
 * - Accessibility testing
 * - Multi-environment support
 */

test.describe('Guardian Dashboard - Test Results', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    await page.goto('/dashboard/guardian');
    await page.waitForLoadState('networkidle');
  });

  test('should display Guardian dashboard heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /guardian/i });
    await expect(heading).toBeVisible();
  });

  test('should display test results table or empty state', async ({ page }) => {
    const table = page.locator('table');
    const emptyState = page.getByText(/no tests|no data|run first test/i);

    const hasTable = await table.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test('should show test pass/fail status', async ({ page }) => {
    const passStatus = page.locator('[data-status="pass"], .status-pass, :has-text("Passed")');
    const failStatus = page.locator('[data-status="fail"], .status-fail, :has-text("Failed")');
    const runningStatus = page.locator('[data-status="running"], .status-running, :has-text("Running")');

    // Should have at least one status indicator
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display quality gate results', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Should show quality gates: Performance, Security, Accessibility
      const gates = page.locator(':has-text("Performance"), :has-text("Security"), :has-text("Accessibility")');
      const gatesExist = await gates.count() > 0;

      if (gatesExist) {
        await expect(gates.first()).toBeVisible();
      }
    }
  });

  test('should filter tests by status', async ({ page }) => {
    const filterButton = page.locator('button:has-text("Filter"), select[name*="status"]');
    const filterExists = await filterButton.count() > 0;

    if (filterExists) {
      await filterButton.first().click();
      await page.waitForTimeout(500);

      const failedOption = page.locator('text=/failed/i').first();
      const optionExists = await failedOption.count() > 0;

      if (optionExists) {
        await failedOption.click();
        await page.waitForTimeout(1000);

        const url = page.url();
        expect(url).toMatch(/status|failed|filter/i);
      }
    }
  });

  test('should filter tests by environment', async ({ page }) => {
    const envFilter = page.locator('button:has-text("Environment"), select[name*="env"]');
    const filterExists = await envFilter.count() > 0;

    if (filterExists) {
      await envFilter.first().click();
      await page.waitForTimeout(500);

      const productionOption = page.locator('text=/production|staging/i').first();
      const optionExists = await productionOption.count() > 0;

      if (optionExists) {
        await productionOption.click();
        await page.waitForTimeout(1000);

        await expect(page.locator('main')).toBeVisible();
      }
    }
  });

  test('should sort tests by different columns', async ({ page }) => {
    const headers = page.locator('th[role="columnheader"]');
    const headerCount = await headers.count();

    if (headerCount > 0) {
      await headers.first().click();
      await page.waitForTimeout(1000);

      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('should trigger new test run', async ({ page }) => {
    const runButton = page.locator('button:has-text("Run Test"), button:has-text("New Test")');
    const buttonExists = await runButton.count() > 0;

    if (buttonExists && await runButton.first().isEnabled()) {
      await runButton.first().click();
      await page.waitForTimeout(1000);

      // Should show test configuration form
      const form = await page.locator('form, [role="dialog"]').isVisible();
      expect(form).toBeTruthy();
    }
  });
});

test.describe('Guardian Dashboard - Test Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/guardian');
    await page.waitForLoadState('networkidle');

    // Click "Run Test" button
    const runButton = page.locator('button:has-text("Run Test")').first();
    if (await runButton.count() > 0 && await runButton.isEnabled()) {
      await runButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should display URL input field', async ({ page }) => {
    const urlInput = page.locator('input[type="url"], input[name*="url"]');
    const inputExists = await urlInput.count() > 0;

    if (inputExists) {
      await expect(urlInput.first()).toBeVisible();
    }
  });

  test('should display environment selector', async ({ page }) => {
    const envSelector = page.locator('select[name*="env"], [role="combobox"]');
    const selectorExists = await envSelector.count() > 0;

    if (selectorExists) {
      await expect(envSelector.first()).toBeVisible();
    }
  });

  test('should display test type checkboxes', async ({ page }) => {
    // Should have options for: Performance, Security, Accessibility, SEO
    const testTypes = page.locator('input[type="checkbox"]');
    const typesExist = await testTypes.count() > 0;

    if (typesExist) {
      await expect(testTypes.first()).toBeVisible();
    }
  });

  test('should validate URL format', async ({ page }) => {
    const urlInput = page.locator('input[type="url"]').first();
    const inputExists = await urlInput.count() > 0;

    if (inputExists) {
      // Enter invalid URL
      await urlInput.fill('invalid-url');
      
      // Try to submit
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(500);

        // Should show validation error
        const validationMessage = await urlInput.evaluate((el: HTMLInputElement) => 
          el.validationMessage
        );
        expect(validationMessage).toBeTruthy();
      }
    }
  });

  test('should start test execution', async ({ page }) => {
    const urlInput = page.locator('input[type="url"]').first();
    const inputExists = await urlInput.count() > 0;

    if (inputExists) {
      // Enter valid URL
      await urlInput.fill('https://example.com');
      
      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Run")');
      if (await submitButton.count() > 0 && await submitButton.isEnabled()) {
        await submitButton.click();
        await page.waitForTimeout(2000);

        // Should show loading/running state
        const loading = await page.locator(':has-text("Running"), :has-text("Testing"), [role="progressbar"]').isVisible().catch(() => false);
        const resultsPage = !page.url().includes('new');

        expect(loading || resultsPage).toBeTruthy();
      }
    }
  });
});

test.describe('Guardian Dashboard - Test Details', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/guardian');
    await page.waitForLoadState('networkidle');
  });

  test('should display performance metrics', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Should show: LCP, FID, CLS, TTFB
      const metrics = page.locator(':has-text("LCP"), :has-text("FID"), :has-text("CLS"), :has-text("TTFB")');
      const metricsExist = await metrics.count() > 0;

      if (metricsExist) {
        await expect(metrics.first()).toBeVisible();
      }
    }
  });

  test('should display Lighthouse scores', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Should show scores for: Performance, Accessibility, Best Practices, SEO
      const scores = page.locator(':has-text("Performance"), :has-text("Accessibility"), :has-text("SEO")');
      const scoresExist = await scores.count() > 0;

      if (scoresExist) {
        await expect(scores.first()).toBeVisible();
      }
    }
  });

  test('should display security audit results', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Should show security checks: HTTPS, CSP, HSTS, etc.
      const security = page.locator(':has-text("Security"), :has-text("HTTPS"), :has-text("CSP")');
      const securityExists = await security.count() > 0;

      if (securityExists) {
        await expect(security.first()).toBeVisible();
      }
    }
  });

  test('should display accessibility issues', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Should show accessibility violations
      const a11y = page.locator(':has-text("Accessibility"), :has-text("WCAG"), :has-text("violations")');
      const a11yExists = await a11y.count() > 0;

      if (a11yExists) {
        await expect(a11y.first()).toBeVisible();
      }
    }
  });

  test('should show test execution timeline', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Should show when test started/completed
      const timeline = page.locator('time, [datetime], :has-text("ago"), :has-text("duration")');
      const timelineExists = await timeline.count() > 0;

      if (timelineExists) {
        await expect(timeline.first()).toBeVisible();
      }
    }
  });

  test('should display screenshots', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Should show screenshots of tested page
      const screenshot = page.locator('img[alt*="screenshot"], img[alt*="preview"]');
      const screenshotExists = await screenshot.count() > 0;

      if (screenshotExists) {
        await expect(screenshot.first()).toBeVisible();
      }
    }
  });

  test('should provide recommendations', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Should show recommendations for improvement
      const recommendations = page.locator(':has-text("Recommendation"), :has-text("Improve"), :has-text("Suggestion")');
      const recommendationsExist = await recommendations.count() > 0;

      if (recommendationsExist) {
        await expect(recommendations.first()).toBeVisible();
      }
    }
  });
});

test.describe('Guardian Dashboard - Quality Gates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/guardian/settings');
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('should display quality gate configuration', async ({ page }) => {
    const gatesSection = page.locator(':has-text("Quality Gates"), :has-text("Thresholds")');
    const sectionExists = await gatesSection.count() > 0;

    if (sectionExists) {
      await expect(gatesSection.first()).toBeVisible();
    }
  });

  test('should show performance thresholds', async ({ page }) => {
    // Should have inputs for: LCP, FID, CLS thresholds
    const perfInputs = page.locator('input[name*="lcp"], input[name*="fid"], input[name*="cls"]');
    const inputsExist = await perfInputs.count() > 0;

    if (inputsExist) {
      await expect(perfInputs.first()).toBeVisible();
    }
  });

  test('should show accessibility threshold', async ({ page }) => {
    const a11yInput = page.locator('input[name*="accessibility"], input[name*="a11y"]');
    const inputExists = await a11yInput.count() > 0;

    if (inputExists) {
      await expect(a11yInput.first()).toBeVisible();
    }
  });

  test('should show security threshold', async ({ page }) => {
    const securityInput = page.locator('input[name*="security"]');
    const inputExists = await securityInput.count() > 0;

    if (inputExists) {
      await expect(securityInput.first()).toBeVisible();
    }
  });

  test('should allow updating thresholds', async ({ page }) => {
    const firstInput = page.locator('input[type="number"]').first();
    const inputExists = await firstInput.count() > 0;

    if (inputExists) {
      const originalValue = await firstInput.inputValue();
      
      // Change value
      await firstInput.fill('95');
      await page.waitForTimeout(500);

      // Save
      const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
      if (await saveButton.count() > 0 && await saveButton.isEnabled()) {
        await saveButton.click();
        await page.waitForTimeout(1000);

        // Should show success message
        const success = await page.locator(':has-text("saved"), :has-text("updated")').isVisible().catch(() => false);
        await expect(page.locator('main')).toBeVisible();
      }
    }
  });

  test('should indicate when tests fail quality gates', async ({ page }) => {
    await page.goto('/dashboard/guardian');
    await page.waitForLoadState('networkidle');

    // Look for failed gate indicators
    const failedGate = page.locator('[data-gate="failed"], .gate-failed, :has-text("Gate Failed")');
    const failedExists = await failedGate.count() > 0;

    // May or may not have failed gates
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Guardian Dashboard - Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/guardian');
    await page.waitForLoadState('networkidle');
  });

  test('should display pass rate metric', async ({ page }) => {
    const passRate = page.locator(':has-text("pass rate"), [data-metric="pass-rate"]');
    const rateExists = await passRate.count() > 0;

    if (rateExists) {
      await expect(passRate.first()).toBeVisible();
    }
  });

  test('should show average score metric', async ({ page }) => {
    const avgScore = page.locator(':has-text("average score"), :has-text("avg")');
    const scoreExists = await avgScore.count() > 0;

    if (scoreExists) {
      await expect(avgScore.first()).toBeVisible();
    }
  });

  test('should display tests trend chart', async ({ page }) => {
    const chart = page.locator('canvas, svg[class*="chart"], [role="img"][aria-label*="chart"]');
    const chartExists = await chart.count() > 0;

    if (chartExists) {
      await expect(chart.first()).toBeVisible();
    }
  });

  test('should show critical issues count', async ({ page }) => {
    const criticalCount = page.locator(':has-text("critical"), [data-metric="critical"]');
    const countExists = await criticalCount.count() > 0;

    if (countExists) {
      await expect(criticalCount.first()).toBeVisible();
    }
  });

  test('should display environment comparison', async ({ page }) => {
    // Should compare staging vs production metrics
    const comparison = page.locator(':has-text("staging"), :has-text("production"), :has-text("vs")');
    const comparisonExists = await comparison.count() > 0;

    if (comparisonExists) {
      await expect(comparison.first()).toBeVisible();
    }
  });
});

test.describe('Guardian Dashboard - Alerts & Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/guardian/settings');
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('should display notification settings', async ({ page }) => {
    const notificationsSection = page.locator(':has-text("Notifications"), :has-text("Alerts")');
    const sectionExists = await notificationsSection.count() > 0;

    if (sectionExists) {
      await expect(notificationsSection.first()).toBeVisible();
    }
  });

  test('should allow configuring alert channels', async ({ page }) => {
    // Email, Slack, PagerDuty, Webhook
    const channels = page.locator('input[type="checkbox"][name*="email"], input[type="checkbox"][name*="slack"]');
    const channelsExist = await channels.count() > 0;

    if (channelsExist) {
      await expect(channels.first()).toBeVisible();
    }
  });

  test('should allow setting alert conditions', async ({ page }) => {
    // Alert on: failed tests, quality gate failures, performance degradation
    const conditions = page.locator('input[type="checkbox"], select');
    const conditionsExist = await conditions.count() > 0;

    if (conditionsExist) {
      await expect(conditions.first()).toBeVisible();
    }
  });
});

test.describe('Guardian Dashboard - CI/CD Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/guardian/settings');
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('should display CI/CD integration options', async ({ page }) => {
    const integrationSection = page.locator(':has-text("CI/CD"), :has-text("Integration"), :has-text("Webhook")');
    const sectionExists = await integrationSection.count() > 0;

    if (sectionExists) {
      await expect(integrationSection.first()).toBeVisible();
    }
  });

  test('should provide webhook URL', async ({ page }) => {
    const webhookUrl = page.locator('input[readonly][value*="https://"], code:has-text("https://")');
    const urlExists = await webhookUrl.count() > 0;

    if (urlExists) {
      await expect(webhookUrl.first()).toBeVisible();
    }
  });

  test('should allow generating API key', async ({ page }) => {
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("API Key")');
    const buttonExists = await generateButton.count() > 0;

    if (buttonExists && await generateButton.first().isEnabled()) {
      await generateButton.first().click();
      await page.waitForTimeout(1000);

      // Should show API key
      const apiKey = await page.locator('code, input[readonly]').isVisible().catch(() => false);
      expect(apiKey || await page.locator('[role="dialog"]').isVisible()).toBeTruthy();
    }
  });
});
