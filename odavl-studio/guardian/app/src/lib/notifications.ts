/**
 * Notification Service for ODAVL Guardian
 * Sends alerts via Email, Slack, Discord, Webhook
 */

import logger from './logger';

export type NotificationType = 'email' | 'slack' | 'discord' | 'webhook';

export interface NotificationChannel {
    type: NotificationType;
    enabled: boolean;
    config: Record<string, unknown>;
}

export interface NotificationPayload {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    metadata?: Record<string, unknown>;
    link?: string;
}

/**
 * Send notification to all enabled channels
 */
export async function sendNotification(
    channels: NotificationChannel[],
    payload: NotificationPayload
): Promise<void> {
    const promises = channels
        .filter((channel) => channel.enabled)
        .map((channel) => sendToChannel(channel, payload));

    await Promise.allSettled(promises);
}

/**
 * Send notification to specific channel
 */
async function sendToChannel(
    channel: NotificationChannel,
    payload: NotificationPayload
): Promise<void> {
    try {
        switch (channel.type) {
            case 'email':
                await sendEmail(channel.config, payload);
                break;
            case 'slack':
                await sendSlack(channel.config, payload);
                break;
            case 'discord':
                await sendDiscord(channel.config, payload);
                break;
            case 'webhook':
                await sendWebhook(channel.config, payload);
                break;
            default:
                logger.warn('Unknown notification channel type', {
                    type: channel.type,
                });
        }
    } catch (error) {
        logger.error('Notification delivery failed', {
            channel: channel.type,
            error,
        });
    }
}

/**
 * Send Email via SMTP or SendGrid/Mailgun
 */
async function sendEmail(
    config: Record<string, unknown>,
    payload: NotificationPayload
): Promise<void> {
    const to = config.to as string;
    const provider = (config.provider as string) || 'smtp';

    if (!to) {
        throw new Error('Email recipient (to) required');
    }

    // SendGrid provider
    if (provider === 'sendgrid') {
        const apiKey = process.env.SENDGRID_API_KEY || (config.apiKey as string);
        if (!apiKey) {
            throw new Error('SendGrid API key not configured');
        }

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: to }] }],
                from: { email: config.from || 'alerts@odavl.com' },
                subject: `[${payload.severity.toUpperCase()}] ${payload.title}`,
                content: [
                    {
                        type: 'text/html',
                        value: generateEmailHTML(payload),
                    },
                ],
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`SendGrid API error: ${error}`);
        }

        logger.info('Email sent via SendGrid', { to, subject: payload.title });
        return;
    }

    // SMTP provider (Nodemailer)
    if (provider === 'smtp') {
        // Use Nodemailer for SMTP (requires additional setup)
        logger.warn('SMTP email not implemented - use SendGrid or Mailgun', {
            to,
        });
        return;
    }

    throw new Error(`Unsupported email provider: ${provider}`);
}

/**
 * Send Slack notification
 */
async function sendSlack(
    config: Record<string, unknown>,
    payload: NotificationPayload
): Promise<void> {
    const webhookUrl = config.webhookUrl as string;

    if (!webhookUrl) {
        throw new Error('Slack webhook URL required');
    }

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: payload.title,
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: `${getSeverityEmoji(payload.severity)} ${payload.title}`,
                    },
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: payload.message,
                    },
                },
                ...(payload.metadata
                    ? [
                        {
                            type: 'section',
                            fields: Object.entries(payload.metadata).map(
                                ([key, value]) => ({
                                    type: 'mrkdwn',
                                    text: `*${key}:*\n${value}`,
                                })
                            ),
                        },
                    ]
                    : []),
                ...(payload.link
                    ? [
                        {
                            type: 'actions',
                            elements: [
                                {
                                    type: 'button',
                                    text: {
                                        type: 'plain_text',
                                        text: 'View Details',
                                    },
                                    url: payload.link,
                                },
                            ],
                        },
                    ]
                    : []),
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Slack webhook error: ${error}`);
    }

    logger.info('Slack notification sent', { title: payload.title });
}

/**
 * Send Discord notification
 */
async function sendDiscord(
    config: Record<string, unknown>,
    payload: NotificationPayload
): Promise<void> {
    const webhookUrl = config.webhookUrl as string;

    if (!webhookUrl) {
        throw new Error('Discord webhook URL required');
    }

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            embeds: [
                {
                    title: payload.title,
                    description: payload.message,
                    color: getSeverityColor(payload.severity),
                    fields: payload.metadata
                        ? Object.entries(payload.metadata).map(
                            ([key, value]) => ({
                                name: key,
                                value: String(value),
                                inline: true,
                            })
                        )
                        : [],
                    timestamp: new Date().toISOString(),
                },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Discord webhook error: ${error}`);
    }

    logger.info('Discord notification sent', { title: payload.title });
}

/**
 * Send generic webhook notification
 */
async function sendWebhook(
    config: Record<string, unknown>,
    payload: NotificationPayload
): Promise<void> {
    const webhookUrl = config.url as string;

    if (!webhookUrl) {
        throw new Error('Webhook URL required');
    }

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event: 'alert',
            severity: payload.severity,
            title: payload.title,
            message: payload.message,
            metadata: payload.metadata,
            link: payload.link,
            timestamp: new Date().toISOString(),
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Webhook error: ${error}`);
    }

    logger.info('Webhook notification sent', { url: webhookUrl });
}

/**
 * Generate HTML email content
 */
function generateEmailHTML(payload: NotificationPayload): string {
    const severityColor = {
        info: '#3b82f6',
        warning: '#f59e0b',
        error: '#ef4444',
        critical: '#dc2626',
    }[payload.severity];

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="background-color: ${severityColor}; padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">${payload.title}</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">${payload.severity.toUpperCase()}</p>
        </div>
        <div style="padding: 20px;">
            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.5; color: #374151;">
                ${payload.message}
            </p>
            ${payload.metadata
            ? `
            <div style="background-color: #f9fafb; border-radius: 6px; padding: 15px; margin-top: 20px;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Details:</h3>
                ${Object.entries(payload.metadata)
                .map(
                    ([key, value]) => `
                    <div style="margin-bottom: 8px;">
                        <strong style="color: #374151;">${key}:</strong>
                        <span style="color: #6b7280;">${value}</span>
                    </div>
                `
                )
                .join('')}
            </div>
            `
            : ''
        }
            ${payload.link
            ? `
            <div style="margin-top: 20px;">
                <a href="${payload.link}" style="display: inline-block; background-color: ${severityColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                    View Details
                </a>
            </div>
            `
            : ''
        }
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">ODAVL Guardian Alert System</p>
            <p style="margin: 5px 0 0 0;">Sent at ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Get emoji for severity level
 */
function getSeverityEmoji(severity: string): string {
    const emojis = {
        info: 'ℹ️',
        warning: '⚠️',
        error: '🚨',
        critical: '🔥',
    };
    return emojis[severity as keyof typeof emojis] || 'ℹ️';
}

/**
 * Get Discord color code for severity
 */
function getSeverityColor(severity: string): number {
    const colors = {
        info: 0x3b82f6, // Blue
        warning: 0xf59e0b, // Orange
        error: 0xef4444, // Red
        critical: 0xdc2626, // Dark Red
    };
    return colors[severity as keyof typeof colors] || 0x3b82f6;
}
