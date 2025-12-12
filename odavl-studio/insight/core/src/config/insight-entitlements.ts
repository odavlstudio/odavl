/**
 * ODAVL Insight Entitlements & Feature Flags
 * 
 * Pure, testable module for checking plan entitlements and feature access.
 * Framework-agnostic - can be used from CLI, SDK, Cloud, and VS Code extension.
 * 
 * @module insight-entitlements
 */

import { 
  InsightPlanId, 
  getInsightPlan, 
  type InsightPlan 
} from './insight-product.js';

/**
 * Enterprise feature keys
 */
export type EnterpriseFeature = 
  | 'sso'
  | 'saml'
  | 'audit_logs'
  | 'rbac'
  | 'on_premise'
  | 'white_label'
  | 'custom_detectors'
  | 'compliance_reports'
  | 'dedicated_support';

/**
 * Analysis limits for a plan
 */
export interface AnalysisLimits {
  /** Maximum number of projects (-1 = unlimited) */
  maxProjects: number;
  
  /** Maximum concurrent analyses (-1 = unlimited) */
  maxConcurrentAnalyses: number;
  
  /** Maximum files per analysis (-1 = unlimited) */
  maxFilesPerAnalysis: number;
  
  /** Maximum analyses per day (-1 = unlimited) */
  maxAnalysesPerDay: number;
  
  /** Historical retention in days */
  historicalRetentionDays: number;
}

/**
 * Trial configuration
 */
export interface TrialConfig {
  /** Is this a trial account */
  isTrial: boolean;
  
  /** Trial end date (ISO string) */
  trialEndsAt?: string;
  
  /** Plan being trialed (if different from base plan) */
  trialPlanId?: InsightPlanId;
  
  /** Days remaining in trial */
  daysRemaining?: number;
}

/**
 * Entitlement context for advanced checks
 */
export interface EntitlementContext {
  /** Current plan ID */
  planId: InsightPlanId;
  
  /** Number of users in organization (optional) */
  userCount?: number;
  
  /** Is the account in trial period */
  isTrial?: boolean;
  
  /** Is this an internal preview/beta account */
  isInternalPreview?: boolean;
  
  /** Custom entitlements override (for special cases) */
  customEntitlements?: Partial<Record<EnterpriseFeature, boolean>>;
}

/**
 * Check if plan can run cloud analysis
 * 
 * @param planId - The plan to check
 * @returns True if cloud analysis is enabled
 * 
 * @example
 * ```typescript
 * canRunCloudAnalysis('INSIGHT_PRO'); // true
 * canRunCloudAnalysis('INSIGHT_FREE'); // false
 * ```
 */
export function canRunCloudAnalysis(planId: InsightPlanId): boolean {
  const plan = getInsightPlan(planId);
  return plan.cloudDashboardEnabled;
}

/**
 * Check if plan can use VS Code Cloud Link feature
 * 
 * @param planId - The plan to check
 * @returns True if VS Code cloud link is enabled
 */
export function canUseVSCodeCloudLink(planId: InsightPlanId): boolean {
  // Same as cloud dashboard for now
  return canRunCloudAnalysis(planId);
}

/**
 * Check if plan has team collaboration features
 * 
 * @param planId - The plan to check
 * @returns True if team collaboration is enabled
 */
export function canUseTeamCollaboration(planId: InsightPlanId): boolean {
  const plan = getInsightPlan(planId);
  return plan.teamCollaborationEnabled;
}

/**
 * Get analysis limits for a plan (trial-aware)
 * 
 * @param planId - The plan to check
 * @param trialConfig - Optional trial configuration
 * @returns Analysis limits configuration
 * 
 * @example
 * ```typescript
 * const limits = getAnalysisLimits('INSIGHT_PRO');
 * console.log(limits.maxProjects); // 10
 * console.log(limits.maxConcurrentAnalyses); // 3
 * 
 * // With trial
 * const trialLimits = getAnalysisLimits('INSIGHT_FREE', {
 *   isTrial: true,
 *   trialPlanId: 'INSIGHT_PRO'
 * });
 * console.log(trialLimits.maxProjects); // 10 (PRO limits)
 * ```
 */
export function getAnalysisLimits(
  planId: InsightPlanId,
  trialConfig?: TrialConfig
): AnalysisLimits {
  // If trial is active, use trial plan limits
  const effectivePlanId = trialConfig?.isTrial && trialConfig.trialPlanId
    ? trialConfig.trialPlanId
    : planId;
  
  const plan = getInsightPlan(effectivePlanId);
  
  return {
    maxProjects: plan.maxProjects,
    maxConcurrentAnalyses: plan.maxConcurrentAnalyses,
    maxFilesPerAnalysis: plan.maxFilesPerAnalysis,
    maxAnalysesPerDay: plan.maxAnalysesPerDay,
    historicalRetentionDays: plan.historicalRetentionDays,
  };
}

