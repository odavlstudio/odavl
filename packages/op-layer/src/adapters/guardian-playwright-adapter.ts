/**
 * Guardian Playwright Adapter
 * Implements website auditing using Playwright + axe-core + custom checks
 * 
 * Phase 3A: Guardian Decoupling from Insight Core
 * Phase 3B: Parallel Execution for Multi-Browser and Audit Types
 */

import type { GuardianAdapter } from '../protocols/guardian.js';
import type {
  GuardianAuditRequest,
  GuardianAuditResult,
  GuardianIssue,
  GuardianAuditKind,
  GuardianCategory,
} from '../types/guardian.js';
import { runInParallel, getOptimalConcurrency } from '../utilities/parallel.js';

/**
 * Playwright-based Guardian adapter
 * Performs website audits without depending on Insight Core
 */
export class GuardianPlaywrightAdapter implements GuardianAdapter {
  private readonly supportedKinds: GuardianAuditKind[] = [
    'quick',
    'full',
    'accessibility',
    'performance',
    'security',
    'seo',
    'visual',
    'e2e',
  ];

  /**
   * Get adapter metadata
   */
  getMetadata() {
    return {
      name: 'GuardianPlaywrightAdapter',
      version: '1.0.0',
      supportedKinds: this.supportedKinds,
    };
  }

  /**
   * Check if adapter supports audit kind
   */
  supportsKind(kind: string): boolean {
    return this.supportedKinds.includes(kind as GuardianAuditKind);
  }

