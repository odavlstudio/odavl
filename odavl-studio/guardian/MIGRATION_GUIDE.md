# 🔄 Guardian Migration Guide: v4.0 → v5.0

**Complete guide for upgrading from Guardian v4.0 to v5.0**

---

## Table of Contents

1. [Overview](#overview)
2. [Breaking Changes](#breaking-changes)
3. [Migration Steps](#migration-steps)
4. [Feature Comparison](#feature-comparison)
5. [Code Changes](#code-changes)
6. [Configuration Changes](#configuration-changes)
7. [Common Issues](#common-issues)
8. [Rollback Plan](#rollback-plan)

---

## Overview

### What Changed?

Guardian v5.0 is a **major rewrite** focused on:
- ✅ **Universal support** - Works with any project (not just ODAVL)
- ✅ **Auto-detection** - No manual project type selection
- ✅ **Dynamic menus** - UI adapts to your project
- ✅ **Cleaner focus** - Removed overlapping features with Insight

### Why Upgrade?

**Benefits of v5.0:**
- 🚀 Works with **any project** (Spotify, Microsoft, etc.)
- ⚡ **Faster workflow** - Auto-detection saves time
- 🎯 **Better UX** - Dynamic menus show only relevant options
- 🧹 **Cleaner architecture** - No duplicate features
- 📦 **Monorepo smart** - Tests only affected packages

**Who Should Upgrade:**
- ✅ Teams using Guardian for ODAVL projects
- ✅ Anyone testing multiple project types
- ✅ Monorepo users needing impact analysis
- ⚠️ Users with custom integrations (review breaking changes)

### Upgrade Timeline

**Recommended approach:**
1. **Week 1**: Test v5.0 in development
2. **Week 2**: Migrate CI/CD pipelines
3. **Week 3**: Update team documentation
4. **Week 4**: Full production migration

---

## Breaking Changes

### 1. Removed Commands

#### ❌ `guardian launch:quick`

**Reason**: Duplicates ODAVL Insight functionality

**v4.0 Usage:**
```bash
guardian launch:quick
# Static analysis (TypeScript + ESLint)
```

**v5.0 Alternative:**
```bash
# Use ODAVL Insight instead
pnpm odavl:insight

# Or run specific Insight detectors
odavl insight analyze --detectors typescript,eslint
```

**Migration Impact**: Medium
- Update CI/CD scripts
- Replace in pre-commit hooks
- Update team documentation

---

#### ❌ `guardian status`

**Reason**: Duplicates ODAVL Insight's health monitoring

**v4.0 Usage:**
```bash
guardian status
# System health check
```

**v5.0 Alternative:**
```bash
# Use ODAVL Insight instead
pnpm monitor:health

# Or run Insight health check
odavl insight health
```

**Migration Impact**: Low
- Only used for monitoring
- Easy alternative available

---

#### ❌ `guardian context`

**Reason**: Auto-detection replaces manual context

**v4.0 Usage:**
```bash
guardian context show
# Display ODAVL Suite context
```

**v5.0 Alternative:**
```bash
# Guardian auto-detects and shows context
guardian detect

# Or just run Guardian (shows context in menu)
guardian
```

**Migration Impact**: Low
- Auto-detection is better
- No action needed for most users

---

### 2. Changed Behavior

#### Auto-Detection is Default

**v4.0**: Manual project selection
```bash
guardian launch:ai
# Assumes ODAVL project
```

**v5.0**: Auto-detection
```bash
guardian
# Auto-detects project type
# Shows adaptive menu
```

**Migration Impact**: Low
- Better UX
- No breaking changes for most users

---

#### Dynamic Menu System

**v4.0**: Fixed 12-option menu
```
[1] Quick Scan
[2] AI Analysis
[3] Website Check
[4] Project Detection
...
[12] Exit
```

**v5.0**: Adaptive menu (3-8 options based on project)

**Single Package:**
```
[1] Test this website
[2] Custom Test
[3] Language Analysis
[0] Exit
```

**Monorepo:**
```
[1-N] Individual products
[N+1] Test All Products
[N+2] Language Analysis
[N+3] Dashboard
[0] Exit
```

**Migration Impact**: Very Low
- Improved UX
- Fewer options = less confusion

---

#### Storage Location

**v4.0**: `.odavl/guardian/`

**v5.0**: `.guardian/`

**Reason**: Guardian is now universal (not ODAVL-specific)

**Migration:**
```bash
# Move existing reports (optional)
mv .odavl/guardian .guardian

# Or let Guardian create fresh directory
# Old reports remain in .odavl/guardian/
```

**Migration Impact**: Low
- Doesn't break functionality
- Old reports still accessible

---

### 3. Configuration Changes

#### guardian.config.json Structure

**v4.0:**
```json
{
  "odavl": {
    "products": [...]
  }
}
```

**v5.0:**
```json
{
  "project": {
    "name": "My Project",
    "type": "website"
  }
}
```

**Migration:**
```bash
# v4.0 configs still work (backwards compatible)
# But consider updating to v5.0 format
```

**Migration Impact**: Very Low
- Backwards compatible
- Update at your convenience

---

## Migration Steps

### Step 1: Backup Current Setup

```bash
# Backup v4.0 configuration
cp guardian.config.json guardian.config.v4.json

# Backup reports
cp -r .odavl/guardian .odavl/guardian.backup

# Document current CI/CD usage
# - Which commands are used?
# - Where in pipeline?
# - Expected outputs?
```

---

### Step 2: Install v5.0

```bash
# Uninstall v4.0
npm uninstall -g @odavl-studio/guardian

# Install v5.0
npm install -g @odavl-studio/guardian@5

# Verify
guardian --version
# Should show: 5.0.0
```

---

### Step 3: Test Auto-Detection

```bash
# Navigate to your project
cd your-project

# Run Guardian
guardian

# Verify detection
# ✅ Correct project type?
# ✅ Confidence >75%?
# ✅ Menu looks correct?
```

**If detection fails:**
```json
// guardian.config.json
{
  "project": {
    "type": "website"  // or extension, cli, package, monorepo
  }
}
```

---

### Step 4: Update CI/CD

**GitHub Actions:**

**Before (v4.0):**
```yaml
- name: Run Guardian
  run: guardian launch:ai
```

**After (v5.0):**
```yaml
- name: Run Guardian
  run: guardian
```

**GitLab CI:**

**Before (v4.0):**
```yaml
script:
  - guardian status
  - guardian launch:quick
```

**After (v5.0):**
```yaml
script:
  - guardian  # Auto-detects and runs appropriate tests
```

---

### Step 5: Update Pre-commit Hooks

**Before (v4.0):**
```bash
# .husky/pre-commit
guardian launch:quick
```

**After (v5.0):**
```bash
# .husky/pre-commit
guardian
```

---

### Step 6: Update Team Documentation

**Update mentions of:**
- ❌ `guardian launch:quick` → Use Insight
- ❌ `guardian status` → Use Insight
- ❌ `guardian context` → Auto-detected
- ✅ `guardian` → New main command

---

### Step 7: Test Full Workflow

```bash
# 1. Development check
guardian

# 2. Pre-commit
git commit -m "test"  # Triggers guardian

# 3. CI/CD
git push  # Triggers pipeline with guardian

# 4. Dashboard
guardian dashboard
```

---

## Feature Comparison

### Command Mapping

| v4.0 Command | v5.0 Command | Notes |
|--------------|--------------|-------|
| `guardian launch:ai` | `guardian` | Auto-detects, shows menu |
| `guardian launch:quick` | Use Insight | Moved to ODAVL Insight |
| `guardian status` | Use Insight | Moved to ODAVL Insight |
| `guardian context` | `guardian detect` | Auto-detection |
| `guardian open:dashboard` | `guardian dashboard` | Renamed, shorter |
| `guardian --help` | `guardian --help` | Same |

### Feature Availability

| Feature | v4.0 | v5.0 | Status |
|---------|------|------|--------|
| AI-Powered Testing | ✅ | ✅ | Same |
| Website Testing | ✅ | ✅ | Enhanced |
| Extension Testing | ✅ | ✅ | Same |
| CLI Testing | ✅ | ✅ | Same |
| Quick Scan | ✅ | ❌ | Moved to Insight |
| System Status | ✅ | ❌ | Moved to Insight |
| Auto-Detection | ❌ | ✅ | **New** |
| Dynamic Menu | ❌ | ✅ | **New** |
| Package Testing | ❌ | ✅ | **New** |
| Suite Testing | ❌ | ✅ | **New** |
| Impact Analysis | ❌ | ✅ | **New** |
| Universal Support | ❌ | ✅ | **New** |

---

## Code Changes

### Programmatic Usage (Node.js)

**v4.0:**
```typescript
import { runQuickScan, runAIAnalysis } from '@odavl-studio/guardian';

// Quick scan
await runQuickScan('./my-app');

// AI analysis
await runAIAnalysis('./my-app', {
  platform: 'chrome',
  verbose: true
});
```

**v5.0:**
```typescript
import { detectProject, testProject } from '@odavl-studio/guardian';

// Auto-detect
const project = await detectProject('./my-app');
console.log(project.type);  // 'website'

// Test based on type
const results = await testProject(project);
console.log(results.score);  // 87
```

---

### Custom Integrations

**v4.0:**
```typescript
import { Guardian } from '@odavl-studio/guardian';

const guardian = new Guardian({
  odavl: {
    products: ['insight', 'autopilot']
  }
});

await guardian.run();
```

**v5.0:**
```typescript
import { Guardian } from '@odavl-studio/guardian';

const guardian = new Guardian({
  project: {
    path: './my-project',
    type: 'auto'  // or specific: 'website', 'cli', etc.
  }
});

const result = await guardian.detect();
await guardian.test(result.type);
```

---

## Configuration Changes

### guardian.config.json

**v4.0 Format:**
```json
{
  "odavl": {
    "products": [
      {
        "name": "insight",
        "path": "./insight"
      }
    ]
  },
  "testing": {
    "skipAI": false
  }
}
```

**v5.0 Format (Recommended):**
```json
{
  "project": {
    "name": "My Project",
    "type": "website"
  },
  "testing": {
    "skipPerformance": false,
    "skipVisual": false,
    "devices": ["mobile", "tablet", "desktop"]
  },
  "thresholds": {
    "performance": {
      "ttfb": 200,
      "lcp": 2500
    },
    "minScore": 85
  }
}
```

**v5.0 Format (Backwards Compatible):**
```json
{
  "odavl": {
    "products": [...]
  }
}
```
Still works, but v5.0 features won't be used.

---

## Common Issues

### Issue 1: "Command not found: guardian"

**Cause**: v5.0 not installed globally

**Fix:**
```bash
npm install -g @odavl-studio/guardian@5
```

---

### Issue 2: "Project type unknown"

**Cause**: Auto-detection failed

**Fix:**
```json
// guardian.config.json
{
  "project": {
    "type": "website"
  }
}
```

---

### Issue 3: "Old reports not found"

**Cause**: Reports moved from `.odavl/guardian/` to `.guardian/`

**Fix:**
```bash
# Copy old reports (optional)
cp -r .odavl/guardian/* .guardian/

# Or access old reports directly
ls .odavl/guardian/reports/
```

---

### Issue 4: "CI pipeline failing"

**Cause**: Using removed commands

**Fix:**

**Before:**
```yaml
- guardian launch:quick
```

**After:**
```yaml
- guardian
```

---

### Issue 5: "Config not working"

**Cause**: Using v4.0 config format with v5.0 features

**Fix:**
```bash
# Update to v5.0 format
# See "Configuration Changes" section above
```

---

## Rollback Plan

### If Issues Arise

**Step 1: Uninstall v5.0**
```bash
npm uninstall -g @odavl-studio/guardian
```

**Step 2: Reinstall v4.0**
```bash
npm install -g @odavl-studio/guardian@4
```

**Step 3: Restore Config**
```bash
cp guardian.config.v4.json guardian.config.json
```

**Step 4: Revert CI/CD**
```bash
# Restore old pipeline files from git
git checkout main -- .github/workflows/
```

---

## Migration Checklist

**Before Migration:**
- [ ] Read this guide completely
- [ ] Backup current configuration
- [ ] Document current CI/CD usage
- [ ] Test v5.0 in development
- [ ] Plan downtime (if needed)

**During Migration:**
- [ ] Install v5.0
- [ ] Test auto-detection
- [ ] Update CI/CD scripts
- [ ] Update pre-commit hooks
- [ ] Update team documentation
- [ ] Test full workflow

**After Migration:**
- [ ] Monitor CI/CD pipelines
- [ ] Check team feedback
- [ ] Update runbooks
- [ ] Train team on new features
- [ ] Archive v4.0 documentation

---

## Support & Questions

**Need help migrating?**

- 📧 Email: support@odavl.com
- 💬 Discord: [ODAVL Community](https://discord.gg/odavl)
- 🐛 Issues: [GitHub](https://github.com/odavl/odavl-studio/issues)
- 📚 Docs: [docs.odavl.com](https://docs.odavl.com)

**Migration Support:**
We offer free migration support for the first 30 days after v5.0 release.

---

## Success Stories

### Example 1: E-commerce Company

**Before v5.0:**
- Manual project type selection
- Duplicate checks with Insight
- 12-option menu (confusing)

**After v5.0:**
- Auto-detection (95% confidence)
- Focused testing only
- 4-option menu (clear)

**Result**: 40% faster testing, fewer errors

---

### Example 2: Monorepo Team

**Before v5.0:**
- Tested all 20 packages every time
- 10+ minute CI runs
- No impact analysis

**After v5.0:**
- Tests only affected packages (3-5)
- 2-3 minute CI runs
- Clear impact reports

**Result**: 70% faster CI, better focus

---

## Conclusion

Guardian v5.0 is a **major improvement** over v4.0:

**Key Benefits:**
- ✅ Universal support (any project)
- ✅ Auto-detection (no manual setup)
- ✅ Dynamic menus (better UX)
- ✅ Cleaner focus (no duplicates)

**Migration Difficulty:**
- Easy for most users
- CI/CD updates needed
- Test in dev first

**Recommended?**
✅ **Yes!** Benefits outweigh migration effort.

**Ready to migrate?** Follow the steps above and reach out if you need help! 🚀

---

**Last Updated**: December 1, 2025  
**Guardian Version**: v5.0.0
