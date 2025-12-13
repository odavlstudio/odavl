/**
 * Checkout Session Tests
 * Phase 3.0.4: Billing & Payments
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../../../../app/api/billing/checkout/route';
import { NextRequest } from 'next/server';
import { stripe } from '../../../../lib/billing/stripe';
import { prisma } from '../../../../lib/prisma';
import { generateToken } from '../../../../lib/auth/jwt.middleware';

// Mock dependencies
vi.mock('../../../../lib/billing/stripe', () => ({
  stripe: {
    customers: {
      create: vi.fn(),
    },
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
  STRIPE_WEBHOOK_SECRET: 'test-webhook-secret',
}));

vi.mock('../../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('POST /api/billing/checkout', () => {
  const JWT_SECRET = 'test-jwt-secret';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.NEXT_PUBLIC_APP_URL = 'https://test.odavl.studio';
  });

  describe('Authentication', () => {
    it('should reject request without authorization', async () => {
      const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'PRO' }),
      });

      const response = await POST(req);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('UNAUTHORIZED');
    });

    it('should reject request with invalid token', async () => {
      const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        headers: {
          authorization: 'Bearer invalid.token.here',
        },
        body: JSON.stringify({ tier: 'PRO' }),
      });

      const response = await POST(req);

      expect(response.status).toBe(401);
    });
  });

  describe('Tier Validation', () => {
    it('should reject invalid tier', async () => {
      const token = generateToken('user-123', 'test@example.com');

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        plan: 'FREE',
        name: 'Test User',
      } as any);

      const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: 'INVALID' }),
      });

      const response = await POST(req);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('INVALID_TIER');
    });

    it('should reject FREE tier (no Stripe required)', async () => {
      const token = generateToken('user-123', 'test@example.com');

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        plan: 'FREE',
        name: 'Test User',
      } as any);

      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: 'FREE' }),
      });

      const response = await POST(req);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('INVALID_TIER');
    });

    it('should reject ENTERPRISE tier (no Stripe)', async () => {
      const token = generateToken('user-123', 'test@example.com');

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        plan: 'FREE',
        name: 'Test User',
      } as any);

      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: 'ENTERPRISE' }),
      });

      const response = await POST(req);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('INVALID_TIER');
    });
  });

  describe('Checkout Session Creation', () => {
    it('should create checkout session for new PRO subscription', async () => {
      const token = generateToken('user-123', 'test@example.com');

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        plan: 'FREE',
        name: 'Test User',
      } as any);

      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

      vi.mocked(stripe.customers.create).mockResolvedValue({
        id: 'cus_test123',
      } as any);

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      } as any);

      vi.mocked(prisma.subscription.create).mockResolvedValue({
        id: 'sub-123',
        userId: 'user-123',
        tier: 'FREE',
        stripeCustomerId: 'cus_test123',
        stripeCheckoutSessionId: 'cs_test123',
      } as any);

      const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: 'PRO' }),
      });

      const response = await POST(req);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.checkoutUrl).toBe('https://checkout.stripe.com/test');

      // Verify Stripe customer creation
      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        metadata: {
          userId: 'user-123',
          source: 'odavl-insight',
        },
      });

      // Verify checkout session creation
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_test123',
          mode: 'subscription',
          payment_method_types: ['card', 'sepa_debit'],
          metadata: expect.objectContaining({
            userId: 'user-123',
            tier: 'PRO',
          }),
          locale: 'de',
          billing_address_collection: 'required',
        })
      );
    });

    it('should reuse existing Stripe customer', async () => {
      const token = generateToken('user-123', 'test@example.com');

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        plan: 'FREE',
        name: 'Test User',
      } as any);

      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        id: 'sub-123',
        userId: 'user-123',
        tier: 'FREE',
        stripeCustomerId: 'cus_existing',
        status: 'cancelled',
      } as any);

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      } as any);

      vi.mocked(prisma.subscription.update).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: 'PRO' }),
      });

      const response = await POST(req);

      expect(response.status).toBe(200);

      // Should NOT create new customer
      expect(stripe.customers.create).not.toHaveBeenCalled();

      // Should use existing customer
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing',
        })
      );
    });

    it('should reject if user already has active subscription', async () => {
      const token = generateToken('user-123', 'test@example.com');

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        plan: 'PRO',
        name: 'Test User',
      } as any);

      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        id: 'sub-123',
        userId: 'user-123',
        tier: 'PRO',
        status: 'active',
        stripeSubscriptionId: 'sub_stripe123',
      } as any);

      const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: 'PRO' }),
      });

      const response = await POST(req);

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.error).toBe('ALREADY_SUBSCRIBED');
    });
  });

  describe('EU Compliance', () => {
    it('should use German locale', async () => {
      const token = generateToken('user-123', 'test@example.com');

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        plan: 'FREE',
      } as any);

      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

      vi.mocked(stripe.customers.create).mockResolvedValue({
        id: 'cus_test123',
      } as any);

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      } as any);

      vi.mocked(prisma.subscription.create).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: 'PRO' }),
      });

      await POST(req);

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: 'de',
        })
      );
    });

    it('should require billing address (EU requirement)', async () => {
      const token = generateToken('user-123', 'test@example.com');

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        plan: 'FREE',
      } as any);

      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

      vi.mocked(stripe.customers.create).mockResolvedValue({
        id: 'cus_test123',
      } as any);

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      } as any);

      vi.mocked(prisma.subscription.create).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: 'PRO' }),
      });

      await POST(req);

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          billing_address_collection: 'required',
        })
      );
    });

    it('should support SEPA debit payment method', async () => {
      const token = generateToken('user-123', 'test@example.com');

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        plan: 'FREE',
      } as any);

      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

      vi.mocked(stripe.customers.create).mockResolvedValue({
        id: 'cus_test123',
      } as any);

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      } as any);

      vi.mocked(prisma.subscription.create).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: 'PRO' }),
      });

      await POST(req);

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method_types: expect.arrayContaining(['sepa_debit']),
        })
      );
    });
  });
});
