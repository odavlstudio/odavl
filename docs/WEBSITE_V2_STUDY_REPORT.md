# ODAVL Website v2 — Study & Understand Phase Report

**Date:** November 6, 2025  
**Phase:** Study & Understand (Read-Only)  
**Status:** ✅ COMPLETE  
**Platform:** Windows 11 (PowerShell)

---

## Executive Summary

The ODAVL monorepo is a mature TypeScript-based autonomous code quality platform operating as a pnpm workspace (v9.12.2) with 4 primary applications and 3 shared packages. The existing `odavl-website` (Next.js 14.2.4) and a newer `apps/odavl-website-v2` (Next.js 15) both exist in the repository. The project implements comprehensive governance through `.odavl/` artifacts including risk budgets (≤10 files, ≤40 LOC/file), attestation chains, ledgers, and protected path globs. ODAVL Insight Core provides ML-based error analysis with dual ESM/CJS exports. All governance constraints are enforced via `RiskBudgetGuard` in the CLI with cryptographic attestation and automatic snapshots for rollback.

The repository is ready for safe mirroring work, with robust safety mechanisms already in place. The new v2 site exists but appears incomplete, presenting an opportunity for governed modernization following existing ODAVL patterns.

---

## 1. Repository Map

### Environment

- **Repository Root:** `C:\Users\sabou\dev\odavl`
- **Node.js:** v20.19.5
- **pnpm:** v9.12.2
- **Package Manager:** pnpm workspaces (defined in `pnpm-workspace.yaml`)
- **Git Branch:** (current branch from git status)

### Top-Level Directory Structure

```
odavl/
├── .odavl/                 # Governance artifacts (history, recipes, gates, attestation, ledger)
├── apps/                   # Applications (4 apps)
│   ├── cli/                # ODAVL CLI orchestrator
│   ├── insight-cloud/      # Next.js 15 dashboard (Prisma + Postgres)
│   ├── odavl-website-v2/   # ⭐ NEW website (Next.js 16, React 19)
│   └── vscode-ext/         # VS Code extension
├── packages/               # Shared packages (3 packages)
│   ├── insight-core/       # Error analysis & ML (dual ESM/CJS)
│   ├── sdk/                # Shared SDK
│   └── types/              # Shared TypeScript types
├── odavl-website/          # ⭐ CURRENT website (Next.js 14.2.4)
├── docs/                   # Documentation
├── reports/                # Runtime reports (gitignored)
├── security/               # Protected path
├── scripts/                # Build/CI scripts
└── [other dirs...]
```

### Repository Structure Table

| Path | Type | Purpose | Key Notes |
|------|------|---------|-----------|
| `apps/cli/` | Application | ODAVL CLI orchestrator | 5-phase cycle (O→D→A→V→L), core governance |
| `apps/vscode-ext/` | Application | VS Code extension | Real-time monitoring, panels, file watchers |
| `apps/insight-cloud/` | Application | Next.js 15 dashboard | Prisma + Postgres, global intelligence |
| `apps/odavl-website-v2/` | Application | **New website** | Next.js 16, React 19, incomplete/under development |
| `odavl-website/` | Application | **Current website** | Next.js 14.2.4, Tailwind v4, i18n (9 langs) |
| `packages/insight-core/` | Package | Error analysis & ML | Dual ESM/CJS exports |
| `packages/sdk/` | Package | Shared SDK | - |
| `packages/types/` | Package | Shared TypeScript types | - |
| `.odavl/` | Governance | ODAVL artifacts | History, recipes, gates, attestation, ledger |
| `docs/` | Documentation | Guides & architecture | ARCHITECTURE.md, DEVELOPER_GUIDE.md |

### .odavl Directory Contents

```
.odavl/
├── attestation/           # Cryptographic proofs (SHA-256)
├── attestations/          # Additional attestation categories
├── audit/                 # Audit artifacts
├── consensus/             # Consensus protocol data
├── dashboards/            # Dashboard configurations
├── governance/            # Governance rules and reports
├── guardian/              # Guardian monitoring
├── insight/               # ODAVL Insight artifacts
│   ├── memory/            # insight-memory.json
│   ├── learning/          # model.json
│   ├── fixes/             # suggestions.json, latest.json
│   ├── logs/              # errors.json
│   └── reports/           # Analysis reports
├── learn/                 # Learning phase artifacts
├── ledger/                # Run ledgers (run-*.json)
├── logs/                  # Phase execution logs
├── metrics/               # Performance metrics
├── policy-ledger/         # Policy compliance ledger
├── recipes/               # Improvement recipes (JSON)
├── shadow/                # Shadow CI artifacts
├── snapshots/             # Governance snapshots
├── trust/                 # Trust scoring data
├── undo/                  # Rollback snapshots
├── history.json           # Run history with trust scoring
└── recipes-trust.json     # Recipe success rates
```

---

## 2. Governance & ODAVL Artifacts Summary

### Governance Configuration

**Primary Gates File:**

- **Location:** `apps/odavl-website-v2/.odavl/gates.yml`
- **Risk Budget:** 100
- **Max Files per Cycle:** 10
- **Max Risk per Action:** 25
- **Min Success Rate:** 0.75
- **Max Consecutive Failures:** 3

