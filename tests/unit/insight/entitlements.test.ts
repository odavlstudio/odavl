/**
 * ODAVL Insight Entitlements Module - Unit Tests
 * 
 * Tests all entitlement functions to ensure proper plan limits enforcement.
 * 
 * @group unit
 * @group insight
 */

import { describe, it, expect } from 'vitest';
import {
  canRunCloudAnalysis,
  getAnalysisLimits,
  checkDailyLimit,
  getEnabledDetectors,
  isEnterpriseFeatureEnabled,
  getEffectivePlanId,
  type TrialConfig,
  type EntitlementContext,
} from '../../../odavl-studio/insight/core/src/config/insight-entitlements.js';
import type { InsightPlanId } from '../../../odavl-studio/insight/core/src/config/insight-product.js';

describe('Insight Entitlements - Cloud Analysis', () => {
  it('FREE plan cannot run cloud analysis', () => {
    expect(canRunCloudAnalysis('INSIGHT_FREE')).toBe(false);
  });

  it('PRO plan can run cloud analysis', () => {
    expect(canRunCloudAnalysis('INSIGHT_PRO')).toBe(true);
  });

  it('TEAM plan can run cloud analysis', () => {
    expect(canRunCloudAnalysis('INSIGHT_TEAM')).toBe(true);
  });

  it('ENTERPRISE plan can run cloud analysis', () => {
    expect(canRunCloudAnalysis('INSIGHT_ENTERPRISE')).toBe(true);
  });
});

describe('Insight Entitlements - Analysis Limits', () => {
  describe('FREE plan limits', () => {
    const limits = getAnalysisLimits('INSIGHT_FREE');

    it('should have 1 project limit', () => {
      expect(limits.maxProjects).toBe(1);
    });

    it('should have 100 files per analysis limit', () => {
      expect(limits.maxFilesPerAnalysis).toBe(100);
    });

    it('should have 5 analyses per day limit', () => {
      expect(limits.maxAnalysesPerDay).toBe(5);
    });

    it('should have 7 days retention', () => {
      expect(limits.historicalRetentionDays).toBe(7);
    });

    it('should have 1 concurrent analysis', () => {
      expect(limits.maxConcurrentAnalyses).toBe(1);
    });
  });

  describe('PRO plan limits', () => {
    const limits = getAnalysisLimits('INSIGHT_PRO');

    it('should have 10 project limit', () => {
      expect(limits.maxProjects).toBe(10);
    });

    it('should have 1000 files per analysis limit', () => {
      expect(limits.maxFilesPerAnalysis).toBe(1000);
    });

    it('should have 100 analyses per day limit', () => {
      expect(limits.maxAnalysesPerDay).toBe(100);
    });

    it('should have 90 days retention', () => {
      expect(limits.historicalRetentionDays).toBe(90);
    });

    it('should have 3 concurrent analyses', () => {
      expect(limits.maxConcurrentAnalyses).toBe(3);
    });
  });

  describe('TEAM plan limits', () => {
    const limits = getAnalysisLimits('INSIGHT_TEAM');

    it('should have 50 project limit', () => {
      expect(limits.maxProjects).toBe(50);
    });

    it('should have 5000 files per analysis limit', () => {
      expect(limits.maxFilesPerAnalysis).toBe(5000);
    });

    it('should have 500 analyses per day limit', () => {
      expect(limits.maxAnalysesPerDay).toBe(500);
    });

    it('should have 180 days retention', () => {
      expect(limits.historicalRetentionDays).toBe(180);
    });

    it('should have 10 concurrent analyses', () => {
      expect(limits.maxConcurrentAnalyses).toBe(10);
    });
  });

  describe('ENTERPRISE plan limits', () => {
    const limits = getAnalysisLimits('INSIGHT_ENTERPRISE');

    it('should have unlimited projects', () => {
      expect(limits.maxProjects).toBe(-1);
    });

    it('should have unlimited files per analysis', () => {
      expect(limits.maxFilesPerAnalysis).toBe(-1);
    });

    it('should have unlimited analyses per day', () => {
      expect(limits.maxAnalysesPerDay).toBe(-1);
    });

    it('should have 365 days retention', () => {
      expect(limits.historicalRetentionDays).toBe(365);
    });

    it('should have unlimited concurrent analyses', () => {
      expect(limits.maxConcurrentAnalyses).toBe(-1);
    });
  });
});

