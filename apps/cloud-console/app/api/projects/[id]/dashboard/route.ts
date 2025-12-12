/**
 * Project Dashboard API
 * Returns unified overview of Insight, Guardian, and Autopilot
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: {
      errorSignatures: {
        where: { resolved: false },
        take: 1,
        orderBy: { lastSeen: 'desc' },
      },
      autopilotRuns: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const dashboard = {
    projectId: project.id,
    projectName: project.name,
    lastInsightScan: project.errorSignatures[0] ? {
      date: project.errorSignatures[0].lastSeen,
      issuesFound: await prisma.errorSignature.count({
        where: { projectId: resolvedParams.id, resolved: false },
      }),
    } : undefined,
    lastGuardianRun: undefined, // TODO: Add Guardian integration
    lastAutopilotJob: project.autopilotRuns[0] ? {
      date: project.autopilotRuns[0].createdAt,
      filesChanged: project.autopilotRuns[0].filesModified,
    } : undefined,
    usageSummary: {
      testRuns: 0, // TODO: Calculate from usage events
      analyses: await prisma.errorSignature.count({ where: { projectId: resolvedParams.id } }),
    },
    healthScore: calculateHealthScore(project),
  };

  return NextResponse.json(dashboard);
}

function calculateHealthScore(project: any): number {
  // Simple health scoring (TODO: enhance with more factors)
  const baseScore = 100;
  const errorPenalty = Math.min(50, project.errorSignatures.length * 2);
  return Math.max(0, baseScore - errorPenalty);
}
