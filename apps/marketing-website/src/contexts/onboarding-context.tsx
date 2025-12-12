'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import {
  type OnboardingState,
  type OnboardingStep,
  initOnboardingState,
  transitionStep,
  updateOnboardingData,
  isStepCompleted,
  getProgressPercentage,
  validateStepData,
} from '@odavl/core/onboarding-state';

interface OnboardingContextValue {
  state: OnboardingState;
  currentStep: OnboardingStep;
  progress: number;
  next: () => void;
  back: () => void;
  skip: () => void;
  updateData: (step: OnboardingStep, data: any) => void;
  isCompleted: (step: OnboardingStep) => boolean;
  validate: (step: OnboardingStep, data: any) => { valid: boolean; errors: string[] };
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(initOnboardingState());

  const next = () => {
    setState((prev) => transitionStep(prev, 'next'));
  };

  const back = () => {
    setState((prev) => transitionStep(prev, 'back'));
  };

  const skip = () => {
    setState((prev) => transitionStep(prev, 'skip'));
  };

  const updateData = (step: OnboardingStep, data: any) => {
    setState((prev) => updateOnboardingData(prev, step, data));
  };

  const isCompleted = (step: OnboardingStep) => {
    return isStepCompleted(state, step);
  };

  const validate = (step: OnboardingStep, data: any) => {
    return validateStepData(step, data);
  };

  const value: OnboardingContextValue = {
    state,
    currentStep: state.currentStep,
    progress: getProgressPercentage(state),
    next,
    back,
    skip,
    updateData,
    isCompleted,
    validate,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
