# 🔧 Guardian v5.0 - API Documentation

**Complete programmatic API for Guardian v5.0**

Use Guardian in your Node.js apps, CI/CD pipelines, and custom tooling.

---

## 📚 Table of Contents

1. [Installation](#installation)
2. [Core API](#core-api)
3. [Project Detection](#project-detection)
4. [Testing Projects](#testing-projects)
5. [Monorepo Support](#monorepo-support)
6. [TypeScript Types](#typescript-types)
7. [Examples](#examples)
8. [Best Practices](#best-practices)

---

<a name="core-interfaces"></a>
## 📋 Core Interfaces

### InspectionIssue

Represents a single issue found during inspection.

```typescript
interface InspectionIssue {
  /** Unique identifier for the issue */
  id: string;
  
  /** Severity level affects readiness score calculation */
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  /** Category helps group related issues */
  category: 'build' | 'config' | 'activation' | 'ui' | 'metadata';
  
  /** Human-readable description */
  message: string;
  
  /** Optional file path where issue was found */
  file?: string;
  
  /** Whether this issue can be fixed automatically */
  autoFixable: boolean;
  
  /** Optional fix description or code */
  fix?: string;
  
  /** Impact explanation for user understanding */
  impact: string;
}
```

**Example:**
```typescript
const issue: InspectionIssue = {
  id: 'missing-icon',
  severity: 'high',
  category: 'metadata',
  message: 'Extension icon is missing',
  file: 'package.json',
  autoFixable: true,
  fix: 'Add "icon": "icon.png" to package.json',
  impact: 'Extension will not display properly in VS Code marketplace'
};
```

---

### InspectionReport

Complete validation report for a product.

```typescript
interface InspectionReport {
  /** Unique product identifier */
  productId: string;
  
  /** Human-readable product name */
  productName: string;
  
  /** Auto-detected or specified product type */
  productType: 'vscode-extension' | 'nextjs-app' | 'nodejs-server' | 
                'cli-app' | 'npm-package' | 'cloud-function' | 'ide-extension';
  
  /** Readiness score (0-100) */
  readinessScore: number;
  
  /** Overall status based on score */
  status: 'ready' | 'blocked' | 'unstable';
  
  /** Array of all issues found */
  issues: InspectionIssue[];
  
  /** Optional timestamp */
  timestamp?: string;
  
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}
```

**Status Determination:**
- `ready` (90-100%): Production-ready ✅
- `unstable` (70-89%): Has issues but deployable ⚠️
- `blocked` (0-69%): Critical issues, not deployable ❌

---

<a name="base-inspector"></a>
## 🔍 BaseInspector Class

Abstract base class for all inspectors.

### Class Definition

```typescript
abstract class BaseInspector {
  /**
   * Main inspection method - must be implemented by subclasses
   * @param productPath Absolute path to product directory
   * @returns Promise resolving to inspection report
   */
  abstract inspect(productPath: string): Promise<InspectionReport>;
  
  /**
   * Calculate readiness score based on issues
   * @param issues Array of inspection issues
   * @returns Score from 0-100
   */
  protected calculateReadiness(issues: InspectionIssue[]): number;
  
  /**
   * Determine status based on readiness score
   * @param score Readiness score (0-100)
   * @returns Status level
   */
  protected determineStatus(score: number): 'ready' | 'blocked' | 'unstable';
  
  /**
   * Helper: Check if file exists
   * @param filePath Path relative to product directory
   * @returns Boolean indicating existence
   */
  protected fileExists(productPath: string, filePath: string): boolean;
  
  /**
   * Helper: Read and parse JSON file
   * @param filePath Path to JSON file
   * @returns Parsed JSON object or null
   */
  protected readJson<T>(filePath: string): T | null;
  
  /**
   * Helper: Read package.json
   * @param productPath Product directory path
   * @returns Package.json object or null
   */
  protected readPackageJson(productPath: string): PackageJson | null;
}
```

### Readiness Calculation

```typescript
protected calculateReadiness(issues: InspectionIssue[]): number {
  let score = 100;
  
  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical':
        score -= 25; // Major impact
        break;
      case 'high':
        score -= 10;
        break;
      case 'medium':
        score -= 5;
        break;
      case 'low':
        score -= 2;
        break;
    }
  }
  
  return Math.max(0, score);
}
```

### Status Determination

```typescript
protected determineStatus(score: number): 'ready' | 'blocked' | 'unstable' {
  if (score >= 90) return 'ready';
  if (score >= 70) return 'unstable';
  return 'blocked';
}
```

---

<a name="custom-inspectors"></a>
## 🎨 Custom Inspectors

### Step 1: Extend BaseInspector

```typescript
import { BaseInspector, InspectionReport, InspectionIssue } from '@odavl-studio/guardian-core';
import * as fs from 'node:fs';
import * as path from 'node:path';

export class MyCustomInspector extends BaseInspector {
  async inspect(productPath: string): Promise<InspectionReport> {
    const issues: InspectionIssue[] = [];
    
    // Step 1: Read package.json
    const pkg = this.readPackageJson(productPath);
    if (!pkg) {
      issues.push({
        id: 'missing-package-json',
        severity: 'critical',
        category: 'config',
        message: 'package.json not found',
        autoFixable: false,
        impact: 'Cannot determine project dependencies'
      });
    }
    
    // Step 2: Check specific files
    if (!this.fileExists(productPath, 'README.md')) {
      issues.push({
        id: 'missing-readme',
        severity: 'high',
        category: 'metadata',
        message: 'README.md is missing',
        autoFixable: true,
        fix: 'Create basic README.md with project description',
        impact: 'Users will not know how to use the project'
      });
    }
    
    // Step 3: Validate configuration
    const configPath = path.join(productPath, 'config.json');
    if (this.fileExists(productPath, 'config.json')) {
      const config = this.readJson<MyConfig>(configPath);
      if (!config || !config.requiredField) {
        issues.push({
          id: 'invalid-config',
          severity: 'critical',
          category: 'config',
          message: 'config.json is missing required fields',
          autoFixable: false,
          impact: 'Application will crash on startup'
        });
      }
    }
    
    // Step 4: Calculate results
    const readinessScore = this.calculateReadiness(issues);
    const status = this.determineStatus(readinessScore);
    
    return {
      productId: path.basename(productPath),
      productName: pkg?.name || 'Unknown',
      productType: 'custom',
      readinessScore,
      status,
      issues,
      timestamp: new Date().toISOString()
    };
  }
}
```

### Step 2: Register Inspector

```typescript
import { LaunchValidator } from '@odavl-studio/guardian-core';

const validator = new LaunchValidator();
validator.registerInspector('my-custom-type', new MyCustomInspector());

// Use it
const report = await validator.validateProduct('my-custom-type', './my-product');
```

---

### Real Example: Docker Image Inspector

```typescript
import { BaseInspector, InspectionReport } from '@odavl-studio/guardian-core';
import * as fs from 'node:fs';
import * as path from 'node:path';

export class DockerImageInspector extends BaseInspector {
  async inspect(productPath: string): Promise<InspectionReport> {
    const issues = [];
    const dockerfilePath = path.join(productPath, 'Dockerfile');
    
    // Check 1: Dockerfile exists
    if (!fs.existsSync(dockerfilePath)) {
      issues.push({
        id: 'missing-dockerfile',
        severity: 'critical',
        category: 'build',
        message: 'Dockerfile not found',
        autoFixable: false,
        impact: 'Cannot build Docker image'
      });
      
      // Early return if no Dockerfile
      return {
        productId: path.basename(productPath),
        productName: 'Docker Image',
        productType: 'docker-image',
        readinessScore: 0,
        status: 'blocked',
        issues
      };
    }
    
    // Check 2: Read Dockerfile content
    const dockerfile = fs.readFileSync(dockerfilePath, 'utf-8');
    
    // Check 3: FROM instruction
    if (!dockerfile.includes('FROM ')) {
      issues.push({
        id: 'missing-from',
        severity: 'critical',
        category: 'build',
        message: 'Dockerfile missing FROM instruction',
        autoFixable: false,
        impact: 'Docker build will fail'
      });
    }
    
    // Check 4: Multi-stage builds
    const fromCount = (dockerfile.match(/FROM /g) || []).length;
    if (fromCount === 1) {
      issues.push({
        id: 'no-multistage',
        severity: 'medium',
        category: 'build',
        message: 'Consider using multi-stage builds for smaller images',
        autoFixable: false,
        impact: 'Larger image size, slower deployments'
      });
    }
    
    // Check 5: HEALTHCHECK
    if (!dockerfile.includes('HEALTHCHECK')) {
      issues.push({
        id: 'missing-healthcheck',
        severity: 'high',
        category: 'config',
        message: 'Missing HEALTHCHECK instruction',
        autoFixable: true,
        fix: 'Add: HEALTHCHECK CMD curl --fail http://localhost:PORT/health || exit 1',
        impact: 'Container orchestrators cannot monitor health'
      });
    }
    
    // Check 6: USER instruction (security)
    if (!dockerfile.includes('USER ')) {
      issues.push({
        id: 'runs-as-root',
        severity: 'high',
        category: 'config',
        message: 'Container runs as root user (security risk)',
        autoFixable: true,
        fix: 'Add: USER node (or appropriate non-root user)',
        impact: 'Security vulnerability if container is compromised'
      });
    }
    
    // Check 7: .dockerignore
    if (!this.fileExists(productPath, '.dockerignore')) {
      issues.push({
        id: 'missing-dockerignore',
        severity: 'medium',
        category: 'build',
        message: '.dockerignore file not found',
        autoFixable: true,
        fix: 'Create .dockerignore with node_modules, .git, etc.',
        impact: 'Slower builds, larger context size'
      });
    }
    
    return {
      productId: path.basename(productPath),
      productName: 'Docker Image',
      productType: 'docker-image',
      readinessScore: this.calculateReadiness(issues),
      status: this.determineStatus(this.calculateReadiness(issues)),
      issues
    };
  }
}
```

---

<a name="custom-fixers"></a>
## 🔧 Custom Fixers

### BaseFixer Interface

```typescript
interface FixResult {
  success: boolean;
  fixedCount: number;
  errors: string[];
  message: string;
}

abstract class BaseFixer {
  /**
   * Apply fixes for given issues
   * @param productPath Product directory path
   * @param issues Array of issues to fix
   * @returns Fix result summary
   */
  abstract fix(productPath: string, issues: InspectionIssue[]): Promise<FixResult>;
  
  /**
   * Create backup before modifying files
   * @param filePath Path to file
   */
  protected createBackup(filePath: string): void;
  
  /**
   * Restore from backup if fix fails
   * @param filePath Path to file
   */
  protected restoreBackup(filePath: string): void;
}
```

### Example: Docker Fixer

```typescript
import { BaseFixer, FixResult, InspectionIssue } from '@odavl-studio/guardian-core';
import * as fs from 'node:fs';
import * as path from 'node:path';

export class DockerFixer extends BaseFixer {
  async fix(productPath: string, issues: InspectionIssue[]): Promise<FixResult> {
    let fixedCount = 0;
    const errors: string[] = [];
    
    for (const issue of issues) {
      if (!issue.autoFixable) continue;
      
      try {
        switch (issue.id) {
          case 'missing-healthcheck':
            await this.addHealthCheck(productPath);
            fixedCount++;
            break;
            
          case 'runs-as-root':
            await this.addUserInstruction(productPath);
            fixedCount++;
            break;
            
          case 'missing-dockerignore':
            await this.createDockerIgnore(productPath);
            fixedCount++;
            break;
            
          default:
            errors.push(`Unknown issue ID: ${issue.id}`);
        }
      } catch (error) {
        errors.push(`Failed to fix ${issue.id}: ${error.message}`);
      }
    }
    
    return {
      success: fixedCount > 0,
      fixedCount,
      errors,
      message: `Fixed ${fixedCount} issue(s)`
    };
  }
  
  private async addHealthCheck(productPath: string): Promise<void> {
    const dockerfilePath = path.join(productPath, 'Dockerfile');
    
    // Create backup
    this.createBackup(dockerfilePath);
    
    try {
      let content = fs.readFileSync(dockerfilePath, 'utf-8');
      
      // Find EXPOSE instruction to determine port
      const exposeMatch = content.match(/EXPOSE\s+(\d+)/);
      const port = exposeMatch ? exposeMatch[1] : '3000';
      
      // Add HEALTHCHECK before CMD
      const healthcheck = `\n# Health check\nHEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\\n  CMD curl --fail http://localhost:${port}/health || exit 1\n`;
      
      content = content.replace(/CMD/, `${healthcheck}CMD`);
      
      fs.writeFileSync(dockerfilePath, content, 'utf-8');
    } catch (error) {
      // Restore backup on failure
      this.restoreBackup(dockerfilePath);
      throw error;
    }
  }
  
  private async addUserInstruction(productPath: string): Promise<void> {
    const dockerfilePath = path.join(productPath, 'Dockerfile');
    
    this.createBackup(dockerfilePath);
    
    try {
      let content = fs.readFileSync(dockerfilePath, 'utf-8');
      
      // Add USER instruction before CMD
      const userInstruction = `\n# Run as non-root user\nUSER node\n`;
      
      content = content.replace(/CMD/, `${userInstruction}CMD`);
      
      fs.writeFileSync(dockerfilePath, content, 'utf-8');
    } catch (error) {
      this.restoreBackup(dockerfilePath);
      throw error;
    }
  }
  
  private async createDockerIgnore(productPath: string): Promise<void> {
    const dockerignorePath = path.join(productPath, '.dockerignore');
    
    const template = `# Dependencies
node_modules/
npm-debug.log
yarn-error.log
pnpm-debug.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
coverage/
.nyc_output/

# Build
dist/
build/
.next/
out/

# Git
.git/
.gitignore

# Environment
.env
.env.local
.env.*.local

# OS
.DS_Store
Thumbs.db

# Misc
*.log
*.tmp
`;
    
    fs.writeFileSync(dockerignorePath, template, 'utf-8');
  }
}
```

---

<a name="launch-validator"></a>
## 🎯 LaunchValidator API

Main class for product validation.

### Class Definition

```typescript
class LaunchValidator {
  /**
   * Validate single product with auto-detected or specified type
   * @param productType Product type or 'auto' for detection
   * @param productPath Absolute path to product
   * @returns Inspection report
   */
  async validateProduct(
    productType: ProductType | 'auto',
    productPath: string
  ): Promise<InspectionReport>;
  
  /**
   * Validate all products in workspace
   * @param workspaceRoot Workspace root directory
   * @returns Array of inspection reports
   */
  async validateAllProducts(workspaceRoot: string): Promise<InspectionReport[]>;
  
  /**
   * Register custom inspector for product type
   * @param productType Type identifier
   * @param inspector Inspector instance
   */
  registerInspector(productType: string, inspector: BaseInspector): void;
  
  /**
   * Auto-detect product type from directory structure
   * @param productPath Product directory path
   * @returns Detected product type or null
   */
  detectProductType(productPath: string): ProductType | null;
}
```

### Usage Examples

#### Validate Single Product

```typescript
import { LaunchValidator } from '@odavl-studio/guardian-core';

const validator = new LaunchValidator();

// Auto-detect type
const report = await validator.validateProduct('auto', './my-project');

// Or specify type
const report = await validator.validateProduct('nextjs-app', './my-nextjs-app');

console.log(`Readiness: ${report.readinessScore}%`);
console.log(`Status: ${report.status}`);
```

#### Validate Workspace

```typescript
const validator = new LaunchValidator();
const reports = await validator.validateAllProducts(process.cwd());

// Filter by status
const blockedProducts = reports.filter(r => r.status === 'blocked');
const readyProducts = reports.filter(r => r.status === 'ready');

console.log(`Ready: ${readyProducts.length}/${reports.length}`);
console.log(`Blocked: ${blockedProducts.length}/${reports.length}`);
```

#### Custom Inspector

```typescript
import { MyCustomInspector } from './my-inspector';

const validator = new LaunchValidator();
validator.registerInspector('my-type', new MyCustomInspector());

const report = await validator.validateProduct('my-type', './my-product');
```

---

<a name="examples"></a>
## 📖 Complete Examples

### Example 1: Validate and Fix

```typescript
import { LaunchValidator } from '@odavl-studio/guardian-core';
import { ExtensionFixer } from '@odavl-studio/guardian-core/fixers';

async function validateAndFix(productPath: string) {
  const validator = new LaunchValidator();
  
  // Step 1: Validate
  console.log('🔍 Validating...');
  const report = await validator.validateProduct('auto', productPath);
  
  console.log(`Readiness: ${report.readinessScore}%`);
  console.log(`Status: ${report.status}`);
  console.log(`Issues: ${report.issues.length}`);
  
  // Step 2: Filter auto-fixable
  const fixableIssues = report.issues.filter(i => i.autoFixable);
  
  if (fixableIssues.length === 0) {
    console.log('✅ No auto-fixable issues');
    return;
  }
  
  // Step 3: Apply fixes
  console.log(`🔧 Fixing ${fixableIssues.length} issues...`);
  const fixer = new ExtensionFixer();
  const result = await fixer.fix(productPath, fixableIssues);
  
  if (result.success) {
    console.log(`✅ Fixed ${result.fixedCount} issues`);
    
    // Step 4: Re-validate
    const newReport = await validator.validateProduct('auto', productPath);
    console.log(`📊 New readiness: ${newReport.readinessScore}%`);
  } else {
    console.error('❌ Fix failed:', result.errors);
  }
}
```

### Example 2: CI/CD Integration

```typescript
import { LaunchValidator } from '@odavl-studio/guardian-core';

async function cicdCheck() {
  const validator = new LaunchValidator();
  const reports = await validator.validateAllProducts(process.cwd());
  
  // Calculate statistics
  const totalProducts = reports.length;
  const readyProducts = reports.filter(r => r.status === 'ready').length;
  const avgReadiness = reports.reduce((sum, r) => sum + r.readinessScore, 0) / totalProducts;
  
  console.log(`\n📊 Validation Summary:`);
  console.log(`   Products: ${totalProducts}`);
  console.log(`   Ready: ${readyProducts} (${Math.round(readyProducts / totalProducts * 100)}%)`);
  console.log(`   Average Readiness: ${Math.round(avgReadiness)}%`);
  
  // Fail CI if average readiness < 80%
  if (avgReadiness < 80) {
    console.error('\n❌ CI FAILED: Average readiness below 80%');
    process.exit(1);
  }
  
  // Fail CI if any product is blocked
  const blockedProducts = reports.filter(r => r.status === 'blocked');
  if (blockedProducts.length > 0) {
    console.error(`\n❌ CI FAILED: ${blockedProducts.length} blocked products:`);
    blockedProducts.forEach(r => {
      console.error(`   - ${r.productName} (${r.readinessScore}%)`);
    });
    process.exit(1);
  }
  
  console.log('\n✅ CI PASSED: All products ready!');
}
```

### Example 3: Webhook for GitHub Actions

```typescript
import { LaunchValidator } from '@odavl-studio/guardian-core';
import express from 'express';

const app = express();
app.use(express.json());

app.post('/webhook/validate', async (req, res) => {
  const { repository, branch } = req.body;
  
  try {
    // Clone repository (pseudo-code)
    const repoPath = await cloneRepo(repository, branch);
    
    // Validate
    const validator = new LaunchValidator();
    const reports = await validator.validateAllProducts(repoPath);
    
    // Send to GitHub as check
    await postGitHubCheck(repository, {
      status: reports.every(r => r.status === 'ready') ? 'success' : 'failure',
      summary: `Validated ${reports.length} products`,
      details: reports
    });
    
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Webhook server running on :3000'));
```

---

## 🎯 Best Practices

### 1. Always Handle Errors

```typescript
try {
  const report = await validator.validateProduct('auto', path);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('Path does not exist');
  } else if (error.message.includes('package.json')) {
    console.error('Invalid package.json');
  } else {
    console.error('Validation failed:', error.message);
  }
}
```

### 2. Use Type Guards

```typescript
function isCriticalIssue(issue: InspectionIssue): boolean {
  return issue.severity === 'critical';
}

const criticalIssues = report.issues.filter(isCriticalIssue);
```

### 3. Backup Before Fixing

```typescript
class SafeFixer extends BaseFixer {
  async fix(productPath: string, issues: InspectionIssue[]): Promise<FixResult> {
    // Always create backup
    const backupPath = `${productPath}.backup-${Date.now()}`;
    await fs.promises.cp(productPath, backupPath, { recursive: true });
    
    try {
      // Apply fixes
      const result = await this.applyFixes(productPath, issues);
      
      if (result.success) {
        // Clean up backup
        await fs.promises.rm(backupPath, { recursive: true });
      } else {
        // Restore from backup
        await fs.promises.rm(productPath, { recursive: true });
        await fs.promises.cp(backupPath, productPath, { recursive: true });
      }
      
      return result;
    } catch (error) {
      // Restore and rethrow
      await fs.promises.rm(productPath, { recursive: true });
      await fs.promises.cp(backupPath, productPath, { recursive: true });
      throw error;
    }
  }
}
```

---

## 📚 Type Definitions

```typescript
// Product Types
type ProductType = 
  | 'vscode-extension'
  | 'nextjs-app'
  | 'nodejs-server'
  | 'cli-app'
  | 'npm-package'
  | 'cloud-function'
  | 'ide-extension';

// Severity Levels
type Severity = 'critical' | 'high' | 'medium' | 'low';

// Issue Categories
type Category = 'build' | 'config' | 'activation' | 'ui' | 'metadata';

// Status Levels
type Status = 'ready' | 'blocked' | 'unstable';

// Package.json
interface PackageJson {
  name: string;
  version: string;
  description?: string;
  main?: string;
  module?: string;
  types?: string;
  exports?: Record<string, unknown>;
  bin?: string | Record<string, string>;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}
```

---

**API Documentation Complete! 🎉**

For more examples, see the [Examples Directory](../examples/) or [GitHub Discussions](https://github.com/odavlstudio/odavl/discussions).
