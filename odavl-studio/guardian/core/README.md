# ODAVL Guardian Core

Pre-deploy testing and quality gates for web applications.

## Features

✅ **Accessibility Testing** - WCAG 2.1 Level AA compliance with axe-core  
⚡ **Performance Testing** - Core Web Vitals + Lighthouse scores  
🔒 **Security Testing** - OWASP Top 10 basic checks (headers, cookies)

## Installation

```bash
pnpm add @odavl-studio/guardian-core
```

## CLI Usage

```bash
# Test a URL (all tests in parallel)
guardian test https://example.com

# JSON output
guardian test https://example.com --json
```

## Programmatic Usage

```typescript
import { testAccessibility, testPerformance, testSecurity } from '@odavl-studio/guardian-core';

// Run individual tests
const accessibility = await testAccessibility('https://example.com');
const performance = await testPerformance('https://example.com');
const security = await testSecurity('https://example.com');

// Generate full report
const report = {
  url: 'https://example.com',
  timestamp: new Date().toISOString(),
  tests: { accessibility, performance, security },
  overallScore: calculateScore(accessibility, performance, security),
  passed: accessibility.score >= 70 && performance.scores.performance >= 70 && security.score >= 70,
  duration: 12500,
};
```

## Test Results

### Accessibility

- **Violations**: WCAG 2.1 Level AA violations with severity (minor → critical)
- **Score**: 0-100 (weighted by impact)
- **Pass threshold**: No critical violations

### Performance

- **Lighthouse Scores**: Performance, Accessibility, Best Practices, SEO (0-100 each)
- **Core Web Vitals**: FCP, LCP, TBT, CLS, Speed Index
- **Pass threshold**: Performance ≥ 70

### Security

- **Vulnerabilities**: OWASP Top 10 basic checks
  - Missing security headers (HSTS, CSP, X-Frame-Options)
  - Cookie security (Secure, HttpOnly flags)
  - Mixed content warnings
  - Sensitive data in URLs
- **Score**: 0-100 (weighted by severity)
- **Pass threshold**: No critical vulnerabilities

## Example Output

```
🔰 ODAVL Guardian Testing: https://example.com

♿ Running accessibility tests...
⚡ Running performance tests...
🔒 Running security tests...

📊 Test Results

♿ Accessibility: 92/100
   ✅ Passed: 45
   ❌ Violations: 3
      🟠 Serious: 2

⚡ Performance: 85/100
   Accessibility: 88/100
   Best Practices: 92/100
   SEO: 95/100

   Core Web Vitals:
   FCP: 1.2s
   LCP: 2.3s
   CLS: 0.05

🔒 Security: 78/100
   Vulnerabilities: 2
      🟠 High: 1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Score: 85/100
Status: ✅ PASSED
Duration: 12.5s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Week 11 MVP Scope

This is a **minimal viable product** (3 core tests) for Week 11 Beta Launch:

✅ Accessibility (axe-core WCAG checks)  
✅ Performance (Lighthouse + Core Web Vitals)  
✅ Security (OWASP Top 10 basic headers/cookies)

**Not included in Week 11 MVP**:
- Advanced security scanning (XSS, SQLi detection)
- Custom rule configuration
- CI/CD integration plugins
- Historical trend analysis
- Team collaboration features
- Custom dashboards

Full Guardian product (10+ test types) planned for Month 2-3.

## License

MIT © ODAVL Studio
