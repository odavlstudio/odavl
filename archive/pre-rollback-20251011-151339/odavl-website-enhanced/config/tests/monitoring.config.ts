// ODAVL-WAVE-X8-INJECT: Monitoring Configuration - Sentry & Web Vitals
// @odavl-governance: TESTING-SAFE mode active

export interface MonitoringConfig {
  sentry: {
    dsn: string;
    environment: string;
    tracesSampleRate: number;
  };
  webVitals: {
    enabled: boolean;
    endpoint: string;
  };
}

export const monitoringConfig: MonitoringConfig = {
  sentry: {
    dsn: process.env.SENTRY_DSN || 'https://mock-dsn@sentry.io/test',
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  },
  webVitals: {
    enabled: true,
    endpoint: '/api/web-vitals',
  },
};

export function initializeMonitoring() {
  if (typeof window !== 'undefined') {
    console.log('🔍 Monitoring initialized:', {
      environment: monitoringConfig.sentry.environment,
      webVitals: monitoringConfig.webVitals.enabled,
    });
  }
}