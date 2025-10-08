// ODAVL-WAVE-X7-INJECT: Accessibility Utilities - Focus & Keyboard Nav
// @odavl-governance: UX-POLISH-SAFE mode active

export interface FocusManagementOptions {
  restoreFocus?: boolean;
  trapFocus?: boolean;
  preventScroll?: boolean;
}

export function manageFocus(
  element: HTMLElement | null,
  options: FocusManagementOptions = {}
) {
  if (!element) return;
  
  const { restoreFocus = true, preventScroll = false } = options;
  const previouslyFocused = document.activeElement as HTMLElement;
  
  element.focus({ preventScroll });
  
  return () => {
    if (restoreFocus && previouslyFocused) {
      previouslyFocused.focus({ preventScroll });
    }
  };
}

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
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
}