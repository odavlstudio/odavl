# Guardian Core - Troubleshooting Guide

Common issues and solutions for ODAVL Guardian Core.

## Installation Issues

### Issue: Puppeteer fails to install

**Error**:
```
ERROR: Failed to download Chromium
```

**Solution**:
```bash
# Set Puppeteer to skip download, use system Chrome
export PUPPETEER_SKIP_DOWNLOAD=true
pnpm install

# Or install with system Chrome
pnpm install --unsafe-perm=true
```

### Issue: Lighthouse fails with "Cannot find module"

**Error**:
```
Error: Cannot find module 'lighthouse'
```

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Runtime Issues

### Issue: "No usable sandbox" error on Linux

**Error**:
```
Error: Failed to launch browser: No usable sandbox!
```

**Solution**:
```bash
# Option 1: Install Chrome dependencies
sudo apt-get install -y \
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxi6 \
  libxtst6 \
  libnss3 \
  libcups2 \
  libxss1 \
  libxrandr2 \
  libasound2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libpangocairo-1.0-0 \
  libgtk-3-0

# Option 2: Run with --no-sandbox (less secure, CI only)
# Guardian already uses --no-sandbox flag internally
```

### Issue: Tests timeout on slow sites

**Error**:
```
Error: Navigation timeout of 30000 ms exceeded
```

**Solution**:
```typescript
// Option 1: Test faster staging/preview URL instead
guardian test https://preview.example.com

// Option 2: Custom timeout (fork Guardian and modify)
await page.goto(url, { 
  waitUntil: 'networkidle2', 
  timeout: 60000  // 60s instead of 30s
});
```

### Issue: Memory errors with Lighthouse

**Error**:
```
Error: FATAL ERROR: Ineffective mark-compacts near heap limit
```

**Solution**:
```bash
# Increase Node.js heap size
NODE_OPTIONS="--max-old-space-size=4096" guardian test https://example.com

# Or in package.json script:
{
  "scripts": {
    "test:guardian": "NODE_OPTIONS='--max-old-space-size=4096' guardian test"
  }
}
```

## Test Result Issues

### Issue: Accessibility score is unexpectedly low

**Diagnosis**:
```bash
# Get detailed violations
guardian test https://example.com --json | jq '.tests.accessibility.violations'
```

**Common causes**:
- Missing alt text on images
- Low color contrast (WCAG AA requires 4.5:1 for text)
- Form inputs without labels
- Heading hierarchy skipped (h1 → h3 without h2)

**Solution**: Fix violations shown in report, prioritize critical/serious issues first.

### Issue: Performance score varies between runs

**Cause**: Network conditions, server load, browser state

**Solution**:
```bash
# Run multiple times and average
for i in {1..5}; do
  guardian test https://example.com --json >> results.json
done

# Calculate average (requires jq)
jq -s 'map(.tests.performance.scores.performance) | add / length' results.json
```

### Issue: Security score fails due to missing headers

**Common missing headers**:
```
❌ Missing HSTS header
❌ Missing CSP header
❌ Missing X-Frame-Options header
```

**Solution**: Add headers in your web server config:

**Nginx**:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
```

**Apache**:
```apache
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header always set Content-Security-Policy "default-src 'self'"
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
```

**Next.js** (`next.config.js`):
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};
```

## CI/CD Integration Issues

### Issue: Guardian fails in Docker containers

**Error**:
```
Error: Failed to launch browser: Could not find Chrome
```

**Solution**: Use Puppeteer Docker image:
```dockerfile
FROM ghcr.io/puppeteer/puppeteer:21.0.0

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm add -g @odavl-studio/guardian-core

CMD ["guardian", "test", "http://localhost:3000"]
```

### Issue: GitHub Actions fails with permission errors

**Error**:
```
Error: EACCES: permission denied
```

**Solution**:
```yaml
# Add to GitHub Actions workflow
- name: Fix permissions
  run: |
    sudo chown -R $(whoami) ~/.cache
    sudo chown -R $(whoami) node_modules
```

### Issue: Tests fail in CI but pass locally

**Common causes**:
1. Different Node.js versions
2. Missing environment variables
3. Different network conditions

**Solution**:
```yaml
# Match local Node.js version
- uses: actions/setup-node@v4
  with:
    node-version: '20.x'  # Match your local version

# Enable debug logs
- name: Run Guardian with debug
  run: DEBUG=* guardian test http://localhost:3000
```

## Performance Optimization

### Issue: Tests take too long (> 30 seconds)

**Solution**: Run tests in parallel for multiple URLs:
```typescript
// Sequential (slow)
for (const url of urls) {
  await guardianTest(url);
}

// Parallel (fast)
await Promise.all(urls.map(url => guardianTest(url)));
```

### Issue: High memory usage

**Solution**:
```typescript
// Close browser between tests
for (const url of urls) {
  const result = await guardianTest(url);
  // Browser is automatically closed after each test
  results.push(result);
}
```

## Getting Help

If you encounter issues not listed here:

1. **Check logs**: Run with `DEBUG=*` for verbose output
2. **GitHub Issues**: https://github.com/odavl/odavl-studio/issues
3. **Discord**: Join ODAVL community for real-time help
4. **Documentation**: https://odavl.studio/docs/guardian

### Reporting Bugs

Include:
- Guardian version (`guardian --version`)
- Node.js version (`node --version`)
- Operating system
- Full error message
- Steps to reproduce
- Example URL (if public)

**Template**:
```markdown
**Guardian Version**: 0.1.0
**Node.js Version**: 20.10.0
**OS**: Ubuntu 22.04
**Error**:
```
[paste error here]
```

**Steps to reproduce**:
1. Run `guardian test https://example.com`
2. Error occurs after ~10 seconds

**Expected**: Test should complete successfully
**Actual**: Timeout error
```
