# 🧩 ODAVL Studio v2.0

<div align="center">

[![Version](https://img.shields.io/badge/version-2.0.0-blue?style=flat-square)](https://github.com/Soliancy/odavl/releases/tag/v2.0.0)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square)](tsconfig.json)
[![Tests](https://img.shields.io/badge/tests-96%25-success?style=flat-square)](reports/test-results.json)
[![ML Accuracy](https://img.shields.io/badge/ML-80%25-brightgreen?style=flat-square)](.odavl/ml-models/)

**Autonomous Code Quality • Self-Healing Infrastructure • Pre-Deploy Testing**

[Quick Start](#-quick-start-5-minutes) • [Documentation](docs/) • [Examples](#-examples) • [Contributing](CONTRIBUTING.md)

</div>

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Install dependencies
pnpm install

# 2. Build the platform
pnpm build

# 3. Try the three products:
pnpm odavl:insight       # 🔍 Error detection
pnpm odavl:autopilot run # 🤖 Self-healing
pnpm odavl:guardian test https://example.com # 🛡️ Web testing
```

**That's it!** 🎉 You're ready to go. See [examples below](#-examples) for common workflows.

---

## 💡 What is ODAVL Studio?

**ODAVL Studio** is a unified platform for autonomous code quality and testing. Like Office 365 or Adobe Creative Cloud, it brings together three powerful products under one roof:

### 🔍 **ODAVL Insight** - ML-Powered Error Detection

Find and fix errors before they reach production.

- **12 Specialized Detectors**: TypeScript, ESLint, Security, Performance, and more
- **ML-Powered Suggestions**: 80%+ accuracy in fix recommendations
- **VS Code Integration**: Real-time feedback in Problems Panel
- **Interactive CLI**: Easy-to-use terminal interface

```bash
pnpm odavl:insight  # Interactive menu with 12 detectors
```

### ⚡ **ODAVL Autopilot** - Self-Healing Infrastructure

Automatically fix code quality issues while you sleep.

- **O-D-A-V-L Cycle**: Observe → Decide → Act → Verify → Learn
- **Smart Rollback**: 85% space savings with diff-based snapshots
- **Parallel Execution**: 2-4x faster with dependency-aware parallelism
- **Dry-Run Preview**: See changes before applying them

```bash
pnpm odavl:autopilot run  # Full self-healing cycle
```

### 🛡️ **ODAVL Guardian** - Pre-Deploy Testing

Ship with confidence - test everything before deployment.

- **WCAG 2.1 AA Compliance**: Multilingual accessibility testing (EN/AR/DE)
- **Core Web Vitals**: Performance budgets with 6 presets
- **Security Scanning**: OWASP Top 10 validation
- **Smart Caching**: 85% faster CI/CD with intelligent cache

```bash
pnpm odavl:guardian test https://example.com  # Full test suite
```

---

## 📚 Examples

### Daily Development Workflow

```bash
# 1. Detect errors across your codebase
pnpm odavl:insight

# 2. Let Autopilot fix them automatically
pnpm odavl:autopilot run

# 3. Verify quality with forensic checks
pnpm forensic:all
```

### Before Deployment

```bash
# 1. Run full quality checks
pnpm forensic:all

# 2. Test your staging site
pnpm odavl:guardian test https://staging.example.com

# 3. Verify Core Web Vitals
pnpm odavl:guardian performance https://staging.example.com

# 4. Check accessibility (with Arabic support)
pnpm odavl:guardian accessibility https://staging.example.com --lang ar
```

### CI/CD Integration

```bash
# GitHub Actions / GitLab CI
pnpm forensic:all                              # Lint + Typecheck + Coverage
pnpm odavl:autopilot run --dry-run            # Preview fixes without applying
pnpm odavl:guardian test $STAGING_URL --json  # Web testing with JSON output
```

---

## 🎯 Key Features

### 🔍 Intelligent Error Detection
- **12 Detectors**: Comprehensive coverage from TypeScript to security
- **ML Predictions**: 80%+ accuracy in trust scoring
- **Root Cause Analysis**: Find the source, not just symptoms

### 🤖 Autonomous Healing
- **15+ Recipes**: Pre-built fixes for common issues
- **Trust Scoring**: ML-powered recipe selection (0.1-1.0 scale)
- **Safe Automation**: Risk budget constraints + smart rollback

### 🛡️ Production-Ready Testing
- **Accessibility**: WCAG 2.1 Level AA with RTL support
- **Performance**: 6 budget presets (desktop, mobile, slow-3G, etc.)
- **Security**: OWASP Top 10 + CSP validation

### 📊 Real-Time Monitoring
- **VS Code Extensions**: Instant feedback in your editor
- **Dashboard Views**: Beautiful HTML reports
- **CLI First**: Everything accessible from terminal

---

## 🚀 Quick Start

### 📸 Screenshots

![ODAVL Studio Overview](https://placehold.co/800x450/1a1a2e/ffffff?text=ODAVL+Studio+v2.0+%7C+Three+Products+One+Platform)

#### ODAVL Insight - Real-Time Error Detection

![Insight Problems Panel](https://placehold.co/800x450/0f3460/ffffff?text=Insight%3A+12+Detectors+%7C+Problems+Panel+Integration)

#### ODAVL Autopilot - Self-Healing Code

![Autopilot O-D-A-V-L Cycle](https://placehold.co/800x450/16213e/ffffff?text=Autopilot%3A+O-D-A-V-L+Cycle+%7C+Auto+Fixes)

#### ODAVL Guardian - Pre-Deploy Testing

![Guardian Test Results](https://placehold.co/800x450/533483/ffffff?text=Guardian%3A+Quality+Gates+%7C+Test+Results)

> **Note**: Replace placeholders with actual screenshots before GitHub Marketplace submission.

---

### Installation

#### CLI Installation

```bash
# Install unified CLI globally
pnpm add -g @odavl-studio/cli

# Or use in workspace
pnpm add -D @odavl-studio/cli
```

#### VS Code Extensions Installation

**Three extensions available:**

1. **ODAVL Insight** - Real-time error detection (2.9kb bundle)
2. **ODAVL Autopilot** - Self-healing automation (3.2kb bundle)
3. **ODAVL Guardian** - Pre-deploy testing (3.2kb bundle)

**Install from .vsix files:**

```bash
# Download .vsix files from releases
code --install-extension odavl-insight-vscode-2.0.0.vsix
code --install-extension odavl-autopilot-vscode-2.0.0.vsix
code --install-extension odavl-guardian-vscode-2.0.0.vsix
```

**Or install manually in VS Code:**

1. Open VS Code Extensions (Ctrl+Shift+X)
2. Click `...` menu → "Install from VSIX..."
3. Select the .vsix file for each extension

**Requirements:**

- VS Code 1.80.0 or higher
- Node.js 18.18+ (Insight/Autopilot) or 20.0+ (Guardian)

### Usage

```bash
# Show all commands
odavl --help

# Analyze code with Insight
odavl insight analyze --detectors typescript,eslint

# Run full autopilot cycle
odavl autopilot run --max-files 10

# Run quality tests with Guardian
odavl guardian test https://your-site.com
```

### SDK Usage

```typescript
import { Insight, Autopilot, Guardian } from '@odavl-studio/sdk';

// Error detection
const insight = new Insight({ apiKey: 'your-key' });
const results = await insight.analyze({ workspace: '/path/to/project' });

// Self-healing
const autopilot = new Autopilot({ apiKey: 'your-key' });
const ledger = await autopilot.runCycle({ workspace: '/path/to/project' });

// Quality testing
const guardian = new Guardian({ apiKey: 'your-key' });
const scores = await guardian.runTests({ url: 'https://your-site.com' });
```

## 📦 Packages

- **@odavl-studio/cli** - Unified command-line interface
- **@odavl-studio/sdk** - Public SDK for programmatic access
- **@odavl-studio/insight-core** - Error detection engine
- **@odavl-studio/autopilot-engine** - Self-healing automation
- **@odavl-studio/guardian-app** - Quality testing application
- **@odavl-studio/auth** - Authentication library
- **@odavl-studio/core** - Shared utilities

## 🔧 Development

```bash
# Clone the repository
git clone https://github.com/Monawlo812/odavl.git
cd odavl

# Install dependencies (requires pnpm)
pnpm install
```

### Run ODAVL Insight Analysis

```bash
# Analyze a specific directory
pnpm odavl:insight apps/cli

# Analyze entire workspace
pnpm odavl:insight .

# Run full ODAVL cycle (Observe → Decide → Act → Verify → Learn)
pnpm odavl:run
```

### Example Output

```text
🔍 Running ODAVL Cycle...

[OBSERVE] Detected 4836 issues
  - Security: 1185
  - Complexity: 2811
  - Performance: 176
  - TypeScript: 0 ✅
  - ESLint: 0 ✅

[DECIDE] Selected recipe: security-hardening
  - Trust score: 0.50
  - Priority: 10 (highest)
  - Safety: Within risk budget ✅

[ACT] Applying improvements...
  - Undo snapshot saved: .odavl/undo/1736889600000.json
  - Modified 3 files (total 42 LOC)

[VERIFY] Quality gates check...
  - Security issues: 1185 → 1150 (3% improvement)
  - Attestation: SHA-256 proof saved

[LEARN] Updated trust scores
  - security-hardening: 0.50 → 0.55 (+10%)

✅ Cycle complete! View ledger: .odavl/ledger/run-1736889600000.json
```

## 📦 Monorepo Structure

This monorepo contains multiple projects working together:

### Apps

- **apps/cli/** - ODAVL CLI orchestrator with 5-phase autonomous cycle
- **apps/vscode-ext/** - VS Code extension for real-time monitoring (ODAVL Studio)
- **apps/insight-cloud/** - Next.js 15 global intelligence dashboard (Prisma + PostgreSQL)
- **apps/odavl-website-v2/** - Next.js 15 marketing/docs site (Tailwind, i18n ready)
- **odavl-website/** - Legacy Next.js 14 site (9 languages, Tailwind v4)

### Packages

- **packages/insight-core/** - Shared error analysis & ML models (dual ESM/CJS exports)
- **packages/types/** - Shared TypeScript interfaces
- **packages/sdk/** - Public SDK for ODAVL integration

### Configuration

```text
.odavl/
├── history.json           # Run history with trust scoring
├── recipes-trust.json     # Recipe success rates
├── attestation/           # Cryptographic SHA-256 proofs
├── undo/                  # Automatic file snapshots
├── ledger/                # Run ledgers with edit summaries
├── recipes/               # Improvement recipes
├── logs/                  # Phase execution logs
└── gates.yml              # Governance thresholds
```

## 🔍 ODAVL Insight: 12 Intelligent Detectors

### Core Detectors (Base Layer)

1. **TypeScript**: `tsc --noEmit` validation with strict mode
2. **ESLint**: Code quality rules with type-aware linting
3. **Import (v3.0)**: Smart import validation (skips mock/example files)
4. **Package**: Dependency integrity and vulnerability checks
5. **Runtime (v2.0)**: Intelligent async pattern detection (skips tests)
6. **Build**: Build process validation and error reporting

### Advanced Detectors (Intelligence Layer)

1. **Security**: XSS, SQL injection, hardcoded secrets, CVE scanning (25 tests ✅)
2. **Circular Dependencies**: Graph-based cycle detection with depth analysis (48 tests ✅)
3. **Network & API**: Missing timeouts, error handling, rate limiting (49 tests ✅)
4. **Performance**: Memory leaks, slow functions, blocking operations (33 tests ✅)
5. **Complexity**: Cyclomatic complexity, deep nesting, code smells (30 tests ✅)
6. **Component Isolation**: Coupling, cohesion, boundary violations (31 tests ✅)

**Total Test Coverage**: 216/227 tests passing (95.2%) across all detectors

### VS Code Problems Panel Integration 🆕

ODAVL now displays detected issues directly in VS Code's **Problems Panel** alongside TypeScript and ESLint errors:

```
PROBLEMS (12)
├─ TypeScript (5)
├─ ESLint (3)
└─ ODAVL (4)
    ├─ ODAVL/security: Hardcoded API key (file.ts:6) ❌
    ├─ ODAVL/network: Missing timeout (api.ts:42) ⚠️
    ├─ ODAVL/complexity: High complexity (utils.ts:108) ℹ️
    └─ ODAVL/isolation: Low cohesion (service.ts:1) 💡
```

**Features:**

- ✅ Real-time analysis on file save
- ✅ Click-to-navigate to error locations
- ✅ Severity mapping (Critical→Error, High→Warning, Medium→Info, Low→Hint)
- ✅ Workspace-wide analysis command
- ✅ Source attribution for each detector

**Commands:**

```
Ctrl+Shift+P → "ODAVL: Analyze Workspace"  # Scan all files
Ctrl+Shift+P → "ODAVL: Clear Diagnostics"  # Clear ODAVL errors
```

### CLI Integration 🆕

Read Problems Panel diagnostics directly from CLI:

```bash
pnpm odavl:insight
# Choose: 7. problemspanel (read from VS Code Problems Panel export)
```

**How it works:**

1. Save any file in VS Code (Ctrl+S)
2. Extension auto-exports diagnostics to `.odavl/problems-panel-export.json`
3. CLI reads from export (~1s vs 10-30s running detectors)
4. Displays results in same format as regular detectors

**Benefits:**

- ⚡ Fast (reads JSON instead of re-running detectors)
- 🔄 Auto-updated (every Ctrl+S refreshes export)
- 🎯 Unified workflow (same menu for all analysis types)
- 📊 No duplication (detectors run once in VS Code)

See [docs/PROBLEMSPANEL_CLI_GUIDE.md](docs/PROBLEMSPANEL_CLI_GUIDE.md) (Arabic) and [docs/PROBLEMSPANEL_CLI_QUICKSTART.md](docs/PROBLEMSPANEL_CLI_QUICKSTART.md) (English) for detailed guides.

---

See [docs/PROBLEMS_PANEL_INTEGRATION.md](docs/PROBLEMS_PANEL_INTEGRATION.md) for detailed usage guide.

## 📊 Common Commands

```bash
# Full ODAVL cycle
pnpm odavl:run

# Insight analysis
pnpm odavl:insight .       # Analyze workspace
pnpm insight:run           # Live error analysis with AI suggestions
pnpm insight:train         # Retrain ML model

# Testing
pnpm test                  # Run tests
pnpm test:coverage         # Coverage reports
pnpm forensic:all          # Full CI workflow

# Rollback
pnpm odavl:undo --snapshot <id>
```

## 🛡️ Governance & Safety

ODAVL uses triple-layer safety:

1. **Risk Budget Guard**: Max 10 files, 40 LOC/file, protected paths
2. **Undo Snapshots**: Automatic backups before changes
3. **Attestation Chain**: Cryptographic SHA-256 proofs

## 📄 Documentation

- Official Docs: Documentation is currently available in the `docs/` directory of this repository.
- Quick Start: See `docs/README.md` and `README_PILOT.md` for setup instructions.
- API Reference: See `API_REFERENCE.md` in the root of the repository.

## License

MIT
