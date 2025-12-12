# 🧠 ODAVL Brain v1 - Complete Guide

## Overview

**ODAVL Brain** is the internal orchestrator that unifies the three core ODAVL products into one automated pipeline:

```
┌─────────────────────────────────────────────────────────┐
│                    🧠 ODAVL BRAIN v1                    │
│                  Unified Orchestrator                    │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   ┌─────────┐      ┌──────────┐      ┌──────────┐
   │ INSIGHT │ ───> │ AUTOPILOT│ ───> │ GUARDIAN │
   │ Detect  │      │   Fix    │      │  Verify  │
   └─────────┘      └──────────┘      └──────────┘
        │                 │                 │
        ▼                 ▼                 ▼
    Issues            Fixes            Tests
```

## Installation

```bash
# Install dependencies
pnpm install

# Build Brain package
cd packages/odavl-brain
pnpm build

# Build CLI
cd apps/studio-cli
pnpm build
```

## Quick Start

### Command Line

```bash
# Run full pipeline on current directory
odavl brain run .

# Run on specific project
odavl brain run /path/to/project

# Skip autopilot phase
odavl brain run . --skip-autopilot

# Skip guardian phase
odavl brain run . --skip-guardian

# Limit number of fixes
odavl brain run . --max-fixes 10

# Use specific detectors
odavl brain run . --detectors typescript,security,performance

# Verbose output
odavl brain run . --verbose

# Check last report status
odavl brain status
```

### Programmatic API

```typescript
import { runBrainPipeline } from '@odavl/brain';

const report = await runBrainPipeline({
  projectRoot: '/path/to/project',
  skipAutopilot: false,
  skipGuardian: false,
  maxFixes: 50,
  detectors: ['typescript', 'security', 'performance'],
  verbose: true,
});

console.log('Launch Score:', report.launchScore);
console.log('Ready for Release:', report.readyForRelease);
console.log('Recommendations:', report.recommendations);
```

## Architecture

### Package Structure

```
packages/odavl-brain/
├── src/
│   ├── index.ts                  # Main orchestrator
│   ├── types.ts                  # TypeScript definitions
│   ├── adapters/                 # Product adapters
│   │   ├── insight-adapter.ts    # Insight integration
│   │   ├── autopilot-adapter.ts  # Autopilot integration
│   │   └── guardian-adapter.ts   # Guardian integration
│   └── utils/
│       └── logger.ts             # Structured logging
├── package.json
├── tsconfig.json
└── README.md
```

### Product Integration

#### 1. Insight Adapter

**Purpose**: Run ODAVL Insight analysis programmatically

**Features**:
- Loads detectors on-demand (lazy loading)
- Supports 11 stable detectors + 3 experimental
- Returns structured issue list with severity levels
- Maps detector-specific formats to unified schema

**Detectors Available**:
- TypeScript (type errors, strict mode violations)
- ESLint (code quality, best practices)
- Security (hardcoded secrets, SQL injection, XSS)
- Import (circular dependencies, unused imports)
- Package (outdated deps, security vulnerabilities)
- Runtime (memory leaks, performance issues)
- Build (compilation errors, configuration issues)
- Circular (dependency cycles)
- Performance (slow operations, N+1 queries)
- Complexity (cyclomatic complexity, cognitive load)
- Network (API calls, error handling)

**Output Format**:
```typescript
{
  timestamp: "2025-12-08T...",
  projectRoot: "/path/to/project",
  totalIssues: 15,
  issues: [
    {
      file: "src/index.ts",
      line: 42,
      column: 10,
      severity: "high",
      type: "security",
      detector: "security",
      message: "Hardcoded API key detected",
      code: "hardcoded-secret",
      fix: "Use environment variables"
    }
  ],
  detectors: ["typescript", "security"],
  duration: 1250
}
```

#### 2. Autopilot Adapter

**Purpose**: Run ODAVL Autopilot O-D-A-V-L cycle

**Phases Executed**:
1. **OBSERVE** - Collect metrics (ESLint + TypeScript)
2. **DECIDE** - Select best recipe using ML trust predictor
3. **ACT** - Apply fixes with undo snapshots
4. **VERIFY** - Re-run checks, enforce gates
5. **LEARN** - Update trust scores

**Safety Features**:
- Respects `.odavl/gates.yml` constraints
- Never touches protected paths (`security/**`, `auth/**`)
- Max 10 files per cycle (configurable)
- Max 40 LOC per file (configurable)
- Diff-based undo snapshots (85% space savings)
- SHA-256 attestation hashes

**Output Format**:
```typescript
{
  timestamp: "2025-12-08T...",
  projectRoot: "/path/to/project",
  totalFixes: 8,
  fixes: [
    {
      file: "src/utils.ts",
      linesChanged: 5,
      type: "auto-fix",
      description: "Remove unused imports",
      attestationHash: "a3f9..."
    }
  ],
  changedFiles: ["src/utils.ts", "src/types.ts"],
  diffSummary: "8 fixes applied, 23 lines changed",
  attestationHash: "b7e4...",
  duration: 3420,
  errors: []
}
```

#### 3. Guardian Adapter

**Purpose**: Run comprehensive verification tests

**Tests Executed**:
1. **Build** - `pnpm build` (compilation check)
2. **TypeScript** - `pnpm typecheck` (type validation)
3. **Lint** - `pnpm lint` (code quality)
4. **Unit Tests** - `pnpm test` (functionality)
5. **Prisma** (if exists) - Schema validation + migrations
6. **Extensions** (if exists) - VS Code extension tests
7. **Cloud Console** (if exists) - Next.js typecheck

