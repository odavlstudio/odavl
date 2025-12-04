import nodemailer from 'nodemailer';
import logger from './logger';
import * as Sentry from '@sentry/nextjs';

// Alert types
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertChannel = 'email' | 'slack' | 'webhook';

export interface Alert {
    title: string;
    message: string;
    severity: AlertSeverity;
    metadata?: Record<string, any>;
    channels?: AlertChannel[];
}

// Email transporter
const createEmailTransporter = () => {
    if (!process.env.SMTP_HOST) {
        logger.warn('SMTP not configured, email alerts disabled');
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

// Alert manager
export class AlertManager {
    private static instance: AlertManager;
    private emailTransporter: ReturnType<typeof createEmailTransporter>;

    private constructor() {
        this.emailTransporter = createEmailTransporter();
    }

    static getInstance(): AlertManager {
        if (!AlertManager.instance) {
            AlertManager.instance = new AlertManager();
        }
        return AlertManager.instance;
    }

    async send(alert: Alert): Promise<void> {
        const channels = alert.channels || ['email'];

        logger.info('Sending alert', {
            title: alert.title,
            severity: alert.severity,
            channels,
        });

        const results = await Promise.allSettled([
            channels.includes('email') ? this.sendEmail(alert) : null,
            channels.includes('slack') ? this.sendSlack(alert) : null,
            channels.includes('webhook') ? this.sendWebhook(alert) : null,
        ]);

        // Check for failures
        const failures = results.filter(
            (r) => r.status === 'rejected'
        ) as PromiseRejectedResult[];

        if (failures.length > 0) {
            logger.error('Some alert channels failed', {
                failures: failures.map((f) => f.reason),
            });

            Sentry.captureMessage('Alert delivery failed', {
                level: 'error',
                extra: {
                    alert,
                    failures: failures.map((f) => f.reason),
                },
            });
        }
    }

    private async sendEmail(alert: Alert): Promise<void> {
        if (!this.emailTransporter) {
            logger.warn('Email transporter not configured');
            return;
        }

        const recipients = process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [];
        if (recipients.length === 0) {
            logger.warn('No email recipients configured');
            return;
        }

        const severityColors = {
            critical: '#FF0000',
            high: '#FF6B00',
            medium: '#FFD700',
            low: '#00AA00',
        };

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${severityColors[alert.severity]}; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0;">${alert.title}</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Severity: ${alert.severity.toUpperCase()}</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 0 0 5px 5px;">
          <p style="white-space: pre-wrap;">${alert.message}</p>
          ${alert.metadata ? `
            <div style="margin-top: 20px;">
              <h3>Additional Information</h3>
              <pre style="background: white; padding: 10px; border-radius: 3px; overflow-x: auto;">${JSON.stringify(alert.metadata, null, 2)}</pre>
            </div>
          ` : ''}
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            Timestamp: ${new Date().toISOString()}
          </p>
        </div>
      </div>
    `;

        try {
            await this.emailTransporter.sendMail({
                from: process.env.SMTP_FROM || 'Guardian <noreply@guardian.local>',
                to: recipients.join(', '),
                subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
                html,
            });

            logger.info('Email alert sent', {
                title: alert.title,
                recipients: recipients.length,
            });
        } catch (error) {
            logger.error('Failed to send email alert', {
                error: error instanceof Error ? error.message : String(error),
                alert,
            });
            throw error;
        }
    }

    private async sendSlack(alert: Alert): Promise<void> {
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (!webhookUrl) {
            logger.warn('Slack webhook not configured');
            return;
        }

        const severityColors = {
            critical: 'danger',
            high: 'warning',
            medium: '#FFD700',
            low: 'good',
        };

        const payload = {
            attachments: [
                {
                    color: severityColors[alert.severity],
                    title: alert.title,
                    text: alert.message,
                    fields: [
                        {
                            title: 'Severity',
                            value: alert.severity.toUpperCase(),
                            short: true,
                        },
                        {
                            title: 'Timestamp',
                            value: new Date().toISOString(),
                            short: true,
                        },
                        ...(alert.metadata
                            ? Object.entries(alert.metadata).map(([key, value]) => ({
                                title: key,
                                value: String(value),
                                short: true,
                            }))
                            : []),
                    ],
                },
            ],
        };

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Slack API error: ${response.statusText}`);
            }

            logger.info('Slack alert sent', {
                title: alert.title,
            });
        } catch (error) {
            logger.error('Failed to send Slack alert', {
                error: error instanceof Error ? error.message : String(error),
                alert,
            });
            throw error;
        }
    }

    private async sendWebhook(alert: Alert): Promise<void> {
        const webhookUrl = process.env.ALERT_WEBHOOK_URL;
        if (!webhookUrl) {
            logger.warn('Alert webhook not configured');
            return;
        }

        const payload = {
            title: alert.title,
            message: alert.message,
            severity: alert.severity,
            metadata: alert.metadata,
            timestamp: new Date().toISOString(),
        };

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(process.env.ALERT_WEBHOOK_SECRET && {
                        'X-Alert-Secret': process.env.ALERT_WEBHOOK_SECRET,
                    }),
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Webhook error: ${response.statusText}`);
            }

            logger.info('Webhook alert sent', {
                title: alert.title,
                url: webhookUrl,
            });
        } catch (error) {
            logger.error('Failed to send webhook alert', {
                error: error instanceof Error ? error.message : String(error),
                alert,
            });
            throw error;
        }
    }
}

// Helper functions
export const sendAlert = (alert: Alert) => {
    const manager = AlertManager.getInstance();
    return manager.send(alert);
};

export const sendCriticalAlert = (title: string, message: string, metadata?: Record<string, any>) => {
    return sendAlert({
        title,
        message,
        severity: 'critical',
        metadata,
        channels: ['email', 'slack'],
    });
};

export const sendHighAlert = (title: string, message: string, metadata?: Record<string, any>) => {
    return sendAlert({
        title,
        message,
        severity: 'high',
        metadata,
        channels: ['email', 'slack'],
    });
};

export const sendMediumAlert = (title: string, message: string, metadata?: Record<string, any>) => {
    return sendAlert({
        title,
        message,
        severity: 'medium',
        metadata,
        channels: ['slack'],
    });
};

export const sendLowAlert = (title: string, message: string, metadata?: Record<string, any>) => {
    return sendAlert({
        title,
        message,
        severity: 'low',
        metadata,
        channels: ['slack'],
    });
};

// Export AlertsService alias for backward compatibility
export class AlertsService {
    private manager: AlertManager;

    constructor() {
        this.manager = AlertManager.getInstance();
    }

    async sendEmail(to: string, subject: string, body: string) {
        const alert: Alert = {
            title: subject,
            message: body,
            severity: 'medium',
            channels: ['email'],
        };
        return this.manager.send(alert);
    }

    async send(alert: Alert) {
        return this.manager.send(alert);
    }
}

export const alertManager = AlertManager.getInstance();
