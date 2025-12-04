# 🛡️ Guardian v5.0

**Universal Pre-Deploy Testing Tool for Any Project**

Guardian is an intelligent testing platform that automatically detects your project type and runs comprehensive pre-deployment checks. Works with websites, VS Code extensions, CLI tools, packages, and monorepos - no configuration needed!

---

## 🎯 What's New in v5.0

### 🤖 Smart Auto-Detection
Guardian automatically detects your project type:
- 🌐 **Websites** - Next.js, Vite, CRA, any web app
- 🧩 **Extensions** - VS Code extensions
- ⚙️ **CLI Tools** - Command-line applications
- 📦 **Packages** - Libraries, SDKs, npm packages
- 🏢 **Monorepos** - Multi-package workspaces

### 📊 Dynamic Menu System
Menu adapts based on your project:
```bash
$ guardian

🔍 Detecting project...
✅ Detected: Next.js Website
📊 Confidence: 95%

[1] 🌐 Test Website (Full)
[2] 📊 Custom Test
[3] 🗣️ Language Analysis
[0] Exit
```

### 🏢 Universal Suite Support
Works with **any** monorepo:
```bash
$ cd spotify-workspace
$ guardian

🏢 Spotify Suite Detected
📦 4 products found

[1] 🌐 spotify-web (Website)
[2] 🧩 spotify-extension (Extension)
[3] ⚙️ spotify-cli (CLI)
[4] 📦 spotify-sdk (Package)
[5] 🏢 Test All Products
```

### ✂️ Cleaner, Focused
- ❌ Removed Quick Scan (use ODAVL Insight)
- ❌ Removed System Status (use ODAVL Insight)
- ✅ Focused on pre-deploy testing only
- ✅ Unified test approach per product type

---

## 🚀 Quick Start

### Installation

```bash
# Global installation
npm install -g @odavl-studio/guardian

# Or use with pnpm
pnpm add -g @odavl-studio/guardian
```

### Basic Usage

```bash
# Run Guardian (auto-detects project)
guardian

# Or specify path
guardian /path/to/project

# Open dashboard
guardian dashboard

# Check detected project info
guardian detect
```

---

## ✨ Core Features

### 🔍 Auto-Detection Engine

Guardian uses 5 detection strategies:

**1. Framework Markers**
```typescript
✅ next.config.js → Next.js Website
✅ vite.config.ts → Vite App
✅ .vscodeignore → VS Code Extension
```

**2. Package.json Analysis**
```typescript
✅ "engines": { "vscode": "^1.85.0" } → Extension
✅ "bin": { "mycli": "./dist/index.js" } → CLI Tool
✅ "main" + "exports" → Package
```

**3. Workspace Detection**
```typescript
✅ pnpm-workspace.yaml → Monorepo
✅ lerna.json → Monorepo
✅ packages/ or apps/ → Monorepo
```

**4. Source Code Analysis**
```typescript
✅ Shebang #!/usr/bin/env node → CLI
✅ import * as vscode → Extension
✅ Commander/yargs usage → CLI
```

**5. Directory Structure**
```typescript
✅ public/ + src/ + index.html → Website
✅ src/extension.ts → Extension
✅ packages/ with multiple package.json → Monorepo
```

**Detection Confidence**: 85-95% accuracy on real projects ✅

---

### 🧪 Product-Specific Testing

Each project type has specialized tests:

#### 🌐 Website Testing
```bash
guardian

[1] Test Website (Full)
  → Performance (TTFB, FCP, LCP)
  → SEO (meta tags, sitemap)
  → Security (HTTPS, headers)
  → Accessibility (WCAG 2.1)
  → Visual Regression
  → Multi-Device (mobile, tablet, desktop)
```

#### 🧩 Extension Testing
```bash
guardian

[1] Test Extension
  → Activation performance (<200ms)
  → Marketplace compliance
  → Command registration
  → Configuration schema
  → Telemetry usage
  → Security (no hardcoded keys)
```

#### ⚙️ CLI Testing
```bash
guardian

[1] Test CLI Tool
  → Command execution
  → Help text quality
  → Error messages
  → Auto-completion
  → Update mechanism
  → Cross-platform compatibility
```

#### 📦 Package Testing
```bash
guardian

[1] Test Package
  → Exports validity
  → TypeScript types (.d.ts)
  → Bundle size analysis
  → Tree-shaking support
  → Documentation (README, examples)
  → Breaking changes detection
```

#### 🏢 Suite Testing
```bash
guardian

[5] Test All Products
  → Auto-detects all packages
  → Runs appropriate test per type
  → Impact analysis (dependencies)
  → Overall health score
  → Comprehensive report
```

