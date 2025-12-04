import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendCharts } from '@/components/analytics/trend-charts';
import { MetricsComparison } from '@/components/analytics/metrics-comparison';
import { ActivityFeed } from '@/components/analytics/activity-feed';
import { ExportReports } from '@/components/analytics/export-reports';
import { BarChart, Bug, CheckCircle, Clock } from 'lucide-react';

// Disable static generation - requires session context
export const dynamic = 'force-dynamic';

/**
 * Helper: Build where clause for user's organization projects
 */
function buildOrgProjectWhere(userId: string, dateRange?: { gte?: Date; lt?: Date }) {
  return {
    project: {
      organization: {
        users: { some: { id: userId } },
      },
    },
    ...(dateRange && { createdAt: dateRange }),
  };
}

/**
 * Helper: Build where clause for user's organization (no date)
 */
function buildOrgWhere(userId: string) {
  return {
    organization: {
      users: { some: { id: userId } },
    },
  };
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const range = params.range || '30d';

  const daysAgo = range === '7d' ? 7 : range === '90d' ? 90 : range === '1y' ? 365 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  const userId = session!.user.id;

  // Calculate KPIs
  const [totalIssues, autoFixes, avgQuality, projects] = await Promise.all([
    prisma.insightIssue.count({
      where: buildOrgProjectWhere(userId, { gte: startDate }),
    }),
    prisma.autopilotEdit.count({
      where: {
        run: buildOrgProjectWhere(userId, { gte: startDate }),
      },
    }),
    prisma.guardianTest.aggregate({
      where: buildOrgProjectWhere(userId, { gte: startDate }),
      _avg: {
        score: true,
      },
    }),
    prisma.project.findMany({
      where: buildOrgWhere(userId),
      select: { id: true, name: true },
    }),
  ]);

  const qualityScore = Math.round(avgQuality._avg?.score ?? 0);

  // Calculate previous period for comparison
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - daysAgo);

  const [prevIssues, prevFixes] = await Promise.all([
    prisma.insightIssue.count({
      where: buildOrgProjectWhere(userId, { gte: prevStartDate, lt: startDate }),
    }),
    prisma.autopilotEdit.count({
      where: {
        run: buildOrgProjectWhere(userId, { gte: prevStartDate, lt: startDate }),
      },
    }),
  ]);

  const issuesTrend = prevIssues > 0 ? ((totalIssues - prevIssues) / prevIssues * 100).toFixed(1) : '0';
  const fixesTrend = prevFixes > 0 ? ((autoFixes - prevFixes) / prevFixes * 100).toFixed(1) : '0';

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights across all products</p>
        </div>
        <div className="flex gap-4">
          <select
            className="px-4 py-2 border rounded-lg"
            defaultValue={range}
            onChange={(e) => {
              window.location.href = `/analytics?range=${e.target.value}`;
            }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <ExportReports range={range} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Issues Detected</CardTitle>
            <Bug className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalIssues.toLocaleString()}</div>
            <p className={`text-sm ${parseFloat(issuesTrend) < 0 ? 'text-green-600' : 'text-red-600'}`}>
              {issuesTrend}% vs previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Auto-Fixes Applied</CardTitle>
            <CheckCircle className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{autoFixes.toLocaleString()}</div>
            <p className={`text-sm ${parseFloat(fixesTrend) > 0 ? 'text-green-600' : 'text-gray-600'}`}>
              {parseFloat(fixesTrend) > 0 ? '+' : ''}{fixesTrend}% vs previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <BarChart className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{qualityScore}/100</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${qualityScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Clock className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projects.length}</div>
            <p className="text-sm text-gray-600">Across your organization</p>
          </CardContent>
        </Card>
      </div>

      <TrendCharts range={range} />

      <div className="grid grid-cols-2 gap-6">
        <MetricsComparison projects={projects} range={range} />
        <ActivityFeed />
      </div>
    </div>
  );
}

