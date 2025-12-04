# DECIDE Phase Guide

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: November 10, 2025

---

## Overview

The **DECIDE Phase** is the second stage of the ODAVL Autopilot cycle. It selects the most appropriate improvement recipe based on:

1. **Current metrics** from OBSERVE phase
2. **Recipe conditions** (which issues to target)
3. **Trust scores** (historical success rates)
4. **Priority levels** (importance ranking)

## Quick Start

```bash
# Run DECIDE phase (automatically runs OBSERVE first)
pnpm odavl:decide

# View selected recipe without executing
pnpm odavl:decide --dry-run
```

## Decision Flow

```
OBSERVE Metrics (4663 issues)
    ↓
Load Recipes from .odavl/recipes/*.json
    ↓
Filter by Conditions (imports >= 5? YES)
    ↓
Sort by Trust Score (0.9) & Priority (7)
    ↓
Select Best Match: "import-cleaner"
    ↓
Auto-Approval Check (DENIED - no policy)
    ↓
Return Recipe ID: "import-cleaner"
```

## Recipe Structure

### Basic Recipe Format

```json
{
  "id": "import-cleaner",
  "name": "Import Cleaner",
  "description": "Cleans up unused imports and resolves import-related issues",
  "trust": 0.9,
  "priority": 7,
  "tags": ["imports", "dependencies", "tree-shaking"],
  "condition": {
    "type": "any",
    "rules": [
      {
        "metric": "imports",
        "operator": ">=",
        "value": 5
      }
    ]
  },
  "actions": [
    {
      "type": "shell",
      "command": "pnpm exec eslint . --fix",
      "description": "Auto-fix ESLint issues including unused imports"
    }
  ]
}
```

## Condition Types

### 1. Threshold Condition

Triggers when **a single metric** meets the threshold.

```json
{
  "type": "threshold",
  "rules": [
    {
      "metric": "typescript",
      "operator": ">=",
      "value": 3
    }
  ]
}
```

**Evaluation**: `metrics.typescript >= 3`

---

### 2. Any Condition (OR Logic)

Triggers when **at least one rule** is true.

```json
{
  "type": "any",
  "rules": [
    { "metric": "typescript", "operator": ">=", "value": 10 },
    { "metric": "eslint", "operator": ">=", "value": 5 }
  ]
}
```

**Evaluation**: `metrics.typescript >= 10 OR metrics.eslint >= 5`

---

### 3. All Condition (AND Logic)

Triggers when **all rules** are true.

```json
{
  "type": "all",
  "rules": [
    { "metric": "security", "operator": ">=", "value": 1 },
    { "metric": "typescript", "operator": "==", "value": 0 }
  ]
}
```

**Evaluation**: `metrics.security >= 1 AND metrics.typescript == 0`

---

## Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `>=` | Greater than or equal | `imports >= 5` |
| `>` | Greater than | `complexity > 100` |
| `<=` | Less than or equal | `typescript <= 0` |
| `<` | Less than | `eslint < 10` |
| `==` | Equal to | `build == 0` |
| `!=` | Not equal to | `security != 0` |

## Trust Scoring

### How Trust Works

Trust scores track recipe success rates over time:

```typescript
trust = success_count / total_runs

// Bounded to [0.1, 1.0]
trust = max(0.1, min(1.0, success_count / total_runs))
```

### Trust Levels

| Score | Meaning | Auto-Approval |
|-------|---------|---------------|
| 0.9-1.0 | Highly reliable | ✅ Eligible |
| 0.7-0.89 | Reliable | ⚠️ Caution |
| 0.5-0.69 | Moderate | ❌ Manual review |
| 0.1-0.49 | Low reliability | 🚫 Blacklisted |

### Trust Record Format

```json
{
  "id": "import-cleaner",
  "runs": 10,
  "success": 9,
  "trust": 0.9
}
```

**Location**: `.odavl/recipes-trust.json`

---

## Priority System

Recipes have optional priority levels (1-10):

