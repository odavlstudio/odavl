/**
 * Performance Testing with Lighthouse
 * Core Web Vitals and performance metrics
 */

import type { PerformanceResult } from '../types.js';

export async function testPerformance(url: string): Promise<PerformanceResult> {
  console.log(`⚡ Running performance tests on ${url}...`);
  
  try {
    // Dynamic import for Lighthouse
    const lighthouse = await import('lighthouse');
    const puppeteer = await import('puppeteer');
    
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    // Run Lighthouse
    const lighthouseResult = await lighthouse.default(url, {
      port: parseInt(new URL(browser.wsEndpoint()).port, 10),
      output: 'json',
      logLevel: 'error',
    });
    
    if (!lighthouseResult || !lighthouseResult.lhr) {
      throw new Error('Lighthouse failed to generate report');
    }
    
    const { lhr } = lighthouseResult;
    
    await browser.close();
    
    // Extract scores and metrics
    const performanceResult: PerformanceResult = {
      url,
      timestamp: new Date().toISOString(),
      scores: {
        performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
        accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
        bestPractices: Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
        seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
      },
      metrics: {
        firstContentfulPaint: lhr.audits['first-contentful-paint']?.numericValue ?? 0,
        largestContentfulPaint: lhr.audits['largest-contentful-paint']?.numericValue ?? 0,
        totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue ?? 0,
        cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.numericValue ?? 0,
        speedIndex: lhr.audits['speed-index']?.numericValue ?? 0,
      },
    };
    
    return performanceResult;
  } catch (error) {
    console.error('Performance test failed:', error);
    throw new Error(`Failed to test performance: ${(error as Error).message}`);
  }
}
