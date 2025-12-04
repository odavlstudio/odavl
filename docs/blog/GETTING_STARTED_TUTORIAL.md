# Getting Started with ODAVL: From Zero to Self-Healing Code in 10 Minutes

**What you'll learn**: Install ODAVL, run your first analysis, fix 50+ issues automatically, and set up CI/CD integration - all in under 10 minutes.

**Prerequisites**: Node.js 18+, a JavaScript/TypeScript project, 10 minutes of your time.

---

## Step 1: Install ODAVL (1 minute)

### Option A: Global Installation (Recommended for trying out)

```bash
npm install -g @odavl-studio/cli

# Verify installation
odavl --version
# Output: @odavl-studio/cli v2.0.0
```

### Option B: Project Installation (For production use)

```bash
# Using pnpm (recommended)
pnpm add -D @odavl-studio/cli

# Using npm
npm install --save-dev @odavl-studio/cli

# Using yarn
yarn add -D @odavl-studio/cli
```

### Quick Test

```bash
odavl --help
```

You should see:

```
ODAVL Studio CLI v2.0.0
Autonomous Code Quality Platform

Commands:
  odavl insight      Analyze code quality with ML-powered detectors
  odavl autopilot    Self-healing code with O-D-A-V-L cycle
  odavl guardian     Pre-deploy testing and monitoring

Options:
  --version   Show version number
  --help      Show help
```

---

## Step 2: Initialize Your Project (2 minutes)

Navigate to your project directory:

```bash
cd /path/to/your/project
```

### Initialize ODAVL

```bash
odavl init
```

**Interactive Setup**:

```
? What's your project type? (Use arrow keys)
❯ TypeScript (Next.js, NestJS, etc.)
  JavaScript (React, Vue, Node.js)
  Python (Django, FastAPI, Flask)
  Monorepo (pnpm/Yarn workspaces)

? Select detectors to enable: (Press <space> to select, <a> to toggle all)
❯ ◉ TypeScript (type errors, strict mode)
  ◉ ESLint (code quality, best practices)
  ◉ Security (OWASP Top 10, secrets)
  ◉ Import (broken paths, circular deps)
  ◯ Performance (bottlenecks, memory leaks)
  ◯ Complexity (cyclomatic, cognitive)

? Maximum files per auto-fix cycle? 10
? Protected paths (won't auto-edit): **/*.spec.*, security/**
```

This creates `.odavl/` directory:

```
.odavl/
├── gates.yml           # Governance rules
├── recipes/            # Auto-fix strategies
├── history.json        # Run tracking
└── undo/              # Rollback snapshots
```

### Understanding `gates.yml`

```yaml
# Auto-generated governance rules
risk_budget: 100
forbidden_paths:
  - security/**
  - "**/*.spec.*"
  - "**/*.test.*"
  - auth/**

actions:
  max_auto_changes: 10
  max_files_per_cycle: 10

enforcement:
  - block_if_risk_exceeded
  - rollback_on_failure
  - require_attestation

thresholds:
  max_risk_per_action: 25
  min_success_rate: 0.75
  max_consecutive_failures: 3
```

**Pro Tip**: Adjust `max_auto_changes` based on your team's comfort level. Start with 5 for conservative teams, 20 for aggressive automation.

---

## Step 3: Run Your First Analysis (3 minutes)

### Quick Scan

```bash
odavl insight analyze
```

**Real-Time Output**:

```
🔍 ODAVL Insight Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Scanning workspace...
   Files: 1,247 (847 TypeScript, 312 JavaScript, 88 JSON)
   Lines: 287,432
   Duration: 2.3 seconds

🎯 Detectors Active: 6/12
   ✓ TypeScript   (287 issues)
   ✓ ESLint       (156 issues)
   ✓ Security     (18 issues)
   ✓ Import       (94 issues)
   ✓ Package      (12 issues)
   ✓ Circular     (8 dependencies)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Summary

Total Issues: 575
├─ Critical: 18 (security vulnerabilities)
├─ High:     142 (type errors, broken imports)
├─ Medium:   287 (code smells, complexity)
└─ Low:      128 (suggestions, style)

Auto-Fix Eligible: 447 issues (78%)
Manual Review Required: 128 issues (22%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Next Steps

1. View detailed report:
   odavl insight dashboard

2. Auto-fix issues:
   odavl autopilot run

3. Export results:
   odavl insight export --format pdf
```

