/**
 * @fileoverview Microsoft Teams Integration
 * Provides seamless integration with Microsoft Teams for real-time notifications
 * Automatically sends analysis results to Teams channels
 * 
 * Features:
 * - Adaptive Cards (rich formatting)
 * - Incoming Webhooks support
 * - Channel notifications
 * - Actionable message cards
 * - Mention support (@channel, @user)
 * - Theme-aware cards (dark/light mode)
 * 
 * @module integrations/microsoft-teams
 */

import type { AnalysisResult, Issue } from '../types';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Microsoft Teams configuration
 */
export interface TeamsConfig {
  /** Teams webhook URL */
  webhookUrl: string;
  
  /** Enable adaptive cards (vs simple cards) */
  useAdaptiveCards?: boolean;
  
  /** Mention users on critical issues */
  mentionOnCritical?: boolean;
  
  /** Users to mention (UPNs or display names) */
  mentionUsers?: string[];
  
  /** Theme color for cards */
  themeColor?: string;
  
  /** Include action buttons */
  includeActions?: boolean;
  
  /** Custom action buttons */
  customActions?: Array<{
    title: string;
    url: string;
  }>;
  
  /** Notification severity threshold */
  notifyThreshold?: {
    critical?: number;
    high?: number;
    medium?: number;
  };
}

/**
 * Microsoft Teams Adaptive Card
 * https://adaptivecards.io/explorer/
 */
export interface AdaptiveCard {
  type: 'AdaptiveCard';
  version: '1.4';
  body: AdaptiveCardElement[];
  actions?: AdaptiveCardAction[];
  $schema?: string;
  msteams?: {
    width?: 'Full';
  };
}

/**
 * Adaptive Card element
 */
export interface AdaptiveCardElement {
  type: 'TextBlock' | 'ColumnSet' | 'Container' | 'FactSet' | 'Image' | 'ActionSet';
  text?: string;
  size?: 'Small' | 'Default' | 'Medium' | 'Large' | 'ExtraLarge';
  weight?: 'Lighter' | 'Default' | 'Bolder';
  color?: 'Default' | 'Dark' | 'Light' | 'Accent' | 'Good' | 'Warning' | 'Attention';
  wrap?: boolean;
  separator?: boolean;
  spacing?: 'None' | 'Small' | 'Default' | 'Medium' | 'Large' | 'ExtraLarge';
  horizontalAlignment?: 'Left' | 'Center' | 'Right';
  columns?: AdaptiveCardColumn[];
  items?: AdaptiveCardElement[];
  facts?: Array<{ title: string; value: string }>;
  url?: string;
  style?: 'default' | 'emphasis' | 'good' | 'attention' | 'warning' | 'accent';
  actions?: AdaptiveCardAction[];
}

/**
 * Adaptive Card column
 */
export interface AdaptiveCardColumn {
  type: 'Column';
  width?: string | number | 'auto' | 'stretch';
  items: AdaptiveCardElement[];
  style?: 'default' | 'emphasis' | 'good' | 'attention' | 'warning';
}

/**
 * Adaptive Card action
 */
export interface AdaptiveCardAction {
  type: 'Action.OpenUrl' | 'Action.Submit' | 'Action.ShowCard';
  title: string;
  url?: string;
  data?: Record<string, unknown>;
  card?: AdaptiveCard;
  style?: 'default' | 'positive' | 'destructive';
}

/**
 * Teams message with Adaptive Card
 */
export interface TeamsMessage {
  type: 'message';
  attachments: Array<{
    contentType: 'application/vnd.microsoft.card.adaptive';
    contentUrl?: string | null;
    content: AdaptiveCard;
  }>;
}

/**
 * Legacy MessageCard format (still supported)
 */
export interface MessageCard {
  '@type': 'MessageCard';
  '@context': 'https://schema.org/extensions';
  summary: string;
  themeColor?: string;
  title?: string;
  text?: string;
  sections?: Array<{
    activityTitle?: string;
    activitySubtitle?: string;
    activityImage?: string;
    facts?: Array<{
      name: string;
      value: string;
    }>;
    text?: string;
    markdown?: boolean;
  }>;
  potentialAction?: Array<{
    '@type': 'OpenUri';
    name: string;
    targets: Array<{
      os: 'default';
      uri: string;
    }>;
  }>;
}

