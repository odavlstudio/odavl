# ODAVL Studio - Development Best Practices

## 1. Code Quality Standards

### 1.1 TypeScript Best Practices

**Strict Mode Configuration**

```json
// tsconfig.json - Use strict settings
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Type Safety Rules**

```typescript
// ✅ GOOD: Explicit types for public APIs
export function analyzeFile(path: string): Promise<Issue[]> {
  // ...
}

// ❌ BAD: Any types
export function analyzeFile(path: any): Promise<any> {
  // ...
}

// ✅ GOOD: Union types for known values
type Severity = 'critical' | 'high' | 'medium' | 'low';

// ❌ BAD: String without constraints
type Severity = string;

// ✅ GOOD: Interfaces for complex objects
interface DetectorConfig {
  enabled: boolean;
  severity: Severity;
  rules?: string[];
}

// ❌ BAD: Object literals everywhere
function configure(config: { enabled: boolean; severity: string }) {
  // ...
}
```

**Null Safety**

```typescript
// ✅ GOOD: Handle undefined/null explicitly
function getUser(id: string): User | null {
  const user = database.find(id);
  return user ?? null;
}

// Usage
const user = getUser('123');
if (user) {
  console.log(user.name); // Safe
}

// ✅ GOOD: Use optional chaining
const username = user?.profile?.name ?? 'Anonymous';

// ❌ BAD: Assume values exist
const username = user.profile.name; // Can crash
```

---

### 1.2 ESLint Configuration

**Recommended Rules**

```javascript
// eslint.config.mjs
export default [
  {
    rules: {
      // Error Prevention
      'no-console': 'error', // Use Logger instead
      'no-debugger': 'error',
      'no-unreachable': 'error',
      
      // TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_' 
      }],
      
      // Best Practices
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      
      // Async
      'require-await': 'error',
      'no-return-await': 'error'
    }
  }
];
```

---

### 1.3 Naming Conventions

```typescript
// ✅ Files: kebab-case
// detector-manager.ts
// user-repository.ts

// ✅ Classes: PascalCase
class TypeScriptDetector implements IDetector {
  // ✅ Private fields: camelCase with _ prefix
  private _cache: Map<string, Issue[]>;
  
  // ✅ Methods: camelCase
  async analyzeFile(path: string): Promise<Issue[]> {
    // ...
  }
}

// ✅ Interfaces: PascalCase with I prefix
interface IDetector {
  name: string;
  analyze(workspace: string): Promise<Issue[]>;
}

// ✅ Types: PascalCase
type DetectorResult = {
  issues: Issue[];
  duration: number;
};

// ✅ Constants: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_TIMEOUT = 30000; // 30s

// ✅ Enums: PascalCase
enum Severity {
  Critical = 'critical',
  High = 'high',
  Medium = 'medium',
  Low = 'low'
}
```

---

## 2. Testing Best Practices

### 2.1 Test Structure

**AAA Pattern (Arrange-Act-Assert)**

```typescript
describe('TypeScriptDetector', () => {
  it('detects type errors', async () => {
    // Arrange: Setup test data
    const workspace = createTempWorkspace({
      'src/index.ts': 'const x: string = 123;'
    });
    const detector = new TypeScriptDetector();
    
    // Act: Execute the code under test
    const issues = await detector.analyze(workspace);
    
    // Assert: Verify results
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe('TS2322');
    expect(issues[0].severity).toBe('high');
  });
});
```

**Test File Organization**

```
tests/
├── unit/              # Fast, isolated tests
│   ├── detectors/
│   ├── utils/
│   └── core/
├── integration/       # Multi-component tests
│   ├── autopilot/
│   └── insight/
├── e2e/              # Full workflow tests
│   ├── extension.test.ts
│   └── cli.test.ts
└── fixtures/         # Reusable test data
    ├── sample-projects/
    └── mock-data/
```

---

### 2.2 Mocking Best Practices

```typescript
// ✅ GOOD: Mock external dependencies
import { vi } from 'vitest';

const fsMock = {
  readFile: vi.fn(),
  writeFile: vi.fn()
};

beforeEach(() => {
  fsMock.readFile.mockResolvedValue('file content');
});

// ✅ GOOD: Test isolation
afterEach(() => {
  vi.clearAllMocks();
});

