# 🎭 ODAVL Testing Mocks

**Purpose:** Comprehensive mock system for fast, reliable, offline testing

---

## 📁 Available Mocks

### 1. **api-mocks.ts** - HTTP & External APIs
Mock HTTP clients and external service responses.

```typescript
import { mockAxios, mockFetch, mockNVDResponse } from './api-mocks';

// Setup
mockAxios.get.mockResolvedValue({ data: mockNVDResponse });

// Or use helpers
mockAxiosGet('nvd.nist.gov', mockNVDResponse);
mockFetchSuccess({ status: 'ok' });
```

**Includes:**
- ✅ Axios client mock
- ✅ Fetch API mock
- ✅ NVD API responses
- ✅ Lighthouse reports
- ✅ GitHub API responses
- ✅ Playwright browser mock

---

### 2. **db-mocks.ts** - Database & Prisma
Mock Prisma client and database operations.

```typescript
import { mockPrisma, createMockUser, mockUserCreate } from './db-mocks';

// Setup
mockUserCreate({ email: 'test@example.com' });

// Use in tests
const user = await mockPrisma.user.create({ 
  data: { email: 'test@example.com' } 
});
```

**Includes:**
- ✅ Full Prisma client mock
- ✅ All ODAVL models (User, Project, InsightRun, etc.)
- ✅ Mock data factories
- ✅ Transaction support
- ✅ Error simulation

---

### 3. **fs-mocks.ts** - File System
Mock Node.js fs/promises operations.

```typescript
import { mockFs, addMockFile, setupMockFileStructure } from './fs-mocks';

// Setup virtual filesystem
setupMockFileStructure({
  '/project/src/index.ts': 'export const x = 1;',
  '/project/package.json': JSON.stringify({ name: 'test' }),
});

// Use in tests
const content = await mockFs.readFile('/project/src/index.ts', 'utf-8');
```

**Includes:**
- ✅ All fs/promises methods
- ✅ Virtual filesystem
- ✅ Path module mock
- ✅ Stats object creation
- ✅ Error simulation (ENOENT, EACCES)

---

### 4. **cli-mocks.ts** - Command Execution
Mock child_process operations (execSync, spawn, etc.).

```typescript
import { mockExecSync, mockEslintCommand, mockTscCommand } from './cli-mocks';

// Setup
mockEslintCommand(true); // has errors
mockTscCommand(false);   // no errors

// Or specific commands
mockCommandSuccess('pnpm build', 'Build successful');
```

**Includes:**
- ✅ execSync, spawn, exec, fork
- ✅ ESLint output (JSON format)
- ✅ TypeScript compiler output
- ✅ Git commands (status, diff, log)
- ✅ Package manager commands (pnpm, npm)
- ✅ ODAVL autopilot phases

---

### 5. **external-mocks.ts** - External Services
Mock third-party services and APIs.

```typescript
import { 
  mockNVDApi, 
  mockLighthouseTest, 
  mockAxeTest 
} from './external-mocks';

// Setup
mockNVDApi();           // Mock vulnerability database
mockLighthouseTest();   // Mock performance testing
mockAxeTest();          // Mock accessibility testing
```

**Includes:**
- ✅ NVD (National Vulnerability Database)
- ✅ Lighthouse (performance testing)
- ✅ Playwright (browser automation)
- ✅ Axe (accessibility testing)
- ✅ Sentry (error tracking)
- ✅ Email services
- ✅ Analytics services

---

### 6. **detector-mocks.ts** - ODAVL Detectors
Mock ODAVL Insight detector responses.

```typescript
import { 
  mockTypeScriptDetector,
  mockDetectorAnalysis,
  mockTypeScriptIssues,
  setupStandardDetectorMocks
} from './detector-mocks';

// Setup individual detector
mockDetectorAnalysis(mockTypeScriptDetector, mockTypeScriptIssues);

// Or setup all detectors
setupStandardDetectorMocks();
```

**Includes:**
- ✅ All 12 ODAVL detectors
- ✅ Pre-made issue sets
- ✅ Mock issue factory
- ✅ Analysis results
- ✅ Fix operations

---

## 🚀 Quick Start

### Basic Test Setup

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { 
  mockAxios, 
  resetApiMocks,
  mockPrisma,
  resetDbMocks,
  mockFs,
  resetFsMocks 
} from './tests/mocks';

describe('My Feature', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    resetApiMocks();
    resetDbMocks();
    resetFsMocks();
  });

  it('should work correctly', async () => {
    // Setup mocks
    mockAxios.get.mockResolvedValue({ data: { success: true } });
    mockPrisma.user.findUnique.mockResolvedValue({ 
      id: '123', 
      email: 'test@example.com' 
    });
    
    // Run test
    const result = await myFeature();
    
    // Assertions
    expect(result).toBeDefined();
  });
});
```

---

## 📋 Common Patterns

### Pattern 1: Mock HTTP Request

```typescript
import { mockAxios, mockAxiosGet } from './tests/mocks/api-mocks';

// Method 1: Direct mock
mockAxios.get.mockResolvedValue({ data: { items: [] } });

// Method 2: Helper function
mockAxiosGet('/api/users', { users: [] });

// Method 3: Error simulation
mockAxiosError(500, 'Internal Server Error');
```

### Pattern 2: Mock Database Query

```typescript
import { mockPrisma, createMockUser } from './tests/mocks/db-mocks';

// Method 1: Direct mock
mockPrisma.user.findUnique.mockResolvedValue({
  id: '123',
  email: 'test@example.com',
});

// Method 2: Factory function
const user = createMockUser({ email: 'custom@example.com' });
mockPrisma.user.findUnique.mockResolvedValue(user);

