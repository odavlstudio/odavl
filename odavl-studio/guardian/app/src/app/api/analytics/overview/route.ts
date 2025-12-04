/**
 * Analytics Overview API
 * Provides high-level analytics data for dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { captureError } from '@/lib/sentry';
import { startOfDay, subDays, format } from 'date-fns';

type RouteParams = {
    params: Promise<Record<string, never>>;
};

/**
 * GET /api/analytics/overview - Get analytics overview
 * Query params: organizationId, days (default: 30)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');
        const days = parseInt(searchParams.get('days') || '30');

        const startDate = startOfDay(subDays(new Date(), days));

        // Build where clause
        const whereClause = {
            ...(organizationId && { organizationId }),
            createdAt: { gte: startDate },
        };

        // Get test runs summary
        const testRuns = await prisma.testRun.groupBy({
            by: ['status'],
            where: whereClause,
            _count: true,
        });

        const totalTests = testRuns.reduce((sum: number, r: any) => sum + r._count, 0);
        const passedTests = testRuns.find((r: any) => r.status === 'passed')?._count || 0;
        const failedTests = testRuns.find((r: any) => r.status === 'failed')?._count || 0;
        const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

        // Get monitors summary
        const monitors = await prisma.monitor.findMany({
            where: organizationId ? { project: { organizationId } } : undefined,
            select: {
                id: true,
                name: true,
                enabled: true,
                _count: {
                    select: { checks: true },
                },
            },
        });

        const activeMonitors = monitors.filter((m: any) => m.enabled === true).length;
        const totalChecks = monitors.reduce((sum: number, m: any) => sum + m._count.checks, 0);

        // Get recent monitor checks
        const recentChecks = await prisma.monitorCheck.findMany({
            where: {
                ...(organizationId && { monitor: { project: { organizationId } } }),
                timestamp: { gte: startDate },
            },
            select: {
                success: true,
            },
        });

        const successfulChecks = recentChecks.filter((c: any) => c.success).length;
        const uptime = recentChecks.length > 0 ? (successfulChecks / recentChecks.length) * 100 : 0;

        // Get alerts summary
        const alerts = await prisma.alert.groupBy({
            by: ['severity'],
            where: {
                ...whereClause,
            },
            _count: true,
        });

        const totalAlerts = alerts.reduce((sum: number, a: any) => sum + a._count, 0);
        const criticalAlerts = alerts.find((a: any) => a.severity === 'critical')?._count || 0;

        // Calculate trends (compare with previous period)
        const previousStartDate = startOfDay(subDays(new Date(), days * 2));
        const previousEndDate = startDate;

        const previousTests = await prisma.testRun.count({
            where: {
                ...(organizationId && { organizationId }),
                createdAt: { gte: previousStartDate, lt: previousEndDate },
            },
        });

        const testTrend = previousTests > 0 ? ((totalTests - previousTests) / previousTests) * 100 : 0;

        return NextResponse.json({
            success: true,
            overview: {
                tests: {
                    total: totalTests,
                    passed: passedTests,
                    failed: failedTests,
                    passRate: Math.round(passRate * 10) / 10,
                    trend: Math.round(testTrend * 10) / 10,
                },
                monitors: {
                    active: activeMonitors,
                    total: monitors.length,
                    totalChecks,
                    uptime: Math.round(uptime * 10) / 10,
                },
                alerts: {
                    total: totalAlerts,
                    critical: criticalAlerts,
                },
                period: {
                    days,
                    startDate: startDate.toISOString(),
                    endDate: new Date().toISOString(),
                },
            },
        });
    } catch (error) {
        logger.error('Failed to fetch analytics overview', { error });
        captureError(error as Error, { tags: { context: 'analytics-overview' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch analytics overview',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}
