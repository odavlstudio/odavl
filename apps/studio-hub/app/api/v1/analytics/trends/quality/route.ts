/**
 * Quality Trends API
 * GET /api/v1/analytics/trends/quality
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { trendsAnalysisService } from '@/packages/core/src/services/trends-analysis';

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

    const trends = await trendsAnalysisService.getQualityTrends(
      projectId,
      period || 'week'
    );

    return NextResponse.json({
      success: true,
      data: trends
    });

  } catch (error) {
    console.error('Error fetching quality trends:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
