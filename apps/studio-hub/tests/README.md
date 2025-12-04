# Testing Infrastructure

This directory contains the comprehensive test suite for ODAVL Studio Hub. Our testing strategy ensures 99.9% uptime, <200ms TTFB, and enterprise-grade reliability.

## Test Types

### 1. End-to-End (E2E) Tests
**Location**: `tests/e2e/`  
**Framework**: Playwright  
**Purpose**: Validate user flows across 6 browsers

#### Test Suites
- **auth.spec.ts** (5 tests): Authentication flows, OAuth, redirects
- **dashboard.spec.ts** (6 tests): Dashboard navigation, content display
- **accessibility.spec.ts** (6 tests): WCAG 2.1 AA compliance with Axe
- **i18n.spec.ts** (7 tests): 10 locales, RTL layout, translations
- **visual-regression.spec.ts** (10 tests): Percy screenshot comparison

#### Running E2E Tests
```bash
# All browsers (6 configs)
pnpm exec playwright test

# Specific browser
pnpm exec playwright test --project=chromium

# Headed mode (see browser)
pnpm exec playwright test --headed

# Debug mode with Playwright Inspector
pnpm exec playwright test --debug

# Generate HTML report
pnpm exec playwright show-report
```

#### Browser Coverage
- Chromium (Desktop)
- Firefox (Desktop)
- Safari/WebKit (Desktop)
- Microsoft Edge (Desktop)
- Chrome Mobile (iOS)
- Safari Mobile (iPhone)

### 2. Load Tests
**Location**: `tests/load/`  
**Framework**: k6  
**Purpose**: Validate performance under realistic traffic

#### Test Scenarios
1. **dashboard.js** (29 minutes):
   - Load Profile: 50 → 100 → 200 → 500 concurrent users
   - Thresholds: P95<500ms, P99<1s, error rate <1%
   - Metrics: dashboard_load_time, api_response_time
   
2. **stress-test.js** (25 minutes):
   - Load Profile: 100 → 1200 concurrent users
   - Purpose: Find breaking point, test resilience
   - More lenient thresholds (5% error rate)

#### Running Load Tests
```bash
# Via automation script (recommended)
./scripts/run-load-test.sh

# Interactive mode
./scripts/run-load-test.sh
# Choose: 1) staging, 2) production
# Enter VUs (default: 100)
# Enter duration (default: 5m)

# Direct k6 execution
k6 run tests/load/dashboard.js

# With environment variables
STAGING_URL=https://staging.odavl.com k6 run tests/load/dashboard.js

# Export JSON results
k6 run --out json=reports/load-test.json tests/load/dashboard.js
```

#### Load Test Thresholds
```javascript
// Standard Load Test (dashboard.js)
http_req_duration: p(95) < 500ms    // 95th percentile < 500ms
http_req_duration: p(99) < 1000ms   // 99th percentile < 1s
http_req_failed: rate < 0.01        // Error rate < 1%
dashboard_load_time: p(95) < 800ms  // Dashboard-specific metric
api_response_time: p(95) < 300ms    // API calls < 300ms

// Stress Test (stress-test.js)
http_req_duration: p(95) < 1000ms   // More lenient
http_req_duration: p(99) < 2000ms
http_req_failed: rate < 0.05        // 5% error rate allowed
```

### 3. Unit Tests
**Location**: `tests/unit/`  
**Framework**: Vitest  
**Purpose**: Component and utility function testing

#### Test Coverage
- React components (LanguageSwitcher)
- Utility functions (date formatting, ID generation, class merging)
- Rate limiting logic
- tRPC procedure validation

#### Running Unit Tests
```bash
# All unit tests
pnpm test

# Watch mode (re-run on file change)
pnpm test --watch

# Coverage report
pnpm test:coverage

# UI mode (interactive)
pnpm exec vitest --ui
```

### 4. Accessibility Tests
**Location**: `tests/e2e/accessibility.spec.ts`  
**Framework**: Axe Core + Playwright  
**Purpose**: WCAG 2.1 AA compliance

#### Automated Checks
- ✅ No accessibility violations on key pages
- ✅ Proper heading hierarchy (single h1)
- ✅ All images have alt text
- ✅ Keyboard navigation support
- ✅ Form inputs have labels

#### Running Accessibility Tests
```bash
# All accessibility tests
pnpm exec playwright test tests/e2e/accessibility.spec.ts

# Generate accessibility report
pnpm exec playwright test tests/e2e/accessibility.spec.ts --reporter=html
```

