# 📦 دليل إدارة الحزم - ODAVL Studio

## 🎯 Overview

This guide outlines the package management policies and procedures for ODAVL Studio monorepo. It ensures consistency, security, and maintainability across all workspace projects.

---

## 📋 Table of Contents

1. [Adding New Packages](#adding-new-packages)
2. [Updating Packages](#updating-packages)
3. [Removing Packages](#removing-packages)
4. [Version Management](#version-management)
5. [Security Guidelines](#security-guidelines)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## 🆕 Adding New Packages

### Pre-Addition Checklist

Before adding a new package, ask yourself:

1. **Is it necessary?**
   - Can we achieve this with existing dependencies?
   - Is there a native Node.js/Browser API alternative?
   - Can we implement this functionality ourselves (for simple cases)?

2. **Is it maintained?**
   - Last commit within 6 months ✅
   - Active issues/PRs being addressed ✅
   - Regular release cycle ✅
   - GitHub stars > 1,000 (for popular categories) ✅

3. **Is it secure?**
   - No known vulnerabilities (check npm audit) ✅
   - Reputable maintainers/organization ✅
   - Clear security policy ✅

4. **Is it production-ready?**
   - Stable version (1.0.0+) preferred ✅
   - TypeScript definitions available ✅
   - Good documentation ✅
   - Test coverage > 80% ✅

### Security Verification

```bash
# 1. Check npm audit database
pnpm audit <package-name>

# 2. Check Snyk database (optional)
pnpm dlx snyk test <package-name>

# 3. Check GitHub Security Advisories
# Visit: https://github.com/advisories?query=<package-name>

# 4. Review package reputation
npm view <package-name> maintainers
npm view <package-name> downloads
```

### Quality Metrics

Minimum requirements for package selection:

| Metric | Minimum | Preferred |
|--------|---------|-----------|
| Weekly Downloads | 10,000 | 100,000+ |
| GitHub Stars | 500 | 1,000+ |
| Last Commit | < 6 months | < 3 months |
| TypeScript Support | @types available | Native TS |
| Test Coverage | > 60% | > 80% |
| Open Critical Issues | 0 | 0 |

### Installation Process

```bash
# 1. Add to appropriate workspace package
cd <workspace-path>
pnpm add <package-name>

# For dev dependencies
pnpm add -D <package-name>

# For specific workspace
pnpm add <package-name> --filter @odavl-studio/<workspace>

# 2. Verify TypeScript compilation
pnpm typecheck

# 3. Run tests
pnpm test

# 4. Build packages
pnpm build

# 5. Update .package-versions.json (if core dependency)
# Edit manually and run validation
pnpm exec tsx scripts/check-package-versions.ts
```

### Commit Message Template

```bash
git commit -m "feat: add <package> for <feature>

- Purpose: <why this package is needed>
- Alternatives considered: <other options>
- Bundle impact: +<size>KB (gzipped)
- Security audit: ✅ No vulnerabilities
- License: <license-type>

Closes #<issue-number>
"
```

---

## 🔄 Updating Packages

### Update Schedule

| Update Type | Frequency | Automation | Testing Required |
|-------------|-----------|------------|------------------|
| **Patch** (x.x.1) | Automatic | Dependabot | Unit tests |
| **Minor** (x.1.x) | Weekly (Monday) | GitHub Actions | Integration tests |
| **Major** (1.x.x) | Monthly | Manual | Full test suite + E2E |
| **Security** | Immediate (< 24h) | Manual + CI Alert | Critical path tests |

### Update Workflow

#### 1. Check for Updates

```bash
# Check all outdated packages
pnpm outdated

# Check specific package
pnpm outdated <package-name>

# Check security vulnerabilities
pnpm audit --audit-level=moderate
```

#### 2. Review Changes

```bash
# View changelog
npm view <package-name> versions
npm view <package-name>@<version>

# Check GitHub releases
# Visit: https://github.com/<org>/<repo>/releases
```

#### 3. Update Selectively

```bash
# Update single package (patch/minor)
pnpm update <package-name>

# Update to specific version
pnpm update <package-name>@<version>

# Update all minor/patch versions
pnpm update --latest --recursive

# Update with interactive mode (recommended)
pnpm update --interactive --latest
```

#### 4. Test Thoroughly

```bash
# Run full test suite
pnpm forensic:all

# This includes:
# - TypeScript compilation (pnpm typecheck)
# - Linting (pnpm lint)
# - Unit tests (pnpm test)
# - Test coverage (pnpm test:coverage)

# For major updates, also run:
pnpm test:integration
pnpm test:e2e
pnpm build
```

#### 5. Commit with Changelog

```bash
git commit -m "chore: update <package> to v<version>

Breaking Changes:
- <list breaking changes if major update>

Migration Steps:
- <list required code changes>

Testing:
- ✅ TypeScript compilation
- ✅ Unit tests (447/462 passing)
- ✅ Build successful

Refs: <changelog-url>
"
```

### Major Version Updates

For major version updates (1.x.x → 2.x.x):

1. **Create Feature Branch**
   ```bash
   git checkout -b upgrade/<package>-v<version>
   ```

2. **Review Breaking Changes**
   - Read migration guide thoroughly
   - Identify affected code paths
   - Plan refactoring strategy

3. **Update in Stages**
   - Update one package at a time
   - Test each update independently
   - Commit frequently

4. **Integration Testing**
   - Test all affected features
   - Check for runtime errors
   - Validate production build

5. **Create Pull Request**
   - Document breaking changes
   - List migration steps
   - Provide rollback plan

---

## 🗑️ Removing Packages

### Removal Process

```bash
# 1. Verify package is unused
pnpm dlx depcheck

# 2. Search for imports in codebase
# Use your editor's global search or:
grep -r "from '<package-name>'" .
grep -r "require('<package-name>')" .

# 3. Remove from package.json
pnpm remove <package-name>

# For specific workspace
pnpm remove <package-name> --filter @odavl-studio/<workspace>

# 4. Clean install
pnpm install

# 5. Verify build
pnpm build
pnpm test
```

### Commit Message

```bash
git commit -m "refactor: remove <package>

- Replaced with: <alternative or native API>
- Rationale: <why removed>
- Bundle impact: -<size>KB
"
```

---

## 🔢 Version Management

### Version Lock System

ODAVL uses `.package-versions.json` as the source of truth for approved versions.

#### Structure

```json
{
  "version": "2.0.0",
  "lockDate": "2025-11-27",
  "core": {
    "node": ">=18.18",
    "pnpm": "9.12.2",
    "typescript": "5.9.3"
  },
  "frameworks": {
    "react": "19.0.0",
    "next": "14.2.25",
    "vite": "7.2.4"
  },
  "testing": {
    "vitest": "4.0.14",
    "playwright": "1.57.0"
  },
  "security": {
    "minimumVersions": {
      "next": ">=14.2.25",
      "playwright": ">=1.55.1",
      "esbuild": ">=0.25.0"
    }
  }
}
```

#### Validation

```bash
# Run version checker (pre-commit hook)
pnpm exec tsx scripts/check-package-versions.ts

# This validates:
# - Security-critical packages meet minimum versions
# - Core framework versions are consistent
# - Testing framework versions are unified
```

### pnpm Overrides

For enforcing specific versions workspace-wide:

```json
{
  "pnpm": {
    "overrides": {
      "next": ">=14.2.25",
      "playwright": ">=1.55.1",
      "esbuild": ">=0.25.0",
      "react": "^19.0.0",
      "react-dom": "^19.0.0"
    }
  }
}
```

**Use cases:**
- Security patches for transitive dependencies
- Resolving version conflicts
- Enforcing workspace-wide upgrades

---

## 🔒 Security Guidelines

### Vulnerability Response

#### CRITICAL (CVE Score 9.0+)
- **Response Time**: < 4 hours
- **Action**: Immediate update + hotfix release
- **Notification**: Team alert + stakeholder notification
- **Testing**: Critical path smoke tests

#### HIGH (CVE Score 7.0-8.9)
- **Response Time**: < 24 hours
- **Action**: Emergency update
- **Notification**: Team notification
- **Testing**: Full regression suite

#### MODERATE (CVE Score 4.0-6.9)
- **Response Time**: < 1 week
- **Action**: Scheduled update
- **Notification**: Weekly security report
- **Testing**: Standard test suite

#### LOW (CVE Score < 4.0)
- **Response Time**: Next monthly update
- **Action**: Routine maintenance
- **Notification**: Monthly changelog
- **Testing**: Automated CI tests

### Security Audit Workflow

```bash
# Daily (automated via GitHub Actions)
pnpm audit --audit-level=moderate

# Weekly (manual review)
pnpm audit --audit-level=low --json > reports/audit-$(date +%Y%m%d).json

# Before releases
pnpm audit --audit-level=critical
pnpm dlx snyk test
```

### Dependency Trust Policy

**Trusted Sources:**
- ✅ Official packages (@odavl-studio/*)
- ✅ Verified publishers (Microsoft, Facebook, Google, etc.)
- ✅ OpenJS Foundation projects
- ✅ CNCF projects

**Review Required:**
- ⚠️ Personal maintainer accounts
- ⚠️ Recently transferred ownership
- ⚠️ Packages with < 10k weekly downloads
- ⚠️ Packages with no TypeScript types

**Prohibited:**
- ❌ Unpublished/private registry packages (without approval)
- ❌ Packages with known backdoors
- ❌ Packages violating license compatibility

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. Peer Dependency Conflicts

**Symptom**: `WARN EUNMET PEER DEPENDENCY`

**Solution**:
```json
{
  "pnpm": {
    "peerDependencyRules": {
      "allowedVersions": {
        "react": "19"
      },
      "ignoreMissing": [
        "rollup",
        "webpack"
      ]
    }
  }
}
```

#### 2. Version Conflicts

**Symptom**: Multiple versions of same package

**Solution**:
```bash
# Use pnpm overrides
{
  "pnpm": {
    "overrides": {
      "package-name": "^1.0.0"
    }
  }
}

# Then reinstall
pnpm install
```

#### 3. Lockfile Out of Sync

**Symptom**: `ERR_PNPM_OUTDATED_LOCKFILE`

**Solution**:
```bash
# Update lockfile
pnpm install --no-frozen-lockfile

# Or force clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 4. Build Failures After Update

**Symptom**: TypeScript errors or build failures

**Solution**:
```bash
# Clear cache
pnpm store prune

# Rebuild all packages
pnpm clean
pnpm install
pnpm build

# If still failing, check for breaking changes
npm view <package-name>@<version> --json
```

#### 5. Missing Type Definitions

**Symptom**: `Could not find a declaration file for module`

**Solution**:
```bash
# Install @types package
pnpm add -D @types/<package-name>

# If no @types available, create types.d.ts
declare module '<package-name>';
```

---

## ✨ Best Practices

### 1. Monorepo Package Management

```bash
# Install workspace-wide dependencies at root
pnpm add -w <package>

# Install package-specific dependencies in subdirectories
cd packages/core
pnpm add <package>

# Use workspace protocol for internal packages
{
  "dependencies": {
    "@odavl-studio/core": "workspace:*"
  }
}
```

### 2. Bundle Size Optimization

```bash
# Use bundle analyzer
pnpm dlx vite-bundle-visualizer

# Import only what you need (tree-shaking)
# Good
import { map } from 'lodash-es/map';

# Bad (imports entire library)
import _ from 'lodash';
```

### 3. License Compliance

```bash
# Check licenses
pnpm licenses list

# Allowed licenses:
# - MIT, Apache-2.0, BSD-3-Clause
# - ISC, 0BSD, CC0-1.0

# Review required:
# - LGPL, GPL (copyleft)
# - Custom licenses
```

### 4. Dependency Hygiene

```bash
# Regular maintenance (monthly)
pnpm outdated
pnpm dlx depcheck
pnpm dedupe

# Remove unused dependencies
pnpm prune

# Update lockfile
pnpm install --lockfile-only
```

### 5. Documentation

- Document why each package is needed (README.md or ADR)
- Keep package.json descriptions up to date
- Maintain CHANGELOG.md for version updates
- Link to migration guides for major updates

---

## 📊 Metrics & Monitoring

### Key Performance Indicators

| Metric | Target | Current |
|--------|--------|---------|
| Security Vulnerabilities (Critical/High) | 0 | 0 ✅ |
| Outdated Packages | < 10 | 0 ✅ |
| Dependency Count | < 500 | 2,356 ⚠️ |
| Install Time | < 5 min | ~3 min ✅ |
| Node Modules Size | < 1 GB | ~850 MB ✅ |
| TypeScript Errors | 0 | 0 ✅ |
| Test Coverage | > 80% | 96.7% ✅ |

### Automation

**GitHub Actions** (`dependencies.yml`):
- 🔍 Weekly security audits
- 📦 Automated minor/patch updates
- 🚨 Alert on critical vulnerabilities
- 📊 Dependency reports

**Dependabot** (`.github/dependabot.yml`):
- 📅 Scheduled updates per ecosystem
- 🔄 Grouped updates (react-ecosystem, typescript-ecosystem)
- 🚫 Ignore major version updates (manual review)
- 📝 Auto-PR creation with changelogs

**Pre-commit Hooks** (`.husky/pre-commit`):
- ✅ Version validation
- 🔒 Security audit
- 📝 Lockfile verification

---

## 🔗 Resources

### Internal Documentation
- [PACKAGES_UNIFICATION_PLAN.md](./PACKAGES_UNIFICATION_PLAN.md) - Complete unification strategy
- [.package-versions.json](../.package-versions.json) - Version lock file
- [scripts/check-package-versions.ts](../scripts/check-package-versions.ts) - Version validation script

### External Resources
- [pnpm Documentation](https://pnpm.io/)
- [npm Security Best Practices](https://docs.npmjs.com/security)
- [Snyk Vulnerability Database](https://snyk.io/vuln/)
- [GitHub Security Advisories](https://github.com/advisories)
- [OpenSSF Scorecard](https://securityscorecards.dev/)

---

## 📝 Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-27 | 1.0.0 | Initial documentation |

---

**Maintained by**: ODAVL DevOps Team  
**Last Updated**: November 27, 2025  
**Review Cycle**: Quarterly
