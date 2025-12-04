import { NextResponse } from 'next/server';

// Deploy this route to the edge for global low-latency health checks
export const runtime = 'edge';

export async function GET() {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    region: process.env.VERCEL_REGION || 'unknown',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  };
  
  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      'CDN-Cache-Control': 'public, s-maxage=30',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=30',
    },
  });
}