### View Dashboard

```bash
odavl insight dashboard
```

Opens at **http://localhost:3001**

![ODAVL Dashboard](./screenshots/dashboard-overview.png)

**Dashboard Features**:
- 📊 Real-time metrics (updates every 5 seconds)
- 🔍 Issue drill-down (click to see code)
- 📈 Trend charts (quality over time)
- 🎨 Dark mode (system-aware)
- 📥 Export (PDF, CSV, JSON, Excel)

---

## Step 4: Auto-Fix Issues (2 minutes)

Now comes the magic - **automatic issue fixing**:

```bash
odavl autopilot run
```

**Live Progress**:

```
🤖 ODAVL Autopilot - Self-Healing Code
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 1: Observe 🔍
   Running quality checks...
   ✓ TypeScript: 287 issues
   ✓ ESLint: 156 issues
   ✓ Security: 18 issues
   Duration: 2.1s

Phase 2: Decide 🧠
   Loading recipes from .odavl/recipes/...
   ✓ Loaded 42 recipes
   ✓ Sorted by trust score (0.85 avg)
   ✓ Selected: fix-missing-imports (trust: 0.94)
   Duration: 0.3s

Phase 3: Act ⚡
   Saving undo snapshot...
   ✓ Snapshot saved to .odavl/undo/2025-11-22T10-30-15.json
   
   Applying fixes:
   ├─ src/utils/helpers.ts (added 3 imports)
   ├─ src/components/Button.tsx (fixed type annotation)
   ├─ src/hooks/useData.ts (removed unused import)
   ├─ src/lib/api.ts (fixed import path)
   └─ ... (87 more files)
   
   Duration: 1.8s

Phase 4: Verify ✅
   Re-running quality checks...
   ✓ TypeScript: 287 → 156 issues (-45%)
   ✓ ESLint: 156 → 98 issues (-37%)
   ✓ Security: 18 → 18 issues (unchanged)
   ✓ All builds passing
   Duration: 2.2s

Phase 5: Learn 📚
   Updating recipe trust scores...
   ✓ fix-missing-imports: 0.94 → 0.96 (+2%)
   ✓ Saved to .odavl/recipes-trust.json
   Duration: 0.1s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Autopilot Complete

Fixed: 131 issues (78% success rate)
Remaining: 37 issues (require manual review)
Time Saved: ~10.9 hours (131 × 5 min)
Total Duration: 6.5 seconds

Undo available: odavl undo --to latest
```

### What Just Happened?

ODAVL automatically:
1. ✅ Added 87 missing imports
2. ✅ Fixed 24 type annotations
3. ✅ Removed 19 unused variables
4. ✅ Corrected 1 import path case sensitivity issue

**Time saved**: 131 issues × 5 minutes = **10.9 hours of manual work** → 6.5 seconds

### Undo Changes (If Needed)

Made a mistake? Roll back instantly:

```bash
# Undo last run
odavl undo --to latest

# Undo specific run
odavl undo --to 2025-11-22T10-30-15

# List all undo points
odavl undo --list
```

---

## Step 5: Set Up CI/CD (2 minutes)

### GitHub Actions

Create `.github/workflows/odavl.yml`:

```yaml
name: ODAVL Quality Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run ODAVL Analysis
        run: |
          pnpm add -g @odavl-studio/cli
          odavl autopilot run --max-files 10
      
      - name: Verify Quality Gates
        run: odavl verify
        # Fails if critical issues remain
      
      - name: Upload Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: odavl-report
          path: reports/odavl-summary.json
```

### GitLab CI

Add to `.gitlab-ci.yml`:

```yaml
odavl:analysis:
  stage: test
  image: node:20-alpine
  
  script:
    - npm install -g @odavl-studio/cli
    - odavl autopilot run
    - odavl verify
  
  artifacts:
    reports:
      junit: reports/odavl-junit.xml
    paths:
      - reports/
    expire_in: 30 days
  
  only:
    - merge_requests
    - main
```

### CircleCI

Add to `.circleci/config.yml`:

```yaml
version: 2.1

jobs:
  odavl-check:
    docker:
      - image: cimg/node:20.11
    
    steps:
      - checkout
      
      - restore_cache:
          keys:
            - deps-{{ checksum "package.json" }}
      
      - run:
          name: Install ODAVL
          command: npm install -g @odavl-studio/cli
      
      - run:
          name: Run Autopilot
          command: odavl autopilot run
      
      - run:
          name: Verify Gates
          command: odavl verify
      
      - store_artifacts:
          path: reports/
          destination: odavl-reports

workflows:
  quality-check:
    jobs:
      - odavl-check
```

