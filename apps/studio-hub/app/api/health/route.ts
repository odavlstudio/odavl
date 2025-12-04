import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/monitoring/database';
import { withErrorHandler, createSuccessResponse } from '@/lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime: number;
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    uptime: number;
  };
}

export const GET = withErrorHandler(async () => {
  const startTime = performance.now();

  // Database health check
  const dbHealth = await checkDatabaseHealth();

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    // System uptime
    const uptime = process.uptime();

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (!dbHealth.connected) {
      status = 'unhealthy';
    } else if (dbHealth.responseTime > 500 || memoryPercentage > 90) {
      status = 'degraded';
    }

    const healthCheck: HealthCheck = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
      checks: {
        database: {
          status: dbHealth.connected ? 'up' : 'down',
          responseTime: dbHealth.responseTime,
        },
        memory: {
          used: usedMemory,
          total: totalMemory,
          percentage: memoryPercentage,
        },
        uptime,
      },
    };

  const duration = performance.now() - startTime;

  return NextResponse.json(healthCheck, {
    status: status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Response-Time': `${duration.toFixed(2)}ms`,
    },
  });
}, 'GET /api/health');
