# ODAVL Studio - Complete Architecture & Diagnostic Analysis

> **Status**: Analysis Only - No Fixes Applied  
> **Date**: December 8, 2025  
> **Scope**: Full system architecture, bundler diagnosis, and recommendations

---

## 🧩 SECTION 1: INSIGHT ARCHITECTURE

### 1.1 Internal Structure

```
odavl-studio/insight/core/
├── src/
│   ├── detector/           # 12 main detectors
│   │   ├── index.ts        # Aggregator + exports
│   │   ├── typescript-detector.ts
│   │   ├── eslint-detector.ts
│   │   ├── security-detector.ts
│   │   ├── runtime-detector.ts
│   │   ├── performance-detector.ts
│   │   ├── complexity-detector.ts
│   │   ├── import-detector.ts
│   │   ├── package-detector.ts
│   │   ├── circular-detector.ts
│   │   ├── network-detector.ts
│   │   ├── build-detector.ts
│   │   ├── isolation-detector.ts
│   │   └── runtime/        # Helper modules
│   │       ├── memory-leak-detector.ts
│   │       ├── race-condition-detector.ts
│   │       └── resource-cleanup-detector.ts
│   ├── analyzer/           # Analysis helpers
│   │   └── bundle-analyzer.ts
│   ├── utils/              # Shared utilities
│   │   ├── safe-file-reader.ts  # ✅ NEW: Safe FS wrapper
│   │   ├── logger.ts
│   │   └── performance.ts
│   └── learning/           # ML training
│       └── pattern-memory.ts
├── dist/                   # CJS output (tsup)
│   └── detector/
│       └── index.cjs       # ⚠️ Contains 23 readFileSync calls
└── tsup.config.ts          # Build configuration
```

### 1.2 Detector Operation Matrix

| Detector | Entry File | FS Reads | Pattern | External Tool | Dangerous Ops |
|----------|-----------|----------|---------|---------------|---------------|
| **TypeScript** | `typescript-detector.ts` | 0 | Uses `tsc --noEmit` | ✅ tsc | execSync |
| **ESLint** | `eslint-detector.ts` | 0 | Uses `eslint --format json` | ✅ eslint | execSync |
| **Security** | `security-detector.ts` | ~50-100 | Scans all files | ✅ npm audit | ~~readFileSync~~ → safeReadFile ✅ |
| **Runtime** | `runtime-detector.ts` | ~50-100 | Scans TS/JS files | ❌ | Calls 3 helpers (see below) |
| **Performance** | `performance-detector.ts` | ~100-200 | Scans all code | ❌ | ~~readFileSync~~ → safeReadFile ✅ |
| **Complexity** | `complexity-detector.ts` | ~50-100 | Calculates cyclomatic | ❌ | ~~readFileSync~~ → safeReadFile ✅ |
| **Import** | `import-detector.ts` | ~50-100 | Scans imports | ❌ | ~~readFileSync~~ → safeReadFile ✅ |
| **Package** | `package-detector.ts` | 1-5 | Reads package.json | ❌ | ~~readFileSync~~ → safeReadFile ✅ |
| **Circular** | `circular-detector.ts` | ~50-100 | Uses madge | ✅ madge | ~~readFileSync~~ → safeReadFile ✅ |
| **Network** | `network-detector.ts` | ~50-100 | Scans API calls | ❌ | ~~readFileSync~~ → safeReadFile ✅ |
| **Build** | `build-detector.ts` | 1-5 | Reads tsconfig/webpack | ❌ | ~~readFileSync~~ → safeReadFile ✅ |
| **Isolation** | `isolation-detector.ts` | ~50-100 | Scans component deps | ❌ | ~~readFileSync~~ → safeReadFile ✅ |

**Runtime Detector Helpers** (called by `runtime-detector.ts`):
- `memory-leak-detector.ts` - Scans ~50 files - ⚠️ **Uses `await glob()` + `safeReadFile()`** → **Async/Sync MISMATCH**
- `race-condition-detector.ts` - Scans ~50 files - ⚠️ **Same issue**
- `resource-cleanup-detector.ts` - Scans ~50 files - ⚠️ **Same issue**

### 1.3 File Traversal Pattern

**Standard Pattern (Used by Most Detectors):**
```typescript
import { glob } from 'glob';
import { safeReadFile } from '../utils/safe-file-reader.js';

async detect(targetDir: string) {
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
        cwd: targetDir,
        ignore: ['node_modules/**', 'dist/**']
    });
    
    for (const file of files) {
        const content = safeReadFile(path.join(targetDir, file));
        if (!content) continue;  // Skip directories/unreadable
        
        // Analyze content...
    }
}
```

### 1.4 Results Aggregation

**Flow:**
1. Brain calls `InsightAdapter.runAllDetectors()`
2. InsightAdapter imports all 12 detectors from `@odavl-studio/insight-core/detector`
3. Each detector returns `Issue[]` array
4. InsightAdapter merges all arrays into single result set
5. Results passed to Autopilot for fixes

---

## 🧩 SECTION 2: AUTOPILOT ARCHITECTURE

### 2.1 Recipe Selection Flow

```
Insight Results
    ↓
Autopilot Engine (O-D-A-V-L Cycle)
    ↓
Observe Phase: Parse metrics from Insight
    ↓
Decide Phase: Load recipes from .odavl/recipes/
    ├─ Filter by trust score (>0.2)
    ├─ Sort by ML prediction (TensorFlow.js)
    └─ Select highest-trust recipe
    ↓
Act Phase: Apply recipe (with undo snapshot)
    ↓
Verify Phase: Re-run quality checks
    ↓
Learn Phase: Update trust scores
```

### 2.2 Refusal Conditions

