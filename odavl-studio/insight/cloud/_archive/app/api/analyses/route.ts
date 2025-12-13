/**
 * Insight Analyses List API
 * GET /api/insight/analyses
 * 
 * List user's analyses (paginated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withInsightAuth } from '@odavl-studio/auth/insight-middleware';
import { getUserAnalyses } from '@/lib/services/analysis-service';

/**
 * GET /api/insight/analyses
 * List user's analyses
 */
export const GET = withInsightAuth(async (req: NextRequest) => {
  try {
    const session = (req as any).session;

    // Parse pagination params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '20', 10),
      100 // Max 100 analyses per request
    );

    // Get user's analyses
    const result = await getUserAnalyses(session.userId, page, limit);

    return NextResponse.json({
      success: true,
      analyses: result.analyses,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error listing analyses:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          error instanceof Error ? error.message : 'Failed to list analyses',
      },
      { status: 500 }
    );
  }
});
