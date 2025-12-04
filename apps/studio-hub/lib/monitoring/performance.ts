// import * as Sentry from '@sentry/nextjs'; // Temporarily disabled
import { logger } from '@/lib/logger';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface WebVitals {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  inp?: number; // Interaction to Next Paint
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private flushInterval = 10000; // 10 seconds
  private maxBatchSize = 50;
  private cleanupFunctions: Array<() => void> = [];
  private flushIntervalId?: NodeJS.Timeout;

  constructor() {
    if (typeof window !== 'undefined') {
      this.startAutoFlush();
      this.observeWebVitals();
    }
  }

  track(metric: PerformanceMetric): void {
    this.metrics.push({
      ...metric,
      timestamp: new Date(),
    });

    // Send to Sentry (disabled)
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.metrics.distribution(metric.name, metric.value, { unit: metric.unit });
    // }

    // Auto-flush if batch is full
    if (this.metrics.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  private observeWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Observe Web Vitals using PerformanceObserver
    if ('PerformanceObserver' in window) {
      // LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.track({
            name: 'web_vitals.lcp',
            value: lastEntry.startTime,
            unit: 'ms',
            tags: { page: window.location.pathname },
          });
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntry) => {
          const eventEntry = entry as PerformanceEntry & { processingStart?: number };
          if (eventEntry.processingStart !== undefined) {
            this.track({
              name: 'web_vitals.fid',
              value: eventEntry.processingStart - entry.startTime,
              unit: 'ms',
              tags: { page: window.location.pathname },
            });
          }
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // LayoutShift interface has these properties
          const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value: number };
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value;
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // Report CLS on page unload
      const clsHandler = () => {
        if (document.visibilityState === 'hidden') {
          this.track({
            name: 'web_vitals.cls',
            value: clsValue,
            unit: 'count',
            tags: { page: window.location.pathname },
          });
        }
      };
      window.addEventListener('visibilitychange', clsHandler);

      // Store cleanup function
      if (!this.cleanupFunctions) {
        this.cleanupFunctions = [];
      }
      this.cleanupFunctions.push(() => {
        window.removeEventListener('visibilitychange', clsHandler);
      });
    }

    // TTFB (Time to First Byte)
    if (window.performance?.timing) {
      const ttfb = window.performance.timing.responseStart - window.performance.timing.requestStart;
      this.track({
        name: 'web_vitals.ttfb',
        value: ttfb,
        unit: 'ms',
        tags: { page: window.location.pathname },
      });
    }
  }

  trackAPICall(endpoint: string, duration: number, status: number): void {
    this.track({
      name: 'api.call',
      value: duration,
      unit: 'ms',
      tags: {
        endpoint,
        status: status.toString(),
      },
    });
  }

  trackDatabaseQuery(query: string, duration: number): void {
    this.track({
      name: 'db.query',
      value: duration,
      unit: 'ms',
      tags: {
        query: query.substring(0, 50), // Truncate for privacy
      },
    });
  }

  trackComponentRender(component: string, duration: number): void {
    this.track({
      name: 'component.render',
      value: duration,
      unit: 'ms',
      tags: { component },
    });
  }

  private startAutoFlush(): void {
    this.flushIntervalId = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Clean up resources to prevent memory leaks
   */
  destroy(): void {
    // Clear interval
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
      this.flushIntervalId = undefined;
    }

    // Run cleanup functions
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];

    // Clear metrics
    this.metrics = [];
  }

  private async flush(): Promise<void> {
    if (this.metrics.length === 0) return;

    const batch = [...this.metrics];
    this.metrics = [];

    try {
      // Send to analytics endpoint
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/analytics/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metrics: batch }),
        });
      }
    } catch (error) {
      logger.error('Failed to flush metrics', error as Error);
      // Re-add metrics for retry
      this.metrics.unshift(...batch);
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React Hook for component performance tracking
export function usePerformanceTracking(componentName: string) {
  if (typeof window === 'undefined') return;

  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    performanceMonitor.trackComponentRender(componentName, duration);
  };
}

// API call wrapper with automatic tracking
export async function trackedFetch(url: string, options?: RequestInit): Promise<Response> {
  const startTime = performance.now();

  try {
    const response = await fetch(url, options);
    const duration = performance.now() - startTime;

    performanceMonitor.trackAPICall(url, duration, response.status);

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    performanceMonitor.trackAPICall(url, duration, 0);
    throw error;
  }
}
