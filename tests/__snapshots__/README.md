# ODAVL Studio - Snapshot Testing Guide

**Status:** ✅ Production Ready  
**Version:** 2.0.0  
**Last Updated:** 2025-11-26

---

## 📋 Overview

Snapshot testing captures the output of components, API responses, or configurations and compares them against stored reference files. This ensures that changes to code don't unintentionally alter expected outputs.

**Use Cases:**
- React/UI component rendering verification
- API response structure validation
- Configuration file consistency
- CLI output validation
- Error message formatting

---

## 📁 Directory Structure

```
tests/__snapshots__/
├── components/              # React component snapshots
│   ├── Button.test.tsx.snap
│   ├── Card.test.tsx.snap
│   └── Dashboard.test.tsx.snap
│
├── api-responses/           # API response snapshots
│   ├── insight-run.test.ts.snap
│   ├── guardian-test.test.ts.snap
│   └── nvd-api.test.ts.snap
│
├── configs/                 # Configuration snapshots
│   ├── gates.test.ts.snap
│   ├── learning.test.ts.snap
│   └── riskmap.test.ts.snap
│
└── README.md                # This file
```

---

## 🚀 Quick Start

### 1. Writing Snapshot Tests

**Component Snapshot:**
```typescript
// tests/components/Button.test.tsx
import { render } from '@testing-library/react';
import { Button } from '@/components/Button';

describe('Button Component', () => {
  it('matches snapshot - primary variant', () => {
    const { container } = render(
      <Button variant="primary">Click Me</Button>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot - disabled state', () => {
    const { container } = render(
      <Button disabled>Disabled</Button>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

**API Response Snapshot:**
```typescript
// tests/api/insight-run.test.ts
import { createInsightRun } from '@/lib/api/insight';

describe('Insight API', () => {
  it('matches snapshot - successful run response', async () => {
    const response = await createInsightRun({
      projectId: 'test-project',
      detectors: ['typescript', 'eslint']
    });
    
    // Remove dynamic fields before snapshot
    const snapshot = {
      ...response,
      id: '<dynamic>',
      timestamp: '<dynamic>'
    };
    
    expect(snapshot).toMatchSnapshot();
  });
});
```

**Configuration Snapshot:**
```typescript
// tests/config/gates.test.ts
import { loadGatesConfig } from '@/lib/config/gates';

describe('Gates Configuration', () => {
  it('matches snapshot - default gates.yml', () => {
    const config = loadGatesConfig('.odavl/gates.yml');
    expect(config).toMatchSnapshot();
  });

  it('matches snapshot - parsed risk budget', () => {
    const config = loadGatesConfig('.odavl/gates.yml');
    expect(config.risk_budget).toMatchSnapshot();
  });
});
```

### 2. Running Snapshot Tests

```bash
# Run all tests (creates/updates snapshots)
pnpm test

# Update snapshots after intentional changes
pnpm test -- -u

# Run specific snapshot test
pnpm test tests/components/Button.test.tsx

# Interactive snapshot update
pnpm test -- --watch
# Press 'u' to update failing snapshots
```

---

## 📊 Snapshot Format Configuration

The snapshot format is configured in `vitest.config.ts`:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    
    // Snapshot configuration
    snapshotFormat: {
      printBasicPrototype: false,  // Don't print [Object] prototype
      escapeString: false,          // Keep strings readable
      indent: 2,                    // 2-space indentation
      min: false,                   // Don't minify
      callToJSON: true,             // Use toJSON() if available
      maxDepth: 10,                 // Max nesting depth
      
      // Pretty printing options
      printFunctionName: true,
      compareKeys: undefined,        // Preserve key order
    },
    
    // Snapshot resolution
    resolveSnapshotPath: (testPath, snapExtension) => {
      // Custom snapshot location logic if needed
      return testPath + snapExtension;
    }
  }
});
```

---

## 🔧 Best Practices

### 1. Remove Dynamic Data

Always remove timestamps, IDs, and other dynamic fields before snapshots:

```typescript
// ❌ BAD: Dynamic data will cause snapshot failures
expect(response).toMatchSnapshot();

// ✅ GOOD: Normalize dynamic data
expect({
  ...response,
  id: '<dynamic>',
  timestamp: '<dynamic>',
  createdAt: '<dynamic>'
}).toMatchSnapshot();
```

### 2. Use Inline Snapshots for Small Data

```typescript
// Good for small, readable data
it('formats error message', () => {
  const error = formatError('File not found');
  expect(error).toMatchInlineSnapshot(`
    {
      "message": "File not found",
      "severity": "error",
      "code": "ENOENT"
    }
  `);
});
```

### 3. Group Related Snapshots