describe('Insight Entitlements - Trial Behavior', () => {
  it('FREE plan with PRO trial should get PRO limits', () => {
    const trial: TrialConfig = {
      isTrial: true,
      trialPlanId: 'INSIGHT_PRO',
      daysRemaining: 14,
    };
    
    const limits = getAnalysisLimits('INSIGHT_FREE', trial);
    
    expect(limits.maxProjects).toBe(10);
    expect(limits.maxFilesPerAnalysis).toBe(1000);
    expect(limits.maxAnalysesPerDay).toBe(100);
  });

  it('FREE plan with expired trial should get FREE limits', () => {
    const trial: TrialConfig = {
      isTrial: true,
      trialPlanId: 'INSIGHT_PRO',
      daysRemaining: 0, // Expired
    };
    
    const limits = getAnalysisLimits('INSIGHT_FREE', trial);
    
    expect(limits.maxProjects).toBe(1);
    expect(limits.maxFilesPerAnalysis).toBe(100);
    expect(limits.maxAnalysesPerDay).toBe(5);
  });

  it('PRO plan with TEAM trial should get TEAM limits', () => {
    const trial: TrialConfig = {
      isTrial: true,
      trialPlanId: 'INSIGHT_TEAM',
      daysRemaining: 7,
    };
    
    const limits = getAnalysisLimits('INSIGHT_PRO', trial);
    
    expect(limits.maxProjects).toBe(50);
    expect(limits.maxFilesPerAnalysis).toBe(5000);
    expect(limits.maxConcurrentAnalyses).toBe(10);
  });

  it('should use effective plan ID during trial', () => {
    const trial: TrialConfig = {
      isTrial: true,
      trialPlanId: 'INSIGHT_PRO',
      daysRemaining: 14,
    };
    
    const effectivePlan = getEffectivePlanId('INSIGHT_FREE', trial);
    expect(effectivePlan).toBe('INSIGHT_PRO');
  });

  it('should use base plan ID after trial expires', () => {
    const trial: TrialConfig = {
      isTrial: true,
      trialPlanId: 'INSIGHT_PRO',
      daysRemaining: 0,
    };
    
    const effectivePlan = getEffectivePlanId('INSIGHT_FREE', trial);
    expect(effectivePlan).toBe('INSIGHT_FREE');
  });
});

describe('Insight Entitlements - Daily Limit Checks', () => {
  it('should allow analysis when under daily limit', () => {
    const result = checkDailyLimit('INSIGHT_FREE', 3, undefined);
    
    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(3);
    expect(result.maxAllowed).toBe(5);
    expect(result.remaining).toBe(2);
  });

  it('should block analysis when at daily limit', () => {
    const result = checkDailyLimit('INSIGHT_FREE', 5, undefined);
    
    expect(result.allowed).toBe(false);
    expect(result.currentCount).toBe(5);
    expect(result.maxAllowed).toBe(5);
    expect(result.remaining).toBe(0);
  });

  it('should block analysis when over daily limit', () => {
    const result = checkDailyLimit('INSIGHT_FREE', 10, undefined);
    
    expect(result.allowed).toBe(false);
    expect(result.currentCount).toBe(10);
    expect(result.maxAllowed).toBe(5);
    expect(result.remaining).toBe(0);
  });

  it('ENTERPRISE plan should always allow analysis (unlimited)', () => {
    const result = checkDailyLimit('INSIGHT_ENTERPRISE', 1000, undefined);
    
    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(1000);
    expect(result.maxAllowed).toBe(-1);
    expect(result.remaining).toBe(-1);
  });

  it('should use trial plan limits for daily checks', () => {
    const trial: TrialConfig = {
      isTrial: true,
      trialPlanId: 'INSIGHT_PRO',
      daysRemaining: 14,
    };
    
    // FREE would normally max at 5, but PRO trial allows 100
    const result = checkDailyLimit('INSIGHT_FREE', 50, trial);
    
    expect(result.allowed).toBe(true);
    expect(result.maxAllowed).toBe(100);
    expect(result.remaining).toBe(50);
  });
});

