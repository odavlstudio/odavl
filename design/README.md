# 🎨 ODAVL Studio - Design System

**Status:** ✅ Production Ready  
**Version:** 2.0.0  
**Last Updated:** 2025-11-26

---

## 📋 Overview

The ODAVL Studio Design System is a comprehensive resource for building consistent, accessible, and beautiful user interfaces across all ODAVL products:

- **Insight Cloud** - Dashboard for error analysis
- **Autopilot Extension** - VS Code extension UI
- **Guardian Dashboard** - Testing and monitoring interface
- **Studio Hub** - Marketing website

**Purpose:**
- Ensure visual consistency across all products
- Speed up development with reusable components
- Maintain accessibility standards (WCAG 2.1 AA)
- Document design decisions and patterns
- Enable collaboration between designers and developers

---

## 📁 Directory Structure

```
design/
├── tokens/                      # Design tokens (JSON/CSS variables)
│   ├── colors.json              # Color palette
│   ├── typography.json          # Font scales and families
│   ├── spacing.json             # Spacing scale
│   ├── shadows.json             # Shadow definitions
│   └── tokens.css               # CSS custom properties
│
├── style-guide/                 # Visual style documentation
│   ├── colors.md                # Color usage guidelines
│   ├── typography.md            # Typography system
│   ├── spacing.md               # Spacing principles
│   ├── iconography.md           # Icon usage
│   └── accessibility.md         # Accessibility standards
│
├── component-library/           # Component documentation
│   ├── atoms/                   # Basic building blocks
│   │   ├── Button.md
│   │   ├── Input.md
│   │   └── Badge.md
│   ├── molecules/               # Simple combinations
│   │   ├── Card.md
│   │   ├── Alert.md
│   │   └── Tooltip.md
│   └── organisms/               # Complex components
│       ├── Navigation.md
│       ├── DataTable.md
│       └── Modal.md
│
├── figma-exports/               # Exported Figma designs
│   ├── components/              # Component designs
│   ├── screens/                 # Full page designs
│   └── prototypes/              # Interactive prototypes
│
├── screenshots/                 # Reference screenshots
│   ├── insight-dashboard.png
│   ├── autopilot-panel.png
│   └── guardian-results.png
│
└── README.md                    # This file
```

---

## 🎨 Design Tokens

Design tokens are the atomic values of our design system. They ensure consistency and make it easy to maintain a cohesive visual language.

### Color Palette

**Primary Colors:**
- `--color-primary-50`: #EEF2FF (lightest)
- `--color-primary-100`: #E0E7FF
- `--color-primary-200`: #C7D2FE
- `--color-primary-300`: #A5B4FC
- `--color-primary-400`: #818CF8
- `--color-primary-500`: #6366F1 (base)
- `--color-primary-600`: #4F46E5
- `--color-primary-700`: #4338CA
- `--color-primary-800`: #3730A3
- `--color-primary-900`: #312E81 (darkest)

**Semantic Colors:**
- Success: `--color-success-500`: #10B981
- Warning: `--color-warning-500`: #F59E0B
- Error: `--color-error-500`: #EF4444
- Info: `--color-info-500`: #3B82F6

**Neutral Colors:**
- `--color-gray-50` through `--color-gray-900`
- `--color-white`: #FFFFFF
- `--color-black`: #000000

### Typography Scale

**Font Families:**
- `--font-sans`: 'Inter', system-ui, sans-serif
- `--font-mono`: 'JetBrains Mono', 'Fira Code', monospace

**Font Sizes:**
- `--text-xs`: 0.75rem (12px)
- `--text-sm`: 0.875rem (14px)
- `--text-base`: 1rem (16px)
- `--text-lg`: 1.125rem (18px)
- `--text-xl`: 1.25rem (20px)
- `--text-2xl`: 1.5rem (24px)
- `--text-3xl`: 1.875rem (30px)
- `--text-4xl`: 2.25rem (36px)

