/**
 * Single Alert API
 * GET /api/v1/observability/alerts/[alertId] - Get alert details
 * POST /api/v1/observability/alerts/[alertId]/resolve - Resolve alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { alertService } from '@/packages/core/src/services/alerts';

export async function GET(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const alert = alertService.getAlert(params.alertId);

    if (!alert) {
      return NextResponse.json(
        { success: false, error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: alert
    });

  } catch (error) {
    console.error('Error fetching alert:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await alertService.resolveAlert(
      params.alertId,
      session.user.id || session.user.email || undefined
    );

    return NextResponse.json({
      success: true,
      message: 'Alert resolved successfully'
    });

  } catch (error: any) {
    console.error('Error resolving alert:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
