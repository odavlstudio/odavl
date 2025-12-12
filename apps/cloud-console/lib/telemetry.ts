/**
 * Telemetry utilities for tracking custom events
 */

export type TelemetryEvent =
  | 'insight_scan_start'
  | 'insight_scan_complete'
  | 'autopilot_fix_start'
  | 'autopilot_fix_complete'
  | 'guardian_simulation_run'
  | 'guardian_simulation_complete'
  | 'page_view_dashboard'
  | 'page_view_projects'
  | 'page_view_settings'
  | 'page_view_billing'
  | 'billing_checkout_initiated'
  | 'billing_checkout_complete'
  | 'billing_upgrade_clicked'
  | 'project_created'
  | 'project_deleted'
  | 'error_occurred';

export interface TelemetryProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track a custom event
 */
export function trackEvent(
  event: TelemetryEvent,
  properties?: TelemetryProperties
): void {
  if (typeof window === 'undefined') return;

  // Send to telemetry API
  fetch('/api/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event,
      properties,
      timestamp: new Date().toISOString(),
      userId: getUserId(),
      sessionId: getSessionId(),
    }),
  }).catch((error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Telemetry Error]', error);
    }
  });
}

/**
 * Track page view
 */
export function trackPageView(page: string, properties?: TelemetryProperties): void {
  const eventMap: Record<string, TelemetryEvent> = {
    '/app/dashboard': 'page_view_dashboard',
    '/app/projects': 'page_view_projects',
    '/app/settings': 'page_view_settings',
    '/app/billing': 'page_view_billing',
  };

  const event = eventMap[page];
  if (event) {
    trackEvent(event, properties);
  }
}

/**
 * Get user ID from session (if authenticated)
 */
function getUserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  
  // Try to get from session storage
  try {
    return sessionStorage.getItem('odavl_user_id') || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Get or create session ID
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  try {
    let sessionId = sessionStorage.getItem('odavl_session_id');
    
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('odavl_session_id', sessionId);
    }

    return sessionId;
  } catch {
    return 'unknown';
  }
}

/**
 * Track error
 */
export function trackError(
  error: Error | string,
  context?: TelemetryProperties
): void {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;

  trackEvent('error_occurred', {
    error: errorMessage,
    stack: errorStack,
    ...context,
  });
}
