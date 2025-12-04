# 🛡️ ODAVL Guardian v4.0

**AI-Powered Pre-Deploy Testing & Launch Protection for Web Applications**

Guardian is an intelligent testing platform that runs comprehensive pre-deployment checks using AI-powered detection, runtime testing, and visual inspection to catch issues before production.

---

## 🚀 Quick Start

### Installation

```bash
npm install -g @odavl-studio/guardian
```

### Basic Usage

```bash
# Run full AI analysis
guardian launch:ai

# Quick static analysis
guardian launch:quick

# Open dashboard
guardian open:dashboard

# Check system status
guardian status
```

---

## ✨ Features

### 🤖 AI-Powered Detection
- **Claude Vision Analysis**: Visual regression detection with 95%+ accuracy
- **Error Pattern Recognition**: ML-powered error classification
- **Root Cause Analysis**: Intelligent failure diagnosis
- **Suggested Fixes**: Actionable remediation with code examples

### 🧪 Runtime Testing
- **Playwright Integration**: Automated browser testing
- **Multi-Platform Support**: Chrome, Firefox, Safari, Edge
- **Performance Profiling**: Core Web Vitals (LCP, FID, CLS)
- **Accessibility Checks**: WCAG 2.1 compliance validation

### 👁️ Visual Inspection
- **Screenshot Comparison**: Pixel-perfect regression detection
- **Layout Analysis**: Element positioning validation
- **Responsive Testing**: Multiple viewport sizes
- **Dark Mode Support**: Theme-specific testing

### 🔍 Error Analysis
- **TypeScript Errors**: Type safety validation
- **ESLint Violations**: Code quality checks
- **Import Cycles**: Circular dependency detection
- **Security Issues**: Vulnerability scanning

### 🤝 Autopilot Integration
- **Handoff Generation**: Structured JSON with full context
- **One-Click Fixes**: Seamless Autopilot execution
- **Undo Snapshots**: Safe rollback mechanism
- **Attestation Chain**: Cryptographic proof of fixes

---

## 📦 Installation & Setup

### Prerequisites

- **Node.js**: >=18.0.0
- **pnpm**: >=9.0.0 (recommended) or npm
- **Anthropic API Key**: For Claude Vision analysis

### Global Installation

```bash
npm install -g @odavl-studio/guardian
```

### Project Installation

```bash
cd your-project
npm install @odavl-studio/guardian --save-dev
```

### Environment Configuration

Create `.env.local` in your project root:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

**Get your API key**: https://console.anthropic.com/

---

## 🎯 Usage Guide

### CLI Commands

#### `guardian launch:ai [path]`

Run full AI-powered analysis with all 4 agents:

```bash
guardian launch:ai ./my-app

# Options:
-p, --platform <platform>  Target platform: chrome|firefox|safari|edge|all (default: all)
--skip-tests               Skip runtime tests (faster, less coverage)
-v, --verbose              Show detailed output
```

**Workflow**:
1. 🏃 **Runtime Testing** (15-20s): Playwright executes user flows
2. 👁️ **Visual Inspection** (10-15s): Claude Vision analyzes screenshots
3. 🔍 **Error Analysis** (5-10s): Detects TypeScript/ESLint/security issues
4. 🤝 **Handoff Generation** (2-3s): Creates structured JSON for Autopilot

**Output**:
```
🛡️  Guardian v4.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏃 Runtime Testing...
   ✅ 12 files scanned (3.2s)
   ✅ ESLint passed (0 errors, 2 warnings)
   ✅ TypeScript passed (0 errors)
   ✅ Build successful (8.7s)

👁️ Visual Inspection...
   ✅ Homepage captured (chrome, 1920x1080)
   ✅ Dashboard captured (chrome, 1920x1080)
   🤖 Claude Vision: 94% confidence
   ⚠️  2 visual anomalies detected

🔍 Error Analysis...
   ✅ Security: 0 critical, 1 medium
   ✅ Performance: LCP 1.8s (good)
   ⚠️  Accessibility: 3 WCAG violations

🤝 Handoff Generated
   📁 .odavl/guardian/handoff-to-autopilot.json
   🔍 5 issues detected, 3 fixable by Autopilot

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Analysis Complete! (25.3s)

Next Steps:
   guardian open:dashboard     View detailed results
   odavl autopilot run         Auto-fix detected issues
```

#### `guardian launch:quick [path]`

Fast static analysis (no browser testing):

```bash
guardian launch:quick ./src

# Runs:
- Package.json validation
- TypeScript type checking
- ESLint linting
- Import cycle detection
- Security scanning
```

