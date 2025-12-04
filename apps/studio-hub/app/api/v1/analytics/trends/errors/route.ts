/**
 * Advanced Analytics API Routes
 * Phase 3.1: Trends, Quality Scores, and Comparisons
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { trendsAnalysisService } from '@/packages/core/src/services/trends-analysis';
import { qualityScoreCalculator, QualityMetrics } from '@/packages/core/src/services/quality-score';

/**
 * GET /api/v1/analytics/trends/errors
 * Get error trends for a project
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const period = searchParams.get('period') as 'hour' | 'day' | 'week' | 'month' | null;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'projectId is required' },
        { status: 400 }
      );
    }

    // TODO: Verify user has access to this project

    const trends = await trendsAnalysisService.getErrorTrends(
      projectId,
      period || 'day'
    );

    return NextResponse.json({
      success: true,
      data: trends
    });

  } catch (error) {
    console.error('Error fetching error trends:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
