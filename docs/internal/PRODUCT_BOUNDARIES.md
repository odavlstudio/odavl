# ODAVL Product Boundaries - Technical Specification

**Version**: 1.0  
**Last Updated**: 2025-12-10  
**Status**: Enforced via ESLint, TypeScript paths, and code review

---

## 🎯 Overview

ODAVL consists of **three independent products** under the **ODAVL Studio** suite. Each product has a single responsibility and must never duplicate functionality or cross boundaries.

```
Company Name:          ODAVL
Product Suite:         ODAVL Studio
Three Products:        ODAVL Insight | ODAVL Autopilot | ODAVL Guardian
```

---

## 🧠 ODAVL Insight - The Brain

**Arabic**: "يفكر، يحلل، يكشف — لا يلمس الكود أبداً"

### Purpose
ML-powered error detection and analysis across multiple programming languages.

### Responsibilities
✅ **ALLOWED**:
- Detect errors (16 detectors: TypeScript, Security, Performance, Complexity, Circular, Import, Package, Runtime, Build, Network, Isolation, Python Types/Security/Complexity, CVE Scanner, Next.js)
- Analyze code metrics (cyclomatic complexity, cognitive complexity, maintainability index)
- Generate reports (JSON, HTML, Problems Panel export)
- Provide educational explanations (why error exists, how to fix)
- Export diagnostics to VS Code Problems Panel
- Multi-language detection (TypeScript, JavaScript, Python, Java, Go, Rust, PHP, Ruby, Swift, Kotlin)
- ML training for error pattern recognition
- Integration with external analyzers (PHPStan, RuboCop, SwiftLint, Detekt, mypy, flake8, bandit)

