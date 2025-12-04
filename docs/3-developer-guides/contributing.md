# Contributing to ODAVL Studio

Thank you for your interest in contributing to ODAVL Studio! This guide will help you get started with contributing to our autonomous code quality platform.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Code Review Process](#code-review-process)
- [Community](#community)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js**: v18+ (LTS recommended)
- **pnpm**: v8+ (package manager)
- **Git**: Latest version
- **VS Code**: Recommended for extension development
- **PostgreSQL**: For cloud dashboard development (optional)

### Quick Setup

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/odavl.git
cd odavl

# 3. Add upstream remote
git remote add upstream https://github.com/odavl/odavl.git

# 4. Install dependencies (using pnpm only!)
pnpm install

# 5. Build all packages
pnpm build

# 6. Run tests
pnpm test

# 7. Start development
pnpm dev
```

## Development Setup

### Monorepo Structure

ODAVL Studio uses **pnpm workspaces** with strict package management:

```
odavl/
├── odavl-studio/
│   ├── insight/          # ML-powered error detection
│   ├── autopilot/        # Self-healing engine
│   └── guardian/         # Pre-deploy testing
├── apps/
│   ├── studio-cli/       # Unified CLI
│   └── studio-hub/       # Marketing website
├── packages/
│   ├── sdk/              # Public SDK
│   ├── auth/             # Authentication
│   └── core/             # Shared utilities
└── tools/                # Build & automation scripts
```

### Environment Setup

Create `.env` file in relevant directories:

```bash
# For Insight Cloud (odavl-studio/insight/cloud/.env)
DATABASE_URL="postgresql://user:password@localhost:5432/odavl"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3001"

# For Guardian (odavl-studio/guardian/app/.env)
DATABASE_URL="postgresql://user:password@localhost:5432/odavl_guardian"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3002"
```

### VS Code Extensions

Install recommended extensions for the best development experience:

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Language support
- **Prisma**: Database schema editing
- **Vitest**: Test runner integration

## Project Structure

### Three Product Architecture

#### 1. ODAVL Insight - Error Detection

```
odavl-studio/insight/
├── core/                 # Shared engine (@odavl-studio/insight-core)
│   ├── src/
│   │   ├── detector/     # 12 specialized detectors
│   │   ├── ml/           # ML model training
│   │   └── index.ts      # Public API
│   └── package.json
├── cloud/                # Next.js dashboard (@odavl-studio/insight-cloud)
│   ├── app/              # App router pages
│   ├── prisma/           # Database schema
│   └── package.json
└── extension/            # VS Code extension
    ├── src/
    └── package.json
```

**Key Files:**
- `detector/typescript-detector.ts` - TypeScript error detection
- `detector/security-detector.ts` - Security vulnerability scanning
- `ml/model.ts` - ML model inference
- `training.ts` - Model retraining from history

#### 2. ODAVL Autopilot - Self-Healing

```
odavl-studio/autopilot/
├── engine/               # O-D-A-V-L cycle (@odavl-studio/autopilot-engine)
│   ├── src/
│   │   ├── phases/       # 5 execution phases
│   │   │   ├── observe.ts   # Metric collection
│   │   │   ├── decide.ts    # Recipe selection
│   │   │   ├── act.ts       # Safe file editing
│   │   │   ├── verify.ts    # Quality validation
│   │   │   └── learn.ts     # Trust score updates
│   │   └── index.ts
│   └── package.json
├── recipes/              # Improvement recipes
└── extension/            # VS Code monitoring
```

**Key Files:**
- `phases/act.ts` - Safe command execution with `sh()` wrapper
- `phases/verify.ts` - Quality gate enforcement
- `governance/risk-budget-guard.ts` - Safety constraints

#### 3. ODAVL Guardian - Quality Gates

```
odavl-studio/guardian/
├── app/                  # Testing dashboard (@odavl-studio/guardian-app)
│   ├── app/
│   └── package.json
├── workers/              # Background jobs (@odavl-studio/guardian-workers)
└── extension/            # VS Code integration
```

## Making Changes

### Branching Strategy

We follow **Git Flow** with protection for critical paths:

```bash
# Feature development
git checkout -b feature/add-new-detector

# Bug fixes
git checkout -b fix/typescript-detector-crash

# Documentation updates
git checkout -b docs/improve-getting-started

# Releases (maintainers only)
git checkout -b release/2.1.0
```

### Commit Convention

We use **Conventional Commits** for automated changelog generation:

```bash
# Format: <type>(<scope>): <subject>

# Examples:
feat(insight): add GraphQL error detector
fix(autopilot): prevent editing protected files
docs(sdk): update API reference for v2.1
test(guardian): add accessibility test suite
refactor(core): simplify error handling logic
perf(insight): reduce analysis time by 40%
chore(deps): upgrade TypeScript to 5.3
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `test`: Adding/updating tests
- `refactor`: Code restructuring (no behavior change)
- `perf`: Performance improvement
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Code Style

**TypeScript Standards:**

```typescript
// ✅ DO: Use strict typing
interface DetectorOptions {
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoFix: boolean;
  excludePaths?: string[];
}

// ❌ DON'T: Use 'any' type
function analyze(data: any) { ... }

// ✅ DO: Use proper null handling
const result = await detector.analyze(file);
if (!result) {
  logger.warn('Analysis returned no results');
  return [];
}

// ❌ DON'T: Ignore null/undefined
const errors = result.errors; // Could crash if result is null!

// ✅ DO: Use named exports
export { TypeScriptDetector, ESLintDetector };

// ❌ DON'T: Use default exports (breaks tree-shaking)
export default TypeScriptDetector;

// ✅ DO: Use async/await
async function runDetectors(): Promise<Issue[]> {
  const results = await Promise.all(
    detectors.map(d => d.analyze(workspace))
  );
  return results.flat();
}

// ❌ DON'T: Use callback patterns
function runDetectors(callback) { ... }
```

**ESLint Rules:**

```typescript
// Enforced by eslint.config.mjs
// - no-console: error (use Logger instead)
// - no-debugger: error
// - @typescript-eslint/no-explicit-any: warn
// - @typescript-eslint/no-unused-vars: warn (except _prefixed)
```

**File Organization:**

```typescript
// src/detector/new-detector.ts

// 1. Imports (grouped: external → internal → types)
import * as fs from 'node:fs/promises';
import { Parser } from 'external-lib';

import { Logger } from '../utils/logger';
import { BaseDetector } from './base-detector';

import type { Issue, DetectorOptions } from '../types';

// 2. Types/Interfaces
interface NewDetectorConfig {
  threshold: number;
}

// 3. Constants
const DEFAULT_THRESHOLD = 0.8;

// 4. Class/Function implementation
export class NewDetector extends BaseDetector {
  // Implementation
}

// 5. Helper functions (private)
function parseResult(raw: string): Issue[] {
  // Implementation
}
```

### Adding New Features

#### Example: Adding a New Detector

**Step 1: Create detector class**

```typescript
// odavl-studio/insight/core/src/detector/my-detector.ts

import { BaseDetector } from './base-detector';
import type { Issue, DetectorOptions } from '../types';

export class MyDetector extends BaseDetector {
  name = 'my-detector';
  
  async analyze(workspacePath: string, options?: DetectorOptions): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // Your detection logic here
    const files = await this.findFiles(workspacePath, '**/*.ts');
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const detectedIssues = this.analyzeFile(file, content);
      issues.push(...detectedIssues);
    }
    
    return issues;
  }
  
  private analyzeFile(filePath: string, content: string): Issue[] {
    // Detection logic
    return [];
  }
}
```

**Step 2: Register detector**

```typescript
// odavl-studio/insight/core/src/detector/index.ts

export { MyDetector } from './my-detector';
```

**Step 3: Add tests**

```typescript
// odavl-studio/insight/core/src/detector/my-detector.test.ts

import { describe, it, expect } from 'vitest';
import { MyDetector } from './my-detector';

describe('MyDetector', () => {
  it('should detect issues in TypeScript files', async () => {
    const detector = new MyDetector();
    const issues = await detector.analyze('./fixtures/sample-project');
    
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].severity).toBe('high');
  });
  
  it('should return empty array for clean files', async () => {
    const detector = new MyDetector();
    const issues = await detector.analyze('./fixtures/clean-project');
    
    expect(issues).toEqual([]);
  });
});
```

**Step 4: Update documentation**

Add entry to `docs/DETECTORS.md` (create if needed):

```markdown
### MyDetector

**Purpose:** Brief description of what this detector finds.

**Severity Levels:**
- Critical: [description]
- High: [description]
- Medium: [description]

**Configuration:**
\`\`\`json
{
  "insight": {
    "detectors": {
      "my-detector": {
        "enabled": true,
        "threshold": 0.8
      }
    }
  }
}
\`\`\`

**Examples:**
[Provide 2-3 examples of issues detected]
```

**Step 5: Submit PR**

```bash
git add .
git commit -m "feat(insight): add MyDetector for [purpose]"
git push origin feature/add-my-detector
# Open PR on GitHub
```

## Testing Guidelines

### Test Organization

```
tests/
├── unit/              # Unit tests (isolated functions/classes)
├── integration/       # Integration tests (multiple components)
└── e2e/              # End-to-end tests (full workflows)
```

### Writing Tests

**Unit Tests (Vitest):**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('TypeScriptDetector', () => {
  let detector: TypeScriptDetector;
  
  beforeEach(() => {
    detector = new TypeScriptDetector();
  });
  
  it('should detect type errors', async () => {
    // Arrange
    const workspace = './fixtures/type-error-project';
    
    // Act
    const issues = await detector.analyze(workspace);
    
    // Assert
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('Type error');
    expect(issues[0].severity).toBe('high');
  });
  
  it('should handle missing tsconfig.json gracefully', async () => {
    // Arrange
    const workspace = './fixtures/no-tsconfig';
    
    // Act & Assert
    await expect(detector.analyze(workspace)).rejects.toThrow('Missing tsconfig.json');
  });
});
```

**Integration Tests:**

```typescript
import { describe, it, expect } from 'vitest';
import { ODAVLInsight } from '@odavl-studio/insight-core';

describe('Full Analysis Pipeline', () => {
  it('should run all detectors and aggregate results', async () => {
    const insight = new ODAVLInsight();
    const results = await insight.analyzeWorkspace('./fixtures/test-project');
    
    expect(results.typescript).toBeDefined();
    expect(results.eslint).toBeDefined();
    expect(results.security).toBeDefined();
    
    const totalIssues = Object.values(results).flat().length;
    expect(totalIssues).toBeGreaterThan(0);
  });
});
```

**E2E Tests (Playwright for extensions):**

```typescript
import { test, expect } from '@playwright/test';

test('extension should activate and show Problems Panel', async ({ page }) => {
  // Open VS Code
  await page.goto('vscode://file/path/to/workspace');
  
  // Wait for extension activation
  await page.waitForSelector('.odavl-status-bar');
  
  // Trigger analysis
  await page.click('.odavl-status-bar');
  await page.click('text=Analyze Workspace');
  
  // Verify Problems Panel shows results
  await page.waitForSelector('.problems-panel');
  const issues = await page.$$('.problem-item');
  expect(issues.length).toBeGreaterThan(0);
});
```

### Test Coverage Requirements

- **Minimum**: 80% statement coverage
- **Target**: 90%+ coverage for critical paths
- **Detectors**: 95%+ coverage (high impact)
- **Utils**: 85%+ coverage

```bash
# Run tests with coverage
pnpm test:coverage

# View coverage report
open reports/coverage/index.html
```

### Mock Patterns

```typescript
// Mock file system
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('mock content'),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

// Mock external command
vi.mock('node:child_process', () => ({
  execSync: vi.fn().mockReturnValue('mock output'),
}));

// Mock logger (common pattern)
vi.mock('../utils/logger', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));
```

## Submitting Changes

### Pull Request Process

**1. Update your branch:**

```bash
# Sync with upstream
git fetch upstream
git rebase upstream/main

# Resolve conflicts if any
git add .
git rebase --continue
```

**2. Run quality checks:**

```bash
# Lint, typecheck, test, coverage
pnpm forensic:all

# All checks must pass before submitting PR
```

**3. Create PR:**

Use the PR template (auto-populated on GitHub):

```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues
Fixes #[issue number]

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if applicable)
- [ ] All tests passing locally

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings introduced
- [ ] Tests added with 80%+ coverage
- [ ] Commit messages follow convention
```

**4. Address review feedback:**

```bash
# Make changes based on feedback
git add .
git commit -m "fix: address review feedback"
git push origin feature/my-feature
```

### Code Review Expectations

**As a contributor:**
- Respond to feedback within 48 hours
- Be open to suggestions and alternative approaches
- Explain your reasoning when you disagree
- Keep discussions professional and constructive

**What reviewers look for:**
- Code correctness and edge cases
- Test coverage and quality
- Performance implications
- Security considerations
- Documentation completeness
- Consistency with existing patterns

## Code Review Process

### Review Guidelines

**Timeline:**
- Initial review: Within 48 hours
- Follow-up reviews: Within 24 hours
- Approval: 1-2 maintainers required

**Review Checklist:**

```markdown
- [ ] Code compiles and tests pass
- [ ] Changes match description in PR
- [ ] Code follows style guidelines
- [ ] Tests cover new functionality
- [ ] Documentation updated
- [ ] No security vulnerabilities introduced
- [ ] Performance acceptable
- [ ] Error handling appropriate
- [ ] No breaking changes (or documented if necessary)
```

### Protected Paths

The following paths require **extra scrutiny** (Risk Budget Guard):

```
security/**          # Security-critical code
auth/**              # Authentication logic
**/*.spec.*          # Test files
**/*.test.*          # Test files
public-api/**        # Public SDK exports
```

Changes to these paths require:
- Detailed explanation in PR
- Security review (for security/ and auth/)
- Explicit approval from 2+ maintainers

### Merge Strategy

- **Squash and merge** for feature branches
- **Merge commit** for releases
- **Rebase and merge** for small fixes

## Community

### Communication Channels

- **GitHub Discussions**: General questions, feature requests
- **GitHub Issues**: Bug reports, specific feature requests
- **Discord**: Real-time chat (invite: [link])
- **Twitter**: @odavl_studio (announcements)
- **Email**: support@odavl.com

### Getting Help

**Before asking:**
1. Check existing documentation
2. Search GitHub Issues for similar questions
3. Review closed PRs for examples

**When asking:**
- Provide context (OS, Node version, error messages)
- Include minimal reproducible example
- Share relevant configuration files
- Attach screenshots/videos if applicable

### Recognizing Contributors

We recognize contributions through:
- **GitHub Contributors** page
- **CONTRIBUTORS.md** file
- **Release notes** mentions
- **Social media** shoutouts
- **Swag** for significant contributions (coming soon!)

## Advanced Topics

### Adding VS Code Extension Features

**1. Register command:**

```typescript
// extension/src/extension.ts

export function activate(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand(
    'odavl.myNewCommand',
    async () => {
      // Your logic here
      vscode.window.showInformationMessage('Command executed!');
    }
  );
  
  context.subscriptions.push(command);
}
```

**2. Update package.json:**

```json
{
  "contributes": {
    "commands": [
      {
        "command": "odavl.myNewCommand",
        "title": "ODAVL: My New Command",
        "category": "ODAVL"
      }
    ],
    "keybindings": [
      {
        "command": "odavl.myNewCommand",
        "key": "ctrl+shift+o",
        "mac": "cmd+shift+o"
      }
    ]
  }
}
```

### Adding CLI Commands

**1. Create command file:**

```typescript
// apps/studio-cli/src/commands/my-command.ts

import { Command } from 'commander';

export function createMyCommand(): Command {
  return new Command('my-command')
    .description('Description of my command')
    .option('-o, --output <path>', 'Output path')
    .action(async (options) => {
      console.log('Executing my command with options:', options);
      // Your logic here
    });
}
```

**2. Register in CLI:**

```typescript
// apps/studio-cli/src/index.ts

import { createMyCommand } from './commands/my-command';

const program = new Command();
program.addCommand(createMyCommand());
```

### Training ML Models

**Data Collection:**

```typescript
// Run analysis with history tracking
odavl insight analyze --save-history

// History saved to .odavl/history.json
{
  "timestamp": "2025-11-23T10:00:00Z",
  "issues": [...],
  "fixes_applied": [...],
  "success": true
}
```

**Model Training:**

```bash
# Retrain model from history
cd odavl-studio/insight/core
pnpm run train

# Test new model
pnpm run test:ml

# Deploy new model (if accuracy improved)
cp src/ml/model-v2.json src/ml/model.json
```

## Release Process (Maintainers)

### Version Bumping

```bash
# Create changeset
pnpm changeset

# Choose packages to version
# Select version bump type (patch/minor/major)
# Write changelog entry

# Version packages
pnpm changeset version

# Commit changes
git add .
git commit -m "chore: version packages"

# Publish to npm
pnpm changeset publish
git push --follow-tags
```

### Release Checklist

- [ ] All tests passing on main branch
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped appropriately
- [ ] Git tag created
- [ ] npm packages published
- [ ] VS Code extensions packaged (.vsix)
- [ ] GitHub Release created with notes
- [ ] Social media announcement
- [ ] Website updated with new version

## Thank You!

Your contributions make ODAVL Studio better for everyone. Whether you're fixing a typo, adding a feature, or helping others in discussions, we appreciate your time and effort! 🙏

---

**Questions?** Open a [GitHub Discussion](https://github.com/odavl/odavl/discussions) or reach out on [Discord](https://discord.gg/odavl).
