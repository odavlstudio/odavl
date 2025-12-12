/**
 * ODAVL Insight Product Configuration
 * 
 * Single source of truth for Insight plans, pricing, and limits.
 * Used by: CLI, SDK, VS Code extension, Cloud dashboard
 * 
 * @module insight-product
 */

/**
 * Insight plan identifiers (strongly typed)
 */
export type InsightPlanId = 
  | 'INSIGHT_FREE' 
  | 'INSIGHT_PRO' 
  | 'INSIGHT_TEAM' 
  | 'INSIGHT_ENTERPRISE';

/**
 * Insight plan configuration
 */
export interface InsightPlan {
  /** Unique plan identifier */
  readonly id: InsightPlanId;
  
  /** SKU for billing/commerce systems */
  readonly sku: string;
  
  /** Display name for UI */
  readonly displayName: string;
  
  /** Monthly price in USD */
  readonly monthlyPrice: number;
  
  /** Yearly price in USD (typically discounted) */
  readonly yearlyPrice: number;
  
  /** Maximum number of projects */
  readonly maxProjects: number;
  
  /** Maximum concurrent analysis runs */
  readonly maxConcurrentAnalyses: number;
  
  /** Maximum files per single analysis */
  readonly maxFilesPerAnalysis: number;
  
  /** Maximum analyses per day (-1 = unlimited) */
  readonly maxAnalysesPerDay: number;
  
  /** Historical data retention in days */
  readonly historicalRetentionDays: number;
  
  /** Cloud dashboard access enabled */
  readonly cloudDashboardEnabled: boolean;
  
  /** Team collaboration features enabled */
  readonly teamCollaborationEnabled: boolean;
  
  /** SSO & audit logs enabled */
  readonly ssoAndAuditEnabled: boolean;
  
  /** List of enabled detectors */
  readonly enabledDetectors: readonly string[];
  
  /** Additional feature flags */
  readonly features: readonly string[];
  
  /** Description for marketing/docs */
  readonly description: string;
  
  /** Popular badge for UI */
  readonly popular?: boolean;
}

/**
 * Insight Product Plans - Central Configuration
 * 
 * DO NOT hard-code these values elsewhere in the codebase.
 * Import from this module instead.
 */
