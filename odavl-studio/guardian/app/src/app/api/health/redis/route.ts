/**
 * Redis Health Check API
 * Endpoint for monitoring Redis connection health
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRedisHealth, getRedisClient } from '@/lib/redis';
import logger from '@/lib/logger';
import { captureError } from '@/lib/sentry';

/**
 * GET /api/health/redis
 * Check Redis connection health
 */
export async function GET(_request: NextRequest) {
    try {
        const startTime = Date.now();

        // Check basic connectivity
        const isHealthy = await checkRedisHealth();

        if (!isHealthy) {
            return NextResponse.json(
                {
                    success: false,
                    status: 'unhealthy',
                    message: 'Redis connection failed',
                    timestamp: new Date().toISOString(),
                },
                { status: 503 }
            );
        }

        // Get detailed Redis info
        const client = getRedisClient();
        const info = await client.info('server');
        const memory = await client.info('memory');
        const stats = await client.info('stats');

        // Parse info strings
        const parseInfo = (infoStr: string): Record<string, string> => {
            const result: Record<string, string> = {};
            infoStr.split('\r\n').forEach((line) => {
                if (line && !line.startsWith('#')) {
                    const [key, value] = line.split(':');
                    if (key && value) {
                        result[key] = value;
                    }
                }
            });
            return result;
        };

        const serverInfo = parseInfo(info);
        const memoryInfo = parseInfo(memory);
        const statsInfo = parseInfo(stats);

        const responseTime = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            status: 'healthy',
            responseTime: `${responseTime}ms`,
            redis: {
                version: serverInfo.redis_version,
                uptime: `${Number.parseInt(serverInfo.uptime_in_seconds || '0')}s`,
                connectedClients: serverInfo.connected_clients,
                usedMemory: memoryInfo.used_memory_human,
                maxMemory: memoryInfo.maxmemory_human || 'unlimited',
                totalCommandsProcessed: statsInfo.total_commands_processed,
                opsPerSecond: statsInfo.instantaneous_ops_per_sec,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error('Redis health check failed', { error });
        captureError(error as Error, { tags: { context: 'redis-health-check' } });

        return NextResponse.json(
            {
                success: false,
                status: 'error',
                message: 'Health check failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/health/redis/flush
 * Flush Redis cache (admin only - use with caution)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, confirm } = body;

        if (action !== 'flush' || confirm !== true) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid action',
                    message: 'action must be "flush" and confirm must be true',
                },
                { status: 400 }
            );
        }

        // WARNING: This will delete all keys in the current database
        const client = getRedisClient();
        await client.flushdb();

        logger.warn('Redis cache flushed', {
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: 'Redis cache flushed successfully',
            warning: 'All rate limits and cache data have been reset',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error('Failed to flush Redis cache', { error });
        captureError(error as Error, { tags: { context: 'redis-flush' } });

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: 'Failed to flush Redis cache',
            },
            { status: 500 }
        );
    }
}
