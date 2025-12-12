/**
 * @fileoverview Azure Boards Integration
 * Provides seamless integration with Azure DevOps Boards for work item tracking
 * Automatically creates and updates work items from analysis results
 * 
 * Features:
 * - Create work items from analysis results
 * - Update existing work items
 * - Auto-tagging by severity
 * - Assignee management
 * - Area/iteration paths
 * - Work item templates
 * - Link to repositories
 * - Batch operations
 * 
 * @module integrations/azure-boards
 */

import type { AnalysisResult, Issue } from '../types';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Azure Boards configuration
 */
export interface AzureBoardsConfig {
  /** Azure DevOps organization URL */
  organizationUrl: string;
  
  /** Personal Access Token (PAT) */
  pat: string;
  
  /** Project name */
  project: string;
  
  /** Work item type (Bug, Task, Issue, etc.) */
  workItemType?: string;
  
  /** Auto-create work items for severity levels */
  createFor?: ('critical' | 'high' | 'medium' | 'low')[];
  
  /** Area path */
  areaPath?: string;
  
  /** Iteration path */
  iterationPath?: string;
  
  /** Default assignee (email or display name) */
  assignedTo?: string;
  
  /** Tags to add */
  tags?: string[];
  
  /** Priority mapping */
  priorityMapping?: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
  
  /** Update existing work items */
  updateExisting?: boolean;
  
  /** Close resolved work items */
  closeResolved?: boolean;
  
  /** Batch size for bulk operations */
  batchSize?: number;
  
  /** Link to repository */
  repositoryUrl?: string;
  
  /** Custom fields */
  customFields?: Record<string, unknown>;
}

/**
 * Azure DevOps work item creation request
 */
export interface WorkItemRequest {
  op: 'add' | 'replace' | 'remove';
  path: string;
  value: unknown;
}

/**
 * Azure DevOps work item response
 */
export interface WorkItemResponse {
  id: number;
  rev: number;
  url: string;
  fields: {
    'System.Id': number;
    'System.Title': string;
    'System.State': string;
    'System.WorkItemType': string;
    [key: string]: unknown;
  };
  _links: {
    html: { href: string };
  };
}

/**
 * Work item query result
 */
export interface WorkItemQueryResult {
  queryType: string;
  queryResultType: string;
  workItems: Array<{ id: number; url: string }>;
}

// ============================================================================
// Azure Boards Integration Class
// ============================================================================

/**
 * Azure Boards integration for work item tracking
 */
export class AzureBoardsIntegration {
  private config: Required<AzureBoardsConfig>;
  private authHeader: string;
  private apiVersion = '7.1-preview.3';

  constructor(config: AzureBoardsConfig) {
    this.config = {
      organizationUrl: config.organizationUrl.replace(/\/$/, ''),
      pat: config.pat,
      project: config.project,
      workItemType: config.workItemType || 'Bug',
      createFor: config.createFor || ['critical', 'high'],
      areaPath: config.areaPath || '',
      iterationPath: config.iterationPath || '',
      assignedTo: config.assignedTo || '',
      tags: config.tags || ['ODAVL', 'Code-Quality'],
      priorityMapping: config.priorityMapping || {
        critical: 1,
        high: 2,
        medium: 3,
        low: 4,
      },
      updateExisting: config.updateExisting ?? true,
      closeResolved: config.closeResolved ?? true,
      batchSize: config.batchSize || 50,
      repositoryUrl: config.repositoryUrl || '',
      customFields: config.customFields || {},
    };

    // Setup authentication (Basic Auth with PAT)
    this.authHeader = `Basic ${Buffer.from(`:${this.config.pat}`).toString('base64')}`;
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Create Azure Boards work items from analysis results
   */
  async createWorkItemsFromAnalysis(result: AnalysisResult): Promise<WorkItemResponse[]> {
    console.log('📤 Creating Azure Boards work items from analysis...');

    const issues = result.issues || [];
    const eligibleIssues = issues.filter(issue =>
      this.config.createFor.includes(issue.severity as 'critical' | 'high' | 'medium' | 'low')
    );

    if (eligibleIssues.length === 0) {
      console.log('⊘ No issues meet severity threshold for work item creation');
      return [];
    }

    console.log(`📋 Processing ${eligibleIssues.length} issue(s)...`);

    // Find existing work items if enabled
    let existingWorkItems: Map<string, WorkItemResponse> = new Map();
    if (this.config.updateExisting) {
      existingWorkItems = await this.findExistingWorkItems();
    }

    // Create or update work items in batches
    const createdWorkItems: WorkItemResponse[] = [];
    const batches = this.batchArray(eligibleIssues, this.config.batchSize);

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(async (issue: Issue) => {
          const fingerprint = this.getIssueFingerprint(issue);
          const existing = existingWorkItems.get(fingerprint);

          if (existing) {
            return await this.updateWorkItem(existing.id, issue);
          } else {
            return await this.createWorkItem(issue);
          }
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          createdWorkItems.push(result.value as WorkItemResponse);
        } else if (result.status === 'rejected') {
          console.error('✗ Failed to create/update work item:', result.reason);
        }
      }
    }

    console.log(`✅ Created/updated ${createdWorkItems.length} work item(s)`);

    // Close resolved work items if enabled
    if (this.config.closeResolved) {
      await this.closeResolvedWorkItems(eligibleIssues, existingWorkItems);
    }

    return createdWorkItems;
  }

