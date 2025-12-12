# Next.js Detector

> **Intelligent detection of Next.js and React-specific issues**  
> Part of ODAVL Insight - Detector #11

## Overview

The Next.js Detector is a specialized analyzer that identifies React and Next.js-specific issues in your application. It focuses on four critical categories that commonly cause production bugs: hydration mismatches, server action issues, suspense boundary problems, and client/server boundary violations.

**Key Features:**
- ⚛️ Next.js 13+ and React 18+ support
- 🎯 4 detection categories with 36 comprehensive tests
- 🚀 Fast analysis (<3s for 500 files, ~0.01s for 10 files)
- 📊 Quality scoring (0-100)
- 🔍 Supports both App Router and Pages Router
- 💡 Actionable fix suggestions
- 🎨 Beautiful CLI output with emoji indicators

## Supported Versions

- **Next.js:** 13.0.0+ (App Router), 12.0.0+ (Pages Router)
- **React:** 18.0.0+ (required for Server Components)
- **Node.js:** 18.0.0+ (recommended)

## Detection Categories

### 1. 💧 Hydration Mismatch Detection

Hydration mismatches occur when server-rendered HTML doesn't match client-rendered output, causing React to throw warnings or errors.

#### What It Detects

**Date/Time Values:**
```tsx
// ❌ BAD: Server renders one time, client re-renders different time
export default function Page() {
  return <div>Current time: {Date.now()}</div>;
}

// ✅ GOOD: Use client-side state
'use client';
import { useState, useEffect } from 'react';

export default function Page() {
  const [time, setTime] = useState<number | null>(null);
  
  useEffect(() => {
    setTime(Date.now());
  }, []);
  
  return <div>Current time: {time ?? 'Loading...'}</div>;
}
```

**Random Values:**
```tsx
// ❌ BAD: Different random value on client vs server
export default function Page() {
  const id = Math.random();
  return <div>ID: {id}</div>;
}

// ✅ GOOD: Generate on client only
'use client';
import { useState } from 'react';

export default function Page() {
  const [id] = useState(() => Math.random());
  return <div>ID: {id}</div>;
}
```

**Browser APIs (window, document, localStorage):**
```tsx
// ❌ BAD: window not available during SSR
export default function Page() {
  const width = window.innerWidth; // ERROR: window is not defined
  return <div>Width: {width}</div>;
}

// ✅ GOOD: Check environment or use useEffect
'use client';
import { useState, useEffect } from 'react';

export default function Page() {
  const [width, setWidth] = useState<number | null>(null);
  
  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);
  
  return <div>Width: {width ?? 'Loading...'}</div>;
}

// ✅ ALSO GOOD: typeof check
export default function Page() {
  const width = typeof window !== 'undefined' ? window.innerWidth : null;
  return <div>Width: {width ?? 'N/A'}</div>;
}
```

**suppressHydrationWarning Usage:**
```tsx
// ⚠️ DETECTED: Should be used sparingly
export default function Page() {
  return (
    <time suppressHydrationWarning>
      {new Date().toLocaleString()}
    </time>
  );
}
```

**Detection Rules:**
- `Date.now()` or `new Date()` in render (outside useEffect)
- `Math.random()` in render
- Direct access to `window`, `document`, `localStorage`, `sessionStorage`
- Usage of `suppressHydrationWarning` prop

**Severity:** High (causes user-visible errors)

---

### 2. 🔧 Server Actions Issues

Server Actions are a Next.js 13+ feature that allows calling server-side functions from client components. Improper usage leads to serialization errors.

#### What It Detects

**Missing 'use server' Directive:**
```tsx
// ❌ BAD: Server action without directive
export async function createUser(data: FormData) {
  'use server'; // Must be at the TOP
  const db = await getDatabase();
  return db.users.create({ data });
}

// ✅ GOOD: Directive at function start
export async function createUser(data: FormData) {
  'use server';
  const db = await getDatabase();
  return db.users.create({ data });
}
```

**Files in /actions/ Directory Without Directive:**
```tsx
// ❌ BAD: app/actions/user-actions.ts without 'use server'
export async function createUser(data: any) {
  // Missing 'use server' directive
  return { success: true };
}

// ✅ GOOD: Add directive at file or function level
'use server';

export async function createUser(data: any) {
  return { success: true };
}
```

**Non-Serializable Return Values:**

