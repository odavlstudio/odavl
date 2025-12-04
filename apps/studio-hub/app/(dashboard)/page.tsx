import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/db/rls';
import { BarChart, Lightbulb, Rocket, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { UsageCard } from '@/components/organization/usage-card';

// Disable static generation - requires session context
export const dynamic = 'force-dynamic';

async function getDashboardStats() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  
  const userId = session.user.id;
  const orgId = session.user.orgId || '';
  
  // Get counts for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [insightCount, autopilotCount, guardianCount, projectCount] =
    await Promise.all([
      prisma.insightIssue.count({
        where: {
          project: { orgId },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.autopilotRun.count({
        where: {
          project: { orgId },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.guardianTest.count({
        where: {
          project: { orgId },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.project.count({
        where: { orgId },
      }),
    ]);

  // Get trends (compare to previous 30 days)
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [prevInsightCount, prevAutopilotCount, prevGuardianCount] =
    await Promise.all([
      prisma.insightIssue.count({
        where: {
          project: { orgId },
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
      prisma.autopilotRun.count({
        where: {
          project: { orgId },
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
      prisma.guardianTest.count({
        where: {
          project: { orgId },
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
    ]);

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    insight: {
      count: insightCount,
      trend: calculateTrend(insightCount, prevInsightCount),
    },
    autopilot: {
      count: autopilotCount,
      trend: calculateTrend(autopilotCount, prevAutopilotCount),
    },
    guardian: {
      count: guardianCount,
      trend: calculateTrend(guardianCount, prevGuardianCount),
    },
    projects: projectCount,
  };
}

export default async function DashboardPage() {
  const session = await requireAuth();

  const stats = await getDashboardStats();
  
  if (!stats) {
    return <div>Unable to load dashboard stats</div>;
  }

  const statCards = [
    {
      name: 'Issues Detected',
      value: stats.insight.count.toLocaleString(),
      icon: Lightbulb,
      trend: stats.insight.trend,
      color: 'bg-blue-500',
    },
    {
      name: 'Auto-Fixes Applied',
      value: stats.autopilot.count.toLocaleString(),
      icon: Rocket,
      trend: stats.autopilot.trend,
      color: 'bg-purple-500',
    },
    {
      name: 'Tests Executed',
      value: stats.guardian.count.toLocaleString(),
      icon: ShieldCheck,
      trend: stats.guardian.trend,
      color: 'bg-green-500',
    },
    {
      name: 'Active Projects',
      value: stats.projects.toLocaleString(),
      icon: BarChart,
      trend: 0,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session!.user.name}! 👋
        </h1>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your projects in the last 30 days.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`${stat.color} p-3 rounded-lg flex items-center justify-center`}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              {stat.trend !== 0 && (
                <div
                  className={`flex items-center space-x-1 text-sm font-medium ${
                    stat.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.trend > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{Math.abs(stat.trend).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-600">
                {stat.name}
              </h3>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Usage
        </h2>
        <UsageCard />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a
            href="/dashboard/insight"
            className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
          >
            <Lightbulb className="h-6 w-6 text-blue-600 mr-2" />
            <span className="font-medium text-blue-900">Run Insight Scan</span>
          </a>
          <a
            href="/dashboard/autopilot"
            className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
          >
            <Rocket className="h-6 w-6 text-purple-600 mr-2" />
            <span className="font-medium text-purple-900">
              Start Autopilot
            </span>
          </a>
          <a
            href="/dashboard/guardian"
            className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
          >
            <ShieldCheck className="h-6 w-6 text-green-600 mr-2" />
            <span className="font-medium text-green-900">Run Tests</span>
          </a>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="text-center py-12 text-gray-500">
          <BarChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Activity tracking coming soon...</p>
        </div>
      </div>
    </div>
  );
}

