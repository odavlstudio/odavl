/**
 * Unit Tests for ODAVL Insight Plans
 * Phase 3.0.1 - Plan Definitions & Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  FREE_PLAN,
  PRO_PLAN,
  TEAM_PLAN,
  ENTERPRISE_PLAN,
  INSIGHT_PLANS,
  getInsightPlan,
  isValidInsightPlan,
  getDefaultInsightPlan,
  comparePlans,
  hasUnlimitedUploads,
  hasUnlimitedHistory,
} from '../../../lib/plans/insight-plans';

describe('Insight Plans', () => {
  describe('Plan Definitions', () => {
    it('should define FREE plan correctly', () => {
      expect(FREE_PLAN.id).toBe('FREE');
      expect(FREE_PLAN.name).toBe('Free');
      expect(FREE_PLAN.monthlyUploadLimit).toBe(10);
      expect(FREE_PLAN.allowSarifUpload).toBe(false);
      expect(FREE_PLAN.allowOfflineQueue).toBe(true);
      expect(FREE_PLAN.historyRetentionDays).toBe(7);
      expect(FREE_PLAN.maxTeamMembers).toBe(1);
      expect(FREE_PLAN.prioritySupport).toBe(false);
      expect(FREE_PLAN.customRules).toBe(false);
      expect(FREE_PLAN.apiAccess).toBe(false);
    });

    it('should define PRO plan correctly', () => {
      expect(PRO_PLAN.id).toBe('PRO');
      expect(PRO_PLAN.name).toBe('Pro');
      expect(PRO_PLAN.monthlyUploadLimit).toBe(100);
      expect(PRO_PLAN.allowSarifUpload).toBe(true);
      expect(PRO_PLAN.allowOfflineQueue).toBe(true);
      expect(PRO_PLAN.historyRetentionDays).toBe(30);
      expect(PRO_PLAN.maxTeamMembers).toBe(1);
      expect(PRO_PLAN.prioritySupport).toBe(false);
      expect(PRO_PLAN.customRules).toBe(true);
      expect(PRO_PLAN.apiAccess).toBe(true);
    });

    it('should define TEAM plan correctly', () => {
      expect(TEAM_PLAN.id).toBe('TEAM');
      expect(TEAM_PLAN.name).toBe('Team');
      expect(TEAM_PLAN.monthlyUploadLimit).toBe(500);
      expect(TEAM_PLAN.allowSarifUpload).toBe(true);
      expect(TEAM_PLAN.allowOfflineQueue).toBe(true);
      expect(TEAM_PLAN.historyRetentionDays).toBe(90);
      expect(TEAM_PLAN.maxTeamMembers).toBe(10);
      expect(TEAM_PLAN.prioritySupport).toBe(true);
      expect(TEAM_PLAN.customRules).toBe(true);
      expect(TEAM_PLAN.apiAccess).toBe(true);
    });

    it('should define ENTERPRISE plan correctly', () => {
      expect(ENTERPRISE_PLAN.id).toBe('ENTERPRISE');
      expect(ENTERPRISE_PLAN.name).toBe('Enterprise');
      expect(ENTERPRISE_PLAN.monthlyUploadLimit).toBe(0); // Unlimited
      expect(ENTERPRISE_PLAN.allowSarifUpload).toBe(true);
      expect(ENTERPRISE_PLAN.allowOfflineQueue).toBe(true);
      expect(ENTERPRISE_PLAN.historyRetentionDays).toBe(0); // Forever
      expect(ENTERPRISE_PLAN.maxTeamMembers).toBe(0); // Unlimited
      expect(ENTERPRISE_PLAN.prioritySupport).toBe(true);
      expect(ENTERPRISE_PLAN.customRules).toBe(true);
      expect(ENTERPRISE_PLAN.apiAccess).toBe(true);
    });

    it('should include all plans in INSIGHT_PLANS', () => {
      expect(Object.keys(INSIGHT_PLANS)).toHaveLength(4);
      expect(INSIGHT_PLANS.FREE).toBe(FREE_PLAN);
      expect(INSIGHT_PLANS.PRO).toBe(PRO_PLAN);
      expect(INSIGHT_PLANS.TEAM).toBe(TEAM_PLAN);
      expect(INSIGHT_PLANS.ENTERPRISE).toBe(ENTERPRISE_PLAN);
    });
  });

  describe('getInsightPlan', () => {
    it('should return correct plan by ID', () => {
      expect(getInsightPlan('FREE')).toBe(FREE_PLAN);
      expect(getInsightPlan('PRO')).toBe(PRO_PLAN);
      expect(getInsightPlan('TEAM')).toBe(TEAM_PLAN);
      expect(getInsightPlan('ENTERPRISE')).toBe(ENTERPRISE_PLAN);
    });
  });

  describe('isValidInsightPlan', () => {
    it('should return true for valid plan IDs', () => {
      expect(isValidInsightPlan('FREE')).toBe(true);
      expect(isValidInsightPlan('PRO')).toBe(true);
      expect(isValidInsightPlan('TEAM')).toBe(true);
      expect(isValidInsightPlan('ENTERPRISE')).toBe(true);
    });

    it('should return false for invalid plan IDs', () => {
      expect(isValidInsightPlan('INVALID')).toBe(false);
      expect(isValidInsightPlan('free')).toBe(false); // Case-sensitive
      expect(isValidInsightPlan('')).toBe(false);
      expect(isValidInsightPlan('BASIC')).toBe(false);
    });
  });

  describe('getDefaultInsightPlan', () => {
    it('should return FREE plan as default', () => {
      expect(getDefaultInsightPlan()).toBe(FREE_PLAN);
    });
  });

  describe('comparePlans', () => {
    it('should return 0 for same plans', () => {
      expect(comparePlans('FREE', 'FREE')).toBe(0);
      expect(comparePlans('PRO', 'PRO')).toBe(0);
      expect(comparePlans('TEAM', 'TEAM')).toBe(0);
      expect(comparePlans('ENTERPRISE', 'ENTERPRISE')).toBe(0);
    });

    it('should return 1 when plan1 > plan2', () => {
      expect(comparePlans('PRO', 'FREE')).toBe(1);
      expect(comparePlans('TEAM', 'FREE')).toBe(1);
      expect(comparePlans('TEAM', 'PRO')).toBe(1);
      expect(comparePlans('ENTERPRISE', 'FREE')).toBe(1);
      expect(comparePlans('ENTERPRISE', 'PRO')).toBe(1);
      expect(comparePlans('ENTERPRISE', 'TEAM')).toBe(1);
    });

    it('should return -1 when plan1 < plan2', () => {
      expect(comparePlans('FREE', 'PRO')).toBe(-1);
      expect(comparePlans('FREE', 'TEAM')).toBe(-1);
      expect(comparePlans('FREE', 'ENTERPRISE')).toBe(-1);
      expect(comparePlans('PRO', 'TEAM')).toBe(-1);
      expect(comparePlans('PRO', 'ENTERPRISE')).toBe(-1);
      expect(comparePlans('TEAM', 'ENTERPRISE')).toBe(-1);
    });
  });

  describe('hasUnlimitedUploads', () => {
    it('should return false for plans with limits', () => {
      expect(hasUnlimitedUploads('FREE')).toBe(false);
      expect(hasUnlimitedUploads('PRO')).toBe(false);
      expect(hasUnlimitedUploads('TEAM')).toBe(false);
    });

    it('should return true for ENTERPRISE plan', () => {
      expect(hasUnlimitedUploads('ENTERPRISE')).toBe(true);
    });
  });

  describe('hasUnlimitedHistory', () => {
    it('should return false for plans with retention limits', () => {
      expect(hasUnlimitedHistory('FREE')).toBe(false);
      expect(hasUnlimitedHistory('PRO')).toBe(false);
      expect(hasUnlimitedHistory('TEAM')).toBe(false);
    });

    it('should return true for ENTERPRISE plan', () => {
      expect(hasUnlimitedHistory('ENTERPRISE')).toBe(true);
    });
  });

  describe('Plan Feature Progression', () => {
    it('should show SARIF progression correctly', () => {
      expect(FREE_PLAN.allowSarifUpload).toBe(false);
      expect(PRO_PLAN.allowSarifUpload).toBe(true);
      expect(TEAM_PLAN.allowSarifUpload).toBe(true);
      expect(ENTERPRISE_PLAN.allowSarifUpload).toBe(true);
    });

    it('should show upload limit progression', () => {
      expect(FREE_PLAN.monthlyUploadLimit).toBe(10);
      expect(PRO_PLAN.monthlyUploadLimit).toBe(100);
      expect(TEAM_PLAN.monthlyUploadLimit).toBe(500);
      expect(ENTERPRISE_PLAN.monthlyUploadLimit).toBe(0); // Unlimited
    });

    it('should show history retention progression', () => {
      expect(FREE_PLAN.historyRetentionDays).toBe(7);
      expect(PRO_PLAN.historyRetentionDays).toBe(30);
      expect(TEAM_PLAN.historyRetentionDays).toBe(90);
      expect(ENTERPRISE_PLAN.historyRetentionDays).toBe(0); // Forever
    });

    it('should show team member progression', () => {
      expect(FREE_PLAN.maxTeamMembers).toBe(1);
      expect(PRO_PLAN.maxTeamMembers).toBe(1);
      expect(TEAM_PLAN.maxTeamMembers).toBe(10);
      expect(ENTERPRISE_PLAN.maxTeamMembers).toBe(0); // Unlimited
    });

    it('should show support progression', () => {
      expect(FREE_PLAN.prioritySupport).toBe(false);
      expect(PRO_PLAN.prioritySupport).toBe(false);
      expect(TEAM_PLAN.prioritySupport).toBe(true);
      expect(ENTERPRISE_PLAN.prioritySupport).toBe(true);
    });
  });
});
