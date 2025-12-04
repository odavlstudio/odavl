import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';

export interface BrowserOptions {
  headless?: boolean;
  browserType?: 'chromium' | 'firefox' | 'webkit';
  viewport?: { width: number; height: number };
  timeout?: number;
}

export interface TestResult {
  url: string;
  status?: number;
  hasContent: boolean;
  consoleErrors: string[];
  screenshot?: Buffer;
  timestamp: Date;
  duration: number;
}

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private startTime: number = 0;

  /**
   * Launch browser
   */
  async launch(options: BrowserOptions = {}): Promise<Browser> {
    const {
      headless = true,
      browserType = 'chromium',
      viewport = { width: 1920, height: 1080 },
      timeout = 30000
    } = options;

    // Select browser
    const browserEngine = browserType === 'firefox'
      ? firefox
      : browserType === 'webkit'
      ? webkit
      : chromium;

    // Launch browser
    this.browser = await browserEngine.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Create context with viewport
    this.context = await this.browser.newContext({
      viewport,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // Set default timeout
    this.context.setDefaultTimeout(timeout);

    return this.browser;
  }

  /**
   * Navigate to URL and collect metrics
   */
  async navigate(url: string): Promise<TestResult> {
    if (!this.context) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    this.startTime = Date.now();
    const page = await this.context.newPage();

    // Track console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Track page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    try {
      // Navigate
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Check for content
      const hasContent = await page.evaluate(() => {
        const text = document.body.innerText.trim();
        return text.length > 0;
      });

      // Take screenshot
      const screenshot = await page.screenshot({
        fullPage: true,
        type: 'png'
      });

      const duration = Date.now() - this.startTime;

      await page.close();

      return {
        url,
        status: response?.status(),
        hasContent,
        consoleErrors,
        screenshot,
        timestamp: new Date(),
        duration
      };
    } catch (error) {
      const duration = Date.now() - this.startTime;

      await page.close();

      throw {
        url,
        error: (error as Error).message,
        consoleErrors,
        timestamp: new Date(),
        duration
      };
    }
  }

  /**
   * Create a new page for manual testing
   */
  async newPage(): Promise<Page> {
    if (!this.context) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return await this.context.newPage();
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Get browser instance
   */
  getBrowser(): Browser | null {
    return this.browser;
  }

  /**
   * Check if browser is launched
   */
  isLaunched(): boolean {
    return this.browser !== null && this.browser.isConnected();
  }
}