**Use when**: Quick validation during development, pre-commit hooks.

#### `guardian open:dashboard`

Launch interactive dashboard in browser:

```bash
guardian open:dashboard
```

**Dashboard Features**:
- 🔄 **Workflow Progress**: Real-time 4-phase tracking
- 📊 **Agent Results**: Detailed findings with confidence scores
- 🤝 **Handoff Viewer**: Visual/JSON dual-mode inspection
- 📈 **Analytics**: Historical trends and metrics

**URL**: `http://localhost:3002`

#### `guardian status`

Check system health and configuration:

```bash
guardian status
```

**Output**:
```
🛡️  Guardian v4.0 Status

Configuration:
   ✅ ANTHROPIC_API_KEY set
   ✅ Playwright installed
   ✅ Node.js v20.10.0 (supported)
   ✅ pnpm 9.12.2 (supported)

Recent Runs:
   ✅ run-20250312143045 (25.3s, 94% confidence)
   ✅ run-20250312121530 (28.7s, 91% confidence)
   ⚠️  run-20250312095412 (failed, timeout)

Storage:
   📁 .odavl/guardian/ (3.2 MB, 12 runs)
   📁 .odavl/attestation/ (48 KB, 8 attestations)
```

---

## 🔧 Configuration

### `.odavl/gates.yml`

Configure governance rules and thresholds:

```yaml
risk_budget: 100
forbidden_paths:
  - security/**
  - auth/**
  - "**/*.spec.*"
actions:
  max_auto_changes: 10
  max_files_per_cycle: 10
enforcement:
  - block_if_risk_exceeded
  - rollback_on_failure
  - require_attestation
thresholds:
  max_risk_per_action: 25
  min_success_rate: 0.75
  visual_confidence: 90
  performance_lcp: 2500  # ms
  accessibility_score: 90
```

### Platform-Specific Settings

#### Chrome

```json
{
  "platform": "chrome",
  "headless": true,
  "viewport": { "width": 1920, "height": 1080 },
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
}
```

#### Firefox

```json
{
  "platform": "firefox",
  "headless": true,
  "viewport": { "width": 1920, "height": 1080 }
}
```

---

## 📚 Programmatic API

### Import Guardian Agents

```typescript
import { GuardianOrchestrator } from '@odavl-studio/guardian';
import { RuntimeAgent, VisualAgent, ErrorAgent, HandoffAgent } from '@odavl-studio/guardian/agents';

// Initialize orchestrator
const guardian = new GuardianOrchestrator({
  workspacePath: process.cwd(),
  platform: 'chrome',
  verbose: true
});

// Run full workflow
const result = await guardian.runAll();
console.log(`Confidence: ${result.overallConfidence}%`);
console.log(`Issues: ${result.totalIssues}`);

// Access handoff data
const handoff = result.handoff;
console.log(handoff.rootCauseAnalysis);
```

### Individual Agent Usage

#### Runtime Agent

```typescript
import { RuntimeAgent } from '@odavl-studio/guardian/agents';

const agent = new RuntimeAgent({
  workspacePath: './my-app',
  platform: 'chrome'
});

const result = await agent.execute();
console.log(`Duration: ${result.performanceMetrics.duration}ms`);
console.log(`Memory: ${result.performanceMetrics.memoryUsed}MB`);
```

#### Visual Agent

```typescript
import { VisualAgent } from '@odavl-studio/guardian/agents';

const agent = new VisualAgent({
  screenshotsPath: './.odavl/guardian/screenshots',
  apiKey: process.env.ANTHROPIC_API_KEY
});

const result = await agent.analyze();
console.log(`Visual Confidence: ${result.confidence}%`);
result.detectedIssues.forEach(issue => {
  console.log(`- ${issue.severity}: ${issue.description}`);
});
```

#### Error Agent

```typescript
import { ErrorAgent } from '@odavl-studio/guardian/agents';

const agent = new ErrorAgent({
  workspacePath: './src'
});

const result = await agent.detect();
console.log(`Errors: ${result.errors.length}`);
console.log(`Warnings: ${result.warnings.length}`);
```

#### Handoff Agent

```typescript
import { HandoffAgent } from '@odavl-studio/guardian/agents';

const agent = new HandoffAgent({
  runtimeResult: runtimeData,
  visualResult: visualData,
  errorResult: errorData
});

const handoff = await agent.generate();
console.log(JSON.stringify(handoff, null, 2));
```

---

## 🤝 Autopilot Integration

### Automatic Handoff

