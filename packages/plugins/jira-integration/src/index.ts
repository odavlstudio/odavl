/**
 * ODAVL Jira Integration Plugin
 * Send detected issues to Jira automatically
 */

import { IntegrationPlugin, type PluginContext, type SendResult } from '@odavl-studio/sdk/plugin';

interface JiraConfig {
  host: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

export class JiraIntegrationPlugin extends IntegrationPlugin {
  private config?: JiraConfig;
  private connected = false;

  async onInit(context: PluginContext): Promise<void> {
    this.logger = context.logger;
    this.config = {
      host: context.config.get('jira.host') || '',
      email: context.config.get('jira.email') || '',
      apiToken: context.config.get('jira.apiToken') || '',
      projectKey: context.config.get('jira.projectKey') || '',
    };
  }

  async connect(config?: Record<string, any>): Promise<boolean> {
    if (config) {
      this.config = config as JiraConfig;
    }

    if (!this.config?.host || !this.config?.email || !this.config?.apiToken) {
      this.logger?.error('Jira config missing: host, email, or apiToken');
      return false;
    }

    try {
      const response = await this.context.http.get(`${this.config.host}/rest/api/3/myself`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.email}:${this.config.apiToken}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      });

      this.connected = response.status === 200;
      this.logger?.info(`Jira connection: ${this.connected ? 'success' : 'failed'}`);
      return this.connected;
    } catch (error) {
      this.logger?.error(`Jira connection failed: ${(error as Error).message}`);
      return false;
    }
  }

  async send(data: any): Promise<SendResult> {
    if (!this.connected) {
      await this.connect();
    }

    if (!this.connected) {
      return { success: false, error: 'Not connected to Jira' };
    }

    try {
      const { issue } = data;
      const jiraIssue = {
        fields: {
          project: { key: this.config!.projectKey },
          summary: issue.message,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: `File: ${issue.file}:${issue.line}` },
                ],
              },
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: `Severity: ${issue.severity}` },
                ],
              },
              issue.suggestion && {
                type: 'paragraph',
                content: [
                  { type: 'text', text: `Suggestion: ${issue.suggestion}` },
                ],
              },
            ].filter(Boolean),
          },
          issuetype: { name: 'Bug' },
          priority: { name: this.mapSeverityToPriority(issue.severity) },
          labels: issue.tags || ['odavl', 'automated'],
        },
      };

      const response = await this.context.http.post(
        `${this.config!.host}/rest/api/3/issue`,
        jiraIssue,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.config!.email}:${this.config!.apiToken}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 201) {
        return {
          success: true,
          message: `Jira issue created: ${response.data.key}`,
          metadata: { issueKey: response.data.key, issueId: response.data.id },
        };
      }

      return { success: false, error: 'Failed to create Jira issue' };
    } catch (error) {
      this.logger?.error(`Failed to send to Jira: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.logger?.info('Jira disconnected');
  }

  private mapSeverityToPriority(severity: string): string {
    const map: Record<string, string> = {
      critical: 'Highest',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    };
    return map[severity] || 'Medium';
  }

  supports(integration: string): boolean {
    return integration === 'jira';
  }

  async onDestroy(): Promise<void> {
    await this.disconnect();
  }

  validate(): boolean {
    return !!(this.config?.host && this.config?.email && this.config?.apiToken);
  }
}

export default JiraIntegrationPlugin;
