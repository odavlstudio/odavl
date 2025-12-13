/**
 * ODAVL Insight Quota Engine - Phase 3.0.1
 * 
 * Quota checking and enforcement utilities for Insight Cloud uploads.
 * Integrates with plan limits to provide graceful degradation.
 */

import { 
  type InsightPlanType, 
  getInsightPlan, 
  hasUnlimitedUploads 
} from '../plans/insight-plans.js';

/**
 * Usage data for quota calculations
 */
export interface UsageData {
  /** Total uploads this billing period */
  uploadsThisMonth: number;
  
  /** Current billing period start date */
  billingPeriodStart: Date;
  
  /** Current billing period end date */
  billingPeriodEnd: Date;
}

/**
 * Quota check result
 */
export interface QuotaCheckResult {
  /** Can the action be performed? */
  allowed: boolean;
  
  /** Remaining quota (uploads, storage, etc.) */
  remaining: number;
  
  /** Total quota limit */
  limit: number;
  
  /** Reason if not allowed */
  reason?: string;
  
  /** Suggested upgrade plan if quota exceeded */
  suggestedPlan?: InsightPlanType;
  
  /** Upgrade URL */
  upgradeUrl?: string;
}

/**
 * Check if user can upload analysis
 * 
 * @param userPlan - User's current Insight plan
 * @param usageData - Current usage data
 * @returns Quota check result
 */
export function canUploadAnalysis(
  userPlan: InsightPlanType,
  usageData: UsageData
): QuotaCheckResult {
  const plan = getInsightPlan(userPlan);
  
  // Enterprise/unlimited plans always allowed
  if (hasUnlimitedUploads(userPlan)) {
    return {
      allowed: true,
      remaining: Infinity,
      limit: 0, // 0 = unlimited
    };
  }
  
  const { uploadsThisMonth } = usageData;
  const limit = plan.monthlyUploadLimit;
  const remaining = Math.max(0, limit - uploadsThisMonth);
  
  // Check if quota exceeded
  if (uploadsThisMonth >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      reason: `Monthly upload limit reached (${limit} uploads)`,
      suggestedPlan: getSuggestedUpgrade(userPlan),
      upgradeUrl: '/pricing?source=quota_exceeded',
    };
  }
  
  // Quota available
  return {
    allowed: true,
    remaining,
    limit,
  };
}

/**
 * Calculate remaining uploads for current month
 * 
 * @param userPlan - User's current Insight plan
 * @param usageData - Current usage data
 * @returns Number of remaining uploads (Infinity if unlimited)
 */
export function remainingUploads(
  userPlan: InsightPlanType,
  usageData: UsageData
): number {
  const plan = getInsightPlan(userPlan);
  
  if (hasUnlimitedUploads(userPlan)) {
    return Infinity;
  }
  
  const remaining = plan.monthlyUploadLimit - usageData.uploadsThisMonth;
  return Math.max(0, remaining);
}

/**
 * Check if user can use SARIF S3 uploads (large analyses)
 * 
 * @param userPlan - User's current Insight plan
 * @returns true if SARIF uploads allowed
 */
export function canUseSarif(userPlan: InsightPlanType): boolean {
  const plan = getInsightPlan(userPlan);
  return plan.allowSarifUpload;
}

/**
 * Check if user can use offline queue
 * 
 * @param userPlan - User's current Insight plan
 * @returns true if offline queue allowed
 */
export function canUseOfflineQueue(userPlan: InsightPlanType): boolean {
  const plan = getInsightPlan(userPlan);
  return plan.allowOfflineQueue;
}

/**
 * Get maximum offline queue size for plan
 * 
 * @param userPlan - User's current Insight plan
 * @returns Maximum queue entries (0 = unlimited)
 */
export function getMaxQueueSize(userPlan: InsightPlanType): number {
  const plan = getInsightPlan(userPlan);
  
  // FREE plan: 3 entries max
  if (userPlan === 'FREE') {
    return 3;
  }
  
  // All paid plans: unlimited
  return 0; // 0 = unlimited
}

/**
 * Check if current queue size is within plan limits
 * 
 * @param userPlan - User's current Insight plan
 * @param currentQueueSize - Current number of queued entries
 * @returns true if within limits
 */
