/**
 * Accessibility Testing with axe-core
 * WCAG 2.1 Level AA compliance
 */

import type { AccessibilityResult, AccessibilityViolation } from '../types.js';

export async function testAccessibility(url: string): Promise<AccessibilityResult> {
  console.log(`♿ Running accessibility tests on ${url}...`);
  
  try {
    // Dynamic import for browser-only modules
    const puppeteer = await import('puppeteer');
    const { AxePuppeteer } = await import('@axe-core/puppeteer');
    
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Run axe-core analysis
    const results = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    await browser.close();
    
    // Map violations to our format
    const violations: AccessibilityViolation[] = results.violations.map((v: any) => ({
      id: v.id,
      impact: v.impact as 'minor' | 'moderate' | 'serious' | 'critical',
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
    }));
    
    // Calculate score (100 - weighted by impact)
    const impactWeights = { minor: 1, moderate: 3, serious: 7, critical: 15 };
    const totalPenalty = violations.reduce(
      (sum, v) => sum + impactWeights[v.impact] * v.nodes,
      0
    );
    const score = Math.max(0, 100 - totalPenalty);
    
    return {
      url,
      timestamp: new Date().toISOString(),
      violations,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      score,
    };
  } catch (error) {
    console.error('Accessibility test failed:', error);
    throw new Error(`Failed to test accessibility: ${(error as Error).message}`);
  }
}