```json
{
  "priority": 10 // Highest priority
}
```

### Priority Guidelines

| Priority | Use Case | Example Recipes |
|----------|----------|----------------|
| 10 | Critical fixes | TypeScript errors, build failures |
| 7-9 | High impact | Import cleanup, security hardening |
| 4-6 | Moderate impact | Performance optimization |
| 1-3 | Low impact | Code style, documentation |

### Tie-Breaking

When multiple recipes match:

1. **Trust score** (primary)
2. **Priority** (tie-breaker)

```typescript
recipes.sort((a, b) => {
  const trustDiff = (b.trust ?? 0) - (a.trust ?? 0);
  if (Math.abs(trustDiff) > 0.01) return trustDiff;
  return (b.priority ?? 0) - (a.priority ?? 0);
});
```

---

## Recipe Examples

### Example 1: TypeScript Fixer

```json
{
  "id": "typescript-fixer",
  "name": "TypeScript Error Fixer",
  "description": "Fixes TypeScript type errors automatically",
  "trust": 0.8,
  "priority": 10,
  "tags": ["typescript", "types", "strict-mode"],
  "condition": {
    "type": "threshold",
    "rules": [
      { "metric": "typescript", "operator": ">=", "value": 3 }
    ]
  },
  "actions": [
    {
      "type": "shell",
      "command": "pnpm exec tsc --noEmit --pretty",
      "description": "Run TypeScript compiler in check mode"
    },
    {
      "type": "analyze",
      "description": "Analyze type errors and suggest fixes"
    }
  ]
}
```

**When it triggers**: TypeScript errors >= 3

---

### Example 2: Security Hardening

```json
{
  "id": "security-hardening",
  "name": "Security Vulnerability Fixer",
  "description": "Removes hardcoded secrets and fixes security issues",
  "trust": 0.75,
  "priority": 9,
  "tags": ["security", "secrets", "xss", "sql-injection"],
  "condition": {
    "type": "any",
    "rules": [
      { "metric": "security", "operator": ">=", "value": 1 }
    ]
  },
  "actions": [
    {
      "type": "shell",
      "command": "pnpm exec eslint . --fix --rule 'no-secrets/no-secrets: error'",
      "description": "Remove hardcoded secrets"
    }
  ]
}
```

**When it triggers**: Security issues >= 1

---

### Example 3: Performance Optimizer

```json
{
  "id": "performance-optimizer",
  "name": "Performance Bottleneck Fixer",
  "description": "Optimizes inefficient loops and memory usage",
  "trust": 0.7,
  "priority": 5,
  "tags": ["performance", "optimization", "memory"],
  "condition": {
    "type": "all",
    "rules": [
      { "metric": "performance", "operator": ">=", "value": 20 },
      { "metric": "typescript", "operator": "==", "value": 0 }
    ]
  },
  "actions": [
    {
      "type": "analyze",
      "description": "Analyze performance bottlenecks"
    },
    {
      "type": "shell",
      "command": "pnpm exec eslint . --fix --rule 'performance/no-nested-loops: error'",
      "description": "Fix inefficient loops"
    }
  ]
}
```

**When it triggers**: Performance issues >= 20 AND no TypeScript errors

---

## Auto-Approval Integration

DECIDE phase integrates with auto-approval policies:

```typescript
const { approved, reason } = await evaluateAutoApproval(recipe, metrics);

if (!approved) {
  console.log(`[DECIDE] ❌ Auto-approval: DENIED - ${reason}`);
}
```

### Auto-Approval Policies

```typescript
export interface AutoApprovalPolicy {
  name: string;
  enabled: boolean;
  rules: Array<{
    commandPattern: RegExp;
    maxRisk: "low" | "medium" | "high";
    requiredTrust: number;
    conditions: string[];
  }>;
}
```

**Example Policy**:

