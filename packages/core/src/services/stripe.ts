/**
 * Stripe Service Stub
 * Original implementation used Stripe API for billing
 */

export interface SubscriptionDetails {
  subscriptionId: string;
  customerId: string;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  plan?: string;
}

export interface CheckoutSession {
  id: string;
  sessionId: string;
  url: string;
}

export class StripeService {
  async createCustomer(data: { email: string; name: string; organizationId?: string }): Promise<string> {
    throw new Error('StripeService not implemented in packages/core. Use app-specific billing service.');
  }

  async createCheckoutSession(options: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    organizationId?: string;
  }): Promise<CheckoutSession> {
    throw new Error('StripeService not implemented in packages/core. Use app-specific billing service.');
  }

  async createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    throw new Error('StripeService not implemented in packages/core. Use app-specific billing service.');
  }

  async getSubscription(subscriptionId: string): Promise<SubscriptionDetails> {
    throw new Error('StripeService not implemented in packages/core. Use app-specific billing service.');
  }

  async cancelSubscription(subscriptionId: string, immediately?: boolean): Promise<void> {
    throw new Error('StripeService not implemented in packages/core. Use app-specific billing service.');
  }

  async updateSubscription(subscriptionId: string, priceId: string): Promise<SubscriptionDetails> {
    throw new Error('StripeService not implemented in packages/core. Use app-specific billing service.');
  }

  async getInvoices(customerId: string, limit?: number): Promise<any[]> {
    throw new Error('StripeService not implemented in packages/core. Use app-specific billing service.');
  }

  getPriceIdFromPlan(plan: string): string | null {
    throw new Error('StripeService not implemented in packages/core. Use app-specific billing service.');
  }

  async handleWebhook(body: string, signature: string): Promise<any> {
    throw new Error('StripeService not implemented in packages/core. Use app-specific billing service.');
  }
}

export const stripeService = new StripeService();
