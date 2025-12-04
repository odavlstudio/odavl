# 📏 Spacing Style Guide - ODAVL Studio

**Version:** 2.0.0  
**Last Updated:** 2025-11-26

---

## Overview

The ODAVL Studio spacing system provides:
- Consistent rhythm across all interfaces
- Predictable layout patterns
- Responsive design support
- 4px base grid for alignment

---

## Spacing Scale

Our spacing system is based on a **4px base unit** (0.25rem), creating a harmonious and predictable grid.

| Token | Value (rem) | Value (px) | Usage |
|-------|-------------|------------|-------|
| **spacing-0** | 0 | 0px | No spacing, reset |
| **spacing-1** | 0.25rem | 4px | Smallest spacing, tight layouts |
| **spacing-2** | 0.5rem | 8px | Extra small, compact elements |
| **spacing-3** | 0.75rem | 12px | Small, comfortable padding |
| **spacing-4** | 1rem | 16px | Base spacing (default) |
| **spacing-5** | 1.25rem | 20px | Medium, standard gaps |
| **spacing-6** | 1.5rem | 24px | Large, comfortable separation |
| **spacing-7** | 1.75rem | 28px | Extra large, generous spacing |
| **spacing-8** | 2rem | 32px | 2x, section spacing |
| **spacing-10** | 2.5rem | 40px | 2.5x, large sections |
| **spacing-12** | 3rem | 48px | 3x, major sections |
| **spacing-16** | 4rem | 64px | 4x, page sections |
| **spacing-20** | 5rem | 80px | 5x, large page sections |
| **spacing-24** | 6rem | 96px | 6x, hero sections |
| **spacing-32** | 8rem | 128px | 8x, extra large sections |

---

## 4px Base Grid

All spacing values are **multiples of 4px** to ensure:
- Perfect alignment
- Consistent visual rhythm
- Easy mental math (4, 8, 12, 16, 20, 24...)
- Compatibility with design tools (Figma, Sketch)

**Why 4px?**
- Divisible by 2 (half spacing: 2px)
- Common browser default (1rem = 16px = 4 × 4px)
- Works well with modern displays (retina, high-DPI)

---

## Layout Spacing

### Container Padding

**Use for:** Horizontal padding around page containers

```css
/* Mobile */
.container {
  padding-left: 1rem; /* 16px */
  padding-right: 1rem; /* 16px */
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding-left: 1.5rem; /* 24px */
    padding-right: 1.5rem; /* 24px */
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding-left: 2rem; /* 32px */
    padding-right: 2rem; /* 32px */
  }
}
```

**Tailwind:**
```tsx
<div className="container px-4 md:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Section Gaps

**Use for:** Vertical spacing between major sections

| Size | Mobile | Tablet | Desktop | Usage |
|------|--------|--------|---------|-------|
| **Small** | 2rem (32px) | 2rem (32px) | 2rem (32px) | Tight sections |
| **Medium** | 3rem (48px) | 3rem (48px) | 3rem (48px) | Standard sections |
| **Large** | 4rem (64px) | 4rem (64px) | 4rem (64px) | Major sections |

**Example:**
```tsx
<section className="py-8 md:py-12 lg:py-16">
  {/* Section content */}
</section>
```

### Grid System

**Columns:**
- Mobile: 4 columns
- Tablet: 8 columns
- Desktop: 12 columns

**Gutter (gap between columns):**
- Mobile: 1rem (16px)
- Tablet: 1.5rem (24px)
- Desktop: 2rem (32px)

**Example:**
```tsx
<div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8">
  <div className="col-span-4">Column 1</div>
  <div className="col-span-4">Column 2</div>
  <div className="col-span-4">Column 3</div>
</div>
```

---

## Component Spacing

### Buttons

**Padding:**
- **Small:** `py-2 px-3` (8px × 12px)
- **Medium:** `py-3 px-4` (12px × 16px)
- **Large:** `py-4 px-6` (16px × 24px)

**Example:**
```tsx
<Button size="sm" className="py-2 px-3">Small</Button>
<Button size="md" className="py-3 px-4">Medium</Button>
<Button size="lg" className="py-4 px-6">Large</Button>
```

**Gap between buttons:**
```tsx
<div className="flex gap-3">
  <Button>Cancel</Button>
  <Button variant="primary">Confirm</Button>
