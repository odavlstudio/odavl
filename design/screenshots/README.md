# Screenshot Reference System

This directory contains visual references for ODAVL Studio's UI components and design system implementation.

---

## 📁 Directory Structure

```
screenshots/
├── components/           # Individual component screenshots
│   ├── buttons/
│   ├── forms/
│   ├── cards/
│   ├── navigation/
│   └── overlays/
├── layouts/             # Layout pattern examples
│   ├── dashboard/
│   ├── settings/
│   └── reports/
├── themes/              # Theme variations
│   ├── light/
│   └── dark/
├── responsive/          # Responsive breakpoints
│   ├── mobile/
│   ├── tablet/
│   └── desktop/
└── states/              # Component states
    ├── hover/
    ├── active/
    ├── disabled/
    └── error/
```

---

## 🎯 Purpose

### 1. Visual Documentation
- **Component Library**: Visual reference for each component
- **Design System**: Examples of design tokens in use
- **Pattern Library**: Common UI patterns and layouts
- **State Variations**: All interactive states captured

### 2. Quality Assurance
- **Visual Regression Testing**: Baseline for automated tests
- **Design Review**: Reference for design consistency
- **Developer Handoff**: Clear implementation targets
- **Client Demos**: Visual examples for stakeholders

### 3. Design-Code Consistency
- **Figma Comparison**: Verify implementation matches design
- **Token Application**: Show correct use of design tokens
- **Responsive Behavior**: Document layout adaptations
- **Accessibility**: Visual accessibility features

---

## 📸 Screenshot Guidelines

### Capture Requirements

#### Resolution
- **Desktop**: 1920x1080 (standard desktop)
- **Tablet**: 768x1024 (iPad portrait)
- **Mobile**: 375x812 (iPhone X)

#### Format
- **File Format**: PNG (for quality) or WebP (for size)
- **Bit Depth**: 24-bit color
- **Compression**: Lossless for baseline, lossy acceptable for docs

#### Naming Convention
```
{component-name}--{variant}--{state}--{theme}.png

Examples:
- button--primary--default--light.png
- button--primary--hover--light.png
- button--secondary--disabled--dark.png
- card--elevated--default--light.png
- modal--dialog--open--light.png
```

### Browser Settings
- **Browser**: Chrome/Chromium (for consistency)
- **Zoom**: 100% (no scaling)
- **Window Size**: Match target breakpoint exactly
- **DevTools**: Closed (to avoid artifacts)
- **Extensions**: Disabled (to avoid interference)

### Component Setup
- **Clean State**: No debug overlays or development tools
- **Real Content**: Use realistic, meaningful content (not Lorem Ipsum)
- **Proper Spacing**: Full component with padding/margin visible
- **Background**: Use actual background color (not transparent)

---

## 🛠️ Tools & Automation

### Manual Capture (Development)

#### Using Browser DevTools
```javascript
// 1. Open DevTools Console
// 2. Set viewport size
window.resizeTo(1920, 1080);

// 3. Wait for render
await new Promise(r => setTimeout(r, 500));

// 4. Take screenshot (Cmd/Ctrl + Shift + P)
// Type: "Capture screenshot"
```

#### Using Playwright (Automated)
```typescript
// scripts/capture-screenshots.ts
import { chromium } from 'playwright';

async function captureComponentScreenshot(
  componentName: string,
  variant: string,
  state: string = 'default',
  theme: string = 'light'
) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  // Navigate to component
  await page.goto(`http://localhost:3000/components/${componentName}?variant=${variant}&theme=${theme}`);
  
  // Apply state (hover, focus, etc.)
  if (state === 'hover') {
    await page.hover(`[data-component="${componentName}"]`);
  }
  
  // Wait for render
  await page.waitForTimeout(500);
  
  // Capture screenshot
  const fileName = `${componentName}--${variant}--${state}--${theme}.png`;
  await page.screenshot({
    path: `design/screenshots/components/${componentName}/${fileName}`,
    fullPage: false,
  });
  
  await browser.close();
}

// Usage
await captureComponentScreenshot('button', 'primary', 'default', 'light');
await captureComponentScreenshot('button', 'primary', 'hover', 'light');
```

### Automated Capture (CI/CD)

#### GitHub Actions Workflow
```yaml
# .github/workflows/capture-screenshots.yml
name: Capture Component Screenshots

on:
  push:
    paths:
      - 'odavl-studio/*/components/**'
      - 'design/tokens/**'

