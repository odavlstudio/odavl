/**
 * Project Analytics API
 * GET /api/v1/projects/:projectId/analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { organizationService } from '../../../../../../../../packages/core/src/services/organization';
import { projectService } from '../../../../../../../../packages/core/src/services/project';
import { analyticsService } from '../../../../../../../../packages/core/src/services/analytics';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId } = await params;

    // Get project to verify organization access
    const project = await projectService.getProject(projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check permission
    const hasPermission = await organizationService.hasPermission(
      project.organizationId,
      session.user.id,
      'analytics:read'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Parse time range from query params
    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const timeRange = startParam && endParam ? {
      start: new Date(startParam),
      end: new Date(endParam),
    } : undefined;

    const metrics = await analyticsService.getProjectAnalytics(
      projectId,
      timeRange
    );

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error fetching project analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project analytics' },
      { status: 500 }
    );
  }
}
