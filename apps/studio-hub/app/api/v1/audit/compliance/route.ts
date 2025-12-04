/**
 * Compliance Report API Route
 * GET /api/v1/audit/compliance - Generate compliance report
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auditLogsService } from '@odavl-studio/core/services/audit-logs';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const organizationId = searchParams.get('organizationId') || undefined;

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'Start date and end date required' },
        { status: 400 }
      );
    }

    const report = await auditLogsService.generateComplianceReport({
      startDate: new Date(startDateStr),
      endDate: new Date(endDateStr),
      organizationId,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating compliance report:', error);
    return NextResponse.json(
      { error: 'Failed to generate compliance report' },
      { status: 500 }
    );
  }
}
