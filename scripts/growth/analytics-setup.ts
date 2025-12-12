// Analytics tracking setup (Google Analytics, Mixpanel)
export function trackEvent(name: string, properties: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, properties);
  }
  if (typeof window !== 'undefined' && window.mixpanel) {
    window.mixpanel.track(name, properties);
  }
}