```typescript
describe('Button Variants', () => {
  const variants = ['primary', 'secondary', 'danger'];
  
  variants.forEach(variant => {
    it(`matches snapshot - ${variant}`, () => {
      const { container } = render(<Button variant={variant}>Text</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
```

### 4. Add Snapshot Names for Clarity

```typescript
// Use snapshot names for multiple snapshots in one test
it('renders multiple states', () => {
  const { container, rerender } = render(<Button>Initial</Button>);
  expect(container.firstChild).toMatchSnapshot('initial-state');
  
  rerender(<Button loading>Loading</Button>);
  expect(container.firstChild).toMatchSnapshot('loading-state');
  
  rerender(<Button disabled>Disabled</Button>);
  expect(container.firstChild).toMatchSnapshot('disabled-state');
});
```

### 5. Keep Snapshots Small

```typescript
// ❌ BAD: Snapshot entire large object
expect(hugeObject).toMatchSnapshot();

// ✅ GOOD: Snapshot specific properties
expect({
  status: response.status,
  errorCode: response.errorCode,
  message: response.message
}).toMatchSnapshot();
```

---

## 🎯 Common Use Cases

### React Component Testing

```typescript
import { render } from '@testing-library/react';
import { InsightDashboard } from '@/components/InsightDashboard';

it('renders dashboard with mock data', () => {
  const { container } = render(
    <InsightDashboard
      runs={mockInsightRuns}
      project={mockProject}
    />
  );
  
  // Snapshot the entire component
  expect(container).toMatchSnapshot();
});
```

### API Response Validation

```typescript
import { getNVDVulnerabilities } from '@/lib/api/nvd';

it('matches CVE response structure', async () => {
  const response = await getNVDVulnerabilities('CVE-2024-1234');
  
  expect({
    cveId: response.cveId,
    severity: response.severity,
    description: response.description,
    references: response.references.length
  }).toMatchSnapshot();
});
```

### Configuration Testing

