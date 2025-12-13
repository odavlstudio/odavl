/**
 * ODAVL Insight Cloud Plans - Phase 3.0.1
 * 
 * Single source of truth for Insight plan limits and features.
 * Used by quota enforcement, billing, and plan comparison UI.
 */

export type InsightPlanType = 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE';

/**
 * Insight Plan Definition
 */
export interface InsightPlan {
  /** Plan identifier */
  id: InsightPlanType;
  
  /** Display name */
  name: string;
  
  /** Monthly upload limit (number of analysis uploads) */
  monthlyUploadLimit: number;
  
  /** Allow SARIF S3 uploads for large analyses */
  allowSarifUpload: boolean;
  
  /** Allow offline queue (CLI auto-queue when network unavailable) */
  allowOfflineQueue: boolean;
  
  /** History retention in days (0 = forever) */
  historyRetentionDays: number;
  
  /** Maximum team members (0 = unlimited) */
  maxTeamMembers: number;
  
  /** Priority support */
  prioritySupport: boolean;
  
  /** Custom rules */
  customRules: boolean;
  
  /** API access */
  apiAccess: boolean;
}

/**
 * FREE Plan - For individual developers evaluating ODAVL Insight
 */
export const FREE_PLAN: InsightPlan = {
  id: 'FREE',
  name: 'Free',
  monthlyUploadLimit: 10, // 10 uploads per month
  allowSarifUpload: false, // Only small direct JSON uploads
  allowOfflineQueue: true, // Queue up to 3 entries
  historyRetentionDays: 7, // 7 days retention
  maxTeamMembers: 1,
  prioritySupport: false,
  customRules: false,
  apiAccess: false,
};

/**
 * PRO Plan - For professional developers with frequent analysis needs
 */
export const PRO_PLAN: InsightPlan = {
  id: 'PRO',
  name: 'Pro',
  monthlyUploadLimit: 100, // 100 uploads per month
  allowSarifUpload: true, // SARIF S3 uploads enabled
  allowOfflineQueue: true, // Unlimited queue entries
  historyRetentionDays: 30, // 30 days retention
  maxTeamMembers: 1,
  prioritySupport: false,
  customRules: true,
  apiAccess: true,
};

/**
 * TEAM Plan - For small teams collaborating on quality
 */
export const TEAM_PLAN: InsightPlan = {
  id: 'TEAM',
  name: 'Team',
  monthlyUploadLimit: 500, // 500 uploads per month (shared across team)
  allowSarifUpload: true, // SARIF S3 uploads enabled
  allowOfflineQueue: true, // Unlimited queue entries
  historyRetentionDays: 90, // 90 days retention
  maxTeamMembers: 10,
  prioritySupport: true,
  customRules: true,
  apiAccess: true,
};

/**
 * ENTERPRISE Plan - For organizations with custom requirements
 */
export const ENTERPRISE_PLAN: InsightPlan = {
  id: 'ENTERPRISE',
  name: 'Enterprise',
  monthlyUploadLimit: 0, // Unlimited (0 = no limit)
  allowSarifUpload: true, // SARIF S3 uploads enabled
  allowOfflineQueue: true, // Unlimited queue entries
  historyRetentionDays: 0, // Forever (0 = no limit)
  maxTeamMembers: 0, // Unlimited (0 = no limit)
  prioritySupport: true,
  customRules: true,
  apiAccess: true,
};

/**
 * All plans indexed by ID
 */
export const INSIGHT_PLANS: Record<InsightPlanType, InsightPlan> = {
  FREE: FREE_PLAN,
  PRO: PRO_PLAN,
  TEAM: TEAM_PLAN,
  ENTERPRISE: ENTERPRISE_PLAN,
};

/**
 * Get plan by ID
 */
export function getInsightPlan(planId: InsightPlanType): InsightPlan {
  return INSIGHT_PLANS[planId];
}

/**
 * Check if plan ID is valid
 */
export function isValidInsightPlan(planId: string): planId is InsightPlanType {
  return planId in INSIGHT_PLANS;
}

/**
 * Get default plan (FREE)
 */
export function getDefaultInsightPlan(): InsightPlan {
  return FREE_PLAN;
}

/**
 * Compare two plans (returns 1 if plan1 > plan2, -1 if plan1 < plan2, 0 if equal)
 */
export function comparePlans(plan1: InsightPlanType, plan2: InsightPlanType): number {
  const order: InsightPlanType[] = ['FREE', 'PRO', 'TEAM', 'ENTERPRISE'];
  const index1 = order.indexOf(plan1);
  const index2 = order.indexOf(plan2);
  
  if (index1 > index2) return 1;
  if (index1 < index2) return -1;
  return 0;
}

/**
 * Check if plan has unlimited uploads
 */
export function hasUnlimitedUploads(planId: InsightPlanType): boolean {
  const plan = getInsightPlan(planId);
  return plan.monthlyUploadLimit === 0;
}

/**
 * Check if plan has unlimited history
 */
export function hasUnlimitedHistory(planId: InsightPlanType): boolean {
  const plan = getInsightPlan(planId);
  return plan.historyRetentionDays === 0;
}
