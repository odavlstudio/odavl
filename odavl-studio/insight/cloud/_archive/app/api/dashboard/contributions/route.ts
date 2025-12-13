/**
 * User Contributions API
 * GET /api/dashboard/contributions
 * Week 10 Day 1: Analytics Dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsService } from '@/lib/metrics/service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'demo-project-123';
    const limit = parseInt(searchParams.get('limit') || '10');

    const contributions = metricsService.getUserContributions(projectId, limit);

    return NextResponse.json({
      success: true,
      data: contributions
    });
  } catch (error) {
    console.error('User contributions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user contributions'
      },
      { status: 500 }
    );
  }
}
