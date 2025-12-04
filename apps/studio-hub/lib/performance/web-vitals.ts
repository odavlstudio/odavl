import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';
import { logger } from '@/lib/logger';

// Type for Sentry on window object
declare global {
  interface Window {
    Sentry?: {
      captureMessage: (message: string, options?: unknown) => void;
    };
  }
}

/**
 * Web Vitals metrics tracking
 * - CLS: Cumulative Layout Shift (visual stability)
 * - FCP: First Contentful Paint (loading)
 * - INP: Interaction to Next Paint (interactivity) - replaces FID
 * - LCP: Largest Contentful Paint (loading)
 * - TTFB: Time to First Byte (server response)
 */

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

function sendToAnalytics(metric: Metric) {
  // Convert web-vitals Metric to our format
  const webVitalsMetric: WebVitalsMetric = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  };

  const body = JSON.stringify(webVitalsMetric);
  const url = '/api/analytics/web-vitals';

  // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, {
      body,
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch((error) => {
      // Fail silently in production
      if (process.env.NODE_ENV === 'development') {
      }
    });
  }

  // Also log to Sentry if available
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureMessage(`Web Vitals: ${metric.name}`, {
      level: metric.rating === 'poor' ? 'warning' : 'info',
      tags: {
        metric: metric.name,
        rating: metric.rating,
      },
      extra: {
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
      },
    });
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Web Vital metric', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }
}

/**
 * Initialize Web Vitals tracking
 * Call this function in your app's entry point
 */
export function initPerformanceTracking() {
  if (typeof window === 'undefined') {
    return;
  }

  // Track all Core Web Vitals
  onCLS(sendToAnalytics);
  onFCP(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

/**
 * Report Web Vitals to Next.js
 * Use this in your app's root layout or _app
 */
export function reportWebVitals(metric: Metric) {
  sendToAnalytics(metric);
}

/**
 * Performance thresholds
 * These values are based on Google's Core Web Vitals recommendations
 */
export const PERFORMANCE_THRESHOLDS = {
  // Cumulative Layout Shift (lower is better)
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  // First Contentful Paint (ms)
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  // Interaction to Next Paint (ms)
  INP: {
    good: 200,
    needsImprovement: 500,
  },
  // Largest Contentful Paint (ms)
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  // Time to First Byte (ms)
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
} as const;

/**
 * Get rating based on threshold
 */
export function getRating(
  metric: keyof typeof PERFORMANCE_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = PERFORMANCE_THRESHOLDS[metric];

  if (value <= threshold.good) {
    return 'good';
  }

  if (value <= threshold.needsImprovement) {
    return 'needs-improvement';
  }

  return 'poor';
}
