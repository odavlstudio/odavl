/**
 * Time Series Analytics API
 * Provides time-series data for charts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { captureError } from '@/lib/sentry';
import { startOfDay, subDays, format, eachDayOfInterval } from 'date-fns';
import { getRedisClient } from '@/lib/cache';

// Cache TTL for timeseries (10 minutes - slower changing data)
const CACHE_TTL = 600;

async function cacheTimeseries(key: string, fetcher: () => Promise<any>): Promise<any> {
    const redis = getRedisClient();

    try {
        const cached = await redis.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (err) {
        logger.warn('Redis read failed, falling back to DB', { error: err });
    }

    const data = await fetcher();

    try {
        await redis.setex(key, CACHE_TTL, JSON.stringify(data));
    } catch (err) {
        logger.warn('Redis write failed', { error: err });
    }

    return data;
}

/**
 * GET /api/analytics/timeseries - Get time-series data
 * Query params: organizationId, days (default: 30), metric (tests|monitors|alerts)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');
        const days = parseInt(searchParams.get('days') || '30');
        const metric = searchParams.get('metric') || 'tests';

        // Cache key based on filters
        const cacheKey = `timeseries:${organizationId || 'all'}:${metric}:${days}`;

        const result = await cacheTimeseries(cacheKey, async () => {
            const startDate = startOfDay(subDays(new Date(), days));
            const endDate = new Date();

            // Generate all days in range
            const allDays = eachDayOfInterval({ start: startDate, end: endDate });
            const dayLabels = allDays.map((d) => format(d, 'yyyy-MM-dd'));

            let data: any[] = [];

            if (metric === 'tests') {
                // Get test runs by day
                const testRuns = await prisma.testRun.findMany({
                    where: {
                        ...(organizationId && {
                            project: { organizationId }
                        }),
                        createdAt: { gte: startDate },
                    },
                    select: {
                        createdAt: true,
                        status: true,
                    },
                });

                // Group by day and status
                const byDay: Record<string, { passed: number; failed: number; total: number }> = {};

                for (const day of dayLabels) {
                    byDay[day] = { passed: 0, failed: 0, total: 0 };
                }

                for (const run of testRuns) {
                    const day = format(startOfDay(new Date(run.createdAt)), 'yyyy-MM-dd');
                    if (byDay[day]) {
                        byDay[day].total++;
                        if (run.status === 'passed') {
                            byDay[day].passed++;
                        } else if (run.status === 'failed') {
                            byDay[day].failed++;
                        }
                    }
                }

                data = dayLabels.map((day) => ({
                    date: day,
                    passed: byDay[day].passed,
                    failed: byDay[day].failed,
                    total: byDay[day].total,
                    passRate:
                        byDay[day].total > 0
                            ? Math.round((byDay[day].passed / byDay[day].total) * 1000) / 10
                            : 0,
                }));
            } else if (metric === 'monitors') {
                // Get monitor checks by day
                const checks = await prisma.monitorCheck.findMany({
                    where: {
                        ...(organizationId && { monitor: { project: { organizationId } } }),
                        checkedAt: { gte: startDate },
                    },
                    select: {
                        checkedAt: true,
                        status: true,
                    },
                });

                const byDay: Record<string, { success: number; failed: number; total: number }> = {};

                for (const day of dayLabels) {
                    byDay[day] = { success: 0, failed: 0, total: 0 };
                }

                for (const check of checks) {
                    const day = format(startOfDay(new Date(check.checkedAt)), 'yyyy-MM-dd');
                    if (byDay[day]) {
                        byDay[day].total++;
                        if (check.status === 'up') {
                            byDay[day].success++;
                        } else {
                            byDay[day].failed++;
                        }
                    }
                }

                data = dayLabels.map((day) => ({
                    date: day,
                    success: byDay[day].success,
                    failed: byDay[day].failed,
                    total: byDay[day].total,
                    uptime:
                        byDay[day].total > 0
                            ? Math.round((byDay[day].success / byDay[day].total) * 1000) / 10
                            : 0,
                }));
            } else if (metric === 'alerts') {
                // Get alerts by day
                const alerts = await prisma.alert.findMany({
                    where: {
                        ...(organizationId && {
                            project: { organizationId }
                        }),
                        createdAt: { gte: startDate },
                    },
                    select: {
                        createdAt: true,
                        severity: true,
                    },
                });

                const byDay: Record<string, { critical: number; high: number; medium: number; low: number }> = {};

                for (const day of dayLabels) {
                    byDay[day] = { critical: 0, high: 0, medium: 0, low: 0 };
                }

                for (const alert of alerts) {
                    const day = format(startOfDay(new Date(alert.createdAt)), 'yyyy-MM-dd');
                    if (byDay[day]) {
                        const severity = alert.severity as 'critical' | 'high' | 'medium' | 'low';
                        byDay[day][severity]++;
                    }
                }

                data = dayLabels.map((day) => ({
                    date: day,
                    critical: byDay[day].critical,
                    high: byDay[day].high,
                    medium: byDay[day].medium,
                    low: byDay[day].low,
                    total: byDay[day].critical + byDay[day].high + byDay[day].medium + byDay[day].low,
                }));
            }

            return {
                success: true,
                metric,
                period: {
                    days,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                },
                data,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        logger.error('Failed to fetch time-series data', { error });
        captureError(error as Error, { tags: { context: 'analytics-timeseries' } });
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch time-series data',
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}
