/**
 * ODAVL Autopilot - Phase P6: File-Type Integration Tests
 * 
 * Comprehensive test suite for file-type aware automation control:
 * - Critical file blocking
 * - Risk-weighted budgeting
 * - Fix strategy selection
 * - Audit logging
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  shouldAllowModification,
  selectFixStrategy,
  calculateWeightedImpact,
  validateRiskWeightedBudget,
  AutopilotAuditor,
  getAutopilotAuditor,
  BLOCKED_FILE_TYPES,
  RISK_WEIGHTS,
  type FileWithRisk,
  type ModificationPermission,
  type RiskBudgetValidation,
} from '../autopilot-filetype-integration';

describe('Phase P6: Autopilot File-Type Integration', () => {
  
  describe('shouldAllowModification()', () => {
    
    it('blocks critical-risk environment files', () => {
      const perm = shouldAllowModification('.env');
      
      expect(perm.allowed).toBe(false);
      expect(perm.fileType).toBe('env');
      expect(perm.risk).toBe('critical');
      expect(perm.blockReason).toContain('Critical file type');
      expect(perm.blockReason).toContain('manual review');
      expect(perm.fixStrategy).toBe('manual-review-required');
    });
    
    it('blocks critical-risk secret candidates', () => {
      const perm = shouldAllowModification('certs/server.key');
      
      expect(perm.allowed).toBe(false);
      expect(perm.fileType).toBe('secretCandidates');
      expect(perm.risk).toBe('critical');
      expect(perm.blockReason).toContain('manual review');
    });
    
    it('blocks critical-risk database migrations', () => {
      const perm = shouldAllowModification('migrations/20250109_create_users.sql');
      
      expect(perm.allowed).toBe(false);
      expect(perm.fileType).toBe('migrations');
      expect(perm.risk).toBe('critical');
    });
    
    it('blocks critical-risk infrastructure files', () => {
      const perm = shouldAllowModification('infra/main.tf');
      
      expect(perm.allowed).toBe(false);
      expect(perm.fileType).toBe('infrastructure');
      expect(perm.risk).toBe('critical');
    });
    
    it('allows high-risk source code with safe strategy', () => {
      const perm = shouldAllowModification('src/api/auth.ts');
      
      expect(perm.allowed).toBe(true);
      expect(perm.fileType).toBe('sourceCode');
      expect(perm.risk).toBe('high'); // API files are high risk
      expect(perm.fixStrategy).toBe('safe');
      expect(perm.blockReason).toBeUndefined();
    });
    
    it('allows medium-risk tests with safe strategy', () => {
      const perm = shouldAllowModification('src/__tests__/api.test.ts');
      
      expect(perm.allowed).toBe(true);
      expect(perm.fileType).toBe('tests');
      expect(perm.risk).toBe('medium');
      expect(perm.fixStrategy).toBe('safe');
    });
    
    it('allows low-risk documentation with rewrite strategy', () => {
      const perm = shouldAllowModification('README.md');
      
      expect(perm.allowed).toBe(true);
      expect(perm.fileType).toBe('documentation');
      expect(perm.risk).toBe('low');
      expect(perm.fixStrategy).toBe('rewrite');
    });
    
    it('includes usedByProducts metadata', () => {
      const perm = shouldAllowModification('src/index.ts');
      
      expect(perm.usedByProducts).toContain('insight');
      expect(perm.usedByProducts).toContain('autopilot');
      expect(perm.usedByProducts).toContain('brain');
    });
    
    it('handles Windows paths correctly', () => {
      const perm = shouldAllowModification('C:\\Users\\dev\\.env.local');
      
      expect(perm.allowed).toBe(false);
      expect(perm.fileType).toBe('env');
    });
    
  });
  
  describe('selectFixStrategy()', () => {
    
    it('requires manual review for critical files', () => {
      expect(selectFixStrategy('env')).toBe('manual-review-required');
      expect(selectFixStrategy('secretCandidates')).toBe('manual-review-required');
      expect(selectFixStrategy('migrations')).toBe('manual-review-required');
      expect(selectFixStrategy('infrastructure')).toBe('manual-review-required');
    });
    
    it('uses safe strategy for high-risk files', () => {
      expect(selectFixStrategy('sourceCode')).toBe('safe');
      expect(selectFixStrategy('config')).toBe('safe');
    });
    
    it('uses safe strategy for medium-risk files', () => {
      expect(selectFixStrategy('tests')).toBe('safe');
      expect(selectFixStrategy('dependencies')).toBe('safe');
    });
    
    it('uses rewrite strategy for low-risk files', () => {
      expect(selectFixStrategy('documentation')).toBe('rewrite');
      expect(selectFixStrategy('buildConfig')).toBe('rewrite');
      expect(selectFixStrategy('ciConfig')).toBe('rewrite');
    });
    
  });
  
  describe('calculateWeightedImpact()', () => {
    
    it('calculates weighted impact for single high-risk file', () => {
      const files: FileWithRisk[] = [
        { filePath: 'src/api.ts', fileType: 'sourceCode', risk: 'high', locChanged: 20 },
      ];
      
      const impact = calculateWeightedImpact(files);
      
      // high (3x): 3 × (1 + 20/40) = 3 × 1.5 = 4.5
      expect(impact).toBeCloseTo(4.5, 2);
    });
    
    it('calculates weighted impact for single medium-risk file', () => {
      const files: FileWithRisk[] = [
        { filePath: 'src/utils.ts', fileType: 'sourceCode', risk: 'medium', locChanged: 30 },
      ];
      
      const impact = calculateWeightedImpact(files);
      
      // medium (2x): 2 × (1 + 30/40) = 2 × 1.75 = 3.5
      expect(impact).toBeCloseTo(3.5, 2);
    });
    
    it('calculates weighted impact for single low-risk file', () => {
      const files: FileWithRisk[] = [
        { filePath: 'README.md', fileType: 'documentation', risk: 'low', locChanged: 10 },
      ];
      
      const impact = calculateWeightedImpact(files);
      
      // low (1x): 1 × (1 + 10/40) = 1 × 1.25 = 1.25
      expect(impact).toBeCloseTo(1.25, 2);
    });
    
    it('calculates weighted impact for multiple files', () => {
      const files: FileWithRisk[] = [
        { filePath: 'src/api.ts', fileType: 'sourceCode', risk: 'high', locChanged: 20 },
        { filePath: 'src/utils.ts', fileType: 'sourceCode', risk: 'medium', locChanged: 15 },
        { filePath: 'README.md', fileType: 'documentation', risk: 'low', locChanged: 5 },
      ];
      
      const impact = calculateWeightedImpact(files);
      
      // high: 3 × (1 + 20/40) = 4.5
      // medium: 2 × (1 + 15/40) = 2.75
      // low: 1 × (1 + 5/40) = 1.125
      // Total: 8.375
      expect(impact).toBeCloseTo(8.375, 2);
    });
    
    it('handles files without LOC changes (base impact only)', () => {
      const files: FileWithRisk[] = [
        { filePath: 'src/api.ts', fileType: 'sourceCode', risk: 'high' },
        { filePath: 'README.md', fileType: 'documentation', risk: 'low' },
      ];
      
      const impact = calculateWeightedImpact(files);
      
      // high: 3 × 1 = 3
      // low: 1 × 1 = 1
      // Total: 4
      expect(impact).toBe(4);
    });
    
    it('skips critical files (infinite weight)', () => {
      const files: FileWithRisk[] = [
        { filePath: '.env', fileType: 'env', risk: 'critical', locChanged: 10 },
        { filePath: 'src/api.ts', fileType: 'sourceCode', risk: 'high', locChanged: 20 },
      ];
      
      const impact = calculateWeightedImpact(files);
      
      // critical: skipped (Infinity weight)
      // high: 3 × 1.5 = 4.5
      expect(impact).toBeCloseTo(4.5, 2);
    });
    
  });
  
  describe('validateRiskWeightedBudget()', () => {
    
    const defaultBudget = { maxFiles: 10, maxLoc: 40, maxRecipes: 5 };
    
    it('allows changes within budget', () => {
      const files: FileWithRisk[] = [
        { filePath: 'src/api.ts', fileType: 'sourceCode', risk: 'high', locChanged: 20 },
        { filePath: 'README.md', fileType: 'documentation', risk: 'low', locChanged: 5 },
      ];
      
      const validation = validateRiskWeightedBudget(files, 2, defaultBudget);
      
      expect(validation.allowed).toBe(true);
      expect(validation.violations).toHaveLength(0);
      // weighted impact: 4.5 + 1.125 = 5.625 (< 10 maxFiles)
      expect(validation.weightedImpact).toBeCloseTo(5.625, 2);
      expect(validation.breakdown).toHaveLength(2);
    });
    
    it('blocks when weighted file count exceeds maxFiles', () => {
      const files: FileWithRisk[] = [
        { filePath: 'src/api.ts', fileType: 'sourceCode', risk: 'high', locChanged: 40 },
        { filePath: 'src/auth.ts', fileType: 'sourceCode', risk: 'high', locChanged: 40 },
        { filePath: 'src/db.ts', fileType: 'sourceCode', risk: 'high', locChanged: 40 },
      ];
      
      const validation = validateRiskWeightedBudget(files, 2, defaultBudget);
      
      expect(validation.allowed).toBe(false);
      expect(validation.violations.length).toBeGreaterThan(0);
      expect(validation.violations[0]).toContain('Weighted file count');
      expect(validation.violations[0]).toContain('exceeds budget');
      // weighted impact: 3 × (3 × 2) = 18 (> 10 maxFiles)
      expect(validation.weightedImpact).toBeGreaterThan(10);
    });
    
    it('blocks when total LOC exceeds maxLoc', () => {
      const files: FileWithRisk[] = [
        { filePath: 'README.md', fileType: 'documentation', risk: 'low', locChanged: 50 },
      ];
      
      const validation = validateRiskWeightedBudget(files, 1, defaultBudget);
      
      expect(validation.allowed).toBe(false);
      expect(validation.violations.some(v => v.includes('Total LOC'))).toBe(true);
    });
    
    it('blocks when recipe count exceeds maxRecipes', () => {
      const files: FileWithRisk[] = [
        { filePath: 'src/utils.ts', fileType: 'sourceCode', risk: 'medium', locChanged: 10 },
      ];
      
      const validation = validateRiskWeightedBudget(files, 10, defaultBudget);
      
      expect(validation.allowed).toBe(false);
      expect(validation.violations.some(v => v.includes('Recipe count'))).toBe(true);
    });
    
    it('blocks critical files with violation message', () => {
      const files: FileWithRisk[] = [
        { filePath: '.env', fileType: 'env', risk: 'critical', locChanged: 5 },
        { filePath: 'src/api.ts', fileType: 'sourceCode', risk: 'high', locChanged: 10 },
      ];
      
      const validation = validateRiskWeightedBudget(files, 1, defaultBudget);
      
      expect(validation.allowed).toBe(false);
      expect(validation.violations.some(v => v.includes('Critical file'))).toBe(true);
      expect(validation.violations.some(v => v.includes('.env'))).toBe(true);
    });
    
    it('provides detailed breakdown for all files', () => {
      const files: FileWithRisk[] = [
        { filePath: 'src/api.ts', fileType: 'sourceCode', risk: 'high', locChanged: 20 },
        { filePath: 'src/utils.ts', fileType: 'sourceCode', risk: 'medium', locChanged: 15 },
      ];
      
      const validation = validateRiskWeightedBudget(files, 2, defaultBudget);
      
      expect(validation.breakdown).toHaveLength(2);
      
      const highRiskEntry = validation.breakdown[0];
      expect(highRiskEntry.filePath).toBe('src/api.ts');
      expect(highRiskEntry.risk).toBe('high');
      expect(highRiskEntry.weight).toBeCloseTo(4.5, 2); // 3 × 1.5
      
      const mediumRiskEntry = validation.breakdown[1];
      expect(mediumRiskEntry.filePath).toBe('src/utils.ts');
      expect(mediumRiskEntry.risk).toBe('medium');
      expect(mediumRiskEntry.weight).toBeCloseTo(2.75, 2); // 2 × 1.375
    });
    
    it('handles empty file list', () => {
      const validation = validateRiskWeightedBudget([], 0, defaultBudget);
      
      expect(validation.allowed).toBe(true);
      expect(validation.weightedImpact).toBe(0);
      expect(validation.violations).toHaveLength(0);
      expect(validation.breakdown).toHaveLength(0);
    });
    
  });
  
  describe('AutopilotAuditor', () => {
    let auditor: AutopilotAuditor;
    
    beforeEach(() => {
      auditor = new AutopilotAuditor();
    });
    
    it('logs blocked modifications', () => {
      auditor.logBlocked('.env', 'env', 'critical', 'Critical file requires manual review');
      
      const logs = auditor.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('blocked');
      expect(logs[0].filePath).toBe('.env');
      expect(logs[0].fileType).toBe('env');
      expect(logs[0].risk).toBe('critical');
      expect(logs[0].reason).toContain('manual review');
    });
    
    it('logs budget impacts', () => {
      auditor.logBudgetImpact('src/api.ts', 'sourceCode', 'high', 4.5);
      
      const logs = auditor.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('budget');
      expect(logs[0].filePath).toBe('src/api.ts');
      expect(logs[0].weight).toBe(4.5);
    });
    
    it('logs strategy selections', () => {
      auditor.logStrategy('src/api.ts', 'sourceCode', 'high', 'safe');
      
      const logs = auditor.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('strategy');
      expect(logs[0].fixStrategy).toBe('safe');
    });
    
    it('logs allowed modifications', () => {
      auditor.logAllowed('src/utils.ts', 'sourceCode', 'medium', 'Within budget');
      
      const logs = auditor.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('allowed');
      expect(logs[0].reason).toBe('Within budget');
    });
    
    it('exports logs as JSON', () => {
      auditor.logBlocked('.env', 'env', 'critical', 'Test reason');
      auditor.logAllowed('src/api.ts', 'sourceCode', 'high', 'Test reason');
      
      const json = auditor.export();
      const parsed = JSON.parse(json);
      
      expect(parsed).toHaveLength(2);
      expect(parsed[0].action).toBe('blocked');
      expect(parsed[1].action).toBe('allowed');
    });
    
    it('clears logs', () => {
      auditor.logBlocked('.env', 'env', 'critical', 'Test');
      auditor.logAllowed('src/api.ts', 'sourceCode', 'high', 'Test');
      expect(auditor.getLogs()).toHaveLength(2);
      
      auditor.clear();
      expect(auditor.getLogs()).toHaveLength(0);
    });
    
    it('provides statistics', () => {
      auditor.logBlocked('.env', 'env', 'critical', 'Test');
      auditor.logBlocked('certs/key.pem', 'secretCandidates', 'critical', 'Test');
      auditor.logAllowed('src/api.ts', 'sourceCode', 'high', 'Test');
      auditor.logBudgetImpact('src/api.ts', 'sourceCode', 'high', 4.5);
      auditor.logStrategy('src/api.ts', 'sourceCode', 'high', 'safe');
      
      const stats = auditor.getStats();
      
      expect(stats.total).toBe(5);
      expect(stats.blocked).toBe(2);
      expect(stats.allowed).toBe(1);
      expect(stats.budgetChecks).toBe(1);
      expect(stats.strategySelections).toBe(1);
    });
    
    it('includes timestamps in logs', () => {
      const beforeTimestamp = Date.now();
      auditor.logBlocked('.env', 'env', 'critical', 'Test');
      const afterTimestamp = Date.now();
      
      const logs = auditor.getLogs();
      expect(logs[0].timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(logs[0].timestamp).toBeLessThanOrEqual(afterTimestamp);
    });
    
  });
  
  describe('getAutopilotAuditor() singleton', () => {
    
    it('returns the same instance on multiple calls', () => {
      const auditor1 = getAutopilotAuditor();
      const auditor2 = getAutopilotAuditor();
      
      expect(auditor1).toBe(auditor2);
    });
    
    it('shares state across calls', () => {
      const auditor1 = getAutopilotAuditor();
      auditor1.logBlocked('.env', 'env', 'critical', 'Test');
      
      const auditor2 = getAutopilotAuditor();
      const logs = auditor2.getLogs();
      
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('blocked');
    });
    
  });
  
  describe('Constants validation', () => {
    
    it('BLOCKED_FILE_TYPES contains all critical-risk types', () => {
      expect(BLOCKED_FILE_TYPES).toContain('env');
      expect(BLOCKED_FILE_TYPES).toContain('secretCandidates');
      expect(BLOCKED_FILE_TYPES).toContain('migrations');
      expect(BLOCKED_FILE_TYPES).toContain('infrastructure');
      expect(BLOCKED_FILE_TYPES).toHaveLength(4);
    });
    
    it('RISK_WEIGHTS has correct multipliers', () => {
      expect(RISK_WEIGHTS.critical).toBe(Infinity);
      expect(RISK_WEIGHTS.high).toBe(3);
      expect(RISK_WEIGHTS.medium).toBe(2);
      expect(RISK_WEIGHTS.low).toBe(1);
    });
    
  });
  
  describe('Edge Cases', () => {
    
    it('handles files with no extension', () => {
      const perm = shouldAllowModification('Dockerfile');
      
      expect(perm.allowed).toBe(true);
      expect(perm.fileType).toBe('buildConfig');
    });
    
    it('handles deeply nested paths', () => {
      const perm = shouldAllowModification('src/features/auth/api/handlers/login.ts');
      
      expect(perm.allowed).toBe(true);
      expect(perm.fileType).toBe('sourceCode');
    });
    
    it('handles mixed path separators (Windows)', () => {
      const perm = shouldAllowModification('C:\\dev\\project\\src\\index.ts');
      
      expect(perm.allowed).toBe(true);
      expect(perm.fileType).toBe('sourceCode');
    });
    
    it('handles relative paths with ../', () => {
      const perm = shouldAllowModification('../shared/utils.ts');
      
      expect(perm.allowed).toBe(true);
      expect(perm.fileType).toBe('sourceCode');
    });
    
    it('handles unknown file types gracefully', () => {
      const perm = shouldAllowModification('unknown.xyz123');
      
      // Should default to some file type (implementation-dependent)
      expect(perm).toHaveProperty('fileType');
      expect(perm).toHaveProperty('risk');
      expect(perm).toHaveProperty('fixStrategy');
    });
    
    it('handles empty file path', () => {
      const perm = shouldAllowModification('');
      
      expect(perm).toHaveProperty('fileType');
      expect(perm).toHaveProperty('allowed');
    });
    
    it('handles very large LOC changes in budget calculation', () => {
      const files: FileWithRisk[] = [
        { filePath: 'src/large.ts', fileType: 'sourceCode', risk: 'low', locChanged: 10000 },
      ];
      
      const impact = calculateWeightedImpact(files);
      
      // low (1x): 1 × (1 + 10000/40) = 1 × 251 = 251
      expect(impact).toBeCloseTo(251, 0);
    });
    
  });
  
  describe('Integration Scenarios', () => {
    
    it('full workflow: check permission → select strategy → calculate budget → audit', () => {
      const auditor = new AutopilotAuditor();
      
      // Step 1: Check permission
      const perm = shouldAllowModification('src/api.ts');
      expect(perm.allowed).toBe(true);
      
      // Step 2: Select strategy
      const strategy = selectFixStrategy(perm.fileType);
      expect(strategy).toBe('safe');
      
      // Step 3: Calculate budget
      const files: FileWithRisk[] = [
        { filePath: 'src/api.ts', fileType: perm.fileType, risk: perm.risk, locChanged: 20 },
      ];
      const impact = calculateWeightedImpact(files);
      expect(impact).toBeGreaterThan(0);
      
      // Step 4: Validate budget
      const validation = validateRiskWeightedBudget(
        files, 
        1, 
        { maxFiles: 10, maxLoc: 40, maxRecipes: 5 }
      );
      expect(validation.allowed).toBe(true);
      
      // Step 5: Audit logging
      auditor.logAllowed('src/api.ts', perm.fileType, perm.risk, 'Passed all checks');
      auditor.logStrategy('src/api.ts', perm.fileType, perm.risk, strategy);
      auditor.logBudgetImpact('src/api.ts', perm.fileType, perm.risk, impact);
      
      const stats = auditor.getStats();
      expect(stats.total).toBe(3);
      expect(stats.allowed).toBe(1);
      expect(stats.strategySelections).toBe(1);
      expect(stats.budgetChecks).toBe(1);
    });
    
    it('handles mixed risk levels in single operation', () => {
      const files: FileWithRisk[] = [
        { filePath: 'src/api.ts', fileType: 'sourceCode', risk: 'high', locChanged: 20 },
        { filePath: 'src/utils.ts', fileType: 'sourceCode', risk: 'medium', locChanged: 15 },
        { filePath: 'README.md', fileType: 'documentation', risk: 'low', locChanged: 10 },
        { filePath: 'src/__tests__/api.test.ts', fileType: 'tests', risk: 'medium', locChanged: 25 },
      ];
      
      const validation = validateRiskWeightedBudget(
        files,
        3,
        { maxFiles: 15, maxLoc: 100, maxRecipes: 5 }
      );
      
      expect(validation.allowed).toBe(true);
      expect(validation.breakdown).toHaveLength(4);
      
      // Verify each file has correct weight
      const highRisk = validation.breakdown.find(b => b.risk === 'high');
      const mediumRisk = validation.breakdown.filter(b => b.risk === 'medium');
      const lowRisk = validation.breakdown.find(b => b.risk === 'low');
      
      expect(highRisk?.weight).toBeGreaterThan(mediumRisk[0]?.weight ?? 0);
      expect(mediumRisk[0]?.weight).toBeGreaterThan(lowRisk?.weight ?? 0);
    });
    
  });
  
});