export function isQueueWithinLimits(
  userPlan: InsightPlanType,
  currentQueueSize: number
): boolean {
  const maxSize = getMaxQueueSize(userPlan);
  
  // 0 = unlimited
  if (maxSize === 0) {
    return true;
  }
  
  return currentQueueSize < maxSize;
}

/**
 * Calculate upload quota percentage used
 * 
 * @param userPlan - User's current Insight plan
 * @param usageData - Current usage data
 * @returns Percentage (0-100) or null if unlimited
 */
export function getQuotaUsagePercentage(
  userPlan: InsightPlanType,
  usageData: UsageData
): number | null {
  if (hasUnlimitedUploads(userPlan)) {
    return null; // Unlimited plans have no percentage
  }
  
  const plan = getInsightPlan(userPlan);
  const percentage = (usageData.uploadsThisMonth / plan.monthlyUploadLimit) * 100;
  return Math.min(100, Math.round(percentage));
}

/**
 * Check if user is approaching quota limit (>80% used)
 * 
 * @param userPlan - User's current Insight plan
 * @param usageData - Current usage data
 * @returns true if >80% quota used
 */
export function isApproachingQuotaLimit(
  userPlan: InsightPlanType,
  usageData: UsageData
): boolean {
  const percentage = getQuotaUsagePercentage(userPlan, usageData);
  
  if (percentage === null) {
    return false; // Unlimited plans never approach limit
  }
  
  return percentage >= 80;
}

/**
 * Get suggested upgrade plan when quota exceeded
 * 
 * @param currentPlan - User's current plan
 * @returns Suggested next tier plan
 */
export function getSuggestedUpgrade(currentPlan: InsightPlanType): InsightPlanType {
  switch (currentPlan) {
    case 'FREE':
      return 'PRO';
    case 'PRO':
      return 'TEAM';
    case 'TEAM':
      return 'ENTERPRISE';
    case 'ENTERPRISE':
      return 'ENTERPRISE'; // Already at top tier
  }
}

/**
 * Generate quota exceeded error message
 * 
 * @param userPlan - User's current plan
 * @param usageData - Current usage data
 * @returns Human-readable error message
 */
export function getQuotaExceededMessage(
  userPlan: InsightPlanType,
  usageData: UsageData
): string {
  const plan = getInsightPlan(userPlan);
  const suggestedPlan = getSuggestedUpgrade(userPlan);
  
  return `Monthly upload limit reached (${plan.monthlyUploadLimit} uploads). Upgrade to ${suggestedPlan} for more capacity.`;
}

/**
 * Generate approaching limit warning message
 * 
 * @param userPlan - User's current plan
 * @param usageData - Current usage data
 * @returns Warning message or null if not approaching limit
 */
export function getApproachingLimitWarning(
  userPlan: InsightPlanType,
  usageData: UsageData
): string | null {
  if (!isApproachingQuotaLimit(userPlan, usageData)) {
    return null;
  }
  
  const remaining = remainingUploads(userPlan, usageData);
  const plan = getInsightPlan(userPlan);
  
  return `You have ${remaining} of ${plan.monthlyUploadLimit} uploads remaining this month.`;
}

/**
 * Reset usage data for new billing period
 * 
 * @param billingPeriodStart - New billing period start date
 * @returns Fresh usage data
 */
export function createNewBillingPeriod(billingPeriodStart: Date): UsageData {
  const billingPeriodEnd = new Date(billingPeriodStart);
  billingPeriodEnd.setMonth(billingPeriodEnd.getMonth() + 1);
  
  return {
    uploadsThisMonth: 0,
    billingPeriodStart,
    billingPeriodEnd,
  };
}

/**
 * Check if current date is within billing period
 * 
 * @param usageData - Current usage data
 * @param currentDate - Date to check (defaults to now)
 * @returns true if within billing period
 */
export function isWithinBillingPeriod(
  usageData: UsageData,
  currentDate: Date = new Date()
): boolean {
  return (
    currentDate >= usageData.billingPeriodStart &&
    currentDate < usageData.billingPeriodEnd
  );
}
