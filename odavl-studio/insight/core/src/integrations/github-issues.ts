/**
 * @fileoverview GitHub Issues Integration
 * Provides seamless integration with GitHub Issues for issue tracking
 * Automatically creates and updates GitHub issues from analysis results
 * 
 * Features:
 * - Create issues from analysis results
 * - Update existing issues
 * - Auto-labeling by severity
 * - Assignee management
 * - Milestone linking
 * - Issue templates
 * - Duplicate detection
 * - Batch operations
 * 
 * @module integrations/github-issues
 */

import type { AnalysisResult, Issue } from '../types';
import { Octokit } from '@octokit/rest';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * GitHub Issues configuration
 */
export interface GitHubIssuesConfig {
  /** GitHub personal access token */
  token: string;
  
  /** Repository owner */
  owner: string;
  
  /** Repository name */
  repo: string;
  
  /** Auto-create issues for severity levels */
  createFor?: ('critical' | 'high' | 'medium' | 'low')[];
  
  /** Default assignees (GitHub usernames) */
  assignees?: string[];
  
  /** Labels to add */
  labels?: string[];
  
  /** Milestone number */
  milestone?: number;
  
  /** Issue title template */
  titleTemplate?: string;
  
  /** Issue body template */
  bodyTemplate?: string;
  
  /** Update existing issues */
  updateExisting?: boolean;
  
  /** Close resolved issues */
  closeResolved?: boolean;
  
  /** Batch size for bulk operations */
  batchSize?: number;
  
  /** Add severity labels automatically */
  autoLabel?: boolean;
  
  /** Label prefix for severity */
  labelPrefix?: string;
}

/**
 * GitHub issue creation request
 */
export interface GitHubIssueRequest {
  title: string;
  body: string;
  assignees?: string[];
  labels?: string[];
  milestone?: number;
}

/**
 * GitHub issue response
 */
export interface GitHubIssueResponse {
  id: number;
  number: number;
  html_url: string;
  title: string;
  state: string;
}

// ============================================================================
// GitHub Issues Integration Class
// ============================================================================

/**
 * GitHub Issues integration for issue tracking
 */
export class GitHubIssuesIntegration {
  private config: Required<GitHubIssuesConfig>;
  private octokit: Octokit;

  constructor(config: GitHubIssuesConfig) {
    this.config = {
      token: config.token,
      owner: config.owner,
      repo: config.repo,
      createFor: config.createFor || ['critical', 'high'],
      assignees: config.assignees || [],
      labels: config.labels || ['odavl', 'code-quality'],
      milestone: config.milestone || 0,
      titleTemplate: config.titleTemplate || '{{emoji}} {{message}} - {{file}}:{{line}}',
      bodyTemplate: config.bodyTemplate || '',
      updateExisting: config.updateExisting ?? true,
      closeResolved: config.closeResolved ?? true,
      batchSize: config.batchSize || 30,
      autoLabel: config.autoLabel ?? true,
      labelPrefix: config.labelPrefix || 'severity:',
    };

    // Initialize Octokit
    this.octokit = new Octokit({ auth: this.config.token });
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Create GitHub issues from analysis results
   */
  async createIssuesFromAnalysis(result: AnalysisResult): Promise<GitHubIssueResponse[]> {
    console.log('📤 Creating GitHub issues from analysis...');

    const issues = result.issues || [];
    const eligibleIssues = issues.filter(issue =>
      this.config.createFor.includes(issue.severity as 'critical' | 'high' | 'medium' | 'low')
    );

    if (eligibleIssues.length === 0) {
      console.log('⊘ No issues meet severity threshold for GitHub Issues creation');
      return [];
    }

    console.log(`📋 Processing ${eligibleIssues.length} issue(s)...`);

    // Find existing issues if enabled
    let existingIssues: Map<string, GitHubIssueResponse> = new Map();
    if (this.config.updateExisting) {
      existingIssues = await this.findExistingIssues();
    }

    // Create or update issues in batches
    const createdIssues: GitHubIssueResponse[] = [];
    const batches = this.batchArray(eligibleIssues, this.config.batchSize);

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(async issue => {
          const fingerprint = this.getIssueFingerprint(issue);
          const existing = existingIssues.get(fingerprint);

          if (existing) {
            return await this.updateIssue(existing.number, issue);
          } else {
            return await this.createIssue(issue);
          }
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          createdIssues.push(result.value);
        } else if (result.status === 'rejected') {
          console.error('✗ Failed to create/update issue:', result.reason);
        }
      }

      // Rate limiting: wait between batches
      if (batches.length > 1) {
        await this.sleep(1000);
      }
    }

    console.log(`✅ Created/updated ${createdIssues.length} GitHub issue(s)`);

    // Close resolved issues if enabled
    if (this.config.closeResolved) {
      await this.closeResolvedIssues(eligibleIssues, existingIssues);
    }

    return createdIssues;
  }

