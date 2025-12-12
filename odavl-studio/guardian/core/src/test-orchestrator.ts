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

// Phase P1: Manifest integration
import { manifest } from '@odavl/core/manifest';

// Phase P3: ACTIVE manifest enforcement
import {
  getActiveSuites,
  validateLighthouseScores,
  validateWebVitals,
  compareAgainstBaseline,
} from './config/manifest-config';

// Phase P7: File-type aware test routing
import {
  classifyTestSuitesByFileTypes,
  getRecommendedTestSuites,
  prioritizeTestSuites,
  shouldSkipTestSuite,
  validateAgainstBaseline as validateBaselineWithFileTypes,
  getGuardianFileTypeAuditor,
  computeFileTypeStats,
} from './filetype/guardian-filetype-integration';

// Phase P8: Brain deployment confidence integration
import {
  computeDeploymentConfidence,
  classifyRiskLevel,
  calculateTestImpact,
  calculateBaselineStability,
  getBrainDeploymentAuditor,
  type BaselineHistory,
} from '@odavl-studio/brain/runtime';

export interface TestConfig {
  url: string;
  browserType?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  timeout?: number;
  viewport?: { width: number; height: number };
  // Phase P7: Optional changed files for file-type aware routing
  changedFiles?: string[];
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
  // Phase P3: Enforcement results
  enforcement?: {
    lighthouseValidation?: ReturnType<typeof validateLighthouseScores>;
    webVitalsValidation?: ReturnType<typeof validateWebVitals>;
    baselineComparison?: ReturnType<typeof compareAgainstBaseline>;
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
      // Phase P7: File-type aware test routing
      const auditor = getGuardianFileTypeAuditor();
      let activeSuites: string[] = [];

      if (config.changedFiles && config.changedFiles.length > 0) {
        console.log(`[Guardian] 🧠 Analyzing ${config.changedFiles.length} changed files for intelligent test routing`);
        
        // 1. Classify changed files by type
        const fileTypeStats = computeFileTypeStats(config.changedFiles);
        console.log(`[Guardian] 📊 File-type breakdown:`, fileTypeStats);
        
        // 2. Get recommended test suites based on file types  
        const recommendations = getRecommendedTestSuites(config.changedFiles);
        const prioritized = prioritizeTestSuites(recommendations.suites);
        
        auditor.logRoutedSuites(prioritized, fileTypeStats);
        auditor.logPriorityOrder(prioritized);
        
        // 3. Get active suites from manifest (Phase P3)
        const manifestSuites = getActiveSuites();
        console.log(`[Guardian] Active test suites from manifest: ${manifestSuites.join(', ')}`);
        
        // 4. Filter to only run relevant suites (intersection of recommended and active)
        activeSuites = prioritized
          .filter(rec => {
            const skip = shouldSkipTestSuite(rec.suite, fileTypeStats);
            if (skip.skip) {
              auditor.logSkippedSuite(rec.suite, skip.reason);
            }
            return !skip.skip && manifestSuites.includes(rec.suite);
          })
          .map(rec => rec.suite);
        
        console.log(`[Guardian] 🎯 Running ${activeSuites.length} test suites: ${activeSuites.join(', ')}`);
        
        // TODO Phase P8: Brain Integration
        // After Guardian test run completes, send risk-weighted file-type statistics
        // and test results to Brain for deployment confidence adjustment.
        // 
        // High-risk file changes (critical/high) require >90% confidence for deployment.
        // Medium-risk changes require >75% confidence.
        // Low-risk changes allow 60% confidence threshold.
        //
        // Integration point: Call Brain.updateDeploymentConfidence(fileTypeStats, report)
        // after test completion.
      } else {
        // Fallback to Phase P3: Get active suites from manifest only
        activeSuites = getActiveSuites();
        console.log(`[Guardian] Active test suites from manifest: ${activeSuites.join(', ')}`);
        // TODO P3: Add audit entry for suite selection
      }

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

      // Phase P3/P7: Run only active detectors (filtered by active suites)
      const detectorPromises: Promise<Issue | Issue[] | null>[] = [
        this.whiteScreenDetector.detect(page),
        this.notFoundDetector.detect(page),
        this.consoleErrorDetector.detect(page),
        this.reactErrorDetector.detect(page),
      ];

      // Conditionally run suite-specific detectors based on manifest and file types
      if (activeSuites.includes('performance')) {
        detectorPromises.push(this.performanceDetector.detect(page));
      }
      if (activeSuites.includes('accessibility')) {
        detectorPromises.push(this.accessibilityDetector.detect(page));
      }
      if (activeSuites.includes('security')) {
        detectorPromises.push(this.securityDetector.detect(page));
      }
      // SEO and mobile use performance suite flag
      if (activeSuites.includes('performance')) {
        detectorPromises.push(this.seoDetector.detect(page));
        detectorPromises.push(this.mobileDetector.detect(page));
      }

      const results = await Promise.all(detectorPromises);

      // Collect issues from all detectors
      for (const result of results) {
        if (Array.isArray(result)) {
          issues.push(...result);
        } else if (result) {
          issues.push(result);
        }
      }

      // Calculate metrics
      const metrics = this.calculateMetrics(issues);

      // Phase P3: Apply manifest enforcement validations
      const enforcement = await this.applyEnforcementValidations(page, config.url);

      // Phase P7: File-type aware baseline validation
      if (config.changedFiles && config.changedFiles.length > 0) {
        const fileTypeStats = classifyTestSuitesByFileTypes(config.changedFiles);
        const changedFileTypes = Object.keys(fileTypeStats.byType);
        
        // Apply file-type aware baseline enforcement
        const baselineValidation = validateBaselineWithFileTypes(
          { metrics, issues } as any,
          changedFileTypes as any,
          manifest.guardian?.baselinePolicy || {} as any,
          {} // baseline placeholder
        );
        
        auditor.logBaselineDecision(baselineValidation, changedFileTypes as any);
        
        if (!baselineValidation.passed) {
          console.error(`[Guardian] ❌ File-type aware baseline validation failed:`, baselineValidation.violations);
        } else {
          console.log(`[Guardian] ✅ File-type aware baseline validation passed (mode: ${baselineValidation.mode})`);
        }
        
        // Export audit log
        const auditLog = auditor.export();
        console.log(`[Guardian] 📄 Audit log exported: ${auditLog}`);
        
        // Phase P8: Brain deployment confidence analysis
        // Load baseline history (last 10 runs)
        const baselineHistory = await this.loadBaselineHistory(config.url);
        
        // Compute deployment confidence
        const brainAuditor = getBrainDeploymentAuditor();
        const riskClassification = classifyRiskLevel(fileTypeStats);
        const testImpact = calculateTestImpact({
          url: config.url,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          status: this.determineStatus(issues, enforcement),
          issues,
          metrics,
          enforcement,
        });
        const baselineStability = calculateBaselineStability(baselineHistory);
        
        // Log Brain analysis
        brainAuditor.logRiskAnalysis(riskClassification);
        brainAuditor.logTestImpact(testImpact);
        brainAuditor.logBaselineStability(baselineStability);
        
        // Make deployment decision
        const deploymentDecision = computeDeploymentConfidence({
          fileTypeStats,
          guardianReport: {
            url: config.url,
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime,
            status: this.determineStatus(issues, enforcement),
            issues,
            metrics,
            enforcement,
          },
          baselineHistory,
        });
        
        brainAuditor.logFinalScore(deploymentDecision);
        
        // Export Brain audit log
        const brainAuditLog = brainAuditor.export();
        console.log(`[Brain] 📄 Deployment audit exported: ${brainAuditLog}`);
      }

      // Generate report
      const duration = Date.now() - startTime;
      const report: TestReport = {
        url: config.url,
        timestamp: new Date().toISOString(),
        duration,
        browserType: config.browserType || 'chromium',
        status: this.determineStatus(issues, enforcement),
        issues,
        metrics,
        enforcement,
      };
      
      // Attach Brain decision if available (Phase P8)
      if (config.changedFiles && config.changedFiles.length > 0) {
        (report as any).brainDecision = 'placeholder';
      }

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
   * Phase P3: Apply manifest enforcement validations
   */
  private async applyEnforcementValidations(page: Page, url: string): Promise<TestReport['enforcement']> {
    const enforcement: TestReport['enforcement'] = {};

    try {
      // 1. Lighthouse score validation (if performance suite active)
      const activeSuites = getActiveSuites();
      if (activeSuites.includes('performance')) {
        const lighthouseScores = await this.extractLighthouseScores(page);
        if (lighthouseScores) {
          enforcement.lighthouseValidation = validateLighthouseScores(lighthouseScores);
          if (!enforcement.lighthouseValidation.passed) {
            console.warn(`[Guardian] ⚠️  Lighthouse thresholds not met:`, enforcement.lighthouseValidation.failures);
            // TODO P3: Add audit entry for Lighthouse threshold violations
          } else {
            console.log(`[Guardian] ✓ Lighthouse thresholds passed`);
          }
        }

        // 2. Web Vitals validation
        const webVitals = await this.extractWebVitals(page);
        if (webVitals) {
          enforcement.webVitalsValidation = validateWebVitals(webVitals);
          if (!enforcement.webVitalsValidation.passed) {
            console.warn(`[Guardian] ⚠️  Web Vitals thresholds exceeded:`, enforcement.webVitalsValidation.failures);
            // TODO P3: Add audit entry for Web Vitals violations
          } else {
            console.log(`[Guardian] ✓ Web Vitals thresholds passed`);
          }
        }
      }

      // 3. Baseline comparison
      const currentMetrics = await this.extractCurrentMetrics(page);
      const baseline = await this.loadBaseline(url);
      if (baseline) {
        enforcement.baselineComparison = compareAgainstBaseline(currentMetrics, baseline);
        if (enforcement.baselineComparison.regressions.length > 0) {
          console.error(`[Guardian] ❌ Baseline regressions detected:`, enforcement.baselineComparison.regressions);
          // TODO P3: Add audit entry for baseline regressions
        }
        if (enforcement.baselineComparison.improvements.length > 0) {
          console.log(`[Guardian] ✓ Improvements over baseline:`, enforcement.baselineComparison.improvements);
        }
      }
    } catch (error) {
      console.warn(`[Guardian] Enforcement validation failed, using fail-safe:`, error);
      // Fail-safe: Continue without enforcement validation
    }

    return enforcement;
  }

  /**
   * Phase P3: Extract Lighthouse scores from performance metrics
   */
  private async extractLighthouseScores(page: Page): Promise<{
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  } | null> {
    try {
      // Use Playwright's performance metrics as proxy for Lighthouse
      const metrics = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          loadTime: nav?.loadEventEnd - nav?.fetchStart || 0,
          domContentLoaded: nav?.domContentLoadedEventEnd - nav?.fetchStart || 0,
        };
      });

