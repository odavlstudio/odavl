# Guardian User Documentation Hub

**Version**: 1.0.0  
**Last Updated**: November 16, 2025  
**Target Audience**: Beta users, developers, QA engineers

---

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Core Concepts](#core-concepts)
4. [Test Runners](#test-runners)
5. [Monitoring](#monitoring)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)
8. [FAQs](#faqs)

---

## 🚀 Quick Start

Get up and running with Guardian in 5 minutes.

### 1. Install CLI

```bash
npm install -g @guardian/cli
# or
pnpm add -g @guardian/cli
```

### 2. Configure API Key

```bash
export GUARDIAN_API_KEY=gsk_your_key_here
# or add to .env
echo "GUARDIAN_API_KEY=gsk_your_key_here" >> .env
```

### 3. Run Your First Test

```bash
guardian run ./tests --project=my-app
```

**Expected Output:**

```
✓ Connecting to Guardian...
✓ Running 15 tests across 3 browsers
✓ Test suite completed in 2.3s
✓ All tests passed! 🎉

View results: https://guardian.app/org/runs/123
```

---

## 📦 Installation

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm/pnpm/yarn**: Latest stable version
- **Git**: For version control integration

### Installation Methods

#### Method 1: Global CLI (Recommended)

```bash
npm install -g @guardian/cli
```

#### Method 2: Project Dependency

```bash
cd your-project
npm install --save-dev @guardian/cli
```

#### Method 3: Docker

```bash
docker run -it guardian/cli:latest
```

### Verify Installation

```bash
guardian --version
# Output: @guardian/cli v1.0.0

guardian doctor
# Checks: Node.js, API key, connectivity
```

---

## 🧠 Core Concepts

### Organizations

Organizations are the top-level container for your teams and projects.

```typescript
// Create organization via API
const org = await guardian.organizations.create({
  name: 'Acme Corp',
  slug: 'acme-corp',
  tier: 'pro',
});
```

### Test Runs

Test runs represent a single execution of your test suite.

**Anatomy of a Test Run:**

```json
{
  "id": "run_123",
  "name": "playwright-chromium-login-tests",
  "framework": "playwright",
  "browser": "chromium",
  "status": "passed",
  "totalTests": 15,
  "passedTests": 15,
  "failedTests": 0,
  "duration": 2300,
  "startedAt": "2025-11-16T10:00:00Z",
  "completedAt": "2025-11-16T10:00:02Z"
}
```

### Monitors

Monitors continuously check your application's health.

**Monitor Types:**

1. **HTTP Monitor** - Endpoint health checks
2. **API Monitor** - API response validation
3. **Browser Monitor** - E2E user flows
4. **Ping Monitor** - Basic connectivity

---

## 🧪 Test Runners

### Playwright

```bash
# Basic run
guardian run ./tests/e2e --framework=playwright

# With options
guardian run ./tests/e2e \
  --framework=playwright \
  --browsers=chromium,firefox \
  --workers=4 \
  --retries=2
```

**Configuration File (`guardian.config.ts`):**

```typescript
import { defineConfig } from '@guardian/cli';

export default defineConfig({
  framework: 'playwright',
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 2,
  workers: 4,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  browsers: ['chromium', 'firefox', 'webkit'],
});
```

### Cypress

```bash
guardian run ./cypress/e2e --framework=cypress
```

**Configuration:**

```json
{
  "framework": "cypress",
  "testDir": "./cypress/e2e",
  "baseUrl": "http://localhost:3000",
  "video": true,
  "screenshotOnRunFailure": true
}
```

### Jest

```bash
guardian run ./tests --framework=jest --coverage
```

**Configuration:**

```json
{
  "framework": "jest",
  "testDir": "./tests",
  "collectCoverage": true,
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

---

## 📊 Monitoring

### Create HTTP Monitor

```typescript
const monitor = await guardian.monitors.create({
  name: 'API Health Check',
  type: 'http',
  url: 'https://api.example.com/health',
  interval: 300, // 5 minutes
  timeout: 30000, // 30 seconds
  expectedStatus: 200,
  alerts: {
    email: ['team@example.com'],
    slack: ['#alerts'],
  },
});
```

### Monitor Dashboard

Access real-time monitoring at: `https://guardian.app/org/monitors`

**Key Metrics:**

- **Uptime**: 99.95% (last 30 days)
- **Avg Response Time**: 145ms
- **Total Checks**: 12,456
- **Failed Checks**: 6

### Alerts

Configure alerts for monitor failures:

```typescript
await guardian.monitors.update(monitorId, {
  alerts: {
    channels: ['email', 'slack', 'webhook'],
    thresholds: {
      downtime: 300, // 5 minutes
      responseTime: 5000, // 5 seconds
      errorRate: 5, // 5%
    },
  },
});
```

---

## 🔌 API Reference

### Authentication

All API requests require an API key:

```bash
curl https://api.guardian.app/v1/test-runs \
  -H "Authorization: Bearer gsk_your_key_here"
```

### Test Runs

#### List Test Runs

```bash
GET /api/v1/test-runs?organization=org_123&page=1&limit=20
```

**Response:**

```json
{
  "runs": [
    {
      "id": "run_123",
      "name": "playwright-tests",
      "status": "passed",
      "totalTests": 15,
      "passedTests": 15,
      "duration": 2300
    }
  ],
  "total": 156,
  "page": 1,
  "pages": 8
}
```

#### Create Test Run

```bash
POST /api/v1/test-runs
```

**Request Body:**

```json
{
  "organizationId": "org_123",
  "name": "playwright-chromium-tests",
  "framework": "playwright",
  "browser": "chromium",
  "totalTests": 15
}
```

### Monitors

#### List Monitors

```bash
GET /api/v1/monitors?organization=org_123
```

#### Create Monitor

```bash
POST /api/v1/monitors
```

**Request Body:**

```json
{
  "organizationId": "org_123",
  "name": "API Health Check",
  "type": "http",
  "url": "https://api.example.com/health",
  "interval": 300,
  "timeout": 30000
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. API Key Not Found

**Error:**

```
Error: GUARDIAN_API_KEY not found in environment
```

**Solution:**

```bash
export GUARDIAN_API_KEY=gsk_your_key_here
# or
echo "GUARDIAN_API_KEY=gsk_your_key_here" >> .env
```

#### 2. Tests Not Running

**Error:**

```
Error: No tests found in ./tests
```

**Solution:**

```bash
# Check test directory
ls -la ./tests

# Verify glob pattern
guardian run ./tests/**/*.spec.ts
```

#### 3. Connection Timeout

**Error:**

```
Error: Request timeout after 30s
```

**Solution:**

```bash
# Increase timeout
guardian run ./tests --timeout=60000

# Or in config
{
  "timeout": 60000
}
```

### Debug Mode

Enable verbose logging:

```bash
GUARDIAN_DEBUG=true guardian run ./tests
```

### Contact Support

- **Email**: support@guardian.app
- **Slack**: [Join Community](https://guardian.app/slack)
- **GitHub**: [Report Issue](https://github.com/guardian/cli/issues)

---

## ❓ FAQs

### General

**Q: Is Guardian self-hosted?**  
A: Yes! Guardian can be self-hosted or used as a cloud service.

**Q: What test frameworks are supported?**  
A: Playwright, Cypress, Jest, Vitest, Mocha, and more.

**Q: Can I use Guardian in CI/CD?**  
A: Absolutely! Guardian integrates with GitHub Actions, GitLab CI, Jenkins, etc.

### Pricing

**Q: Is there a free tier?**  
A: Yes! Free tier includes:

- 100 test runs/month
- 1,000 monitor checks/month
- 10,000 API calls/month

**Q: What's included in Pro tier?**  
A: Pro tier ($49/month) includes:

- Unlimited test runs
- Unlimited monitor checks
- Unlimited API calls
- Priority support

### Security

**Q: Is my data encrypted?**  
A: Yes! All data is encrypted at rest (AES-256) and in transit (TLS 1.3).

**Q: Do you support 2FA?**  
A: Yes! TOTP-based 2FA with backup codes.

**Q: Where is data stored?**  
A: US (Virginia), EU (Frankfurt), Asia (Singapore) - you choose.

### Integration

**Q: Can I export test results?**  
A: Yes! Export to JSON, CSV, JUnit XML, or HTML.

**Q: Do you have webhooks?**  
A: Yes! Webhooks for test completions, monitor failures, etc.

**Q: Can I integrate with Slack?**  
A: Yes! Real-time notifications to Slack channels.

---

## 📹 Video Tutorials

1. [Getting Started (5 min)](https://guardian.app/tutorials/getting-started)
2. [Running Your First Test (10 min)](https://guardian.app/tutorials/first-test)
3. [Setting Up Monitors (15 min)](https://guardian.app/tutorials/monitors)
4. [CI/CD Integration (20 min)](https://guardian.app/tutorials/cicd)

---

## 🎓 Advanced Topics

- [Custom Reporters](./docs/advanced/custom-reporters.md)
- [Parallel Execution](./docs/advanced/parallel-execution.md)
- [Test Sharding](./docs/advanced/test-sharding.md)
- [Self-Hosting Guide](./docs/advanced/self-hosting.md)

---

**Need help?** Join our [community Slack](https://guardian.app/slack) or email [support@guardian.app](mailto:support@guardian.app)