export const INSIGHT_PLANS: Record<InsightPlanId, InsightPlan> = {
  INSIGHT_FREE: {
    id: 'INSIGHT_FREE',
    sku: 'insight_free_v1',
    displayName: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxProjects: 3,
    maxConcurrentAnalyses: 1,
    maxFilesPerAnalysis: 100,
    maxAnalysesPerDay: 5,
    historicalRetentionDays: 7,
    cloudDashboardEnabled: false,
    teamCollaborationEnabled: false,
    ssoAndAuditEnabled: false,
    enabledDetectors: [
      'typescript',
      'eslint',
      'import',
    ],
    features: [
      'Local analysis only',
      'VS Code extension',
      'Basic detectors (3)',
      'Problems Panel integration',
      '7-day history',
      'Community support',
      'JSON/CSV export',
    ],
    description: 'Perfect for individual developers and learning',
  },

  INSIGHT_PRO: {
    id: 'INSIGHT_PRO',
    sku: 'insight_pro_v1',
    displayName: 'Pro',
    monthlyPrice: 29,
    yearlyPrice: 290, // 17% discount
    maxProjects: 10,
    maxConcurrentAnalyses: 3,
    maxFilesPerAnalysis: 1000,
    maxAnalysesPerDay: 50,
    historicalRetentionDays: 90,
    cloudDashboardEnabled: true,
    teamCollaborationEnabled: false,
    ssoAndAuditEnabled: false,
    enabledDetectors: [
      'typescript',
      'eslint',
      'import',
      'security',
      'performance',
      'complexity',
      'circular',
      'package',
      'runtime',
      'build',
      'network',
    ],
    features: [
      'All Free features',
      'Cloud dashboard',
      'All 11 stable detectors',
      'ML-powered insights',
      'Auto-fix suggestions',
      'Advanced reports (HTML, PDF)',
      '90-day history',
      'Priority email support',
      'CI/CD integration',
    ],
    description: 'For professional developers and consultants',
    popular: true,
  },

  INSIGHT_TEAM: {
    id: 'INSIGHT_TEAM',
    sku: 'insight_team_v1',
    displayName: 'Team',
    monthlyPrice: 99,
    yearlyPrice: 990, // 17% discount
    maxProjects: 50,
    maxConcurrentAnalyses: 10,
    maxFilesPerAnalysis: 5000,
    maxAnalysesPerDay: 200,
    historicalRetentionDays: 180,
    cloudDashboardEnabled: true,
    teamCollaborationEnabled: true,
    ssoAndAuditEnabled: false,
    enabledDetectors: [
      'typescript',
      'eslint',
      'import',
      'security',
      'performance',
      'complexity',
      'circular',
      'package',
      'runtime',
      'build',
      'network',
      'python-types',
      'python-security',
      'python-complexity',
    ],
    features: [
      'All Pro features',
      'Team collaboration (up to 10 members)',
      'Shared configurations',
      'Team dashboard',
      'All detectors (14 total)',
      'Custom detector configs',
      'Slack/Discord integration',
      '180-day history',
      'Priority support (24h SLA)',
      'API access',
    ],
    description: 'For growing teams and agencies',
  },

  INSIGHT_ENTERPRISE: {
    id: 'INSIGHT_ENTERPRISE',
    sku: 'insight_enterprise_v1',
    displayName: 'Enterprise',
    monthlyPrice: 299,
    yearlyPrice: 2990, // 17% discount
    maxProjects: -1, // unlimited
    maxConcurrentAnalyses: -1, // unlimited
    maxFilesPerAnalysis: -1, // unlimited
    maxAnalysesPerDay: -1, // unlimited
    historicalRetentionDays: 365,
    cloudDashboardEnabled: true,
    teamCollaborationEnabled: true,
    ssoAndAuditEnabled: true,
    enabledDetectors: [
      // All detectors enabled
      'typescript',
      'eslint',
      'import',
      'security',
      'performance',
      'complexity',
      'circular',
      'package',
      'runtime',
      'build',
      'network',
      'python-types',
      'python-security',
      'python-complexity',
      'isolation',
    ],
    features: [
      'All Team features',
      'Unlimited projects & analyses',
      'Unlimited team members',
      'SSO/SAML authentication',
      'Advanced RBAC',
      'Audit logging',
      'Compliance reports (SOC2, HIPAA)',
      'Custom detectors',
      'On-premise deployment option',
      '365-day history',
      'Dedicated support (4h SLA)',
      'White-label options',
    ],
    description: 'For large organizations with compliance needs',
  },
} as const;

/**
 * Get plan configuration by ID
 * 
 * @param planId - The plan identifier
 * @returns Plan configuration
 * @throws Error if plan ID is invalid
 * 
 * @example
 * ```typescript
 * const plan = getInsightPlan('INSIGHT_PRO');
 * console.log(plan.monthlyPrice); // 29
 * ```
 */
export function getInsightPlan(planId: InsightPlanId): InsightPlan {
  const plan = INSIGHT_PLANS[planId];
  
  if (!plan) {
    throw new Error(`Invalid Insight plan ID: ${planId}`);
  }
  
  return plan;
}

/**
 * Get all available plan IDs
 * 
 * @returns Array of plan identifiers
 */
export function getAllInsightPlanIds(): readonly InsightPlanId[] {
  return Object.keys(INSIGHT_PLANS) as InsightPlanId[];
}

/**
 * Check if a plan ID is valid
 * 
 * @param planId - The plan identifier to check
 * @returns True if valid, false otherwise
 */
export function isValidInsightPlanId(planId: string): planId is InsightPlanId {
  return planId in INSIGHT_PLANS;
}

/**
 * Get plan by SKU
 * 
 * @param sku - The SKU to look up
 * @returns Plan configuration or undefined if not found
 */
export function getInsightPlanBySku(sku: string): InsightPlan | undefined {
  return Object.values(INSIGHT_PLANS).find(plan => plan.sku === sku);
}
