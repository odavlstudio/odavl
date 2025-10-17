/**
 * Lightweight performance monitoring for Core Web Vitals
 * No external dependencies - uses native Performance API
 */

interface WebVitalMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType?: string;
}

interface PerformanceConfig {
  enableLogging: boolean;
  sampleRate: number;
  endpoint?: string;
}

const defaultConfig: PerformanceConfig = {
  enableLogging: process.env.NODE_ENV === 'development',
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  endpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT,
};

/**
 * Tracks Core Web Vitals using native Web Vitals API
 * Lightweight implementation for production use
 */
export function trackWebVitals(config: Partial<PerformanceConfig> = {}) {
  const settings = { ...defaultConfig, ...config };

  if (typeof window === 'undefined') return;

  // Only track for sampled sessions
  if (Math.random() > settings.sampleRate) return;

  // Use native Performance Observer API for Core Web Vitals
  try {
    const handleMetric = (metric: WebVitalMetric) => {
      if (settings.enableLogging) {
        console.log(`[Performance] ${metric.name}:`, metric.value);
      }

      // Send to analytics endpoint if configured
      if (settings.endpoint) {
        sendMetric(settings.endpoint, metric);
      }
    };

    // Track Largest Contentful Paint (LCP)
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        handleMetric({
          name: 'LCP',
          value: lastEntry.startTime,
          delta: lastEntry.startTime,
          id: (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.randomUUID) ? globalThis.crypto.randomUUID() : Math.random().toString(36).slice(2),
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  } catch {
    // Graceful fallback - Performance Observer not available
    if (settings.enableLogging) {
      console.warn('[Performance] Performance tracking unavailable');
    }
  }
}

/**
 * Sends performance metric to analytics endpoint
 */
function sendMetric(endpoint: string, metric: WebVitalMetric) {
  const body = JSON.stringify({
    type: 'web-vital',
    metric: metric.name,
    value: metric.value,
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : '',
  });

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, body);
  } else if (typeof fetch !== 'undefined') {
    fetch(endpoint, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {
      // Silent fail for analytics
    });
  }
}
