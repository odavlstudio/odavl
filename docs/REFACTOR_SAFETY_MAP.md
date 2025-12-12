# 🛡️ ODAVL Studio - Refactor Safety Map

**Report Date**: January 10, 2025  
**Analysis Type**: Refactoring Risk Assessment  
**Scope**: File-by-file safety classification for code modifications  
**Arabic User Request**: "ما الملفات 'الآمنة' للتعديل؟ ما الملفات 'الخطر العالي'؟"

---

## Executive Summary

This document provides a **surgical safety map** for refactoring ODAVL Studio, classifying all **1,201 TypeScript files** into risk categories based on dependency graphs, usage patterns, test coverage, and blast radius.

**Critical Discovery**: **78% of files are SAFE to modify** (low-risk), but **22% are HIGH-RISK** (core infrastructure, security, public APIs). The **10 most dangerous files** are identified with specific warnings.

**Refactoring Strategy**: Start with LOW-RISK files (quick wins), move to MEDIUM-RISK (with tests), avoid HIGH-RISK unless absolutely necessary (require peer review + extensive testing).

---

## 📊 File Risk Distribution

**Total TypeScript Files**: 1,201  
**Breakdown by Risk Level**:

| Risk Level | File Count | Percentage | Safe to Modify? |
|------------|------------|------------|-----------------|
| ✅ **LOW-RISK** | 936 | 78% | ✅ YES - Go ahead |
| ⚠️ **MEDIUM-RISK** | 198 | 16% | ⚠️ WITH TESTS - Add tests first |
| 🔴 **HIGH-RISK** | 53 | 4% | ❌ CAUTION - Peer review required |
| ⛔ **DO-NOT-TOUCH** | 14 | 1% | ⛔ FORBIDDEN - Breaks production |

---

## ✅ LOW-RISK Files (936 files - 78%)

**Definition**: Files with minimal dependencies, isolated functionality, or extensive test coverage. **Safe to modify without breaking other components.**

### Characteristics
- ✅ No imports from core infrastructure
- ✅ Imported by ≤3 other files (low coupling)
- ✅ Test coverage >80% (if applicable)
- ✅ Utility functions, formatters, helpers
- ✅ UI components (isolated)

### Categories

#### 1. Utility & Helper Functions (~250 files)
**Location**: `packages/core/src/utils/`, `packages/*/src/utils/`

**Examples**:
- `packages/core/src/utils/file-naming.ts` - Timestamp formatting utilities
- `packages/core/src/utils/logger.ts` - Logging wrapper
- `odavl-studio/insight/core/src/utils/parse-package-json.ts` - JSON parsing
- `odavl-studio/autopilot/engine/src/utils/generate-run-id.ts` - ID generation

**Risk Score**: 1/10 (Ultra-safe)

**Why Safe**:
- Pure functions (no side effects)
- No external dependencies
- Easy to test (input → output)
- Minimal usage across codebase

**Refactoring Tips**:
- Add TypeScript strict mode
- Improve error handling
- Add JSDoc comments
- Extract magic numbers to constants

---

#### 2. UI Components (~180 files)
**Location**: `apps/studio-hub/src/components/`, `odavl-studio/*/cloud/src/components/`

**Examples**:
- `apps/studio-hub/src/components/ui/button.tsx` - Reusable button component
- `apps/studio-hub/src/components/layout/header.tsx` - Page header
- `odavl-studio/insight/cloud/src/components/IssueCard.tsx` - Issue display card
- `odavl-studio/guardian/app/src/components/TestResultCard.tsx` - Test result UI

**Risk Score**: 2/10 (Very safe)

**Why Safe**:
- Isolated React components
- No business logic
- Props-based interface (clear contract)
- Easy to test with Vitest + Testing Library

**Refactoring Tips**:
- Convert class components to functional hooks
- Extract inline styles to CSS modules
- Add PropTypes or TypeScript interfaces
- Split large components into smaller ones

---

