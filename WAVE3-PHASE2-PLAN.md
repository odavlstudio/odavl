# Wave 3 – Phase 2 Implementation Plan

**Branch**: `odavl/wave3-phase2-20251012`  
**Objectives**: M1 (Website Performance & SEO) + M2 (PowerShell Tool Standardization) + M3 (CLI Phase Documentation)  
**Safety Level**: MODERATE (infrastructure enhancements with comprehensive documentation)  
**Date Created**: October 12, 2025

## 🎯 Implementation Overview

This phase focuses on three critical infrastructure enhancements that will improve ODAVL's web presence, tooling consistency, and developer experience through enhanced documentation.

### **Batch Strategy**

- **Commit 1**: M1 (Website) + M2 (PowerShell) - Infrastructure optimizations
- **Commit 2**: M3 (CLI Documentation) - Developer experience enhancements

## 📋 Detailed Implementation Plan

### **M1: Website Performance & SEO Enhancement**

**Target Directory**: `odavl-website/`  
**Current State**: Next.js 15 with i18n, bundle analyzer, basic SEO metadata  
**Enhancement Goals**: Core Web Vitals optimization, comprehensive SEO, performance monitoring

#### **Files to Modify (3 files)**

1. **`odavl-website/next.config.ts`** (~35 lines)
   - Add image optimization settings for better Core Web Vitals
   - Configure compression and caching headers
   - Add performance monitoring webpack plugin integration
   - Enhance existing config without breaking i18n or bundle analyzer

2. **`odavl-website/src/lib/seo.ts`** (NEW file, ~40 lines)
   - Create comprehensive SEO metadata generator
   - OpenGraph, Twitter Card, structured data (JSON-LD)
   - Dynamic metadata for different page types
   - Schema.org markup for organization and software

3. **`odavl-website/src/utils/performance.ts`** (NEW file, ~35 lines)
   - Lightweight performance monitoring utility
   - Core Web Vitals tracking (CLS, FID, LCP)
   - No external dependencies - uses native Performance API
   - Minimal overhead logging for production use

#### **Technical Approach**

**Image Optimization**:
```typescript
// Enhanced image config in next.config.ts
images: {
  formats: ['image/webp', 'image/avif'],
  minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256],
  loader: 'default',
  unoptimized: false,
}
```

**SEO Enhancement**:
```typescript
// Dynamic metadata generation
export function generateSEOMetadata(page: PageType): Metadata {
  return {
    title: `${page.title} | ODAVL`,
    description: page.description,
    openGraph: { /* comprehensive OG tags */ },
    twitter: { /* Twitter card optimization */ },
    robots: { index: true, follow: true },
    alternates: { canonical: page.url }
  };
}
```

**Performance Monitoring**:
```typescript
// Native Web Vitals tracking
export function trackWebVitals() {
  if (typeof window !== 'undefined') {
    import('web-vitals').then(({ getCLS, getFID, getLCP }) => {
      getCLS(metric => console.log('CLS:', metric));
      getFID(metric => console.log('FID:', metric));
      getLCP(metric => console.log('LCP:', metric));
    });
  }
}
```

### **M2: PowerShell Tool Standardization**

**Target Directory**: `tools/`  
**Current State**: 8 PowerShell scripts with inconsistent output formats  
**Enhancement Goals**: Unified JSON output, standardized error handling, cross-platform compatibility

#### **Files to Modify (4 files)**

1. **`tools/golden.ps1`** (~30 lines modified)
   - Standardize JSON output format with consistent schema
   - Add `-Json` parameter for structured output mode
   - Enhance error handling with exit codes (0=success, 1=warnings, 999=error)
   - Ensure PowerShell 5.1 + PowerShell 7+ compatibility

2. **`tools/policy-guard.ps1`** (~25 lines modified)
   - Implement standard JSON response format
   - Add consistent exit code handling (0=pass, 1=violations, 999=error)
   - Enhance violation reporting with structured error messages
   - Cross-platform path handling improvements

3. **`tools/security-scan.ps1`** (~20 lines modified)
   - Already has good JSON support - standardize schema
   - Add consistent timestamp format (ISO 8601)
   - Enhance error boundary handling for npm audit failures
   - Improve license scanning accuracy

