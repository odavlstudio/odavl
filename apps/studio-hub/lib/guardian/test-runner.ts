/**
 * Guardian Test Runner
 * Orchestrates accessibility, performance, and security testing
 */

import { chromium, type Browser, type Page } from 'playwright';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface AccessibilityViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  nodes: Array<{ html: string; target: string[] }>;
}

interface TestResult {
  accessibility: {
    violations: number;
    passes: number;
    details?: AccessibilityViolation[];
  };
  performance: {
    score: number;
    fcp?: number;
    lcp?: number;
    ttfb?: number;
  };
  security: {
    csp?: string;
    xframe: boolean;
    hsts?: boolean;
  };
}

/**
 * Run complete Guardian test suite
 * @param testId Guardian test ID from database
 */
export async function runGuardianTests(testId: string): Promise<void> {
  const test = await prisma.guardianTest.findUnique({
    where: { id: testId },
  });

  if (!test) {
    throw new Error(`Test not found: ${testId}`);
  }

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Update status to RUNNING
    await prisma.guardianTest.update({
      where: { id: testId },
      data: {
        status: 'RUNNING',
      },
    });

    logger.emoji('🚀', `Starting Guardian test for ${test.url}`, { testId: test.id, url: test.url });

    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    page = await browser.newPage();

    // 1. Accessibility Testing (basic check - axe-core would require additional setup)
    logger.emoji('♿', 'Running accessibility tests...');
    await page.goto(test.url, { waitUntil: 'networkidle' });
    
    const accessibilityResults = await page.evaluate(() => {
      // Basic accessibility checks
      const imgs = document.querySelectorAll('img:not([alt])');
      const buttons = document.querySelectorAll('button:not([aria-label]):not(:has(> *))');
      const links = document.querySelectorAll('a:not([href])');
      
      return {
        violations: imgs.length + buttons.length + links.length,
        passes: 100, // Placeholder
        details: [
          { type: 'missing-alt', count: imgs.length },
          { type: 'missing-aria-label', count: buttons.length },
          { type: 'invalid-links', count: links.length },
        ],
      };
    });

    // 2. Performance Testing (basic metrics)
    logger.emoji('⚡', 'Running performance tests...');
    const performanceMetrics = await page.evaluate(() => {
      const timing = performance.timing;
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        ttfb: navigation?.responseStart - navigation?.requestStart || 0,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        fcp: 0, // Would need performance observer
        lcp: 0, // Would need performance observer
      };
    });

    // Calculate performance score (0-100)
    const performanceScore = Math.max(0, Math.min(100, 
      100 - (performanceMetrics.loadComplete / 50) // Penalty for slow load
    ));

    // 3. Security Testing
    logger.emoji('🔒', 'Running security tests...');
    const securityHeaders = await page.evaluate(() => {
      const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      return {
        csp: meta?.getAttribute('content') || 'none',
        xframe: window.top !== window.self,
        hsts: false, // Would need response headers
      };
    });

    // Calculate overall score
    const accessibilityScore = Math.max(0, 100 - accessibilityResults.violations * 5);
    const securityScore = securityHeaders.csp !== 'none' ? 90 : 60;
    const overallScore = Math.round(
      (accessibilityScore + performanceScore + securityScore) / 3
    );

    logger.success(`Test completed with score: ${overallScore}/100`, { testId: test.id, score: overallScore });

    // Save results
    await prisma.guardianTest.update({
      where: { id: testId },
      data: {
        status: 'PASSED',
        completedAt: new Date(),
        score: overallScore,
      },
    });
  } catch (error) {
    logger.error('Test failed', error as Error);

    await prisma.guardianTest.update({
      where: { id: testId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
      },
    });

    throw error;
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

/**
 * Verify Guardian test runner dependencies
 */
export async function verifyGuardianDependencies(): Promise<boolean> {
  try {
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    logger.success('Playwright browser verified');
    return true;
  } catch (error) {
    logger.error('Playwright browser not installed', error as Error);
    logger.info('Run: pnpm exec playwright install chromium');
    return false;
  }
}
