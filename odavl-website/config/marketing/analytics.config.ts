// ODAVL-WAVE-X9-INJECT: Analytics Configuration
// @odavl-governance: MARKETING-SAFE mode - Marketing analytics setup

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

export interface AnalyticsEvent {
  name: string;
  category: 'marketing' | 'engagement' | 'conversion';
  properties?: Record<string, string | number>;
}

export const ANALYTICS_CONFIG = {
  enabled: process.env.NODE_ENV === 'production',
  providers: {
    googleAnalytics: {
      measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
      enabled: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
    },
    plausible: {
      domain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'odavl.dev',
      enabled: Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN)
    }
  },
  cookieConsent: {
    required: true,
    position: 'bottom-right' as const,
    theme: 'dark' as const
  }
};

export const MARKETING_EVENTS = {
  // Newsletter events
  newsletterView: { name: 'newsletter_view', category: 'marketing' as const },
  newsletterSubscribe: { name: 'newsletter_subscribe', category: 'conversion' as const },
  
  // Content engagement
  blogPostView: { name: 'blog_post_view', category: 'engagement' as const },
  showcaseView: { name: 'showcase_view', category: 'engagement' as const },
  
  // CTA interactions
  ctaClick: { name: 'cta_click', category: 'conversion' as const },
  downloadClick: { name: 'download_click', category: 'conversion' as const },
  
  // Social sharing
  socialShare: { name: 'social_share', category: 'marketing' as const }
};

export function trackEvent(event: AnalyticsEvent) {
  if (!ANALYTICS_CONFIG.enabled) return;
  
  // Google Analytics 4
  if (ANALYTICS_CONFIG.providers.googleAnalytics.enabled && window.gtag) {
    window.gtag('event', event.name, {
      event_category: event.category,
      ...event.properties
    });
  }
  
  // Plausible
  if (ANALYTICS_CONFIG.providers.plausible.enabled && window.plausible) {
    window.plausible(event.name, { props: event.properties });
  }
}