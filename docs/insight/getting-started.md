# ODAVL Insight - Getting Started Guide

**Version**: 1.0.0  
**Last Updated**: December 12, 2025

---

## What is ODAVL Insight?

ODAVL Insight is an **AI-powered code analysis platform** that detects errors, security vulnerabilities, performance issues, and code quality problems across **16 specialized detectors**.

### Key Features

✅ **16 Specialized Detectors**
- TypeScript, ESLint, Security, Performance, Complexity, Circular Dependencies, Import Issues, Package Problems, Runtime Errors, Build Issues, Network Patterns, Code Isolation, Next.js, Database, Infrastructure, CI/CD

✅ **Local + Cloud Analysis**
- Run analysis locally (FREE forever)
- Run cloud analysis with project history (PRO+)

✅ **Multi-Language Support**
- TypeScript/JavaScript (full support)
- Python, Java, PHP, Ruby, Swift, Kotlin (experimental)

✅ **Three Ways to Use**
- **CLI** - Command-line tool for CI/CD and local development
- **VS Code Extension** - Real-time analysis in your editor
- **Cloud Dashboard** - Project history, team collaboration, trends

✅ **FREE Forever Plan**
- 1 project, 100 files per analysis, 5 analyses/day
- Local analysis with 6 core detectors
- No credit card required

---

## Quick Start (5 Minutes)

### Step 1: Install the CLI

```bash
# Using npm
npm install -g @odavl/cli

# Using pnpm
pnpm add -g @odavl/cli

# Using yarn
yarn global add @odavl/cli

# Verify installation
odavl --version
# Output: 1.0.0
```

### Step 2: Run Your First Analysis (Local Mode)

```bash
# Navigate to your project
cd /path/to/your/project

# Run analysis with all available detectors
odavl insight analyze

# Example output:
# 🔍 ODAVL Insight Analysis
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Analyzing: /Users/you/projects/my-app
# Detectors: typescript, eslint, security, performance, complexity, import
# 
# ✅ Analysis Complete (3.2s)
# 
# 📊 Summary:
#   - 12 issues found
#   - 3 critical, 5 high, 4 medium, 0 low
# 
# 🔴 Critical Issues (3):
#   - Hardcoded API key detected (security)
#   - SQL injection vulnerability (security)
#   - Infinite loop detected (typescript)
# 
# 🟠 High Issues (5):
#   - Missing error handling in async function (typescript)
#   - Unused import 'fs' (eslint)
#   ...
# 
# 💡 Tip: Run 'odavl insight fix' for AI-powered fix suggestions
```

### Step 3: (Optional) Sign Up for Cloud Analysis

```bash
# Create free account
odavl auth signup

# Or login with existing account
odavl auth login

# Run cloud analysis (requires PRO plan or trial)
odavl insight analyze --cloud

# Example output:
# ☁️  Cloud Analysis Started
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Analysis ID: ana_1a2b3c4d5e
# Status: Running...
# 
# ✅ Analysis Complete (5.1s)
# 
# 📊 Results:
#   - 18 issues found (6 more than local analysis)
#   - Enhanced detectors: database, infrastructure, cicd
# 
# 🔗 View in Dashboard:
#   https://cloud.odavl.studio/projects/proj_123/analyses/ana_1a2b3c4d5e
```

---

## Installation Options

### Option 1: CLI (Recommended for CI/CD)

**Install globally:**
```bash
npm install -g @odavl/cli
```

**Use in package.json scripts:**
```json
{
  "scripts": {
    "lint:odavl": "odavl insight analyze",
    "lint:odavl:cloud": "odavl insight analyze --cloud"
  }
}
```

**Use in CI/CD (GitHub Actions):**
```yaml
# .github/workflows/code-quality.yml
name: Code Quality

on: [push, pull_request]

jobs:
  odavl-insight:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install ODAVL CLI
        run: npm install -g @odavl/cli
      - name: Run Insight Analysis
        run: odavl insight analyze
        env:
          ODAVL_AUTH_TOKEN: ${{ secrets.ODAVL_AUTH_TOKEN }}
```

