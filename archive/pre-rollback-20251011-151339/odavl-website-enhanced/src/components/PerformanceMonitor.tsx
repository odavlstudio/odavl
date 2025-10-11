/**
 * ODAVL Enterprise Performance Monitoring System
 * Advanced performance tracking with Web Vitals, user experience metrics, and reporting
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { config } from '@/lib/config';

// Performance metrics types
type PerformanceScore = 'good' | 'needs-improvement' | 'poor';

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  
  // Additional metrics
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  navigationTiming?: PerformanceNavigationTiming;
  resourceTiming?: PerformanceResourceTiming[];
  
  // Custom metrics
  pageLoadTime?: number;
  domInteractive?: number;
  domComplete?: number;
  
  // User experience
  userAgent: string;
  viewport: { width: number; height: number };
  
  // Context
  url: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
}

export interface PerformanceReport {
  id: string;
  timestamp: string;
  metrics: PerformanceMetrics;
  scores: {
    performance: number;
    lcp: PerformanceScore;
    fid: PerformanceScore;
    cls: PerformanceScore;
  };
  recommendations: string[];
}

class EnterprisePerformanceMonitor {
  private static instance: EnterprisePerformanceMonitor;
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private sessionId: string;
  private startTime: number;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = performance.now();
    
    if (config.flags.performanceMonitoring) {
      this.initializeMonitoring();
    }
  }

  public static getInstance(): EnterprisePerformanceMonitor {
    if (!EnterprisePerformanceMonitor.instance) {
      EnterprisePerformanceMonitor.instance = new EnterprisePerformanceMonitor();
    }
    return EnterprisePerformanceMonitor.instance;
  }

  private generateSessionId(): string {
    if (typeof window === 'undefined') return 'ssr';
    
    let sessionId = sessionStorage.getItem('odavl_perf_session');
    if (!sessionId) {
      sessionId = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('odavl_perf_session', sessionId);
    }
    return sessionId;
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor navigation timing
    this.collectNavigationTiming();
    
    // Monitor resource timing
    this.collectResourceTiming();
    
    // Monitor Web Vitals
    this.collectWebVitals();
    
    // Monitor custom metrics
    this.collectCustomMetrics();
    
    // Report metrics periodically
    this.scheduleReporting();
  }

  private collectNavigationTiming() {
    if (typeof window === 'undefined' || !window.performance) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.navigationTiming = navigation;
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      this.metrics.domInteractive = navigation.domInteractive - navigation.fetchStart;
      this.metrics.domComplete = navigation.domComplete - navigation.fetchStart;
      this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
    }
  }

  private collectResourceTiming() {
    if (typeof window === 'undefined' || !window.performance) return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    this.metrics.resourceTiming = resources.slice(-20); // Keep last 20 resources
  }

  private collectWebVitals() {
    if (typeof window === 'undefined') return;

    // LCP observer
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            this.metrics.lcp = lastEntry.startTime;
            this.onMetricUpdate('lcp', lastEntry.startTime);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // FCP observer
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            this.metrics.fcp = lastEntry.startTime;
            this.onMetricUpdate('fcp', lastEntry.startTime);
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      } catch (error) {
        console.warn('FCP observer not supported:', error);
      }

      // CLS observer
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          this.metrics.cls = clsValue;
          this.onMetricUpdate('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }

      // FID measurement via event listeners
      this.measureFID();
    }
  }

  private measureFID() {
    if (typeof window === 'undefined') return;

    const startTime = performance.now();
    let fidMeasured = false;

    const measureFID = () => {
      if (!fidMeasured) {
        const delay = performance.now() - startTime;
        this.metrics.fid = delay;
        this.onMetricUpdate('fid', delay);
        fidMeasured = true;
        
        // Clean up listeners
        window.removeEventListener('click', measureFID);
        window.removeEventListener('keydown', measureFID);
        window.removeEventListener('touchstart', measureFID);
      }
    };

    window.addEventListener('click', measureFID, { once: true });
    window.addEventListener('keydown', measureFID, { once: true });
    window.addEventListener('touchstart', measureFID, { once: true });
  }

  private collectCustomMetrics() {
    if (typeof window === 'undefined') return;

    // Collect viewport information
    this.metrics.viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Collect user agent
    this.metrics.userAgent = navigator.userAgent;
    
    // Set URL and timestamp
    this.metrics.url = window.location.href;
    this.metrics.timestamp = new Date().toISOString();
    this.metrics.sessionId = this.sessionId;
  }

  private onMetricUpdate(metric: string, value: number) {
    if (config.isDevelopment) {
      console.log(`📊 Performance metric updated: ${metric} = ${value.toFixed(2)}`);
    }

    // Check for performance issues
    this.checkPerformanceThresholds(metric, value);
  }

  private checkPerformanceThresholds(metric: string, value: number) {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (threshold) {
      if (value > threshold.poor) {
        console.warn(`🐌 Poor ${metric.toUpperCase()}: ${value.toFixed(2)} (threshold: ${threshold.poor})`);
      } else if (value > threshold.good) {
        console.info(`⚠️ ${metric.toUpperCase()} needs improvement: ${value.toFixed(2)} (threshold: ${threshold.good})`);
      }
    }
  }

  private scheduleReporting() {
    // Report immediately on page load
    setTimeout(() => this.generateReport(), 1000);
    
    // Report periodically
    setInterval(() => this.generateReport(), 30000); // Every 30 seconds
    
    // Report on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.generateReport());
    }
  }

  public generateReport(): PerformanceReport {
    const reportId = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const scores = this.calculateScores();
    const recommendations = this.generateRecommendations();

    const report: PerformanceReport = {
      id: reportId,
      timestamp: new Date().toISOString(),
      metrics: this.metrics as PerformanceMetrics,
      scores,
      recommendations,
    };

    // Store report locally
    this.storeReport(report);
    
    // Send to analytics
    this.sendToAnalytics(report);

    if (config.isDevelopment) {
      console.log('📊 Performance Report Generated:', report);
    }

    return report;
  }

  private getScorePoints(score: PerformanceScore): number {
    switch (score) {
      case 'good': return 100;
      case 'needs-improvement': return 60;
      case 'poor': return 30;
    }
  }

  private calculateScores() {
    const { lcp = 0, fid = 0, cls = 0 } = this.metrics;

    // Calculate metric scores
    let lcpScore: PerformanceScore;
    if (lcp <= 2500) lcpScore = 'good';
    else if (lcp <= 4000) lcpScore = 'needs-improvement';
    else lcpScore = 'poor';

    let fidScore: PerformanceScore;
    if (fid <= 100) fidScore = 'good';
    else if (fid <= 300) fidScore = 'needs-improvement';
    else fidScore = 'poor';

    let clsScore: PerformanceScore;
    if (cls <= 0.1) clsScore = 'good';
    else if (cls <= 0.25) clsScore = 'needs-improvement';
    else clsScore = 'poor';
    
    // Calculate overall performance score (0-100)
    const lcpPoints = this.getScorePoints(lcpScore);
    const fidPoints = this.getScorePoints(fidScore);
    const clsPoints = this.getScorePoints(clsScore);    const performance = Math.round((lcpPoints + fidPoints + clsPoints) / 3);

    return {
      performance,
      lcp: lcpScore,
      fid: fidScore,
      cls: clsScore,
    } as const;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const { lcp = 0, fid = 0, cls = 0, ttfb = 0 } = this.metrics;

    if (lcp > 4000) {
      recommendations.push('Optimize Largest Contentful Paint: Consider lazy loading, image optimization, and CDN usage');
    }
    if (fid > 300) {
      recommendations.push('Improve First Input Delay: Reduce JavaScript execution time and optimize main thread work');
    }
    if (cls > 0.25) {
      recommendations.push('Fix Cumulative Layout Shift: Set size attributes on images and reserve space for dynamic content');
    }
    if (ttfb > 1800) {
      recommendations.push('Optimize Time to First Byte: Improve server response time and consider edge caching');
    }

    return recommendations;
  }

  private storeReport(report: PerformanceReport) {
    if (typeof window === 'undefined') return;

    try {
      const storageKey = `odavl_perf_${report.id}`;
      localStorage.setItem(storageKey, JSON.stringify(report));
      
      // Cleanup old reports (keep last 10)
      const perfKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('odavl_perf_'))
        .sort()
        .reverse();

      perfKeys.slice(10).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to store performance report:', error);
    }
  }

  private sendToAnalytics(report: PerformanceReport) {
    if (!config.isProduction || typeof window === 'undefined') return;

    try {
      // Send to custom analytics
      const analyticsEvent = {
        event: 'performance_report',
        ...report,
      };
      
      console.log('Sending performance report to analytics:', analyticsEvent);
      
      // Would integrate with analytics provider (GA, Mixpanel, etc.)
    } catch (error) {
      console.error('Failed to send performance report to analytics:', error);
    }
  }

  public cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Public API methods
  public getCurrentMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public measureCustomMetric(name: string, value: number) {
    console.log(`📊 Custom metric: ${name} = ${value}`);
    
    // Store custom metric
    const customMetrics = JSON.parse(localStorage.getItem('odavl_custom_metrics') || '{}');
    customMetrics[name] = {
      value,
      timestamp: Date.now(),
    };
    localStorage.setItem('odavl_custom_metrics', JSON.stringify(customMetrics));
  }
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const monitorRef = useRef<EnterprisePerformanceMonitor | null>(null);

  useEffect(() => {
    if (config.flags.performanceMonitoring) {
      monitorRef.current = EnterprisePerformanceMonitor.getInstance();
      
      return () => {
        monitorRef.current?.cleanup();
      };
    }
  }, []);

  const measureCustomMetric = useCallback((name: string, value: number) => {
    monitorRef.current?.measureCustomMetric(name, value);
  }, []);

  const generateReport = useCallback(() => {
    return monitorRef.current?.generateReport();
  }, []);

  const getCurrentMetrics = useCallback(() => {
    return monitorRef.current?.getCurrentMetrics() || {};
  }, []);

  return {
    measureCustomMetric,
    generateReport,
    getCurrentMetrics,
  };
}

// Component for automatic performance monitoring
export function PerformanceMonitor({ children }: { children?: React.ReactNode }) {
  usePerformanceMonitoring();
  return <>{children}</>;
}