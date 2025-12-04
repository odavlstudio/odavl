# 📚 Component Library - ODAVL Studio

**Version:** 2.0.0  
**Last Updated:** 2025-11-26

---

## Overview

The ODAVL Studio Component Library provides a comprehensive set of reusable UI components built with:
- **React 18+** and **TypeScript**
- **Tailwind CSS** for styling
- **Radix UI** for accessibility primitives
- **Design tokens** for consistency

**Benefits:**
- ✅ Faster development
- ✅ Consistent UX across products
- ✅ WCAG 2.1 AA compliant
- ✅ Full TypeScript support
- ✅ Dark mode support

---

## Component Catalog

### Atoms (Basic Building Blocks)

Atoms are the smallest, indivisible components.

#### Button

**Variants:** `primary` | `secondary` | `outline` | `ghost` | `danger`  
**Sizes:** `sm` | `md` | `lg`

```tsx
import { Button } from '@odavl-studio/ui';

// Primary button
<Button variant="primary" size="md">
  Click Me
</Button>

// With icon
<Button variant="primary">
  <PlusIcon className="mr-2 h-4 w-4" />
  Add Item
</Button>

// Loading state
<Button variant="primary" disabled>
  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>
```

**Props:**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

---

#### Input

**Types:** `text` | `email` | `password` | `number` | `search` | `tel` | `url`  
**Sizes:** `sm` | `md` | `lg`

```tsx
import { Input } from '@odavl-studio/ui';

// Basic input
<Input type="text" placeholder="Enter text..." />

// With label
<div>
  <Label htmlFor="email">Email Address</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>

// With error
<Input type="email" error="Invalid email address" />

// With prefix/suffix
<Input 
  type="text" 
  prefix={<SearchIcon />}
  suffix={<XIcon onClick={clearInput} />}
/>
```

**Props:**
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}
```

---

#### Badge

**Variants:** `default` | `success` | `warning` | `error` | `info`  
**Sizes:** `sm` | `md` | `lg`

```tsx
import { Badge } from '@odavl-studio/ui';

// Status badges
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="info">Beta</Badge>

// With icon
<Badge variant="success">
  <CheckIcon className="mr-1 h-3 w-3" />
  Verified
</Badge>

// Dismissible
<Badge variant="default" onDismiss={() => {}}>
  Tag
  <XIcon className="ml-1 h-3 w-3" />
</Badge>
```

---

#### Checkbox

```tsx
import { Checkbox } from '@odavl-studio/ui';

<Checkbox id="terms" />
<Label htmlFor="terms">Accept terms and conditions</Label>

// Indeterminate state
<Checkbox checked="indeterminate" />

// Disabled
<Checkbox disabled />
```

---

#### Radio

```tsx
import { RadioGroup, Radio } from '@odavl-studio/ui';

<RadioGroup defaultValue="option1">
  <div className="flex items-center gap-2">
    <Radio value="option1" id="option1" />
    <Label htmlFor="option1">Option 1</Label>
  </div>
  <div className="flex items-center gap-2">
    <Radio value="option2" id="option2" />
    <Label htmlFor="option2">Option 2</Label>
  </div>
</RadioGroup>
```

---

#### Switch

```tsx
import { Switch } from '@odavl-studio/ui';

<div className="flex items-center gap-2">
  <Switch id="notifications" />
  <Label htmlFor="notifications">Enable notifications</Label>
</div>

// Controlled
<Switch checked={enabled} onCheckedChange={setEnabled} />
```

---

### Molecules (Simple Combinations)

Molecules combine atoms into simple functional groups.

#### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@odavl-studio/ui';

<Card>
  <CardHeader>
    <CardTitle>Project Name</CardTitle>
    <CardDescription>Last updated 2 hours ago</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-gray-600">
      Card content goes here...
    </p>
  </CardContent>
  <CardFooter>
    <Button variant="outline">Cancel</Button>
    <Button variant="primary">Save</Button>
  </CardFooter>
</Card>
```

---

#### Alert

**Variants:** `default` | `success` | `warning` | `error` | `info`

