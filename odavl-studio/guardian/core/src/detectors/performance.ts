import { Page } from 'playwright';
import { Issue } from './white-screen';

export class PerformanceDetector {
  /**
   * Detect performance issues
   */
  async detect(page: Page): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Measure Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals: any = {};

            for (const entry of entries) {
              if (entry.entryType === 'paint') {
                vitals[entry.name] = entry.startTime;
              } else if (entry.entryType === 'largest-contentful-paint') {
                vitals.lcp = entry.startTime;
              } else if (entry.entryType === 'layout-shift') {
                vitals.cls = (vitals.cls || 0) + (entry as any).value;
              }
            }

            resolve(vitals);
          });

          observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });

          // Timeout after 3 seconds
          setTimeout(() => resolve({}), 3000);
        } else {
          resolve({});
        }
      });
    });

    // Check First Contentful Paint (FCP)
    if (metrics['first-contentful-paint'] && metrics['first-contentful-paint'] > 3000) {
      issues.push({
        type: 'SLOW_FCP',
        severity: 'medium',
        message: `⏱️ Slow First Contentful Paint: ${(metrics['first-contentful-paint'] / 1000).toFixed(2)}s`,
        fix: [
          'Optimize critical rendering path',
          'Reduce server response time',
          'Minimize render-blocking resources',
          'Use font-display: swap for web fonts',
          'Preload critical assets'
        ],
        details: { fcp: metrics['first-contentful-paint'], threshold: 3000 }
      });
    }

    // Check Largest Contentful Paint (LCP)
    if (metrics.lcp && metrics.lcp > 2500) {
      issues.push({
        type: 'SLOW_LCP',
        severity: 'high',
        message: `⏱️ Slow Largest Contentful Paint: ${(metrics.lcp / 1000).toFixed(2)}s`,
        fix: [
          'Optimize images (use WebP, lazy loading)',
          'Reduce server response time (TTFB)',
          'Remove render-blocking JavaScript/CSS',
          'Use CDN for static assets',
          'Implement proper caching'
        ],
        details: { lcp: metrics.lcp, threshold: 2500 }
      });
    }

    // Check Cumulative Layout Shift (CLS)
    if (metrics.cls && metrics.cls > 0.1) {
      issues.push({
        type: 'HIGH_CLS',
        severity: 'medium',
        message: `📐 High Cumulative Layout Shift: ${metrics.cls.toFixed(3)}`,
        fix: [
          'Set explicit dimensions for images and videos',
          'Reserve space for ads and embeds',
          'Avoid inserting content above existing content',
          'Use CSS aspect-ratio for dynamic content',
          'Preload fonts with font-display: optional'
        ],
        details: { cls: metrics.cls, threshold: 0.1 }
      });
    }

    // Check page weight
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      let totalSize = 0;
      let imageSize = 0;
      let scriptSize = 0;
      let styleSize = 0;

      for (const entry of entries as PerformanceResourceTiming[]) {
        const size = entry.transferSize || 0;
        totalSize += size;

        if (entry.initiatorType === 'img') {
          imageSize += size;
        } else if (entry.initiatorType === 'script') {
          scriptSize += size;
        } else if (entry.initiatorType === 'css' || entry.initiatorType === 'link') {
          styleSize += size;
        }
      }

      return { totalSize, imageSize, scriptSize, styleSize };
    });

    // Check if page is too heavy (> 3MB)
    if (resources.totalSize > 3 * 1024 * 1024) {
      issues.push({
        type: 'HEAVY_PAGE',
        severity: 'medium',
        message: `📦 Heavy page weight: ${(resources.totalSize / 1024 / 1024).toFixed(2)} MB`,
        fix: [
          'Compress images (use WebP, AVIF)',
          'Minify JavaScript and CSS',
          'Remove unused code (tree shaking)',
          'Implement code splitting',
          'Use lazy loading for images',
          'Enable Gzip/Brotli compression'
        ],
        details: {
          total: resources.totalSize,
          images: resources.imageSize,
          scripts: resources.scriptSize,
          styles: resources.styleSize
        }
      });
    }

    // Check number of requests
    const requestCount = await page.evaluate(() => {
      return performance.getEntriesByType('resource').length;
    });

    if (requestCount > 100) {
      issues.push({
        type: 'TOO_MANY_REQUESTS',
        severity: 'low',
        message: `🌐 Too many HTTP requests: ${requestCount}`,
        fix: [
          'Combine multiple files (CSS sprites, concatenation)',
          'Use HTTP/2 or HTTP/3',
          'Implement resource bundling',
          'Use inline critical CSS',
          'Reduce third-party scripts'
        ],
        details: { requests: requestCount, threshold: 100 }
      });
    }

    return issues;
  }

  /**
   * Get basic performance metrics
   */
  async getMetrics(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        ttfb: navigation.responseStart - navigation.requestStart
      };
    });
  }
}
