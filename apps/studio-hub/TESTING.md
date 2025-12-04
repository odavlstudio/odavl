# ODAVL Studio Hub - Testing Guide

## Overview

ODAVL Studio Hub uses Vitest for unit/integration testing and Playwright for E2E testing.

## Test Structure

```
apps/studio-hub/
├── tests/
│   ├── setup.ts           # Test environment configuration
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # Playwright E2E tests
├── vitest.config.ts       # Vitest configuration
└── playwright.config.ts   # Playwright configuration
```

## Running Tests

### Unit & Integration Tests (Vitest)

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test tests/unit/lib/email/sender.test.ts
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e

# Run E2E in UI mode
pnpm exec playwright test --ui

# Run specific browser
pnpm exec playwright test --project=chromium
```

## Writing Tests

### Unit Test Example

```typescript
// tests/unit/lib/email/sender.test.ts
import { describe, it, expect, vi } from 'vitest';
import { sendEmail } from '@/lib/email/sender';

describe('Email Sender', () => {
  it('should send email successfully', async () => {
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      text: 'Test message',
    });
    
    expect(result.success).toBe(true);
  });
});
```

### E2E Test Example

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test('dashboard loads successfully', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

## Coverage

Coverage reports are generated in `coverage/` directory:
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI integration

Minimum thresholds:
- Lines: 60%
- Functions: 60%
- Branches: 60%
- Statements: 60%

## CI/CD Integration

Tests run automatically on:
- Push to `main`, `develop`, or `odavl/**` branches
- Pull requests to `main` or `develop`

See `.github/workflows/studio-hub-tests.yml` for CI configuration.

## Debugging Tests

### Vitest

```bash
# Run tests in debug mode
pnpm test --inspect-brk --no-coverage

# Then attach VS Code debugger
```

### Playwright

```bash
# Run with debugging UI
pnpm exec playwright test --debug

# Generate trace
pnpm exec playwright test --trace on

# View trace
pnpm exec playwright show-trace trace.zip
```

## Mocking

### Environment Variables

Tests automatically use test environment variables from `tests/setup.ts`:
- `NEXTAUTH_URL=http://localhost:3001`
- `DATABASE_URL=file:./test.db`

### Next.js Router

Router is automatically mocked in `tests/setup.ts`. To customize:

```typescript
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));
```

### Database

Use Prisma's mock client for unit tests:

```typescript
import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'vitest-mock-extended';

const prismaMock = mockDeep<PrismaClient>();
```

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Test isolation**: Each test should be independent
3. **Mock external dependencies**: Don't call real APIs in tests
4. **Descriptive names**: Test names should explain what's being tested
5. **Coverage goals**: Aim for >80% coverage on critical paths
6. **Fast tests**: Keep unit tests under 1s, E2E under 30s
7. **Clean up**: Use `afterEach` for cleanup

## Troubleshooting

### Tests timing out

Increase timeout in `vitest.config.ts`:

```typescript
test: {
  testTimeout: 60000, // 60 seconds
}
```

### Database connection issues

Ensure PostgreSQL is running:

```bash
docker-compose up -d postgres
```

### Playwright browser issues

Reinstall browsers:

```bash
pnpm exec playwright install --with-deps
```
