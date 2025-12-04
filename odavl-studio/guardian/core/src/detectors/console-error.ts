import { Page } from 'playwright';
import { Issue } from './white-screen';

export class ConsoleErrorDetector {
  private consoleErrors: string[] = [];
  private pageErrors: string[] = [];

  /**
   * Start listening for console errors
   */
  startListening(page: Page): void {
    // Listen for console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        
        // Filter out known false positives
        if (this.shouldIgnore(text)) {
          return;
        }
        
        this.consoleErrors.push(text);
      }
    });

    // Listen for page errors (uncaught exceptions)
    page.on('pageerror', (error) => {
      this.pageErrors.push(error.message);
    });
  }

  /**
   * Detect console errors
   */
  async detect(page: Page): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Console errors
    if (this.consoleErrors.length > 0) {
      issues.push({
        type: 'CONSOLE_ERROR',
        severity: 'high',
        message: `⚠️ ${this.consoleErrors.length} console error(s) detected`,
        fix: [
          'Check browser DevTools console',
          'Fix JavaScript errors in your code',
          'Ensure all dependencies are loaded correctly',
          'Check for missing resources (404s)'
        ],
        details: {
          errors: this.consoleErrors,
          count: this.consoleErrors.length,
          url: page.url()
        }
      });
    }

    // Page errors (uncaught exceptions)
    if (this.pageErrors.length > 0) {
      issues.push({
        type: 'UNCAUGHT_EXCEPTION',
        severity: 'critical',
        message: `🚨 ${this.pageErrors.length} uncaught exception(s) detected`,
        fix: [
          'Add try-catch blocks around error-prone code',
          'Check error boundaries in React',
          'Add global error handler',
          'Fix the underlying JavaScript error'
        ],
        details: {
          errors: this.pageErrors,
          count: this.pageErrors.length,
          url: page.url()
        }
      });
    }

    return issues;
  }

  /**
   * Check if error should be ignored (known false positives)
   */
  private shouldIgnore(errorText: string): boolean {
    const ignorePatterns = [
      'React DevTools',
      'Download the React DevTools',
      'Extension',
      'chrome-extension://',
      'webpack-internal://',
      'Source map',
      // Add more patterns as needed
    ];

    return ignorePatterns.some(pattern => 
      errorText.includes(pattern)
    );
  }

  /**
   * Get all collected errors
   */
  getErrors(): { console: string[]; page: string[] } {
    return {
      console: this.consoleErrors,
      page: this.pageErrors
    };
  }

  /**
   * Clear collected errors
   */
  clear(): void {
    this.consoleErrors = [];
    this.pageErrors = [];
  }

  /**
   * Quick check for errors
   */
  hasErrors(): boolean {
    return this.consoleErrors.length > 0 || this.pageErrors.length > 0;
  }
}
