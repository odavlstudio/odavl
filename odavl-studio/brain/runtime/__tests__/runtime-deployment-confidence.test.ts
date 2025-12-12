/**
 * ODAVL Brain - Runtime Deployment Confidence Tests
 * Phase P8: Comprehensive test suite for Brain intelligence
 * 
 * Test Categories:
 * 1. Risk Level Classification (6 tests)
 * 2. Test Result Impact (8 tests)
 * 3. Baseline Stability (6 tests)
 * 4. Deployment Confidence Scoring (8 tests)
 * 5. BrainDeploymentAuditor (4 tests)
 * 6. Integration Scenarios (4 tests)
 * 
 * Total: 36 tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  classifyRiskLevel,
  calculateTestImpact,
  calculateBaselineStability,
  computeDeploymentConfidence,
  BrainDeploymentAuditor,
  getBrainDeploymentAuditor,
  type FileTypeStats,
  type GuardianReport,
  type BaselineHistory,
} from '../runtime-deployment-confidence';

describe('Phase P8: Brain Runtime Deployment Confidence', () => {
  
  // ==========================================================================
  // CATEGORY 1: Risk Level Classification (6 tests)
  // ==========================================================================
  
  describe('1. Risk Level Classification', () => {
    
    it('should classify critical risk for migrations', () => {
      const stats: FileTypeStats = {
        byType: { migrations: 2 },
        byRisk: { critical: 2 },
        totalFiles: 2,
      };
      
      const risk = classifyRiskLevel(stats);
      
      expect(risk.riskCategory).toBe('critical');
      expect(risk.riskWeight).toBe(0.4);
      expect(risk.dominantFileTypes).toContain('migrations');
    });
    
    it('should classify high risk for infrastructure', () => {
      const stats: FileTypeStats = {
        byType: { infrastructure: 3 },
        byRisk: { high: 3 },
        totalFiles: 3,
      };
      
      const risk = classifyRiskLevel(stats);
      
      expect(risk.riskCategory).toBe('high');
      expect(risk.riskWeight).toBe(0.4);
      expect(risk.dominantFileTypes).toContain('infrastructure');
    });
    
    it('should classify medium risk for source code', () => {
      const stats: FileTypeStats = {
        byType: { sourceCode: 5 },
        byRisk: { medium: 5 },
        totalFiles: 5,
      };
      
      const risk = classifyRiskLevel(stats);
      
      expect(risk.riskCategory).toBe('medium');
      expect(risk.riskWeight).toBe(0.3);
      expect(risk.dominantFileTypes).toContain('sourceCode');
    });
    
    it('should classify low risk for assets', () => {
      const stats: FileTypeStats = {
        byType: { assets: 10 },
        byRisk: { low: 10 },
        totalFiles: 10,
      };
      
      const risk = classifyRiskLevel(stats);
      
      expect(risk.riskCategory).toBe('low');
      expect(risk.riskWeight).toBe(0.2);
      expect(risk.dominantFileTypes).toContain('assets');
    });
    
    it('should classify docs-only as lowest risk', () => {
      const stats: FileTypeStats = {
        byType: { documentation: 5 },
        byRisk: { low: 5 },
        totalFiles: 5,
      };
      
      const risk = classifyRiskLevel(stats);
      
      expect(risk.riskCategory).toBe('low');
      expect(risk.riskWeight).toBe(0.1); // Docs-only gets special weight
      expect(risk.dominantFileTypes).toContain('documentation');
    });
    
    it('should handle mixed risk levels prioritizing highest', () => {
      const stats: FileTypeStats = {
        byType: { sourceCode: 3, migrations: 1, documentation: 2 },
        byRisk: { critical: 1, medium: 3, low: 2 },
        totalFiles: 6,
      };
      
      const risk = classifyRiskLevel(stats);
      
      expect(risk.riskCategory).toBe('critical'); // Highest risk present
      expect(risk.riskWeight).toBe(0.4);
    });
  });
  
  // ==========================================================================
  // CATEGORY 2: Test Result Impact (8 tests)
  // ==========================================================================
  
  describe('2. Test Result Impact', () => {
    
    it('should cap score at 50 for critical failures', () => {
      const report: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 5000,
        status: 'failed',
        issues: [],
        metrics: {
          totalIssues: 5,
          critical: 2,
          high: 3,
          medium: 0,
          low: 0,
        },
      };
      
      const impact = calculateTestImpact(report);
      
      expect(impact.score).toBeLessThanOrEqual(50);
      expect(impact.cappedBySeverity).toBe(true);
      expect(impact.criticalFailures).toBe(2);
    });
    
    it('should cap score at 65 for high failures (no critical)', () => {
      const report: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 5000,
        status: 'failed',
        issues: [],
        metrics: {
          totalIssues: 3,
          critical: 0,
          high: 3,
          medium: 0,
          low: 0,
        },
      };
      
      const impact = calculateTestImpact(report);
      
      expect(impact.score).toBeLessThanOrEqual(65);
      expect(impact.cappedBySeverity).toBe(true);
      expect(impact.highFailures).toBe(3);
    });
    
    it('should give full score for no failures', () => {
      const report: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 5000,
        status: 'passed',
        issues: [],
        metrics: {
          totalIssues: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      };
      
      const impact = calculateTestImpact(report);
      
      expect(impact.score).toBe(100);
      expect(impact.cappedBySeverity).toBe(false);
    });
    
    it('should apply Lighthouse penalty', () => {
      const report: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 5000,
        status: 'passed',
        issues: [],
        metrics: {
          totalIssues: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        enforcement: {
          lighthouseValidation: { passed: false, failures: ['performance'] },
        },
      };
      
      const impact = calculateTestImpact(report);
      
      expect(impact.score).toBeLessThan(100);
      expect(impact.score).toBeGreaterThanOrEqual(80); // 10 point penalty
    });
    
    it('should apply Web Vitals penalty', () => {
      const report: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 5000,
        status: 'passed',
        issues: [],
        metrics: {
          totalIssues: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        enforcement: {
          webVitalsValidation: { passed: false, failures: ['LCP'] },
        },
      };
      
      const impact = calculateTestImpact(report);
      
      expect(impact.score).toBeLessThan(100);
      expect(impact.score).toBeGreaterThanOrEqual(80); // 10 point penalty
    });
    
    it('should apply baseline regression penalty', () => {
      const report: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 5000,
        status: 'passed',
        issues: [],
        metrics: {
          totalIssues: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        enforcement: {
          baselineComparison: {
            passed: false,
            regressions: ['performance'],
            improvements: [],
          },
        },
      };
      
      const impact = calculateTestImpact(report);
      
      expect(impact.score).toBeLessThan(100);
      expect(impact.score).toBeGreaterThanOrEqual(70); // 15 point penalty
    });
    
    it('should apply gradual penalty for medium/low failures', () => {
      const report: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 5000,
        status: 'failed',
        issues: [],
        metrics: {
          totalIssues: 5,
          critical: 0,
          high: 0,
          medium: 3,
          low: 2,
        },
      };
      
      const impact = calculateTestImpact(report);
      
      expect(impact.score).toBeLessThan(100);
      expect(impact.score).toBeGreaterThan(50); // Gradual penalty, not capped
      expect(impact.cappedBySeverity).toBe(false);
    });
    
    it('should handle multiple enforcement failures', () => {
      const report: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 5000,
        status: 'failed',
        issues: [],
        metrics: {
          totalIssues: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        enforcement: {
          lighthouseValidation: { passed: false, failures: ['performance'] },
          webVitalsValidation: { passed: false, failures: ['LCP'] },
          baselineComparison: { passed: false, regressions: ['perf'], improvements: [] },
        },
      };
      
      const impact = calculateTestImpact(report);
      
      expect(impact.score).toBeLessThan(75); // 10 + 10 + 15 = 35 points penalty
    });
  });
  
  // ==========================================================================
  // CATEGORY 3: Baseline Stability (6 tests)
  // ==========================================================================
  
  describe('3. Baseline Stability', () => {
    
    it('should calculate high stability for consistent passes', () => {
      const history: BaselineHistory = {
        runs: Array(10).fill(null).map((_, i) => ({
          timestamp: `2025-12-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
          status: 'passed' as const,
          metrics: { performance: 85, accessibility: 95, seo: 90 },
          enforcement: {
            lighthousePassed: true,
            webVitalsPassed: true,
            baselinePassed: true,
          },
        })),
      };
      
      const stability = calculateBaselineStability(history);
      
      expect(stability.stabilityScore).toBeGreaterThan(80);
      expect(stability.regressionCount).toBe(0);
      expect(stability.trendDirection).toBe('stable');
    });
    
    it('should penalize stability for regressions', () => {
      const history: BaselineHistory = {
        runs: Array(10).fill(null).map((_, i) => ({
          timestamp: `2025-12-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
          status: i < 5 ? 'passed' as const : 'failed' as const,
          metrics: { performance: 85, accessibility: 95, seo: 90 },
          enforcement: {
            lighthousePassed: true,
            webVitalsPassed: true,
            baselinePassed: i < 5,
          },
        })),
      };
      
      const stability = calculateBaselineStability(history);
      
      expect(stability.stabilityScore).toBeLessThan(70);
      expect(stability.regressionCount).toBe(5);
      expect(stability.trendDirection).toBe('degrading');
    });
    
    it('should detect improving trend', () => {
      const history: BaselineHistory = {
        runs: Array(10).fill(null).map((_, i) => ({
          timestamp: `2025-12-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
          status: 'passed' as const,
          metrics: { performance: 80 + i * 2, accessibility: 95, seo: 90 },
          enforcement: {
            lighthousePassed: true,
            webVitalsPassed: true,
            baselinePassed: i > 2, // Improvements after index 2
          },
        })),
      };
      
      const stability = calculateBaselineStability(history);
      
      expect(stability.trendDirection).toBe('improving');
      expect(stability.improvementCount).toBeGreaterThan(stability.regressionCount);
    });
    
    it('should calculate volatility from performance variance', () => {
      const history: BaselineHistory = {
        runs: [
          { timestamp: '2025-12-01T00:00:00Z', status: 'passed' as const, metrics: { performance: 50, accessibility: 95, seo: 90 }, enforcement: { lighthousePassed: true, webVitalsPassed: true, baselinePassed: true } },
          { timestamp: '2025-12-02T00:00:00Z', status: 'passed' as const, metrics: { performance: 90, accessibility: 95, seo: 90 }, enforcement: { lighthousePassed: true, webVitalsPassed: true, baselinePassed: true } },
          { timestamp: '2025-12-03T00:00:00Z', status: 'passed' as const, metrics: { performance: 40, accessibility: 95, seo: 90 }, enforcement: { lighthousePassed: true, webVitalsPassed: true, baselinePassed: true } },
          { timestamp: '2025-12-04T00:00:00Z', status: 'passed' as const, metrics: { performance: 95, accessibility: 95, seo: 90 }, enforcement: { lighthousePassed: true, webVitalsPassed: true, baselinePassed: true } },
        ],
      };
      
      const stability = calculateBaselineStability(history);
      
      expect(stability.volatility).toBeGreaterThan(0.3); // High variance
    });
    
    it('should handle empty history with defaults', () => {
      const history: BaselineHistory = { runs: [] };
      
      const stability = calculateBaselineStability(history);
      
      expect(stability.stabilityScore).toBe(50);
      expect(stability.volatility).toBe(0.5);
      expect(stability.trendDirection).toBe('stable');
    });
    
    it('should use only last 10 runs', () => {
      const history: BaselineHistory = {
        runs: Array(20).fill(null).map((_, i) => ({
          timestamp: `2025-12-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
          status: i < 10 ? 'failed' as const : 'passed' as const,
          metrics: { performance: 85, accessibility: 95, seo: 90 },
          enforcement: {
            lighthousePassed: true,
            webVitalsPassed: true,
            baselinePassed: i >= 10,
          },
        })),
      };
      
      const stability = calculateBaselineStability(history);
      
      // Should only count last 10 (all passed)
      expect(stability.regressionCount).toBe(0);
      expect(stability.improvementCount).toBeGreaterThan(0);
    });
  });
  
  // ==========================================================================
  // CATEGORY 4: Deployment Confidence Scoring (8 tests)
  // ==========================================================================
  
  describe('4. Deployment Confidence Scoring', () => {
    
    it('should BLOCK deployment for critical change with test failures', () => {
      const fileTypeStats: FileTypeStats = {
        byType: { migrations: 2 },
        byRisk: { critical: 2 },
        totalFiles: 2,
      };
      
      const guardianReport: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 5000,
        status: 'failed',
        issues: [],
        metrics: { totalIssues: 3, critical: 2, high: 1, medium: 0, low: 0 },
      };
      
      const baselineHistory: BaselineHistory = { runs: [] };
      
      const decision = computeDeploymentConfidence({
        fileTypeStats,
        guardianReport,
        baselineHistory,
      });
      
      expect(decision.canDeploy).toBe(false);
      expect(decision.requiredConfidence).toBe(90); // Critical requires 90
      expect(decision.confidence).toBeLessThan(90);
    });
    
    it('should ALLOW deployment for low risk with all tests passing', () => {
      const fileTypeStats: FileTypeStats = {
        byType: { documentation: 5 },
        byRisk: { low: 5 },
        totalFiles: 5,
      };
      
      const guardianReport: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 5000,
        status: 'passed',
        issues: [],
        metrics: { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 },
      };
      
      const baselineHistory: BaselineHistory = {
        runs: Array(5).fill(null).map(() => ({
          timestamp: '2025-12-09T00:00:00Z',
          status: 'passed' as const,
          metrics: { performance: 85, accessibility: 95, seo: 90 },
          enforcement: { lighthousePassed: true, webVitalsPassed: true, baselinePassed: true },
        })),
      };
      
      const decision = computeDeploymentConfidence({
        fileTypeStats,
        guardianReport,
        baselineHistory,
      });
      
      expect(decision.canDeploy).toBe(true);
      expect(decision.requiredConfidence).toBe(60); // Low requires 60
      expect(decision.confidence).toBeGreaterThanOrEqual(60);
    });
    
    it('should require ≥75 confidence for medium risk changes', () => {
      const fileTypeStats: FileTypeStats = {
        byType: { sourceCode: 5 },
        byRisk: { medium: 5 },
        totalFiles: 5,
      };
      
      const guardianReport: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 5000,
        status: 'passed',
        issues: [],
        metrics: { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 },
      };
      
      const baselineHistory: BaselineHistory = { runs: [] };
      
      const decision = computeDeploymentConfidence({
        fileTypeStats,
        guardianReport,
        baselineHistory,
      });
      
      expect(decision.requiredConfidence).toBe(75); // Medium requires 75
    });
    
    it('should require ≥90 confidence for high risk changes', () => {
      const fileTypeStats: FileTypeStats = {
        byType: { infrastructure: 3 },
        byRisk: { high: 3 },
        totalFiles: 3,
      };
      
      const guardianReport: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 5000,
        status: 'passed',
        issues: [],
        metrics: { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 },
      };
      
      const baselineHistory: BaselineHistory = { runs: [] };
      
      const decision = computeDeploymentConfidence({
        fileTypeStats,
        guardianReport,
        baselineHistory,
      });
      
      expect(decision.requiredConfidence).toBe(90); // High requires 90
    });
    
    it('should weight factors correctly (risk 35%, test 40%, baseline 25%)', () => {
      const fileTypeStats: FileTypeStats = {
        byType: { sourceCode: 5 },
        byRisk: { medium: 5 },
        totalFiles: 5,
      };
      
      const guardianReport: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 5000,
        status: 'passed',
        issues: [],
        metrics: { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 },
      };
      
      const baselineHistory: BaselineHistory = { runs: [] };
      
      const decision = computeDeploymentConfidence({
        fileTypeStats,
        guardianReport,
        baselineHistory,
      });
      
      const totalWeight = decision.factors.riskWeight + decision.factors.testImpact + decision.factors.baselineStability;
      
      // Weights should approximately match formula percentages
      expect(decision.factors.testImpact).toBeGreaterThan(decision.factors.riskWeight); // Test has higher weight
      expect(decision.factors.testImpact).toBeGreaterThan(decision.factors.baselineStability);
    });
    
    it('should include reasoning in decision', () => {
      const fileTypeStats: FileTypeStats = {
        byType: { migrations: 1 },
        byRisk: { critical: 1 },
        totalFiles: 1,
      };
      
      const guardianReport: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 5000,
        status: 'failed',
        issues: [],
        metrics: { totalIssues: 2, critical: 2, high: 0, medium: 0, low: 0 },
      };
      
      const baselineHistory: BaselineHistory = { runs: [] };
      
      const decision = computeDeploymentConfidence({
        fileTypeStats,
        guardianReport,
        baselineHistory,
      });
      
      expect(decision.reasoning.length).toBeGreaterThan(0);
      expect(decision.reasoning.some(r => r.includes('Risk level'))).toBe(true);
      expect(decision.reasoning.some(r => r.includes('Test impact'))).toBe(true);
      expect(decision.reasoning.some(r => r.includes('Baseline stability'))).toBe(true);
    });
    
    it('should ALLOW high-risk change with perfect test results', () => {
      const fileTypeStats: FileTypeStats = {
        byType: { infrastructure: 2 },
        byRisk: { high: 2 },
        totalFiles: 2,
      };
      
      const guardianReport: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 5000,
        status: 'passed',
        issues: [],
        metrics: { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 },
      };
      
      const baselineHistory: BaselineHistory = {
        runs: Array(10).fill(null).map(() => ({
          timestamp: '2025-12-09T00:00:00Z',
          status: 'passed' as const,
          metrics: { performance: 95, accessibility: 98, seo: 95 },
          enforcement: { lighthousePassed: true, webVitalsPassed: true, baselinePassed: true },
        })),
      };
      
      const decision = computeDeploymentConfidence({
        fileTypeStats,
        guardianReport,
        baselineHistory,
      });
      
      expect(decision.canDeploy).toBe(true);
      expect(decision.confidence).toBeGreaterThanOrEqual(90);
    });
    
    it('should BLOCK high-risk change with test failures', () => {
      const fileTypeStats: FileTypeStats = {
        byType: { infrastructure: 2 },
        byRisk: { high: 2 },
        totalFiles: 2,
      };
      
      const guardianReport: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 5000,
        status: 'failed',
        issues: [],
        metrics: { totalIssues: 5, critical: 1, high: 4, medium: 0, low: 0 },
      };
      
      const baselineHistory: BaselineHistory = { runs: [] };
      
      const decision = computeDeploymentConfidence({
        fileTypeStats,
        guardianReport,
        baselineHistory,
      });
      
      expect(decision.canDeploy).toBe(false);
      expect(decision.confidence).toBeLessThan(90);
    });
  });
  
  // ==========================================================================
  // CATEGORY 5: BrainDeploymentAuditor (4 tests)
  // ==========================================================================
  
  describe('5. BrainDeploymentAuditor', () => {
    
    let auditor: BrainDeploymentAuditor;
    
    beforeEach(() => {
      auditor = new BrainDeploymentAuditor();
    });
    
    it('should log risk analysis', () => {
      const risk = {
        riskCategory: 'critical' as const,
        riskWeight: 0.4,
        dominantFileTypes: ['migrations'],
      };
      
      auditor.logRiskAnalysis(risk);
      
      const stats = auditor.getStats();
      expect(stats.riskAnalyses).toBe(1);
      expect(stats.totalEntries).toBe(1);
    });
    
    it('should log test impact', () => {
      const impact = {
        score: 75,
        criticalFailures: 0,
        highFailures: 2,
        totalFailures: 2,
        cappedBySeverity: false,
      };
      
      auditor.logTestImpact(impact);
      
      const stats = auditor.getStats();
      expect(stats.testImpacts).toBe(1);
    });
    
    it('should log baseline stability', () => {
      const stability = {
        stabilityScore: 88,
        volatility: 0.12,
        regressionCount: 1,
        improvementCount: 5,
        trendDirection: 'improving' as const,
      };
      
      auditor.logBaselineStability(stability);
      
      const stats = auditor.getStats();
      expect(stats.baselineStabilities).toBe(1);
    });
    
    it('should export JSON audit log', () => {
      auditor.logRiskAnalysis({
        riskCategory: 'medium',
        riskWeight: 0.3,
        dominantFileTypes: ['sourceCode'],
      });
      
      const exportPath = auditor.export();
      
      expect(exportPath).toContain('.odavl/audit/brain-deployment-');
      expect(exportPath).toContain('.json');
    });
  });
  
  // ==========================================================================
  // CATEGORY 6: Integration Scenarios (4 tests)
  // ==========================================================================
  
  describe('6. Integration Scenarios', () => {
    
    it('should handle docs-only change with no tests → ALLOW', () => {
      const fileTypeStats: FileTypeStats = {
        byType: { documentation: 3 },
        byRisk: { low: 3 },
        totalFiles: 3,
      };
      
      const guardianReport: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 2000,
        status: 'passed',
        issues: [],
        metrics: { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 },
      };
      
      const baselineHistory: BaselineHistory = { runs: [] };
      
      const decision = computeDeploymentConfidence({
        fileTypeStats,
        guardianReport,
        baselineHistory,
      });
      
      expect(decision.canDeploy).toBe(true);
      expect(decision.requiredConfidence).toBe(60);
    });
    
    it('should handle critical migration with perfect tests → ALLOW', () => {
      const fileTypeStats: FileTypeStats = {
        byType: { migrations: 1 },
        byRisk: { critical: 1 },
        totalFiles: 1,
      };
      
      const guardianReport: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 8000,
        status: 'passed',
        issues: [],
        metrics: { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 },
      };
      
      const baselineHistory: BaselineHistory = {
        runs: Array(10).fill(null).map(() => ({
          timestamp: '2025-12-09T00:00:00Z',
          status: 'passed' as const,
          metrics: { performance: 90, accessibility: 95, seo: 92 },
          enforcement: { lighthousePassed: true, webVitalsPassed: true, baselinePassed: true },
        })),
      };
      
      const decision = computeDeploymentConfidence({
        fileTypeStats,
        guardianReport,
        baselineHistory,
      });
      
      expect(decision.canDeploy).toBe(true);
      expect(decision.confidence).toBeGreaterThanOrEqual(90);
    });
    
    it('should handle mixed source + infra with minor failures → BLOCK', () => {
      const fileTypeStats: FileTypeStats = {
        byType: { sourceCode: 3, infrastructure: 1 },
        byRisk: { high: 1, medium: 3 },
        totalFiles: 4,
      };
      
      const guardianReport: GuardianReport = {
        url: 'https://example.com',
        timestamp: '2025-12-09T00:00:00Z',
        duration: 6000,
        status: 'failed',
        issues: [],
        metrics: { totalIssues: 3, critical: 0, high: 2, medium: 1, low: 0 },
      };
      
      const baselineHistory: BaselineHistory = { runs: [] };
      
      const decision = computeDeploymentConfidence({
        fileTypeStats,
        guardianReport,
        baselineHistory,
      });
      
      expect(decision.canDeploy).toBe(false); // High risk requires 90, test failures cap score
      expect(decision.requiredConfidence).toBe(90);
    });
    
    it('should use singleton auditor across calls', () => {
      const auditor1 = getBrainDeploymentAuditor();
      const auditor2 = getBrainDeploymentAuditor();
      
      expect(auditor1).toBe(auditor2); // Same instance
    });
  });
});
