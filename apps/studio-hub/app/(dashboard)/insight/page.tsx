import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { IssuesTable } from '@/components/insight/issues-table';
import { IssuesTrend } from '@/components/insight/issues-trend';
import { IssueFilters } from '@/components/insight/issue-filters';
import { prisma } from '@/lib/prisma';
import { Skeleton } from '@/components/ui/skeleton';

// Disable static generation - requires session context
export const dynamic = 'force-dynamic';

export default async function InsightPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string; detector?: string; project?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;

  // Build filter query
  const where: Record<string, unknown> = {
    project: {
      organization: {
        users: {
          some: { id: session!.user.id },
        },
      },
    },
  };

  if (params.severity) {
    where.severity = params.severity;
  }

  if (params.detector) {
    where.detector = params.detector;
  }

  if (params.project) {
    where.projectId = params.project;
  }

  const [issues, stats, projects] = await Promise.all([
    prisma.insightIssue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.insightIssue.groupBy({
      by: ['severity'],
      where: {
        project: {
          organization: {
            users: {
              some: { id: session!.user.id },
            },
          },
        },
      },
      _count: true,
    }),
    prisma.project.findMany({
      where: {
        organization: {
          users: {
            some: { id: session!.user.id },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
  ]);

  const totalIssues = stats.reduce((sum, s) => sum + s._count, 0);
  const criticalCount = stats.find((s) => s.severity === 'CRITICAL')?._count || 0;
  const highCount = stats.find((s) => s.severity === 'HIGH')?._count || 0;
  const mediumCount = stats.find((s) => s.severity === 'MEDIUM')?._count || 0;
  const lowCount = stats.find((s) => s.severity === 'LOW')?._count || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insight Analysis</h1>
        <p className="text-muted-foreground mt-2">
          ML-powered error detection across {totalIssues.toLocaleString()} findings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Critical</p>
              <p className="text-3xl font-bold mt-2">{criticalCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">High</p>
              <p className="text-3xl font-bold mt-2">{highCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Medium</p>
              <p className="text-3xl font-bold mt-2">{mediumCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Low</p>
              <p className="text-3xl font-bold mt-2">{lowCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
        <IssuesTrend />
      </Suspense>

      {/* Filters */}
      <IssueFilters projects={projects} />

      {/* Issues Table */}
      <div className="bg-card rounded-lg border">
        <IssuesTable initialIssues={issues as unknown as React.ComponentProps<typeof IssuesTable>['initialIssues']} />
      </div>
    </div>
  );
}

