# 🎨 Figma Integration - ODAVL Studio

**Version:** 2.0.0  
**Last Updated:** 2025-11-26

---

## Overview

This guide explains how to integrate ODAVL Studio designs from Figma into the codebase, ensuring consistency between design and implementation.

---

## Figma Project Structure

**Main Figma File:** [ODAVL Studio Design System](https://figma.com/odavl-design-system) (placeholder)

### Pages

1. **🎨 Design Tokens** - Colors, typography, spacing, shadows
2. **🧩 Components** - All UI components (atoms, molecules, organisms)
3. **📱 Screens** - Full page designs (Insight, Autopilot, Guardian, Hub)
4. **🔄 Flows** - User flows and interactions
5. **📐 Grids** - Layout grids and breakpoints
6. **📝 Documentation** - Design guidelines and notes

---

## Export Workflow

### 1. Export Assets

**SVG Icons:**
- Select icon frame in Figma
- Right-click → Export → SVG
- Save to `design/figma-exports/icons/`
- Naming: `icon-name.svg` (lowercase, hyphenated)

**Component Screenshots:**
- Select component frame
- Right-click → Export → PNG (2x)
- Save to `design/figma-exports/components/`
- Naming: `component-variant-state.png`

**Full Page Designs:**
- Select page frame
- Right-click → Export → PNG (2x)
- Save to `design/figma-exports/screens/`
- Naming: `product-page-view.png`

### 2. Figma Export Settings

```
Format: SVG (for icons), PNG (for screenshots)
Scale: 2x (retina)
Suffix: @2x (for PNGs)
Background: Transparent (for icons)
Constraints: Scale (proportional resizing)
```

### 3. Directory Structure

```
design/figma-exports/
├── icons/               # SVG icons
│   ├── check-circle.svg
│   ├── alert-triangle.svg
│   └── x-circle.svg
│
├── components/          # Component screenshots
│   ├── button-primary-default@2x.png
│   ├── button-primary-hover@2x.png
│   ├── card-default@2x.png
│   └── alert-error@2x.png
│
├── screens/             # Full page designs
│   ├── insight-dashboard@2x.png
│   ├── autopilot-panel@2x.png
│   └── guardian-results@2x.png
│
└── prototypes/          # Interactive prototype exports
    └── user-flow-1.mp4
```

---

## Design Tokens Sync

### Figma → Code

**1. Export Design Tokens from Figma:**

Use [Figma Tokens Plugin](https://www.figma.com/community/plugin/843461159747178978/Figma-Tokens):
- Install plugin in Figma
- Configure token sets (colors, typography, spacing)
- Export as JSON
- Save to `design/tokens/`

**2. Update Code Tokens:**

```bash
# Copy exported tokens
cp design/figma-exports/tokens.json design/tokens/colors.json

# Validate token structure
pnpm validate:tokens

# Regenerate CSS variables
pnpm generate:css-vars
```

**3. Sync Checklist:**

- [ ] Export tokens from Figma
- [ ] Validate JSON structure
- [ ] Update `design/tokens/*.json`
- [ ] Regenerate CSS variables
- [ ] Test in components
- [ ] Commit changes

---

## Component Handoff Process

### Designer → Developer Workflow

**1. Designer Preparation:**
- Component designed in Figma
- States documented (default, hover, active, disabled, loading)
- Specs annotated (spacing, colors, typography)
- Variants created (sizes, colors, states)
- Accessibility notes added (ARIA labels, keyboard nav)

**2. Export Components:**
```bash
# Export all component states
- button-primary-default@2x.png
- button-primary-hover@2x.png
- button-primary-active@2x.png
- button-primary-disabled@2x.png
- button-primary-loading@2x.png
```

**3. Developer Implementation:**
```tsx
// 1. Create component file
// packages/ui/src/components/Button.tsx

// 2. Implement with design tokens
<button className="bg-primary-500 hover:bg-primary-600 active:bg-primary-700">

// 3. Add all variants
variant="primary" | "secondary" | "outline" | "ghost" | "danger"

// 4. Test against Figma design
pnpm test:visual
```

**4. Review:**
- Visual comparison (Figma vs. code)
- Accessibility check (ARIA, keyboard)
- Responsive test (mobile, tablet, desktop)
- Dark mode verification

---

## Figma Plugins

### Essential Plugins

**1. Figma Tokens**
- Export design tokens to JSON
- Sync tokens across files
- [Plugin Link](https://www.figma.com/community/plugin/843461159747178978)

**2. Stark (Accessibility)**
- Check color contrast
- Simulate color blindness
- Accessibility annotations
- [Plugin Link](https://www.figma.com/community/plugin/732603254453395948)

**3. Contrast**
- Quick contrast checking
- WCAG compliance
- [Plugin Link](https://www.figma.com/community/plugin/748533339900865323)

**4. Content Reel**
- Populate designs with realistic data
- Generate placeholder text
- [Plugin Link](https://www.figma.com/community/plugin/731627216655469013)

**5. Redlines**
- Generate spec annotations
- Measure spacing
- [Plugin Link](https://www.figma.com/community/plugin/781354942292031141)

---

## Code Generation

### Figma to React (Experimental)

Use [Figma to React](https://www.figma.com/community/plugin/959043285814040587) plugin:

```bash
# Install plugin in Figma
# Select component
# Export React code
# Review and adapt to design system

# Example output:
<div className="flex items-center gap-4 px-6 py-3 bg-primary-500 rounded-md">
  <span className="text-white font-semibold">Button Text</span>
</div>
```

**⚠️ Note:** Always review generated code for:
- Design token usage
- Accessibility attributes
- Semantic HTML
- TypeScript types

---

## Design Review Process

### Weekly Design Sync

**Agenda:**
1. Review new designs
2. Discuss implementation challenges
3. Update component status
4. Sync design tokens
5. Plan next sprint

**Participants:**
- Design Lead
- Frontend Engineers
- Product Manager

**Deliverables:**
- Updated Figma files
- Design token exports
- Component screenshots
- Implementation notes

---

## Figma File Organization

### Naming Conventions

**Pages:**
- `🎨 [Category]` - Design tokens
- `🧩 [Category]` - Components
- `📱 [Product]` - Screens
- `🔄 [Feature]` - User flows

**Frames:**
- `ComponentName/Variant/State` - e.g., `Button/Primary/Hover`
- `Product/Page/View` - e.g., `Insight/Dashboard/Desktop`

**Layers:**
- `LayerType/Name` - e.g., `Icon/CheckCircle`, `Text/Heading`

### Component Variants

**Structure:**
```
Button (Component)
├── Variant: Primary, Secondary, Outline, Ghost, Danger
├── Size: SM, MD, LG
└── State: Default, Hover, Active, Disabled, Loading
```

**Properties:**
- `Variant` - Visual style
- `Size` - Dimension
- `State` - Interaction state
- `Icon` - Boolean (has icon)
- `Loading` - Boolean (loading spinner)

---

## Version Control

### Figma Versions

**Create versions for:**
- Major design updates
- Design system changes
- Before user testing
- Before handoff to dev

**Naming:**
```
v1.0.0 - Initial Design System
v1.1.0 - Added Autopilot Components
v1.2.0 - Dark Mode Support
v2.0.0 - Complete Redesign
```

### Branching Strategy

**Main File:** Production-ready designs  
**Feature Branches:** Work-in-progress designs  
**Archive:** Old versions

---

## Collaboration Guidelines

### Designer Responsibilities

- [ ] Follow design system tokens
- [ ] Create all component states
- [ ] Add accessibility notes
- [ ] Annotate specs (spacing, colors)
- [ ] Export assets before handoff
- [ ] Update Figma version
- [ ] Tag developers in comments

### Developer Responsibilities

- [ ] Review design before implementation
- [ ] Ask questions in Figma comments
- [ ] Implement with design tokens
- [ ] Test against Figma design
- [ ] Report implementation issues
- [ ] Update component status
- [ ] Document deviations

---

## Design QA Checklist

Before marking design as "Ready for Dev":

### Visual Design
- [ ] Uses design tokens (colors, typography, spacing)
- [ ] Follows design system patterns
- [ ] Consistent with other products
- [ ] Dark mode variant created
- [ ] Responsive layouts defined (mobile, tablet, desktop)

### Components
- [ ] All states designed (default, hover, active, disabled, loading, error)
- [ ] Variants created (sizes, colors)
- [ ] Spacing annotated
- [ ] Typography specified

### Accessibility
- [ ] Color contrast ≥ 4.5:1 (text)
- [ ] Color contrast ≥ 3:1 (UI components)
- [ ] Touch targets ≥ 44px
- [ ] Focus indicators visible
- [ ] ARIA labels noted

### Documentation
- [ ] Component purpose documented
- [ ] Usage guidelines written
- [ ] Do's and don'ts listed
- [ ] Edge cases considered
- [ ] Accessibility notes added

### Export
- [ ] Assets exported (icons, screenshots)
- [ ] Design tokens synced
- [ ] Specs annotated (Redlines plugin)
- [ ] Figma version created
- [ ] Developers tagged

---

## Resources

**Figma Resources:**
- [Figma Best Practices](https://www.figma.com/best-practices/)
- [Design Systems in Figma](https://www.figma.com/design-systems/)
- [Component Best Practices](https://help.figma.com/hc/en-us/articles/360055203533-Component-best-practices)

**Plugins:**
- [Figma Tokens](https://www.figma.com/community/plugin/843461159747178978)
- [Stark](https://www.figma.com/community/plugin/732603254453395948)
- [Redlines](https://www.figma.com/community/plugin/781354942292031141)

**Community:**
- [Figma Community](https://www.figma.com/community)
- [Design Systems Slack](https://design-systems.slack.com)

---

## Quick Reference

### Common Export Commands

```bash
# Export all icons
Figma → Select icon frames → Export → SVG → design/figma-exports/icons/

# Export component screenshots
Figma → Select component → Export → PNG 2x → design/figma-exports/components/

# Export design tokens
Figma Tokens Plugin → Export → JSON → design/tokens/

# Sync to code
pnpm figma:sync
pnpm generate:css-vars
pnpm test:visual
```

---

*Last Updated: 2025-11-26*  
*ODAVL Studio Design System v2.0*