Guardian generates structured JSON for seamless Autopilot execution:

```json
{
  "timestamp": "2025-03-12T14:30:45.123Z",
  "overallConfidence": 94,
  "detectedIssues": [
    {
      "id": "issue-001",
      "type": "accessibility",
      "severity": "high",
      "description": "Missing alt text on 3 images",
      "filePath": "src/components/Gallery.tsx",
      "line": 42,
      "fixable": true
    }
  ],
  "rootCauseAnalysis": "Images in Gallery component lack alt attributes...",
  "suggestedFixes": [
    {
      "issueId": "issue-001",
      "description": "Add descriptive alt text to images",
      "beforeCode": "<img src={src} />",
      "afterCode": "<img src={src} alt={description} />",
      "confidence": 95,
      "estimatedImpact": "high"
    }
  ],
  "nextSteps": [
    "Review 3 suggested fixes in dashboard",
    "Run 'odavl autopilot run' to auto-fix",
    "Re-test with 'guardian launch:ai'"
  ]
}
```

### One-Click Fix Workflow

```bash
# 1. Run Guardian analysis
guardian launch:ai

# 2. Review results in dashboard
guardian open:dashboard

# 3. Execute auto-fixes with Autopilot
odavl autopilot run

# 4. Verify fixes
guardian launch:ai --skip-tests
```

### Manual Handoff Inspection

```bash
# View handoff JSON
cat .odavl/guardian/handoff-to-autopilot.json

# Copy to clipboard (Windows)
type .odavl\guardian\handoff-to-autopilot.json | clip

# Copy to clipboard (macOS)
pbcopy < .odavl/guardian/handoff-to-autopilot.json
```

---

## 📊 Dashboard Guide

### Overview Tab

- **Overall Confidence**: Aggregate confidence across all agents (0-100%)
- **Total Duration**: Time taken for full analysis
- **Phases Complete**: 4/4 agents executed successfully
- **Issues Detected**: Total count by severity (critical, high, medium, low)

### Workflow Progress Tab

Visual timeline of 4 phases:

1. 🏃 **Runtime Testing** (15-20s)
   - Status: pending → running → completed/failed
   - Metrics: Duration, files scanned, tests passed

2. 👁️ **Visual Inspection** (10-15s)
   - Status: pending → running → completed/failed
   - Metrics: Screenshots captured, confidence score

3. 🔍 **Error Analysis** (5-10s)
   - Status: pending → running → completed/failed
   - Metrics: Errors/warnings detected, security issues

4. 🤝 **Handoff Generation** (2-3s)
   - Status: pending → running → completed/failed
   - Metrics: Fixable issues, suggested fixes

### Agent Results Tab

Detailed cards for each agent:

- **Confidence Score**: Color-coded progress bar (green ≥90%, yellow 70-90%, orange 50-70%, red <50%)
- **Performance Metrics**: Duration (ms), memory (MB)
- **Findings**: List with severity badges
- **Suggested Fixes**: Actionable recommendations

### Handoff JSON Tab

Dual-mode viewer:

- **Visual Mode**: Formatted cards with summary, detected issues, root cause, suggested fixes, next steps
- **JSON Mode**: Syntax-highlighted raw JSON

**Actions**:
- 📋 **Copy**: Copy JSON to clipboard
- 📥 **Download**: Save as `.json` file
- 🤖 **Run Autopilot**: Execute auto-fixes (requires Autopilot installed)

---

## 🔍 Troubleshooting

### Common Issues

#### 1. "ANTHROPIC_API_KEY not set"

**Solution**:
```bash
# Add to .env.local
echo "ANTHROPIC_API_KEY=your_key_here" >> .env.local

# Or export temporarily
export ANTHROPIC_API_KEY=your_key_here
```

#### 2. "Playwright browser not found"

**Solution**:
```bash
# Install browsers
npx playwright install chromium firefox

# Or specify platform
guardian launch:ai --platform chrome
```

#### 3. "Port 3002 already in use"

**Solution**:
```bash
# Kill process on port 3002 (Windows)
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Kill process on port 3002 (macOS/Linux)
lsof -ti:3002 | xargs kill -9
```

#### 4. "Analysis timeout"

**Solution**:
```bash
# Skip runtime tests for faster analysis
guardian launch:ai --skip-tests

# Or increase timeout in .odavl/gates.yml
thresholds:
  max_analysis_duration: 120000  # 2 minutes
```

#### 5. "Low visual confidence (<80%)"

**Causes**:
- Complex UI with many animations
- Dynamic content (ads, live data)
- Inconsistent screenshots