```typescript
{
  name: "safe-linting",
  enabled: true,
  rules: [{
    commandPattern: /^pnpm exec eslint . --fix$/,
    maxRisk: "low",
    requiredTrust: 0.8,
    conditions: ["eslint < 50", "typescript === 0"]
  }]
}
```

---

## CLI Output

### Successful Selection

```
🔍 OBSERVE Phase: Analyzing /Users/dev/project...
✅ OBSERVE Complete: 4663 total issues found

[DECIDE] Loaded 5 recipes from .odavl/recipes/
[DECIDE] Evaluating conditions...
[DECIDE] Matched recipes:
  - import-cleaner (trust 0.90, priority 7) ✅
  - eslint-auto-fix (trust 0.85, priority 6)
  - typescript-fixer (trust 0.80, priority 10)

[DECIDE] Selected: Import Cleaner (trust 0.90, priority 7)
import-cleaner

[DECIDE] ❌ Auto-approval: DENIED - No auto-approval policy configured
```

### No Match (Noop)

```
✅ OBSERVE Complete: 0 total issues found

[DECIDE] No recipes match current metrics
noop
```

---

## Best Practices

### 1. Start with High-Trust Recipes

```json
{
  "trust": 0.9,
  "priority": 10
}
```

Lower trust recipes need more manual oversight.

### 2. Use Specific Conditions

```json
// ❌ Too broad
{ "metric": "totalIssues", "operator": ">", "value": 0 }

// ✅ Specific
{ "metric": "imports", "operator": ">=", "value": 5 }
```

### 3. Combine Multiple Rules

```json
{
  "type": "all",
  "rules": [
    { "metric": "security", "operator": ">=", "value": 1 },
    { "metric": "typescript", "operator": "==", "value": 0 }
  ]
}
```

Only fix security when TypeScript is clean.

### 4. Set Realistic Priorities

```json
{
  "priority": 10 // Only for critical issues (build failures, TypeScript errors)
}
```

### 5. Tag Recipes for Discoverability

```json
{
  "tags": ["imports", "dependencies", "tree-shaking", "dead-code"]
}
```

---

## Troubleshooting

### Issue: "No recipes match current metrics"

**Cause**: Conditions too strict or no issues detected

**Solution**:

```bash
# Check current metrics
cat .odavl/metrics/run-latest.json

# Lower thresholds in recipes
{ "metric": "imports", "operator": ">=", "value": 1 }
```

### Issue: "Recipe always selected despite low trust"

**Cause**: Priority too high

**Solution**:

```json
{
  "priority": 5, // Lower from 10
  "trust": 0.6
}
```

### Issue: "Auto-approval always denied"

**Cause**: No auto-approval policies configured

**Solution**:

```bash
# Create policy file
cat > .odavl/policies/auto-approve.json << EOF
{
  "policies": [
    {
      "name": "safe-commands",
      "enabled": true,
      "rules": [...]
    }
  ]
}
EOF
```

---

## API Reference

### `decide(metrics: Metrics): Promise<string>`

**Parameters**:

- `metrics` (Metrics): Output from OBSERVE phase

**Returns**: Promise<string> - Recipe ID or "noop"

**Example**:

```typescript
import { observe } from './phases/observe.js';
import { decide } from './phases/decide.js';

const metrics = await observe('/Users/dev/project');
const decision = await decide(metrics);

if (decision === 'noop') {
  console.log('No recipes match - code is clean!');
} else {
  console.log(`Selected recipe: ${decision}`);
}
```

---

## Next Steps

After DECIDE selects a recipe:

1. Review recipe actions in `.odavl/recipes/<recipe-id>.json`
2. Run ACT phase to execute the recipe
3. Run VERIFY phase to validate improvements
4. Run LEARN phase to update trust scores

**Related Guides**:

- [OBSERVE Phase Guide](./OBSERVE_PHASE_GUIDE.md)
- [ACT Phase Guide](./ACT_PHASE_GUIDE.md)
- [Recipe Authoring Guide](./RECIPE_AUTHORING_GUIDE.md)
