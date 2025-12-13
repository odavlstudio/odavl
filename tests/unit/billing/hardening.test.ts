/**
 * Billing Hardening Tests
 * Phase 3.0.5: Production Launch Hardening
 * 
 * Tests for checkout/webhook hardening features (feature flags, idempotency, audit logs)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
const mockIsBillingEnabled = vi.fn();
const mockIsAbuseProtectionEnforced = vi.fn();
const mockCheckForAbuse = vi.fn();
const mockLogBillingAction = vi.fn();

vi.mock('@/lib/billing/feature-flags', () => ({
  isBillingEnabled: () => mockIsBillingEnabled(),
  isAbuseProtectionEnforced: () => mockIsAbuseProtectionEnforced(),
}));

vi.mock('@/lib/billing/audit', () => ({
  BillingAction: {
    CHECKOUT_INITIATED: 'checkout.initiated',
    CHECKOUT_COMPLETED: 'checkout.completed',
    CHECKOUT_FAILED: 'checkout.failed',
    BILLING_DISABLED_ACCESS: 'billing.disabled.access',
    ABUSE_DETECTED: 'abuse.detected',
    SUBSCRIPTION_CREATED: 'subscription.created',
    SUBSCRIPTION_UPDATED: 'subscription.updated',
    SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
    PLAN_SWITCHED: 'plan.switched',
  },
  logBillingAction: (...args: any[]) => mockLogBillingAction(...args),
  checkForAbuse: (...args: any[]) => mockCheckForAbuse(...args),
}));

const mockStripeCheckoutCreate = vi.fn();
const mockPrismaFindUnique = vi.fn();
const mockPrismaFindFirst = vi.fn();
const mockPrismaCreate = vi.fn();
const mockPrismaUpdate = vi.fn();
const mockPrismaUpsert = vi.fn();

vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: (...args: any[]) => mockStripeCheckoutCreate(...args),
      },
    },
    customers: {
      create: vi.fn(() => ({ id: 'cus_test_123' })),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockPrismaFindUnique,
      update: mockPrismaUpdate,
    },
    subscription: {
      findUnique: mockPrismaFindUnique,
      findFirst: mockPrismaFindFirst,
      create: mockPrismaCreate,
      update: mockPrismaUpdate,
      upsert: mockPrismaUpsert,
    },
  },
}));

const mockWithAuth = vi.fn((handler) => handler);

vi.mock('@/lib/auth/withAuth', () => ({
  withAuth: (handler: any) => mockWithAuth(handler),
}));

describe('Billing Hardening', () => {
  beforeEach(() => {
    mockIsBillingEnabled.mockReset();
    mockIsAbuseProtectionEnforced.mockReset();
    mockCheckForAbuse.mockReset();
    mockLogBillingAction.mockReset();
    mockStripeCheckoutCreate.mockReset();
    mockPrismaFindUnique.mockReset();
    mockPrismaFindFirst.mockReset();
    mockPrismaCreate.mockReset();
    mockPrismaUpdate.mockReset();
    mockPrismaUpsert.mockReset();
  });

  describe('Checkout Endpoint Hardening', () => {
    it('should return 503 when billing disabled', async () => {
      mockIsBillingEnabled.mockReturnValue(false);

      const { POST } = await import('@/app/api/billing/checkout/route');
      const mockReq = new Request('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'PRO' }),
      });
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      const response = await POST(mockReq, mockUser);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('BILLING_DISABLED');
      expect(mockLogBillingAction).toHaveBeenCalledWith(
        'billing.disabled.access',
        'user_123',
        expect.objectContaining({ endpoint: 'checkout' }),
        mockReq
      );
    });

    it('should log checkout initiation when billing enabled', async () => {
      mockIsBillingEnabled.mockReturnValue(true);
      mockIsAbuseProtectionEnforced.mockReturnValue(false);
      mockPrismaFindUnique.mockResolvedValue({ id: 'user_123', email: 'test@example.com' });
      mockPrismaFindFirst.mockResolvedValue(null); // No existing subscription
      mockStripeCheckoutCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      const { POST } = await import('@/app/api/billing/checkout/route');
      const mockReq = new Request('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'PRO' }),
      });
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      await POST(mockReq, mockUser);

      expect(mockLogBillingAction).toHaveBeenCalledWith(
        'checkout.initiated',
        'user_123',
        expect.objectContaining({ tier: 'PRO' }),
        mockReq
      );
    });

    it('should return 429 when abuse detected', async () => {
      mockIsBillingEnabled.mockReturnValue(true);
      mockIsAbuseProtectionEnforced.mockReturnValue(true);
      mockCheckForAbuse.mockResolvedValue({
        isAbuse: true,
        reason: 'More than 3 checkout.initiated attempts in 24 hours',
        lastActionAt: new Date(),
      });

      const { POST } = await import('@/app/api/billing/checkout/route');
      const mockReq = new Request('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'PRO' }),
      });
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      const response = await POST(mockReq, mockUser);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('TOO_MANY_REQUESTS');
      expect(mockLogBillingAction).toHaveBeenCalledWith(
        'abuse.detected',
        'user_123',
        expect.objectContaining({ tier: 'PRO' }),
        mockReq
      );
    });

    it('should skip abuse check when protection disabled', async () => {
      mockIsBillingEnabled.mockReturnValue(true);
      mockIsAbuseProtectionEnforced.mockReturnValue(false);
      mockPrismaFindUnique.mockResolvedValue({ id: 'user_123', email: 'test@example.com' });
      mockPrismaFindFirst.mockResolvedValue(null);
      mockStripeCheckoutCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      const { POST } = await import('@/app/api/billing/checkout/route');
      const mockReq = new Request('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'PRO' }),
      });
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      await POST(mockReq, mockUser);

      expect(mockCheckForAbuse).not.toHaveBeenCalled();
    });

    it('should log invalid tier', async () => {
      mockIsBillingEnabled.mockReturnValue(true);
      mockIsAbuseProtectionEnforced.mockReturnValue(false);

      const { POST } = await import('@/app/api/billing/checkout/route');
      const mockReq = new Request('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'INVALID' }),
      });
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      const response = await POST(mockReq, mockUser);

      expect(response.status).toBe(400);
      expect(mockLogBillingAction).toHaveBeenCalledWith(
        'checkout.failed',
        'user_123',
        expect.objectContaining({ tier: 'INVALID', reason: 'invalid_tier' }),
        mockReq
      );
    });

    it('should log already subscribed error', async () => {
      mockIsBillingEnabled.mockReturnValue(true);
      mockIsAbuseProtectionEnforced.mockReturnValue(false);
      mockPrismaFindUnique.mockResolvedValue({ id: 'user_123', email: 'test@example.com' });
      mockPrismaFindFirst.mockResolvedValue({
        id: 'sub_123',
        userId: 'user_123',
        tier: 'PRO',
        status: 'active',
      });

      const { POST } = await import('@/app/api/billing/checkout/route');
      const mockReq = new Request('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'TEAM' }),
      });
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      const response = await POST(mockReq, mockUser);

      expect(response.status).toBe(400);
      expect(mockLogBillingAction).toHaveBeenCalledWith(
        'checkout.failed',
        'user_123',
        expect.objectContaining({ reason: 'already_subscribed', currentTier: 'PRO' }),
        mockReq
      );
    });

    it('should use idempotency key for Stripe checkout', async () => {
      mockIsBillingEnabled.mockReturnValue(true);
      mockIsAbuseProtectionEnforced.mockReturnValue(false);
      mockPrismaFindUnique.mockResolvedValue({ id: 'user_123', email: 'test@example.com' });
      mockPrismaFindFirst.mockResolvedValue(null);
      mockStripeCheckoutCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      const { POST } = await import('@/app/api/billing/checkout/route');
      const mockReq = new Request('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'PRO' }),
      });
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      await POST(mockReq, mockUser);

      expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          idempotencyKey: expect.stringMatching(/^checkout-user_123-PRO-\d+$/),
        })
      );
    });

    it('should log successful checkout', async () => {
      mockIsBillingEnabled.mockReturnValue(true);
      mockIsAbuseProtectionEnforced.mockReturnValue(false);
      mockPrismaFindUnique.mockResolvedValue({ id: 'user_123', email: 'test@example.com' });
      mockPrismaFindFirst.mockResolvedValue(null);
      mockStripeCheckoutCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      const { POST } = await import('@/app/api/billing/checkout/route');
      const mockReq = new Request('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'PRO' }),
      });
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      await POST(mockReq, mockUser);

      expect(mockLogBillingAction).toHaveBeenCalledWith(
        'checkout.completed',
        'user_123',
        expect.objectContaining({
          tier: 'PRO',
          sessionId: 'cs_test_123',
          customerId: 'cus_test_123',
        }),
        mockReq
      );
    });

    it('should log checkout failure', async () => {
      mockIsBillingEnabled.mockReturnValue(true);
      mockIsAbuseProtectionEnforced.mockReturnValue(false);
      mockPrismaFindUnique.mockResolvedValue({ id: 'user_123', email: 'test@example.com' });
      mockPrismaFindFirst.mockResolvedValue(null);
      mockStripeCheckoutCreate.mockRejectedValue(new Error('Stripe API error'));

      const { POST } = await import('@/app/api/billing/checkout/route');
      const mockReq = new Request('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'PRO' }),
      });
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      await POST(mockReq, mockUser);

      expect(mockLogBillingAction).toHaveBeenCalledWith(
        'checkout.failed',
        'user_123',
        expect.objectContaining({
          error: 'Stripe API error',
        }),
        mockReq
      );
    });
  });

  describe('Webhook Handler Hardening', () => {
    it('should log subscription creation', async () => {
      const mockSession = {
        id: 'cs_test_123',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        metadata: { userId: 'user_123', tier: 'PRO' },
      };

      const mockSubscription = {
        id: 'sub_test_123',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        items: {
          data: [{ price: { id: 'price_pro' } }],
        },
      };

      mockPrismaUpsert.mockResolvedValue({ id: 'sub_123' });
      mockPrismaUpdate.mockResolvedValue({ id: 'user_123' });

      // Import and call handleCheckoutSessionCompleted
      const { handleCheckoutSessionCompleted } = await import(
        '@/app/api/billing/webhooks/route'
      );

      await handleCheckoutSessionCompleted(mockSession as any, mockSubscription as any);

      expect(mockLogBillingAction).toHaveBeenCalledWith(
        'subscription.created',
        'user_123',
        expect.objectContaining({
          tier: 'PRO',
          subscriptionId: 'sub_test_123',
          priceId: 'price_pro',
        }),
        null
      );
    });

    it('should log subscription update', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        metadata: { userId: 'user_123' },
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        canceled_at: null,
        items: {
          data: [{ price: { id: 'price_pro' } }],
        },
      };

      mockPrismaFindUnique.mockResolvedValue({
        id: 'sub_123',
        stripeSubscriptionId: 'sub_test_123',
        tier: 'PRO',
      });
      mockPrismaUpdate.mockResolvedValue({ id: 'sub_123' });

      const { handleSubscriptionUpdated } = await import('@/app/api/billing/webhooks/route');

      await handleSubscriptionUpdated(mockSubscription as any);

      expect(mockLogBillingAction).toHaveBeenCalledWith(
        'subscription.updated',
        'user_123',
        expect.objectContaining({
          tier: 'PRO',
          status: 'active',
          subscriptionId: 'sub_test_123',
        }),
        null
      );
    });

    it('should log plan switch', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        metadata: { userId: 'user_123' },
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        canceled_at: null,
        items: {
          data: [{ price: { id: 'price_team' } }], // Changed from PRO to TEAM
        },
      };

      mockPrismaFindUnique.mockResolvedValue({
        id: 'sub_123',
        stripeSubscriptionId: 'sub_test_123',
        tier: 'PRO', // Old tier
      });
      mockPrismaUpdate.mockResolvedValue({ id: 'sub_123' });

      const { handleSubscriptionUpdated } = await import('@/app/api/billing/webhooks/route');

      await handleSubscriptionUpdated(mockSubscription as any);

      expect(mockLogBillingAction).toHaveBeenCalledWith(
        'plan.switched',
        'user_123',
        expect.objectContaining({
          oldTier: 'PRO',
          newTier: 'TEAM',
          subscriptionId: 'sub_test_123',
        }),
        null
      );
    });

    it('should log subscription cancellation', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        metadata: { userId: 'user_123' },
      };

      mockPrismaUpdate.mockResolvedValue({ id: 'sub_123' });

      const { handleSubscriptionDeleted } = await import('@/app/api/billing/webhooks/route');

      await handleSubscriptionDeleted(mockSubscription as any);

      expect(mockLogBillingAction).toHaveBeenCalledWith(
        'subscription.cancelled',
        'user_123',
        expect.objectContaining({
          subscriptionId: 'sub_test_123',
          downgradedTo: 'FREE',
          reason: 'stripe_subscription_deleted',
        }),
        null
      );
    });
  });
});
