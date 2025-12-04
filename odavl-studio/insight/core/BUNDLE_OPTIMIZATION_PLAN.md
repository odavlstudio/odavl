# Insight Core Bundle Optimization Plan

## Current State
- **detector/index.mjs**: 10.10 MB (CRITICAL - needs reduction)
- **learning/index.mjs**: 0.03 MB (acceptable)
- **index.mjs**: 0.00 MB (excellent)
- **server.mjs**: 0.00 MB (excellent)

## Problem Analysis
The file `src/detector/index.ts` exports **ALL 12 detectors** in a single bundle, causing:
1. Bundle bloat (10 MB - too large for web distribution)
2. Slow startup time (loads all detectors even if only 1 needed)
3. Memory overhead (all code in memory at once)
4. Poor tree-shaking (entire detector system bundled)

## Solution: Code Splitting Strategy

### Phase 1: Individual Detector Exports (Target: 70% reduction)

**Current Structure:**
```
detector/index.ts → exports all 12 detectors → 10 MB bundle
```

**New Structure:**
```
detector/
├── core.ts (shared utilities, 100-200 KB)
├── typescript.ts (TSDetector only, 500 KB)
├── eslint.ts (ESLintDetector only, 300 KB)
├── security.ts (SecurityDetector only, 800 KB)
├── performance.ts (PerformanceDetector only, 600 KB)
├── complexity.ts (ComplexityDetector only, 400 KB)
├── python.ts (Python detectors, 700 KB)
├── java.ts (Java detectors, 600 KB)
└── index.ts (re-exports for convenience, 3 MB total)
```

### Phase 2: Lazy Loading in Extension

**Current (Extension):**
```typescript
import { TSDetector, ESLintDetector, SecurityDetector } from '@odavl-studio/insight-core/detector';
// Loads ALL 10 MB at startup ❌
```

**New (Extension):**
```typescript
// Lazy load only when needed
const { TSDetector } = await import('@odavl-studio/insight-core/detector/typescript');
const { ESLintDetector } = await import('@odavl-studio/insight-core/detector/eslint');
// Loads only 800 KB (80% reduction) ✅
```

### Phase 3: External Dependencies Optimization

**Current Heavy Dependencies:**
1. TensorFlow.js (learning module) - 108 MB
2. Multiple AI SDKs (Anthropic + OpenAI) - overlap
3. Tree-sitting (TypeScript AST parsing) - large binary

**Optimization Strategy:**
1. Move TensorFlow to `optionalDependencies` (only for ML training)
2. Remove OpenAI SDK (use Anthropic only)
3. Use dynamic imports for heavy parsers

## Implementation Steps

### Step 1: Create Individual Detector Files (1 day)

Create separate entry points:
```bash
detector/
├── core.ts       # Shared utilities
├── typescript.ts # export { TSDetector }
├── eslint.ts     # export { ESLintDetector }
├── import.ts     # export { ImportDetector }
├── package.ts    # export { PackageDetector }
├── runtime.ts    # export { RuntimeDetector }
├── build.ts      # export { BuildDetector }
├── security.ts   # export { SecurityDetector }
├── circular.ts   # export { CircularDependencyDetector }
├── isolation.ts  # export { ComponentIsolationDetector }
├── performance.ts # export { PerformanceDetector }
├── network.ts    # export { NetworkDetector }
├── complexity.ts # export { ComplexityDetector }
├── python.ts     # export { Python detectors }
├── java.ts       # export { Java detectors }
└── index.ts      # Re-exports all (for CLI/full use)
```

### Step 2: Update package.json Exports (1 hour)

```json
{
  "exports": {
    "./detector": "./dist/detector/index.mjs",
    "./detector/typescript": "./dist/detector/typescript.mjs",
    "./detector/eslint": "./dist/detector/eslint.mjs",
    "./detector/security": "./dist/detector/security.mjs",
    "./detector/performance": "./dist/detector/performance.mjs",
    "./detector/complexity": "./dist/detector/complexity.mjs",
    "./detector/python": "./dist/detector/python.mjs",
    "./detector/java": "./dist/detector/java.mjs"
  }
}
```

### Step 3: Update Build Script (1 hour)

```json
{
  "build": "tsup src/index.ts src/server.ts src/learning/index.ts src/detector/*.ts --format esm,cjs --dts --splitting"
}
```

**Key flags:**
- `--splitting`: Enable code splitting
- `src/detector/*.ts`: Build each detector separately

### Step 4: Update Extension to Use Lazy Loading (2 hours)

**Before:**
```typescript
import { TSDetector, ESLintDetector } from '@odavl-studio/insight-core/detector';
// 10 MB loaded at activation
```

**After:**
```typescript
async function analyzeTypeScript(uri: vscode.Uri) {
  const { TSDetector } = await import('@odavl-studio/insight-core/detector/typescript');
  const detector = new TSDetector(workspaceRoot);
  return detector.analyze();
}
```

### Step 5: Verify Bundle Sizes (30 minutes)

```bash
cd odavl-studio/insight/core
pnpm build

# Check individual sizes
ls -lh dist/detector/*.mjs

# Expected results:
# core.mjs: 100 KB
# typescript.mjs: 500 KB
# eslint.mjs: 300 KB
# security.mjs: 800 KB
# performance.mjs: 600 KB
# complexity.mjs: 400 KB
# python.mjs: 700 KB
# java.mjs: 600 KB
# index.mjs: 3 MB (all combined)
```

## Success Metrics

### Bundle Size Goals
- ✅ **Excellent**: < 3 MB total (70% reduction)
- ✅ **Good**: < 5 MB total (50% reduction)
- ⚠️ **Acceptable**: < 7 MB total (30% reduction)
- ❌ **Not acceptable**: > 8 MB (current: 10 MB)

### Performance Goals
- Extension startup: < 200ms (currently ~500ms)
- Individual detector load: < 50ms (currently 200ms+)
- Memory usage: < 100 MB (currently 250 MB)

### Developer Experience Goals
- Easy to use: `import { TSDetector } from '@odavl-studio/insight-core/detector/typescript'`
- Type-safe: Full TypeScript support
- Backward compatible: Old imports still work (full bundle)

## Timeline

- **Day 1**: Create individual detector files (Step 1)
- **Day 2**: Update build system & exports (Steps 2-3)
- **Day 3**: Update extension for lazy loading (Step 4)
- **Day 4**: Testing & verification (Step 5)
- **Day 5**: Documentation & cleanup

**Total**: 5 days (1 week)

## Risk Mitigation

### Risk 1: Breaking Changes for Consumers
**Mitigation**: Keep `detector/index.ts` as full export (backward compatible)

### Risk 2: Increased Complexity
**Mitigation**: Clear documentation + simple import patterns

### Risk 3: Build Time Increase
**Mitigation**: Use tsup's `--splitting` for efficient bundling

## Next Steps

1. ✅ Create this optimization plan
2. ⏳ Implement Step 1 (individual files)
3. ⏳ Implement Steps 2-3 (build system)
4. ⏳ Implement Step 4 (extension updates)
5. ⏳ Verify bundle sizes (Step 5)
6. ⏳ Update documentation

---

**Status**: Planning complete, ready for implementation
**Priority**: HIGH (blocks Insight launch)
**Estimated Impact**: 70% bundle size reduction (10 MB → 3 MB)
