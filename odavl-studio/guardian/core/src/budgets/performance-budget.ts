/**
 * Performance Budget System for Guardian
 * 
 * Enforces performance thresholds based on device type and network conditions
 * Aligned with Core Web Vitals and lighthouse metrics
 * 
 * @see https://web.dev/performance-budgets-101/
 */

export interface PerformanceBudget {
  // Core Web Vitals (Google's official metrics)
  lcp: number; // Largest Contentful Paint (ms) - Target: < 2500ms (good), < 4000ms (needs improvement)
  fid: number; // First Input Delay (ms) - Target: < 100ms (good), < 300ms (needs improvement)
  cls: number; // Cumulative Layout Shift - Target: < 0.1 (good), < 0.25 (needs improvement)
  fcp: number; // First Contentful Paint (ms) - Target: < 1800ms (good), < 3000ms (needs improvement)
  ttfb: number; // Time to First Byte (ms) - Target: < 800ms (good), < 1800ms (needs improvement)
  
  // Resource budgets
  totalSize: number; // Total page size (bytes) - Target: < 1.5MB for mobile
  jsSize: number; // JavaScript size (bytes) - Target: < 500KB
  cssSize: number; // CSS size (bytes) - Target: < 100KB
  imageSize: number; // Images size (bytes) - Target: < 1MB
  fontSize: number; // Fonts size (bytes) - Target: < 200KB
  
  // Request budgets
  totalRequests: number; // Total HTTP requests - Target: < 50 for mobile
  thirdPartyRequests: number; // Third-party requests - Target: < 10
  
  // Rendering budgets
  tti: number; // Time to Interactive (ms) - Target: < 3800ms (good), < 7300ms (needs improvement)
  tbt: number; // Total Blocking Time (ms) - Target: < 200ms (good), < 600ms (needs improvement)
  speedIndex: number; // Speed Index (ms) - Target: < 3400ms (good), < 5800ms (needs improvement)
}

/**
 * Predefined budgets for different scenarios
 */
export const PERFORMANCE_BUDGETS: Record<string, PerformanceBudget> = {
  // Desktop on fast connection (Cable/Fiber)
  desktop: {
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    fcp: 1800,
    ttfb: 800,
    totalSize: 3 * 1024 * 1024, // 3MB
    jsSize: 1024 * 1024, // 1MB
    cssSize: 200 * 1024, // 200KB
    imageSize: 2 * 1024 * 1024, // 2MB
    fontSize: 300 * 1024, // 300KB
    totalRequests: 75,
    thirdPartyRequests: 15,
    tti: 3800,
    tbt: 200,
    speedIndex: 3400,
  },
  
  // Mobile on fast 4G
  mobile: {
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    fcp: 1800,
    ttfb: 800,
    totalSize: 1.5 * 1024 * 1024, // 1.5MB
    jsSize: 500 * 1024, // 500KB
    cssSize: 100 * 1024, // 100KB
    imageSize: 1024 * 1024, // 1MB
    fontSize: 200 * 1024, // 200KB
    totalRequests: 50,
    thirdPartyRequests: 10,
    tti: 3800,
    tbt: 200,
    speedIndex: 3400,
  },
  
  // Mobile on slow 3G (simulated)
  'mobile-slow-3g': {
    lcp: 4000,
    fid: 300,
    cls: 0.25,
    fcp: 3000,
    ttfb: 1800,
    totalSize: 1024 * 1024, // 1MB
    jsSize: 300 * 1024, // 300KB
    cssSize: 75 * 1024, // 75KB
    imageSize: 700 * 1024, // 700KB
    fontSize: 150 * 1024, // 150KB
    totalRequests: 30,
    thirdPartyRequests: 5,
    tti: 7300,
    tbt: 600,
    speedIndex: 5800,
  },
  
  // E-commerce site (strict budgets)
  ecommerce: {
    lcp: 2000, // Faster for conversion
    fid: 50,
    cls: 0.05, // Strict layout shift (prevents accidental clicks)
    fcp: 1500,
    ttfb: 600,
    totalSize: 1.2 * 1024 * 1024, // 1.2MB
    jsSize: 400 * 1024, // 400KB
    cssSize: 80 * 1024, // 80KB
    imageSize: 800 * 1024, // 800KB
    fontSize: 150 * 1024, // 150KB
    totalRequests: 40,
    thirdPartyRequests: 8, // Limited third-party scripts
    tti: 3000,
    tbt: 150,
    speedIndex: 3000,
  },
  
  // Content/Blog site (focus on reading experience)
  content: {
    lcp: 2200,
    fid: 100,
    cls: 0.05, // Strict layout shift for reading
    fcp: 1600,
    ttfb: 700,
    totalSize: 1024 * 1024, // 1MB
    jsSize: 300 * 1024, // 300KB
    cssSize: 80 * 1024, // 80KB
    imageSize: 700 * 1024, // 700KB
    fontSize: 200 * 1024, // 200KB (web fonts for typography)
    totalRequests: 35,
    thirdPartyRequests: 5,
    tti: 3500,
    tbt: 180,
    speedIndex: 3200,
  },
  
  // SaaS Dashboard (interactive app)
  dashboard: {
    lcp: 3000, // Slightly relaxed for rich UI
    fid: 50, // Strict input delay for UX
    cls: 0.1,
    fcp: 2000,
    ttfb: 800,
    totalSize: 2 * 1024 * 1024, // 2MB
    jsSize: 800 * 1024, // 800KB (lots of interactivity)
    cssSize: 150 * 1024, // 150KB
    imageSize: 1024 * 1024, // 1MB
    fontSize: 200 * 1024, // 200KB
    totalRequests: 60,
    thirdPartyRequests: 12,
    tti: 4000,
    tbt: 250,
    speedIndex: 3800,
  },
};

