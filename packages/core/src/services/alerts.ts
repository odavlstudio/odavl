/**
 * ODAVL Studio - Alert Service
 * Phase 3.2: Observability Stack
 * 
 * Alert management with multiple channels:
 * - PagerDuty (for critical incidents)
 * - Slack (for team notifications)
 * - Email (for non-urgent alerts)
 * - Webhook (for custom integrations)
 */

import { logger } from './logging';

export enum AlertSeverity {
  CRITICAL = 'critical', // Page immediately
  HIGH = 'high',        // Notify within minutes
  MEDIUM = 'medium',    // Notify within hours
  LOW = 'low'           // Info only
}

export enum AlertChannel {
  PAGERDUTY = 'pagerduty',
  SLACK = 'slack',
  EMAIL = 'email',
  WEBHOOK = 'webhook'
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  source: string; // Service or component generating alert
  timestamp: Date;
  metadata?: Record<string, any>;
  channels: AlertChannel[];
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string; // e.g., "error_rate > 5%"
  severity: AlertSeverity;
  channels: AlertChannel[];
  cooldown: number; // Minutes before re-alerting
  enabled: boolean;
}

class AlertService {
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private lastAlertTimes: Map<string, Date> = new Map();

  constructor() {
    this.initializeDefaultRules();
    console.log('🚨 Alert service initialized');
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: 'error_rate > 5%',
        severity: AlertSeverity.HIGH,
        channels: [AlertChannel.SLACK, AlertChannel.PAGERDUTY],
        cooldown: 15,
        enabled: true
      },
      {
        id: 'database_down',
        name: 'Database Unavailable',
        condition: 'database_health = unhealthy',
        severity: AlertSeverity.CRITICAL,
        channels: [AlertChannel.PAGERDUTY, AlertChannel.SLACK],
        cooldown: 5,
        enabled: true
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        condition: 'memory_usage > 90%',
        severity: AlertSeverity.HIGH,
        channels: [AlertChannel.SLACK],
        cooldown: 30,
        enabled: true
      },
      {
        id: 'slow_response_time',
        name: 'Slow Response Time',
        condition: 'p95_response_time > 2000ms',
        severity: AlertSeverity.MEDIUM,
        channels: [AlertChannel.SLACK],
        cooldown: 60,
        enabled: true
      },
      {
        id: 'payment_failure',
        name: 'Payment Processing Failure',
        condition: 'stripe_error',
        severity: AlertSeverity.CRITICAL,
        channels: [AlertChannel.SLACK, AlertChannel.EMAIL],
        cooldown: 10,
        enabled: true
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }

  /**
   * Check if alert should be sent (respects cooldown)
   */
  private shouldAlert(ruleId: string, cooldownMinutes: number): boolean {
    const lastAlert = this.lastAlertTimes.get(ruleId);
    if (!lastAlert) return true;

    const minutesSinceLastAlert = (Date.now() - lastAlert.getTime()) / 1000 / 60;
    return minutesSinceLastAlert >= cooldownMinutes;
  }