// ❌ BAD: Don't mock what you're testing
// If testing TypeScriptDetector, don't mock TypeScript compiler
```

**Spy Pattern for Verification**

```typescript
it('calls saveMetrics after analysis', async () => {
  const saveSpy = vi.spyOn(metricsService, 'save');
  
  await analyzer.analyze(workspace);
  
  expect(saveSpy).toHaveBeenCalledWith(
    expect.objectContaining({ totalIssues: expect.any(Number) })
  );
});
```

---

### 2.3 Test Coverage Goals

```typescript
// Target coverage levels:
// - Statements: 80%+
// - Branches: 75%+
// - Functions: 85%+
// - Lines: 80%+

// Priority testing:
// 1. Critical paths (O-D-A-V-L cycle)
// 2. Error handling
// 3. Edge cases
// 4. Public APIs

// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 85,
        lines: 80
      }
    }
  }
});
```

---

## 3. Performance Best Practices

### 3.1 Async Operations

**Parallel Execution**

```typescript
// ✅ GOOD: Run independent operations in parallel
async function analyzeWorkspace(workspace: string) {
  const detectors = [
    new TypeScriptDetector(),
    new ESLintDetector(),
    new SecurityDetector()
  ];
  
  const results = await Promise.all(
    detectors.map(d => d.analyze(workspace))
  );
  
  return results.flat();
}

// ❌ BAD: Sequential execution
async function analyzeWorkspace(workspace: string) {
  const tsIssues = await tsDetector.analyze(workspace);
  const eslintIssues = await eslintDetector.analyze(workspace);
  const securityIssues = await securityDetector.analyze(workspace);
  
  return [...tsIssues, ...eslintIssues, ...securityIssues];
}
```

**Promise Error Handling**

```typescript
// ✅ GOOD: Handle errors gracefully
const results = await Promise.allSettled(
  detectors.map(d => d.analyze(workspace))
);

const issues = results
  .filter(r => r.status === 'fulfilled')
  .flatMap(r => r.value);

const errors = results
  .filter(r => r.status === 'rejected')
  .map(r => r.reason);

if (errors.length > 0) {
  console.warn('Some detectors failed:', errors);
}
```

---

### 3.2 Caching Strategies

**LRU Cache for Expensive Operations**

```typescript
import { LRUCache } from '@odavl/core';

const mlPredictionCache = new LRUCache<string, number>(1000);

async function predictSuccess(features: Features): Promise<number> {
  const cacheKey = JSON.stringify(features);
  
  const cached = mlPredictionCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }
  
  const prediction = await mlModel.predict(features);
  mlPredictionCache.set(cacheKey, prediction);
  
  return prediction;
}
```

**File-based Cache**

```typescript
// .odavl/cache/analysis-cache.json
interface AnalysisCache {
  [filePath: string]: {
    hash: string;
    issues: Issue[];
    timestamp: number;
  };
}

async function getCachedAnalysis(file: string): Promise<Issue[] | null> {
  const cache = await loadCache();
  const entry = cache[file];
  
  if (!entry) return null;
  
  const currentHash = await getFileHash(file);
  if (entry.hash !== currentHash) return null;
  
  // Cache hit
  return entry.issues;
}
```

---

### 3.3 Memory Management

```typescript
// ✅ GOOD: Stream large files
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

async function analyzeHugeFile(path: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  const stream = createReadStream(path);
  const reader = createInterface({ input: stream });
  
  let lineNumber = 0;
  for await (const line of reader) {
    lineNumber++;
    const lineIssues = analyzeLine(line, lineNumber);
    issues.push(...lineIssues);
  }
  
  return issues;
}

// ❌ BAD: Load entire file into memory
async function analyzeHugeFile(path: string): Promise<Issue[]> {
  const content = await fs.readFile(path, 'utf-8'); // Can OOM
  return analyzeContent(content);
}
```

---

## 4. Error Handling Best Practices

### 4.1 Custom Error Classes

```typescript
// packages/core/src/errors/index.ts
export class ODAVLError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ODAVLError';
  }
}

export class DetectorError extends ODAVLError {
  constructor(detector: string, message: string) {
    super(message, 'DETECTOR_ERROR', { detector });
    this.name = 'DetectorError';
  }
}

export class ConfigurationError extends ODAVLError {
  constructor(message: string, field?: string) {
    super(message, 'CONFIG_ERROR', { field });
    this.name = 'ConfigurationError';
  }
}
```

**Usage**

```typescript
// ✅ GOOD: Throw specific errors
if (!config.detectors || config.detectors.length === 0) {
  throw new ConfigurationError(
    'At least one detector must be enabled',
    'detectors'
  );
}

