import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/monitoring/database';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import {
  withErrorHandler,
  validateRequestBody,
  createSuccessResponse,
  ApiErrors,
  CommonSchemas,
  getPaginationParams,
} from '@/lib/api';
// import * as Sentry from '@sentry/nextjs'; // Temporarily disabled

const MetricsSchema = z.object({
  metrics: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
      unit: z.string(),
      timestamp: z.coerce.date().optional(),
      tags: z.record(z.string()).optional(),
    })
  ),
});

export const POST = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return ApiErrors.unauthorized('Authentication required');
  }

  const result = await validateRequestBody(req, MetricsSchema);
  if (result instanceof NextResponse) return result;

  const { metrics } = result.data;

  // Store metrics in database for analysis
  await prisma.performanceMetric.createMany({
    data: metrics.map((metric) => ({
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      tags: metric.tags || {},
      userId: session.user.id,
      timestamp: metric.timestamp || new Date(),
    })),
  });

  // Also send to Sentry for real-time monitoring
  if (process.env.NODE_ENV === 'production') {
    // Sentry disabled temporarily
    // metrics.forEach((metric) => {
    //   Sentry.metrics.distribution(metric.name, metric.value, {
    //     unit: metric.unit,
    //   });
    // });
  }

  return createSuccessResponse({ count: metrics.length });
}, 'POST /api/analytics/metrics');

const TimeRangeSchema = z.object({
  name: z.string().optional(),
  range: z.enum(['24h', '7d', '30d']).default('24h'),
});

export const GET = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return ApiErrors.unauthorized('Authentication required');
  }

  const { searchParams } = new URL(req.url);
  const metricName = searchParams.get('name') || undefined;
  const timeRange = (searchParams.get('range') as '24h' | '7d' | '30d') || '24h';

  // Calculate time range
  const now = new Date();
  const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720; // 30d
  const startDate = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

  // Aggregate metrics
  const metrics = await prisma.performanceMetric.groupBy({
    by: ['name'],
    where: {
      ...(metricName && { name: metricName }),
      timestamp: { gte: startDate },
    },
    _avg: { value: true },
    _max: { value: true },
    _min: { value: true },
    _count: true,
  });

  return createSuccessResponse({ metrics, timeRange });
}, 'GET /api/analytics/metrics');

