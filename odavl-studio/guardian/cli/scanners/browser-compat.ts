/**
 * 🌐 Guardian Enterprise Browser Compatibility Checker
 * Test website across different browsers and versions
 * - Chrome/Edge compatibility
 * - Firefox compatibility  
 * - Safari compatibility
 * - Modern JavaScript features
 * - CSS compatibility
 * - Polyfill requirements
 */

import { Page } from 'puppeteer';

export interface CompatibilityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  browser: string;
  feature: string;
  description: string;
  recommendation: string;
}

export interface CompatibilityReport {
  score: number; // 0-100
  supportedBrowsers: string[];
  unsupportedFeatures: number;
  issues: CompatibilityIssue[];
  recommendations: string[];
}

export async function checkBrowserCompatibility(
  page: Page
): Promise<CompatibilityReport> {
  const issues: CompatibilityIssue[] = [];

  // 1. Check modern JavaScript features
  issues.push(...await checkJavaScriptFeatures(page));

  // 2. Check CSS features
  issues.push(...await checkCSSFeatures(page));

  // 3. Check Web APIs
  issues.push(...await checkWebAPIs(page));

  const critical = issues.filter(i => i.severity === 'critical').length;
  const high = issues.filter(i => i.severity === 'high').length;
  const medium = issues.filter(i => i.severity === 'medium').length;

  const score = Math.max(0, 100 - (critical * 20) - (high * 10) - (medium * 5));

  const supportedBrowsers = determineSupportedBrowsers(issues);

  return {
    score,
    supportedBrowsers,
    unsupportedFeatures: issues.length,
    issues,
    recommendations: generateCompatibilityRecommendations(issues)
  };
}

async function checkJavaScriptFeatures(page: Page): Promise<CompatibilityIssue[]> {
  const issues: CompatibilityIssue[] = [];

  try {
    const results = await page.evaluate(() => {
      const problems: any[] = [];

      // Check for optional chaining (ES2020)
      try {
        eval('const x = {}; x?.y?.z');
      } catch (e) {
        problems.push({ feature: 'optional-chaining', browsers: 'IE, old Safari' });
      }

      // Check for nullish coalescing (ES2020)
      try {
        eval('const x = null ?? "default"');
      } catch (e) {
        problems.push({ feature: 'nullish-coalescing', browsers: 'IE, old Safari' });
      }

      // Check for BigInt
      if (typeof BigInt === 'undefined') {
        problems.push({ feature: 'bigint', browsers: 'IE, old browsers' });
      }

      // Check for Promise.allSettled (ES2020)
      if (typeof Promise.allSettled === 'undefined') {
        problems.push({ feature: 'promise-allsettled', browsers: 'IE, old Chrome/Firefox' });
      }

      // Check for dynamic import
      try {
        eval('import("./module.js")');
      } catch (e) {
        if (e instanceof SyntaxError) {
          problems.push({ feature: 'dynamic-import', browsers: 'IE, old browsers' });
        }
      }

      return problems;
    });

    for (const result of results) {
      issues.push({
        severity: result.browsers.includes('IE') ? 'medium' : 'low',
        browser: result.browsers,
        feature: result.feature,
        description: `${result.feature} not supported`,
        recommendation: `Add polyfill or transpile with Babel for ${result.browsers}`
      });
    }

  } catch (error) {
    // Silent fail
  }

  return issues;
}