describe('Insight Entitlements - Detector Access', () => {
  it('FREE plan should have 6 detectors', () => {
    const detectors = getEnabledDetectors('INSIGHT_FREE');
    expect(detectors).toHaveLength(6);
    expect(detectors).toContain('typescript');
    expect(detectors).toContain('eslint');
    expect(detectors).toContain('security');
  });

  it('PRO plan should have 11 detectors', () => {
    const detectors = getEnabledDetectors('INSIGHT_PRO');
    expect(detectors).toHaveLength(11);
    expect(detectors).toContain('performance');
    expect(detectors).toContain('import');
    expect(detectors).toContain('circular');
  });

  it('TEAM plan should have 14 detectors', () => {
    const detectors = getEnabledDetectors('INSIGHT_TEAM');
    expect(detectors).toHaveLength(14);
    expect(detectors).toContain('database');
    expect(detectors).toContain('infrastructure');
  });

  it('ENTERPRISE plan should have all 16 detectors', () => {
    const detectors = getEnabledDetectors('INSIGHT_ENTERPRISE');
    expect(detectors).toHaveLength(16);
    expect(detectors).toContain('nextjs');
    expect(detectors).toContain('cicd');
  });
});

describe('Insight Entitlements - Enterprise Features', () => {
  it('should deny enterprise features for FREE plan', () => {
    expect(isEnterpriseFeatureEnabled('INSIGHT_FREE', 'sso')).toBe(false);
    expect(isEnterpriseFeatureEnabled('INSIGHT_FREE', 'saml')).toBe(false);
    expect(isEnterpriseFeatureEnabled('INSIGHT_FREE', 'audit_logs')).toBe(false);
  });

  it('should deny enterprise features for PRO plan', () => {
    expect(isEnterpriseFeatureEnabled('INSIGHT_PRO', 'sso')).toBe(false);
    expect(isEnterpriseFeatureEnabled('INSIGHT_PRO', 'rbac')).toBe(false);
  });

  it('should deny enterprise features for TEAM plan', () => {
    expect(isEnterpriseFeatureEnabled('INSIGHT_TEAM', 'sso')).toBe(false);
    expect(isEnterpriseFeatureEnabled('INSIGHT_TEAM', 'on_premise')).toBe(false);
  });

  it('should grant all enterprise features for ENTERPRISE plan', () => {
    expect(isEnterpriseFeatureEnabled('INSIGHT_ENTERPRISE', 'sso')).toBe(true);
    expect(isEnterpriseFeatureEnabled('INSIGHT_ENTERPRISE', 'saml')).toBe(true);
    expect(isEnterpriseFeatureEnabled('INSIGHT_ENTERPRISE', 'audit_logs')).toBe(true);
    expect(isEnterpriseFeatureEnabled('INSIGHT_ENTERPRISE', 'rbac')).toBe(true);
    expect(isEnterpriseFeatureEnabled('INSIGHT_ENTERPRISE', 'on_premise')).toBe(true);
    expect(isEnterpriseFeatureEnabled('INSIGHT_ENTERPRISE', 'white_label')).toBe(true);
    expect(isEnterpriseFeatureEnabled('INSIGHT_ENTERPRISE', 'custom_detectors')).toBe(true);
    expect(isEnterpriseFeatureEnabled('INSIGHT_ENTERPRISE', 'compliance_reports')).toBe(true);
    expect(isEnterpriseFeatureEnabled('INSIGHT_ENTERPRISE', 'dedicated_support')).toBe(true);
  });

  it('should allow custom entitlements override', () => {
    const context: EntitlementContext = {
      planId: 'INSIGHT_PRO',
      customEntitlements: {
        sso: true, // Override: grant SSO to PRO plan
      },
    };
    
    const result = isEnterpriseFeatureEnabled(context, 'sso');
    expect(result).toBe(true);
  });
});

// Team size limits test removed - function doesn't exist in actual API

describe('Insight Entitlements - Edge Cases', () => {
  it('should handle invalid plan ID gracefully', () => {
    // @ts-expect-error - Testing invalid input
    expect(() => getAnalysisLimits('INVALID_PLAN')).toThrow();
  });

  it('should handle negative usage counts', () => {
    const result = checkDailyLimit('INSIGHT_FREE', -1, undefined);
    expect(result.allowed).toBe(true);
  });

  it('should handle trial with missing daysRemaining', () => {
    const trial: TrialConfig = {
      isTrial: true,
      trialPlanId: 'INSIGHT_PRO',
      // No daysRemaining - should still work
    };
    
    const limits = getAnalysisLimits('INSIGHT_FREE', trial);
    // Should get PRO limits if trial is active
    expect(limits.maxProjects).toBe(10);
  });

  it('should handle trial without trialPlanId', () => {
    const trial: TrialConfig = {
      isTrial: true,
      // No trialPlanId - should use base plan
    };
    
    const limits = getAnalysisLimits('INSIGHT_PRO', trial);
    expect(limits.maxProjects).toBe(10); // PRO limits
  });
});