/**
 * Check if performance metrics meet budget
 */
export interface BudgetViolation {
  metric: string;
  actual: number;
  budget: number;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  recommendation: string;
}

export function checkPerformanceBudget(
  metrics: Partial<PerformanceBudget>,
  budget: PerformanceBudget,
  budgetType: string
): BudgetViolation[] {
  const violations: BudgetViolation[] = [];

  // Helper to calculate severity
  const getSeverity = (actual: number, budget: number): 'critical' | 'warning' | 'info' => {
    const ratio = actual / budget;
    if (ratio >= 1.5) return 'critical'; // 50%+ over budget
    if (ratio >= 1.2) return 'warning'; // 20%+ over budget
    return 'info'; // Within 20% of budget
  };

  // Check each metric
  if (metrics.lcp && metrics.lcp > budget.lcp) {
    violations.push({
      metric: 'LCP (Largest Contentful Paint)',
      actual: metrics.lcp,
      budget: budget.lcp,
      severity: getSeverity(metrics.lcp, budget.lcp),
      message: `LCP ${metrics.lcp}ms exceeds ${budgetType} budget of ${budget.lcp}ms`,
      recommendation: 'Optimize server response time, eliminate render-blocking resources, preload critical assets, compress images',
    });
  }

  if (metrics.fid && metrics.fid > budget.fid) {
    violations.push({
      metric: 'FID (First Input Delay)',
      actual: metrics.fid,
      budget: budget.fid,
      severity: getSeverity(metrics.fid, budget.fid),
      message: `FID ${metrics.fid}ms exceeds ${budgetType} budget of ${budget.fid}ms`,
      recommendation: 'Reduce JavaScript execution time, break up long tasks, use web workers for heavy computation',
    });
  }

  if (metrics.cls && metrics.cls > budget.cls) {
    violations.push({
      metric: 'CLS (Cumulative Layout Shift)',
      actual: metrics.cls,
      budget: budget.cls,
      severity: getSeverity(metrics.cls, budget.cls),
      message: `CLS ${metrics.cls.toFixed(3)} exceeds ${budgetType} budget of ${budget.cls.toFixed(3)}`,
      recommendation: 'Add size attributes to images/videos, avoid inserting content above existing content, use CSS aspect-ratio',
    });
  }

  if (metrics.fcp && metrics.fcp > budget.fcp) {
    violations.push({
      metric: 'FCP (First Contentful Paint)',
      actual: metrics.fcp,
      budget: budget.fcp,
      severity: getSeverity(metrics.fcp, budget.fcp),
      message: `FCP ${metrics.fcp}ms exceeds ${budgetType} budget of ${budget.fcp}ms`,
      recommendation: 'Eliminate render-blocking resources, minify CSS, use HTTP/2, enable text compression',
    });
  }

  if (metrics.ttfb && metrics.ttfb > budget.ttfb) {
    violations.push({
      metric: 'TTFB (Time to First Byte)',
      actual: metrics.ttfb,
      budget: budget.ttfb,
      severity: getSeverity(metrics.ttfb, budget.ttfb),
      message: `TTFB ${metrics.ttfb}ms exceeds ${budgetType} budget of ${budget.ttfb}ms`,
      recommendation: 'Use CDN, optimize server processing, enable caching, reduce server response time',
    });
  }

  if (metrics.totalSize && metrics.totalSize > budget.totalSize) {
    const actualMB = (metrics.totalSize / (1024 * 1024)).toFixed(2);
    const budgetMB = (budget.totalSize / (1024 * 1024)).toFixed(2);
    violations.push({
      metric: 'Total Page Size',
      actual: metrics.totalSize,
      budget: budget.totalSize,
      severity: getSeverity(metrics.totalSize, budget.totalSize),
      message: `Total size ${actualMB}MB exceeds ${budgetType} budget of ${budgetMB}MB`,
      recommendation: 'Compress images (WebP/AVIF), minify JS/CSS, enable gzip/brotli, lazy load non-critical resources',
    });
  }

  if (metrics.jsSize && metrics.jsSize > budget.jsSize) {
    const actualKB = (metrics.jsSize / 1024).toFixed(0);
    const budgetKB = (budget.jsSize / 1024).toFixed(0);
    violations.push({
      metric: 'JavaScript Size',
      actual: metrics.jsSize,
      budget: budget.jsSize,
      severity: getSeverity(metrics.jsSize, budget.jsSize),
      message: `JS size ${actualKB}KB exceeds ${budgetType} budget of ${budgetKB}KB`,
      recommendation: 'Code-split bundles, tree-shake unused code, minify/compress JS, defer non-critical scripts',
    });
  }

  if (metrics.cssSize && metrics.cssSize > budget.cssSize) {
    const actualKB = (metrics.cssSize / 1024).toFixed(0);
    const budgetKB = (budget.cssSize / 1024).toFixed(0);
    violations.push({
      metric: 'CSS Size',
      actual: metrics.cssSize,
      budget: budget.cssSize,
      severity: getSeverity(metrics.cssSize, budget.cssSize),
      message: `CSS size ${actualKB}KB exceeds ${budgetType} budget of ${budgetKB}KB`,
      recommendation: 'Remove unused CSS, minify CSS, use critical CSS inline, defer non-critical styles',
    });
  }

  if (metrics.totalRequests && metrics.totalRequests > budget.totalRequests) {
    violations.push({
      metric: 'Total HTTP Requests',
      actual: metrics.totalRequests,
      budget: budget.totalRequests,
      severity: getSeverity(metrics.totalRequests, budget.totalRequests),
      message: `Total requests ${metrics.totalRequests} exceeds ${budgetType} budget of ${budget.totalRequests}`,
      recommendation: 'Combine files, use image sprites, inline critical resources, enable HTTP/2 multiplexing',
    });
  }

  if (metrics.tti && metrics.tti > budget.tti) {
    violations.push({
      metric: 'TTI (Time to Interactive)',
      actual: metrics.tti,
      budget: budget.tti,
      severity: getSeverity(metrics.tti, budget.tti),
      message: `TTI ${metrics.tti}ms exceeds ${budgetType} budget of ${budget.tti}ms`,
      recommendation: 'Reduce JavaScript execution time, eliminate render-blocking resources, minimize main thread work',
    });
  }

  if (metrics.tbt && metrics.tbt > budget.tbt) {
    violations.push({
      metric: 'TBT (Total Blocking Time)',
      actual: metrics.tbt,
      budget: budget.tbt,
      severity: getSeverity(metrics.tbt, budget.tbt),
      message: `TBT ${metrics.tbt}ms exceeds ${budgetType} budget of ${budget.tbt}ms`,
      recommendation: 'Break up long tasks (> 50ms), use requestIdleCallback, defer non-essential JavaScript',
    });
  }

  return violations;
}

