# Phase 1 Week 5-6: Days 8-9 - Refactoring & Cleanup Plan

**Period:** January 17-18, 2025  
**Status:** 🔄 IN PROGRESS  
**Focus:** Code Quality, Refactoring, and Cleanup

---

## Objectives

### Day 8: Code Analysis & Documentation

1. **Find and fix console.log statements** → Replace with Logger utility
2. **Resolve TODO comments** → Complete or convert to issues
3. **Add missing JSDoc comments** → Document all exported functions
4. **Identify complex functions** → Mark for refactoring

### Day 9: Code Simplification & Cleanup

1. **Remove unused files** → Clean up 219 unused files from knip report
2. **Simplify complex functions** → Reduce cyclomatic complexity
3. **Extract duplicate code** → Create shared utilities
4. **Improve naming** → Rename poorly named variables

---

## Analysis Results

### From knip Analysis

**Unused Files: 219**

Major categories:
- `odavl-studio/autopilot/engine/scripts/` - 9 attest scripts
- `odavl-studio/autopilot/engine/src/commands/` - 7 command files
- `odavl-studio/autopilot/engine/src/core/` - 16 core modules
- `odavl-studio/autopilot/engine/src/omega/` - 4 omega files
- `odavl-studio/autopilot/engine/src/security/` - 7 security files
- `odavl-studio/guardian/app/e2e/` - 1 seed file
- `odavl-studio/guardian/app/loadtest/` - 3 loadtest files

**Decision:** Archive unused files to `undo/archived-week5/` instead of deleting

---

### From grep Analysis

**Console Statements: ~30**

Locations:
- `odavl-studio/guardian/workers/` - Monitor worker (10 statements)
- `odavl-studio/guardian/workers/src/` - Redis connection (3 statements)
- `odavl-studio/guardian/workers/src/` - Workers shutdown (5 statements)
- `odavl-studio/guardian/extension/src/` - Extension activation (1 statement)
- `odavl-studio/guardian/core/examples/` - Test examples (12 statements)

**Decision:** Keep console.log in examples, replace in production code

---

**TODO Comments: ~10**

Locations:
- `odavl-studio/guardian/extension/src/extension.ts` - 2 integration TODOs
- `odavl-studio/insight/extension/src/extension.ts` - 4 integration TODOs

**Decision:** Complete TODOs or convert to GitHub issues

---

## Refactoring Tasks

### Priority 1: Console.log Replacement

**Files to Update:**
1. `odavl-studio/guardian/workers/monitor-worker.ts`
   - Replace 10 console statements with Logger
   
2. `odavl-studio/guardian/workers/src/redis-connection.ts`
   - Replace 3 console statements with Logger
   
3. `odavl-studio/guardian/workers/src/*-worker.ts` (4 files)
   - Replace shutdown console.log with Logger
   
4. `odavl-studio/guardian/extension/src/extension.ts`
   - Replace console.log with VS Code output channel

**Estimated Time:** 2 hours

---

### Priority 2: Archive Unused Files

**Strategy:**
```bash
# Create archive directory
mkdir -p undo/archived-week5/autopilot
mkdir -p undo/archived-week5/guardian

# Move unused autopilot files
mv odavl-studio/autopilot/engine/scripts/*.ts undo/archived-week5/autopilot/
mv odavl-studio/autopilot/engine/src/commands/*.ts undo/archived-week5/autopilot/
mv odavl-studio/autopilot/engine/src/omega/*.ts undo/archived-week5/autopilot/

# Move unused guardian files
mv odavl-studio/guardian/app/e2e/seed.ts undo/archived-week5/guardian/
mv odavl-studio/guardian/app/loadtest/*.js undo/archived-week5/guardian/
```

**Estimated Time:** 1 hour

---

### Priority 3: Complete TODOs

**Insight Extension TODOs:**

1. `analyzeFile()` - Implement single file analysis
   ```typescript
   async function analyzeFile(uri: vscode.Uri) {
       await ensureInitialized();
       
       const config = vscode.workspace.getConfiguration('odavl-insight');
       const enabledDetectors = config.get<string[]>('enabledDetectors') || [];
       
       // Run detectors on single file
       const detectors = createDetectors(enabledDetectors);
       const results = await runDetectorsOnFile(uri.fsPath, detectors);
       
       // Update diagnostics for this file
       updateFileDiagnostics(uri, results);
   }
   ```

2. `runDetectorCommand()` - Implement detector selection
   ```typescript
   async function runDetectorCommand() {
       const detector = await vscode.window.showQuickPick(
           ['typescript', 'eslint', 'security', 'complexity', 'all'],
           { placeHolder: 'Select detector to run' }
       );
       
       if (!detector) return;
       
       await ensureInitialized();
       
       if (detector === 'all') {
           await analyzeWorkspace();
       } else {
           // Run single detector
           const detectorInstance = createDetector(detector);
           const results = await detectorInstance.analyze(workspace);
           updateDiagnostics(results);
       }
   }
   ```

