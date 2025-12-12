'use client';

import { useState, useEffect } from 'react';
import { OnboardingAPI } from '@odavl/core/onboarding-api';

/**
 * Custom hook for onboarding API interactions
 */
export function useOnboardingAPI(baseUrl?: string) {
  const [api] = useState(() => new OnboardingAPI(baseUrl));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.signup({ email, password });
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createOrganization = async (name: string, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.createOrganization({ name, userId });
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (name: string, orgId: string, repository?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.createProject({ name, orgId, repository });
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendInvites = async (emails: string[], orgId: string, role: 'admin' | 'member' | 'viewer' = 'member') => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.sendInvites({ emails, orgId, role });
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const triggerFirstScan = async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.triggerFirstScan(projectId);
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    api,
    loading,
    error,
    signup,
    createOrganization,
    createProject,
    sendInvites,
    triggerFirstScan,
  };
}

/**
 * Custom hook for local storage persistence
 */
export function useOnboardingStorage() {
  const key = 'odavl_onboarding_state';

  const saveState = (state: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(state));
    }
  };

  const loadState = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  };

  const clearState = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  };

  return { saveState, loadState, clearState };
}

/**
 * Custom hook for step validation
 */
export function useStepValidation(step: string, data: any) {
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validate = () => {
      const newErrors: string[] = [];

      switch (step) {
        case 'signup':
          if (!data.email) newErrors.push('Email is required');
          if (!data.password) newErrors.push('Password is required');
          if (data.password && data.password.length < 8) {
            newErrors.push('Password must be at least 8 characters');
          }
          break;

        case 'organization':
          if (!data.organizationName) newErrors.push('Organization name is required');
          break;

        case 'project':
          if (!data.projectName) newErrors.push('Project name is required');
          break;
      }

      setErrors(newErrors);
      setIsValid(newErrors.length === 0);
    };

    validate();
  }, [step, data]);

  return { errors, isValid };
}
