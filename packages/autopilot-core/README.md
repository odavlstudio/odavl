# ODAVL Autopilot Core

Deterministic code fix engine for self-healing infrastructure. Wave 6 integration with Insight SDK for automated error resolution.

## Features

- **Deterministic Fix Rules**: 7 specialized pattern matchers for common code issues
- **Safety First**: Max 20 fixes per run, automatic backups, atomic rollback
- **Multi-Language Support**: TypeScript, Python, Rust, and more
- **Audit Trail**: Complete logging of all fixes in `.odavl/autopilot-log.json`
- **Workspace Protection**: Never modifies files outside workspace boundaries

## Installation

```bash
pnpm add @odavl/autopilot-core
```

## Quick Start

```typescript
import { analyzeWorkspace } from '@odavl/insight-sdk';
import { generateFixes, applyFixesToWorkspace, summarizeFixes } from '@odavl/autopilot-core';

// Step 1: Analyze workspace with Insight
const analysis = await analyzeWorkspace(process.cwd());

// Step 2: Generate fix patches
const fixes = await generateFixes(analysis);

// Step 3: Apply fixes with backup
await applyFixesToWorkspace(fixes, process.cwd());

// Step 4: Get summary
const summary = summarizeFixes(fixes);
console.log(`Applied ${summary.totalFixes} fixes to ${summary.filesModified} files`);
console.log(`Backup: ${summary.backupPath}`);
```

## Fix Rules

Autopilot includes 7 deterministic fix rules:

### 1. Remove Unused Imports (TypeScript)
- **Detector**: `typescript`
- **Rule IDs**: `unused-import`, `@typescript-eslint/no-unused-vars`
- **Confidence**: 95%
- **Action**: Removes entire import line

```typescript
// Before
import { unusedFunction } from './module';

// After
(removed)
```

### 2. Remove Unused Variables
- **Detector**: `typescript`
- **Rule IDs**: `unused-var`, `no-unused-vars`
- **Confidence**: 85%
- **Action**: Removes variable declaration

```typescript
// Before
const unusedVar = 42;

// After
(removed)
```

### 3. Mask Hardcoded Secrets
- **Detector**: `security`
- **Rule IDs**: `hardcoded-secret`, `hardcoded-api-key`
- **Confidence**: 90%
- **Action**: Replaces secret value with `***MASKED***`

```typescript
// Before
const API_KEY = "sk-1234567890abcdef";

// After
const API_KEY = "***MASKED***";
```

### 4. Remove console.log in Production
- **Detector**: `typescript`
- **Rule IDs**: `no-console`, `console-log`
- **Confidence**: 80%
- **Action**: Removes console statement

```typescript
// Before
console.log('Debug info', data);

// After
(removed)
```

### 5. Upgrade HTTP to HTTPS
- **Detector**: `security`
- **Rule IDs**: `insecure-http`, `http-url`
- **Confidence**: 75%
- **Action**: Replaces `http://` with `https://`

```typescript
// Before
const url = "http://api.example.com";

// After
const url = "https://api.example.com";
```

### 6. Parameterize Python SQL Queries
- **Detector**: `security`
- **Rule IDs**: `sql-injection`, `f-string-sql`
- **Confidence**: 70%
- **Action**: Adds TODO comment for manual review

```python
# Before
query = f"SELECT * FROM users WHERE id = {user_id}"

# After
query = f"SELECT * FROM users WHERE id = {user_id}"  # TODO: Use parameterized query
```

### 7. Replace Rust unwrap() with expect()
- **Detector**: `rust`
- **Rule IDs**: `unwrap-used`, `rust-unwrap`
- **Confidence**: 80%
- **Action**: Converts `.unwrap()` to `.expect("message")`

```rust
// Before
let value = result.unwrap();

// After
let value = result.expect("Value should exist");
```

## API Reference

### `generateFixes(analysis: InsightAnalysisResult): Promise<FixPatch[]>`

Generates fix patches from Insight analysis results. Automatically:
- Filters out critical issues (only fixes high/medium/low)
- Matches issues to fix rules
- Limits to MAX_FIXES_PER_RUN (20)

```typescript
const fixes = await generateFixes(analysis);
// Returns: Array of FixPatch objects
```

### `applyFixesToWorkspace(fixes: FixPatch[], workspaceRoot: string): Promise<void>`

Applies fixes atomically with backup and rollback. Features:
- Validates workspace boundaries
- Creates timestamped backup in `.odavl/backups/`
- Applies all patches or rolls back on failure
- Logs to `.odavl/autopilot-log.json`

```typescript
await applyFixesToWorkspace(fixes, '/path/to/workspace');
// Throws on failure, rolls back automatically
```

### `summarizeFixes(fixes: FixPatch[], backupPath?: string): AutopilotSummary`

Generates summary of fixes applied. Returns:
- `totalFixes`: Number of patches applied
- `filesModified`: Number of unique files changed
- `backupPath`: Location of backup snapshot

