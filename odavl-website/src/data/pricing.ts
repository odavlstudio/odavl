/**
 * ODAVL Pricing Data Model
 * Canonical source for pricing tiers, features, and billing configuration
 */

export interface PricingTier {
  id: string;
  name: string;
  priceMonthly: number | 'custom';
  priceDisplay: string;
  seatsLimit?: number;
  features: string[];
  ctaLabel: string;
  ctaType: 'trial' | 'contact' | 'checkout';
  badge?: string;
  popular?: boolean;
}

export const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Dev Solo',
    priceMonthly: 0,
    priceDisplay: 'Free',
    seatsLimit: 1,
    features: [
      'CLI + VS Code Extension',
      '1 repository',
      'Basic ESLint fixes',
      'No telemetry collection',
      'Community support'
    ],
    ctaLabel: 'Get Started Free',
    ctaType: 'trial',
    badge: 'Open Source'
  },
  {
    id: 'pro',
    name: 'Team Pro',
    priceMonthly: 69,
    priceDisplay: '$69',
    seatsLimit: 10,
    features: [
      'Unlimited repositories',
      'Advanced fix recipes',
      'Trust learning system',
      'Weekly auto-reports',
      'GitHub/GitLab integration',
      'Priority email support'
    ],
    ctaLabel: 'Start 14-Day Trial',
    ctaType: 'checkout',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 'custom',
    priceDisplay: 'Custom',
    features: [
      'SSO & SAML integration',
      'On-premise deployment',
      '24/7 dedicated support',
      'Data Processing Agreement',
      'SLA guarantees',
      'Custom recipe development'
    ],
    ctaLabel: 'Contact Sales',
    ctaType: 'contact'
  }
];

export const billingConfig = {
  trialDays: 14,
  billingCycle: 'monthly',
  refundPeriod: 30,
  currency: 'USD'
};