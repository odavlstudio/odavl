import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'edge';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

export async function POST(request: NextRequest) {
  try {
    const metric: WebVitalsMetric = await request.json();

    // Validate metric data
    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // In production, you would send this to your analytics service
    // For now, we'll just log it in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Web Vitals metric', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        navigationType: metric.navigationType,
      });
    }

    // Example: Send to analytics service (commented out)
    // await fetch('https://analytics-endpoint.example.com/metrics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     metric: metric.name,
    //     value: metric.value,
    //     rating: metric.rating,
    //     timestamp: Date.now(),
    //     userId: request.headers.get('x-user-id'),
    //     sessionId: request.headers.get('x-session-id'),
    //   }),
    // });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process metric' },
      { status: 500 }
    );
  }
}