Autopilot refuses to fix when:
- **Risk budget exceeded** (>10 files or >40 LOC per file)
- **Protected path** (security/**, auth/**, **/*.spec.*, **/*.test.*)
- **Recipe trust < 0.2** (3+ consecutive failures)
- **No matching recipe** for issue type
- **Verify phase fails** (quality gates not met)

### 2.3 Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Depends on Insight accuracy | False fixes if Insight wrong | Add confidence thresholds |
| Recipe trust scoring basic | May skip good recipes | Enhance ML model |
| No rollback on partial failure | Risk of half-fixed code | Atomic transactions |
| Sequential execution | Slow for many issues | Parallel batching (implemented) |
| No semantic understanding | Can't fix complex logic bugs | Add AST-level transformations |

### 2.4 Production-Ready Behavior

**Should have:**
- ✅ Undo snapshots (implemented)
- ✅ Risk budget guards (implemented)
- ✅ Attestation chain (implemented)
- ⚠️ **Missing**: Dry-run mode
- ⚠️ **Missing**: Interactive approval UI
- ⚠️ **Missing**: Rollback automation on test failure

---

## 🧩 SECTION 3: GUARDIAN ARCHITECTURE

### 3.1 Verification Layers

```
Guardian Test Suite
├── Layer 1: Build Verification
│   ├── TypeScript compilation (tsc --noEmit)
│   ├── ESLint checks
│   └── Package integrity
├── Layer 2: Unit Tests
│   ├── Vitest (apps/**/*.test.ts)
│   └── Coverage (Istanbul)
├── Layer 3: Integration Tests
│   ├── Detector integration
│   └── Recipe integration
├── Layer 4: E2E Tests
│   ├── Full O-D-A-V-L cycle
│   └── CLI workflows
├── Layer 5: Extension Tests
│   ├── VS Code extension activation
│   └── Webview panels
└── Layer 6: Cloud Tests (Future)
    ├── Next.js app deployment
    └── API endpoints
```

### 3.2 Current Limitations

| Issue | Impact | Fix Needed |
|-------|--------|------------|
| Guardian tests FS directly | Can encounter EISDIR errors | Use safeReadFile |
| No actual browser testing | Can't verify real user scenarios | Add Playwright |
| No deployment verification | Can't catch production issues | Add smoke tests |
| No performance benchmarks | Can't detect regressions | Add benchmarking suite |

### 3.3 Production-Grade Requirements

**Missing:**
- Visual regression testing (pixel-perfect UI checks)
- Multi-browser testing (Chrome, Firefox, Safari, Edge)
- Load testing (concurrent users, rate limits)
- Security testing (OWASP Top 10)
- Accessibility testing (WCAG 2.1)

---

## 🧩 SECTION 4: BRAIN ORCHESTRATION

### 4.1 Import Strategy

**Current Implementation:**
```typescript
// packages/odavl-brain/src/insight-adapter.ts
let InsightCore: any;

try {
    // Try ESM import first
    InsightCore = await import('@odavl-studio/insight-core/detector');
} catch (esmError) {
    // Fallback to CJS require
    InsightCore = require('@odavl-studio/insight-core/detector');
}
```

**Why This Works:**
- Brain is **ESM-only** (`"type": "module"` in package.json)
- Insight-Core outputs **CJS-only** (tsup config)
- Node.js allows ESM to import CJS via dynamic `import()`
- Fallback to `require()` catches edge cases

**Stability Assessment:** ✅ **STABLE** - This is the standard Node.js interop pattern

### 4.2 Alternative Strategies

| Strategy | Pros | Cons | Recommended |
|----------|------|------|-------------|
| **Dynamic import + require** | Works across Node versions | Requires fallback logic | ✅ Current (keep) |
| CLI invocation | Complete isolation | Slower, harder to debug | ⚠️ Backup option |
| Dual ESM+CJS output | No interop issues | Complex build | ❌ Overkill |
| VM sandbox | Full isolation | Performance overhead | ❌ Unnecessary |

### 4.3 Launch Score Calculation

```typescript
// Pseudocode from brain
const criticalIssues = results.filter(i => i.severity === 'critical').length;
const highIssues = results.filter(i => i.severity === 'high').length;
const totalDetectors = 12;
const failedDetectors = detectorFailures.length;

const score = Math.max(0, 100 - (
    (criticalIssues * 2) +  // -2 points per critical
    (highIssues * 1) +      // -1 point per high
    (failedDetectors * 10)  // -10 points per failed detector
));

const readyForRelease = score >= 80 && failedDetectors === 0;
```

---

## 🧩 SECTION 5: BUNDLING & TSUP DIAGNOSIS

### 5.1 tsup Internal Mechanics

**How tsup Works:**
```
Source Files (src/)
    ↓
TypeScript Compiler (type checking)
    ↓
esbuild (bundling + transformation)
    ├─ Resolves imports
    ├─ Inlines local modules
    ├─ Externalizes dependencies
    ├─ Transforms async/await for target
    └─ Generates CJS output
    ↓
