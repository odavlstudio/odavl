/**
 * Stripe Webhook Tests
 * Phase 3.0.4: Billing & Payments
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../../../../app/api/billing/webhooks/route';
import { NextRequest } from 'next/server';
import { stripe } from '../../../../lib/billing/stripe';
import { prisma } from '../../../../lib/prisma';
import Stripe from 'stripe';

// Mock dependencies
vi.mock('../../../../lib/billing/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
  STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
}));

vi.mock('../../../../lib/prisma', () => ({
  prisma: {
    subscription: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
}));

describe('POST /api/billing/webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  describe('Webhook Signature Verification', () => {
    it('should reject request without signature', async () => {
      const req = new NextRequest('http://localhost:3000/api/billing/webhooks', {
        method: 'POST',
        body: JSON.stringify({ type: 'checkout.session.completed' }),
      });

      const response = await POST(req);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('signature');
    });

    it('should reject request with invalid signature', async () => {
      vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const req = new NextRequest('http://localhost:3000/api/billing/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 'invalid',
        },
        body: JSON.stringify({ type: 'checkout.session.completed' }),
      });

      const response = await POST(req);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('INVALID_SIGNATURE');
    });

    it('should accept request with valid signature', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test123',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            metadata: {
              userId: 'user-123',
              tier: 'PRO',
            },
          } as Stripe.Checkout.Session,
        },
        api_version: '2024-12-18.acacia',
        created: Date.now(),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent);

      vi.mocked(prisma.subscription.upsert).mockResolvedValue({
        id: 'sub-123',
        userId: 'user-123',
        tier: 'PRO',
      } as any);

      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost:3000/api/billing/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=123,v1=abc',
        },
        body: JSON.stringify({ type: 'checkout.session.completed' }),
      });

      const response = await POST(req);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.received).toBe(true);
    });
  });

  describe('checkout.session.completed', () => {
    it('should upgrade user on successful payment', async () => {
      const now = Math.floor(Date.now() / 1000);

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test123',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            metadata: {
              userId: 'user-123',
              tier: 'PRO',
            },
            amount_total: 2900,
            currency: 'eur',
            payment_status: 'paid',
          } as Stripe.Checkout.Session,
        },
        api_version: '2024-12-18.acacia',
        created: now,
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent);

      // Mock Stripe subscription retrieval
      const mockStripeSubscription = {
        id: 'sub_test123',
        current_period_start: now,
        current_period_end: now + 2592000, // 30 days
        items: {
          data: [
            {
              price: {
                id: 'price_test_pro',
              },
            },
          ],
        },
      };

      // We need to mock the stripe.subscriptions.retrieve call
      // This is called inside the webhook handler
      vi.mocked(prisma.subscription.upsert).mockResolvedValue({
        id: 'sub-123',
        userId: 'user-123',
        tier: 'PRO',
        status: 'active',
        stripeCustomerId: 'cus_test123',
        stripeSubscriptionId: 'sub_test123',
      } as any);

      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-123',
        plan: 'PRO',
      } as any);

      const req = new NextRequest('http://localhost:3000/api/billing/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=123,v1=abc',
        },
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(req);

      expect(response.status).toBe(200);

      // Verify subscription was upserted
      expect(prisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
          create: expect.objectContaining({
            userId: 'user-123',
            tier: 'PRO',
            status: 'active',
            stripeCustomerId: 'cus_test123',
            stripeSubscriptionId: 'sub_test123',
          }),
          update: expect.objectContaining({
            tier: 'PRO',
            status: 'active',
          }),
        })
      );

      // Verify user.plan was updated
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { plan: 'PRO' },
      });
    });

    it('should handle missing userId metadata', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test123',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            metadata: {
              // userId missing
              tier: 'PRO',
            },
          } as Stripe.Checkout.Session,
        },
        api_version: '2024-12-18.acacia',
        created: Date.now(),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const req = new NextRequest('http://localhost:3000/api/billing/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=123,v1=abc',
        },
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(req);

      expect(response.status).toBe(500);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing userId')
      );

      consoleSpy.mockRestore();
    });

    it('should handle missing tier metadata', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test123',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            metadata: {
              userId: 'user-123',
              // tier missing
            },
          } as Stripe.Checkout.Session,
        },
        api_version: '2024-12-18.acacia',
        created: Date.now(),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const req = new NextRequest('http://localhost:3000/api/billing/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=123,v1=abc',
        },
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(req);

      expect(response.status).toBe(500);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing tier')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('customer.subscription.updated', () => {
    it('should update subscription on Stripe changes', async () => {
      const now = Math.floor(Date.now() / 1000);

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active',
            current_period_start: now,
            current_period_end: now + 2592000,
            items: {
              data: [
                {
                  price: {
                    id: 'price_test_team',
                  },
                },
              ],
            },
            metadata: {
              userId: 'user-123',
            },
          } as Stripe.Subscription,
        },
        api_version: '2024-12-18.acacia',
        created: now,
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent);

      vi.mocked(prisma.subscription.update).mockResolvedValue({
        id: 'sub-123',
        userId: 'user-123',
        tier: 'TEAM',
        status: 'active',
      } as any);

      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-123',
        plan: 'TEAM',
      } as any);

      const req = new NextRequest('http://localhost:3000/api/billing/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=123,v1=abc',
        },
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(req);

      expect(response.status).toBe(200);

      // Verify subscription was updated
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            stripeSubscriptionId: 'sub_test123',
          },
          data: expect.objectContaining({
            tier: 'TEAM',
            status: 'active',
          }),
        })
      );

      // Verify user.plan was updated
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should handle subscription cancellation', async () => {
      const now = Math.floor(Date.now() / 1000);

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'canceled',
            current_period_start: now - 2592000,
            current_period_end: now,
            canceled_at: now,
            items: {
              data: [
                {
                  price: {
                    id: 'price_test_pro',
                  },
                },
              ],
            },
            metadata: {
              userId: 'user-123',
            },
          } as Stripe.Subscription,
        },
        api_version: '2024-12-18.acacia',
        created: now,
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent);

      vi.mocked(prisma.subscription.update).mockResolvedValue({
        id: 'sub-123',
        userId: 'user-123',
        tier: 'PRO',
        status: 'cancelled',
        cancelledAt: new Date(now * 1000),
      } as any);

      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost:3000/api/billing/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=123,v1=abc',
        },
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(req);

      expect(response.status).toBe(200);

      // Verify subscription status was updated
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'cancelled',
            cancelledAt: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('customer.subscription.deleted', () => {
    it('should downgrade to FREE tier', async () => {
      const now = Math.floor(Date.now() / 1000);

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'canceled',
            canceled_at: now,
            items: {
              data: [],
            },
            metadata: {
              userId: 'user-123',
            },
          } as Stripe.Subscription,
        },
        api_version: '2024-12-18.acacia',
        created: now,
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent);

      vi.mocked(prisma.subscription.update).mockResolvedValue({
        id: 'sub-123',
        userId: 'user-123',
        tier: 'FREE',
        status: 'cancelled',
      } as any);

      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-123',
        plan: 'FREE',
      } as any);

      const req = new NextRequest('http://localhost:3000/api/billing/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=123,v1=abc',
        },
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(req);

      expect(response.status).toBe(200);

      // Verify subscription was downgraded to FREE
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            stripeSubscriptionId: 'sub_test123',
          },
          data: expect.objectContaining({
            tier: 'FREE',
            status: 'cancelled',
            cancelledAt: expect.any(Date),
            maxProjects: 3,
            maxAnalysesPerMonth: 10,
            maxStorageGB: 1,
          }),
        })
      );

      // Verify user.plan was downgraded
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { plan: 'FREE' },
      });
    });
  });

  describe('Idempotency', () => {
    it('should handle duplicate checkout.session.completed events', async () => {
      const now = Math.floor(Date.now() / 1000);

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test123',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            metadata: {
              userId: 'user-123',
              tier: 'PRO',
            },
          } as Stripe.Checkout.Session,
        },
        api_version: '2024-12-18.acacia',
        created: now,
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent);

      // First call creates subscription
      vi.mocked(prisma.subscription.upsert).mockResolvedValue({
        id: 'sub-123',
        userId: 'user-123',
        tier: 'PRO',
      } as any);

      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const req1 = new NextRequest('http://localhost:3000/api/billing/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=123,v1=abc',
        },
        body: JSON.stringify(mockEvent),
      });

      const response1 = await POST(req1);
      expect(response1.status).toBe(200);

      // Second call (duplicate) should also succeed with upsert
      const req2 = new NextRequest('http://localhost:3000/api/billing/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=124,v1=def',
        },
        body: JSON.stringify(mockEvent),
      });

      const response2 = await POST(req2);
      expect(response2.status).toBe(200);

      // Both calls should have used upsert (idempotent)
      expect(prisma.subscription.upsert).toHaveBeenCalledTimes(2);
    });
  });

  describe('Unhandled Event Types', () => {
    it('should gracefully ignore unhandled events', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        object: 'event',
        type: 'invoice.payment_succeeded', // Not handled
        data: {
          object: {} as any,
        },
        api_version: '2024-12-18.acacia',
        created: Date.now(),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent);

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const req = new NextRequest('http://localhost:3000/api/billing/webhooks', {
        method: 'POST',
        headers: {
          'stripe-signature': 't=123,v1=abc',
        },
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(req);

      expect(response.status).toBe(200);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unhandled event type')
      );

      consoleLogSpy.mockRestore();
    });
  });
});