// Method 3: Helper function
mockUserFind({ email: 'test@example.com' });
```

### Pattern 3: Mock File Operations

```typescript
import { mockFs, addMockFile } from './tests/mocks/fs-mocks';

// Method 1: Add single file
addMockFile('/project/config.json', '{"port": 3000}');

// Method 2: Setup entire structure
setupMockFileStructure({
  '/project/src/index.ts': 'export const x = 1;',
  '/project/src/utils.ts': 'export const y = 2;',
});

// Method 3: Simulate errors
mockFileNotFound('/missing.txt');
mockPermissionDenied('/restricted.txt');
```

### Pattern 4: Mock CLI Commands

```typescript
import { mockExecSync, mockEslintCommand } from './tests/mocks/cli-mocks';

// Method 1: Specific tool
mockEslintCommand(true); // has errors
mockTscCommand(false);   // no errors

// Method 2: Custom command
mockCommandSuccess('pnpm build', 'Build successful');

// Method 3: Command failure
mockCommandFailure('pnpm test', 1, 'Tests failed');
```

### Pattern 5: Mock Detectors

```typescript
import { 
  mockTypeScriptDetector,
  mockDetectorAnalysis,
  createMockIssue 
} from './tests/mocks/detector-mocks';

// Method 1: Use pre-made issues
mockDetectorAnalysis(mockTypeScriptDetector, mockTypeScriptIssues);

// Method 2: Create custom issues
const customIssue = createMockIssue({
  severity: 'critical',
  message: 'Custom error',
});
mockDetectorAnalysis(mockTypeScriptDetector, [customIssue]);

// Method 3: Setup all detectors
setupStandardDetectorMocks();
```

---

## ✅ Best Practices

### 1. Always Reset Before Tests
```typescript
beforeEach(() => {
  resetApiMocks();
  resetDbMocks();
  resetFsMocks();
  resetCliMocks();
  resetDetectorMocks();
});
```

### 2. Use Type-Safe Mocks
```typescript
// Good ✅
const mockUser = createMockUser({ email: 'test@example.com' });

// Avoid ❌
const mockUser = { email: 'test@example.com' }; // missing required fields
```

### 3. Mock Only What You Need
```typescript
// Good ✅
mockAxios.get.mockResolvedValue({ data: { id: 1 } });

// Over-mocking ❌
mockAxios.get.mockImplementation(/* complex logic */);
```

### 4. Simulate Real Errors
```typescript
// Good ✅
mockAxiosError(404, 'Not Found');
mockFileNotFound('/missing.txt');

// Generic ❌
mockAxios.get.mockRejectedValue(new Error('error'));
```

### 5. Use Helpers When Available
```typescript
// Good ✅
mockUserFind({ id: '123' });
mockEslintCommand(true);

// Manual ❌
mockPrisma.user.findUnique.mockResolvedValue(/* ... */);
```

---

## 🔍 Debugging Mocks

### Check Mock Calls
```typescript
// How many times called?
expect(mockAxios.get).toHaveBeenCalledTimes(2);

// What arguments?
expect(mockAxios.get).toHaveBeenCalledWith('/api/users');

// Get all calls
console.log(mockAxios.get.mock.calls);
```

### Reset Individual Mocks
```typescript
// Reset one mock
mockAxios.get.mockReset();

// Clear calls but keep implementation
mockAxios.get.mockClear();

// Reset to original implementation
mockAxios.get.mockRestore();
```

---

## 📊 Performance Tips

### 1. Setup Mocks Once
```typescript
// In setupTests.ts or vitest.setup.ts
import { setupStandardDetectorMocks } from './tests/mocks';

beforeAll(() => {
  setupStandardDetectorMocks();
});
```

### 2. Use Virtual Filesystem
```typescript
// Fast ✅
setupMockFileStructure({ ... });

// Slow ❌
// Writing real files to disk
```

### 3. Batch Mock Setup
```typescript
// Good ✅
setupStandardDetectorMocks(); // All at once

// Slow ❌
mockDetectorAnalysis(mockTypeScriptDetector, ...);
mockDetectorAnalysis(mockESLintDetector, ...);
// ... repeat 12 times
```

---

## 🎯 Integration with Tests

### Update vitest.config.ts
```typescript
export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

### Create tests/setup.ts
```typescript
import { beforeEach } from 'vitest';
import { 
  resetApiMocks,
  resetDbMocks,
  resetFsMocks,
  resetCliMocks,
  resetDetectorMocks 
} from './mocks';

// Global setup - runs before each test
beforeEach(() => {
  resetApiMocks();
  resetDbMocks();
  resetFsMocks();
  resetCliMocks();
  resetDetectorMocks();
});
```

---

## 📚 Examples

See individual mock files for comprehensive examples:
- `api-mocks.ts` - Line 290+
- `db-mocks.ts` - Line 250+
- `fs-mocks.ts` - Line 330+
- `cli-mocks.ts` - Line 380+
- `external-mocks.ts` - Line 490+
- `detector-mocks.ts` - Line 420+

---

## 🆘 Troubleshooting

### Mock Not Working?
1. Check if mock is reset before test
2. Verify correct import path
3. Check if implementation is set
4. Use `console.log(mockFn.mock.calls)` to debug

### Type Errors?
1. Use factories: `createMockUser()`, `createMockIssue()`
2. Check type imports from `@odavl-studio/types`
3. Use `as any` only as last resort

### Slow Tests?
1. Use virtual filesystem instead of real files
2. Setup common mocks in `beforeAll()` instead of `beforeEach()`
3. Avoid unnecessary mock resets

---

**Created:** Phase 1 - Mock Files System  
**Status:** ✅ Complete  
**Next:** Diagnostic Dumps System