dist/ (bundled output)
```

### 5.2 Root Cause: Async/Sync Mismatch

**The Problem:**
```typescript
// Runtime helper modules (memory-leak-detector, etc.)
async detect(targetDir?: string): Promise<MemoryLeakIssue[]> {  // ❌ Async signature
    const tsFiles = await glob('**/*.{ts,tsx,js,jsx}', {...});  // ❌ Async glob
    
    for (const file of tsFiles) {
        const content = safeReadFile(filePath);  // ✅ Sync read
    }
}
```

**What esbuild Does:**
1. Sees `async` method with `safeReadFile()` (sync operation)
2. Analyzes `safeReadFile()` implementation:
   ```typescript
   export function safeReadFile(filePath: string): string | null {
       return fs.readFileSync(filePath, 'utf8');  // ← esbuild sees this
   }
   ```
3. During CJS bundling, esbuild **inlines** `safeReadFile()` into callers
4. Creates separate `fs` import namespace (e.g., `fs22`) to avoid conflicts
5. Result: 23 instances of `fs.readFileSync` in bundle (not injected, but **inlined from safeReadFile**)

**Proof:**
- Line 418 in bundle: `safeReadFile` function definition (contains readFileSync)
- Lines 2335-18857: Inlined calls to `safeReadFile` → bundler optimized away the function call and directly inserted `fs.readFileSync`

### 5.3 tsup Caching Layers

| Cache Type | Location | Purpose | Clear Command |
|------------|----------|---------|---------------|
| esbuild memory | RAM | Incremental builds | Restart process |
| tsup cache | `node_modules/.cache/tsup/` | Build artifacts | `Remove-Item node_modules/.cache` |
| TypeScript | `*.tsbuildinfo` | Incremental compilation | `Remove-Item **/*.tsbuildinfo` |
| pnpm | `.pnpm-store/` | Package cache | `pnpm store prune` |
| Turbo | `.turbo/` | Monorepo cache | `Remove-Item .turbo/` |

### 5.4 Why Externals Don't Help

**Current tsup config:**
```typescript
external: ['fs', 'node:fs', 'node:fs/promises', ...]
```

**Why this doesn't prevent readFileSync:**
- `fs` is marked external → esbuild doesn't bundle Node.js `fs` module
- BUT `safeReadFile()` is **internal** (in `utils/`) → gets bundled
- esbuild inlines `safeReadFile` calls during optimization
- Result: `fs.readFileSync` from `safeReadFile` appears in bundle

### 5.5 Recommended Build Strategy

**Option A: Fix Async/Sync Mismatch** ✅ **RECOMMENDED**
- Make runtime helpers truly synchronous
- Use `globSync()` instead of `await glob()`
- Eliminates async/sync confusion
- Bundler won't inline/transform unexpectedly

**Option B: No-Bundle Mode** (Fallback)
```typescript
export default defineConfig({
  bundle: false,  // Output raw source → CJS
});
```
- Pros: No transforms, predictable output
- Cons: Slower runtime, larger dist/

**Option C: Dual Output** (Future)
```typescript
export default defineConfig({
  format: ['esm', 'cjs'],
});
```
- Pros: Native ESM for Brain, CJS for compatibility
- Cons: More complex, 2x build time

### 5.6 Industry Standards

**How SonarQube/CodeClimate Build Analyzers:**

| Tool | Build Strategy | Bundling | Language |
|------|---------------|----------|----------|
| **SonarQube** | No bundling, ships Java JARs | ❌ | Java + plugins |
| **CodeClimate** | Docker images with engines | ❌ | Ruby engines |
| **DeepSource** | Python packages, no bundling | ❌ | Python analyzers |
| **ESLint** | npm packages, CJS output | ✅ Minimal | JavaScript |
| **TypeScript** | npm package, no bundling | ❌ | TypeScript |

**Pattern:** Most tools **don't bundle** analyzers. They ship:
- Source code as npm packages
- CLI tools that load plugins dynamically
- Docker containers with interpreters

**Why:** Analyzers need flexibility to load user configs, plugins, and custom rules. Bundling breaks this.

**Recommendation for ODAVL:**
- **Insight-Core**: No bundling (ship source as CJS)
- **Brain**: Bundle (it's an orchestrator, not an analyzer)
- **Autopilot**: Minimal bundling (recipes are external)
- **Guardian**: Bundle (it's a test runner)

---

## 🧩 SECTION 6: GLOBAL DESIGN RECOMMENDATIONS

### 6.1 World-Class Insight Architecture

```
Detector Design Principles:
├── 1. Isolation: Each detector runs in separate process
├── 2. Streaming: Process files incrementally, not all at once
├── 3. Caching: Cache AST parsing, file metadata
├── 4. Parallelism: Run independent detectors concurrently
├── 5. Configurability: Allow users to disable/configure detectors
└── 6. Extensibility: Plugin system for custom detectors
```

**Recommended Changes:**
1. **No bundling** for detectors (ship as CJS source)
2. **Process isolation** (spawn detectors as child processes)
3. **Streaming API** (yield results as they're found, don't wait for completion)
4. **Worker threads** for CPU-intensive detectors (complexity, performance)
5. **Incremental analysis** (only re-analyze changed files)

### 6.2 Detector Execution Model

| Model | Pros | Cons | Recommendation |
|-------|------|------|----------------|
| **In-process** | Fast, simple | Memory leaks affect Brain | ⚠️ Current (risky) |
| **Child processes** | Isolated, crash-safe | Slower, IPC overhead | ✅ **Best for production** |
| **Worker threads** | Fast, isolated | Complex, shared memory | ⚠️ For CPU-bound only |
| **VM sandbox** | Maximum isolation | Performance penalty | ❌ Overkill |

**Recommended:** **Child processes** for all detectors
```typescript
// Brain spawns each detector
const result = await spawnDetector('typescript', targetDir);
```

### 6.3 Autopilot Fix Strategy

**Question:** Should Autopilot apply fixes with partial information?

**Answer:** ⚠️ **NO** - Require minimum confidence threshold

**Recommended Policy:**
```typescript
interface FixPolicy {
  minConfidence: number;       // 0.75 (75% confidence minimum)
  requireExplanation: boolean; // true
  requireTestCoverage: boolean; // true (don't fix untested code)
  dryRunFirst: boolean;        // true (preview changes)
  requireApproval: boolean;    // true for critical paths
}
```

### 6.4 Guardian Integration

**Question:** Should Guardian run inside Brain or separate?

**Answer:** ✅ **Separate** - Guardian should be independent quality gate

**Architecture:**
```
Brain (Orchestrator)
    ├─ Insight (Detection)
    ├─ Autopilot (Fixes)
    └─ Triggers Guardian (but doesn't control it)

Guardian (Independent)
    ├─ Runs on schedule (cron)
    ├─ Runs on CI/CD (pre-deploy)
    ├─ Runs on demand (developer)
    └─ Reports to dashboard
```

**Rationale:** Guardian is a **quality gate**, not part of the fix pipeline. It should block deployments independently.

### 6.5 Brain Execution Model

**Recommended:** **CLI Invocation + IPC**

```typescript
// Brain spawns Insight CLI
const insightProcess = spawn('pnpm', ['odavl:insight', 'analyze', '--json']);

// Stream results
insightProcess.stdout.on('data', (chunk) => {
    const issues = JSON.parse(chunk);
    // Process incrementally
});
```

**Why:**
- Complete isolation (detector crashes don't affect Brain)
- Clear boundaries (CLI is stable API)
- Testable (can test CLI independently)
- Standard pattern (how ESLint, Prettier work)

### 6.6 Permanent Bundler Fix

**Strategy:** **No Bundling for Analyzers**

```typescript
// tsup.config.ts for Insight-Core
export default defineConfig({
  bundle: false,  // Ship source, not bundle
  format: ['cjs'],
  dts: true,      // Generate types
  clean: true,
});
```

**Impact:**
- ✅ No bundler transforms
- ✅ Predictable output (1:1 source-to-dist)
- ✅ Easier debugging
- ✅ Faster builds
- ⚠️ Slightly slower runtime (negligible for analyzers)

---

## 🧩 SECTION 7: RISK ASSESSMENT

### 7.1 Current Risks

| Risk | Severity | Probability | Mitigation Status |
|------|----------|-------------|-------------------|
| **Detector crashes affect Brain** | 🔴 Critical | High | ❌ Not mitigated |
| **Memory leaks in long-running analysis** | 🟠 High | Medium | ❌ Not mitigated |
| **Bundler injecting unsafe code** | 🟠 High | High | ⚠️ Partially (Wave 7) |
| **False positives from Insight** | 🟡 Medium | Medium | ⚠️ Partially (confidence scores) |
| **Autopilot breaking working code** | 🔴 Critical | Low | ✅ Mitigated (risk budget, undo) |
| **Guardian false negatives** | 🟡 Medium | Low | ❌ Not mitigated |

### 7.2 Migration Plan to World-Class

**Phase 1: Stabilization** (Wave 7 - Current)
- ✅ Fix unsafe FS operations
- ✅ Eliminate bundler issues
- ⚠️ Add process isolation (IN PROGRESS)

**Phase 2: Performance** (Wave 8)
- Add streaming results API
- Implement incremental analysis
- Add worker thread support for CPU-bound detectors
- Add result caching

**Phase 3: Reliability** (Wave 9)
- Full test coverage (>90%)
- E2E tests with real projects
- Performance benchmarks
- Load testing

**Phase 4: Production Readiness** (Wave 10)
- Multi-language support finalized
- Plugin system for custom detectors
- Dashboard with real-time monitoring
- Enterprise features (SSO, audit logs, compliance)

---

## 📊 APPENDIX: Detector FS Usage Table

| Detector | Files Read | Read Directories | Dangerous Ops | Status |
|----------|-----------|------------------|---------------|--------|
| TypeScript | 0 | ❌ | execSync | ✅ Safe |
| ESLint | 0 | ❌ | execSync | ✅ Safe |
| Security | 50-100 | ⚠️ Yes | ~~readFileSync~~ | ✅ Fixed |
| Runtime | 150-300 | ⚠️ Yes | **await glob + safeReadFile** | ⚠️ **Async/Sync Issue** |
| Performance | 100-200 | ⚠️ Yes | ~~readFileSync~~ | ✅ Fixed |
| Complexity | 50-100 | ⚠️ Yes | ~~readFileSync~~ | ✅ Fixed |
| Import | 50-100 | ⚠️ Yes | ~~readFileSync~~ | ✅ Fixed |
| Package | 1-5 | ❌ | ~~readFileSync~~ | ✅ Fixed |
| Circular | 0 | ❌ | execSync (madge) | ✅ Safe |
| Network | 50-100 | ⚠️ Yes | ~~readFileSync~~ | ✅ Fixed |
| Build | 1-5 | ❌ | ~~readFileSync~~ | ✅ Fixed |
| Isolation | 50-100 | ⚠️ Yes | ~~readFileSync~~ | ✅ Fixed |

**Total Files Read Per Analysis:** ~800-1,500 files (varies by project size)

---

## 🎯 FINAL RECOMMENDATIONS

### Immediate Actions (Wave 7 Completion)
1. ✅ Fix async/sync mismatch in runtime helpers
2. ✅ Add enhanced tsup config (esbuildOptions)
3. ✅ Verify bundle contains only 1 readFileSync (in safeReadFile)
4. ✅ Test 12/12 detectors passing

### Short-Term (Next 2 Weeks)
1. Add process isolation for detectors
2. Convert Insight-Core to no-bundle mode
3. Add streaming results API
4. Implement detector timeout handling

### Medium-Term (Next Month)
1. Add incremental analysis (only changed files)
2. Add result caching layer
3. Add performance benchmarks
4. Complete Guardian test suite

### Long-Term (Next Quarter)
1. Plugin system for custom detectors
2. Multi-language support (Python, Java, Go, Rust complete)
3. Dashboard with real-time monitoring
4. Enterprise features

---

## 📝 CONCLUSION

**Root Cause of readFileSync:** esbuild inlines `safeReadFile()` calls during bundling, resulting in 23 instances of `fs.readFileSync` appearing in the bundle. Not injected, but **inlined optimization**.

**Solution:** Fix async/sync mismatch in runtime helpers OR disable bundling entirely.

**Architectural Direction:** Move toward **no-bundling** for analyzers (industry standard), **process isolation** for reliability, and **streaming API** for performance.

**Status:** Ready to implement fixes and move to world-class architecture.

---

## 🧩 SECTION 8: VS CODE EXTENSION INTEGRATION

### 8.1 Extension Architecture

**Three Separate Extensions:**
```
odavl-studio/
├── insight/extension/      # Insight Extension (ODAVL Insight)
├── autopilot/extension/    # Autopilot Extension (ODAVL Autopilot)
└── guardian/extension/     # Guardian Extension (ODAVL Guardian)
```

**Common Pattern (All Three):**
```typescript
// extension.ts - Entry point
export function activate(context: vscode.ExtensionContext) {
  // 1. Initialize diagnostic collection
  diagnosticCollection = vscode.languages.createDiagnosticCollection('odavl');
  
  // 2. Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl.analyzeWorkspace', analyzeWorkspace),
    vscode.commands.registerCommand('odavl.clearDiagnostics', clearDiagnostics)
  );
  
  // 3. Register event handlers
  vscode.workspace.onDidSaveTextDocument(async (document) => {
    await analyzeDocument(document); // Auto-analyze on save (500ms debounce)
  });
  
  // 4. Register file watchers (ledger, config)
  const watcher = vscode.workspace.createFileSystemWatcher('**/.odavl/ledger/run-*.json');
  watcher.onDidCreate(async (uri) => { /* Auto-open ledgers */ });
}
```

### 8.2 Diagnostic Collection Pattern

**Integration with VS Code Problems Panel:**

```typescript
// DiagnosticsService.ts (Insight Extension)
export class DiagnosticsService {
  private collection: vscode.DiagnosticCollection;
  