jobs:
  screenshots:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build components
        run: pnpm build
      
      - name: Start dev server
        run: pnpm dev &
      
      - name: Wait for server
        run: sleep 10
      
      - name: Capture screenshots
        run: pnpm screenshots:capture
      
      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        with:
          name: component-screenshots
          path: design/screenshots/
```

---

## 📊 Screenshot Categories

### 1. Component Library Screenshots

#### Buttons
```
components/buttons/
├── button--primary--default--light.png
├── button--primary--hover--light.png
├── button--primary--active--light.png
├── button--primary--disabled--light.png
├── button--secondary--default--light.png
├── button--ghost--default--light.png
└── button--link--default--light.png
```

**Purpose**: Show all button variants and states

#### Forms
```
components/forms/
├── input--text--default--light.png
├── input--text--focus--light.png
├── input--text--error--light.png
├── input--text--disabled--light.png
├── textarea--default--light.png
├── select--default--light.png
├── select--open--light.png
├── checkbox--checked--light.png
├── radio--selected--light.png
└── switch--on--light.png
```

**Purpose**: Show all form components and states

#### Cards
```
components/cards/
├── card--basic--default--light.png
├── card--elevated--default--light.png
├── card--outlined--default--light.png
├── card--interactive--hover--light.png
└── card--with-image--default--light.png
```

**Purpose**: Show card elevation and variants

### 2. Layout Screenshots

#### Dashboard
```
layouts/dashboard/
├── dashboard--overview--desktop--light.png
├── dashboard--overview--tablet--light.png
├── dashboard--overview--mobile--light.png
├── dashboard--analytics--desktop--light.png
└── dashboard--settings--desktop--light.png
```

**Purpose**: Show real-world layout examples

### 3. Theme Screenshots

#### Light vs Dark
```
themes/
├── light/
│   ├── homepage--light.png
│   ├── dashboard--light.png
│   └── settings--light.png
└── dark/
    ├── homepage--dark.png
    ├── dashboard--dark.png
    └── settings--dark.png
```

**Purpose**: Show theme consistency

### 4. Responsive Screenshots

#### Breakpoints
```
responsive/
├── mobile/
│   ├── homepage--mobile-320.png
│   └── dashboard--mobile-375.png
├── tablet/
│   ├── homepage--tablet-768.png
│   └── dashboard--tablet-1024.png
└── desktop/
    ├── homepage--desktop-1920.png
    └── dashboard--desktop-2560.png
```

**Purpose**: Document responsive behavior

---

## 🎨 Design Token Visualization

### Color Palette
```typescript
// scripts/visualize-colors.ts
import colors from '../design/tokens/colors.json';

// Generate HTML with all colors
const html = `
  <div class="color-palette">
    ${Object.entries(colors.primary).map(([shade, hex]) => `
      <div class="color-swatch" style="background-color: ${hex}">
        <span>primary-${shade}</span>
        <span>${hex}</span>
      </div>
    `).join('')}
  </div>
`;

// Capture screenshot of color palette
await page.setContent(html);
await page.screenshot({ path: 'design/screenshots/tokens/colors-primary.png' });
```

### Typography Scale
```typescript
// scripts/visualize-typography.ts
import typography from '../design/tokens/typography.json';

// Generate HTML with typography samples
const html = `
  <div class="typography-scale">
    ${Object.entries(typography.fontSize).map(([size, value]) => `
      <div class="type-sample" style="font-size: ${value}">
        <span class="label">${size} (${value})</span>
        <span class="sample">The quick brown fox jumps over the lazy dog</span>
      </div>
    `).join('')}
  </div>
`;

// Capture screenshot
await page.setContent(html);
await page.screenshot({ path: 'design/screenshots/tokens/typography-scale.png' });
```

### Spacing Scale
```typescript
// scripts/visualize-spacing.ts
import spacing from '../design/tokens/spacing.json';

// Generate HTML with spacing examples
const html = `
  <div class="spacing-scale">
    ${Object.entries(spacing.scale).map(([key, value]) => `
      <div class="spacing-sample">
        <div class="box" style="width: ${value}px; height: ${value}px"></div>
        <span>${key} (${value}px)</span>
      </div>
    `).join('')}
  </div>
`;