**Function Parameters:**
```tsx
// ❌ BAD: Cannot serialize Function type
'use server';
export async function processData(callback: Function) {
  return callback();
}

// ✅ GOOD: Use serializable types or accept primitive callbacks only
'use server';
export async function processData(userId: string) {
  const user = await getUser(userId);
  return { success: true, user };
}
```

**Class Instances:**
```tsx
// ❌ BAD: Cannot serialize class instances
'use server';
export async function createUser(data: any) {
  const user = new User(data); // Class instance
  return user; // ERROR: Not serializable
}

// ✅ GOOD: Return plain objects
'use server';
export async function createUser(data: any) {
  const user = new User(data);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
```

**Detection Rules:**
- Missing `'use server'` directive in server actions
- Files in `/actions/` or `/app/actions/` without directive
- Function parameters with `Function` type
- Return statements with `new ClassName()`
- Return statements with non-serializable types

**Severity:**
- Critical: Missing directive in actions directory
- High: Non-serializable returns
- Medium: Misplaced directive

---

### 3. ⏳ Suspense Boundary Issues

React Suspense enables declarative loading states. Improper usage causes unhandled promises and poor UX.

#### What It Detects

**Async Components Without loading.tsx:**
```tsx
// ❌ BAD: Async component without loading boundary
// app/page.tsx
export default async function Page() {
  const data = await fetchData(); // No loading state!
  return <div>{data}</div>;
}

// ✅ GOOD: Add loading.tsx
// app/loading.tsx
export default function Loading() {
  return <div>Loading...</div>;
}

// app/page.tsx
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

**Async Components Without Suspense Wrapper:**
```tsx
// ❌ BAD: Async component not wrapped
export default function Page() {
  return <AsyncComponent />; // No Suspense boundary
}

// ✅ GOOD: Wrap with Suspense
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AsyncComponent />
    </Suspense>
  );
}
```

**Too Many Nested Suspense Boundaries (>3):**
```tsx
// ⚠️ WARNING: Performance impact
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Suspense fallback={<Loading />}>
        <Suspense fallback={<Loading />}>
          <Suspense fallback={<Loading />}> {/* 4 levels - too deep! */}
            <Content />
          </Suspense>
        </Suspense>
      </Suspense>
    </Suspense>
  );
}

// ✅ BETTER: Flatten structure
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Content /> {/* Components handle their own suspense */}
    </Suspense>
  );
}
```

**Suspense Without Fallback:**
```tsx
// ⚠️ WARNING: Bad UX - no loading indicator
export default function Page() {
  return (
    <Suspense> {/* Missing fallback prop */}
      <AsyncComponent />
    </Suspense>
  );
}

// ✅ GOOD: Always provide fallback
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AsyncComponent />
    </Suspense>
  );
}
```

**Detection Rules:**
- Async function components without `loading.tsx` in same directory
- Async components not wrapped in `<Suspense>`
- More than 3 nested `<Suspense>` boundaries
- `<Suspense>` without `fallback` prop

**Severity:**
- High: Async component without loading boundary
- Medium: Too many nested boundaries
- Low: Missing fallback (has default behavior)

---

### 4. 🔀 Client/Server Boundary Violations

Next.js 13 introduced strict boundaries between client and server code. Mixing them incorrectly causes runtime errors.

#### What It Detects

**Both 'use client' and 'use server' in Same File:**
```tsx
// ❌ BAD: Cannot be both client and server
'use client';
'use server'; // Conflict!

export function ClientComponent() {
  return <button>Click me</button>;
}

export async function serverAction() {
  return { data: 'test' };
}

// ✅ GOOD: Separate files
// ClientComponent.tsx
'use client';
export function ClientComponent() {
  return <button>Click me</button>;
}

// actions.ts
'use server';
export async function serverAction() {
  return { data: 'test' };
}
```

**Server-Only Imports in Client Components:**
```tsx
// ❌ BAD: Cannot import server-only modules in client
'use client';
import fs from 'fs'; // ERROR: fs is Node.js-only
import prisma from '@prisma/client'; // ERROR: Database in client!

export default function Page() {
  return <div>Page</div>;
}

// ✅ GOOD: Use server actions
'use client';
import { getData } from './actions';

export default function Page() {
  const data = getData(); // Server action handles DB
  return <div>{data}</div>;
}

// actions.ts
'use server';
import prisma from '@prisma/client';