  /**
   * Create a single work item
   */
  async createWorkItem(issue: Issue): Promise<WorkItemResponse> {
    const operations: WorkItemRequest[] = [
      { op: 'add', path: '/fields/System.Title', value: this.buildTitle(issue) },
      { op: 'add', path: '/fields/System.Description', value: this.buildDescription(issue) },
      { op: 'add', path: '/fields/Microsoft.VSTS.Common.Priority', value: this.getPriority(issue.severity) },
      { op: 'add', path: '/fields/System.Tags', value: this.buildTags(issue).join('; ') },
    ];

    // Add area path if configured
    if (this.config.areaPath) {
      operations.push({ op: 'add', path: '/fields/System.AreaPath', value: this.config.areaPath });
    }

    // Add iteration path if configured
    if (this.config.iterationPath) {
      operations.push({ op: 'add', path: '/fields/System.IterationPath', value: this.config.iterationPath });
    }

    // Add assignee if configured
    if (this.config.assignedTo) {
      operations.push({ op: 'add', path: '/fields/System.AssignedTo', value: this.config.assignedTo });
    }

    // Add repro steps (for Bug work items)
    if (this.config.workItemType === 'Bug') {
      operations.push({ op: 'add', path: '/fields/Microsoft.VSTS.TCM.ReproSteps', value: this.buildReproSteps(issue) });
    }

    // Add custom fields
    for (const [field, value] of Object.entries(this.config.customFields)) {
      operations.push({ op: 'add', path: `/fields/${field}`, value });
    }

    // Add repository link if configured
    if (this.config.repositoryUrl) {
      operations.push({
        op: 'add',
        path: '/relations/-',
        value: {
          rel: 'Hyperlink',
          url: `${this.config.repositoryUrl}/blob/main/${issue.file}#L${issue.line}`,
          attributes: { comment: 'Source code location' },
        },
      });
    }

    return await this.apiRequest<WorkItemResponse>(
      'POST',
      `/${this.config.project}/_apis/wit/workitems/$${this.config.workItemType}`,
      operations
    );
  }

  /**
   * Update an existing work item
   */
  async updateWorkItem(workItemId: number, issue: Issue): Promise<WorkItemResponse> {
    const operations: WorkItemRequest[] = [
      { op: 'replace', path: '/fields/System.Description', value: this.buildDescription(issue) },
      { op: 'replace', path: '/fields/Microsoft.VSTS.Common.Priority', value: this.getPriority(issue.severity) },
      { op: 'replace', path: '/fields/System.State', value: 'Active' }, // Reactivate if closed
    ];

    // Update repro steps for Bug work items
    if (this.config.workItemType === 'Bug') {
      operations.push({ op: 'replace', path: '/fields/Microsoft.VSTS.TCM.ReproSteps', value: this.buildReproSteps(issue) });
    }

    return await this.apiRequest<WorkItemResponse>(
      'PATCH',
      `/${this.config.project}/_apis/wit/workitems/${workItemId}`,
      operations
    );
  }

  /**
   * Close work items that are no longer present in analysis
   */
  async closeResolvedWorkItems(
    currentIssues: Issue[],
    existingWorkItems: Map<string, WorkItemResponse>
  ): Promise<void> {
    const currentFingerprints = new Set(currentIssues.map(i => this.getIssueFingerprint(i)));
    const toClose: number[] = [];

    for (const [fingerprint, workItem] of existingWorkItems) {
      const state = workItem.fields['System.State'] as string;
      if (!currentFingerprints.has(fingerprint) && state !== 'Closed') {
        toClose.push(workItem.id);
      }
    }

    if (toClose.length === 0) return;

    console.log(`🔒 Closing ${toClose.length} resolved work item(s)...`);

    await Promise.allSettled(
      toClose.map(async id => {
        const operations: WorkItemRequest[] = [
          { op: 'replace', path: '/fields/System.State', value: 'Closed' },
          { op: 'add', path: '/fields/System.History', value: `✅ Issue resolved - no longer detected in latest ODAVL analysis (${new Date().toLocaleString()})` },
        ];

        await this.apiRequest('PATCH', `/${this.config.project}/_apis/wit/workitems/${id}`, operations);
      })
    );

    console.log('✅ Resolved work items closed');
  }

