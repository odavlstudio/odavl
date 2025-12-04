/**
 * RuntimeTestingAgent Tests
 * 
 * Test suite for runtime testing functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RuntimeTestingAgent } from '../../agents/runtime-tester.js';
import type { TestReport, RuntimeIssue } from '../../agents/runtime-tester.js';

describe('RuntimeTestingAgent', () => {
  let agent: RuntimeTestingAgent;
  
  beforeEach(async () => {
    agent = new RuntimeTestingAgent();
  });
  
  afterEach(async () => {
    await agent.cleanup();
  });
  
  describe('testVSCodeExtension', () => {
    it('should detect missing package.json', async () => {
      const report = await agent.testVSCodeExtension('/nonexistent/path');
      
      expect(report.success).toBe(false);
      expect(report.readiness).toBe(0);
      expect(report.issues.length).toBeGreaterThan(0);
      
      const criticalIssue = report.issues.find(i => i.severity === 'critical');
      expect(criticalIssue).toBeDefined();
      expect(criticalIssue?.message).toContain('package.json');
    });
    
    it('should calculate readiness score correctly', async () => {
      // Test with a valid extension path (this repo has Guardian extension)
      const guardianExtPath = process.cwd() + '/extension';
      const report = await agent.testVSCodeExtension(guardianExtPath);
      
      // Should have some readiness score (even if not perfect)
      expect(report.readiness).toBeGreaterThanOrEqual(0);
      expect(report.readiness).toBeLessThanOrEqual(100);
    });
  });
  
  describe('calculateReadiness scoring', () => {
    it('should return 100 for no issues', () => {
      const issues: RuntimeIssue[] = [];
      // @ts-ignore - accessing private method for testing
      const score = agent['calculateReadiness'](issues);
      expect(score).toBe(100);
    });
    
    it('should deduct 30 for critical issues', () => {
      const issues: RuntimeIssue[] = [{
        type: 'crash',
        severity: 'critical',
        message: 'Test critical error'
      }];
      // @ts-ignore
      const score = agent['calculateReadiness'](issues);
      expect(score).toBe(70); // 100 - 30
    });
    
    it('should deduct 15 for high severity issues', () => {
      const issues: RuntimeIssue[] = [{
        type: 'performance',
        severity: 'high',
        message: 'Test high severity'
      }];
      // @ts-ignore
      const score = agent['calculateReadiness'](issues);
      expect(score).toBe(85); // 100 - 15
    });
    
    it('should never go below 0', () => {
      const issues: RuntimeIssue[] = [
        { type: 'crash', severity: 'critical', message: 'Error 1' },
        { type: 'crash', severity: 'critical', message: 'Error 2' },
        { type: 'crash', severity: 'critical', message: 'Error 3' },
        { type: 'crash', severity: 'critical', message: 'Error 4' },
      ];
      // @ts-ignore
      const score = agent['calculateReadiness'](issues);
      expect(score).toBe(0); // Should not be negative
    });
  });
  
  describe('boundary compliance', () => {
    it('should NOT have applyFix method', () => {
      // @ts-ignore
      expect(agent.applyFix).toBeUndefined();
    });
    
    it('should NOT have rollback method', () => {
      // @ts-ignore
      expect(agent.rollback).toBeUndefined();
    });
    
    it('should NOT have any file modification methods', () => {
      const proto = Object.getPrototypeOf(agent);
      const methods = Object.getOwnPropertyNames(proto);
      
      const forbiddenMethods = ['applyFix', 'rollback', 'writeFile', 'modifyFile', 'deleteFile'];
      
      for (const forbidden of forbiddenMethods) {
        expect(methods).not.toContain(forbidden);
      }
    });
  });
});
