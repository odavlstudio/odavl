import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subDays, format } from 'date-fns';
import {
  withErrorHandler,
  createSuccessResponse,
  ApiErrors,
} from '@/lib/api';

export const GET = withErrorHandler(async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    return ApiErrors.unauthorized('Authentication required');
  }

  // Get last 30 days of data
  const endDate = new Date();
  const startDate = subDays(endDate, 30);

  const issues = await prisma.insightIssue.findMany({
    where: {
      project: {
        organization: {
          users: {
            some: { id: session.user.id },
          },
        },
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
      severity: true,
    },
  });

  // Group by date and severity
  const trendMap = new Map<string, { critical: number; high: number; medium: number; low: number }>();

  // Initialize all dates with zero counts
  for (let i = 0; i <= 30; i++) {
    const date = format(subDays(endDate, 30 - i), 'MMM dd');
    trendMap.set(date, { critical: 0, high: 0, medium: 0, low: 0 });
  }

  // Aggregate issues by date and severity
  issues.forEach((issue) => {
    const date = format(issue.createdAt, 'MMM dd');
    const counts = trendMap.get(date);
    if (counts) {
      const severity = issue.severity.toLowerCase() as 'critical' | 'high' | 'medium' | 'low';
      counts[severity]++;
    }
  });

  // Convert to array for chart
  const trendData = Array.from(trendMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  return createSuccessResponse({ trends: trendData, count: trendData.length });
}, 'GET /api/insight/trend');

