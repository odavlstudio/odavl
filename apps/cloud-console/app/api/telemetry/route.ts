import { NextRequest, NextResponse } from 'next/server';

interface TelemetryEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

const ALLOWED_EVENTS = [
  'insight_scan_start',
  'insight_scan_complete',
  'autopilot_fix_start',
  'autopilot_fix_complete',
  'guardian_simulation_run',
  'guardian_simulation_complete',
  'page_view_dashboard',
  'page_view_projects',
  'page_view_settings',
  'page_view_billing',
  'billing_checkout_initiated',
  'billing_checkout_complete',
  'billing_upgrade_clicked',
  'project_created',
  'project_deleted',
  'error_occurred',
];

export async function POST(request: NextRequest) {
  try {
    const body: TelemetryEvent = await request.json();

    // Validate event name
    if (!body.event || !ALLOWED_EVENTS.includes(body.event)) {
      return NextResponse.json(
        { error: 'Invalid event name' },
        { status: 400 }
      );
    }

    // Add server timestamp
    const event: TelemetryEvent = {
      ...body,
      timestamp: new Date().toISOString(),
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('[Telemetry]', event);
    }

    // In production, you would send this to your analytics service
    // Examples: Mixpanel, Segment, PostHog, etc.
    // await analytics.track(event);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Telemetry Error]', error);
    return NextResponse.json(
      { error: 'Failed to process telemetry event' },
      { status: 500 }
    );
  }
}

// Block GET requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
