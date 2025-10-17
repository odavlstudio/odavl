// ODAVL Wave 3 - Enhanced Accessibility Utilities
// WCAG 2.2 Level AA compliance helpers

export interface FocusManagementOptions {
  restoreFocus?: boolean;
  trapFocus?: boolean;
  preventScroll?: boolean;
}

export interface ColorContrastResult {
  ratio: number;
  level: 'AA' | 'AAA' | 'FAIL';
  passes: boolean;
}

/**
 * Calculate color contrast ratio between two colors
 * @param color1 - First color (hex format)
 * @param color2 - Second color (hex format)
 * @returns Contrast ratio and WCAG compliance level
 */
export function calculateContrast(color1: string, color2: string): ColorContrastResult {
  const getRGB = (hex: string) => {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  const getLuminance = (rgb: number[]) => {
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(getRGB(color1));
  const lum2 = getLuminance(getRGB(color2));
  const ratio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);

  let level: 'AA' | 'AAA' | 'FAIL';
  if (ratio >= 7) {
    level = 'AAA';
  } else if (ratio >= 4.5) {
    level = 'AA';
  } else {
    level = 'FAIL';
  }

  return {
    ratio: Math.round(ratio * 100) / 100,
    level,
    passes: ratio >= 4.5
  };
}

export function manageFocus(
  element: HTMLElement | null,
  options: FocusManagementOptions = {}
) {
  if (!element) return;

  const { restoreFocus = true, preventScroll = false } = options;
  const previouslyFocused = globalThis.document.activeElement as HTMLElement;

  element.focus({ preventScroll });

  return () => {
    if (restoreFocus && previouslyFocused) {
      previouslyFocused.focus({ preventScroll });
    }
  };
}

import React from "react";
export function getKeyboardNavProps(onClick: () => void) {
  return {
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }
  };
}

export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = globalThis.document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  globalThis.document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

/**
 * Motion preferences check
 */
export function prefersReducedMotion(): boolean {
  return globalThis.window !== undefined &&
    globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
}

/**
 * Focus management utilities with visible focus rings
 */
export const focusUtils = {
  getVisibleFocusRing: (color = '#00d4ff') => ({
    outline: `2px solid ${color}`,
    outlineOffset: '2px',
    borderRadius: '4px',
  }),

  skipLink: 'focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md'
};
