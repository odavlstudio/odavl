# 🛡️ ODAVL Guardian - Technical Implementation Plan

**Mission**: Build the most powerful runtime testing platform that replaces Cypress + Lighthouse + Sentry + Checkly  
**Timeline**: 10 weeks of pure development  
**Current Status**: 10% → Target: 100%

---

## 🎯 Core Philosophy

Guardian does **ONE THING** better than anyone else:
- Opens your app in a **real browser**
- Tests it like a **real user**
- Catches **runtime issues** before users see them
- Monitors **production 24/7**
- **Zero manual work** - everything automated

---

## 📊 Current State

### Exists (10%)
```
✅ odavl-studio/guardian/core/ - empty structure
✅ odavl-studio/guardian/app/ - empty Next.js dashboard
✅ odavl-studio/guardian/workers/ - empty background jobs
✅ TypeScript types defined
```

### Missing (90%)
```
❌ Browser automation engine
❌ All 12+ detectors
❌ Visual regression system
❌ Performance testing
❌ Security scanning
❌ Production monitoring
❌ Alert system
❌ CI/CD integration
```

---

## 🎯 What Makes Guardian THE BEST

### Why Guardian > Cypress
```typescript
// Cypress: You write tests manually
test('checkout works', () => {
  cy.visit('/checkout');
  cy.get('[data-testid="pay"]').click();
  cy.contains('Order Complete').should('exist');
});

// Guardian: Zero code, automatic detection
await guardian.test('https://myapp.com');
// Automatically tests:
// - All pages load
// - All buttons work
// - All forms submit
// - No console errors
// - No white screens
// - No broken links
```

### Why Guardian > Lighthouse
```typescript
// Lighthouse: CLI only, manual runs
$ lighthouse https://myapp.com --output json

// Guardian: Continuous monitoring + pre-deploy checks
// - Runs on every commit (CI/CD)
// - Monitors production 24/7
// - Alerts when performance drops
// - Tracks trends over time
```

### Why Guardian > Sentry
```typescript
// Sentry: Reactive (after users see errors)
User sees error → Sentry captures → You fix → Users already angry

// Guardian: Proactive (before deploy)
Guardian tests → Finds error → Blocks deploy → Users never see error
```

### Why Guardian > All of them combined
```
Cypress + Lighthouse + Sentry + Checkly = $500/month + setup time
Guardian = One tool, zero config, automatic everything
```

---

## 🎯 Phase 1: Core Runtime Testing (Weeks 1-3)

### Week 1: Browser Automation Setup

**Goal**: Open real browsers and test like a user

```typescript
// 1.1 Install Playwright
// odavl-studio/guardian/core/package.json
{
  "dependencies": {
    "playwright": "^1.40.0",
    "playwright-core": "^1.40.0"
  }
}

// 1.2 Browser Manager (odavl-studio/guardian/core/src/browser-manager.ts)
import { chromium, firefox, webkit, Browser, Page } from 'playwright';

export class BrowserManager {
  private browser: Browser | null = null;
  
  async launch(options: BrowserOptions) {
    // Launch headless browser
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    return this.browser;
  }
  
  async navigate(url: string): Promise<TestResult> {
    const page = await this.browser.newPage();
    
    // Track console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Check for white screen
    const hasContent = await page.evaluate(() => {
      return document.body.innerText.trim().length > 0;
    });
    
    return {
      url,
      status: response?.status(),
      hasContent,
      consoleErrors,
      screenshot: await page.screenshot({ fullPage: true })
    };
  }
}

// 1.3 White Screen Detector (The issue we faced!)
export class WhiteScreenDetector {
  async detect(page: Page): Promise<Issue | null> {
    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    const bodyHtml = await page.evaluate(() => document.body.innerHTML);
    
    if (bodyText.length === 0 && bodyHtml.length < 100) {
      return {
        type: 'WHITE_SCREEN',
        severity: 'critical',
        message: '🚨 White screen detected - page has no content',
        screenshot: await page.screenshot(),
        fix: [
          'Check browser console for errors',
          'Verify routing configuration',
          'Check for layout conflicts',
          'Ensure middleware is not blocking requests'
        ]
      };
    }
    
    return null;
  }
}

// 1.4 404 Error Detector
export class NotFoundDetector {
  async detect(page: Page): Promise<Issue | null> {
    const response = page.url();
    const title = await page.title();
    const status = await page.evaluate(() => {
      return fetch(window.location.href).then(r => r.status);
    });
    
    if (status === 404 || title.includes('404') || title.includes('Not Found')) {
      return {
        type: '404_ERROR',
        severity: 'critical',
        message: `❌ Route not found: ${response}`,
        fix: [
          'Verify route exists in your routing configuration',
          'Check middleware redirects',
          'Ensure dynamic routes are properly configured'
        ]
      };
    }
    
    return null;
  }
}
```

**Deliverables**:
- [ ] Playwright installed and configured
- [ ] Browser launches successfully (Chrome/Firefox/Safari)
- [ ] Can navigate to any URL
- [ ] Captures console errors in real-time
- [ ] Detects white screens (our issue!)
- [ ] Detects 404 errors
- [ ] Takes full-page screenshots
- [ ] Generates JSON report

---

### Week 2: React/Next.js Runtime Error Detection

**Goal**: Detect React errors that only appear at runtime

```typescript
// 2.1 React Error Detector (odavl-studio/guardian/core/src/react-detector.ts)
export class ReactErrorDetector {
  async detect(page: Page): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // Listen for React errors
    page.on('pageerror', error => {
      issues.push({
        type: 'REACT_ERROR',
        severity: 'high',
        message: error.message,
        stack: error.stack
      });
    });
    
    // Check for hydration errors
    const consoleErrors = await page.evaluate(() => {
      const errors: string[] = [];
      const originalError = console.error;
      console.error = (...args) => {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };
      return errors;
    });
    
    const hydrationErrors = consoleErrors.filter(e => 
      e.includes('Hydration') || 
      e.includes('hydration') ||
      e.includes('did not match')
    );
    
    if (hydrationErrors.length > 0) {
      issues.push({
        type: 'HYDRATION_ERROR',
        severity: 'high',
        message: '⚠️ React hydration mismatch detected',
        details: hydrationErrors,
        fix: [
          'Ensure server and client render the same content',
          'Avoid using browser-only APIs during SSR',
          'Check for randomized content (Math.random, Date.now)',
          'Use useEffect for client-only rendering'
        ]
      });
    }
    
    return issues;
  }
}

// 2.2 Routing & Link Checker
export class RoutingDetector {
  async test(page: Page): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // Find all links on the page
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]')).map(a => ({
        href: (a as HTMLAnchorElement).href,
        text: a.textContent?.trim() || ''
      }));
    });
    
    // Test each link
    for (const link of links) {
      try {
        const response = await page.goto(link.href, { timeout: 10000 });
        
        if (response?.status() === 404) {
          issues.push({
            type: 'BROKEN_LINK',
            severity: 'medium',
            message: `❌ Broken link: "${link.text}" → ${link.href}`,
            fix: ['Update the link', 'Create the missing page', 'Remove the link']
          });
        }
        
        if (response?.status() === 500) {
          issues.push({
            type: 'SERVER_ERROR',
            severity: 'critical',
            message: `🚨 Server error on: ${link.href}`,
            fix: ['Check server logs', 'Fix the endpoint', 'Add error handling']
          });
        }
      } catch (error) {
        issues.push({
          type: 'TIMEOUT',
          severity: 'medium',
          message: `⏱️ Slow route: ${link.href} (timeout after 10s)`,
          fix: ['Optimize page load', 'Add loading states', 'Reduce bundle size']
        });
      }
    }
    
    return issues;
  }
  
  async detectRedirectLoops(page: Page): Promise<Issue | null> {
    const visited = new Set<string>();
    let currentUrl = page.url();
    let redirectCount = 0;
    
    while (redirectCount < 10) {
      if (visited.has(currentUrl)) {
        return {
          type: 'REDIRECT_LOOP',
          severity: 'critical',
          message: `🔄 Infinite redirect loop detected: ${currentUrl}`,
          fix: [
            'Check middleware redirects',
            'Verify authentication logic',
            'Review route guards'
          ]
        };
      }
      
      visited.add(currentUrl);
      redirectCount++;
      
      // Check if redirected
      await page.waitForTimeout(1000);
      const newUrl = page.url();
      if (newUrl === currentUrl) break;
      currentUrl = newUrl;
    }
    
    return null;
  }
}
```

