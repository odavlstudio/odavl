/**
 * Audit Logs API Routes
 * GET /api/v1/audit - Get audit logs
 * GET /api/v1/audit/stats - Get statistics
 * GET /api/v1/audit/compliance - Generate compliance report
 * GET /api/v1/audit/export - Export logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auditLogsService, AuditCategory, AuditSeverity, AuditAction } from "../../../../../../packages/core/src/services/audit-logs";
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse filters
    const filters = {
      organizationId: searchParams.get('organizationId') || undefined,
      userId: searchParams.get('userId') || undefined,
      userEmail: searchParams.get('userEmail') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      resourceType: searchParams.get('resourceType') || undefined,
      resourceId: searchParams.get('resourceId') || undefined,
      searchQuery: searchParams.get('search') || undefined,
      success: searchParams.get('success') === 'true' ? true : searchParams.get('success') === 'false' ? false : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,

      // Date range
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,

      // Arrays
      actions: searchParams.get('actions')?.split(',') as AuditAction[] | undefined,
      categories: searchParams.get('categories')?.split(',') as AuditCategory[] | undefined,
      severities: searchParams.get('severities')?.split(',') as AuditSeverity[] | undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
    };

    const logs = await auditLogsService.getLogs(filters);

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
