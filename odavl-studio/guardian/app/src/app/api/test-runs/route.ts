import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/cache';

// Cache TTL for test runs (2 minutes - frequently updated)
const CACHE_TTL = 120;

async function cacheTestRuns(key: string, fetcher: () => Promise<any[]>): Promise<any[]> {
    const redis = getRedisClient();

    try {
        const cached = await redis.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('[Cache] Redis read failed, falling back to DB:', err);
    }

    const data = await fetcher();

    try {
        await redis.setex(key, CACHE_TTL, JSON.stringify(data));
    } catch (err) {
        console.warn('[Cache] Redis write failed:', err);
    }

    return data;
}

async function invalidateTestRunsCache(projectId: string) {
    const redis = getRedisClient();
    try {
        await redis.del(`test-runs:project:${projectId}`);
    } catch (err) {
        console.warn('[Cache] Failed to invalidate test-runs cache:', err);
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Number.parseInt(searchParams.get('limit') || '50');
        const projectId = searchParams.get('projectId');
        const type = searchParams.get('type');
        const status = searchParams.get('status');

        const where: Record<string, unknown> = {};

        if (projectId) {
            where.projectId = projectId;
        }

        if (type) {
            where.type = type;
        }

        if (status) {
            where.status = status;
        }

        // Cache key based on filters
        const cacheKey = `test-runs:${projectId || 'all'}:${type || 'all'}:${status || 'all'}:${limit}`;

        const testRuns = await cacheTestRuns(cacheKey, async () => {
            return prisma.testRun.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                select: {
                    id: true,
                    name: true,
                    type: true,
                    status: true,
                    error: true,
                    startedAt: true,
                    completedAt: true,
                    duration: true,
                    createdAt: true,
                    results: true,
                    screenshots: true,
                    errorCount: true,
                    warningCount: true,
                    passedCount: true,
                    failedCount: true,
                    projectId: true,
                    project: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });
        });

        return NextResponse.json(testRuns);
    } catch (error) {
        console.error('[API] Failed to fetch test runs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch test runs' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId, type, config } = body;

        if (!projectId || !type || !config) {
            return NextResponse.json(
                { error: 'Missing required fields: projectId, type, config' },
                { status: 400 }
            );
        }

        // Create test run
        const testRun = await prisma.testRun.create({
            data: {
                projectId,
                type,
                status: 'pending',
                results: config, // Store config in results JSON field
                createdAt: new Date()
            }
        });

        // Invalidate cache
        await invalidateTestRunsCache(projectId);

        // Add job to queue
        const { testQueue } = await import('@/lib/queue');
        await testQueue.add('run-test', {
            testRunId: testRun.id,
            type,
            config
        });

        return NextResponse.json(testRun, { status: 201 });
    } catch (error) {
        console.error('[API] Failed to create test run:', error);
        return NextResponse.json(
            { error: 'Failed to create test run' },
            { status: 500 }
        );
    }
}