**Deliverables**:
- [ ] Detects React hydration errors
- [ ] Detects JavaScript exceptions
- [ ] Tests all links on page (broken links)
- [ ] Detects 404/500 errors on routes
- [ ] Detects redirect loops
- [ ] Measures route load times

---

### Week 3: Visual Regression Testing

**Goal**: Detect UI breaking changes automatically

```typescript
// 3.1 Visual Comparison (odavl-studio/guardian/core/src/visual-tester.ts)
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export class VisualRegressionTester {
  async captureBaseline(url: string, name: string): Promise<void> {
    const page = await this.browser.newPage();
    await page.goto(url);
    
    // Capture screenshots at different viewports
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.screenshot({
        path: `.odavl/guardian/baselines/${name}-${viewport.name}.png`,
        fullPage: true
      });
    }
  }
  
  async compare(url: string, name: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    const page = await this.browser.newPage();
    await page.goto(url);
    
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      const currentBuffer = await page.screenshot({ fullPage: true });
      
      // Load baseline
      const baselinePath = `.odavl/guardian/baselines/${name}-${viewport.name}.png`;
      const baselineBuffer = fs.readFileSync(baselinePath);
      
      // Compare
      const baseline = PNG.sync.read(baselineBuffer);
      const current = PNG.sync.read(currentBuffer);
      const { width, height } = baseline;
      const diff = new PNG({ width, height });
      
      const pixelsDiff = pixelmatch(
        baseline.data,
        current.data,
        diff.data,
        width,
        height,
        { threshold: 0.1 }
      );
      
      const diffPercent = (pixelsDiff / (width * height)) * 100;
      
      if (diffPercent > 5) {
        // Save diff image
        const diffPath = `.odavl/guardian/diffs/${name}-${viewport.name}-diff.png`;
        fs.writeFileSync(diffPath, PNG.sync.write(diff));
        
        issues.push({
          type: 'VISUAL_REGRESSION',
          severity: 'medium',
          message: `📸 Visual changes detected on ${viewport.name}: ${diffPercent.toFixed(2)}% different`,
          screenshot: diffPath,
          fix: [
            'Review the diff image',
            'Update baseline if changes are intentional',
            'Revert changes if regression'
          ]
        });
      }
    }
    
    return issues;
  }
}

// 3.2 Layout Shift Detector (Cumulative Layout Shift)
export class LayoutShiftDetector {
  async measure(page: Page): Promise<Issue | null> {
    // Inject CLS measurement script
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).hadRecentInput) continue;
            clsValue += (entry as any).value;
          }
        });
        
        observer.observe({ type: 'layout-shift', buffered: true });
        
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 5000);
      });
    });
    
    if (cls > 0.1) {
      return {
        type: 'LAYOUT_SHIFT',
        severity: 'medium',
        message: `⚠️ Poor layout stability: CLS ${cls.toFixed(3)} (should be < 0.1)`,
        fix: [
          'Add width/height to images',
          'Reserve space for dynamic content',
          'Avoid inserting content above existing content',
          'Use CSS transforms instead of changing position'
        ]
      };
    }
    
    return null;
  }
}
```

**Deliverables**:
- [ ] Captures baseline screenshots (mobile/tablet/desktop)
- [ ] Compares pixel-by-pixel with pixelmatch
- [ ] Generates diff images showing changes
- [ ] Tests responsive layouts automatically
- [ ] Measures Cumulative Layout Shift (CLS)
- [ ] Stores results in `.odavl/guardian/`

---

## 🎯 Phase 2: Accessibility & Performance (Weeks 4-5)

### Week 4: Accessibility Testing

**Goal**: WCAG 2.1 AAA compliance

```typescript
// 4.1 Axe-core Integration
import axe from 'axe-core';

class AccessibilityTester {
  async test(page: Page) {
    const results = await axe.run(page);
    
    return {
      violations: results.violations.map(v => ({
        rule: v.id,
        impact: v.impact, // critical, serious, moderate, minor
        description: v.description,
        help: v.help,
        nodes: v.nodes.map(n => ({
          html: n.html,
          target: n.target,
          fix: n.failureSummary
        }))
      })),
      
      checks: {
        // ✅ Color contrast (4.5:1 for text)
        // ✅ Alt text for images
        // ✅ ARIA labels
        // ✅ Keyboard navigation
        // ✅ Form labels
        // ✅ Heading hierarchy
        // ✅ Skip links
        // ✅ Focus indicators
        // ✅ Screen reader support
      }
    };
  }
  
  async testKeyboardNavigation() {
    // Simulate Tab, Enter, Space, Arrows
    // Verify all interactive elements are accessible
  }
  
  async testScreenReader() {
    // Verify ARIA labels
    // Check semantic HTML
    // Test announcements
  }
}
```

**Deliverables**:
- [ ] Full WCAG 2.1 compliance testing
- [ ] Keyboard navigation testing
- [ ] Screen reader testing
- [ ] Color contrast checking
- [ ] Detailed accessibility report

---

### Week 5: Performance Testing

**Goal**: Lighthouse scores >90 in all categories

```typescript
// 5.1 Lighthouse Integration
import lighthouse from 'lighthouse';

class PerformanceTester {
  async test(url: string) {
    const result = await lighthouse(url, {
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
    });
    
    return {
      scores: {
        performance: result.lhr.categories.performance.score * 100,
        accessibility: result.lhr.categories.accessibility.score * 100,
        bestPractices: result.lhr.categories['best-practices'].score * 100,
        seo: result.lhr.categories.seo.score * 100
      },
      
      metrics: {
        // ✅ First Contentful Paint (FCP) < 1.8s
        // ✅ Largest Contentful Paint (LCP) < 2.5s
        // ✅ First Input Delay (FID) < 100ms
        // ✅ Cumulative Layout Shift (CLS) < 0.1
        // ✅ Time to Interactive (TTI) < 3.8s
        // ✅ Total Blocking Time (TBT) < 200ms
        // ✅ Speed Index < 3.4s
      },
      
      opportunities: result.lhr.audits // Improvement suggestions
    };
  }
  
  async testCoreWebVitals() {
    // Real user metrics
    const vitals = await measureWebVitals();
    
    if (vitals.LCP > 2500) {
      return {
        issue: 'Slow Largest Contentful Paint',
        value: vitals.LCP,
        fix: 'Optimize images, reduce render-blocking resources'
      };
    }
  }
  
  async analyzeBundleSize() {
    // ✅ Total bundle size
    // ✅ Code splitting effectiveness
    // ✅ Unused JavaScript
    // ✅ Tree shaking opportunities
  }
}
```

**Deliverables**:
- [ ] Lighthouse integration
- [ ] Core Web Vitals measurement
- [ ] Bundle size analysis
- [ ] Performance recommendations
- [ ] Before/after comparisons

---

## 🎯 Phase 3: Security & SEO (Weeks 6-7)

### Week 6: Security Testing

**Goal**: OWASP Top 10 coverage

```typescript
// 6.1 Security Scanner
class SecurityTester {
  async scan(url: string) {
    return {
      vulnerabilities: [
        // ✅ SQL Injection
        await testSQLInjection(),
        
        // ✅ XSS (Cross-Site Scripting)
        await testXSS(),
        
        // ✅ CSRF (Cross-Site Request Forgery)
        await testCSRF(),
        
        // ✅ Insecure Direct Object References
        await testIDOR(),
        
        // ✅ Security Misconfiguration
        await testSecurityHeaders(),
        
        // ✅ Sensitive Data Exposure
        await testDataExposure(),
        
        // ✅ Broken Authentication
        await testAuthentication(),
        
        // ✅ Using Components with Known Vulnerabilities
        await scanDependencies(),
        
        // ✅ Insufficient Logging & Monitoring
        await testLogging(),
        
        // ✅ Server-Side Request Forgery (SSRF)
        await testSSRF()
      ]
    };
  }
  
  async testSecurityHeaders() {
    const headers = await fetchHeaders(url);
    
    const required = [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Strict-Transport-Security',
      'Referrer-Policy',
      'Permissions-Policy'
    ];
    
    const missing = required.filter(h => !headers[h]);
    
    if (missing.length > 0) {
      return {
        issue: 'Missing security headers',
        headers: missing,
        severity: 'high'
      };
    }
  }
  
  async testSSL() {
    // ✅ Valid certificate
    // ✅ Strong cipher suites
    // ✅ TLS 1.2+ only
    // ✅ No mixed content
  }
}
```

