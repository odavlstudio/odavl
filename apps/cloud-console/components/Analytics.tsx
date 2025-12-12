import Script from 'next/script';

/**
 * Send custom telemetry event
 */
export function trackEvent(event: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  fetch('/api/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, properties }),
  }).catch((error) => {
    console.error('[Telemetry]', error);
  });
}

/**
 * Analytics component with Vercel Analytics and custom telemetry
 */
export default function Analytics() {
  // Only load in production
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      {/* Vercel Analytics */}
      <Script
        src="https://cdn.vercel-insights.com/v1/script.js"
        strategy="afterInteractive"
      />
      
      {/* Web Vitals Reporting */}
      <Script
        id="web-vitals"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if ('web-vitals' in window) {
              function sendToAnalytics(metric) {
                const body = JSON.stringify(metric);
                const url = '/api/analytics/vitals';
                if (navigator.sendBeacon) {
                  navigator.sendBeacon(url, body);
                } else {
                  fetch(url, { body, method: 'POST', keepalive: true });
                }
              }
              
              webVitals.onCLS(sendToAnalytics);
              webVitals.onFID(sendToAnalytics);
              webVitals.onLCP(sendToAnalytics);
              webVitals.onFCP(sendToAnalytics);
              webVitals.onTTFB(sendToAnalytics);
            }
          `
        }}
      />
    </>
  );
}
