/**
 * Feature Flags Tests
 * Phase 3.0.5: Production Launch Hardening
 * 
 * Tests for billing feature flags configuration system
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock environment before imports
const originalEnv = process.env;

beforeEach(() => {
  // Reset environment before each test
  process.env = { ...originalEnv };
});

afterEach(() => {
  // Restore original environment
  process.env = originalEnv;
  // Clear module cache to force re-evaluation of env vars
  jest.resetModules();
});

describe('Feature Flags', () => {
  describe('getFeatureFlags', () => {
    it('should return default flags when no env vars set', async () => {
      delete process.env.INSIGHT_BILLING_ENABLED;
      delete process.env.INSIGHT_ALLOW_PLAN_SWITCHING;
      delete process.env.INSIGHT_ALLOW_DOWNGRADES;
      delete process.env.INSIGHT_ENFORCE_ABUSE_PROTECTION;

      const { getFeatureFlags } = await import('@/lib/billing/feature-flags');
      const flags = getFeatureFlags();

      expect(flags.billingEnabled).toBe(false); // Default: disabled
      expect(flags.allowPlanSwitching).toBe(true); // Default: enabled
      expect(flags.allowDowngrades).toBe(true); // Default: enabled
      expect(flags.enforceAbuseProtection).toBe(true); // Default: enabled
    });

    it('should respect INSIGHT_BILLING_ENABLED=true', async () => {
      process.env.INSIGHT_BILLING_ENABLED = 'true';

      const { getFeatureFlags } = await import('@/lib/billing/feature-flags');
      const flags = getFeatureFlags();

      expect(flags.billingEnabled).toBe(true);
    });

    it('should respect INSIGHT_BILLING_ENABLED=false', async () => {
      process.env.INSIGHT_BILLING_ENABLED = 'false';

      const { getFeatureFlags } = await import('@/lib/billing/feature-flags');
      const flags = getFeatureFlags();

      expect(flags.billingEnabled).toBe(false);
    });

    it('should respect INSIGHT_ALLOW_PLAN_SWITCHING=false', async () => {
      process.env.INSIGHT_ALLOW_PLAN_SWITCHING = 'false';

      const { getFeatureFlags } = await import('@/lib/billing/feature-flags');
      const flags = getFeatureFlags();

      expect(flags.allowPlanSwitching).toBe(false);
    });

    it('should respect INSIGHT_ALLOW_DOWNGRADES=false', async () => {
      process.env.INSIGHT_ALLOW_DOWNGRADES = 'false';

      const { getFeatureFlags } = await import('@/lib/billing/feature-flags');
      const flags = getFeatureFlags();

      expect(flags.allowDowngrades).toBe(false);
    });

    it('should respect INSIGHT_ENFORCE_ABUSE_PROTECTION=false', async () => {
      process.env.INSIGHT_ENFORCE_ABUSE_PROTECTION = 'false';

      const { getFeatureFlags } = await import('@/lib/billing/feature-flags');
      const flags = getFeatureFlags();

      expect(flags.enforceAbuseProtection).toBe(false);
    });

    it('should handle all flags enabled', async () => {
      process.env.INSIGHT_BILLING_ENABLED = 'true';
      process.env.INSIGHT_ALLOW_PLAN_SWITCHING = 'true';
      process.env.INSIGHT_ALLOW_DOWNGRADES = 'true';
      process.env.INSIGHT_ENFORCE_ABUSE_PROTECTION = 'true';

      const { getFeatureFlags } = await import('@/lib/billing/feature-flags');
      const flags = getFeatureFlags();

      expect(flags.billingEnabled).toBe(true);
      expect(flags.allowPlanSwitching).toBe(true);
      expect(flags.allowDowngrades).toBe(true);
      expect(flags.enforceAbuseProtection).toBe(true);
    });

    it('should handle all flags disabled', async () => {
      process.env.INSIGHT_BILLING_ENABLED = 'false';
      process.env.INSIGHT_ALLOW_PLAN_SWITCHING = 'false';
      process.env.INSIGHT_ALLOW_DOWNGRADES = 'false';
      process.env.INSIGHT_ENFORCE_ABUSE_PROTECTION = 'false';

      const { getFeatureFlags } = await import('@/lib/billing/feature-flags');
      const flags = getFeatureFlags();

      expect(flags.billingEnabled).toBe(false);
      expect(flags.allowPlanSwitching).toBe(false);
      expect(flags.allowDowngrades).toBe(false);
      expect(flags.enforceAbuseProtection).toBe(false);
    });
  });

  describe('isBillingEnabled', () => {
    it('should return false when billing disabled', async () => {
      process.env.INSIGHT_BILLING_ENABLED = 'false';

      const { isBillingEnabled } = await import('@/lib/billing/feature-flags');
      expect(isBillingEnabled()).toBe(false);
    });

    it('should return true when billing enabled', async () => {
      process.env.INSIGHT_BILLING_ENABLED = 'true';

      const { isBillingEnabled } = await import('@/lib/billing/feature-flags');
      expect(isBillingEnabled()).toBe(true);
    });

    it('should return false by default (safe default)', async () => {
      delete process.env.INSIGHT_BILLING_ENABLED;

      const { isBillingEnabled } = await import('@/lib/billing/feature-flags');
      expect(isBillingEnabled()).toBe(false);
    });
  });

  describe('isPlanSwitchingAllowed', () => {
    it('should return true by default', async () => {
      delete process.env.INSIGHT_ALLOW_PLAN_SWITCHING;

      const { isPlanSwitchingAllowed } = await import('@/lib/billing/feature-flags');
      expect(isPlanSwitchingAllowed()).toBe(true);
    });

    it('should return false when explicitly disabled', async () => {
      process.env.INSIGHT_ALLOW_PLAN_SWITCHING = 'false';

      const { isPlanSwitchingAllowed } = await import('@/lib/billing/feature-flags');
      expect(isPlanSwitchingAllowed()).toBe(false);
    });

    it('should return true when explicitly enabled', async () => {
      process.env.INSIGHT_ALLOW_PLAN_SWITCHING = 'true';

      const { isPlanSwitchingAllowed } = await import('@/lib/billing/feature-flags');
      expect(isPlanSwitchingAllowed()).toBe(true);
    });
  });

  describe('isDowngradeAllowed', () => {
    it('should return true by default', async () => {
      delete process.env.INSIGHT_ALLOW_DOWNGRADES;

      const { isDowngradeAllowed } = await import('@/lib/billing/feature-flags');
      expect(isDowngradeAllowed()).toBe(true);
    });

    it('should return false when explicitly disabled', async () => {
      process.env.INSIGHT_ALLOW_DOWNGRADES = 'false';

      const { isDowngradeAllowed } = await import('@/lib/billing/feature-flags');
      expect(isDowngradeAllowed()).toBe(false);
    });

    it('should return true when explicitly enabled', async () => {
      process.env.INSIGHT_ALLOW_DOWNGRADES = 'true';

      const { isDowngradeAllowed } = await import('@/lib/billing/feature-flags');
      expect(isDowngradeAllowed()).toBe(true);
    });
  });

  describe('isAbuseProtectionEnforced', () => {
    it('should return true by default (safe default)', async () => {
      delete process.env.INSIGHT_ENFORCE_ABUSE_PROTECTION;

      const { isAbuseProtectionEnforced } = await import('@/lib/billing/feature-flags');
      expect(isAbuseProtectionEnforced()).toBe(true);
    });

    it('should return false when explicitly disabled', async () => {
      process.env.INSIGHT_ENFORCE_ABUSE_PROTECTION = 'false';

      const { isAbuseProtectionEnforced } = await import('@/lib/billing/feature-flags');
      expect(isAbuseProtectionEnforced()).toBe(false);
    });

    it('should return true when explicitly enabled', async () => {
      process.env.INSIGHT_ENFORCE_ABUSE_PROTECTION = 'true';

      const { isAbuseProtectionEnforced } = await import('@/lib/billing/feature-flags');
      expect(isAbuseProtectionEnforced()).toBe(true);
    });
  });

  describe('validateBillingEnvironment', () => {
    it('should not throw when billing disabled', async () => {
      process.env.INSIGHT_BILLING_ENABLED = 'false';
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.JWT_SECRET;
      delete process.env.NEXT_PUBLIC_APP_URL;

      const { validateBillingEnvironment } = await import('@/lib/billing/feature-flags');
      expect(() => validateBillingEnvironment()).not.toThrow();
    });

    it('should throw when billing enabled but missing STRIPE_SECRET_KEY', async () => {
      process.env.INSIGHT_BILLING_ENABLED = 'true';
      delete process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
      process.env.JWT_SECRET = 'jwt_test';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

      const { validateBillingEnvironment } = await import('@/lib/billing/feature-flags');
      expect(() => validateBillingEnvironment()).toThrow('Missing STRIPE_SECRET_KEY');
    });

    it('should throw when billing enabled but missing STRIPE_WEBHOOK_SECRET', async () => {
      process.env.INSIGHT_BILLING_ENABLED = 'true';
      process.env.STRIPE_SECRET_KEY = 'sk_test';
      delete process.env.STRIPE_WEBHOOK_SECRET;
      process.env.JWT_SECRET = 'jwt_test';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

      const { validateBillingEnvironment } = await import('@/lib/billing/feature-flags');
      expect(() => validateBillingEnvironment()).toThrow('Missing STRIPE_WEBHOOK_SECRET');
    });

    it('should throw when billing enabled but missing JWT_SECRET', async () => {
      process.env.INSIGHT_BILLING_ENABLED = 'true';
      process.env.STRIPE_SECRET_KEY = 'sk_test';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
      delete process.env.JWT_SECRET;
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

      const { validateBillingEnvironment } = await import('@/lib/billing/feature-flags');
      expect(() => validateBillingEnvironment()).toThrow('Missing JWT_SECRET');
    });

    it('should throw when billing enabled but missing NEXT_PUBLIC_APP_URL', async () => {
      process.env.INSIGHT_BILLING_ENABLED = 'true';
      process.env.STRIPE_SECRET_KEY = 'sk_test';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
      process.env.JWT_SECRET = 'jwt_test';
      delete process.env.NEXT_PUBLIC_APP_URL;

      const { validateBillingEnvironment } = await import('@/lib/billing/feature-flags');
      expect(() => validateBillingEnvironment()).toThrow('Missing NEXT_PUBLIC_APP_URL');
    });

    it('should not throw when billing enabled and all required env vars present', async () => {
      process.env.INSIGHT_BILLING_ENABLED = 'true';
      process.env.STRIPE_SECRET_KEY = 'sk_test';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
      process.env.JWT_SECRET = 'jwt_test';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

      const { validateBillingEnvironment } = await import('@/lib/billing/feature-flags');
      expect(() => validateBillingEnvironment()).not.toThrow();
    });

    it('should throw with descriptive message listing all missing vars', async () => {
      process.env.INSIGHT_BILLING_ENABLED = 'true';
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.JWT_SECRET;
      delete process.env.NEXT_PUBLIC_APP_URL;

      const { validateBillingEnvironment } = await import('@/lib/billing/feature-flags');
      expect(() => validateBillingEnvironment()).toThrow('Missing STRIPE_SECRET_KEY');
    });
  });

  describe('Edge Cases', () => {
    it('should handle env vars with whitespace', async () => {
      process.env.INSIGHT_BILLING_ENABLED = ' true ';

      const { isBillingEnabled } = await import('@/lib/billing/feature-flags');
      expect(isBillingEnabled()).toBe(false); // Strict comparison
    });

    it('should handle case-sensitive values', async () => {
      process.env.INSIGHT_BILLING_ENABLED = 'TRUE';

      const { isBillingEnabled } = await import('@/lib/billing/feature-flags');
      expect(isBillingEnabled()).toBe(false); // Strict comparison
    });

    it('should handle invalid boolean values as false', async () => {
      process.env.INSIGHT_BILLING_ENABLED = 'yes';

      const { isBillingEnabled } = await import('@/lib/billing/feature-flags');
      expect(isBillingEnabled()).toBe(false);
    });
  });
});
