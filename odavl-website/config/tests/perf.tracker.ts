// ODAVL-WAVE-X8-INJECT: Performance Tracker - Web Vitals & CLS/FID/FCP
// @odavl-governance: TESTING-SAFE mode active

export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  delta: number;
  id: string;
  navigationType: string;
}

export class PerformanceTracker {
  private metrics: WebVitalsMetric[] = [];

  trackMetric(metric: WebVitalsMetric) {
    this.metrics.push(metric);
    this.reportMetric(metric);
  }

  private reportMetric(metric: WebVitalsMetric) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Web Vital: ${metric.name}`, {
        value: metric.value,
        rating: this.getRating(metric),
      });
    }
  }

  private getRating(metric: WebVitalsMetric): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric.name];
    if (metric.value <= threshold.good) return 'good';
    if (metric.value > threshold.poor) return 'poor';
    return 'needs-improvement';
  }
}