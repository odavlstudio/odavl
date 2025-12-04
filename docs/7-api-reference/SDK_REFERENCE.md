# ODAVL SDK Reference

**Version:** 0.1.0  
**Package:** `@odavl-studio/sdk`  
**License:** MIT

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Exports](#core-exports)
  - [Main SDK](#main-sdk)
  - [Insight Module](#insight-module)
  - [Autopilot Module](#autopilot-module)
  - [Guardian Module](#guardian-module)
- [TypeScript Types](#typescript-types)
- [API Reference](#api-reference)
  - [Insight API](#insight-api)
  - [Autopilot API](#autopilot-api)
  - [Guardian API](#guardian-api)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Installation

### NPM

```bash
npm install @odavl-studio/sdk
```

### Yarn

```bash
yarn add @odavl-studio/sdk
```

### PNPM

```bash
pnpm add @odavl-studio/sdk
```

### System Requirements

- **Node.js:** >= 18.18
- **TypeScript:** >= 5.0 (recommended)

---

## Quick Start

### ESM (ES Modules)

```typescript
import { Insight, Autopilot, Guardian } from '@odavl-studio/sdk';

// Initialize Insight
const insight = new Insight({ workspacePath: './src' });
const results = await insight.analyze();

console.log(`Found ${results.summary.total} issues`);
```

### CommonJS

```javascript
const { Insight, Autopilot, Guardian } = require('@odavl-studio/sdk');

// Initialize Insight
const insight = new Insight({ workspacePath: './src' });
insight.analyze().then(results => {
  console.log(`Found ${results.summary.total} issues`);
});
```

### Subpath Imports

```typescript
// Import only what you need
import { Insight } from '@odavl-studio/sdk/insight';
import { Autopilot } from '@odavl-studio/sdk/autopilot';
import { Guardian } from '@odavl-studio/sdk/guardian';
```

### All Products at Once

```typescript
import { initODAVL } from '@odavl-studio/sdk';

const odavl = initODAVL({
  apiKey: 'your-api-key',
  apiUrl: 'https://api.odavl.studio',
  timeout: 30000
});

// Use all products
const insightResults = await odavl.insight.analyze();
const autopilotRun = await odavl.autopilot.runCycle();
const guardianReport = await odavl.guardian.runTests('https://example.com');
```

---

## Core Exports

### Main SDK

```typescript
import {
  initODAVL,
  SDK_VERSION,
  ODAVLConfig,
  Insight,
  Autopilot,
  Guardian
} from '@odavl-studio/sdk';
```

#### `initODAVL(config?: ODAVLConfig)`

Initialize all ODAVL products with shared configuration.

**Parameters:**
- `config` (optional): Global configuration object

**Returns:** Object with `insight`, `autopilot`, `guardian` instances

**Example:**

```typescript
const odavl = initODAVL({
  apiKey: process.env.ODAVL_API_KEY,
  timeout: 30000
});

const results = await odavl.insight.analyze();
```

---

#### `SDK_VERSION`

Current SDK version string.

```typescript
import { SDK_VERSION } from '@odavl-studio/sdk';

console.log(SDK_VERSION); // "0.1.0"
```

---

### Insight Module

```typescript
import {
  Insight,
  analyzeWorkspace,
  getFixSuggestion,
  exportToProblemsPanel,
  // Types
  InsightDetector,
  InsightIssue,
  InsightAnalysisResult,
  InsightConfig,
  InsightMetrics
} from '@odavl-studio/sdk/insight';
```

---

### Autopilot Module

```typescript
import {
  Autopilot,
  runODAVLCycle,
  runPhase,
  getRecipes,
  undoLastChange,
  // Types
  AutopilotRecipe,
  AutopilotMetrics,
  AutopilotRunResult,
  AutopilotConfig,
  RunLedger,
  ODAVLPhase
} from '@odavl-studio/sdk/autopilot';
```

---

### Guardian Module

```typescript
import {
  Guardian,
  runPreDeployTests,
  runAccessibilityTests,
  runPerformanceTests,
  runSecurityTests,
  checkQualityGates,
  // Types
  GuardianTestResult,
  GuardianIssue,
  GuardianQualityGate,
  GuardianDeploymentReport,
  GuardianConfig,
  GuardianThresholds,
  TestRun
} from '@odavl-studio/sdk/guardian';
```

---

## TypeScript Types

### Insight Types

#### `InsightDetector`

```typescript
interface InsightDetector {
  name: string;
  type: 'typescript' | 'eslint' | 'import' | 'package' | 'runtime' | 'build' |
        'security' | 'circular' | 'network' | 'performance' | 'complexity' | 'isolation';
  enabled: boolean;
}
```

---

#### `InsightIssue`

```typescript
interface InsightIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file: string;
  line: number;
  column: number;
  detector: string;
  fixSuggestion?: string;
}
```

---

#### `InsightAnalysisResult`

```typescript
interface InsightAnalysisResult {
  issues: InsightIssue[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  detectors: InsightDetector[];
}
```

---

#### `InsightConfig`

```typescript
interface InsightConfig {
  workspacePath?: string;
  enabledDetectors?: string[];
  timeout?: number;
}
```

---

#### `InsightMetrics`

```typescript
interface InsightMetrics {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  detectionTime: number; // milliseconds
}
```

---

### Autopilot Types

#### `AutopilotRecipe`

```typescript
interface AutopilotRecipe {
  id: string;
  trust: number; // 0.0 - 1.0
  action: string;
  description: string;
  category: string;
}
```

---

#### `AutopilotMetrics`

```typescript
interface AutopilotMetrics {
  errorCount: number;
  warningCount: number;
  typeErrors: number;
  lintErrors: number;
}
```

---

#### `AutopilotRunResult`

```typescript
interface AutopilotRunResult {
  runId: string;
  startedAt: string; // ISO 8601
  finishedAt: string; // ISO 8601
  phase: ODAVLPhase;
  success: boolean;
  metrics: AutopilotMetrics;
  filesModified: string[];
  attestationHash?: string; // SHA-256
}
```

---

#### `AutopilotConfig`

```typescript
interface AutopilotConfig {
  workspacePath?: string;
  maxFiles?: number;  // Default: 10
  maxLOC?: number;    // Default: 40
  protectedPaths?: string[]; // Glob patterns
}
```

---

#### `ODAVLPhase`

```typescript
type ODAVLPhase = 'observe' | 'decide' | 'act' | 'verify' | 'learn';
```

---

### Guardian Types

#### `GuardianTestResult`

```typescript
interface GuardianTestResult {
  testId: string;
  type: 'accessibility' | 'performance' | 'security' | 'seo';
  status: 'passed' | 'failed' | 'warning';
  score: number; // 0-100
  issues: GuardianIssue[];
}
```

---

#### `GuardianIssue`

```typescript
interface GuardianIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  impact: string;
  recommendation: string;
}
```

---

#### `GuardianQualityGate`

```typescript
interface GuardianQualityGate {
  name: string;
  threshold: number; // 0-100
  current: number;   // 0-100
  passed: boolean;
}
```

---

#### `GuardianDeploymentReport`

```typescript
interface GuardianDeploymentReport {
  deploymentId: string;
  timestamp: string; // ISO 8601
  environment: 'development' | 'staging' | 'production';
  tests: GuardianTestResult[];
  qualityGates: GuardianQualityGate[];
  overallStatus: 'passed' | 'failed' | 'warning';
  canDeploy: boolean;
}
```

---

#### `GuardianConfig`

```typescript
interface GuardianConfig {
  apiKey?: string;
  thresholds?: GuardianThresholds;
  timeout?: number;
}
```

---

#### `GuardianThresholds`

```typescript
interface GuardianThresholds {
  accessibility?: number; // Default: 90
  performance?: number;   // Default: 85
  security?: number;      // Default: 95
  seo?: number;          // Default: 80
}
```

---

## API Reference

### Insight API

#### `class Insight`

Main class for error detection and analysis.

**Constructor:**

```typescript
new Insight(config?: InsightConfig)
```

**Methods:**

##### `analyze(path?: string): Promise<InsightAnalysisResult>`

Analyze workspace for errors and issues.

**Parameters:**
- `path` (optional): Path to analyze (defaults to `workspacePath` from config)

**Returns:** Promise resolving to analysis results

**Example:**

```typescript
const insight = new Insight({ workspacePath: './src' });
const results = await insight.analyze();

console.log(`Total issues: ${results.summary.total}`);
console.log(`Critical: ${results.summary.critical}`);
console.log(`High: ${results.summary.high}`);

// Iterate through issues
for (const issue of results.issues) {
  console.log(`[${issue.severity}] ${issue.file}:${issue.line} - ${issue.message}`);
}
```

---

##### `getFixSuggestions(issue: InsightIssue): Promise<string | null>`

Get AI-powered fix suggestion for specific issue.

**Parameters:**
- `issue`: Issue object from analysis results

**Returns:** Promise resolving to fix suggestion or null

**Example:**

```typescript
const results = await insight.analyze();
const firstIssue = results.issues[0];

if (firstIssue) {
  const suggestion = await insight.getFixSuggestions(firstIssue);
  console.log(`Suggestion: ${suggestion}`);
}
```

---

##### `getMetrics(): Promise<InsightMetrics>`

Get metrics summary for workspace.

**Returns:** Promise resolving to metrics object

**Example:**

```typescript
const metrics = await insight.getMetrics();

console.log(`Total issues: ${metrics.totalIssues}`);
console.log(`Detection time: ${metrics.detectionTime}ms`);
```

---

##### `exportToProblemsPanel(result: InsightAnalysisResult): Record<string, any>`

Export results to VS Code Problems Panel format.

**Parameters:**
- `result`: Analysis result object

**Returns:** Object in Problems Panel format

**Example:**

```typescript
const results = await insight.analyze();
const problemsPanel = insight.exportToProblemsPanel(results);

// Write to .odavl/problems-panel-export.json
await fs.writeFile(
  '.odavl/problems-panel-export.json',
  JSON.stringify(problemsPanel, null, 2)
);
```

---

#### Standalone Functions

##### `analyzeWorkspace(workspacePath: string, options?: { detectors?: string[] }): Promise<InsightAnalysisResult>`

Analyze workspace without creating Insight instance.

**Example:**

```typescript
import { analyzeWorkspace } from '@odavl-studio/sdk/insight';

const results = await analyzeWorkspace('./src', {
  detectors: ['typescript', 'eslint', 'security']
});
```

---

##### `getFixSuggestion(issue: InsightIssue): Promise<string | null>`

Get fix suggestion without creating Insight instance.

**Example:**

```typescript
import { getFixSuggestion } from '@odavl-studio/sdk/insight';

const suggestion = await getFixSuggestion(issue);
```

---

##### `exportToProblemsPanel(result: InsightAnalysisResult): Record<string, any>`

Export to Problems Panel format (standalone).

**Example:**

```typescript
import { exportToProblemsPanel } from '@odavl-studio/sdk/insight';

const problemsPanel = exportToProblemsPanel(results);
```

---

### Autopilot API

#### `class Autopilot`

Main class for self-healing automation.

**Constructor:**

```typescript
new Autopilot(config?: AutopilotConfig)
```

**Methods:**

##### `runCycle(): Promise<AutopilotRunResult>`

Run full O-D-A-V-L cycle.

**Returns:** Promise resolving to run result

**Example:**

```typescript
const autopilot = new Autopilot({
  workspacePath: './src',
  maxFiles: 5,
  maxLOC: 20
});

const result = await autopilot.runCycle();

console.log(`Run ID: ${result.runId}`);
console.log(`Success: ${result.success}`);
console.log(`Files modified: ${result.filesModified.length}`);

if (result.attestationHash) {
  console.log(`Attestation: ${result.attestationHash}`);
}
```

---

##### `runPhase(phase: ODAVLPhase): Promise<Partial<AutopilotRunResult>>`

Run single O-D-A-V-L phase.

**Parameters:**
- `phase`: Phase to run ('observe', 'decide', 'act', 'verify', 'learn')

**Returns:** Promise resolving to partial run result

**Example:**

```typescript
// Run phases individually
await autopilot.runPhase('observe');
await autopilot.runPhase('decide');
await autopilot.runPhase('act');
await autopilot.runPhase('verify');
await autopilot.runPhase('learn');
```

---

##### `undo(snapshotId?: string): Promise<void>`

Undo last automated change or restore specific snapshot.

**Parameters:**
- `snapshotId` (optional): Specific snapshot ID to restore

**Returns:** Promise resolving when undo complete

**Example:**

```typescript
// Undo last change
await autopilot.undo();

// Restore specific snapshot
await autopilot.undo('1732368000000');
```

---

##### `getLedger(): Promise<RunLedger[]>`

Get run history ledger.

**Returns:** Promise resolving to array of ledger entries

**Example:**

```typescript
const ledger = await autopilot.getLedger();

for (const entry of ledger) {
  console.log(`${entry.timestamp}: ${entry.phase} - ${entry.success ? 'Success' : 'Failed'}`);
}
```

---

##### `getRecipes(): Promise<AutopilotRecipe[]>`

Get available improvement recipes.

**Returns:** Promise resolving to array of recipes

**Example:**

```typescript
const recipes = await autopilot.getRecipes();

// Sort by trust score
const sorted = recipes.sort((a, b) => b.trust - a.trust);

console.log('Top 5 recipes:');
sorted.slice(0, 5).forEach(recipe => {
  console.log(`${recipe.id}: ${recipe.trust.toFixed(2)} - ${recipe.description}`);
});
```

---

#### Standalone Functions

##### `runODAVLCycle(workspacePath: string, options?: { maxFiles?: number; maxLOC?: number }): Promise<AutopilotRunResult>`

Run full cycle without creating Autopilot instance.

**Example:**

```typescript
import { runODAVLCycle } from '@odavl-studio/sdk/autopilot';

const result = await runODAVLCycle('./src', {
  maxFiles: 5,
  maxLOC: 20
});
```

---

##### `runPhase(phase: ODAVLPhase, workspacePath: string): Promise<Partial<AutopilotRunResult>>`

Run single phase (standalone).

**Example:**

```typescript
import { runPhase } from '@odavl-studio/sdk/autopilot';

await runPhase('observe', './src');
```

---

##### `getRecipes(workspacePath: string): Promise<AutopilotRecipe[]>`

Get recipes (standalone).

**Example:**

```typescript
import { getRecipes } from '@odavl-studio/sdk/autopilot';

const recipes = await getRecipes('./src');
```

---

##### `undoLastChange(workspacePath: string): Promise<boolean>`

Undo last change (standalone).

**Example:**

```typescript
import { undoLastChange } from '@odavl-studio/sdk/autopilot';

const success = await undoLastChange('./src');
console.log(success ? 'Undo successful' : 'Undo failed');
```

---

### Guardian API

#### `class Guardian`

Main class for pre-deploy testing.

**Constructor:**

```typescript
new Guardian(config?: GuardianConfig)
```

**Methods:**

##### `runTests(url: string): Promise<GuardianDeploymentReport>`

Run all pre-deploy tests on URL.

**Parameters:**
- `url`: URL to test

**Returns:** Promise resolving to deployment report

**Example:**

```typescript
const guardian = new Guardian({
  thresholds: {
    accessibility: 95,
    performance: 90,
    security: 98,
    seo: 85
  }
});

const report = await guardian.runTests('https://staging.example.com');

console.log(`Overall status: ${report.overallStatus}`);
console.log(`Can deploy: ${report.canDeploy}`);

// Check each test
for (const test of report.tests) {
  console.log(`${test.type}: ${test.score}/100 - ${test.status}`);
}

// Check quality gates
for (const gate of report.qualityGates) {
  const status = gate.passed ? '✅' : '❌';
  console.log(`${status} ${gate.name}: ${gate.current}/${gate.threshold}`);
}
```

---

##### `getReport(testId: string): Promise<GuardianDeploymentReport | null>`

Get specific test report by ID.

**Parameters:**
- `testId`: Test ID

**Returns:** Promise resolving to report or null

**Example:**

```typescript
const report = await guardian.getReport('deploy-1732368000000');
```

---

##### `setThresholds(thresholds: GuardianThresholds): Promise<void>`

Update quality gate thresholds.

**Parameters:**
- `thresholds`: New threshold values

**Example:**

```typescript
await guardian.setThresholds({
  accessibility: 98,
  performance: 95,
  security: 99
});
```

---

##### `getHistory(): Promise<TestRun[]>`

Get test run history.

**Returns:** Promise resolving to array of test runs

**Example:**

```typescript
const history = await guardian.getHistory();

console.log(`Total runs: ${history.length}`);

const passRate = history.filter(r => r.status === 'passed').length / history.length;
console.log(`Pass rate: ${(passRate * 100).toFixed(1)}%`);
```

---

#### Standalone Functions

##### `runPreDeployTests(url: string, options?: { tests?: string[] }): Promise<GuardianDeploymentReport>`

Run tests without creating Guardian instance.

**Example:**

```typescript
import { runPreDeployTests } from '@odavl-studio/sdk/guardian';

const report = await runPreDeployTests('https://example.com', {
  tests: ['accessibility', 'security']
});
```

---

##### `runAccessibilityTests(url: string): Promise<GuardianTestResult>`

Run accessibility tests only (standalone).

**Example:**

```typescript
import { runAccessibilityTests } from '@odavl-studio/sdk/guardian';

const result = await runAccessibilityTests('https://example.com');
console.log(`Accessibility score: ${result.score}/100`);
```

---

##### `runPerformanceTests(url: string): Promise<GuardianTestResult>`

Run performance tests only (standalone).

**Example:**

```typescript
import { runPerformanceTests } from '@odavl-studio/sdk/guardian';

const result = await runPerformanceTests('https://example.com');
console.log(`Performance score: ${result.score}/100`);
```

---

##### `runSecurityTests(url: string): Promise<GuardianTestResult>`

Run security tests only (standalone).

**Example:**

```typescript
import { runSecurityTests } from '@odavl-studio/sdk/guardian';

const result = await runSecurityTests('https://example.com');
console.log(`Security score: ${result.score}/100`);
```

---

##### `checkQualityGates(results: GuardianTestResult[]): Promise<GuardianQualityGate[]>`

Check quality gates against test results.

**Example:**

```typescript
import { checkQualityGates } from '@odavl-studio/sdk/guardian';

const gates = await checkQualityGates(testResults);

const allPassed = gates.every(gate => gate.passed);
console.log(allPassed ? 'All gates passed ✅' : 'Some gates failed ❌');
```

---

## Error Handling

### Error Types

All SDK methods can throw the following error types:

1. **ConfigurationError** - Invalid configuration
2. **AnalysisError** - Error during analysis/testing
3. **NetworkError** - API/network request failed
4. **TimeoutError** - Operation exceeded timeout
5. **ValidationError** - Invalid input parameters

### Error Handling Pattern

```typescript
import { Insight } from '@odavl-studio/sdk/insight';

try {
  const insight = new Insight({ workspacePath: './src' });
  const results = await insight.analyze();
  
  // Handle results
  console.log(`Found ${results.summary.total} issues`);
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
    
    // Check error type
    if (error.name === 'TimeoutError') {
      console.error('Analysis timed out - try smaller workspace');
    } else if (error.name === 'ConfigurationError') {
      console.error('Invalid configuration - check your settings');
    }
  }
}
```

### Timeout Configuration

```typescript
const insight = new Insight({
  workspacePath: './src',
  timeout: 60000 // 60 seconds
});

const autopilot = new Autopilot({
  workspacePath: './src',
  timeout: 120000 // 2 minutes
});

const guardian = new Guardian({
  timeout: 30000 // 30 seconds
});
```

---

## Best Practices

### 1. Use TypeScript for Type Safety

```typescript
import type {
  InsightAnalysisResult,
  AutopilotRunResult,
  GuardianDeploymentReport
} from '@odavl-studio/sdk';

async function analyzeAndReport(): Promise<InsightAnalysisResult> {
  const insight = new Insight({ workspacePath: './src' });
  return await insight.analyze();
}
```

---

### 2. Configure Workspace Path

```typescript
// ✅ Good: Explicit workspace path
const insight = new Insight({ workspacePath: path.join(__dirname, '../src') });

// ❌ Bad: Relying on process.cwd()
const insight = new Insight(); // Uses process.cwd()
```

---

### 3. Handle Errors Gracefully

```typescript
async function safeAnalysis() {
  try {
    const results = await insight.analyze();
    return results;
  } catch (error) {
    // Log error
    console.error('Analysis failed:', error);
    
    // Return default
    return {
      issues: [],
      summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
      detectors: []
    };
  }
}
```

---

### 4. Use Subpath Imports

```typescript
// ✅ Good: Import only what you need
import { Insight } from '@odavl-studio/sdk/insight';

// ❌ Okay but heavier: Import entire SDK
import { Insight } from '@odavl-studio/sdk';
```

---

### 5. Validate URLs for Guardian

```typescript
function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

if (isValidURL(url)) {
  await guardian.runTests(url);
} else {
  throw new Error('Invalid URL format');
}
```

---

### 6. Cache SDK Instances

```typescript
// ✅ Good: Reuse instance
const insight = new Insight({ workspacePath: './src' });

for (const path of paths) {
  await insight.analyze(path);
}

// ❌ Bad: Create new instance each time
for (const path of paths) {
  const insight = new Insight({ workspacePath: path });
  await insight.analyze();
}
```

---

## Examples

### Example 1: Basic Insight Analysis

```typescript
import { Insight } from '@odavl-studio/sdk/insight';

async function analyzeProject() {
  const insight = new Insight({
    workspacePath: './src',
    enabledDetectors: ['typescript', 'eslint', 'security']
  });

  const results = await insight.analyze();

  // Print summary
  console.log('Analysis Summary:');
  console.log(`Total: ${results.summary.total}`);
  console.log(`Critical: ${results.summary.critical}`);
  console.log(`High: ${results.summary.high}`);
  console.log(`Medium: ${results.summary.medium}`);
  console.log(`Low: ${results.summary.low}`);

  // Get critical issues
  const critical = results.issues.filter(i => i.severity === 'critical');
  
  if (critical.length > 0) {
    console.log('\nCritical Issues:');
    for (const issue of critical) {
      console.log(`${issue.file}:${issue.line} - ${issue.message}`);
    }
  }
}

analyzeProject();
```

---

### Example 2: Autopilot Integration

```typescript
import { Autopilot } from '@odavl-studio/sdk/autopilot';

async function runAutopilot() {
  const autopilot = new Autopilot({
    workspacePath: './src',
    maxFiles: 10,
    maxLOC: 40,
    protectedPaths: ['security/**', '**/*.test.*']
  });

  console.log('Starting O-D-A-V-L cycle...');
  
  const result = await autopilot.runCycle();

  if (result.success) {
    console.log(`✅ Cycle completed successfully`);
    console.log(`Files modified: ${result.filesModified.length}`);
    console.log(`Attestation: ${result.attestationHash}`);
    
    // Get ledger
    const ledger = await autopilot.getLedger();
    console.log(`Total runs: ${ledger.length}`);
  } else {
    console.log(`❌ Cycle failed`);
    console.log('Rolling back changes...');
    await autopilot.undo();
  }
}

runAutopilot();
```

---

### Example 3: Guardian Pre-Deploy Tests

```typescript
import { Guardian } from '@odavl-studio/sdk/guardian';

async function preDeployCheck(url: string) {
  const guardian = new Guardian({
    thresholds: {
      accessibility: 90,
      performance: 85,
      security: 95,
      seo: 80
    }
  });

  console.log(`Testing ${url}...`);
  
  const report = await guardian.runTests(url);

  console.log(`\nOverall Status: ${report.overallStatus}`);
  console.log(`Can Deploy: ${report.canDeploy ? '✅' : '❌'}`);

  // Print test results
  console.log('\nTest Results:');
  for (const test of report.tests) {
    const icon = test.status === 'passed' ? '✅' : test.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${test.type}: ${test.score}/100`);
  }

  // Check quality gates
  console.log('\nQuality Gates:');
  for (const gate of report.qualityGates) {
    const icon = gate.passed ? '✅' : '❌';
    console.log(`${icon} ${gate.name}: ${gate.current}/${gate.threshold}`);
  }

  if (!report.canDeploy) {
    throw new Error('Deployment blocked by quality gates');
  }

  return report;
}

preDeployCheck('https://staging.example.com');
```

---

### Example 4: All Three Products Together

```typescript
import { initODAVL } from '@odavl-studio/sdk';

async function completeWorkflow() {
  const odavl = initODAVL({
    apiKey: process.env.ODAVL_API_KEY,
    timeout: 60000
  });

  // 1. Analyze code
  console.log('Step 1: Analyzing code...');
  const insightResults = await odavl.insight.analyze();
  
  if (insightResults.summary.critical > 0) {
    console.log('❌ Critical issues found - fix before deploying');
    return;
  }

  // 2. Run autopilot improvements
  console.log('\nStep 2: Running autopilot...');
  const autopilotResult = await odavl.autopilot.runCycle();
  
  if (!autopilotResult.success) {
    console.log('⚠️ Autopilot failed - manual review needed');
  }

  // 3. Test deployment
  console.log('\nStep 3: Testing deployment...');
  const guardianReport = await odavl.guardian.runTests(
    'https://staging.example.com'
  );

  if (guardianReport.canDeploy) {
    console.log('\n✅ All checks passed - ready to deploy!');
  } else {
    console.log('\n❌ Quality gates failed - deployment blocked');
  }
}

completeWorkflow();
```

---

**Last Updated:** November 23, 2025  
**SDK Version:** 0.1.0  
**Author:** ODAVL Studio Team
