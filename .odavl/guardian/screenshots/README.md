# 📸 ODAVL Guardian - Screenshot System

**Purpose:** Visual regression testing and automated screenshot comparison for web applications

---

## 📁 Directory Structure

```
.odavl/guardian/screenshots/
├── baseline/        # Reference screenshots (committed to git)
├── current/         # Latest screenshots (gitignored)
├── diffs/           # Visual difference images (gitignored)
└── metadata.json    # Screenshot metadata and comparison results
```

---

## 🚀 Quick Start

### 1. Initialize

```typescript
import { initializeScreenshots } from '@odavl-studio/guardian-core/screenshot-manager';

await initializeScreenshots();
```

### 2. Capture Screenshot

```typescript
import { chromium } from 'playwright';
import { captureScreenshot } from '@odavl-studio/guardian-core/screenshot-manager';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:3000');

await captureScreenshot(page, {
  name: 'homepage',
  fullPage: true,
  waitForSelector: '#main-content',
  delay: 500,
});

await browser.close();
```

### 3. Set as Baseline

```typescript
import { setBaseline } from '@odavl-studio/guardian-core/screenshot-manager';

// First time or when UI intentionally changes
await setBaseline('homepage');
```

### 4. Compare with Baseline

```typescript
import { compareWithBaseline } from '@odavl-studio/guardian-core/screenshot-manager';

const result = await compareWithBaseline('homepage', 0.1); // 0.1% threshold

if (!result.identical) {
  console.log(`Visual difference: ${result.differencePercentage}%`);
  console.log(`Diff image: ${result.diffImagePath}`);
}
```

### 5. Capture & Compare in One Step

```typescript
import { captureAndCompare } from '@odavl-studio/guardian-core/screenshot-manager';

const result = await captureAndCompare(
  page,
  { name: 'homepage', fullPage: true },
  0.1 // threshold
);

if (result && !result.identical) {
  throw new Error('Visual regression detected!');
}
```

---

## 📊 Features

### 1. **Flexible Screenshot Options**

```typescript
interface ScreenshotOptions {
  name: string;                    // Screenshot name
  fullPage?: boolean;              // Full page scroll (default: true)
  waitForSelector?: string;        // Wait for element before capture
  delay?: number;                  // Delay in milliseconds
  viewport?: { width, height };    // Custom viewport
  browser?: 'chromium' | 'firefox' | 'webkit';
  metadata?: Record<string, any>;  // Custom metadata
}
```

**Examples:**

```typescript
// Full page screenshot
await captureScreenshot(page, {
  name: 'homepage-full',
  fullPage: true,
});

// Specific viewport
await captureScreenshot(page, {
  name: 'homepage-mobile',
  viewport: { width: 375, height: 667 }, // iPhone SE
});

// Wait for dynamic content
await captureScreenshot(page, {
  name: 'dashboard',
  waitForSelector: '.chart-loaded',
  delay: 1000, // Wait 1s after load
});

// With custom metadata
await captureScreenshot(page, {
  name: 'login-page',
  metadata: {
    testCase: 'TC-001',
    environment: 'staging',
  },
});
```

---

### 2. **Visual Comparison**

```typescript
const result = await compareWithBaseline('homepage', 0.1);

console.log(result);
// {
//   identical: false,
//   differencePercentage: 2.5,
//   pixelsDifferent: 12450,
//   totalPixels: 921600,
//   diffImagePath: '.odavl/guardian/screenshots/diffs/homepage-diff.png',
//   baselineDimensions: { width: 1280, height: 720 },
//   currentDimensions: { width: 1280, height: 720 }
// }
```

**Threshold Examples:**

```typescript
// Strict (almost pixel-perfect)
await compareWithBaseline('logo', 0.01); // 0.01% threshold

// Normal (small changes ok)
await compareWithBaseline('homepage', 0.1); // 0.1% threshold

// Relaxed (for dynamic content)
await compareWithBaseline('dashboard', 1.0); // 1% threshold
```

---

### 3. **Metadata Tracking**

```typescript
import { getMetadata, getAllMetadata } from '@odavl-studio/guardian-core/screenshot-manager';

// Get specific screenshot metadata
const metadata = await getMetadata('homepage');

console.log(metadata);
// {
//   name: 'homepage',
//   url: 'http://localhost:3000',
//   timestamp: '2025-11-26T10:00:00.000Z',
//   viewport: { width: 1280, height: 720 },
//   browser: 'chromium',
//   path: '.odavl/guardian/screenshots/current/homepage.png',
//   size: 245678,
//   comparison: {
//     differencePercentage: 0.05,
//     pixelsDifferent: 120,
//     diffImagePath: null
//   },
//   metadata: { testCase: 'TC-001' }
// }

// Get all metadata
const allMetadata = await getAllMetadata();
console.log(`Total screenshots: ${allMetadata.length}`);
```

---

### 4. **Baseline Management**

```typescript
import { listBaselines, deleteScreenshot } from '@odavl-studio/guardian-core/screenshot-manager';

// List all baselines
const baselines = await listBaselines();
console.log('Baselines:', baselines);
// ['homepage', 'dashboard', 'settings', 'profile']

// Delete screenshot (all versions)
await deleteScreenshot('old-page');
// Deletes baseline, current, diff, and metadata
```

---

