// Disable this API route for static export (Next.js 15+ 'output: export')
export const dynamic = "force-static";

/**
 * Stripe Checkout Session API Route
 * Creates payment sessions for ODAVL Pro subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
// ...existing code...

// API routes are not supported in static export mode
export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'API routes are not available in static export mode',
    message: 'This endpoint is disabled for static export. Please deploy to a server environment.'
  }, { status: 501 });
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    error: 'API routes are not available in static export mode',
    message: 'This endpoint is disabled for static export. Please deploy to a server environment.'
  }, { status: 501 });
}
