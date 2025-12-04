/**
 * Performance Monitoring Utility
 * Track and report performance metrics
 */

import { MonitoringService } from './service';

export interface PerformanceMetrics {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private static measurements = new Map<string, number>();

  /**
   * Start measuring performance
   */
  static start(name: string) {
    this.measurements.set(name, performance.now());
  }

  /**
   * End measurement and report
   */
  static end(name: string, metadata?: Record<string, any>): PerformanceMetrics | null {
    const startTime = this.measurements.get(name);
    if (!startTime) {
      console.warn(`No start time found for measurement: ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const metrics: PerformanceMetrics = {
      name,
      duration,
      startTime,
      endTime,
      metadata,
    };

    // Report to Sentry if duration exceeds threshold
    if (duration > 1000) {
      MonitoringService.addBreadcrumb(`Slow operation: ${name}`, {
        duration: `${duration.toFixed(2)}ms`,
        ...metadata,
      });
    }

    // Clean up
    this.measurements.delete(name);

    return metrics;
  }

  /**
   * Measure async function
   */
  static async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<{ result: T; metrics: PerformanceMetrics }> {
    this.start(name);

    try {
      const result = await fn();
      const metrics = this.end(name, metadata);

      return {
        result,
        metrics: metrics!,
      };
    } catch (error) {
      this.end(name, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Track Web Vitals
   */
  static trackWebVitals() {
    if (typeof window === 'undefined') return;

    // First Contentful Paint (FCP)
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
    if (fcp) {
      MonitoringService.addBreadcrumb('Web Vitals: FCP', {
        duration: `${fcp.startTime.toFixed(2)}ms`,
      });
    }

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;

        if (lastEntry) {
          MonitoringService.addBreadcrumb('Web Vitals: LCP', {
            duration: `${lastEntry.startTime.toFixed(2)}ms`,
          });
        }
      });

      try {
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // LCP not supported
      }
    }

    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      let clsScore = 0;

      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        }

        MonitoringService.addBreadcrumb('Web Vitals: CLS', {
          score: clsScore.toFixed(4),
        });
      });

      try {
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        // CLS not supported
      }
    }
  }
}

export default PerformanceMonitor;