### 5. Visual Regression Tests
**Location**: `tests/e2e/visual-regression.spec.ts`  
**Framework**: Percy + Playwright  
**Purpose**: Detect unintended UI changes

#### Percy Snapshots
- Home page (English)
- All dashboards (Overview, Insight, Autopilot, Guardian)
- Arabic RTL layout
- Mobile responsive (iPhone SE, Pixel 5)
- Tablet responsive (iPad)
- Dark mode

#### Running Visual Tests
```bash
# Requires PERCY_TOKEN environment variable
export PERCY_TOKEN=your_percy_token

# Run with Percy
pnpm exec percy exec -- playwright test tests/e2e/visual-regression.spec.ts

# Local snapshots (no Percy upload)
pnpm exec playwright test tests/e2e/visual-regression.spec.ts
```

## CI/CD Integration

Tests run automatically via GitHub Actions on every push/PR.

### Workflow Jobs
1. **unit-tests**: Vitest with Codecov upload
2. **e2e-tests**: Playwright all browsers (24 tests × 6 = 144 runs)
3. **load-tests**: k6 (main branch only)
4. **accessibility**: Axe compliance checks

### Environment Variables Required
```bash
# Load Testing
STAGING_URL=https://staging.odavl.com
TEST_EMAIL=test@odavl.com
TEST_PASSWORD=secure_password

# Visual Regression
PERCY_TOKEN=your_percy_token

# Coverage Upload
CODECOV_TOKEN=your_codecov_token
```

## Test Configuration

### Playwright (`playwright.config.ts`)
- Test Directory: `./tests/e2e`
- Timeout: 30s per test
- Retries: 2 on CI, 0 locally
- Workers: 1 on CI (parallel locally)
- Reporters: HTML, JSON, JUnit
- Video: Retain on failure
- Screenshots: Only on failure
- Trace: On first retry

### Vitest (`vitest.config.ts`)
- Coverage: Istanbul
- Threshold: 85%
- Test Match: `**/*.{test,spec}.{ts,tsx}`
- Exclude: `dist/`, `.next/`, `node_modules/`
- JSON Reports: `reports/test-results.json`

### k6 Load Test Options
```javascript
{
  scenarios: {
    default: {
      executor: 'ramping-vus',
      stages: [ /* 8 stages, 29 minutes */ ],
      gracefulRampDown: '30s'
    }
  },
  thresholds: { /* Performance SLAs */ }
}
```

## Performance Targets (Tier 1)

| Metric | Target | Test Coverage |
|--------|--------|---------------|
| Uptime | 99.9% | Stress tests |
| TTFB | <200ms | Load tests |
| P95 Response | <500ms | Load tests |
| P99 Response | <1s | Load tests |
| Error Rate | <1% | Load + E2E tests |
| Code Coverage | 85%+ | Unit tests |
| WCAG 2.1 AA | 100% pass | Accessibility tests |
| Visual Consistency | Zero regressions | Percy tests |

## Troubleshooting

### Playwright Issues
```bash
# Install browsers
pnpm exec playwright install --with-deps

# Clear cache
pnpm exec playwright cache clear

# Update snapshots
pnpm exec playwright test --update-snapshots
```

### k6 Issues
```bash
# Install k6 (macOS)
brew install k6

# Install k6 (Windows)
choco install k6

# Install k6 (Linux)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Coverage Issues
```bash
# Clear coverage cache
rm -rf coverage/

# Re-run with coverage
pnpm test:coverage

# View HTML report
open coverage/index.html
```

## Test Maintenance

### Updating E2E Tests
1. Modify test file in `tests/e2e/`
2. Run locally: `pnpm exec playwright test`
3. Commit changes
4. CI will validate across all browsers

### Updating Load Tests
1. Modify scenario in `tests/load/`
2. Test locally: `k6 run tests/load/dashboard.js`
3. Adjust thresholds based on results
4. Commit changes

### Updating Visual Baselines
1. Make UI changes
2. Run Percy tests: `percy exec -- playwright test visual-regression`
3. Review Percy dashboard
4. Approve/reject changes
5. Baselines updated automatically

## Resources

- [Playwright Docs](https://playwright.dev)
- [k6 Docs](https://k6.io/docs)
- [Vitest Docs](https://vitest.dev)
- [Percy Docs](https://docs.percy.io)
- [Axe Core Docs](https://www.deque.com/axe)

## Support

For testing issues, contact:
- DevOps Team: devops@odavl.com
- Quality Assurance: qa@odavl.com
- GitHub Issues: https://github.com/odavl/studio/issues