---

## 📊 How It Works

### Detection Flow

```
1. Start Guardian
   ↓
2. Scan workspace
   ↓
3. Check framework markers (next.config.js, etc.)
   ↓
4. Analyze package.json (dependencies, fields)
   ↓
5. Detect workspace type (monorepo vs single)
   ↓
6. Calculate confidence (0-100)
   ↓
7. Generate adaptive menu
   ↓
8. Show project-specific options
```

### Test Execution Flow

```
1. User selects test option
   ↓
2. Guardian validates environment
   ↓
3. Runs appropriate tester
   ↓
4. Collects results
   ↓
5. Generates report
   ↓
6. Saves to .guardian/ directory
   ↓
7. Opens dashboard (optional)
```

---

## 🎯 Usage Examples

### Example 1: Next.js Website

```bash
$ cd my-next-app
$ guardian

🔍 Detecting project...
✅ Detected: Next.js Website
📦 Framework: next.js (14.0.0)
🎯 Confidence: 95%

╔════════════════ 🛡️ Guardian v5.0 ═══════════════╗
║                                                  ║
║  📦 Project: my-next-app                         ║
║  🌐 Type: Next.js Website                        ║
║                                                  ║
║  [1] 🌐 Test Website (Full)                     ║
║      → Performance, SEO, Security, A11y          ║
║                                                  ║
║  [2] 📊 Custom Test                              ║
║      → Select specific tests                     ║
║                                                  ║
║  [3] 🗣️ Language Analysis                        ║
║      → Detect all languages used                 ║
║                                                  ║
║  [0] 🚪 Exit                                     ║
║                                                  ║
╚══════════════════════════════════════════════════╝

Your choice: 1

🧪 Running Website Tests...

✅ Performance Testing (5.2s)
   TTFB: 180ms (excellent)
   FCP: 1.2s (good)
   LCP: 2.1s (needs improvement)

✅ SEO Analysis (2.1s)
   Meta tags: 8/10
   Sitemap: Found ✓
   robots.txt: Found ✓

✅ Security Check (1.8s)
   HTTPS: Enabled ✓
   Security headers: 9/12
   CSP: Configured ✓

✅ Accessibility (3.4s)
   WCAG 2.1 Level AA: 94%
   Issues found: 3 minor

📊 Overall Score: 87/100 (Good)

📁 Report saved to: .guardian/reports/website-2025-12-01.json
🌐 View dashboard: guardian dashboard
```

### Example 2: VS Code Extension

```bash
$ cd my-vscode-extension
$ guardian

🔍 Detecting project...
✅ Detected: VS Code Extension
🧩 Engine: vscode ^1.85.0
🎯 Confidence: 95%

╔════════════════ 🛡️ Guardian v5.0 ═══════════════╗
║                                                  ║
║  📦 Project: my-vscode-extension                 ║
║  🧩 Type: VS Code Extension                      ║
║                                                  ║
║  [1] 🧩 Test Extension                           ║
║      → Activation, Commands, Marketplace         ║
║                                                  ║
║  [2] 📊 Custom Test                              ║
║  [3] 🗣️ Language Analysis                        ║
║                                                  ║
║  [0] 🚪 Exit                                     ║
║                                                  ║
╚══════════════════════════════════════════════════╝

Your choice: 1

🧪 Running Extension Tests...

✅ Activation Performance (0.8s)
   Startup time: 142ms ✓
   Lazy loading: Enabled ✓

✅ Command Registration (1.2s)
   Commands: 8 registered ✓
   Keybindings: 4 configured ✓

✅ Marketplace Compliance (2.1s)
   Icon: Valid (128x128) ✓
   Categories: Correct ✓
   Keywords: 5/5 ✓

✅ Security Check (1.5s)
   No hardcoded API keys ✓
   Safe API usage ✓

📊 Overall Score: 93/100 (Excellent)
```

### Example 3: Monorepo

