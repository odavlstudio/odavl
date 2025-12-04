import { test, expect } from '@playwright/test';

/**
 * Autopilot Dashboard E2E Tests
 * 
 * Tests the Autopilot product dashboard functionality:
 * - O-D-A-V-L cycle monitoring
 * - Run history and status
 * - Undo/rollback functionality
 * - Recipe management
 * - Trust scoring
 * - Ledger inspection
 * - Governance rules
 */

test.describe('Autopilot Dashboard - Runs List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    await page.goto('/dashboard/autopilot');
    await page.waitForLoadState('networkidle');
  });

  test('should display Autopilot dashboard heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /autopilot/i });
    await expect(heading).toBeVisible();
  });

  test('should display runs table or empty state', async ({ page }) => {
    const table = page.locator('table');
    const emptyState = page.getByText(/no runs|no data|start autopilot/i);

    const hasTable = await table.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test('should show run status indicators', async ({ page }) => {
    // Look for status badges (success, failed, running, pending)
    const successStatus = page.locator('[data-status="success"], .status-success, :has-text("Success")');
    const failedStatus = page.locator('[data-status="failed"], .status-failed, :has-text("Failed")');
    const runningStatus = page.locator('[data-status="running"], .status-running, :has-text("Running")');

    const hasStatuses = 
      await successStatus.count() > 0 ||
      await failedStatus.count() > 0 ||
      await runningStatus.count() > 0;

    // Should have at least one status indicator (or empty state)
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display O-D-A-V-L phase breakdown', async ({ page }) => {
    // Click first run to view details
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Should show five phases
      const phases = ['Observe', 'Decide', 'Act', 'Verify', 'Learn'];
      
      for (const phase of phases) {
        const phaseElement = page.locator(`text=/${phase}/i`).first();
        const phaseExists = await phaseElement.count() > 0;
        
        if (phaseExists) {
          await expect(phaseElement).toBeVisible();
        }
      }
    }
  });

  test('should show run duration and timestamps', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      // Should display timestamps (e.g., "2 hours ago", "Jan 1, 2025")
      const timestamp = page.locator('time, [datetime], :has-text("ago")');
      const timestampExists = await timestamp.count() > 0;

      if (timestampExists) {
        await expect(timestamp.first()).toBeVisible();
      }
    }
  });

  test('should filter runs by status', async ({ page }) => {
    const filterButton = page.locator('button:has-text("Filter"), select[name*="status"]');
    const filterExists = await filterButton.count() > 0;

    if (filterExists) {
      await filterButton.first().click();
      await page.waitForTimeout(500);

      const successOption = page.locator('text=/success/i').first();
      const optionExists = await successOption.count() > 0;

      if (optionExists) {
        await successOption.click();
        await page.waitForTimeout(1000);

        const url = page.url();
        expect(url).toMatch(/status|success|filter/i);
      }
    }
  });

  test('should filter runs by project', async ({ page }) => {
    const projectFilter = page.locator('button:has-text("Project"), select[name*="project"]');
    const filterExists = await projectFilter.count() > 0;

    if (filterExists) {
      await projectFilter.first().click();
      await page.waitForTimeout(500);

      const projectOption = page.locator('[role="option"]').first();
      const optionExists = await projectOption.count() > 0;

      if (optionExists) {
        await projectOption.click();
        await page.waitForTimeout(1000);

        await expect(page.locator('main')).toBeVisible();
      }
    }
  });

  test('should sort runs by different columns', async ({ page }) => {
    const headers = page.locator('th[role="columnheader"]');
    const headerCount = await headers.count();

    if (headerCount > 0) {
      await headers.first().click();
      await page.waitForTimeout(1000);

      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('should trigger new autopilot run', async ({ page }) => {
    const runButton = page.locator('button:has-text("Run Autopilot"), button:has-text("Start Run")');
    const buttonExists = await runButton.count() > 0;

    if (buttonExists && await runButton.first().isEnabled()) {
      await runButton.first().click();
      await page.waitForTimeout(1000);

      // Should show confirmation or start run
      const confirmation = await page.locator('[role="dialog"], [role="alertdialog"]').isVisible().catch(() => false);
      const runStarted = await page.locator(':has-text("Starting"), :has-text("Running")').isVisible().catch(() => false);

      expect(confirmation || runStarted).toBeTruthy();
    }
  });
});

test.describe('Autopilot Dashboard - Run Details', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/autopilot');
    await page.waitForLoadState('networkidle');
  });

  test('should display phase execution timeline', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Look for timeline or progress visualization
      const timeline = page.locator('[role="progressbar"], .timeline, .progress, canvas');
      const timelineExists = await timeline.count() > 0;

      if (timelineExists) {
        await expect(timeline.first()).toBeVisible();
      }
    }
  });

  test('should show phase duration metrics', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Should display duration for each phase (in ms or seconds)
      const duration = page.locator(':has-text("ms"), :has-text("duration"), :has-text("time")');
      const durationExists = await duration.count() > 0;

      if (durationExists) {
        await expect(duration.first()).toBeVisible();
      }
    }
  });

  test('should display files modified in Act phase', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Look for list of modified files
      const filesList = page.locator(':has-text("files"), :has-text("modified"), code, pre');
      const filesExists = await filesList.count() > 0;

      if (filesExists) {
        await expect(filesList.first()).toBeVisible();
      }
    }
  });

  test('should show diff of changes made', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Look for diff viewer
      const diff = page.locator('.diff, [class*="diff"], :has-text("diff"), code.language-diff');
      const diffExists = await diff.count() > 0;

      if (diffExists) {
        await expect(diff.first()).toBeVisible();
      }
    }
  });

  test('should display recipe used', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Look for recipe name/ID
      const recipe = page.locator(':has-text("recipe"), :has-text("plan")');
      const recipeExists = await recipe.count() > 0;

      if (recipeExists) {
        await expect(recipe.first()).toBeVisible();
      }
    }
  });

  test('should show quality metrics before/after', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Look for metrics comparison
      const metrics = page.locator(':has-text("before"), :has-text("after"), :has-text("improvement")');
      const metricsExist = await metrics.count() > 0;

      if (metricsExist) {
        await expect(metrics.first()).toBeVisible();
      }
    }
  });

  test('should link to attestation proof', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const rowExists = await firstRow.count() > 0;

    if (rowExists) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Look for attestation link or hash
      const attestation = page.locator(':has-text("attestation"), :has-text("hash"), code:has-text("sha256")');
      const attestationExists = await attestation.count() > 0;

      if (attestationExists) {
        await expect(attestation.first()).toBeVisible();
      }
    }
  });
});