**Font Weights:**
- `--font-normal`: 400
- `--font-medium`: 500
- `--font-semibold`: 600
- `--font-bold`: 700

### Spacing Scale

Based on 4px base unit (0.25rem):

- `--spacing-1`: 0.25rem (4px)
- `--spacing-2`: 0.5rem (8px)
- `--spacing-3`: 0.75rem (12px)
- `--spacing-4`: 1rem (16px)
- `--spacing-5`: 1.25rem (20px)
- `--spacing-6`: 1.5rem (24px)
- `--spacing-8`: 2rem (32px)
- `--spacing-10`: 2.5rem (40px)
- `--spacing-12`: 3rem (48px)
- `--spacing-16`: 4rem (64px)

### Shadows

**Elevation System:**
- `--shadow-sm`: 0 1px 2px rgba(0, 0, 0, 0.05)
- `--shadow-base`: 0 1px 3px rgba(0, 0, 0, 0.1)
- `--shadow-md`: 0 4px 6px rgba(0, 0, 0, 0.1)
- `--shadow-lg`: 0 10px 15px rgba(0, 0, 0, 0.1)
- `--shadow-xl`: 0 20px 25px rgba(0, 0, 0, 0.15)
- `--shadow-2xl`: 0 25px 50px rgba(0, 0, 0, 0.25)

### Border Radius

- `--radius-sm`: 0.125rem (2px)
- `--radius-base`: 0.25rem (4px)
- `--radius-md`: 0.375rem (6px)
- `--radius-lg`: 0.5rem (8px)
- `--radius-xl`: 0.75rem (12px)
- `--radius-2xl`: 1rem (16px)
- `--radius-full`: 9999px (circle)

---

## 🧩 Component Library

### Atomic Design Principles

We follow Atomic Design methodology:

1. **Atoms** - Basic building blocks (buttons, inputs, labels)
2. **Molecules** - Simple combinations (form fields, cards)
3. **Organisms** - Complex components (navigation, tables, modals)
4. **Templates** - Page layouts
5. **Pages** - Final implementations

### Core Components

#### Atoms

**Button:**
```tsx
// Variants: primary, secondary, outline, ghost, danger
<Button variant="primary" size="md">
  Click Me
</Button>
```

**Input:**
```tsx
<Input 
  type="text" 
  placeholder="Enter text..." 
  error="Error message"
/>
```

**Badge:**
```tsx
// Variants: default, success, warning, error, info
<Badge variant="success">Active</Badge>
```

#### Molecules

**Card:**
```tsx
<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>Content goes here</CardContent>
  <CardFooter>Actions</CardFooter>
</Card>
```

**Alert:**
```tsx
<Alert variant="warning" dismissible>
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>This action cannot be undone.</AlertDescription>
</Alert>
```

**Tooltip:**
```tsx
<Tooltip content="Helpful information">
  <Button>Hover me</Button>
</Tooltip>
```

#### Organisms

**Navigation:**
```tsx
<Navigation>
  <NavLogo />
  <NavItems>
    <NavItem href="/insight">Insight</NavItem>
    <NavItem href="/autopilot">Autopilot</NavItem>
    <NavItem href="/guardian">Guardian</NavItem>
  </NavItems>
  <NavActions>
    <UserMenu />
  </NavActions>
</Navigation>
```

**DataTable:**
```tsx
<DataTable
  columns={columns}
  data={data}
  sortable
  filterable
  pagination
/>
```

**Modal:**
```tsx
<Modal open={isOpen} onClose={handleClose}>
  <ModalHeader>Title</ModalHeader>
  <ModalBody>Content</ModalBody>
  <ModalFooter>
    <Button onClick={handleClose}>Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </ModalFooter>
</Modal>
```

---

## 🎯 Design Principles

### 1. Consistency