**Deliverables**:
- [ ] OWASP Top 10 testing
- [ ] Security header validation
- [ ] SSL/TLS testing
- [ ] Dependency vulnerability scanning
- [ ] Detailed security report

---

### Week 7: SEO Testing

**Goal**: Google Core Web Vitals + SEO best practices

```typescript
// 7.1 SEO Analyzer
class SEOTester {
  async analyze(url: string) {
    return {
      meta: {
        // ✅ Title tag (50-60 chars)
        // ✅ Meta description (150-160 chars)
        // ✅ Canonical URL
        // ✅ Open Graph tags
        // ✅ Twitter Card tags
        // ✅ Robots meta tag
        // ✅ Language tag
      },
      
      content: {
        // ✅ H1 tag (one per page)
        // ✅ Heading hierarchy (H1→H2→H3)
        // ✅ Alt text for images
        // ✅ Internal links
        // ✅ External links (nofollow when needed)
        // ✅ Structured data (schema.org)
      },
      
      technical: {
        // ✅ Sitemap.xml exists
        // ✅ Robots.txt exists
        // ✅ Mobile-friendly
        // ✅ Page speed
        // ✅ HTTPS
        // ✅ Canonical URLs
      },
      
      social: {
        // ✅ Open Graph complete
        // ✅ Twitter Cards complete
        // ✅ Social share preview
      }
    };
  }
}
```

**Deliverables**:
- [ ] Meta tag validation
- [ ] Content structure analysis
- [ ] Technical SEO checks
- [ ] Social media optimization
- [ ] Structured data validation

---

## 🎯 Phase 4: Real-Time Monitoring & Alerts (Week 8)

### Real-Time Application Monitoring

```typescript
// 8.1 Production Monitor
class ProductionMonitor {
  async monitor(url: string, interval: number = 60000) {
    setInterval(async () => {
      const health = await checkHealth(url);
      
      if (!health.ok) {
        await sendAlert({
          type: 'outage',
          url,
          status: health.status,
          error: health.error,
          timestamp: new Date()
        });
      }
      
      // Track metrics
      await trackMetrics({
        uptime: health.uptime,
        responseTime: health.responseTime,
        errorRate: health.errorRate,
        userSessions: health.sessions
      });
    }, interval);
  }
  
  async detectAnomalies() {
    // ✅ Sudden spike in errors
    // ✅ Slow response times
    // ✅ High memory usage
    // ✅ Increased load times
    // ✅ Broken features
  }
}

// 8.2 Alert System
class AlertManager {
  async sendAlert(alert: Alert) {
    // Send to multiple channels:
    // - Email
    // - Slack
    // - Discord
    // - SMS (Twilio)
    // - PagerDuty
    // - Custom webhooks
    
    const channels = [
      await sendEmail(alert),
      await sendSlack(alert),
      await sendWebhook(alert)
    ];
  }
  
  async escalate(alert: Alert) {
    // If not acknowledged in 5 minutes:
    // - Notify team lead
    // - Page on-call engineer
    // - Create incident ticket
  }
}

// 8.3 Error Tracking
class ErrorTracker {
  async track(error: Error) {
    // Similar to Sentry:
    // - Capture stack traces
    // - Group similar errors
    // - Track error frequency
    // - User session replay
    // - Breadcrumbs (user actions)
  }
}
```

**Deliverables**:
- [ ] Continuous monitoring
- [ ] Multi-channel alerts
- [ ] Error tracking & grouping
- [ ] Uptime tracking
- [ ] Performance tracking

---

## 🎯 Phase 5: CI/CD Integration & Reporting (Weeks 9-10)

### Week 9: GitHub Actions Integration

**Goal**: Block bad deploys automatically

```typescript
// 9.1 GitHub Actions Workflow
// .github/workflows/guardian-pre-deploy.yml
name: ODAVL Guardian Pre-Deploy Check

on:
  pull_request:
    branches: [main, staging]
  push:
    branches: [staging]

jobs:
  guardian-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build staging
        run: pnpm build
        env:
          NODE_ENV: staging
      
      - name: Start staging server
        run: pnpm start &
      
      - name: Wait for server
        run: sleep 10
      
      - name: Run Guardian Tests
        run: |
          pnpm odavl guardian test http://localhost:3000 \
            --tests all \
            --fail-on critical \
            --output guardian-report.json
      
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: guardian-report
          path: guardian-report.json
      
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const report = require('./guardian-report.json');
            const body = `
            ## 🛡️ ODAVL Guardian Report
            
            **Status**: ${report.passed ? '✅ PASSED' : '❌ FAILED'}
            
            ### Test Results
            - Performance: ${report.performance.score}/100
            - Accessibility: ${report.accessibility.score}/100
            - Security: ${report.security.issues.length} issues
            - SEO: ${report.seo.score}/100
            
            ${report.critical.length > 0 ? '### ❌ Critical Issues\n' + report.critical.map(i => `- ${i.message}`).join('\n') : ''}
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body
            });

// 9.2 Quality Gate (odavl-studio/guardian/core/src/quality-gate.ts)
export class QualityGate {
  async check(results: TestResults): Promise<DeploymentDecision> {
    const gates = {
      // Performance
      performance: results.lighthouse.performance > 85,
      lcp: results.webVitals.lcp < 2500,
      fid: results.webVitals.fid < 100,
      cls: results.webVitals.cls < 0.1,
      
      // Accessibility
      accessibility: results.accessibility.violations.length === 0,
      
      // Security
      security: results.security.critical.length === 0,
      
      // SEO
      seo: results.seo.score > 80,
      
      // Runtime
      noWhiteScreens: !results.runtime.whiteScreen,
      no404s: results.runtime.brokenLinks.length === 0,
      noConsoleErrors: results.runtime.consoleErrors.length === 0
    };
    
    const passed = Object.values(gates).every(g => g === true);
    const failedGates = Object.entries(gates)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
    
    if (!passed) {
      return {
        allowed: false,
        reason: `Quality gates failed: ${failedGates.join(', ')}`,
        failedGates,
        recommendation: 'Fix critical issues before deploying'
      };
    }
    
    return {
      allowed: true,
      message: '✅ All quality gates passed. Safe to deploy.'
    };
  }
}

// 9.3 CLI Integration (apps/studio-cli/src/commands/guardian.ts)
export async function runGuardianTest(url: string, options: GuardianOptions) {
  console.log(`\n🛡️ ODAVL Guardian - Testing ${url}...\n`);
  
  const guardian = new Guardian();
  const results = await guardian.test(url, {
    tests: options.tests || 'all',
    timeout: options.timeout || 60000
  });
  
  // Print results
  console.log('📊 Test Results:');
  console.log(`   Performance: ${results.performance.score}/100`);
  console.log(`   Accessibility: ${results.accessibility.score}/100`);
  console.log(`   Security: ${results.security.issues.length} issues`);
  console.log(`   SEO: ${results.seo.score}/100\n`);
  
  // Check quality gate
  const gate = new QualityGate();
  const decision = await gate.check(results);
  
  if (!decision.allowed) {
    console.error(`❌ DEPLOYMENT BLOCKED\n`);
    console.error(`Reason: ${decision.reason}\n`);
    
    if (options.failOn === 'critical') {
      process.exit(1);
    }
  } else {
    console.log(`✅ ALL CHECKS PASSED - Safe to deploy\n`);
  }
  
  // Save report
  fs.writeFileSync(
    options.output || 'guardian-report.json',
    JSON.stringify(results, null, 2)
  );
}
```

**Deliverables**:
- [ ] GitHub Actions workflow template
- [ ] Quality gate enforcement
- [ ] PR comment with test results
- [ ] Deployment blocking on critical issues
- [ ] CLI integration (`odavl guardian test`)
- [ ] JSON report generation

**Note**: Guardian does NOT auto-fix issues (that's Autopilot's job). Guardian only DETECTS and REPORTS.

---

### Week 10: CI/CD Integration

```typescript
// 10.1 GitHub Actions Integration
// .github/workflows/guardian.yml
name: ODAVL Guardian
on: [push, pull_request]

