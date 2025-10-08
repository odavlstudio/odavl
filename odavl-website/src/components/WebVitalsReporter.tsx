'use client';

import { useReportWebVitals } from 'next/web-vitals';

export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Only track in production for real performance insights
    if (process.env.NODE_ENV === 'production') {
      // Log performance metrics for monitoring
      const body = JSON.stringify(metric);
      const url = '/api/vitals';

      // Use sendBeacon if available, otherwise fallback to fetch
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, body);
      } else {
        fetch(url, { body, method: 'POST', keepalive: true });
      }
    }
  });

  return null;
}