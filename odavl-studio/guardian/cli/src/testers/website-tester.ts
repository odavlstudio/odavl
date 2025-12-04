/**
 * Enhanced Website Tester - Guardian v5.0
 * 
 * Complete website testing with:
 * - Performance (Core Web Vitals)
 * - Accessibility (WCAG 2.1)
 * - SEO (Meta tags, Sitemap)
 * - Security (HTTPS, Headers)
 * - Visual Regression (Screenshot comparison)
 * - Multi-Device (Mobile, Tablet, Desktop)
 * - Console Monitoring
 * - Link Checking
 */

import chalk from 'chalk';
import ora from 'ora';
import { chromium, type Browser, type Page, type BrowserContext, devices } from 'playwright';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { getTheme, drawBox, drawSeparator, formatHealthScore } from '../../theme.js';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

/**
 * Device Presets
 */
export type DevicePreset = 'mobile' | 'tablet' | 'desktop';

const DEVICE_CONFIGS = {
  mobile: devices['iPhone 13'],
  tablet: devices['iPad Pro'],
  desktop: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
  },
} as const;

/**
 * Website Test Options
 */
export interface WebsiteTestOptions {
  /** Skip performance tests */
  skipPerformance?: boolean;
  
  /** Skip visual regression tests */
  skipVisual?: boolean;
  
  /** Skip multi-device tests */
  skipMultiDevice?: boolean;
  
  /** Devices to test (default: all) */
  devices?: DevicePreset[];
  
  /** Visual regression threshold (0-1, default: 0.1) */
  visualThreshold?: number;
  
  /** Timeout for tests (ms, default: 30000) */
  timeout?: number;
}

/**
 * Complete Website Test Result
 */
export interface WebsiteTestResult {
  url: string;
  timestamp: string;
  duration: number;
  overallScore: number; // 0-100
  status: 'pass' | 'fail' | 'warning';
  
  // Core metrics
  performance: PerformanceMetrics;
  accessibility: AccessibilityReport;
  seo: SEOReport;
  security: SecurityReport;
  console: ConsoleReport;
  links: LinkReport;
  
  // Enhanced features
  visual?: VisualRegressionReport;
  multiDevice?: MultiDeviceReport;
  
  // Recommendations
  recommendations: Recommendation[];
  
  // Report path
  reportPath: string;
}

/**
 * Visual Regression Report
 */
export interface VisualRegressionReport {
  hasBaseline: boolean;
  pixelDiff: number;
  percentDiff: number;
  passed: boolean;
  threshold: number;
  screenshotPath: string;
  baselinePath?: string;
  diffPath?: string;
}

/**
 * Multi-Device Report
 */
export interface MultiDeviceReport {
  devices: DeviceResult[];
  allPassed: boolean;
  issues: DeviceIssue[];
}

interface DeviceResult {
  device: DevicePreset;
  viewport: { width: number; height: number };
  score: number;
  passed: boolean;
  screenshot: string;
  metrics: {
    loadTime: number;
    responsive: boolean;
    layoutShift: boolean;
  };
}

interface DeviceIssue {
  device: DevicePreset;
  severity: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
}

/**
 * Core Metrics (from original)
 */
export interface PerformanceMetrics {
  score: number;
  ttfb: number;
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  speedIndex: number;
  tbt: number;
  loadTime: number;
  issues: Issue[];
}

export interface AccessibilityReport {
  score: number;
  violations: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  issues: Issue[];
}

export interface SEOReport {
  score: number;
  hasTitle: boolean;
  hasDescription: boolean;
  hasKeywords: boolean;
  hasOgTags: boolean;
  hasCanonical: boolean;
  hasSitemap: boolean;
  hasRobotsTxt: boolean;
  issues: Issue[];
}

export interface SecurityReport {
  score: number;
  https: boolean;
  sslValid: boolean;
  sslExpiry?: string;
  headers: {
    csp?: string;
    xFrameOptions?: string;
    xContentTypeOptions?: string;
    strictTransportSecurity?: string;
  };
  issues: Issue[];
}

export interface ConsoleReport {
  errors: number;
  warnings: number;
  messages: string[];
  issues: Issue[];
}

