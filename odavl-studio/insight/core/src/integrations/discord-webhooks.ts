/**
 * @fileoverview Discord & Generic Webhook Integration
 * Provides flexible webhook support for Discord and custom webhook endpoints
 * Automatically sends analysis results with customizable formatting
 * 
 * Features:
 * - Discord embeds (rich formatting)
 * - Generic webhook support (custom JSON payloads)
 * - Template system (mustache-style)
 * - Color-coded severity
 * - Thumbnail & footer support
 * - Field customization
 * 
 * @module integrations/discord-webhooks
 */

import type { AnalysisResult, Issue } from '../types';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Discord webhook configuration
 */
export interface DiscordConfig {
  /** Discord webhook URL */
  webhookUrl: string;
  
  /** Bot username override */
  username?: string;
  
  /** Bot avatar URL */
  avatarUrl?: string;
  
  /** Enable rich embeds */
  useEmbeds?: boolean;
  
  /** Maximum fields per embed (Discord limit: 25) */
  maxFields?: number;
  
  /** Mention roles on critical issues */
  mentionRoles?: string[];
  
  /** Mention users on critical issues */
  mentionUsers?: string[];
  
  /** Notification severity threshold */
  notifyThreshold?: {
    critical?: number;
    high?: number;
    medium?: number;
  };
  
  /** Thumbnail URL */
  thumbnailUrl?: string;
  
  /** Footer text */
  footerText?: string;
  
  /** Footer icon URL */
  footerIcon?: string;
}

/**
 * Generic webhook configuration
 */
export interface GenericWebhookConfig {
  /** Webhook endpoint URL */
  webhookUrl: string;
  
  /** HTTP method (default: POST) */
  method?: 'POST' | 'PUT' | 'PATCH';
  
  /** Custom headers */
  headers?: Record<string, string>;
  
  /** Payload template (mustache-style variables) */
  template?: string;
  
  /** Template variables extraction function */
  extractVariables?: (result: AnalysisResult) => Record<string, unknown>;
  
  /** Content type (default: application/json) */
  contentType?: string;
  
  /** Authentication token */
  authToken?: string;
  
  /** Authentication type (Bearer, Basic, Custom) */
  authType?: 'Bearer' | 'Basic' | 'Custom';
  
  /** Custom auth header name (if authType = Custom) */
  authHeader?: string;
}

/**
 * Discord embed structure
 * https://discord.com/developers/docs/resources/channel#embed-object
 */
export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: {
    text: string;
    icon_url?: string;
  };
  thumbnail?: {
    url: string;
  };
  image?: {
    url: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
}

/**
 * Discord webhook message
 */
export interface DiscordMessage {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

// ============================================================================
// Discord Integration Class
// ============================================================================

/**
 * Discord webhook integration
 */
export class DiscordIntegration {
  private config: Required<DiscordConfig>;