```tsx
import { Alert, AlertTitle, AlertDescription } from '@odavl-studio/ui';

// Error alert
<Alert variant="error">
  <AlertCircleIcon className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Your session has expired. Please login again.
  </AlertDescription>
</Alert>

// Success alert
<Alert variant="success">
  <CheckCircleIcon className="h-4 w-4" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>
    Your changes have been saved successfully.
  </AlertDescription>
</Alert>

// Dismissible
<Alert variant="warning" dismissible onDismiss={() => {}}>
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>
    This action cannot be undone.
  </AlertDescription>
</Alert>
```

---

#### Tooltip

```tsx
import { Tooltip, TooltipTrigger, TooltipContent } from '@odavl-studio/ui';

<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline">
      <InfoIcon className="h-4 w-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    <p>Additional information</p>
  </TooltipContent>
</Tooltip>
```

---

#### Popover

```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@odavl-studio/ui';

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Open Settings</Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <div className="space-y-4">
      <h4 className="font-semibold">Settings</h4>
      {/* Settings content */}
    </div>
  </PopoverContent>
</Popover>
```

---

#### Dropdown Menu

```tsx
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@odavl-studio/ui';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      Actions
      <ChevronDownIcon className="ml-2 h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => {}}>
      <EditIcon className="mr-2 h-4 w-4" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => {}}>
      <CopyIcon className="mr-2 h-4 w-4" />
      Duplicate
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => {}}>
      <TrashIcon className="mr-2 h-4 w-4" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Organisms (Complex Components)

Organisms combine molecules into complex, functional sections.

#### Navigation

```tsx
import { Navigation, NavLogo, NavItems, NavItem, NavActions } from '@odavl-studio/ui';

<Navigation>
  <NavLogo href="/">
    <Logo />
  </NavLogo>
  
  <NavItems>
    <NavItem href="/insight" active>Insight</NavItem>
    <NavItem href="/autopilot">Autopilot</NavItem>
    <NavItem href="/guardian">Guardian</NavItem>
  </NavItems>
  
  <NavActions>
    <Button variant="ghost">Sign In</Button>
    <Button variant="primary">Get Started</Button>
  </NavActions>
</Navigation>
```

---

#### Data Table

```tsx
import { DataTable, DataTableColumn } from '@odavl-studio/ui';

const columns: DataTableColumn[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge variant={row.getValue('status')}>{row.getValue('status')}</Badge>
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => formatDate(row.getValue('date'))
  }
];

<DataTable
  columns={columns}
  data={data}
  sortable
  filterable
  pagination
  pageSize={10}
