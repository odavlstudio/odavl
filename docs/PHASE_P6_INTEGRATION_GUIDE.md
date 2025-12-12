# Phase P6: Autopilot File-Type Integration Guide

## Overview

Phase P6 provides file-type aware automation control for Autopilot. This guide shows how to integrate the Phase P6 module into the existing Autopilot phases (decide.ts and act.ts).

## Quick Start

```typescript
import { 
  shouldAllowModification, 
  validateRiskWeightedBudget,
  selectFixStrategy,
  getAutopilotAuditor,
  type FileWithRisk
} from '../filetype';
```

## Integration Points

### 1. decide.ts - Pre-Recipe Selection Check

Add file-type blocking BEFORE selecting recipes:

```typescript
// In decide() function, BEFORE recipe selection:

// Phase P6: Check if files can be modified by Autopilot
import { shouldAllowModification, getAutopilotAuditor } from '../filetype';

const auditor = getAutopilotAuditor();
const filesToModify = extractFilesFromRecipe(recipe); // Your existing logic

for (const filePath of filesToModify) {
  const perm = shouldAllowModification(filePath);
  
  if (!perm.allowed) {
    auditor.logBlocked(filePath, perm.fileType, perm.risk, perm.blockReason!);
    console.error(`[DECIDE] ❌ BLOCKED: Cannot modify ${filePath} (${perm.fileType}, ${perm.risk} risk)`);
    return "noop"; // Skip this recipe, file is blocked
  }
  
  auditor.logAllowed(filePath, perm.fileType, perm.risk, 'Pre-execution check passed');
}

// TODO Phase P7: Guardian Integration
// After recipe selection, inform Guardian of expected file types to modify.
// Guardian can then prepare relevant test suites based on file types.
// Example: If 'infrastructure' files → prepare deployment tests
//          If 'sourceCode' files → prepare unit tests

// Continue with existing recipe selection logic...
```

### 2. act.ts - Risk-Weighted Budget Validation

Add risk-weighted budget enforcement BEFORE executing actions:

```typescript
// In act() function, AFTER loading recipe, BEFORE execution:

// Phase P6: Validate risk-weighted budget
import { validateRiskWeightedBudget, getRiskBudget, getAutopilotAuditor, type FileWithRisk } from '../filetype';
import { detectFileType, getFileTypeMetadata } from '@odavl/core/filetypes/file-type-detection';

const auditor = getAutopilotAuditor();
const modifiedFiles = collectModifiedFiles(recipe.actions); // Your existing logic
const budget = getRiskBudget(); // From manifest-config.ts

// Build file risk array
const filesWithRisk: FileWithRisk[] = [];
for (const filePath of modifiedFiles) {
  const fileType = detectFileType(filePath);
  const metadata = getFileTypeMetadata(fileType);
  
  // Estimate LOC changed (you may have better heuristics)
  const locChanged = estimateLocChanged(filePath, recipe); // Your existing logic
  
  filesWithRisk.push({
    filePath,
    fileType,
    risk: metadata.risk,
    locChanged,
  });
  
  // Log budget impact
  const weight = RISK_WEIGHTS[metadata.risk];
  if (weight !== Infinity) {
    auditor.logBudgetImpact(filePath, fileType, metadata.risk, weight);
  }
}

// Validate against risk-weighted budget
const validation = validateRiskWeightedBudget(
  filesWithRisk,
  1, // recipeCount (you may be running multiple)
  budget
);

if (!validation.allowed) {
  console.error(`[ACT] ❌ Risk budget exceeded:`, validation.violations);
  for (const violation of validation.violations) {
    console.error(`  - ${violation}`);
  }
  
  // Log detailed breakdown
  console.error(`\n[ACT] Budget breakdown:`);
  for (const entry of validation.breakdown) {
    console.error(`  ${entry.filePath} (${entry.risk}): +${entry.weight.toFixed(2)} weighted impact`);
  }
  
  throw new Error('Risk budget exceeded - aborting ACT phase');
}

console.log(`[ACT] ✅ Risk budget validation passed: ${validation.weightedImpact.toFixed(2)} / ${budget.maxFiles}`);

// TODO Phase P8: Brain Integration
// After budget validation, send weighted risk impact to Brain for deployment decision.
// Brain can adjust confidence thresholds based on risk:
// - High-risk changes (weight > 5) → require 90% confidence
// - Medium-risk changes (weight 2-5) → require 75% confidence
// - Low-risk changes (weight < 2) → require 60% confidence

// Continue with existing action execution...
```

### 3. Fix Strategy Selection (Optional Enhancement)

Add strategy-based execution logic:

