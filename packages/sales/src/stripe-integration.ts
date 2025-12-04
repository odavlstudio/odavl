/**
 * Stripe Payment Integration
 * Handles subscriptions, trials, and billing for ODAVL Studio
 * Based on UNIFIED_ACTION_PLAN Phase 3 Week 17-18
 */

import Stripe from 'stripe';
import { z } from 'zod';

export const PricingPlanSchema = z.enum(['starter', 'pro', 'enterprise']);
export type PricingPlan = z.infer<typeof PricingPlanSchema>;

export interface PricingTier {
  id: PricingPlan;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  maxLOC: number;
  maxUsers: number;
  features: string[];
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  company?: string;
  plan: PricingPlan;
  billingCycle: 'monthly' | 'yearly';
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  status: 'trial' | 'active' | 'canceled' | 'past_due';
  createdAt: Date;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export class StripeIntegration {
  private stripe: Stripe;
  private pricingTiers: PricingTier[];

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
    });

    // Define pricing tiers (matches UNIFIED_ACTION_PLAN)
    this.pricingTiers = [
      {
        id: 'starter',
        name: 'Starter',
        priceMonthly: 29,
        priceYearly: 290, // ~17% discount
        maxLOC: 100000,
        maxUsers: 5,
        features: [
          '100K LOC analysis',
          '5 team members',
          '12 detectors',
          'Autopilot (78% auto-fix)',
          'VS Code extension',
          'CI/CD integration',
          'Email support',
        ],
        stripePriceIdMonthly: process.env.STRIPE_STARTER_MONTHLY || 'price_starter_monthly',
        stripePriceIdYearly: process.env.STRIPE_STARTER_YEARLY || 'price_starter_yearly',
      },
      {
        id: 'pro',
        name: 'Pro',
        priceMonthly: 99,
        priceYearly: 990, // ~17% discount
        maxLOC: 500000,
        maxUsers: -1, // Unlimited
        features: [
          '500K LOC analysis',
          'Unlimited users',
          'All Starter features',
          'SAML/SSO authentication',
          'RBAC (5 roles)',
          'Audit logging',
          'Team management',
          'Priority support',
          'Custom recipes',
        ],
        stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY || 'price_pro_monthly',
        stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY || 'price_pro_yearly',
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        priceMonthly: 500,
        priceYearly: 5000, // ~17% discount
        maxLOC: -1, // Unlimited
        maxUsers: -1, // Unlimited
        features: [
          'Unlimited LOC',
          'Unlimited users',
          'All Pro features',
          'On-premise deployment',
          'Custom SLA',
          'Dedicated support',
          'Training & onboarding',
          'Custom integrations',
          'Source code access',
        ],
        stripePriceIdMonthly: process.env.STRIPE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
        stripePriceIdYearly: process.env.STRIPE_ENTERPRISE_YEARLY || 'price_enterprise_yearly',
      },
    ];
  }

  /**
   * Get pricing tier details
   */
  getPricingTier(plan: PricingPlan): PricingTier {
    const tier = this.pricingTiers.find(t => t.id === plan);
    if (!tier) throw new Error(`Invalid plan: ${plan}`);
    return tier;
  }

  /**
   * Get all pricing tiers
   */
  getAllPricingTiers(): PricingTier[] {
    return this.pricingTiers;
  }

  /**
   * Create Stripe customer
   */
  async createCustomer(params: {
    email: string;
    name: string;
    company?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    const customer = await this.stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: {
        company: params.company || '',
        source: 'odavl_studio',
        ...params.metadata,
      },
    });

    console.log(`✅ Created Stripe customer: ${customer.id} (${params.email})`);
    return customer;
  }

  /**
   * Create subscription with trial
   */
  async createSubscription(params: {
    customerId: string;
    plan: PricingPlan;
    billingCycle: 'monthly' | 'yearly';
    trialDays?: number;
    coupon?: string;
  }): Promise<Stripe.Subscription> {
    const tier = this.getPricingTier(params.plan);
    const priceId = params.billingCycle === 'monthly' 
      ? tier.stripePriceIdMonthly 
      : tier.stripePriceIdYearly;

    const subscription = await this.stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: priceId }],
      trial_period_days: params.trialDays || 30, // Default: 30-day trial
      coupon: params.coupon,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        plan: params.plan,
        billing_cycle: params.billingCycle,
      },
    });

    console.log(`✅ Created subscription: ${subscription.id} (${params.plan}, ${params.billingCycle})`);
    return subscription;
  }

  /**
   * Create payment intent for one-time payment
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerId: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent> {
    const intent = await this.stripe.paymentIntents.create({
      amount: params.amount * 100, // Convert to cents
      currency: params.currency,
      customer: params.customerId,
      automatic_payment_methods: { enabled: true },
      metadata: params.metadata,
    });

    return {
      id: intent.id,
      amount: intent.amount / 100,
      currency: intent.currency,
      status: intent.status,
      clientSecret: intent.client_secret!,
    };
  }

  /**
   * Cancel subscription (at period end)
   */
  async cancelSubscription(subscriptionId: string, immediately = false): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: !immediately,
    });

    if (immediately) {
      await this.stripe.subscriptions.cancel(subscriptionId);
      console.log(`✅ Canceled subscription immediately: ${subscriptionId}`);
    } else {
      console.log(`✅ Scheduled cancellation at period end: ${subscriptionId}`);
    }

    return subscription;
  }

  /**
   * Upgrade/downgrade subscription
   */
  async changeSubscription(params: {
    subscriptionId: string;
    newPlan: PricingPlan;
    billingCycle: 'monthly' | 'yearly';
  }): Promise<Stripe.Subscription> {
    const tier = this.getPricingTier(params.newPlan);
    const priceId = params.billingCycle === 'monthly'
      ? tier.stripePriceIdMonthly
      : tier.stripePriceIdYearly;

    // Get current subscription
    const subscription = await this.stripe.subscriptions.retrieve(params.subscriptionId);

    // Update subscription items
    const subscription_updated = await this.stripe.subscriptions.update(params.subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
      proration_behavior: 'always_invoice', // Charge/credit prorated amount
      metadata: {
        plan: params.newPlan,
        billing_cycle: params.billingCycle,
      },
    });

    console.log(`✅ Changed subscription: ${params.subscriptionId} → ${params.newPlan}`);
    return subscription_updated;
  }

  /**
   * Get customer billing portal URL
   */
  async createBillingPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<string> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });

    return session.url;
  }

  /**
   * Create Checkout Session for new subscriptions
   */
  async createCheckoutSession(params: {
    customerId?: string;
    customerEmail?: string;
    plan: PricingPlan;
    billingCycle: 'monthly' | 'yearly';
    trialDays?: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    const tier = this.getPricingTier(params.plan);
    const priceId = params.billingCycle === 'monthly'
      ? tier.stripePriceIdMonthly
      : tier.stripePriceIdYearly;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      subscription_data: {
        trial_period_days: params.trialDays || 30,
        metadata: {
          plan: params.plan,
          billing_cycle: params.billingCycle,
        },
      },
    };

    if (params.customerId) {
      sessionParams.customer = params.customerId;
    } else if (params.customerEmail) {
      sessionParams.customer_email = params.customerEmail;
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    console.log(`✅ Created checkout session: ${session.id}`);
    return session;
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Promise<Stripe.Event> {
    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case 'customer.subscription.created':
        console.log('✅ Subscription created:', event.data.object.id);
        break;

      case 'customer.subscription.updated':
        console.log('✅ Subscription updated:', event.data.object.id);
        break;

      case 'customer.subscription.deleted':
        console.log('✅ Subscription canceled:', event.data.object.id);
        break;

      case 'invoice.payment_succeeded':
        console.log('✅ Payment succeeded:', event.data.object.id);
        break;

      case 'invoice.payment_failed':
        console.log('❌ Payment failed:', event.data.object.id);
        break;

      case 'customer.subscription.trial_will_end':
        console.log('⚠️ Trial ending soon:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return event;
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Get customer details
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    return await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
  }

  /**
   * List customer subscriptions
   */
  async listCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    const subscriptions = await this.stripe.subscriptions.list({
      customer: customerId,
      limit: 100,
    });

    return subscriptions.data;
  }

  /**
   * Apply coupon/discount
   */
  async applyCoupon(subscriptionId: string, couponId: string): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.update(subscriptionId, {
      coupon: couponId,
    });

    console.log(`✅ Applied coupon ${couponId} to subscription ${subscriptionId}`);
    return subscription;
  }

  /**
   * Calculate MRR (Monthly Recurring Revenue)
   */
  async calculateMRR(): Promise<{
    totalMRR: number;
    byPlan: Record<PricingPlan, { count: number; mrr: number }>;
  }> {
    const subscriptions = await this.stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    });

    let totalMRR = 0;
    const byPlan: Record<PricingPlan, { count: number; mrr: number }> = {
      starter: { count: 0, mrr: 0 },
      pro: { count: 0, mrr: 0 },
      enterprise: { count: 0, mrr: 0 },
    };

    for (const sub of subscriptions.data) {
      const plan = sub.metadata.plan as PricingPlan;
      const billingCycle = sub.metadata.billing_cycle as 'monthly' | 'yearly';

      if (!plan || !PricingPlanSchema.safeParse(plan).success) continue;

      const tier = this.getPricingTier(plan);
      const mrr = billingCycle === 'yearly' ? tier.priceYearly / 12 : tier.priceMonthly;

      totalMRR += mrr;
      byPlan[plan].count++;
      byPlan[plan].mrr += mrr;
    }

    return { totalMRR, byPlan };
  }
}