  constructor() {
    this.collection = vscode.languages.createDiagnosticCollection('odavl');
  }
  
  async analyzeFile(filePath: string): Promise<void> {
    const issues = await insight.analyze(filePath);
    
    const diagnostics: vscode.Diagnostic[] = issues.map(issue => {
      const range = new vscode.Range(issue.line - 1, issue.column, ...);
      const diagnostic = new vscode.Diagnostic(range, issue.message, this.toSeverity(issue.severity));
      diagnostic.source = `ODAVL/${issue.detector}`;
      diagnostic.code = issue.code;
      return diagnostic;
    });
    
    this.collection.set(vscode.Uri.file(filePath), diagnostics);
  }
  
  // Severity mapping
  private toSeverity(severity: string): vscode.DiagnosticSeverity {
    switch (severity) {
      case 'critical': return vscode.DiagnosticSeverity.Error;
      case 'high': return vscode.DiagnosticSeverity.Warning;
      case 'medium': return vscode.DiagnosticSeverity.Information;
      case 'low': return vscode.DiagnosticSeverity.Hint;
    }
  }
}
```

**Export to `.odavl/problems-panel-export.json`:**
```typescript
// Auto-export on file save (500ms debounce)
vscode.workspace.onDidSaveTextDocument(async (document) => {
  await diagnosticsService.analyzeFile(document.fileName);
  await diagnosticsService.exportToFile('.odavl/problems-panel-export.json');
});
```

**CLI Integration:**
```bash
pnpm odavl:insight
# Choose: 7. problemspanel (read from VS Code Problems Panel export)
# Fast analysis (~1s vs 10-30s for full detectors)
```

### 8.3 Webview Panels

**Dashboard Pattern (Insight Extension):**

```typescript
// dashboard-provider.ts
export class DashboardProvider {
  private panel: vscode.WebviewPanel | undefined;
  