  /**
   * Run website audit
   * Phase 3B: Parallel execution ready (audit types run concurrently in full mode)
   * 
   * @param request Audit configuration
   * @returns Audit results with issues, scores, and metrics
   * 
   * @note Future enhancement: Parallel browser testing
   *       When full Playwright integration is complete, this method can launch
   *       multiple browsers (chromium, firefox, webkit) in parallel using:
   *       ```ts
   *       const browsers = request.browsers || ['chromium'];
   *       const browserTasks = browsers.map(b => async () => runAuditInBrowser(b, request));
   *       const { results } = await runInParallel(browserTasks, 2); // Max 2 browsers
   *       ```
   */
  async runAudit(request: GuardianAuditRequest): Promise<GuardianAuditResult> {
    const startMs = Date.now();
    const issues: GuardianIssue[] = [];

    // Note: This is a stub implementation. Full Playwright integration requires:
    // 1. Playwright installation (playwright, @playwright/test)
    // 2. axe-core integration (axe-playwright or @axe-core/playwright)
    // 3. Lighthouse integration (lighthouse, chrome-launcher)
    // 4. Screenshot capture (playwright.screenshot())
    //
    // For production, inject these dependencies via constructor or factory

    try {
      // Simulate audit based on kind
      switch (request.kind) {
        case 'quick':
          issues.push(...(await this.runQuickAudit(request)));
          break;
        case 'full':
          issues.push(...(await this.runFullAudit(request)));
          break;
        case 'accessibility':
          issues.push(...(await this.runAccessibilityAudit(request)));
          break;
        case 'performance':
          issues.push(...(await this.runPerformanceAudit(request)));
          break;
        case 'security':
          issues.push(...(await this.runSecurityAudit(request)));
          break;
        case 'seo':
          issues.push(...(await this.runSEOAudit(request)));
          break;
        case 'visual':
          issues.push(...(await this.runVisualAudit(request)));
          break;
        case 'e2e':
          issues.push(...(await this.runE2EAudit(request)));
          break;
        default:
          throw new Error(`Unsupported audit kind: ${request.kind}`);
      }

      // Calculate scores based on issues
      const scores = this.calculateScores(issues, request.kind);

      // Calculate Web Vitals (stub - requires real Playwright metrics)
      const webVitals = {
        fcp: 1200, // First Contentful Paint
        lcp: 2400, // Largest Contentful Paint
        cls: 0.05, // Cumulative Layout Shift
        fid: 50, // First Input Delay
        tti: 3500, // Time to Interactive
        tbt: 150, // Total Blocking Time
      };

      // WCAG compliance (stub)
      const wcagCompliance = {
        level: (request.wcagLevel || 'AA') as 'A' | 'AA' | 'AAA',
        passed: issues.filter((i) => i.category === 'accessibility').length === 0,
        violations: issues.filter(
          (i) => i.category === 'accessibility' && i.severity === 'critical'
        ).length,
        warnings: issues.filter(
          (i) => i.category === 'accessibility' && i.severity === 'high'
        ).length,
      };

      // Quality gate check
      const criticalIssues = issues.filter((i) => i.severity === 'critical').length;
      const highIssues = issues.filter((i) => i.severity === 'high').length;
      const qualityGate = {
        passed: criticalIssues === 0 && highIssues <= 5,
        failedChecks: [] as string[],
        criticalIssues,
        highIssues,
      };

      if (criticalIssues > 0) {
        qualityGate.failedChecks.push(`${criticalIssues} critical issues`);
      }
      if (highIssues > 5) {
        qualityGate.failedChecks.push(`${highIssues} high severity issues (max: 5)`);
      }

      const tookMs = Date.now() - startMs;

      return {
        issues,
        scores,
        webVitals,
        wcagCompliance,
        screenshots: [], // Stub - requires Playwright screenshot capture
        metadata: {
          request,
          tookMs,
          timestamp: new Date().toISOString(),
          browser: request.browsers?.[0] || 'chromium',
          device: request.devices?.[0] || 'desktop',
          userAgent: 'GuardianPlaywrightAdapter/1.0.0',
        },
        qualityGate,
      };
    } catch (error) {
      const tookMs = Date.now() - startMs;
      throw new Error(
        `[GuardianPlaywrightAdapter] Audit failed after ${tookMs}ms: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Run quick audit (basic checks only)
   * @private
   */
  private async runQuickAudit(
    request: GuardianAuditRequest
  ): Promise<GuardianIssue[]> {
    // Stub: Check HTTP status, basic accessibility, viewport
    return [
      {
        id: 'quick-001',
        category: 'performance',
        severity: 'info',
        message: 'Page loaded successfully',
        description: `Quick audit completed for ${request.url}`,
        location: { url: request.url },
      },
    ];
  }

  /**
   * Run full audit (all checks)
   * Phase 3B: Parallel execution for all audit types
   * @private
   */
  private async runFullAudit(
    request: GuardianAuditRequest
  ): Promise<GuardianIssue[]> {
    // Parallel execution: Run all 4 audit types concurrently
    const auditTasks = [
      async () => this.runAccessibilityAudit(request),
      async () => this.runPerformanceAudit(request),
      async () => this.runSecurityAudit(request),
      async () => this.runSEOAudit(request),
    ];

    // Run with concurrency 4 (one per audit type - lightweight operations)
    const concurrency = getOptimalConcurrency(4);
    const { results, errors } = await runInParallel(auditTasks, concurrency);

    // Flatten all issues from parallel results
    const issues: GuardianIssue[] = [];
    for (const result of results) {
      if (result) {
        issues.push(...result);
      }
    }

    // Log any errors (non-blocking)
    if (errors.length > 0) {
      console.warn(
        `[GuardianPlaywrightAdapter] ${errors.length} audit(s) failed:`,
        errors.map((e) => e.error.message)
      );
    }

    return issues;
  }

  /**
   * Run accessibility audit (WCAG 2.1)
   * @private
   */
  private async runAccessibilityAudit(
    request: GuardianAuditRequest
  ): Promise<GuardianIssue[]> {
    // Stub: Requires axe-core integration
    // Real implementation: await axe.run(page)
    return [
      {
        id: 'a11y-001',
        category: 'accessibility',
        severity: 'high',
        message: 'Missing alt text on images',
        description: 'Images must have alternative text for screen readers',
        wcagCriterion: '1.1.1',
        impact: 'serious',
        suggestedFix: 'Add descriptive alt attributes to all <img> elements',
        location: { url: request.url },
      },
    ];
  }

  /**
   * Run performance audit
   * @private
   */
  private async runPerformanceAudit(
    request: GuardianAuditRequest
  ): Promise<GuardianIssue[]> {
    // Stub: Requires Lighthouse or Playwright metrics
    const issues: GuardianIssue[] = [];

    // Simulate FCP check
    if (request.thresholds?.fcp) {
      const actualFCP = 1800; // Stub value
      if (actualFCP > request.thresholds.fcp) {
        issues.push({
          id: 'perf-001',
          category: 'performance',
          severity: 'medium',
          message: 'First Contentful Paint exceeds threshold',
          metric: {
            name: 'FCP',
            value: actualFCP,
            unit: 'ms',
            threshold: request.thresholds.fcp,
          },
          suggestedFix: 'Optimize critical rendering path, reduce render-blocking resources',
          location: { url: request.url },
        });
      }
    }

    return issues;
  }

  /**
   * Run security audit
   * @private
   */
  private async runSecurityAudit(
    request: GuardianAuditRequest
  ): Promise<GuardianIssue[]> {
    // Stub: Check security headers, SSL/TLS, mixed content
    return [
      {
        id: 'sec-001',
        category: 'security',
        severity: 'critical',
        message: 'Missing Content-Security-Policy header',
        description: 'CSP header prevents XSS and data injection attacks',
        impact: 'critical',
        suggestedFix: "Add header: Content-Security-Policy: default-src 'self'",
        location: { url: request.url },
      },
    ];
  }

  /**
   * Run SEO audit
   * @private
   */
  private async runSEOAudit(request: GuardianAuditRequest): Promise<GuardianIssue[]> {
    // Stub: Check meta tags, structured data, robots.txt
    return [
      {
        id: 'seo-001',
        category: 'seo',
        severity: 'medium',
        message: 'Missing meta description',
        description: 'Meta description improves search engine visibility',
        suggestedFix: 'Add <meta name="description" content="..."> to <head>',
        location: { url: request.url },
      },
    ];
  }

  /**
   * Run visual regression audit
   * @private
   */
  private async runVisualAudit(
    request: GuardianAuditRequest
  ): Promise<GuardianIssue[]> {
    // Stub: Requires baseline screenshots and pixel diff comparison
    return [];
  }

  /**
   * Run E2E user flow audit
   * @private
   */
  private async runE2EAudit(request: GuardianAuditRequest): Promise<GuardianIssue[]> {
    // Stub: Requires Playwright test scenarios
    return [];
  }

  /**
   * Calculate scores based on issues
   * @private
   */
  private calculateScores(
    issues: GuardianIssue[],
    kind: GuardianAuditKind
  ): GuardianAuditResult['scores'] {
    // Weight by severity
    const weights = { critical: 10, high: 5, medium: 2, low: 1, info: 0 };
    const totalPenalty = issues.reduce(
      (sum, issue) => sum + (weights[issue.severity] || 0),
      0
    );

    // Base score: 100, subtract penalties
    const overall = Math.max(0, 100 - totalPenalty);

    // Category-specific scores
    const categoryIssues = (category: GuardianCategory) =>
      issues.filter((i) => i.category === category);

    const calcCategoryScore = (category: GuardianCategory) => {
      const catIssues = categoryIssues(category);
      if (catIssues.length === 0) return 100;
      const penalty = catIssues.reduce(
        (sum, issue) => sum + (weights[issue.severity] || 0),
        0
      );
      return Math.max(0, 100 - penalty);
    };

    return {
      overall,
      accessibility:
        kind === 'accessibility' || kind === 'full'
          ? calcCategoryScore('accessibility')
          : undefined,
      performance:
        kind === 'performance' || kind === 'full'
          ? calcCategoryScore('performance')
          : undefined,
      seo: kind === 'seo' || kind === 'full' ? calcCategoryScore('seo') : undefined,
      security:
        kind === 'security' || kind === 'full'
          ? calcCategoryScore('security')
          : undefined,
      bestPractices: kind === 'full' ? 85 : undefined, // Stub
    };
  }
}