/**
 * Pricing Calculator Utilities
 */
export class PricingCalculator {
  /**
   * Calculate discount for yearly billing
   */
  static yearlyDiscount(monthlyPrice: number, yearlyPrice: number): number {
    return Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);
  }

  /**
   * Recommend plan based on LOC
   */
  static recommendPlan(loc: number): PricingPlan {
    if (loc < 100000) return 'starter';
    if (loc < 500000) return 'pro';
    return 'enterprise';
  }

  /**
   * Calculate cost savings vs SonarQube
   */
  static calculateSavings(plan: PricingPlan, billingCycle: 'monthly' | 'yearly'): {
    odavl: number;
    sonarqube: number;
    savings: number;
    savingsPercent: number;
  } {
    const odavlPricing = {
      starter: { monthly: 29, yearly: 290 },
      pro: { monthly: 99, yearly: 990 },
      enterprise: { monthly: 500, yearly: 5000 },
    };

    const sonarqubePricing = {
      starter: { monthly: 150, yearly: 1800 },
      pro: { monthly: 833, yearly: 10000 },
      enterprise: { monthly: 4167, yearly: 50000 },
    };

    const odavl = billingCycle === 'monthly' 
      ? odavlPricing[plan].monthly 
      : odavlPricing[plan].yearly / 12;

    const sonarqube = billingCycle === 'monthly'
      ? sonarqubePricing[plan].monthly
      : sonarqubePricing[plan].yearly / 12;

    const savings = sonarqube - odavl;
    const savingsPercent = Math.round((savings / sonarqube) * 100);

    return { odavl, sonarqube, savings, savingsPercent };
  }
}

export { Stripe };
