/**
 * Billing Status Endpoint Tests
 * Phase 3.0.5: Production Launch Hardening
 * 
 * Tests for GET /api/billing/status endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockIsBillingEnabled = vi.fn();
const mockIsPlanSwitchingAllowed = vi.fn();
const mockIsDowngradeAllowed = vi.fn();

vi.mock('@/lib/billing/feature-flags', () => ({
  isBillingEnabled: () => mockIsBillingEnabled(),
  isPlanSwitchingAllowed: () => mockIsPlanSwitchingAllowed(),
  isDowngradeAllowed: () => mockIsDowngradeAllowed(),
}));

const mockPrismaFindUnique = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      findUnique: mockPrismaFindUnique,
    },
  },
}));

const mockWithAuth = vi.fn((handler) => handler);

vi.mock('@/lib/auth/withAuth', () => ({
  withAuth: (handler: any) => mockWithAuth(handler),
}));

describe('Billing Status Endpoint', () => {
  beforeEach(() => {
    mockIsBillingEnabled.mockReset();
    mockIsPlanSwitchingAllowed.mockReset();
    mockIsDowngradeAllowed.mockReset();
    mockPrismaFindUnique.mockReset();
    mockWithAuth.mockReset();
  });

  describe('GET /api/billing/status', () => {
    it('should return billing disabled when feature flag off', async () => {
      mockIsBillingEnabled.mockReturnValue(false);
      mockPrismaFindUnique.mockResolvedValue(null);

      const { GET } = await import('@/app/api/billing/status/route');
      const mockReq = new NextRequest('http://localhost:3000/api/billing/status');
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      const response = await GET(mockReq, mockUser);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.billingEnabled).toBe(false);
      expect(data.currentPlan).toBe('FREE');
    });

    it('should return FREE tier with defaults when no subscription exists', async () => {
      mockIsBillingEnabled.mockReturnValue(true);
      mockIsPlanSwitchingAllowed.mockReturnValue(true);
      mockIsDowngradeAllowed.mockReturnValue(true);
      mockPrismaFindUnique.mockResolvedValue(null);

      const { GET } = await import('@/app/api/billing/status/route');
      const mockReq = new NextRequest('http://localhost:3000/api/billing/status');
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      const response = await GET(mockReq, mockUser);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.billingEnabled).toBe(true);
      expect(data.currentPlan).toBe('FREE');
      expect(data.status).toBe('active');
      expect(data.quotas).toEqual({
        maxProjects: 3,
        maxAnalysesPerMonth: 10,
        maxStorageGB: 1,
      });
      expect(data.usage).toEqual({
        projectsUsed: 0,
        analysesUsedThisMonth: 0,
        storageUsedGB: 0,
      });
      expect(data.quotaRemaining).toEqual({
        projects: 3,
        analyses: 10,
        storageGB: 1,
      });
      expect(data.renewalDate).toBeNull();
      expect(data.stripeCustomerId).toBeNull();
      expect(data.stripeSubscriptionId).toBeNull();
      expect(data.features).toEqual({
        canUpgrade: true,
        canDowngrade: false,
        canSwitchPlans: false,
      });
    });

    it('should return PRO tier data when subscription exists', async () => {
      const currentPeriodEnd = new Date('2025-12-31T23:59:59Z');
      mockIsBillingEnabled.mockReturnValue(true);
      mockIsPlanSwitchingAllowed.mockReturnValue(true);
      mockIsDowngradeAllowed.mockReturnValue(true);
      mockPrismaFindUnique.mockResolvedValue({
        id: 'sub_123',
        userId: 'user_123',
        tier: 'PRO',
        status: 'active',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_stripe_123',
        maxProjects: 10,
        maxAnalysesPerMonth: 100,
        maxStorageGB: 10,
        currentPeriodEnd,
      });

      const { GET } = await import('@/app/api/billing/status/route');
      const mockReq = new NextRequest('http://localhost:3000/api/billing/status');
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      const response = await GET(mockReq, mockUser);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.currentPlan).toBe('PRO');
      expect(data.status).toBe('active');
      expect(data.quotas).toEqual({
        maxProjects: 10,
        maxAnalysesPerMonth: 100,
        maxStorageGB: 10,
      });
      expect(data.renewalDate).toBe(currentPeriodEnd.toISOString());
      expect(data.stripeCustomerId).toBe('cus_123');
      expect(data.stripeSubscriptionId).toBe('sub_stripe_123');
      expect(data.features).toEqual({
        canUpgrade: true,
        canDowngrade: true,
        canSwitchPlans: true,
      });
    });

    it('should return TEAM tier data when subscription exists', async () => {
      const currentPeriodEnd = new Date('2025-12-31T23:59:59Z');
      mockIsBillingEnabled.mockReturnValue(true);
      mockIsPlanSwitchingAllowed.mockReturnValue(true);
      mockIsDowngradeAllowed.mockReturnValue(true);
      mockPrismaFindUnique.mockResolvedValue({
        id: 'sub_123',
        userId: 'user_123',
        tier: 'TEAM',
        status: 'active',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_stripe_123',
        maxProjects: 50,
        maxAnalysesPerMonth: 500,
        maxStorageGB: 50,
        currentPeriodEnd,
      });

      const { GET } = await import('@/app/api/billing/status/route');
      const mockReq = new NextRequest('http://localhost:3000/api/billing/status');
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      const response = await GET(mockReq, mockUser);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.currentPlan).toBe('TEAM');
      expect(data.quotas).toEqual({
        maxProjects: 50,
        maxAnalysesPerMonth: 500,
        maxStorageGB: 50,
      });
      expect(data.features).toEqual({
        canUpgrade: true,
        canDowngrade: true,
        canSwitchPlans: true,
      });
    });

    it('should return ENTERPRISE tier data when subscription exists', async () => {
      const currentPeriodEnd = new Date('2025-12-31T23:59:59Z');
      mockIsBillingEnabled.mockReturnValue(true);
      mockIsPlanSwitchingAllowed.mockReturnValue(true);
      mockIsDowngradeAllowed.mockReturnValue(true);
      mockPrismaFindUnique.mockResolvedValue({
        id: 'sub_123',
        userId: 'user_123',
        tier: 'ENTERPRISE',
        status: 'active',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_stripe_123',
        maxProjects: 999999,
        maxAnalysesPerMonth: 999999,
        maxStorageGB: 1000,
        currentPeriodEnd,
      });

      const { GET } = await import('@/app/api/billing/status/route');
      const mockReq = new NextRequest('http://localhost:3000/api/billing/status');
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      const response = await GET(mockReq, mockUser);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.currentPlan).toBe('ENTERPRISE');
      expect(data.quotas).toEqual({
        maxProjects: 999999,
        maxAnalysesPerMonth: 999999,
        maxStorageGB: 1000,
      });
      expect(data.features).toEqual({
        canUpgrade: false, // Already at highest tier
        canDowngrade: true,
        canSwitchPlans: true,
      });
    });

    it('should calculate quota remaining correctly', async () => {
      mockIsBillingEnabled.mockReturnValue(true);
      mockPrismaFindUnique.mockResolvedValue({
        id: 'sub_123',
        userId: 'user_123',
        tier: 'PRO',
        status: 'active',
        maxProjects: 10,
        maxAnalysesPerMonth: 100,
        maxStorageGB: 10,
        currentPeriodEnd: new Date(),
      });

      const { GET } = await import('@/app/api/billing/status/route');
      const mockReq = new NextRequest('http://localhost:3000/api/billing/status');
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      const response = await GET(mockReq, mockUser);
      const data = await response.json();

      // With placeholder usage of 0
      expect(data.quotaRemaining).toEqual({
        projects: 10,
        analyses: 100,
        storageGB: 10,
      });
    });

    it('should respect plan switching feature flag', async () => {
      mockIsBillingEnabled.mockReturnValue(true);
      mockIsPlanSwitchingAllowed.mockReturnValue(false); // Disabled
      mockIsDowngradeAllowed.mockReturnValue(true);
      mockPrismaFindUnique.mockResolvedValue({
        id: 'sub_123',
        userId: 'user_123',
        tier: 'PRO',
        status: 'active',
        maxProjects: 10,
        maxAnalysesPerMonth: 100,
        maxStorageGB: 10,
        currentPeriodEnd: new Date(),
      });

      const { GET } = await import('@/app/api/billing/status/route');
      const mockReq = new NextRequest('http://localhost:3000/api/billing/status');
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      const response = await GET(mockReq, mockUser);
      const data = await response.json();

      expect(data.features.canSwitchPlans).toBe(false);
    });

    it('should respect downgrade feature flag', async () => {
      mockIsBillingEnabled.mockReturnValue(true);
      mockIsPlanSwitchingAllowed.mockReturnValue(true);
      mockIsDowngradeAllowed.mockReturnValue(false); // Disabled
      mockPrismaFindUnique.mockResolvedValue({
        id: 'sub_123',
        userId: 'user_123',
        tier: 'PRO',
        status: 'active',
        maxProjects: 10,
        maxAnalysesPerMonth: 100,
        maxStorageGB: 10,
        currentPeriodEnd: new Date(),
      });

      const { GET } = await import('@/app/api/billing/status/route');
      const mockReq = new NextRequest('http://localhost:3000/api/billing/status');
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      const response = await GET(mockReq, mockUser);
      const data = await response.json();

      expect(data.features.canDowngrade).toBe(false);
    });

    it('should handle cancelled subscription', async () => {
      const currentPeriodEnd = new Date('2025-12-31T23:59:59Z');
      mockIsBillingEnabled.mockReturnValue(true);
      mockPrismaFindUnique.mockResolvedValue({
        id: 'sub_123',
        userId: 'user_123',
        tier: 'FREE',
        status: 'cancelled',
        maxProjects: 3,
        maxAnalysesPerMonth: 10,
        maxStorageGB: 1,
        currentPeriodEnd,
      });

      const { GET } = await import('@/app/api/billing/status/route');
      const mockReq = new NextRequest('http://localhost:3000/api/billing/status');
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      const response = await GET(mockReq, mockUser);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.status).toBe('cancelled');
      expect(data.currentPlan).toBe('FREE');
    });

    it('should handle database errors gracefully', async () => {
      mockIsBillingEnabled.mockReturnValue(true);
      mockPrismaFindUnique.mockRejectedValue(new Error('DB connection failed'));

      const { GET } = await import('@/app/api/billing/status/route');
      const mockReq = new NextRequest('http://localhost:3000/api/billing/status');
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      const response = await GET(mockReq, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('STATUS_FETCH_FAILED');
    });

    it('should require authentication (wrapped by withAuth)', async () => {
      // This test verifies the handler is wrapped, not the auth itself
      const { GET } = await import('@/app/api/billing/status/route');
      
      expect(mockWithAuth).toHaveBeenCalled();
    });
  });

  describe('OPTIONS /api/billing/status', () => {
    it('should handle CORS preflight request', async () => {
      const { OPTIONS } = await import('@/app/api/billing/status/route');
      
      const response = await OPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    });
  });

  describe('Feature Combinations', () => {
    it('should handle FREE tier with canUpgrade=true', async () => {
      mockIsBillingEnabled.mockReturnValue(true);
      mockPrismaFindUnique.mockResolvedValue(null);

      const { GET } = await import('@/app/api/billing/status/route');
      const mockReq = new NextRequest('http://localhost:3000/api/billing/status');
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      const response = await GET(mockReq, mockUser);
      const data = await response.json();

      expect(data.features.canUpgrade).toBe(true);
      expect(data.features.canDowngrade).toBe(false);
      expect(data.features.canSwitchPlans).toBe(false);
    });

    it('should handle PRO tier with all features enabled', async () => {
      mockIsBillingEnabled.mockReturnValue(true);
      mockIsPlanSwitchingAllowed.mockReturnValue(true);
      mockIsDowngradeAllowed.mockReturnValue(true);
      mockPrismaFindUnique.mockResolvedValue({
        id: 'sub_123',
        userId: 'user_123',
        tier: 'PRO',
        status: 'active',
        maxProjects: 10,
        maxAnalysesPerMonth: 100,
        maxStorageGB: 10,
        currentPeriodEnd: new Date(),
      });

      const { GET } = await import('@/app/api/billing/status/route');
      const mockReq = new NextRequest('http://localhost:3000/api/billing/status');
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      const response = await GET(mockReq, mockUser);
      const data = await response.json();

      expect(data.features.canUpgrade).toBe(true);
      expect(data.features.canDowngrade).toBe(true);
      expect(data.features.canSwitchPlans).toBe(true);
    });

    it('should handle ENTERPRISE tier with canUpgrade=false', async () => {
      mockIsBillingEnabled.mockReturnValue(true);
      mockIsPlanSwitchingAllowed.mockReturnValue(true);
      mockIsDowngradeAllowed.mockReturnValue(true);
      mockPrismaFindUnique.mockResolvedValue({
        id: 'sub_123',
        userId: 'user_123',
        tier: 'ENTERPRISE',
        status: 'active',
        maxProjects: 999999,
        maxAnalysesPerMonth: 999999,
        maxStorageGB: 1000,
        currentPeriodEnd: new Date(),
      });

      const { GET } = await import('@/app/api/billing/status/route');
      const mockReq = new NextRequest('http://localhost:3000/api/billing/status');
      const mockUser = { userId: 'user_123', email: 'test@example.com' };

      const response = await GET(mockReq, mockUser);
      const data = await response.json();

      expect(data.features.canUpgrade).toBe(false);
      expect(data.features.canDowngrade).toBe(true);
      expect(data.features.canSwitchPlans).toBe(true);
    });
  });
});