</div>
```

### Inputs

**Padding:**
- **Small:** `py-2 px-3` (8px × 12px)
- **Medium:** `py-3 px-4` (12px × 16px)
- **Large:** `py-4 px-5` (16px × 20px)

**Example:**
```tsx
<Input size="sm" className="py-2 px-3" />
<Input size="md" className="py-3 px-4" />
<Input size="lg" className="py-4 px-5" />
```

### Cards

**Padding:**
- **Small:** `p-4` (16px)
- **Medium:** `p-6` (24px)
- **Large:** `p-8` (32px)

**Internal gaps:**
- **Small:** `gap-3` (12px)
- **Medium:** `gap-4` (16px)
- **Large:** `gap-6` (24px)

**Example:**
```tsx
<Card className="p-6">
  <CardHeader className="mb-4">
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Content with 16px vertical gaps */}
  </CardContent>
</Card>
```

### Modals

**Padding:**
- **Small:** `p-6` (24px)
- **Medium:** `p-8` (32px)
- **Large:** `p-10` (40px)

**Example:**
```tsx
<Modal>
  <ModalContent className="p-8">
    <ModalHeader className="mb-6">Title</ModalHeader>
    <ModalBody className="mb-6">Content</ModalBody>
    <ModalFooter>Actions</ModalFooter>
  </ModalContent>
</Modal>
```

---

## Semantic Spacing

### Stack (Vertical Spacing)

**Use for:** Vertical spacing between elements in a column

```tsx
{/* Extra small stack (8px) */}
<div className="space-y-2">
  <p>Item 1</p>
  <p>Item 2</p>
  <p>Item 3</p>
</div>

{/* Small stack (12px) */}
<div className="space-y-3">
  <p>Item 1</p>
  <p>Item 2</p>
</div>

{/* Medium stack (16px) */}
<div className="space-y-4">
  <h2>Heading</h2>
  <p>Paragraph</p>
</div>

{/* Large stack (24px) */}
<div className="space-y-6">
  <section>Section 1</section>
  <section>Section 2</section>
</div>
```

### Inline (Horizontal Spacing)

**Use for:** Horizontal spacing between elements in a row

```tsx
{/* Small inline (8px) */}
<div className="flex gap-2">
  <Badge>Tag 1</Badge>
  <Badge>Tag 2</Badge>
  <Badge>Tag 3</Badge>
</div>

{/* Medium inline (16px) */}
<div className="flex gap-4">
  <Button>Cancel</Button>
  <Button>Confirm</Button>
</div>

{/* Large inline (24px) */}
<div className="flex gap-6">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
</div>
```

### Form Fields

**Gap between label and input:** `gap-2` (8px)

**Gap between form fields:** `gap-6` (24px)

**Example:**
```tsx
<form className="space-y-6">
  <FormField>
    <Label className="mb-2">Email</Label>
    <Input type="email" />
    <FormHelp className="mt-1">Help text</FormHelp>
  </FormField>
  
  <FormField>
    <Label className="mb-2">Password</Label>
    <Input type="password" />
  </FormField>
  
  <Button type="submit">Submit</Button>
</form>
```

### Lists

**Gap between list items:**
- **Compact:** `gap-2` (8px)
- **Comfortable:** `gap-4` (16px)
- **Spacious:** `gap-6` (24px)

**Example:**
```tsx
{/* Compact list */}
<ul className="space-y-2">
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>

{/* Comfortable list */}
<ul className="space-y-4">
  <li className="flex items-start gap-3">
    <Icon name="check" />
    <span>Feature 1</span>
  </li>
  <li className="flex items-start gap-3">
    <Icon name="check" />
    <span>Feature 2</span>
  </li>
</ul>
```

### Icons & Text

**Gap between icon and text:** `gap-2` (8px)

**Example:**
```tsx
<Button className="flex items-center gap-2">
  <Icon name="plus" />
  <span>Add Item</span>
</Button>

