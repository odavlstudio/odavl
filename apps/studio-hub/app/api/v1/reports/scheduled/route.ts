/**
 * Scheduled Reports API Routes
 * GET /api/v1/reports/scheduled - Get scheduled reports
 * POST /api/v1/reports/scheduled - Create scheduled report
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { sharedReportsService, ReportSchedule, ReportFormat } from '@odavl-studio/core/services/shared-reports';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const scheduleReportSchema = z.object({
  templateId: z.string(),
  name: z.string(),
  schedule: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'MANUAL']),
  scheduledTime: z.string().optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  timezone: z.string(),
  recipients: z.array(z.string().email()),
  subject: z.string().optional(),
  message: z.string().optional(),
  format: z.enum(['PDF', 'HTML', 'JSON', 'CSV']),
  enabled: z.boolean(),
  organizationId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const reports = await sharedReportsService.getScheduledReports(organizationId);

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = scheduleReportSchema.parse(body);

    const report = await sharedReportsService.scheduleReport({
      ...validated,
      createdBy: session.user.id!,
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error scheduling report:', error);
    return NextResponse.json(
      { error: 'Failed to schedule report' },
      { status: 500 }
    );
  }
}
