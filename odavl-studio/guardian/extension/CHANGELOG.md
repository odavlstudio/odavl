# Changelog

All notable changes to the ODAVL Guardian extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-22

### Added
- Pre-deploy testing suite:
  - **Accessibility testing** - WCAG 2.1 compliance checks
  - **Performance testing** - Lighthouse scores, Core Web Vitals
  - **Security testing** - OWASP checks, dependency scanning
  - **Quality gates** - Enforce minimum thresholds before deployment

- Test execution:
  - Run tests against staging/production URLs
  - Parallel test execution for speed
  - Detailed test reports with pass/fail indicators
  - Screenshot capture for visual regression

- Quality gate enforcement:
  - Configurable thresholds for each test type
  - Block deployment if gates fail
  - Override option with justification required
  - Audit trail of all gate decisions

- Commands:
  - "ODAVL Guardian: Run Pre-Deploy Tests" - Full test suite
  - "ODAVL Guardian: Run Accessibility Tests" - Accessibility only
  - "ODAVL Guardian: Run Performance Tests" - Performance only
  - "ODAVL Guardian: Run Security Tests" - Security only

- Configuration:
  - `stagingUrl` - Staging environment URL for testing
  - `productionUrl` - Production URL for comparison
  - Quality gate thresholds (accessibility, performance, security)

- Dashboard:
  - Real-time test status with progress indicators
  - Historical test results with trend charts
  - Test report export (JSON, HTML formats)
  - Integration with CI/CD pipelines

### Performance
- Test execution: 30-60 seconds (full suite)
- Accessibility tests: ~10 seconds
- Performance tests: ~20 seconds
- Security tests: ~15 seconds

[0.1.0]: https://github.com/odavl-studio/odavl/releases/tag/guardian-v0.1.0
