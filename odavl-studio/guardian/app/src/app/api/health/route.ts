import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/prisma';
import { checkRedisConnection } from '@/lib/queue';
import logger from '@/lib/logger';
import { SystemMonitor } from '@/lib/monitoring';

export async function GET() {
    const startTime = Date.now();

    try {
        // Run all checks in parallel
        const [databaseHealthy, redisHealthy] = await Promise.all([
            checkDatabaseConnection(),
            checkRedisConnection()
        ]);

        const checks = {
            database: databaseHealthy,
            redis: redisHealthy,
            api: true, // API is up if this runs
        };

        const allHealthy = Object.values(checks).every(Boolean);
        const responseTime = Date.now() - startTime;

        // Get system metrics
        const system = {
            memory: SystemMonitor.getMemoryUsage(),
            uptime: process.uptime(),
        };

        const result = {
            status: allHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            checks,
            responseTime,
            system,
        };

        logger.debug('Health check completed', {
            status: result.status,
            responseTime,
        });

        return NextResponse.json(result, { status: allHealthy ? 200 : 503 });
    } catch (error) {
        logger.error('Health check failed', {
            error: error instanceof Error ? error.message : String(error),
        });

        return NextResponse.json(
            {
                status: 'unhealthy',
                error: 'Health check failed',
                timestamp: new Date().toISOString(),
            },
            { status: 503 }
        );
    }
}
