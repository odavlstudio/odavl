/**
 * useOnboarding Hook
 * 
 * Week 12: Beta Launch - User Onboarding
 * 
 * Custom hook for managing onboarding wizard state and persistence.
 */

'use client';

import { useState, useEffect } from 'react';

interface OnboardingState {
    hasCompletedOnboarding: boolean;
    currentStep: number;
    skippedSteps: string[];
    completedDate?: string;
}

const ONBOARDING_STORAGE_KEY = 'guardian_onboarding_state';

export function useOnboarding() {
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [onboardingState, setOnboardingState] = useState<OnboardingState>({
        hasCompletedOnboarding: false,
        currentStep: 0,
        skippedSteps: [],
    });

    useEffect(() => {
        // Load onboarding state from localStorage
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved) as OnboardingState;
                    setOnboardingState(parsed);

                    // Auto-open onboarding for new users
                    if (!parsed.hasCompletedOnboarding) {
                        setIsOnboardingOpen(true);
                    }
                } catch (error) {
                    console.error('Failed to parse onboarding state:', error);
                    // Start fresh onboarding for new users
                    setIsOnboardingOpen(true);
                }
            } else {
                // New user - show onboarding
                setIsOnboardingOpen(true);
            }
        }
    }, []);

    const completeOnboarding = () => {
        const newState: OnboardingState = {
            ...onboardingState,
            hasCompletedOnboarding: true,
            completedDate: new Date().toISOString(),
        };

        setOnboardingState(newState);
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(newState));
        setIsOnboardingOpen(false);
    };

    const skipOnboarding = () => {
        const newState: OnboardingState = {
            ...onboardingState,
            hasCompletedOnboarding: true,
            completedDate: new Date().toISOString(),
            skippedSteps: ['all'],
        };

        setOnboardingState(newState);
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(newState));
        setIsOnboardingOpen(false);
    };

    const resetOnboarding = () => {
        localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        setOnboardingState({
            hasCompletedOnboarding: false,
            currentStep: 0,
            skippedSteps: [],
        });
        setIsOnboardingOpen(true);
    };

    const reopenOnboarding = () => {
        setIsOnboardingOpen(true);
    };

    return {
        isOnboardingOpen,
        onboardingState,
        completeOnboarding,
        skipOnboarding,
        resetOnboarding,
        reopenOnboarding,
        setIsOnboardingOpen,
    };
}

export default useOnboarding;
