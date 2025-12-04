/**
 * Prefetching utilities for optimizing page transitions
 * Use in Link components and navigation hooks
 */

export interface PrefetchConfig {
  priority?: 'high' | 'low' | 'auto';
  as?: 'fetch' | 'document' | 'image' | 'script' | 'style';
}

// Prefetch critical resources
export function prefetchCriticalData(urls: string[]) {
  if (typeof window === 'undefined') return;
  
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'fetch';
    document.head.appendChild(link);
  });
}

// DNS prefetch for external domains
export function dnsPrefetch(domains: string[]) {
  if (typeof window === 'undefined') return;
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });
}

// Preconnect to critical origins
export function preconnect(origins: string[], crossorigin: boolean = false) {
  if (typeof window === 'undefined') return;
  
  origins.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    if (crossorigin) {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  });
}

// Prefetch dashboard data on hover
export function prefetchDashboardData() {
  if (typeof window === 'undefined') return;
  
  const dashboardEndpoints = [
    '/api/trpc/insight.getIssues',
    '/api/trpc/autopilot.getRuns',
    '/api/trpc/guardian.getTests',
  ];
  
  prefetchCriticalData(dashboardEndpoints);
}

// Initialize prefetching for common resources
export function initializePrefetch() {
  // DNS prefetch for external services
  dnsPrefetch([
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.jsdelivr.net',
  ]);
  
  // Preconnect to critical origins
  preconnect([
    'https://fonts.googleapis.com',
    'https://api.sentry.io',
  ], true);
}