  /**
   * Send alert to PagerDuty
   */
  private async sendToPagerDuty(alert: Alert): Promise<void> {
    if (!process.env.PAGERDUTY_API_KEY || !process.env.PAGERDUTY_SERVICE_ID) {
      logger.warn('PagerDuty not configured, skipping alert', { alert: alert.id });
      return;
    }

    try {
      const payload = {
        routing_key: process.env.PAGERDUTY_SERVICE_ID,
        event_action: alert.resolved ? 'resolve' : 'trigger',
        dedup_key: alert.id,
        payload: {
          summary: alert.title,
          source: alert.source,
          severity: alert.severity,
          timestamp: alert.timestamp.toISOString(),
          custom_details: alert.metadata
        }
      };

      const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token token=${process.env.PAGERDUTY_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`PagerDuty API error: ${response.statusText}`);
      }

      logger.info('Alert sent to PagerDuty', { alertId: alert.id });
    } catch (error: any) {
      logger.error('Failed to send alert to PagerDuty', error, { alertId: alert.id });
    }
  }

  /**
   * Send alert to Slack
   */
  private async sendToSlack(alert: Alert): Promise<void> {
    if (!process.env.SLACK_WEBHOOK_URL) {
      logger.warn('Slack not configured, skipping alert', { alert: alert.id });
      return;
    }

    try {
      const color = {
        [AlertSeverity.CRITICAL]: '#ff0000',
        [AlertSeverity.HIGH]: '#ff6600',
        [AlertSeverity.MEDIUM]: '#ffcc00',
        [AlertSeverity.LOW]: '#0099ff'
      }[alert.severity];

      const emoji = {
        [AlertSeverity.CRITICAL]: '🚨',
        [AlertSeverity.HIGH]: '⚠️',
        [AlertSeverity.MEDIUM]: '⚡',
        [AlertSeverity.LOW]: 'ℹ️'
      }[alert.severity];

      const payload = {
        attachments: [
          {
            color,
            title: `${emoji} ${alert.title}`,
            text: alert.description,
            fields: [
              {
                title: 'Severity',
                value: alert.severity.toUpperCase(),
                short: true
              },
              {
                title: 'Source',
                value: alert.source,
                short: true
              },
              {
                title: 'Time',
                value: alert.timestamp.toISOString(),
                short: true
              },
              {
                title: 'Status',
                value: alert.resolved ? '✅ Resolved' : '🔴 Active',
                short: true
              }
            ],
            footer: 'ODAVL Studio Monitoring',
            ts: Math.floor(alert.timestamp.getTime() / 1000)
          }
        ]
      };

      const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.statusText}`);
      }

      logger.info('Alert sent to Slack', { alertId: alert.id });
    } catch (error: any) {
      logger.error('Failed to send alert to Slack', error, { alertId: alert.id });
    }
  }

  /**
   * Send alert via email
   */
  private async sendToEmail(alert: Alert): Promise<void> {
    // TODO: Integrate with EmailService
    logger.info('Alert email would be sent', { alertId: alert.id });
  }

  /**
   * Send alert to custom webhook
   */
  private async sendToWebhook(alert: Alert): Promise<void> {
    if (!process.env.ALERT_WEBHOOK_URL) {
      return;
    }

    try {
      const response = await fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.statusText}`);
      }

      logger.info('Alert sent to webhook', { alertId: alert.id });
    } catch (error: any) {
      logger.error('Failed to send alert to webhook', error, { alertId: alert.id });
    }
  }

  /**
   * Create and send an alert
   */
  async sendAlert(config: {
    title: string;
    description: string;
    severity: AlertSeverity;
    source: string;
    metadata?: Record<string, any>;
    ruleId?: string;
  }): Promise<Alert> {
    // Check cooldown if rule specified
    if (config.ruleId) {
      const rule = this.alertRules.get(config.ruleId);
      if (rule && !this.shouldAlert(config.ruleId, rule.cooldown)) {
        logger.debug('Alert suppressed by cooldown', { ruleId: config.ruleId });
        throw new Error('Alert cooldown period not elapsed');
      }
    }

    // Create alert
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: config.title,
      description: config.description,
      severity: config.severity,
      source: config.source,
      timestamp: new Date(),
      metadata: config.metadata,
      channels: this.getChannelsForSeverity(config.severity),
      resolved: false
    };

    // Store alert
    this.alerts.set(alert.id, alert);

    // Update last alert time
    if (config.ruleId) {
      this.lastAlertTimes.set(config.ruleId, new Date());
    }

    // Send to configured channels
    const sendPromises = alert.channels.map(channel => {
      switch (channel) {
        case AlertChannel.PAGERDUTY:
          return this.sendToPagerDuty(alert);
        case AlertChannel.SLACK:
          return this.sendToSlack(alert);
        case AlertChannel.EMAIL:
          return this.sendToEmail(alert);
        case AlertChannel.WEBHOOK:
          return this.sendToWebhook(alert);
      }
    });

    await Promise.allSettled(sendPromises);

    logger.info('Alert created', {
      alertId: alert.id,
      severity: alert.severity,
      channels: alert.channels
    });

    return alert;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolvedBy?: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;

    // Notify channels that alert is resolved
    if (alert.channels.includes(AlertChannel.PAGERDUTY)) {
      await this.sendToPagerDuty(alert);
    }

    if (alert.channels.includes(AlertChannel.SLACK)) {
      await this.sendToSlack(alert);
    }

    logger.info('Alert resolved', { alertId, resolvedBy });
  }

  /**
   * Get channels based on severity
   */
  private getChannelsForSeverity(severity: AlertSeverity): AlertChannel[] {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return [AlertChannel.PAGERDUTY, AlertChannel.SLACK, AlertChannel.EMAIL];
      case AlertSeverity.HIGH:
        return [AlertChannel.SLACK, AlertChannel.EMAIL];
      case AlertSeverity.MEDIUM:
        return [AlertChannel.SLACK];
      case AlertSeverity.LOW:
        return [AlertChannel.EMAIL];
      default:
        return [AlertChannel.SLACK];
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(limit: number = 100): Alert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Add or update alert rule
   */
  setAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    logger.info('Alert rule updated', { ruleId: rule.id });
  }

  /**
   * Get alert rule
   */
  getAlertRule(ruleId: string): AlertRule | undefined {
    return this.alertRules.get(ruleId);
  }

  /**
   * Get all alert rules
   */
  getAllRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Test alert (for debugging)
   */
  async testAlert(channel: AlertChannel): Promise<void> {
    const alert: Alert = {
      id: `test_${Date.now()}`,
      title: 'Test Alert',
      description: 'This is a test alert from ODAVL Studio',
      severity: AlertSeverity.LOW,
      source: 'alert-service-test',
      timestamp: new Date(),
      channels: [channel],
      resolved: false
    };

    switch (channel) {
      case AlertChannel.PAGERDUTY:
        await this.sendToPagerDuty(alert);
        break;
      case AlertChannel.SLACK:
        await this.sendToSlack(alert);
        break;
      case AlertChannel.EMAIL:
        await this.sendToEmail(alert);
        break;
      case AlertChannel.WEBHOOK:
        await this.sendToWebhook(alert);
        break;
    }
  }
}

// Export singleton
export const alertService = new AlertService();
