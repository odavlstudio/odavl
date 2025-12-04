/**
 * Alerts API
 * GET /api/v1/observability/alerts - Get all alerts
 * POST /api/v1/observability/alerts - Create alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { alertService, AlertSeverity } from '@/packages/core/src/services/alerts';
import { z } from 'zod';

const createAlertSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  source: z.string(),
  metadata: z.record(z.any()).optional(),
  ruleId: z.string().optional()
});

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
    const activeOnly = searchParams.get('active') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');

    const alerts = activeOnly
      ? alertService.getActiveAlerts()
      : alertService.getAllAlerts(limit);

    return NextResponse.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createAlertSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid alert data', details: validation.error },
        { status: 400 }
      );
    }

    const alert = await alertService.sendAlert({
      title: validation.data.title,
      description: validation.data.description,
      severity: validation.data.severity as AlertSeverity,
      source: validation.data.source,
      metadata: validation.data.metadata,
      ruleId: validation.data.ruleId
    });

    return NextResponse.json({
      success: true,
      data: alert
    });

  } catch (error: any) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