3. `updateDiagnostics()` - Parse and display results
   ```typescript
   function updateDiagnostics(results: AnalysisResult) {
       diagnosticCollection.clear();
       
       const diagnosticsMap = new Map<string, vscode.Diagnostic[]>();
       
       results.issues.forEach(issue => {
           const uri = vscode.Uri.file(issue.file);
           const range = new vscode.Range(
               issue.line - 1, issue.column || 0,
               issue.line - 1, issue.column + issue.length || 100
           );
           
           const diagnostic = new vscode.Diagnostic(
               range,
               issue.message,
               getSeverity(issue.severity)
           );
           
           if (!diagnosticsMap.has(issue.file)) {
               diagnosticsMap.set(issue.file, []);
           }
           diagnosticsMap.get(issue.file)!.push(diagnostic);
       });
       
       diagnosticsMap.forEach((diagnostics, file) => {
           diagnosticCollection.set(vscode.Uri.file(file), diagnostics);
       });
   }
   ```

**Guardian Extension TODOs:**

1. Integration with `@odavl-studio/guardian-app`
   - Call Guardian test runners from extension
   - Display results in VS Code panel

**Estimated Time:** 4 hours

---

### Priority 4: Add Missing JSDoc

**Target Files:**
- All exported functions in `odavl-studio/insight/core/src/`
- All exported functions in `odavl-studio/autopilot/engine/src/phases/`
- Public API in `packages/sdk/src/`

**Template:**
```typescript
/**
 * Brief description of function
 * 
 * **Purpose:** What does this function do?
 * 
 * **Example:**
 * ```typescript
 * const result = functionName(param1, param2);
 * ```
 * 
 * @param param1 - Description of param1
 * @param param2 - Description of param2
 * @returns Description of return value
 * 
 * @throws {Error} When something goes wrong
 * 
 * @see {@link RelatedFunction} for related functionality
 */
export function functionName(param1: Type1, param2: Type2): ReturnType {
    // Implementation
}
```

**Estimated Time:** 3 hours

---

## Implementation Plan

### Day 8 Tasks

| Task | Priority | Time | Status |
|------|----------|------|--------|
| Run code analysis tools | P1 | 30m | ✅ DONE |
| Replace console.log (Guardian workers) | P1 | 1h | ⏳ TODO |
| Replace console.log (extensions) | P1 | 30m | ⏳ TODO |
| Archive unused files | P2 | 1h | ⏳ TODO |
| Complete Insight extension TODOs | P3 | 3h | ⏳ TODO |
| **Total Day 8** | | **6h** | |

### Day 9 Tasks

| Task | Priority | Time | Status |
|------|----------|------|--------|
| Add JSDoc to insight-core | P4 | 2h | ⏳ TODO |
| Add JSDoc to autopilot phases | P4 | 1h | ⏳ TODO |
| Add JSDoc to SDK | P4 | 1h | ⏳ TODO |
| Extract duplicate code | P5 | 1h | ⏳ TODO |
| Simplify complex functions | P5 | 1h | ⏳ TODO |
| **Total Day 9** | | **6h** | |

---

## Success Criteria

### Code Quality Metrics

| Metric | Before | Target | Status |
|--------|--------|--------|--------|
| Console statements | 30 | 0 | ⏳ |
| TODO comments | 10 | 0 | ⏳ |
| Unused files | 219 | 0 | ⏳ |
| Functions with JSDoc | ~40% | >90% | ⏳ |
| Complex functions (>10) | TBD | <5 | ⏳ |

### Documentation Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Exported functions documented | 100% | ⏳ |
| Public API documented | 100% | ⏳ |
| Examples in JSDoc | 80% | ⏳ |

---

## Tools & Scripts

### Created Scripts

1. **scripts/code-cleanup.ts** - Code quality analysis
   - Find console statements
   - Find TODO comments
   - Find complex functions
   - Find duplicate code

2. **scripts/refactor-helper.ts** - Refactoring assistance
   - Find missing JSDoc
   - Find poorly named variables
   - Find complex conditionals

### Usage

```bash
# Analyze code quality
pnpm tsx scripts/code-cleanup.ts

# Find refactoring opportunities
pnpm tsx scripts/refactor-helper.ts

# Archive unused files
pnpm tsx scripts/archive-unused.ts

# Add JSDoc templates
pnpm tsx scripts/add-jsdoc.ts
```

---

## Next Steps

After Days 8-9:
- **Day 10:** Security Audit
  - Run `pnpm audit` and fix vulnerabilities
  - Run security scanners (Snyk, OWASP)
  - Code security review
  - Add security checks to CI

Then:
- **Week 5-6 Completion Report**
  - Summarize all performance optimizations
  - Document refactoring improvements
  - Create migration guide
  - Prepare for Phase 2

---

**Date:** January 17, 2025  
**Status:** 🔄 IN PROGRESS  
**Progress:** Phase 1 Week 5-6: 70% complete (Days 1-7 of 10)