// ✅ GOOD: Catch and handle appropriately
try {
  await detector.analyze(workspace);
} catch (error) {
  if (error instanceof DetectorError) {
    console.warn(`Detector ${error.context.detector} failed: ${error.message}`);
    // Continue with other detectors
  } else {
    // Unknown error, rethrow
    throw error;
  }
}
```

---

### 4.2 Graceful Degradation

```typescript
// ✅ GOOD: Continue on non-critical failures
async function analyzeWithFallback(workspace: string): Promise<Issue[]> {
  const allIssues: Issue[] = [];
  
  // Try primary detector
  try {
    const issues = await primaryDetector.analyze(workspace);
    allIssues.push(...issues);
  } catch (error) {
    console.warn('Primary detector failed, using fallback');
    
    // Try fallback detector
    try {
      const issues = await fallbackDetector.analyze(workspace);
      allIssues.push(...issues);
    } catch (fallbackError) {
      console.error('Both detectors failed');
    }
  }
  
  return allIssues;
}
```

---

### 4.3 Logging Best Practices

```typescript
// packages/core/src/logger.ts
class Logger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  info(message: string, data?: any) {
    console.log(`[${this.context}] ${message}`, data);
  }
  
  error(message: string, error?: Error) {
    console.error(`[${this.context}] ${message}`, {
      message: error?.message,
      stack: error?.stack
    });
  }
  
  debug(message: string, data?: any) {
    if (process.env.DEBUG) {
      console.debug(`[${this.context}] ${message}`, data);
    }
  }
}

// Usage
const logger = new Logger('TypeScriptDetector');
logger.info('Starting analysis', { workspace });
logger.error('Analysis failed', error);
```

---

## 5. Git & Version Control

### 5.1 Commit Message Convention

**Format**: `<type>(<scope>): <subject>`

```bash
# Types:
feat:     New feature
fix:      Bug fix
docs:     Documentation only
style:    Code style (formatting, no logic change)
refactor: Code restructuring (no feature/fix)
perf:     Performance improvement
test:     Add/update tests
chore:    Build process, dependencies

# Examples:
git commit -m "feat(insight): add GraphQL detector"
git commit -m "fix(autopilot): prevent race condition in act phase"
git commit -m "docs: update SDK installation guide"
git commit -m "perf(detector): reduce analysis time by 40%"
git commit -m "test(cli): add integration tests for autopilot"
```

---

### 5.2 Branch Strategy

```bash
# Main branches:
main        # Production-ready code
develop     # Integration branch

# Feature branches:
feature/insight-graphql-detector
feature/autopilot-dry-run-mode

# Bugfix branches:
fix/typescript-detector-crash
fix/extension-activation-error

# Release branches:
release/v2.1.0

# Hotfix branches (from main):
hotfix/critical-security-patch
```

**Workflow**

```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# Work on feature
git add .
git commit -m "feat(scope): description"

# Keep updated with develop
git fetch origin develop
git rebase origin/develop

# Push and create PR
git push origin feature/my-feature
# Create PR: feature/my-feature → develop
```

---

### 5.3 Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh

# Run linting
pnpm lint

# Run type checking
pnpm typecheck

# Run tests
pnpm test

# Check for console.log
if git diff --cached | grep -E "console\.(log|debug)"; then
  echo "Error: Found console.log statements"
  exit 1
fi
```

---

## 6. Documentation Best Practices

### 6.1 Code Comments

```typescript
// ✅ GOOD: Explain WHY, not WHAT
// Use exponential backoff to avoid overwhelming the API
// during periods of high error rates
const delay = Math.min(1000 * 2 ** retryCount, 30000);

// ❌ BAD: Obvious comments
// Set delay to exponential value
const delay = Math.min(1000 * 2 ** retryCount, 30000);

// ✅ GOOD: Document complex algorithms
/**
 * Calculates trust score using Bayesian inference
 * 
 * Formula: (successes + α) / (total_runs + α + β)
 * where α=1, β=1 (uniform prior)
 * 
 * This prevents new recipes from having 100% or 0% trust
 * based on a single run.
 */
function calculateTrustScore(successes: number, failures: number): number {
  const alpha = 1;
  const beta = 1;
  return (successes + alpha) / (successes + failures + alpha + beta);
}
```

---

### 6.2 JSDoc for Public APIs