export async function getData() {
  return await prisma.user.findMany();
}
```

**Server-Only Modules Detected:**
- Node.js built-ins: `fs`, `path`, `crypto`, `http`, `https`, `os`, `child_process`
- Database clients: `@prisma/client`, `mongoose`, `pg`, `mysql2`
- Server frameworks: `express`, `fastify`, `koa`

**Client Hooks in Server Components:**
```tsx
// ❌ BAD: Cannot use client hooks in server components
import { useState } from 'react'; // No 'use client' directive!

export default function Page() {
  const [count, setCount] = useState(0); // ERROR: Server component!
  return <div>{count}</div>;
}

// ✅ GOOD: Add 'use client' directive
'use client';
import { useState } from 'react';

export default function Page() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```

**'use client' in Server-Only Locations:**
- `middleware.ts` - Must be server-only
- `app/layout.tsx` (root layout) - Should be server component
- `app/api/**` - API routes are server-only

```tsx
// ❌ BAD: Client directive in middleware
'use client'; // ERROR: Middleware must be server-only
export function middleware(request) {
  return NextResponse.next();
}

// ✅ GOOD: Remove directive
export function middleware(request) {
  return NextResponse.next();
}
```

**Detection Rules:**
- Both `'use client'` and `'use server'` in same file
- Server-only module imports (`fs`, `@prisma/client`, etc.) in client components
- Client hooks (`useState`, `useEffect`, etc.) without `'use client'` directive
- `'use client'` in `middleware.ts`, root `layout.tsx`, or `app/api/**`

**Severity:**
- Critical: Server-only imports in client components (runtime error)
- High: Both directives in same file
- High: Client hooks in server component
- Medium: 'use client' in server-only locations

---

## Usage

### CLI

#### Basic Analysis
```bash
# Analyze current directory
odavl insight nextjs

# Analyze specific workspace
odavl insight nextjs ./my-nextjs-app

# JSON output (for CI/CD)
odavl insight nextjs --json
```

#### With Options
```bash
# Custom app directory
odavl insight nextjs --app-dir src/app

# Custom pages directory (Pages Router)
odavl insight nextjs --pages-dir src/pages

# Disable specific checks
odavl insight nextjs --no-hydration        # Skip hydration checks
odavl insight nextjs --no-server-actions   # Skip server action checks
odavl insight nextjs --no-suspense         # Skip suspense checks
odavl insight nextjs --no-boundaries       # Skip boundary checks

# Combined options
odavl insight nextjs --app-dir src/app --no-hydration --json
```

#### Example Output
```
⚛️  Next.js Analysis Results
────────────────────────────────────────────────────────────

Next.js Version: 14.2.3
Router: App Router

Quality Score: 85/100
Issues Found: 5

By Category:
  💧 hydration: 2
  🔧 server-actions: 1
  ⏳ suspense: 1
  🔀 boundaries: 1

By Severity:
  Critical: 0
  High: 2
  Medium: 2
  Low: 1

Top Issues:
  1. 💧 [high] Direct window access causing hydration mismatch
     app/components/ClientOnly.tsx:15
     💡 Wrap in useEffect or check typeof window !== 'undefined'

  2. 🔧 [high] Server action missing 'use server' directive
     app/actions/user-actions.ts:8
     💡 Add 'use server' at the top of the file or function

  3. ⏳ [medium] Async component without loading.tsx
     app/dashboard/page.tsx:1
     💡 Create app/dashboard/loading.tsx for loading state

  4. 🔀 [medium] Client component imports server-only module 'fs'
     app/components/FileReader.tsx:2
     💡 Move file operations to server action

  5. 💧 [low] Date.now() in render may cause hydration issues
     app/components/Timer.tsx:10
     💡 Use useState with useEffect for dynamic values

────────────────────────────────────────────────────────────
Analysis completed in 245ms

💡 Tip: Use --json flag for machine-readable output
📖 Learn more: docs/insight/nextjs-detector.md
```

### Programmatic API

```typescript
import { NextJSDetector } from '@odavl-studio/insight-core/detector';

// Create detector instance
const detector = new NextJSDetector({
  workspaceRoot: '/path/to/nextjs-app',
  appDir: 'app',               // Optional: default 'app'
  pagesDir: 'pages',           // Optional: default 'pages'
  excludePatterns: [           // Optional: paths to exclude
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
  ],
  checkHydration: true,        // Optional: default true
  checkServerActions: true,    // Optional: default true
  checkSuspense: true,         // Optional: default true
  checkBoundaries: true,       // Optional: default true
});

// Run analysis
const result = await detector.analyze('/path/to/nextjs-app');

// Access results
console.log('Score:', result.metrics.nextjsScore);
console.log('Next.js Version:', result.metrics.nextVersion);
console.log('Has App Router:', result.metrics.hasAppRouter);
console.log('Issues:', result.issues.length);

// Filter by category
const hydrationIssues = result.issues.filter(i => i.category === 'hydration');
const serverActionIssues = result.issues.filter(i => i.category === 'server-actions');

// Filter by severity
const criticalIssues = result.issues.filter(i => i.severity === 'critical');
const highIssues = result.issues.filter(i => i.severity === 'high');
```

### Helper Function

For quick analysis without creating an instance:

```typescript
import { analyzeNextJS } from '@odavl-studio/insight-core/detector';

// Minimal usage
const result = await analyzeNextJS('/path/to/nextjs-app');

// With config
const result = await analyzeNextJS('/path/to/nextjs-app', {
  appDir: 'src/app',
  checkHydration: true,
  checkServerActions: true,
  excludePatterns: ['**/test/**'],
});

console.log('Score:', result.metrics.nextjsScore);
console.log('Issues:', result.issues);
```

---

## Configuration

### NextJSConfig

```typescript
interface NextJSConfig {
  /** Root directory of the workspace */
  workspaceRoot: string;

  /** Path to app directory (relative to workspace root) */
  appDir?: string; // default: 'app'

  /** Path to pages directory (relative to workspace root) */
  pagesDir?: string; // default: 'pages'

  /** Glob patterns to exclude from analysis */
  excludePatterns?: string[]; // default: ['**/node_modules/**', '**/.next/**']

  /** Enable hydration mismatch detection */
  checkHydration?: boolean; // default: true

  /** Enable server action validation */
  checkServerActions?: boolean; // default: true

  /** Enable suspense boundary checks */
  checkSuspense?: boolean; // default: true

  /** Enable client/server boundary checks */
  checkBoundaries?: boolean; // default: true
}
```

### Example Configurations

#### Minimal Config
```typescript
const detector = new NextJSDetector({
  workspaceRoot: process.cwd(),
});
```

#### Custom App Structure
```typescript
const detector = new NextJSDetector({
  workspaceRoot: '/path/to/project',
  appDir: 'src/app',
  pagesDir: 'src/pages',
});
```

#### Skip Certain Checks
```typescript
const detector = new NextJSDetector({
  workspaceRoot: process.cwd(),
  checkHydration: false,     // Skip hydration checks
  checkSuspense: false,      // Skip suspense checks
});
```

#### Custom Exclusions
```typescript
const detector = new NextJSDetector({
  workspaceRoot: process.cwd(),
  excludePatterns: [
    '**/node_modules/**',
    '**/.next/**',
    '**/test/**',
    '**/stories/**',
    '**/*.test.tsx',
  ],
});
```

---

## Output Format

### NextJSAnalysisResult

```typescript
interface NextJSAnalysisResult {
  /** Array of detected issues */
  issues: NextJSIssue[];

