import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Edge function for collecting client-side metrics
export const runtime = 'edge';

// Type for Vercel edge runtime geo property
type RequestWithGeo = NextRequest & {
  geo?: {
    country?: string;
    city?: string;
    region?: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    const metrics = await request.json();
    const reqWithGeo = request as RequestWithGeo;

    // Extract useful metadata
    const country = reqWithGeo.geo?.country || 'unknown';
    const city = reqWithGeo.geo?.city || 'unknown';
    const region = process.env.VERCEL_REGION || 'unknown';

    // In production, send to analytics service (Datadog, New Relic, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to external analytics
      // await fetch(process.env.ANALYTICS_ENDPOINT!, {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     ...metrics,
      //     geo: { country, city, region },
      //     timestamp: Date.now(),
      //   }),
      // });

      logger.debug('Edge metrics received', {
        metrics,
        geo: { country, city, region },
      });
    }

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    logger.error('Failed to process edge metrics', error as Error);
    return NextResponse.json(
      { error: 'Failed to process metrics' },
      { status: 500 }
    );
  }
}
