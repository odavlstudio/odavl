# ODAVL Studio Onboarding Flow

**Complete 5-step onboarding wizard for new users**

## Overview

The onboarding flow guides new users through account creation, organization setup, project creation, team invitations, and first scan.

## Steps

1. **Signup** - Create account with email and password
2. **Organization** - Set up workspace/organization
3. **Project** - Create first project and connect repository
4. **Invite Team** - Invite teammates to collaborate (optional)
5. **Complete** - Welcome message and redirect to dashboard

## Components

### Page Component

**Location**: `apps/marketing-website/src/app/onboarding/page.tsx`

Main onboarding page with:
- 5-step wizard UI
- Progress bar
- Step validation
- State management

### State Machine

**Location**: `packages/core/src/onboarding-state.ts`

Manages:
- Current step tracking
- Completed steps
- Valid transitions (next, back, skip)
- Progress calculation
- Data validation

### API Client

**Location**: `packages/core/src/onboarding-api.ts`

Handles:
- User signup
- Organization creation
- Project creation
- Team invitations
- First scan trigger

### Context Provider

**Location**: `apps/marketing-website/src/contexts/onboarding-context.tsx`

React Context for:
- Global onboarding state
- Step navigation functions
- Data update methods
- Validation helpers

### Custom Hooks

**Location**: `apps/marketing-website/src/hooks/use-onboarding.ts`

Provides:
- `useOnboardingAPI` - API interaction hooks
- `useOnboardingStorage` - localStorage persistence
- `useStepValidation` - Real-time validation

### UI Components

**Location**: `apps/marketing-website/src/components/onboarding/components.tsx`

Reusable components:
- `StepContainer` - Step wrapper with title/description
- `ProgressBar` - Visual progress indicator
- `NavigationButtons` - Next/back buttons
- `FormField` - Input field with validation
- `SuccessMessage` - Completion screen

## Usage

### Basic Flow

```typescript
import { useOnboarding } from '@/contexts/onboarding-context';

function MyOnboardingStep() {
  const { next, back, updateData, validate } = useOnboarding();

  const handleSubmit = () => {
    const { valid, errors } = validate('signup', data);
    if (valid) {
      updateData('signup', data);
      next();
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### API Integration

```typescript
import { useOnboardingAPI } from '@/hooks/use-onboarding';

function SignupStep() {
  const { signup, loading, error } = useOnboardingAPI();

  const handleSignup = async () => {
    const response = await signup(email, password);
    // Handle response...
  };

  return <button disabled={loading}>Sign Up</button>;
}
```

## State Machine

```
signup → organization → project → invite → complete
  ↑          ↑            ↑         ↑
  └──back────┴────back────┴───back─┘
```

**Valid Transitions:**
- `next`: Move forward one step
- `back`: Move backward one step
- `skip`: Skip optional step (invite only)

## Validation Rules

### Signup
- Email: Required, valid format
- Password: Required, min 8 characters

### Organization
- Name: Required

### Project
- Name: Required
- Repository: Optional, valid URL

### Invite
- Emails: Optional, valid format for each

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/signup` | POST | Create user account |
| `/organizations` | POST | Create organization |
| `/projects` | POST | Create project |
| `/invitations/bulk` | POST | Send team invites |
| `/insight/run` | POST | Trigger first scan |

## Local Storage

Onboarding state is automatically persisted to `localStorage` for recovery on page refresh:

```typescript
localStorage.setItem('odavl_onboarding_state', JSON.stringify(state));
```

## Styling

- **Design**: Glassmorphism with gradient backgrounds
- **Colors**: Brand blue/purple with green accents
- **Animations**: Smooth transitions, fade-in effects
- **Responsive**: Mobile-first design

## Error Handling

- Form validation errors displayed inline
- API errors shown in toast/alert
- Automatic retry for network failures
- Local state preserved on errors

## Future Enhancements

- OAuth signup (GitHub, Google)
- Organization templates
- Project import from GitHub
- Slack/Discord integration for invites
- Onboarding analytics tracking

## Testing

```bash
# Run onboarding flow tests
pnpm test onboarding

# E2E tests
pnpm test:e2e onboarding
```

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- Focus management
- Error announcements

## License

MIT © 2025 ODAVL Studio
