/**
 * Audit Export API Route
 * GET /api/v1/audit/export - Export audit logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auditLogsService, AuditCategory, AuditSeverity, AuditAction } from '@odavl-studio/core/services/audit-logs';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Parse filters (same as main audit logs)
    const filters = {
      organizationId: searchParams.get('organizationId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      actions: searchParams.get('actions')?.split(',') as AuditAction[] | undefined,
      categories: searchParams.get('categories')?.split(',') as AuditCategory[] | undefined,
      severities: searchParams.get('severities')?.split(',') as AuditSeverity[] | undefined,
    };

    let content: string;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      content = await auditLogsService.exportLogsCSV(filters);
      contentType = 'text/csv';
      filename = `audit-logs-${Date.now()}.csv`;
    } else {
      content = await auditLogsService.exportLogs(filters);
      contentType = 'application/json';
      filename = `audit-logs-${Date.now()}.json`;
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}
