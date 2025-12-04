/**
 * GDPR Data Export API
 *
 * Provides users with complete data export (GDPR Article 15 - Right to Access)
 * Exports all personal data in machine-readable format (JSON/CSV)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createAuditLog, AuditAction } from '@/lib/security/audit-logger';
import { z } from 'zod';
import { withErrorHandler, ApiErrors, validateRequestBody } from '@/lib/api';
import { fetchUserDataForExport, formatDataAsCSV } from '@/lib/gdpr/data-fetcher';

const exportSchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  includeDeleted: z.boolean().default(false),
});

/**
 * POST /api/gdpr/export
 *
 * Export all user data in compliance with GDPR Article 15
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return ApiErrors.unauthorized('Authentication required');
  }

  const validated = await validateRequestBody(req, exportSchema);

  // Check if validation returned an error response
  if (validated instanceof NextResponse) {
    return validated;
  }

  const { format, includeDeleted } = validated.data;

  // Fetch all user data
  const exportData = await fetchUserDataForExport(session.user.id, includeDeleted);

  if (!exportData) {
    return ApiErrors.notFound('User data not found');
  }

  // Create audit log
  await createAuditLog({
    action: AuditAction.DATA_EXPORTED,
    userId: session.user.id,
    metadata: {
      format,
      includeDeleted,
      dataSize: JSON.stringify(exportData).length,
    },
  });

  logger.info('GDPR data exported', {
    userId: session.user.id,
    format,
    includeDeleted,
  });

  // Return data in requested format
  if (format === 'json') {
    return NextResponse.json(exportData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="odavl-data-export-${session.user.id}-${Date.now()}.json"`,
      },
    });
  }

  // CSV format
  const csv = formatDataAsCSV(exportData);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="odavl-data-export-${session.user.id}-${Date.now()}.csv"`,
    },
  });
}, 'POST /api/gdpr/export');