**Pro Tip**: Set `max-files` lower in CI (5-10) to avoid large PRs breaking builds.

---

## Real-World Example: Fixing a Messy Codebase

Let's walk through a real scenario with a 100K LOC Next.js project:

### Before ODAVL

```typescript
// src/components/UserProfile.tsx - Messy code
import React from 'react'
import { getData } from '../utils/api'  // Wrong path
import { formatDate } from 'date-fns'   // Missing package

export default function UserProfile({ userId }) {  // Missing types
  const [user, setUser] = useState()  // Implicit any
  const [loading, setLoading] = useState(false)
  const unused = 'test'  // Unused variable
  
  useEffect(() => {
    getData(`/users/${userId}`).then(setUser)  // No error handling
  }, [userId])
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <h1>{user.name}</h1>  // Unsafe access
      <p>Joined: {formatDate(user.createdAt, 'PP')}</p>
    </div>
  )
}
```

**Issues detected by ODAVL**:
1. Wrong import path (`../utils/api` → `@/lib/api`)
2. Missing `date-fns` package
3. Missing TypeScript types
4. Implicit `any` type
5. Unused variable
6. Unsafe property access
7. Missing error handling

### After ODAVL Autopilot

```typescript
// src/components/UserProfile.tsx - Auto-fixed
import React, { useState, useEffect } from 'react';
import { getData } from '@/lib/api';  // ✓ Fixed import path
import { formatDate } from 'date-fns';

// ✓ Added types
interface UserProfileProps {
  userId: string;
}

interface User {
  name: string;
  createdAt: string;
}

export default function UserProfile({ userId }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);  // ✓ Typed state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);  // ✓ Error handling
  // ✓ Removed unused variable
  
  useEffect(() => {
    getData<User>(`/users/${userId}`)
      .then(setUser)
      .catch(err => setError(err.message));  // ✓ Error handling
  }, [userId]);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return null;  // ✓ Null check
  
  return (
    <div>
      <h1>{user.name}</h1>  // ✓ Safe access
      <p>Joined: {formatDate(new Date(user.createdAt), 'PP')}</p>
    </div>
  );
}
```

**What ODAVL did**:
- ✅ Fixed import path (used tsconfig `paths` mapping)
- ✅ Added TypeScript interfaces
- ✅ Typed React state with generics
- ✅ Added error handling
- ✅ Removed unused variable
- ✅ Added null checks

**Time saved**: 7 fixes × 5 minutes = **35 minutes** → 1.2 seconds

---

## Advanced Features

### 1. Custom Recipes

Create your own auto-fix recipes in `.odavl/recipes/`:

```json
// .odavl/recipes/custom-logger.json
{
  "id": "replace-console-log",
  "name": "Replace console.log with Logger",
  "description": "Use centralized logger instead of console.log",
  "trust": 0.85,
  "pattern": {
    "match": "console\\.log\\((.+)\\)",
    "replace": "Logger.info($1)"
  },
  "files": ["src/**/*.ts"],
  "exclude": ["**/*.test.ts"]
}
```

### 2. Team Configurations

Share `.odavl/gates.yml` across your team:

```yaml
# .odavl/gates.yml
risk_budget: 50  # Conservative for critical projects

forbidden_paths:
  - payments/**  # Never auto-edit payment logic
  - security/**
  - "**/*.spec.*"

actions:
  max_auto_changes: 5  # Start small
  max_files_per_cycle: 5

custom_rules:
  - name: "No TODO in production"
    pattern: "TODO|FIXME"
    severity: high
    action: block
  
  - name: "Require JSDoc for exports"
    pattern: "export (function|class)"
    severity: medium
    action: warn
```

### 3. VS Code Extension

Install the ODAVL extension for real-time analysis:

```bash
# Install from VS Code marketplace
code --install-extension odavl-studio.odavl-insight
```

**Features**:
- 🔴 Real-time error highlighting (as you type)
- 💡 Quick fixes (Cmd/Ctrl + .)
- 📊 Problems Panel integration
- 🎨 Dark mode dashboard
- 🔄 Auto-run on save

