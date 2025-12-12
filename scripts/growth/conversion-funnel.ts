// Conversion funnel analytics
export const FUNNEL_STEPS = ['visit', 'signup', 'verify', 'first_scan', 'upgrade'] as const;

export function trackFunnelStep(step: typeof FUNNEL_STEPS[number]) {
  const completedSteps = JSON.parse(localStorage.getItem('funnelSteps') || '[]');
  if (!completedSteps.includes(step)) {
    completedSteps.push(step);
    localStorage.setItem('funnelSteps', JSON.stringify(completedSteps));
    trackEvent('funnel_step', { step, timestamp: Date.now() });
  }
}
