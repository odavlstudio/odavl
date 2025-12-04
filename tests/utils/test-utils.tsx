/**
 * @file Component Test Utilities
 * @description Helper functions for React component testing
 * 
 * Simplifies testing with common patterns and utilities
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';

/**
 * Custom render with providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add provider options here if needed
  // theme?: 'light' | 'dark';
  // locale?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  function Wrapper({ children }: { children: ReactNode }) {
    // Add any providers here
    // Example: ThemeProvider, I18nProvider, etc.
    return <>{children}</>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Mock Next.js router
 */
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  basePath: '',
  locale: 'en',
  locales: ['en'],
  defaultLocale: 'en',
  isReady: true,
  isPreview: false,
  isLocaleDomain: false,
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
};

/**
 * Mock NextAuth session
 */
export const mockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    orgId: 'org-123',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

/**
 * Wait for async updates
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Test IDs for consistent component selection
 */
export const TEST_IDS = {
  // Navigation
  NAV_HOME: 'nav-home',
  NAV_FEATURES: 'nav-features',
  NAV_PRICING: 'nav-pricing',
  NAV_DOCS: 'nav-docs',
  
  // Forms
  FORM_EMAIL: 'form-email',
  FORM_SUBMIT: 'form-submit',
  FORM_ERROR: 'form-error',
  FORM_SUCCESS: 'form-success',
  
  // Modals
  MODAL_BACKDROP: 'modal-backdrop',
  MODAL_CONTENT: 'modal-content',
  MODAL_CLOSE: 'modal-close',
  
  // Loading states
  LOADING_SPINNER: 'loading-spinner',
  LOADING_SKELETON: 'loading-skeleton',
};

/**
 * Common test assertions
 */
export const assertions = {
  // Check if element has accessible name
  hasAccessibleName: (element: HTMLElement, name: string) => {
    const accessibleName = element.getAttribute('aria-label') || element.textContent;
    return accessibleName?.includes(name);
  },
  
  // Check if element is keyboard accessible
  isKeyboardAccessible: (element: HTMLElement) => {
    const tabIndex = element.getAttribute('tabindex');
    return tabIndex !== '-1' && (element.tagName === 'A' || element.tagName === 'BUTTON' || tabIndex !== null);
  },
};

/**
 * Mock fetch responses
 */
export const mockFetch = {
  success: (data: unknown) => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => data,
      } as Response)
    );
  },
  
  error: (status: number, message: string) => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status,
        json: async () => ({ error: message }),
      } as Response)
    );
  },
  
  networkError: () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Network error'))
    );
  },
};

/**
 * Re-export everything from @testing-library/react
 */
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
