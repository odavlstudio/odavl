# 📝 Typography Style Guide - ODAVL Studio

**Version:** 2.0.0  
**Last Updated:** 2025-11-26

---

## Overview

The ODAVL Studio typography system is designed to:
- Establish clear visual hierarchy
- Ensure excellent readability across all screen sizes
- Maintain consistency across all products
- Support accessibility requirements (WCAG 2.1 AA)

---

## Font Families

### Primary Font: Inter

**Use for:** UI text, body copy, headings

**Why Inter?**
- Designed specifically for screens
- Excellent readability at small sizes
- Wide range of weights (400-800)
- Great international character support
- Open source

**Installation:**
```html
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

```css
/* CSS */
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Monospace Font: JetBrains Mono

**Use for:** Code snippets, terminal output, technical data

**Why JetBrains Mono?**
- Designed for developers
- Excellent code ligatures
- Clear distinction between similar characters (0/O, 1/l/I)
- Great readability for long coding sessions

**Installation:**
```html
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

```css
/* CSS */
font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
```

---

## Type Scale

Our type scale is based on a **1.25 (Major Third)** ratio for harmonious sizing.

| Name | Size (rem) | Size (px) | Usage |
|------|------------|-----------|-------|
| **text-xs** | 0.75rem | 12px | Captions, labels, timestamps |
| **text-sm** | 0.875rem | 14px | Secondary text, form labels |
| **text-base** | 1rem | 16px | Body text (default) |
| **text-lg** | 1.125rem | 18px | Emphasized body text |
| **text-xl** | 1.25rem | 20px | Small headings (h4) |
| **text-2xl** | 1.5rem | 24px | Medium headings (h3) |
| **text-3xl** | 1.875rem | 30px | Large headings (h2) |
| **text-4xl** | 2.25rem | 36px | Page titles (h1) |
| **text-5xl** | 3rem | 48px | Display headings |
| **text-6xl** | 3.75rem | 60px | Hero text |

---

## Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| **Normal** | 400 | Body text, default |
| **Medium** | 500 | Emphasized text, labels |
| **Semibold** | 600 | Subheadings, buttons |
| **Bold** | 700 | Headings, strong emphasis |
| **Extrabold** | 800 | Display headings (optional) |

**Guidelines:**
- Body text: Use **Normal (400)**
- Buttons/labels: Use **Semibold (600)**
- Headings: Use **Bold (700)** for h1-h2, **Semibold (600)** for h3-h4

---

## Typography Styles

### Display Text

**Use for:** Hero sections, landing page headings

```css
font-family: 'Inter', sans-serif;
font-size: 3rem; /* 48px */
font-weight: 800; /* Extrabold */
line-height: 1.2;
letter-spacing: -0.02em;
```

**Example:**
```tsx
<h1 className="text-5xl font-extrabold tracking-tighter text-gray-900">
  Autonomous Code Quality
</h1>
```

### Heading 1 (h1)

**Use for:** Page titles

```css
font-size: 2.25rem; /* 36px */
font-weight: 700; /* Bold */
line-height: 1.25;
letter-spacing: -0.01em;
color: var(--color-gray-900);
```

**Example:**
```tsx
<h1 className="text-4xl font-bold tracking-tight text-gray-900">
  ODAVL Insight Dashboard
</h1>
```

### Heading 2 (h2)

**Use for:** Section titles

```css
font-size: 1.875rem; /* 30px */
font-weight: 700; /* Bold */
line-height: 1.25;
color: var(--color-gray-900);
```

**Example:**
```tsx
<h2 className="text-3xl font-bold text-gray-900">
  Recent Errors
</h2>
```

### Heading 3 (h3)

**Use for:** Subsection titles

```css
font-size: 1.5rem; /* 24px */
font-weight: 600; /* Semibold */
line-height: 1.375;
color: var(--color-gray-900);
```

**Example:**
```tsx
<h3 className="text-2xl font-semibold text-gray-900">
  Detector Results
</h3>
```

### Heading 4 (h4)

**Use for:** Component titles, card headings

```css
font-size: 1.25rem; /* 20px */
font-weight: 600; /* Semibold */
line-height: 1.375;
color: var(--color-gray-900);
```

**Example:**
```tsx
<h4 className="text-xl font-semibold text-gray-900">
  TypeScript Errors
</h4>
```

### Body Text

**Use for:** Default paragraph text

```css
font-size: 1rem; /* 16px */
font-weight: 400; /* Normal */
line-height: 1.5;
color: var(--color-gray-600);
```

**Example:**
```tsx
<p className="text-base text-gray-600">
  ODAVL Insight uses machine learning to detect and classify code quality issues...