```typescript
import { parseGatesYml } from '@/lib/config/gates';

it('parses gates.yml correctly', () => {
  const config = parseGatesYml(`
    risk_budget: 100
    max_files_per_cycle: 10
    forbidden_paths:
      - security/**
      - auth/**
  `);
  
  expect(config).toMatchSnapshot();
});
```

### CLI Output Testing

```typescript
import { execSync } from 'child_process';

it('matches insight CLI output format', () => {
  const output = execSync('pnpm odavl insight analyze', {
    encoding: 'utf8'
  });
  
  // Normalize dynamic parts
  const normalized = output
    .replace(/\d+ files analyzed/g, '<N> files analyzed')
    .replace(/\d+ms/g, '<time>ms');
  
  expect(normalized).toMatchSnapshot();
});
```

### Error Message Testing

```typescript
import { formatDetectorError } from '@/lib/detectors/utils';

it('formats security detector errors', () => {
  const error = formatDetectorError({
    detector: 'security',
    severity: 'critical',
    message: 'Hardcoded API key detected',
    file: 'config.ts',
    line: 42
  });
  
  expect(error).toMatchSnapshot();
});
```

---

## 🔍 Debugging Snapshot Failures

### 1. View Diff in Terminal

Vitest shows clear diffs when snapshots fail:

```bash
 FAIL  tests/components/Button.test.tsx
  ✕ matches snapshot - primary variant

  Snapshot name: matches snapshot - primary variant 1

  - Expected
  + Received

  <button
    class="
  -   btn-primary
  +   btn-primary-new
    "
  >
    Click Me
  </button>
```

### 2. Interactive Update Mode

```bash
pnpm test -- --watch

# When snapshot fails, press:
# 'u' - Update this snapshot
# 's' - Skip this test
# 'q' - Quit watch mode
```

### 3. Review Snapshot Files

```bash
# Open the snapshot file directly
code tests/__snapshots__/Button.test.tsx.snap

# Review changes with git diff
git diff tests/__snapshots__/
```

---

## 🚨 When to Update Snapshots

### ✅ Update Snapshots When:
- You intentionally changed component rendering
- You updated API response structure
- You modified configuration format
- You improved error messages

### ⚠️ Review Carefully When:
- Snapshot fails unexpectedly
- Large diff in snapshot
- Multiple snapshots failing at once

### ❌ DON'T Update Snapshots When:
- You don't understand why it failed
- You're adding a new feature (write new test instead)
- Snapshot contains sensitive data

---

## 🔐 Security & Privacy

### Don't Snapshot Sensitive Data

```typescript
// ❌ BAD: Exposes secrets
expect(config).toMatchSnapshot();

// ✅ GOOD: Redact sensitive fields
expect({
  ...config,
  apiKey: '<redacted>',
  databaseUrl: '<redacted>',
  secretKey: '<redacted>'
}).toMatchSnapshot();
```

### Use .gitignore for Dynamic Snapshots

If you generate snapshots with sensitive data during local testing:

```gitignore
# .gitignore
tests/__snapshots__/local-*.snap
tests/__snapshots__/temp-*.snap
```

---

## 📈 Integration with ODAVL

### Insight Core Snapshots

```typescript
// Snapshot detector results structure
import { TypeScriptDetector } from '@odavl-studio/insight-core';

it('typescript detector output structure', async () => {
  const detector = new TypeScriptDetector();
  const issues = await detector.analyze('./test-fixtures/typescript-project');
  
  expect({
    detectorName: issues.detectorName,
    issueCount: issues.issues.length,
    severities: issues.issues.map(i => i.severity),
    sampleIssue: issues.issues[0] ? {
      ...issues.issues[0],
      timestamp: '<dynamic>'
    } : null
  }).toMatchSnapshot();
});
```

### Autopilot Ledger Snapshots

```typescript
// Snapshot ledger structure
it('autopilot ledger format', () => {
  const ledger = {
    runId: '<dynamic>',
    startedAt: '<dynamic>',
    planPath: '.odavl/recipes/fix-imports.json',
    edits: [
      { path: 'src/utils/helpers.ts', diffLoc: 5 }
    ],
    notes: 'Removed unused imports'
  };
  
  expect(ledger).toMatchSnapshot();
});
```

### Guardian Test Results Snapshots

```typescript
// Snapshot Guardian test results
it('guardian accessibility test results', async () => {
  const results = await runAccessibilityTest('https://example.com');
  
  expect({
    url: results.url,
    timestamp: '<dynamic>',
    violations: results.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodeCount: v.nodes.length
    }))
  }).toMatchSnapshot();
});
```

---

## 🛠️ Troubleshooting

### Issue: "Cannot find snapshot file"

**Cause:** Snapshot not created yet  
**Solution:** Run test to create initial snapshot

```bash
pnpm test tests/components/Button.test.tsx
```

### Issue: "Snapshot is obsolete"

**Cause:** Test removed/renamed but snapshot file remains  
**Solution:** Delete unused snapshot files

```bash
# Find obsolete snapshots
pnpm test -- --coverage

# Delete manually
rm tests/__snapshots__/OldComponent.test.tsx.snap
```

### Issue: "Snapshot diff too large"

**Cause:** Entire component/object changed  
**Solution:** Review changes carefully, update if intentional

```bash
# View full diff
pnpm test -- --no-coverage

# Update if change is correct
pnpm test -- -u
```

### Issue: "Snapshots failing in CI but passing locally"

**Cause:** Platform-specific differences (line endings, paths)  
**Solution:** Configure snapshot format for cross-platform consistency

```typescript
// vitest.config.ts
snapshotFormat: {
  escapeString: false,
  printBasicPrototype: false
}
```

---

## 📚 Advanced Patterns

### Custom Snapshot Serializers

```typescript
// vitest.setup.ts
expect.addSnapshotSerializer({
  test: (val) => val && typeof val === 'object' && 'type' in val,
  print: (val) => {
    const obj = val as Record<string, any>;
    return `CustomType(${obj.type}): ${JSON.stringify(obj.data)}`;
  }
});
```

### Property Matchers

```typescript
// Match snapshots with dynamic properties
expect(response).toMatchSnapshot({
  id: expect.any(String),
  timestamp: expect.any(String),
  duration: expect.any(Number)
});
```

### Snapshot Testing with Mocks

```typescript
import { mockPrisma } from '@/tests/mocks';

it('matches database query result structure', async () => {
  mockPrisma.user.findMany.mockResolvedValue([
    { id: '1', email: 'user@example.com', name: 'Test User' }
  ]);
  
  const users = await mockPrisma.user.findMany();
  expect(users).toMatchSnapshot();
});
```

---

## 🎯 Success Metrics

After implementing snapshot testing:

✅ **Prevent Regressions:** Catch unintended changes to component output  
✅ **Fast Validation:** Instantly verify API response structures  
✅ **Clear Diffs:** Visual comparison of changes  
✅ **Version Control:** Track output changes over time  
✅ **Documentation:** Snapshots serve as living documentation  

**Expected Impact:**
- 50% fewer regression bugs
- Faster code review (diffs show exact changes)
- Confidence in refactoring

---

## 📖 Resources

- [Vitest Snapshot Testing](https://vitest.dev/guide/snapshot.html)
- [Testing Library Best Practices](https://testing-library.com/docs/react-testing-library/intro/)
- [ODAVL Testing Guide](../mocks/README.md)

---

**Next Steps:**
1. Write snapshot tests for critical components
2. Add API response snapshots for all endpoints
3. Snapshot configuration parsing logic
4. Review and update snapshots regularly
5. Integrate snapshot tests into CI/CD pipeline