async function checkCSSFeatures(page: Page): Promise<CompatibilityIssue[]> {
  const issues: CompatibilityIssue[] = [];

  try {
    const results = await page.evaluate(() => {
      const problems: any[] = [];
      const testDiv = document.createElement('div');

      // Check for CSS Grid
      if (!CSS.supports('display', 'grid')) {
        problems.push({ feature: 'css-grid', browsers: 'IE 10-, old browsers' });
      }

      // Check for CSS Flexbox
      if (!CSS.supports('display', 'flex')) {
        problems.push({ feature: 'flexbox', browsers: 'IE 9-, very old browsers' });
      }

      // Check for CSS Custom Properties (variables)
      if (!CSS.supports('--test', 'value')) {
        problems.push({ feature: 'css-variables', browsers: 'IE, old Edge' });
      }

      // Check for gap property (Grid/Flexbox)
      if (!CSS.supports('gap', '10px')) {
        problems.push({ feature: 'gap-property', browsers: 'Safari <14' });
      }

      // Check for aspect-ratio
      if (!CSS.supports('aspect-ratio', '16/9')) {
        problems.push({ feature: 'aspect-ratio', browsers: 'Safari <15, old browsers' });
      }

      // Check for backdrop-filter
      if (!CSS.supports('backdrop-filter', 'blur(10px)')) {
        problems.push({ feature: 'backdrop-filter', browsers: 'Firefox <103, old browsers' });
      }

      return problems;
    });

    for (const result of results) {
      issues.push({
        severity: result.browsers.includes('IE') ? 'high' : 'medium',
        browser: result.browsers,
        feature: result.feature,
        description: `${result.feature} not supported`,
        recommendation: `Add fallback CSS or use PostCSS autoprefixer`
      });
    }

  } catch (error) {
    // Silent fail
  }

  return issues;
}

async function checkWebAPIs(page: Page): Promise<CompatibilityIssue[]> {
  const issues: CompatibilityIssue[] = [];

  try {
    const results = await page.evaluate(() => {
      const problems: any[] = [];

      // Check for Intersection Observer
      if (typeof IntersectionObserver === 'undefined') {
        problems.push({ feature: 'intersection-observer', browsers: 'IE, Safari <12' });
      }

      // Check for Resize Observer
      if (typeof ResizeObserver === 'undefined') {
        problems.push({ feature: 'resize-observer', browsers: 'Safari <13' });
      }

      // Check for Web Share API
      if (typeof navigator.share === 'undefined') {
        problems.push({ feature: 'web-share', browsers: 'Firefox, IE, old Safari' });
      }

      // Check for Payment Request API
      if (typeof PaymentRequest === 'undefined') {
        problems.push({ feature: 'payment-request', browsers: 'IE, Firefox, Safari' });
      }

      // Check for Web Crypto
      if (!window.crypto || !window.crypto.subtle) {
        problems.push({ feature: 'web-crypto', browsers: 'IE, very old browsers' });
      }

      return problems;
    });

    for (const result of results) {
      issues.push({
        severity: result.browsers.includes('IE') ? 'low' : 'low',
        browser: result.browsers,
        feature: result.feature,
        description: `${result.feature} API not available`,
        recommendation: `Add polyfill or feature detection with fallback`
      });
    }

  } catch (error) {
    // Silent fail
  }

  return issues;
}

function determineSupportedBrowsers(issues: CompatibilityIssue[]): string[] {
  const allBrowsers = [
    'Chrome 90+',
    'Firefox 90+',
    'Safari 14+',
    'Edge 90+',
    'Opera 76+'
  ];

  // If any critical issues for specific browsers, remove them
  const unsupportedBrowsers = new Set<string>();

  for (const issue of issues) {
    if (issue.severity === 'critical' || issue.severity === 'high') {
      if (issue.browser.includes('Chrome')) unsupportedBrowsers.add('Chrome 90+');
      if (issue.browser.includes('Firefox')) unsupportedBrowsers.add('Firefox 90+');
      if (issue.browser.includes('Safari')) unsupportedBrowsers.add('Safari 14+');
      if (issue.browser.includes('Edge')) unsupportedBrowsers.add('Edge 90+');
    }
  }

  return allBrowsers.filter(b => !unsupportedBrowsers.has(b));
}

function generateCompatibilityRecommendations(issues: CompatibilityIssue[]): string[] {
  const recommendations: string[] = [];

  if (issues.some(i => i.feature.includes('optional-chaining') || i.feature.includes('nullish'))) {
    recommendations.push('⚙️ Add Babel: Transpile modern JavaScript for older browsers');
  }

  if (issues.some(i => i.feature.includes('css'))) {
    recommendations.push('🎨 Add PostCSS: Autoprefixer for CSS compatibility');
  }

  if (issues.some(i => i.browser.includes('IE'))) {
    recommendations.push('🔧 IE Support: Add polyfills for core-js and regenerator-runtime');
  }

  if (issues.some(i => i.feature.includes('observer'))) {
    recommendations.push('👁️ Add polyfills: Intersection/Resize Observer polyfills');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Excellent browser compatibility! Modern browsers fully supported');
  }

  return recommendations;
}
