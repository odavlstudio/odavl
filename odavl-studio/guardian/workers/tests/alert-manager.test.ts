import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AlertManager } from '../src/alert-manager.js';
import type { TestResult } from '@odavl-studio/guardian-core';
import fs from 'node:fs';

describe('AlertManager', () => {
  const testDbPath = './test-alerts.db';
  let alertManager: AlertManager;

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    alertManager = new AlertManager(testDbPath, {
      slack: { webhookUrl: 'https://hooks.slack.com/test' },
      email: { from: 'test@example.com', to: ['admin@example.com'] }
    });
  });

  afterEach(() => {
    alertManager.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  const createMockResult = (score: number = 85): TestResult => ({
    url: 'https://example.com',
    timestamp: new Date().toISOString(),
    score,
    passed: 5,
    failed: 2,
    details: [
      {
        detector: 'performance',
        category: 'performance',
        title: 'Slow LCP',
        severity: 'high',
        message: 'LCP is 3.5s',
        fix: 'Optimize images'
      }
    ]
  });

  describe('createRule', () => {
    it('should create alert rule', () => {
      const ruleId = alertManager.createRule({
        testId: 'test-1',
        name: 'Score Below 80',
        enabled: true,
        conditions: [{ type: 'score_below', threshold: 80 }],
        channels: ['slack', 'email'],
        severity: 'high',
        cooldown: 30
      });

      expect(ruleId).toMatch(/^rule-\d+-[a-z0-9]+$/);

      const rule = alertManager.getRule(ruleId);
      expect(rule).toBeDefined();
      expect(rule?.name).toBe('Score Below 80');
      expect(rule?.enabled).toBe(true);
      expect(rule?.conditions).toHaveLength(1);
      expect(rule?.channels).toContain('slack');
    });
  });

  describe('listRules', () => {
    it('should list all rules', () => {
      alertManager.createRule({
        testId: 'test-1',
        name: 'Rule 1',
        enabled: true,
        conditions: [{ type: 'score_below', threshold: 80 }],
        channels: ['slack'],
        severity: 'high',
        cooldown: 30
      });

      alertManager.createRule({
        testId: 'test-2',
        name: 'Rule 2',
        enabled: false,
        conditions: [{ type: 'issues_above', threshold: 10 }],
        channels: ['email'],
        severity: 'medium',
        cooldown: 60
      });

      const rules = alertManager.listRules();
      expect(rules).toHaveLength(2);
    });

    it('should filter rules by test', () => {
      alertManager.createRule({
        testId: 'test-1',
        name: 'Rule 1',
        enabled: true,
        conditions: [{ type: 'score_below', threshold: 80 }],
        channels: ['slack'],
        severity: 'high',
        cooldown: 30
      });

      alertManager.createRule({
        testId: 'test-2',
        name: 'Rule 2',
        enabled: true,
        conditions: [{ type: 'score_below', threshold: 80 }],
        channels: ['slack'],
        severity: 'high',
        cooldown: 30
      });

      const rules = alertManager.listRules('test-1');
      expect(rules).toHaveLength(1);
      expect(rules[0].testId).toBe('test-1');
    });
  });

  describe('updateRule', () => {
    it('should update rule properties', () => {
      const ruleId = alertManager.createRule({
        testId: 'test-1',
        name: 'Original Name',
        enabled: true,
        conditions: [{ type: 'score_below', threshold: 80 }],
        channels: ['slack'],
        severity: 'high',
        cooldown: 30
      });

      alertManager.updateRule(ruleId, {
        name: 'Updated Name',
        enabled: false,
        severity: 'critical'
      });

      const rule = alertManager.getRule(ruleId);
      expect(rule?.name).toBe('Updated Name');
      expect(rule?.enabled).toBe(false);
      expect(rule?.severity).toBe('critical');
    });
  });

  describe('deleteRule', () => {
    it('should delete rule', () => {
      const ruleId = alertManager.createRule({
        testId: 'test-1',
        name: 'To Delete',
        enabled: true,
        conditions: [{ type: 'score_below', threshold: 80 }],
        channels: ['slack'],
        severity: 'high',
        cooldown: 30
      });

      alertManager.deleteRule(ruleId);

      const rule = alertManager.getRule(ruleId);
      expect(rule).toBeNull();
    });
  });

  describe('evaluateRules', () => {
    it('should trigger alert when conditions met', async () => {
      const ruleId = alertManager.createRule({
        testId: 'test-1',
        name: 'Score Below 80',
        enabled: true,
        conditions: [{ type: 'score_below', threshold: 80 }],
        channels: ['slack'],
        severity: 'high',
        cooldown: 30
      });

      const result = createMockResult(75); // Score below threshold
      const alerts = await alertManager.evaluateRules('test-1', result);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].ruleId).toBe(ruleId);
      expect(alerts[0].severity).toBe('high');
    });

    it('should not trigger alert when conditions not met', async () => {
      alertManager.createRule({
        testId: 'test-1',
        name: 'Score Below 80',
        enabled: true,
        conditions: [{ type: 'score_below', threshold: 80 }],
        channels: ['slack'],
        severity: 'high',
        cooldown: 30
      });

      const result = createMockResult(85); // Score above threshold
      const alerts = await alertManager.evaluateRules('test-1', result);

      expect(alerts).toHaveLength(0);
    });

    it('should not trigger disabled rules', async () => {
      alertManager.createRule({
        testId: 'test-1',
        name: 'Disabled Rule',
        enabled: false, // Disabled
        conditions: [{ type: 'score_below', threshold: 80 }],
        channels: ['slack'],
        severity: 'high',
        cooldown: 30
      });

      const result = createMockResult(75);
      const alerts = await alertManager.evaluateRules('test-1', result);

      expect(alerts).toHaveLength(0);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge alert', async () => {
      const ruleId = alertManager.createRule({
        testId: 'test-1',
        name: 'Test Rule',
        enabled: true,
        conditions: [{ type: 'score_below', threshold: 80 }],
        channels: ['slack'],
        severity: 'high',
        cooldown: 0 // No cooldown for test
      });

      const result = createMockResult(75);
      const alerts = await alertManager.evaluateRules('test-1', result);
      
      expect(alerts).toHaveLength(1);
      const alertId = alerts[0].id;

      alertManager.acknowledgeAlert(alertId, 'admin@example.com');

      const queriedAlerts = alertManager.getAlerts({ testId: 'test-1' });
      const acknowledged = queriedAlerts.find(a => a.id === alertId);
      
      expect(acknowledged?.status).toBe('acknowledged');
      expect(acknowledged?.acknowledgedBy).toBe('admin@example.com');
      expect(acknowledged?.acknowledgedAt).toBeDefined();
    });
  });

  describe('resolveAlert', () => {
    it('should resolve alert', async () => {
      const ruleId = alertManager.createRule({
        testId: 'test-1',
        name: 'Test Rule',
        enabled: true,
        conditions: [{ type: 'score_below', threshold: 80 }],
        channels: ['slack'],
        severity: 'high',
        cooldown: 0
      });

      const result = createMockResult(75);
      const alerts = await alertManager.evaluateRules('test-1', result);
      const alertId = alerts[0].id;

      alertManager.resolveAlert(alertId);

      const queriedAlerts = alertManager.getAlerts({ testId: 'test-1' });
      const resolved = queriedAlerts.find(a => a.id === alertId);
      
      expect(resolved?.status).toBe('resolved');
      expect(resolved?.resolvedAt).toBeDefined();
    });
  });

  describe('getAlerts', () => {
    it('should filter alerts by status', async () => {
      const ruleId = alertManager.createRule({
        testId: 'test-1',
        name: 'Test Rule',
        enabled: true,
        conditions: [{ type: 'score_below', threshold: 80 }],
        channels: ['slack'],
        severity: 'high',
        cooldown: 0
      });

      const result = createMockResult(75);
      await alertManager.evaluateRules('test-1', result);
      await alertManager.evaluateRules('test-1', result);

      const sentAlerts = alertManager.getAlerts({ status: 'sent' });
      expect(sentAlerts.length).toBeGreaterThan(0);
      expect(sentAlerts.every(a => a.status === 'sent')).toBe(true);
    });

    it('should filter alerts by severity', async () => {
      alertManager.createRule({
        testId: 'test-1',
        name: 'High Severity',
        enabled: true,
        conditions: [{ type: 'score_below', threshold: 80 }],
        channels: ['slack'],
        severity: 'high',
        cooldown: 0
      });

      const result = createMockResult(75);
      await alertManager.evaluateRules('test-1', result);

      const highAlerts = alertManager.getAlerts({ severity: 'high' });
      expect(highAlerts.every(a => a.severity === 'high')).toBe(true);
    });

    it('should limit results', async () => {
      const ruleId = alertManager.createRule({
        testId: 'test-1',
        name: 'Test Rule',
        enabled: true,
        conditions: [{ type: 'score_below', threshold: 80 }],
        channels: ['slack'],
        severity: 'high',
        cooldown: 0
      });

      const result = createMockResult(75);
      await alertManager.evaluateRules('test-1', result);
      await alertManager.evaluateRules('test-1', result);
      await alertManager.evaluateRules('test-1', result);

      const alerts = alertManager.getAlerts({ limit: 2 });
      expect(alerts.length).toBeLessThanOrEqual(2);
    });
  });
});