```bash
$ cd spotify-workspace
$ guardian

🔍 Detecting project...
✅ Detected: Monorepo (pnpm)
🏢 Suite: Spotify
📦 Products: 4 detected
🎯 Confidence: 95%

╔════════════════ 🛡️ Guardian v5.0 ═══════════════╗
║                                                  ║
║  🏢 Spotify Suite                                ║
║  📦 4 products detected                          ║
║                                                  ║
║  [1] 🌐 spotify-web (Website)                   ║
║  [2] 🧩 spotify-vscode (Extension)              ║
║  [3] ⚙️ spotify-cli (CLI Tool)                   ║
║  [4] 📦 spotify-sdk (Package)                    ║
║                                                  ║
║  [5] 🏢 Test All Products                        ║
║      → Full suite validation                     ║
║                                                  ║
║  [6] 🗣️ Language Analysis                        ║
║  [7] 🌐 Open Dashboard                           ║
║                                                  ║
║  [0] 🚪 Exit                                     ║
║                                                  ║
╚══════════════════════════════════════════════════╝

Your choice: 5

🧪 Running Suite Tests...

[1/4] Testing spotify-web (Website)...
      ✅ Performance: 89/100
      ✅ SEO: 92/100
      ⏱️ 8.2s

[2/4] Testing spotify-vscode (Extension)...
      ✅ Activation: 95/100
      ✅ Marketplace: 98/100
      ⏱️ 3.4s

[3/4] Testing spotify-cli (CLI)...
      ✅ Commands: 91/100
      ✅ Help text: 88/100
      ⏱️ 2.7s

[4/4] Testing spotify-sdk (Package)...
      ✅ Exports: 96/100
      ✅ Types: 100/100
      ⏱️ 4.1s

🔗 Impact Analysis...
   Changed packages: 1 (spotify-sdk)
   Affected packages: 2 (spotify-web, spotify-cli)

📊 Suite Health: 93/100 (Excellent)
⏱️ Total time: 18.4s
```

---

## 🔧 Configuration

### Optional Configuration File

Create `guardian.config.json` in your project root:

```json
{
  "project": {
    "name": "My Awesome Project",
    "type": "website"
  },
  "testing": {
    "skipPerformance": false,
    "skipVisual": false,
    "devices": ["mobile", "tablet", "desktop"]
  },
  "thresholds": {
    "performance": {
      "ttfb": 200,
      "fcp": 1500,
      "lcp": 2500
    },
    "accessibility": {
      "minScore": 90
    }
  }
}
```

### Environment Variables

```env
# Guardian settings
GUARDIAN_SKIP_TESTS=false
GUARDIAN_VERBOSE=false

# Dashboard (if using Guardian App)
GUARDIAN_DASHBOARD_PORT=3002
```

---

## 📁 Project Structure

```
your-project/
├── .guardian/                   # Guardian output directory
│   ├── reports/                 # Test reports (JSON)
│   │   ├── website-2025-12-01.json
│   │   └── latest.json          # Symlink to latest
│   ├── screenshots/             # Visual testing
│   │   ├── baseline/
│   │   └── current/
│   ├── cache/                   # Detection cache
│   │   └── project-info.json
│   └── logs/                    # Execution logs
│       └── guardian.log
├── guardian.config.json         # Optional config
└── ...your files
```

---

## 🎓 Advanced Usage

### Custom Test Selection

```bash
$ guardian

Your choice: 2  # Custom Test

╔════════════ Custom Test Configuration ══════════╗
║                                                  ║
║  Select tests to run:                            ║
║                                                  ║
║  [✓] Performance Testing                         ║
║  [✓] Visual Regression                           ║
║  [ ] Multi-Device Testing                        ║
║  [✓] Accessibility                               ║
║  [ ] SEO Analysis                                ║
║                                                  ║
║  [Enter] Run Selected Tests                      ║
║  [ESC] Cancel                                    ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

### Language Analysis

```bash
$ guardian

Your choice: 3  # Language Analysis

🗣️ Analyzing languages...

📊 Languages Detected:
   TypeScript: 12,450 lines (68.2%)
   JavaScript: 3,210 lines (17.6%)
   CSS: 1,890 lines (10.3%)
   JSON: 560 lines (3.1%)
   Markdown: 145 lines (0.8%)

🔍 Detailed Analysis:
   ✅ No mixed JS/TS files
   ✅ Consistent style (ESLint)
   ⚠️ 3 files missing TypeScript types
   ℹ️ Consider: Migrate remaining JS to TS

📁 Report saved to: .guardian/reports/languages.json
```

### CLI Commands

```bash
# Detection only (no testing)
guardian detect

# Open dashboard directly
guardian dashboard

# Show configuration
guardian config show

# Clear cache
guardian cache clear

# Show version
guardian --version

# Help
guardian --help
```

---

## 📊 Dashboard

Guardian includes an optional web dashboard for visualizing test results:

```bash
guardian dashboard
```

Opens at: `http://localhost:3002`

**Features:**
- 📊 Test history and trends
- 📈 Performance charts
- 🔍 Detailed error inspection
- 📸 Screenshot comparison
- 📦 Suite-wide overview

---

## 🔌 Integration

### GitHub Actions

