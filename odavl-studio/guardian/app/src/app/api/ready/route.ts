import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/prisma';
import { checkRedisConnection } from '@/lib/queue';
import logger from '@/lib/logger';

/**
 * Kubernetes Readiness Probe
 * Returns 200 only when the service is ready to accept traffic
 */
export async function GET() {
    try {
        // Check critical dependencies
        const [databaseReady, redisReady] = await Promise.all([
            checkDatabaseConnection(),
            checkRedisConnection()
        ]);

        const isReady = databaseReady && redisReady;

        if (!isReady) {
            logger.warn('Service not ready', {
                database: databaseReady,
                redis: redisReady,
            });

            return NextResponse.json(
                {
                    ready: false,
                    checks: {
                        database: databaseReady,
                        redis: redisReady,
                    },
                    timestamp: new Date().toISOString(),
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            {
                ready: true,
                timestamp: new Date().toISOString(),
            },
            { status: 200 }
        );
    } catch (error) {
        logger.error('Readiness check failed', {
            error: error instanceof Error ? error.message : String(error),
        });

        return NextResponse.json(
            {
                ready: false,
                error: 'Readiness check failed',
                timestamp: new Date().toISOString(),
            },
            { status: 503 }
        );
    }
}
