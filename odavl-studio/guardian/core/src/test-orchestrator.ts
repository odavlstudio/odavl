import { Page } from 'playwright';
import { BrowserManager } from './browser-manager';
import { WhiteScreenDetector } from './detectors/white-screen';
import { NotFoundDetector } from './detectors/404-error';
import { ConsoleErrorDetector } from './detectors/console-error';
import { ReactErrorDetector } from './detectors/react-error';
import { PerformanceDetector } from './detectors/performance';
import { AccessibilityDetector } from './detectors/accessibility';
import { SecurityDetector } from './detectors/security';
import { SEODetector } from './detectors/seo';
import { MobileDetector } from './detectors/mobile';
import { Issue } from './detectors/white-screen';

export interface TestConfig {
  url: string;
  browserType?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  timeout?: number;
  viewport?: { width: number; height: number };
}

export interface TestReport {
  url: string;
  timestamp: string;
  duration: number;
  browserType: string;
  status: 'passed' | 'failed';
  issues: Issue[];
  screenshots?: {
    fullPage?: string;
    errors?: string[];
  };
  metrics: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export class TestOrchestrator {
  private browserManager: BrowserManager;
  private whiteScreenDetector: WhiteScreenDetector;
  private notFoundDetector: NotFoundDetector;
  private consoleErrorDetector: ConsoleErrorDetector;
  private reactErrorDetector: ReactErrorDetector;
  private performanceDetector: PerformanceDetector;
  private accessibilityDetector: AccessibilityDetector;
  private securityDetector: SecurityDetector;
  private seoDetector: SEODetector;
  private mobileDetector: MobileDetector;

  constructor() {
    this.browserManager = new BrowserManager();
    this.whiteScreenDetector = new WhiteScreenDetector();
    this.notFoundDetector = new NotFoundDetector();
    this.consoleErrorDetector = new ConsoleErrorDetector();
    this.reactErrorDetector = new ReactErrorDetector();
    this.performanceDetector = new PerformanceDetector();
    this.accessibilityDetector = new AccessibilityDetector();
    this.securityDetector = new SecurityDetector();
    this.seoDetector = new SEODetector();
    this.mobileDetector = new MobileDetector();
  }

  /**
   * Run all tests on a URL
   */
  async runTests(config: TestConfig): Promise<TestReport> {
    const startTime = Date.now();
    const issues: Issue[] = [];

    try {
      // Launch browser
      await this.browserManager.launch({
        browserType: config.browserType || 'chromium',
        headless: config.headless ?? true,
        timeout: config.timeout,
        viewport: config.viewport
      });

      // Navigate to URL
      const page = await this.browserManager.newPage();
      
      // Start console error listening
      this.consoleErrorDetector.startListening(page);

      // Navigate
      const response = await page.goto(config.url, { 
        waitUntil: 'networkidle',
        timeout: config.timeout || 30000
      });
      
      // Store response for security detector
      (page as any)._guardianResponse = response;

      // Run all detectors
      const [
        whiteScreenIssue,
        notFoundIssue,
        consoleErrors,
        reactErrors,
        performanceIssues,
        accessibilityIssues,
        securityIssues,
        seoIssues,
        mobileIssues
      ] = await Promise.all([
        this.whiteScreenDetector.detect(page),
        this.notFoundDetector.detect(page),
        this.consoleErrorDetector.detect(page),
        this.reactErrorDetector.detect(page),
        this.performanceDetector.detect(page),
        this.accessibilityDetector.detect(page),
        this.securityDetector.detect(page),
        this.seoDetector.detect(page),
        this.mobileDetector.detect(page)
      ]);

      // Collect issues
      if (whiteScreenIssue) issues.push(whiteScreenIssue);
      if (notFoundIssue) issues.push(notFoundIssue);
      if (consoleErrors.length > 0) issues.push(...consoleErrors);
      if (reactErrors.length > 0) issues.push(...reactErrors);
      if (performanceIssues.length > 0) issues.push(...performanceIssues);
      if (accessibilityIssues.length > 0) issues.push(...accessibilityIssues);
      if (securityIssues.length > 0) issues.push(...securityIssues);
      if (seoIssues.length > 0) issues.push(...seoIssues);
      if (mobileIssues.length > 0) issues.push(...mobileIssues);

      // Calculate metrics
      const metrics = this.calculateMetrics(issues);

      // Generate report
      const duration = Date.now() - startTime;
      const report: TestReport = {
        url: config.url,
        timestamp: new Date().toISOString(),
        duration,
        browserType: config.browserType || 'chromium',
        status: issues.length === 0 ? 'passed' : 'failed',
        issues,
        metrics
      };

      return report;

    } catch (error) {
      // Error during test execution
      const duration = Date.now() - startTime;
      return {
        url: config.url,
        timestamp: new Date().toISOString(),
        duration,
        browserType: config.browserType || 'chromium',
        status: 'failed',
        issues: [{
          type: 'TEST_EXECUTION_ERROR',
          severity: 'critical',
          message: `Test execution failed: ${(error as Error).message}`,
          fix: [
            'Check if URL is accessible',
            'Verify network connection',
            'Check browser configuration',
            'Increase timeout if page is slow'
          ],
          details: {
            error: (error as Error).message,
            stack: (error as Error).stack
          }
        }],
        metrics: {
          totalIssues: 1,
          critical: 1,
          high: 0,
          medium: 0,
          low: 0
        }
      };
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  /**
   * Run quick test (without screenshots)
   */
  async quickTest(url: string): Promise<TestReport> {
    return this.runTests({ url, headless: true });
  }

  /**
   * Calculate metrics from issues
   */
  private calculateMetrics(issues: Issue[]): TestReport['metrics'] {
    const metrics = {
      totalIssues: issues.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          metrics.critical++;
          break;
        case 'high':
          metrics.high++;
          break;
        case 'medium':
          metrics.medium++;
          break;
        case 'low':
          metrics.low++;
          break;
      }
    }

    return metrics;
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    this.consoleErrorDetector.clear();
    await this.browserManager.close();
  }

  /**
   * Test multiple URLs
   */
  async runBatch(urls: string[], config?: Omit<TestConfig, 'url'>): Promise<TestReport[]> {
    const reports: TestReport[] = [];
    
    for (const url of urls) {
      const report = await this.runTests({ ...config, url });
      reports.push(report);
    }

    return reports;
  }
}
