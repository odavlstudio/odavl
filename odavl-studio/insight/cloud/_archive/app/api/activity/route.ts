/**
 * Activity Feed API
 * GET /api/activity - Get project activity feed
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { ActivityService } from '@/lib/activity/service';

async function handleGetActivity(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const type = searchParams.get('type') as any;

  if (!projectId) {
    return NextResponse.json(
      { error: 'projectId is required' },
      { status: 400 }
    );
  }

  const activities = ActivityService.getProjectActivities(projectId, {
    limit,
    offset,
    type,
  });

  return NextResponse.json({
    activities,
    hasMore: activities.length === limit,
  });
}

export const GET = withAuth(handleGetActivity);