  /**
   * Create a single GitHub issue
   */
  async createIssue(issue: Issue): Promise<GitHubIssueResponse> {
    const title = this.buildTitle(issue);
    const body = this.buildBody(issue);
    const labels = this.buildLabels(issue);

    const request: GitHubIssueRequest = {
      title,
      body,
      labels,
      assignees: this.config.assignees,
    };

    if (this.config.milestone > 0) {
      request.milestone = this.config.milestone;
    }

    const response = await this.octokit.issues.create({
      owner: this.config.owner,
      repo: this.config.repo,
      ...request,
    });

    return response.data as GitHubIssueResponse;
  }

  /**
   * Update an existing GitHub issue
   */
  async updateIssue(issueNumber: number, issue: Issue): Promise<GitHubIssueResponse> {
    const body = this.buildBody(issue);
    const labels = this.buildLabels(issue);

    const response = await this.octokit.issues.update({
      owner: this.config.owner,
      repo: this.config.repo,
      issue_number: issueNumber,
      body,
      labels,
      state: 'open', // Reopen if closed
    });

    // Add comment about update
    await this.octokit.issues.createComment({
      owner: this.config.owner,
      repo: this.config.repo,
      issue_number: issueNumber,
      body: `🔄 **Issue Updated**\n\nThis issue was automatically updated by ODAVL.\n\n**Analysis Date:** ${new Date().toLocaleString()}`,
    });

    return response.data as GitHubIssueResponse;
  }

  /**
   * Close issues that are no longer present in analysis
   */
  async closeResolvedIssues(
    currentIssues: Issue[],
    existingIssues: Map<string, GitHubIssueResponse>
  ): Promise<void> {
    const currentFingerprints = new Set(currentIssues.map(i => this.getIssueFingerprint(i)));
    const toClose: number[] = [];

    for (const [fingerprint, ghIssue] of existingIssues) {
      if (!currentFingerprints.has(fingerprint) && ghIssue.state === 'open') {
        toClose.push(ghIssue.number);
      }
    }

    if (toClose.length === 0) return;

    console.log(`🔒 Closing ${toClose.length} resolved issue(s)...`);

    await Promise.allSettled(
      toClose.map(async number => {
        await this.octokit.issues.update({
          owner: this.config.owner,
          repo: this.config.repo,
          issue_number: number,
          state: 'closed',
        });

        await this.octokit.issues.createComment({
          owner: this.config.owner,
          repo: this.config.repo,
          issue_number: number,
          body: `✅ **Issue Resolved**\n\nThis issue is no longer detected in the latest analysis.\n\n**Resolved Date:** ${new Date().toLocaleString()}`,
        });
      })
    );

    console.log('✅ Resolved issues closed');
  }

  /**
   * Add labels to issues
   */
  async addLabelsToIssues(issueNumbers: number[], labels: string[]): Promise<void> {
    console.log(`🏷️ Adding labels to ${issueNumbers.length} issue(s)...`);

    await Promise.allSettled(
      issueNumbers.map(number =>
        this.octokit.issues.addLabels({
          owner: this.config.owner,
          repo: this.config.repo,
          issue_number: number,
          labels,
        })
      )
    );

    console.log('✅ Labels added');
  }

  /**
   * Assign issues to users
   */
  async assignIssues(issueNumbers: number[], assignees: string[]): Promise<void> {
    console.log(`👤 Assigning ${issueNumbers.length} issue(s)...`);

    await Promise.allSettled(
      issueNumbers.map(number =>
        this.octokit.issues.addAssignees({
          owner: this.config.owner,
          repo: this.config.repo,
          issue_number: number,
          assignees,
        })
      )
    );

    console.log('✅ Issues assigned');
  }

  /**
   * Add milestone to issues
   */
  async addMilestone(issueNumbers: number[], milestoneNumber: number): Promise<void> {
    console.log(`🎯 Adding milestone to ${issueNumbers.length} issue(s)...`);

    await Promise.allSettled(
      issueNumbers.map(number =>
        this.octokit.issues.update({
          owner: this.config.owner,
          repo: this.config.repo,
          issue_number: number,
          milestone: milestoneNumber,
        })
      )
    );

    console.log('✅ Milestone added');
  }

  /**
   * Add comment to issues
   */
  async addCommentToIssues(issueNumbers: number[], comment: string): Promise<void> {
    console.log(`💬 Adding comment to ${issueNumbers.length} issue(s)...`);

    await Promise.allSettled(
      issueNumbers.map(number =>
        this.octokit.issues.createComment({
          owner: this.config.owner,
          repo: this.config.repo,
          issue_number: number,
          body: comment,
        })
      )
    );

    console.log('✅ Comments added');
  }

  // --------------------------------------------------------------------------
  // Private Methods - Issue Management
  // --------------------------------------------------------------------------