```typescript
/**
 * Analyzes a TypeScript workspace for type errors
 * 
 * @param workspace - Absolute path to workspace root
 * @param options - Analysis options
 * @returns Promise resolving to array of detected issues
 * 
 * @throws {ConfigurationError} If tsconfig.json is missing
 * @throws {DetectorError} If analysis fails
 * 
 * @example
 * ```typescript
 * const detector = new TypeScriptDetector();
 * const issues = await detector.analyze('/path/to/project', {
 *   strict: true
 * });
 * ```
 */
async analyze(
  workspace: string,
  options?: AnalysisOptions
): Promise<Issue[]> {
  // ...
}
```

---

### 6.3 README Structure

```markdown
# Package Name

Brief description (1-2 sentences)

## Installation

\`\`\`bash
pnpm add @odavl-studio/package-name
\`\`\`

## Quick Start

\`\`\`typescript
// Minimal working example
\`\`\`

## API Reference

### Class: ClassName

Brief description

#### Methods

##### method(param: Type): ReturnType

Description and usage

## Examples

### Example 1: Common Use Case

\`\`\`typescript
// Complete, runnable example
\`\`\`

## Configuration

Available options and defaults

## Troubleshooting

Common issues and solutions

## Contributing

Link to CONTRIBUTING.md

## License

MIT
```

---

## 7. CI/CD Best Practices

### 7.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint
        run: pnpm lint
      
      - name: Type check
        run: pnpm typecheck
      
      - name: Test
        run: pnpm test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

### 7.2 Release Process

```bash
# 1. Update version
pnpm changeset

# 2. Generate changelog
pnpm changeset version

# 3. Commit changes
git add .
git commit -m "chore: release v2.1.0"

# 4. Create tag
git tag -a v2.1.0 -m "Release v2.1.0"

# 5. Push
git push origin main --tags

# 6. Publish to npm (automated via GitHub Actions)
```

---

## 8. Security Best Practices

### 8.1 Dependency Management

```bash
# Regular security audits
pnpm audit

# Auto-fix vulnerabilities
pnpm audit --fix

# Check for outdated packages
pnpm outdated

# Use Snyk for continuous monitoring
snyk test
snyk monitor
```

---

### 8.2 Environment Variables

```typescript
// ✅ GOOD: Use environment variables for secrets
const apiKey = process.env.ODAVL_API_KEY;
if (!apiKey) {
  throw new ConfigurationError('ODAVL_API_KEY is required');
}

// ❌ BAD: Hardcoded secrets
const apiKey = 'sk_live_abc123'; // NEVER DO THIS

// ✅ GOOD: .env.example for documentation
# .env.example
ODAVL_API_KEY=your_api_key_here
DATABASE_URL=postgresql://localhost:5432/odavl
```

---

### 8.3 Input Validation

```typescript
// ✅ GOOD: Validate all user input
function analyzeFile(path: string): Promise<Issue[]> {
  // Prevent path traversal
  if (path.includes('..') || !path.startsWith(process.cwd())) {
    throw new SecurityError('Invalid file path');
  }
  
  // Validate file exists
  if (!fs.existsSync(path)) {
    throw new ConfigurationError(`File not found: ${path}`);
  }
  
  return analyzer.analyze(path);
}
```

---

## 9. Deployment Best Practices

### 9.1 Environment-Specific Configs

```typescript
// config/environments.ts
const environments = {
  development: {
    apiUrl: 'http://localhost:3000',
    debug: true,
    mlModel: 'model-dev.json'
  },
  production: {
    apiUrl: 'https://api.odavl.com',
    debug: false,
    mlModel: 'model-prod.json'
  }
};

export const config = environments[process.env.NODE_ENV || 'development'];
```

---

### 9.2 Health Checks

```typescript
// API endpoint: /api/health
export async function healthCheck() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    mlModel: await checkMLModel()
  };
  
  const healthy = Object.values(checks).every(c => c.status === 'ok');
  
  return {
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks
  };
}
```

---

## Summary Checklist

**Before Every Commit:**
- [ ] Code compiles (tsc --noEmit)
- [ ] Tests pass (pnpm test)
- [ ] Linting passes (pnpm lint)
- [ ] No console.log statements
- [ ] Types are explicit
- [ ] Error handling implemented

**Before Every PR:**
- [ ] All tests pass
- [ ] Coverage maintained/improved
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] No merge conflicts

**Before Every Release:**
- [ ] Version bumped
- [ ] CHANGELOG complete
- [ ] Tests pass (100%)
- [ ] Security audit clean
- [ ] Performance tested
- [ ] Documentation reviewed

---

**Version**: ODAVL Studio v2.0  
**Last Updated**: November 23, 2025  
**Word Count**: ~3,500 words
