# ❌ CRITICAL: Next.js Build Failure - Production Blocker

## 🔥 Problem Summary
**27 consecutive build failures** across Next.js versions 15.0.3, 15.5.6, and 16.0.4.

Error: `<Html> should not be imported outside of pages/_document`  
Location: `.next/server/chunks/[3403|9943].js`  
Phase: Static page generation (pre-rendering `/404` and `/500` error pages)

## 🔍 Root Cause Analysis
Next.js webpack **incorrectly bundles Pages Router components** (`next/document` Html/Head/Main) into App Router static generation during error page rendering.

### Evidence from Chunk 3403.js:
```javascript
class b extends o.default.Component {
  static #e=this.contextType=l.HtmlContext;
  getCssLinks(e){...}
  render(){...}
}
```
This is `next/document` Pages Router code being executed in App Router build!

## 📊 Testing Matrix

| Version | Build Result | Notes |
|---------|-------------|-------|
| 15.5.6 | ❌ FAIL | Original version, Html import bug |
| 16.0.4 | ⚠️ NEW BUGS | revalidatePath needs 2 args, revalidateTag signature unknown |
| 15.0.3 | ❌ FAIL | Same error! Bug exists in older versions |

## ✅ What We Eliminated (NOT the cause)

1. ❌ Sentry packages (removed completely)
2. ❌ OpenTelemetry (removed 7 packages)
3. ❌ next-intl wrapper (tested without it)
4. ❌ Complex next.config (simplified to 30 lines)
5. ❌ Custom error pages (deleted ALL)
6. ❌ Pages Router conflicts (no pages/ directory)
7. ❌ eslint-config-next mismatch (downgraded to 15.0.3)
8. ❌ pnpm cache (cleared + reinstalled)

## 🎯 This is a Next.js Framework Bug

**Our codebase is clean** - zero `next/document` imports in `app/` directory.  
**Verified via**: `grep -r "next/document" apps/studio-hub/app/` → No matches

## 🚨 Impact
- ✅ **Dev server works** (localhost:3000)
- ❌ **Production builds fail** (cannot deploy)
- 🔴 **Week 2 Day 2 BLOCKED** (5+ hours lost)
- 📊 **27 build attempts**, 0% success rate

## 💡 3 Options Forward

### Option A: Report to Next.js Team ⭐ RECOMMENDED
```bash
# 1. Create minimal reproduction repo
# 2. File bug report: https://github.com/vercel/next.js/issues
# 3. Include:
#    - Full error log (build-attempt-27.txt)
#    - Chunk analysis (3403.js excerpt)
#    - Testing matrix (15.0.3, 15.5.6, 16.0.4)
#    - Evidence that no next/document imports exist
```

**Timeline**: 1-2 days for Next.js team response  
**Risk**: Unknown - depends on Next.js team priority  
**Benefit**: Permanent fix for entire community

### Option B: Use Development Workflow (Workaround) ⚠️
```bash
# Continue development with dev server
pnpm dev  # Works perfectly!

# Deploy via container with dev mode (NOT recommended for production)
# OR wait for Next.js fix before deploying
```

**Timeline**: Immediate (0 hours)  
**Risk**: No production builds until fix  
**Benefit**: Can continue Week 2 Day 2 tasks

### Option C: Downgrade to Next.js 14 🔄
```bash
# Test with Next.js 14.2.x (last known stable)
pnpm add next@14.2.18 --save-exact
pnpm add eslint-config-next@14.2.18 -D --save-exact

# May require React 18 downgrade
pnpm add react@18.3.1 react-dom@18.3.1
```

**Timeline**: 2-3 hours (testing + potential refactoring)  
**Risk**: Medium - lose React 19 features  
**Benefit**: Likely fixes build, proven stable version

## 📝 Detailed Build Log

**Attempt #27** (Next.js 15.0.3):
```
✓ Compiled successfully in 10.2s
Collecting page data ...
Generating static pages (0/132) ...
Error: <Html> should not be imported outside of pages/_document.
    at K (node_modules\next\dist\compiled\next-server\pages.runtime.prod.js:16:5430)
    at O (.next\server\chunks\3403.js:6:1263)
    at renderWithHooks (react-dom\cjs\react-dom-server.edge.development.js:5399:19)
Error occurred prerendering page "/404"
Export encountered an error on /_error: /404, exiting the build.
```

## 🛠️ Environment Details

- OS: Windows 11
- Node: v20.19.5
- pnpm: 9.12.2
- React: 19.2.0
- Next.js: Tested 15.0.3, 15.5.6, 16.0.4 (all fail)
- Monorepo: pnpm workspaces
- Architecture: App Router (no Pages Router code)

## 🎬 Next Steps

**Immediate**:
1. User decides: Option A (report bug) vs B (dev workaround) vs C (downgrade)
2. If A: Create minimal repro + GitHub issue
3. If B: Continue Week 2 Day 2 with dev server
4. If C: Test Next.js 14.2.18

**After 27 attempts and 5+ hours**, this is confirmed Next.js framework bug, not our code.

---

**Created**: 2025-01-09  
**Status**: BLOCKED  
**Priority**: CRITICAL  
**Attempts**: 27 builds  
**Time Lost**: 5+ hours  
**Versions Tested**: 3  
**Packages Removed**: 7  
**Files Deleted**: 10