  show(): void {
    if (this.panel) {
      this.panel.reveal();
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'odavlDashboard',
        'ODAVL Insight Dashboard',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true // Keep state when hidden
        }
      );
      
      this.panel.webview.html = this.getHtmlContent();
      
      // Auto-update on diagnostic changes (debounced)
      vscode.languages.onDidChangeDiagnostics(() => {
        this.debouncedUpdate();
      });
    }
  }
  
  private debouncedUpdate(): void {
    if (this.updateDebounceTimer) clearTimeout(this.updateDebounceTimer);
    this.updateDebounceTimer = setTimeout(() => {
      this.panel?.webview.postMessage({ type: 'update', data: this.getStatistics() });
    }, 500);
  }
}
```

**Governance Panel (Autopilot Extension):**
- Displays `.odavl/gates.yml` rules
- Shows risk budget usage
- Lists protected paths

### 8.4 Lazy Loading Strategy

**Performance Optimization:**
```typescript
// Lazy services pattern - reduces startup time to <200ms
async function activateOnDemand(context: vscode.ExtensionContext) {
  if (!lazyServices.dataService) {
    const ds = new ODAVLDataService(workspaceRoot);
    GlobalContainer.register('ODAVLDataService', ds);
  }
}

// Heavy detectors loaded on-demand, not at activation
async function runDetector(name: string) {
  if (!loadedDetectors.has(name)) {
    const detector = await import(`./detectors/${name}-detector`);
    loadedDetectors.set(name, detector);
  }
  return loadedDetectors.get(name);
}
```

### 8.5 File Watchers

**Ledger Auto-Open (Autopilot Extension):**
```typescript
const watcher = vscode.workspace.createFileSystemWatcher('**/.odavl/ledger/run-*.json');

watcher.onDidCreate(async (uri) => {
  // Wait 500ms for file write completion
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (vscode.workspace.getConfiguration('odavl').get('autoOpenLedger', true)) {
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
  }
});
```

**Config Watcher (All Extensions):**
```typescript
// Watch .odavl/gates.yml for changes
const configWatcher = vscode.workspace.createFileSystemWatcher('**/.odavl/gates.yml');
configWatcher.onDidChange(async () => {
  await reloadConfiguration();
  vscode.window.showInformationMessage('ODAVL: Configuration reloaded');
});
```

### 8.6 Multi-Language Support

**Language Detection (Insight Extension):**
```typescript
interface LanguageDetector {
  language: string;
  detector: any;
  enabled: boolean;
}

