# OBSERVE Phase Guide

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: November 10, 2025

---

## Overview

The **OBSERVE Phase** is the first stage of the ODAVL Autopilot cycle. It analyzes your codebase using 12 specialized detectors to identify issues across quality, security, performance, and architectural domains.

## Quick Start

```bash
# Run OBSERVE phase on current directory
pnpm odavl:observe

# Run OBSERVE on specific directory
pnpm odavl:observe --dir /path/to/project
```

## Architecture

### Detector Pipeline

```
OBSERVE Phase
    ↓
┌──────────────────────────────────────────────┐
│ 12 Specialized Detectors (Parallel)         │
├──────────────────────────────────────────────┤
│ 1. TypeScript → Type errors                 │
│ 2. ESLint → Code style issues               │
│ 3. Security → Hardcoded secrets, XSS        │
│ 4. Performance → Memory leaks, inefficiency │
│ 5. Import → Broken imports, circular deps   │
│ 6. Package → Outdated deps, vulnerabilities │
│ 7. Runtime → Null pointer risks             │
│ 8. Build → Build failures                   │
│ 9. Circular → Module dependency cycles      │
│ 10. Network → Missing error handling        │
│ 11. Complexity → Cyclomatic complexity      │
│ 12. ComponentIsolation → React/Vue coupling │
└──────────────────────────────────────────────┘
    ↓
Metrics Aggregation → .odavl/metrics/run-*.json
```

## Detectors

### 1. TypeScript Detector (`TSDetector`)

**Purpose**: Detects type errors and strict mode violations

**What it catches**:

- Type mismatches (e.g., `string` assigned to `number`)
- Missing type annotations
- Implicit `any` usage
- Strict null check violations

**Example Issue**:

```typescript
// ❌ Detected by TSDetector
const count: number = "123"; // Type 'string' not assignable to 'number'

// ✅ Fix
const count: number = 123;
```

**Configuration**:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

---

### 2. ESLint Detector (`ESLintDetector`)

**Purpose**: Enforces code style and best practices

**What it catches**:

- Unused variables
- Missing semicolons
- Inconsistent formatting
- Deprecated APIs

**Example Issue**:

```typescript
// ❌ Detected by ESLintDetector
const x = 123; // 'x' is assigned but never used

// ✅ Fix (remove or use the variable)
const x = 123;
console.log(x);
```

---

### 3. Security Detector (`SecurityDetector`)

**Purpose**: Identifies security vulnerabilities

**What it catches**:

- Hardcoded API keys, passwords, tokens
- SQL injection risks
- XSS vulnerabilities
- Insecure random number generation

**Example Issue**:

```typescript
// ❌ Detected by SecurityDetector
const API_KEY = "sk-1234567890abcdef"; // Hardcoded API key

// ✅ Fix
const API_KEY = process.env.API_KEY; // Use environment variable
```

**Severity Levels**:

- **Critical**: Hardcoded secrets, SQL injection
- **High**: XSS, CSRF, insecure crypto
- **Medium**: Weak validation, exposed config
- **Low**: Missing security headers

---

### 4. Performance Detector (`PerformanceDetector`)

**Purpose**: Identifies performance bottlenecks

**What it catches**:

- Inefficient loops (e.g., nested `.map()`)
- Memory leaks (unclosed resources)
- Large bundle sizes
- Blocking operations

**Example Issue**:

```typescript
// ❌ Detected by PerformanceDetector
for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < bigArray.length; j++) {
        // O(n²) complexity
    }
}

// ✅ Fix (use Map for lookups)
const lookup = new Map(bigArray.map(item => [item.id, item]));
for (const item of array) {
    const match = lookup.get(item.relatedId); // O(1)
}
```

---

### 5. Import Detector (`ImportDetector`)

**Purpose**: Detects import-related issues

**What it catches**:

- Broken imports (missing files)
- Circular dependencies
- Unused imports
- Import path issues

**Example Issue**:

```typescript
// ❌ Detected by ImportDetector
import { helperFn } from './utils'; // File doesn't exist

// ✅ Fix
import { helperFn } from './helpers'; // Correct path
```

---

### 6. Package Detector (`PackageDetector`)

**Purpose**: Checks npm package health

**What it catches**:

- Outdated dependencies
- Known vulnerabilities (CVEs)
- Missing peer dependencies
- Incompatible versions

**Example Issue**:

```json
{
  "dependencies": {
    "react": "16.8.0" // ❌ Outdated (current: 18.3.0)
  }
}
```

---

### 7-12. Additional Detectors

| Detector | Purpose | Key Issues Detected |
|----------|---------|---------------------|
| **Runtime** | Null pointer risks | `undefined` access, unhandled promises |
| **Build** | Build failures | Missing scripts, config errors |
| **Circular** | Dependency cycles | Module A → B → A cycles |
| **Network** | API issues | Missing error handling, timeouts |
| **Complexity** | Code complexity | Cyclomatic complexity > 10 |
| **ComponentIsolation** | React/Vue coupling | Props drilling, tight coupling |

## Metrics Output

### JSON Structure

