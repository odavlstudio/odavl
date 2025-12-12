/**
 * @fileoverview Slack Integration
 * Provides seamless integration with Slack for real-time notifications
 * Automatically sends analysis results to Slack channels
 * 
 * Features:
 * - Rich message formatting (Block Kit)
 * - Interactive buttons and actions
 * - Channel/DM notifications
 * - Thread support for updates
 * - File uploads (reports)
 * - Custom webhooks
 * 
 * @module integrations/slack
 */

import type { AnalysisResult, Issue } from '../types';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Slack configuration
 */
export interface SlackConfig {
  /** Slack webhook URL or Bot token */
  webhookUrl?: string;
  
  /** Bot token (for advanced features) */
  botToken?: string;
  
  /** Default channel to post to */
  channel?: string;
  
  /** Enable threading (updates in same thread) */
  enableThreading?: boolean;
  
  /** Mention users on critical issues */
  mentionOnCritical?: boolean;
  
  /** Users to mention (e.g., @user, @channel) */
  mentionUsers?: string[];
  
  /** Include full report as file attachment */
  attachReport?: boolean;
  
  /** Custom message template */
  messageTemplate?: string;
  
  /** Notification severity threshold */
  notifyThreshold?: {
    critical?: number;
    high?: number;
    medium?: number;
  };
}

/**
 * Slack Block Kit message structure
 * https://api.slack.com/block-kit
 */
export interface SlackMessage {
  channel?: string;
  text: string; // Fallback text
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
  thread_ts?: string; // Thread timestamp for replies
  username?: string;
  icon_emoji?: string;
}

/**
 * Slack block (Block Kit)
 */
export interface SlackBlock {
  type: 'section' | 'header' | 'divider' | 'context' | 'actions' | 'image';
  text?: {
    type: 'plain_text' | 'mrkdwn';
    text: string;
    emoji?: boolean;
  };
  fields?: Array<{
    type: 'mrkdwn' | 'plain_text';
    text: string;
  }>;
  accessory?: {
    type: 'button' | 'image';
    text?: {
      type: 'plain_text';
      text: string;
    };
    url?: string;
    value?: string;
  };
  elements?: Array<{
    type: 'button' | 'image' | 'mrkdwn' | 'plain_text';
    text?: {
      type: 'plain_text';
      text: string;
    };
    url?: string;
    value?: string;
  }>;
  image_url?: string;
  alt_text?: string;
}

/**
 * Slack attachment (legacy, but still useful)
 */
export interface SlackAttachment {
  color?: string; // good, warning, danger, or hex color
  pretext?: string;
  author_name?: string;
  author_icon?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  footer?: string;
  footer_icon?: string;
  ts?: number; // Timestamp
}

// ============================================================================
// Slack Integration Class
// ============================================================================

/**
 * Slack integration for real-time notifications
 */
export class SlackIntegration {
  private config: Required<SlackConfig>;
  private threadTs?: string; // Store thread timestamp for updates

