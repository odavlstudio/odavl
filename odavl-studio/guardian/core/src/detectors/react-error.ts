import { Page } from 'playwright';
import { Issue } from './white-screen';

export class ReactErrorDetector {
  /**
   * Detect React-specific errors
   */
  async detect(page: Page): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Check for React error overlay (development mode)
    const hasErrorOverlay = await page.evaluate(() => {
      // Check for Next.js error overlay
      const nextjsOverlay = document.querySelector('[data-nextjs-dialog-overlay]');
      if (nextjsOverlay) return true;

      // Check for Create React App error overlay
      const craOverlay = document.querySelector('#webpack-dev-server-client-overlay');
      if (craOverlay) return true;

      // Check for generic React error boundary text
      const bodyText = document.body.innerText.toLowerCase();
      return bodyText.includes('error boundary') || 
             bodyText.includes('something went wrong') ||
             bodyText.includes('unhandled runtime error');
    });

    if (hasErrorOverlay) {
      // Extract error details from overlay
      const errorDetails = await page.evaluate(() => {
        // Try Next.js error format
        const nextjsError = document.querySelector('[data-nextjs-dialog-content]');
        if (nextjsError) {
          const title = nextjsError.querySelector('h1, h2, h3')?.textContent || '';
          const message = nextjsError.querySelector('p, pre')?.textContent || '';
          return { title, message };
        }

        // Try generic error overlay
        const errorTitle = document.querySelector('[class*="error"] h1, [class*="error"] h2');
        const errorMessage = document.querySelector('[class*="error"] pre, [class*="error"] p');
        
        return {
          title: errorTitle?.textContent || 'React Error',
          message: errorMessage?.textContent || 'Unknown error'
        };
      });

      issues.push({
        type: 'REACT_ERROR',
        severity: 'critical',
        message: `🔴 React error: ${errorDetails.title}`,
        fix: [
          'Check the error message in the browser',
          'Fix the component causing the error',
          'Add error boundary to catch errors',
          'Check for undefined props or state',
          'Verify data fetching logic',
          'Check console for full stack trace'
        ],
        details: {
          ...errorDetails,
          url: page.url()
        }
      });
    }

    // Check for hydration errors (SSR/SSG mismatch)
    const hasHydrationError = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      return bodyText.includes('hydration') || 
             bodyText.includes('did not match') ||
             bodyText.includes('server-rendered html');
    });

    if (hasHydrationError) {
      issues.push({
        type: 'HYDRATION_ERROR',
        severity: 'high',
        message: '💧 React hydration mismatch detected',
        fix: [
          'Ensure server and client render same HTML',
          'Avoid using browser APIs during SSR',
          'Use useEffect for client-only code',
          'Check for random values or dates in render',
          'Verify data consistency between server/client',
          'Use suppressHydrationWarning for dynamic content'
        ],
        details: {
          url: page.url(),
          note: 'Check console for specific mismatch details'
        }
      });
    }

    return issues;
  }

  /**
   * Check if page has React loaded
   */
  async hasReact(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
      return typeof (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' ||
             typeof (window as any).React !== 'undefined';
    });
  }
}
