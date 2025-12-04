/**
 * Health Check API
 * GET /api/v1/observability/health - Full health check
 * GET /api/v1/observability/health/live - Liveness probe
 * GET /api/v1/observability/health/ready - Readiness probe
 * GET /api/v1/observability/health/startup - Startup probe
 */

import { NextRequest, NextResponse } from 'next/server';
import { healthCheckService } from '@/packages/core/src/services/health-check';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const probe = searchParams.get('probe');

    // Kubernetes-style probes
    if (probe === 'live') {
      const isAlive = await healthCheckService.isAlive();
      return NextResponse.json(
        { status: isAlive ? 'ok' : 'error' },
        { status: isAlive ? 200 : 503 }
      );
    }

    if (probe === 'ready') {
      const isReady = await healthCheckService.isReady();
      return NextResponse.json(
        { status: isReady ? 'ok' : 'error' },
        { status: isReady ? 200 : 503 }
      );
    }

    if (probe === 'startup') {
      const isStarted = await healthCheckService.isStarted();
      return NextResponse.json(
        { status: isStarted ? 'ok' : 'error' },
        { status: isStarted ? 200 : 503 }
      );
    }

    // Full health check
    const health = await healthCheckService.checkHealth();
    const statusCode = health.status === 'unhealthy' ? 503 :
                       health.status === 'degraded' ? 200 : 200;

    return NextResponse.json({
      success: true,
      data: health
    }, { status: statusCode });

  } catch (error) {
    console.error('Error checking health:', error);
    return NextResponse.json(
      { success: false, error: 'Health check failed' },
      { status: 503 }
    );
  }
}