**Output Format**:
```typescript
{
  timestamp: "2025-12-08T...",
  projectRoot: "/path/to/project",
  tests: [
    { name: "Build", status: "passed", duration: 2340 },
    { name: "TypeScript", status: "passed", duration: 1890 },
    { name: "Lint", status: "failed", message: "3 errors", duration: 450 }
  ],
  totalTests: 8,
  passedTests: 7,
  failedTests: 1,
  skippedTests: 0,
  launchReady: false,
  duration: 8750,
  recommendations: [
    "Fix all failing tests before deployment",
    "Failed tests: Lint"
  ]
}
```

## Pipeline Report

The complete pipeline generates a unified report saved to `.odavl/brain-report.json`:

```json
{
  "timestamp": "2025-12-08T14:30:00.000Z",
  "projectRoot": "/path/to/project",
  "insight": { /* Insight results */ },
  "autopilot": { /* Autopilot fixes */ },
  "guardian": { /* Guardian tests */ },
  "launchScore": 85,
  "readyForRelease": true,
  "recommendations": [
    "✅ All checks passed! Ready for deployment."
  ],
  "totalDuration": 12450
}
```

### Launch Score Calculation

The launch score (0-100) is calculated based on:

```typescript
score = 100
  - min(insight.totalIssues * 2, 30)     // Deduct for issues
  - min(autopilot.errors.length * 5, 20) // Deduct for errors
  - min(guardian.failedTests * 10, 30)   // Deduct for failures
  + (guardian.passRate * 20)             // Add for passed tests
```

**Score Interpretation**:
- **90-100**: Excellent - Ready for production
- **75-89**: Good - Minor issues to address
- **60-74**: Fair - Several improvements needed
- **0-59**: Poor - Critical issues blocking release

## Workspace Scripts

Add these to your project's `package.json`:

```json
{
  "scripts": {
    "odavl:brain": "odavl brain run .",
    "brain:dev": "odavl brain run . --verbose",
    "brain:quick": "odavl brain run . --skip-guardian",
    "brain:status": "odavl brain status"
  }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: ODAVL Brain Pipeline

on: [push, pull_request]

jobs:
  brain:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 9.12.2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: pnpm install
      - run: pnpm build
      - run: odavl brain run . --verbose
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: brain-report
          path: .odavl/brain-report.json
```

## Testing

### Smoke Test

```bash
# Run smoke test
pnpm brain:smoke

# Manual test
cd packages/odavl-brain
pnpm build
pnpm test
```

The smoke test:
1. Creates a temporary sandbox
2. Injects intentional bugs
3. Runs full Brain pipeline
4. Validates all phases work correctly
5. Cleans up automatically

## Configuration

### Project Configuration (`.odavl/gates.yml`)

```yaml
risk_budget: 100
forbidden_paths:
  - security/**
  - auth/**
  - "**/*.spec.*"
  - "**/*.test.*"
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

### Brain Configuration

```typescript
interface BrainConfig {
  projectRoot: string;      // Absolute path to project
  skipAutopilot?: boolean;  // Skip autopilot phase
  skipGuardian?: boolean;   // Skip guardian phase
  maxFixes?: number;        // Max fixes to apply (default: 50)
  detectors?: string[];     // Specific detectors to run
  verbose?: boolean;        // Verbose logging
}
```

## Best Practices

### When to Run Brain

✅ **DO run Brain**:
- Before creating pull requests
- Before merging to main/production
- In CI/CD pipelines
- After major refactoring
- Before deployments
- Weekly as scheduled maintenance

❌ **DON'T run Brain**:
- During active development (use individual products)
- On production servers (pre-deploy only)
- With uncommitted changes (commit or stash first)

### Performance Tips

1. **Use specific detectors** when you know the issue area:
   ```bash
   odavl brain run . --detectors typescript,security
   ```

2. **Skip Guardian** for faster feedback during development:
   ```bash
   odavl brain run . --skip-guardian
   ```

3. **Limit fixes** for large codebases:
   ```bash
   odavl brain run . --max-fixes 10
   ```

4. **Run Guardian separately** for full deployment checks:
   ```bash
   odavl guardian test https://staging.example.com
   ```

## Troubleshooting

### Common Issues

**Issue**: "Module not found: @odavl/brain"
```bash
# Solution: Build the package
cd packages/odavl-brain && pnpm build
```

**Issue**: "Permission denied" during Autopilot
```bash
# Solution: Check .odavl/gates.yml permissions
# Ensure files are not in forbidden_paths
```

**Issue**: "Guardian tests timeout"
```bash
# Solution: Increase timeout or skip slow tests
odavl brain run . --skip-guardian
```

**Issue**: "No report generated"
```bash
# Solution: Check .odavl directory permissions
mkdir -p .odavl && chmod 755 .odavl
```

## Roadmap

### v1.0 (Current) ✅
- [x] Basic Insight integration
- [x] Autopilot O-D-A-V-L cycle
- [x] Guardian verification
- [x] Unified reporting
- [x] CLI interface

### v1.1 (Next)
- [ ] Parallel detector execution
- [ ] Incremental analysis (only changed files)
- [ ] ML-powered fix suggestions
- [ ] Cloud report storage
- [ ] Slack/Discord notifications

### v2.0 (Future)
- [ ] Distributed execution
- [ ] Multi-language support (Python, Java, Go)
- [ ] Visual dashboard
- [ ] Team collaboration features
- [ ] Custom detector plugins

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## License

MIT - See [LICENSE](../../LICENSE)