<Alert className="flex items-start gap-3">
  <Icon name="alert-circle" />
  <div>
    <AlertTitle>Warning</AlertTitle>
    <AlertDescription>Message here</AlertDescription>
  </div>
</Alert>
```

---

## Touch Targets

**WCAG 2.1 Requirement:** Minimum **44px × 44px** touch target size

**Implementation:**
```css
/* Minimum touch target */
.touch-target {
  min-width: 2.75rem; /* 44px */
  min-height: 2.75rem; /* 44px */
}

/* Comfortable touch target */
.touch-target-comfortable {
  min-width: 3rem; /* 48px */
  min-height: 3rem; /* 48px */
}
```

**Example:**
```tsx
{/* Small button with adequate touch target */}
<button className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 py-2">
  <Icon name="heart" />
</button>
```

---

## Responsive Spacing

### Mobile-First Approach

Start with mobile spacing, then increase on larger screens:

```tsx
<section className="py-8 md:py-12 lg:py-16">
  <div className="container px-4 md:px-6 lg:px-8">
    <h1 className="mb-4 md:mb-6 lg:mb-8">Heading</h1>
    <div className="grid gap-4 md:gap-6 lg:gap-8">
      {/* Content */}
    </div>
  </div>
</section>
```

### Breakpoints

```css
/* Small tablets (640px+) */
@media (min-width: 640px) {
  /* Increase spacing slightly */
}

/* Tablets (768px+) */
@media (min-width: 768px) {
  /* Standard spacing increase */
}

/* Desktops (1024px+) */
@media (min-width: 1024px) {
  /* Generous spacing */
}

/* Large desktops (1280px+) */
@media (min-width: 1280px) {
  /* Maximum spacing */
}
```

---

## Z-Index Scale

**Use for:** Layer stacking (dropdowns, modals, tooltips)

| Layer | Z-Index | Usage |
|-------|---------|-------|
| **Base** | 0 | Normal document flow |
| **Dropdown** | 1000 | Dropdowns, popovers |
| **Sticky** | 1020 | Sticky headers |
| **Fixed** | 1030 | Fixed elements |
| **Modal Backdrop** | 1040 | Modal backgrounds |
| **Modal** | 1050 | Modals |
| **Popover** | 1060 | Popovers |
| **Tooltip** | 1070 | Tooltips |
| **Toast** | 1080 | Toast notifications |

**Example:**
```css
.dropdown {
  z-index: 1000;
}

.modal-backdrop {
  z-index: 1040;
}

.modal {
  z-index: 1050;
}

.tooltip {
  z-index: 1070;
}
```

---

## Best Practices

### Do's ✅

**Use consistent spacing:**
```tsx
{/* Good - consistent 16px gaps */}
<div className="space-y-4">
  <Card className="p-6" />
  <Card className="p-6" />
  <Card className="p-6" />
</div>
```

**Stack spacing utilities:**
```tsx
{/* Good - predictable vertical rhythm */}
<article className="space-y-6">
  <h2 className="mb-4">Heading</h2>
  <p>Paragraph 1</p>
  <p>Paragraph 2</p>
  <ul className="space-y-2">
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</article>
```

**Scale spacing responsively:**
```tsx
{/* Good - increases on larger screens */}
<section className="py-8 md:py-12 lg:py-16">
  <div className="space-y-6 md:space-y-8 lg:space-y-12">
    {/* Content */}
  </div>
</section>
```

**Adequate touch targets:**
```tsx
{/* Good - 48px minimum */}
<button className="min-h-[48px] min-w-[48px] px-4 py-3">
  Click Me
</button>
```

### Don'ts ❌

**Don't use arbitrary values:**
```tsx
{/* Bad - doesn't fit spacing scale */}
<div className="p-[17px] mb-[23px]" />

{/* Good - uses spacing tokens */}
<div className="p-4 mb-6" />
```

**Don't mix spacing patterns:**
```tsx
{/* Bad - inconsistent gaps */}
<div className="space-y-2">
  <Card className="mb-4" />  {/* 16px */}
  <Card className="mb-2" />  {/* 8px */}
  <Card className="mb-6" />  {/* 24px */}
</div>

{/* Good - consistent */}
<div className="space-y-4">
  <Card />
  <Card />
  <Card />