/**
 * Format budget violations for CLI output
 */
export function formatBudgetReport(violations: BudgetViolation[], budgetType: string): string {
  if (violations.length === 0) {
    return `✅ All metrics within ${budgetType} performance budget!`;
  }

  const critical = violations.filter(v => v.severity === 'critical').length;
  const warnings = violations.filter(v => v.severity === 'warning').length;
  const info = violations.filter(v => v.severity === 'info').length;

  let report = `\n⚠️  Performance Budget Violations (${budgetType}):\n`;
  report += `   Critical: ${critical} | Warnings: ${warnings} | Info: ${info}\n\n`;

  for (const v of violations) {
    const icon = v.severity === 'critical' ? '❌' : v.severity === 'warning' ? '⚠️' : 'ℹ️';
    report += `${icon} ${v.metric}\n`;
    report += `   ${v.message}\n`;
    report += `   💡 ${v.recommendation}\n\n`;
  }

  return report;
}

/**
 * Generate custom budget based on site type and conditions
 */
export function generateCustomBudget(
  baseType: keyof typeof PERFORMANCE_BUDGETS,
  adjustments?: Partial<PerformanceBudget>
): PerformanceBudget {
  const base = PERFORMANCE_BUDGETS[baseType];
  return { ...base, ...adjustments };
}
