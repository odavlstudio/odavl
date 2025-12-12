/**
 * Insight Analysis API - Get Status
 * GET /api/insight/analysis/[id]
 * 
 * Get analysis job status and results (paginated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withInsightAuth } from '@odavl-studio/auth/insight-middleware';
import {
  getAnalysisWithIssues,
  userOwnsAnalysis,
} from '@/lib/services/analysis-service';

/**
 * GET /api/insight/analysis/:id
 * Get analysis status and results
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withInsightAuth(req, async (req: NextRequest) => {
    try {
      const session = (req as any).session;
      const { id: analysisId } = params;

      // Check authorization
      const hasAccess = await userOwnsAnalysis(analysisId, session.userId);

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Analysis not found or access denied' },
          { status: 404 }
        );
      }

      // Parse pagination params
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = Math.min(
        parseInt(searchParams.get('limit') || '50', 10),
        200 // Max 200 issues per request
      );

      // Get analysis with issues
      const result = await getAnalysisWithIssues(analysisId, page, limit);

      if (!result) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        );
      }

      // Return data
      return NextResponse.json({
        success: true,
        analysis: {
          id: result.analysis.id,
          projectId: result.analysis.project.id,
          projectName: result.analysis.project.name,
          status: result.analysis.status,
          progress: result.analysis.progress,
          summary: {
            totalIssues: result.analysis.totalIssues,
            critical: result.analysis.severity.critical,
            high: result.analysis.severity.high,
            medium: result.analysis.severity.medium,
            low: result.analysis.severity.low,
            info: result.analysis.severity.info,
          },
          timing: {
            startedAt: result.analysis.startedAt,
            finishedAt: result.analysis.finishedAt,
            duration: result.analysis.duration,
          },
          error: result.analysis.error || null,
        },
        issues: result.issues,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Error fetching analysis:', error);

      return NextResponse.json(
        {
          error: 'Internal server error',
          message:
            error instanceof Error ? error.message : 'Failed to fetch analysis',
        },
        { status: 500 }
      );
    }
  });
}