4. **`tools/common.ps1`** (NEW file, ~40 lines)
   - Shared PowerShell functions for consistent behavior
   - Standard JSON response formatter
   - Common error handling patterns
   - Cross-platform compatibility utilities

#### **Technical Approach**

**Standard JSON Schema**:
```powershell
# Common response format for all tools
$response = @{
    tool = "golden" | "policy-guard" | "security-scan"
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
    status = "PASS" | "WARN" | "FAIL" | "ERROR"
    data = @{ /* tool-specific results */ }
    errors = @() # Array of error messages
}
```

**Cross-Platform Compatibility**:
```powershell
# PowerShell 5.1 + 7+ compatibility checks
if ($PSVersionTable.PSVersion.Major -lt 6) {
    # Windows PowerShell 5.1 specific code
} else {
    # PowerShell 7+ cross-platform code
}
```

**Error Handling Pattern**:
```powershell
try {
    # Main tool logic
    $response.status = "PASS"
    $response.data = $results
} catch {
    $response.status = "ERROR"
    $response.errors += $_.Exception.Message
    return 999
}
```

### **M3: CLI Phase Documentation Enhancement**

**Target Directory**: `apps/cli/src/phases/`  
**Current State**: Basic JSDoc with minimal examples  
**Enhancement Goals**: Comprehensive documentation with usage examples for every exported function

#### **Files to Modify (5 files)**

1. **`apps/cli/src/phases/observe.ts`** (~20 lines added)
   - Enhance existing JSDoc with detailed usage examples
   - Document `observe()` function with parameter examples
   - Add code examples for metrics collection
   - Document error handling patterns

2. **`apps/cli/src/phases/decide.ts`** (~25 lines added)
   - Add comprehensive JSDoc for `decide()` function
   - Document recipe selection logic with examples
   - Explain trust score calculation
   - Add usage examples for different decision scenarios

3. **`apps/cli/src/phases/act.ts`** (~20 lines added)
   - Document `act()` function with safety examples
   - Explain action execution patterns
   - Add examples for different action types
   - Document rollback mechanisms

4. **`apps/cli/src/phases/verify.ts`** (~25 lines added)
   - Add comprehensive verification documentation
   - Document quality gate checking
   - Add examples for different verification scenarios
   - Explain delta calculation logic

5. **`apps/cli/src/phases/learn.ts`** (~20 lines added)
   - Document learning algorithm with examples
   - Explain trust score updates
   - Add usage examples for different learning outcomes
   - Document history tracking patterns

#### **Technical Approach**

**JSDoc Enhancement Pattern**:
```typescript
/**
 * Executes the OBSERVE phase of the ODAVL cycle.
 * Collects current code quality metrics including ESLint warnings and TypeScript errors.
 * 
 * @returns Promise<Metrics> The collected quality metrics
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const metrics = await observe();
 * console.log(`ESLint warnings: ${metrics.eslintWarnings}`);
 * console.log(`TypeScript errors: ${metrics.typeErrors}`);
 * ```
 * 
 * @example
 * ```typescript
 * // Error handling
 * try {
 *   const metrics = await observe();
 *   if (metrics.eslintWarnings > 0) {
 *     console.log('Code quality issues detected');
 *   }
 * } catch (error) {
 *   console.error('Observation failed:', error);
 * }
 * ```
 */
