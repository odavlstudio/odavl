import { Page } from 'playwright';
import { Issue } from './white-screen';

export class MobileDetector {
  /**
   * Detect mobile responsiveness issues
   */
  async detect(page: Page): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Check for viewport meta tag
    const hasViewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return !!meta;
    });

    if (!hasViewport) {
      issues.push({
        type: 'MISSING_VIEWPORT',
        severity: 'critical',
        message: '📱 Missing viewport meta tag',
        fix: [
          'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
          'Essential for mobile responsiveness',
          'Place in <head> section',
          'Avoid user-scalable=no (accessibility)',
          'Test on actual mobile devices'
        ],
        details: {}
      });
    }

    // Check for horizontal scrolling
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    if (hasHorizontalScroll) {
      issues.push({
        type: 'HORIZONTAL_SCROLL',
        severity: 'high',
        message: '↔️ Horizontal scrolling detected',
        fix: [
          'Check for fixed-width elements',
          'Use max-width instead of width',
          'Ensure images scale: max-width: 100%',
          'Test with Chrome DevTools mobile view',
          'Use CSS Grid/Flexbox for layouts'
        ],
        details: {
          scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
          viewportWidth: await page.evaluate(() => window.innerWidth)
        }
      });
    }

    // Check tap target sizes (minimum 48x48px)
    const smallTapTargets = await page.evaluate(() => {
      const interactive = Array.from(document.querySelectorAll(
        'a, button, input[type="button"], input[type="submit"], [role="button"]'
      ));

      const smallElements: Array<{text: string; tag: string; width: number; height: number}> = [];
      for (const el of interactive) {
        const htmlEl = el as HTMLElement;
        // Use offsetWidth/Height which includes padding and border
        const actualWidth = htmlEl.offsetWidth;
        const actualHeight = htmlEl.offsetHeight;
        
        if (actualWidth < 48 || actualHeight < 48) {
          smallElements.push({
            text: (el.textContent || '').trim().substring(0, 50),
            tag: el.tagName.toLowerCase(),
            width: Math.round(actualWidth),
            height: Math.round(actualHeight)
          });
        }
      }

      return { count: smallElements.length, elements: smallElements };
    });

    if (smallTapTargets.count > 0) {
      issues.push({
        type: 'SMALL_TAP_TARGETS',
        severity: 'medium',
        message: `👆 ${smallTapTargets.count} tap target(s) too small (< 48x48px)`,
        fix: [
          'Increase button/link size to minimum 48x48px',
          'Add padding to clickable elements',
          'Increase spacing between tap targets',
          'Follow Material Design guidelines',
          'Test on actual touch devices'
        ],
        details: {
          count: smallTapTargets.count,
          elements: smallTapTargets.elements
        }
      });
    }

    // Check for text that's too small
    const smallText = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      let count = 0;

      for (const el of elements) {
        const text = el.textContent?.trim();
        if (!text || text.length === 0) continue;

        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);

        if (fontSize < 12) {
          count++;
          if (count > 10) break; // Limit check
        }
      }

      return count;
    });

    if (smallText > 5) {
      issues.push({
        type: 'SMALL_TEXT',
        severity: 'medium',
        message: `📝 ${smallText} element(s) with text < 12px`,
        fix: [
          'Increase font size to minimum 14-16px for body text',
          'Use rem units for scalability',
          'Avoid px units for font sizes',
          'Ensure good readability on mobile',
          'Test with different zoom levels'
        ],
        details: { count: smallText }
      });
    }

    // Check for fixed positioning that might block content
    const fixedElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      let count = 0;

      for (const el of elements) {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed') {
          const rect = el.getBoundingClientRect();
          // Check if takes up significant viewport space
          if (rect.height > window.innerHeight * 0.3) {
            count++;
          }
        }
      }

      return count;
    });

    if (fixedElements > 0) {
      issues.push({
        type: 'LARGE_FIXED_ELEMENTS',
        severity: 'low',
        message: `📌 Fixed element(s) taking up > 30% of viewport`,
        fix: [
          'Reduce size of fixed headers/footers on mobile',
          'Use CSS media queries for mobile adjustments',
          'Consider sticky positioning instead',
          'Ensure content is not obscured',
          'Test scroll behavior on mobile'
        ],
        details: { count: fixedElements }
      });
    }

    // Check for content wider than viewport
    const wideElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('img, video, table, pre, code'));
      let count = 0;

      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.width > window.innerWidth) {
          count++;
        }
      }

      return count;
    });

    if (wideElements > 0) {
      issues.push({
        type: 'WIDE_CONTENT',
        severity: 'high',
        message: `📐 ${wideElements} element(s) wider than viewport`,
        fix: [
          'Add max-width: 100% to images/videos',
          'Make tables responsive (horizontal scroll)',
          'Use overflow-x: auto for wide content',
          'Implement responsive images (srcset)',
          'Test with various screen sizes'
        ],
        details: { count: wideElements }
      });
    }

    return issues;
  }

  /**
   * Mobile-friendliness score (0-100)
   */
  async getScore(page: Page): Promise<number> {
    const issues = await this.detect(page);
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;

    let score = 100;
    score -= criticalCount * 30;
    score -= highCount * 15;
    score -= mediumCount * 8;
    score -= lowCount * 3;

    return Math.max(0, score);
  }

  /**
   * Test on different viewport sizes
   */
  async testViewports(page: Page): Promise<{ viewport: string; issues: Issue[] }[]> {
    const viewports = [
      { name: 'Mobile (320px)', width: 320, height: 568 },
      { name: 'Mobile (375px)', width: 375, height: 667 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Desktop (1920px)', width: 1920, height: 1080 }
    ];

    const results: { viewport: string; issues: Issue[] }[] = [];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const issues = await this.detect(page);
      results.push({ viewport: vp.name, issues });
    }

    return results;
  }
}