  /** Analysis metrics */
  metrics: {
    /** Quality score (0-100) */
    nextjsScore: number;

    /** Next.js version detected */
    nextVersion: string;

    /** Whether App Router is used */
    hasAppRouter: boolean;

    /** Analysis duration in milliseconds */
    analysisTime: number;
  };
}
```

### NextJSIssue

```typescript
interface NextJSIssue {
  /** Issue category */
  category: 'hydration' | 'server-actions' | 'suspense' | 'boundaries';

  /** Severity level */
  severity: 'critical' | 'high' | 'medium' | 'low';

  /** Human-readable message */
  message: string;

  /** File path (relative to workspace) */
  file: string;

  /** Line number */
  line: number;

  /** Column number (optional) */
  column?: number;

  /** Fix suggestion (optional) */
  suggestion?: string;
}
```

### Example JSON Output

```json
{
  "issues": [
    {
      "category": "hydration",
      "severity": "high",
      "message": "Direct window access causing hydration mismatch",
      "file": "app/components/ClientOnly.tsx",
      "line": 15,
      "column": 10,
      "suggestion": "Wrap in useEffect or check typeof window !== 'undefined'"
    },
    {
      "category": "server-actions",
      "severity": "critical",
      "message": "Server action in actions directory missing 'use server' directive",
      "file": "app/actions/user-actions.ts",
      "line": 1,
      "suggestion": "Add 'use server' at the top of the file"
    }
  ],
  "metrics": {
    "nextjsScore": 85,
    "nextVersion": "14.2.3",
    "hasAppRouter": true,
    "analysisTime": 245
  }
}
```

---

## Score Calculation

The detector calculates a quality score from 0-100 based on detected issues:

**Base Score:** 100

**Deductions:**
- **Critical Issues:** -15 points each
- **High Issues:** -10 points each
- **Medium Issues:** -5 points each
- **Low Issues:** -2 points each

**Minimum Score:** 0 (cannot go negative)

**Example:**
```
Base: 100
- 0 critical (-0)
- 2 high (-20)
- 3 medium (-15)
- 1 low (-2)
─────────────
Final: 63/100
```

**Score Ranges:**
- **90-100:** Excellent - Production ready
- **70-89:** Good - Minor issues to address
- **50-69:** Fair - Several issues need attention
- **0-49:** Poor - Major issues blocking production

---

## Best Practices

### 1. Run Before Every Deployment
```bash
# Add to package.json scripts
{
  "scripts": {
    "predeploy": "odavl insight nextjs",
    "deploy": "vercel deploy"
  }
}
```

### 2. CI/CD Integration
```yaml
# .github/workflows/ci.yml
- name: Next.js Analysis
  run: |
    pnpm odavl insight nextjs --json > nextjs-report.json
    
