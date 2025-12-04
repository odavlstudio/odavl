/**
 * Readiness Check Endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy';
  duration?: number;
  error?: string;
}

/**
 * GET /api/health/ready
 * Detailed readiness check
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const checks: HealthCheck[] = [];

  // Check database
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.push({
      name: 'database',
      status: 'healthy',
      duration: Date.now() - dbStart,
    });
  } catch (error: any) {
    checks.push({
      name: 'database',
      status: 'unhealthy',
      error: error.message,
    });
  }

  // Check storage (if configured)
  if (process.env.STORAGE_PROVIDER === 's3' || process.env.STORAGE_PROVIDER === 'azure') {
    try {
      // TODO: Add actual storage check
      checks.push({
        name: 'storage',
        status: 'healthy',
        duration: 0,
      });
    } catch (error: any) {
      checks.push({
        name: 'storage',
        status: 'unhealthy',
        error: error.message,
      });
    }
  }

  // Check authentication service
  try {
    // TODO: Add actual auth service check
    checks.push({
      name: 'authentication',
      status: 'healthy',
      duration: 0,
    });
  } catch (error: any) {
    checks.push({
      name: 'authentication',
      status: 'unhealthy',
      error: error.message,
    });
  }

  const allHealthy = checks.every((check) => check.status === 'healthy');
  const totalDuration = Date.now() - startTime;

  return NextResponse.json(
    {
      status: allHealthy ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      totalDuration,
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
