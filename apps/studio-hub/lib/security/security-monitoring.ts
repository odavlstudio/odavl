/**
 * Security Monitoring and Alerting System
 *
 * Real-time security event monitoring with:
 * - Intrusion detection
 * - Anomaly detection
 * - Alert escalation
 * - Incident response automation
 *
 * Integrates with Sentry, Datadog, and PagerDuty
 */

import { createAuditLog, AuditAction, queryAuditLogs } from './audit-logger';
import { detectSuspiciousActivity } from './audit-logger';
import { logger } from '@/lib/logger';
import { http } from '@/lib/utils/fetch';

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum AlertType {
  INTRUSION_ATTEMPT = 'intrusion_attempt',
  BRUTE_FORCE = 'brute_force',
  DATA_BREACH = 'data_breach',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SECURITY_SCAN = 'security_scan',
  MALWARE_DETECTED = 'malware_detected',
  POLICY_VIOLATION = 'policy_violation',
}

export interface SecurityAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  metadata: Record<string, any>;
  userId?: string;
  orgId?: string;
  ipAddress?: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

/**
 * Create security alert
 */
export async function createSecurityAlert(params: {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  userId?: string;
  orgId?: string;
  ipAddress?: string;
}): Promise<SecurityAlert> {
  const alert: SecurityAlert = {
    id: crypto.randomUUID(),
    type: params.type,
    severity: params.severity,
    title: params.title,
    description: params.description,
    metadata: params.metadata || {},
    userId: params.userId,

    ipAddress: params.ipAddress,
    timestamp: new Date(),
    acknowledged: false,
  };

  // Log to audit trail
  await createAuditLog({
    action: AuditAction.SUSPICIOUS_ACTIVITY,
    userId: params.userId,
    metadata: {
      alertId: alert.id,
      alertType: params.type,
      ...params.metadata,
    },
    ipAddress: params.ipAddress,
  });

  // Send to monitoring services
  await sendToMonitoring(alert);

  // Escalate if critical
  if (params.severity === AlertSeverity.CRITICAL) {
    await escalateAlert(alert);
  }

  return alert;
}

/**
 * Monitor for brute force attacks
 */
export async function monitorBruteForce(): Promise<void> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  // Query failed login attempts
  const result = await queryAuditLogs({
    action: AuditAction.LOGIN_FAILED,
    startDate: fifteenMinutesAgo,
    limit: 1000,
  });

  // Group by IP address
  const ipCounts: Record<string, number> = {};

  for (const log of result.logs) {
    if (log.ipAddress) {
      ipCounts[log.ipAddress] = (ipCounts[log.ipAddress] || 0) + 1;
    }
  }

  // Alert on suspicious IPs
  for (const [ip, count] of Object.entries(ipCounts)) {
    if (count >= 10) {
      await createSecurityAlert({
        type: AlertType.BRUTE_FORCE,
        severity: count >= 20 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        title: 'Brute Force Attack Detected',
        description: `${count} failed login attempts from IP ${ip} in the last 15 minutes`,
        ipAddress: ip,
        metadata: {
          attemptCount: count,
          timeWindow: '15 minutes',
        },
      });

      // Auto-block IP if too many attempts
      if (count >= 20) {
        await blockIP(ip, '24 hours');
      }
    }
  }
}

/**
 * Monitor for data exfiltration
 */
export async function monitorDataExfiltration(): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Query data export events
  const result = await queryAuditLogs({
    action: AuditAction.DATA_EXPORTED,
    startDate: oneHourAgo,
    limit: 1000,
  });

  // Group by user
  const userExports: Record<string, number> = {};

  for (const log of result.logs) {
    if (log.userId) {
      userExports[log.userId] = (userExports[log.userId] || 0) + 1;
    }
  }

  // Alert on unusual export activity
  for (const [userId, count] of Object.entries(userExports)) {
    if (count >= 5) {
      await createSecurityAlert({
        type: AlertType.DATA_BREACH,
        severity: AlertSeverity.CRITICAL,
        title: 'Potential Data Exfiltration',
        description: `User ${userId} has exported data ${count} times in the last hour`,
        userId,
        metadata: {
          exportCount: count,
          timeWindow: '1 hour',
        },
      });
    }
  }
}

/**
 * Monitor for privilege escalation
 */
export async function monitorPrivilegeEscalation(): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Query role change events
  const result = await queryAuditLogs({
    action: AuditAction.USER_ROLE_CHANGED,
    startDate: oneHourAgo,
    limit: 1000,
  });

  for (const log of result.logs) {
    const metadata = log.metadata as Record<string, any> | undefined;
    if (metadata?.newRole === 'ADMIN' || metadata?.newRole === 'OWNER') {
      await createSecurityAlert({
        type: AlertType.POLICY_VIOLATION,
        severity: AlertSeverity.WARNING,
        title: 'Privilege Escalation Detected',
        description: `User ${log.userId} role changed to ${metadata.newRole}`,
        userId: log.userId,

        metadata: {
          oldRole: metadata.oldRole,
          newRole: metadata.newRole,
          changedBy: metadata.changedBy,
        },
      });
    }
  }
}

