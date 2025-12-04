# ODAVL Studio SDK

Official TypeScript SDK for integrating ODAVL Studio products into your applications. Provides programmatic access to Insight (error detection), Autopilot (self-healing), and Guardian (testing).

## Installation

```bash
npm install @odavl-studio/sdk
```

## Quick Start

```typescript
import { InsightAnalyzer } from '@odavl-studio/sdk/insight';

const analyzer = new InsightAnalyzer({
  detectors: ['typescript', 'eslint', 'import']
});

const results = await analyzer.analyze('./src');
console.log(`Found ${results.errors.length} errors`);
```

## API Reference

### ODAVL Insight

```typescript
import { analyzeWorkspace, getFixSuggestion } from '@odavl-studio/sdk/insight';

// Analyze workspace
const result = await analyzeWorkspace('./project');

// Get AI-powered fix suggestions
for (const issue of result.issues) {
  const fix = await getFixSuggestion(issue);
  console.log(`Suggestion: ${fix}`);
}
```

### ODAVL Autopilot

```typescript
import { runODAVLCycle, runPhase, undoLastChange } from '@odavl-studio/sdk/autopilot';

// Run full O-D-A-V-L cycle
const result = await runODAVLCycle('./project');

// Or run individual phases
const metrics = await runPhase('observe', './project');
const recipe = await runPhase('decide', './project');

// Rollback if needed
await undoLastChange('./project');
```

### ODAVL Guardian

```typescript
import {
  runPreDeployTests,
  runAccessibilityTests,
  runPerformanceTests,
  runSecurityTests,
} from '@odavl-studio/sdk/guardian';

// Run all pre-deploy tests
const report = await runPreDeployTests('https://staging.app.com');

// Or run specific tests
const a11y = await runAccessibilityTests('https://staging.app.com');
const perf = await runPerformanceTests('https://staging.app.com');
const security = await runSecurityTests('https://staging.app.com');
```

## TypeScript Support

This SDK is written in TypeScript and includes full type definitions.

```typescript
import type {
  InsightIssue,
  AutopilotRunResult,
  GuardianDeploymentReport,
} from '@odavl-studio/sdk';
```

## License

MIT © Mohammad Nawlo