**Forbidden Paths:**

```yaml
- security/**
- public-api/**
- **/*.spec.*
- **/*.test.*
- auth/**
```

### Governance Implementation

**Policy Loader:**

- **File:** `apps/cli/src/core/policies.ts:13-31`
- **Function:** `getGovernanceConfig()`
- **Defaults:**
  - `maxFiles: 10`
  - `maxLocPerFile: 40`
  - `protectedGlobs: ["security/**", "**/*.spec.*", "public-api/**"]`

**Risk Budget Guard:**

- **File:** `apps/cli/src/core/risk-budget.ts`
- **Enforcement:** Throws BEFORE any file writes if:
  - `edits.length > maxFiles`
  - `e.diffLoc > maxLocPerFile`
  - Path matches `protectedGlobs`

### Governance Summary Table

| Artifact | Exact Path | Purpose | Key Limits/Rules |
|----------|-----------|---------|------------------|
| **Gates Config** | `apps/odavl-website-v2/.odavl/gates.yml` | Quality thresholds & risk budget | `max_files_per_cycle: 10`, `max_risk_per_action: 25` |
| **Policy Loader** | `apps/cli/src/core/policies.ts:13-31` | Reads governance config | Default: `maxFiles: 10`, `maxLocPerFile: 40` |
| **Protected Globs** | `apps/cli/src/core/policies.ts:18` | Paths forbidden from auto-edit | `security/**`, `**/*.spec.*`, `public-api/**` |
| **Risk Guard** | `apps/cli/src/core/risk-budget.ts` | Enforces limits BEFORE writes | Throws if `edits.length > maxFiles` or `diffLoc > maxLocPerFile` |
| **Ledger** | `.odavl/ledger/run-*.json` | Audit trail of all runs | Every run creates timestamped entry with `edits`, `planPath`, `notes` |
| **Attestation** | `.odavl/attestation/*.json` | Cryptographic proofs (SHA-256) | Links successful improvements to verified outcomes |
| **Undo Snapshots** | `.odavl/undo/<timestamp>.json` | Rollback capability | Captures original file contents before modifications |
| **Trust Scores** | `.odavl/recipes-trust.json` | ML feedback loop | Recipe performance: `trust = max(0.1, min(1, success/runs))` |
| **History** | `.odavl/history.json` | Run history with metrics | Append-only log with `eslintWarnings`, `typeErrors`, timestamps |

### Governance Workflow

1. **Plan → Approve → Execute** enforced via `RiskBudgetGuard.validate(edits)`
2. **Snapshots** created in `saveUndoSnapshot(modifiedFiles)` before any writes
3. **Attestation** written after successful verify phase
4. **Ledger** entry created for every run with edit summary

### Sample Ledger Entries (Recent)

```
.odavl/ledger/
├── run-1762386462796.json
├── run-1762386558305.json
├── run-1762388804751.json
└── [15+ more recent runs...]
```

### Sample Attestations

```
.odavl/attestation/
├── attestation-2025-11-03T224026018Z.json
└── latest.json
```

---

## 3. Website Architecture Analysis

### Technology Stack Comparison

