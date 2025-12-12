/**
 * ODAVL Cloud Console - Prisma Client Singleton
 * Batch 3: Database Integration + Reliability Upgrades
 * 
 * Prevents connection leaks in serverless/dev environments
 * Includes retry logic for transient failures
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Retry wrapper for Prisma operations
 * Handles transient database connection errors with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 100
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Only retry on connection errors
      const isRetryable = 
        error instanceof Error &&
        (error.message.includes('connection') || 
         error.message.includes('timeout') ||
         error.message.includes('ECONNREFUSED'));

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export default prisma;
