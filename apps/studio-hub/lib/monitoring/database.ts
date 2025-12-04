import { PrismaClient } from '@prisma/client';
// import * as Sentry from '@sentry/nextjs'; // Temporarily disabled
import { performanceMonitor } from './performance';
import { logger } from '@/lib/logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  responseTime: number;
}> {
  const startTime = performance.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = performance.now() - startTime;

    return {
      connected: true,
      responseTime,
    };
  } catch (error) {
    // Sentry.captureException(error, { tags: { healthCheck: 'database' } });
    logger.error('Database health check failed', { error });

    return {
      connected: false,
      responseTime: performance.now() - startTime,
    };
  }
}

export async function monitoredQuery<T>(
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - startTime;

    const size = new Blob([JSON.stringify(result)]).size;

    if (size > 5 * 1024 * 1024) {
      logger.warn('Large query result', { sizeMB: (size / 1024 / 1024).toFixed(2), durationMs: duration.toFixed(2) });
    }

    performanceMonitor.trackDatabaseQuery('custom_query', duration);

    return result;
  } catch (error) {
    // Sentry.captureException(error);
    logger.error('Monitored query failed', { error });
    throw error;
  }
}
