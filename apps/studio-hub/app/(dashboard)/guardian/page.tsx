import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TestResultsTable } from '@/components/guardian/test-results-table';
import { WebVitalsChart } from '@/components/guardian/web-vitals-chart';
import { TestFilters } from '@/components/guardian/test-filters';
import { prisma } from '@/lib/prisma';
import { Skeleton } from '@/components/ui/skeleton';

// Disable static generation - requires session context
export const dynamic = 'force-dynamic';

export default async function GuardianPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; severity?: string; project?: string }>;
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

  if (params.category) {
    where.category = params.category;
  }

  if (params.severity) {
    where.severity = params.severity;
  }

  if (params.project) {
    where.projectId = params.project;
  }

  const [tests, stats, projects] = await Promise.all([
    prisma.guardianTest.findMany({
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
      },
    }),
    prisma.guardianTest.groupBy({
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

  const totalTests = stats.reduce((sum, s) => sum + s._count, 0);
  const passedCount = stats.find((s) => s.status === 'PASSED')?._count || 0;
  const failedCount = stats.find((s) => s.status === 'FAILED')?._count || 0;
  const warningCount = 0; // TestStatus enum has no WARNING value

  const passRate = totalTests > 0 ? Math.round((passedCount / totalTests) * 100) : 0;

  // Calculate average scores from JsonValue fields
  const avgAccessibility = Math.round(
    tests.reduce((sum, t) => {
      const score = typeof t.accessibility === 'object' && t.accessibility && 'score' in t.accessibility 
        ? Number(t.accessibility.score) || 0 
        : 0;
      return sum + score;
    }, 0) / tests.length || 0
  );
  const avgPerformance = Math.round(
    tests.reduce((sum, t) => {
      const score = typeof t.performance === 'object' && t.performance && 'score' in t.performance 
        ? Number(t.performance.score) || 0 
        : 0;
      return sum + score;
    }, 0) / tests.length || 0
  );
  const avgSecurity = Math.round(
    tests.reduce((sum, t) => {
      const score = typeof t.security === 'object' && t.security && 'score' in t.security 
        ? Number(t.security.score) || 0 
        : 0;
      return sum + score;
    }, 0) / tests.length || 0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Guardian Tests</h1>
        <p className="text-muted-foreground mt-2">
          Pre-deploy testing with security, performance, and accessibility validation
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
              <p className="text-3xl font-bold mt-2">{passRate}%</p>
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
              <p className="text-sm font-medium text-muted-foreground">Accessibility</p>
              <p className="text-3xl font-bold mt-2">{avgAccessibility}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Performance</p>
              <p className="text-3xl font-bold mt-2">{avgPerformance}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Security</p>
              <p className="text-3xl font-bold mt-2">{avgSecurity}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Web Vitals Chart */}
      <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
        <WebVitalsChart />
      </Suspense>

      {/* Filters */}
      <TestFilters projects={projects} />

      {/* Test Results Table */}
      <div className="bg-card rounded-lg border">
        <TestResultsTable initialTests={tests as unknown as React.ComponentProps<typeof TestResultsTable>['initialTests']} />
      </div>
    </div>
  );
}