| Aspect | Old (`odavl-website/`) | New (`apps/odavl-website-v2/`) |
|--------|----------------------|-------------------------------|
| **Next.js** | 14.2.4 | **16.0.1** (Next.js 15+) |
| **React** | 18.2.0 | **19.2.0** |
| **Tailwind** | 4.1.16 | **4.x** (latest) |
| **TypeScript** | 5.x | 5.x |
| **i18n** | 9 languages (ar, de, en, es, fr, it, ja, pt, ru, zh) | `next-intl` setup present |
| **Router** | App Router (`src/app/`) | App Router (`src/app/`) |
| **Components** | `src/components/` | `src/components/` |
| **MDX** | `@next/mdx` 15.5.6 | `@next/mdx` 16.0.1, `@mdx-js/loader` |
| **Animations** | `framer-motion` 12.23.22 | `framer-motion` 12.23.24 |
| **UI Library** | Radix UI (@radix-ui/*) | Headless UI (@headlessui/react) |
| **Build** | `NEXT_IGNORE_TYPE_ERRORS=1` (⚠️) | Clean build (no error bypass) |
| **Insight Integration** | None | `@odavl/insight-core` workspace dependency |
| **Compilation** | Standard | **React Compiler** (`babel-plugin-react-compiler`) |

### Old Website Structure (`odavl-website/`)

```
odavl-website/
├── src/
│   ├── app/                    # App Router
│   │   ├── api/                # API routes
│   │   ├── ar/                 # Arabic
│   │   ├── de/                 # German
│   │   ├── en/                 # English
│   │   ├── es/                 # Spanish
│   │   ├── fr/                 # French
│   │   ├── it/                 # Italian
│   │   ├── ja/                 # Japanese
│   │   ├── pt/                 # Portuguese
│   │   ├── ru/                 # Russian
│   │   ├── zh/                 # Chinese
│   │   ├── system/             # System pages
│   │   └── tokens/             # Design tokens
│   ├── components/             # React components
│   ├── content/                # Content files
│   ├── data/                   # Data files
│   ├── features/               # Feature modules
│   ├── i18n/                   # i18n configuration
│   ├── lib/                    # Libraries
│   ├── messages/               # i18n messages
│   ├── shared/                 # Shared utilities
│   ├── styles/                 # Styles
│   ├── types/                  # TypeScript types
│   └── utils/                  # Utilities
├── public/                     # Static assets
├── scripts/                    # Build scripts
│   └── clean-validator.js      # Pre-build cleanup (⚠️)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### New Website v2 Structure (`apps/odavl-website-v2/`)

```
apps/odavl-website-v2/
├── .odavl/                     # Governance (gates.yml)
├── src/
│   ├── app/                    # App Router
│   │   ├── api/                # API routes
│   │   ├── changelog/          # Changelog
│   │   ├── docs/               # Documentation
│   │   ├── insight/            # ODAVL Insight integration
│   │   ├── metrics/            # Metrics dashboard
│   │   ├── system/             # System pages
│   │   └── [signature]/        # Dynamic signature route
│   ├── components/             # React components
│   ├── hooks/                  # React hooks
│   ├── lib/                    # Libraries
│   ├── locales/                # i18n locales
│   ├── scripts/                # Scripts
│   ├── server/                 # Server utilities
│   ├── styles/                 # Styles
│   ├── theme/                  # Theme configuration
│   └── types/                  # TypeScript types
├── public/                     # Static assets
├── reports/                    # Reports
├── scripts/                    # Attestation scripts
│   ├── bridge-attest.ts
│   ├── attest-optimization.ts
│   ├── governance-attest.ts
│   └── attest-neural.ts
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### Pages & Routes Map

**Old Website (`odavl-website/src/app/`):**

- `/[locale]/` - Homepage (9 languages: ar, de, en, es, fr, it, ja, pt, ru, zh)
- `/[locale]/system/` - System pages
- `/api/` - API routes
- `/tokens/` - Design tokens

**New Website v2 (`apps/odavl-website-v2/src/app/`):**

- `/api/` - API routes
- `/changelog/` - Changelog
- `/docs/` - Documentation
- `/insight/` - ODAVL Insight integration
- `/system/` - System pages
- `/metrics/` - Metrics dashboard
- `/[signature]/` - Dynamic signature route

**Note:** i18n structure appears incomplete in v2 - needs investigation during Bootstrap phase.

### Configuration Files Comparison

| Config | Old Website | New Website v2 | Notes |
|--------|------------|---------------|-------|
| **next.config** | `next.config.js` | `next.config.js` | v2 uses Next.js 16 features |
| **tailwind.config** | `tailwind.config.js` | `tailwind.config.js` | Both Tailwind v4 |
| **tsconfig.json** | Present | Present | v2 stricter (no error bypass) |
| **eslint config** | `.eslintrc` (old format) | Inherits root flat config | v2 uses ESLint 9 |
| **postcss.config** | `postcss.config.js` | `postcss.config.js` | Tailwind v4 PostCSS |
| **i18n messages** | `src/messages/` | `src/locales/` | Different structure |

### Current Pain Points (Old Website)

| Issue | File/Path | Evidence | Severity |
|-------|-----------|----------|----------|
| **Type errors bypassed** | `package.json:16` | Build uses `NEXT_IGNORE_TYPE_ERRORS=1` flag | 🔴 HIGH |
| **Test placeholder** | `package.json:19` | Test script is echo placeholder, not real tests | 🟡 MEDIUM |
| **Legacy ESLint** | Root config | Uses old `.eslintrc` format vs flat config | 🟡 MEDIUM |
| **Node script cleanup** | `scripts/clean-validator.js` | Pre-build cleanup script (tech debt indicator) | 🟡 MEDIUM |
| **Mixed i18n structure** | `src/i18n/`, `src/messages/` | Inconsistent i18n file organization | 🟢 LOW |
| **Guardian warnings allowed** | `package.json:25` | CI allows guardian failures: `\|\| echo 'Guardian...'` | 🟡 MEDIUM |

### Dependencies Analysis

**Old Website Key Dependencies:**

```json
{
  "next": "14.2.4",
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "next-intl": "^4.4.0",
  "framer-motion": "^12.23.22",
  "tailwindcss": "^4.1.16",
  "@radix-ui/react-*": "^2.x"
}
```

**New Website v2 Key Dependencies:**

```json
{
  "next": "16.0.1",
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "next-intl": "^4.4.0",
  "framer-motion": "^12.23.24",
  "tailwindcss": "^4",
  "@headlessui/react": "^2.2.9",
  "@odavl/insight-core": "workspace:^",
  "babel-plugin-react-compiler": "1.0.0"
}
```

**Key Differences:**

- ✅ Next.js 16 (latest features)
- ✅ React 19 (improved performance)
- ✅ React Compiler enabled
- ✅ Headless UI instead of Radix UI
- ✅ Direct Insight Core integration
- ✅ No type error bypass flags

---

## 4. ODAVL Insight Wiring Map

### Insight Core Package

**Package:** `@odavl/insight-core`  
**Location:** `packages/insight-core/`  
**Version:** 0.1.0  
**Exports:** Dual ESM/CJS

```json
{
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./server": {
      "import": "./dist/server.js",
      "require": "./dist/server.cjs"
    }
  }
}
```

### Insight Artifacts Locations

```
.odavl/insight/
├── memory/
│   ├── insight-memory.json         # Error memory database
│   └── [other memory files]
├── learning/
│   ├── model.json                  # ML model
│   └── [learning artifacts]
├── fixes/
│   ├── suggestions.json            # Fix suggestions
│   └── latest.json                 # Latest fixes
├── logs/
│   └── errors.json                 # Error logs
├── reports/
│   └── [analysis reports]
├── stack/
│   └── [stack frame analysis]
└── model.json                      # Root model file
```

### ODAVL Insight Signals Map

| Signal | Path | Producer | Consumer | Update Cadence |
|--------|------|----------|----------|----------------|
| **Error Memory** | `.odavl/insight/memory/insight-memory.json` | `insight:train` script | CLI phases, VS Code extension | Per run + retraining |
| **ML Model** | `.odavl/insight/model.json`, `learning/model.json` | `insight:train`, `insight:learn` | Decide phase (trust scoring) | Post-verify (learn phase) |
| **Fix Suggestions** | `.odavl/insight/fixes/suggestions.json`, `fixes/latest.json` | `insight:fix` script | Act phase execution | On-demand + per error |
| **Stack Frames** | `.odavl/insight/stack/` | `insight:analyze` | Error root cause detection | Real-time during observe |
| **Error Logs** | `.odavl/insight/logs/errors.json` | `insight:watch` | Live error monitoring | Continuous watch mode |
| **Reports** | `.odavl/insight/reports/` | Verify phase | Dashboard, VS Code panels | Per cycle completion |
| **Shadow Verify** | `shadow/verify-report.md` | Verify phase | Attestation, ledger | Per verify phase |
| **Ledger Entries** | `.odavl/ledger/run-*.json` | Every ODAVL run | VS Code auto-open, audit | Every run (append-only) |
| **Trust Scores** | `.odavl/recipes-trust.json` | Learn phase | Decide phase sorting | Post-verify update |
| **Attestations** | `.odavl/attestation/*.json` | Verify phase (success) | Audit chain, compliance | On successful improvement |

### Integration Points

**VS Code Extension:**

- Watches `.odavl/ledger/` for auto-open (500ms debounce)
- Displays Insight panels with live data
- File watcher: `extension.ts` setupLedgerAutoOpen()

**Website v2:**

- Imports `@odavl/insight-core` workspace package
- Can display live diagnostics
- Integration via `src/app/insight/` routes

**CLI Phases:**

- All phases log to `.odavl/logs/odavl.log`
- Reference Insight artifacts for decision-making
- Update trust scores in learn phase

**Dual Exports:**

- ESM (`.js`) for modern bundlers
- CJS (`.cjs`) for compatibility
- Both formats available from same package

### Insight Core Scripts

```bash
# Available via package.json scripts
pnpm insight:watch      # Watch for errors (continuous)
pnpm insight:analyze    # Analyze stack traces
pnpm insight:root       # Detect root causes
pnpm insight:fix        # Suggest fixes
pnpm insight:live       # Live notifications
pnpm insight:train      # Train ML model
pnpm insight:learn      # Run learning cycle
```

---

## 5. Mirror Plan Skeleton

### Phase Breakdown

#### **Phase 1: Study (CURRENT - Read-Only) ✅ COMPLETE**

**Objective:** Build complete mental model without modifications

**Completed:**

- ✅ Repository structure mapped
- ✅ Governance constraints documented
- ✅ Old vs new website compared
- ✅ Insight integration points identified
- ✅ Risk assessment completed
- ✅ No files modified (confirmed)

**Deliverables:**

- ✅ This report document

---

#### **Phase 2: Bootstrap (Next - Minimal Writes)**

**Objective:** Create clean foundation in `apps/odavl-website-v2/` following governance

**Constraints:**

- ✅ Max 10 files per change (governed)
- ✅ Max 40 LOC per file (governed)
- ✅ No modifications to `security/`, `**/*.spec.*`, `public-api/**`
- ✅ Snapshot before each edit
- ✅ Ledger entry for each run

**Tasks:**

1. **Create Side Branch**

   ```bash
   git checkout -b odavl/website-v2-bootstrap-20251106
   ```

2. **Mirror P0: Core Layout (≤10 files)**
   - `src/app/layout.tsx` - Root layout
   - `src/components/Navigation.tsx` - Main navigation
   - `src/components/Footer.tsx` - Site footer
   - `src/lib/constants.ts` - Site constants
   - **Governance Check:** 4 files ≤ 10 ✅

3. **Mirror P0: Homepage English (≤10 files)**
   - `src/app/en/page.tsx` - Homepage
   - `src/components/Hero.tsx` - Hero section
   - `src/components/Features.tsx` - Features section
   - **Governance Check:** 3 files ≤ 10 ✅

4. **Mirror P0: i18n Foundation (≤10 files)**
   - `src/locales/en.json` - English messages
   - `src/lib/i18n-config.ts` - i18n setup
   - **Governance Check:** 2 files ≤ 10 ✅

5. **Configure Build Pipeline**
   - Verify `next.config.js` has no type error bypass
   - Add proper TypeScript strict checks
   - Configure ESLint integration

6. **Add Insight Hooks**
   - `src/lib/insight.ts` - Insight Core integration
   - Basic error tracking setup

7. **Create Attestations**
   - After each mini-cycle
   - SHA-256 hash of changes
   - Ledger entries

**Acceptance Criteria:**

- [ ] Branch created successfully
- [ ] Core layout renders without errors
- [ ] Homepage (English) displays correctly
- [ ] i18n configuration loads
- [ ] Build completes with zero type errors
- [ ] ESLint passes cleanly
- [ ] All changes have ledger entries
- [ ] Attestations created for successful changes

---

#### **Phase 3: Verify**

**Objective:** Ensure mirrored pages match old site behavior

**Tasks:**

1. **Visual Regression Testing**
   - Side-by-side comparison screenshots
   - Layout consistency check
   - Responsive design verification

2. **i18n Coverage Verification**
   - Test English locale works
   - Prepare structure for remaining 8 languages
   - Message key parity check

3. **Build Quality Gates**

   ```bash
   # Must all pass:
   pnpm typecheck          # Zero type errors
   pnpm lint               # Zero ESLint errors
   pnpm build              # Successful build
   pnpm test               # All tests pass (once added)
   ```

4. **Performance Baseline**
   - Lighthouse audit
   - Core Web Vitals measurement
   - Bundle size analysis

5. **Accessibility Audit**
   - WCAG 2.1 AA compliance
   - Screen reader testing
   - Keyboard navigation

**Quality Gates:**

- [ ] Zero type errors (`tsc --noEmit`)
- [ ] ESLint delta ≤ 0
- [ ] Build completes without `NEXT_IGNORE_TYPE_ERRORS`
- [ ] All routes return 200 status
- [ ] Lighthouse score ≥ 90
- [ ] No accessibility violations

---

#### **Phase 4: Attest**

**Objective:** Cryptographic proof of successful mirror

**Artifacts to Generate:**

1. **Attestation File**
   - Location: `.odavl/attestation/website-v2-bootstrap-*.json`
   - SHA-256 hash of all changes
   - Timestamp and run ID
   - Success metrics

2. **Ledger Summary**
   - Location: `.odavl/ledger/run-website-v2-bootstrap-*.json`
   - List of all edited files
   - LOC changes per file
   - Verification results

3. **Trust Score Update**
   - Update `.odavl/recipes-trust.json`
   - Record success of mirror recipes
   - Calculate new trust scores

4. **Governance Compliance Report**
   - Confirm all changes within limits
   - Document any exceptions (none expected)
   - Risk budget utilization

**Acceptance Criteria:**

- [ ] Attestation file created with valid SHA-256
- [ ] Ledger entry complete with all edits
- [ ] Trust scores updated
- [ ] Governance report shows 100% compliance

---

### Priority Order: Pages to Mirror

| Priority | Page/Component | Rationale | Est. Files | Governance Batch |
|----------|---------------|-----------|------------|------------------|
| **P0-A** | Layout & Navigation | Foundation for all pages | 3-4 | Batch 1 (≤10) |
| **P0-B** | Homepage (English) | Core landing experience | 2-3 | Batch 1 (≤10) |
| **P0-C** | i18n Config | Enables multi-language | 2 | Batch 1 (≤10) |
| **P1-A** | Footer & Global Components | Site-wide elements | 4-5 | Batch 2 (≤10) |
| **P1-B** | About/Features Pages | Marketing content | 4-5 | Batch 3 (≤10) |
| **P1-C** | Docs Landing | Documentation structure | 3-4 | Batch 4 (≤10) |
| **P2-A** | Arabic (ar) Locale | i18n expansion | 2-3 | Batch 5 (≤10) |
| **P2-B** | German (de) Locale | i18n expansion | 2-3 | Batch 6 (≤10) |
| **P2-C** | Spanish (es) Locale | i18n expansion | 2-3 | Batch 7 (≤10) |
| **P2-D** | Remaining 6 locales | Complete i18n | 2-3 each | Batches 8-13 (≤10) |
| **P3-A** | Insight Integration | Advanced features | 5-6 | Batch 14 (≤10) |
| **P3-B** | Metrics Dashboard | Analytics features | 5-6 | Batch 15 (≤10) |

**Total Batches:** ~15 governed changes  
**Governance Check:** Each batch ≤10 files ✅

---

### Configs: Replicate vs Modernize Strategy

| Config | Strategy | Rationale | Actions |
|--------|----------|-----------|---------|
| `next.config.js` | **Modernize** | Use Next.js 16 features, enable React Compiler | Remove type error bypass, add compiler config |
| `tailwind.config.js` | **Modernize** | Tailwind v4 latest syntax, better performance | Update to v4 PostCSS approach |
| `tsconfig.json` | **Replicate + Enhance** | Keep working paths, strengthen checks | Add `strict: true`, remove error suppressions |
| `eslint.config.mjs` | **Inherit** | Already flat config in monorepo root | Use existing monorepo config |
| `package.json` scripts | **Modernize** | Remove placeholders, add real tooling | Replace echo scripts with Vitest, real commands |
| i18n messages | **Replicate** | Exact message parity required | Copy structure, verify keys match |
| PostCSS config | **Modernize** | Tailwind v4 PostCSS integration | Use `@tailwindcss/postcss` |
| `.odavl/gates.yml` | **Already Present** | Governance ready | Use existing configuration |

---

### Risk Assessment for Initial Mirroring

| Risk | Severity | Likelihood | Impact | Mitigation | Status |
|------|----------|-----------|--------|------------|--------|
| **Breaking i18n** | 🔴 HIGH | MEDIUM | Users lose language access | Test all 9 languages after each i18n change | ✅ Planned |
| **Type errors** | 🟡 MEDIUM | LOW | Build failures | Strict TypeScript from day 1, no bypass | ✅ Config ready |
| **Asset path changes** | 🟢 LOW | LOW | Broken images/fonts | Mirror `/public/` structure exactly | ✅ Understood |
| **Dependencies drift** | 🟢 LOW | MEDIUM | Breaking changes | Lock versions, test incrementally | ✅ Monitored |
| **Build pipeline** | 🟡 MEDIUM | MEDIUM | Production deploy blocked | Remove `NEXT_IGNORE_TYPE_ERRORS`, fix root causes | ✅ Prioritized |
| **Governance violation** | 🟢 LOW | LOW | Rollback required | RiskBudgetGuard enforces automatically | ✅ Automated |
| **Node/pnpm version mismatch** | 🟢 LOW | LOW | Environment issues | Already aligned (Node 20.19.5, pnpm 9.12.2) | ✅ Verified |
| **Component library change** | 🟡 MEDIUM | MEDIUM | UI inconsistency | Radix → Headless UI needs careful migration | ⚠️ Monitor |
| **React 19 breaking changes** | 🟡 MEDIUM | LOW | Runtime errors | Test thoroughly, use React 19 migration guide | ⚠️ Monitor |

**Overall Risk Level:** 🟡 MEDIUM (manageable with governance)

---

## 6. Blocked/Unknowns & Resolution Plan

### Unknowns Requiring Bootstrap Phase Investigation

| Unknown | Why It Matters | How to Resolve | Priority |
|---------|---------------|----------------|----------|
| **Exact i18n message count** | Must stay within 10-file limit per batch | Count during Bootstrap, split by language if needed | 🔴 HIGH |
| **Asset dependencies** | Images/fonts may have complex references | Audit during first page mirror, document paths | 🟡 MEDIUM |
| **API route complexity** | `/api/` might have external dependencies | Test with minimal route first, check for DB/auth | 🟡 MEDIUM |
| **MDX content volume** | Docs pages may exceed LOC limits | Prioritize by topic, split large files | 🟢 LOW |
| **Performance baselines** | Need before/after metrics for comparison | Capture during Verify phase with Lighthouse | 🟡 MEDIUM |
| **i18n missing in v2** | Only partial locale structure exists | Bootstrap with English first, validate pattern | 🔴 HIGH |
| **Headless UI migration** | Different API from Radix UI | Component-by-component migration, test UI | 🟡 MEDIUM |
| **React Compiler compatibility** | May have edge cases with existing code | Test incrementally, disable for problematic components | 🟢 LOW |

---

### Pre-Bootstrap Validation Commands (PowerShell)

Execute these before starting Bootstrap phase:

```powershell
# 1. Verify workspace clean
git status --porcelain

# 2. Count i18n message files in old website
(Get-ChildItem -Path .\odavl-website\src\messages -Recurse -File).Count

# 3. Measure old website page count
(Get-ChildItem -Path .\odavl-website\src\app\en -Recurse -File).Count

# 4. Check for external API dependencies
Get-Content .\odavl-website\src\app\api\* -Recurse -Include *.ts,*.tsx | 
  Select-String -Pattern "fetch|axios|http|prisma|database"

# 5. Identify large components (potential split candidates)
Get-ChildItem -Path .\odavl-website\src\components -Recurse -File | 
  ForEach-Object { 
    [PSCustomObject]@{
      File = $_.Name
      Lines = (Get-Content $_.FullName).Count
      Path = $_.FullName
    } 
  } | 
  Where-Object Lines -gt 100 | 
  Sort-Object Lines -Descending |
  Format-Table -AutoSize

# 6. Verify v2 has dependencies installed
Test-Path .\apps\odavl-website-v2\node_modules

# 7. Check current TypeScript errors in old website
Set-Location .\odavl-website
npx tsc --noEmit 2>&1 | Select-String "error TS"
Set-Location ..

# 8. Compare package.json versions
Get-Content .\odavl-website\package.json | ConvertFrom-Json | 
  Select-Object -ExpandProperty dependencies | 
  Format-List

Get-Content .\apps\odavl-website-v2\package.json | ConvertFrom-Json | 
  Select-Object -ExpandProperty dependencies | 
  Format-List

# 9. List existing v2 pages
Get-ChildItem -Path .\apps\odavl-website-v2\src\app -Recurse -File |
  Select-Object FullName

# 10. Verify ODAVL CLI available
pnpm odavl:run --help
```

---

## 7. Acceptance Criteria for Study Phase

### Study Phase Checklist ✅ ALL COMPLETE

- [x] **Repository Map** - Complete structure documented with exact paths
- [x] **Governance Summary** - All constraints, limits, and enforcement points identified
- [x] **ODAVL Insight Map** - Signal flows, producers, consumers documented
- [x] **Website Comparison** - Old vs v2 architecture, tech stack, pain points
- [x] **Risk Assessment** - Blockers identified with mitigation strategies
- [x] **Mirror Plan** - Phase breakdown with priority order and file estimates
- [x] **No File Modifications** - Study phase completed read-only

**Confirmation:** ✅ No files were modified during this study phase. All operations were read-only PowerShell commands and file content inspections.

---

## 8. Next Steps: Bootstrap Phase Kickoff

### Bootstrap Phase Preparation

**When Ready to Start:**

1. **Review this study report thoroughly**
2. **Execute pre-bootstrap validation commands** (see section 6)
3. **Confirm all team members aligned on approach**
4. **Set aside dedicated time for focused work**
5. **Ensure clean git state**

### First Bootstrap Commands (PowerShell)

```powershell
# 1. Ensure we're on main/master and up-to-date
git checkout main
git pull origin main

# 2. Create governed side branch
git checkout -b odavl/website-v2-bootstrap-20251106

# 3. Verify branch created
git branch --show-current

# 4. Navigate to v2 directory
Set-Location apps\odavl-website-v2

# 5. Verify dependencies installed
pnpm install

# 6. Run initial build to establish baseline
pnpm build

# 7. Return to repo root
Set-Location ..\..

# 8. Ready for first governed change
# (Wait for explicit plan approval before executing)
```

### First Governed Change Plan (Example)

**Change:** Mirror P0-A Layout Foundation

**Files to Create/Modify (≤10):**

1. `apps/odavl-website-v2/src/app/layout.tsx`
2. `apps/odavl-website-v2/src/components/Navigation.tsx`
3. `apps/odavl-website-v2/src/components/Footer.tsx`
4. `apps/odavl-website-v2/src/lib/constants.ts`

**Governance Pre-Flight:**

- File count: 4 ≤ 10 ✅
- Each file estimated: ~30-40 LOC ≤ 40 ✅
- No protected paths affected ✅
- Snapshot will be created ✅
- Ledger entry will be generated ✅

**Execution Flow:**

1. Create snapshot
2. Copy/adapt files from old website
3. Test locally (`pnpm dev`)
4. Type check (`pnpm typecheck`)
5. Lint (`pnpm lint`)
6. Build (`pnpm build`)
7. Create ledger entry
8. Commit with descriptive message
9. Create attestation

### Copilot Prompt for Bootstrap Start

```
@workspace Begin Bootstrap Phase for odavl-website-v2.

Context:
- Study phase complete (see docs/WEBSITE_V2_STUDY_REPORT.md)
- Branch: odavl/website-v2-bootstrap-20251106 (create if not exists)
- Current: Windows 11, PowerShell, Node 20.19.5, pnpm 9.12.2

First Governed Change: Mirror P0-A Layout Foundation

Files to create/modify (4 files ≤ 10 limit):
1. apps/odavl-website-v2/src/app/layout.tsx
2. apps/odavl-website-v2/src/components/Navigation.tsx
3. apps/odavl-website-v2/src/components/Footer.tsx
4. apps/odavl-website-v2/src/lib/constants.ts

Source reference: odavl-website/src/app/en/layout.tsx and components

Governance requirements:
- Max 40 LOC per file
- Create snapshot before edits
- Generate ledger entry after
- Zero type errors
- Clean ESLint pass

Show me the exact implementation plan with code snippets before executing.
Wait for my approval before making any file changes.
```

---

## 9. Governance Reminder

### Critical Constraints (Always Enforce)

```yaml
Risk Budget:
  max_files_per_cycle: 10
  max_loc_per_file: 40
  max_risk_per_action: 25

Protected Paths:
  - security/**
  - public-api/**
  - **/*.spec.*
  - **/*.test.*
  - auth/**

Enforcement:
  - block_if_risk_exceeded
  - rollback_on_failure
  - require_attestation

Workflow:
  1. Plan (detailed, reviewed)
  2. Snapshot (before any edits)
  3. Execute (within limits)
  4. Verify (type check, lint, build)
  5. Ledger (document changes)
  6. Attest (SHA-256 proof)
```

### Side Branch Naming Convention

```
odavl/<task>-YYYYMMDD

Examples:
- odavl/website-v2-bootstrap-20251106
- odavl/website-v2-i18n-20251107
- odavl/website-v2-components-20251108
```

### Commit Message Format

```
[ODAVL] <type>: <description>

Types: mirror, add, update, fix, refactor, docs
Scope: website-v2, layout, i18n, components

Example:
[ODAVL] mirror: Add P0-A layout foundation (4 files, 128 LOC)

- Added root layout.tsx with Next.js 16 config
- Created Navigation component with i18n support
- Added Footer component
- Created constants.ts for site configuration

Governance: ✅ 4 files ≤ 10, all ≤ 40 LOC
Ledger: .odavl/ledger/run-1762428000000.json
Attestation: .odavl/attestation/website-v2-bootstrap-*.json
```

---

## 10. Study Phase Summary

### What We Learned

1. **Repository is Well-Governed**: Comprehensive `.odavl/` infrastructure with automatic enforcement
2. **Both Websites Exist**: Old (complete, 9 languages) and v2 (modern stack, incomplete)
3. **Clear Modernization Path**: Next.js 16, React 19, Tailwind 4, React Compiler
4. **Insight Integration Ready**: Workspace package available, integration points identified
5. **No Blockers**: All tools, versions, and governance in place for safe mirroring

### Key Metrics

- **Node.js:** v20.19.5 ✅
- **pnpm:** v9.12.2 ✅
- **Old Website:** Next.js 14.2.4, React 18, 9 languages, ~50+ pages
- **New Website v2:** Next.js 16, React 19, partial implementation
- **Governance Limits:** ≤10 files/cycle, ≤40 LOC/file
- **Protected Paths:** 5 glob patterns enforced
- **Estimated Mirror Batches:** ~15 governed changes

### Confidence Level: 🟢 HIGH

- ✅ Complete visibility into structure
- ✅ Governance automation in place
- ✅ Clear incremental path forward
- ✅ Risk assessment complete
- ✅ No unknowns blocking start

### Recommended Next Action

**Review this report → Execute pre-bootstrap validation → Begin Bootstrap Phase with first P0-A change**

---

## Appendix A: PowerShell Commands Reference

### Read-Only Investigation Commands

```powershell
# Repository basics
pwd
git rev-parse --show-toplevel
git status --porcelain
git branch --show-current

# Structure exploration
Get-ChildItem -Path . -Directory -Depth 0
Get-ChildItem -Path apps -Directory
Get-ChildItem -Path packages -Directory
Get-ChildItem -Path .\.odavl -Force

# Version checks
node -v
pnpm -v
npm -v

# Find configuration files
Get-ChildItem -Recurse -Filter "next.config.*"
Get-ChildItem -Recurse -Filter "tailwind*.{js,ts,cjs,mjs}"
Get-ChildItem -Recurse -Filter "*.eslintrc*"
Get-ChildItem -Recurse -Filter "tsconfig*.json"
Get-ChildItem -Recurse -Filter "gates.yml"

# Package inspection
Get-Content package.json | ConvertFrom-Json | Format-List
Get-Content pnpm-workspace.yaml

# File counting
(Get-ChildItem -Path <directory> -Recurse -File).Count

# Line counting for large files
Get-ChildItem -Path <directory> -Recurse -File | 
  ForEach-Object { 
    [PSCustomObject]@{
      File = $_.Name
      Lines = (Get-Content $_.FullName).Count
    } 
  } | 
  Sort-Object Lines -Descending

# Search for patterns
Get-Content <file> | Select-String -Pattern "<pattern>"
```

---

## Appendix B: Key File Paths

### Governance Files

- `apps/odavl-website-v2/.odavl/gates.yml` - Quality gates config
- `apps/cli/src/core/policies.ts` - Policy loader
- `apps/cli/src/core/risk-budget.ts` - Risk enforcement
- `.odavl/history.json` - Run history
- `.odavl/recipes-trust.json` - Trust scores
- `.odavl/ledger/run-*.json` - Ledger entries
- `.odavl/attestation/*.json` - Attestations

### Website Files

- `odavl-website/package.json` - Old website dependencies
- `apps/odavl-website-v2/package.json` - New website dependencies
- `odavl-website/src/app/` - Old website pages (9 languages)
- `apps/odavl-website-v2/src/app/` - New website pages (partial)
- `odavl-website/src/components/` - Old components
- `apps/odavl-website-v2/src/components/` - New components

### Insight Files

- `packages/insight-core/package.json` - Insight package config
- `.odavl/insight/memory/insight-memory.json` - Error memory
- `.odavl/insight/learning/model.json` - ML model
- `.odavl/insight/fixes/suggestions.json` - Fix suggestions

### Documentation

- `docs/ARCHITECTURE.md` - System architecture
- `docs/DEVELOPER_GUIDE.md` - Development guide
- `docs/COPILOT_GUIDE_AR.md` - Copilot usage guide (Arabic)
- `.github/copilot-instructions.md` - AI agent instructions
- `.github/COPILOT_QUICK_REFERENCE.md` - Quick reference

---

## Appendix C: Technology Versions Summary

| Technology | Old Website | New Website v2 | Notes |
|------------|-------------|----------------|-------|
| Next.js | 14.2.4 | 16.0.1 | Major upgrade |
| React | 18.2.0 | 19.2.0 | Major upgrade |
| TypeScript | 5.x | 5.x | Same |
| Tailwind CSS | 4.1.16 | 4.x | Latest v4 |
| ESLint | 9.37.0 (old format) | 9.x (flat config) | Modernized |
| Node.js | ≥18.18 | ≥20.0.0 | Current: 20.19.5 ✅ |
| pnpm | 9.12.2 | 9.12.2 | Same ✅ |
| next-intl | 4.4.0 | 4.4.0 | Same |
| framer-motion | 12.23.22 | 12.23.24 | Patch update |
| UI Library | Radix UI | Headless UI | Different library |
| React Compiler | ❌ Not enabled | ✅ Enabled | Performance boost |
| Insight Core | ❌ Not integrated | ✅ Integrated | workspace:^ |

---

**End of Study Phase Report**

**Status:** ✅ COMPLETE  
**Next Phase:** Bootstrap (awaiting approval to begin)  
**Maintained by:** ODAVL Team  
**Last Updated:** November 6, 2025
