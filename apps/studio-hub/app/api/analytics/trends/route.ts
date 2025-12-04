import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  withErrorHandler,
  createSuccessResponse,
  ApiErrors,
} from '@/lib/api';

export const GET = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session) {
    return ApiErrors.unauthorized('Authentication required');
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || '30d';

  const daysAgo = range === '7d' ? 7 : range === '90d' ? 90 : range === '1y' ? 365 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  // Generate date array
  const dates: string[] = [];
  for (let i = daysAgo - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  // Fetch issues by date
  const issues = await prisma.insightIssue.groupBy({
    by: ['createdAt'],
    where: {
      project: {
        organization: {
          users: { some: { id: session.user.id } },
        },
      },
      createdAt: { gte: startDate },
    },
    _count: true,
  });

  // Fetch fixes by date
  const fixes = await prisma.autopilotEdit.groupBy({
    by: ['createdAt'],
    where: {
      run: {
        project: {
          organization: {
            users: { some: { id: session.user.id } },
          },
        },
      },
      createdAt: { gte: startDate },
    },
    _count: true,
  });

  // Fetch quality scores by date
  const quality = await prisma.guardianTest.groupBy({
    by: ['createdAt'],
    where: {
      project: {
        organization: {
          users: { some: { id: session.user.id } },
        },
      },
      createdAt: { gte: startDate },
    },
    _avg: {
      score: true,  // Use score instead of accessibilityScore
    },
  });

  // Map data to dates
  const data = dates.map((date) => {
    const issuesCount = issues.filter(
      (i) => i.createdAt.toISOString().split('T')[0] === date
    ).reduce((sum, i) => sum + i._count, 0);

    const fixesCount = fixes.filter(
      (f) => f.createdAt.toISOString().split('T')[0] === date
    ).reduce((sum, f) => sum + f._count, 0);

    const qualityScores = quality.filter(
      (q) => q.createdAt.toISOString().split('T')[0] === date
    );
    const avgQuality = qualityScores.length > 0
      ? qualityScores.reduce((sum, q) => sum + (q._avg?.score ?? 0), 0) / qualityScores.length  // Optional chaining
      : 0;

    return {
      date,
      issues: issuesCount,
      fixes: fixesCount,
      quality: Math.round(avgQuality),
    };
  });

  return createSuccessResponse({ trends: data, range });
}, 'GET /api/analytics/trends');

