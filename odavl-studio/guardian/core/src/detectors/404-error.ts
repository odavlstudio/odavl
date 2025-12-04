import { Page } from 'playwright';
import { Issue } from './white-screen';

export class NotFoundDetector {
  /**
   * Detect 404 Not Found errors
   */
  async detect(page: Page): Promise<Issue | null> {
    try {
      const url = page.url();
      
      // Get page title
      const title = await page.title();
      
      // Get status code (check via fetch or response)
      const status = await page.evaluate(async () => {
        try {
          const response = await fetch(window.location.href);
          return response.status;
        } catch {
          return null;
        }
      });

      // Check for 404 indicators
      const is404 = 
        status === 404 ||
        title.toLowerCase().includes('404') ||
        title.toLowerCase().includes('not found') ||
        title.toLowerCase().includes('page not found');

      if (is404) {
        // Take screenshot
        const screenshot = await page.screenshot({
          fullPage: true,
          type: 'png'
        });

        return {
          type: '404_ERROR',
          severity: 'critical',
          message: `❌ Route not found: ${url}`,
          screenshot,
          fix: [
            '1. Verify the route exists in your routing configuration',
            '2. Check middleware redirects and rewrites',
            '3. Ensure dynamic routes are properly configured',
            '4. Check for typos in the URL or route definition',
            '5. Verify file-based routing structure (if applicable)',
            '6. Check if the page component exists'
          ],
          details: {
            url,
            title,
            status
          }
        };
      }

      // Check for custom 404 pages
      const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
      
      if (
        bodyText.includes('page not found') ||
        bodyText.includes('404') ||
        bodyText.includes('the page you are looking for')
      ) {
        return {
          type: 'CUSTOM_404',
          severity: 'high',
          message: `⚠️ Custom 404 page detected: ${url}`,
          fix: [
            'Verify the route should exist',
            'Check route configuration',
            'Ensure the URL is correct'
          ],
          details: {
            url,
            title,
            bodyTextPreview: bodyText.substring(0, 200)
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error in NotFoundDetector:', error);
      return null;
    }
  }

  /**
   * Test a specific URL for 404
   */
  async testUrl(page: Page, testUrl: string): Promise<Issue | null> {
    try {
      const response = await page.goto(testUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      if (response?.status() === 404) {
        return {
          type: '404_ERROR',
          severity: 'critical',
          message: `❌ Route not found: ${testUrl}`,
          fix: ['Create the route', 'Fix the link', 'Add redirect'],
          details: {
            url: testUrl,
            status: 404
          }
        };
      }

      return null;
    } catch (error) {
      return {
        type: 'NAVIGATION_ERROR',
        severity: 'high',
        message: `⚠️ Could not navigate to: ${testUrl}`,
        fix: ['Check if server is running', 'Verify URL is correct'],
        details: {
          url: testUrl,
          error: (error as Error).message
        }
      };
    }
  }
}
