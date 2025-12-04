/**
 * Shared Reports API Routes
 * GET /api/v1/reports/shared - Get shared reports
 * POST /api/v1/reports/shared - Share a report
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { sharedReportsService } from "../../../../../../../packages/core/src/services/shared-reports";
import { authOptions } from '@/lib/auth';

const shareReportSchema = z.object({
  reportId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isPublic: z.boolean(),
  expiresInDays: z.number().min(1).max(365).optional(),
  allowedEmails: z.array(z.string().email()).optional(),
  requireAuth: z.boolean(),
  password: z.string().optional(),
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

    const reports = await sharedReportsService.getSharedReports(organizationId);

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching shared reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared reports' },
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
    const validated = shareReportSchema.parse(body);

    const sharedReport = await sharedReportsService.shareReport({
      ...validated,
      sharedBy: session.user.id!,
    });

    return NextResponse.json(sharedReport, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error sharing report:', error);
    return NextResponse.json(
      { error: 'Failed to share report' },
      { status: 500 }
    );
  }
}