</p>
```

### Body Large

**Use for:** Emphasized content, lead paragraphs

```css
font-size: 1.125rem; /* 18px */
font-weight: 400; /* Normal */
line-height: 1.625;
color: var(--color-gray-600);
```

**Example:**
```tsx
<p className="text-lg text-gray-600">
  Improve code quality automatically with AI-powered suggestions.
</p>
```

### Body Small

**Use for:** Secondary content, descriptions

```css
font-size: 0.875rem; /* 14px */
font-weight: 400; /* Normal */
line-height: 1.5;
color: var(--color-gray-500);
```

**Example:**
```tsx
<p className="text-sm text-gray-500">
  Last updated 2 hours ago
</p>
```

### Caption

**Use for:** Labels, timestamps, metadata

```css
font-size: 0.75rem; /* 12px */
font-weight: 400; /* Normal */
line-height: 1.5;
letter-spacing: 0.025em;
color: var(--color-gray-500);
```

**Example:**
```tsx
<span className="text-xs text-gray-500 tracking-wide">
  2025-01-09 14:32:15
</span>
```

### Code

**Use for:** Inline code, file names, commands

```css
font-family: 'JetBrains Mono', monospace;
font-size: 0.875rem; /* 14px */
font-weight: 400; /* Normal */
background-color: var(--color-gray-100);
padding: 0.125rem 0.375rem;
border-radius: 0.25rem;
```

**Example:**
```tsx
<code className="font-mono text-sm bg-gray-100 px-1.5 py-0.5 rounded">
  npm install odavl-studio
</code>
```

### Button Text

**Use for:** Button labels

```css
font-size: 0.875rem; /* 14px */
font-weight: 600; /* Semibold */
line-height: 1;
letter-spacing: 0;
```

**Example:**
```tsx
<button className="text-sm font-semibold">
  Run Analysis
</button>
```

---

## Line Heights

Proper line height improves readability:

| Name | Value | Usage |
|------|-------|-------|
| **None** | 1 | Icons, badges (no wrapping) |
| **Tight** | 1.25 | Headings, titles |
| **Snug** | 1.375 | Large text (h3, h4) |
| **Normal** | 1.5 | Body text (default) |
| **Relaxed** | 1.625 | Comfortable reading |
| **Loose** | 2 | Spacious text blocks |

**Guidelines:**
- Headings (h1-h2): Use **Tight (1.25)**
- Subheadings (h3-h4): Use **Snug (1.375)**
- Body text: Use **Normal (1.5)** or **Relaxed (1.625)** for long-form content

---

## Letter Spacing

Subtle adjustments improve legibility:

| Name | Value | Usage |
|------|-------|-------|
| **Tighter** | -0.05em | Large headings (display) |
| **Tight** | -0.025em | Headings (h1-h2) |
| **Normal** | 0 | Body text (default) |
| **Wide** | 0.025em | Small text (captions) |
| **Wider** | 0.05em | All-caps text |
| **Widest** | 0.1em | Very spaced out |

**Guidelines:**
- Large headings (48px+): Use **Tighter (-0.05em)**
- Regular headings: Use **Tight (-0.025em)** or **Normal (0)**
- Small text (<14px): Use **Wide (0.025em)** to improve readability
- ALL CAPS text: Use **Wider (0.05em)** for breathing room

---

## Responsive Typography

Typography scales down on smaller screens for optimal readability:

### Mobile (< 640px)

```css
h1 { font-size: 1.875rem; } /* 30px instead of 36px */
h2 { font-size: 1.5rem; } /* 24px instead of 30px */
h3 { font-size: 1.25rem; } /* 20px instead of 24px */
display { font-size: 2.25rem; } /* 36px instead of 48px */
```

### Tablet (640px - 1024px)

```css
h1 { font-size: 2.25rem; } /* 36px */
h2 { font-size: 1.875rem; } /* 30px */
h3 { font-size: 1.5rem; } /* 24px */
display { font-size: 3rem; } /* 48px */
```

### Desktop (> 1024px)

```css
/* Use full sizes from type scale */
```

**Example with Tailwind:**
```tsx
<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
  Responsive Heading
