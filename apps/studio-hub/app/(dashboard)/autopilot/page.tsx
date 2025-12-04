import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RunsTable } from '@/components/autopilot/runs-table';
import { RunStats } from '@/components/autopilot/run-stats';
import { RunFilters } from '@/components/autopilot/run-filters';
import { prisma } from '@/lib/prisma';
import { Skeleton } from '@/components/ui/skeleton';

// Disable static generation - requires session context
export const dynamic = 'force-dynamic';

export default async function AutopilotPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; project?: string }>;
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

  if (params.status) {
    where.status = params.status;
  }

  if (params.project) {
    where.projectId = params.project;
  }

  const [runs, stats, projects] = await Promise.all([
    prisma.autopilotRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        edits: true,
      },
    }),
    prisma.autopilotRun.groupBy({
      by: ['status'],
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

  const totalRuns = stats.reduce((sum, s) => sum + s._count, 0);
  const successCount = stats.find((s) => s.status === 'COMPLETED')?._count || 0;
  const failedCount = stats.find((s) => s.status === 'FAILED')?._count || 0;
  const runningCount = stats.find((s) => s.status === 'RUNNING')?._count || 0;

  const totalEdits = runs.reduce((sum, run) => sum + run.edits.length, 0);
  const successRate = totalRuns > 0 ? Math.round((successCount / totalRuns) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Autopilot Runs</h1>
        <p className="text-muted-foreground mt-2">
          Self-healing code infrastructure with O-D-A-V-L cycle automation
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Runs</p>
              <p className="text-3xl font-bold mt-2">{totalRuns}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <p className="text-3xl font-bold mt-2">{successRate}%</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Edits</p>
              <p className="text-3xl font-bold mt-2">{totalEdits}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Running</p>
              <p className="text-3xl font-bold mt-2">{runningCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-orange-600 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Run Stats Timeline */}
      <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
        <RunStats />
      </Suspense>

      {/* Filters */}
      <RunFilters projects={projects} />

      {/* Runs Table */}
      <div className="bg-card rounded-lg border">
        <RunsTable initialRuns={runs as unknown as React.ComponentProps<typeof RunsTable>['initialRuns']} />
      </div>
    </div>
  );
}

