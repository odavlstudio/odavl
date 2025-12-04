import { Page } from 'playwright';

export interface Issue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  screenshot?: Buffer;
  fix: string[];
  details?: any;
}

export class WhiteScreenDetector {
  /**
   * Detect white screen issues
   */
  async detect(page: Page): Promise<Issue | null> {
    try {
      // Get body text content
      const bodyText = await page.evaluate(() => {
        return document.body.innerText.trim();
      });

      // Get body HTML (to check if there's any structure)
      const bodyHtml = await page.evaluate(() => {
        return document.body.innerHTML;
      });

      // Get visible elements count
      const visibleElementsCount = await page.evaluate(() => {
        const elements = document.querySelectorAll('body *');
        let visibleCount = 0;

        elements.forEach((el) => {
          const style = window.getComputedStyle(el as HTMLElement);
          if (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0'
          ) {
            visibleCount++;
          }
        });

        return visibleCount;
      });

      // White screen detection logic
      const hasNoText = bodyText.length === 0;
      const hasMinimalHtml = bodyHtml.length < 100;
      const hasFewElements = visibleElementsCount < 5;

      if (hasNoText && (hasMinimalHtml || hasFewElements)) {
        // Take screenshot as proof
        const screenshot = await page.screenshot({
          fullPage: true,
          type: 'png'
        });

        return {
          type: 'WHITE_SCREEN',
          severity: 'critical',
          message: '🚨 White screen detected - page has no visible content',
          screenshot,
          fix: [
            '1. Check browser console for JavaScript errors',
            '2. Verify routing configuration (middleware, rewrites)',
            '3. Check for layout conflicts in your app structure',
            '4. Ensure middleware is not blocking requests',
            '5. Verify environment variables are set correctly',
            '6. Check if CSS is loading properly (display: none issues)'
          ],
          details: {
            bodyTextLength: bodyText.length,
            bodyHtmlLength: bodyHtml.length,
            visibleElementsCount,
            url: page.url()
          }
        };
      }

      // Check for minimal content (potential issue)
      if (bodyText.length < 50 && visibleElementsCount < 10) {
        return {
          type: 'MINIMAL_CONTENT',
          severity: 'high',
          message: '⚠️ Page has very little content - possible loading issue',
          fix: [
            'Check if JavaScript is loading correctly',
            'Verify API calls are completing',
            'Check for loader/spinner that never disappears',
            'Ensure data fetching is working properly'
          ],
          details: {
            bodyTextLength: bodyText.length,
            visibleElementsCount,
            url: page.url()
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error in WhiteScreenDetector:', error);
      return null;
    }
  }

  /**
   * Quick check without screenshot
   */
  async quickCheck(page: Page): Promise<boolean> {
    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    return bodyText.length === 0;
  }
}
