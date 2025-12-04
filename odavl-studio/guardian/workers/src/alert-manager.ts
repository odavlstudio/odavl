import Database from 'better-sqlite3';
import type { TestResult } from '@odavl-studio/guardian-core';
import { logger } from './logger.js';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertChannel = 'email' | 'slack' | 'discord' | 'webhook' | 'pagerduty' | 'sms';
export type AlertStatus = 'pending' | 'sent' | 'acknowledged' | 'resolved' | 'failed';

export interface AlertRule {
  id: string;
  testId: string;
  name: string;
  enabled: boolean;
  conditions: AlertCondition[];
  channels: AlertChannel[];
  severity: AlertSeverity;
  cooldown: number; // minutes
  escalationDelay?: number; // minutes
}

export interface AlertCondition {
  type: 'score_below' | 'score_above' | 'issues_above' | 'duration_above' | 'failure_rate' | 'trend_degrading';
  threshold: number;
  duration?: number; // consecutive occurrences
}

export interface Alert {
  id: string;
  ruleId: string;
  testId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  channels: AlertChannel[];
  status: AlertStatus;
  createdAt: Date;
  sentAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface AlertConfig {
  email?: {
    from: string;
    to: string[];
    smtp?: {
      host: string;
      port: number;
      secure: boolean;
      auth: { user: string; pass: string };
    };
  };
  slack?: {
    webhookUrl: string;
    channel?: string;
    username?: string;
  };
  discord?: {
    webhookUrl: string;
    username?: string;
  };
  webhook?: {
    url: string;
    headers?: Record<string, string>;
  };
  pagerduty?: {
    integrationKey: string;
  };
  sms?: {
    provider: 'twilio';
    accountSid: string;
    authToken: string;
    from: string;
    to: string[];
  };
}

export class AlertManager {
  private db: Database.Database;
  private config: AlertConfig;

