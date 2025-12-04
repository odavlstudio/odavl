# ODAVL Studio - Version Management Guide

**Last Updated:** November 22, 2025  
**System:** Changesets + Semantic Versioning

---

## Overview

ODAVL Studio uses **[Changesets](https://github.com/changesets/changesets)** for version management across the monorepo. This system automates:

- Version bumping (package.json)
- CHANGELOG generation
- Git tagging
- npm publishing coordination

---

## Semantic Versioning

We follow **[SemVer 2.0.0](https://semver.org/)** strictly:

```
MAJOR.MINOR.PATCH
  1  .  2  .  3
```

### Version Types

| Type | Increment | When | Example |
|------|-----------|------|---------|
| **MAJOR** | 1.0.0 → 2.0.0 | Breaking changes | Remove deprecated API |
| **MINOR** | 1.2.0 → 1.3.0 | New features (backward compatible) | Add new detector |
| **PATCH** | 1.2.3 → 1.2.4 | Bug fixes | Fix TypeScript error |

### Pre-1.0.0 Versions

For versions **< 1.0.0**:
- `0.MINOR.PATCH` - MINOR can include breaking changes
- Use this phase for rapid iteration before stable release
- Current packages: `0.1.0` (initial development)

---

## Changesets Workflow

### 1. Make Changes

```bash
# Feature branch
git checkout -b feature/add-security-detector

# Make code changes
# ... edit files ...

# Commit changes
git commit -m "feat: add security detector for XSS detection"
```

### 2. Create Changeset

```bash
# Interactive changeset creation
pnpm changeset

# Prompts:
# 1. Which packages changed? (select with spacebar)
#    → @odavl-studio/insight-core
#    → @odavl-studio/cli
#
# 2. What type of change? (select one)
#    → major (breaking)
#    → minor (feature)
#    → patch (bugfix)
#
# 3. Describe the change (markdown)
#    → "Add new security detector for XSS vulnerabilities"
```

**Output:**
```
.changeset/
└── funny-lions-dance.md  # Random name
```

**Changeset File Content:**
```markdown
---
"@odavl-studio/insight-core": minor
"@odavl-studio/cli": minor
---

Add new security detector for XSS vulnerabilities

Detects common XSS patterns in React/Vue/Angular templates.
```

### 3. Commit Changeset

```bash
git add .changeset/funny-lions-dance.md
git commit -m "chore: add changeset for security detector"
git push origin feature/add-security-detector
```

### 4. Version Packages (Before Release)

```bash
# This updates package.json versions and generates CHANGELOGs
pnpm changeset version

# Changes:
# - packages/insight-core/package.json: 0.1.0 → 0.2.0
# - packages/insight-core/CHANGELOG.md: New entry
# - apps/studio-cli/package.json: 0.1.0 → 0.2.0
# - apps/studio-cli/CHANGELOG.md: New entry
# - .changeset/funny-lions-dance.md: Deleted
```

**Commit Version Changes:**
```bash
git add .
git commit -m "chore: version packages"
git push
```

### 5. Publish

```bash
# Publish to npm
.\scripts\publish-npm.ps1

# Or use changesets directly
pnpm changeset publish

# This will:
# - Build all packages
# - Publish to npm
# - Create git tags
```

### 6. Push Tags

```bash
git push --tags

# Creates tags like:
# @odavl-studio/cli@0.2.0
# @odavl-studio/sdk@0.2.0
```

---

## Changeset Types

### Patch (Bug Fix)

```bash
pnpm changeset
# Select: patch
# Summary: "Fix TypeScript error in analyze function"
```

**Example:**
```markdown
---
"@odavl-studio/insight-core": patch
---

Fix TypeScript error in analyze function

Corrected type annotation for `DetectorResult[]`.
```

**Version Change:** `0.1.0` → `0.1.1`

---

### Minor (New Feature)

```bash
pnpm changeset
# Select: minor
# Summary: "Add performance detector"
```

**Example:**
```markdown
---
"@odavl-studio/insight-core": minor
"@odavl-studio/cli": minor
"@odavl-studio/sdk": minor
---

Add performance detector

New detector identifies performance bottlenecks:
- Synchronous file operations
- Blocking network calls
- Large bundle imports
```

**Version Change:** `0.1.0` → `0.2.0`

---

### Major (Breaking Change)

```bash
pnpm changeset
# Select: major
# Summary: "Remove deprecated analyze() method"
```

**Example:**
```markdown
---
"@odavl-studio/sdk": major
---

BREAKING: Remove deprecated analyze() method

Use `analyzer.analyze()` instead of standalone `analyze()` function.

Migration:
```typescript
// Before
import { analyze } from '@odavl-studio/sdk';
await analyze('./src');

// After
import { InsightAnalyzer } from '@odavl-studio/sdk/insight';
const analyzer = new InsightAnalyzer();
await analyzer.analyze('./src');
```
```

**Version Change:** `0.9.0` → `1.0.0` (or `1.0.0` → `2.0.0`)

---

## Configuration

**.changeset/config.json:**

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [
    ["@odavl-studio/cli", "@odavl-studio/sdk"]
  ],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [
    "@odavl-studio/*-tests"
  ]
}
```

**Key Settings:**
- `linked`: Packages that version together (CLI + SDK)
- `updateInternalDependencies`: Auto-bump internal deps
- `ignore`: Don't version test packages
- `commit: false`: Manual commits (more control)

---

## Advanced Workflows

### Snapshot Releases (Pre-Release)

```bash
# Create snapshot (doesn't modify package.json)
pnpm changeset version --snapshot beta

# Publish snapshot
pnpm changeset publish --tag beta

# Install snapshot
npm install @odavl-studio/cli@0.2.0-beta-20251122
```

**Use Case:** Test breaking changes before release.

---

### Emergency Hotfix

```bash
# 1. Branch from release tag
git checkout -b hotfix/critical-bug @odavl-studio/cli@0.2.0

# 2. Fix bug
# ... edit files ...

# 3. Create patch changeset
pnpm changeset
# Select: patch

# 4. Version and publish immediately
pnpm changeset version
git add . && git commit -m "chore: hotfix version"
.\scripts\publish-npm.ps1

# 5. Merge back to main
git checkout main
git merge hotfix/critical-bug
git push
```

---

### Multiple Changesets (Complex Release)

```bash
# Feature 1
pnpm changeset
# Summary: "Add TypeScript 5.3 support"
# Type: minor

# Feature 2
pnpm changeset
# Summary: "Fix ESLint integration"
# Type: patch

# Feature 3
pnpm changeset
# Summary: "BREAKING: Require Node 20+"
# Type: major

# Version all at once
pnpm changeset version
# Result: 0.2.0 → 1.0.0 (highest type wins)
```

---

## CHANGELOG Format

Generated CHANGELOGs follow **[Keep a Changelog](https://keepachangelog.com/)**:

```markdown
# @odavl-studio/insight-core

## 0.2.0

### Minor Changes

- abc1234: Add performance detector

  New detector identifies performance bottlenecks:
  - Synchronous file operations
  - Blocking network calls
  - Large bundle imports

### Patch Changes

- def5678: Fix TypeScript error in analyze function

  Corrected type annotation for `DetectorResult[]`.

## 0.1.0

### Minor Changes

- Initial release
```

---

## Package Dependencies

### Internal Dependencies

When updating a package that others depend on:

```json
// @odavl-studio/cli depends on @odavl-studio/insight-core

// Changeset updates both:
---
"@odavl-studio/insight-core": minor
"@odavl-studio/cli": patch
---

Add new detector

// Result:
// insight-core: 0.1.0 → 0.2.0
// cli: 0.1.0 → 0.1.1 (auto-updated dependency)
```

**Config:** `"updateInternalDependencies": "patch"` ensures CLI gets bumped.

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Release

on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - run: pnpm install
      
      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: pnpm run release
          version: pnpm changeset version
          commit: "chore: version packages"
          title: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Workflow:**
1. PR merged to `main`
2. Action detects changesets
3. Creates "Version Packages" PR
4. Merge PR → Auto-publishes to npm

---

## Version Strategy

### Current Phase: 0.x.x (Pre-Release)

**Goal:** Iterate rapidly, gather feedback

**Rules:**
- Minor versions can include breaking changes
- Document all breaking changes in CHANGELOG
- Use `@next` tag for experimental features

**Timeline:**
- `0.1.0` - Initial release (Nov 2025)
- `0.2.0` - First feature update (Dec 2025)
- `0.5.0` - Beta release (Q1 2026)
- `1.0.0` - Stable release (Q2 2026)

---

### Stable Phase: 1.x.x+

**Goal:** Maintain backward compatibility

**Rules:**
- Major version only for breaking changes
- Deprecation warnings before removal
- Support previous major version for 12 months

**Example:**
```typescript
// v1.x (deprecated but works)
@deprecated("Use analyzer.analyze() instead. Will be removed in v2.0.0")
export function analyze(path: string) { ... }

// v2.x (removed)
// analyze() function removed
```

---

## Commands Reference

### Create Changeset

```bash
pnpm changeset
pnpm changeset add  # Alias
```

### Version Packages

```bash
pnpm changeset version         # Update versions + CHANGELOGs
pnpm changeset version --snapshot  # Create snapshot version
```

### Publish

```bash
pnpm changeset publish        # Publish to npm
pnpm changeset publish --tag beta  # Publish with tag
```

### Status

```bash
pnpm changeset status         # Show pending changesets
pnpm changeset status --verbose  # Detailed output
```

---

## Best Practices

1. **Create changeset with every PR**
   - Enforced via GitHub Actions
   - Ensures accurate CHANGELOGs

2. **Use descriptive summaries**
   - Explain what changed and why
   - Include migration guide for breaking changes

3. **Version before release**
   - Run `changeset version` on release branch
   - Review generated CHANGELOGs

4. **Tag releases in git**
   - Automatic with `changeset publish`
   - Format: `@scope/package@version`

5. **Communicate breaking changes**
   - Blog post for major versions
   - Migration guide in docs
   - Deprecation warnings in code

---

## Troubleshooting

### Issue: Changeset Not Detected

**Cause:** Changeset file not committed

**Solution:**
```bash
git status
# Ensure .changeset/*.md files are tracked
git add .changeset/
git commit -m "chore: add changeset"
```

---

### Issue: Version Conflict

**Cause:** Multiple changesets for same package

**Solution:**
```bash
# View pending changesets
pnpm changeset status

# Version packages (combines all changesets)
pnpm changeset version
# Result: Uses highest version bump type
```

---

### Issue: Publish Failed

**Cause:** npm authentication or version conflict

**Solution:**
```bash
# Check authentication
npm whoami

# Check if version exists
npm view @odavl-studio/cli versions

# Bump version and retry
pnpm changeset version
pnpm changeset publish
```

---

## Resources

- **Changesets Docs:** [github.com/changesets/changesets](https://github.com/changesets/changesets)
- **SemVer Spec:** [semver.org](https://semver.org/)
- **Keep a Changelog:** [keepachangelog.com](https://keepachangelog.com/)

---

**Next:** [DISTRIBUTION.md](./DISTRIBUTION.md) | [CONTRIBUTING.md](./CONTRIBUTING.md)