```typescript
// Phase P6: Select fix strategy based on file type
import { selectFixStrategy } from '../filetype';

for (const filePath of modifiedFiles) {
  const fileType = detectFileType(filePath);
  const strategy = selectFixStrategy(fileType);
  
  auditor.logStrategy(filePath, fileType, getFileTypeMetadata(fileType).risk, strategy);
  
  if (strategy === 'manual-review-required') {
    console.warn(`[ACT] ⚠️ Manual review required for ${filePath} (${fileType})`);
    continue; // Skip this file, requires manual review
  }
  
  // Apply strategy-specific execution logic
  if (strategy === 'safe') {
    // Conservative fixes only: formatting, unused imports, simple refactors
    executeSafeFixes(filePath, recipe); // Your implementation
  } else if (strategy === 'rewrite') {
    // Aggressive fixes: full rewrites, complex refactors
    executeRewriteFixes(filePath, recipe); // Your implementation
  }
}
```

## Audit Export

Export audit logs at the end of the cycle:

```typescript
// At the end of act() or verify():

const auditor = getAutopilotAuditor();
const auditJson = auditor.export();

// Save to .odavl/audit/autopilot-<runId>.json
const auditPath = path.join(
  process.cwd(),
  '.odavl',
  'audit',
  `autopilot-${runId}.json`
);
await fs.writeFile(auditPath, auditJson, 'utf8');

console.log(`[ACT] 💾 Audit log saved: ${auditPath}`);

// Print statistics
const stats = auditor.getStats();
console.log(`[ACT] Audit stats:`, stats);
// { total: 15, blocked: 2, allowed: 10, budgetChecks: 10, strategySelections: 10 }
```

## Error Handling

```typescript
try {
  // Your existing ACT phase logic with Phase P6 integration
  
} catch (error) {
  // Log blocked attempts for compliance
  auditor.logBlocked(
    filePath,
    fileType,
    risk,
    `Execution failed: ${error.message}`
  );
  
  // Export audit log even on failure
  const auditJson = auditor.export();
  await fs.writeFile(auditPath, auditJson, 'utf8');
  
  throw error; // Re-throw for upstream handling
}
```

## Testing Integration

Run the comprehensive test suite:

```bash
pnpm test odavl-studio/autopilot/engine/src/filetype/__tests__/autopilot-filetype-integration.test.ts
```

Tests cover:
- ✅ Critical file blocking (env, secrets, migrations, infrastructure)
- ✅ Risk-weighted budgeting (high=3x, medium=2x, low=1x)
- ✅ Fix strategy selection (critical→manual, high/medium→safe, low→rewrite)
- ✅ Audit logging (all decisions with JSON export)
- ✅ Edge cases (Windows paths, deep nesting, large LOC, unknown types)

## Migration Checklist

- [ ] Import Phase P6 functions in decide.ts
- [ ] Add shouldAllowModification() checks before recipe selection
- [ ] Import Phase P6 functions in act.ts
- [ ] Add validateRiskWeightedBudget() before action execution
- [ ] Add audit logging throughout decide.ts and act.ts
- [ ] Export audit logs to .odavl/audit/autopilot-<runId>.json
- [ ] Run tests: `pnpm test autopilot-filetype-integration.test.ts`
- [ ] Test with real workspace: `odavl autopilot run`
- [ ] Verify .odavl/audit/ directory contains audit logs
- [ ] Add Phase P7/P8 TODO markers (see below)

## Phase P7/P8 TODO Markers

Add these markers in decide.ts and act.ts:

### decide.ts (after recipe selection):

