/**
 * Alert Service Stub
 * Original implementation used PagerDuty, Slack, email integrations
 */

export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum AlertChannel {
  PAGERDUTY = 'pagerduty',
  SLACK = 'slack',
  EMAIL = 'email',
  WEBHOOK = 'webhook',
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  source: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  channels: AlertChannel[];
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  ruleId?: string;
}

export class AlertService {
  async sendAlert(alert: Partial<Alert> & { title: string; description: string; severity: AlertSeverity; source: string }): Promise<void> {
    throw new Error('AlertService not implemented in packages/core. Use app-specific alert service.');
  }

  async resolveAlert(alertId: string, resolvedBy?: string): Promise<void> {
    throw new Error('AlertService not implemented in packages/core. Use app-specific alert service.');
  }

  async getActiveAlerts(severity?: AlertSeverity): Promise<Alert[]> {
    throw new Error('AlertService not implemented in packages/core. Use app-specific alert service.');
  }

  async getAllAlerts(limit?: number): Promise<Alert[]> {
    throw new Error('AlertService not implemented in packages/core. Use app-specific alert service.');
  }

  getAlert(alertId: string): Alert | null {
    throw new Error('AlertService not implemented in packages/core. Use app-specific alert service.');
  }
}

export const alertService = new AlertService();