// ============================================================================
// Microsoft Teams Integration Class
// ============================================================================

/**
 * Microsoft Teams integration for real-time notifications
 */
export class MicrosoftTeamsIntegration {
  private config: Required<TeamsConfig>;

  constructor(config: TeamsConfig) {
    this.config = {
      webhookUrl: config.webhookUrl,
      useAdaptiveCards: config.useAdaptiveCards ?? true,
      mentionOnCritical: config.mentionOnCritical ?? true,
      mentionUsers: config.mentionUsers || [],
      themeColor: config.themeColor || '',
      includeActions: config.includeActions ?? true,
      customActions: config.customActions || [],
      notifyThreshold: config.notifyThreshold || { critical: 0, high: 5, medium: 20 },
    };
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Send analysis results to Microsoft Teams
   */
  async sendNotification(result: AnalysisResult): Promise<void> {
    console.log('📤 Sending Microsoft Teams notification...');

    // Check if we should notify based on threshold
    if (!this.shouldNotify(result)) {
      console.log('⊘ Below notification threshold, skipping');
      return;
    }

    // Build message (Adaptive Card or MessageCard)
    const message = this.config.useAdaptiveCards
      ? this.buildAdaptiveCard(result)
      : this.buildMessageCard(result);

    // Send to Teams
    await this.sendMessage(message);

    console.log('✅ Microsoft Teams notification sent');
  }

  /**
   * Send start notification (analysis starting)
   */
  async sendStartNotification(context: { jobName?: string; branch?: string }): Promise<void> {
    const card: AdaptiveCard = {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'TextBlock',
          text: '🔍 ODAVL Analysis Started',
          size: 'Large',
          weight: 'Bolder',
          color: 'Accent',
        },
        {
          type: 'FactSet',
          facts: [
            { title: 'Job', value: context.jobName || 'N/A' },
            { title: 'Branch', value: context.branch || 'N/A' },
            { title: 'Started At', value: new Date().toLocaleString() },
          ],
        },
      ],
    };