</h1>
```

---

## Accessibility

### Contrast Requirements

**WCAG 2.1 Level AA:**
- **Normal text (< 18px or < 14px bold):** 4.5:1 minimum
- **Large text (≥ 18px or ≥ 14px bold):** 3:1 minimum

**Tested Combinations:**

✅ **Passes:**
- gray-900 on white: 15.45:1 ✅ (excellent)
- gray-600 on white: 7.21:1 ✅ (great for body text)
- primary-600 on white: 6.12:1 ✅ (good for links)

❌ **Fails:**
- gray-400 on white: 2.81:1 ❌ (disabled text only)
- gray-300 on white: 1.87:1 ❌ (borders only, not text)

### Font Size Minimums

**Recommendations:**
- Body text: Minimum **16px** (1rem)
- Secondary text: Minimum **14px** (0.875rem)
- Captions: Minimum **12px** (0.75rem)

**Note:** Never go below 12px for any user-facing text.

### Line Length

**Optimal line length:** 45-75 characters (average 66 characters)

**Implementation:**
```css
.prose {
  max-width: 65ch; /* ~65 characters */
}
```

**Example:**
```tsx
<article className="prose max-w-2xl mx-auto">
  <p>Body text with optimal line length...</p>
</article>
```

---

## Best Practices

### Do's ✅

**Establish hierarchy:**
```tsx
<h1>Main Title</h1>        {/* 36px, bold */}
<h2>Section</h2>           {/* 30px, bold */}
<h3>Subsection</h3>        {/* 24px, semibold */}
<p>Body text...</p>        {/* 16px, normal */}
```

**Use consistent weights:**
- Headings: 600-700
- Body: 400
- Labels/buttons: 600

**Provide adequate line height:**
- Headings: 1.25
- Body: 1.5-1.625

**Scale responsively:**
```tsx
<h1 className="text-3xl md:text-4xl lg:text-5xl">
  Responsive Heading
</h1>
```

### Don'ts ❌

**Don't mix too many weights:**
```tsx
{/* Bad */}
<p className="font-light">Light</p>
<p className="font-normal">Normal</p>
<p className="font-medium">Medium</p>
<p className="font-semibold">Semibold</p>
<p className="font-bold">Bold</p>

{/* Good - stick to 2-3 weights */}
<h1 className="font-bold">Heading</h1>
<p className="font-normal">Body</p>
<button className="font-semibold">Action</button>
```

**Don't use all caps excessively:**
```tsx
{/* Bad - hard to read */}
<p className="uppercase">ENTIRE PARAGRAPH IN ALL CAPS IS DIFFICULT TO READ</p>

{/* Good - sparingly */}
<span className="uppercase text-xs tracking-wider">Label</span>
```

**Don't use tight line height for long text:**
```tsx
{/* Bad */}
<p className="leading-tight">
  Long paragraph with tight line height is hard to read...
</p>

{/* Good */}
<p className="leading-relaxed">
  Long paragraph with relaxed line height is comfortable...
</p>
```

---

## Component Typography Patterns

### Navigation

```tsx
<nav>
  <a href="/" className="text-sm font-medium text-gray-700 hover:text-gray-900">
    Home
  </a>
  <a href="/insight" className="text-sm font-medium text-gray-700 hover:text-gray-900">
    Insight
  </a>
</nav>
```

### Cards

```tsx
<Card>
  <CardTitle className="text-xl font-semibold text-gray-900">
    Card Title
  </CardTitle>
  <CardDescription className="text-sm text-gray-500 mt-1">
    Supporting description
  </CardDescription>
  <CardContent className="text-base text-gray-600 mt-4">
    Body content...
  </CardContent>
</Card>
```

### Forms

```tsx
<FormField>
  <Label className="text-sm font-medium text-gray-700">
    Email Address
  </Label>
  <Input type="email" className="text-base" />
  <FormHelp className="text-xs text-gray-500 mt-1">
    We'll never share your email.
  </FormHelp>
</FormField>
```

### Data Tables

```tsx
<Table>
  <TableHeader className="text-xs font-semibold uppercase tracking-wider text-gray-500">
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody className="text-sm text-gray-600">
    <TableRow>
      <TableCell className="font-medium text-gray-900">Item</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## Implementation

### CSS Custom Properties

```css
:root {
  /* Font Families */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
}

/* Typography Styles */
h1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}

body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}
```

### Tailwind CSS

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        // ... rest of scale
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.625'
      }
    }
  }
};
```

---

## Resources

**Fonts:**
- [Inter Font](https://rsms.me/inter/)
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/)
- [Google Fonts](https://fonts.google.com/)

**Tools:**
- [Type Scale Generator](https://type-scale.com/)
- [Modular Scale Calculator](https://www.modularscale.com/)
- [Font Pair](https://fontpair.co/) - Font pairing inspiration

**Reading:**
- [Practical Typography](https://practicaltypography.com/) - Comprehensive guide
- [The Elements of Typographic Style Applied to the Web](http://webtypography.net/)
- [Typography Handbook](https://typographyhandbook.com/)

---

*Last Updated: 2025-11-26*  
*ODAVL Studio Design System v2.0*
