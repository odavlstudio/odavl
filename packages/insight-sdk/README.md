# ODAVL Insight SDK

**Production-ready SDK for ML-powered error detection with 25+ specialized detectors**

Version: 1.0.0 | License: MIT | [GitHub](https://github.com/odavlstudio/odavl)

## Overview

ODAVL Insight SDK provides a clean, stable API for programmatic code analysis. Built on top of the production-hardened Insight Core engine (Wave 4), this SDK offers workspace-level and file-level analysis with comprehensive issue detection across TypeScript, JavaScript, Python, Java, and more.

## Installation

```bash
pnpm add @odavl/insight-sdk
# or
npm install @odavl/insight-sdk
```

## Quick Start

```typescript
import { analyzeWorkspace, analyzeFiles, listDetectors } from '@odavl/insight-sdk';

// Analyze entire workspace
const result = await analyzeWorkspace('/path/to/workspace', {
  detectors: ['typescript', 'security', 'performance'],
  severityMinimum: 'medium'
});

console.log(`Found ${result.summary.totalIssues} issues in ${result.summary.filesAnalyzed} files`);
console.log(`Critical: ${result.summary.critical}, High: ${result.summary.high}`);

// Analyze specific files
const fileResult = await analyzeFiles([
  '/path/to/file1.ts',
  '/path/to/file2.ts'
], {
  detectors: ['typescript', 'complexity']
});

// List available detectors
const detectors = await listDetectors();
console.log(`Available detectors: ${detectors.join(', ')}`);
```

## API Reference

### `analyzeWorkspace(workspacePath, options?)`

Analyze an entire workspace directory.

**Parameters:**
- `workspacePath: string` - Absolute path to workspace root
- `options?: AnalysisOptions` - Configuration object
  - `detectors?: string[]` - Detectors to run (default: all)
  - `severityMinimum?: 'info'|'low'|'medium'|'high'|'critical'` - Minimum severity (default: 'info')
  - `timeout?: number` - Analysis timeout in milliseconds (default: none)

**Returns:** `Promise<InsightAnalysisResult>`

**Example:**
```typescript
const result = await analyzeWorkspace('/home/user/my-project', {
  detectors: ['typescript', 'security', 'performance', 'complexity'],
  severityMinimum: 'medium',
  timeout: 60000 // 60 seconds
});

// Result structure
{
  issues: [
    {
      file: '/home/user/my-project/src/index.ts',
      line: 10,
      column: 5,
      message: 'Hardcoded API key detected',
      severity: 'critical',
      detector: 'security',
      ruleId: 'no-hardcoded-secrets',
      suggestedFix: 'Use environment variables: process.env.API_KEY'
    }
  ],
  summary: {
    filesAnalyzed: 42,
    totalIssues: 7,
    critical: 1,
    high: 2,
    medium: 3,
    low: 1,
    info: 0,
    elapsedMs: 3421
  }
}
```

### `analyzeFiles(filePaths, options?)`

Analyze specific files.

**Parameters:**
- `filePaths: string[]` - Array of absolute file paths
- `options?: AnalysisOptions` - Configuration object (same as analyzeWorkspace)

**Returns:** `Promise<InsightAnalysisResult>`

**Example:**
```typescript
const result = await analyzeFiles([
  '/home/user/my-project/src/auth.ts',
  '/home/user/my-project/src/api.ts'
], {
  detectors: ['security', 'typescript'],
  severityMinimum: 'high'
});

console.log(`Found ${result.issues.length} high/critical issues`);
```

### `listDetectors()`

List all available detectors (auto-discovered from Insight Core).

**Returns:** `Promise<string[]>`

**Example:**
```typescript
const detectors = await listDetectors();
// ['typescript', 'security', 'performance', 'complexity', 'circular', ...]
```

## Available Detectors (Wave 4)

### Stable Detectors (11)
✅ **typescript** - TypeScript compiler errors and type issues  
✅ **security** - Security vulnerabilities (SQL injection, XSS, hardcoded secrets)  
✅ **performance** - Performance anti-patterns and bottlenecks  
✅ **complexity** - Cyclomatic and cognitive complexity analysis  
✅ **circular** - Circular dependency detection  
✅ **import** - Import/export issues  
✅ **package** - Package.json and dependency issues  
✅ **runtime** - Runtime error detection  
✅ **build** - Build configuration issues  
✅ **network** - Network-related issues  
✅ **isolation** - Module isolation violations  

### Experimental Detectors (3)
⚠️ **python-type** - Python type hint validation (mypy)  
⚠️ **python-security** - Python security issues (bandit)  
⚠️ **python-complexity** - Python complexity (radon)  

## Type Definitions

```typescript
export interface InsightIssue {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  detector: string;
  ruleId?: string;
  suggestedFix?: string;
}

export interface InsightAnalysisResult {
  issues: InsightIssue[];
  summary: {
    filesAnalyzed: number;
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    elapsedMs: number;
  };
}

export interface AnalysisOptions {
  detectors?: string[];
  severityMinimum?: 'info' | 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
}
```

## Advanced Usage

### Custom Detector Selection

```typescript
// Security-focused analysis
const securityResult = await analyzeWorkspace('/path/to/project', {
  detectors: ['security', 'typescript'],
  severityMinimum: 'high'
});

// Performance audit
const perfResult = await analyzeWorkspace('/path/to/project', {
  detectors: ['performance', 'complexity'],
  severityMinimum: 'medium'
});
```

### Filtering Results

```typescript
const result = await analyzeWorkspace('/path/to/project');

// Get only critical issues
const criticalIssues = result.issues.filter(i => i.severity === 'critical');

// Group by detector
const byDetector = result.issues.reduce((acc, issue) => {
  acc[issue.detector] = acc[issue.detector] || [];
  acc[issue.detector].push(issue);
  return acc;
}, {} as Record<string, InsightIssue[]>);

// Find files with most issues
const fileIssueCounts = result.issues.reduce((acc, issue) => {
  acc[issue.file] = (acc[issue.file] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
```

### Integration Examples

#### CI/CD Pipeline

```typescript
// ci-analysis.ts
import { analyzeWorkspace } from '@odavl/insight-sdk';

const result = await analyzeWorkspace(process.cwd(), {
  detectors: ['security', 'typescript', 'complexity'],
  severityMinimum: 'high'
});

// Fail pipeline if critical issues found
if (result.summary.critical > 0 || result.summary.high > 0) {
  console.error(`❌ Found ${result.summary.critical + result.summary.high} critical/high issues`);
  process.exit(1);
}

console.log('✅ No critical issues found');
process.exit(0);
```

#### Pre-commit Hook

```typescript
// pre-commit.ts
import { analyzeFiles } from '@odavl/insight-sdk';
import { execSync } from 'child_process';

// Get staged files
const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM')
  .toString()
  .split('\n')
  .filter(f => f.match(/\.(ts|tsx|js|jsx)$/))
  .map(f => path.resolve(f));

if (stagedFiles.length === 0) {
  process.exit(0);
}

const result = await analyzeFiles(stagedFiles, {
  severityMinimum: 'medium'
});

if (result.issues.length > 0) {
  console.error(`❌ Found ${result.issues.length} issues in staged files`);
  result.issues.forEach(issue => {
    console.error(`  ${issue.file}:${issue.line} - ${issue.message}`);
  });
  process.exit(1);
}

process.exit(0);
```

## Performance

- **Workspace caching** - Analyzed workspaces cached for speed
- **Parallel analysis** - Multiple files analyzed concurrently
- **Incremental support** - analyzeFiles() for targeted analysis
- **Timeout protection** - Configurable timeout prevents hanging

**Typical Performance:**
- Small project (10-50 files): 2-5 seconds
- Medium project (100-500 files): 10-30 seconds
- Large project (1000+ files): 1-3 minutes

## Error Handling

```typescript
try {
  const result = await analyzeWorkspace('/path/to/project');
} catch (error) {
  if (error.message.includes('timeout')) {
    console.error('Analysis timed out');
  } else if (error.message.includes('not found')) {
    console.error('Workspace not found');
  } else {
    console.error('Analysis failed:', error.message);
  }
}
```

## Requirements

- Node.js >= 18.18
- TypeScript >= 5.0 (for TypeScript projects)

## License

MIT © ODAVL Studio

## Links

- [GitHub Repository](https://github.com/odavlstudio/odavl)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=odavl.odavl-insight-vscode)
- [CLI Tool](https://www.npmjs.com/package/@odavl/cli)
- [Documentation](https://odavl.studio/docs)