### Option 2: VS Code Extension

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "ODAVL Insight"
4. Click Install

**Features:**
- Real-time analysis on file save
- Issues appear in Problems Panel
- Click to navigate to issue location
- One-click fix suggestions
- Cloud integration (PRO+)

[Read the full VS Code extension guide →](./vscode-extension.md)

### Option 3: SDK (For Programmatic Use)

```bash
npm install @odavl-studio/sdk
```

```typescript
import { Insight } from '@odavl-studio/sdk/insight';

const insight = new Insight({
  workspacePath: '/path/to/project',
  enabledDetectors: ['typescript', 'security', 'performance'],
});

const result = await insight.analyze();

console.log(`Found ${result.issues.length} issues`);
result.issues.forEach(issue => {
  console.log(`[${issue.severity}] ${issue.message}`);
  console.log(`  File: ${issue.file}:${issue.line}`);
});
```

---

## CLI Commands Reference

### Analysis Commands

```bash
# Run local analysis (FREE)
odavl insight analyze

# Run cloud analysis (PRO+)
odavl insight analyze --cloud

# Analyze specific detectors only
odavl insight analyze --detectors typescript,security

# Output in JSON format
odavl insight analyze --format json

# Output in Markdown format
odavl insight analyze --format markdown

# Verbose output (show telemetry, timing)
odavl insight analyze --verbose
```

### Authentication Commands

```bash
# Sign up for new account
odavl auth signup

# Login to existing account
odavl auth login

# Check authentication status
odavl auth status

# Logout
odavl auth logout
```

### Plan Commands

```bash
# View current plan
odavl insight plan

# View available plans
odavl insight plans

# Upgrade to PRO
odavl insight upgrade
```

### Configuration Commands

```bash
# View current configuration
odavl config list

# Set configuration value
odavl config set telemetry.enabled false

# Reset configuration to defaults
odavl config reset
```

---

## Plans & Pricing

| Feature | FREE | PRO ($29/mo) | TEAM ($99/mo) | ENTERPRISE (Custom) |
|---------|------|--------------|---------------|---------------------|
| **Projects** | 1 | 10 | 50 | Unlimited |
| **Cloud Analysis** | ❌ | ✅ | ✅ | ✅ |
| **Files/Analysis** | 100 | 1,000 | 5,000 | Unlimited |
| **Analyses/Day** | 5 | 100 | 500 | Unlimited |
| **Detectors** | 6 core | 11 standard | 14 enhanced | 16 all + custom |
| **History Retention** | 7 days | 90 days | 180 days | 365 days |
| **Team Collaboration** | ❌ | ❌ | ✅ | ✅ |
| **SSO/SAML** | ❌ | ❌ | ❌ | ✅ |
| **Support** | Community | Email | Priority | Dedicated |

[View detailed pricing comparison →](./plans-and-pricing.md)

**Start with FREE forever:**
```bash
# No credit card required
odavl insight analyze
```

**Try PRO with 14-day free trial:**
```bash
odavl auth signup --trial
```

---

## Example Use Cases

### Use Case 1: Daily Development

```bash
# Before committing changes
odavl insight analyze

# Review issues
# Fix critical/high issues
# Commit clean code

git add .
git commit -m "feat: new feature (verified with ODAVL Insight)"
```

### Use Case 2: CI/CD Quality Gate

```yaml
# .github/workflows/ci.yml
- name: Run ODAVL Insight
  run: |
    odavl insight analyze --format json > analysis.json
    
    # Fail build if critical issues found
    CRITICAL_COUNT=$(jq '.summary.critical' analysis.json)
    if [ "$CRITICAL_COUNT" -gt 0 ]; then
      echo "❌ Build failed: $CRITICAL_COUNT critical issues found"
      exit 1
    fi
```

### Use Case 3: Cloud Analysis with Team

```bash
# Team member 1 runs analysis
odavl insight analyze --cloud

# Team member 2 views results in dashboard
# https://cloud.odavl.studio/projects/proj_123

# Team discusses issues, assigns fixes
# Historical trends show improvement over time
```

