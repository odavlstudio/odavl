/**
 * ODAVL Studio Billing Types
 * Sprint 3: Billing Infrastructure
 */

// Subscription Tiers
export type SubscriptionTier = 'FREE' | 'PRO' | 'ENTERPRISE';

// Usage Types
export type UsageType =
  | 'ANALYSIS'       // Single detector run
  | 'PROJECT_CREATE' // New project created
  | 'STORAGE_WRITE'  // Data written to storage
  | 'API_CALL'       // API request
  | 'ML_PREDICTION'  // ML model inference
  | 'AUTO_FIX';      // Autopilot fix applied

// Product Tier Configuration
export interface ProductTier {
  id: SubscriptionTier;
  name: string;
  displayName: string;
  price: number; // USD per month
  yearlyPrice?: number; // USD per year (optional discount)
  limits: {
    maxProjects: number; // -1 = unlimited
    maxAnalysesPerMonth: number; // -1 = unlimited
    maxStorageGB: number; // -1 = unlimited
  };
  features: string[];
  popular?: boolean;
  description: string;
}

// Product Tier Definitions
export const PRODUCT_TIERS: Record<SubscriptionTier, ProductTier> = {
  FREE: {
    id: 'FREE',
    name: 'free',
    displayName: 'Free',
    price: 0,
    limits: {
      maxProjects: 3,
      maxAnalysesPerMonth: 100,
      maxStorageGB: 1,
    },
    features: [
      'Basic error detectors (TypeScript, ESLint)',
      'Problems Panel integration',
      'Up to 3 projects',
      '100 analyses per month',
      '1GB storage',
      'Community support',
      'Export to JSON/CSV',
    ],
    description: 'Perfect for individual developers and small projects',
  },
  PRO: {
    id: 'PRO',
    name: 'pro',
    displayName: 'Pro',
    price: 29,
    yearlyPrice: 290, // ~17% discount
    limits: {
      maxProjects: 10,
      maxAnalysesPerMonth: 1000,
      maxStorageGB: 10,
    },
    features: [
      'All Free features',
      'ML-powered error predictions',
      'Auto-fix suggestions (Autopilot)',
      'Advanced detectors (Security, Performance, Complexity)',
      'Up to 10 projects',
      '1,000 analyses per month',
      '10GB storage',
      'Priority email support',
      'Custom detector configurations',
      'Team sharing (up to 3 members)',
    ],
    popular: true,
    description: 'For professional developers and small teams',
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'enterprise',
    displayName: 'Enterprise',
    price: 299,
    yearlyPrice: 2990, // ~17% discount
    limits: {
      maxProjects: -1, // unlimited
      maxAnalysesPerMonth: -1, // unlimited
      maxStorageGB: 100,
    },
    features: [
      'All Pro features',
      'Unlimited projects & analyses',
      '100GB storage',
      'Custom rules & detectors',
      'SSO/SAML authentication',
      'Advanced RBAC (5 roles)',
      'Audit logging & compliance',
      'Dedicated support (SLA)',
      'On-premise deployment option',
      'Team management (unlimited members)',
      'API access & webhooks',
      'White-label options',
    ],
    description: 'For large teams and enterprises',
  },
};

// Usage Limits Interface
export interface UsageLimits {
  maxProjects: number;
  maxAnalysesPerMonth: number;
  maxStorageGB: number;
}

// Current Usage Interface
export interface CurrentUsage {
  projectsCount: number;
  usedAnalysesMonth: number;
  usedStorageGB: number;
}

// Subscription Status
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trialing';

// Subscription Interface
export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  limits: UsageLimits;
  usage: CurrentUsage;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  licenseKey?: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
}

// Usage Record Interface
export interface UsageRecord {
  id: string;
  subscriptionId: string;
  type: UsageType;
  amount: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Utility Functions
/**
 * Check if user can use a feature based on their tier
 */
export function canUseFeature(tier: SubscriptionTier, feature: string): boolean {
  const tierFeatures = PRODUCT_TIERS[tier].features;
  
  // Enterprise has access to everything
  if (tier === 'ENTERPRISE') return true;
  
  // Check if feature is in tier's feature list
  return tierFeatures.some((f) => f.toLowerCase().includes(feature.toLowerCase()));
}

/**
 * Check if usage is within limits
 */
export function isWithinLimit(
  current: number,
  max: number
): boolean {
  // -1 means unlimited
  if (max === -1) return true;
  return current < max;
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(current: number, max: number): number {
  if (max === -1) return 0; // Unlimited
  if (max === 0) return 100; // No limit set
  return Math.min(100, Math.round((current / max) * 100));
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(subscription: Subscription): boolean {
  if (subscription.status !== 'active') return false;
  const now = new Date();
  return now < subscription.currentPeriodEnd;
}

/**
 * Get days remaining in billing period
 */
export function getDaysRemaining(subscription: Subscription): number {
  const now = new Date();
  const end = new Date(subscription.currentPeriodEnd);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Format tier name for display
 */
export function formatTierName(tier: SubscriptionTier): string {
  return PRODUCT_TIERS[tier].displayName;
}

/**
 * Get tier by price (for upgrade/downgrade logic)
 */
export function getTierByPrice(price: number): SubscriptionTier | null {
  const tier = Object.values(PRODUCT_TIERS).find((t) => t.price === price);
  return tier?.id || null;
}

/**
 * Compare tiers (returns -1, 0, 1 like Array.sort)
 */
export function compareTiers(a: SubscriptionTier, b: SubscriptionTier): number {
  const order: SubscriptionTier[] = ['FREE', 'PRO', 'ENTERPRISE'];
  return order.indexOf(a) - order.indexOf(b);
}

/**
 * Check if upgrade is available
 */
export function canUpgradeTo(current: SubscriptionTier, target: SubscriptionTier): boolean {
  return compareTiers(target, current) > 0;
}

/**
 * Get next tier for upgrade suggestions
 */
export function getNextTier(current: SubscriptionTier): SubscriptionTier | null {
  if (current === 'FREE') return 'PRO';
  if (current === 'PRO') return 'ENTERPRISE';
  return null; // Already at highest tier
}

/**
 * Calculate prorated amount for mid-cycle upgrade
 */
export function calculateProratedAmount(
  currentTier: SubscriptionTier,
  newTier: SubscriptionTier,
  daysRemaining: number
): number {
  const currentPrice = PRODUCT_TIERS[currentTier].price;
  const newPrice = PRODUCT_TIERS[newTier].price;
  const priceDiff = newPrice - currentPrice;
  
  // Prorate for remaining days (30-day month)
  return Math.max(0, (priceDiff * daysRemaining) / 30);
}
