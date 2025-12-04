/**
 * Metrics API - Prometheus-style metrics endpoint
 * GET /api/v1/observability/metrics
 * GET /api/v1/observability/metrics/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsService } from '@/packages/core/src/services/metrics';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    const stats = searchParams.get('stats') === 'true';

    if (stats) {
      // Return request statistics
      const requestStats = metricsService.getRequestStats();
      return NextResponse.json({
        success: true,
        data: requestStats
      });
    }

    if (format === 'prometheus') {
      // Export in Prometheus format
      const prometheusMetrics = metricsService.exportPrometheus();
      return new NextResponse(prometheusMetrics, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
    }

    // Return JSON snapshot
    const snapshot = metricsService.getSnapshot();
    return NextResponse.json({
      success: true,
      data: snapshot
    });

  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