- name: Check Score
  run: |
    SCORE=$(jq '.metrics.nextjsScore' nextjs-report.json)
    if [ "$SCORE" -lt 70 ]; then
      echo "Quality score too low: $SCORE/100"
      exit 1
    fi
```

### 3. Pre-Commit Hook
```bash
# .husky/pre-commit
#!/bin/sh
pnpm odavl insight nextjs --no-hydration
```

### 4. Focus on Critical Issues First
```bash
# Generate report and filter
odavl insight nextjs --json | jq '.issues[] | select(.severity == "critical")'
```

### 5. Incremental Adoption
```bash
# Start with one category
odavl insight nextjs --no-hydration --no-suspense --no-boundaries

# Gradually enable all checks
odavl insight nextjs
```

---

## Troubleshooting

### Issue: "No Next.js files found"

**Cause:** Detector cannot locate app/ or pages/ directory.

**Solution:**
```bash
# Specify custom paths
odavl insight nextjs --app-dir src/app --pages-dir src/pages
```

### Issue: "Too many false positives for hydration"

**Cause:** Detector is too strict for your use case.

**Solution:**
```bash
# Disable hydration checks
odavl insight nextjs --no-hydration

# Or use suppressHydrationWarning in specific cases
<div suppressHydrationWarning>{Date.now()}</div>
```

### Issue: "Performance is slow"

**Cause:** Large codebase with many files.

**Solution:**
```typescript
// Add more exclusions
const detector = new NextJSDetector({
  workspaceRoot: process.cwd(),
  excludePatterns: [
    '**/node_modules/**',
    '**/.next/**',
    '**/test/**',
    '**/stories/**',
    '**/__tests__/**',
  ],
});
```

### Issue: "Missing issues in server actions"

**Cause:** Detection relies on regex patterns, not AST parsing.

**Limitations:**
- Cannot detect complex type transformations
- May miss edge cases with dynamic imports
- No cross-file type analysis

**Recommendation:**
- Use TypeScript strict mode
- Enable `@typescript-eslint` rules
- Combine with other detectors

---

## Examples

### Example 1: Fix Hydration Mismatch

**Before:**
```tsx
// app/page.tsx
export default function Home() {
  return (
    <div>
      <h1>Welcome</h1>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
}
```

**Detector Output:**
```
💧 [high] Date usage in render causing hydration mismatch
   app/page.tsx:5
   💡 Use useState with useEffect for dynamic values
```

**After:**
```tsx
// app/page.tsx
'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [time, setTime] = useState<string | null>(null);
  
  useEffect(() => {
    setTime(new Date().toLocaleString());
  }, []);
  
  return (
    <div>
      <h1>Welcome</h1>
      <p>Current time: {time ?? 'Loading...'}</p>
    </div>
  );
}
```

---

### Example 2: Fix Server Action

**Before:**
```tsx
// app/actions/user.ts
export async function createUser(data: FormData) {
  const name = data.get('name');
  return { success: true, name };
}
```

**Detector Output:**
```
🔧 [critical] Server action missing 'use server' directive
   app/actions/user.ts:1
   💡 Add 'use server' at the top of the file
