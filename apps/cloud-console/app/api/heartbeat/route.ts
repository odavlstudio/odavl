import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * UptimeRobot Heartbeat Endpoint
 * 
 * Simple endpoint that returns 200 OK if service is running.
 * UptimeRobot monitors this endpoint at regular intervals.
 * 
 * Configure UptimeRobot:
 * - Monitor Type: HTTP(s)
 * - URL: https://your-domain.com/api/heartbeat
 * - Interval: 5 minutes
 * - Expected Status: 200
 */
export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'odavl-cloud-console',
    },
    { status: 200 }
  );
}

// Also support HEAD requests for efficiency
export async function HEAD(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}
