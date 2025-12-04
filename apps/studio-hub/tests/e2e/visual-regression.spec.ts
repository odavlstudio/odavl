import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Visual Regression', () => {
  test('home page visual snapshot', async ({ page }) => {
    await page.goto('/en');
    
    // Wait for images to load
    await page.waitForLoadState('networkidle');
    
    // Take Percy snapshot
    await percySnapshot(page, 'Home Page - English');
  });

  test('dashboard overview visual snapshot', async ({ page }) => {
    await page.goto('/en/dashboard');
    
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Dashboard Overview');
  });

  test('insight dashboard visual snapshot', async ({ page }) => {
    await page.goto('/en/dashboard/insight');
    
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Insight Dashboard');
  });

  test('autopilot dashboard visual snapshot', async ({ page }) => {
    await page.goto('/en/dashboard/autopilot');
    
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Autopilot Dashboard');
  });

  test('guardian dashboard visual snapshot', async ({ page }) => {
    await page.goto('/en/dashboard/guardian');
    
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Guardian Dashboard');
  });

  test('Arabic RTL layout visual snapshot', async ({ page }) => {
    await page.goto('/ar');
    
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Home Page - Arabic (RTL)');
  });

  test('mobile responsive - iPhone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Home Page - Mobile (iPhone SE)', {
      widths: [375],
    });
  });

  test('mobile responsive - Android', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 }); // Pixel 5
    
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Home Page - Mobile (Pixel 5)', {
      widths: [360],
    });
  });

  test('tablet responsive - iPad', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Dashboard - Tablet (iPad)', {
      widths: [768],
    });
  });

  test('dark mode visual snapshot', async ({ page }) => {
    await page.goto('/en');
    
    // Toggle dark mode (if implemented)
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Home Page - Dark Mode');
  });
});