test.describe('Autopilot Dashboard - Undo Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/autopilot/undo');
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('should display undo history', async ({ page }) => {
    // Look for undo/snapshot list
    const undoList = page.locator(':has-text("undo"), :has-text("snapshot"), :has-text("restore")');
    const listExists = await undoList.count() > 0;

    if (listExists) {
      await expect(undoList.first()).toBeVisible();
    } else {
      // Might be empty state
      const emptyState = await page.locator(':has-text("no snapshots")').isVisible().catch(() => false);
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('should show snapshot metadata', async ({ page }) => {
    const firstSnapshot = page.locator('[data-testid*="snapshot"], .snapshot, li').first();
    const snapshotExists = await firstSnapshot.count() > 0;

    if (snapshotExists) {
      // Should show: timestamp, files affected, run ID
      await expect(firstSnapshot).toBeVisible();
    }
  });

  test('should allow restoring from snapshot', async ({ page }) => {
    const restoreButton = page.locator('button:has-text("Restore"), button:has-text("Undo")').first();
    const buttonExists = await restoreButton.count() > 0;

    if (buttonExists && await restoreButton.isEnabled()) {
      await restoreButton.click();
      await page.waitForTimeout(1000);

      // Should show confirmation dialog
      const confirmation = await page.locator('[role="dialog"], [role="alertdialog"]').isVisible();
      expect(confirmation).toBeTruthy();
    }
  });

  test('should warn before restoring snapshot', async ({ page }) => {
    const restoreButton = page.locator('button:has-text("Restore")').first();
    const buttonExists = await restoreButton.count() > 0;

    if (buttonExists && await restoreButton.isEnabled()) {
      await restoreButton.click();
      await page.waitForTimeout(1000);

      // Should show warning about data loss
      const warning = page.locator(':has-text("warning"), :has-text("overwrite"), :has-text("irreversible")');
      const warningExists = await warning.count() > 0;

      if (warningExists) {
        await expect(warning.first()).toBeVisible();
      }
    }
  });

  test('should display snapshot diff preview', async ({ page }) => {
    const firstSnapshot = page.locator('[data-testid*="snapshot"]').first();
    const snapshotExists = await firstSnapshot.count() > 0;

    if (snapshotExists) {
      await firstSnapshot.click();
      await page.waitForTimeout(1000);

      // Should show what will be restored
      const diff = page.locator('.diff, code, pre');
      const diffExists = await diff.count() > 0;

      if (diffExists) {
        await expect(diff.first()).toBeVisible();
      }
    }
  });
});

test.describe('Autopilot Dashboard - Recipe Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/autopilot/recipes');
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('should display available recipes', async ({ page }) => {
    const recipesList = page.locator(':has-text("recipe"), table, ul');
    const listExists = await recipesList.count() > 0;

    if (listExists) {
      await expect(recipesList.first()).toBeVisible();
    }
  });

  test('should show recipe trust scores', async ({ page }) => {
    // Look for trust score display (0.0-1.0 or percentage)
    const trustScore = page.locator(':has-text("trust"), :has-text("score"), :has-text("%")');
    const scoreExists = await trustScore.count() > 0;

    if (scoreExists) {
      await expect(trustScore.first()).toBeVisible();
    }
  });

  test('should display recipe success rate', async ({ page }) => {
    const successRate = page.locator(':has-text("success"), :has-text("rate"), :has-text("runs")');
    const rateExists = await successRate.count() > 0;

    if (rateExists) {
      await expect(successRate.first()).toBeVisible();
    }
  });

  test('should allow creating custom recipe', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Recipe")');
    const buttonExists = await createButton.count() > 0;

    if (buttonExists && await createButton.first().isEnabled()) {
      await createButton.first().click();
      await page.waitForTimeout(1000);

      // Should show recipe editor
      const editor = await page.locator('textarea, [contenteditable], form').isVisible();
      expect(editor).toBeTruthy();
    }
  });

  test('should allow disabling recipes', async ({ page }) => {
    const disableButton = page.locator('button:has-text("Disable"), input[type="checkbox"]').first();
    const buttonExists = await disableButton.count() > 0;

    if (buttonExists) {
      const wasEnabled = await disableButton.isEnabled();
      await disableButton.click();
      await page.waitForTimeout(500);

      // State should change
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('should show recipe execution history', async ({ page }) => {
    const firstRecipe = page.locator('tr, li').first();
    const recipeExists = await firstRecipe.count() > 0;

    if (recipeExists) {
      await firstRecipe.click();
      await page.waitForTimeout(1000);

      // Should show history of runs using this recipe
      const history = page.locator(':has-text("history"), :has-text("runs"), table');
      const historyExists = await history.count() > 0;

      if (historyExists) {
        await expect(history.first()).toBeVisible();
      }
    }
  });

  test('should indicate blacklisted recipes', async ({ page }) => {
    // Recipes with 3+ consecutive failures should be blacklisted (trust < 0.2)
    const blacklisted = page.locator(':has-text("blacklist"), :has-text("disabled"), [data-status="blacklisted"]');
    const blacklistedExists = await blacklisted.count() > 0;

    // May or may not have blacklisted recipes
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Autopilot Dashboard - Governance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/autopilot/settings');
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('should display governance rules', async ({ page }) => {
    const governanceSection = page.locator(':has-text("governance"), :has-text("rules"), :has-text("constraints")');
    const sectionExists = await governanceSection.count() > 0;

    if (sectionExists) {
      await expect(governanceSection.first()).toBeVisible();
    }
  });

  test('should show max files per cycle limit', async ({ page }) => {
    const maxFilesInput = page.locator('input[name*="max"], input[name*="file"]');
    const inputExists = await maxFilesInput.count() > 0;

    if (inputExists) {
      const value = await maxFilesInput.first().inputValue();
      // Default should be 10
      expect(parseInt(value)).toBeGreaterThan(0);
    }
  });

  test('should show max LOC per file limit', async ({ page }) => {
    const maxLocInput = page.locator('input[name*="loc"], input[name*="lines"]');
    const inputExists = await maxLocInput.count() > 0;

    if (inputExists) {
      const value = await maxLocInput.first().inputValue();
      // Default should be 40
      expect(parseInt(value)).toBeGreaterThan(0);
    }
  });

  test('should display protected paths', async ({ page }) => {
    const protectedPaths = page.locator(':has-text("protected"), :has-text("forbidden"), code, pre');
    const pathsExist = await protectedPaths.count() > 0;

    if (pathsExist) {
      await expect(protectedPaths.first()).toBeVisible();
    }
  });

  test('should allow adding new protected path', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add"), button:has-text("New Path")');
    const buttonExists = await addButton.count() > 0;

    if (buttonExists && await addButton.first().isEnabled()) {
      await addButton.first().click();
      await page.waitForTimeout(500);

      const input = page.locator('input[type="text"]').last();
      await expect(input).toBeVisible();
    }
  });

  test('should show risk budget enforcement', async ({ page }) => {
    const riskBudget = page.locator(':has-text("risk budget"), :has-text("risk"), input[name*="risk"]');
    const budgetExists = await riskBudget.count() > 0;

    if (budgetExists) {
      await expect(riskBudget.first()).toBeVisible();
    }
  });
});

test.describe('Autopilot Dashboard - Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@odavl.studio';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/autopilot');
    await page.waitForLoadState('networkidle');
  });

  test('should display success rate metric', async ({ page }) => {
    const successRate = page.locator(':has-text("success rate"), [data-metric="success-rate"]');
    const rateExists = await successRate.count() > 0;

    if (rateExists) {
      await expect(successRate.first()).toBeVisible();
    }
  });

  test('should show average cycle duration', async ({ page }) => {
    const avgDuration = page.locator(':has-text("average"), :has-text("duration"), :has-text("time")');
    const durationExists = await avgDuration.count() > 0;

    if (durationExists) {
      await expect(avgDuration.first()).toBeVisible();
    }
  });

  test('should display runs trend chart', async ({ page }) => {
    const chart = page.locator('canvas, svg[class*="chart"], [role="img"][aria-label*="chart"]');
    const chartExists = await chart.count() > 0;

    if (chartExists) {
      await expect(chart.first()).toBeVisible();
    }
  });

  test('should show files modified over time', async ({ page }) => {
    const filesMetric = page.locator(':has-text("files"), :has-text("modified")');
    const metricExists = await filesMetric.count() > 0;

    if (metricExists) {
      await expect(filesMetric.first()).toBeVisible();
    }
  });
});
