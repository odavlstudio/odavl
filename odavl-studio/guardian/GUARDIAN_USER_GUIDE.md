# 📖 Guardian v5.0 User Guide

**Complete guide to using Guardian for pre-deploy testing**

---

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Getting Started](#getting-started)
4. [Project Types](#project-types)
5. [Testing Workflows](#testing-workflows)
6. [Understanding Results](#understanding-results)
7. [Advanced Features](#advanced-features)
8. [CI/CD Integration](#cicd-integration)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Introduction

### What is Guardian?

Guardian is a **universal pre-deploy testing tool** that:
- ✅ Automatically detects your project type
- ✅ Runs comprehensive tests before deployment
- ✅ Works with any project (websites, extensions, CLIs, packages, monorepos)
- ✅ Provides actionable insights and scores

### Who is Guardian For?

- 👨‍💻 **Developers**: Catch issues before pushing code
- 🧪 **QA Engineers**: Automated testing workflows
- 🚀 **DevOps Teams**: CI/CD integration and quality gates
- 🏢 **Teams**: Monorepo testing and impact analysis

### Guardian vs Other Tools

| Feature | Guardian v5.0 | Jest | Playwright | Lighthouse |
|---------|--------------|------|------------|------------|
| Auto-detection | ✅ | ❌ | ❌ | ❌ |
| Multi-project types | ✅ | ❌ | ❌ | ❌ |
| Monorepo support | ✅ | Partial | ❌ | ❌ |
| Dynamic menu | ✅ | ❌ | ❌ | ❌ |
| Pre-deploy focus | ✅ | ❌ | Partial | Partial |

**Guardian complements** (doesn't replace) unit testing tools like Jest.

---

## Installation

### Prerequisites

**System Requirements:**
- Node.js ≥ 18.0.0
- pnpm ≥ 9.0.0 (or npm ≥ 10.0.0)
- 2 GB RAM minimum
- macOS, Linux, or Windows

**For specific tests:**
- Website testing: Chrome/Firefox/Edge installed
- Extension testing: VS Code installed
- Package testing: TypeScript compiler

### Global Installation (Recommended)

```bash
# Using pnpm (recommended)
pnpm add -g @odavl-studio/guardian

# Using npm
npm install -g @odavl-studio/guardian

# Verify installation
guardian --version
# Expected: 5.0.0
```

### Project-Specific Installation

```bash
cd your-project

# Using pnpm
pnpm add -D @odavl-studio/guardian

# Using npm
npm install --save-dev @odavl-studio/guardian

# Add to package.json scripts
{
  "scripts": {
    "test:guardian": "guardian"
  }
}
```

### Upgrading from v4.0

```bash
# Uninstall old version
npm uninstall -g @odavl-studio/guardian

# Install v5.0
npm install -g @odavl-studio/guardian@5

# Check version
guardian --version
# Should show 5.0.0
```

---

## Getting Started

### Your First Test

**Step 1: Navigate to your project**
```bash
cd my-awesome-project
```

**Step 2: Run Guardian**
```bash
guardian
```

**Step 3: Guardian auto-detects your project**
```
🔍 Detecting project...
✅ Detected: Next.js Website
📦 Framework: next.js (14.0.0)
🎯 Confidence: 95%
```

**Step 4: Choose a test**
```
[1] 🌐 Test Website (Full)
[2] 📊 Custom Test
[3] 🗣️ Language Analysis
[0] Exit

Your choice: 1
```

**Step 5: Review results**
```
📊 Overall Score: 87/100 (Good)
📁 Report: .guardian/reports/website-2025-12-01.json
```

### Understanding Detection

Guardian uses **5 strategies** to detect your project:

**1. Framework Markers**
```bash
next.config.js → Next.js Website
vite.config.ts → Vite App
.vscodeignore → VS Code Extension
```

**2. Package.json Fields**
```json
{
  "engines": { "vscode": "^1.85.0" }  // Extension
  "bin": { "mycli": "./dist/index.js" }  // CLI
  "main": "./dist/index.js"  // Package
}
```

**3. Workspace Structure**
```bash
pnpm-workspace.yaml → Monorepo
packages/ → Monorepo
apps/ → Monorepo
```

**4. Source Code Patterns**
```typescript
#!/usr/bin/env node  // CLI
import * as vscode  // Extension
import { Command } from 'commander'  // CLI
```

**5. Dependencies**
```json
{
  "dependencies": {
    "next": "^14.0.0"  // Website
    "vscode": "^1.85.0"  // Extension
    "commander": "^11.0.0"  // CLI
  }
}
```

**Confidence Scoring:**
- 90-100%: Very confident (recommended to trust)
- 75-89%: Confident (likely correct)
- 50-74%: Uncertain (may need manual override)
- <50%: Unknown project (manual configuration needed)

---

## Project Types

### 🌐 Website

**Detection Criteria:**
- Framework config files (next.config.js, vite.config.ts)
- Web dependencies (next, react, vue, svelte)
- public/ directory with index.html

**Supported Frameworks:**
- Next.js (App Router & Pages Router)
- Vite (React, Vue, Svelte)
- Create React App
- Angular
- Nuxt.js

**Tests Run:**
1. **Performance**
   - Time to First Byte (TTFB)
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)

2. **SEO**
   - Meta tags (title, description, OG tags)
   - Sitemap.xml presence
   - robots.txt configuration
   - Canonical URLs

3. **Security**
   - HTTPS enforcement
   - Security headers (CSP, X-Frame-Options)
   - CORS configuration
   - Cookie settings

4. **Accessibility**
   - WCAG 2.1 Level AA compliance
   - Screen reader support
   - Keyboard navigation
   - Color contrast

5. **Visual Regression** (optional)
   - Screenshot comparison
   - Layout consistency
   - Responsive breakpoints

6. **Multi-Device** (optional)
   - Mobile (375x667)
   - Tablet (768x1024)
   - Desktop (1920x1080)

**Example Test Output:**
```
🧪 Running Website Tests...

✅ Performance (5.2s)
   TTFB: 180ms ✓ (target: <200ms)
   FCP: 1.2s ✓ (target: <1.8s)
   LCP: 2.1s ⚠️ (target: <2.5s)
   FID: 45ms ✓ (target: <100ms)
   CLS: 0.08 ✓ (target: <0.1)

✅ SEO (2.1s)
   Title: Present ✓
   Description: Present ✓
   OG Tags: 8/10 ⚠️
   Sitemap: Found ✓

✅ Security (1.8s)
   HTTPS: Enabled ✓
   CSP: Configured ✓
   Headers: 9/12 ⚠️

✅ Accessibility (3.4s)
   WCAG AA: 94% ✓
   Issues: 3 minor ⚠️

📊 Overall Score: 87/100 (Good)
```

---

### 🧩 VS Code Extension

**Detection Criteria:**
- `engines.vscode` in package.json
- .vscodeignore file
- src/extension.ts or extension.js

**Tests Run:**
1. **Activation Performance**
   - Startup time (<200ms target)
   - Lazy loading verification
   - Heavy operations detection

2. **Command Registration**
   - All commands registered correctly
   - Keybindings valid
   - Command titles clear

3. **Marketplace Compliance**
   - Icon size (128x128 required)
   - Categories correct
   - Keywords appropriate
   - README quality

4. **Configuration**
   - Settings schema valid
   - Default values reasonable
   - Documentation complete

5. **Security**
   - No hardcoded API keys
   - Safe API usage
   - Telemetry disclosure

**Example Test Output:**
```
🧪 Running Extension Tests...

✅ Activation (0.8s)
   Startup: 142ms ✓
   Lazy loading: Enabled ✓

✅ Commands (1.2s)
   Registered: 8/8 ✓
   Keybindings: 4/4 ✓

✅ Marketplace (2.1s)
   Icon: Valid ✓
   Categories: Correct ✓
   README: Good quality ✓

✅ Security (1.5s)
   No API keys ✓
   Safe usage ✓

📊 Overall Score: 93/100 (Excellent)
```

---

### ⚙️ CLI Tool

**Detection Criteria:**
- `bin` field in package.json
- Shebang (#!/usr/bin/env node)
- CLI frameworks (commander, yargs, oclif)

**Tests Run:**
1. **Command Execution**
   - All commands work
   - Exit codes correct
   - No crashes

2. **Help Text**
   - --help available
   - Clear descriptions
   - Examples provided

3. **Error Messages**
   - User-friendly
   - Actionable
   - Error codes documented

4. **Auto-completion**
   - Bash completion script
   - Zsh completion script
   - Fish completion script

5. **Cross-platform**
   - Works on macOS/Linux/Windows
   - Path separators correct
   - Line endings handled

**Example Test Output:**
```
🧪 Running CLI Tests...

✅ Commands (2.3s)
   Execution: 12/12 ✓
   Exit codes: Correct ✓

✅ Help (1.1s)
   --help: Present ✓
   Examples: 5 provided ✓

✅ Errors (1.8s)
   Messages: Clear ✓
   Codes: Documented ✓

✅ Platform (2.4s)
   macOS: Pass ✓
   Linux: Pass ✓
   Windows: Pass ✓

📊 Overall Score: 91/100 (Excellent)
```

---

### 📦 Package/Library

**Detection Criteria:**
- `main` and/or `exports` fields
- TypeScript declaration files (.d.ts)
- No `bin`, no `engines.vscode`

**Tests Run:**
1. **Exports Validity**
   - All exports resolvable
   - ESM and CJS support
   - Subpath exports work

2. **TypeScript Types**
   - .d.ts files present
   - Types accurate
   - Generics correct

3. **Bundle Analysis**
   - Bundle size reasonable
   - Tree-shaking support
   - Side-effects declared

4. **Documentation**
   - README complete
   - API docs available
   - Examples provided

5. **Breaking Changes**
   - Compared to last version
   - Major version justified
   - Migration guide present

**Example Test Output:**
```
🧪 Running Package Tests...

✅ Exports (3.2s)
   Main: Valid ✓
   ESM: Supported ✓
   CJS: Supported ✓
   Subpaths: 8/8 ✓

✅ Types (2.1s)
   Declarations: Present ✓
   Accuracy: 100% ✓

✅ Bundle (4.3s)
   Size: 24KB ✓ (target: <50KB)
   Tree-shakeable: Yes ✓

✅ Docs (1.5s)
   README: Excellent ✓
   Examples: 6 provided ✓

📊 Overall Score: 96/100 (Excellent)
```

---

### 🏢 Monorepo

**Detection Criteria:**
- pnpm-workspace.yaml
- lerna.json
- packages/ or apps/ directory
- Multiple package.json files

**Tests Run:**
1. **Product Detection**
   - Auto-detect all packages
   - Determine each package type
   - Build dependency graph

2. **Per-Product Testing**
   - Run appropriate test for each
   - Collect individual scores

3. **Impact Analysis**
   - Identify changed packages
   - Find affected dependents
   - Calculate risk score

4. **Overall Health**
   - Suite-wide score (0-100)
   - Weakest links identified
   - Recommendations provided

**Example Test Output:**
```
🧪 Running Suite Tests...

[1/4] spotify-web (Website) ⏱️ 8.2s
      ✅ Score: 89/100

[2/4] spotify-vscode (Extension) ⏱️ 3.4s
      ✅ Score: 95/100

[3/4] spotify-cli (CLI) ⏱️ 2.7s
      ✅ Score: 91/100

[4/4] spotify-sdk (Package) ⏱️ 4.1s
      ✅ Score: 96/100

🔗 Impact Analysis
   Changed: spotify-sdk
   Affected: spotify-web, spotify-cli
   Risk: Medium

📊 Suite Health: 93/100 (Excellent)
⏱️ Total: 18.4s
```

---

## Testing Workflows

### Workflow 1: Daily Development

**Use Case**: Quick checks during development

```bash
# Morning: Start work
cd project
guardian

# Choose Custom Test
[2] Custom Test

# Select only critical tests
[✓] Performance
[ ] Visual
[✓] Security
[ ] SEO

# Fast feedback (~5-10s)
```

**Best for**: Frequent checks, quick iterations

---

### Workflow 2: Pre-Commit

**Use Case**: Validate before committing code

```bash
# Add to .husky/pre-commit
#!/bin/sh
guardian

if [ $? -ne 0 ]; then
  echo "❌ Guardian checks failed"
  echo "Fix issues before committing"
  exit 1
fi
```

**Best for**: Preventing bad commits

---

### Workflow 3: Pull Request

**Use Case**: Comprehensive validation before merge

```bash
# In GitHub Actions
- name: Run Guardian
  run: guardian
  
- name: Upload Report
  uses: actions/upload-artifact@v3
  with:
    name: guardian-report
    path: .guardian/reports/latest.json
```

**Best for**: Team collaboration, quality gates

---

### Workflow 4: Pre-Deploy

**Use Case**: Final check before production

```bash
# Before deploy
guardian

# Review dashboard
guardian dashboard

# Only deploy if score > 85
if [ $(cat .guardian/reports/latest.json | jq '.score') -lt 85 ]; then
  echo "❌ Score too low for production"
  exit 1
fi
```

**Best for**: Production deployments

---

## Understanding Results

### Score Breakdown

**Overall Score**: 0-100
- **90-100**: Excellent - Deploy with confidence
- **75-89**: Good - Minor improvements recommended
- **60-74**: Fair - Address issues before deploying
- **<60**: Poor - Critical issues detected

**Category Scores**:
- Performance: Based on Core Web Vitals
- SEO: Meta tags, sitemap, structure
- Security: Headers, HTTPS, vulnerabilities
- Accessibility: WCAG compliance
- Code Quality: Linting, types, patterns

### Reading Reports

**Location**: `.guardian/reports/`

**Latest Report**: `.guardian/reports/latest.json`

**Report Structure**:
```json
{
  "timestamp": "2025-12-01T10:30:00Z",
  "project": {
    "name": "my-app",
    "type": "website",
    "confidence": 95
  },
  "score": 87,
  "categories": {
    "performance": {
      "score": 85,
      "metrics": {
        "ttfb": { "value": 180, "unit": "ms", "pass": true },
        "fcp": { "value": 1200, "unit": "ms", "pass": true },
        "lcp": { "value": 2100, "unit": "ms", "pass": true }
      }
    },
    "seo": {
      "score": 92,
      "checks": {
        "meta_title": { "present": true },
        "meta_description": { "present": true },
        "sitemap": { "found": true }
      }
    }
  },
  "issues": [
    {
      "severity": "warning",
      "category": "performance",
      "message": "LCP could be improved",
      "suggestion": "Optimize images, reduce bundle size"
    }
  ]
}
```

---

## Advanced Features

### Custom Test Configuration

**Create custom test profiles**:

```json
// guardian.config.json
{
  "profiles": {
    "quick": {
      "tests": ["performance", "security"],
      "skipVisual": true
    },
    "full": {
      "tests": ["all"],
      "devices": ["mobile", "tablet", "desktop"]
    },
    "pr": {
      "tests": ["performance", "accessibility", "security"],
      "thresholds": {
        "minScore": 80
      }
    }
  }
}
```

**Use profiles**:
```bash
guardian --profile quick
guardian --profile full
guardian --profile pr
```

### Language Analysis

**Detailed language breakdown**:

```bash
guardian

[3] Language Analysis

🗣️ Analyzing...

📊 Results:
   TypeScript: 68.2% (12,450 lines)
   JavaScript: 17.6% (3,210 lines)
   CSS: 10.3% (1,890 lines)
   JSON: 3.1% (560 lines)
   Markdown: 0.8% (145 lines)

🔍 Insights:
   ✅ No mixed JS/TS files
   ✅ Consistent style
   ⚠️ 3 files missing types
   💡 Consider: Migrate remaining JS
```

### Dashboard

**Launch web dashboard**:

```bash
guardian dashboard
```

**Features**:
- 📊 Test history and trends
- 📈 Performance over time
- 🔍 Detailed error inspection
- 📸 Screenshot comparison (visual tests)
- 📦 Monorepo overview

**URL**: `http://localhost:3002`

---

## CI/CD Integration

### GitHub Actions

**.github/workflows/guardian.yml**:
```yaml
name: Guardian Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - name: Install Dependencies
        run: pnpm install
      
      - name: Build Project
        run: pnpm build
      
      - name: Install Guardian
        run: pnpm add -g @odavl-studio/guardian
      
      - name: Run Guardian Tests
        run: guardian
      
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: guardian-report
          path: .guardian/reports/latest.json
      
      - name: Check Score
        run: |
          SCORE=$(cat .guardian/reports/latest.json | jq '.score')
          if [ $SCORE -lt 80 ]; then
            echo "❌ Score too low: $SCORE/100"
            exit 1
          fi
          echo "✅ Score: $SCORE/100"
```

### GitLab CI

**.gitlab-ci.yml**:
```yaml
guardian:
  stage: test
  image: node:18
  
  before_script:
    - npm install -g pnpm
    - pnpm add -g @odavl-studio/guardian
  
  script:
    - pnpm install
    - pnpm build
    - guardian
  
  artifacts:
    paths:
      - .guardian/reports/
    when: always
```

### Azure Pipelines

**azure-pipelines.yml**:
```yaml
trigger:
  - main
  - develop

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '18.x'
  
  - script: |
      npm install -g pnpm
      pnpm add -g @odavl-studio/guardian
    displayName: 'Install Guardian'
  
  - script: |
      pnpm install
      pnpm build
    displayName: 'Build Project'
  
  - script: guardian
    displayName: 'Run Guardian Tests'
  
  - task: PublishBuildArtifacts@1
    inputs:
      pathToPublish: '.guardian/reports'
      artifactName: 'guardian-reports'
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Wrong Project Type Detected

**Symptom**: Guardian detects website but it's a CLI tool

**Solution**:
```json
// guardian.config.json
{
  "project": {
    "type": "cli"
  }
}
```

#### Issue 2: Monorepo Not Detected

**Symptom**: Single package detected instead of monorepo

**Solution**:
```bash
# Ensure you have one of:
# - pnpm-workspace.yaml
# - lerna.json
# - packages/ directory

# Check from root:
ls -la pnpm-workspace.yaml
```

#### Issue 3: Tests Fail with "Connection Refused"

**Symptom**: Website tests can't connect

**Solution**:
```bash
# Start dev server first
pnpm dev  # or npm run dev

# In another terminal
guardian
```

#### Issue 4: Low Confidence Score

**Symptom**: Detection confidence <50%

**Solution**:
```bash
# Check detection details
guardian detect --verbose

# Override with config
echo '{"project": {"type": "website"}}' > guardian.config.json
```

---

## Best Practices

### 1. Run Tests Frequently

**✅ Do:**
- Run before every commit
- Run in CI/CD pipeline
- Run before every deploy

**❌ Don't:**
- Only run when bugs appear
- Skip tests to save time
- Ignore warnings

### 2. Maintain High Scores

**Target Scores:**
- Production: ≥ 90
- Staging: ≥ 85
- Development: ≥ 80

**Monitor Trends:**
```bash
# Check score history
guardian dashboard

# Look for patterns:
# - Declining scores = technical debt
# - Stable scores = good maintenance
# - Improving scores = quality focus
```

### 3. Fix Issues Immediately

**Priority Order:**
1. **Critical**: Security vulnerabilities
2. **High**: Performance issues (LCP >2.5s)
3. **Medium**: Accessibility violations
4. **Low**: SEO warnings

**Don't accumulate debt:**
```bash
# Bad
"We'll fix these 50 issues later"

# Good
"Fix 5 issues per sprint"
```

### 4. Use Custom Tests Wisely

**Quick iterations:**
```bash
# During development
guardian → Custom Test → Performance only
```

**Full validation:**
```bash
# Before deploy
guardian → Test Website (Full)
```

### 5. Leverage Monorepo Features

**Test affected packages only:**
```bash
# Guardian auto-detects changes
guardian

[5] Test All Products → Impact Analysis
    Changed: package-a
    Affected: package-b, package-c
    Testing: 3 packages (not all 10)
```

---

## Appendix: CLI Reference

### Commands

```bash
# Main command (interactive)
guardian

# Detection only
guardian detect

# Dashboard
guardian dashboard

# Show configuration
guardian config show

# Clear cache
guardian cache clear

# Version
guardian --version

# Help
guardian --help
```

### Options

```bash
# Specify project path
guardian /path/to/project

# Use custom config
guardian --config custom.config.json

# Use profile
guardian --profile quick

# Verbose output
guardian --verbose

# Skip tests
guardian --skip-tests
```

---

## Next Steps

✅ **You've completed the User Guide!**

**Recommended reading:**
1. [Migration Guide](./MIGRATION_GUIDE.md) - If upgrading from v4.0
2. [API Reference](./API.md) - For programmatic usage
3. [Configuration](./CONFIGURATION.md) - Advanced config options

**Get help:**
- 📧 Email: support@odavl.com
- 💬 Discord: [ODAVL Community](https://discord.gg/odavl)
- 🐛 Issues: [GitHub](https://github.com/odavl/odavl-studio/issues)

**Start testing:** `guardian` 🚀