```

**After:**
```tsx
// app/actions/user.ts
'use server';

export async function createUser(data: FormData) {
  const name = data.get('name');
  return { success: true, name };
}
```

---

### Example 3: Fix Suspense Boundary

**Before:**
```tsx
// app/dashboard/page.tsx
async function Dashboard() {
  const data = await fetchDashboardData();
  return <div>{data.title}</div>;
}

export default Dashboard;
```

**Detector Output:**
```
⏳ [high] Async component without loading.tsx
   app/dashboard/page.tsx:1
   💡 Create app/dashboard/loading.tsx for loading state
```

**After:**
```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <div>Loading dashboard...</div>;
}

// app/dashboard/page.tsx
async function Dashboard() {
  const data = await fetchDashboardData();
  return <div>{data.title}</div>;
}

export default Dashboard;
```

---

### Example 4: Fix Boundary Violation

**Before:**
```tsx
// app/components/FileReader.tsx
'use client';
import fs from 'fs';

export default function FileReader() {
  const content = fs.readFileSync('./data.txt', 'utf-8');
  return <div>{content}</div>;
}
```

**Detector Output:**
```
🔀 [critical] Client component cannot import 'fs' (server-only module)
   app/components/FileReader.tsx:2
   💡 Move file operations to server action or server component
```

**After:**
```tsx
// app/actions/file.ts
'use server';
import fs from 'fs';

export async function readFile(path: string) {
  const content = fs.readFileSync(path, 'utf-8');
  return content;
}

// app/components/FileReader.tsx
'use client';
import { readFile } from '../actions/file';
import { useState, useEffect } from 'react';

export default function FileReader() {
  const [content, setContent] = useState('');
  
  useEffect(() => {
    readFile('./data.txt').then(setContent);
  }, []);
  
  return <div>{content}</div>;
}
```

---

## Performance

**Benchmark Results:**
- **10 files:** ~0.01s (10ms)
- **100 files:** ~0.15s (150ms)
- **500 files:** ~0.75s (750ms)
- **1000 files:** ~1.5s (1500ms)

**Target:** <3s for 500 files ✅

**Optimization Strategies:**
- Regex-based (no AST parsing overhead)
- Sequential processing (simpler, still fast)
- Path normalization caching
- Early returns for excluded patterns

---

## Limitations

1. **Regex-Based Detection:** Cannot analyze complex type transformations or cross-file dependencies
2. **No AST Parsing:** May miss edge cases with dynamic code generation
3. **Client/Server Detection:** Relies on explicit directives, cannot infer from usage
4. **False Positives:** May flag valid code in edge cases (use `excludePatterns`)
5. **Next.js Specific:** Does not detect React-only issues (use React detector)

**Recommendation:** Combine with TypeScript, ESLint, and other ODAVL detectors for comprehensive coverage.

---

## Roadmap

### v2.1 (Next Release)
- [ ] AST parsing for complex cases
- [ ] Cross-file type analysis
- [ ] Integration with Next.js Compiler API
- [ ] Custom rule definitions

### v2.2 (Future)
- [ ] Auto-fix suggestions via AI
- [ ] IDE integration (VS Code extension)
- [ ] Performance profiling integration
- [ ] Bundle size analysis

---

## Related Detectors

- **TypeScript Detector:** Type errors and strictness
- **ESLint Detector:** Code style and best practices
- **Performance Detector:** Runtime performance issues
- **Security Detector:** Security vulnerabilities
- **Complexity Detector:** Code complexity metrics

---

## Support

**Documentation:** [docs/insight/nextjs-detector.md](./nextjs-detector.md)  
**GitHub Issues:** [github.com/odavlstudio/odavl/issues](https://github.com/odavlstudio/odavl/issues)  
**Discord:** [discord.gg/odavl](https://discord.gg/odavl)  
**Email:** support@odavl.com

---

## License

MIT License - See [LICENSE](../../LICENSE) for details.

---

**Built with ❤️ by ODAVL Studio Team**