export async function observe(): Promise<Metrics> {
```

## 🛡️ Safety Compliance Analysis

### **Risk Assessment**: MODERATE

| Safety Metric | Target | Estimated | Status |
|---------------|--------|-----------|--------|
| **File Count** | ≤ 10 files | 9 files | ✅ SAFE |
| **Lines per File** | ≤ 40 lines | Max 40 lines | ✅ SAFE |
| **Protected Paths** | None touched | None | ✅ SAFE |
| **Breaking Changes** | None | None | ✅ SAFE |
| **External Dependencies** | None added | None | ✅ SAFE |

### **File Modification Summary**

**Commit 1 (Infrastructure)**:
- `odavl-website/next.config.ts` (modify ~35 lines)
- `odavl-website/src/lib/seo.ts` (create ~40 lines)
- `odavl-website/src/utils/performance.ts` (create ~35 lines)
- `tools/golden.ps1` (modify ~30 lines)
- `tools/policy-guard.ps1` (modify ~25 lines)
- `tools/security-scan.ps1` (modify ~20 lines)
- `tools/common.ps1` (create ~40 lines)

**Commit 2 (Documentation)**:
- `apps/cli/src/phases/observe.ts` (add ~20 lines JSDoc)
- `apps/cli/src/phases/decide.ts` (add ~25 lines JSDoc)
- `apps/cli/src/phases/act.ts` (add ~20 lines JSDoc)
- `apps/cli/src/phases/verify.ts` (add ~25 lines JSDoc)
- `apps/cli/src/phases/learn.ts` (add ~20 lines JSDoc)

**Total**: 9 files, ~335 lines added/modified

### **Protected Path Analysis**
✅ **No protected paths affected**:
- No modifications to `**/security/**`
- No modifications to `**/*.spec.*` files
- No modifications to `**/public-api/**`

### **Quality Gates**
- TypeScript compilation must pass
- ESLint rules must pass
- Website build must succeed
- PowerShell scripts must execute without syntax errors
- All existing functionality preserved

## 🔄 Rollback Strategy

### **Instant Rollback Options**

1. **Git Branch Reset**:
   ```bash
   git checkout main
   git branch -D odavl/wave3-phase2-20251012
   ```

2. **Commit Reversion**:
   ```bash
   git revert <commit-hash> --no-edit
   ```

3. **File-Level Restoration**:
   ```bash
   git checkout main -- odavl-website/next.config.ts
   git checkout main -- tools/
   git checkout main -- apps/cli/src/phases/
   ```

### **Rollback Testing Plan**

Before implementation, verify that:
1. Current website builds successfully
2. PowerShell tools execute without errors
3. CLI phases compile and run correctly
4. Full golden check passes (`.\tools\golden.ps1`)

## 📊 Success Metrics

### **Performance Targets (M1)**
- ✅ Website build time remains under 60 seconds
- ✅ Bundle size increase ≤ 5KB
- ✅ Core Web Vitals tracking functional
- ✅ SEO metadata complete on all pages

### **Standardization Targets (M2)**  
- ✅ All PowerShell tools support `--json` flag
- ✅ Consistent exit codes (0/1/999) across all tools
- ✅ Standard timestamp format (ISO 8601)
- ✅ Cross-platform compatibility maintained

### **Documentation Targets (M3)**
- ✅ Every exported function has usage examples
- ✅ JSDoc coverage ≥ 95% for phase functions
- ✅ Documentation generates without TypeScript errors
- ✅ Code examples are syntactically valid

## ⚡ Implementation Timeline

### **Phase 1: Infrastructure (M1 + M2)**
- **Duration**: ~30 minutes
- **Scope**: Website optimization + PowerShell standardization
- **Validation**: Build tests, PowerShell execution tests

### **Phase 2: Documentation (M3)**
- **Duration**: ~20 minutes  
- **Scope**: CLI phase JSDoc enhancements
- **Validation**: TypeScript compilation, documentation generation

### **Total Estimated Time**: ~50 minutes

## 🔍 Pre-Implementation Verification

Before starting implementation, validate:

1. **Current State Health**:
   ```bash
   pnpm typecheck  # Must pass
   pnpm lint       # Must pass
   .\tools\golden.ps1  # Must pass
   ```

2. **Branch Creation**:
   ```bash
   git checkout -b odavl/wave3-phase2-20251012
   ```

3. **Baseline Metrics**:
   - Website build time: Measure current performance
   - PowerShell tool execution: Verify all tools work
   - CLI phase compilation: Ensure TypeScript compiles

## 🎯 Expected Outcomes

### **M1 Deliverables**
- Enhanced Next.js configuration with optimized image handling
- Comprehensive SEO metadata system with OpenGraph support
- Lightweight performance monitoring with Core Web Vitals tracking

### **M2 Deliverables**  
- Standardized JSON output format across all PowerShell tools
- Consistent error handling and exit code patterns
- Cross-platform PowerShell compatibility (Windows PowerShell + PowerShell Core)

### **M3 Deliverables**
- Comprehensive JSDoc documentation with practical usage examples
- Complete parameter documentation for all exported functions
- Enhanced developer experience with clear API documentation

---

**Ready for Approval**: This plan provides comprehensive infrastructure enhancements while maintaining strict ODAVL safety protocols. Implementation will proceed in two controlled commits with full verification at each stage.