```yaml
name: Guardian Pre-Deploy

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - name: Install Guardian
        run: pnpm add -g @odavl-studio/guardian
      
      - name: Run Guardian Tests
        run: guardian
        
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: guardian-report
          path: .guardian/reports/latest.json
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🛡️ Running Guardian checks..."
guardian detect

if [ $? -ne 0 ]; then
  echo "❌ Guardian checks failed"
  exit 1
fi
```

---

## 🆚 Migration from v4.0

### Breaking Changes

**Removed Commands:**
- ❌ `guardian launch:quick` → Use ODAVL Insight instead
- ❌ `guardian status` → Use ODAVL Insight instead
- ❌ `guardian context` → Now auto-detected

**Changed Behavior:**
- ✅ Auto-detection is now default (no manual selection)
- ✅ Menu adapts to project type
- ✅ Works with any project (not just ODAVL)

### Migration Steps

**Before (v4.0):**
```bash
guardian launch:ai ./my-app
guardian context show
```

**After (v5.0):**
```bash
cd my-app
guardian  # Auto-detects and shows menu
```

**Configuration Changes:**
- No breaking changes to `guardian.config.json`
- New fields are optional
- Old configs still work

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for details.

---

## 🤝 Integration with ODAVL Studio

Guardian v5.0 is part of the ODAVL Studio suite:

- **ODAVL Insight** 🧠: Error detection and analysis
- **ODAVL Autopilot** 🤖: Automated code improvements
- **ODAVL Guardian** 🛡️: Pre-deploy testing ← You are here

**Workflow:**
1. **Insight** detects issues during development
2. **Autopilot** fixes issues automatically
3. **Guardian** validates before deployment

Guardian focuses on **pre-deploy testing only** - use Insight for detection and health monitoring.

---

## 📚 Documentation

- [User Guide](./GUARDIAN_USER_GUIDE.md) - Comprehensive guide
- [Migration Guide](./MIGRATION_GUIDE.md) - v4 → v5 changes
- [API Reference](./API.md) - Programmatic usage
- [Configuration](./CONFIGURATION.md) - All options

---

## 🐛 Troubleshooting

### Detection Issues

**Problem**: Guardian detects wrong project type

**Solution**:
```bash
# Override detection with config
echo '{"project": {"type": "website"}}' > guardian.config.json
```

**Problem**: Monorepo not detected

**Solution**:
```bash
# Ensure you have:
# - pnpm-workspace.yaml, or
# - lerna.json, or
# - packages/ or apps/ directory
```

### Test Failures

**Problem**: Website tests fail with "Connection refused"

**Solution**:
```bash
# Ensure dev server is running
npm run dev  # or pnpm dev

# Then run Guardian
guardian
```

**Problem**: Extension tests fail with "Extension not found"

**Solution**:
```bash
# Build extension first
pnpm build

# Then test
guardian
```

---

## 🎯 Best Practices

### 1. Run Before Every Deploy
```bash
# In CI/CD
guardian
if [ $? -ne 0 ]; then
  echo "Tests failed, blocking deploy"
  exit 1
fi
```

### 2. Use Custom Tests for Speed
```bash
# Quick check (performance only)
guardian → [2] Custom Test → Select Performance

# Full check (everything)
guardian → [1] Test Website (Full)
```

### 3. Monitor Trends
```bash
# Open dashboard regularly
guardian dashboard

# Check health score trends
# Aim for 90+ consistently
```

### 4. Fix Issues Immediately
```bash
# Don't ignore warnings
# Address accessibility issues
# Optimize performance metrics
```

---

## 📈 Performance Tips

**Guardian Runtime:**
- Single package: ~10-30 seconds
- Monorepo (4 products): ~20-60 seconds
- Custom tests: ~5-15 seconds

**Optimization:**
- Use custom tests to skip unnecessary checks
- Cache detection results (automatic)
- Run tests in parallel (monorepo mode)

---

## 🔐 Security & Privacy

- ✅ All tests run **locally** (no cloud dependencies)
- ✅ No data sent to external servers
- ✅ Dashboard runs on **localhost only**
- ✅ Reports stored in `.guardian/` (add to `.gitignore` if sensitive)

---

## 📝 License

MIT License - See [LICENSE](../../LICENSE) for details

---

## 🙏 Contributing

Contributions welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md)

---

## 🆘 Support

- 📧 Email: support@odavl.com
- 💬 Discord: [ODAVL Community](https://discord.gg/odavl)
- 🐛 Issues: [GitHub Issues](https://github.com/odavl/odavl-studio/issues)
- 📚 Docs: [docs.odavl.com](https://docs.odavl.com)

---

**Made with ❤️ by the ODAVL Studio team**

🚀 **Ready to start?** → `npm install -g @odavl-studio/guardian && guardian`