  private async findExistingIssues(): Promise<Map<string, GitHubIssueResponse>> {
    const map = new Map<string, GitHubIssueResponse>();

    try {
      // Search for open issues with ODAVL label
      const response = await this.octokit.issues.listForRepo({
        owner: this.config.owner,
        repo: this.config.repo,
        state: 'open',
        labels: 'odavl',
        per_page: 100,
      });

      for (const issue of response.data) {
        // Extract fingerprint from issue title or body
        const fingerprint = this.extractFingerprint(issue.title, issue.body || '');
        if (fingerprint) {
          map.set(fingerprint, issue as GitHubIssueResponse);
        }
      }

      console.log(`📊 Found ${map.size} existing ODAVL issue(s)`);
    } catch (error) {
      console.error('✗ Failed to fetch existing issues:', error);
    }

    return map;
  }

  private extractFingerprint(title: string, body: string): string | null {
    // Try to extract from title: "file.ts:123"
    const titleMatch = title.match(/(\S+):(\d+)/);
    if (titleMatch) {
      return `${titleMatch[1]}:${titleMatch[2]}`;
    }

    // Try to extract from body
    const bodyMatch = body.match(/\*\*File:\*\*\s+`(.+)`[\s\S]*?\*\*Line:\*\*\s+`(\d+)`/);
    if (bodyMatch) {
      return `${bodyMatch[1]}:${bodyMatch[2]}`;
    }

    return null;
  }

  private getIssueFingerprint(issue: Issue): string {
    return `${issue.file}:${issue.line}`;
  }

  // --------------------------------------------------------------------------
  // Private Methods - Content Building
  // --------------------------------------------------------------------------

  private buildTitle(issue: Issue): string {
    const emoji = this.getSeverityEmoji(issue.severity);
    const template = this.config.titleTemplate;

    return template
      .replace('{{emoji}}', emoji)
      .replace('{{message}}', issue.message.slice(0, 80))
      .replace('{{file}}', issue.file)
      .replace('{{line}}', (issue.line ?? 0).toString())
      .replace('{{severity}}', issue.severity)
      .replace('{{category}}', issue.category ?? 'unknown');
  }

  private buildBody(issue: Issue): string {
    if (this.config.bodyTemplate) {
      return this.renderTemplate(this.config.bodyTemplate, issue);
    }

    // Default body format
    let body = `## 🔍 Issue Details

**File:** \`${issue.file}\`  
**Line:** \`${issue.line}\`  
**Column:** \`${issue.column || 'N/A'}\`  
**Severity:** \`${issue.severity}\`  
**Category:** \`${issue.category}\`  
**Rule:** \`${issue.rule || 'N/A'}\`

## 📝 Description

${issue.message}

## 📍 Location

\`\`\`
${issue.file}:${issue.line}:${issue.column || 0}
\`\`\`
`;

    // Add code snippet if available
    if (issue.codeSnippet) {
      body += `\n## 📄 Code Snippet

\`\`\`typescript
${issue.codeSnippet}
\`\`\`
`;
    }

    // Add suggestions if available
    if (issue.suggestions && issue.suggestions.length > 0) {
      body += `\n## 💡 Suggested Fix

${issue.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}
`;
    }

    // Add metadata
    body += `\n---

*This issue was automatically created by ODAVL*  
*Analysis Date:* ${new Date().toLocaleString()}  
*Fingerprint:* \`${this.getIssueFingerprint(issue)}\`
`;

    return body;
  }

  private buildLabels(issue: Issue): string[] {
    const labels = [...this.config.labels];

    // Add severity label if auto-labeling enabled
    if (this.config.autoLabel) {
      labels.push(`${this.config.labelPrefix}${issue.severity}`);
    }

    // Add category label
    if (issue.category) {
      labels.push(`category:${issue.category}`);
    }

    return labels;
  }

  private renderTemplate(template: string, issue: Issue): string {
    return template
      .replace(/{{(\w+)}}/g, (_, key) => {
        const value = (issue as unknown as Record<string, unknown>)[key];
        return value !== undefined ? String(value) : '';
      });
  }

  // --------------------------------------------------------------------------
  // Private Methods - Utilities
  // --------------------------------------------------------------------------

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

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create GitHub Issues integration instance
 */
export function createGitHubIssuesIntegration(config: GitHubIssuesConfig): GitHubIssuesIntegration {
  return new GitHubIssuesIntegration(config);
}

/**
 * Quick issue creation from analysis
 */
export async function createGitHubIssuesFromAnalysis(
  result: AnalysisResult,
  config: GitHubIssuesConfig
): Promise<GitHubIssueResponse[]> {
  const integration = createGitHubIssuesIntegration(config);
  return await integration.createIssuesFromAnalysis(result);
}

/**
 * Auto-detect and create GitHub issues
 */
export async function autoCreateGitHubIssues(result: AnalysisResult): Promise<GitHubIssueResponse[]> {
  // Auto-detect from environment
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY; // Format: "owner/repo"

  if (!token || !repo) {
    throw new Error('GitHub configuration required (GITHUB_TOKEN, GITHUB_REPOSITORY)');
  }

  const [owner, repoName] = repo.split('/');

  const config: GitHubIssuesConfig = {
    token,
    owner,
    repo: repoName,
    createFor: ['critical', 'high'],
    labels: ['odavl', 'code-quality', 'automated'],
  };

  return await createGitHubIssuesFromAnalysis(result, config);
}
