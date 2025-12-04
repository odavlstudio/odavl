/**
 * Comparison Analytics API
 * Compares metrics between time periods
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { captureError } from '@/lib/sentry';
import { startOfDay, subDays } from 'date-fns';

/**
 * GET /api/analytics/comparison - Compare metrics between periods
 * Query params: organizationId, currentDays, previousDays
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');
        const currentDays = parseInt(searchParams.get('currentDays') || '7');
        const previousDays = parseInt(searchParams.get('previousDays') || '7');

        const currentStart = startOfDay(subDays(new Date(), currentDays));
        const previousStart = startOfDay(subDays(new Date(), currentDays + previousDays));
        const previousEnd = currentStart;

        // Current period
        const currentTests = await prisma.testRun.groupBy({
            by: ['status'],
            where: {
                ...(organizationId && { organizationId }),
                createdAt: { gte: currentStart },
            },
            _count: true,
        });

        const currentTotal = currentTests.reduce((sum: number, r: any) => sum + r._count, 0);
        const currentPassed = currentTests.find((r: any) => r.status === 'passed')?._count || 0;
        const currentFailed = currentTests.find((r: any) => r.status === 'failed')?._count || 0;
        const currentPassRate = currentTotal > 0 ? (currentPassed / currentTotal) * 100 : 0;

        // Previous period
        const previousTests = await prisma.testRun.groupBy({
            by: ['status'],
            where: {
                ...(organizationId && { organizationId }),
                createdAt: { gte: previousStart, lt: previousEnd },
            },
            _count: true,
        });

        const previousTotal = previousTests.reduce((sum: number, r: any) => sum + r._count, 0);
        const previousPassed = previousTests.find((r: any) => r.status === 'passed')?._count || 0;
        const previousFailed = previousTests.find((r: any) => r.status === 'failed')?._count || 0;
        const previousPassRate = previousTotal > 0 ? (previousPassed / previousTotal) * 100 : 0;

        // Calculate changes
        const totalChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
        const passRateChange = previousPassRate > 0 ? currentPassRate - previousPassRate : 0;

        // Monitor checks comparison
        const currentChecks = await prisma.monitorCheck.count({
            where: {
                ...(organizationId && { monitor: { project: { organizationId } } }),
                timestamp: { gte: currentStart },
            },
        });

        const currentSuccessChecks = await prisma.monitorCheck.count({
            where: {
                ...(organizationId && { monitor: { project: { organizationId } } }),
                timestamp: { gte: currentStart },
                success: true,
            },
        });

        const previousChecks = await prisma.monitorCheck.count({
            where: {
                ...(organizationId && { monitor: { project: { organizationId } } }),
                timestamp: { gte: previousStart, lt: previousEnd },
            },
        });

        const previousSuccessChecks = await prisma.monitorCheck.count({
            where: {
                ...(organizationId && { monitor: { project: { organizationId } } }),
                timestamp: { gte: previousStart, lt: previousEnd },
                success: true,
            },
        });

        const currentUptime = currentChecks > 0 ? (currentSuccessChecks / currentChecks) * 100 : 0;
        const previousUptime = previousChecks > 0 ? (previousSuccessChecks / previousChecks) * 100 : 0;
        const uptimeChange = previousUptime > 0 ? currentUptime - previousUptime : 0;

        // Alerts comparison
        const currentAlerts = await prisma.alert.count({
            where: {
                ...(organizationId && { organizationId }),
                createdAt: { gte: currentStart },
            },
        });

        const previousAlerts = await prisma.alert.count({
            where: {
                ...(organizationId && { organizationId }),
                createdAt: { gte: previousStart, lt: previousEnd },
            },
        });

        const alertsChange = previousAlerts > 0 ? ((currentAlerts - previousAlerts) / previousAlerts) * 100 : 0;

        return NextResponse.json({
            success: true,
            comparison: {
                tests: {
                    current: {
                        total: currentTotal,
                        passed: currentPassed,
                        failed: currentFailed,
                        passRate: Math.round(currentPassRate * 10) / 10,
                    },
                    previous: {
                        total: previousTotal,
                        passed: previousPassed,
                        failed: previousFailed,
                        passRate: Math.round(previousPassRate * 10) / 10,
                    },
                    change: {
                        total: Math.round(totalChange * 10) / 10,
                        passRate: Math.round(passRateChange * 10) / 10,
                    },
                },
                monitors: {
                    current: {
                        total: currentChecks,
                        successful: currentSuccessChecks,
                        uptime: Math.round(currentUptime * 10) / 10,
                    },
                    previous: {
                        total: previousChecks,
                        successful: previousSuccessChecks,
                        uptime: Math.round(previousUptime * 10) / 10,
                    },
                    change: {
                        uptime: Math.round(uptimeChange * 10) / 10,
                    },
                },
                alerts: {
                    current: currentAlerts,
                    previous: previousAlerts,
                    change: Math.round(alertsChange * 10) / 10,
                },
            },
            periods: {
                current: {
                    days: currentDays,
                    start: currentStart.toISOString(),
                    end: new Date().toISOString(),
                },
                previous: {
                    days: previousDays,
                    start: previousStart.toISOString(),
                    end: previousEnd.toISOString(),
                },
            },
        });
    } catch (error) {
        logger.error('Failed to fetch comparison data', { error });
        captureError(error as Error, { tags: { context: 'analytics-comparison' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch comparison data',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}
