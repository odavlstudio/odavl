/**
 * ODAVL Studio - Webhook Service
 * Send notifications to external services (Slack, Discord, Teams, Custom)
 */

import { type Notification } from '../types/notifications';
import { http } from '../utils/fetch';

export interface WebhookPayload {
  notification: Notification;
  timestamp: string;
  source: 'odavl-studio';
}

export interface SlackWebhookOptions {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export interface DiscordWebhookOptions {
  webhookUrl: string;
  username?: string;
  avatarUrl?: string;
}

export interface TeamsWebhookOptions {
  webhookUrl: string;
}

export interface CustomWebhookOptions {
  webhookUrl: string;
  headers?: Record<string, string>;
  method?: 'POST' | 'PUT';
}

/**
 * Send notification to Slack
 */
export async function sendToSlack(
  notification: Notification,
  options: SlackWebhookOptions
): Promise<boolean> {
  try {
    const color = getSlackColor(notification.priority);
    const emoji = getSlackEmoji(notification.type);

    const payload = {
      channel: options.channel,
      username: options.username || 'ODAVL Studio',
      icon_emoji: options.iconEmoji || ':robot_face:',
      attachments: [
        {
          color,
          title: `${emoji} ${notification.title}`,
          text: notification.message,
          fields: [
            {
              title: 'Priority',
              value: notification.priority.toUpperCase(),
              short: true,
            },
            {
              title: 'Type',
              value: formatNotificationType(notification.type),
              short: true,
            },
          ],
          footer: 'ODAVL Studio',
          footer_icon: 'https://odavl.studio/icon.png',
          ts: Math.floor(notification.createdAt.getTime() / 1000),
          actions: notification.actionUrl
            ? [
                {
                  type: 'button',
                  text: notification.actionLabel || 'View Details',
                  url: notification.actionUrl,
                  style: notification.priority === 'critical' ? 'danger' : 'primary',
                },
              ]
            : undefined,
        },
      ],
    };

    await http.post(options.webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    return true;
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    return false;
  }
}

/**
 * Send notification to Discord
 */
export async function sendToDiscord(
  notification: Notification,
  options: DiscordWebhookOptions
): Promise<boolean> {
  try {
    const color = getDiscordColor(notification.priority);
    const emoji = getDiscordEmoji(notification.type);

    const payload = {
      username: options.username || 'ODAVL Studio',
      avatar_url: options.avatarUrl || 'https://odavl.studio/icon.png',
      embeds: [
        {
          title: `${emoji} ${notification.title}`,
          description: notification.message,
          color,
          fields: [
            {
              name: 'Priority',
              value: notification.priority.toUpperCase(),
              inline: true,
            },
            {
              name: 'Type',
              value: formatNotificationType(notification.type),
              inline: true,
            },
          ],
          timestamp: notification.createdAt.toISOString(),
          footer: {
            text: 'ODAVL Studio',
            icon_url: 'https://odavl.studio/icon.png',
          },
        },
      ],
      components: notification.actionUrl
        ? [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: notification.priority === 'critical' ? 4 : 5,
                  label: notification.actionLabel || 'View Details',
                  url: notification.actionUrl,
                },
              ],
            },
          ]
        : undefined,
    };

    await http.post(options.webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    return true;
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
    return false;
  }
}

/**
 * Send notification to Microsoft Teams
 */
export async function sendToTeams(
  notification: Notification,
  options: TeamsWebhookOptions
): Promise<boolean> {
  try {
    const color = getTeamsColor(notification.priority);
    const emoji = getTeamsEmoji(notification.type);

    const payload = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: notification.title,
      themeColor: color,
      title: `${emoji} ${notification.title}`,
      text: notification.message,
      sections: [
        {
          facts: [
            {
              name: 'Priority:',
              value: notification.priority.toUpperCase(),
            },
            {
              name: 'Type:',
              value: formatNotificationType(notification.type),
            },
            {
              name: 'Time:',
              value: notification.createdAt.toLocaleString(),
            },
          ],
        },
      ],
      potentialAction: notification.actionUrl
        ? [
            {
              '@type': 'OpenUri',
              name: notification.actionLabel || 'View Details',
              targets: [
                {
                  os: 'default',
                  uri: notification.actionUrl,
                },
              ],
            },
          ]
        : undefined,
    };

    await http.post(options.webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    return true;
  } catch (error) {
    console.error('Failed to send Teams notification:', error);
    return false;
  }
}

/**
 * Send notification to custom webhook
 */
export async function sendToCustomWebhook(
  notification: Notification,
  options: CustomWebhookOptions
): Promise<boolean> {
  try {
    const payload: WebhookPayload = {
      notification,
      timestamp: new Date().toISOString(),
      source: 'odavl-studio',
    };

    const method = options.method || 'POST';
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'ODAVL-Studio-Webhook/1.0',
      ...options.headers,
    };

    if (method === 'PUT') {
      await http.put(options.webhookUrl, payload, { headers });
    } else {
      await http.post(options.webhookUrl, payload, { headers });
    }

    return true;
  } catch (error) {
    console.error('Failed to send custom webhook:', error);
    return false;
  }
}

// Helper Functions

function getSlackColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return '#dc2626';
    case 'high':
      return '#f59e0b';
    case 'medium':
      return '#3b82f6';
    case 'low':
      return '#10b981';
    default:
      return '#6b7280';
  }
}

function getDiscordColor(priority: string): number {
  switch (priority) {
    case 'critical':
      return 0xdc2626; // Red
    case 'high':
      return 0xf59e0b; // Orange
    case 'medium':
      return 0x3b82f6; // Blue
    case 'low':
      return 0x10b981; // Green
    default:
      return 0x6b7280; // Gray
  }
}

function getTeamsColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'dc2626';
    case 'high':
      return 'f59e0b';
    case 'medium':
      return '3b82f6';
    case 'low':
      return '10b981';
    default:
      return '6b7280';
  }
}

function getSlackEmoji(type: string): string {
  switch (type) {
    case 'insight_critical':
    case 'issue_detected':
      return ':warning:';
    case 'autopilot_success':
    case 'fix_applied':
      return ':white_check_mark:';
    case 'autopilot_failed':
      return ':x:';
    case 'guardian_passed':
    case 'test_completed':
      return ':shield:';
    case 'guardian_failed':
      return ':no_entry:';
    case 'team_invite':
    case 'team_member_added':
      return ':busts_in_silhouette:';
    case 'billing_issue':
    case 'subscription_expiring':
      return ':credit_card:';
    default:
      return ':bell:';
  }
}

function getDiscordEmoji(type: string): string {
  switch (type) {
    case 'insight_critical':
    case 'issue_detected':
      return '⚠️';
    case 'autopilot_success':
    case 'fix_applied':
      return '✅';
    case 'autopilot_failed':
      return '❌';
    case 'guardian_passed':
    case 'test_completed':
      return '🛡️';
    case 'guardian_failed':
      return '🚫';
    case 'team_invite':
    case 'team_member_added':
      return '👥';
    case 'billing_issue':
    case 'subscription_expiring':
      return '💳';
    default:
      return '🔔';
  }
}

function getTeamsEmoji(type: string): string {
  return getDiscordEmoji(type); // Same emojis for Teams
}

function formatNotificationType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