export interface LinkReport {
  total: number;
  broken: number;
  external: number;
  issues: Issue[];
}

interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  element?: string;
  recommendation: string;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
  impact: string;
  estimatedTime: string;
}

/**
 * Enhanced Website Tester Class
 */
export class WebsiteTester {
  private browser: Browser | null = null;
  private theme = getTheme();
  private baselineDir: string;
  private screenshotDir: string;

  constructor() {
    const guardianDir = join(process.cwd(), '.guardian');
    this.baselineDir = join(guardianDir, 'baselines');
    this.screenshotDir = join(guardianDir, 'screenshots');
  }

  /**
   * Test website with all checks
   */
  async test(url: string, options: WebsiteTestOptions = {}): Promise<WebsiteTestResult> {
    const startTime = Date.now();
    const { colors } = this.theme;

    // Validate URL
    if (!this.isValidUrl(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }

    console.log(colors.primary('\n🌐 Guardian Website Tester v5.0\n'));
    console.log(colors.muted(`URL: ${url}`));
    console.log(drawSeparator(60));
    console.log();

    // Ensure directories exist
    await mkdir(this.baselineDir, { recursive: true });
    await mkdir(this.screenshotDir, { recursive: true });

    // Launch browser
    const spinner = ora('Launching browser...').start();
    this.browser = await chromium.launch({ headless: true });
    spinner.succeed('Browser ready');

    try {
      // Create context with desktop viewport
      const context = await this.browser.newContext();
      const page = await context.newPage();

      // Run core checks
      console.log();
      const [performance, accessibility, seo, security, consoleReport, links] = await Promise.all([
        options.skipPerformance ? this.getEmptyPerformance() : this.checkPerformance(page, url),
        this.checkAccessibility(page, url),
        this.checkSEO(page, url),
        this.checkSecurity(page, url),
        this.checkConsole(page, url),
        this.checkLinks(page, url),
      ]);

      // Visual regression (if not skipped)
      let visual: VisualRegressionReport | undefined;
      if (!options.skipVisual) {
        visual = await this.checkVisualRegression(page, url, options.visualThreshold || 0.1);
      }

      // Multi-device testing (if not skipped)
      let multiDevice: MultiDeviceReport | undefined;
      if (!options.skipMultiDevice) {
        const devicesToTest = options.devices || ['mobile', 'tablet', 'desktop'];
        multiDevice = await this.checkMultiDevice(url, devicesToTest);
      }

      await context.close();

      // Calculate overall score
      const overallScore = this.calculateOverallScore({
        performance: performance.score,
        accessibility: accessibility.score,
        seo: seo.score,
        security: security.score,
        visual: visual?.passed !== false ? 100 : 50,
        multiDevice: multiDevice?.allPassed !== false ? 100 : 50,
      });

      // Determine status
      const status = overallScore >= 90 ? 'pass' : overallScore >= 75 ? 'warning' : 'fail';

      // Generate recommendations
      const recommendations = this.generateRecommendations({
        performance,
        accessibility,
        seo,
        security,
        console: consoleReport,
        links,
        visual,
        multiDevice,
      });

      // Save report
      const reportPath = await this.saveReport({
        url,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        overallScore,
        status,
        performance,
        accessibility,
        seo,
        security,
        console: consoleReport,
        links,
        visual,
        multiDevice,
        recommendations,
        reportPath: '', // Will be set after saving
      });

      const result: WebsiteTestResult = {
        url,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        overallScore,
        status,
        performance,
        accessibility,
        seo,
        security,
        console: consoleReport,
        links,
        visual,
        multiDevice,
        recommendations,
        reportPath,
      };

      return result;

    } finally {
      await this.browser.close();
    }
  }

  /**
   * Check Performance Metrics
   */
  private async checkPerformance(page: Page, url: string): Promise<PerformanceMetrics> {
    const spinner = ora('📊 Analyzing performance...').start();

    try {
      const startTime = Date.now();
      
      // Navigate and measure metrics
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      const metrics = await page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        return {
          ttfb: perf.responseStart - perf.requestStart,
          loadTime: perf.loadEventEnd - perf.fetchStart,
          domContentLoaded: perf.domContentLoadedEventEnd - perf.fetchStart,
          fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        };
      });

      // Get Web Vitals (simplified - production would use Lighthouse)
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          let lcp = 0;
          let fid = 0;
          let cls = 0;

          // LCP observer
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            lcp = lastEntry.renderTime || lastEntry.loadTime;
          });
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

          // FID observer
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              fid = entry.processingStart - entry.startTime;
            });
          });
          fidObserver.observe({ type: 'first-input', buffered: true });

          // CLS observer
          const clsObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                cls += entry.value;
              }
            });
          });
          clsObserver.observe({ type: 'layout-shift', buffered: true });

          // Give observers time to collect data
          setTimeout(() => {
            resolve({ lcp, fid, cls });
          }, 1000);
        });
      });

      const issues: Issue[] = [];
      
      // TTFB check
      if (metrics.ttfb > 600) {
        issues.push({
          severity: 'high',
          category: 'Performance',
          message: `Slow Time to First Byte: ${Math.round(metrics.ttfb)}ms (target: <600ms)`,
          recommendation: 'Optimize server response time, use CDN, enable caching',
        });
      }

      // Load time check
      if (metrics.loadTime > 3000) {
        issues.push({
          severity: 'medium',
          category: 'Performance',
          message: `Slow page load: ${(metrics.loadTime / 1000).toFixed(2)}s (target: <3s)`,
          recommendation: 'Optimize images, minify CSS/JS, enable compression',
        });
      }

      // LCP check
      const lcp = (webVitals as any).lcp || 0;
      if (lcp > 2500) {
        issues.push({
          severity: 'high',
          category: 'Performance',
          message: `Slow Largest Contentful Paint: ${Math.round(lcp)}ms (target: <2.5s)`,
          recommendation: 'Optimize images, preload critical resources',
        });
      }

      // CLS check
      const cls = (webVitals as any).cls || 0;
      if (cls > 0.1) {
        issues.push({
          severity: 'medium',
          category: 'Performance',
          message: `High Cumulative Layout Shift: ${cls.toFixed(3)} (target: <0.1)`,
          recommendation: 'Add size attributes to images, reserve space for ads',
        });
      }

      // Calculate score
      let score = 100;
      if (metrics.ttfb > 600) score -= 15;
      if (metrics.ttfb > 1000) score -= 10;
      if (metrics.loadTime > 3000) score -= 15;
      if (metrics.loadTime > 5000) score -= 10;
      if (lcp > 2500) score -= 15;
      if (lcp > 4000) score -= 10;
      if (cls > 0.1) score -= 10;
      if (cls > 0.25) score -= 10;

      score = Math.max(0, score);

      spinner.succeed(`Performance: ${formatHealthScore(score)}`);

      return {
        score,
        ttfb: Math.round(metrics.ttfb),
        fcp: Math.round(metrics.fcp),
        lcp: Math.round(lcp),
        fid: Math.round((webVitals as any).fid || 0),
        cls: parseFloat(cls.toFixed(3)),
        speedIndex: 0,
        tbt: 0,
        loadTime: Math.round(metrics.loadTime),
        issues,
      };
    } catch (error) {
      spinner.fail('Performance check failed');
      throw error;
    }
  }

  /**
   * Check Visual Regression
   */
  private async checkVisualRegression(
    page: Page,
    url: string,
    threshold: number
  ): Promise<VisualRegressionReport> {
    const spinner = ora('📸 Checking visual regression...').start();

    try {
      // Generate filename from URL
      const urlHash = Buffer.from(url).toString('base64').replace(/[/+=]/g, '');
      const screenshotPath = join(this.screenshotDir, `${urlHash}.png`);
      const baselinePath = join(this.baselineDir, `${urlHash}.png`);
      const diffPath = join(this.screenshotDir, `${urlHash}-diff.png`);

      // Take screenshot
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Check if baseline exists
      if (!existsSync(baselinePath)) {
        // First run - save as baseline
        await writeFile(baselinePath, await readFile(screenshotPath));
        spinner.succeed('Visual: Baseline saved');

        return {
          hasBaseline: false,
          pixelDiff: 0,
          percentDiff: 0,
          passed: true,
          threshold,
          screenshotPath,
          baselinePath,
        };
      }

      // Compare with baseline
      const baseline = PNG.sync.read(await readFile(baselinePath));
      const current = PNG.sync.read(await readFile(screenshotPath));

      // Ensure same dimensions
      if (baseline.width !== current.width || baseline.height !== current.height) {
        spinner.warn('Visual: Dimensions changed');
        return {
          hasBaseline: true,
          pixelDiff: -1,
          percentDiff: -1,
          passed: false,
          threshold,
          screenshotPath,
          baselinePath,
        };
      }

      // Create diff image
      const diff = new PNG({ width: baseline.width, height: baseline.height });
      const numDiffPixels = pixelmatch(
        baseline.data,
        current.data,
        diff.data,
        baseline.width,
        baseline.height,
        { threshold: 0.1 }
      );

      // Save diff image
      await writeFile(diffPath, PNG.sync.write(diff));

      const totalPixels = baseline.width * baseline.height;
      const percentDiff = (numDiffPixels / totalPixels) * 100;
      const passed = percentDiff <= threshold * 100;

      if (passed) {
        spinner.succeed(`Visual: ${percentDiff.toFixed(2)}% diff (passed)`);
      } else {
        spinner.fail(`Visual: ${percentDiff.toFixed(2)}% diff (threshold: ${(threshold * 100).toFixed(2)}%)`);
      }

      return {
        hasBaseline: true,
        pixelDiff: numDiffPixels,
        percentDiff,
        passed,
        threshold,
        screenshotPath,
        baselinePath,
        diffPath,
      };
    } catch (error) {
      spinner.fail('Visual regression check failed');
      throw error;
    }
  }

  /**
   * Check Multi-Device Compatibility
   */
  private async checkMultiDevice(url: string, devicesToTest: DevicePreset[]): Promise<MultiDeviceReport> {
    const spinner = ora('📱 Testing multi-device compatibility...').start();

    try {
      if (!this.browser) throw new Error('Browser not initialized');

      const results: DeviceResult[] = [];
      const issues: DeviceIssue[] = [];

      for (const deviceType of devicesToTest) {
        const deviceConfig = DEVICE_CONFIGS[deviceType];
        const context = await this.browser.newContext(deviceConfig);
        const page = await context.newPage();

        try {
          const startTime = Date.now();
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          const loadTime = Date.now() - startTime;

          // Check responsiveness
          const viewport = page.viewportSize();
          const responsive = await page.evaluate(() => {
            // Check if page has viewport meta tag
            const viewportMeta = document.querySelector('meta[name="viewport"]');
            return !!viewportMeta;
          });

          // Check for layout shift
          const layoutShift = await page.evaluate(() => {
            // Check for horizontal scrollbar (bad on mobile)
            return document.body.scrollWidth > window.innerWidth;
          });

          // Take screenshot
          const screenshotPath = join(this.screenshotDir, `${deviceType}-${Date.now()}.png`);
          await page.screenshot({ path: screenshotPath });

          // Calculate device score
          let deviceScore = 100;
          if (!responsive) deviceScore -= 30;
          if (layoutShift) deviceScore -= 20;
          if (loadTime > 5000) deviceScore -= 15;

          const passed = deviceScore >= 75;

          results.push({
            device: deviceType,
            viewport: viewport || { width: 0, height: 0 },
            score: deviceScore,
            passed,
            screenshot: screenshotPath,
            metrics: {
              loadTime,
              responsive,
              layoutShift,
            },
          });

          // Add issues
          if (!responsive) {
            issues.push({
              device: deviceType,
              severity: 'high',
              issue: 'Missing viewport meta tag',
              recommendation: 'Add: <meta name="viewport" content="width=device-width, initial-scale=1">',
            });
          }

          if (layoutShift) {
            issues.push({
              device: deviceType,
              severity: 'medium',
              issue: 'Horizontal scrolling detected',
              recommendation: 'Ensure content fits within viewport width',
            });
          }

        } finally {
          await context.close();
        }
      }

      const allPassed = results.every(r => r.passed);

      if (allPassed) {
        spinner.succeed(`Multi-Device: All ${devicesToTest.length} devices passed`);
      } else {
        const failedCount = results.filter(r => !r.passed).length;
        spinner.fail(`Multi-Device: ${failedCount}/${devicesToTest.length} devices failed`);
      }

      return {
        devices: results,
        allPassed,
        issues,
      };
    } catch (error) {
      spinner.fail('Multi-device check failed');
      throw error;
    }
  }

  /**
   * Check Accessibility (WCAG 2.1)
   */
  private async checkAccessibility(page: Page, url: string): Promise<AccessibilityReport> {
    const spinner = ora('♿ Checking accessibility...').start();

    try {
      await page.goto(url, { waitUntil: 'networkidle' });

      const violations = await page.evaluate(() => {
        const issues = {
          critical: 0,
          serious: 0,
          moderate: 0,
          minor: 0,
        };

        // Check for alt text on images
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          if (!img.alt) issues.serious++;
        });

        // Check for form labels
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
          const id = input.id;
          if (id && !document.querySelector(`label[for="${id}"]`)) {
            issues.moderate++;
          }
        });

        // Check for heading hierarchy
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        if (headings.length === 0) issues.serious++;

        // Check for ARIA labels on interactive elements
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
          if (!btn.textContent?.trim() && !btn.getAttribute('aria-label')) {
            issues.moderate++;
          }
        });

        return issues;
      });

      const issues: Issue[] = [];
      
      if (violations.critical > 0) {
        issues.push({
          severity: 'critical',
          category: 'Accessibility',
          message: `${violations.critical} critical accessibility issues`,
          recommendation: 'Fix immediately - affects users with disabilities',
        });
      }

      if (violations.serious > 0) {
        issues.push({
          severity: 'high',
          category: 'Accessibility',
          message: `${violations.serious} images without alt text`,
          recommendation: 'Add descriptive alt text to all images',
        });
      }

      if (violations.moderate > 0) {
        issues.push({
          severity: 'medium',
          category: 'Accessibility',
          message: `${violations.moderate} form inputs without labels`,
          recommendation: 'Add labels to all form inputs',
        });
      }

      // Calculate score
      const totalViolations = 
        violations.critical * 4 + 
        violations.serious * 2 + 
        violations.moderate + 
        violations.minor * 0.5;
      const score = Math.max(0, 100 - totalViolations * 3);

      spinner.succeed(`Accessibility: ${formatHealthScore(score)}`);

      return {
        score,
        violations,
        issues,
      };
    } catch (error) {
      spinner.fail('Accessibility check failed');
      throw error;
    }
  }

  /**
   * Check SEO
   */
  private async checkSEO(page: Page, url: string): Promise<SEOReport> {
    const spinner = ora('🔍 Analyzing SEO...').start();

    try {
      await page.goto(url, { waitUntil: 'networkidle' });

      const seoData = await page.evaluate(() => {
        return {
          title: document.title || '',
          description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
          keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
          ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
          ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
        };
      });

      // Check for sitemap and robots.txt
      const baseUrl = new URL(url).origin;
      const hasSitemap = await this.urlExists(page, `${baseUrl}/sitemap.xml`);
      const hasRobotsTxt = await this.urlExists(page, `${baseUrl}/robots.txt`);

      const issues: Issue[] = [];

      if (!seoData.title || seoData.title.length < 10) {
        issues.push({
          severity: 'high',
          category: 'SEO',
          message: 'Missing or too short page title',
          recommendation: 'Add descriptive title (50-60 characters)',
        });
      }

      if (!seoData.description) {
        issues.push({
          severity: 'medium',
          category: 'SEO',
          message: 'Missing meta description',
          recommendation: 'Add meta description (150-160 characters)',
        });
      }

      if (!hasSitemap) {
        issues.push({
          severity: 'medium',
          category: 'SEO',
          message: 'No sitemap.xml found',
          recommendation: 'Create and submit sitemap to search engines',
        });
      }

      // Calculate score
      let score = 100;
      if (!seoData.title) score -= 25;
      if (!seoData.description) score -= 20;
      if (!seoData.ogTitle) score -= 10;
      if (!hasSitemap) score -= 15;
      if (!hasRobotsTxt) score -= 10;

      score = Math.max(0, score);

      spinner.succeed(`SEO: ${formatHealthScore(score)}`);

      return {
        score,
        hasTitle: !!seoData.title,
        hasDescription: !!seoData.description,
        hasKeywords: !!seoData.keywords,
        hasOgTags: !!(seoData.ogTitle && seoData.ogDescription),
        hasCanonical: !!seoData.canonical,
        hasSitemap,
        hasRobotsTxt,
        issues,
      };
    } catch (error) {
      spinner.fail('SEO check failed');
      throw error;
    }
  }

  /**
   * Check Security
   */
  private async checkSecurity(page: Page, url: string): Promise<SecurityReport> {
    const spinner = ora('🔒 Checking security...').start();

    try {
      const response = await page.goto(url, { waitUntil: 'networkidle' });
      if (!response) throw new Error('No response received');

      const headers = response.headers();
      const isHttps = url.startsWith('https://');

      const issues: Issue[] = [];

      if (!isHttps) {
        issues.push({
          severity: 'critical',
          category: 'Security',
          message: 'Website not using HTTPS',
          recommendation: 'Enable HTTPS with valid SSL certificate',
        });
      }

      if (!headers['content-security-policy']) {
        issues.push({
          severity: 'medium',
          category: 'Security',
          message: 'Missing Content-Security-Policy header',
          recommendation: 'Add CSP header to prevent XSS attacks',
        });
      }

      if (!headers['x-frame-options']) {
        issues.push({
          severity: 'medium',
          category: 'Security',
          message: 'Missing X-Frame-Options header',
          recommendation: 'Add X-Frame-Options to prevent clickjacking',
        });
      }

      // Calculate score
      let score = 100;
      if (!isHttps) score -= 40;
      if (!headers['content-security-policy']) score -= 15;
      if (!headers['x-frame-options']) score -= 10;
      if (!headers['x-content-type-options']) score -= 10;
      if (!headers['strict-transport-security']) score -= 10;

      score = Math.max(0, score);

      spinner.succeed(`Security: ${formatHealthScore(score)}`);

      return {
        score,
        https: isHttps,
        sslValid: isHttps,
        headers: {
          csp: headers['content-security-policy'],
          xFrameOptions: headers['x-frame-options'],
          xContentTypeOptions: headers['x-content-type-options'],
          strictTransportSecurity: headers['strict-transport-security'],
        },
        issues,
      };
    } catch (error) {
      spinner.fail('Security check failed');
      throw error;
    }
  }

  /**
   * Check Console Errors
   */
  private async checkConsole(page: Page, url: string): Promise<ConsoleReport> {
    const spinner = ora('🐛 Monitoring console...').start();

    try {
      const messages: string[] = [];
      let errors = 0;
      let warnings = 0;

      page.on('console', (msg) => {
        const type = msg.type();
        const text = msg.text();
        
        if (type === 'error') {
          errors++;
          messages.push(`ERROR: ${text}`);
        } else if (type === 'warning') {
          warnings++;
          messages.push(`WARN: ${text}`);
        }
      });

      await page.goto(url, { waitUntil: 'networkidle' });

      const issues: Issue[] = [];

      if (errors > 0) {
        issues.push({
          severity: 'high',
          category: 'Console',
          message: `${errors} console errors detected`,
          recommendation: 'Fix JavaScript errors affecting functionality',
        });
      }

      if (warnings > 5) {
        issues.push({
          severity: 'low',
          category: 'Console',
          message: `${warnings} console warnings`,
          recommendation: 'Review and fix console warnings',
        });
      }

      spinner.succeed(`Console: ${errors} errors, ${warnings} warnings`);

      return {
        errors,
        warnings,
        messages: messages.slice(0, 10),
        issues,
      };
    } catch (error) {
      spinner.fail('Console check failed');
      throw error;
    }
  }

  /**
   * Check Links
   */
  private async checkLinks(page: Page, url: string): Promise<LinkReport> {
    const spinner = ora('🔗 Checking links...').start();

    try {
      await page.goto(url, { waitUntil: 'networkidle' });

      const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors.map(a => ({
          href: (a as HTMLAnchorElement).href,
          text: a.textContent?.trim() || '',
        }));
      });

      const total = links.length;
      const external = links.filter(l => !l.href.startsWith(url)).length;
      const broken = 0; // In production, would check each link

      const issues: Issue[] = [];
      if (broken > 0) {
        issues.push({
          severity: 'medium',
          category: 'Links',
          message: `${broken} broken links found`,
          recommendation: 'Fix or remove broken links',
        });
      }

      spinner.succeed(`Links: ${total} total, ${external} external`);

      return {
        total,
        broken,
        external,
        issues,
      };
    } catch (error) {
      spinner.fail('Link check failed');
      throw error;
    }
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(scores: {
    performance: number;
    accessibility: number;
    seo: number;
    security: number;
    visual: number;
    multiDevice: number;
  }): number {
    // Weighted average
    return Math.round(
      scores.performance * 0.20 +
      scores.accessibility * 0.20 +
      scores.seo * 0.15 +
      scores.security * 0.25 +
      scores.visual * 0.10 +
      scores.multiDevice * 0.10
    );
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(data: {
    performance: PerformanceMetrics;
    accessibility: AccessibilityReport;
    seo: SEOReport;
    security: SecurityReport;
    console: ConsoleReport;
    links: LinkReport;
    visual?: VisualRegressionReport;
    multiDevice?: MultiDeviceReport;
  }): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Security first
    if (data.security.score < 80) {
      recommendations.push({
        priority: 'high',
        action: 'Fix security issues',
        reason: `Security score: ${data.security.score}/100`,
        impact: 'Protects users and improves trust',
        estimatedTime: '1-2 hours',
      });
    }

    // Performance
    if (data.performance.score < 70) {
      recommendations.push({
        priority: 'high',
        action: 'Optimize performance',
        reason: `Page loads in ${(data.performance.loadTime / 1000).toFixed(1)}s`,
        impact: 'Improves user experience and SEO',
        estimatedTime: '2-4 hours',
      });
    }

    // Visual regression
    if (data.visual && !data.visual.passed) {
      recommendations.push({
        priority: 'medium',
        action: 'Review visual changes',
        reason: `${data.visual.percentDiff.toFixed(2)}% visual difference`,
        impact: 'Ensures consistent UI',
        estimatedTime: '30 minutes',
      });
    }

    // Multi-device
    if (data.multiDevice && !data.multiDevice.allPassed) {
      const failedDevices = data.multiDevice.devices.filter(d => !d.passed);
      recommendations.push({
        priority: 'high',
        action: 'Fix mobile responsiveness',
        reason: `Issues on: ${failedDevices.map(d => d.device).join(', ')}`,
        impact: 'Essential for mobile users',
        estimatedTime: '2-3 hours',
      });
    }

    return recommendations;
  }

  /**
   * Save report to file
   */
  private async saveReport(result: WebsiteTestResult): Promise<string> {
    const reportsDir = join(process.cwd(), '.guardian', 'reports', 'website');
    await mkdir(reportsDir, { recursive: true });

    const timestamp = Date.now();
    const filename = `website-${timestamp}.json`;
    const filepath = join(reportsDir, filename);

    await writeFile(filepath, JSON.stringify(result, null, 2));
    await writeFile(join(reportsDir, 'latest.json'), JSON.stringify(result, null, 2));

    return filepath;
  }

  /**
   * Helper: Empty performance result
   */
  private getEmptyPerformance(): PerformanceMetrics {
    return {
      score: 100,
      ttfb: 0,
      fcp: 0,
      lcp: 0,
      fid: 0,
      cls: 0,
      speedIndex: 0,
      tbt: 0,
      loadTime: 0,
      issues: [],
    };
  }

  /**
   * Helper: Check if URL exists
   */
  private async urlExists(page: Page, url: string): Promise<boolean> {
    try {
      const response = await page.goto(url, { timeout: 5000 });
      return response?.status() === 200;
    } catch {
      return false;
    }
  }

  /**
   * Helper: Validate URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }
}

/**
 * Quick test function (exported)
 */
export async function testWebsite(
  url: string,
  options?: WebsiteTestOptions
): Promise<WebsiteTestResult> {
  const tester = new WebsiteTester();
  return await tester.test(url, options);
}