// Capture screenshot
await page.setContent(html);
await page.screenshot({ path: 'design/screenshots/tokens/spacing-scale.png' });
```

---

## 🔄 Update Workflow

### When to Update Screenshots

1. **Component Changes**
   - Visual appearance modified
   - New variant added
   - State behavior changed

2. **Design Token Updates**
   - Colors changed
   - Typography adjusted
   - Spacing modified

3. **Theme Changes**
   - Light/dark theme updated
   - New theme added

4. **Layout Changes**
   - Responsive breakpoints adjusted
   - Grid system modified

### Update Process

#### 1. Identify Changed Components
```bash
# Find components with recent changes
git diff --name-only HEAD~1 HEAD | grep 'components/'
```

#### 2. Recapture Screenshots
```bash
# Run screenshot script for changed components
pnpm screenshots:capture --components button,card,input
```

#### 3. Review Changes
```bash
# Visual diff tool
pnpm screenshots:diff
```

#### 4. Update Baseline
```bash
# Commit new screenshots
git add design/screenshots/
git commit -m "docs: update component screenshots"
```

---

## 🧪 Testing Integration

### Visual Regression Testing

#### Using Percy
```typescript
// tests/visual/components.spec.ts
import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test('Button component visual regression', async ({ page }) => {
  await page.goto('http://localhost:3000/components/button');
  
  // Capture baseline
  await percySnapshot(page, 'Button - Primary');
  
  // Test hover state
  await page.hover('[data-testid="button-primary"]');
  await percySnapshot(page, 'Button - Primary - Hover');
});
```

#### Using Playwright Screenshot Comparison
```typescript
// tests/visual/components.spec.ts
import { test, expect } from '@playwright/test';

test('Button matches baseline', async ({ page }) => {
  await page.goto('http://localhost:3000/components/button');
  
  // Compare with baseline
  await expect(page).toHaveScreenshot('button-primary.png', {
    maxDiffPixels: 100, // Allow 100 pixels difference
  });
});
```

### Guardian Integration
```typescript
// odavl-studio/guardian/core/src/visual-tests.ts
import { captureScreenshot } from './screenshot-manager';

export async function runVisualTests(url: string) {
  const page = await browser.newPage();
  await page.goto(url);
  
  // Capture homepage
  await captureScreenshot(page, 'homepage', {
    fullPage: true,
    baseline: 'design/screenshots/layouts/homepage--desktop--light.png'
  });
  
  // Compare and report differences
  const diff = await compareWithBaseline('homepage');
  if (diff.percentage > 0.1) {
    console.warn(`Visual regression detected: ${diff.percentage}%`);
  }
}
```

---

## 📝 Best Practices

### Content Guidelines

1. **Use Real Data**: Avoid Lorem Ipsum, use realistic content
2. **Consistent Examples**: Same data across similar screenshots
3. **Meaningful Names**: Use names like "John Doe" not "User 1"
4. **Proper Dates**: Use recent, realistic dates (not 1970-01-01)

### Technical Guidelines

1. **Consistent Environment**: Same OS, browser, settings
2. **Clean State**: No artifacts, overlays, or debug info
3. **Proper Timing**: Wait for animations/transitions to complete
4. **Full Quality**: Use lossless compression for baselines

### Maintenance Guidelines

1. **Version Control**: Commit screenshots to Git
2. **Update Regularly**: Keep screenshots current with code
3. **Document Changes**: Note why screenshots changed
4. **Archive Old**: Keep previous versions for comparison

---

## 🚀 Quick Start

### Initial Setup
```bash
# 1. Create directory structure
mkdir -p design/screenshots/{components,layouts,themes,responsive,states}

# 2. Install Playwright
pnpm add -D playwright

# 3. Create capture script
touch scripts/capture-screenshots.ts

# 4. Run initial capture
pnpm screenshots:capture
```

### Daily Usage
```bash
# Capture specific component
pnpm screenshots:capture --component button

# Capture all components
pnpm screenshots:capture --all

# Compare with baseline
pnpm screenshots:diff

# Update baselines
pnpm screenshots:update
```

---

## 📚 Resources

### Tools
- **Playwright**: https://playwright.dev/docs/screenshots
- **Percy**: https://percy.io/
- **Chromatic**: https://www.chromatic.com/
- **BackstopJS**: https://github.com/garris/BackstopJS

### Best Practices
- [Visual Regression Testing Best Practices](https://martinfowler.com/articles/visual-testing.html)
- [Component Screenshot Guidelines](https://storybook.js.org/docs/react/workflows/visual-testing)
- [Responsive Screenshot Testing](https://www.browserstack.com/guide/responsive-design-testing)

---

## 🎯 Success Metrics

- **Coverage**: Screenshots for 100% of components
- **Freshness**: Screenshots updated within 24h of code changes
- **Quality**: All screenshots pass visual regression tests
- **Consistency**: All screenshots follow naming conventions
- **Documentation**: All screenshots have context and purpose

---

**Last Updated**: January 2025  
**Maintainers**: ODAVL Studio Design System Team  
**Status**: Active - Screenshot system ready for use
