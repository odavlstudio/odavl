# 🔧 Guardian v5.0 - API Documentation

**Complete programmatic API reference for Guardian v5.0**

Use Guardian in Node.js apps, CI/CD pipelines, custom tooling, and automation workflows.

---

## 📚 Table of Contents

1. [Installation](#installation)
2. [Core API](#core-api)
3. [Project Detection](#project-detection)
4. [Testing Projects](#testing-projects)
5. [Monorepo Support](#monorepo-support)
6. [TypeScript Types](#typescript-types)
7. [Examples](#examples)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)

---

<a name="installation"></a>
## 📦 Installation

### CLI (Global)

```bash
npm install -g @odavl-studio/guardian@5
```

### Programmatic API (Project)

```bash
npm install @odavl-studio/guardian@5
# or
pnpm add @odavl-studio/guardian@5
```

---

<a name="core-api"></a>
## 🎯 Core API

### Guardian Class

Main entry point for programmatic usage.

```typescript
import { Guardian } from '@odavl-studio/guardian';

const guardian = new Guardian(options);
```

#### Constructor Options

```typescript
interface GuardianOptions {
  /** Project path (defaults to cwd) */
  projectPath?: string;
  
  /** Override auto-detection */
  projectType?: 'website' | 'extension' | 'cli' | 'package' | 'monorepo';
  
  /** Custom configuration */
  config?: GuardianConfig;
  
  /** Verbose logging */
  verbose?: boolean;
}
```

#### Methods

##### `detect(): Promise<DetectionResult>`

Auto-detect project type and characteristics.

```typescript
const result = await guardian.detect();

console.log(result.type);        // 'website'
console.log(result.confidence);  // 95
console.log(result.framework);   // 'nextjs'
```

##### `test(type?: ProjectType): Promise<TestResults>`

Run tests based on detected or specified type.

```typescript
// Auto-detect and test
const results = await guardian.test();

// Or specify type
const results = await guardian.test('website');

console.log(results.score);       // 87
console.log(results.passed);      // 12
console.log(results.failed);      // 2
```

##### `analyze(): Promise<AnalysisReport>`

Deep analysis of project structure and dependencies.

```typescript
const report = await guardian.analyze();

console.log(report.languages);    // { typescript: 85%, javascript: 15% }
console.log(report.dependencies); // { react: '18.2.0', ... }
console.log(report.complexity);   // 'medium'
```

---

<a name="project-detection"></a>
## 🔍 Project Detection

### detectProject()

Standalone function for project detection.

```typescript
import { detectProject } from '@odavl-studio/guardian';

const result = await detectProject('./my-project');
```

#### DetectionResult Interface

```typescript
interface DetectionResult {
  /** Detected project type */
  type: 'website' | 'extension' | 'cli' | 'package' | 'monorepo' | 'unknown';
  
  /** Confidence score (0-100) */
  confidence: number;
  
  /** Detected framework */
  framework?: 'nextjs' | 'vite' | 'cra' | 'express' | 'fastify' | 'commander' | 'yargs';
  
  /** Detection strategies used */
  strategies: DetectionStrategy[];
  
  /** Project metadata */
  metadata: {
    name?: string;
    version?: string;
    packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun';
    hasWorkspace?: boolean;
  };
}
```

#### Detection Strategies

```typescript
type DetectionStrategy = 
  | 'framework-markers'    // next.config.js, vite.config.ts, etc.
  | 'package-analysis'     // package.json engines, bin, etc.
  | 'workspace-detection'  // pnpm-workspace.yaml, lerna.json
  | 'source-analysis'      // Shebang, imports, structure
  | 'dependency-analysis'; // Framework-specific dependencies
```

#### Example: Custom Detection

```typescript
import { detectProject, DetectionResult } from '@odavl-studio/guardian';

async function analyzeProject(path: string) {
  const result = await detectProject(path);
  
  if (result.type === 'unknown') {
    console.log('⚠️  Could not detect project type');
    console.log('Confidence:', result.confidence);
    console.log('Strategies used:', result.strategies);
    return;
  }
  
  console.log(`✅ Detected: ${result.type}`);
  console.log(`   Framework: ${result.framework || 'none'}`);
  console.log(`   Confidence: ${result.confidence}%`);
  
  if (result.confidence < 75) {
    console.log('⚠️  Low confidence. Consider manual override.');
  }
}
```

---

<a name="testing-projects"></a>
## 🧪 Testing Projects

### testProject()

Run tests based on project type.

```typescript
import { testProject, ProjectType } from '@odavl-studio/guardian';

const results = await testProject('./my-project', 'website');
```

#### TestResults Interface

```typescript
interface TestResults {
  /** Overall score (0-100) */
  score: number;
  
  /** Test status */
  status: 'pass' | 'fail' | 'warning';
  
  /** Number of passed tests */
  passed: number;
  
  /** Number of failed tests */
  failed: number;
  
  /** Total tests run */
  total: number;
  
  /** Test categories */
  categories: TestCategory[];
  
  /** Execution time (ms) */
  duration: number;
  
  /** Report path */
  reportPath: string;
}
```

#### TestCategory Interface

```typescript
interface TestCategory {
  /** Category name */
  name: string;
  
  /** Category score (0-100) */
  score: number;
  
  /** Category status */
  status: 'pass' | 'fail' | 'warning';
  
  /** Individual tests */
  tests: Test[];
}

interface Test {
  /** Test name */
  name: string;
  
  /** Test status */
  status: 'pass' | 'fail' | 'skip';
  
  /** Optional message */
  message?: string;
  
  /** Execution time (ms) */
  duration: number;
  
  /** Error details (if failed) */
  error?: {
    message: string;
    stack?: string;
  };
}
```

#### Example: Website Testing

```typescript
import { testProject } from '@odavl-studio/guardian';

async function testWebsite(url: string) {
  const results = await testProject('./', 'website');
  
  console.log(`\n📊 Overall Score: ${results.score}/100`);
  console.log(`   Status: ${results.status}`);
  console.log(`   Passed: ${results.passed}/${results.total}`);
  console.log(`   Duration: ${results.duration}ms`);
  
  // Breakdown by category
  console.log('\n📋 Category Breakdown:');
  for (const category of results.categories) {
    const icon = category.status === 'pass' ? '✅' : '❌';
    console.log(`${icon} ${category.name}: ${category.score}/100`);
    
    // Show failed tests
    const failedTests = category.tests.filter(t => t.status === 'fail');
    if (failedTests.length > 0) {
      failedTests.forEach(test => {
        console.log(`   ❌ ${test.name}: ${test.error?.message}`);
      });
    }
  }
  
  // Save report
  console.log(`\n📄 Report saved: ${results.reportPath}`);
}
```

#### Example: Custom Test Configuration

```typescript
import { Guardian } from '@odavl-studio/guardian';

const guardian = new Guardian({
  projectPath: './my-app',
  projectType: 'website',
  config: {
    testing: {
      skipPerformance: false,
      skipVisual: false,
      devices: ['mobile', 'tablet', 'desktop']
    },
    thresholds: {
      performance: {
        ttfb: 200,     // 200ms max
        lcp: 2500,     // 2.5s max
        fid: 100,      // 100ms max
        cls: 0.1       // 0.1 max
      },
      minScore: 85
    }
  }
});

const results = await guardian.test();

// Check if meets thresholds
if (results.score < 85) {
  console.error('❌ Failed minimum score threshold');
  process.exit(1);
}
```

---

<a name="monorepo-support"></a>
## 🏢 Monorepo Support

### detectMonorepo()

Detect and analyze monorepo structure.

```typescript
import { detectMonorepo } from '@odavl-studio/guardian';

const monorepo = await detectMonorepo('./my-monorepo');
```

#### MonorepoResult Interface

```typescript
interface MonorepoResult {
  /** Is this a monorepo? */
  isMonorepo: boolean;
  
  /** Monorepo type */
  type?: 'pnpm' | 'yarn' | 'lerna' | 'nx' | 'turborepo';
  
  /** Detected products/packages */
  products: ProductInfo[];
  
  /** Workspace root */
  root: string;
  
  /** Workspace configuration file */
  configFile?: string;
}

interface ProductInfo {
  /** Product name */
  name: string;
  
  /** Product path (relative to root) */
  path: string;
  
  /** Detected product type */
  type: 'website' | 'extension' | 'cli' | 'package';
  
  /** Detection confidence */
  confidence: number;
  
  /** Product version */
  version?: string;
  
  /** Dependencies */
  dependencies: string[];
}
```

### testMonorepo()

Test all products in monorepo.

```typescript
import { testMonorepo } from '@odavl-studio/guardian';

const results = await testMonorepo('./my-monorepo');
```

#### MonorepoTestResults Interface

```typescript
interface MonorepoTestResults {
  /** Suite score (0-100) */
  suiteScore: number;
  
  /** Suite status */
  status: 'pass' | 'fail' | 'warning';
  
  /** Per-product results */
  products: ProductTestResult[];
  
  /** Impact analysis */
  impact?: ImpactAnalysis;
  
  /** Total duration (ms) */
  duration: number;
}

interface ProductTestResult {
  /** Product name */
  name: string;
  
  /** Product type */
  type: string;
  
  /** Test results */
  results: TestResults;
}

interface ImpactAnalysis {
  /** Changed products */
  changed: string[];
  
  /** Affected products (dependents) */
  affected: string[];
  
  /** Dependency graph */
  graph: DependencyGraph;
}
```

#### Example: Monorepo Testing

```typescript
import { testMonorepo } from '@odavl-studio/guardian';

async function testSuite() {
  console.log('🔍 Detecting monorepo structure...');
  const results = await testMonorepo('./');
  
  console.log(`\n🏢 Suite Score: ${results.suiteScore}/100`);
  console.log(`   Status: ${results.status}`);
  console.log(`   Products: ${results.products.length}`);
  console.log(`   Duration: ${results.duration}ms`);
  
  // Per-product breakdown
  console.log('\n📦 Product Results:');
  for (const product of results.products) {
    const icon = product.results.status === 'pass' ? '✅' : '❌';
    console.log(`${icon} ${product.name} (${product.type}): ${product.results.score}/100`);
  }
  
  // Impact analysis
  if (results.impact) {
    console.log('\n🔗 Impact Analysis:');
    console.log(`   Changed: ${results.impact.changed.join(', ')}`);
    console.log(`   Affected: ${results.impact.affected.join(', ')}`);
  }
  
  // Fail CI if suite score < 90
  if (results.suiteScore < 90) {
    console.error('\n❌ Suite score below 90');
    process.exit(1);
  }
}
```

#### Example: Test Only Affected Products

```typescript
import { testMonorepo, detectChangedProducts } from '@odavl-studio/guardian';

async function testChanged() {
  // Detect changed products (from git)
  const changed = await detectChangedProducts('./');
  
  console.log(`📝 Changed products: ${changed.join(', ')}`);
  
  // Test only affected products
  const results = await testMonorepo('./', {
    only: changed,
    includeAffected: true  // Also test dependents
  });
  
  console.log(`\n🧪 Tested ${results.products.length} products`);
  console.log(`   Changed: ${changed.length}`);
  console.log(`   Affected: ${results.products.length - changed.length}`);
}
```

---

<a name="typescript-types"></a>
## 📘 TypeScript Types

### Core Types

```typescript
// Project Types
type ProjectType = 
  | 'website' 
  | 'extension' 
  | 'cli' 
  | 'package' 
  | 'monorepo' 
  | 'unknown';

// Test Status
type TestStatus = 'pass' | 'fail' | 'skip' | 'warning';

// Frameworks
type Framework = 
  | 'nextjs' 
  | 'vite' 
  | 'cra' 
  | 'express' 
  | 'fastify' 
  | 'commander' 
  | 'yargs';

// Monorepo Types
type MonorepoType = 'pnpm' | 'yarn' | 'lerna' | 'nx' | 'turborepo';

// Package Managers
type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';
```

### Configuration Types

```typescript
interface GuardianConfig {
  /** Project configuration */
  project?: {
    name?: string;
    type?: ProjectType;
  };
  
  /** Testing configuration */
  testing?: {
    skipPerformance?: boolean;
    skipVisual?: boolean;
    skipSecurity?: boolean;
    devices?: ('mobile' | 'tablet' | 'desktop')[];
  };
  
  /** Thresholds */
  thresholds?: {
    performance?: {
      ttfb?: number;
      fcp?: number;
      lcp?: number;
      fid?: number;
      cls?: number;
    };
    accessibility?: {
      minScore?: number;
    };
    minScore?: number;
  };
  
  /** Output configuration */
  output?: {
    format?: 'json' | 'html' | 'markdown';
    path?: string;
  };
}
```

---

<a name="examples"></a>
## 📖 Complete Examples

### Example 1: CI/CD Integration

```typescript
import { Guardian } from '@odavl-studio/guardian';

async function cicdValidation() {
  const guardian = new Guardian({
    projectPath: process.cwd(),
    verbose: true
  });
  
  // Step 1: Detect project
  console.log('🔍 Detecting project...');
  const detection = await guardian.detect();
  
  if (detection.type === 'unknown') {
    console.error('❌ Could not detect project type');
    process.exit(1);
  }
  
  console.log(`✅ Detected: ${detection.type} (${detection.confidence}% confidence)`);
  
  // Step 2: Run tests
  console.log('\n🧪 Running tests...');
  const results = await guardian.test();
  
  // Step 3: Check results
  console.log(`\n📊 Score: ${results.score}/100`);
  console.log(`   Passed: ${results.passed}/${results.total}`);
  console.log(`   Duration: ${results.duration}ms`);
  
  // Step 4: Fail if score < 85
  if (results.score < 85) {
    console.error('\n❌ CI FAILED: Score below 85');
    
    // Show failed tests
    const failed = results.categories
      .flatMap(c => c.tests)
      .filter(t => t.status === 'fail');
    
    console.log('\nFailed Tests:');
    failed.forEach(test => {
      console.log(`  ❌ ${test.name}: ${test.error?.message}`);
    });
    
    process.exit(1);
  }
  
  console.log('\n✅ CI PASSED');
}

cicdValidation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

### Example 2: Custom Test Runner

```typescript
import { Guardian, TestResults } from '@odavl-studio/guardian';

class CustomTestRunner {
  private guardian: Guardian;
  
  constructor(projectPath: string) {
    this.guardian = new Guardian({
      projectPath,
      verbose: false
    });
  }
  
  async runWithRetry(maxRetries: number = 3): Promise<TestResults> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`\n🔄 Attempt ${i + 1}/${maxRetries}`);
        
        const results = await this.guardian.test();
        
        if (results.status === 'pass') {
          console.log('✅ Tests passed');
          return results;
        }
        
        console.log(`⚠️  Tests failed (score: ${results.score})`);
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Test error: ${error.message}`);
      }
    }
    
    throw new Error(`Tests failed after ${maxRetries} attempts: ${lastError?.message}`);
  }
  
  async compareWithBaseline(baselinePath: string): Promise<ComparisonResult> {
    // Load baseline
    const baseline = JSON.parse(
      await fs.promises.readFile(baselinePath, 'utf-8')
    ) as TestResults;
    
    // Run current tests
    const current = await this.guardian.test();
    
    // Compare
    const scoreDiff = current.score - baseline.score;
    const regression = scoreDiff < -5; // 5+ point drop = regression
    
    return {
      baseline: baseline.score,
      current: current.score,
      diff: scoreDiff,
      regression,
      details: this.compareCategories(baseline, current)
    };
  }
  
  private compareCategories(baseline: TestResults, current: TestResults) {
    // Implementation details...
    return [];
  }
}

// Usage
const runner = new CustomTestRunner('./my-app');

// With retry
const results = await runner.runWithRetry(3);

// Compare with baseline
const comparison = await runner.compareWithBaseline('./baseline.json');
if (comparison.regression) {
  console.error('❌ Performance regression detected');
  process.exit(1);
}
```

### Example 3: Multi-Project Testing

```typescript
import { Guardian } from '@odavl-studio/guardian';
import * as path from 'path';

interface ProjectConfig {
  name: string;
  path: string;
  minScore: number;
}

async function testMultipleProjects(projects: ProjectConfig[]) {
  console.log(`🧪 Testing ${projects.length} projects...\n`);
  
  const results = [];
  
  for (const project of projects) {
    console.log(`\n📦 Testing ${project.name}...`);
    
    const guardian = new Guardian({
      projectPath: project.path,
      verbose: false
    });
    
    try {
      const testResults = await guardian.test();
      
      const passed = testResults.score >= project.minScore;
      const icon = passed ? '✅' : '❌';
      
      console.log(`${icon} ${project.name}: ${testResults.score}/100`);
      
      results.push({
        name: project.name,
        score: testResults.score,
        passed,
        minScore: project.minScore
      });
      
    } catch (error) {
      console.error(`❌ ${project.name}: Test error`);
      console.error(error.message);
      
      results.push({
        name: project.name,
        score: 0,
        passed: false,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n\n📊 Summary:');
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  
  console.log(`   Total: ${results.length}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  
  // Fail if any project failed
  if (failed > 0) {
    console.error('\n❌ Some projects failed minimum score');
    process.exit(1);
  }
  
  console.log('\n✅ All projects passed!');
}

// Usage
testMultipleProjects([
  { name: 'Website', path: './apps/website', minScore: 90 },
  { name: 'API', path: './apps/api', minScore: 85 },
  { name: 'CLI', path: './packages/cli', minScore: 80 }
]).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

### Example 4: GitHub Actions Integration

```typescript
// ci/guardian-check.ts
import { Guardian } from '@odavl-studio/guardian';
import * as core from '@actions/core';
import * as github from '@actions/github';

async function githubCheck() {
  try {
    // Get inputs
    const minScore = parseInt(core.getInput('min-score') || '85');
    const projectPath = core.getInput('project-path') || '.';
    
    // Run Guardian
    const guardian = new Guardian({ projectPath });
    const results = await guardian.test();
    
    // Set outputs
    core.setOutput('score', results.score);
    core.setOutput('status', results.status);
    core.setOutput('report-path', results.reportPath);
    
    // Create summary
    core.summary
      .addHeading('Guardian Test Results')
      .addTable([
        [{ data: 'Metric', header: true }, { data: 'Value', header: true }],
        ['Score', `${results.score}/100`],
        ['Status', results.status],
        ['Passed', `${results.passed}`],
        ['Failed', `${results.failed}`],
        ['Duration', `${results.duration}ms`]
      ])
      .write();
    
    // Check minimum score
    if (results.score < minScore) {
      core.setFailed(`Score ${results.score} below minimum ${minScore}`);
    }
    
  } catch (error) {
    core.setFailed(error.message);
  }
}

githubCheck();
```

**GitHub Actions workflow:**

```yaml
name: Guardian Check
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Guardian
        run: npx tsx ci/guardian-check.ts
        env:
          MIN_SCORE: 85
          PROJECT_PATH: .
      
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: guardian-report
          path: .guardian/reports/latest.json
```

---

<a name="error-handling"></a>
## 🚨 Error Handling

### Error Types

```typescript
class GuardianError extends Error {
  code: string;
  details?: unknown;
}

class DetectionError extends GuardianError {
  code: 'DETECTION_FAILED';
}

class TestError extends GuardianError {
  code: 'TEST_FAILED';
}

class ConfigError extends GuardianError {
  code: 'INVALID_CONFIG';
}
```

### Best Practices

```typescript
import { Guardian, GuardianError } from '@odavl-studio/guardian';

async function safeTest(projectPath: string) {
  const guardian = new Guardian({ projectPath });
  
  try {
    const results = await guardian.test();
    return results;
    
  } catch (error) {
    if (error instanceof GuardianError) {
      switch (error.code) {
        case 'DETECTION_FAILED':
          console.error('Could not detect project type');
          console.error('Try specifying type manually');
          break;
          
        case 'TEST_FAILED':
          console.error('Tests encountered errors');
          console.error('Details:', error.details);
          break;
          
        case 'INVALID_CONFIG':
          console.error('Configuration is invalid');
          console.error('Check guardian.config.json');
          break;
          
        default:
          console.error('Unknown error:', error.message);
      }
    } else {
      // Unexpected error
      console.error('Fatal error:', error);
      throw error;
    }
  }
}
```

---

<a name="best-practices"></a>
## 💡 Best Practices

### 1. Always Handle Detection Failures

```typescript
const detection = await guardian.detect();

if (detection.type === 'unknown' || detection.confidence < 75) {
  // Fallback to manual specification
  const guardian = new Guardian({
    projectPath: './my-project',
    projectType: 'website'  // Manual override
  });
}
```

### 2. Use Configuration Files

```typescript
// guardian.config.json
{
  "project": {
    "type": "website"
  },
  "thresholds": {
    "minScore": 85
  }
}

// Load from file
const guardian = new Guardian({
  projectPath: './',
  config: require('./guardian.config.json')
});
```

### 3. Implement Retry Logic

```typescript
async function testWithRetry(guardian: Guardian, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await guardian.test();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

### 4. Cache Detection Results

```typescript
const cache = new Map<string, DetectionResult>();

async function cachedDetect(path: string) {
  if (cache.has(path)) {
    return cache.get(path)!;
  }
  
  const result = await detectProject(path);
  cache.set(path, result);
  return result;
}
```

### 5. Use TypeScript

```typescript
import { Guardian, TestResults, DetectionResult } from '@odavl-studio/guardian';

// Type-safe configuration
const config: GuardianConfig = {
  project: { type: 'website' },
  thresholds: { minScore: 85 }
};

// Type-safe results
const results: TestResults = await guardian.test();
console.log(results.score);  // TypeScript knows this is a number
```

---

## 📚 Additional Resources

- **User Guide**: Complete guide for CLI usage
- **Migration Guide**: Upgrade from v4.0 to v5.0
- **Examples**: More examples in `/examples` directory
- **Source Code**: https://github.com/odavl/odavl-studio/tree/main/odavl-studio/guardian

---

**API Documentation Complete! 🎉**

For questions or issues, see [GitHub Discussions](https://github.com/odavl/odavl-studio/discussions).
