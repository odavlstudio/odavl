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

  const runs = await prisma.autopilotRun.findMany({
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
      status: true,
    },
  });

  // Group by date and status
  const statsMap = new Map<string, { success: number; failed: number }>();

  // Initialize all dates with zero counts
  for (let i = 0; i <= 30; i++) {
    const date = format(subDays(endDate, 30 - i), 'MMM dd');
    statsMap.set(date, { success: 0, failed: 0 });
  }

  // Aggregate runs by date and status
  runs.forEach((run) => {
    const date = format(run.createdAt, 'MMM dd');
    const counts = statsMap.get(date);
    if (counts) {
      if (run.status === 'COMPLETED') {
        counts.success++;
      } else if (run.status === 'FAILED') {
        counts.failed++;
      }
    }
  });

  // Convert to array for chart
  const statsData = Array.from(statsMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  return createSuccessResponse({ stats: statsData, count: statsData.length });
}, 'GET /api/autopilot/stats');

