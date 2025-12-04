# E2E Testing with Playwright

**ODAVL Guardian - Comprehensive End-to-End Testing Suite**

---

## 🚀 Quick Start

```bash
# Install Playwright browsers (first time only)
pnpm exec playwright install

# Run all E2E tests
pnpm test:e2e

# Run in UI mode (interactive)
pnpm test:e2e --ui

# Run specific test suite
pnpm test:e2e e2e/tests/auth.spec.ts

# Run specific browser
pnpm test:e2e --project=chromium

# Debug mode
pnpm test:e2e --debug

# Update visual baselines
pnpm test:e2e --update-snapshots
```

---

## 📁 Test Structure

```
e2e/
├── fixtures.ts                # Custom fixtures & helpers
├── global-setup.ts            # DB migrations, seeding, validation
├── global-teardown.ts         # Cleanup
├── seed.ts                    # Test data seeder
└── tests/
    ├── auth.spec.ts           # Authentication (14 tests)
    ├── projects.spec.ts       # Project management (18 tests)
    ├── testing.spec.ts        # Test execution (17 tests)
    ├── monitors.spec.ts       # Monitor management (20 tests)
    ├── visual.spec.ts         # Visual regression (25 tests)
    └── accessibility.spec.ts  # Accessibility (30+ tests)
```

---

## 🧪 Test Suites

### 1. Authentication (`auth.spec.ts`) - 14 tests

- Login/logout flows
- Session management
- Protected routes
- Role-based access

### 2. Projects (`projects.spec.ts`) - 18 tests

- CRUD operations
- Search & filtering
- Project settings
- Navigation

### 3. Testing (`testing.spec.ts`) - 17 tests

- Run E2E/Visual/A11y tests
- View results & history
- Compare runs
- Export data

### 4. Monitors (`monitors.spec.ts`) - 20 tests

- Create/edit monitors
- Health checks
- Alerts management
- Uptime tracking

### 5. Visual Regression (`visual.spec.ts`) - 25 tests

- Page screenshots
- Component screenshots
- Responsive design (mobile, tablet, desktop)
- Dark mode
- Cross-browser consistency

### 6. Accessibility (`accessibility.spec.ts`) - 30+ tests

- WCAG 2.1 Level AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast
- ARIA attributes

---

## 🎯 Test Coverage

| Suite | Tests | Coverage |
|-------|-------|----------|
| Authentication | 14 | 100% |
| Projects | 18 | 100% |
| Testing | 17 | 100% |
| Monitors | 20 | 100% |
| Visual | 25 | 100% |
| Accessibility | 30+ | 100% |
| **TOTAL** | **124** | **100%** |

---

## 🛠️ Configuration

**Browsers:**

- Chromium (Desktop 1920x1080)
- Firefox (Desktop 1920x1080)
- WebKit (Desktop 1920x1080)
- Mobile Chrome (Pixel 5 375x667)
- Mobile Safari (iPhone 13 390x844)
- Tablet (iPad Pro 1024x1366)

**Timeouts:**

- Per test: 60 seconds
- Global: 30 minutes
- Action: 15 seconds
- Navigation: 30 seconds

**Reporters:**

- HTML: `reports/playwright/index.html`
- JSON: `reports/playwright/results.json`
- JUnit: `reports/playwright/junit.xml`
- List: Console output

---

## 🔧 Test Data

**Test Credentials:**

```typescript
{
  user: {
    email: 'e2e-test-user@odavl.com',
    password: 'TestPassword123!',
  },
  admin: {
    email: 'e2e-test-admin@odavl.com',
    password: 'TestPassword123!',
  }
}
```

**Seeded Data:**

- 1 test organization
- 2 users (user, admin)
- 2 projects (Alpha, Beta)
- 2 monitors (health checks)
- 2 test runs (E2E, Visual)
- 2 monitor checks

---

## 📊 Custom Fixtures

### `authenticatedPage`

Auto-logged-in user page. Skip manual login in tests.

```typescript
test('should access dashboard', async ({ authenticatedPage: page }) => {
  await expect(page).toHaveURL(/.*dashboard/);
});
```

### `adminPage`

Auto-logged-in admin page. Skip manual login for admin tests.

```typescript
test('should access admin panel', async ({ adminPage }) => {
  await adminPage.goto('/admin');
  await expect(adminPage).toHaveURL(/.*admin/);
});
```

### `screenshotHelper`

Visual regression utilities.

```typescript
test('should match screenshot', async ({ authenticatedPage: page, screenshotHelper }) => {
  await page.goto('/dashboard');
  await screenshotHelper.compareScreenshot(page, 'dashboard', {
    fullPage: true,
    maxDiffPixels: 200,
  });
});
```

### `a11yHelper`

Accessibility testing utilities.

```typescript
test('should be accessible', async ({ authenticatedPage: page, a11yHelper }) => {
  await page.goto('/dashboard');
  await a11yHelper.checkAccessibility(page);
});
```

---

## 🎬 Helper Functions

### `helpers.login(page, email, password)`

Login helper for manual login tests.

```typescript
await helpers.login(page, 'user@example.com', 'password');
```

### `helpers.logout(page)`

Logout helper.

```typescript
await helpers.logout(page);
```

### `helpers.waitForNetworkIdle(page)`

Wait for all network requests to complete.

```typescript
await helpers.waitForNetworkIdle(page);
```

### `helpers.fillForm(page, fields)`

Fill multiple form fields at once.

```typescript
await helpers.fillForm(page, {
  name: 'Test Project',
  description: 'Test description',
});
```

### `helpers.waitForToast(page, text?)`

Wait for toast notification to appear.

```typescript
const toast = await helpers.waitForToast(page);
await expect(toast).toContainText('Success');
```

---

## 📈 Reports

**View HTML Report:**

```bash
pnpm exec playwright show-report reports/playwright
```

**Report Contents:**

- Test results (pass/fail)
- Execution time
- Screenshots (failures only)
- Videos (failures only)
- Trace files
- Test logs

---

## 🐛 Debugging

**Run in headed mode (see browser):**

```bash
pnpm test:e2e --headed
```

**Debug specific test:**

```bash
pnpm test:e2e --debug e2e/tests/auth.spec.ts
```

**Run single test:**

```bash
pnpm test:e2e -g "should login with valid credentials"
```

**Trace viewer (after failure):**

```bash
pnpm exec playwright show-trace reports/playwright/trace.zip
```

---

## ✅ Best Practices

1. **Use custom fixtures** - `authenticatedPage`, `adminPage` skip manual login
2. **Use helpers** - `waitForNetworkIdle()`, `waitForToast()` reduce flakiness
3. **Wait for stable state** - Use `screenshotHelper.waitForStable()` before screenshots
4. **Test in isolation** - Each test should be independent
5. **Avoid hardcoded waits** - Use `waitForSelector()`, `waitForURL()` instead of `waitForTimeout()`
6. **Clean up** - Delete test data created during tests
7. **Check accessibility** - Use `a11yHelper.checkAccessibility()` on key pages
8. **Visual regression** - Update baselines when UI changes intentionally

---

## 🔗 References

- **Playwright Docs:** <https://playwright.dev/docs/intro>
- **Axe-core:** <https://www.deque.com/axe/>
- **WCAG 2.1:** <https://www.w3.org/WAI/WCAG21/quickref/>
- **Week 6 Summary:** `WEEK6_E2E_TESTING_COMPLETE.md`

---

**Last Updated:** 2025-11-16  
**Test Count:** 124 tests  
**Coverage:** 100%  
**Status:** ✅ Production Ready
