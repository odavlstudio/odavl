/**
 * Unit Tests for ODAVL Insight Quota Engine
 * Phase 3.0.1 - Quota & Policy Logic
 */

import { describe, it, expect } from 'vitest';
import {
  canUploadAnalysis,
  remainingUploads,
  canUseSarif,
  canUseOfflineQueue,
  getMaxQueueSize,
  isQueueWithinLimits,
  getQuotaUsagePercentage,
  isApproachingQuotaLimit,
  getSuggestedUpgrade,
  getQuotaExceededMessage,
  getApproachingLimitWarning,
  createNewBillingPeriod,
  isWithinBillingPeriod,
  type UsageData,
} from '../../../lib/quota/insight-quota';

describe('Insight Quota Engine', () => {
  // Test fixtures
  const mockUsageData: UsageData = {
    uploadsThisMonth: 5,
    billingPeriodStart: new Date('2025-12-01'),
    billingPeriodEnd: new Date('2026-01-01'),
  };

  describe('canUploadAnalysis', () => {
    it('should allow upload when quota available (FREE plan)', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 5 };
      const result = canUploadAnalysis('FREE', usage);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5); // 10 - 5 = 5
      expect(result.limit).toBe(10);
      expect(result.reason).toBeUndefined();
    });

    it('should deny upload when quota exceeded (FREE plan)', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 10 };
      const result = canUploadAnalysis('FREE', usage);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(10);
      expect(result.reason).toContain('Monthly upload limit reached');
      expect(result.suggestedPlan).toBe('PRO');
      expect(result.upgradeUrl).toBe('/pricing?source=quota_exceeded');
    });

    it('should allow unlimited uploads for ENTERPRISE plan', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 1000 };
      const result = canUploadAnalysis('ENTERPRISE', usage);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
      expect(result.limit).toBe(0); // 0 = unlimited
    });

    it('should allow upload when quota available (PRO plan)', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 50 };
      const result = canUploadAnalysis('PRO', usage);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(50); // 100 - 50 = 50
      expect(result.limit).toBe(100);
    });

    it('should deny upload when quota exceeded (TEAM plan)', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 500 };
      const result = canUploadAnalysis('TEAM', usage);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(500);
      expect(result.suggestedPlan).toBe('ENTERPRISE');
    });
  });

  describe('remainingUploads', () => {
    it('should return correct remaining uploads (FREE plan)', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 7 };
      const remaining = remainingUploads('FREE', usage);

      expect(remaining).toBe(3); // 10 - 7 = 3
    });

    it('should return 0 when quota exhausted', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 15 };
      const remaining = remainingUploads('FREE', usage);

      expect(remaining).toBe(0); // Can't be negative
    });

    it('should return Infinity for unlimited plans', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 999 };
      const remaining = remainingUploads('ENTERPRISE', usage);

      expect(remaining).toBe(Infinity);
    });

    it('should return correct remaining uploads (PRO plan)', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 80 };
      const remaining = remainingUploads('PRO', usage);

      expect(remaining).toBe(20); // 100 - 80 = 20
    });
  });

  describe('canUseSarif', () => {
    it('should deny SARIF for FREE plan', () => {
      expect(canUseSarif('FREE')).toBe(false);
    });

    it('should allow SARIF for PRO plan', () => {
      expect(canUseSarif('PRO')).toBe(true);
    });

    it('should allow SARIF for TEAM plan', () => {
      expect(canUseSarif('TEAM')).toBe(true);
    });

    it('should allow SARIF for ENTERPRISE plan', () => {
      expect(canUseSarif('ENTERPRISE')).toBe(true);
    });
  });

  describe('canUseOfflineQueue', () => {
    it('should allow offline queue for all plans', () => {
      expect(canUseOfflineQueue('FREE')).toBe(true);
      expect(canUseOfflineQueue('PRO')).toBe(true);
      expect(canUseOfflineQueue('TEAM')).toBe(true);
      expect(canUseOfflineQueue('ENTERPRISE')).toBe(true);
    });
  });

  describe('getMaxQueueSize', () => {
    it('should return 3 for FREE plan', () => {
      expect(getMaxQueueSize('FREE')).toBe(3);
    });

    it('should return 0 (unlimited) for paid plans', () => {
      expect(getMaxQueueSize('PRO')).toBe(0);
      expect(getMaxQueueSize('TEAM')).toBe(0);
      expect(getMaxQueueSize('ENTERPRISE')).toBe(0);
    });
  });

  describe('isQueueWithinLimits', () => {
    it('should enforce 3-entry limit for FREE plan', () => {
      expect(isQueueWithinLimits('FREE', 2)).toBe(true);
      expect(isQueueWithinLimits('FREE', 3)).toBe(false); // At limit
      expect(isQueueWithinLimits('FREE', 5)).toBe(false);
    });

    it('should allow unlimited queue for paid plans', () => {
      expect(isQueueWithinLimits('PRO', 100)).toBe(true);
      expect(isQueueWithinLimits('TEAM', 1000)).toBe(true);
      expect(isQueueWithinLimits('ENTERPRISE', 10000)).toBe(true);
    });
  });

  describe('getQuotaUsagePercentage', () => {
    it('should return correct percentage (FREE plan)', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 5 };
      const percentage = getQuotaUsagePercentage('FREE', usage);

      expect(percentage).toBe(50); // 5/10 = 50%
    });

    it('should return 100% when quota exceeded', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 15 };
      const percentage = getQuotaUsagePercentage('FREE', usage);

      expect(percentage).toBe(100); // Capped at 100%
    });

    it('should return null for unlimited plans', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 999 };
      const percentage = getQuotaUsagePercentage('ENTERPRISE', usage);

      expect(percentage).toBeNull();
    });

    it('should return correct percentage (PRO plan)', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 80 };
      const percentage = getQuotaUsagePercentage('PRO', usage);

      expect(percentage).toBe(80); // 80/100 = 80%
    });
  });

  describe('isApproachingQuotaLimit', () => {
    it('should return false when below 80% (FREE plan)', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 7 };
      expect(isApproachingQuotaLimit('FREE', usage)).toBe(false); // 70%
    });

    it('should return true when at or above 80%', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 8 };
      expect(isApproachingQuotaLimit('FREE', usage)).toBe(true); // 80%

      const usage2: UsageData = { ...mockUsageData, uploadsThisMonth: 9 };
      expect(isApproachingQuotaLimit('FREE', usage2)).toBe(true); // 90%
    });

    it('should return false for unlimited plans', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 999 };
      expect(isApproachingQuotaLimit('ENTERPRISE', usage)).toBe(false);
    });
  });

  describe('getSuggestedUpgrade', () => {
    it('should suggest correct upgrade path', () => {
      expect(getSuggestedUpgrade('FREE')).toBe('PRO');
      expect(getSuggestedUpgrade('PRO')).toBe('TEAM');
      expect(getSuggestedUpgrade('TEAM')).toBe('ENTERPRISE');
      expect(getSuggestedUpgrade('ENTERPRISE')).toBe('ENTERPRISE');
    });
  });

  describe('getQuotaExceededMessage', () => {
    it('should generate correct error message (FREE plan)', () => {
      const message = getQuotaExceededMessage('FREE', mockUsageData);

      expect(message).toContain('10 uploads');
      expect(message).toContain('PRO');
    });

    it('should generate correct error message (PRO plan)', () => {
      const message = getQuotaExceededMessage('PRO', mockUsageData);

      expect(message).toContain('100 uploads');
      expect(message).toContain('TEAM');
    });
  });

  describe('getApproachingLimitWarning', () => {
    it('should return null when not approaching limit', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 5 };
      const warning = getApproachingLimitWarning('FREE', usage);

      expect(warning).toBeNull(); // 50% used
    });

    it('should return warning when approaching limit', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 8 };
      const warning = getApproachingLimitWarning('FREE', usage);

      expect(warning).toContain('2 of 10 uploads remaining'); // 80% used
    });

    it('should return null for unlimited plans', () => {
      const usage: UsageData = { ...mockUsageData, uploadsThisMonth: 999 };
      const warning = getApproachingLimitWarning('ENTERPRISE', usage);

      expect(warning).toBeNull();
    });
  });

  describe('createNewBillingPeriod', () => {
    it('should create fresh usage data', () => {
      const start = new Date('2025-12-01');
      const usage = createNewBillingPeriod(start);

      expect(usage.uploadsThisMonth).toBe(0);
      expect(usage.billingPeriodStart).toEqual(start);
      expect(usage.billingPeriodEnd).toEqual(new Date('2026-01-01'));
    });

    it('should handle month rollover correctly', () => {
      const start = new Date('2025-11-15');
      const usage = createNewBillingPeriod(start);

      expect(usage.billingPeriodEnd.getMonth()).toBe(11); // December (0-indexed)
      expect(usage.billingPeriodEnd.getDate()).toBe(15);
    });
  });

  describe('isWithinBillingPeriod', () => {
    it('should return true when date is within period', () => {
      const checkDate = new Date('2025-12-15');
      expect(isWithinBillingPeriod(mockUsageData, checkDate)).toBe(true);
    });

    it('should return false when date is before period', () => {
      const checkDate = new Date('2025-11-30');
      expect(isWithinBillingPeriod(mockUsageData, checkDate)).toBe(false);
    });

    it('should return false when date is after period', () => {
      const checkDate = new Date('2026-01-01');
      expect(isWithinBillingPeriod(mockUsageData, checkDate)).toBe(false);
    });

    it('should handle edge case at period start', () => {
      const checkDate = new Date('2025-12-01T00:00:00');
      expect(isWithinBillingPeriod(mockUsageData, checkDate)).toBe(true);
    });

    it('should handle edge case at period end', () => {
      const checkDate = new Date('2025-12-31T23:59:59');
      expect(isWithinBillingPeriod(mockUsageData, checkDate)).toBe(true);
    });
  });
});
