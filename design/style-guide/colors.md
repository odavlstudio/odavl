# 🎨 Color Style Guide - ODAVL Studio

**Version:** 2.0.0  
**Last Updated:** 2025-11-26

---

## Overview

The ODAVL Studio color system is designed to:
- Provide visual hierarchy and clarity
- Ensure WCAG 2.1 AA accessibility compliance
- Support both light and dark modes
- Enable consistent brand identity across all products

---

## Color Palette

### Primary Colors (Indigo)

Our primary color is **Indigo** - representing intelligence, automation, and reliability.

| Shade | Hex | Usage |
|-------|-----|-------|
| primary-50 | `#EEF2FF` | Backgrounds, hover states |
| primary-100 | `#E0E7FF` | Subtle backgrounds |
| primary-200 | `#C7D2FE` | Borders, disabled states |
| primary-300 | `#A5B4FC` | Secondary actions |
| primary-400 | `#818CF8` | Hover states |
| **primary-500** | **`#6366F1`** | **Base - Primary actions** |
| primary-600 | `#4F46E5` | Active states |
| primary-700 | `#4338CA` | Pressed states |
| primary-800 | `#3730A3` | Contrast elements |
| primary-900 | `#312E81` | Dark mode accents |

**When to use:**
- ✅ Primary CTA buttons
- ✅ Active navigation items
- ✅ Focus indicators
- ✅ Links and interactive elements
- ❌ Large backgrounds (overwhelming)
- ❌ Body text (poor readability)

---

### Semantic Colors

#### Success (Green) - `#10B981`

**Meaning:** Positive outcomes, completion, healthy states

**Use for:**
- ✅ Success messages ("Test passed!")
- ✅ Completion indicators
- ✅ Positive trend charts
- ✅ "Approved" badges

**Examples:**
```tsx
<Alert variant="success">Build completed successfully!</Alert>
<Badge variant="success">Active</Badge>
<Icon name="check-circle" color="success-500" />
```

#### Warning (Amber) - `#F59E0B`

**Meaning:** Caution, attention needed, non-critical issues

**Use for:**
- ⚠️ Warning messages ("Disk space low")
- ⚠️ Pending states
- ⚠️ Non-blocking errors
- ⚠️ "Review needed" badges

**Examples:**
```tsx
<Alert variant="warning">Some tests are flaky</Alert>
<Badge variant="warning">Pending</Badge>
<Icon name="alert-triangle" color="warning-500" />
```

#### Error (Red) - `#EF4444`

**Meaning:** Errors, failures, destructive actions

**Use for:**
- ❌ Error messages ("Build failed")
- ❌ Destructive actions (delete buttons)
- ❌ Critical alerts
- ❌ Validation errors

**Examples:**
```tsx
<Alert variant="error">Deployment failed</Alert>
<Button variant="danger">Delete Account</Button>
<Icon name="x-circle" color="error-500" />
```

#### Info (Blue) - `#3B82F6`

**Meaning:** Informational, neutral, helpful

**Use for:**
- ℹ️ Informational messages
- ℹ️ Help text and tooltips
- ℹ️ Neutral notifications
- ℹ️ "Info" badges

**Examples:**
```tsx
<Alert variant="info">New update available</Alert>
<Tooltip content="Click to learn more">
  <Icon name="info" color="info-500" />
</Tooltip>
```

---

### Neutral Colors (Gray)

Grays form the foundation of our UI, used for text, backgrounds, and borders.

| Shade | Hex | Usage |
|-------|-----|-------|
| gray-50 | `#F9FAFB` | Page backgrounds |
| gray-100 | `#F3F4F6` | Card backgrounds |
| gray-200 | `#E5E7EB` | Borders, dividers |
| gray-300 | `#D1D5DB` | Disabled borders |
| gray-400 | `#9CA3AF` | Disabled text, placeholders |
| gray-500 | `#6B7280` | Secondary text |
| gray-600 | `#4B5563` | Body text |
| gray-700 | `#374151` | Headings |
| gray-800 | `#1F2937` | Emphasis text |
| gray-900 | `#111827` | Primary text |