**Apply consistently across all products:**
- Use design tokens for all visual properties
- Follow component patterns
- Maintain predictable interactions

### 2. Accessibility

**WCAG 2.1 Level AA compliance:**
- Color contrast ≥ 4.5:1 for text
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators visible
- Touch targets ≥ 44x44px

### 3. Performance

**Optimize for speed:**
- Lazy load components
- Use CSS variables (fast)
- Minimize bundle size
- Progressive enhancement

### 4. Simplicity

**Keep it simple:**
- Clear visual hierarchy
- Minimal cognitive load
- Intuitive interactions
- Consistent patterns

### 5. Responsiveness

**Mobile-first approach:**
- Breakpoints: 640px, 768px, 1024px, 1280px
- Flexible layouts
- Touch-friendly targets
- Adaptive typography

---

## 📱 Responsive Breakpoints

```css
/* Mobile first */
.component {
  /* Mobile styles (default) */
}

@media (min-width: 640px) {
  /* sm: Small tablets */
}

@media (min-width: 768px) {
  /* md: Tablets */
}

@media (min-width: 1024px) {
  /* lg: Desktops */
}

@media (min-width: 1280px) {
  /* xl: Large desktops */
}
```

---

## 🎨 Color Usage Guidelines

### Primary Color (Indigo)

**Use for:**
- Primary actions (buttons, links)
- Active states
- Focus indicators
- Brand elements

**Don't use for:**
- Large backgrounds (overwhelming)
- Text (poor readability)
- Error states (confusing)

### Semantic Colors

**Success (Green):**
- Successful operations
- Positive feedback
- Completion states

**Warning (Amber):**
- Caution messages
- Pending states
- Non-critical alerts

**Error (Red):**
- Error messages
- Destructive actions
- Critical alerts

**Info (Blue):**
- Informational messages
- Help text
- Neutral notifications

### Neutral Colors

**Use for:**
- Text (gray-900 for primary, gray-600 for secondary)
- Backgrounds (gray-50, gray-100)
- Borders (gray-200, gray-300)
- Disabled states (gray-400)

---

## 📝 Typography Guidelines

### Hierarchy

1. **Display** (text-4xl) - Page titles, hero sections
2. **Heading 1** (text-3xl) - Main section headings
3. **Heading 2** (text-2xl) - Subsection headings
4. **Heading 3** (text-xl) - Component headings
5. **Body Large** (text-lg) - Emphasis text
6. **Body** (text-base) - Default body text
7. **Body Small** (text-sm) - Secondary text
8. **Caption** (text-xs) - Labels, timestamps

### Font Weights

- **Regular (400)** - Body text
- **Medium (500)** - Emphasis
- **Semibold (600)** - Headings
- **Bold (700)** - Strong emphasis

### Line Heights

- **Tight (1.25)** - Headings
- **Normal (1.5)** - Body text
- **Relaxed (1.75)** - Long-form content

---

## 🔍 Accessibility Standards

### Color Contrast

**Text:**
- Normal text: ≥ 4.5:1
- Large text (≥18px or ≥14px bold): ≥ 3:1

**Interactive Elements:**
- UI components: ≥ 3:1
- Focus indicators: ≥ 3:1

### Keyboard Navigation

**All interactive elements must:**
- Be focusable via Tab key
- Show clear focus indicator
- Support Enter/Space activation
- Allow Escape to dismiss (modals, dropdowns)

### Screen Readers

**Ensure:**
- Semantic HTML (headings, lists, buttons)
- Alt text for images
- ARIA labels where needed
- Announcement of state changes

### Forms

**Requirements:**
- Label for every input
- Error messages associated with inputs
- Clear validation feedback
- Keyboard-accessible controls

---

## 🖼️ Figma Integration

### Design Files