/**
 * Check if enterprise feature is enabled for a plan
 * 
 * @param planId - The plan to check
 * @param featureKey - The enterprise feature to check
 * @returns True if feature is enabled
 * 
 * @example
 * ```typescript
 * isEnterpriseFeatureEnabled('INSIGHT_ENTERPRISE', 'sso'); // true
 * isEnterpriseFeatureEnabled('INSIGHT_PRO', 'sso'); // false
 * ```
 */
export function isEnterpriseFeatureEnabled(
  planId: InsightPlanId, 
  featureKey: EnterpriseFeature
): boolean {
  const plan = getInsightPlan(planId);
  
  // SSO and audit logs are explicitly tracked
  if (featureKey === 'sso' || featureKey === 'saml' || featureKey === 'audit_logs') {
    return plan.ssoAndAuditEnabled;
  }
  
  // Other enterprise features only available on ENTERPRISE plan
  if (planId === 'INSIGHT_ENTERPRISE') {
    return true;
  }
  
  return false;
}

/**
 * Check if a detector is enabled for a plan
 * 
 * @param planId - The plan to check
 * @param detectorName - The detector name to check
 * @returns True if detector is enabled
 * 
 * @example
 * ```typescript
 * isDetectorEnabled('INSIGHT_FREE', 'typescript'); // true
 * isDetectorEnabled('INSIGHT_FREE', 'security'); // false
 * isDetectorEnabled('INSIGHT_PRO', 'security'); // true
 * ```
 */
export function isDetectorEnabled(
  planId: InsightPlanId, 
  detectorName: string
): boolean {
  const plan = getInsightPlan(planId);
  return plan.enabledDetectors.includes(detectorName);
}

/**
 * Get all enabled detectors for a plan
 * 
 * @param planId - The plan to check
 * @returns Array of enabled detector names
 */
export function getEnabledDetectors(planId: InsightPlanId): readonly string[] {
  const plan = getInsightPlan(planId);
  return plan.enabledDetectors;
}

/**
 * Check if usage is within plan limits
 * 
 * @param planId - The plan to check
 * @param usage - Current usage metrics
 * @returns True if within limits, false if exceeded
 * 
 * @example
 * ```typescript
 * const withinLimits = isWithinLimits('INSIGHT_PRO', {
 *   projectCount: 5,
 *   concurrentAnalyses: 2,
 *   filesInAnalysis: 500
 * });
 * ```
 */
