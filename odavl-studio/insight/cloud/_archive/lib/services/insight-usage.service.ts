/**
 * Insight Usage Service
 * 
 * Manages monthly usage tracking for Insight CLI uploads with atomic operations
 * and automatic period resets. Thread-safe for concurrent uploads.
 * 
 * @module insight-usage.service
 */

import { prisma } from '../prisma';
import type { InsightUsage } from '@prisma/client';

/**
 * Get current billing period in YYYY-MM format
 * @returns Current period string (e.g., "2025-12")
 * 
 * @example
 * getCurrentPeriod() // "2025-12"
 */
export function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get or create usage record for user in current period
 * 
 * Creates a new record if none exists for the current period.
 * Automatically resets usage if period changed (handled by unique constraint).
 * 
 * @param userId - User ID to fetch usage for
 * @returns Usage record with uploadsUsed, lastUploadAt, etc.
 * 
 * @example
 * const usage = await getUsage('user-123');
 * console.log(usage.uploadsUsed); // 5
 */
export async function getUsage(userId: string): Promise<InsightUsage> {
  const period = getCurrentPeriod();
  
  // Atomic upsert: create if not exists, return if exists
  const usage = await prisma.insightUsage.upsert({
    where: {
      userId_period: {
        userId,
        period,
      },
    },
    update: {}, // No changes on existing record
    create: {
      userId,
      period,
      uploadsUsed: 0,
    },
  });

  return usage;
}

/**
 * Increment upload count for user (atomic, thread-safe)
 * 
 * Uses atomic database increment to prevent race conditions
 * when multiple uploads happen concurrently.
 * 
 * @param userId - User ID to increment usage for
 * @returns Updated usage record with new uploadsUsed count
 * 
 * @throws {Error} If database update fails
 * 
 * @example
 * const usage = await incrementUsage('user-123');
 * console.log(usage.uploadsUsed); // 6 (was 5)
 */
export async function incrementUsage(userId: string): Promise<InsightUsage> {
  const period = getCurrentPeriod();

  // Atomic increment with timestamp update
  const updated = await prisma.insightUsage.update({
    where: {
      userId_period: {
        userId,
        period,
      },
    },
    data: {
      uploadsUsed: {
        increment: 1,
      },
      lastUploadAt: new Date(),
    },
  });

  return updated;
}

/**
 * Reset usage if period changed (monthly boundary)
 * 
 * Checks if usage record exists for current period. If not (user from previous month),
 * creates new record with zero usage. This happens automatically via unique constraint.
 * 
 * @param userId - User ID to check/reset
 * @returns Usage record for current period (new or existing)
 * 
 * @example
 * // January 31st → February 1st
 * const usage = await resetIfNewPeriod('user-123');
 * console.log(usage.uploadsUsed); // 0 (reset for new month)
 */
export async function resetIfNewPeriod(userId: string): Promise<InsightUsage> {
  // getUsage handles period reset via upsert with unique constraint
  return getUsage(userId);
}

/**
 * Get all usage records for a user (historical)
 * 
 * Useful for analytics, billing history, and usage trend visualization.
 * 
 * @param userId - User ID to fetch history for
 * @returns Array of usage records ordered by period (newest first)
 * 
 * @example
 * const history = await getUserUsageHistory('user-123');
 * // [{ period: "2025-12", uploadsUsed: 15 }, { period: "2025-11", uploadsUsed: 42 }]
 */
export async function getUserUsageHistory(userId: string): Promise<InsightUsage[]> {
  return prisma.insightUsage.findMany({
    where: { userId },
    orderBy: { period: 'desc' },
  });
}

/**
 * Delete usage records older than N months
 * 
 * GDPR compliance: Remove historical data after retention period.
 * 
 * @param monthsToKeep - Number of months to retain (default: 12)
 * @returns Count of deleted records
 * 
 * @example
 * const deleted = await cleanupOldUsage(6); // Keep last 6 months
 */
export async function cleanupOldUsage(monthsToKeep = 12): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);
  
  const cutoffPeriod = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}`;
  
  const result = await prisma.insightUsage.deleteMany({
    where: {
      period: {
        lt: cutoffPeriod,
      },
    },
  });

  return result.count;
}