```typescript
const summary = summarizeFixes(fixes, backupPath);
console.log(summary);
// { totalFixes: 8, filesModified: 5, backupPath: '.odavl/backups/...' }
```

## Types

### `FixPatch`

```typescript
interface FixPatch {
  file: string;           // Absolute path to file
  start: number;          // Line number to start modification
  end: number;            // Line number to end modification
  replacement: string;    // New code (empty = remove line)
  detector: string;       // Detector that found the issue
  ruleId?: string;        // Specific rule ID
  confidence: number;     // 0-1 confidence score
  originalText?: string;  // Original line content
}
```

### `AutopilotSummary`

```typescript
interface AutopilotSummary {
  totalFixes: number;     // Total patches applied
  critical: number;       // Critical issues (always 0 - not auto-fixed)
  high: number;           // High severity fixes
  medium: number;         // Medium severity fixes
  low: number;            // Low severity fixes
  filesModified: number;  // Unique files changed
  backupPath: string;     // Backup snapshot location
}
```

## Safety Constraints

Autopilot enforces strict safety limits:

- **Max 20 fixes per run** (`MAX_FIXES_PER_RUN`)
- **Never fixes critical issues** (`EXCLUDED_SEVERITIES`)
- **Workspace boundary validation** (never modifies files outside workspace)
- **Atomic operations** (all patches succeed or all roll back)
- **Automatic backups** (timestamped snapshots before modifications)
- **Complete audit trail** (`.odavl/autopilot-log.json`)

## Backup & Rollback

### Backup Structure

```
.odavl/backups/
  └── 2025-12-11T14-30-45-123Z/
      ├── metadata.json      # Backup metadata
      └── src/
          └── index.ts       # Original file content
```

### Metadata Format

```json
{
  "timestamp": "2025-12-11T14:30:45.123Z",
  "files": ["/path/to/workspace/src/index.ts"],
  "totalFixes": 8,
  "insightVersion": "1.0.0",
  "autopilotVersion": "1.0.0"
}
```

### Manual Rollback

```typescript
import { PatchManager } from '@odavl/autopilot-core';

const manager = new PatchManager('/path/to/workspace');
await manager.rollback('.odavl/backups/2025-12-11T14-30-45-123Z');
```

## Audit Log

All fixes are logged to `.odavl/autopilot-log.json`:

```json
[
  {
    "timestamp": "2025-12-11T14:30:45.123Z",
    "backupPath": ".odavl/backups/2025-12-11T14-30-45-123Z",
    "totalFixes": 8,
    "filesModified": 5,
    "success": true,
    "patches": [
      {
        "file": "src/index.ts",
        "line": 23,
        "detector": "typescript",
        "ruleId": "unused-import",
        "confidence": 0.95
      }
    ]
  }
]
```

## CLI Usage

```bash
# Apply fixes with confirmation
odavl autopilot run

# Preview fixes without applying
odavl autopilot run --dry-run

# Limit to 10 fixes
odavl autopilot run --max-fixes 10

# Use specific detectors
odavl autopilot run --detectors typescript,security
```

## VS Code Extension

Command: `ODAVL Autopilot: Fix Issues`

1. Analyzes workspace with Insight
2. Generates fix patches
3. Shows confirmation dialog with preview
4. Applies fixes with backup
5. Displays summary notification

## Advanced: Custom Fix Rules

```typescript
import { FIX_RULES, type FixRule } from '@odavl/autopilot-core';

const customRule: FixRule = {
  name: 'Custom Fix',
  detector: 'typescript',
  ruleIds: ['custom-rule-id'],
  confidence: 0.8,
  transform: (issue, fileContent) => {
    const lines = fileContent.split('\n');
    const line = lines[issue.line - 1];
    
    // Custom transformation logic
    if (line && line.includes('customPattern')) {
      return {
        file: issue.file,
        start: issue.line,
        end: issue.line,
        replacement: 'fixed code',
        detector: 'typescript',
        ruleId: issue.ruleId,
        confidence: 0.8,
        originalText: line
      };
    }
    return null;
  }
};

// Add to FIX_RULES array
FIX_RULES.push(customRule);
```

## Performance

- **Fix Generation**: ~100ms for 100 issues
- **Patch Application**: ~50ms per file
- **Backup Creation**: ~200ms for 10 files
- **Memory**: <50MB for typical workspaces

## Limitations

- Only fixes high/medium/low severity issues (critical requires manual review)
- Limited to 20 fixes per run (safety constraint)
- Pattern matching may not cover all edge cases
- Python and Rust rules are basic (room for expansion)

## Next Steps

See [Wave 6 Complete Report](../../WAVE6_AUTOPILOT_INTEGRATION_COMPLETE.md) for:
- Full implementation details
- CLI and VS Code usage examples
- Validation results
- Known limitations

## License

MIT

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.
