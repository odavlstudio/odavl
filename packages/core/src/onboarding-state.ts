/**
 * Onboarding State Machine
 * 
 * Manages the 5-step onboarding flow for new users
 */

export type OnboardingStep = 'signup' | 'organization' | 'project' | 'invite' | 'complete';

export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  data: {
    user?: {
      email: string;
      password: string;
      userId?: string;
    };
    organization?: {
      name: string;
      orgId?: string;
    };
    project?: {
      name: string;
      repository?: string;
      projectId?: string;
    };
    invites?: string[];
  };
}

export interface OnboardingTransition {
  from: OnboardingStep;
  to: OnboardingStep;
  action: 'next' | 'back' | 'skip';
}

/**
 * Valid transitions in the onboarding flow
 */
const validTransitions: OnboardingTransition[] = [
  { from: 'signup', to: 'organization', action: 'next' },
  { from: 'organization', to: 'signup', action: 'back' },
  { from: 'organization', to: 'project', action: 'next' },
  { from: 'project', to: 'organization', action: 'back' },
  { from: 'project', to: 'invite', action: 'next' },
  { from: 'invite', to: 'project', action: 'back' },
  { from: 'invite', to: 'complete', action: 'next' },
  { from: 'invite', to: 'complete', action: 'skip' },
];

/**
 * Initialize onboarding state
 */
export function initOnboardingState(): OnboardingState {
  return {
    currentStep: 'signup',
    completedSteps: [],
    data: {},
  };
}

/**
 * Transition to next step
 */
export function transitionStep(
  state: OnboardingState,
  action: 'next' | 'back' | 'skip'
): OnboardingState {
  const transition = validTransitions.find(
    (t) => t.from === state.currentStep && t.action === action
  );

  if (!transition) {
    throw new Error(`Invalid transition: ${action} from ${state.currentStep}`);
  }

  // Mark current step as completed if moving forward
  const completedSteps =
    action === 'next' || action === 'skip'
      ? [...new Set([...state.completedSteps, state.currentStep])]
      : state.completedSteps;

  return {
    ...state,
    currentStep: transition.to,
    completedSteps,
  };
}

/**
 * Update onboarding data
 */
export function updateOnboardingData(
  state: OnboardingState,
  step: OnboardingStep,
  data: any
): OnboardingState {
  return {
    ...state,
    data: {
      ...state.data,
      [step]: { ...state.data[step as keyof typeof state.data], ...data },
    },
  };
}

/**
 * Check if step is completed
 */
export function isStepCompleted(state: OnboardingState, step: OnboardingStep): boolean {
  return state.completedSteps.includes(step);
}

/**
 * Get progress percentage
 */
export function getProgressPercentage(state: OnboardingState): number {
  const totalSteps = 5;
  const steps: OnboardingStep[] = ['signup', 'organization', 'project', 'invite', 'complete'];
  const currentIndex = steps.indexOf(state.currentStep);
  return ((currentIndex + 1) / totalSteps) * 100;
}

/**
 * Validate step data
 */
export function validateStepData(step: OnboardingStep, data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  switch (step) {
    case 'signup':
      if (!data.email) errors.push('Email is required');
      if (!data.password) errors.push('Password is required');
      if (data.password && data.password.length < 8) {
        errors.push('Password must be at least 8 characters');
      }
      break;

    case 'organization':
      if (!data.name) errors.push('Organization name is required');
      break;

    case 'project':
      if (!data.name) errors.push('Project name is required');
      break;

    case 'invite':
      // Invites are optional, but validate format if provided
      if (data.invites && Array.isArray(data.invites)) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const email of data.invites) {
          if (!emailRegex.test(email)) {
            errors.push(`Invalid email: ${email}`);
          }
        }
      }
      break;

    case 'complete':
      // No validation needed for complete step
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  initOnboardingState,
  transitionStep,
  updateOnboardingData,
  isStepCompleted,
  getProgressPercentage,
  validateStepData,
};
