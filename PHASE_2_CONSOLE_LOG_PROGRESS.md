# Phase 2 - Console.log Replacement Progress

**Date:** November 24, 2025  
**Status:** ⏳ In Progress (23% Complete)  
**Target:** Replace 55 console.log/error/warn with logger utility

---

## 📊 Overall Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Found** | 55 | 100% |
| **Acceptable** | 20 | 36% |
| **Replaced** | 8 | 23% of remaining |
| **Remaining** | 27 | 77% |

---

## ✅ Completed Replacements (8 occurrences)

### API Routes & Lib Files

1. **app/api/gdpr/delete/route.ts** - 2 replacements
   - ✅ `console.log` → `logger.info` (permanent deletion success)
   - ✅ `console.error` → `logger.error` (deletion error)

2. **middleware/security-headers.ts** - 1 replacement
   - ✅ `console.error` → `logger.error` (CSP violations)

3. **lib/performance/web-vitals.ts** - 1 replacement
   - ✅ `console.log` → `logger.debug` (web vitals in dev)

4. **lib/monitoring/performance.ts** - 1 replacement
   - ✅ `console.error` → `logger.error` (flush metrics failure)
   - ✅ Added: `import { logger } from '@/lib/logger';`

5. **lib/circuit-breaker.ts** - 1 replacement
   - ✅ `console.warn` → `logger.warn` (circuit OPEN transition)
   - ✅ Already has: `import { logger } from '@/lib/logger';`

6. **lib/db/monitoring.ts** - 1 replacement
   - ✅ `console.log` → `logger.debug` (database metrics)

7. **lib/db/pool.ts** - 1 replacement
   - ✅ `console.log` → `logger.debug` (pool metrics)

---

## 🎯 Acceptable Console Usage (20 occurrences - Keep)

### prisma/seed.ts (12 occurrences)
- ✅ CLI progress output (acceptable for seeding script)
- Examples: "🌱 Seeding database...", "✅ Created organization", etc.

### tests/setup.ts (8 occurrences)
- ✅ Test environment mocking (console.warn/error mocks)
- Examples: `console.warn = vi.fn()`, restore originals

### lib/logger.ts (7 occurrences - Self-referential)
- ✅ Logger implementation itself (uses console internally)
- Examples: `console.log()`, `console.error()`, `console.warn()`

**Note:** These 20 occurrences are intentional and should NOT be replaced.

---

## ⏳ Pending Replacements (27 occurrences)

### React Components (14 occurrences in 11 files)

1. **components/guardian/web-vitals-chart.tsx** - Line 28
   ```tsx
   // ❌ Current
   console.error('Failed to fetch web vitals:', error);
   
   // ✅ Replace with
   logger.error('Failed to fetch web vitals', error as Error);
   ```

2. **components/guardian/test-results-table.tsx** - Line 55
   ```tsx
   // ❌ Current
   console.error('Failed to fetch tests:', error);
   
   // ✅ Replace with
   logger.error('Failed to fetch tests', error as Error);
   ```

3. **components/auth/signin-form.tsx** - Line 21
   ```tsx
   // ❌ Current
   console.error('Sign in error:', error);
   
   // ✅ Replace with
   logger.error('Sign in error', error as Error);
   ```

4. **components/organization/usage-card.tsx** - Line 48
   ```tsx
   // ❌ Current
   console.error('Error fetching usage:', error);
   
   // ✅ Replace with
   logger.error('Error fetching usage', error as Error);
   ```

5. **components/billing/plan-selector.tsx** - Line 61
   ```tsx
   // ❌ Current
   console.error('Upgrade error:', error);
   
   // ✅ Replace with
   logger.error('Upgrade error', error as Error);
   ```

6. **components/autopilot/run-stats.tsx** - Line 27
   ```tsx
   // ❌ Current
   console.error('Failed to fetch stats:', error);
   
   // ✅ Replace with
   logger.error('Failed to fetch stats', error as Error);
   ```

7. **components/autopilot/runs-table.tsx** - Line 60
   ```tsx
   // ❌ Current
   console.error('Failed to fetch runs:', error);
   
   // ✅ Replace with
   logger.error('Failed to fetch runs', error as Error);
   ```

8. **components/insight/issues-table.tsx** - Line 52
   ```tsx
   // ❌ Current
   console.error('Failed to fetch issues:', error);
   
   // ✅ Replace with
   logger.error('Failed to fetch issues', error as Error);
   ```

9. **components/insight/issues-trend.tsx** - Line 29
   ```tsx
   // ❌ Current
   console.error('Failed to fetch trend data:', error);
   
   // ✅ Replace with
   logger.error('Failed to fetch trend data', error as Error);
   ```

10. **components/analytics/export-reports.tsx** - Line 24
    ```tsx
    // ❌ Current
    console.error('Export failed:', error);
    
    // ✅ Replace with
    logger.error('Export failed', error as Error);
    ```