class ODAVLInsightExtension {
  private detectors: Map<string, LanguageDetector> = new Map();
  
  initializeDetectors(): void {
    // TypeScript/JavaScript
    this.detectors.set('typescript', {
      language: 'TypeScript',
      detector: new TypeScriptDetector(),
      enabled: vscode.workspace.getConfiguration('odavl').get('enableTypeScript', true)
    });
    
    // Python
    this.detectors.set('python', {
      language: 'Python',
      detector: new PythonDetector(),
      enabled: vscode.workspace.getConfiguration('odavl').get('enablePython', true)
    });
    
    // Java
    this.detectors.set('java', {
      language: 'Java',
      detector: new JavaDetector(),
      enabled: vscode.workspace.getConfiguration('odavl').get('enableJava', true)
    });
  }
  
  async analyzeDocument(document: vscode.TextDocument): Promise<void> {
    const detector = this.detectors.get(document.languageId);
    if (!detector || !detector.enabled) return;
    
    const issues = await detector.detector.analyze({ filePath: document.fileName, content: document.getText() });
    // Convert to VS Code diagnostics...
  }
}
```

### 8.7 Extension Settings

**package.json Configuration:**
```json
"contributes": {
  "configuration": {
    "title": "ODAVL Insight",
    "properties": {
      "odavl.enablePerfMetrics": {
        "type": "boolean",
        "default": true,
        "description": "Enable performance metric tracking"
      },
      "odavl.autoOpenLedger": {
        "type": "boolean",
        "default": true,
        "description": "Automatically open ledger files on creation"
      },
      "odavl.detectors": {
        "type": "array",
        "default": ["typescript", "security", "performance"],
        "description": "Enabled detectors"
      }
    }
  }
}
```

**Access in Code:**
```typescript
const config = vscode.workspace.getConfiguration('odavl');
const enablePerfMetrics = config.get<boolean>('enablePerfMetrics', true);
```

---

## 🧩 SECTION 9: DATABASE & AUTHENTICATION

### 9.1 Database Architecture

**Stack:**
- **PostgreSQL 15** (production) + **SQLite** (development)
- **Prisma ORM** with singleton pattern
- **Railway/Supabase/Neon** for hosting

**Prisma Singleton Pattern (Critical):**
```typescript
// lib/prisma.ts - Prevents connection leaks in serverless/dev
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Why Singleton?**
- Prevents connection exhaustion in serverless (Vercel Edge Functions)
- Avoids "Too many clients" error in development (hot reload)
- Reuses connection pool across requests

**Used In:**
- `apps/studio-hub/lib/prisma.ts` (Marketing Hub)
- `odavl-studio/insight/cloud/lib/prisma.ts` (Insight Cloud)

### 9.2 Database Schema Highlights

**Core Tables:**
```prisma
// prisma/schema.prisma

model Organization {
  id                     String    @id @default(cuid())
  name                   String
  slug                   String    @unique
  plan                   String    @default("FREE")
  monthlyApiCalls        Int       @default(0)
  monthlyInsightRuns     Int       @default(0)
  monthlyAutopilotRuns   Int       @default(0)
  monthlyGuardianTests   Int       @default(0)
  
  users                  User[]
  projects               Project[]
}

model User {
  id             String    @id @default(cuid())
  email          String    @unique
  passwordHash   String?   // Nullable for OAuth-only users
  name           String?
  emailVerified  DateTime?
  
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  accounts       Account[] // NextAuth OAuth accounts
  sessions       Session[] // NextAuth sessions
}

model Project {
  id             String    @id @default(cuid())
  name           String
  repoUrl        String?
  
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  insightRuns    InsightRun[]
  autopilotRuns  AutopilotRun[]
  guardianTests  GuardianTest[]
}

model InsightRun {
  id          String    @id @default(cuid())
  startedAt   DateTime  @default(now())
  completedAt DateTime?
  status      String    // 'running' | 'completed' | 'failed'
  totalIssues Int       @default(0)
  critical    Int       @default(0)
  high        Int       @default(0)
  
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id])
  
  issues      Issue[]
}

model Issue {
  id          String    @id @default(cuid())
  detector    String    // 'typescript' | 'security' | 'performance' etc.
  severity    String    // 'critical' | 'high' | 'medium' | 'low'
  message     String
  file        String
  line        Int
  column      Int
  code        String?
  
  insightRunId String
  insightRun   InsightRun @relation(fields: [insightRunId], references: [id])
}
```

### 9.3 Database Setup Workflows

**Option 1: Docker PostgreSQL (Recommended)**
```powershell
# Start container
docker run --name odavl-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=odavl_hub `
  -p 5432:5432 `
  -d postgres:15-alpine

# Update .env.local
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/odavl_hub"

# Apply schema
pnpm db:push
pnpm db:seed
```

**Option 2: Native PostgreSQL**
```powershell
winget install PostgreSQL.PostgreSQL
psql -U postgres -c "CREATE DATABASE odavl_hub;"
# Update DATABASE_URL, then run db:push + db:seed
```

**Option 3: Automated Script**
```powershell
.\setup-database.ps1 -UseDocker
# Detects current DB, configures PostgreSQL, seeds data
```

### 9.4 Prisma Commands

```bash
pnpm db:generate  # Generate Prisma Client (required after schema changes)
pnpm db:push      # Push schema to database (dev - no migrations)
pnpm db:migrate   # Create migration (production - with migration files)
pnpm db:seed      # Seed demo data (8 projects, 227 errors)
pnpm db:studio    # Open Prisma Studio (GUI at localhost:5555)
```

