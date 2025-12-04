/**
 * Cancel Analysis API
 * POST /api/analysis/[analysisId]/cancel - Cancel running analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { cancelAnalysis } from '@/lib/analysis/event-emitter';

async function handleCancel(
  req: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  const { analysisId } = params;

  const cancelled = cancelAnalysis(analysisId);

  if (!cancelled) {
    return NextResponse.json(
      { error: 'Analysis not found or already completed' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Analysis cancelled',
    analysisId,
  });
}

export const POST = withAuth(handleCancel);