**Solutions**:
```bash
# Capture at consistent state
guardian launch:ai --wait-for-network-idle

# Disable animations in test mode
# Add to playwright.config.ts:
use: {
  reducedMotion: 'reduce'
}
```

### Debug Mode

Enable verbose logging:

```bash
guardian launch:ai -v

# Or set environment variable
DEBUG=guardian:* guardian launch:ai
```

**Output**:
```
guardian:runtime Starting Playwright on chrome +0ms
guardian:runtime Navigating to http://localhost:3000 +234ms
guardian:visual Capturing screenshot (1920x1080) +1234ms
guardian:visual Sending to Claude Vision API +345ms
guardian:error Running ESLint on 42 files +0ms
guardian:handoff Generating structured JSON +123ms
```

### Logs Location

- **CLI Logs**: `.odavl/logs/guardian-cli.log`
- **Agent Logs**: `.odavl/logs/guardian-agents.log`
- **Dashboard Logs**: `.odavl/logs/guardian-dashboard.log`

---

## 🧪 Testing

### Unit Tests

```bash
cd odavl-studio/guardian
pnpm test
```

### Integration Tests

```bash
pnpm test:integration
```

### Coverage Report

```bash
pnpm test:coverage
```

**Target**: ≥80% coverage across all agents

---

## 🛠️ Development

### Local Setup

```bash
# Clone repository
git clone https://github.com/odavl-studio/odavl.git
cd odavl/odavl-studio/guardian

# Install dependencies
pnpm install

# Build core + CLI
pnpm build

# Run in dev mode
pnpm dev
```

### Build Commands

```bash
# Build core library
pnpm build:core

# Build CLI
pnpm build:cli

# Build dashboard
pnpm build:dashboard

# Build everything
pnpm build
```

### Testing Locally

```bash
# Link globally
pnpm link --global

# Test in another project
cd /path/to/your/project
guardian launch:ai
```

---

## 📈 Performance

### Benchmarks (v4.0)

| Operation | Duration | Memory | Grade |
|-----------|----------|--------|-------|
| Full Analysis (launch:ai) | ~25s | 180 MB | A |
| Runtime Testing | ~15s | 120 MB | A |
| Visual Inspection | ~10s | 45 MB | A |
| Error Analysis | ~5s | 15 MB | A |
| Handoff Generation | ~2s | 8 MB | A |
| Dashboard Load | <2s | 25 MB | A |

**Tested on**: Intel i7-12700K, 32GB RAM, SSD

### Optimization Tips

1. **Use `--skip-tests`** for quick validation during development
2. **Specify single platform** (`-p chrome`) instead of testing all browsers
3. **Enable caching** in `.odavl/gates.yml`:
   ```yaml
   cache:
     enabled: true
     ttl: 3600  # 1 hour
   ```
4. **Run parallel analysis** on CI/CD (multiple projects):
   ```bash
   guardian launch:ai ./project-1 &
   guardian launch:ai ./project-2 &
   wait
   ```

---

## 🔐 Security

### Vulnerability Scanning

Guardian includes security checks:

- **Dependency Audit**: `npm audit` integration
- **Hardcoded Secrets**: Pattern matching for API keys
- **SQL Injection**: Query validation
- **XSS Vulnerabilities**: Input sanitization checks

### Responsible Disclosure

Found a security issue? Email: security@odavl.com

**Do NOT** open public GitHub issues for security vulnerabilities.

---

## 📄 License

MIT © ODAVL Studio

See [LICENSE](./LICENSE) for full details.

---

## 🙏 Acknowledgments

- **Anthropic Claude**: AI-powered visual analysis
- **Playwright**: Browser automation framework
- **ODAVL Community**: Feedback and contributions

---

## 🔗 Links

- **Homepage**: https://odavl.com/guardian
- **Documentation**: https://docs.odavl.com/guardian
- **GitHub**: https://github.com/odavl-studio/odavl
- **Issues**: https://github.com/odavl-studio/odavl/issues
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)
- **Contributing**: [CONTRIBUTING.md](../../CONTRIBUTING.md)

---

## 🚀 Next Steps

1. **Install Guardian**: `npm install -g @odavl-studio/guardian`
2. **Get API Key**: https://console.anthropic.com/
3. **Run Analysis**: `guardian launch:ai`
4. **Open Dashboard**: `guardian open:dashboard`
5. **Auto-Fix Issues**: `odavl autopilot run`

**Questions?** Open an issue: https://github.com/odavl-studio/odavl/issues/new

---

**Made with ❤️ by ODAVL Studio**
