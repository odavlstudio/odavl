'use client';

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Monitor Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            console.log('FCP:', entry.startTime);
          }
          if (entry.name === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
          }
        });
      });

      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });

      return () => observer.disconnect();
    }
  }, []);

  return null;
}