  /**
   * Add tags to work items
   */
  async addTagsToWorkItems(workItemIds: number[], tags: string[]): Promise<void> {
    console.log(`🏷️ Adding tags to ${workItemIds.length} work item(s)...`);

    await Promise.allSettled(
      workItemIds.map(async id => {
        // Get current tags
        const workItem = await this.apiRequest<WorkItemResponse>(
          'GET',
          `/${this.config.project}/_apis/wit/workitems/${id}`
        );

        const currentTags = (workItem.fields['System.Tags'] as string)?.split('; ') || [];
        const newTags = [...new Set([...currentTags, ...tags])].join('; ');

        await this.apiRequest('PATCH', `/${this.config.project}/_apis/wit/workitems/${id}`, [
          { op: 'replace', path: '/fields/System.Tags', value: newTags },
        ]);
      })
    );

    console.log('✅ Tags added');
  }

  /**
   * Assign work items to user
   */
  async assignWorkItems(workItemIds: number[], assignedTo: string): Promise<void> {
    console.log(`👤 Assigning ${workItemIds.length} work item(s)...`);

    await Promise.allSettled(
      workItemIds.map(id =>
        this.apiRequest('PATCH', `/${this.config.project}/_apis/wit/workitems/${id}`, [
          { op: 'replace', path: '/fields/System.AssignedTo', value: assignedTo },
        ])
      )
    );

    console.log('✅ Work items assigned');
  }

  /**
   * Add comment to work items
   */
  async addCommentToWorkItems(workItemIds: number[], comment: string): Promise<void> {
    console.log(`💬 Adding comment to ${workItemIds.length} work item(s)...`);

    await Promise.allSettled(
      workItemIds.map(id =>
        this.apiRequest('PATCH', `/${this.config.project}/_apis/wit/workitems/${id}`, [
          { op: 'add', path: '/fields/System.History', value: comment },
        ])
      )
    );

    console.log('✅ Comments added');
  }

  // --------------------------------------------------------------------------
  // Private Methods - Work Item Management
  // --------------------------------------------------------------------------

  private async findExistingWorkItems(): Promise<Map<string, WorkItemResponse>> {
    const map = new Map<string, WorkItemResponse>();

    try {
      // Query for open work items with ODAVL tag
      const wiql = `
        SELECT [System.Id], [System.Title], [System.State]
        FROM WorkItems
        WHERE [System.TeamProject] = '${this.config.project}'
          AND [System.WorkItemType] = '${this.config.workItemType}'
          AND [System.Tags] CONTAINS 'ODAVL'
          AND [System.State] <> 'Closed'
        ORDER BY [System.CreatedDate] DESC
      `;

      const queryResult = await this.apiRequest<WorkItemQueryResult>(
        'POST',
        `/${this.config.project}/_apis/wit/wiql`,
        { query: wiql }
      );

      if (queryResult.workItems.length === 0) {
        return map;
      }

      // Fetch work item details in batches
      const ids = queryResult.workItems.map(wi => wi.id);
      const idsParam = ids.join(',');

      const workItems = await this.apiRequest<{ value: WorkItemResponse[] }>(
        'GET',
        `/${this.config.project}/_apis/wit/workitems?ids=${idsParam}&$expand=all`
      );

      for (const workItem of workItems.value) {
        const fingerprint = this.extractFingerprint(workItem.fields['System.Title']);
        if (fingerprint) {
          map.set(fingerprint, workItem);
        }
      }

      console.log(`📊 Found ${map.size} existing ODAVL work item(s)`);
    } catch (error) {
      console.error('✗ Failed to fetch existing work items:', error);
    }

    return map;
  }

  private extractFingerprint(title: string): string | null {
    const match = title.match(/(\S+):(\d+)/);
    return match ? `${match[1]}:${match[2]}` : null;
  }

  private getIssueFingerprint(issue: Issue): string {
    return `${issue.file}:${issue.line}`;
  }

  // --------------------------------------------------------------------------
  // Private Methods - Content Building
  // --------------------------------------------------------------------------