### 4. Pre-Commit Hooks

Add to `package.json`:

```json
{
  "scripts": {
    "odavl": "odavl autopilot run --max-files 5"
  },
  "husky": {
    "hooks": {
      "pre-commit": "pnpm odavl && git add ."
    }
  }
}
```

Now every commit auto-fixes issues before pushing!

---

## Troubleshooting

### Issue: "Command not found: odavl"

**Solution**:
```bash
# Check Node.js version (need 18+)
node --version

# Reinstall globally
npm install -g @odavl-studio/cli --force

# Or add to PATH
export PATH="$PATH:$(npm root -g)/@odavl-studio/cli/bin"
```

### Issue: "Analysis failed: Out of memory"

**Solution**:
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" odavl insight analyze

# Or exclude large directories
echo "node_modules/" >> .odavlignore
echo "dist/" >> .odavlignore
```

### Issue: "TypeError: Cannot read properties of null"

**Solution**:
```bash
# Clear cache
rm -rf .odavl/cache/

# Reinitialize
odavl init --force
```

### Issue: "Autopilot broke my code"

**Solution**:
```bash
# Undo last run (instant rollback)
odavl undo --to latest

# Reduce risk budget
echo "actions:\n  max_auto_changes: 3" >> .odavl/gates.yml
```

---

## What's Next?

### Level Up Your ODAVL Skills

1. **Read the Architecture Guide**: Understand how the O-D-A-V-L cycle works  
   → [docs/ARCHITECTURE.md](./ARCHITECTURE.md)

2. **Explore ML Trust System**: Learn how recipes learn from your codebase  
   → [docs/ML_TRUST_PREDICTION.md](./ML_TRUST_PREDICTION.md)

3. **Join Beta Program**: Get free Pro plan + founder access  
   → [https://odavl.studio/beta](https://odavl.studio/beta)

4. **Watch Product Demo**: 10-minute walkthrough with live coding  
   → [YouTube: ODAVL Studio Demo](https://youtube.com/@odavl)

5. **Compare with SonarQube**: See benchmarks and migration guide  
   → [docs/blog/ODAVL_VS_SONARQUBE_BENCHMARK.md](./ODAVL_VS_SONARQUBE_BENCHMARK.md)

### Community & Support

- **Discord**: [discord.gg/odavl](https://discord.gg/odavl)
- **GitHub Discussions**: [github.com/odavl/odavl-studio/discussions](https://github.com/odavl/odavl-studio/discussions)
- **Twitter**: [@odavl_studio](https://twitter.com/odavl_studio)
- **Email**: hello@odavl.studio

---

## Quick Reference

### Common Commands

```bash
# Analysis
odavl insight analyze               # Run all detectors
odavl insight analyze --detectors typescript,eslint  # Specific detectors
odavl insight dashboard             # Open web dashboard

# Autopilot
odavl autopilot run                 # Full O-D-A-V-L cycle
odavl autopilot run --max-files 5   # Limit changes
odavl autopilot observe             # Phase 1 only (read-only)

# Undo
odavl undo --to latest              # Rollback last run
odavl undo --list                   # Show undo history

# Export
odavl insight export --format pdf   # PDF report
odavl insight export --format csv   # CSV for Excel

# Verification
odavl verify                        # Check quality gates (CI use)
```

### Directory Structure

```
your-project/
├── .odavl/
│   ├── gates.yml                   # Governance rules
│   ├── recipes/                    # Auto-fix strategies
│   ├── recipes-trust.json          # ML trust scores
│   ├── history.json                # Run tracking
│   ├── undo/                       # Rollback snapshots
│   ├── ledger/                     # Run ledgers
│   └── attestation/                # Cryptographic proofs
├── .odavlignore                    # Excluded paths
└── package.json
```

---

**Congratulations!** 🎉 You've just completed the ODAVL crash course. You now have:
- ✅ Self-healing code (78% auto-fix rate)
- ✅ CI/CD integration (blocks bad PRs)
- ✅ Real-time analysis (VS Code extension)
- ✅ Team-wide governance (shared gates.yml)

**Time invested**: 10 minutes  
**Time saved per week**: 6-10 hours (for a 100K LOC project)  
**ROI**: 60x in first month

---

*Last updated: November 22, 2025*  
*ODAVL Studio v2.0*  
*Questions? Email: hello@odavl.studio*
