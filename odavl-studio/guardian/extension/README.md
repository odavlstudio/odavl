# ODAVL Guardian Extension

**Pre-deploy quality gates** - Accessibility, performance, security, and SEO testing before deployment.

## Installation

**From .vsix file:**
```bash
code --install-extension odavl-guardian-vscode-2.0.0.vsix
```

**Or manually in VS Code:**
1. Open Extensions (`Ctrl+Shift+X`)
2. Click `...` menu → "Install from VSIX..."
3. Select `odavl-guardian-vscode-2.0.0.vsix`

**Requirements:**
- VS Code 1.80.0+
- Node.js 20.0.0+
- Playwright (for testing)

## Features

- **Pre-deploy Tests**: Accessibility, Performance, Security, SEO
- **Quality Gates**: Enforce minimum scores before deployment
- **Real-time Monitoring**: Track deployed app health
- **Test Reports**: Detailed results with recommendations

## Commands

- `ODAVL Guardian: Run Pre-Deploy Tests` - Full test suite
- `ODAVL Guardian: Run Accessibility Tests` - WCAG compliance
- `ODAVL Guardian: Run Performance Tests` - Lighthouse metrics
- `ODAVL Guardian: Run Security Tests` - Vulnerability scanning

## Configuration

```json
{
  "odavl-guardian.stagingUrl": "https://staging.myapp.com",
  "odavl-guardian.productionUrl": "https://myapp.com"
}
```

## Test Types

### ♿ Accessibility Testing
- **WCAG 2.1 AA** compliance validation
- **Axe-core** automated testing
- Color contrast analysis
- Keyboard navigation checks
- Screen reader compatibility

### ⚡ Performance Testing
- **Lighthouse** scores (0-100)
- **Core Web Vitals**: LCP, FID, CLS
- Bundle size analysis
- Load time metrics
- Resource optimization

### 🔒 Security Testing
- **OWASP Top 10** vulnerability checks
- Dependency scanning (known CVEs)
- SSL/TLS configuration
- Security headers validation
- XSS/CSRF protection

### 🔍 SEO Testing
- Meta tags validation (title, description)
- Sitemap.xml presence
- Robots.txt configuration
- Open Graph tags
- Schema.org markup

## Example Test Results

```
🛡️ Guardian Test Results

♿ Accessibility: 98/100 ✅
   - WCAG AA: Pass
   - Color contrast: Pass
   - Issues found: 2 (minor)

⚡ Performance: 72/100 ⚠️
   - LCP: 2.8s (needs optimization)
   - FID: 45ms (good)
   - CLS: 0.02 (good)
   - Recommendations: Optimize images, enable caching

🔒 Security: 95/100 ✅
   - OWASP: Pass
   - Dependencies: 1 warning (low severity)
   - Headers: Pass

🔍 SEO: 88/100 ✅
   - Meta tags: Complete
   - Sitemap: Present
   - Recommendations: Add Schema.org markup

Overall Score: 88/100 ✅ (Deployment Approved)
```

## Quality Gates

**Enforce minimum scores before deployment:**

```json
// .odavl/guardian/gates.yml
quality_gates:
  accessibility: 90
  performance: 70
  security: 95
  seo: 80
enforcement: block  # block | warn | ignore
```

## Usage Workflow

1. **Configure URLs** (staging/production)
2. **Run tests** before merge/deploy
3. **Review results** in dashboard
4. **Fix issues** if any gates fail
5. **Re-test** until all gates pass
6. **Deploy** with confidence

## Performance

- **Bundle Size**: 3.2 KB (smallest extension)
- **Compilation**: 7-9ms (fastest)
- **Test Duration**: 30-60s per full suite
- **Parallel Execution**: All 4 test types run concurrently

## License

MIT