  constructor(config: DiscordConfig) {
    this.config = {
      webhookUrl: config.webhookUrl,
      username: config.username || 'ODAVL',
      avatarUrl: config.avatarUrl || '',
      useEmbeds: config.useEmbeds ?? true,
      maxFields: config.maxFields || 20,
      mentionRoles: config.mentionRoles || [],
      mentionUsers: config.mentionUsers || [],
      notifyThreshold: config.notifyThreshold || { critical: 0, high: 5, medium: 20 },
      thumbnailUrl: config.thumbnailUrl || '',
      footerText: config.footerText || 'ODAVL Code Quality',
      footerIcon: config.footerIcon || '',
    };
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Send analysis results to Discord
   */
  async sendNotification(result: AnalysisResult): Promise<void> {
    console.log('📤 Sending Discord notification...');

    // Check if we should notify
    if (!this.shouldNotify(result)) {
      console.log('⊘ Below notification threshold, skipping');
      return;
    }

    // Build message
    const message = this.config.useEmbeds
      ? this.buildEmbedMessage(result)
      : this.buildPlainMessage(result);

    // Send to Discord
    await this.sendMessage(message);

    console.log('✅ Discord notification sent');
  }

  /**
   * Send start notification
   */
  async sendStartNotification(context: { jobName?: string; branch?: string }): Promise<void> {
    const embed: DiscordEmbed = {
      title: '🔍 Analysis Started',
      color: 0x5865F2, // Discord Blurple
      fields: [
        { name: 'Job', value: context.jobName || 'N/A', inline: true },
        { name: 'Branch', value: context.branch || 'N/A', inline: true },
        { name: 'Started At', value: new Date().toLocaleString(), inline: false },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: this.config.footerText, icon_url: this.config.footerIcon },
    };

    await this.sendMessage({ embeds: [embed] });
  }

  /**
   * Send completion notification
   */
  async sendCompletionNotification(summary: { duration: number; filesAnalyzed: number; totalIssues: number }): Promise<void> {
    const color = summary.totalIssues === 0 ? 0x57F287 : // Green
                  summary.totalIssues > 10 ? 0xED4245 : // Red
                  0xFEE75C; // Yellow

    const embed: DiscordEmbed = {
      title: '✅ Analysis Complete',
      color,
      fields: [
        { name: 'Duration', value: this.formatDuration(summary.duration), inline: true },
        { name: 'Files', value: summary.filesAnalyzed.toString(), inline: true },
        { name: 'Issues', value: summary.totalIssues.toString(), inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: this.config.footerText },
    };

    await this.sendMessage({ embeds: [embed] });
  }

  // --------------------------------------------------------------------------
  // Private Methods - Message Building
  // --------------------------------------------------------------------------

  private buildEmbedMessage(result: AnalysisResult): DiscordMessage {
    const issues = result.issues || [];
    const critical = issues.filter((i: Issue) => i.severity === 'critical').length;
    const high = issues.filter((i: Issue) => i.severity === 'high').length;
    const medium = issues.filter((i: Issue) => i.severity === 'medium').length;
    const low = issues.filter((i: Issue) => i.severity === 'low').length;

    // Determine color
    const color = critical > 0 ? 0xED4245 : // Red
                  high > 0 ? 0xFEE75C : // Yellow
                  medium > 0 ? 0x5865F2 : // Blurple
                  0x57F287; // Green

    // Build main embed
    const embed: DiscordEmbed = {
      title: '📊 ODAVL Code Quality Report',
      description: this.getStatusMessage(critical, high, medium),
      color,
      timestamp: new Date().toISOString(),
      fields: [
        { name: '📈 Total Issues', value: issues.length.toString(), inline: true },
        { name: '📁 Files Analyzed', value: (result.metrics?.filesAnalyzed || 0).toString(), inline: true },
        { name: '⏱️ Duration', value: this.formatDuration(result.metrics?.duration || 0), inline: true },
        { name: '🔴 Critical', value: critical.toString(), inline: true },
        { name: '🟠 High', value: high.toString(), inline: true },
        { name: '🟡 Medium', value: medium.toString(), inline: true },
        { name: '🔵 Low', value: low.toString(), inline: true },
        { name: '📝 Lines of Code', value: (result.metrics?.linesOfCode || 0).toLocaleString(), inline: true },
      ],
      footer: {
        text: this.config.footerText,
        icon_url: this.config.footerIcon,
      },
    };

    // Add thumbnail if configured
    if (this.config.thumbnailUrl) {
      embed.thumbnail = { url: this.config.thumbnailUrl };
    }

    // Build content (mentions)
    let content = '';
    if (critical > 0 && (this.config.mentionRoles.length > 0 || this.config.mentionUsers.length > 0)) {
      const roleMentions = this.config.mentionRoles.map(id => `<@&${id}>`).join(' ');
      const userMentions = this.config.mentionUsers.map(id => `<@${id}>`).join(' ');
      content = `⚠️ Critical issues detected! ${roleMentions} ${userMentions}`.trim();
    }

    const message: DiscordMessage = {
      content: content || undefined,
      username: this.config.username,
      avatar_url: this.config.avatarUrl || undefined,
      embeds: [embed],
    };

    // Add top issues embed if critical/high
    if (critical > 0 || high > 0) {
      const topIssuesEmbed = this.buildTopIssuesEmbed(issues);
      if (topIssuesEmbed) {
        message.embeds!.push(topIssuesEmbed);
      }
    }

    return message;
  }

  private buildTopIssuesEmbed(issues: Issue[]): DiscordEmbed | null {
    const topIssues = issues
      .filter(i => i.severity === 'critical' || i.severity === 'high')
      .slice(0, Math.min(5, this.config.maxFields));

    if (topIssues.length === 0) return null;

    return {
      title: '⚠️ Top Priority Issues',
      color: 0xED4245,
      fields: topIssues.map((issue, index) => ({
        name: `${index + 1}. ${this.getSeverityEmoji(issue.severity)} ${issue.file}:${issue.line}`,
        value: `\`\`\`${issue.message.slice(0, 200)}\`\`\``,
        inline: false,
      })),
    };
  }

  private buildPlainMessage(result: AnalysisResult): DiscordMessage {
    const issues = result.issues || [];
    const critical = issues.filter((i: Issue) => i.severity === 'critical').length;
    const high = issues.filter((i: Issue) => i.severity === 'high').length;
    const medium = issues.filter((i: Issue) => i.severity === 'medium').length;
    const low = issues.filter((i: Issue) => i.severity === 'low').length;

    const emoji = critical > 0 ? '🔴' :
                  high > 0 ? '🟠' :
                  medium > 0 ? '🟡' : '✅';

    const content = `
${emoji} **ODAVL Code Quality Report**

**Status:** ${this.getStatusMessage(critical, high, medium)}

**Metrics:**
• Total Issues: ${issues.length}
• Files Analyzed: ${result.metrics?.filesAnalyzed || 0}
• Duration: ${this.formatDuration(result.metrics?.duration || 0)}

**Severity Breakdown:**
🔴 Critical: ${critical}
🟠 High: ${high}
🟡 Medium: ${medium}
🔵 Low: ${low}

Analysis completed at ${new Date().toLocaleString()}
    `.trim();

    return {
      content,
      username: this.config.username,
      avatar_url: this.config.avatarUrl || undefined,
    };
  }

  // --------------------------------------------------------------------------
  // Private Methods - API Communication
  // --------------------------------------------------------------------------

  private async sendMessage(message: DiscordMessage): Promise<void> {
    if (!this.config.webhookUrl) {
      throw new Error('Discord webhook URL required');
    }

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}\n${text}`);
      }
    } catch (error) {
      console.error('✗ Failed to send Discord message:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Private Methods - Utilities
  // --------------------------------------------------------------------------

  private shouldNotify(result: AnalysisResult): boolean {
    const issues = result.issues || [];
    const critical = issues.filter((i: Issue) => i.severity === 'critical').length;
    const high = issues.filter((i: Issue) => i.severity === 'high').length;
    const medium = issues.filter((i: Issue) => i.severity === 'medium').length;

    const { notifyThreshold } = this.config;

    return (
      critical > (notifyThreshold.critical || 0) ||
      high > (notifyThreshold.high || 0) ||
      medium > (notifyThreshold.medium || 0)
    );
  }

  private getStatusMessage(critical: number, high: number, medium: number): string {
    if (critical > 0) return `⚠️ ${critical} critical issue${critical !== 1 ? 's' : ''} detected!`;
    if (high > 0) return `📊 ${high} high-priority issue${high !== 1 ? 's' : ''} need attention`;
    if (medium > 0) return `📋 ${medium} medium-priority issue${medium !== 1 ? 's' : ''} found`;
    return '✅ No critical issues found';
  }

  private getSeverityEmoji(severity: string): string {
    const emojis: Record<string, string> = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵',
    };
    return emojis[severity] || '⚪';
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

// ============================================================================
// Generic Webhook Integration Class
// ============================================================================

/**
 * Generic webhook integration with template support
 */
export class GenericWebhookIntegration {
  private config: Required<GenericWebhookConfig>;

  constructor(config: GenericWebhookConfig) {
    this.config = {
      webhookUrl: config.webhookUrl,
      method: config.method || 'POST',
      headers: config.headers || {},
      template: config.template || '',
      extractVariables: config.extractVariables || this.defaultExtractVariables,
      contentType: config.contentType || 'application/json',
      authToken: config.authToken || '',
      authType: config.authType || 'Bearer',
      authHeader: config.authHeader || 'Authorization',
    };
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Send analysis results to generic webhook
   */
  async sendNotification(result: AnalysisResult): Promise<void> {
    console.log('📤 Sending generic webhook notification...');

    // Extract variables
    const variables = this.config.extractVariables(result);

    // Build payload
    const payload = this.config.template
      ? this.renderTemplate(this.config.template, variables)
      : JSON.stringify(variables);

    // Send webhook
    await this.sendWebhook(payload);

    console.log('✅ Generic webhook notification sent');
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  private async sendWebhook(payload: string): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': this.config.contentType,
      ...this.config.headers,
    };

    // Add authentication
    if (this.config.authToken) {
      const authValue = this.config.authType === 'Bearer'
        ? `Bearer ${this.config.authToken}`
        : this.config.authType === 'Basic'
        ? `Basic ${Buffer.from(this.config.authToken).toString('base64')}`
        : this.config.authToken;

      headers[this.config.authHeader] = authValue;
    }

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: this.config.method,
        headers,
        body: payload,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}\n${text}`);
      }
    } catch (error) {
      console.error('✗ Failed to send webhook:', error);
      throw error;
    }
  }

  private renderTemplate(template: string, variables: Record<string, unknown>): string {
    let rendered = template;

    // Replace {{variable}} with values
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }

    return rendered;
  }

  private defaultExtractVariables(result: AnalysisResult): Record<string, unknown> {
    const issues = result.issues || [];
    return {
      timestamp: new Date().toISOString(),
      totalIssues: issues.length,
      critical: issues.filter((i: Issue) => i.severity === 'critical').length,
      high: issues.filter((i: Issue) => i.severity === 'high').length,
      medium: issues.filter((i: Issue) => i.severity === 'medium').length,
      low: issues.filter((i: Issue) => i.severity === 'low').length,
      filesAnalyzed: result.metrics?.filesAnalyzed || 0,
      linesOfCode: result.metrics?.linesOfCode || 0,
      duration: result.metrics?.duration || 0,
      branch: process.env.GIT_BRANCH || process.env.CI_COMMIT_REF_NAME || 'unknown',
      commit: process.env.GIT_COMMIT || process.env.CI_COMMIT_SHA || 'unknown',
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create Discord integration instance
 */
export function createDiscordIntegration(config: DiscordConfig): DiscordIntegration {
  return new DiscordIntegration(config);
}

/**
 * Send quick notification to Discord
 */
export async function sendDiscordNotification(
  result: AnalysisResult,
  config: DiscordConfig
): Promise<void> {
  const integration = createDiscordIntegration(config);
  await integration.sendNotification(result);
}

/**
 * Auto-detect and send to Discord
 */
export async function notifyDiscord(
  result: AnalysisResult,
  webhookUrl?: string
): Promise<void> {
  const url = webhookUrl || process.env.DISCORD_WEBHOOK_URL;
  
  if (!url) {
    throw new Error('Discord webhook URL required (DISCORD_WEBHOOK_URL env var or parameter)');
  }

  await sendDiscordNotification(result, { webhookUrl: url });
}

/**
 * Create generic webhook integration instance
 */
export function createGenericWebhookIntegration(config: GenericWebhookConfig): GenericWebhookIntegration {
  return new GenericWebhookIntegration(config);
}

/**
 * Send to generic webhook with template
 */
export async function sendGenericWebhook(
  result: AnalysisResult,
  config: GenericWebhookConfig
): Promise<void> {
  const integration = createGenericWebhookIntegration(config);
  await integration.sendNotification(result);
}

/**
 * Create custom webhook with JSON template
 */
export async function sendCustomWebhook(
  result: AnalysisResult,
  webhookUrl: string,
  template: string
): Promise<void> {
  await sendGenericWebhook(result, { webhookUrl, template });
}
