/**
 * @fileoverview Jira Integration
 * Provides seamless integration with Atlassian Jira for issue tracking
 * Automatically creates and updates Jira issues from analysis results
 * 
 * Features:
 * - Create issues from analysis results
 * - Update existing issues
 * - Link issues to repositories
 * - Automatic priority mapping
 * - Custom field support
 * - Bulk issue creation
 * - Issue templates
 * - Epic linking
 * 
 * @module integrations/jira
 */

import type { AnalysisResult, Issue } from '../types';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Jira configuration
 */
export interface JiraConfig {
  /** Jira instance URL (e.g., https://company.atlassian.net) */
  baseUrl: string;
  
  /** API authentication (email:token or PAT) */
  auth: {
    email?: string;
    apiToken?: string;
    pat?: string; // Personal Access Token
  };
  
  /** Project key (e.g., PROJ) */
  projectKey: string;
  
  /** Issue type (e.g., Bug, Task, Story) */
  issueType?: string;
  
  /** Auto-create issues for severity levels */
  createFor?: ('critical' | 'high' | 'medium' | 'low')[];
  
  /** Link to epic */
  epicKey?: string;
  
  /** Default assignee (accountId or email) */
  defaultAssignee?: string;
  
  /** Labels to add */
  labels?: string[];
  
  /** Components */
  components?: string[];
  
  /** Custom fields */
  customFields?: Record<string, unknown>;
  
  /** Priority mapping */
  priorityMapping?: {
    critical?: string;
    high?: string;
    medium?: string;
    low?: string;
  };
  
  /** Update existing issues */
  updateExisting?: boolean;
  
  /** Search query for existing issues */
  existingIssueQuery?: string;
  
  /** Bulk creation batch size */
  batchSize?: number;
}

/**
 * Jira issue creation request
 */
export interface JiraIssueRequest {
  fields: {
    project: { key: string };
    summary: string;
    description: string;
    issuetype: { name: string };
    priority?: { name: string };
    assignee?: { accountId?: string; emailAddress?: string };
    labels?: string[];
    components?: Array<{ name: string }>;
    parent?: { key: string }; // For subtasks
    customfield_10014?: string; // Epic Link (example)
    [key: string]: unknown;
  };
}

/**
 * Jira issue response
 */
export interface JiraIssueResponse {
  id: string;
  key: string;
  self: string;
}

/**
 * Jira search response
 */
export interface JiraSearchResponse {
  issues: Array<{
    id: string;
    key: string;
    fields: {
      summary: string;
      status: { name: string };
      [key: string]: unknown;
    };
  }>;
  total: number;
}

/**
 * Jira issue update request
 */
export interface JiraIssueUpdate {
  fields?: Record<string, unknown>;
  update?: Record<string, Array<{ add?: unknown; set?: unknown; remove?: unknown }>>;
}

// ============================================================================
// Jira Integration Class
// ============================================================================

/**
 * Jira integration for issue tracking
 */
export class JiraIntegration {
  private config: Required<JiraConfig>;
  private authHeader: string;