```json
{
  "timestamp": "2025-11-10T22:16:22.579Z",
  "runId": "run-1762812982579",
  "targetDir": "/Users/dev/project",
  "typescript": 5,
  "eslint": 10,
  "security": 1144,
  "performance": 163,
  "imports": 142,
  "packages": 1,
  "runtime": 87,
  "build": 0,
  "circular": 4,
  "network": 236,
  "complexity": 2795,
  "isolation": 91,
  "totalIssues": 4663,
  "details": {
    "security": [
      {
        "type": "hardcoded-secret",
        "severity": "critical",
        "file": "src/config.ts",
        "line": 12,
        "message": "API key detected",
        "suggestedFix": "Use environment variables"
      }
    ]
  }
}
```

### Saved Location

Metrics are saved to:

```
.odavl/metrics/run-<timestamp>.json
```

## Integration with DECIDE Phase

The OBSERVE phase metrics directly feed into the DECIDE phase:

```typescript
// OBSERVE generates metrics
const metrics = await observe('/path/to/project');

// DECIDE uses metrics to select recipes
const decision = await decide(metrics);
// decision = "import-cleaner" (if imports >= 5)
```

## Performance

| Metric | Value |
|--------|-------|
| Average Run Time | 10-30 seconds |
| Detectors | 12 (run in parallel) |
| Memory Usage | ~200MB peak |
| Disk I/O | Minimal (read-only) |

## Error Handling

OBSERVE Phase never crashes - it captures errors gracefully:

```typescript
try {
    const tsErrors = await tsDetector.detect(targetDir);
    metrics.typescript = tsErrors.length;
} catch (error) {
    console.error('❌ TypeScript detector failed:', error.message);
    metrics.typescript = 0; // Default to zero on failure
}
```

## CLI Output

```
🔍 OBSERVE Phase: Analyzing /Users/dev/project...
  → Running TypeScript detector...
  → Running ESLint detector...
  → Running Security detector...
  → Running Performance detector...
  → Running Import detector...
  → Running Package detector...
  → Running Runtime detector...
  → Running Build detector...
  → Running Circular Dependency detector...
  → Running Network detector...
  → Running Complexity detector...
  → Running Component Isolation detector...
✅ OBSERVE Complete: 4663 total issues found

📊 Metrics saved to: .odavl/metrics/run-1762812982579.json

══════════════════════════════════════════════════════
📊 ODAVL OBSERVE - Code Quality Metrics
══════════════════════════════════════════════════════

Run ID:      run-1762812982579
Timestamp:   2025-11-10T22:16:22.579Z
Target Dir:  /Users/dev/project

──────────────────────────────────────────────────────
Detector Results:
──────────────────────────────────────────────────────
  ✅ TypeScript                  0 issues
  ✅ ESLint                      0 issues
  ❌ Security                  1144 issues
  ❌ Performance               163 issues
  ❌ Imports                   142 issues
  ⚠️ Packages                    1 issues
  ❌ Runtime                    87 issues
  ✅ Build                       0 issues
  ⚠️ Circular Dependencies       4 issues
  ❌ Network                   236 issues
  ❌ Complexity                2795 issues
  ❌ Component Isolation        91 issues
──────────────────────────────────────────────────────
Total Issues: 4663
══════════════════════════════════════════════════════
```

## Best Practices

### 1. Run OBSERVE Regularly

```bash
# Add to CI/CD pipeline
pnpm odavl:observe || true # Don't fail build on issues
```

### 2. Track Metrics Over Time

```bash
# Compare runs
pnpm odavl:compare run-1234 run-5678
```

### 3. Focus on High-Severity Issues

```bash
# Filter by detector
pnpm odavl:observe --filter security,performance
```

### 4. Integrate with VS Code

The ODAVL VS Code extension auto-runs OBSERVE on file save.

## Troubleshooting

### Issue: "Detector X timed out"

**Cause**: Large codebase (>100k LOC)

**Solution**:

```bash
# Increase timeout
export ODAVL_TIMEOUT=120000 # 2 minutes
pnpm odavl:observe
```

### Issue: "Permission denied reading file Y"

**Cause**: Restricted file access

**Solution**:

```bash
# Add to .odavl/gates.yml
forbidden_paths:
  - node_modules/**
  - .git/**
```

### Issue: "Out of memory"

**Cause**: Large workspace with many files

**Solution**:

```bash
# Increase Node.js memory
NODE_OPTIONS=--max-old-space-size=4096 pnpm odavl:observe
```

## API Reference

### `observe(targetDir: string): Promise<Metrics>`

**Parameters**:

- `targetDir` (string): Absolute path to project directory

**Returns**: Promise<Metrics> - Aggregated metrics from all detectors

**Throws**: Never throws - returns 0 for failed detectors

**Example**:

```typescript
import { observe } from './phases/observe.js';

const metrics = await observe('/Users/dev/my-project');
console.log(`Total issues: ${metrics.totalIssues}`);
```

## Next Steps

After running OBSERVE:

1. Review metrics in `.odavl/metrics/run-*.json`
2. Run DECIDE phase to select improvement recipe
3. Run ACT phase to execute improvements
4. Run VERIFY phase to validate changes

**Related Guides**:

- [DECIDE Phase Guide](./DECIDE_PHASE_GUIDE.md)
- [ACT Phase Guide](./ACT_PHASE_GUIDE.md)
- [Recipe Authoring Guide](./RECIPE_AUTHORING_GUIDE.md)
