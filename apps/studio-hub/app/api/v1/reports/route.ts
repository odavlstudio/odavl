/**
 * Reports API Routes
 * GET /api/v1/reports - Get generated reports
 * POST /api/v1/reports/generate - Generate new report
 * GET /api/v1/reports/stats - Get report statistics
 * GET /api/v1/reports/templates - Get templates
 * POST /api/v1/reports/templates - Create template
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { sharedReportsService, ReportType, ReportFormat } from '@odavl-studio/core/services/shared-reports';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const generateReportSchema = z.object({
  templateId: z.string().optional(),
  name: z.string(),
  type: z.enum(['QUALITY', 'PERFORMANCE', 'SECURITY', 'COMPREHENSIVE', 'AUTOPILOT', 'GUARDIAN', 'CUSTOM']),
  format: z.enum(['PDF', 'HTML', 'JSON', 'CSV']),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
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
    const type = searchParams.get('type') as ReportType | undefined;
    const limit = searchParams.get('limit');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const reports = await sharedReportsService.getGeneratedReports(
      organizationId,
      {
        type,
        limit: limit ? parseInt(limit) : undefined,
      }
    );

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
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
    const validated = generateReportSchema.parse(body);

    const report = await sharedReportsService.generateReport({
      ...validated,
      dateRange: {
        start: new Date(validated.dateRange.start),
        end: new Date(validated.dateRange.end),
      },
      generatedBy: session.user.id!,
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