  constructor(config: JiraConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ''), // Remove trailing slash
      auth: config.auth,
      projectKey: config.projectKey,
      issueType: config.issueType || 'Bug',
      createFor: config.createFor || ['critical', 'high'],
      epicKey: config.epicKey || '',
      defaultAssignee: config.defaultAssignee || '',
      labels: config.labels || ['odavl', 'code-quality'],
      components: config.components || [],
      customFields: config.customFields || {},
      priorityMapping: config.priorityMapping || {
        critical: 'Highest',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
      },
      updateExisting: config.updateExisting ?? false,
      existingIssueQuery: config.existingIssueQuery || '',
      batchSize: config.batchSize || 50,
    };

    // Setup authentication
    this.authHeader = this.buildAuthHeader();
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Create Jira issues from analysis results
   */
  async createIssuesFromAnalysis(result: AnalysisResult): Promise<JiraIssueResponse[]> {
    console.log('📤 Creating Jira issues from analysis...');

    const issues = result.issues || [];
    const eligibleIssues = issues.filter(issue =>
      this.config.createFor.includes(issue.severity as 'critical' | 'high' | 'medium' | 'low')
    );

    if (eligibleIssues.length === 0) {
      console.log('⊘ No issues meet severity threshold for Jira creation');
      return [];
    }

    console.log(`📋 Creating ${eligibleIssues.length} Jira issue(s)...`);

    // Check for existing issues if enabled
    let existingIssues: Map<string, string> = new Map();
    if (this.config.updateExisting && this.config.existingIssueQuery) {
      existingIssues = await this.findExistingIssues(eligibleIssues);
    }

    // Create or update issues in batches
    const createdIssues: JiraIssueResponse[] = [];
    const batches = this.batchArray(eligibleIssues, this.config.batchSize);

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(issue => {
          const existingKey = existingIssues.get(this.getIssueFingerprint(issue));
          return existingKey
            ? this.updateIssue(existingKey, issue)
            : this.createIssue(issue);
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          createdIssues.push(result.value);
        } else if (result.status === 'rejected') {
          console.error('✗ Failed to create/update issue:', result.reason);
        }
      }
    }

    console.log(`✅ Created/updated ${createdIssues.length} Jira issue(s)`);
    return createdIssues;
  }

  /**
   * Create a single Jira issue
   */
  async createIssue(issue: Issue): Promise<JiraIssueResponse> {
    const request: JiraIssueRequest = {
      fields: {
        project: { key: this.config.projectKey },
        summary: this.buildSummary(issue),
        description: this.buildDescription(issue),
        issuetype: { name: this.config.issueType },
        priority: { name: this.getPriority(issue.severity) },
        labels: [...this.config.labels, issue.severity, issue.category].filter(Boolean) as string[],
        ...this.config.customFields,
      },
    };

    // Add assignee if configured
    if (this.config.defaultAssignee) {
      request.fields.assignee = this.config.defaultAssignee.includes('@')
        ? { emailAddress: this.config.defaultAssignee }
        : { accountId: this.config.defaultAssignee };
    }

    // Add components if configured
    if (this.config.components.length > 0) {
      request.fields.components = this.config.components.map(name => ({ name }));
    }

    // Add epic link if configured
    if (this.config.epicKey) {
      request.fields.customfield_10014 = this.config.epicKey; // Standard Epic Link field
    }

    return await this.apiRequest<JiraIssueResponse>('POST', '/rest/api/3/issue', request);
  }

  /**
   * Update an existing Jira issue
   */
  async updateIssue(issueKey: string, issue: Issue): Promise<JiraIssueResponse> {
    const update: JiraIssueUpdate = {
      fields: {
        description: this.buildDescription(issue),
        priority: { name: this.getPriority(issue.severity) },
      },
      update: {
        labels: [{ add: issue.severity }, { add: 'odavl-updated' }],
      },
    };

    await this.apiRequest('PUT', `/rest/api/3/issue/${issueKey}`, update);
    
    // Return issue info
    return { id: '', key: issueKey, self: '' };
  }

  /**
   * Link issues to an epic
   */
  async linkToEpic(issueKeys: string[], epicKey: string): Promise<void> {
    console.log(`🔗 Linking ${issueKeys.length} issues to epic ${epicKey}...`);

    await Promise.allSettled(
      issueKeys.map(key =>
        this.apiRequest('PUT', `/rest/api/3/issue/${key}`, {
          fields: { customfield_10014: epicKey },
        })
      )
    );

    console.log('✅ Issues linked to epic');
  }

  /**
   * Add comment to issues
   */
  async addCommentToIssues(issueKeys: string[], comment: string): Promise<void> {
    console.log(`💬 Adding comment to ${issueKeys.length} issues...`);

    await Promise.allSettled(
      issueKeys.map(key =>
        this.apiRequest('POST', `/rest/api/3/issue/${key}/comment`, {
          body: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: comment }],
              },
            ],
          },
        })
      )
    );

    console.log('✅ Comments added');
  }

  /**
   * Transition issues (e.g., move to "In Progress")
   */
  async transitionIssues(issueKeys: string[], transitionName: string): Promise<void> {
    console.log(`🔄 Transitioning ${issueKeys.length} issues to "${transitionName}"...`);

    for (const key of issueKeys) {
      // Get available transitions
      const transitions = await this.apiRequest<{ transitions: Array<{ id: string; name: string }> }>(
        'GET',
        `/rest/api/3/issue/${key}/transitions`
      );

      const transition = transitions.transitions.find(t => t.name === transitionName);
      if (!transition) {
        console.warn(`⚠️ Transition "${transitionName}" not found for ${key}`);
        continue;
      }

      // Execute transition
      await this.apiRequest('POST', `/rest/api/3/issue/${key}/transitions`, {
        transition: { id: transition.id },
      });
    }

    console.log('✅ Issues transitioned');
  }

  // --------------------------------------------------------------------------
  // Private Methods - Issue Management
  // --------------------------------------------------------------------------

  private async findExistingIssues(issues: Issue[]): Promise<Map<string, string>> {
    const fingerprints = issues.map(i => this.getIssueFingerprint(i));
    const query = this.config.existingIssueQuery || 
                  `project = ${this.config.projectKey} AND labels IN (odavl) AND status != Done`;

    const result = await this.apiRequest<JiraSearchResponse>(
      'GET',
      `/rest/api/3/search?jql=${encodeURIComponent(query)}&maxResults=1000`
    );

    const map = new Map<string, string>();
    for (const issue of result.issues) {
      const summary = issue.fields.summary;
      const fingerprint = fingerprints.find(fp => summary.includes(fp));
      if (fingerprint) {
        map.set(fingerprint, issue.key);
      }
    }

    return map;
  }

  private getIssueFingerprint(issue: Issue): string {
    return `${issue.file}:${issue.line}:${issue.message.slice(0, 50)}`;
  }

  // --------------------------------------------------------------------------
  // Private Methods - Content Building
  // --------------------------------------------------------------------------

  private buildSummary(issue: Issue): string {
    const emoji = this.getSeverityEmoji(issue.severity);
    return `${emoji} ${issue.message.slice(0, 100)} - ${issue.file}:${issue.line}`;
  }

  private buildDescription(issue: Issue): string {
    // Jira uses Atlassian Document Format (ADF) for rich text
    return JSON.stringify({
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Issue Details' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: issue.message }],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Location' }],
        },
        {
          type: 'codeBlock',
          attrs: { language: 'text' },
          content: [{ type: 'text', text: `File: ${issue.file}\nLine: ${issue.line}\nColumn: ${issue.column || 'N/A'}` }],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Metadata' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: `Severity: ${issue.severity}` }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: `Category: ${issue.category}` }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: `Rule: ${issue.rule || 'N/A'}` }],
                },
              ],
            },
          ],
        },
        ...(issue.suggestions && issue.suggestions.length > 0
          ? [
              {
                type: 'heading',
                attrs: { level: 3 },
                content: [{ type: 'text', text: 'Suggested Fix' }],
              },
              {
                type: 'codeBlock',
                attrs: { language: 'text' },
                content: [{ type: 'text', text: issue.suggestions.join('\n') }],
              },
            ]
          : []),
      ],
    });
  }

  // --------------------------------------------------------------------------
  // Private Methods - API Communication
  // --------------------------------------------------------------------------

  private async apiRequest<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Jira API error: ${response.status} ${response.statusText}\n${text}`);
      }

      // Some endpoints return no content (204)
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json() as T;
    } catch (error) {
      console.error(`✗ Jira API request failed (${method} ${endpoint}):`, error);
      throw error;
    }
  }

  private buildAuthHeader(): string {
    const { auth } = this.config;

    // Personal Access Token (PAT)
    if (auth.pat) {
      return `Bearer ${auth.pat}`;
    }

    // Basic Auth (email + API token)
    if (auth.email && auth.apiToken) {
      const credentials = Buffer.from(`${auth.email}:${auth.apiToken}`).toString('base64');
      return `Basic ${credentials}`;
    }

    throw new Error('Jira authentication required (email+apiToken or PAT)');
  }

  // --------------------------------------------------------------------------
  // Private Methods - Utilities
  // --------------------------------------------------------------------------

  private getPriority(severity: string): string {
    return this.config.priorityMapping[severity as keyof typeof this.config.priorityMapping] || 'Medium';
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

  private batchArray<T>(array: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      batches.push(array.slice(i, i + size));
    }
    return batches;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create Jira integration instance
 */
export function createJiraIntegration(config: JiraConfig): JiraIntegration {
  return new JiraIntegration(config);
}

/**
 * Quick issue creation from analysis
 */
export async function createJiraIssuesFromAnalysis(
  result: AnalysisResult,
  config: JiraConfig
): Promise<JiraIssueResponse[]> {
  const integration = createJiraIntegration(config);
  return await integration.createIssuesFromAnalysis(result);
}

/**
 * Auto-detect and create Jira issues
 */
export async function autoCreateJiraIssues(result: AnalysisResult): Promise<JiraIssueResponse[]> {
  const config: JiraConfig = {
    baseUrl: process.env.JIRA_BASE_URL!,
    auth: {
      email: process.env.JIRA_EMAIL,
      apiToken: process.env.JIRA_API_TOKEN,
      pat: process.env.JIRA_PAT,
    },
    projectKey: process.env.JIRA_PROJECT_KEY!,
    issueType: process.env.JIRA_ISSUE_TYPE || 'Bug',
  };

  if (!config.baseUrl || !config.projectKey) {
    throw new Error('Jira configuration required (JIRA_BASE_URL, JIRA_PROJECT_KEY)');
  }

  return await createJiraIssuesFromAnalysis(result, config);
}