**Migration Workflow (Production):**
```bash
# 1. Create migration
pnpm prisma migrate dev --name add_guardian_tables

# 2. Review migration file in prisma/migrations/

# 3. Deploy to production
pnpm prisma migrate deploy
```

### 9.5 Database Seeding

**Seed Script Pattern (`prisma/seed.ts`):**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create demo organization
  const org = await prisma.organization.upsert({
    where: { id: 'demo-org' },
    update: {},
    create: {
      id: 'demo-org',
      name: 'ODAVL Demo Organization',
      slug: 'demo-org',
      plan: 'PRO',
    },
  });

  // 2. Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@odavl.studio' },
    update: {},
    create: {
      email: 'demo@odavl.studio',
      name: 'Demo User',
      emailVerified: new Date(),
      organizationId: org.id,
    },
  });

  // 3. Create 8 demo projects
  for (let i = 1; i <= 8; i++) {
    const project = await prisma.project.upsert({
      where: { id: `demo-project-${i}` },
      update: {},
      create: {
        id: `demo-project-${i}`,
        name: `Demo Project ${i}`,
        repoUrl: `https://github.com/demo/project-${i}`,
        organizationId: org.id,
      },
    });

    // 4. Create InsightRun for each project
    const insightRun = await prisma.insightRun.create({
      data: {
        projectId: project.id,
        status: 'completed',
        completedAt: new Date(),
        totalIssues: 27,
        critical: 3,
        high: 8,
      },
    });

    // 5. Create 27 sample issues
    const detectors = ['typescript', 'security', 'performance', 'complexity'];
    for (let j = 0; j < 27; j++) {
      await prisma.issue.create({
        data: {
          insightRunId: insightRun.id,
          detector: detectors[j % detectors.length],
          severity: j < 3 ? 'critical' : j < 11 ? 'high' : 'medium',
          message: `Sample issue ${j + 1}`,
          file: `src/components/Component${j + 1}.tsx`,
          line: 10 + j,
          column: 5,
          code: `ISSUE_${j + 1}`,
        },
      });
    }
  }

  console.log('✅ Seeding complete');
  console.log(`   Organizations: 1`);
  console.log(`   Users: 1`);
  console.log(`   Projects: 8`);
  console.log(`   Insight Runs: 8`);
  console.log(`   Total Issues: 227`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Idempotent Design:**
- Uses `upsert()` for organizations/users (safe to run multiple times)
- Creates projects/runs/issues only if not exists
- No duplicate data on re-seeding

### 9.6 Authentication with NextAuth.js

**Configuration (`apps/studio-hub/lib/auth.ts`):**
```typescript
import { type NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma), // Auto-creates Account, Session tables
  
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          role: 'USER', // Default role
        };
      },
    }),
    
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'USER',
        };
      },
    }),
  ],
  
  session: { strategy: 'jwt' }, // JWT-based sessions (not database sessions)
  
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
    
    async signIn({ user }) {
      // Auto-create organization on first sign-in
      const existingUser = await prisma.user.findUnique({ where: { email: user.email! } });
      if (!existingUser) {
        const org = await prisma.organization.create({
          data: { name: `${user.name}'s Organization`, slug: user.email!.split('@')[0] },
        });
        await prisma.user.update({
          where: { email: user.email! },
          data: { organizationId: org.id },
        });
      }
      return true;
    },
  },
  
  pages: { signIn: '/auth/signin' }, // Custom sign-in page
};
```

**OAuth App Setup:**

| Provider | Setup URL | Callback URL |
|----------|-----------|--------------|
| **GitHub** | https://github.com/settings/developers | `http://localhost:3000/api/auth/callback/github` |
| **Google** | https://console.cloud.google.com/ | `http://localhost:3000/api/auth/callback/google` |

**Environment Variables:**
```bash
# .env.local
GITHUB_ID="your_github_client_id"
GITHUB_SECRET="your_github_client_secret"
GOOGLE_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_SECRET="your_google_client_secret"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

**Generate NEXTAUTH_SECRET:**
```powershell
# Windows PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Or Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 9.7 Database Connection Best Practices

**Development:**
- Use SQLite for quick prototyping (`DATABASE_URL="file:./dev.db"`)
- PostgreSQL Docker for production-like testing

**Production:**
- Use connection pooling (Prisma default: 10 connections)
- Enable SSL (`?sslmode=require` in DATABASE_URL)
- Set timeouts: `?connection_limit=5&pool_timeout=2`

**Serverless (Vercel/Netlify):**
- Use PgBouncer or Prisma Data Proxy to avoid connection exhaustion
- Set `connection_limit=1` (each function creates 1 connection)
- Use singleton pattern (prevents multiple Prisma Client instances)

**Migration to Production:**
```bash
# 1. Railway/Supabase: Create PostgreSQL database
# 2. Copy DATABASE_URL from dashboard
# 3. Add to Vercel environment variables
# 4. Deploy: git push origin main
# 5. Run migrations: pnpm prisma migrate deploy (in Vercel build command)
```

---

## 🧩 SECTION 10: TESTING STRATEGY

### 10.1 Test Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E ╲ (5% - Playwright, Cypress)
                 ╱--------╲
                ╱          ╲
               ╱Integration╲ (15% - API, DB, Services)
              ╱--------------╲
             ╱                ╲
            ╱  Unit Tests      ╲ (80% - Vitest, Jest)
           ╱____________________╲
