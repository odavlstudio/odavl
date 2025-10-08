'use client';

import Script from 'next/script';

interface AnalyticsProps {
  domain?: string;
}

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

export function Analytics({ domain = 'odavl.com' }: AnalyticsProps) {
  // Only load analytics in production
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}

// Analytics tracking function
export function track(event: string, props?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(event, { props });
  }
}

// Common events
export const trackEvents = {
  contactForm: () => track('Contact Form Submitted'),
  pilotForm: () => track('Pilot Form Submitted'),
  docsView: (page: string) => track('Documentation Viewed', { page }),
  securityView: () => track('Security Page Viewed'),
} as const;