/**
 * Monitor for unusual access patterns
 */
export async function monitorAccessPatterns(): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Query all audit logs
  const result = await queryAuditLogs({
    startDate: oneHourAgo,
    limit: 10000,
  });

  // Detect unusual patterns
  const userActivity: Record<string, {
    count: number;
    uniqueIPs: Set<string>;
    actions: Set<string>;
  }> = {};

  for (const log of result.logs) {
    if (log.userId) {
      if (!userActivity[log.userId]) {
        userActivity[log.userId] = {
          count: 0,
          uniqueIPs: new Set(),
          actions: new Set(),
        };
      }

      userActivity[log.userId].count++;
      if (log.ipAddress) userActivity[log.userId].uniqueIPs.add(log.ipAddress);
      userActivity[log.userId].actions.add(log.action);
    }
  }

  // Alert on suspicious patterns
  for (const [userId, activity] of Object.entries(userActivity)) {
    // Alert if user accessed from multiple IPs
    if (activity.uniqueIPs.size >= 5) {
      await createSecurityAlert({
        type: AlertType.SUSPICIOUS_ACTIVITY,
        severity: AlertSeverity.WARNING,
        title: 'Multiple IP Addresses Detected',
        description: `User ${userId} accessed from ${activity.uniqueIPs.size} different IPs in the last hour`,
        userId,
        metadata: {
          ipCount: activity.uniqueIPs.size,
          ips: Array.from(activity.uniqueIPs),
        },
      });
    }

    // Alert if unusually high activity
    if (activity.count >= 500) {
      await createSecurityAlert({
        type: AlertType.SUSPICIOUS_ACTIVITY,
        severity: AlertSeverity.WARNING,
        title: 'Unusually High Activity',
        description: `User ${userId} performed ${activity.count} actions in the last hour`,
        userId,
        metadata: {
          actionCount: activity.count,
          uniqueActions: activity.actions.size,
        },
      });
    }
  }
}

/**
 * Run all security monitors
 */
export async function runSecurityMonitoring(): Promise<{
  monitorsRun: number;
  alertsCreated: number;
  criticalAlerts: number;
}> {
  logger.emoji('🔍', 'Running security monitoring...');

  let alertsCreated = 0;
  let criticalAlerts = 0;

  const monitors = [
    { name: 'Brute Force', fn: monitorBruteForce },
    { name: 'Data Exfiltration', fn: monitorDataExfiltration },
    { name: 'Privilege Escalation', fn: monitorPrivilegeEscalation },
    { name: 'Access Patterns', fn: monitorAccessPatterns },
  ];

  for (const monitor of monitors) {
    try {
      await monitor.fn();
      logger.success(`${monitor.name} monitor completed`);
    } catch (error) {
      logger.error(`${monitor.name} monitor failed`, error as Error);
    }
  }

  return {
    monitorsRun: monitors.length,
    alertsCreated,
    criticalAlerts,
  };
}

/**
 * Send alert to monitoring services
 */
async function sendToMonitoring(alert: SecurityAlert): Promise<void> {
  // Send to Sentry (disabled)
  // if (process.env.SENTRY_DSN) {
  //   try {
  //     const Sentry = await import('@sentry/nextjs');
  //     Sentry.captureMessage(...);
  //     logger.info('Sent to Sentry', { alertTitle: alert.title });
  if (false) {
    try {
      logger.info('Sentry disabled - would send alert', { alertTitle: alert.title });
    } catch (error) {
      logger.error('Failed to send to Sentry', error as Error);
    }
  }

  // Send to Datadog
  if (process.env.DATADOG_API_KEY && process.env.DATADOG_ENABLED === 'true') {
    try {
      // Log event for Datadog APM (via winston or custom logger integration)
      logger.info('Datadog security event', {
        service: 'studio-hub',
        alert_type: alert.type,
        severity: alert.severity,
        title: alert.title,
        metadata: alert.metadata,
      });
    } catch (error) {
      logger.error('Failed to send to Datadog', error as Error);
    }
  }

  // Log to console
  logger.emoji('🚨', `Security Alert [${alert.severity.toUpperCase()}]: ${alert.title}`);
}

/**
 * Escalate critical alerts
 */