  constructor(config: SlackConfig) {
    this.config = {
      webhookUrl: config.webhookUrl || '',
      botToken: config.botToken || '',
      channel: config.channel || '#code-quality',
      enableThreading: config.enableThreading ?? true,
      mentionOnCritical: config.mentionOnCritical ?? true,
      mentionUsers: config.mentionUsers || [],
      attachReport: config.attachReport ?? false,
      messageTemplate: config.messageTemplate || '',
      notifyThreshold: config.notifyThreshold || { critical: 0, high: 5, medium: 20 },
    };
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Send analysis results to Slack
   */
  async sendNotification(result: AnalysisResult): Promise<void> {
    console.log('📤 Sending Slack notification...');

    // Check if we should notify based on threshold
    if (!this.shouldNotify(result)) {
      console.log('⊘ Below notification threshold, skipping');
      return;
    }

    // Build message
    const message = this.buildMessage(result);

    // Send to Slack
    await this.sendMessage(message);

    // Upload report as file if enabled
    if (this.config.attachReport) {
      await this.uploadReport(result);
    }

    console.log('✅ Slack notification sent');
  }

  /**
   * Send start notification (analysis starting)
   */
  async sendStartNotification(context: { jobName?: string; branch?: string }): Promise<void> {
    const message: SlackMessage = {
      channel: this.config.channel,
      text: '🔍 ODAVL Analysis Started',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔍 ODAVL Analysis Started',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Job:*\n${context.jobName || 'N/A'}`,
            },
            {
              type: 'mrkdwn',
              text: `*Branch:*\n${context.branch || 'N/A'}`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Started at ${new Date().toLocaleString()}`,
            },
          ],
        },
      ],
    };

    const response = await this.sendMessage(message);
    
    // Store thread timestamp for updates
    if (this.config.enableThreading && response?.ts) {
      this.threadTs = response.ts;
    }
  }

  /**
   * Send progress update (in thread)
   */
  async sendProgressUpdate(progress: { current: number; total: number; status: string }): Promise<void> {
    if (!this.config.enableThreading || !this.threadTs) return;

    const percent = Math.round((progress.current / progress.total) * 100);
    const progressBar = this.createProgressBar(percent, 20);

    const message: SlackMessage = {
      channel: this.config.channel,
      text: `Progress: ${percent}%`,
      thread_ts: this.threadTs,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Progress:* ${progress.current}/${progress.total} files\n${progressBar} ${percent}%\n\n_${progress.status}_`,
          },
        },
      ],
    };

    await this.sendMessage(message);
  }

  // --------------------------------------------------------------------------
  // Private Methods - Message Building
  // --------------------------------------------------------------------------

  private buildMessage(result: AnalysisResult): SlackMessage {
    const issues = result.issues || [];
    const critical = issues.filter(i => i.severity === 'critical').length;
    const high = issues.filter(i => i.severity === 'high').length;
    const medium = issues.filter(i => i.severity === 'medium').length;
    const low = issues.filter(i => i.severity === 'low').length;

    // Determine status and color
    const status = critical > 0 ? 'Critical Issues Found' :
                   high > 0 ? 'Issues Need Attention' :
                   'Analysis Complete';
    
    const emoji = critical > 0 ? '🔴' :
                  high > 0 ? '🟠' :
                  medium > 0 ? '🟡' : '✅';

    const color = critical > 0 ? 'danger' :
                  high > 0 ? 'warning' : 'good';

    // Build mention string if needed
    let mentionText = '';
    if (this.config.mentionOnCritical && critical > 0 && this.config.mentionUsers.length > 0) {
      mentionText = `\n\n*Attention:* ${this.config.mentionUsers.join(' ')}`;
    }

    const message: SlackMessage = {
      channel: this.config.channel,
      text: `${emoji} ODAVL Analysis: ${status}`,
      username: 'ODAVL Bot',
      icon_emoji: ':mag:',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} ODAVL Code Quality Report`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${status}*${mentionText}`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Total Issues:*\n${issues.length}`,
            },
            {
              type: 'mrkdwn',
              text: `*Files Analyzed:*\n${result.metrics?.filesAnalyzed || 0}`,
            },
            {
              type: 'mrkdwn',
              text: `:red_circle: *Critical:*\n${critical}`,
            },
            {
              type: 'mrkdwn',
              text: `:large_orange_circle: *High:*\n${high}`,
            },
            {
              type: 'mrkdwn',
              text: `:large_yellow_circle: *Medium:*\n${medium}`,
            },
            {
              type: 'mrkdwn',
              text: `:large_blue_circle: *Low:*\n${low}`,
            },
          ],
        },
      ],
    };

    // Add top issues section if any critical/high issues
    if (critical > 0 || high > 0) {
      const topIssues = issues
        .filter(i => i.severity === 'critical' || i.severity === 'high')
        .slice(0, 3);

      message.blocks?.push({
        type: 'divider',
      });

      message.blocks?.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Top Issues:*\n' + topIssues.map((issue, i) => 
            `${i + 1}. ${this.getSeverityEmoji(issue.severity)} \`${issue.file}:${issue.line}\`\n   ${issue.message}`
          ).join('\n\n'),
        },
      });
    }

    // Add actions section
    message.blocks?.push({
      type: 'divider',
    });

    message.blocks?.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Analysis completed in ${this.formatDuration(result.metrics?.duration || 0)} • ${new Date().toLocaleString()}`,
        },
      ],
    });

    // Add thread timestamp if available
    if (this.threadTs) {
      message.thread_ts = this.threadTs;
    }

    return message;
  }

  // --------------------------------------------------------------------------
  // Private Methods - API Communication
  // --------------------------------------------------------------------------

  private async sendMessage(message: SlackMessage): Promise<{ ts?: string } | null> {
    if (!this.config.webhookUrl && !this.config.botToken) {
      throw new Error('Slack webhook URL or bot token required');
    }

    try {
      if (this.config.webhookUrl) {
        // Use webhook (simpler, but less features)
        const response = await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        });

        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
        }

        return null; // Webhooks don't return message timestamp
      } else if (this.config.botToken) {
        // Use Bot API (more features, requires token)
        const response = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });

        const data = await response.json() as { ok: boolean; ts?: string; error?: string };

        if (!data.ok) {
          throw new Error(`Slack API error: ${data.error}`);
        }

        return { ts: data.ts };
      }

      return null;
    } catch (error) {
      console.error('✗ Failed to send Slack message:', error);
      throw error;
    }
  }

  private async uploadReport(result: AnalysisResult): Promise<void> {
    if (!this.config.botToken) {
      console.log('⊘ Bot token required for file uploads, skipping');
      return;
    }

    try {
      const reportContent = JSON.stringify(result, null, 2);
      const blob = new Blob([reportContent], { type: 'application/json' });

      const formData = new FormData();
      formData.append('file', blob, 'odavl-report.json');
      formData.append('channels', this.config.channel);
      formData.append('initial_comment', 'Complete ODAVL analysis report');
      if (this.threadTs) {
        formData.append('thread_ts', this.threadTs);
      }

      const response = await fetch('https://slack.com/api/files.upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.botToken}`,
        },
        body: formData,
      });

      const data = await response.json() as { ok: boolean; error?: string };

      if (!data.ok) {
        throw new Error(`File upload failed: ${data.error}`);
      }

      console.log('✓ Report uploaded to Slack');
    } catch (error) {
      console.error('✗ Failed to upload report:', error);
    }
  }

  // --------------------------------------------------------------------------
  // Private Methods - Utilities
  // --------------------------------------------------------------------------

  private shouldNotify(result: AnalysisResult): boolean {
    const issues = result.issues || [];
    const critical = issues.filter(i => i.severity === 'critical').length;
    const high = issues.filter(i => i.severity === 'high').length;
    const medium = issues.filter(i => i.severity === 'medium').length;

    const { notifyThreshold } = this.config;

    // Notify if any threshold is exceeded
    return (
      critical > (notifyThreshold.critical || 0) ||
      high > (notifyThreshold.high || 0) ||
      medium > (notifyThreshold.medium || 0)
    );
  }

  private getSeverityEmoji(severity: string): string {
    const emojis: Record<string, string> = {
      critical: ':red_circle:',
      high: ':large_orange_circle:',
      medium: ':large_yellow_circle:',
      low: ':large_blue_circle:',
    };
    return emojis[severity] || ':white_circle:';
  }

  private createProgressBar(percent: number, length: number): string {
    const filled = Math.round((percent / 100) * length);
    const empty = length - filled;
    return '▓'.repeat(filled) + '░'.repeat(empty);
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create Slack integration instance
 */
export function createSlackIntegration(config: SlackConfig): SlackIntegration {
  return new SlackIntegration(config);
}

/**
 * Send quick notification to Slack
 */
export async function sendSlackNotification(
  result: AnalysisResult,
  config: SlackConfig
): Promise<void> {
  const integration = createSlackIntegration(config);
  await integration.sendNotification(result);
}

/**
 * Auto-detect and send to Slack
 */
export async function notifySlack(
  result: AnalysisResult,
  webhookUrl?: string
): Promise<void> {
  const url = webhookUrl || process.env.SLACK_WEBHOOK_URL;
  
  if (!url) {
    throw new Error('Slack webhook URL required (SLACK_WEBHOOK_URL env var or parameter)');
  }

  await sendSlackNotification(result, { webhookUrl: url });
}