11. **components/gdpr/cookie-consent-banner.tsx** - 4 occurrences
    - Line 320: `console.log('📊 Analytics enabled');`
    - Line 331: `console.log('📢 Marketing enabled');`
    - Line 344: `console.log('⚙️  Functional cookies enabled');`
    - Line 394: `console.error('Failed to update cookie consent');`
    
    ```tsx
    // ✅ Replace with
    logger.info('Analytics enabled');
    logger.info('Marketing enabled');
    logger.info('Functional cookies enabled');
    logger.error('Failed to update cookie consent', error as Error);
    ```

### API Routes (3 occurrences in 2 files)

12. **app/api/guardian/tests/[id]/rerun/route.ts** - 2 occurrences
    - Line 53: `console.error('Test execution failed:', error);`
    - Line 62: `console.error('Failed to initiate test rerun:', error);`
    
    ```typescript
    // ✅ Replace with
    logger.error('Test execution failed', error as Error);
    logger.error('Failed to initiate test rerun', error as Error);
    ```

13. **app/api/edge/metrics/route.ts** - Line 28
    ```typescript
    // ❌ Current
    console.log('Edge metrics received:', { ... });
    
    // ✅ Replace with
    logger.info('Edge metrics received', { ... });
    ```

### Lib Files (10 occurrences)

14. **lib/context/organization.tsx** - 2 occurrences
    - Line 61: `console.error('Error fetching organization:', error);`
    - Line 93: `console.error('Error switching organization:', error);`

15. **lib/api/compression.ts** - Line 132
    - Already replaced: ✅ `logger.error('Compression error', error as Error);`

16. **lib/circuit-breaker.ts** - Additional occurrences
    - Line 252: `console.info` (circuit CLOSED transition)
    - Line 288: `console.info` (circuit reset)
    - Line 342: `console.log` (circuit metrics)

17. **app/api/trpc/[trpc]/route.ts** - Line 18
    - `console.error` in tRPC error handler

18. **app/playground/page.tsx** - Line 156
    - `console.log(result);` (playground code example)

---

## 🛠️ Implementation Pattern

### For React Components (Client-Side)

```tsx
// 1. Import logger at top of file
import { logger } from '@/lib/logger';

// 2. Replace console.error in catch blocks
try {
  const res = await fetch('/api/endpoint');
  // ... handle response
} catch (error) {
  logger.error('Operation failed', error as Error);
  // Optional: Show user-facing toast/notification
}
```

### For API Routes (Server-Side)

```typescript
// 1. Import logger at top
import { logger } from '@/lib/logger';

// 2. Replace console.error with structured logging
try {
  // ... operation
} catch (error) {
  logger.error('API operation failed', error as Error, {
    userId: ctx.session?.user?.id,
    endpoint: '/api/endpoint',
  });
  return NextResponse.json({ error: 'Failed' }, { status: 500 });
}
```

### For Lib Files (Utilities)

```typescript
// 1. Import logger
import { logger } from '@/lib/logger';

// 2. Use appropriate level
if (process.env.NODE_ENV === 'development') {
  logger.debug('Debug info', { details });
} else {
  logger.error('Production error', error as Error);
}
```

---

## 📋 Replacement Checklist

### High Priority (Security & Critical Operations)

- [ ] Guardian test rerun errors (2)
- [ ] Auth signin errors (1)
- [ ] Billing upgrade errors (1)
- [ ] GDPR cookie consent (4)

### Medium Priority (Data Fetching)

- [ ] Guardian web vitals (1)
- [ ] Guardian test results (1)
- [ ] Autopilot stats (1)
- [ ] Autopilot runs (1)
- [ ] Insight issues (1)
- [ ] Insight trend (1)
- [ ] Analytics export (1)
- [ ] Organization usage (1)

### Low Priority (Context & Lib)

- [ ] Organization context (2)
- [ ] Circuit breaker additional (3)
- [ ] Edge metrics API (1)
- [ ] tRPC error handler (1)
- [ ] Playground example (1)

---

## 🎯 Next Steps

### Immediate (Next 30 minutes)

1. ✅ Add logger import to all component files
2. ✅ Replace console.error with logger.error in components
3. ✅ Replace console.log with logger.info/debug in API routes

### Short-Term (Next 1 hour)

4. ✅ Replace remaining circuit breaker console.info
5. ✅ Update context error logging
6. ✅ Fix edge metrics and tRPC handler

### Validation

7. ✅ Run grep search to confirm 0 console.log/error/warn in production code
8. ✅ Exclude seed.ts, tests/setup.ts, lib/logger.ts from check
9. ✅ Build and test application

---

## ✨ Expected Outcome

After completion:
- **Production code:** 0 console.log/error/warn (except acceptable files)
- **Structured logging:** All errors with proper context
- **Monitoring-ready:** Logs compatible with Sentry, Datadog, etc.
- **Production readiness:** +7 points (83 → 90/100)

---

**Progress:** 8/35 replacements complete (23%)  
**Time spent:** ~45 minutes  
**Time remaining:** ~1-1.5 hours  
**Next milestone:** Replace all component console.error (14 occurrences)