```typescript
// TODO Phase P7: Guardian Integration
// After selecting recipe, send file-type statistics to Guardian to determine
// which test suites to run based on expected file modifications.
// 
// Example integration:
// ```typescript
// const fileTypeStats = {
//   byType: { sourceCode: 5, tests: 2, config: 1 },
//   byRisk: { high: 3, medium: 4, low: 1 },
// };
// await guardianClient.prepareTestSuites(fileTypeStats);
// ```
// 
// Test routing logic:
// - infrastructure files → deployment tests + integration tests
// - sourceCode files → unit tests + lint checks
// - config files → integration tests
// - tests files → test validation (meta-testing)
```

### act.ts (after budget validation):

```typescript
// TODO Phase P8: Brain Integration
// After budget validation, send weighted risk impact to Brain for deployment
// decision and confidence threshold adjustment.
// 
// Example integration:
// ```typescript
// const riskContext = {
//   weightedImpact: validation.weightedImpact,
//   filesModified: filesWithRisk.length,
//   highRiskFiles: filesWithRisk.filter(f => f.risk === 'high').length,
// };
// const confidence = await brainClient.getRequiredConfidence(riskContext);
// // confidence = 0.9 (high-risk), 0.75 (medium), or 0.6 (low)
// ```
// 
// Confidence adjustment logic:
// - weight > 5 (high-risk) → require 90% confidence
// - weight 2-5 (medium) → require 75% confidence
// - weight < 2 (low) → require 60% confidence
// - Critical files → require 100% confidence (manual review)
```

## Complete Example (decide.ts integration)

```typescript
export async function decide(metrics: Metrics): Promise<string> {
  // ... existing logic ...
  
  // Phase P6: File-type aware recipe selection
  import { shouldAllowModification, selectFixStrategy, getAutopilotAuditor } from '../filetype';
  
  const auditor = getAutopilotAuditor();
  const recipes = await loadRecipes();
  
  for (const recipe of recipes) {
    const files = extractFilesFromRecipe(recipe);
    let allFilesAllowed = true;
    
    // Check each file
    for (const filePath of files) {
      const perm = shouldAllowModification(filePath);
      
      if (!perm.allowed) {
        auditor.logBlocked(filePath, perm.fileType, perm.risk, perm.blockReason!);
        allFilesAllowed = false;
        break;
      }
      
      const strategy = selectFixStrategy(perm.fileType);
      auditor.logStrategy(filePath, perm.fileType, perm.risk, strategy);
      
      if (strategy === 'manual-review-required') {
        auditor.logBlocked(filePath, perm.fileType, perm.risk, 'Requires manual review');
        allFilesAllowed = false;
        break;
      }
    }
    
    if (allFilesAllowed) {
      console.log(`[DECIDE] ✅ Selected recipe: ${recipe.id}`);
      
      // TODO Phase P7: Guardian Integration
      // (see markers above)
      
      return recipe.id;
    }
  }
  
  return "noop";
}
```

## Complete Example (act.ts integration)

```typescript
export async function act(recipeId: string): Promise<boolean> {
  // ... existing logic ...
  
  // Phase P6: Risk-weighted budget validation
  import { validateRiskWeightedBudget, getRiskBudget, getAutopilotAuditor } from '../filetype';
  import { detectFileType, getFileTypeMetadata } from '@odavl/core/filetypes/file-type-detection';
  
  const auditor = getAutopilotAuditor();
  const recipe = await loadRecipe(recipeId);
  const modifiedFiles = collectModifiedFiles(recipe.actions);
  const budget = getRiskBudget();
  
  // Build risk array
  const filesWithRisk: FileWithRisk[] = modifiedFiles.map(filePath => {
    const fileType = detectFileType(filePath);
    const metadata = getFileTypeMetadata(fileType);
    return {
      filePath,
      fileType,
      risk: metadata.risk,
      locChanged: estimateLocChanged(filePath, recipe),
    };
  });
  
  // Validate budget
  const validation = validateRiskWeightedBudget(filesWithRisk, 1, budget);
  
  if (!validation.allowed) {
    console.error(`[ACT] ❌ Risk budget exceeded:`, validation.violations);
    
    // Export audit log
    const auditPath = path.join(process.cwd(), '.odavl', 'audit', `autopilot-${runId}.json`);
    await fs.writeFile(auditPath, auditor.export(), 'utf8');
    
    throw new Error('Risk budget exceeded');
  }
  
  console.log(`[ACT] ✅ Budget OK: ${validation.weightedImpact.toFixed(2)} / ${budget.maxFiles}`);
  
  // TODO Phase P8: Brain Integration
  // (see markers above)
  
  // ... existing execution logic ...
  
  // Export audit log
  const auditPath = path.join(process.cwd(), '.odavl', 'audit', `autopilot-${runId}.json`);
  await fs.writeFile(auditPath, auditor.export(), 'utf8');
  
  return true;
}
```

## Summary

Phase P6 integration adds:
- ✅ **Critical file blocking** (4 types: env, secrets, migrations, infrastructure)
- ✅ **Risk-weighted budgeting** (high=3x, medium=2x, low=1x)
- ✅ **Fix strategy selection** (safe vs rewrite vs manual-review)
- ✅ **Full audit logging** (color-coded console + JSON export)
- ✅ **Enhanced types** (EnhancedIssue, EnhancedMetrics, EnhancedRecipe)
- ✅ **TODO markers** for Phase P7 (Guardian) and P8 (Brain)

**Next Steps:**
1. Review this guide
2. Integrate into decide.ts (blocking + strategy)
3. Integrate into act.ts (budget validation + audit)
4. Run comprehensive tests
5. Test with real workspace
6. Create Phase P6 completion report
