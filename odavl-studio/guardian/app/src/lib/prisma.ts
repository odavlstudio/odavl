import { PrismaClient } from '@prisma/client';
import { createSlowQueryMiddleware } from './slow-query-logger';

// PrismaClient singleton pattern (prevents connection leaks in serverless)
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        // Connection pool configuration
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });

// Connection pool info:
// Recommended URL format: postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=5&connect_timeout=10

// Register slow query middleware
prisma.$use(createSlowQueryMiddleware());

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Helper to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        console.error('[Prisma] Database connection failed:', error);
        return false;
    }
}

// Helper to disconnect (useful for tests)
export async function disconnectDatabase(): Promise<void> {
    await prisma.$disconnect();
}
