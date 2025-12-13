/**
 * Audit Logging Tests
 * Phase 3.0.5: Production Launch Hardening
 * 
 * Tests for billing audit logging and abuse detection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BillingAction, logBillingAction, checkForAbuse } from '@/lib/billing/audit';

// Mock Prisma client
const mockPrismaCreate = vi.fn();
const mockPrismaFindMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    billingAudit: {
      create: mockPrismaCreate,
      findMany: mockPrismaFindMany,
    },
  },
}));

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
let consoleLogSpy: vi.SpyInstance;
let consoleErrorSpy: vi.SpyInstance;

beforeEach(() => {
  consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  mockPrismaCreate.mockReset();
  mockPrismaFindMany.mockReset();
});

afterEach(() => {
  consoleLogSpy.mockRestore();
  consoleErrorSpy.mockRestore();
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('Audit Logging', () => {
  describe('logBillingAction', () => {
    it('should log to console with structured format', async () => {
      const userId = 'user_123';
      const metadata = { tier: 'PRO' };

      await logBillingAction(BillingAction.CHECKOUT_INITIATED, userId, metadata, null);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logArgs = consoleLogSpy.mock.calls[0];
      expect(logArgs[0]).toBe('[Billing Audit]');
      expect(logArgs[1]).toContain('checkout.initiated');
      expect(logArgs[1]).toContain('user_123');
      expect(logArgs[1]).toContain('PRO');
    });

    it('should write to database', async () => {
      mockPrismaCreate.mockResolvedValue({ id: 'audit_1' });

      const userId = 'user_123';
      const metadata = { tier: 'PRO', sessionId: 'cs_123' };

      await logBillingAction(BillingAction.CHECKOUT_COMPLETED, userId, metadata, null);

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'checkout.completed',
          userId: 'user_123',
          metadata: JSON.stringify(metadata),
          ipAddress: 'unknown',
          userAgent: 'unknown',
        }),
      });
    });

    it('should extract IP from x-forwarded-for header', async () => {
      mockPrismaCreate.mockResolvedValue({ id: 'audit_1' });

      const mockRequest = {
        headers: {
          get: (name: string) => name === 'x-forwarded-for' ? '192.168.1.1' : null,
        },
      } as unknown as Request;

      await logBillingAction(BillingAction.CHECKOUT_INITIATED, 'user_123', {}, mockRequest);

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ipAddress: '192.168.1.1',
        }),
      });
    });

    it('should extract IP from x-real-ip header', async () => {
      mockPrismaCreate.mockResolvedValue({ id: 'audit_1' });

      const mockRequest = {
        headers: {
          get: (name: string) => name === 'x-real-ip' ? '10.0.0.1' : null,
        },
      } as unknown as Request;

      await logBillingAction(BillingAction.CHECKOUT_INITIATED, 'user_123', {}, mockRequest);

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ipAddress: '10.0.0.1',
        }),
      });
    });

    it('should extract User-Agent header', async () => {
      mockPrismaCreate.mockResolvedValue({ id: 'audit_1' });

      const mockRequest = {
        headers: {
          get: (name: string) => name === 'user-agent' ? 'Mozilla/5.0' : null,
        },
      } as unknown as Request;

      await logBillingAction(BillingAction.CHECKOUT_INITIATED, 'user_123', {}, mockRequest);

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userAgent: 'Mozilla/5.0',
        }),
      });
    });

    it('should use "unknown" for missing IP and User-Agent', async () => {
      mockPrismaCreate.mockResolvedValue({ id: 'audit_1' });

      await logBillingAction(BillingAction.CHECKOUT_INITIATED, 'user_123', {}, null);

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ipAddress: 'unknown',
          userAgent: 'unknown',
        }),
      });
    });

    it('should not throw if database write fails', async () => {
      mockPrismaCreate.mockRejectedValue(new Error('DB connection failed'));

      await expect(
        logBillingAction(BillingAction.CHECKOUT_INITIATED, 'user_123', {}, null)
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Billing Audit] Failed to write to database:',
        expect.any(Error)
      );
    });

    it('should log all BillingAction types', async () => {
      mockPrismaCreate.mockResolvedValue({ id: 'audit_1' });

      const actions = [
        BillingAction.CHECKOUT_INITIATED,
        BillingAction.CHECKOUT_COMPLETED,
        BillingAction.CHECKOUT_FAILED,
        BillingAction.SUBSCRIPTION_CREATED,
        BillingAction.SUBSCRIPTION_UPDATED,
        BillingAction.SUBSCRIPTION_CANCELLED,
        BillingAction.PLAN_SWITCHED,
        BillingAction.DOWNGRADE_REQUESTED,
        BillingAction.ABUSE_DETECTED,
        BillingAction.BILLING_DISABLED_ACCESS,
      ];

      for (const action of actions) {
        await logBillingAction(action, 'user_123', {}, null);
      }

      expect(mockPrismaCreate).toHaveBeenCalledTimes(actions.length);
    });

    it('should handle complex metadata', async () => {
      mockPrismaCreate.mockResolvedValue({ id: 'audit_1' });

      const metadata = {
        tier: 'PRO',
        sessionId: 'cs_123',
        customerId: 'cus_123',
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' },
        },
      };

      await logBillingAction(BillingAction.CHECKOUT_COMPLETED, 'user_123', metadata, null);

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: JSON.stringify(metadata),
        }),
      });
    });

    it('should handle empty metadata', async () => {
      mockPrismaCreate.mockResolvedValue({ id: 'audit_1' });

      await logBillingAction(BillingAction.CHECKOUT_INITIATED, 'user_123', {}, null);

      expect(mockPrismaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: '{}',
        }),
      });
    });
  });

  describe('checkForAbuse', () => {
    it('should return no abuse when no recent actions', async () => {
      mockPrismaFindMany.mockResolvedValue([]);

      const result = await checkForAbuse('user_123', BillingAction.CHECKOUT_INITIATED);

      expect(result.isAbuse).toBe(false);
      expect(result.reason).toBeUndefined();
      expect(result.lastActionAt).toBeUndefined();
    });

    it('should return no abuse when less than 3 actions in 24h', async () => {
      const now = new Date();
      const recentActions = [
        { id: '1', timestamp: new Date(now.getTime() - 1000 * 60 * 60) }, // 1h ago
        { id: '2', timestamp: new Date(now.getTime() - 1000 * 60 * 30) }, // 30m ago
      ];

      mockPrismaFindMany.mockResolvedValue(recentActions);

      const result = await checkForAbuse('user_123', BillingAction.CHECKOUT_INITIATED);

      expect(result.isAbuse).toBe(false);
    });

    it('should return abuse when 3+ actions in 24h', async () => {
      const now = new Date();
      const recentActions = [
        { id: '1', timestamp: new Date(now.getTime() - 1000 * 60 * 60) }, // 1h ago
        { id: '2', timestamp: new Date(now.getTime() - 1000 * 60 * 30) }, // 30m ago
        { id: '3', timestamp: new Date(now.getTime() - 1000 * 60 * 10) }, // 10m ago
      ];

      mockPrismaFindMany.mockResolvedValue(recentActions);

      const result = await checkForAbuse('user_123', BillingAction.CHECKOUT_INITIATED);

      expect(result.isAbuse).toBe(true);
      expect(result.reason).toContain('More than 3');
      expect(result.reason).toContain('checkout.initiated');
      expect(result.reason).toContain('24 hours');
      expect(result.lastActionAt).toEqual(recentActions[0].timestamp);
    });

    it('should query with correct filters', async () => {
      mockPrismaFindMany.mockResolvedValue([]);

      await checkForAbuse('user_123', BillingAction.CHECKOUT_INITIATED);

      expect(mockPrismaFindMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
          action: 'checkout.initiated',
          timestamp: {
            gte: expect.any(Date),
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
      });
    });

    it('should query for actions within last 24 hours', async () => {
      mockPrismaFindMany.mockResolvedValue([]);

      const beforeTime = Date.now();
      await checkForAbuse('user_123', BillingAction.CHECKOUT_INITIATED);
      const afterTime = Date.now();

      const callArgs = mockPrismaFindMany.mock.calls[0][0];
      const queriedTimestamp = callArgs.where.timestamp.gte.getTime();

      // Should be ~24 hours ago (within 1 second tolerance)
      const expectedTimestamp = Date.now() - 24 * 60 * 60 * 1000;
      expect(queriedTimestamp).toBeGreaterThanOrEqual(expectedTimestamp - 1000);
      expect(queriedTimestamp).toBeLessThanOrEqual(expectedTimestamp + 1000);
    });

    it('should not throw if database query fails', async () => {
      mockPrismaFindMany.mockRejectedValue(new Error('DB connection failed'));

      const result = await checkForAbuse('user_123', BillingAction.CHECKOUT_INITIATED);

      expect(result.isAbuse).toBe(false); // Safe default
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Billing Audit] Abuse check failed:',
        expect.any(Error)
      );
    });

    it('should check different action types independently', async () => {
      mockPrismaFindMany.mockResolvedValue([]);

      await checkForAbuse('user_123', BillingAction.CHECKOUT_INITIATED);
      await checkForAbuse('user_123', BillingAction.PLAN_SWITCHED);

      expect(mockPrismaFindMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
        where: expect.objectContaining({
          action: 'checkout.initiated',
        }),
      }));

      expect(mockPrismaFindMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
        where: expect.objectContaining({
          action: 'plan.switched',
        }),
      }));
    });

    it('should limit results to 10 for performance', async () => {
      mockPrismaFindMany.mockResolvedValue([]);

      await checkForAbuse('user_123', BillingAction.CHECKOUT_INITIATED);

      expect(mockPrismaFindMany).toHaveBeenCalledWith(expect.objectContaining({
        take: 10,
      }));
    });

    it('should order by timestamp descending', async () => {
      mockPrismaFindMany.mockResolvedValue([]);

      await checkForAbuse('user_123', BillingAction.CHECKOUT_INITIATED);

      expect(mockPrismaFindMany).toHaveBeenCalledWith(expect.objectContaining({
        orderBy: { timestamp: 'desc' },
      }));
    });
  });

  describe('BillingAction Enum', () => {
    it('should have all expected action types', () => {
      expect(BillingAction.CHECKOUT_INITIATED).toBe('checkout.initiated');
      expect(BillingAction.CHECKOUT_COMPLETED).toBe('checkout.completed');
      expect(BillingAction.CHECKOUT_FAILED).toBe('checkout.failed');
      expect(BillingAction.SUBSCRIPTION_CREATED).toBe('subscription.created');
      expect(BillingAction.SUBSCRIPTION_UPDATED).toBe('subscription.updated');
      expect(BillingAction.SUBSCRIPTION_CANCELLED).toBe('subscription.cancelled');
      expect(BillingAction.PLAN_SWITCHED).toBe('plan.switched');
      expect(BillingAction.DOWNGRADE_REQUESTED).toBe('downgrade.requested');
      expect(BillingAction.ABUSE_DETECTED).toBe('abuse.detected');
      expect(BillingAction.BILLING_DISABLED_ACCESS).toBe('billing.disabled.access');
    });
  });
});