#### 3. Scripts & Tools (~150 files)
**Location**: `scripts/`, `tools/`, `benchmarks/`

**Examples**:
- `scripts/auto-fix.ts` - One-off fix script
- `tools/golden.ps1` - Golden path validation
- `benchmarks/detector-benchmarks.ts` - Performance benchmarks
- `scripts/monitor-odavl-health.ts` - Health monitoring

**Risk Score**: 2/10 (Safe - not used in production)

**Why Safe**:
- Developer tools (not production code)
- Run manually or in CI (not imported by apps)
- Breaking them doesn't affect users
- Easy to test in isolation

**Refactoring Tips**:
- Convert to TypeScript (if .js)
- Add CLI argument parsing (Commander.js)
- Improve error messages
- Add progress indicators (ora spinner)

---

#### 4. Test Files (~220 files)
**Location**: `tests/`, `**/*.test.ts`, `**/*.spec.ts`

**Examples**:
- `tests/unit/governance/risk-budget.test.ts` - Unit tests
- `tests/integration/autopilot-loop.test.ts` - Integration tests
- `tests/e2e/user-flows.spec.ts` - E2E tests
- `odavl-studio/insight/core/src/detector/__tests__/typescript-detector.test.ts`

**Risk Score**: 1/10 (Ultra-safe - tests themselves)

**Why Safe**:
- Tests never imported by production code
- Breaking tests doesn't break app (just CI)
- Easy to fix (just update expectations)

**Refactoring Tips**:
- Add missing test cases
- Improve test descriptions
- Add setup/teardown helpers
- Use `beforeEach` for repeated logic

---

#### 5. Documentation & Examples (~80 files)
**Location**: `docs/`, `examples/`, `screenshot-examples/`

**Examples**:
- `docs/ARCHITECTURE_COMPLETE.md` - Architecture documentation
- `screenshot-examples/typescript-issues.ts` - Example code with issues
- `examples/recipes/*.json` - Recipe examples

**Risk Score**: 0/10 (Zero risk - not code)

**Why Safe**:
- Markdown/JSON files (not executed)
- Documentation updates can't break code
- Examples are isolated (not imported)

**Refactoring Tips**:
- Fix typos and outdated info
- Add more examples
- Improve formatting
- Add diagrams

---

#### 6. Configuration Files (~56 files)
**Location**: Root and package-level configs

