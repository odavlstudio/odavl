/**
 * Report Statistics API Route
 * GET /api/v1/reports/stats - Get report statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { sharedReportsService } from "../../../../../../../packages/core/src/services/shared-reports";
import { authOptions } from '@/lib/auth';

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

    const stats = await sharedReportsService.getStats(organizationId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching report stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report statistics' },
      { status: 500 }
    );
  }
}
