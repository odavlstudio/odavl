// Disable this API route for static export (Next.js 15+ 'output: export')
export const dynamic = "force-static";

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    error: 'API routes are not available in static export mode',
    message: 'This endpoint is disabled for static export. Please deploy to a server environment.'
  }, { status: 501 });
}

export async function GET() {
  return NextResponse.json({
    error: 'API routes are not available in static export mode',
    message: 'This endpoint is disabled for static export. Please deploy to a server environment.'
  }, { status: 501 });
}
