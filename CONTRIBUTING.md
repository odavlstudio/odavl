# Contributing to ODAVL Studio

Thank you for your interest in contributing to ODAVL Studio! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Areas for Contribution](#areas-for-contribution)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful, inclusive, and professional in all interactions.

## Getting Started

### Prerequisites

- **Node.js**: 18.18+ (Insight/Autopilot) or 20.0+ (Guardian)
- **pnpm**: 8.0+ (required - NOT npm or yarn)
- **Git**: Latest version
- **VS Code**: 1.80.0+ (recommended for extension development)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/Monawlo812/odavl.git
cd odavl

# Install dependencies (MUST use pnpm)
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run forensic analysis (linting + typecheck + coverage)
pnpm forensic:all
```

### Development Environment

```bash
# Start all dev servers
pnpm dev

# Or start specific products:
pnpm insight:dev     # Insight Cloud dashboard (localhost:3001)
pnpm guardian:dev    # Guardian dashboard (localhost:3002)
pnpm autopilot:engine # Build Autopilot engine

# VS Code extensions development:
cd odavl-studio/insight/extension
npm run compile      # Build extension
npm run watch        # Watch mode
# Press F5 in VS Code to launch Extension Development Host
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 2. Make Your Changes

- Write clean, well-documented code
- Follow TypeScript strict mode (zero errors)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Locally

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test packages/insight-core

# Run with coverage
pnpm test:coverage

# Lint and typecheck
pnpm lint
pnpm typecheck

# Full CI workflow
pnpm forensic:all
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add new detector for XYZ"
# See commit message convention below
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
# Then create Pull Request on GitHub
```

## Project Structure

```
odavl/
├── apps/                        # Applications
│   ├── studio-cli/             # Unified CLI
│   ├── studio-hub/             # Marketing website
│   └── insight-cloud-tests/    # Dashboard tests
├── odavl-studio/               # Three products
│   ├── insight/                # Error detection
│   │   ├── core/              # Detection engine
│   │   ├── cloud/             # Next.js dashboard
│   │   └── extension/         # VS Code extension
│   ├── autopilot/             # Self-healing
│   │   ├── engine/            # O-D-A-V-L cycle
│   │   └── extension/         # VS Code extension
│   └── guardian/              # Pre-deploy testing
│       ├── app/               # Next.js dashboard
│       ├── workers/           # Background jobs
│       └── extension/         # VS Code extension
├── packages/                   # Shared packages
│   ├── sdk/                   # Public SDK
│   ├── auth/                  # Authentication
│   ├── core/                  # Shared utilities
│   └── types/                 # TypeScript interfaces
├── docs/                       # Documentation
├── scripts/                    # Build/automation scripts
└── tests/                      # Integration tests
```

## Coding Standards

### TypeScript

- **Strict Mode**: All code must compile with `strict: true`
- **Type Safety**: No `any` types (use `unknown` if needed)
- **Naming Conventions**:
  - Classes: `PascalCase`
  - Functions/variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Interfaces: `PascalCase` (no `I` prefix)
  - Types: `PascalCase`

### File Structure

```typescript
// 1. Imports (grouped: node → external → internal)
import * as fs from 'node:fs';
import { Command } from 'commander';
import { Logger } from '@odavl-studio/core';

// 2. Types/Interfaces
interface DetectorConfig {
  enabled: boolean;
  severity: 'error' | 'warning';
}

// 3. Constants
const DEFAULT_TIMEOUT = 5000;

// 4. Implementation
export class Detector {
  // ...
}

// 5. Exports
export { DetectorConfig };
```

### ESLint Rules

- **No console.log**: Use `Logger` utility instead
- **No debugger**: Remove before committing
- **Unused vars**: Remove or prefix with `_`
- **Prefer const**: Use `const` over `let` when possible
- **Arrow functions**: Prefer arrow functions for callbacks

### Code Style

- **Line Length**: Max 100 characters
- **Indentation**: 2 spaces (no tabs)
- **Semicolons**: Required
- **Quotes**: Single quotes for strings
- **Trailing Commas**: Always in multiline

## Testing Guidelines

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { TypeScriptDetector } from './typescript-detector';

describe('TypeScriptDetector', () => {
  it('should detect type errors', async () => {
    const detector = new TypeScriptDetector();
    const result = await detector.analyze('/path/to/workspace');
    
    expect(result.issues).toHaveLength(3);
    expect(result.issues[0].severity).toBe('error');
  });
  
  it('should skip node_modules', async () => {
    // Test implementation
  });
});
```

### Test Coverage

- **Target**: 80%+ coverage
- **Unit Tests**: All detectors, utilities, core logic
- **Integration Tests**: CLI commands, API endpoints
- **E2E Tests**: VS Code extensions (manual for now)

### Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Specific file
pnpm test packages/insight-core/src/detector/typescript-detector.test.ts
```

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build, etc.)
- `perf`: Performance improvements

### Scopes

- `insight`: ODAVL Insight product
- `autopilot`: ODAVL Autopilot product
- `guardian`: ODAVL Guardian product
- `cli`: Unified CLI
- `sdk`: Public SDK
- `core`: Shared utilities
- `docs`: Documentation
- `tests`: Testing infrastructure

### Examples

```bash
feat(insight): add network timeout detector

Implements detection of missing timeout parameters in fetch() calls.
Includes tests and updates to detector registry.

Closes #123

---

fix(autopilot): correct undo snapshot path resolution

Fixes issue where undo snapshots were not found on Windows due to
path separator differences.

Fixes #456

---

docs(readme): add installation instructions for VS Code extensions

Updates main README with .vsix installation steps and requirements.
```

## Pull Request Process

### Before Submitting

1. ✅ All tests pass (`pnpm test`)
2. ✅ No TypeScript errors (`pnpm typecheck`)
3. ✅ No ESLint errors (`pnpm lint`)
4. ✅ Code formatted (`pnpm format` - runs Prettier)
5. ✅ Documentation updated (if applicable)
6. ✅ CHANGELOG.md updated (for user-facing changes)

### PR Template

```markdown
## Description
<!-- Clear description of what this PR does -->

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Testing
<!-- Describe tests you ran and how to reproduce -->

## Checklist
- [ ] Tests pass locally (`pnpm test`)
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] No ESLint errors (`pnpm lint`)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if user-facing)
```

### Review Process

1. **Automated Checks**: CI/CD runs tests, linting, typecheck
2. **Code Review**: Maintainer reviews code quality, design, tests
3. **Feedback**: Address review comments and update PR
4. **Approval**: Maintainer approves and merges

### After Merge

- Your contribution will be included in the next release
- You'll be credited in CHANGELOG.md
- Thank you for contributing! 🎉

## Areas for Contribution

### 🔍 Good First Issues

Perfect for newcomers:

- Add tests for existing detectors
- Improve error messages
- Update documentation
- Fix typos or formatting
- Add examples to README

### 🐛 Bug Fixes

Current known issues:

- 3 test failures in performance-detector.test.ts
- Build errors in some packages (guardian/app, insight/cloud)
- Missing .vscodeignore files in extensions

### ✨ New Features

Feature requests:

- Additional detectors (accessibility, i18n, etc.)
- More improvement recipes for Autopilot
- Dashboard enhancements (charts, filters)
- CLI improvements (interactive prompts, progress bars)
- SDK language bindings (Python, Java, etc.)

### 📚 Documentation

Help improve docs:

- Tutorial videos/GIFs
- Architecture diagrams
- API reference examples
- Migration guides
- Troubleshooting guides

### 🧪 Testing

Improve test coverage:

- Unit tests for detectors
- Integration tests for CLI
- E2E tests for extensions
- Performance benchmarks
- Security testing

## Development Tips

### Monorepo Commands

```bash
# Build single package
pnpm --filter @odavl-studio/insight-core build

