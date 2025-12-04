# 🚀 Getting Started with ODAVL Studio

Welcome to **ODAVL Studio v2.0**! This guide will get you up and running in **5 minutes**.

---

## 📋 Prerequisites

Before you start, make sure you have:

- ✅ **Node.js** 18.18+ ([download](https://nodejs.org/))
- ✅ **pnpm** 9.12+ (`npm install -g pnpm`)
- ✅ **Git** (for cloning the repository)

**Optional (for full features):**
- VS Code 1.85+ (for extensions)
- PostgreSQL 15+ (for Insight Cloud dashboard)

---

## ⚡ Quick Start (3 Commands)

```bash
# 1. Install dependencies
pnpm install

# 2. Build all packages
pnpm build

# 3. Try your first command
pnpm odavl:insight
```

**🎉 Done!** You now have access to all three products.

---

## 🎯 Your First Workflow

### Step 1: Detect Errors with Insight

```bash
pnpm odavl:insight
```

You'll see an **interactive menu**:

```
🔍 ODAVL Insight - Error Detection

Choose a detector:
  1. typescript      - TypeScript errors & type issues
  2. eslint          - ESLint violations
  3. security        - Security vulnerabilities ⚠️
  4. all             - Run ALL detectors (comprehensive)

Enter your choice (1-14):
```

**Try option 4** (all) for a comprehensive analysis.

**What it does:**
- Scans your entire codebase
- Detects 12 types of issues
- Provides actionable fix suggestions
- Exports to VS Code Problems Panel

**Expected output:**
```
✅ Analysis complete!
   • 23 TypeScript errors found
   • 12 ESLint warnings
   • 2 security vulnerabilities (HIGH)
   
📊 Results saved to: .odavl/problems-panel-export.json
```

---

### Step 2: Auto-Fix with Autopilot

```bash
pnpm odavl:autopilot run
```

**What happens:**
1. **Observe**: Collects metrics (ESLint + TypeScript)
2. **Decide**: Selects best recipe using ML (80% accuracy)
3. **Act**: Applies the fix automatically
4. **Verify**: Checks if quality improved
5. **Learn**: Updates trust scores

**Example output:**
```
🔄 Starting ODAVL Full Loop (O→D→A→V→L)...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Phase 1: OBSERVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Detected 23 total issues

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 Phase 2: DECIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Selected Recipe: fix-unused-imports (trust: 0.87)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Phase 3: ACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Fixed 8 files (12 imports removed)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Phase 4: VERIFY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Quality improved! Issues: 23 → 15

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 Phase 5: LEARN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Trust score updated: 0.87 → 0.89

🎉 Cycle complete! Your code is now cleaner.
```

**Safety features:**
- ✅ Automatic undo snapshots before changes
- ✅ Risk budget constraints (max 10 files, 40 LOC)
- ✅ Protected paths (security/, auth/, tests/)
- ✅ Rollback with: `pnpm odavl:autopilot undo`

---

### Step 3: Test Your Site with Guardian

```bash
pnpm odavl:guardian test https://example.com
```

**What it tests:**
- ✅ **Accessibility**: WCAG 2.1 Level AA compliance
- ✅ **Performance**: Core Web Vitals (LCP, FID, CLS)
- ✅ **Security**: OWASP Top 10, CSP headers
- ✅ **Mobile**: Responsive design validation

**Example output:**
```
🛡️ ODAVL Guardian - Full Test Suite

Testing: https://example.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
♿ Accessibility Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ WCAG 2.1 Level AA: PASS (12/12 checks)
✅ ARIA validation: PASS
✅ Color contrast: PASS
⚠️ Skip links: Missing (1 warning)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Performance Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ LCP: 1.2s (target: <2.5s)
✅ FID: 45ms (target: <100ms)
✅ CLS: 0.05 (target: <0.1)
✅ TTFB: 320ms (target: <600ms)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 Security Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ HTTPS: Enabled
⚠️ CSP header: Missing (1 warning)
✅ X-Frame-Options: Set
✅ XSS Protection: Enabled

📊 Overall Score: 94/100 (EXCELLENT)
📝 Report saved to: .odavl/guardian/report-20251203.html
```

**Multilingual support:**
```bash
# Test with Arabic (RTL)
pnpm odavl:guardian test https://example.com --lang ar

# Test with German
pnpm odavl:guardian test https://example.com --lang de
```

---

## 🔧 Configuration (Optional)

### 1. Autopilot Configuration

Create `.odavl/gates.yml` to customize safety constraints:

```yaml
risk_budget: 100
forbidden_paths:
  - security/**
  - auth/**
  - "**/*.test.*"
  - public-api/**

actions:
  max_auto_changes: 10
  max_files_per_cycle: 10

thresholds:
  max_risk_per_action: 25
  min_success_rate: 0.75
```

### 2. Guardian Configuration

Create `guardian.config.json` for custom budgets:

```json
{
  "performance": {
    "budget": "mobile-slow-3g",
    "thresholds": {
      "LCP": 2500,
      "FID": 100,
      "CLS": 0.1
    }
  },
  "accessibility": {
    "level": "AA",
    "languages": ["en", "ar", "de"]
  }
}
```

### 3. Insight Configuration

Customize detectors in `.odavl/insight-config.json`:

```json
{
  "detectors": {
    "typescript": { "enabled": true, "severity": "error" },
    "eslint": { "enabled": true, "severity": "warning" },
    "security": { "enabled": true, "severity": "critical" }
  }
}
```

---

## 📚 Common Workflows

### Daily Development

```bash
# Morning routine:
pnpm odavl:insight              # Check for new issues
pnpm odavl:autopilot run        # Fix automatically
pnpm forensic:all               # Verify quality

# Before commit:
pnpm forensic:all               # Lint + Typecheck + Coverage
git add . && git commit -m "..."
```

### Before Deployment

```bash
# 1. Code quality
pnpm forensic:all

# 2. Web testing (staging)
pnpm odavl:guardian test https://staging.example.com

# 3. Performance validation
pnpm odavl:guardian performance https://staging.example.com --budget mobile

# 4. Accessibility check
pnpm odavl:guardian accessibility https://staging.example.com --lang ar

# All green? Deploy! 🚀
```

### CI/CD Integration

**GitHub Actions** (`.github/workflows/odavl.yml`):

```yaml
name: ODAVL Quality Checks

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.12.2
      
      # Forensic checks
      - run: pnpm install --frozen-lockfile
      - run: pnpm forensic:all
      
      # Autopilot (dry-run only in CI)
      - run: pnpm odavl:autopilot run --dry-run
      
      # Guardian (if staging URL available)
      - run: pnpm odavl:guardian test ${{ secrets.STAGING_URL }} --json
        if: env.STAGING_URL
```

---

## 🆘 Troubleshooting

### Issue: "Command not found"

**Problem**: `pnpm odavl:insight` returns "command not found"

**Solution**:
```bash
# Make sure you're in the root directory
cd /path/to/odavl

# Rebuild if needed
pnpm build

# Try again
pnpm odavl:insight
```

---

### Issue: "Autopilot made unwanted changes"

**Problem**: Autopilot changed files you didn't want modified

**Solution**:
```bash
# Rollback immediately
pnpm odavl:autopilot undo

# Check what will be changed next time
pnpm odavl:autopilot run --dry-run

# Configure protected paths in .odavl/gates.yml
```

---

### Issue: "Guardian tests failing"

**Problem**: Guardian reports failures on your site

**Solution**:
```bash
# Get detailed report
pnpm odavl:guardian test https://example.com --format html --output report.html

# Open report.html in browser for detailed analysis

# Fix specific issues:
pnpm odavl:guardian accessibility https://example.com  # Focus on accessibility
pnpm odavl:guardian performance https://example.com    # Focus on performance
```

---

### Issue: "ML model not found"

**Problem**: Autopilot can't load ML trust predictor

**Solution**:
```bash
# Train the ML model
pnpm ml:train

# Or use heuristic fallback (automatic)
# Autopilot will work without ML, just less accurate
```

---

## 🎓 Next Steps

### Learn More

- 📖 **[UNIFIED_COMMANDS.md](UNIFIED_COMMANDS.md)** - Complete command reference
- 📖 **[AUTOPILOT_ML_TRUST_PREDICTION_COMPLETE.md](AUTOPILOT_ML_TRUST_PREDICTION_COMPLETE.md)** - ML features explained
- 📖 **[GUARDIAN_V5_COMPLETE_GUIDE.md](GUARDIAN_V5_COMPLETE_GUIDE.md)** - Guardian deep dive
- 📖 **[docs/](docs/)** - Full documentation

### Install VS Code Extensions

Enhance your workflow with real-time feedback:

1. **ODAVL Insight Extension**
   - Real-time error detection in Problems Panel
   - Auto-analysis on file save
   - Click-to-navigate to errors

2. **ODAVL Autopilot Extension**
   - Monitor O-D-A-V-L cycles
   - View ledger files automatically
   - Quick undo commands

3. **ODAVL Guardian Extension**
   - Pre-deploy quality checks
   - Status bar indicators
   - Test result notifications

**Installation**:
```bash
# Build extensions
pnpm extensions:compile

# Package for distribution
pnpm extensions:package

# Install manually:
# 1. Open VS Code
# 2. Extensions → ... → Install from VSIX
# 3. Select: odavl-studio/*/extension/*.vsix
```

### Join the Community

- 💬 [GitHub Discussions](https://github.com/Monawlo812/odavl/discussions)
- 🐛 [Report Issues](https://github.com/Monawlo812/odavl/issues)
- 📧 Email: mohammad@odavl.studio

---

## ✅ Checklist: You're Ready When...

- ✅ You can run `pnpm odavl:insight` and see the interactive menu
- ✅ You can run `pnpm odavl:autopilot run` and see the O-D-A-V-L cycle
- ✅ You can run `pnpm odavl:guardian test https://example.com` and get results
- ✅ You understand how to rollback with `pnpm odavl:autopilot undo`
- ✅ You know where to find docs (`UNIFIED_COMMANDS.md`, `docs/`)

**Congratulations!** 🎉 You're now ready to use ODAVL Studio professionally.

---

**Need help?** Don't hesitate to:
- Open a [GitHub Issue](https://github.com/Monawlo812/odavl/issues)
- Check [Troubleshooting](#-troubleshooting) section
- Read [UNIFIED_COMMANDS.md](UNIFIED_COMMANDS.md) for details

**Happy coding!** 🚀
