/**
 * Insight Usage Service Tests
 * 
 * Tests for monthly usage tracking with automatic resets and atomic operations
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  getCurrentPeriod, 
  getUsage, 
  incrementUsage, 
  resetIfNewPeriod,
  getUserUsageHistory,
  cleanupOldUsage,
} from '../../../lib/services/insight-usage.service';
import { prisma } from '../../../lib/prisma';

// Mock Prisma client
vi.mock('../../../lib/prisma', () => ({
  prisma: {
    insightUsage: {
      upsert: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('InsightUsageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCurrentPeriod', () => {
    it('should return current period in YYYY-MM format', () => {
      const now = new Date('2025-12-06T10:30:00Z');
      vi.setSystemTime(now);

      const period = getCurrentPeriod();

      expect(period).toBe('2025-12');
      expect(period).toMatch(/^\d{4}-\d{2}$/);
    });

    it('should pad single-digit months with zero', () => {
      const now = new Date('2025-01-15T10:30:00Z');
      vi.setSystemTime(now);

      const period = getCurrentPeriod();

      expect(period).toBe('2025-01');
    });

    it('should handle December correctly', () => {
      const now = new Date('2025-12-31T23:59:59Z');
      vi.setSystemTime(now);

      const period = getCurrentPeriod();

      expect(period).toBe('2025-12');
    });

    it('should handle January correctly', () => {
      const now = new Date('2026-01-01T00:00:00Z');
      vi.setSystemTime(now);

      const period = getCurrentPeriod();

      expect(period).toBe('2026-01');
    });
  });

  describe('getUsage', () => {
    it('should fetch existing usage record for current period', async () => {
      const now = new Date('2025-12-06T10:30:00Z');
      vi.setSystemTime(now);

      const mockUsage = {
        id: 'usage-123',
        userId: 'user-123',
        period: '2025-12',
        uploadsUsed: 5,
        lastUploadAt: new Date('2025-12-05T14:20:00Z'),
        createdAt: new Date('2025-12-01T00:00:00Z'),
        updatedAt: new Date('2025-12-05T14:20:00Z'),
      };

      vi.mocked(prisma.insightUsage.upsert).mockResolvedValue(mockUsage);

      const usage = await getUsage('user-123');

      expect(prisma.insightUsage.upsert).toHaveBeenCalledWith({
        where: {
          userId_period: {
            userId: 'user-123',
            period: '2025-12',
          },
        },
        update: {},
        create: {
          userId: 'user-123',
          period: '2025-12',
          uploadsUsed: 0,
        },
      });
      expect(usage).toEqual(mockUsage);
      expect(usage.uploadsUsed).toBe(5);
    });

    it('should create new usage record if none exists', async () => {
      const now = new Date('2025-12-01T00:00:00Z');
      vi.setSystemTime(now);

      const mockUsage = {
        id: 'usage-new',
        userId: 'user-456',
        period: '2025-12',
        uploadsUsed: 0,
        lastUploadAt: null,
        createdAt: new Date('2025-12-01T00:00:00Z'),
        updatedAt: new Date('2025-12-01T00:00:00Z'),
      };

      vi.mocked(prisma.insightUsage.upsert).mockResolvedValue(mockUsage);

      const usage = await getUsage('user-456');

      expect(usage.uploadsUsed).toBe(0);
      expect(usage.lastUploadAt).toBeNull();
    });

    it('should automatically reset for new period (unique constraint)', async () => {
      // Simulate period change: January → February
      const now = new Date('2025-02-01T00:00:00Z');
      vi.setSystemTime(now);

      const mockUsage = {
        id: 'usage-feb',
        userId: 'user-123',
        period: '2025-02',
        uploadsUsed: 0,
        lastUploadAt: null,
        createdAt: new Date('2025-02-01T00:00:00Z'),
        updatedAt: new Date('2025-02-01T00:00:00Z'),
      };

      vi.mocked(prisma.insightUsage.upsert).mockResolvedValue(mockUsage);

      const usage = await getUsage('user-123');

      expect(usage.period).toBe('2025-02');
      expect(usage.uploadsUsed).toBe(0);
    });
  });

  describe('incrementUsage', () => {
    it('should atomically increment upload count', async () => {
      const now = new Date('2025-12-06T10:30:00Z');
      vi.setSystemTime(now);

      const mockUpdated = {
        id: 'usage-123',
        userId: 'user-123',
        period: '2025-12',
        uploadsUsed: 6,
        lastUploadAt: now,
        createdAt: new Date('2025-12-01T00:00:00Z'),
        updatedAt: now,
      };

      vi.mocked(prisma.insightUsage.update).mockResolvedValue(mockUpdated);

      const usage = await incrementUsage('user-123');

      expect(prisma.insightUsage.update).toHaveBeenCalledWith({
        where: {
          userId_period: {
            userId: 'user-123',
            period: '2025-12',
          },
        },
        data: {
          uploadsUsed: {
            increment: 1,
          },
          lastUploadAt: now,
        },
      });
      expect(usage.uploadsUsed).toBe(6);
    });

    it('should update lastUploadAt timestamp', async () => {
      const now = new Date('2025-12-06T15:45:00Z');
      vi.setSystemTime(now);

      const mockUpdated = {
        id: 'usage-123',
        userId: 'user-123',
        period: '2025-12',
        uploadsUsed: 1,
        lastUploadAt: now,
        createdAt: new Date('2025-12-01T00:00:00Z'),
        updatedAt: now,
      };

      vi.mocked(prisma.insightUsage.update).mockResolvedValue(mockUpdated);

      const usage = await incrementUsage('user-123');

      expect(usage.lastUploadAt).toEqual(now);
    });

    it('should handle concurrent increments (atomic operation)', async () => {
      // Simulate 3 concurrent uploads
      const now = new Date('2025-12-06T10:30:00Z');
      vi.setSystemTime(now);

      const responses = [
        { ...createMockUsage('user-123', '2025-12', 1), lastUploadAt: now },
        { ...createMockUsage('user-123', '2025-12', 2), lastUploadAt: now },
        { ...createMockUsage('user-123', '2025-12', 3), lastUploadAt: now },
      ];

      vi.mocked(prisma.insightUsage.update)
        .mockResolvedValueOnce(responses[0])
        .mockResolvedValueOnce(responses[1])
        .mockResolvedValueOnce(responses[2]);

      const results = await Promise.all([
        incrementUsage('user-123'),
        incrementUsage('user-123'),
        incrementUsage('user-123'),
      ]);

      expect(prisma.insightUsage.update).toHaveBeenCalledTimes(3);
      expect(results[0].uploadsUsed).toBe(1);
      expect(results[1].uploadsUsed).toBe(2);
      expect(results[2].uploadsUsed).toBe(3);
    });
  });

  describe('resetIfNewPeriod', () => {
    it('should reset usage when period changes', async () => {
      const now = new Date('2025-02-01T00:00:00Z');
      vi.setSystemTime(now);

      const mockUsage = {
        id: 'usage-feb',
        userId: 'user-123',
        period: '2025-02',
        uploadsUsed: 0,
        lastUploadAt: null,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(prisma.insightUsage.upsert).mockResolvedValue(mockUsage);

      const usage = await resetIfNewPeriod('user-123');

      expect(usage.period).toBe('2025-02');
      expect(usage.uploadsUsed).toBe(0);
    });

    it('should return existing record if same period', async () => {
      const now = new Date('2025-12-15T10:30:00Z');
      vi.setSystemTime(now);

      const mockUsage = createMockUsage('user-123', '2025-12', 15);
      vi.mocked(prisma.insightUsage.upsert).mockResolvedValue(mockUsage);

      const usage = await resetIfNewPeriod('user-123');

      expect(usage.period).toBe('2025-12');
      expect(usage.uploadsUsed).toBe(15);
    });

    it('should handle December → January transition', async () => {
      const now = new Date('2026-01-01T00:00:00Z');
      vi.setSystemTime(now);

      const mockUsage = {
        id: 'usage-jan',
        userId: 'user-123',
        period: '2026-01',
        uploadsUsed: 0,
        lastUploadAt: null,
        createdAt: now,
        updatedAt: now,
      };

      vi.mocked(prisma.insightUsage.upsert).mockResolvedValue(mockUsage);

      const usage = await resetIfNewPeriod('user-123');

      expect(usage.period).toBe('2026-01');
      expect(usage.uploadsUsed).toBe(0);
    });
  });

  describe('getUserUsageHistory', () => {
    it('should return all usage records for user ordered by period desc', async () => {
      const mockHistory = [
        createMockUsage('user-123', '2025-12', 15),
        createMockUsage('user-123', '2025-11', 42),
        createMockUsage('user-123', '2025-10', 38),
      ];

      vi.mocked(prisma.insightUsage.findMany).mockResolvedValue(mockHistory);

      const history = await getUserUsageHistory('user-123');

      expect(prisma.insightUsage.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { period: 'desc' },
      });
      expect(history).toEqual(mockHistory);
      expect(history).toHaveLength(3);
    });

    it('should return empty array for new user', async () => {
      vi.mocked(prisma.insightUsage.findMany).mockResolvedValue([]);

      const history = await getUserUsageHistory('user-new');

      expect(history).toEqual([]);
    });
  });

  describe('cleanupOldUsage', () => {
    it('should delete records older than 12 months by default', async () => {
      const now = new Date('2025-12-06T10:30:00Z');
      vi.setSystemTime(now);

      vi.mocked(prisma.insightUsage.deleteMany).mockResolvedValue({ count: 5 });

      const deleted = await cleanupOldUsage();

      expect(prisma.insightUsage.deleteMany).toHaveBeenCalledWith({
        where: {
          period: {
            lt: '2024-12', // 12 months ago
          },
        },
      });
      expect(deleted).toBe(5);
    });

    it('should delete records older than custom months', async () => {
      const now = new Date('2025-12-06T10:30:00Z');
      vi.setSystemTime(now);

      vi.mocked(prisma.insightUsage.deleteMany).mockResolvedValue({ count: 3 });

      const deleted = await cleanupOldUsage(6); // Keep last 6 months

      expect(prisma.insightUsage.deleteMany).toHaveBeenCalledWith({
        where: {
          period: {
            lt: '2025-06', // 6 months ago
          },
        },
      });
      expect(deleted).toBe(3);
    });

    it('should return 0 if no old records', async () => {
      vi.mocked(prisma.insightUsage.deleteMany).mockResolvedValue({ count: 0 });

      const deleted = await cleanupOldUsage();

      expect(deleted).toBe(0);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle full upload lifecycle', async () => {
      const now = new Date('2025-12-06T10:30:00Z');
      vi.setSystemTime(now);

      // Step 1: Get initial usage
      const initialUsage = createMockUsage('user-123', '2025-12', 0);
      vi.mocked(prisma.insightUsage.upsert).mockResolvedValue(initialUsage);

      const usage1 = await getUsage('user-123');
      expect(usage1.uploadsUsed).toBe(0);

      // Step 2: First upload
      const afterUpload1 = { ...initialUsage, uploadsUsed: 1, lastUploadAt: now };
      vi.mocked(prisma.insightUsage.update).mockResolvedValue(afterUpload1);

      const usage2 = await incrementUsage('user-123');
      expect(usage2.uploadsUsed).toBe(1);

      // Step 3: Second upload
      const afterUpload2 = { ...initialUsage, uploadsUsed: 2, lastUploadAt: now };
      vi.mocked(prisma.insightUsage.update).mockResolvedValue(afterUpload2);

      const usage3 = await incrementUsage('user-123');
      expect(usage3.uploadsUsed).toBe(2);
    });

    it('should handle quota limit enforcement', async () => {
      const now = new Date('2025-12-06T10:30:00Z');
      vi.setSystemTime(now);

      // User has 9 uploads (FREE plan limit: 10)
      const nearLimit = createMockUsage('user-123', '2025-12', 9);
      vi.mocked(prisma.insightUsage.upsert).mockResolvedValue(nearLimit);

      const usage = await getUsage('user-123');
      expect(usage.uploadsUsed).toBe(9);

      // Next upload should trigger quota check (10/10)
      const atLimit = { ...nearLimit, uploadsUsed: 10, lastUploadAt: now };
      vi.mocked(prisma.insightUsage.update).mockResolvedValue(atLimit);

      const afterLast = await incrementUsage('user-123');
      expect(afterLast.uploadsUsed).toBe(10);

      // 11th upload should be blocked by quota system (not this service)
    });
  });
});

// Helper functions
function createMockUsage(userId: string, period: string, uploadsUsed: number) {
  return {
    id: `usage-${userId}-${period}`,
    userId,
    period,
    uploadsUsed,
    lastUploadAt: uploadsUsed > 0 ? new Date('2025-12-05T14:20:00Z') : null,
    createdAt: new Date(`${period}-01T00:00:00Z`),
    updatedAt: new Date('2025-12-06T10:30:00Z'),
  };
}