# Run command in all packages
pnpm -r build

# Add dependency to specific package
pnpm --filter @odavl-studio/cli add commander
```

### Extension Development

```bash
# Compile extension
cd odavl-studio/insight/extension
npm run compile

# Watch mode (auto-rebuild)
npm run watch

# Package extension
pnpm exec vsce package --no-dependencies

# Install in VS Code
code --install-extension odavl-insight-vscode-2.0.0.vsix
```

### Debugging

- **VS Code Extensions**: Press F5 in extension directory
- **Node.js**: Use `tsx` for running TypeScript directly
- **Tests**: Use `--inspect-brk` flag with Vitest
- **CLI**: Use `tsx src/index.ts` in apps/studio-cli

### Common Issues

**Issue: pnpm install fails**
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Issue: TypeScript errors after pulling**
```bash
# Rebuild all packages
pnpm build
```

**Issue: Tests fail with import errors**
```bash
# Rebuild insight-core (dual exports)
pnpm --filter @odavl-studio/insight-core build
```

## Getting Help

- **Documentation**: Check [docs/](docs/) folder
- **GitHub Issues**: [github.com/Monawlo812/odavl/issues](https://github.com/Monawlo812/odavl/issues)
- **GitHub Discussions**: [github.com/Monawlo812/odavl/discussions](https://github.com/Monawlo812/odavl/discussions)
- **Quick Start**: Read [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)

## Recognition

Contributors will be:

- Listed in CHANGELOG.md for each release
- Credited in GitHub contributors page
- Mentioned in release notes
- Added to CONTRIBUTORS.md (coming soon)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to ODAVL Studio!** 🙏

Your contributions help make autonomous code quality accessible to everyone.
