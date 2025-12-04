import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  withErrorHandler,
  ApiErrors,
  createSuccessResponse,
} from '@/lib/api';

function buildUserOrgFilter(userId: string) {
  return {
    project: {
      organization: {
        users: { some: { id: userId } },
      },
    },
  };
}

export const GET = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session) {
    return ApiErrors.unauthorized('Authentication required');
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || '30d';
  const format = searchParams.get('format') || 'csv';

  const daysAgo = range === '7d' ? 7 : range === '90d' ? 90 : range === '1y' ? 365 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  const userFilter = buildUserOrgFilter(session.user.id);
  const dateFilter = { createdAt: { gte: startDate } };

  const [issues, runs, tests] = await Promise.all([
    prisma.insightIssue.findMany({
      where: { ...userFilter, ...dateFilter },
      include: { project: true },
    }),
    prisma.autopilotRun.findMany({
      where: { ...userFilter, ...dateFilter },
      include: { project: true },
    }),
    prisma.guardianTest.findMany({
      where: { ...userFilter, ...dateFilter },
      include: { project: true },
    }),
  ]);

  if (format === 'csv') {
    const csv = [
      'Type,Project,Date,Details',
      ...issues.map((i) =>
        `Issue,${i.project.name},${i.createdAt.toISOString()},${i.severity}: ${i.message.replace(/,/g, ';')}`
      ),
      ...runs.map((r) =>
        `Autopilot,${r.project.name},${r.createdAt.toISOString()},Status: ${r.status}`
      ),
      ...tests.map((t) =>
        `Guardian,${t.project.name},${t.createdAt.toISOString()},Status: ${t.status} (${t.url})`
      ),
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="odavl-analytics-${range}.csv"`,
      },
    });
  }

  return ApiErrors.internal('PDF export not yet implemented');
}, 'GET /api/analytics/export');

