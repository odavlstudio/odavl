/**
 * Stripe Billing Service
 * Handles subscription management and payment processing
 */

import Stripe from 'stripe';
import { SubscriptionPlan, PlanStatus } from '@odavl/types/multi-tenant';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export interface SubscriptionDetails {
  customerId: string;
  subscriptionId: string;
  plan: SubscriptionPlan;
  status: PlanStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export class StripeService {
  /**
   * Create Stripe customer
   */
  async createCustomer(data: {
    email: string;
    name: string;
    organizationId: string;
  }): Promise<string> {
    const customer = await stripe.customers.create({
      email: data.email,
      name: data.name,
      metadata: {
        organizationId: data.organizationId,
      },
    });

    return customer.id;
  }

  /**
   * Get customer
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      return customer.deleted ? null : customer;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(data: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    organizationId: string;
  }): Promise<CheckoutSession> {
    const session = await stripe.checkout.sessions.create({
      customer: data.customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: data.priceId,
          quantity: 1,
        },
      ],
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      metadata: {
        organizationId: data.organizationId,
      },
      subscription_data: {
        metadata: {
          organizationId: data.organizationId,
        },
      },
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  /**
   * Create billing portal session
   */
  async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<string> {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Get subscription details
   */
  async getSubscription(
    subscriptionId: string
  ): Promise<SubscriptionDetails | null> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      const plan = this.getPlanFromPriceId(subscription.items.data[0].price.id);
      const status = this.mapStripeStatus(subscription.status);

      return {
        customerId: subscription.customer as string,
        subscriptionId: subscription.id,
        plan,
        status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<void> {
    if (immediately) {
      await stripe.subscriptions.cancel(subscriptionId);
    } else {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<void> {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string
  ): Promise<SubscriptionDetails> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const updated = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'always_invoice',
    });

    const plan = this.getPlanFromPriceId(newPriceId);
    const status = this.mapStripeStatus(updated.status);

    return {
      customerId: updated.customer as string,
      subscriptionId: updated.id,
      plan,
      status,
      currentPeriodStart: new Date(updated.current_period_start * 1000),
      currentPeriodEnd: new Date(updated.current_period_end * 1000),
      cancelAtPeriodEnd: updated.cancel_at_period_end,
    };
  }

  /**
   * Get upcoming invoice
   */
  async getUpcomingInvoice(customerId: string): Promise<{
    amountDue: number;
    currency: string;
    periodStart: Date;
    periodEnd: Date;
  } | null> {
    try {
      const invoice = await stripe.invoices.retrieveUpcoming({
        customer: customerId,
      });

      return {
        amountDue: invoice.amount_due,
        currency: invoice.currency,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get invoices
   */
  async getInvoices(
    customerId: string,
    limit: number = 10
  ): Promise<Array<{
    id: string;
    number: string;
    status: string;
    amountDue: number;
    amountPaid: number;
    currency: string;
    created: Date;
    invoicePdf?: string;
  }>> {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
    });

    return invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number || '',
      status: invoice.status || 'draft',
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      created: new Date(invoice.created * 1000),
      invoicePdf: invoice.invoice_pdf || undefined,
    }));
  }

  /**
   * Handle webhook event
   */
  async handleWebhook(
    payload: string | Buffer,
    signature: string
  ): Promise<Stripe.Event> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    return event;
  }

  /**
   * Map Stripe status to PlanStatus
   */
  private mapStripeStatus(status: Stripe.Subscription.Status): PlanStatus {
    switch (status) {
      case 'active':
        return 'ACTIVE';
      case 'past_due':
        return 'PAST_DUE';
      case 'canceled':
      case 'unpaid':
        return 'CANCELED';
      case 'trialing':
        return 'TRIALING';
      default:
        return 'ACTIVE';
    }
  }

  /**
   * Get plan from Stripe price ID
   */
  private getPlanFromPriceId(priceId: string): SubscriptionPlan {
    // Map Stripe price IDs to plans
    const priceMap: Record<string, SubscriptionPlan> = {
      [process.env.STRIPE_STARTER_PRICE_ID || '']: 'STARTER',
      [process.env.STRIPE_PROFESSIONAL_PRICE_ID || '']: 'PROFESSIONAL',
      [process.env.STRIPE_ENTERPRISE_PRICE_ID || '']: 'ENTERPRISE',
    };

    return priceMap[priceId] || 'FREE';
  }

  /**
   * Get price ID from plan
   */
  getPriceIdFromPlan(plan: SubscriptionPlan): string | null {
    const priceMap: Record<SubscriptionPlan, string> = {
      FREE: '',
      STARTER: process.env.STRIPE_STARTER_PRICE_ID || '',
      PROFESSIONAL: process.env.STRIPE_PROFESSIONAL_PRICE_ID || '',
      ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
    };

    return priceMap[plan] || null;
  }
}

export const stripeService = new StripeService();