### Use Case 4: Multi-Language Monorepo

```bash
# Analyze TypeScript service
cd services/api
odavl insight analyze --detectors typescript,security,performance

# Analyze Python service
cd ../ml-pipeline
odavl insight analyze --language python --detectors security,complexity

# Analyze Java service
cd ../payment-service
odavl insight analyze --language java --detectors security,performance
```

---

## Configuration

### Local Configuration

ODAVL Insight looks for configuration in:
1. `.odavl/config.json` (project-specific)
2. `~/.odavl/config.json` (global)

**Example `.odavl/config.json`:**
```json
{
  "insight": {
    "enabledDetectors": ["typescript", "eslint", "security", "performance"],
    "excludePatterns": ["node_modules/**", "dist/**", "*.test.ts"],
    "maxFiles": 1000,
    "telemetry": {
      "enabled": true
    }
  }
}
```

### Environment Variables

```bash
# Authentication
export ODAVL_AUTH_TOKEN="your-auth-token"

# Cloud API URL (default: https://cloud.odavl.studio)
export ODAVL_API_URL="https://cloud.odavl.studio"

# Telemetry opt-out
export ODAVL_TELEMETRY_ENABLED="false"

# Plan ID (for testing)
export ODAVL_PLAN_ID="INSIGHT_PRO"
```

---

## Troubleshooting

### Issue: Command not found

```bash
# Verify installation
npm list -g @odavl/cli

# Reinstall if needed
npm install -g @odavl/cli --force
```

### Issue: Authentication failed

```bash
# Check auth status
odavl auth status

# Re-login
odavl auth logout
odavl auth login
```

### Issue: Analysis times out

```bash
# Reduce file count
odavl insight analyze --max-files 500

# Analyze specific detectors
odavl insight analyze --detectors typescript,security

# Increase timeout
odavl insight analyze --timeout 300000  # 5 minutes
```

### Issue: Too many issues found

```bash
# Filter by severity
odavl insight analyze --min-severity high

# Show only critical issues
odavl insight analyze --min-severity critical

# Analyze specific files
odavl insight analyze --files "src/**/*.ts"
```

### Issue: Telemetry concerns

```bash
# Disable telemetry globally
odavl config set telemetry.enabled false

# Or use environment variable
export ODAVL_TELEMETRY_ENABLED="false"
odavl insight analyze
```

**Telemetry Privacy:**
- No source code is transmitted
- Only metadata (file counts, issue counts, detector usage)
- Fully opt-out capable
- GDPR compliant

[Read our privacy policy →](https://odavl.studio/privacy)

---

## Next Steps

✅ **You've completed the Getting Started guide!**

**Continue learning:**
- [VS Code Extension Guide](./vscode-extension.md) - Set up real-time analysis in your editor
- [Plans & Pricing](./plans-and-pricing.md) - Choose the right plan for your team
- [API Reference](./api-reference.md) - Integrate Insight programmatically
- [CLI Reference](./cli-reference.md) - Master all CLI commands

**Get support:**
- 📖 [Documentation](https://docs.odavl.studio)
- 💬 [Community Discord](https://discord.gg/odavl)
- 📧 [Email Support](mailto:support@odavl.studio)
- 🐛 [Report Issues](https://github.com/odavl-studio/odavl/issues)

**Upgrade for more:**
- ☁️ Cloud analysis with project history
- 👥 Team collaboration
- 📊 Advanced analytics and trends
- 🚀 More detectors and languages

```bash
odavl insight upgrade
```

---

## Quick Reference Card

```bash
# Installation
npm install -g @odavl/cli

# First analysis
odavl insight analyze

# Authentication
odavl auth login

# Cloud analysis
odavl insight analyze --cloud

# View plan
odavl insight plan

# Get help
odavl --help
odavl insight --help
```

**Support**: support@odavl.studio  
**Documentation**: https://docs.odavl.studio  
**Dashboard**: https://cloud.odavl.studio

---

*Made with ❤️ by the ODAVL Studio team*