## 🎯 Use Cases

### Use Case 1: CI/CD Visual Regression

```typescript
// .github/workflows/visual-regression.yml
import { chromium } from 'playwright';
import { captureAndCompare } from '@odavl-studio/guardian-core/screenshot-manager';

const pages = ['/', '/dashboard', '/settings', '/profile'];

for (const pagePath of pages) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:3000${pagePath}`);
  
  const result = await captureAndCompare(
    page,
    { name: pagePath.slice(1) || 'homepage', fullPage: true },
    0.1
  );
  
  if (result && !result.identical) {
    console.error(`Visual regression on ${pagePath}: ${result.differencePercentage}%`);
    process.exit(1);
  }
  
  await browser.close();
}

console.log('✅ All visual tests passed!');
```

---

### Use Case 2: Multi-Device Testing

```typescript
const devices = [
  { name: 'desktop', viewport: { width: 1920, height: 1080 } },
  { name: 'tablet', viewport: { width: 768, height: 1024 } },
  { name: 'mobile', viewport: { width: 375, height: 667 } },
];

for (const device of devices) {
  await captureScreenshot(page, {
    name: `homepage-${device.name}`,
    viewport: device.viewport,
    fullPage: true,
  });
  
  await setBaseline(`homepage-${device.name}`);
}
```

---

### Use Case 3: Multi-Browser Testing

```typescript
import { chromium, firefox, webkit } from 'playwright';

const browsers = {
  chromium: await chromium.launch(),
  firefox: await firefox.launch(),
  webkit: await webkit.launch(),
};

for (const [browserName, browser] of Object.entries(browsers)) {
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  await captureScreenshot(page, {
    name: `homepage-${browserName}`,
    browser: browserName as any,
  });
  
  await browser.close();
}
```

---

### Use Case 4: Before/After Deployment

```typescript
// Before deployment
await captureScreenshot(page, { name: 'homepage-pre-deploy' });
await setBaseline('homepage-pre-deploy');

// ... deploy new version ...

// After deployment
const result = await captureAndCompare(
  page,
  { name: 'homepage-post-deploy' },
  0.1
);

if (result && !result.identical) {
  console.warn('UI changed after deployment!');
  console.log(`Difference: ${result.differencePercentage}%`);
  console.log(`View diff: ${result.diffImagePath}`);
}
```

---

## 🔧 Integration with Guardian Tests

### guardian/core/src/tests/visual-regression.ts

```typescript
import { test, expect } from '@playwright/test';
import { captureAndCompare, initializeScreenshots } from '../screenshot-manager';

test.beforeAll(async () => {
  await initializeScreenshots();
});

test('homepage visual regression', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  const result = await captureAndCompare(
    page,
    { name: 'homepage', fullPage: true },
    0.1
  );
  
  expect(result?.identical).toBe(true);
});

test('dashboard visual regression', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');
  
  const result = await captureAndCompare(
    page,
    { 
      name: 'dashboard',
      waitForSelector: '.chart-loaded',
      delay: 1000,
    },
    0.5 // More relaxed for dynamic content
  );
  
  if (result && !result.identical) {
    console.log(`Difference: ${result.differencePercentage}%`);
  }
  
  expect(result?.differencePercentage).toBeLessThan(0.5);
});
```

---

## 📝 Best Practices

### 1. **Commit Baselines to Git**
```gitignore
# .gitignore
.odavl/guardian/screenshots/current/
.odavl/guardian/screenshots/diffs/

# Keep baselines!
!.odavl/guardian/screenshots/baseline/
```

### 2. **Use Descriptive Names**
```typescript
// Good ✅
'homepage-hero-section'
'dashboard-charts-loaded'
'settings-dark-mode'

// Bad ❌
'screenshot1'
'test'
'temp'
```

### 3. **Wait for Content to Load**
```typescript
await captureScreenshot(page, {
  name: 'product-page',
  waitForSelector: '.product-details',
  delay: 500, // Wait for animations
});
```

### 4. **Use Appropriate Thresholds**
```typescript
// Static content (strict)
await compareWithBaseline('logo', 0.01);

// Dynamic content (relaxed)
await compareWithBaseline('dashboard', 1.0);
```

### 5. **Update Baselines Intentionally**
```typescript
// Only when UI changes are intentional
if (process.env.UPDATE_BASELINES === 'true') {
  await setBaseline('homepage');
}
```

---

## 🚫 What NOT to Do

❌ Don't commit current/ and diffs/ directories  
❌ Don't use random screenshot names  
❌ Don't skip waitForSelector for dynamic content  
❌ Don't use same threshold for all pages  
❌ Don't forget to update baselines after intentional changes

---

## 🔍 Production-Ready Enhancements

For production use, consider integrating:

1. **Pixelmatch** - Accurate pixel-by-pixel comparison
   ```bash
   pnpm add pixelmatch pngjs
   ```

2. **Playwright's Visual Comparison**
   ```typescript
   await expect(page).toHaveScreenshot('homepage.png');
   ```

3. **Percy** - Hosted visual testing service
   ```typescript
   import percySnapshot from '@percy/playwright';
   await percySnapshot(page, 'Homepage');
   ```

---

**Created:** Phase 1 - Screenshot Files System  
**Status:** ✅ Complete  
**Next:** Testing & Documentation