❌ **FORBIDDEN**:
- Auto-fix code (that's Autopilot's job)
- Modify files in workspace (read-only access only)
- Execute shell commands that change system state
- Refactor code (that's Autopilot)
- Run quality gates (that's Guardian)
- Deploy or build applications (that's Guardian)

### Package Structure
```
odavl-studio/insight/
├── core/                  # @odavl-studio/insight-core
│   ├── src/detector/      # Individual detectors
│   ├── src/learning/      # ML training utilities
│   └── src/server.ts      # Node-only features
├── cloud/                 # @odavl-studio/insight-cloud (Next.js 15)
└── extension/             # VS Code extension
```

### Allowed Imports
```typescript
// ✅ Can import from:
import { ... } from '@odavl/core';           // Shared utilities
import { ... } from '@odavl/types';          // Shared types
import { ... } from '@odavl-studio/sdk';     // Public SDK
import { ... } from 'typescript';            // TypeScript compiler API
import { ... } from 'eslint';                // ESLint API

// ❌ Cannot import from:
import { ... } from '@odavl-studio/autopilot-engine';  // ❌ Cross-product
import { ... } from '@odavl-studio/guardian-core';     // ❌ Cross-product
```

### Integration Points
- **→ Autopilot**: One-click handoff via "Fix with Autopilot" button
- **→ Guardian**: Code validation before website testing
- **→ VS Code**: Problems Panel integration (`.odavl/problems-panel-export.json`)

### Key Files
- `odavl-studio/insight/core/src/index.ts` - Main entry point
- `odavl-studio/insight/core/src/detector/` - 16 detectors
- `odavl-studio/insight/core/scripts/train-tensorflow-v2.ts` - ML training

---

## 🤖 ODAVL Autopilot - The Executor

**Arabic**: "ينفذ بأمان — لا يحلل، فقط يصلح"

### Purpose
Self-healing code infrastructure with O-D-A-V-L cycle (Observe, Decide, Act, Verify, Learn).

### Responsibilities
✅ **ALLOWED**:
- Auto-fix code (unused imports, formatting, refactoring)
- Execute improvement recipes (from `.odavl/recipes/`)
- Modify files with undo snapshots (diff-based, 85% space savings)
- Run quality checks (ESLint, TypeScript compiler)
- Parallel recipe execution (2-4x faster with dependency graph analysis)
- ML trust prediction (TensorFlow.js neural network with 10 features)
- Smart rollback system (batch rollback on failure)
- Update `.odavl/recipes-trust.json` with success rates
- Create attestation chain (SHA-256 proofs)

❌ **FORBIDDEN**:
- Detect errors (use Insight for analysis)
- Run initial code analysis (Insight does this)
- Generate quality reports (that's Insight)
- Run website tests (that's Guardian)
- Enforce quality gates (that's Guardian)

### Package Structure
```
odavl-studio/autopilot/
├── engine/                # @odavl-studio/autopilot-engine
│   ├── src/phases/        # O-D-A-V-L cycle phases
│   ├── src/parallel/      # Parallel executor
│   ├── src/ml/            # ML trust predictor
│   └── src/undo/          # Rollback manager
├── recipes/               # Improvement recipes (JSON)
└── extension/             # VS Code extension
```

### Allowed Imports
```typescript
// ✅ Can import from:
import { ... } from '@odavl/core';           // Shared utilities
import { ... } from '@odavl/types';          // Shared types
import { ... } from '@odavl-studio/sdk';     // Public SDK
import { ... } from 'eslint';                // For quality checks
import { ... } from 'typescript';            // For type checking
import { ... } from '@tensorflow/tfjs-node'; // ML trust prediction

// ❌ Cannot import from:
import { ... } from '@odavl-studio/insight-core';   // ❌ Should not detect
import { ... } from '@odavl-studio/guardian-core';  // ❌ Cross-product
```

### Integration Points
- **← Insight**: Receives issues from Insight (one-way data flow)
- **→ Guardian**: Triggers Guardian tests after fixes
- **→ VS Code**: FileSystemWatcher on `.odavl/ledger/run-*.json`

### Key Files
- `odavl-studio/autopilot/engine/src/index.ts` - Command router
- `odavl-studio/autopilot/engine/src/phases/` - O-D-A-V-L phases
- `odavl-studio/autopilot/engine/src/parallel/executor.ts` - Parallel execution
- `odavl-studio/autopilot/engine/src/ml/trust-predictor.ts` - ML trust scoring

### Risk Budget (Governance)
```yaml
# .odavl/gates.yml
risk_budget: 100
actions:
  max_auto_changes: 10
  max_files_per_cycle: 10
  max_loc_per_file: 40
forbidden_paths:
  - security/**
  - auth/**
  - "**/*.spec.*"
  - "**/*.test.*"
```

---

## 🛡️ ODAVL Guardian - Website Testing Specialist

**Arabic**: "يختبر المواقع فقط — أذكى من Vercel وPlaywright"

### Purpose
Pre-deploy testing and production monitoring for websites (ONLY websites, not code).

### Responsibilities
✅ **ALLOWED**:
- Website testing (accessibility, performance, security, SEO)
- Visual regression testing (pixel-perfect comparison)
- E2E flows (Playwright integration)
- Multi-browser/device testing (Chrome, Firefox, Safari, Edge)
- Production monitoring (uptime, errors, RUM)
- Quality gates (block deployments based on test scores)
- Lighthouse audits (performance, accessibility, best practices, SEO)
- WCAG 2.1 compliance testing
- Core Web Vitals measurement (LCP, FID, CLS)
- Security testing (OWASP Top 10, CSP validation, SSL/TLS checks)

❌ **FORBIDDEN**:
- Code analysis (use Insight)
- Error detection in TypeScript/JavaScript files (use Insight)
- ESLint or TypeScript checking (use Insight)
- Import cycle detection (use Insight)
- Auto-fix code (use Autopilot)
- File modifications (use Autopilot)

### Package Structure
```
odavl-studio/guardian/
├── app/                   # @odavl-studio/guardian-app (Next.js dashboard)
├── workers/               # @odavl-studio/guardian-workers (Background jobs)
├── core/                  # @odavl-studio/guardian-core (Testing engine)
├── cli/                   # @odavl-studio/guardian-cli (Command-line interface)
└── extension/             # VS Code extension
```

### Allowed Imports
```typescript
// ✅ Can import from:
import { ... } from '@odavl/core';           // Shared utilities
import { ... } from '@odavl/types';          // Shared types
import { ... } from '@odavl-studio/sdk';     // Public SDK
import { ... } from 'playwright';            // Browser automation
import { ... } from 'lighthouse';            // Lighthouse audits
import { ... } from 'axe-core';              // Accessibility testing

// ❌ Cannot import from:
import { ... } from '@odavl-studio/insight-core';    // ❌ Should not analyze code
import { ... } from '@odavl-studio/autopilot-engine'; // ❌ Should not fix code
import { ... } from 'eslint';                         // ❌ No code linting
import { ... } from 'typescript';                     // ❌ No type checking
```

### Integration Points
- **← Autopilot**: Tests websites deployed by Autopilot
- **← Insight**: Uses Insight for code validation (separate step)
- **→ CI/CD**: Webhooks for deployment events

### Key Files
- `odavl-studio/guardian/cli/src/guardian.ts` - CLI entry point
- `odavl-studio/guardian/app/` - Next.js testing dashboard
- `odavl-studio/guardian/workers/` - Background job orchestration
- `odavl-studio/guardian/core/` - Testing engine with plugin system

### Quality Gates
```yaml
# Example guardian.config.json
gates:
  accessibility:
    minScore: 90
    blockDeployment: true
  performance:
    minScore: 80
    maxLCP: 2500ms
  security:
    allowedVulnerabilities: []
```

---

## 🔗 Shared Infrastructure

### Packages (Available to All Products)
```
packages/
├── core/                  # @odavl/core - Shared utilities
├── types/                 # @odavl/types - TypeScript interfaces
├── sdk/                   # @odavl-studio/sdk - Public SDK
├── auth/                  # @odavl-studio/auth - JWT authentication
├── email/                 # @odavl-studio/email - Email service
├── github-integration/    # GitHub API utilities
└── plugins/               # Plugin system for extensibility
```

### Apps (Deployable)
```
apps/
├── studio-cli/            # @odavl-studio/cli - Unified CLI
└── studio-hub/            # Marketing website (Next.js 15)
```

### Critical Rule
**All products MUST import from shared packages, NOT from each other.**

```typescript
// ✅ CORRECT (via shared package):
import { Logger } from '@odavl/core';

// ❌ WRONG (direct cross-product import):
import { Logger } from '@odavl-studio/insight-core';
```

---

## 🚨 Enforcement Mechanisms

### 1. ESLint Rules (`.eslintrc.json`)
```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [
        {
          "group": ["@odavl-studio/insight-*"],
          "importNames": ["*"],
          "message": "Cannot import Insight from Autopilot/Guardian"
        }
      ]
    }]
  }
}
```

### 2. TypeScript Path Mapping (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "paths": {
      "@odavl/core": ["packages/core/src"],
      "@odavl/types": ["packages/types/src"],
      "@odavl-studio/sdk": ["packages/sdk/src"]
    }
  }
}
```

### 3. Dependency Graph Validation
```bash
# Run during CI to detect circular dependencies
pnpm run check-boundaries
```

---

## 📊 Data Flow (One-Way Only)

```
┌─────────────────────────────────────────────────────────┐
│                     User Action                          │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
   ┌─────────┐     ┌──────────┐   ┌──────────┐
   │ Insight │────▶│ Autopilot│──▶│ Guardian │
   │ (Detect)│     │  (Fix)   │   │  (Test)  │
   └─────────┘     └──────────┘   └──────────┘
         │
         │ Export to Problems Panel
         ▼
   ┌─────────────┐
   │  VS Code    │
   └─────────────┘

Flow Rules:
1. Insight → Autopilot (one-click handoff)
2. Autopilot → Guardian (trigger tests after fixes)
3. ❌ NO reverse flow (Guardian cannot call Autopilot)
4. ❌ NO cross-product imports
```

---

## 🔍 Example Violations & Fixes

### Violation 1: Guardian Analyzing Code
```typescript
// ❌ WRONG (guardian-core/src/analyzer.ts)
import { TypeScriptDetector } from '@odavl-studio/insight-core';

export function analyzeCode(file: string) {
  const detector = new TypeScriptDetector();
  return detector.analyze(file);
}

// ✅ CORRECT (use Insight separately)
// In guardian-core: Only test deployed websites
export async function testWebsite(url: string) {
  const lighthouse = await runLighthouse(url);
  return lighthouse.report;
}

// Insight analysis is separate step, not Guardian's job
```

### Violation 2: Autopilot Detecting Errors
```typescript
// ❌ WRONG (autopilot-engine/src/observe.ts)
import { SecurityDetector } from '@odavl-studio/insight-core';

export function observe() {
  const detector = new SecurityDetector();
  const issues = detector.analyze('.');
  return issues;
}

// ✅ CORRECT (use shell commands, not Insight imports)
export function observe() {
  // Run external tools, don't import Insight detectors
  const eslintOutput = execSync('eslint . -f json').toString();
  const tscOutput = execSync('tsc --noEmit').toString();
  return parseMetrics(eslintOutput, tscOutput);
}
```

### Violation 3: Insight Modifying Files
```typescript
// ❌ WRONG (insight-core/src/detector/typescript-detector.ts)
import * as fs from 'fs';

export class TypeScriptDetector {
  fix(file: string) {
    fs.writeFileSync(file, fixedCode); // ❌ NO!
  }
}

// ✅ CORRECT (read-only, suggest fixes)
export class TypeScriptDetector {
  analyze(file: string) {
    const issues = detectIssues(file);
    return {
      issues,
      suggestions: issues.map(i => ({
        message: i.message,
        fix: generateFixSuggestion(i), // Suggestion only, no file write
      })),
    };
  }
}
```

---

## 📝 Summary: Golden Rules

1. **Insight**: Detects errors, NEVER fixes
2. **Autopilot**: Fixes code, NEVER detects (uses external tools)
3. **Guardian**: Tests websites, NEVER analyzes code or fixes
4. **No cross-product imports**: Use shared packages only
5. **One-way data flow**: Insight → Autopilot → Guardian
6. **Shared infrastructure**: All products use `@odavl/core`, `@odavl/types`, `@odavl-studio/sdk`

---

## 🔗 Related Documentation

- **Product Boundaries (this file)**: `docs/internal/PRODUCT_BOUNDARIES.md`
- **Copilot Instructions**: `.github/copilot-instructions.md`
- **Architecture**: `README.md` (Monorepo Structure section)
- **Routing Architecture**: `ODAVL_ROUTING_ARCHITECTURE.md`
- **Billing System**: `ODAVL_BILLING_SYSTEM_COMPLETE.md`

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-10  
**Enforced By**: ESLint, TypeScript, Code Review  
**Status**: ✅ Active
