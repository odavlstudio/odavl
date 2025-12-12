# ODAVL Brain v1

**Internal orchestrator for Insight → Autopilot → Guardian pipeline**

## Overview

ODAVL Brain coordinates the three core products into one automated pipeline:

1. **ODAVL Insight** - Detects all code issues
2. **ODAVL Autopilot** - Automatically fixes detected issues
3. **ODAVL Guardian** - Verifies deployment readiness

## Installation

```bash
pnpm install @odavl/brain
```

## Usage

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
```

### CLI

```bash
# Run full pipeline
odavl brain run .

# Skip autopilot
odavl brain run . --skip-autopilot

# Skip guardian
odavl brain run . --skip-guardian

# Limit fixes
odavl brain run . --max-fixes 10

# Specific detectors
odavl brain run . --detectors typescript,security

# Verbose mode
odavl brain run . --verbose
```

## Output

Brain generates a unified report saved to `.odavl/brain-report.json`:

```json
{
  "timestamp": "2025-12-08T...",
  "projectRoot": "/path/to/project",
  "insight": {
    "totalIssues": 15,
    "issues": [...]
  },
  "autopilot": {
    "totalFixes": 12,
    "changedFiles": [...],
    "attestationHash": "..."
  },
  "guardian": {
    "totalTests": 8,
    "passedTests": 7,
    "failedTests": 1,
    "launchReady": false
  },
  "launchScore": 78,
  "readyForRelease": false,
  "recommendations": [...]
}
```

## Architecture

```
packages/odavl-brain/
├── src/
│   ├── index.ts                  # Main orchestrator
│   ├── types.ts                  # TypeScript types
│   ├── adapters/
│   │   ├── insight-adapter.ts    # Insight integration
│   │   ├── autopilot-adapter.ts  # Autopilot integration
│   │   └── guardian-adapter.ts   # Guardian integration
│   └── utils/
│       └── logger.ts             # Structured logging
├── package.json
└── tsconfig.json
```

## Safety Features

- Respects ODAVL governance rules (`.odavl/gates.yml`)
- Protected paths never auto-edited
- Diff previews before changes
- Attestation hashes for audit trail
- Structured logging with timestamps

## License

MIT