export function isWithinLimits(
  planId: InsightPlanId,
  usage: {
    projectCount?: number;
    concurrentAnalyses?: number;
    filesInAnalysis?: number;
  }
): boolean {
  const limits = getAnalysisLimits(planId);
  
  // Check project limit
  if (usage.projectCount !== undefined && limits.maxProjects !== -1) {
    if (usage.projectCount > limits.maxProjects) {
      return false;
    }
  }
  
  // Check concurrent analyses limit
  if (usage.concurrentAnalyses !== undefined && limits.maxConcurrentAnalyses !== -1) {
    if (usage.concurrentAnalyses > limits.maxConcurrentAnalyses) {
      return false;
    }
  }
  
  // Check files per analysis limit
  if (usage.filesInAnalysis !== undefined && limits.maxFilesPerAnalysis !== -1) {
    if (usage.filesInAnalysis > limits.maxFilesPerAnalysis) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get comprehensive entitlement check with context
 * 
 * @param context - Entitlement context
 * @param featureKey - Optional specific feature to check
 * @returns Entitlement result
 * 
 * @example
 * ```typescript
 * const result = checkEntitlement({
 *   planId: 'INSIGHT_PRO',
 *   isTrial: true
 * }, 'sso');
 * 
 * if (result.allowed) {
 *   // Feature is enabled
 * } else {
 *   console.log(result.reason); // Upgrade required
 * }
 * ```
 */
export function checkEntitlement(
  context: EntitlementContext,
  featureKey?: EnterpriseFeature
): { allowed: boolean; reason?: string } {
  const { planId, customEntitlements, isInternalPreview } = context;
  
  // Internal preview accounts get all features
  if (isInternalPreview) {
    return { allowed: true, reason: 'Internal preview access' };
  }
  
  // Check custom entitlements override
  if (featureKey && customEntitlements?.[featureKey] !== undefined) {
    return { 
      allowed: customEntitlements[featureKey]!,
      reason: customEntitlements[featureKey] ? 'Custom entitlement' : 'Disabled by admin'
    };
  }
  
  // Check specific feature if provided
  if (featureKey) {
    const enabled = isEnterpriseFeatureEnabled(planId, featureKey);
    return {
      allowed: enabled,
      reason: enabled ? undefined : 'Upgrade to Enterprise required'
    };
  }
  
  // General access check - all valid plan IDs have basic access
  return { allowed: true };
}

/**
 * Get recommended upgrade path
 * 
 * @param currentPlanId - Current plan
 * @param desiredFeature - Feature user wants
 * @returns Recommended plan to upgrade to
 * 
 * @example
 * ```typescript
 * const upgrade = getUpgradeRecommendation('INSIGHT_FREE', 'cloud_dashboard');
 * console.log(upgrade); // 'INSIGHT_PRO'
 * ```
 */
export function getUpgradeRecommendation(
  currentPlanId: InsightPlanId,
  desiredFeature: 'cloud' | 'team' | 'enterprise'
): InsightPlanId | null {
  if (currentPlanId === 'INSIGHT_ENTERPRISE') {
    return null; // Already on highest plan
  }
  
  switch (desiredFeature) {
    case 'cloud':
      return 'INSIGHT_PRO';
    case 'team':
      return 'INSIGHT_TEAM';
    case 'enterprise':
      return 'INSIGHT_ENTERPRISE';
    default:
      return null;
  }
}

/**
 * Format limit value for display
 * 
 * @param limit - The limit value (-1 = unlimited)
 * @returns Formatted string
 */
export function formatLimit(limit: number): string {
  return limit === -1 ? 'Unlimited' : limit.toString();
}

/**
 * Calculate trial status from trial end date
 * 
 * @param trialEndsAt - ISO date string when trial ends
 * @returns Trial configuration with days remaining
 * 
 * @example
 * ```typescript
 * const trial = getTrialStatus('2025-12-25T00:00:00Z');
 * console.log(trial.daysRemaining); // Days until trial ends
 * console.log(trial.isTrial); // true if still active
 * ```
 */
export function getTrialStatus(trialEndsAt: string | null): TrialConfig {
  if (!trialEndsAt) {
    return { isTrial: false };
  }
  
  const now = new Date();
  const endDate = new Date(trialEndsAt);
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    isTrial: daysRemaining > 0,
    trialEndsAt,
    daysRemaining: Math.max(0, daysRemaining),
  };
}

/**
 * Check if user has exceeded daily analysis limit
 * 
 * @param planId - Current plan
 * @param analysesToday - Number of analyses run today
 * @param trialConfig - Optional trial configuration
 * @returns Limit check result
 * 
 * @example
 * ```typescript
 * const result = checkDailyLimit('INSIGHT_FREE', 6);
 * if (result.exceeded) {
 *   console.log(result.message); // "Daily limit of 5 analyses exceeded"
 * }
 * ```
 */
export function checkDailyLimit(
  planId: InsightPlanId,
  analysesToday: number,
  trialConfig?: TrialConfig
): { exceeded: boolean; limit: number; remaining: number; message?: string } {
  const limits = getAnalysisLimits(planId, trialConfig);
  const { maxAnalysesPerDay } = limits;
  
  // Unlimited plans
  if (maxAnalysesPerDay === -1) {
    return {
      exceeded: false,
      limit: -1,
      remaining: -1,
    };
  }
  
  const exceeded = analysesToday >= maxAnalysesPerDay;
  const remaining = Math.max(0, maxAnalysesPerDay - analysesToday);
  
  return {
    exceeded,
    limit: maxAnalysesPerDay,
    remaining,
    message: exceeded
      ? `Daily limit of ${maxAnalysesPerDay} analyses exceeded. Upgrade for more.`
      : undefined,
  };
}

/**
 * Get effective plan ID considering trial status
 * 
 * @param basePlanId - User's base plan
 * @param trialConfig - Trial configuration
 * @returns Effective plan ID to use for entitlements
 */
export function getEffectivePlanId(
  basePlanId: InsightPlanId,
  trialConfig?: TrialConfig
): InsightPlanId {
  if (trialConfig?.isTrial && trialConfig.trialPlanId) {
    return trialConfig.trialPlanId;
  }
  return basePlanId;
}

/**
 * Create a 14-day PRO trial configuration
 * 
 * @returns Trial configuration for new users
 */
export function createProTrial(): TrialConfig {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
  
  return {
    isTrial: true,
    trialEndsAt: trialEnd.toISOString(),
    trialPlanId: 'INSIGHT_PRO',
    daysRemaining: 14,
  };
}
