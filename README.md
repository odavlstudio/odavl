# 🧩 ODAVL Studio v1.0.0 GA

<div align="center">

[![Version](https://img.shields.io/badge/version-1.0.0--GA-blue?style=flat-square)](https://github.com/odavlstudio/odavl/releases/tag/v1.0.0)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square)](tsconfig.json)
[![Detectors](https://img.shields.io/badge/detectors-16%20total%20(11%20stable)-success?style=flat-square)](CHANGELOG.md)
[![Production](https://img.shields.io/badge/production-ready-green?style=flat-square)](vercel.json)

**🎉 General Availability Release - Production Ready**

**Autonomous Code Quality • Self-Healing Infrastructure • Website Testing**

[Quick Start](#-quick-start) • [Documentation](docs/) • [Cloud Console](apps/cloud-console/) • [Contributing](CONTRIBUTING.md) • [Changelog](CHANGELOG.md)

</div>

---

## 🚀 What is ODAVL?

**ODAVL Studio** is a comprehensive platform for AI-powered code analysis, autonomous fixing, and pre-deploy testing. It consists of three independent products following the Office 365/Adobe Creative Cloud model:

### 🔍 **ODAVL Insight** - The Brain
> **"Detect ALL Errors - Never Touch Code"**

- **25+ Specialized Detectors** (11 stable ✅, 3 experimental ⚠️, 11+ additional)
- **Production SDK v1.0.0**: Clean API for programmatic analysis
- **VS Code Extension v1.0.0**: Real-time diagnostics with status bar & hover tooltips
- **CLI v1.0.0**: 6 commands with unified schema
- **Multi-Language Support**: TypeScript, Python, Java, PHP, Ruby, Swift, Kotlin, Go, Rust
- **ML-Enhanced Analysis**: TensorFlow.js integration for pattern recognition
- **Wave 4 Hardening**: Workspace caching, auto-discovery, enhanced error handling

### ⚡ **ODAVL Autopilot** - The Executor
> **"Execute Safely - Don't Analyze"**

- **O-D-A-V-L Cycle**: Observe → Decide → Act → Verify → Learn
- **Parallel Execution**: 2-4x faster with dependency analysis
- **Heuristic Trust Scoring**: Adaptive recipe selection (no ML model yet)
- **Smart Rollback**: Diff-based snapshots (85% space savings)
- **Safety First**: Risk budget, protected paths, attestation chain

### 🛡️ **ODAVL Guardian** - Website Testing Specialist
> **"Test Websites Only - Smarter Than Vercel"**

- **Accessibility Testing**: axe-core + WCAG 2.1 compliance
- **Performance Testing**: Core Web Vitals, Lighthouse audits
- **Security Testing**: OWASP Top 10, CSP validation
- **Visual Regression**: Pixel-perfect comparison
- **Multi-Browser**: Chrome, Firefox, Safari, Edge

### ☁️ **Cloud Console** - Dashboard & Management
> **"Manage Everything - Track All Metrics"**

- Project management and workspace tracking
- Telemetry and observability (15+ event types)
- Billing integration (Free, Pro, Enterprise tiers)
- OAuth authentication (GitHub, Google)
- Real-time analytics and reporting

### 🌐 **Marketing Website** - Public Portal
> **"Showcase Platform - SEO Optimized"**

- Product features and pricing
- Documentation and guides
- Contact and support
- SEO optimized with OG images

---

## 🏁 Quick Start

## 🏁 Quick Start

### Prerequisites
- Node.js 20+ and pnpm 9.12.2+
- PostgreSQL 14+ (for Cloud Console)
- Git for version tracking

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/odavlstudio/odavl.git
cd odavl

# 2. Install dependencies (using pnpm ONLY)
pnpm install

# 3. Build all packages
pnpm build

# 4. Set up database (for Cloud Console)
.\setup-database.ps1 -UseDocker  # Windows PowerShell
# OR manually: cd apps/cloud-console && pnpm db:push && pnpm db:seed

# 5. Write version metadata
pnpm version:write
```

### Run Development Servers

```bash
# Cloud Console (localhost:3001)
pnpm insight:dev

# Guardian Dashboard (localhost:3002)
pnpm guardian:dev

# Marketing Website (localhost:3000)
pnpm hub:dev

# Unified CLI
pnpm cli:dev --help
```

### Production Deployment

```bash
# Validate production readiness
pnpm validate:prod

# Build for production
pnpm build:prod

# Deploy to Vercel
pnpm deploy:prod
```

---

## 📦 Repository Structure

```
odavl/
├── apps/
│   ├── cloud-console/       # Dashboard & management (Next.js 15)
│   ├── marketing-website/   # Public website (Next.js 15)
│   └── studio-cli/          # Unified CLI (Commander.js)
├── odavl-studio/
│   ├── insight/            # Error detection (12 stable detectors)
│   │   ├── core/          # Detection engine
│   │   ├── cloud/         # Dashboard UI
│   │   └── extension/     # VS Code extension
│   ├── autopilot/         # Self-healing infrastructure
│   │   ├── engine/        # O-D-A-V-L cycle
│   │   ├── recipes/       # Fix recipes
│   │   └── extension/     # VS Code extension
│   └── guardian/          # Website testing
│       ├── app/           # Testing dashboard
│       ├── workers/       # Background jobs
│       ├── core/          # Testing engine
│       └── extension/     # VS Code extension
├── packages/
│   ├── sdk/               # Public SDK
│   ├── auth/              # JWT authentication
│   ├── core/              # Shared utilities
│   ├── types/             # TypeScript interfaces
│   ├── email/             # Email service
│   └── plugins/           # Plugin system
├── scripts/
│   ├── build/             # Production build scripts
│   └── release/           # Release automation
├── tools/                 # PowerShell automation
├── .github/workflows/     # CI/CD pipelines
├── vercel.json           # Vercel configuration
├── VERSION               # Current version (v1.0.0-GA)
└── CHANGELOG.md          # Release notes
```

---

## 🎯 Usage Examples

### Insight - Detect Errors

**CLI:**
```bash
# Interactive menu
pnpm odavl:insight

# Analyze with specific detectors
odavl insight analyze --detectors typescript,security,performance

# List all 25 detectors
odavl insight detectors

# Generate reports
odavl insight report --format json,html,md
```

**SDK (Wave 5):**
```typescript
import { analyzeWorkspace, listDetectors } from '@odavl/insight-sdk';

// Analyze entire workspace
const result = await analyzeWorkspace('/path/to/project', {
  detectors: ['typescript', 'security', 'performance'],
  severityMinimum: 'medium'
});

console.log(`Found ${result.summary.totalIssues} issues`);

// List available detectors
const detectors = await listDetectors();
console.log(`Available: ${detectors.join(', ')}`);
```

**VS Code Extension (Wave 5):**
- Auto-analyze on save (Ctrl+S)
- Status bar: "$(flame) Insight: 7 issues"
- Hover for detector info and suggested fixes
- Problems Panel integration

### Autopilot - Self-Healing

```bash
# Run full O-D-A-V-L cycle
pnpm odavl:autopilot run

# Run single phase
odavl autopilot observe
odavl autopilot decide
odavl autopilot act
odavl autopilot verify
odavl autopilot learn

# With constraints
odavl autopilot run --max-files 10 --max-loc 40
```

### Guardian - Website Testing

```bash
# Test a website
odavl guardian test https://example.com

# Full test suite
odavl guardian test --suite all --format json

# Multi-environment
odavl guardian test --environment production
```

---

## 🔧 Development Workflow

### Common Commands

```bash
# Testing
pnpm test                  # Run all tests
pnpm test:coverage         # With coverage report
pnpm forensic:all          # Lint + typecheck + coverage (required before commit)

# Building
pnpm build                 # Build all packages
pnpm build:prod            # Production build with validation

# Linting & Type Checking
pnpm lint                  # ESLint entire monorepo
pnpm typecheck             # TypeScript validation

# Health Monitoring
pnpm monitor:health        # System diagnostics
pnpm monitor:health:verbose # Detailed health report

# Version Management
pnpm version:write         # Update version.json files

# Production Validation
pnpm validate:prod         # Pre-deployment checks
```

### VS Code Tasks

Access via `Ctrl+Shift+P` → "Tasks: Run Task":
- **Forensic: All** - Full CI workflow
- **Forensic: Test Coverage** - Coverage report
- **Forensic: Tool Versions** - Display tool versions

---

## 🏗️ Architecture

### Three-Product Model

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  ODAVL Insight  │────▶│ ODAVL Autopilot │────▶│ ODAVL Guardian  │
│  (Detection)    │     │  (Fixing)       │     │   (Testing)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                                │
                         ┌──────▼──────┐
                         │Cloud Console│
                         │ (Dashboard) │
                         └─────────────┘
```

### Data Flow

1. **Insight** detects errors → exports to `.odavl/problems-panel-export.json`
2. **Autopilot** reads issues → generates fixes → saves undo snapshots
3. **Guardian** tests deployed websites → validates quality gates
4. **Cloud Console** aggregates metrics → displays dashboards

---

## 🔐 Security

### Production Headers
- HSTS: 2-year preload
- X-Frame-Options: DENY
- Content-Security-Policy: Strict
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### Authentication
- NextAuth.js with JWT sessions
- OAuth providers (GitHub, Google)
- Session management with rotation

### Data Protection
- SQL injection prevention (Prisma ORM)
- XSS protection headers
- CSRF protection
- No console.log in production

---

## 🚀 Production Deployment

### Vercel Deployment (Recommended)

```bash
# 1. Set up environment variables in Vercel dashboard
#    - NEXTAUTH_SECRET
#    - NEXTAUTH_URL
#    - DATABASE_URL
#    - OAUTH_*
#    - STRIPE_*
#    - VERCEL_*

# 2. Connect GitHub repository to Vercel

# 3. Configure vercel.json (already configured)

# 4. Deploy
git push origin main  # Triggers automatic deployment via GitHub Actions
```

### Manual Deployment

```bash
# 1. Validate
pnpm validate:prod

# 2. Build
pnpm build:prod

# 3. Deploy
pnpm deploy:prod
```

---

## 📊 Performance Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Build Time | <7 min | ✅ 5-7 min |
| Bundle Size | <40 MB | ✅ <40 MB |
| Lighthouse Score | >95 | ✅ 95+ |
| Test Coverage | >80% | 🚧 60% |
| TypeScript Errors | 0 | ✅ 0 |

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/odavl.git

# 2. Create feature branch
git checkout -b odavl/feature-name-20251210

# 3. Make changes and test
pnpm forensic:all

# 4. Commit and push
git commit -m "feat: add feature"
git push origin odavl/feature-name-20251210

# 5. Create PR
```

### Branch Naming Convention
All branches must follow: `odavl/<task>-<YYYYMMDD>`

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 📞 Support

- **Documentation**: https://docs.odavl.com
- **GitHub Issues**: https://github.com/odavlstudio/odavl/issues
- **Email**: support@odavl.com
- **Discord**: https://discord.gg/odavl

---

## 🎉 What's New in v1.0.0 GA

### Production Infrastructure
✅ Automated build pipeline with validation  
✅ CDN optimization (1-year static caching)  
✅ Security hardening (HSTS, CSP, X-Frame-Options)  
✅ Telemetry & observability (15+ events)  
✅ CI/CD automation (GitHub Actions + Vercel)  

### UI/UX Components
✅ Global footers with social links  
✅ Loading states (skeletons, cards, tables)  
✅ Empty states with consistent styling  
✅ Tooltips with portal support  
✅ Mobile menu with slide-in animation  
✅ Version badge in navbar  
✅ Accessibility improvements (skip-to-content, ARIA labels)  

### Developer Experience
✅ Production validation suite  
✅ Version management system  
✅ Enhanced error boundaries  
✅ Comprehensive CHANGELOG  
✅ Updated documentation  

See [CHANGELOG.md](CHANGELOG.md) for complete release notes.

---

<div align="center">

**Built with ❤️ by the ODAVL Team**

[⭐ Star us on GitHub](https://github.com/odavlstudio/odavl) • [📖 Read the Docs](docs/) • [🐛 Report Bug](https://github.com/odavlstudio/odavl/issues)

</div>

---

## 📚 Additional Documentation

### Option 1: Global CLI Installation (Recommended)

```bash
# Install globally via npm
npm install -g @odavl/cli

# Verify installation
odavl --version   # Should show: 2.0.0
odavl info        # Show platform status
```

### Option 2: VS Code Extension (Most Popular)

**Install from VS Code:**
1. Open VS Code
2. Press `Ctrl+Shift+X` (Extensions)
3. Search for "ODAVL Insight"
4. Click Install

**Or install from command line:**
```bash
code --install-extension odavl.odavl-insight-vscode
```

**Marketplace Link:** https://marketplace.visualstudio.com/items?itemName=odavl.odavl-insight-vscode

### Option 3: Local Development

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

## 📦 Published Packages (Globally Available)

| Package | Version | Size | Link |
|---------|---------|------|------|
| **CLI** | 0.1.4 | 1.67 KB | [![npm](https://img.shields.io/npm/v/@odavl/cli)](https://www.npmjs.com/package/@odavl/cli) |
| **Core** | 1.0.1 | 538.7 KB | [![npm](https://img.shields.io/npm/v/@odavl/core)](https://www.npmjs.com/package/@odavl/core) |
| **Insight Core** | 2.0.0 | 835.3 KB | [![npm](https://img.shields.io/npm/v/@odavl/insight-core)](https://www.npmjs.com/package/@odavl/insight-core) |
| **VS Code Extension** | 2.0.4 | 5.18 MB | [![Marketplace](https://img.shields.io/visual-studio-marketplace/v/odavl.odavl-insight-vscode)](https://marketplace.visualstudio.com/items?itemName=odavl.odavl-insight-vscode) |

---

## 💡 What is ODAVL?

**ODAVL** is an autonomous code quality platform. **ODAVL Studio** is the product suite containing three integrated products:

### 🔍 **ODAVL Insight** - Advanced Error Detection

Find and fix errors before they reach production.

- **12 Stable Detectors**: TypeScript, ESLint, Security, Performance, and more
- **Pattern-Based Analysis**: Comprehensive error detection (local-only tool)
- **VS Code Integration**: Real-time feedback in Problems Panel
- **Interactive CLI**: Easy-to-use terminal interface

```bash
pnpm odavl:insight  # Interactive menu with 12 detectors
```

### ⚡ **ODAVL Autopilot** - Self-Healing Infrastructure

Automatically fix code quality issues with deterministic patterns (Wave 6 v1.0.0).

- **7 Fix Rules**: Unused imports, hardcoded secrets, console.log, http→https, and more
- **Safety First**: Max 20 fixes, automatic backups, atomic rollback
- **CLI & VS Code**: Run from terminal or editor with confirmation dialogs
- **Complete Audit Trail**: `.odavl/autopilot-log.json` tracks all fixes

```bash
# CLI: Apply fixes to workspace
odavl autopilot run

# Preview without applying
odavl autopilot run --dry-run

# VS Code: Command Palette → "ODAVL Autopilot: Fix Issues"
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
- **16 Detectors (11 working)**: TypeScript, Security, Performance, Complexity, and more
- **ML Trust Scoring**: Recipe selection with 0.1-1.0 trust scale
- **Root Cause Analysis**: Find the source, not just symptoms
- **Reality**: 69% detector reliability, see [HONEST_STATUS.md](HONEST_STATUS.md)

### 🤖 Autonomous Healing
- **O-D-A-V-L Cycle**: Observe → Decide → Act → Verify → Learn
- **15+ Recipes**: Pre-built fixes for common issues
- **Safe Automation**: Risk budget (10 files max) + undo snapshots + attestation chain

### 🛡️ Pre-Deploy Website Testing
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

![ODAVL Overview](https://placehold.co/800x450/1a1a2e/ffffff?text=ODAVL+v2.0+%7C+Three+Products+One+Platform)

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
- **apps/vscode-ext/** - VS Code extension for real-time monitoring (ODAVL Insight)
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
### Core Detectors (✅ Stable)

1. **TypeScript**: Type errors, strict mode violations
2. **Security**: XSS, SQL injection, hardcoded secrets (no CVE scanning yet)
3. **Performance**: Memory patterns, slow functions
4. **Complexity**: Cyclomatic complexity, deep nesting
5. **Circular Dependencies**: Import cycle detection
6. **Import**: Unused imports, missing dependencies
7. **Package**: Outdated packages, security advisories
8. **Runtime**: Console logs, debugger statements
9. **Build**: Build failures, configuration issues
10. **Network**: HTTP calls, fetch patterns
11. **Isolation**: Test isolation issues

### Experimental Detectors (⚠️ Needs Testing)

1. **Python Types**: mypy integration (flaky)
2. **Python Security**: bandit integration (slow)
3. **Python Complexity**: radon integration (incomplete)

**Broken**: CVE Scanner, Next.js detector ❌  
**Overall Reliability**: 11/16 working (69%)

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

## 🚀 Phase 10: Productization & Branding (NEW)

ODAVL has evolved from internal tooling to production-ready SaaS platform:

### Marketing Website (Port 3004)
- **Next.js 15**: Modern marketing site with Tailwind CSS and Framer Motion
- **5-Step Onboarding**: Seamless signup → organization → project → invite → activation
- **Product Pages**: Detailed Insight, Autopilot, and Guardian pages with demos
- **Pricing**: Transparent Free ($0), Pro ($29/user/mo), Enterprise ($199/user/mo) tiers

### Brand Identity
- **Logo**: Circular gradient with neural network design (public/logo.svg)
- **Colors**: Blue (#3b82f6), Purple (#8b5cf6), Green (#10b981)
- **Typography**: Inter (sans-serif), Fira Code (monospace)
- **Guidelines**: Complete brand book at `design/brand-guidelines.md`

### Launch Strategy
- **Beta Program**: 25 design partners, waitlist signup
- **Product Hunt**: March 2025 launch with community upvotes
- **Target**: 500 users, $10K MRR in Q1 2025
- **Content**: 2 blog posts/week, video demos, case studies

See full documentation:
- [Launch Strategy](docs/LAUNCH_STRATEGY.md) - Go-to-market plan
- [Product Roadmap](docs/PRODUCT_ROADMAP.md) - 18-month vision (Q1 2025 - Q2 2026)
- [Marketing Messaging Guide](docs/MARKETING_MESSAGING_GUIDE.md) - Consistent messaging
- [Press Release](docs/PRESS_RELEASE.md) - Official announcement draft
- [SEO Checklist](docs/SEO_OPTIMIZATION_CHECKLIST.md) - Organic growth strategy
- [Onboarding Flow](docs/ONBOARDING_FLOW.md) - 5-step user journey

### Marketing Website Commands

```bash
# Development
cd apps/marketing-website
pnpm install
pnpm dev        # Start on http://localhost:3004

# Production
pnpm build
pnpm start
```

### Quick Links
- **Website**: https://odavl.com (when launched)
- **Contact**: hello@odavl.com
- **Docs**: https://docs.odavl.com
- **Community**: Discord invite (see [docs/LAUNCH_STRATEGY.md](docs/LAUNCH_STRATEGY.md))

## License

MIT
