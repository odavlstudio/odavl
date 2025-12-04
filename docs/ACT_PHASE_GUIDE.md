# ACT Phase Guide

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: November 10, 2025

---

## Overview

The **ACT Phase** is the third stage of the ODAVL Autopilot cycle. It executes the improvement recipe selected by the DECIDE phase while maintaining strict safety guarantees through:

1. **Undo Snapshots** - Automatic backups before any changes
2. **Risk Budget Guard** - Max 10 files, 40 LOC/file limits
3. **Protected Paths** - Never auto-edit security/**, auth/**, *.spec.*
4. **Ledger Tracking** - Every edit logged with timestamps and diff stats

## Quick Start

```bash
# Run ACT phase (executes last DECIDE selection)
pnpm odavl:act

# Run ACT with specific recipe
pnpm odavl:act --recipe import-cleaner

# Dry-run (show actions without executing)
pnpm odavl:act --dry-run
```

## Safety Architecture

```
Recipe Selected by DECIDE
    ↓
┌─────────────────────────────────┐
│ Safety Layer 1: Risk Budget    │ ← Max 10 files, 40 LOC/file
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ Safety Layer 2: Undo Snapshot  │ ← Save original files
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ Execute Actions (shell/edit)    │ ← Run recipe commands
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ Safety Layer 3: Ledger Record  │ ← Log all changes
└─────────────────────────────────┘
    ↓
Return: { success: true, actionsExecuted: 3 }
```

## Action Types

### 1. Shell Actions

Execute terminal commands (ESLint, TypeScript, custom scripts).

**Format**:

```json
{
  "type": "shell",
  "command": "pnpm exec eslint . --fix",
  "description": "Auto-fix ESLint issues"
}
```

**Execution**:

```typescript
const { out, err } = sh(action.command);
if (err) {
  console.error(`❌ Shell action failed: ${err}`);
}
```

**Example Output**:

```
[ACT] Executing: pnpm exec eslint . --fix
✅ Fixed 15 ESLint warnings
```

---

### 2. Edit Actions

Modify specific files with precise changes.

**Format**:

```json
{
  "type": "edit",
  "file": "src/config.ts",
  "find": "const API_KEY = \"sk-1234\";",
  "replace": "const API_KEY = process.env.API_KEY;",
  "description": "Remove hardcoded API key"
}
```

**Safety Checks**:

- Verify file exists before editing
- Check Risk Budget (max 10 files, 40 LOC/file)
- Save undo snapshot
- Validate `find` string exists exactly once

**Example Output**:

```
[ACT] Editing: src/config.ts
  → Replacing: const API_KEY = "sk-1234";
  → With: const API_KEY = process.env.API_KEY;
✅ Edit successful (1 change)
```

---

### 3. Analyze Actions

Run diagnostic analysis without modifying code.

**Format**:

```json
{
  "type": "analyze",
  "description": "Analyze TypeScript errors and suggest fixes"
}
```

**Output**:

```
[ACT] Analyzing workspace...
📊 Analysis complete:
  - 5 TypeScript errors found
  - Suggested fixes:
    1. Add type annotation to `count` variable
    2. Fix `string` → `number` conversion in line 42
```

---

## Risk Budget Guard

Enforces strict limits to prevent runaway automation:

```typescript
export interface RiskBudgetConfig {
  maxFiles: number;           // Default: 10
  maxLinesPerFile: number;    // Default: 40
  protectedGlobs: string[];   // e.g., ["security/**", "**/*.spec.*"]
}
```

### Protected Paths

**Default Protected Globs**:

```typescript
[
  "security/**",
  "**/*.spec.*",
  "**/*.test.*",
  "public-api/**",
  "auth/**"
]
```

**Override in `.odavl/gates.yml`**:

```yaml
forbidden_paths:
  - security/**
  - public-api/**
  - "**/*.spec.*"
  - "**/*.test.*"
  - auth/**
  - config/production/**
```

### Risk Calculation

```typescript
// Example: 3 files edited, 25 + 15 + 10 LOC changed
const risk = {
  filesModified: 3,
  totalLOC: 50,
  violated: false // ✅ Within limits (3 files, max 25 LOC/file)
};
```

**Violation Example**:

```typescript
// ❌ BLOCKED: Editing 11 files (max 10)
throw new Error('[ACT] Risk Budget EXCEEDED: 11 files (max 10)');
```

---

## Undo Snapshot System

### How It Works

Before executing any actions, ACT saves original file contents:

```typescript
const snapshot = {
  timestamp: "2025-11-10T23:45:12.583Z",
  modifiedFiles: [
    {
      path: "src/config.ts",
      originalContent: "const API_KEY = \"sk-1234\";"
    },
    {
      path: "src/utils.ts",
      originalContent: "import { unused } from './old';"
    }
  ]
};
```

**Saved Location**: `.odavl/undo/<timestamp>.json`

### Restoring Snapshots

```bash
# List available snapshots
ls -lah .odavl/undo/

# Restore specific snapshot
pnpm odavl:undo --snapshot 1731279912583

# Restore latest snapshot
pnpm odavl:undo
```

**Restore Output**:

```
[UNDO] Loading snapshot: 1731279912583.json
[UNDO] Restoring 2 files...
  ✅ src/config.ts
  ✅ src/utils.ts
[UNDO] Restore complete!
```

---

## Ledger Tracking

Every ACT execution is logged to `.odavl/ledger/run-<runId>.json`:

```json
{
  "runId": "run-1731279912583",
  "timestamp": "2025-11-10T23:45:12.583Z",
  "recipe": "import-cleaner",
  "actionsExecuted": 3,
  "edits": [
    {
      "path": "src/config.ts",
      "diffLoc": 1,
      "action": "edit"
    },
    {
      "path": "src/utils.ts",
      "diffLoc": 3,
      "action": "edit"
    }
  ],
  "notes": "Auto-fixed 15 ESLint warnings, removed 3 unused imports"
}
```

### VS Code Integration

The ODAVL VS Code extension auto-opens ledger files:

```typescript
// Extension watches: .odavl/ledger/run-*.json
watcher.onDidCreate(async (uri) => {
  await vscode.window.showTextDocument(uri);
});
```

**Setting**: `odavl.autoOpenLedger: true` (default)

---

## Recipe Execution Flow

### 1. Noop Decision

If DECIDE returns "noop", ACT skips execution:

```typescript
if (recipeId === 'noop') {
  console.log('[ACT] Noop decision - no actions needed');
  return { success: true, actionsExecuted: 0 };
}
```

### 2. Load Recipe

```typescript
const recipePath = `.odavl/recipes/${recipeId}.json`;
const recipe = JSON.parse(await readFile(recipePath, 'utf8'));
```

### 3. Validate Risk Budget

```typescript
const filesToModify = extractFilesFromActions(recipe.actions);
if (filesToModify.length > 10) {
  throw new Error('[ACT] Risk Budget EXCEEDED: too many files');
}
```

### 4. Save Undo Snapshot

```typescript
await saveUndoSnapshot(filesToModify);
console.log('[ACT] ✅ Undo snapshot saved');
```

### 5. Execute Actions

```typescript
for (const action of recipe.actions) {
  if (action.type === 'shell') {
    const { out, err } = sh(action.command);
    if (err) console.error(`❌ ${err}`);
  } else if (action.type === 'edit') {
    await applyEdit(action);
  }
}
```

### 6. Write Ledger

```typescript
await writeLedger({
  runId: `run-${Date.now()}`,
  recipe: recipeId,
  actionsExecuted: recipe.actions.length,
  edits: filesToModify.map(f => ({ path: f, diffLoc: calculateDiff(f) }))
});
```

---

## CLI Output

### Successful Execution

```
🔍 OBSERVE Phase: Analyzing /Users/dev/project...
✅ OBSERVE Complete: 142 import issues found

[DECIDE] Selected: import-cleaner

⚙️ ACT Phase: Executing import-cleaner...
[ACT] Loading recipe: .odavl/recipes/import-cleaner.json
[ACT] Risk Budget: 3 files, 50 LOC (✅ Within limits)
[ACT] ✅ Undo snapshot saved: .odavl/undo/1731279912583.json

[ACT] Action 1/3: shell
[ACT] Executing: pnpm exec eslint . --fix
✅ Fixed 15 ESLint warnings

[ACT] Action 2/3: edit
[ACT] Editing: src/config.ts
  → Replacing hardcoded API key
✅ Edit successful (1 change)

[ACT] Action 3/3: analyze
[ACT] Analyzing workspace...
📊 Analysis complete: 3 remaining issues

[ACT] ✅ Recipe execution complete
[ACT] 📝 Ledger written: .odavl/ledger/run-1731279912583.json

══════════════════════════════════════════════════════
✅ ACT Complete
══════════════════════════════════════════════════════
Actions Executed: 3
Files Modified: 2
Total LOC Changed: 50
Undo Snapshot: .odavl/undo/1731279912583.json
Ledger: .odavl/ledger/run-1731279912583.json
══════════════════════════════════════════════════════
```

### Risk Budget Violation

```
⚙️ ACT Phase: Executing bulk-refactor...
[ACT] Risk Budget: 15 files, 120 LOC
❌ Risk Budget EXCEEDED: 15 files (max 10)
[ACT] ❌ Recipe execution blocked for safety
```

### Protected Path Violation

```
⚙️ ACT Phase: Executing security-patch...
[ACT] Action: edit security/auth.ts
❌ Protected path violation: security/**
[ACT] ❌ Recipe execution blocked for safety
```

---

## Best Practices

### 1. Always Use Undo Snapshots

```typescript
// ✅ Good: ACT automatically saves snapshots
await act('import-cleaner'); // Snapshot saved before execution

// ❌ Bad: Manually modifying files without backup
await writeFile('src/config.ts', newContent); // No undo!
```

### 2. Respect Risk Budgets

```json
{
  "actions": [
    {
      "type": "edit",
      "file": "src/config.ts", // 1 file
      "description": "Small, focused change"
    }
  ]
}
```

**Avoid bulk refactors** in a single recipe.

### 3. Use Shell Actions for Automation

```json
{
  "type": "shell",
  "command": "pnpm exec eslint . --fix",
  "description": "Auto-fix all ESLint issues"
}
```

Prefer built-in tools (ESLint, Prettier) over custom scripts.

### 4. Validate Before Editing

```typescript
// ✅ Good: Check file exists
if (await exists(filePath)) {
  await applyEdit(action);
}

// ❌ Bad: Assume file exists
await applyEdit(action); // Throws if missing
```

### 5. Log Meaningful Descriptions

```json
{
  "type": "edit",
  "description": "Remove hardcoded API key from config.ts line 12"
}
```

Helps with ledger review and debugging.

---

## Troubleshooting

### Issue: "Risk Budget EXCEEDED: too many files"

**Cause**: Recipe edits more than 10 files

**Solution**:

```bash
# Option A: Increase limit in .odavl/gates.yml
actions:
  max_files_per_cycle: 20

# Option B: Split recipe into smaller chunks
{
  "id": "import-cleaner-phase1",
  "actions": [/* 5 files */]
}
```

### Issue: "Protected path violation: security/**"

**Cause**: Recipe tries to edit protected files

**Solution**:

```bash
# Option A: Remove protection in .odavl/gates.yml
forbidden_paths:
  - auth/** # Remove "security/**"

# Option B: Create exception for specific recipe
{
  "id": "security-patch",
  "allowProtectedPaths": true
}
```

### Issue: "Undo snapshot not found"

**Cause**: Snapshot file deleted or corrupted

**Solution**:

```bash
# Check available snapshots
ls -lah .odavl/undo/

# Use git to restore if needed
git checkout HEAD -- src/config.ts
```

### Issue: "Shell command failed: exit code 1"

**Cause**: Command execution error (e.g., ESLint found errors)

**Solution**:

```bash
# Run command manually to debug
pnpm exec eslint . --fix

# Check error output
cat .odavl/logs/odavl.log
```

---

## API Reference

### `act(recipeId: string): Promise<ActResult>`

**Parameters**:

- `recipeId` (string): Recipe ID from DECIDE phase or "noop"

**Returns**: Promise<ActResult>

```typescript
interface ActResult {
  success: boolean;
  actionsExecuted: number;
  errors?: string[];
}
```

**Example**:

```typescript
import { decide } from './phases/decide.js';
import { act } from './phases/act.js';

const metrics = await observe('/Users/dev/project');
const decision = await decide(metrics);

const result = await act(decision);
console.log(`Actions executed: ${result.actionsExecuted}`);
```

---

## Next Steps

After ACT executes a recipe:

1. Review ledger in `.odavl/ledger/run-<runId>.json`
2. Run VERIFY phase to validate improvements
3. Run LEARN phase to update trust scores
4. If issues, restore with `pnpm odavl:undo`

**Related Guides**:

- [OBSERVE Phase Guide](./OBSERVE_PHASE_GUIDE.md)
- [DECIDE Phase Guide](./DECIDE_PHASE_GUIDE.md)
- [Recipe Authoring Guide](./RECIPE_AUTHORING_GUIDE.md)
- [Undo System Guide](./UNDO_SYSTEM_GUIDE.md)
