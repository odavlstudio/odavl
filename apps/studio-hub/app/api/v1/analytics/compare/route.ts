/**
 * Project Comparison API
 * GET /api/v1/analytics/compare - Compare multiple projects
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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
    const projectIdsParam = searchParams.get('projectIds');

    if (!projectIdsParam) {
      return NextResponse.json(
        { success: false, error: 'projectIds parameter is required (comma-separated)' },
        { status: 400 }
      );
    }

    const projectIds = projectIdsParam.split(',').map(id => id.trim());

    if (projectIds.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 projects required for comparison' },
        { status: 400 }
      );
    }

    // TODO: Verify user has access to all these projects

    const comparison = await trendsAnalysisService.compareProjects(projectIds);

    return NextResponse.json({
      success: true,
      data: comparison
    });

  } catch (error) {
    console.error('Error comparing projects:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
