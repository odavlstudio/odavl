/**
 * Feature Flags for Billing System
 * Phase 3.0.5: Production Launch Hardening
 * 
 * Provides safe launch controls for billing features.
 */

export interface FeatureFlags {
  billingEnabled: boolean;
  allowPlanSwitching: boolean;
  allowDowngrades: boolean;
  enforceAbuseProtection: boolean;
}

/**
 * Get feature flags from environment variables
 */
export function getFeatureFlags(): FeatureFlags {
  return {
    // Main billing toggle - all billing operations
    billingEnabled: process.env.INSIGHT_BILLING_ENABLED === 'true',
    
    // Allow switching between PRO/TEAM tiers
    allowPlanSwitching: process.env.INSIGHT_ALLOW_PLAN_SWITCHING !== 'false',
    
    // Allow downgrading to FREE
    allowDowngrades: process.env.INSIGHT_ALLOW_DOWNGRADES !== 'false',
    
    // Enforce abuse protection rules
    enforceAbuseProtection: process.env.INSIGHT_ENFORCE_ABUSE_PROTECTION !== 'false',
  };
}

/**
 * Check if billing is enabled
 */
export function isBillingEnabled(): boolean {
  return getFeatureFlags().billingEnabled;
}

/**
 * Check if plan switching is allowed
 */
export function isPlanSwitchingAllowed(): boolean {
  return getFeatureFlags().allowPlanSwitching;
}

/**
 * Check if downgrades are allowed
 */
export function isDowngradeAllowed(): boolean {
  return getFeatureFlags().allowDowngrades;
}

/**
 * Check if abuse protection is enforced
 */
export function isAbuseProtectionEnforced(): boolean {
  return getFeatureFlags().enforceAbuseProtection;
}

/**
 * Validate billing environment at boot
 * Throws if billing is enabled but required config is missing
 */
export function validateBillingEnvironment(): void {
  if (!isBillingEnabled()) {
    console.log('[Billing] Billing is disabled (INSIGHT_BILLING_ENABLED=false)');
    return;
  }

  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'JWT_SECRET',
    'NEXT_PUBLIC_APP_URL',
  ];

  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(
      `[Billing] Billing is enabled but missing required environment variables: ${missing.join(', ')}`
    );
  }

  console.log('[Billing] Billing is enabled and environment validated ✓');
}
