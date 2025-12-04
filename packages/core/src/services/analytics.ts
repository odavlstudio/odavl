/**
 * Analytics Service
 * Provides usage analytics and metrics
 */

import { prisma } from '@/lib/prisma';

export interface AnalyticsMetrics {
  // Time-series data
  apiCalls: {
    total: number;
    byDate: { date: string; count: number }[];
    byEndpoint: { endpoint: string; count: number }[];
  };
  errors: {
    total: number;
    byDate: { date: string; count: number }[];
    bySeverity: { severity: string; count: number }[];
    byType: { type: string; count: number }[];
  };
  projects: {
    total: number;
    active: number;
    archived: number;
  };
  members: {
    total: number;
    byRole: { role: string; count: number }[];
  };
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export class AnalyticsService {
  /**
   * Get organization analytics
   */
  async getOrganizationAnalytics(
    organizationId: string,
    timeRange?: TimeRange
  ): Promise<AnalyticsMetrics> {
    const start = timeRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = timeRange?.end || new Date();

    // API Calls metrics
    const usageRecords = await prisma.usageRecord.findMany({
      where: {
        orgId: organizationId,
        timestamp: {
          gte: start,
          lte: end,
        },
      },
      select: {
        timestamp: true,
        endpoint: true,
      },
    });

    const apiCallsByDate = this.groupByDate(
      usageRecords.map((r) => r.timestamp)
    );

    const apiCallsByEndpoint = this.groupByField(
      usageRecords.map((r) => r.endpoint)
    );

    // Note: Error metrics disabled - ErrorSignature model only in Insight Cloud schema

    // Projects metrics (status field not in schema - simplified)
    const projectsCount = await prisma.project.count({
      where: { orgId: organizationId },
    });

    const projectsMetrics = {
      total: projectsCount,
      active: projectsCount, // Status field not available in schema
      archived: 0,
    };

    // Members metrics (via User.orgId relationship)
    const members = await prisma.user.findMany({
      where: {
        orgId: organizationId,
      },
      select: {
        role: true,
      },
    });

    const membersByRole = this.groupByField(members.map((m) => m.role));

    return {
      apiCalls: {
        total: usageRecords.length,
        byDate: apiCallsByDate as unknown as { date: string; count: number }[],
        byEndpoint: apiCallsByEndpoint as unknown as { endpoint: string; count: number }[],
      },
      errors: {
        total: 0, // Error tracking disabled (ErrorSignature model not in studio-hub schema)
        byDate: [],
        bySeverity: [],
        byType: [],
      },
      projects: projectsMetrics,
      members: {
        total: members.length,
        byRole: membersByRole as unknown as { role: string; count: number }[],
      },
    };
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(
    userId: string,
    timeRange?: TimeRange
  ): Promise<{
    organizations: number;
    projects: number;
    apiCalls: number;
    errorsDetected: number;
  }> {
    const start = timeRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = timeRange?.end || new Date();

    // Get user with orgId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { orgId: true },
    });

    const organizations = user?.orgId ? 1 : 0; // User belongs to 1 org

    // User projects (from their organization)
    const projects = user?.orgId
      ? await prisma.project.count({
          where: { orgId: user.orgId },
        })
      : 0;

    // API calls
    const apiCalls = await prisma.usageRecord.count({
      where: {
        userId,
        timestamp: {
          gte: start,
          lte: end,
        },
      },
    });

    // Errors detected (disabled - ErrorSignature model not in studio-hub schema)
    const errorsDetected = 0;

    return {
      organizations,
      projects,
      apiCalls,
      errorsDetected,
    };
  }

  /**
   * Get project analytics
   */
  async getProjectAnalytics(
    projectId: string,
    timeRange?: TimeRange
  ): Promise<{
    errors: {
      total: number;
      critical: number;
      resolved: number;
      byDate: { date: string; count: number }[];
    };
    autopilotRuns: number;
    guardianTests: number;
    lastActivity?: Date;
  }> {
    const start = timeRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = timeRange?.end || new Date();

    // Errors (disabled - ErrorSignature model not in studio-hub schema)
    const errorsByDate: { date: string; count: number }[] = [];

    // TODO: Add autopilot runs and guardian tests when those tables exist

    return {
      errors: {
        total: 0,
        critical: 0,
        resolved: 0,
        byDate: errorsByDate,
      },
      autopilotRuns: 0, // TODO
      guardianTests: 0, // TODO
      lastActivity: undefined, // Error tracking disabled
    };
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(organizationId: string): Promise<{
    activeUsers: number;
    requestsPerMinute: number;
    avgResponseTime: number;
    errorRate: number;
  }> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Requests in last minute
    const recentRequests = await prisma.usageRecord.count({
      where: {
        orgId: organizationId,
        timestamp: {
          gte: oneMinuteAgo,
        },
      },
    });

    // Active users in last 5 minutes
    const activeUsers = await prisma.usageRecord.findMany({
      where: {
        orgId: organizationId,
        timestamp: {
          gte: fiveMinutesAgo,
        },
      },
      distinct: ['userId'],
      select: {
        userId: true,
      },
    });

    // TODO: Calculate avg response time and error rate from usage records
    // when we add those fields to the schema

    return {
      activeUsers: activeUsers.length,
      requestsPerMinute: recentRequests,
      avgResponseTime: 0, // TODO
      errorRate: 0, // TODO
    };
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(
    organizationId: string,
    format: 'json' | 'csv',
    timeRange?: TimeRange
  ): Promise<string> {
    const metrics = await this.getOrganizationAnalytics(organizationId, timeRange);

    if (format === 'json') {
      return JSON.stringify(metrics, null, 2);
    }

    // CSV format
    const csv: string[] = [];
    csv.push('Metric,Value');
    csv.push(`Total API Calls,${metrics.apiCalls.total}`);
    csv.push(`Total Errors,${metrics.errors.total}`);
    csv.push(`Active Projects,${metrics.projects.active}`);
    csv.push(`Total Members,${metrics.members.total}`);

    csv.push('\nAPI Calls by Date');
    csv.push('Date,Count');
    metrics.apiCalls.byDate.forEach((item) => {
      csv.push(`${item.date},${item.count}`);
    });

    csv.push('\nErrors by Date');
    csv.push('Date,Count');
    metrics.errors.byDate.forEach((item) => {
      csv.push(`${item.date},${item.count}`);
    });

    return csv.join('\n');
  }

  /**
   * Helper: Group items by date
   */
  private groupByDate(dates: Date[]): { date: string; count: number }[] {
    const grouped = new Map<string, number>();

    dates.forEach((date) => {
      const dateStr = date.toISOString().split('T')[0];
      grouped.set(dateStr, (grouped.get(dateStr) || 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Helper: Group items by field
   */
  private groupByField<T extends string>(
    items: T[]
  ): Array<{ [key: string]: string | number; count: number }> {
    const grouped = new Map<string, number>();

    items.forEach((item) => {
      grouped.set(item, (grouped.get(item) || 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([key, count]) => {
        const result: any = { count };
        // Use dynamic key based on context
        if (key.includes('/')) {
          result.endpoint = key;
        } else if (['critical', 'high', 'medium', 'low'].includes(key)) {
          result.severity = key;
        } else if (['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].includes(key)) {
          result.role = key;
        } else {
          result.type = key;
        }
        return result;
      })
      .sort((a, b) => b.count - a.count);
  }
}

export const analyticsService = new AnalyticsService();
