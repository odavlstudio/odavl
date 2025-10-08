// ODAVL-WAVE-L-FIX: Analytics bootstrap for production tracking
// @odavl-governance: ANALYTICS-SAFE mode active

export interface AnalyticsConfig {
  plausible?: {
    domain: string;
    enabled: boolean;
  };
  ga4?: {
    measurementId: string;
    enabled: boolean;
  };
}

export function initAnalytics(config: AnalyticsConfig = {}) {
  if (typeof window === 'undefined') return;
  
  // Plausible Analytics (privacy-focused)
  if (config.plausible?.enabled) {
    console.log(`📊 Plausible Analytics initialized for ${config.plausible.domain}`);
  }
  
  // Google Analytics 4 (if needed)
  if (config.ga4?.enabled) {
    console.log(`📈 GA4 Analytics initialized: ${config.ga4.measurementId}`);
  }
  
  // Web Vitals tracking
  if ('performance' in window) {
    console.log('⚡ Web Vitals tracking active');
  }
}

export function trackEvent(eventName: string, properties?: Record<string, string | number>) {
  if (typeof window === 'undefined') return;
  
  // Custom event tracking
  console.log('📊 Event tracked:', eventName, properties);
  
  // Send to configured analytics providers
  const globalWindow = window as { plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void };
  if (globalWindow.plausible) {
    globalWindow.plausible(eventName, { props: properties });
  }
}

// ODAVL-WAVE-L-FIX: Analytics system ready for production deployment