/**
 * Database Query Optimizer
 * 
 * Week 13: Beta Testing - Query Optimization
 * 
 * Utilities for optimizing Prisma queries with caching and N+1 prevention.
 */

import { prisma } from './prisma';

/**
 * In-memory cache for frequently accessed data
 */
class QueryCache {
    private cache = new Map<string, { data: any; timestamp: number }>();
    private ttl: number;

    constructor(ttlSeconds: number = 300) {
        this.ttl = ttlSeconds * 1000;
    }

    get<T>(key: string): T | null {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const age = Date.now() - cached.timestamp;
        if (age > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return cached.data as T;
    }

    set(key: string, data: any): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    invalidatePattern(pattern: RegExp): void {
        for (const key of this.cache.keys()) {
            if (pattern.test(key)) {
                this.cache.delete(key);
            }
        }
    }
}

// Global cache instance
export const queryCache = new QueryCache(300); // 5 minutes default TTL

/**
 * Cached query wrapper
 */
export async function cachedQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttlSeconds?: number
): Promise<T> {
    // Check cache first
    const cached = queryCache.get<T>(key);
    if (cached !== null) {
        return cached;
    }

    // Execute query
    const result = await queryFn();

    // Cache result
    queryCache.set(key, result);

    return result;
}

/**
 * Optimized user queries with relations
 */
export async function getUserWithRelations(userId: string) {
    return cachedQuery(
        `user:${userId}:relations`,
        async () => {
            return await prisma.member.findFirst({
                where: { id: userId },
                include: {
                    organization: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            tier: true,
                        },
                    },
                },
            });
        },
        60 // Cache for 1 minute
    );
}

/**
 * Optimized test runs query with pagination
 */
export async function getTestRunsOptimized(
    organizationId: string,
    options: {
        page?: number;
        limit?: number;
        status?: string;
    } = {}
) {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const cacheKey = `test-runs:${organizationId}:${page}:${limit}:${status || 'all'}`;

    return cachedQuery(
        cacheKey,
        async () => {
            const where: any = { project: { organizationId } };
            if (status) {
                where.status = status;
            }

            const [runs, total] = await Promise.all([
                prisma.testRun.findMany({
                    where,
                    orderBy: { startedAt: 'desc' },
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        type: true,
                        passedCount: true,
                        failedCount: true,
                        errorCount: true,
                        warningCount: true,
                        duration: true,
                        startedAt: true,
                        completedAt: true,
                    },
                }),
                prisma.testRun.count({ where }),
            ]);

            return {
                runs,
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            };
        },
        30 // Cache for 30 seconds
    );
}

/**
 * Batch load monitors with checks (N+1 prevention)
 */
export async function getMonitorsWithLatestChecks(organizationId: string) {
    const cacheKey = `monitors:${organizationId}:with-checks`;

    return cachedQuery(
        cacheKey,
        async () => {
            // Get all monitors
            const monitors = await prisma.monitor.findMany({
                where: { project: { organizationId } },
                orderBy: { createdAt: 'desc' },
            });

            // Batch load latest checks for all monitors
            const latestChecks = await prisma.monitorCheck.findMany({
                where: {
                    monitorId: { in: monitors.map((m: typeof monitors[0]) => m.id) },
                },
                orderBy: { checkedAt: 'desc' },
                distinct: ['monitorId'],
            });

            // Create lookup map
            const checksMap = new Map(latestChecks.map((c: typeof latestChecks[0]) => [c.monitorId, c]));

            // Attach checks to monitors
            return monitors.map((monitor: typeof monitors[0]) => ({
                ...monitor,
                latestCheck: checksMap.get(monitor.id) || null,
            }));
        },
        60 // Cache for 1 minute
    );
}

/**
 * Optimized analytics query with aggregations
 */
