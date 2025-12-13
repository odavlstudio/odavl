/**
 * Dashboard Metrics API
 * GET /api/dashboard/metrics
 * Week 10 Day 1: Analytics Dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsService } from '@/lib/metrics/service';
import type { TimeRange } from '@/lib/metrics/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'demo-project-123';
    const timeRange = (searchParams.get('timeRange') || '7d') as TimeRange;

    // Validate time range
    const validRanges: TimeRange[] = ['7d', '30d', '90d', 'all'];
    if (!validRanges.includes(timeRange)) {
      return NextResponse.json(
        { error: 'Invalid time range. Must be one of: 7d, 30d, 90d, all' },
        { status: 400 }
      );
    }

    // Get dashboard summary
    const summary = await metricsService.getDashboardSummary(projectId, timeRange);

    return NextResponse.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard metrics'
      },
      { status: 500 }
    );
  }
}