jobs:
  guardian:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: odavl/guardian-action@v1
        with:
          url: https://staging.example.com
          tests: all
          fail-on: critical
      
      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            // Post Guardian report as PR comment

// 10.2 Quality Gates
class QualityGate {
  async check(results: TestResults) {
    const gates = {
      performance: results.lighthouse.performance > 90,
      accessibility: results.axe.violations.length === 0,
      security: results.security.critical.length === 0,
      seo: results.seo.score > 85
    };
    
    const passed = Object.values(gates).every(g => g);
    
    if (!passed) {
      throw new Error('Quality gate failed: Deployment blocked');
    }
    
    return { passed, gates };
  }
}

// 10.3 Deployment Guard
async function beforeDeploy() {
  const report = await Guardian.test(stagingUrl);
  
  if (report.critical.length > 0) {
    console.error('❌ DEPLOYMENT BLOCKED');
    console.error('Critical issues found:');
    report.critical.forEach(issue => {
      console.error(`  - ${issue.title}`);
    });
    process.exit(1);
  }
  
  console.log('✅ All checks passed. Deployment allowed.');
}
```

**Deliverables**:
- [ ] GitHub Actions integration
- [ ] GitLab CI integration
- [ ] Quality gate enforcement
- [ ] Pre-deploy testing
- [ ] Post-deploy verification

---

## 🎯 Phase 6: Dashboard & Reporting (Weeks 11-12)

### Week 11: Real-Time Dashboard

```typescript
// 11.1 Guardian Dashboard (Next.js + React)
const GuardianDashboard = () => {
  return (
    <Dashboard>
      {/* Overview */}
      <OverviewPanel>
        <Metric label="Uptime" value="99.99%" />
        <Metric label="Tests Run" value="1,234" />
        <Metric label="Issues Found" value="12" />
        <Metric label="Auto-Fixed" value="8" />
      </OverviewPanel>
      
      {/* Test Results */}
      <TestResults>
        <TestSuite name="Performance">
          <Test name="LCP" status="pass" value="1.2s" />
          <Test name="FID" status="pass" value="45ms" />
          <Test name="CLS" status="fail" value="0.25" />
        </TestSuite>
        
        <TestSuite name="Accessibility">
          <Test name="Color Contrast" status="pass" />
          <Test name="Alt Text" status="fail" count={3} />
          <Test name="ARIA Labels" status="pass" />
        </TestSuite>
      </TestResults>
      
      {/* Live Monitoring */}
      <LiveMonitor url="https://app.example.com">
        <ResponseTime chart="line" interval="1m" />
        <ErrorRate chart="bar" />
        <UserSessions chart="area" />
      </LiveMonitor>
      
      {/* Alerts */}
      <AlertsFeed>
        {alerts.map(alert => (
          <Alert key={alert.id} severity={alert.severity}>
            {alert.message}
          </Alert>
        ))}
      </AlertsFeed>
    </Dashboard>
  );
};

// 11.2 Historical Reports
class ReportGenerator {
  async generateReport(timeRange: TimeRange) {
    return {
      summary: {
        totalTests: 1234,
        passed: 1150,
        failed: 84,
        autoFixed: 45
      },
      
      trends: {
        performance: { /* weekly scores */ },
        accessibility: { /* weekly violations */ },
        security: { /* weekly issues */ }
      },
      
      topIssues: [
        { title: 'Low color contrast', count: 12 },
        { title: 'Missing alt text', count: 8 },
        { title: 'Slow LCP', count: 5 }
      ],
      
      recommendations: [
        'Optimize images (save 2.1 MB)',
        'Add security headers',
        'Improve accessibility score'
      ]
    };
  }
}
```

**Deliverables**:
- [ ] Real-time dashboard
- [ ] Historical reports
- [ ] Trend analysis
- [ ] Team performance metrics
- [ ] Export reports (PDF/CSV)

---

### Week 12: Team Collaboration

```typescript
// 12.1 Team Features
class TeamManager {
  async assignIssue(issue: Issue, user: User) {
    // - Assign to team member
    // - Set priority
    // - Add due date
    // - Track progress
  }
  
  async notifyTeam(issue: Issue) {
    // Notify based on:
    // - Severity
    // - Category
    // - Team member expertise
  }
}

// 12.2 Integration Hub
class IntegrationHub {
  integrations = {
    // Issue tracking
    jira: JiraIntegration,
    linear: LinearIntegration,
    github: GitHubIntegration,
    
    // Communication
    slack: SlackIntegration,
    discord: DiscordIntegration,
    teams: TeamsIntegration,
    
    // Monitoring
    sentry: SentryIntegration,
    datadog: DatadogIntegration,
    newrelic: NewRelicIntegration
  };
}
```

**Deliverables**:
- [ ] Team collaboration features
- [ ] Issue assignment
- [ ] Integration with popular tools
- [ ] Notification preferences
- [ ] Role-based access control

---

## 🎯 Technical Architecture

### Core Components

```
odavl-studio/guardian/
├── core/                    # Testing engine
│   ├── src/
│   │   ├── browser-manager.ts       # Playwright wrapper
│   │   ├── test-orchestrator.ts     # Main test runner
│   │   ├── detectors/               # 15+ specialized detectors
│   │   │   ├── white-screen.ts
│   │   │   ├── 404-error.ts
│   │   │   ├── console-error.ts
│   │   │   ├── hydration-error.ts
│   │   │   ├── broken-links.ts
│   │   │   ├── redirect-loop.ts
│   │   │   ├── visual-regression.ts
│   │   │   ├── accessibility.ts
│   │   │   ├── performance.ts
│   │   │   ├── security.ts
│   │   │   ├── seo.ts
│   │   │   └── ...
│   │   ├── monitoring/              # Production monitoring
│   │   │   ├── health-checker.ts
│   │   │   ├── metrics-collector.ts
│   │   │   └── anomaly-detector.ts
│   │   └── integrations/            # CI/CD & alerts
│   │       ├── github-actions.ts
│   │       ├── gitlab-ci.ts
│   │       ├── slack.ts
│   │       ├── discord.ts
│   │       └── email.ts
│   └── package.json
│
├── app/                     # Dashboard (Next.js)
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx             # Overview
│   │   │   ├── tests/page.tsx       # Test results
│   │   │   ├── monitoring/page.tsx  # Live monitoring
│   │   │   └── alerts/page.tsx      # Alert history
│   │   └── api/
│   │       ├── test/route.ts        # Trigger tests
│   │       ├── monitor/route.ts     # Get monitoring data
│   │       └── webhook/route.ts     # Receive webhooks
│   └── package.json
│
└── workers/                 # Background jobs
    ├── src/
    │   ├── test-runner.ts           # Scheduled test runs
    │   ├── monitor-worker.ts        # Production monitoring
    │   └── report-generator.ts      # Generate reports
    └── package.json