/>
```

---

#### Modal

```tsx
import { Modal, ModalTrigger, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@odavl-studio/ui';

<Modal>
  <ModalTrigger asChild>
    <Button>Open Modal</Button>
  </ModalTrigger>
  
  <ModalContent>
    <ModalHeader>
      <ModalTitle>Confirm Action</ModalTitle>
      <ModalDescription>
        Are you sure you want to proceed? This action cannot be undone.
      </ModalDescription>
    </ModalHeader>
    
    <div className="py-4">
      {/* Modal body content */}
    </div>
    
    <ModalFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="danger">Delete</Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

---

#### Toast Notifications

```tsx
import { toast } from '@odavl-studio/ui';

// Success toast
toast.success('Changes saved successfully');

// Error toast
toast.error('Failed to save changes');

// Warning toast
toast.warning('Your session will expire soon');

// Info toast
toast.info('New update available');

// Custom toast
toast.custom(
  <div className="flex items-center gap-3">
    <Icon name="check" className="text-success-500" />
    <div>
      <p className="font-semibold">Success</p>
      <p className="text-sm text-gray-600">Your changes have been saved</p>
    </div>
  </div>
);
```

---

## Component Status

Track implementation status across products:

| Component | Designed | Implemented | Tested | Documented |
|-----------|----------|-------------|--------|------------|
| Button | ✅ | ✅ | ✅ | ✅ |
| Input | ✅ | ✅ | ✅ | ✅ |
| Badge | ✅ | ✅ | ✅ | ✅ |
| Checkbox | ✅ | ✅ | ✅ | ✅ |
| Radio | ✅ | ✅ | ✅ | ✅ |
| Switch | ✅ | ✅ | ✅ | ✅ |
| Card | ✅ | ✅ | ✅ | ✅ |
| Alert | ✅ | ✅ | ✅ | ✅ |
| Tooltip | ✅ | ✅ | ✅ | ✅ |
| Popover | ✅ | ✅ | ✅ | ✅ |
| Dropdown | ✅ | ✅ | ✅ | ✅ |
| Navigation | ✅ | 🔨 | ❌ | ✅ |
| DataTable | ✅ | 🔨 | ❌ | ✅ |
| Modal | ✅ | ✅ | ✅ | ✅ |
| Toast | ✅ | ✅ | ✅ | ✅ |

**Legend:**
- ✅ Complete
- 🔨 In Progress
- ❌ Not Started

---

## Accessibility

All components follow WCAG 2.1 Level AA guidelines:

### Keyboard Navigation

**All interactive components support:**
- **Tab** - Move focus
- **Shift + Tab** - Move focus backward
- **Enter/Space** - Activate
- **Escape** - Close (modals, dropdowns)
- **Arrow keys** - Navigate (dropdowns, menus)

### Screen Readers

**Ensure:**
- Semantic HTML (`<button>`, `<input>`, etc.)
- ARIA labels where needed
- State announcements (loading, disabled, selected)
- Error announcements

### Focus Indicators

All interactive elements have visible focus indicators:

```css
.button:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

---

## Testing

### Unit Tests (Vitest)

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@odavl-studio/ui';

test('Button renders correctly', () => {
  render(<Button>Click Me</Button>);
  expect(screen.getByRole('button')).toHaveTextContent('Click Me');
});

test('Button handles click', async () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click Me</Button>);
  await userEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Accessibility Tests (axe)

```typescript
import { axe } from 'jest-axe';

test('Button has no accessibility violations', async () => {
  const { container } = render(<Button>Click Me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Visual Regression (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('Button visual regression', async ({ page }) => {
  await page.goto('/components/button');
  await expect(page).toHaveScreenshot('button-default.png');
});
```

---

## Storybook Integration

All components are documented in Storybook:

```bash
# Start Storybook
pnpm storybook

# Build Storybook
pnpm build-storybook
```

**Example Story:**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@odavl-studio/ui';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger']
    }
  }
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
};

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    children: (
      <>
        <PlusIcon className="mr-2 h-4 w-4" />
        Add Item
      </>
    )
  }
};
```

---

## Dark Mode Support

All components support dark mode via Tailwind's `dark:` variant:

```tsx
<Button className="bg-primary-500 dark:bg-primary-600">
  Click Me
</Button>

<Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
  <CardContent className="text-gray-900 dark:text-gray-100">
    Content
  </CardContent>
</Card>
```

---

## Contributing

### Adding a New Component

1. **Design in Figma** following design system
2. **Create component file** in `packages/ui/src/components/`
3. **Add TypeScript types** with full JSDoc
4. **Implement with accessibility** (keyboard, screen readers)
5. **Write tests** (unit + accessibility + visual)
6. **Document in Storybook** with examples
7. **Update this catalog** with usage examples

### Component Checklist

Before submitting:

- [ ] Component uses design tokens (colors, spacing, typography)
- [ ] Fully typed with TypeScript
- [ ] Keyboard accessible (Tab, Enter, Escape, Arrows)
- [ ] Screen reader compatible (ARIA labels, semantic HTML)
- [ ] Focus indicators visible
- [ ] Dark mode supported
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Unit tests written (≥90% coverage)
- [ ] Accessibility tests pass (axe)
- [ ] Visual regression tests added
- [ ] Storybook story created
- [ ] Documentation complete

---

## Resources

**Component Libraries:**
- [Radix UI](https://www.radix-ui.com/) - Accessibility primitives
- [shadcn/ui](https://ui.shadcn.com/) - Component inspiration
- [Headless UI](https://headlessui.com/) - Unstyled components

**Testing:**
- [Testing Library](https://testing-library.com/)
- [jest-axe](https://github.com/nickcolley/jest-axe)
- [Playwright](https://playwright.dev/)

**Documentation:**
- [Storybook](https://storybook.js.org/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

---

*Last Updated: 2025-11-26*  
*ODAVL Studio Design System v2.0*