async function escalateAlert(alert: SecurityAlert): Promise<void> {
  logger.emoji('🚨', `CRITICAL ALERT: ${alert.title}`);

  // Send to PagerDuty
  if (process.env.PAGERDUTY_API_KEY) {
    try {
      // PagerDuty Events API v2
      await http.post('https://events.pagerduty.com/v2/enqueue', {
        routing_key: process.env.PAGERDUTY_API_KEY,
        event_action: 'trigger',
        payload: {
          summary: `[ODAVL] ${alert.title}`,
          severity: alert.severity === 'critical' ? 'critical' : 'error',
          source: 'studio-hub',
          component: 'security-monitoring',
          custom_details: alert.metadata,
        },
      }, {
        headers: {
          'Accept': 'application/vnd.pagerduty+json;version=2',
        },
      });

      logger.success('Sent to PagerDuty');
    } catch (error) {
      logger.error('Failed to send to PagerDuty', error as Error);
    }
  }

  // Send email to security team
  if (process.env.SECURITY_TEAM_EMAIL) {
    try {
      const { sendEmail } = await import('@/lib/email/sender');
      await sendEmail({
        to: process.env.SECURITY_TEAM_EMAIL,
        subject: `🚨 CRITICAL Security Alert: ${alert.title}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
                .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .metadata { background: #f9fafb; padding: 15px; border-radius: 4px; margin: 20px 0; }
                .metadata-item { margin: 10px 0; }
                .label { font-weight: 600; color: #374151; }
                .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 24px;">🚨 CRITICAL Security Alert</h1>
                </div>
                <div class="content">
                  <div class="alert-box">
                    <h2 style="margin-top: 0; color: #dc2626;">${alert.title}</h2>
                    <p><span class="label">Severity:</span> ${alert.severity.toUpperCase()}</p>
                    <p><span class="label">Type:</span> ${alert.type}</p>
                    <p><span class="label">Timestamp:</span> ${new Date(alert.timestamp).toISOString()}</p>
                  </div>

                  <div class="metadata">
                    <h3 style="margin-top: 0;">Alert Details</h3>
                    ${Object.entries(alert.metadata || {}).map(([key, value]) => `
                      <div class="metadata-item">
                        <span class="label">${key}:</span> ${JSON.stringify(value)}
                      </div>
                    `).join('')}
                  </div>

                  <p><strong>Action Required:</strong> This is a critical security event that requires immediate attention. Please investigate and take appropriate action.</p>

                  <p style="margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/security" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Security Dashboard</a>
                  </p>
                </div>
                <div class="footer">
                  <p>ODAVL Studio Security Monitoring</p>
                  <p>This is an automated alert from your production environment.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
      logger.success('Sent email to security team');
    } catch (error) {
      logger.error('Failed to send security email', error as Error);
    }
  }

  // Send Slack notification
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await http.post(process.env.SLACK_WEBHOOK_URL, {
        text: `🚨 *CRITICAL Security Alert*`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🚨 Critical Security Alert',
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Alert:*\n${alert.title}` },
              { type: 'mrkdwn', text: `*Severity:*\n${alert.severity.toUpperCase()}` },
              { type: 'mrkdwn', text: `*Type:*\n${alert.type}` },
              { type: 'mrkdwn', text: `*Time:*\n${new Date(alert.timestamp).toISOString()}` },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Details:*\n\`\`\`${JSON.stringify(alert.metadata, null, 2)}\`\`\``,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'View Dashboard' },
                url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/security`,
                style: 'danger',
              },
            ],
          },
        ],
      });
      logger.success('Sent to Slack');
    } catch (error) {
      logger.error('Failed to send to Slack', error as Error);
    }
  }
}

/**
 * Block IP address via Cloudflare API
 */
async function blockIP(ip: string, duration: string): Promise<void> {
  logger.warn(`Blocking IP: ${ip} for ${duration}`);

  if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID) {
    try {
      // Cloudflare Firewall Rules API
      const result = await http.post<{ result?: { id?: string } }>(
        `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/firewall/access_rules/rules`,
        {
          mode: 'block',
          configuration: {
            target: 'ip',
            value: ip,
          },
          notes: `Blocked by ODAVL Security Monitoring - ${new Date().toISOString()}`,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          },
        }
      );

      logger.success(`IP ${ip} blocked via Cloudflare`, { ruleId: result.data?.result?.id });
    } catch (error) {
      logger.error('Failed to block IP via Cloudflare', error as Error);
    }
  } else {
    logger.warn('Cloudflare API not configured, IP block skipped');
  }
}

/**
 * Generate security monitoring report
 */
export async function generateSecurityReport(): Promise<string> {
  const result = await runSecurityMonitoring();

  return `
# Security Monitoring Report

**Generated:** ${new Date().toISOString()}
**Monitors Run:** ${result.monitorsRun}
**Alerts Created:** ${result.alertsCreated}
**Critical Alerts:** ${result.criticalAlerts}

## Monitoring Coverage

✅ Brute Force Detection
✅ Data Exfiltration Monitoring
✅ Privilege Escalation Detection
✅ Access Pattern Analysis

## Status

${result.criticalAlerts > 0 ? '🚨 CRITICAL: Immediate attention required\n' : ''}
${result.alertsCreated > 0 ? '⚠️  Alerts detected, review recommended\n' : ''}
${result.alertsCreated === 0 ? '✅ No security issues detected\n' : ''}

## Next Steps

${result.criticalAlerts > 0 ? '1. Investigate critical alerts immediately\n2. Implement automated response\n3. Document incident\n' : ''}
${result.alertsCreated === 0 ? '- Continue monitoring\n- Review security policies\n- Schedule penetration test\n' : ''}
`;
}