```

### Tech Stack

```typescript
const guardianStack = {
  testing: {
    browser: 'Playwright 1.40+',
    visual: 'pixelmatch + sharp',
    accessibility: 'axe-core 4.8+',
    performance: 'lighthouse 11+',
    security: 'OWASP ZAP API'
  },
  
  backend: {
    runtime: 'Node.js 20+',
    language: 'TypeScript 5.3+',
    database: 'PostgreSQL 16 (Prisma)',
    cache: 'Redis 7',
    queue: 'BullMQ 5'
  },
  
  frontend: {
    framework: 'Next.js 15',
    ui: 'Tailwind CSS + shadcn/ui',
    charts: 'Recharts',
    realtime: 'Server-Sent Events'
  },
  
  infrastructure: {
    storage: 'S3 (screenshots)',
    monitoring: 'Prometheus + Grafana',
    logs: 'Winston',
    deployment: 'Docker + Kubernetes'
  }
};
```

---

## 🔧 Technology Stack

```typescript
const techStack = {
  core: {
    language: 'TypeScript',
    runtime: 'Node.js 18+',
    framework: 'Next.js 15'
  },
  
  testing: {
    browser: 'Playwright + Puppeteer',
    accessibility: 'axe-core',
    performance: 'Lighthouse',
    visual: 'pixelmatch'
  },
  
  infrastructure: {
    database: 'PostgreSQL (Prisma)',
    cache: 'Redis',
    queue: 'BullMQ',
    storage: 'S3'
  },
  
  monitoring: {
    apm: 'Sentry',
    logs: 'Winston',
    metrics: 'Prometheus + Grafana'
  },
  
  deployment: {
    container: 'Docker',
    orchestration: 'Kubernetes',
    ci: 'GitHub Actions',
    hosting: 'Vercel + AWS'
  }
};
```

---

## ✅ Definition of Done

### Phase 1-2 (Core) ✓
```
- Browser launches
- Navigates to URLs
- Detects white screens
- Detects 404 errors
- Detects React errors
- Detects layout issues
- Visual regression working
- Accessibility tests working
- Performance tests working
```

### Phase 3-4 (Security & Monitoring) ✓
```
- Security scans working
- SEO tests working
- Real-time monitoring active
- Alerts system working
- Error tracking working
```

### Phase 5-6 (Automation & UI) ✓
```
- Auto-fix suggestions working
- CI/CD integration complete
- Dashboard deployed
- Reports generated
- Team features working
```

### Launch Ready ✓
```
- All tests automated
- Documentation complete
- Video tutorials published
- Beta users onboarded
- Payment system integrated
- Support system ready
```

---

## 🚀 Success Criteria (After 10 Weeks)

### Detection Rate
```
✅ 99%+ white screens caught
✅ 99%+ 404/500 errors caught
✅ 95%+ accessibility issues caught
✅ 90%+ performance issues caught
✅ 85%+ security vulnerabilities caught
✅ 100% visual regressions caught
✅ 100% broken links caught
```

### Performance Benchmarks
```
✅ Full test suite: < 90 seconds
✅ Quick scan: < 15 seconds
✅ Dashboard loads: < 1 second
✅ Alerts sent: < 5 seconds
✅ False positives: < 2%
✅ Monitoring interval: 60 seconds
```

### Integration Requirements
```
✅ GitHub Actions: One-line setup
✅ GitLab CI: One-line setup
✅ CLI: odavl guardian test <url>
✅ API: REST + WebSocket
✅ Webhooks: Slack, Discord, custom
✅ VS Code extension: Real-time results
```

---

## 🔥 Week-by-Week Execution Plan

### Week 1: Browser Engine + Core Detectors

**Day 1-2: Setup**
```bash
cd odavl-studio/guardian/core
pnpm add playwright@1.40.0 playwright-core@1.40.0
pnpm exec playwright install chromium firefox webkit
pnpm add @types/node typescript tsx tsup vitest
```

**Day 3-5: Build BrowserManager**
```typescript
// File: src/browser-manager.ts
- Launch browsers (Chrome, Firefox, Safari)
- Handle cookies, auth, headers
- Capture console logs, network requests
- Take screenshots (full page, element, viewport)
- Handle timeouts and errors gracefully
```

**Day 6-7: First 3 Detectors**
```typescript
// File: src/detectors/white-screen.ts
- Check if body.innerText.length === 0
- Check if visible elements < 5
- Take screenshot as proof

// File: src/detectors/404-error.ts
- Check response.status === 404
- Check title includes "404" or "Not Found"
- Check for custom 404 pages

// File: src/detectors/console-error.ts
- Listen to page.on('console')
- Filter type === 'error'
- Exclude known false positives (React DevTools)
```

**Deliverable**: `pnpm test:guardian http://localhost:3000` detects white screens and 404s

---

### Week 2: React/Next.js Specific + Navigation

**Day 8-9: React Error Detection**
```typescript
// File: src/detectors/hydration-error.ts
- Listen for "Hydration failed" in console
- Listen for "did not match" errors
- Capture stack trace

// File: src/detectors/react-error.ts
- Listen to page.on('pageerror')
- Detect "Minified React error"
- Detect hook errors
```

**Day 10-12: Navigation & Link Testing**
```typescript
// File: src/detectors/broken-links.ts
- Find all <a href> on page
- Test each link (parallel, max 10 concurrent)
- Report 404s, 500s, timeouts

// File: src/detectors/redirect-loop.ts
- Track URL changes on navigation
- Detect if visited URL twice
- Set max 10 redirects limit
```

**Day 13-14: Form & Interaction Testing**
```typescript
// File: src/detectors/form-errors.ts
- Find all <form> elements
- Try to submit without filling
- Check for validation errors
- Check if submit buttons work
```

**Deliverable**: Guardian tests all links and forms automatically

---

### Week 3: Visual Regression + Layout Shift

**Day 15-17: Screenshot Comparison**
```typescript
// File: src/visual-regression.ts
- Capture baseline screenshots (mobile/tablet/desktop)
- Store in .odavl/guardian/baselines/
- Use pixelmatch for pixel-by-pixel comparison
- Generate diff images
- Threshold: 5% difference = regression
```

**Day 18-19: Layout Shift Detection**
```typescript
// File: src/detectors/layout-shift.ts
- Inject PerformanceObserver
- Listen for 'layout-shift' entries
- Calculate Cumulative Layout Shift (CLS)
- Flag if CLS > 0.1
```

**Day 20-21: Responsive Testing**
```typescript
// File: src/responsive-tester.ts
- Test viewports: 375x667, 768x1024, 1920x1080, 2560x1440
- Check if content overflows
- Check if buttons are clickable
- Check if text is readable
```

**Deliverable**: Guardian detects UI breaking changes automatically

---

### Week 4: Accessibility (WCAG 2.1)

**Day 22-24: Axe-core Integration**
```typescript
// File: src/accessibility-tester.ts
- Install axe-core@4.8.0
- Run axe.run(page)
- Map violations to severity (critical, serious, moderate, minor)
- Generate fix suggestions
```

**Day 25-26: Keyboard Navigation**
```typescript
// File: src/detectors/keyboard-nav.ts
- Simulate Tab key 50 times
- Check if all interactive elements reachable
- Check focus indicators visible
- Check no keyboard traps
```

**Day 27-28: Color Contrast & ARIA**
```typescript
// File: src/detectors/color-contrast.ts
- Check text/background contrast ratio
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text

// File: src/detectors/aria.ts
- Check all images have alt text
- Check forms have labels
- Check buttons have accessible names
```

**Deliverable**: WCAG 2.1 AA compliance testing

---

### Week 5: Performance (Core Web Vitals)

**Day 29-31: Lighthouse Integration**
```typescript
// File: src/performance-tester.ts
- Install lighthouse@11.0.0
- Run lighthouse(url, { onlyCategories: ['performance'] })
- Extract LCP, FID, CLS, FCP, TTI, TBT, Speed Index
- Generate performance report
```

**Day 32-33: Real User Metrics**
```typescript
// File: src/detectors/core-web-vitals.ts
- Inject web-vitals.js
- Measure actual LCP, FID, CLS
- Compare with thresholds (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- Flag slow metrics
```

**Day 34-35: Bundle Analysis**
```typescript
// File: src/detectors/bundle-size.ts
- Track all JavaScript loaded
- Calculate total bundle size
- Identify largest files
- Check for unused code
```

**Deliverable**: Lighthouse score > 90 enforcement

---

### Week 6: Security (OWASP Top 10)

**Day 36-38: Security Headers**
```typescript
// File: src/security-tester.ts
- Check Content-Security-Policy
- Check X-Frame-Options
- Check X-Content-Type-Options
- Check Strict-Transport-Security
- Check Referrer-Policy
- Check Permissions-Policy
```

**Day 39-40: SSL/TLS Testing**
```typescript
// File: src/detectors/ssl.ts
- Check certificate validity
- Check certificate expiration
- Check TLS version (1.2+ only)
- Check for mixed content (HTTP resources on HTTPS page)
```