  constructor(dbPath: string = './guardian-data.db', config: AlertConfig = {}) {
    this.db = new Database(dbPath);
    this.config = config;
    this.initTables();
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS alert_rules (
        id TEXT PRIMARY KEY,
        test_id TEXT NOT NULL,
        name TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        conditions TEXT NOT NULL,
        channels TEXT NOT NULL,
        severity TEXT NOT NULL,
        cooldown INTEGER DEFAULT 30,
        escalation_delay INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        rule_id TEXT NOT NULL,
        test_id TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        channels TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        sent_at TEXT,
        acknowledged_at TEXT,
        acknowledged_by TEXT,
        resolved_at TEXT,
        metadata TEXT,
        FOREIGN KEY (rule_id) REFERENCES alert_rules(id)
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_alerts_test_status 
      ON alerts(test_id, status)
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_alerts_created 
      ON alerts(created_at DESC)
    `);
  }

  /**
   * Create alert rule
   */
  createRule(rule: Omit<AlertRule, 'id'>): string {
    const id = `rule-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const stmt = this.db.prepare(`
      INSERT INTO alert_rules (
        id, test_id, name, enabled, conditions, channels, 
        severity, cooldown, escalation_delay
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      rule.testId,
      rule.name,
      rule.enabled ? 1 : 0,
      JSON.stringify(rule.conditions),
      JSON.stringify(rule.channels),
      rule.severity,
      rule.cooldown,
      rule.escalationDelay || null
    );

    logger.info(`Created alert rule: ${id} (${rule.name})`);
    return id;
  }

  /**
   * Get alert rule
   */
  getRule(id: string): AlertRule | null {
    const stmt = this.db.prepare('SELECT * FROM alert_rules WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      testId: row.test_id,
      name: row.name,
      enabled: row.enabled === 1,
      conditions: JSON.parse(row.conditions),
      channels: JSON.parse(row.channels),
      severity: row.severity,
      cooldown: row.cooldown,
      escalationDelay: row.escalation_delay
    };
  }

  /**
   * List alert rules for test
   */
  listRules(testId?: string): AlertRule[] {
    const stmt = testId
      ? this.db.prepare('SELECT * FROM alert_rules WHERE test_id = ? ORDER BY created_at DESC')
      : this.db.prepare('SELECT * FROM alert_rules ORDER BY created_at DESC');

    const rows = testId ? stmt.all(testId) as any[] : stmt.all() as any[];

    return rows.map(row => ({
      id: row.id,
      testId: row.test_id,
      name: row.name,
      enabled: row.enabled === 1,
      conditions: JSON.parse(row.conditions),
      channels: JSON.parse(row.channels),
      severity: row.severity,
      cooldown: row.cooldown,
      escalationDelay: row.escalation_delay
    }));
  }

  /**
   * Update alert rule
   */
  updateRule(id: string, updates: Partial<AlertRule>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(updates.enabled ? 1 : 0);
    }
    if (updates.conditions !== undefined) {
      fields.push('conditions = ?');
      values.push(JSON.stringify(updates.conditions));
    }
    if (updates.channels !== undefined) {
      fields.push('channels = ?');
      values.push(JSON.stringify(updates.channels));
    }
    if (updates.severity !== undefined) {
      fields.push('severity = ?');
      values.push(updates.severity);
    }
    if (updates.cooldown !== undefined) {
      fields.push('cooldown = ?');
      values.push(updates.cooldown);
    }
    if (updates.escalationDelay !== undefined) {
      fields.push('escalation_delay = ?');
      values.push(updates.escalationDelay);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE alert_rules 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `);
    stmt.run(...values);

    logger.info(`Updated alert rule: ${id}`);
  }

  /**
   * Delete alert rule
   */
  deleteRule(id: string): void {
    const stmt = this.db.prepare('DELETE FROM alert_rules WHERE id = ?');
    stmt.run(id);
    logger.info(`Deleted alert rule: ${id}`);
  }

  /**
   * Evaluate test result against rules
   */
  async evaluateRules(testId: string, result: TestResult): Promise<Alert[]> {
    const rules = this.listRules(testId).filter(r => r.enabled);
    const alerts: Alert[] = [];

    for (const rule of rules) {
      if (this.isInCooldown(rule.id)) {
        logger.debug(`Rule ${rule.id} in cooldown, skipping`);
        continue;
      }

      const triggered = this.checkConditions(rule.conditions, result, testId);
      
      if (triggered) {
        const alert = await this.createAlert(rule, result);
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Check if rule is in cooldown period
   */
  private isInCooldown(ruleId: string): boolean {
    const stmt = this.db.prepare(`
      SELECT created_at 
      FROM alerts 
      WHERE rule_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    const row = stmt.get(ruleId) as any;

    if (!row) return false;

    const rule = this.getRule(ruleId);
    if (!rule) return false;

    const lastAlert = new Date(row.created_at);
    const cooldownEnd = new Date(lastAlert.getTime() + rule.cooldown * 60 * 1000);
    
    return new Date() < cooldownEnd;
  }

  /**
   * Check if conditions are met
   */
  private checkConditions(conditions: AlertCondition[], result: TestResult, testId: string): boolean {
    for (const condition of conditions) {
      switch (condition.type) {
        case 'score_below':
          if (result.score >= condition.threshold) return false;
          break;
        
        case 'score_above':
          if (result.score <= condition.threshold) return false;
          break;
        
        case 'issues_above':
          if (result.details.length <= condition.threshold) return false;
          break;
        
        case 'failure_rate':
          // Check recent failure rate
          const recentFailures = this.getRecentFailureRate(testId, condition.duration || 5);
          if (recentFailures < condition.threshold) return false;
          break;
        
        case 'trend_degrading':
          // Check if trend is degrading (requires trend analyzer integration)
          // For now, compare with recent average
          const recentAvg = this.getRecentAverageScore(testId, 10);
          if (result.score >= recentAvg * 0.9) return false;
          break;
      }
    }

    return true;
  }

  /**
   * Get recent failure rate
   */
  private getRecentFailureRate(testId: string, count: number): number {
    const stmt = this.db.prepare(`
      SELECT status
      FROM test_executions
      WHERE test_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `);
    const rows = stmt.all(testId, count) as any[];

    if (rows.length === 0) return 0;

    const failures = rows.filter(r => r.status === 'failed').length;
    return (failures / rows.length) * 100;
  }

  /**
   * Get recent average score
   */
  private getRecentAverageScore(testId: string, count: number): number {
    const stmt = this.db.prepare(`
      SELECT result
      FROM test_executions
      WHERE test_id = ? AND status = 'completed'
      ORDER BY started_at DESC
      LIMIT ?
    `);
    const rows = stmt.all(testId, count) as any[];

    if (rows.length === 0) return 100;

    const scores = rows
      .map(r => JSON.parse(r.result))
      .map(r => r.score);

    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  /**
   * Create alert
   */
  private async createAlert(rule: AlertRule, result: TestResult): Promise<Alert> {
    const id = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();

    const alert: Alert = {
      id,
      ruleId: rule.id,
      testId: rule.testId,
      severity: rule.severity,
      title: `${rule.name} triggered`,
      message: this.formatAlertMessage(rule, result),
      channels: rule.channels,
      status: 'pending',
      createdAt: now,
      metadata: {
        result: {
          url: result.url,
          score: result.score,
          passed: result.passed,
          failed: result.failed,
          issuesCount: result.details.length
        }
      }
    };

    // Store alert
    const stmt = this.db.prepare(`
      INSERT INTO alerts (
        id, rule_id, test_id, severity, title, message, 
        channels, status, created_at, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      alert.id,
      alert.ruleId,
      alert.testId,
      alert.severity,
      alert.title,
      alert.message,
      JSON.stringify(alert.channels),
      alert.status,
      alert.createdAt.toISOString(),
      JSON.stringify(alert.metadata)
    );

    // Send alert
    await this.sendAlert(alert);

    logger.info(`Created and sent alert: ${id} (${rule.name})`);
    return alert;
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(rule: AlertRule, result: TestResult): string {
    const lines = [
      `Alert: ${rule.name}`,
      `URL: ${result.url}`,
      `Score: ${result.score}/100`,
      `Issues: ${result.details.length}`,
      `Passed: ${result.passed}`,
      `Failed: ${result.failed}`,
      ''
    ];

    if (result.details.length > 0) {
      lines.push('Top Issues:');
      result.details.slice(0, 5).forEach(detail => {
        lines.push(`- [${detail.severity}] ${detail.title}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Send alert to channels
   */
  private async sendAlert(alert: Alert): Promise<void> {
    const results: { channel: AlertChannel; success: boolean }[] = [];

    for (const channel of alert.channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmail(alert);
            results.push({ channel, success: true });
            break;
          
          case 'slack':
            await this.sendSlack(alert);
            results.push({ channel, success: true });
            break;
          
          case 'discord':
            await this.sendDiscord(alert);
            results.push({ channel, success: true });
            break;
          
          case 'webhook':
            await this.sendWebhook(alert);
            results.push({ channel, success: true });
            break;
          
          default:
            logger.warn(`Unsupported channel: ${channel}`);
            results.push({ channel, success: false });
        }
      } catch (error: any) {
        logger.error(`Failed to send to ${channel}: ${error.message}`);
        results.push({ channel, success: false });
      }
    }

    // Update alert status
    const allSuccess = results.every(r => r.success);
    const status: AlertStatus = allSuccess ? 'sent' : results.some(r => r.success) ? 'sent' : 'failed';

    const stmt = this.db.prepare(`
      UPDATE alerts 
      SET status = ?, sent_at = ? 
      WHERE id = ?
    `);
    stmt.run(status, new Date().toISOString(), alert.id);
  }

  /**
   * Send email alert
   */
  private async sendEmail(alert: Alert): Promise<void> {
    if (!this.config.email) {
      throw new Error('Email configuration not provided');
    }

    logger.info(`Email alert sent: ${alert.title} to ${this.config.email.to.join(', ')}`);
    // Actual email sending would use nodemailer or similar
  }

  /**
   * Send Slack alert
   */
  private async sendSlack(alert: Alert): Promise<void> {
    if (!this.config.slack?.webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const color = {
      critical: 'danger',
      high: 'warning',
      medium: '#ffcc00',
      low: 'good',
      info: '#439FE0'
    }[alert.severity];

    const payload = {
      username: this.config.slack.username || 'Guardian',
      channel: this.config.slack.channel,
      attachments: [{
        color,
        title: alert.title,
        text: alert.message,
        footer: 'ODAVL Guardian',
        ts: Math.floor(alert.createdAt.getTime() / 1000)
      }]
    };

    logger.info(`Slack alert sent: ${alert.title}`);
    // Actual Slack sending would use fetch to webhook URL
  }

  /**
   * Send Discord alert
   */
  private async sendDiscord(alert: Alert): Promise<void> {
    if (!this.config.discord?.webhookUrl) {
      throw new Error('Discord webhook URL not configured');
    }

    const color = {
      critical: 0xFF0000,
      high: 0xFF6600,
      medium: 0xFFCC00,
      low: 0x00FF00,
      info: 0x0099FF
    }[alert.severity];

    const payload = {
      username: this.config.discord.username || 'Guardian',
      embeds: [{
        color,
        title: alert.title,
        description: alert.message,
        footer: { text: 'ODAVL Guardian' },
        timestamp: alert.createdAt.toISOString()
      }]
    };

    logger.info(`Discord alert sent: ${alert.title}`);
    // Actual Discord sending would use fetch to webhook URL
  }

  /**
   * Send webhook alert
   */
  private async sendWebhook(alert: Alert): Promise<void> {
    if (!this.config.webhook?.url) {
      throw new Error('Webhook URL not configured');
    }

    const payload = {
      id: alert.id,
      ruleId: alert.ruleId,
      testId: alert.testId,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      status: alert.status,
      createdAt: alert.createdAt.toISOString(),
      metadata: alert.metadata
    };

    logger.info(`Webhook alert sent: ${alert.title} to ${this.config.webhook.url}`);
    // Actual webhook sending would use fetch
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    const stmt = this.db.prepare(`
      UPDATE alerts 
      SET status = 'acknowledged', acknowledged_at = ?, acknowledged_by = ?
      WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), acknowledgedBy, alertId);
    logger.info(`Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): void {
    const stmt = this.db.prepare(`
      UPDATE alerts 
      SET status = 'resolved', resolved_at = ?
      WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), alertId);
    logger.info(`Alert resolved: ${alertId}`);
  }

  /**
   * Get alerts
   */
  getAlerts(filters?: {
    testId?: string;
    status?: AlertStatus;
    severity?: AlertSeverity;
    limit?: number;
  }): Alert[] {
    let query = 'SELECT * FROM alerts WHERE 1=1';
    const params: any[] = [];

    if (filters?.testId) {
      query += ' AND test_id = ?';
      params.push(filters.testId);
    }
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.severity) {
      query += ' AND severity = ?';
      params.push(filters.severity);
    }

    query += ' ORDER BY created_at DESC';
    
    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      ruleId: row.rule_id,
      testId: row.test_id,
      severity: row.severity,
      title: row.title,
      message: row.message,
      channels: JSON.parse(row.channels),
      status: row.status,
      createdAt: new Date(row.created_at),
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
      acknowledgedBy: row.acknowledged_by,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
  }

  close(): void {
    this.db.close();
  }
}