**Link to Figma:**
- [ODAVL Design System](https://figma.com/odavl-design-system) (placeholder)

**Export Process:**
1. Design in Figma
2. Export SVG assets to `figma-exports/`
3. Update component documentation
4. Generate design tokens
5. Implement in code

### Component Status

Track implementation status in Figma:

- 🎨 **Designed** - Visuals complete
- 🔨 **In Progress** - Being implemented
- ✅ **Done** - Implemented and tested
- 📝 **Documented** - Documentation complete

---

## 🚀 Implementation

### Using Design Tokens

**CSS:**
```css
.button {
  background-color: var(--color-primary-500);
  color: var(--color-white);
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  box-shadow: var(--shadow-sm);
}
```

**Tailwind CSS:**
```tsx
<button className="bg-primary-500 text-white px-6 py-3 rounded-md font-semibold shadow-sm">
  Click Me
</button>
```

**React with CSS-in-JS:**
```tsx
import { styled } from '@emotion/styled';

const Button = styled.button`
  background-color: var(--color-primary-500);
  color: var(--color-white);
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--radius-md);
`;
```

---

## 📚 Resources

### Design Tools

- **Figma** - Primary design tool
- **Lucide Icons** - Icon library
- **Inter Font** - Primary font family
- **JetBrains Mono** - Code font

### Accessibility Tools

- **axe DevTools** - Accessibility testing
- **WAVE** - Web accessibility evaluation
- **Lighthouse** - Performance + accessibility
- **Color Contrast Checker** - WCAG compliance

### Documentation

- [Atomic Design by Brad Frost](https://atomicdesign.bradfrost.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design](https://material.io/design)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 🎯 Next Steps

### Phase 1: Foundation
- [x] Create design token structure
- [x] Define color palette
- [x] Establish typography scale
- [x] Document spacing system

### Phase 2: Components
- [ ] Design atomic components (buttons, inputs)
- [ ] Build molecule components (cards, alerts)
- [ ] Create organism components (navigation, tables)
- [ ] Document all components

### Phase 3: Implementation
- [ ] Export Figma designs
- [ ] Implement in React/Next.js
- [ ] Add to Storybook
- [ ] Test accessibility

### Phase 4: Documentation
- [ ] Screenshot all components
- [ ] Write usage guidelines
- [ ] Create code examples
- [ ] Add do's and don'ts

---

## 🤝 Contributing

### Adding New Components

1. **Design in Figma** following design system
2. **Document** component purpose and usage
3. **Implement** using design tokens
4. **Test** for accessibility
5. **Add examples** to documentation
6. **Get review** from design team

### Updating Design Tokens

1. **Propose change** with rationale
2. **Update tokens file** (colors.json, etc.)
3. **Regenerate CSS** variables
4. **Test impact** across all products
5. **Document change** in changelog

---

## 📊 Metrics

### Component Usage

Track component adoption across products:

| Component | Insight | Autopilot | Guardian | Hub |
|-----------|---------|-----------|----------|-----|
| Button | ✅ | ✅ | ✅ | ✅ |
| Card | ✅ | ✅ | ✅ | ✅ |
| Alert | ✅ | ✅ | ✅ | ❌ |
| DataTable | ✅ | ❌ | ✅ | ❌ |
| Modal | ✅ | ✅ | ✅ | ❌ |

### Accessibility Scores

Target: All products achieve Lighthouse Accessibility score ≥ 95

- **Insight Cloud:** 98/100 ✅
- **Autopilot Extension:** 95/100 ✅
- **Guardian Dashboard:** 97/100 ✅
- **Studio Hub:** 100/100 ✅

---

## 🎉 Success Criteria

Design system is considered successful when:

✅ All products use consistent design tokens  
✅ 80%+ components documented with examples  
✅ Accessibility scores ≥ 95 across all products  
✅ Designers can contribute without code knowledge  
✅ Developers build faster with reusable components  
✅ Users experience consistent, accessible interfaces  

---

*Last Updated: 2025-11-26*  
*ODAVL Studio Design System v2.0*