**Day 41-42: XSS & CSRF Detection**
```typescript
// File: src/detectors/xss.ts
- Inject <script>alert(1)</script> in forms
- Check if executed
- Check if input sanitized

// File: src/detectors/csrf.ts
- Check for CSRF tokens in forms
- Check SameSite cookie attribute
```

**Deliverable**: OWASP Top 10 security scanning

---

### Week 7: SEO + Metadata

**Day 43-45: Meta Tags**
```typescript
// File: src/seo-tester.ts
- Check <title> exists (50-60 chars)
- Check <meta name="description"> (150-160 chars)
- Check <link rel="canonical">
- Check Open Graph tags (og:title, og:image, og:description)
- Check Twitter Card tags
```

**Day 46-47: Content Structure**
```typescript
// File: src/detectors/seo-content.ts
- Check one <h1> per page
- Check heading hierarchy (H1 → H2 → H3)
- Check image alt text
- Check internal links
```

**Day 48-49: Technical SEO**
```typescript
// File: src/detectors/seo-technical.ts
- Check /sitemap.xml exists
- Check /robots.txt exists
- Check mobile-friendly
- Check HTTPS
- Check structured data (schema.org)
```

**Deliverable**: Complete SEO audit

---

### Week 8: Production Monitoring

**Day 50-52: Health Checker**
```typescript
// File: src/monitoring/health-checker.ts
- Ping app every 60 seconds
- Check response status (200 OK)
- Check response time (< 500ms)
- Check if page loads fully
- Store metrics in PostgreSQL
```

**Day 53-54: Anomaly Detection**
```typescript
// File: src/monitoring/anomaly-detector.ts
- Track response times over 24h
- Calculate average and std deviation
- Alert if response time > avg + 2*stddev
- Alert if error rate > 1%
- Alert if uptime < 99%
```

**Day 55-56: Alert System**
```typescript
// File: src/monitoring/alert-manager.ts
- Send Slack webhook
- Send Discord webhook
- Send email via SendGrid
- Send custom webhooks
- Escalate if not acknowledged in 5 minutes
```

**Deliverable**: 24/7 production monitoring

---

### Week 9: CI/CD Integration

**Day 57-59: GitHub Actions**
```yaml
# File: .github/workflows/guardian.yml
- Setup job (checkout, install)
- Build app
- Start server
- Run Guardian tests
- Upload artifacts (screenshots, reports)
- Comment on PR with results
- Block merge if critical issues
```

**Day 60-61: GitLab CI**
```yaml
# File: .gitlab-ci.yml
- Same as GitHub Actions
- Use GitLab API for comments
```

**Day 62-63: Quality Gates**
```typescript
// File: src/quality-gate.ts
- Define thresholds (perf > 85, a11y violations = 0)
- Check test results against thresholds
- Return PASS or FAIL
- Exit with code 1 if failed (blocks CI)
```

**Deliverable**: One-line CI/CD integration

---

### Week 10: Dashboard + CLI

**Day 64-66: CLI Tool**
```typescript
// File: apps/studio-cli/src/commands/guardian.ts
- Command: odavl guardian test <url>
- Flags: --tests, --fail-on, --output
- Pretty print results in terminal
- Save JSON report
```

**Day 67-69: Dashboard**
```typescript
// File: odavl-studio/guardian/app/
- Overview page (test summary, uptime)
- Tests page (detailed results, screenshots)
- Monitoring page (real-time charts)
- Alerts page (alert history, acknowledgments)
- Settings page (configure thresholds, webhooks)
```

**Day 70: VS Code Extension**
```typescript
// File: odavl-studio/guardian/extension/
- Show Guardian results in Problems Panel
- Run tests on save
- Click to open issue in browser
```

**Deliverable**: Complete user interface

---

### Week 11: Database Schema + Authentication

**Day 71-72: Database Schema**

```typescript
// File: odavl-studio/guardian/core/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Test Runs
model TestRun {
  id          String   @id @default(cuid())
  url         String
  status      String   // 'running' | 'passed' | 'failed'
  startedAt   DateTime @default(now())
  completedAt DateTime?
  duration    Int?     // milliseconds
  
  // Results
  performance Json?    // Lighthouse scores
  accessibility Json?  // axe-core violations
  security    Json?    // Security issues
  seo         Json?    // SEO analysis
  runtime     Json?    // Runtime errors
  visual      Json?    // Visual regressions
  
  // Metadata
  browser     String   @default("chromium")
  viewport    String   @default("1920x1080")
  userId      String?
  projectId   String?
  
  user    User?    @relation(fields: [userId], references: [id])
  project Project? @relation(fields: [projectId], references: [id])
  alerts  Alert[]
  
  @@index([userId])
  @@index([projectId])
  @@index([status])
  @@index([startedAt])
}

// Projects
model Project {
  id          String   @id @default(cuid())
  name        String
  url         String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Settings
  schedule    String?  // Cron expression
  enabled     Boolean  @default(true)
  
  // Thresholds
  performanceThreshold Int @default(85)
  accessibilityThreshold Int @default(90)
  securityThreshold Int @default(0) // Max critical issues
  
  userId   String
  user     User     @relation(fields: [userId], references: [id])
  testRuns TestRun[]
  alerts   Alert[]
  webhooks Webhook[]
  
  @@index([userId])
}

// Alerts
model Alert {
  id        String   @id @default(cuid())
  type      String   // 'outage' | 'performance' | 'security' | 'error'
  severity  String   // 'critical' | 'high' | 'medium' | 'low'
  title     String
  message   String
  createdAt DateTime @default(now())
  readAt    DateTime?
  
  // Relations
  testRunId String?
  projectId String?
  userId    String
  
  testRun TestRun? @relation(fields: [testRunId], references: [id])
  project Project? @relation(fields: [projectId], references: [id])
  user    User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([createdAt])
  @@index([severity])
}

// Webhooks
model Webhook {
  id        String   @id @default(cuid())
  url       String
  events    String[] // ['test.failed', 'alert.critical', 'outage.detected']
  secret    String?  // For signature verification
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())
  
  projectId String
  project   Project @relation(fields: [projectId], references: [id])
  logs      WebhookLog[]
  
  @@index([projectId])
}

// Webhook Logs
model WebhookLog {
  id         String   @id @default(cuid())
  webhookId  String
  status     Int      // HTTP status code
  request    Json     // Request payload
  response   Json?    // Response body
  error      String?
  createdAt  DateTime @default(now())
  
  webhook Webhook @relation(fields: [webhookId], references: [id])
  
  @@index([webhookId])
  @@index([createdAt])
}

// Users
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String   // bcrypt hashed
  apiKey    String?  @unique
  createdAt DateTime @default(now())
  
  projects Project[]
  testRuns TestRun[]
  alerts   Alert[]
  
  @@index([email])
  @@index([apiKey])
}

// Baselines (for visual regression)
model Baseline {
  id        String   @id @default(cuid())
  projectId String
  name      String   // 'homepage' | 'checkout' | etc
  viewport  String   // 'mobile' | 'tablet' | 'desktop'
  imageUrl  String   // S3 URL
  hash      String   // SHA-256 of image
  createdAt DateTime @default(now())
  
  @@unique([projectId, name, viewport])
  @@index([projectId])
}
```

**Day 73-74: Authentication System**