</div>
```

**Don't ignore touch target sizes:**
```tsx
{/* Bad - too small for touch (32px) */}
<button className="h-8 w-8">
  <Icon name="close" />
</button>

{/* Good - adequate touch target (44px) */}
<button className="h-11 w-11">
  <Icon name="close" />
</button>
```

---

## Common Patterns

### Page Layout

```tsx
<div className="min-h-screen">
  {/* Header */}
  <header className="h-16 px-4 md:px-6 lg:px-8">
    {/* Nav */}
  </header>
  
  {/* Main content */}
  <main className="py-8 md:py-12 lg:py-16">
    <div className="container mx-auto px-4 md:px-6 lg:px-8">
      <h1 className="mb-8">Page Title</h1>
      <div className="space-y-8">
        {/* Sections */}
      </div>
    </div>
  </main>
  
  {/* Footer */}
  <footer className="mt-16 py-8 px-4 md:px-6 lg:px-8">
    {/* Footer content */}
  </footer>
</div>
```

### Card Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card className="p-6">
    <CardHeader className="mb-4">
      <CardTitle className="mb-2">Title</CardTitle>
      <CardDescription>Description</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Content */}
    </CardContent>
  </Card>
  {/* More cards */}
</div>
```

### Navigation

```tsx
<nav className="flex items-center gap-6 px-6 h-16">
  <Logo />
  <div className="flex gap-4">
    <NavLink>Home</NavLink>
    <NavLink>Insight</NavLink>
    <NavLink>Autopilot</NavLink>
    <NavLink>Guardian</NavLink>
  </div>
  <div className="ml-auto flex gap-3">
    <Button variant="ghost">Sign In</Button>
    <Button variant="primary">Get Started</Button>
  </div>
</nav>
```

### Data Table

```tsx
<Table>
  <TableHeader>
    <TableRow className="h-12">
      <TableHead className="px-6">Name</TableHead>
      <TableHead className="px-6">Status</TableHead>
      <TableHead className="px-6">Date</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="h-14">
      <TableCell className="px-6">Value</TableCell>
      <TableCell className="px-6">
        <Badge>Active</Badge>
      </TableCell>
      <TableCell className="px-6">2025-01-09</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## Implementation

### CSS Custom Properties

```css
:root {
  /* Spacing Scale */
  --spacing-0: 0;
  --spacing-1: 0.25rem; /* 4px */
  --spacing-2: 0.5rem; /* 8px */
  --spacing-3: 0.75rem; /* 12px */
  --spacing-4: 1rem; /* 16px */
  --spacing-6: 1.5rem; /* 24px */
  --spacing-8: 2rem; /* 32px */
  --spacing-12: 3rem; /* 48px */
  --spacing-16: 4rem; /* 64px */
  
  /* Component Spacing */
  --button-padding-x-sm: var(--spacing-3);
  --button-padding-y-sm: var(--spacing-2);
  --card-padding: var(--spacing-6);
  --section-gap: var(--spacing-12);
}

/* Usage */
.card {
  padding: var(--card-padding);
}

.button {
  padding: var(--button-padding-y-sm) var(--button-padding-x-sm);
}
```

### Tailwind CSS

Tailwind's spacing scale matches our system:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    spacing: {
      0: '0',
      1: '0.25rem', // 4px
      2: '0.5rem', // 8px
      3: '0.75rem', // 12px
      4: '1rem', // 16px
      6: '1.5rem', // 24px
      8: '2rem', // 32px
      // ... continues
    }
  }
};
```

---

## Resources

**Tools:**
- [Spacing Calculator](https://spacing.sh/) - Visualize spacing scales
- [Grid Calculator](https://gridcalculator.dk/) - Calculate grid systems

**Reading:**
- [The 8-Point Grid](https://spec.fm/specifics/8-pt-grid) - Why use 8px grids
- [Space in Design Systems](https://medium.com/eightshapes-llc/space-in-design-systems-188bcbae0d62)
- [Material Design Layout](https://material.io/design/layout/understanding-layout.html)

---

*Last Updated: 2025-11-26*  
*ODAVL Studio Design System v2.0*
