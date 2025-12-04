/**
 * Slow Query Logger
 * Logs database queries exceeding threshold
 */

import { Prisma } from '@prisma/client';
import logger from '@/lib/logger';
import { recordDatabaseMetrics } from '@/lib/metrics';

// Threshold in milliseconds (queries slower than this will be logged)
const SLOW_QUERY_THRESHOLD = Number(process.env.SLOW_QUERY_THRESHOLD) || 100;

interface QueryEvent {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
}

/**
 * Prisma middleware for logging slow queries
 */
export function createSlowQueryMiddleware(): any {
    return async (params: any, next: any) => {
        const startTime = Date.now();

        // Execute the query
        const result = await next(params);

        const duration = Date.now() - startTime;
        const model = params.model || 'unknown';
        const action = params.action;

        // Record metrics
        recordDatabaseMetrics(action, model, duration);

        // Log slow queries
        if (duration >= SLOW_QUERY_THRESHOLD) {
            const queryEvent: QueryEvent = {
                timestamp: new Date(),
                query: `${model}.${action}`,
                params: JSON.stringify(params.args),
                duration,
                target: params.model || 'N/A',
            };

            logger.warn('Slow query detected', {
                ...queryEvent,
                threshold: SLOW_QUERY_THRESHOLD,
            });

            // Log to separate slow query file
            logger.child({ component: 'slow-queries' }).warn('Slow query', queryEvent);
        }

        return result;
    };
}

/**
 * Get slow query statistics
 */
export interface SlowQueryStats {
    threshold: number;
    totalQueries: number;
    slowQueries: number;
    slowQueryPercentage: number;
    avgDuration: number;
    maxDuration: number;
    slowestQueries: Array<{
        query: string;
        duration: number;
        timestamp: string;
    }>;
}

// In-memory cache for statistics (reset on server restart)
const queryStats = {
    total: 0,
    slow: 0,
    totalDuration: 0,
    maxDuration: 0,
    recentSlow: [] as Array<{ query: string; duration: number; timestamp: string }>,
};

/**
 * Record query for statistics
 */
export function recordQueryStat(query: string, duration: number) {
    queryStats.total++;
    queryStats.totalDuration += duration;

    if (duration > queryStats.maxDuration) {
        queryStats.maxDuration = duration;
    }

    if (duration >= SLOW_QUERY_THRESHOLD) {
        queryStats.slow++;

        // Keep only last 100 slow queries
        queryStats.recentSlow.unshift({
            query,
            duration,
            timestamp: new Date().toISOString(),
        });

        if (queryStats.recentSlow.length > 100) {
            queryStats.recentSlow.pop();
        }
    }
}

/**
 * Get slow query statistics
 */
export function getSlowQueryStats(): SlowQueryStats {
    return {
        threshold: SLOW_QUERY_THRESHOLD,
        totalQueries: queryStats.total,
        slowQueries: queryStats.slow,
        slowQueryPercentage: queryStats.total > 0 ? (queryStats.slow / queryStats.total) * 100 : 0,
        avgDuration: queryStats.total > 0 ? queryStats.totalDuration / queryStats.total : 0,
        maxDuration: queryStats.maxDuration,
        slowestQueries: queryStats.recentSlow.slice(0, 10), // Top 10
    };
}

/**
 * Reset query statistics
 */
export function resetQueryStats() {
    queryStats.total = 0;
    queryStats.slow = 0;
    queryStats.totalDuration = 0;
    queryStats.maxDuration = 0;
    queryStats.recentSlow = [];
}

export default {
    createSlowQueryMiddleware,
    recordQueryStat,
    getSlowQueryStats,
    resetQueryStats,
    SLOW_QUERY_THRESHOLD,
};