```typescript
// File: odavl-studio/guardian/core/src/auth/auth-service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

export class AuthService {
  // Register new user
  async register(email: string, password: string, name?: string) {
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Email already registered');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate API key
    const apiKey = `gd_${randomBytes(32).toString('hex')}`;
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        apiKey
      }
    });
    
    // Generate JWT
    const token = this.generateToken(user.id);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        apiKey: user.apiKey
      },
      token
    };
  }
  
  // Login
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    const valid = await bcrypt.compare(password, user.password);
    
    if (!valid) {
      throw new Error('Invalid credentials');
    }
    
    const token = this.generateToken(user.id);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        apiKey: user.apiKey
      },
      token
    };
  }
  
  // Verify JWT token
  verifyToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
  
  // Verify API key
  async verifyApiKey(apiKey: string) {
    const user = await prisma.user.findUnique({
      where: { apiKey }
    });
    
    if (!user) {
      throw new Error('Invalid API key');
    }
    
    return user;
  }
  
  // Generate JWT token
  private generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
  }
  
  // Regenerate API key
  async regenerateApiKey(userId: string) {
    const apiKey = `gd_${randomBytes(32).toString('hex')}`;
    
    await prisma.user.update({
      where: { id: userId },
      data: { apiKey }
    });
    
    return apiKey;
  }
}

// File: odavl-studio/guardian/core/src/auth/auth-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth-service';

const authService = new AuthService();

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    // Bearer token
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { userId } = authService.verifyToken(token);
      req.user = { id: userId };
      return next();
    }
    
    // API key
    if (authHeader.startsWith('ApiKey ')) {
      const apiKey = authHeader.substring(7);
      const user = await authService.verifyApiKey(apiKey);
      req.user = { id: user.id };
      return next();
    }
    
    return res.status(401).json({ error: 'Invalid authorization format' });
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// Rate limiting middleware
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

export const testLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 tests per minute
  message: 'Too many tests, please slow down'
});
```

**Day 75: Webhook System**

```typescript
// File: odavl-studio/guardian/core/src/webhooks/webhook-service.ts
import crypto from 'crypto';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WebhookService {
  // Send webhook
  async send(webhookId: string, event: string, payload: any) {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId }
    });
    
    if (!webhook || !webhook.enabled) {
      return;
    }
    
    // Check if webhook is subscribed to this event
    if (!webhook.events.includes(event)) {
      return;
    }
    
    // Generate signature
    const signature = this.generateSignature(payload, webhook.secret || '');
    
    try {
      // Send POST request
      const response = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Guardian-Event': event,
          'X-Guardian-Signature': signature,
          'User-Agent': 'ODAVL-Guardian/1.0'
        },
        timeout: 10000 // 10 second timeout
      });
      
      // Log success
      await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          status: response.status,
          request: payload,
          response: response.data
        }
      });
      
      return { success: true, status: response.status };
    } catch (error: any) {
      // Log failure
      await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          status: error.response?.status || 0,
          request: payload,
          error: error.message
        }
      });
      
      // Retry logic (3 attempts with exponential backoff)
      await this.retry(webhook.id, event, payload, 1);
      
      return { success: false, error: error.message };
    }
  }
  
  // Retry with exponential backoff
  private async retry(
    webhookId: string,
    event: string,
    payload: any,
    attempt: number
  ) {
    if (attempt > 3) {
      return; // Max retries reached
    }
    
    const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
    
    setTimeout(async () => {
      await this.send(webhookId, event, payload);
    }, delay);
  }
  
  // Generate HMAC signature
  private generateSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }
  
  // Verify signature (for incoming webhooks)
  verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
  
  // Notify all webhooks for a project
  async notifyProject(projectId: string, event: string, payload: any) {
    const webhooks = await prisma.webhook.findMany({
      where: {
        projectId,
        enabled: true,
        events: {
          has: event
        }
      }
    });
    
    await Promise.all(
      webhooks.map(webhook => this.send(webhook.id, event, payload))
    );
  }
}

// Webhook events
export const WEBHOOK_EVENTS = {
  TEST_STARTED: 'test.started',
  TEST_COMPLETED: 'test.completed',
  TEST_FAILED: 'test.failed',
  ALERT_CREATED: 'alert.created',
  ALERT_CRITICAL: 'alert.critical',
  OUTAGE_DETECTED: 'outage.detected',
  PERFORMANCE_DEGRADED: 'performance.degraded',
  SECURITY_ISSUE: 'security.issue'
} as const;
```

**Day 76-77: Error Handling & Retry Logic**

```typescript
// File: odavl-studio/guardian/core/src/error-handling/guardian-error.ts
export class GuardianError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'GuardianError';
  }
}

export class BrowserLaunchError extends GuardianError {
  constructor(message: string, details?: any) {
    super(message, 'BROWSER_LAUNCH_ERROR', 500, details);
    this.name = 'BrowserLaunchError';
  }
}

export class NavigationError extends GuardianError {
  constructor(message: string, details?: any) {
    super(message, 'NAVIGATION_ERROR', 500, details);
    this.name = 'NavigationError';
  }
}

export class TestTimeoutError extends GuardianError {
  constructor(message: string, details?: any) {
    super(message, 'TEST_TIMEOUT', 408, details);
    this.name = 'TestTimeoutError';
  }
}

export class AuthenticationError extends GuardianError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends GuardianError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

// File: odavl-studio/guardian/core/src/error-handling/error-handler.ts
import { GuardianError } from './guardian-error';
import { Logger } from '../utils/logger';

const logger = new Logger('ErrorHandler');

export class ErrorHandler {
  // Global error handler
  static handle(error: Error): {
    message: string;
    code: string;
    statusCode: number;
    details?: any;
  } {
    // Log error
    logger.error('Error occurred', {
      error: error.message,
      stack: error.stack
    });
    
    // Guardian errors
    if (error instanceof GuardianError) {
      return {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details
      };
    }
    
    // Playwright errors
    if (error.message.includes('Timeout')) {
      return {
        message: 'Test timeout - page took too long to load',
        code: 'TEST_TIMEOUT',
        statusCode: 408
      };
    }
    
    if (error.message.includes('net::ERR')) {
      return {
        message: 'Network error - could not reach URL',
        code: 'NETWORK_ERROR',
        statusCode: 503
      };
    }
    
    // Generic error
    return {
      message: error.message || 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500
    };
  }
  
  // Retry with exponential backoff
  static async retry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      delayMs?: number;
      exponential?: boolean;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delayMs = 1000,
      exponential = true
    } = options;
    
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          break; // No more retries
        }
        
        // Calculate delay
        const delay = exponential
          ? delayMs * Math.pow(2, attempt - 1)
          : delayMs;
        
        logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
  
  // Graceful degradation
  static async gracefulFallback<T>(
    fn: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      logger.warn('Using fallback value due to error', {
        error: (error as Error).message
      });
      return fallback;
    }
  }
}

// File: odavl-studio/guardian/core/src/utils/logger.ts
import winston from 'winston';

export class Logger {
  private logger: winston.Logger;
  
  constructor(private context: string) {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({
          filename: '.odavl/guardian/logs/error.log',
          level: 'error'
        }),
        new winston.transports.File({
          filename: '.odavl/guardian/logs/combined.log'
        })
      ]
    });
  }
  
  info(message: string, meta?: any) {
    this.logger.info(message, { context: this.context, ...meta });
  }
  
  warn(message: string, meta?: any) {
    this.logger.warn(message, { context: this.context, ...meta });
  }
  
  error(message: string, meta?: any) {
    this.logger.error(message, { context: this.context, ...meta });
  }
  
  debug(message: string, meta?: any) {
    this.logger.debug(message, { context: this.context, ...meta });
  }
}
```

**Deliverables**:
- [ ] Database schema defined (Prisma)
- [ ] Migrations created
- [ ] Authentication system (JWT + API keys)
- [ ] Rate limiting implemented
- [ ] Webhook system with retries
- [ ] Error handling strategy
- [ ] Logging infrastructure
- [ ] Retry mechanisms with exponential backoff

---

### Week 12: Testing & Documentation

**Day 78-80: Integration Testing**

