// Social share event tracking
export function trackShare(platform: string, url: string) {
  trackEvent('share', { platform, url, timestamp: Date.now() });
  
  // Update share count in database
  fetch('/api/analytics/share', {
    method: 'POST',
    body: JSON.stringify({ platform, url })
  });
}
