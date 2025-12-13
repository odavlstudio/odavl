// Database configuration for PostgreSQL
// Supports Railway, Supabase, and local PostgreSQL

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma client instance with proper configuration
 * Uses singleton pattern to prevent connection leaks
 */
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Database connection test
 */
export async function testConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Health check query
 */
export async function healthCheck(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;

    const latency = Date.now() - start;

    return {
      healthy: true,
      latency,
    };
  } catch (error: any) {
    const latency = Date.now() - start;

    return {
      healthy: false,
      latency,
      error: error.message,
    };
  }
}

/**
 * Database statistics
 */
export async function getDatabaseStats() {
  try {
    const [users, sessions, analyses, reports] = await Promise.all([
      prisma.user.count(),
      prisma.session.count(),
      prisma.analysis.count(),
      prisma.report.count(),
    ]);

    return {
      users,
      sessions,
      analyses,
      reports,
      total: users + sessions + analyses + reports,
    };
  } catch (error) {
    console.error('Failed to get database stats:', error);
    return null;
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    console.log(`🧹 Cleaned up ${result.count} expired sessions`);
    return result.count;
  } catch (error) {
    console.error('Failed to cleanup sessions:', error);
    return 0;
  }
}

/**
 * Clean up old refresh tokens
 */
export async function cleanupOldRefreshTokens(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.refreshToken.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    console.log(`🧹 Cleaned up ${result.count} old refresh tokens`);
    return result.count;
  } catch (error) {
    console.error('Failed to cleanup refresh tokens:', error);
    return 0;
  }
}

/**
 * Export default prisma instance
 */
export default prisma;