  private buildTitle(issue: Issue): string {
    const emoji = this.getSeverityEmoji(issue.severity);
    return `${emoji} ${issue.message.slice(0, 100)} - ${issue.file}:${issue.line}`;
  }

  private buildDescription(issue: Issue): string {
    return `<div>
<h2>🔍 Issue Details</h2>
<ul>
  <li><strong>File:</strong> <code>${issue.file}</code></li>
  <li><strong>Line:</strong> <code>${issue.line}</code></li>
  <li><strong>Column:</strong> <code>${issue.column || 'N/A'}</code></li>
  <li><strong>Severity:</strong> <code>${issue.severity}</code></li>
  <li><strong>Category:</strong> <code>${issue.category}</code></li>
  <li><strong>Rule:</strong> <code>${issue.rule || 'N/A'}</code></li>
</ul>

<h2>📝 Description</h2>
<p>${this.escapeHtml(issue.message)}</p>

${issue.codeSnippet ? `
<h2>📄 Code Snippet</h2>
<pre><code>${this.escapeHtml(issue.codeSnippet)}</code></pre>
` : ''}

${issue.suggestions && issue.suggestions.length > 0 ? `
<h2>💡 Suggested Fix</h2>
<ol>
  ${issue.suggestions.map(s => `<li>${this.escapeHtml(s)}</li>`).join('\n  ')}
</ol>
` : ''}

<hr/>
<p><em>This work item was automatically created by ODAVL</em><br/>
<em>Analysis Date: ${new Date().toLocaleString()}</em><br/>
<em>Fingerprint: <code>${this.getIssueFingerprint(issue)}</code></em></p>
</div>`;
  }

  private buildReproSteps(issue: Issue): string {
    return `<div>
<ol>
  <li>Open file: <code>${issue.file}</code></li>
  <li>Navigate to line: <code>${issue.line}</code></li>
  <li>Review the following code:
    <pre><code>${this.escapeHtml(issue.codeSnippet || 'N/A')}</code></pre>
  </li>
  <li>Observe: ${this.escapeHtml(issue.message)}</li>
</ol>

<p><strong>Expected:</strong> Code should follow best practices and not trigger ${issue.severity} severity issues.</p>
<p><strong>Actual:</strong> ${this.escapeHtml(issue.message)}</p>
</div>`;
  }

  private buildTags(issue: Issue): string[] {
    return [...this.config.tags, issue.severity, issue.category].filter(Boolean) as string[];
  }

  // --------------------------------------------------------------------------
  // Private Methods - API Communication
  // --------------------------------------------------------------------------

  private async apiRequest<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
    const url = `${this.config.organizationUrl}${endpoint}?api-version=${this.apiVersion}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json-patch+json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Azure DevOps API error: ${response.status} ${response.statusText}\n${text}`);
      }

      return await response.json() as T;
    } catch (error) {
      console.error(`✗ Azure DevOps API request failed (${method} ${endpoint}):`, error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Private Methods - Utilities
  // --------------------------------------------------------------------------

  private getPriority(severity: string): number {
    return this.config.priorityMapping[severity as keyof typeof this.config.priorityMapping] || 3;
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

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
 * Create Azure Boards integration instance
 */
export function createAzureBoardsIntegration(config: AzureBoardsConfig): AzureBoardsIntegration {
  return new AzureBoardsIntegration(config);
}

/**
 * Quick work item creation from analysis
 */
export async function createAzureWorkItemsFromAnalysis(
  result: AnalysisResult,
  config: AzureBoardsConfig
): Promise<WorkItemResponse[]> {
  const integration = createAzureBoardsIntegration(config);
  return await integration.createWorkItemsFromAnalysis(result);
}

/**
 * Auto-detect and create Azure work items
 */
export async function autoCreateAzureWorkItems(result: AnalysisResult): Promise<WorkItemResponse[]> {
  const config: AzureBoardsConfig = {
    organizationUrl: process.env.AZURE_DEVOPS_ORG_URL!,
    pat: process.env.AZURE_DEVOPS_PAT!,
    project: process.env.AZURE_DEVOPS_PROJECT!,
    workItemType: process.env.AZURE_DEVOPS_WORK_ITEM_TYPE || 'Bug',
  };

  if (!config.organizationUrl || !config.pat || !config.project) {
    throw new Error('Azure DevOps configuration required (AZURE_DEVOPS_ORG_URL, AZURE_DEVOPS_PAT, AZURE_DEVOPS_PROJECT)');
  }

  return await createAzureWorkItemsFromAnalysis(result, config);
}
