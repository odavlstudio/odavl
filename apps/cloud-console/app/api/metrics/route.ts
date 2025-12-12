import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

/**
 * Prometheus Metrics Endpoint
 * 
 * Exports metrics in Prometheus format for scraping.
 * 
 * Configure Prometheus:
 * - scrape_configs:
 *   - job_name: 'odavl-cloud'
 *     scrape_interval: 15s
 *     static_configs:
 *       - targets: ['your-domain.com']
 *     metrics_path: '/api/metrics'
 */
export async function GET(req: NextRequest) {
  try {
    const metrics = await register.metrics();
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}
