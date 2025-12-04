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

  const tests = await prisma.guardianTest.findMany({
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
      status: 'PASSED', // Only include completed tests
    },
    select: {
      createdAt: true,
      lcp: true,
      fid: true,
      cls: true,
    },
  });

  // Group by date and calculate averages
  const vitalsMap = new Map<string, { lcp: number[]; fid: number[]; cls: number[] }>();

  // Initialize all dates with empty arrays
  for (let i = 0; i <= 30; i++) {
    const date = format(subDays(endDate, 30 - i), 'MMM dd');
    vitalsMap.set(date, { lcp: [], fid: [], cls: [] });
  }

  // Aggregate vitals by date
  tests.forEach((test) => {
    const date = format(test.createdAt, 'MMM dd');
    const vitals = vitalsMap.get(date);
    if (vitals) {
      if (test.lcp !== null) vitals.lcp.push(test.lcp);
      if (test.fid !== null) vitals.fid.push(test.fid);
      if (test.cls !== null) vitals.cls.push(test.cls);
    }
  });

  // Calculate averages and convert to array
  const vitalsData = Array.from(vitalsMap.entries()).map(([date, vitals]) => ({
    date,
    lcp: vitals.lcp.length > 0
      ? Math.round(vitals.lcp.reduce((a, b) => a + b, 0) / vitals.lcp.length)
      : 0,
    fid: vitals.fid.length > 0
      ? Math.round(vitals.fid.reduce((a, b) => a + b, 0) / vitals.fid.length)
      : 0,
    cls: vitals.cls.length > 0
      ? Math.round((vitals.cls.reduce((a, b) => a + b, 0) / vitals.cls.length) * 100) // Scale CLS for chart
      : 0,
  }));

  return createSuccessResponse({ vitals: vitalsData, count: vitalsData.length });
}, 'GET /api/guardian/web-vitals');

