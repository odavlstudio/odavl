import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Helper: Build where clause for user's organization projects
 */
function buildUserOrgProjectWhere(userId: string) {
  return {
    project: {
      organization: {
        users: { some: { id: userId } },
      },
    },
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const whereClause = buildUserOrgProjectWhere(userId);

  // Fetch recent activities from all products
  const [recentIssues, recentRuns, recentTests] = await Promise.all([
    prisma.insightIssue.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        project: true,
      },
    }),
    prisma.autopilotRun.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        project: true,
      },
    }),
    prisma.guardianTest.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        project: true,
      },
    }),
  ]);

  const activities = [
    ...recentIssues.map((issue) => ({
      id: `insight-${issue.id}`,
      type: 'insight' as const,
      message: `New ${issue.severity} issue detected: ${issue.message.substring(0, 50)}...`,
      user: issue.project?.name || 'Unknown',
      timestamp: issue.createdAt.toISOString(),
    })),
    ...recentRuns.map((run) => ({
      id: `autopilot-${run.id}`,
      type: 'autopilot' as const,
      message: `Autopilot run completed for ${run.project?.name || 'Unknown'}`,  // Removed phase reference
      user: run.project?.name || 'Unknown',
      timestamp: run.createdAt.toISOString(),
    })),
    ...recentTests.map((test) => ({
      id: `guardian-${test.id}`,
      type: 'guardian' as const,
      message: `Guardian test ${test.status} for ${test.url}`,
      user: test.project?.name || 'Unknown',
      timestamp: test.createdAt.toISOString(),
    })),
  ];

  // Sort by timestamp and take top 20
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json(activities.slice(0, 20));
}