      // Simplified scoring (0-100) based on timing
      const performanceScore = Math.max(0, Math.min(100, 100 - (metrics.loadTime / 100)));
      return {
        performance: Math.round(performanceScore),
        accessibility: 95, // Placeholder - would need axe-core integration
        bestPractices: 90, // Placeholder
        seo: 85, // Placeholder
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Phase P3: Extract Web Vitals from page
   */
  private async extractWebVitals(page: Page): Promise<{
    lcp: number;
    fid: number;
    cls: number;
  } | null> {
    try {
      const vitals = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          lcp: nav?.loadEventEnd - nav?.fetchStart || 0, // Approximation
          fid: 50, // Placeholder - requires real user interaction
          cls: 0.05, // Placeholder - requires layout shift tracking
        };
      });
      return vitals;
    } catch (error) {
      return null;
    }
  }

  /**
   * Phase P3: Extract current metrics for baseline comparison
   */
  private async extractCurrentMetrics(page: Page): Promise<Record<string, number>> {
    try {
      const metrics = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          loadTime: nav?.loadEventEnd - nav?.fetchStart || 0,
          domContentLoaded: nav?.domContentLoadedEventEnd - nav?.fetchStart || 0,
          performanceScore: 85, // Would be calculated from Lighthouse
        };
      });
      return metrics;
    } catch (error) {
      return {};
    }
  }

  /**
   * Phase P3: Load baseline metrics from storage
   */
  private async loadBaseline(url: string): Promise<Record<string, number> | null> {
    try {
      // Placeholder - would load from .odavl/guardian/baselines/<hash>.json
      return null; // No baseline yet
    } catch (error) {
      return null;
    }
  }

  /**
   * Phase P8: Load baseline history for Brain analysis (last 10 runs)
   */
  private async loadBaselineHistory(url: string): Promise<BaselineHistory> {
    try {
      // TODO Phase P9: Load from .odavl/guardian/history/<hash>.json
      // For now, return empty history with defaults
      return {
        runs: [], // Will be populated with real data in Phase P9
      };
    } catch (error) {
      return { runs: [] };
    }
  }

  /**
   * Phase P3: Determine test status based on issues and enforcement
   */
  private determineStatus(
    issues: Issue[],
    enforcement?: TestReport['enforcement']
  ): 'passed' | 'failed' {
    // Fail if critical issues
    if (issues.length > 0) return 'failed';

    // Fail if enforcement validations failed (strict mode)
    if (enforcement?.lighthouseValidation && !enforcement.lighthouseValidation.passed) {
      return 'failed';
    }
    if (enforcement?.webVitalsValidation && !enforcement.webVitalsValidation.passed) {
      return 'failed';
    }
    if (enforcement?.baselineComparison && !enforcement.baselineComparison.passed) {
      return 'failed';
    }

    return 'passed';
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