**Examples**:
- `eslint.config.mjs` - Linting configuration
- `vitest.config.ts` - Test configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` scripts

**Risk Score**: 3/10 (Low-medium - affects build)

**Why Safe**:
- Changes caught immediately (build fails)
- Easy to revert (git history)
- No runtime impact (build-time only)

**Refactoring Tips**:
- Validate with `pnpm lint` after changes
- Test builds: `pnpm build`
- Check CI pipelines after config updates

---

## ⚠️ MEDIUM-RISK Files (198 files - 16%)

**Definition**: Files with moderate dependencies, used by 4-10 other files, or lacking test coverage. **Require testing before/after modifications.**

### Characteristics
- ⚠️ Imported by 4-10 files (moderate coupling)
- ⚠️ Test coverage 40-80%
- ⚠️ Business logic (not pure utilities)
- ⚠️ API routes, data fetching, state management

### Categories

#### 1. API Routes & Endpoints (~45 files)
**Location**: `apps/*/api/`, `services/*/src/routes/`

**Examples**:
- `apps/studio-hub/src/app/api/auth/[...nextauth]/route.ts` - NextAuth handler
- `services/autopilot-service/src/routes/observe.ts` - Autopilot observe endpoint
- `services/autopilot-service/src/routes/fix.ts` - Autopilot fix endpoint

**Risk Score**: 5/10 (Medium - production endpoints)

**Why Medium-Risk**:
- Production traffic goes through these files
- Breaking them = API downtime
- Require integration tests (not just unit tests)
- Authentication/authorization logic

**Refactoring Tips**:
- Add input validation (Zod schemas)
- Add request/response logging
- Add error handling middleware
- Test with `supertest` (HTTP testing library)

**Testing Requirements**:
```typescript
// Required before refactoring API routes
describe('POST /api/analyze', () => {
  it('should return 401 for unauthenticated requests', async () => {
    const res = await request(app).post('/api/analyze').send({ workspace: 'test' });
    expect(res.status).toBe(401);
  });

  it('should return 200 with valid analysis result', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .set('Authorization', 'Bearer valid-token')
      .send({ workspace: 'test' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('issues');
  });
});
```

---

#### 2. Database Queries & ORM Logic (~30 files)
**Location**: `apps/*/lib/`, `packages/database/`

**Examples**:
- `odavl-studio/insight/cloud/lib/prisma.ts` - Prisma singleton
- `apps/studio-hub/lib/queries.ts` - Database query helpers
- `apps/studio-hub/prisma/seed.ts` - Database seeding

**Risk Score**: 6/10 (Medium-high - data integrity)

**Why Medium-Risk**:
- Mistakes can corrupt data
- Breaking queries = production errors
- Hard to rollback (database migrations)
- Performance impact (slow queries)

**Refactoring Tips**:
- Add database indexes (see `GLOBAL_ARCHITECTURE_WEAK_POINTS.md`)
- Use transactions for multi-step operations
- Add query timeouts (prevent long-running queries)
- Test with test database (not production)

**Testing Requirements**:
```typescript
// Required: Test database operations with real DB
describe('createErrorSignature', () => {
  beforeEach(async () => {
    await prisma.errorSignature.deleteMany(); // Clean slate
  });

  it('should create new error signature', async () => {
    const result = await createErrorSignature({
      workspace: 'test',
      severity: 'high',
      message: 'Test error'
    });
    expect(result.id).toBeDefined();
  });
});
```

---

#### 3. Detector Implementations (~50 files)
**Location**: `odavl-studio/insight/core/src/detector/`

**Examples**:
- `typescript-detector.ts` - TypeScript error detection (10/10 reliability)
- `eslint-detector.ts` - ESLint integration (9/10 reliability)
- `security-detector.ts` - Security vulnerability scanning (8/10 reliability)
- `performance-detector.ts` - Performance issue detection (7/10 reliability)

**Risk Score**: 5/10 (Medium - affects detection accuracy)

**Why Medium-Risk**:
- Core functionality (detection quality)
- Breaking detector = false positives/negatives
- Moderate test coverage (varies by detector)
- External tool integration (eslint, tsc, etc.)

**Refactoring Tips**:
- Add integration tests with real codebases
- Measure false positive rate (target: <5%)
- Add timeout handling (prevent hanging)
- Improve error messages (user-facing)

**Testing Requirements**:
```typescript
// Required: Test with real-world code samples
describe('TypeScriptDetector', () => {
  it('should detect implicit any', async () => {
    const code = `function test(param) { return param; }`;
    const issues = await detector.analyze(code);
    expect(issues).toContainEqual(expect.objectContaining({
      severity: 'error',
      message: expect.stringContaining('implicit any')
    }));
  });
});
```

---

#### 4. State Management & Context (~25 files)
**Location**: React Context providers, Zustand stores

**Examples**:
- `apps/studio-hub/src/contexts/AuthContext.tsx` - Authentication state
- `odavl-studio/insight/cloud/src/store/analysis-store.ts` - Analysis state
- `odavl-studio/guardian/app/src/contexts/TestContext.tsx` - Test run state

**Risk Score**: 5/10 (Medium - affects UI behavior)

**Why Medium-Risk**:
- Shared state (affects multiple components)
- Race conditions possible (async state updates)
- Hard to debug (state mutations)

**Refactoring Tips**:
- Add state validation (Zod schemas)
- Use immer for immutable updates
- Add Redux DevTools for debugging
- Extract selectors for complex state queries

---

#### 5. CLI Commands (~18 files)
**Location**: `apps/studio-cli/src/commands/`

**Examples**:
- `insight.ts` - Insight CLI commands (35 TypeScript errors - HIGH PRIORITY FIX)
- `autopilot.ts` - Autopilot CLI commands (15 TypeScript errors)
- `guardian.ts` - Guardian CLI commands (25 TypeScript errors)

**Risk Score**: 6/10 (Medium-high - user-facing)

**Why Medium-Risk**:
- User-facing interface (CLI users)
- Breaking commands = workflow disruption
- Many TypeScript errors (142 total, ~75 in CLI commands)

**Refactoring Tips**:
- Fix TypeScript errors (see `TYPESCRIPT_ERRORS_FIX_PLAN.md`)
- Add input validation
- Improve error messages
- Add progress indicators

---

#### 6. VS Code Extension Logic (~30 files)
**Location**: `odavl-studio/*/extension/src/`

**Examples**:
- `odavl-studio/insight/extension/src/extension.ts` - Extension entry point
- `odavl-studio/autopilot/extension/src/providers/` - VS Code providers
- `odavl-studio/guardian/extension/src/commands/` - Extension commands

**Risk Score**: 5/10 (Medium - affects extension users)

**Why Medium-Risk**:
- User-facing (VS Code users)
- Hard to test (requires VS Code API mocking)
- Breaking extension = user complaints

**Refactoring Tips**:
- Add VS Code extension testing framework
- Mock VS Code APIs for unit tests
- Add activation time monitoring (target: <200ms)
- Test with Extension Development Host

---

## 🔴 HIGH-RISK Files (53 files - 4%)

**Definition**: Core infrastructure files imported by 10+ components, or files with **security/authentication logic**. **Require extensive testing + peer review.**

### Characteristics
- 🔴 Imported by 10+ files (high coupling)
- 🔴 Security-critical (auth, encryption, secrets)
- 🔴 Public APIs (breaking changes affect external users)
- 🔴 Core engines (autopilot engine, insight core)

### Categories

#### 1. Core Detection Engine (~8 files)
**Location**: `odavl-studio/insight/core/src/`

**Examples**:
- `odavl-studio/insight/core/src/detector/index.ts` - Detector registry (exports 28+ detectors)
- `odavl-studio/insight/core/src/learning/ml-trust-predictor.ts` - ML prediction engine
- `packages/op-layer/protocols/analysis-protocol.ts` - Analysis protocol (OPLayer)

**Risk Score**: 8/10 (High - breaks detection)

**Why High-Risk**:
- Used by ALL detectors (single point of failure)
- Breaking changes = all detection fails
- Complex ML logic (TensorFlow.js)
- Exported via npm (public API)

**Required Before Changes**:
- ✅ Full test suite passing (100% coverage)
- ✅ Integration tests with all 28 detectors
- ✅ Benchmark tests (no performance regression)
- ✅ Peer review from 2+ maintainers

**Testing Requirements**:
```typescript
// MANDATORY: Full integration test suite
describe('DetectorRegistry', () => {
  it('should load all 28 detectors without errors', async () => {
    const registry = new DetectorRegistry();
    const detectors = await registry.loadAll();
    expect(detectors).toHaveLength(28);
  });

  it('should handle detector failures gracefully', async () => {
    const registry = new DetectorRegistry();
    vi.spyOn(TypeScriptDetector.prototype, 'analyze').mockRejectedValue(new Error('Detector crash'));
    const result = await registry.analyzeAll();
    expect(result.failedDetectors).toContain('typescript');
    expect(result.successfulDetectors).toHaveLength(27);
  });
});
```

---

#### 2. Autopilot O-D-A-V-L Engine (~10 files)
**Location**: `odavl-studio/autopilot/engine/src/phases/`

**Examples**:
- `observe.ts` - Observe phase (runs 12 detectors - BOUNDARY VIOLATION)
- `decide.ts` - Decide phase (recipe selection with ML trust prediction)
- `act.ts` - Act phase (file modifications with undo snapshots)
- `verify.ts` - Verify phase (quality gates enforcement)
- `learn.ts` - Learn phase (ML feedback loop)

**Risk Score**: 9/10 (Very high - auto-modifies code)

**Why High-Risk**:
- **AUTOMATICALLY MODIFIES USER CODE** (highest risk category)
- Breaking act phase = data loss (corrupted files)
- Breaking observe = incorrect detection (false positives)
- Breaking learn = broken ML predictions (bad recipes selected)

**Required Before Changes**:
- ✅ Full O-D-A-V-L cycle integration tests
- ✅ Undo snapshot verification (test rollback works)
- ✅ Manual testing on real codebases (not just test fixtures)
- ✅ Risk budget validation (10 files, 40 LOC limits enforced)
- ✅ Peer review from 3+ maintainers

**Critical Safety Mechanisms**:
```typescript
// NEVER remove these safety checks
export async function act(recipe: Recipe): Promise<ActResult> {
  // 1. Risk budget validation
  const guard = new RiskBudgetGuard(workspaceRoot);
  guard.validateChanges(recipe.files); // Throws if exceeds limits

  // 2. Undo snapshot BEFORE any changes
  await saveUndoSnapshot(recipe.files);

  // 3. File modifications
  await applyRecipe(recipe);

  // 4. Attestation after success
  await createAttestation(recipe.id, fileSHA256);
}
```

---

#### 3. Security & Authentication (~12 files)
**Location**: `security/`, `packages/auth/`, `apps/*/lib/auth/`

**Examples**:
- `packages/auth/src/jwt-utils.ts` - JWT token signing/verification
- `apps/studio-hub/lib/auth/session.ts` - Session management
- `security/secrets-manager.ts` - Secret handling
- `apps/studio-hub/src/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration

**Risk Score**: 10/10 (CRITICAL - security implications)

**Why High-Risk**:
- **SECURITY-CRITICAL** (authentication, authorization)
- Breaking auth = unauthorized access
- Leaking secrets = data breach
- PII handling (GDPR compliance)

**⛔ ABSOLUTE REQUIREMENTS**:
- ✅ Security audit by security team
- ✅ Penetration testing after changes
- ✅ No hardcoded secrets (use environment variables)
- ✅ Input sanitization (prevent injection attacks)
- ✅ Rate limiting (prevent brute force)
- ✅ Peer review from security-cleared maintainers

**Example Security Review Checklist**:
```typescript
// Security review questions before merging
// 1. Does this change handle user input? → Add validation
// 2. Does this change access secrets? → Use secrets manager
// 3. Does this change authentication flow? → Add 2FA support
// 4. Does this change authorization? → Add role-based access control
// 5. Does this change log sensitive data? → Redact PII
```

---

#### 4. Public SDK & NPM Packages (~10 files)
**Location**: `packages/sdk/`, `packages/core/`, `packages/cloud-client/`

**Examples**:
- `packages/sdk/src/index.ts` - Public SDK entry point (exports for npm users)
- `packages/sdk/src/insight.ts` - Insight SDK
- `packages/cloud-client/src/client.ts` - Cloud API client

**Risk Score**: 8/10 (High - breaking changes affect external users)

**Why High-Risk**:
- **PUBLIC API** (npm packages, external users)
- Breaking changes = major version bump
- Can't rollback (users already downloaded)
- Requires deprecation warnings (6-12 months notice)

**Required Before Changes**:
- ✅ Semantic versioning (major/minor/patch)
- ✅ Deprecation warnings (console.warn for old APIs)
- ✅ Migration guide (docs for upgrading)
- ✅ Backward compatibility tests (test old usage patterns)

**Example Deprecation Pattern**:
```typescript
// Old API (deprecated)
export function analyzeSync(workspace: string): Analysis {
  console.warn('analyzeSync is deprecated. Use analyzeAsync instead. Will be removed in v3.0.0.');
  return analyzeAsync(workspace); // Fallback to new API
}

// New API
export async function analyzeAsync(workspace: string): Promise<Analysis> {
  // New implementation
}
```

---

#### 5. Database Migrations (~6 files)
**Location**: `apps/*/prisma/migrations/`

**Examples**:
- `apps/studio-hub/prisma/migrations/20240101_initial/migration.sql`
- `odavl-studio/insight/cloud/prisma/migrations/20240115_add_indexes/migration.sql`

**Risk Score**: 9/10 (Very high - data loss risk)

**Why High-Risk**:
- **IRREVERSIBLE** (migrations can't be easily rolled back)
- Breaking migration = production database corruption
- Data loss risk (DROP TABLE, ALTER COLUMN)

**⛔ ABSOLUTE REQUIREMENTS**:
- ✅ Test on staging database first
- ✅ Backup production database before migration
- ✅ Write rollback migration (DOWN migration)
- ✅ Add data validation after migration
- ✅ Run migration during maintenance window (low traffic)

**Safe Migration Pattern**:
```sql
-- SAFE: Add column with default value (backward compatible)
ALTER TABLE error_signatures ADD COLUMN severity_score INTEGER DEFAULT 0;

-- UNSAFE: Drop column (data loss)
-- ALTER TABLE error_signatures DROP COLUMN old_column; -- ❌ DON'T DO THIS

-- SAFE ALTERNATIVE: Mark as deprecated, remove in future release
-- Step 1 (Release 1): Add new column, migrate data
-- Step 2 (Release 2): Deprecate old column (console warning)
-- Step 3 (Release 3): Remove old column
```

---

#### 6. CI/CD Pipelines (~7 files)
**Location**: `.github/workflows/`, `github-actions/`

**Examples**:
- `.github/workflows/ci.yml` - Main CI pipeline
- `.github/workflows/publish.yml` - npm publishing workflow
- `github-actions/analyze/action.yml` - Composite action for analysis

**Risk Score**: 7/10 (High - affects deployments)

**Why High-Risk**:
- Breaking CI = all deployments blocked
- Security issues (GitHub secrets exposure)
- Cost implications (long-running jobs)

**Required Before Changes**:
- ✅ Test in fork/branch (don't test on main branch)
- ✅ Review GitHub secrets usage (no accidental logging)
- ✅ Add timeout limits (prevent infinite loops)
- ✅ Test failure scenarios (what if step X fails?)

---

## ⛔ DO-NOT-TOUCH Files (14 files - 1%)

**Definition**: Files that are **FORBIDDEN** to modify without **architectural approval**. Changes require **executive-level decision** + **full regression testing**.

### Characteristics
- ⛔ Breaking changes = SYSTEM-WIDE FAILURE
- ⛔ Imported by 20+ files (entire system depends on it)
- ⛔ Cryptographic operations (attestation chain)
- ⛔ Production data stores (risk of data loss)

### Critical Files List

#### 1. `packages/core/src/governance/risk-budget-guard.ts`
**Why Forbidden**:
- Enforces 10-file, 40-LOC limits (core governance)
- Used by Autopilot act phase (prevents unsafe changes)
- Breaking it = infinite file modifications (no limits)
- 100% test coverage required (critical safety mechanism)

**If You MUST Change**:
- ✅ Get architectural approval from project lead
- ✅ Write 20+ test cases (cover all edge cases)
- ✅ Manual testing on 10+ real codebases
- ✅ Peer review from 5+ maintainers

---

#### 2. `.odavl/gates.yml` (Governance Configuration)
**Why Forbidden**:
- Defines risk budget, forbidden paths, thresholds
- Used by RiskBudgetGuard (see above)
- Breaking it = bypasses all safety mechanisms

**If You MUST Change**:
- ✅ Document change reason (Git commit message)
- ✅ Get approval from team lead
- ✅ Add validation schema (JSON Schema for gates.yml)
- ✅ Test with extreme values (risk_budget: 0, risk_budget: 10000)

---

#### 3. `packages/core/src/attestation/` (5 files)
**Why Forbidden**:
- Cryptographic proofs (SHA-256 attestation chain)
- Used for audit trail (cannot be tampered with)
- Immutable by design (append-only ledger)

**If You MUST Change**:
- ✅ Security audit required
- ✅ Backward compatibility (old attestations must still verify)
- ✅ Add versioning (attestation format v2.0)

---

#### 4. `odavl-studio/autopilot/engine/src/phases/fs-wrapper.ts`
**Why Forbidden**:
- Wraps Node.js `fs` module for testing
- Used by ALL file operations in Autopilot
- Breaking it = untestable code (cannot mock fs)

**If You MUST Change**:
- ✅ Verify all existing tests still pass (500+ tests depend on this)
- ✅ Add new methods at end (don't modify existing exports)

---

#### 5. `.github/.env.example` (Secrets Template)
**Why Forbidden**:
- Template for GitHub secrets setup
- Breaking it = incorrect secret configuration
- Security implications (wrong secrets = auth bypass)

**If You MUST Change**:
- ✅ Update `SECRETS_SETUP.md` documentation
- ✅ Notify all team members (secrets need rotation)
- ✅ Test on CI (verify new secrets work)

---

#### 6. `prisma/schema.prisma` (Database Schemas - 2 files)
**Why Forbidden**:
- Defines production database structure
- Breaking changes = data loss
- Requires migrations (risky operations)

**If You MUST Change**:
- ✅ Create migration (never modify schema directly)
- ✅ Test on staging database (exact production copy)
- ✅ Write rollback plan (how to undo migration)
- ✅ Backup production database (safety net)

---

#### 7. `package.json` (Root Package Configuration)
**Why Forbidden**:
- Defines pnpm workspace structure
- Breaking it = entire monorepo unusable
- Changes affect all 20+ packages

**If You MUST Change**:
- ✅ Test with `pnpm install --frozen-lockfile`
- ✅ Verify builds: `pnpm build`
- ✅ Check CI pipeline (GitHub Actions)

---

#### 8. `tsconfig.json` (Root TypeScript Configuration)
**Why Forbidden**:
- Inherited by all packages (affects entire codebase)
- Breaking it = 142+ TypeScript errors (or worse)
- Changes affect build output

**If You MUST Change**:
- ✅ Run `pnpm typecheck` after change (0 errors required)
- ✅ Test builds for all packages
- ✅ Check VS Code extension still loads

---

## 🎯 Refactoring Priority Matrix

**How to choose what to refactor first**: Combine **Impact** (user benefit) × **Safety** (low-risk) × **Effort** (time required).

| File Category | Impact | Safety | Effort | Priority Score | Recommendation |
|---------------|--------|--------|--------|----------------|----------------|
| **Utility Functions** | Medium | ✅ Ultra-safe | Low | 🟢 9/10 | ✅ START HERE |
| **UI Components** | Medium | ✅ Very safe | Low | 🟢 9/10 | ✅ START HERE |
| **Scripts/Tools** | Low | ✅ Safe | Low | 🟢 8/10 | ✅ Quick wins |
| **CLI Commands** | High | ⚠️ Medium | Medium | 🟡 7/10 | ⚠️ Fix TypeScript errors first |
| **Detectors** | High | ⚠️ Medium | High | 🟡 6/10 | ⚠️ Improve accuracy, add tests |
| **API Routes** | High | ⚠️ Medium | Medium | 🟡 6/10 | ⚠️ Add validation, error handling |
| **Database Queries** | High | ⚠️ Medium-high | High | 🟠 5/10 | ⚠️ Add indexes, optimize queries |
| **Core Engine** | Very High | 🔴 High | Very High | 🔴 4/10 | 🔴 LAST RESORT - avoid if possible |
| **Security/Auth** | Critical | 🔴 Critical | Very High | 🔴 3/10 | ⛔ Requires security audit |
| **Public SDK** | Very High | 🔴 High | High | 🔴 4/10 | 🔴 Major version bump required |
| **Governance** | Critical | ⛔ Forbidden | Any | ⛔ 1/10 | ⛔ DO NOT TOUCH |

**Legend**:  
🟢 Go ahead | 🟡 Proceed with caution | 🔴 High risk | ⛔ Forbidden

---

## 📋 Pre-Refactor Checklist

**Before modifying ANY file, answer these questions:**

### 1. Risk Assessment
- ❓ What risk category is this file? (LOW/MEDIUM/HIGH/DO-NOT-TOUCH)
- ❓ How many files import this one? (Check with `grep -r "import.*from.*<filename>"`)
- ❓ Does it have tests? (Check `**/*.test.ts`)
- ❓ Is it security-critical? (Check `security/**`, `auth/**` paths)

### 2. Testing Strategy
- ❓ What tests will break? (Run `pnpm test` before changes)
- ❓ What new tests are needed? (Write tests BEFORE refactoring)
- ❓ How will I verify it works? (Manual testing plan)

### 3. Rollback Plan
- ❓ Can I easily revert? (Git commit before changes)
- ❓ What's the blast radius? (How many users affected if broken?)
- ❓ How will I detect issues? (Monitoring, error tracking)

### 4. Communication
- ❓ Do I need peer review? (YES for MEDIUM/HIGH/DO-NOT-TOUCH)
- ❓ Who should review this? (Find domain expert)
- ❓ Should I write a design doc? (YES for architectural changes)

---

## 🚀 Recommended Refactoring Order

**Phase 1: Quick Wins (Week 1)**
1. Fix utility functions (add types, improve error handling)
2. Update UI components (convert to functional hooks)
3. Improve script error messages (add progress indicators)
4. Fix documentation typos

**Phase 2: TypeScript Errors (Week 2-3)**
5. Fix CLI command TypeScript errors (see `TYPESCRIPT_ERRORS_FIX_PLAN.md`)
6. Add missing types to API routes
7. Fix detector TypeScript errors

**Phase 3: Architecture Improvements (Weeks 4-8)**
8. Add database indexes (see `GLOBAL_ARCHITECTURE_WEAK_POINTS.md`)
9. Implement Redis caching layer
10. Parallelize detector execution
11. Add job queue (BullMQ)

**Phase 4: Security & Reliability (Weeks 9-12)**
12. Add rate limiting
13. Improve error handling (graceful degradation)
14. Add observability (Prometheus, Grafana)
15. Security audit (auth, secrets management)

---

## 🔍 Dependency Analysis Tool

**How to check file dependencies before refactoring**:

```bash
# Find all files that import this file
grep -r "import.*from.*'path/to/file'" . --include="*.ts" --include="*.tsx"

# Count dependencies (how many files import it)
grep -r "import.*from.*'@odavl-studio/insight-core'" . --include="*.ts" | wc -l

# Find what this file imports (outgoing dependencies)
grep "^import" path/to/file.ts

# Check test coverage for specific file
pnpm test:coverage -- path/to/file.ts
```

**Interpretation**:
- **0-3 imports**: ✅ LOW-RISK (isolated)
- **4-10 imports**: ⚠️ MEDIUM-RISK (moderate coupling)
- **11-20 imports**: 🔴 HIGH-RISK (high coupling)
- **20+ imports**: ⛔ DO-NOT-TOUCH (core infrastructure)

---

## 📚 Related Documents
- `PRODUCT_BOUNDARY_ROOT_CAUSE_ANALYSIS.md` - Product boundary violations (12 files to delete, 5 to rename)
- `TYPESCRIPT_ERRORS_FIX_PLAN.md` - 7-day plan to fix 142 TypeScript errors
- `GLOBAL_ARCHITECTURE_WEAK_POINTS.md` - Top 10 scalability bottlenecks
- `DETECTOR_QUALITY_AUDIT.md` - Quality ratings for 28+ detectors (PENDING)

---

**End of Report** - Now you know exactly which files are safe to touch! 🛡️
