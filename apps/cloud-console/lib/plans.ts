/**
 * ODAVL Subscription Plans
 * 
 * Three tiers: FREE, PRO, ENTERPRISE
 * FREE: 10 scans, readonly autopilot, 3 Guardian tests
 * PRO: Unlimited scans, full autopilot, unlimited Guardian tests
 * ENTERPRISE: Everything unlimited + priority support + custom integrations
 */

export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface PlanFeatures {
  // Insight features
  insightScans: number; // -1 = unlimited
  insightAnalysis: boolean;
  insightReports: boolean;
  insightHistory: number; // Days of history retention
  
  // Autopilot features
  autopilotMode: 'none' | 'readonly' | 'full';
  autopilotCycles: number; // -1 = unlimited
  autopilotRollback: boolean;
  
  // Guardian features
  guardianTests: number; // -1 = unlimited
  guardianMonitoring: boolean;
  guardianAlerts: boolean;
  
  // Collaboration features
  teamMembers: number; // -1 = unlimited
  apiAccess: boolean;
  webhooks: boolean;
  
  // Support features
  support: 'community' | 'email' | 'priority';
  customIntegrations: boolean;
  dedicatedSlack: boolean;
}

export interface Plan {
  tier: PlanTier;
  name: string;
  price: number; // Monthly price in USD
  priceId: string | null; // Stripe price ID
  description: string;
  features: PlanFeatures;
  popular?: boolean;
}

export const PLANS: Record<PlanTier, Plan> = {
  FREE: {
    tier: 'FREE',
    name: 'Free',
    price: 0,
    priceId: null,
    description: 'Perfect for individuals and small projects',
    features: {
      // Insight: 10 scans per month
      insightScans: 10,
      insightAnalysis: true,
      insightReports: true,
      insightHistory: 7, // 7 days retention
      
      // Autopilot: Read-only mode (view suggestions, no execution)
      autopilotMode: 'readonly',
      autopilotCycles: 0,
      autopilotRollback: false,
      
      // Guardian: 3 tests per month
      guardianTests: 3,
      guardianMonitoring: false,
      guardianAlerts: false,
      
      // Collaboration: Solo use
      teamMembers: 1,
      apiAccess: false,
      webhooks: false,
      
      // Support: Community only
      support: 'community',
      customIntegrations: false,
      dedicatedSlack: false,
    },
  },
  
  PRO: {
    tier: 'PRO',
    name: 'Pro',
    price: 19,
    priceId: process.env.STRIPE_PRICE_PRO || 'price_pro_monthly',
    description: 'For professional developers and growing teams',
    popular: true,
    features: {
      // Insight: Unlimited scans
      insightScans: -1,
      insightAnalysis: true,
      insightReports: true,
      insightHistory: 90, // 90 days retention
      
      // Autopilot: Full mode (execute fixes with rollback)
      autopilotMode: 'full',
      autopilotCycles: -1,
      autopilotRollback: true,
      
      // Guardian: Unlimited tests
      guardianTests: -1,
      guardianMonitoring: true,
      guardianAlerts: true,
      
      // Collaboration: Up to 5 team members
      teamMembers: 5,
      apiAccess: true,
      webhooks: true,
      
      // Support: Email support (24h response)
      support: 'email',
      customIntegrations: false,
      dedicatedSlack: false,
    },
  },
  
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    price: 99,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_monthly',
    description: 'For large teams with custom needs',
    features: {
      // Insight: Unlimited everything
      insightScans: -1,
      insightAnalysis: true,
      insightReports: true,
      insightHistory: 365, // 1 year retention
      
      // Autopilot: Full mode with priority execution
      autopilotMode: 'full',
      autopilotCycles: -1,
      autopilotRollback: true,
      
      // Guardian: Unlimited tests + advanced monitoring
      guardianTests: -1,
      guardianMonitoring: true,
      guardianAlerts: true,
      
      // Collaboration: Unlimited team members
      teamMembers: -1,
      apiAccess: true,
      webhooks: true,
      
      // Support: Priority support + custom integrations
      support: 'priority',
      customIntegrations: true,
      dedicatedSlack: true,
    },
  },
};

/**
 * Get plan by tier
 */
export function getPlan(tier: PlanTier): Plan {
  return PLANS[tier];
}

/**
 * Get all plans as array (for rendering pricing tables)
 */
export function getAllPlans(): Plan[] {
  return [PLANS.FREE, PLANS.PRO, PLANS.ENTERPRISE];
}

/**
 * Check if a feature is available for a plan
 */
export function hasFeature(tier: PlanTier, feature: keyof PlanFeatures): boolean {
  const plan = getPlan(tier);
  const value = plan.features[feature];
  
  // Handle boolean features
  if (typeof value === 'boolean') {
    return value;
  }
  
  // Handle numeric features (-1 = unlimited)
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  // Handle string features
  return value !== 'none';
}

/**
 * Get feature limit for a plan
 */
export function getFeatureLimit(tier: PlanTier, feature: keyof PlanFeatures): number {
  const plan = getPlan(tier);
  const value = plan.features[feature];
  
  if (typeof value === 'number') {
    return value;
  }
  
  return 0;
}