export async function getAnalyticsSummary(organizationId: string, days: number = 7) {
    const cacheKey = `analytics:${organizationId}:${days}d`;

    return cachedQuery(
        cacheKey,
        async () => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const [testRuns, monitors, totalTests] = await Promise.all([
                // Test runs stats
                prisma.testRun.aggregate({
                    where: {
                        project: { organizationId },
                        startedAt: { gte: startDate },
                    },
                    _count: { id: true },
                    _avg: { duration: true },
                }),

                // Monitor uptime
                prisma.monitorCheck.groupBy({
                    by: ['status'],
                    where: {
                        monitor: { project: { organizationId } },
                        checkedAt: { gte: startDate },
                    },
                    _count: { status: true },
                }),

                // Total unique tests
                prisma.testRun.findMany({
                    where: {
                        project: { organizationId },
                        startedAt: { gte: startDate },
                    },
                    select: { name: true },
                    distinct: ['name'],
                }),
            ]);

            // Calculate uptime
            const upChecks = monitors.find((m: typeof monitors[0]) => m.status === 'up')?._count.status || 0;
            const downChecks = monitors.find((m: typeof monitors[0]) => m.status === 'down')?._count.status || 0;
            const totalChecks = upChecks + downChecks;
            const uptime = totalChecks > 0 ? (upChecks / totalChecks) * 100 : 100;

            return {
                testRuns: {
                    total: testRuns._count.id,
                    avgDuration: testRuns._avg.duration || 0,
                    uniqueTests: totalTests.length,
                },
                monitors: {
                    uptime,
                    upChecks,
                    downChecks,
                    totalChecks,
                },
            };
        },
        300 // Cache for 5 minutes
    );
}

/**
 * Invalidate cache patterns
 */
export function invalidateCache(patterns: {
    users?: string[];
    organizations?: string[];
    testRuns?: string[];
    monitors?: string[];
}) {
    if (patterns.users) {
        patterns.users.forEach(userId => {
            queryCache.invalidatePattern(new RegExp(`^user:${userId}:`));
        });
    }

    if (patterns.organizations) {
        patterns.organizations.forEach(orgId => {
            queryCache.invalidatePattern(new RegExp(`^(test-runs|monitors|analytics):${orgId}:`));
        });
    }

    if (patterns.testRuns) {
        patterns.testRuns.forEach(orgId => {
            queryCache.invalidatePattern(new RegExp(`^test-runs:${orgId}:`));
        });
    }

    if (patterns.monitors) {
        patterns.monitors.forEach(orgId => {
            queryCache.invalidatePattern(new RegExp(`^monitors:${orgId}:`));
        });
    }
}

/**
 * Database indexes recommendations
 * 
 * Add these indexes to your Prisma schema:
 * 
 * model TestRun {
 *   @@index([organizationId, startedAt(sort: Desc)])
 *   @@index([organizationId, status])
 *   @@index([framework])
 * }
 * 
 * model MonitorCheck {
 *   @@index([monitorId, createdAt(sort: Desc)])
 *   @@index([status, createdAt])
 * }
 * 
 * model Member {
 *   @@index([email])
 *   @@index([twoFactorEnabled])
 * }
 * 
 * model Organization {
 *   @@index([slug])
 *   @@index([tier])
 * }
 */

/**
 * Query performance monitoring
 */
export class QueryMonitor {
    private static slowQueries: Array<{
        query: string;
        duration: number;
        timestamp: Date;
    }> = [];

    static async measure<T>(
        name: string,
        queryFn: () => Promise<T>
    ): Promise<T> {
        const start = Date.now();
        try {
            const result = await queryFn();
            const duration = Date.now() - start;

            // Log slow queries (>1s)
            if (duration > 1000) {
                this.slowQueries.push({
                    query: name,
                    duration,
                    timestamp: new Date(),
                });

                console.warn(`Slow query detected: ${name} (${duration}ms)`);
            }

            return result;
        } catch (error) {
            console.error(`Query error: ${name}`, error);
            throw error;
        }
    }

    static getSlowQueries() {
        return this.slowQueries;
    }

    static clearSlowQueries() {
        this.slowQueries = [];
    }
}