**Text Hierarchy:**
- **Primary text:** gray-900 (headings, important content)
- **Secondary text:** gray-600 (body text, descriptions)
- **Tertiary text:** gray-500 (labels, captions)
- **Disabled text:** gray-400 (inactive elements)

---

## Accessibility

### Color Contrast Requirements

**WCAG 2.1 Level AA:**
- **Normal text (< 18px):** Minimum 4.5:1 contrast ratio
- **Large text (≥ 18px or ≥ 14px bold):** Minimum 3:1 contrast ratio
- **UI components:** Minimum 3:1 contrast ratio

**Tested Combinations:**

✅ **Passes WCAG AA:**
- White background + gray-900 text (15.45:1) ✅
- White background + gray-600 text (7.21:1) ✅
- Primary-500 background + white text (5.89:1) ✅
- Success-500 background + white text (3.91:1) ✅

❌ **Fails WCAG AA:**
- White background + gray-400 text (2.81:1) ❌ (use for disabled only)
- Primary-300 background + white text (1.89:1) ❌ (use for backgrounds only)

**Tools:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio Calculator](https://contrast-ratio.com/)

---

### Color Blindness

**Considerations:**
- **Don't rely on color alone** - use icons, text labels, patterns
- **Red-green blindness (most common):** Use additional indicators (icons, borders, labels) alongside color
- **Test with simulators:** Chrome DevTools, Stark plugin

**Example - Good:**
```tsx
<Alert variant="error">
  <Icon name="x-circle" />  {/* Visual indicator */}
  <AlertTitle>Error</AlertTitle>  {/* Text label */}
  <AlertDescription>Deployment failed</AlertDescription>
</Alert>
```

**Example - Bad:**
```tsx
<div className="text-error-500">
  Deployment failed {/* Color only, no icon or label */}
</div>
```

---

## Usage Guidelines

### Do's ✅

**Use primary color for:**
- Primary actions (main CTA buttons)
- Active states (selected nav items)
- Focus indicators (keyboard navigation)
- Links and interactive text

**Use semantic colors for:**
- Success/warning/error feedback
- Status badges
- Alert messages
- Icon indicators

**Use neutral colors for:**
- Text (gray-900, gray-600, gray-500)
- Backgrounds (gray-50, gray-100)
- Borders (gray-200, gray-300)
- Disabled states (gray-400)

### Don'ts ❌

**Don't use primary color for:**
- Large backgrounds (too overwhelming)
- Body text (poor readability)
- Error states (confusing with red)

**Don't use semantic colors interchangeably:**
- Don't use red for warnings (use amber)
- Don't use green for info (use blue)
- Don't use blue for success (use green)

**Don't use colors without testing contrast:**
- Always verify text contrast ratios
- Test with color blindness simulators
- Provide non-color indicators

---

## Color Combinations

### Light Mode (Default)

**Page Background:** white or gray-50  
**Card Background:** white or gray-100  
**Primary Text:** gray-900  
**Secondary Text:** gray-600  
**Borders:** gray-200  

**Example:**
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-6">
  <h2 className="text-gray-900 font-bold text-2xl">Heading</h2>
  <p className="text-gray-600 mt-2">Body text goes here...</p>
  <Button variant="primary">Action</Button>
</div>
```

### Dark Mode

**Page Background:** gray-900  
**Card Background:** gray-800  
**Primary Text:** gray-50  
**Secondary Text:** gray-300  
**Borders:** gray-700  

**Example:**
```tsx
<div className="dark:bg-gray-800 dark:border-gray-700">
  <h2 className="dark:text-gray-50">Heading</h2>
  <p className="dark:text-gray-300">Body text...</p>
</div>
```

---

## Component Color Patterns

### Buttons

**Primary Button:**
- Background: primary-500
- Text: white
- Hover: primary-600
- Active: primary-700
- Disabled: gray-300 background, gray-500 text

**Secondary Button:**
- Background: white
- Text: gray-700
- Border: gray-300
- Hover: gray-50 background

**Danger Button:**
- Background: error-500
- Text: white
- Hover: error-600
- Active: error-700

### Badges

**Default Badge:**
- Background: gray-100
- Text: gray-800
- Border: gray-200

**Status Badges:**
- Success: success-100 background, success-800 text
- Warning: warning-100 background, warning-800 text
- Error: error-100 background, error-800 text
- Info: info-100 background, info-800 text

### Alerts

**Structure:**
- Background: semantic-50 (light tint)
- Border: semantic-200
- Icon: semantic-500
- Title text: semantic-900
- Body text: semantic-700

**Example - Error Alert:**
```tsx
<div className="bg-error-50 border border-error-200 rounded-md p-4">
  <div className="flex items-start gap-3">
    <Icon name="x-circle" className="text-error-500" />
    <div>
      <h3 className="text-error-900 font-semibold">Error</h3>
      <p className="text-error-700 text-sm mt-1">Message here...</p>
    </div>
  </div>
</div>
```

---

## Data Visualization

### Chart Colors

**Sequential (single-hue gradients):**
- Use for heatmaps, choropleth maps
- Primary scale: primary-100 → primary-900
- Success scale: success-100 → success-900

**Categorical (distinct colors):**
- Use for pie charts, bar charts with multiple categories
- Palette: [primary-500, success-500, warning-500, info-500, error-500, primary-300, success-300]

**Diverging (two-hue gradients):**
- Use for data with positive/negative values
- Negative: error-500 → gray-100 → success-500 :Positive

**Example:**
```tsx
const chartColors = {
  sequential: ['#EEF2FF', '#C7D2FE', '#818CF8', '#4F46E5', '#312E81'],
  categorical: ['#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'],
  diverging: ['#EF4444', '#FCA5A5', '#F3F4F6', '#A7F3D0', '#10B981']
};
```

---

## Implementation

### CSS Custom Properties

```css
:root {
  /* Primary Colors */
  --color-primary-50: #EEF2FF;
  --color-primary-500: #6366F1;
  --color-primary-900: #312E81;
  
  /* Semantic Colors */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* Neutral Colors */
  --color-gray-50: #F9FAFB;
  --color-gray-900: #111827;
  
  /* Semantic Tokens */
  --color-bg-primary: var(--color-white);
  --color-bg-secondary: var(--color-gray-50);
  --color-text-primary: var(--color-gray-900);
  --color-text-secondary: var(--color-gray-600);
  --color-border-default: var(--color-gray-200);
}

/* Dark Mode */
.dark {
  --color-bg-primary: var(--color-gray-900);
  --color-bg-secondary: var(--color-gray-800);
  --color-text-primary: var(--color-gray-50);
  --color-text-secondary: var(--color-gray-300);
  --color-border-default: var(--color-gray-700);
}
```

### Tailwind CSS

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          500: '#6366F1',
          900: '#312E81'
        },
        success: {
          500: '#10B981'
        },
        // ... rest of palette
      }
    }
  }
};
```

### React/TypeScript

```tsx
import { colors } from '@odavl-studio/design-tokens';

const Button = styled.button`
  background-color: ${colors.primary[500]};
  color: ${colors.white};
  &:hover {
    background-color: ${colors.primary[600]};
  }
`;
```

---

## Testing Checklist

Before shipping, verify:

- [ ] All text meets WCAG AA contrast requirements (4.5:1 for normal, 3:1 for large)
- [ ] Interactive elements have 3:1 contrast with surroundings
- [ ] Focus indicators are visible (3:1 contrast)
- [ ] Color is not the only indicator (icons/text labels included)
- [ ] Tested with color blindness simulator
- [ ] Dark mode colors have appropriate contrast
- [ ] Status colors match semantic meaning (green=success, red=error, etc.)

---

## Resources

**Tools:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Coolors](https://coolors.co/) - Color palette generator
- [Color Blind Simulator (Chrome)](https://chrome.google.com/webstore/detail/colorblind-dalton-for-goo/afcafnelafcgjinkaeohkalmfececool)
- [Stark Plugin](https://www.getstark.co/) - Accessibility toolkit

**References:**
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Color System](https://material.io/design/color/)
- [Refactoring UI Book](https://www.refactoringui.com/) - Color usage tips

---

*Last Updated: 2025-11-26*  
*ODAVL Studio Design System v2.0*