    await this.sendMessage({ type: 'message', attachments: [{ contentType: 'application/vnd.microsoft.card.adaptive', contentUrl: null, content: card }] });
  }

  /**
   * Send completion notification with summary
   */
  async sendCompletionNotification(summary: { duration: number; filesAnalyzed: number; totalIssues: number }): Promise<void> {
    const emoji = summary.totalIssues === 0 ? '✅' : summary.totalIssues > 10 ? '⚠️' : '📊';
    
    const card: AdaptiveCard = {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'TextBlock',
          text: `${emoji} Analysis Complete`,
          size: 'Large',
          weight: 'Bolder',
          color: summary.totalIssues === 0 ? 'Good' : summary.totalIssues > 10 ? 'Warning' : 'Default',
        },
        {
          type: 'FactSet',
          facts: [
            { title: 'Duration', value: this.formatDuration(summary.duration) },
            { title: 'Files Analyzed', value: summary.filesAnalyzed.toString() },
            { title: 'Total Issues', value: summary.totalIssues.toString() },
          ],
        },
      ],
    };

    await this.sendMessage({ type: 'message', attachments: [{ contentType: 'application/vnd.microsoft.card.adaptive', contentUrl: null, content: card }] });
  }

  // --------------------------------------------------------------------------
  // Private Methods - Adaptive Card Building
  // --------------------------------------------------------------------------

  private buildAdaptiveCard(result: AnalysisResult): TeamsMessage {
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

    const color = critical > 0 ? 'Attention' :
                  high > 0 ? 'Warning' :
                  medium > 0 ? 'Accent' : 'Good';

    const card: AdaptiveCard = {
      type: 'AdaptiveCard',
      version: '1.4',
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      msteams: { width: 'Full' },
      body: [
        // Header
        {
          type: 'TextBlock',
          text: `${emoji} ODAVL Code Quality Report`,
          size: 'ExtraLarge',
          weight: 'Bolder',
          color,
        },
        {
          type: 'TextBlock',
          text: status,
          size: 'Medium',
          color,
          spacing: 'None',
        },
        {
          type: 'TextBlock',
          text: `Analysis completed at ${new Date().toLocaleString()}`,
          size: 'Small',
          color: 'Default',
          spacing: 'Small',
          wrap: true,
        },
        // Divider
        {
          type: 'Container',
          separator: true,
          spacing: 'Medium',
          items: [],
        },
        // Metrics Grid
        {
          type: 'ColumnSet',
          columns: [
            {
              type: 'Column',
              width: 'stretch',
              items: [
                { type: 'TextBlock', text: 'Total Issues', weight: 'Bolder', size: 'Small' },
                { type: 'TextBlock', text: issues.length.toString(), size: 'ExtraLarge', weight: 'Bolder', spacing: 'None' },
              ],
            },
            {
              type: 'Column',
              width: 'stretch',
              items: [
                { type: 'TextBlock', text: '🔴 Critical', size: 'Small', color: 'Attention' },
                { type: 'TextBlock', text: critical.toString(), size: 'Large', weight: 'Bolder', color: 'Attention', spacing: 'None' },
              ],
            },
            {
              type: 'Column',
              width: 'stretch',
              items: [
                { type: 'TextBlock', text: '🟠 High', size: 'Small', color: 'Warning' },
                { type: 'TextBlock', text: high.toString(), size: 'Large', weight: 'Bolder', color: 'Warning', spacing: 'None' },
              ],
            },
            {
              type: 'Column',
              width: 'stretch',
              items: [
                { type: 'TextBlock', text: '🟡 Medium', size: 'Small', color: 'Accent' },
                { type: 'TextBlock', text: medium.toString(), size: 'Large', weight: 'Bolder', color: 'Accent', spacing: 'None' },
              ],
            },
          ],
        },
        // Additional Metrics
        {
          type: 'FactSet',
          separator: true,
          spacing: 'Medium',
          facts: [
            { title: 'Files Analyzed', value: (result.metrics?.filesAnalyzed || 0).toString() },
            { title: 'Lines of Code', value: (result.metrics?.linesOfCode || 0).toLocaleString() },
            { title: 'Analysis Duration', value: this.formatDuration(result.metrics?.duration || 0) },
            { title: 'Low Priority', value: low.toString() },
          ],
        },
      ],
      actions: [],
    };

    // Add top issues if critical or high
    if (critical > 0 || high > 0) {
      const topIssues = issues
        .filter(i => i.severity === 'critical' || i.severity === 'high')
        .slice(0, 3);

      card.body.push({
        type: 'Container',
        separator: true,
        spacing: 'Medium',
        style: 'emphasis',
        items: [
          {
            type: 'TextBlock',
            text: '⚠️ Top Priority Issues',
            weight: 'Bolder',
            size: 'Medium',
          },
          ...topIssues.map(issue => ({
            type: 'TextBlock' as const,
            text: `**${this.getSeverityEmoji(issue.severity)} ${issue.message}**\n\`${issue.file}:${issue.line}\``,
            wrap: true,
            spacing: 'Small' as const,
          })),
        ],
      });
    }

    // Add mention if critical issues and enabled
    if (this.config.mentionOnCritical && critical > 0 && this.config.mentionUsers.length > 0) {
      card.body.push({
        type: 'TextBlock',
        text: `🔔 **Attention:** ${this.config.mentionUsers.join(', ')}`,
        color: 'Attention',
        weight: 'Bolder',
        separator: true,
        spacing: 'Medium',
      });
    }

    // Add action buttons
    if (this.config.includeActions) {
      card.actions = [
        {
          type: 'Action.OpenUrl',
          title: '📊 View Full Report',
          url: process.env.BUILD_URL || 'https://github.com',
        },
        ...this.config.customActions.map(action => ({
          type: 'Action.OpenUrl' as const,
          title: action.title,
          url: action.url,
        })),
      ];
    }

    return {
      type: 'message',
      attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: card,
      }],
    };
  }

  // --------------------------------------------------------------------------
  // Private Methods - Legacy MessageCard Building
  // --------------------------------------------------------------------------

  private buildMessageCard(result: AnalysisResult): MessageCard {
    const issues = result.issues || [];
    const critical = issues.filter(i => i.severity === 'critical').length;
    const high = issues.filter(i => i.severity === 'high').length;
    const medium = issues.filter(i => i.severity === 'medium').length;
    const low = issues.filter(i => i.severity === 'low').length;

    const themeColor = this.config.themeColor || 
                      (critical > 0 ? 'FF0000' : high > 0 ? 'FFA500' : '00FF00');

    const card: MessageCard = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: `ODAVL Analysis: ${issues.length} issues found`,
      themeColor,
      title: '🔍 ODAVL Code Quality Report',
      text: critical > 0 ? '⚠️ Critical issues detected!' : high > 0 ? '📊 Issues need attention' : '✅ Analysis complete',
      sections: [
        {
          activityTitle: 'Analysis Results',
          activitySubtitle: new Date().toLocaleString(),
          facts: [
            { name: 'Total Issues', value: issues.length.toString() },
            { name: '🔴 Critical', value: critical.toString() },
            { name: '🟠 High', value: high.toString() },
            { name: '🟡 Medium', value: medium.toString() },
            { name: '🔵 Low', value: low.toString() },
            { name: 'Files Analyzed', value: (result.metrics?.filesAnalyzed || 0).toString() },
            { name: 'Duration', value: this.formatDuration(result.metrics?.duration || 0) },
          ],
        },
      ],
    };

    // Add actions
    if (this.config.includeActions) {
      card.potentialAction = [
        {
          '@type': 'OpenUri',
          name: '📊 View Full Report',
          targets: [{ os: 'default', uri: process.env.BUILD_URL || 'https://github.com' }],
        },
        ...this.config.customActions.map(action => ({
          '@type': 'OpenUri' as const,
          name: action.title,
          targets: [{ os: 'default' as const, uri: action.url }],
        })),
      ];
    }

    return card;
  }

  // --------------------------------------------------------------------------
  // Private Methods - API Communication
  // --------------------------------------------------------------------------

  private async sendMessage(message: TeamsMessage | MessageCard): Promise<void> {
    if (!this.config.webhookUrl) {
      throw new Error('Microsoft Teams webhook URL required');
    }

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Teams webhook failed: ${response.status} ${response.statusText}\n${text}`);
      }

      const result = await response.text();
      if (result !== '1') {
        console.warn(`Teams webhook returned unexpected response: ${result}`);
      }
    } catch (error) {
      console.error('✗ Failed to send Teams message:', error);
      throw error;
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

    return (
      critical > (notifyThreshold.critical || 0) ||
      high > (notifyThreshold.high || 0) ||
      medium > (notifyThreshold.medium || 0)
    );
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
// Helper Functions
// ============================================================================

/**
 * Create Microsoft Teams integration instance
 */
export function createTeamsIntegration(config: TeamsConfig): MicrosoftTeamsIntegration {
  return new MicrosoftTeamsIntegration(config);
}

/**
 * Send quick notification to Microsoft Teams
 */
export async function sendTeamsNotification(
  result: AnalysisResult,
  config: TeamsConfig
): Promise<void> {
  const integration = createTeamsIntegration(config);
  await integration.sendNotification(result);
}

/**
 * Auto-detect and send to Teams
 */
export async function notifyTeams(
  result: AnalysisResult,
  webhookUrl?: string
): Promise<void> {
  const url = webhookUrl || process.env.TEAMS_WEBHOOK_URL;
  
  if (!url) {
    throw new Error('Microsoft Teams webhook URL required (TEAMS_WEBHOOK_URL env var or parameter)');
  }

  await sendTeamsNotification(result, { webhookUrl: url });
}