```typescript
// File: odavl-studio/guardian/core/tests/integration/browser-manager.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BrowserManager } from '../../src/browser-manager';

describe('BrowserManager Integration Tests', () => {
  let browserManager: BrowserManager;
  
  beforeAll(async () => {
    browserManager = new BrowserManager();
    await browserManager.launch();
  });
  
  afterAll(async () => {
    await browserManager.close();
  });
  
  it('should navigate to URL successfully', async () => {
    const result = await browserManager.navigate('https://example.com');
    expect(result.status).toBe(200);
    expect(result.hasContent).toBe(true);
  });
  
  it('should detect white screen', async () => {
    // Test with empty page
    const result = await browserManager.navigate('data:text/html,<html><body></body></html>');
    expect(result.hasContent).toBe(false);
  });
  
  it('should capture console errors', async () => {
    const result = await browserManager.navigate('data:text/html,<html><body><script>throw new Error("test")</script></body></html>');
    expect(result.consoleErrors.length).toBeGreaterThan(0);
  });
});

// File: odavl-studio/guardian/core/tests/integration/detectors.test.ts
import { describe, it, expect } from 'vitest';
import { WhiteScreenDetector, NotFoundDetector, ReactErrorDetector } from '../../src/detectors';

describe('Detectors Integration Tests', () => {
  it('should detect all 15+ detector types', async () => {
    const detectors = [
      'WhiteScreenDetector',
      'NotFoundDetector',
      'ConsoleErrorDetector',
      'HydrationErrorDetector',
      'BrokenLinksDetector',
      'RedirectLoopDetector',
      'VisualRegressionDetector',
      'LayoutShiftDetector',
      'AccessibilityDetector',
      'PerformanceDetector',
      'SecurityHeadersDetector',
      'SSLDetector',
      'XSSDetector',
      'CSRFDetector',
      'SEODetector'
    ];
    
    expect(detectors).toHaveLength(15);
  });
});

// File: odavl-studio/guardian/core/tests/load/guardian.load.test.ts
import { describe, it } from 'vitest';
import { Guardian } from '../../src/guardian';

describe('Guardian Load Tests', () => {
  it('should handle 100 concurrent tests', async () => {
    const guardian = new Guardian();
    
    const tests = Array.from({ length: 100 }, (_, i) =>
      guardian.test(`https://example.com?test=${i}`)
    );
    
    const results = await Promise.all(tests);
    expect(results).toHaveLength(100);
  }, 120000); // 2 minute timeout
  
  it('should complete full test suite in < 90 seconds', async () => {
    const guardian = new Guardian();
    const startTime = Date.now();
    
    await guardian.test('https://example.com', { tests: 'all' });
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(90000); // 90 seconds
  });
});
```

**Day 81-82: VS Code Extension**

```typescript
// File: odavl-studio/guardian/extension/src/extension.ts
import * as vscode from 'vscode';
import { GuardianService } from './guardian-service';

export function activate(context: vscode.ExtensionContext) {
  const guardianService = new GuardianService();
  
  // Register commands
  const testCommand = vscode.commands.registerCommand(
    'odavl.guardian.test',
    async () => {
      const url = await vscode.window.showInputBox({
        prompt: 'Enter URL to test',
        placeHolder: 'https://example.com'
      });
      
      if (!url) return;
      
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Guardian Testing...',
        cancellable: false
      }, async (progress) => {
        progress.report({ message: 'Running tests...' });
        
        const results = await guardianService.test(url);
        
        // Show results in Problems Panel
        showResults(results);
        
        // Show notification
        if (results.passed) {
          vscode.window.showInformationMessage('✅ All tests passed!');
        } else {
          vscode.window.showErrorMessage(`❌ ${results.issues.length} issues found`);
        }
      });
    }
  );
  
  context.subscriptions.push(testCommand);
}

function showResults(results: any) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('guardian');
  
  // Convert Guardian issues to VS Code diagnostics
  // Show in Problems Panel
}

// File: odavl-studio/guardian/extension/package.json
{
  "name": "odavl-guardian",
  "displayName": "ODAVL Guardian",
  "description": "Runtime testing and monitoring",
  "version": "1.0.0",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": ["Testing", "Linters"],
  "activationEvents": [
    "onCommand:odavl.guardian.test"
  ],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "odavl.guardian.test",
        "title": "Guardian: Test URL"
      }
    ],
    "configuration": {
      "title": "ODAVL Guardian",
      "properties": {
        "odavl.guardian.apiKey": {
          "type": "string",
          "description": "API key for Guardian"
        },
        "odavl.guardian.autoTest": {
          "type": "boolean",
          "default": false,
          "description": "Auto-test on save"
        }
      }
    }
  }
}
```

**Day 83-84: User Documentation**

```markdown
<!-- File: docs/GUARDIAN_USER_GUIDE.md -->
# ODAVL Guardian - User Guide

## Quick Start

### Installation
```bash
npm install -g @odavl-studio/cli
odavl guardian init
```

### First Test
```bash
odavl guardian test https://myapp.com
```

## Authentication

### Get API Key
```bash
odavl auth login
# Copy your API key from dashboard
```

### Use API Key
```bash
export GUARDIAN_API_KEY=gd_your_api_key_here
odavl guardian test https://myapp.com
```

## CI/CD Integration

### GitHub Actions
```yaml
- uses: odavl/guardian-action@v1
  with:
    url: ${{ secrets.STAGING_URL }}
    api-key: ${{ secrets.GUARDIAN_API_KEY }}
```

### GitLab CI
```yaml
guardian_test:
  script:
    - odavl guardian test $STAGING_URL --api-key $GUARDIAN_API_KEY
```

## Configuration

### .guardianrc.json
```json
{
  "tests": ["performance", "accessibility", "security"],
  "thresholds": {
    "performance": 85,
    "accessibility": 90
  },
  "webhooks": [
    {
      "url": "https://hooks.slack.com/...",
      "events": ["test.failed"]
    }
  ]
}
```

## Troubleshooting

### Common Issues

**Issue**: Browser fails to launch
**Solution**: Run `playwright install`

**Issue**: Tests timeout
**Solution**: Increase timeout: `odavl guardian test --timeout 120000`
```

**Deliverables**:
- [ ] 50+ integration tests
- [ ] Load testing (1000+ concurrent)
- [ ] VS Code extension published
- [ ] User documentation complete
- [ ] Video tutorials recorded
- [ ] Troubleshooting guide
- [ ] API reference docs

---

## ✅ Definition of Done

After 12 weeks, Guardian can:
```
✅ Open any website in Chromium/Firefox/Safari
✅ Detect 15+ types of runtime issues automatically
✅ Run full test suite in < 90 seconds
✅ Monitor production apps 24/7
✅ Send alerts to Slack/Discord/Email
✅ Integrate with GitHub Actions in 1 line
✅ Integrate with GitLab CI in 1 line
✅ Block deploys if critical issues found
✅ Generate beautiful HTML reports
✅ Compare visual regressions pixel-by-pixel
✅ Measure Core Web Vitals accurately
✅ Test WCAG 2.1 accessibility
✅ Scan OWASP Top 10 security
✅ Check complete SEO audit
✅ Provide CLI: odavl guardian test <url>
```

---

## 📋 Complete Checklist

### Phase 1-10: Core Features (10 weeks)
- [ ] Week 1: Browser automation + white screen detection
- [ ] Week 2: React errors + navigation testing
- [ ] Week 3: Visual regression + layout shift
- [ ] Week 4: Accessibility (WCAG 2.1)
- [ ] Week 5: Performance (Lighthouse + Core Web Vitals)
- [ ] Week 6: Security (OWASP Top 10)
- [ ] Week 7: SEO + metadata
- [ ] Week 8: Production monitoring + alerts
- [ ] Week 9: CI/CD integration (GitHub + GitLab)
- [ ] Week 10: Dashboard + CLI

### Phase 11: Infrastructure (1 week)
- [ ] Day 71-72: Database schema + migrations
- [ ] Day 73-74: Authentication (JWT + API keys)
- [ ] Day 75: Webhook system
- [ ] Day 76-77: Error handling + retry logic

### Phase 12: Testing & Polish (1 week)
- [ ] Day 78-80: Integration tests + load tests
- [ ] Day 81-82: VS Code extension
- [ ] Day 83-84: Documentation + tutorials

### Launch Ready (100%)
- [ ] All 15+ detectors working
- [ ] Database + auth implemented
- [ ] Webhooks with retry logic
- [ ] Error handling robust
- [ ] 50+ tests passing
- [ ] Load tested (1000+ concurrent)
- [ ] Documentation complete
- [ ] VS Code extension published
- [ ] Ready for production

---

**Start Date**: Today (November 25, 2025)  
**End Date**: 12 weeks (February 17, 2026)  
**Status**: 100% COMPLETE PLAN - READY TO BUILD  
**Focus**: Pure technical execution - zero fluff 🔥
