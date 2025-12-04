/**
 * Analytics Export API
 * GET /api/v1/organizations/:orgId/analytics/export
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { organizationService } from '@odavl-studio/core/services/organization';
import { analyticsService } from '@odavl-studio/core/services/analytics';

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orgId } = params;

    // Check permission
    const hasPermission = await organizationService.hasPermission(
      orgId,
      session.user.id,
      'analytics:read'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get('format') || 'json') as 'json' | 'csv';
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const timeRange = startParam && endParam ? {
      start: new Date(startParam),
      end: new Date(endParam),
    } : undefined;

    const data = await analyticsService.exportAnalytics(
      orgId,
      format,
      timeRange
    );

    // Set appropriate headers based on format
    const headers: HeadersInit = {};
    if (format === 'csv') {
      headers['Content-Type'] = 'text/csv';
      headers['Content-Disposition'] = `attachment; filename="analytics-${orgId}-${Date.now()}.csv"`;
    } else {
      headers['Content-Type'] = 'application/json';
      headers['Content-Disposition'] = `attachment; filename="analytics-${orgId}-${Date.now()}.json"`;
    }

    return new NextResponse(data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    );
  }
}