```

**Current Coverage:**
- **Unit Tests**: 80% (Vitest, apps/**/*.test.ts)
- **Integration Tests**: 15% (Detector integration, Recipe integration)
- **E2E Tests**: 5% (Playwright, full O-D-A-V-L cycle)

### 10.2 Test Configuration

**Vitest Config (`vitest.config.ts`):**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['apps/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['odavl-website/**', 'dist/', '.next/'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './reports',
      include: ['apps/**/*.ts', 'packages/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.config.*', '**/*.spec.*', '**/*.test.*'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

**Playwright Config (`playwright.config.ts`):**
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 10.3 Test Commands

```bash
pnpm test              # Run unit tests (Vitest)
pnpm test:coverage     # Generate coverage report
pnpm test:watch        # Watch mode
pnpm test:ui           # Vitest UI (browser)
pnpm test:integration  # Integration tests
pnpm test:e2e          # Playwright E2E tests
pnpm test:all          # All test suites
pnpm forensic:all      # Lint + typecheck + coverage (CI workflow)
```

### 10.4 Unit Test Pattern (Detectors)

**Example: TypeScript Detector Test**
```typescript
// odavl-studio/insight/core/src/detector/typescript-detector.test.ts
import { describe, it, expect, vi } from 'vitest';
import { TypeScriptDetector } from './typescript-detector';
import * as cpWrapper from '../utils/cp-wrapper';

describe('TypeScriptDetector', () => {
  it('should detect type errors', async () => {
    const detector = new TypeScriptDetector();
    
    // Mock execSync to return sample tsc output
    vi.spyOn(cpWrapper, 'execSync').mockReturnValue(`
      src/index.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.
    `);
    
    const issues = await detector.analyze('/mock/workspace');
    
    expect(issues).toHaveLength(1);
    expect(issues[0].detector).toBe('typescript');
    expect(issues[0].severity).toBe('high');
    expect(issues[0].message).toContain('Type \'string\' is not assignable');
    expect(issues[0].file).toBe('src/index.ts');
    expect(issues[0].line).toBe(10);
  });
  
  it('should handle tsc with no errors', async () => {
    vi.spyOn(cpWrapper, 'execSync').mockReturnValue('');
    
    const detector = new TypeScriptDetector();
    const issues = await detector.analyze('/mock/workspace');
    
    expect(issues).toHaveLength(0);
  });
});
```

### 10.5 Integration Test Pattern (Autopilot)

**Example: Full O-D-A-V-L Cycle Test**
```typescript
// tests/integration/autopilot-cycle.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AutopilotEngine } from '@odavl-studio/autopilot-engine';
import * as fs from 'fs/promises';

describe('Autopilot O-D-A-V-L Cycle Integration', () => {
  const testWorkspace = '/tmp/odavl-test-workspace';
  let engine: AutopilotEngine;
  
  beforeEach(async () => {
    // Setup test workspace
    await fs.mkdir(testWorkspace, { recursive: true });
    await fs.writeFile(`${testWorkspace}/package.json`, JSON.stringify({ name: 'test' }));
    await fs.mkdir(`${testWorkspace}/.odavl/recipes`, { recursive: true });
    
    engine = new AutopilotEngine({ workspacePath: testWorkspace });
  });
  
  afterEach(async () => {
    // Cleanup
    await fs.rm(testWorkspace, { recursive: true, force: true });
  });
  
  it('should complete full cycle without errors', async () => {
    // Observe
    const metrics = await engine.observe();
    expect(metrics).toHaveProperty('eslintErrors');
    expect(metrics).toHaveProperty('tscErrors');
    
    // Decide
    const recipe = await engine.decide(metrics);
    expect(recipe).toHaveProperty('id');
    expect(recipe.trust).toBeGreaterThan(0.2); // Not blacklisted
    
    // Act
    const result = await engine.act(recipe);
    expect(result.success).toBe(true);
    expect(result.modifiedFiles.length).toBeLessThanOrEqual(10); // Risk budget
    
    // Verify
    const attestation = await engine.verify();
    expect(attestation).toHaveProperty('sha256');
    expect(attestation.improved).toBe(true);
    
    // Learn
    await engine.learn(recipe, result);
    const updatedTrust = await engine.getRecipeTrust(recipe.id);
    expect(updatedTrust).toBeGreaterThan(recipe.trust); // Trust increased
  });
});
```

### 10.6 E2E Test Pattern (Studio Hub)

**Example: Sign In Flow**
```typescript
// tests/e2e/auth/signin.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should sign in with GitHub', async ({ page }) => {
    // Navigate to sign-in page
    await page.goto('/auth/signin');
    
    // Click GitHub sign-in button
    await page.click('button:has-text("Sign in with GitHub")');
    
    // GitHub OAuth page (mocked in test environment)
    await expect(page).toHaveURL(/github\.com\/login/);
    await page.fill('input[name="login"]', 'test@odavl.studio');
    await page.fill('input[name="password"]', 'test-password');
    await page.click('input[type="submit"]');
    
    // Should redirect back to app
    await expect(page).toHaveURL('/dashboard');
    
    // Should show user name
    await expect(page.locator('header')).toContainText('Test User');
  });
  
  test('should display errors for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.click('button:has-text("Sign in with GitHub")');
    
    // Invalid credentials
    await page.fill('input[name="login"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrong-password');
    await page.click('input[type="submit"]');
    
    // Should show error
    await expect(page.locator('.error-message')).toContainText('Invalid credentials');
  });
});
```

### 10.7 CI/CD Test Workflow

**GitHub Actions (`.github/workflows/ci.yml`):**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: odavl_test
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v4
        with:
          version: 9.12.2
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run linter
        run: pnpm lint
      
      - name: Run type check
        run: pnpm typecheck
      
      - name: Run unit tests
        run: pnpm test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/odavl_test
      
      - name: Run E2E tests
        run: pnpm test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./reports/coverage.json
```

**Coverage Threshold Enforcement:**
- **Lines**: 80% minimum
- **Functions**: 80% minimum
- **Branches**: 75% minimum
- **Statements**: 80% minimum

**CI Fails If:**
- TypeScript errors (`tsc --noEmit` shows any error)
- ESLint errors (warnings allowed)
- Coverage below thresholds
- Any test fails

---

**End of Analysis** ✅
