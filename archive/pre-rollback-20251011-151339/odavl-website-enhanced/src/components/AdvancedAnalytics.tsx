/**
 * ODAVL Enterprise Advanced Analytics
 * Comprehensive analytics and insights system with privacy-first approach
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { config } from '@/lib/config';

// Analytics event types
export interface AnalyticsEvent {
  name: string;
  category: 'page_view' | 'user_interaction' | 'performance' | 'error' | 'business' | 'security';
  properties?: Record<string, unknown>;
  timestamp?: string;
  sessionId?: string;
  userId?: string;
  metadata?: {
    userAgent?: string;
    viewport?: { width: number; height: number };
    referrer?: string;
    path?: string;
    title?: string;
  };
}

export interface AnalyticsConfig {
  enabledProviders: Array<'vercel' | 'google' | 'custom' | 'internal'>;
  sampling: {
    events: number; // Percentage 0-100
    errors: number;
    performance: number;
  };
  privacy: {
    respectDoNotTrack: boolean;
    anonymizeIPs: boolean;
    cookieConsent: boolean;
    dataRetention: number; // Days
  };
  performance: {
    trackWebVitals: boolean;
    trackNavigation: boolean;
    trackResources: boolean;
  };
  debugging: {
    logEvents: boolean;
    validateData: boolean;
  };
}

export interface AnalyticsInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'alert';
  title: string;
  description: string;
  data?: unknown;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  actionRequired?: boolean;
  recommendations?: string[];
  timestamp: string;
}

export interface AnalyticsReport {
  id: string;
  timestamp: string;
  period: { start: string; end: string };
  metrics: {
    pageViews: number;
    uniqueUsers: number;
    sessions: number;
    bounceRate: number;
    avgSessionDuration: number;
    conversionRate: number;
    errorRate: number;
    performanceScore: number;
  };
  insights: AnalyticsInsight[];
  topPages: Array<{ path: string; views: number; avgTime: number }>;
  userJourney: Array<{ step: string; users: number; dropOff: number }>;
  technicalMetrics: {
    avgLoadTime: number;
    mobileTraffic: number;
    browserDistribution: Record<string, number>;
    errorsByType: Record<string, number>;
  };
  recommendations: string[];
}

export class EnterpriseAdvancedAnalytics {
  private static instance: EnterpriseAdvancedAnalytics | null = null;
  private config: AnalyticsConfig;
  private sessionId: string;
  private eventQueue: AnalyticsEvent[] = [];
  private insights: AnalyticsInsight[] = [];
  private isInitialized = false;

  private constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.config = this.getDefaultConfig();
    this.initialize();
  }

  public static getInstance(): EnterpriseAdvancedAnalytics {
    if (!EnterpriseAdvancedAnalytics.instance) {
      EnterpriseAdvancedAnalytics.instance = new EnterpriseAdvancedAnalytics();
    }
    return EnterpriseAdvancedAnalytics.instance;
  }

  private getDefaultConfig(): AnalyticsConfig {
    return {
      enabledProviders: ['internal'],
      sampling: {
        events: 100,
        errors: 100,
        performance: 50,
      },
      privacy: {
        respectDoNotTrack: true,
        anonymizeIPs: true,
        cookieConsent: false, // Will be updated based on consent
        dataRetention: 90,
      },
      performance: {
        trackWebVitals: true,
        trackNavigation: true,
        trackResources: false,
      },
      debugging: {
        logEvents: process.env.NODE_ENV === 'development',
        validateData: true,
      },
    };
  }

  private async initialize() {
    if (this.isInitialized) return;

    try {
      // Check for Do Not Track
      if (this.config.privacy.respectDoNotTrack && this.isDoNotTrackEnabled()) {
        console.log('🚫 Analytics disabled due to Do Not Track setting');
        return;
      }

      // Initialize external providers
      if (this.config.enabledProviders.includes('vercel')) {
        await this.initializeVercelAnalytics();
      }

      if (this.config.enabledProviders.includes('google')) {
        await this.initializeGoogleAnalytics();
      }

      // Set up performance monitoring
      if (this.config.performance.trackWebVitals) {
        this.setupWebVitalsTracking();
      }

      // Set up navigation tracking
      if (this.config.performance.trackNavigation) {
        this.setupNavigationTracking();
      }

      // Set up error tracking
      this.setupErrorTracking();

      // Start background processing
      this.startEventProcessor();

      this.isInitialized = true;
      console.log('📊 Advanced Analytics initialized');

      // Track initialization
      this.track({
        name: 'analytics_initialized',
        category: 'business',
        properties: {
          providers: this.config.enabledProviders,
          sessionId: this.sessionId,
        },
      });
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  private isDoNotTrackEnabled(): boolean {
    if (typeof navigator === 'undefined') return false;
    return navigator.doNotTrack === '1' || (window as any).doNotTrack === '1';
  }

  private async initializeVercelAnalytics() {
    try {
      // Dynamic import to avoid loading if not needed
      const vercelAnalytics = await import('@vercel/analytics');
      if ('track' in vercelAnalytics) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (vercelAnalytics as any).track('page_view');
      }
      console.log('📊 Vercel Analytics initialized');
    } catch (error) {
      console.warn('Failed to initialize Vercel Analytics:', error);
    }
  }

  private async initializeGoogleAnalytics() {
    try {
      // This would initialize Google Analytics
      // Placeholder for GA4 integration
      console.log('📊 Google Analytics would be initialized here');
    } catch (error) {
      console.warn('Failed to initialize Google Analytics:', error);
    }
  }

  private setupWebVitalsTracking() {
    if (typeof window === 'undefined') return;

    // Track Core Web Vitals (fallback implementation)
    this.setupFallbackWebVitals();
  }

  private setupFallbackWebVitals() {
    if (typeof window === 'undefined') return;

    // Simple performance tracking
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      this.track({
        name: 'page_load_performance',
        category: 'performance',
        properties: {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstByte: navigation.responseStart - navigation.requestStart,
        },
      });
    });
  }

  private setupNavigationTracking() {
    if (typeof window === 'undefined') return;

    // Track page views
    this.track({
      name: 'page_view',
      category: 'page_view',
      properties: {
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer,
      },
    });

    // Track history changes (SPA navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.track({
        name: 'page_view',
        category: 'page_view',
        properties: {
          path: window.location.pathname,
          title: document.title,
          type: 'spa_navigation',
        },
      });
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.track({
        name: 'page_view',
        category: 'page_view',
        properties: {
          path: window.location.pathname,
          title: document.title,
          type: 'spa_replace',
        },
      });
    };

    window.addEventListener('popstate', () => {
      this.track({
        name: 'page_view',
        category: 'page_view',
        properties: {
          path: window.location.pathname,
          title: document.title,
          type: 'back_forward',
        },
      });
    });
  }

  private setupErrorTracking() {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.track({
        name: 'javascript_error',
        category: 'error',
        properties: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        },
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.track({
        name: 'unhandled_promise_rejection',
        category: 'error',
        properties: {
          reason: event.reason?.toString(),
          stack: event.reason?.stack,
        },
      });
    });
  }

  private startEventProcessor() {
    // Process events every 5 seconds
    setInterval(() => {
      this.processEventQueue();
    }, 5000);

    // Process immediately on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.processEventQueue(true);
      });
    }
  }

  private processEventQueue(immediate = false) {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    if (immediate && navigator.sendBeacon) {
      // Use sendBeacon for reliable delivery during page unload
      navigator.sendBeacon('/api/analytics', JSON.stringify({ events }));
    } else {
      // Regular processing
      this.sendEvents(events);
    }
  }

  private async sendEvents(events: AnalyticsEvent[]) {
    try {
      // Internal analytics storage
      this.storeEventsLocally(events);

      // Send to external providers
      if (this.config.enabledProviders.includes('vercel')) {
        events.forEach(event => {
          // Send to Vercel Analytics
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (typeof window !== 'undefined' && (window as any).va) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).va('track', event.name, event.properties);
          }
        });
      }

      // Generate insights from events
      this.generateInsights(events);

      if (this.config.debugging.logEvents) {
        console.log('📊 Processed analytics events:', events.length);
      }
    } catch (error) {
      console.error('Failed to process analytics events:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
    }
  }

  private storeEventsLocally(events: AnalyticsEvent[]) {
    if (typeof window === 'undefined') return;

    try {
      const storageKey = `odavl_analytics_${Date.now()}`;
      const data = {
        sessionId: this.sessionId,
        events,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(storageKey, JSON.stringify(data));

      // Cleanup old data based on retention policy
      this.cleanupOldData();
    } catch (error) {
      console.error('Failed to store analytics data:', error);
    }
  }

  private cleanupOldData() {
    if (typeof window === 'undefined') return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.privacy.dataRetention);
    const cutoffTime = cutoffDate.getTime();

    Object.keys(localStorage)
      .filter(key => key.startsWith('odavl_analytics_'))
      .forEach(key => {
        const timestamp = parseInt(key.split('_')[2]);
        if (timestamp < cutoffTime) {
          localStorage.removeItem(key);
        }
      });
  }

  private generateInsights(events: AnalyticsEvent[]) {
    // Performance insights
    const performanceEvents = events.filter(e => e.category === 'performance');
    if (performanceEvents.length > 0) {
      const avgLoadTime = performanceEvents
        .filter(e => e.name === 'page_load_performance')
        .reduce((acc, e) => acc + (e.properties?.loadTime as number || 0), 0) / performanceEvents.length;

      if (avgLoadTime > 3000) {
        this.insights.push({
          id: `perf_insight_${Date.now()}`,
          type: 'alert',
          title: 'Slow Page Load Performance',
          description: `Average load time is ${Math.round(avgLoadTime)}ms, which exceeds the 3s threshold`,
          severity: 'high',
          actionRequired: true,
          recommendations: [
            'Optimize images and static assets',
            'Implement code splitting',
            'Review bundle size and dependencies',
          ],
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Error insights
    const errorEvents = events.filter(e => e.category === 'error');
    if (errorEvents.length > 5) {
      this.insights.push({
        id: `error_insight_${Date.now()}`,
        type: 'alert',
        title: 'High Error Rate Detected',
        description: `${errorEvents.length} errors detected in this batch`,
        severity: 'critical',
        actionRequired: true,
        recommendations: [
          'Review error logs for common patterns',
          'Implement better error boundaries',
          'Add more comprehensive error handling',
        ],
        timestamp: new Date().toISOString(),
      });
    }

    // User engagement insights
    const pageViews = events.filter(e => e.name === 'page_view');
    if (pageViews.length > 0) {
      const uniquePaths = new Set(pageViews.map(e => e.properties?.path)).size;
      if (uniquePaths === 1 && pageViews.length > 10) {
        this.insights.push({
          id: `engagement_insight_${Date.now()}`,
          type: 'recommendation',
          title: 'Single Page Focus Detected',
          description: 'User is spending significant time on one page',
          severity: 'low',
          actionRequired: false,
          recommendations: [
            'Consider adding related content suggestions',
            'Implement better internal linking',
            'Add call-to-action elements',
          ],
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Keep only recent insights (last 24 hours)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    this.insights = this.insights.filter(insight => insight.timestamp > dayAgo);
  }

  // Public API methods
  public track(event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId' | 'metadata'>): void {
    if (!this.isInitialized || !this.shouldSampleEvent(event)) return;

    const enrichedEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      metadata: this.getEventMetadata(),
    };

    if (this.config.debugging.validateData) {
      this.validateEvent(enrichedEvent);
    }

    this.eventQueue.push(enrichedEvent);

    if (this.config.debugging.logEvents) {
      console.log('📊 Analytics event:', enrichedEvent);
    }
  }

  private shouldSampleEvent(event: AnalyticsEvent): boolean {
    const sampling = this.config.sampling;
    let rate: number;

    switch (event.category) {
      case 'error':
        rate = sampling.errors;
        break;
      case 'performance':
        rate = sampling.performance;
        break;
      default:
        rate = sampling.events;
    }

    return Math.random() * 100 < rate;
  }

  private getEventMetadata() {
    if (typeof window === 'undefined') return {};

    return {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      referrer: document.referrer,
      path: window.location.pathname,
      title: document.title,
    };
  }

  private validateEvent(event: AnalyticsEvent) {
    if (!event.name || typeof event.name !== 'string') {
      console.warn('Invalid analytics event: missing or invalid name', event);
      return false;
    }

    if (!event.category) {
      console.warn('Invalid analytics event: missing category', event);
      return false;
    }

    return true;
  }

  public generateReport(period?: { start: string; end: string }): AnalyticsReport {
    const reportPeriod = period || {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    };

    // This would normally aggregate data from storage/API
    // For now, return a sample report structure
    const report: AnalyticsReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date().toISOString(),
      period: reportPeriod,
      metrics: {
        pageViews: 1250,
        uniqueUsers: 890,
        sessions: 1100,
        bounceRate: 0.35,
        avgSessionDuration: 245,
        conversionRate: 0.08,
        errorRate: 0.02,
        performanceScore: 85,
      },
      insights: this.insights,
      topPages: [
        { path: '/', views: 450, avgTime: 120 },
        { path: '/docs', views: 380, avgTime: 280 },
        { path: '/enterprise', views: 220, avgTime: 195 },
      ],
      userJourney: [
        { step: 'Landing', users: 1000, dropOff: 0.15 },
        { step: 'Documentation', users: 850, dropOff: 0.25 },
        { step: 'Contact', users: 637, dropOff: 0.40 },
        { step: 'Conversion', users: 382, dropOff: 0 },
      ],
      technicalMetrics: {
        avgLoadTime: 1200,
        mobileTraffic: 0.45,
        browserDistribution: {
          Chrome: 0.65,
          Firefox: 0.15,
          Safari: 0.12,
          Edge: 0.08,
        },
        errorsByType: {
          'JavaScript Error': 5,
          'Network Error': 2,
          'Security Error': 1,
        },
      },
      recommendations: [
        '🚀 Page load performance is good, maintain current optimization',
        '📱 Mobile traffic is significant, ensure mobile-first design',
        '🔍 High documentation engagement suggests need for better search',
        '⚡ Consider implementing progressive web app features',
      ],
    };

    return report;
  }

  public getInsights(): AnalyticsInsight[] {
    return [...this.insights];
  }

  public updateConfig(updates: Partial<AnalyticsConfig>) {
    this.config = { ...this.config, ...updates };
    console.log('📊 Analytics configuration updated');
  }

  public setConsentStatus(hasConsent: boolean) {
    this.config.privacy.cookieConsent = hasConsent;
    if (!hasConsent) {
      // Clear stored data
      this.clearStoredData();
    }
  }

  private clearStoredData() {
    if (typeof window === 'undefined') return;

    Object.keys(localStorage)
      .filter(key => key.startsWith('odavl_analytics_'))
      .forEach(key => localStorage.removeItem(key));
  }
}

// React hook for analytics
export function useAdvancedAnalytics() {
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const analytics = EnterpriseAdvancedAnalytics.getInstance();

  const track = useCallback((event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId' | 'metadata'>) => {
    if (config.flags.advancedAnalytics) {
      analytics.track(event);
    }
  }, [analytics]);

  const generateReport = useCallback((period?: { start: string; end: string }) => {
    return analytics.generateReport(period);
  }, [analytics]);

  const updateConfig = useCallback((updates: Partial<AnalyticsConfig>) => {
    analytics.updateConfig(updates);
  }, [analytics]);

  const setConsentStatus = useCallback((hasConsent: boolean) => {
    analytics.setConsentStatus(hasConsent);
  }, [analytics]);

  useEffect(() => {
    if (config.flags.advancedAnalytics) {
      setIsInitialized(true);
      const interval = setInterval(() => {
        setInsights(analytics.getInsights());
      }, 30000); // Update insights every 30 seconds

      return () => clearInterval(interval);
    }
  }, [analytics]);

  return {
    track,
    generateReport,
    updateConfig,
    setConsentStatus,
    insights,
    isInitialized,
  };
}

// Component for automatic analytics setup
export function AdvancedAnalytics({ children }: { children?: React.ReactNode }) {
  const { track } = useAdvancedAnalytics();

  useEffect(() => {
    if (config.flags.advancedAnalytics) {
      // Track component mount
      track({
        name: 'advanced_analytics_mounted',
        category: 'business',
        properties: {
          component: 'AdvancedAnalytics',
        },
      });
    }
  }, [track]);

  return <>{children}</>;
}

export default AdvancedAnalytics;