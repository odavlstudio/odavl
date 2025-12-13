/**
 * Detector Performance API
 * GET /api/dashboard/detectors
 * Week 10 Day 1: Analytics Dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsService } from '@/lib/metrics/service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'demo-project-123';

    const performance = metricsService.getDetectorPerformance(projectId);

    return NextResponse.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Detector performance error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch detector performance'
      },
      { status: 500 }
    );
  }
}
