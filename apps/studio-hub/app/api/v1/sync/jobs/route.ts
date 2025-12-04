/**
 * Sync Jobs API
 * Manage and monitor sync job statuses
 */

import { NextRequest, NextResponse } from 'next/server';
import { cloudSyncService } from '@/../../packages/core/src/services/cloud-sync';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId parameter' },
        { status: 400 }
      );
    }

    // Get sync statistics
    const stats = cloudSyncService.getSyncStats(organizationId);

    // Get jobs for project if specified
    let jobs = projectId
      ? cloudSyncService.getSyncJobsForProject(projectId)
      : [];

    // Filter by status if specified
    if (status) {
      jobs = jobs.filter(job => job.status === status);
    }

    // Filter by type if specified
    if (type) {
      jobs = jobs.filter(job => job.type === type);
    }

    // Limit results
    jobs = jobs.slice(0, limit);

    return NextResponse.json({
      success: true,
      jobs,
      stats,
      filters: {
        projectId,
        organizationId,
        status,
        type,
        limit,
      },
    });

  } catch (error) {
    console.error('Sync jobs list error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse body for action
    const body = await request.json();
    const { action, jobId } = body;

    if (!action || !jobId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, jobId' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'retry':
        result = await cloudSyncService.retryJob(jobId);
        return NextResponse.json({
          success: true,
          message: 'Job retry initiated',
          job: result,
        });

      case 'cancel':
        await cloudSyncService.cancelJob(jobId);
        return NextResponse.json({
          success: true,
          message: 'Job cancelled',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: retry, cancel' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Sync job action error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const daysToKeep = parseInt(searchParams.get('daysToKeep') || '7', 10);

    // Clear old completed jobs
    const cleared = cloudSyncService.clearOldJobs(daysToKeep);

    return NextResponse.json({
      success: true,
      message: `Cleared ${cleared} old completed jobs`,
      daysToKeep,
      clearedCount: cleared,
    });

  } catch (error) {
    console.error('Clear old jobs error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
