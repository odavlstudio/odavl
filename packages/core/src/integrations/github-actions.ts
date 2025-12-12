/**
 * @fileoverview GitHub Actions Integration
 * Provides seamless integration with GitHub Actions CI/CD workflows
 * Automatically runs ODAVL Insight analysis and reports results
 * 
 * Features:
 * - Auto-detect GitHub Actions environment
 * - PR comments with analysis results
 * - Status checks (pass/fail based on thresholds)
 * - Annotations for code issues
 * - Workflow artifacts (JSON reports)
 * - Integration with GitHub Security tab
 * 
 * @module integrations/github-actions
 */

import { Octokit } from '@octokit/rest';
import type { AnalysisResult, Issue } from '../types';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * GitHub Actions configuration
 */
export interface GitHubActionsConfig {
  /** GitHub token (GITHUB_TOKEN) */
  token: string;
  
  /** Repository owner */
  owner: string;
  
  /** Repository name */
  repo: string;
  
  /** Enable PR comments */
  enableComments?: boolean;
  
  /** Enable status checks */
  enableStatusChecks?: boolean;
  
  /** Enable code annotations */
  enableAnnotations?: boolean;
  
  /** Enable workflow artifacts */
  enableArtifacts?: boolean;
  
  /** Fail on error threshold */
  failThreshold?: {
    critical?: number;
    high?: number;
    medium?: number;
  };
  
  /** Comment template */
  commentTemplate?: string;
}

/**
 * GitHub Actions environment variables
 */
export interface GitHubEnv {
  /** Is running in GitHub Actions */
  isGitHubActions: boolean;
  
  /** Workflow name */
  workflow: string;
  
  /** Action name */
  action: string;
  
  /** Actor (user who triggered) */
  actor: string;
  
  /** Event name (push, pull_request, etc.) */
  eventName: string;
  
  /** Event path (JSON file) */
  eventPath: string;
  
  /** Repository (owner/repo) */
  repository: string;
  
  /** SHA commit hash */
  sha: string;
  
  /** Ref (branch/tag) */
  ref: string;
  
  /** PR number (if pull_request event) */
  prNumber?: number;
  
  /** Base ref (target branch for PR) */
  baseRef?: string;
  
  /** Head ref (source branch for PR) */
  headRef?: string;
}

/**
 * GitHub check run annotation
 */
export interface CheckAnnotation {
  path: string;
  start_line: number;
  end_line: number;
  annotation_level: 'notice' | 'warning' | 'failure';
  message: string;
  title?: string;
  raw_details?: string;
}

/**
 * PR comment data
 */
export interface PRComment {
  body: string;
  commit_id?: string;
  path?: string;
  line?: number;
}

// ============================================================================
// GitHub Actions Integration Class
// ============================================================================

/**
 * GitHub Actions integration for automated analysis
 */
export class GitHubActionsIntegration {
  private octokit: Octokit;
  private config: Required<GitHubActionsConfig>;
  private env: GitHubEnv;

  constructor(config: GitHubActionsConfig) {
    this.config = {
      token: config.token,
      owner: config.owner,
      repo: config.repo,
      enableComments: config.enableComments ?? true,
      enableStatusChecks: config.enableStatusChecks ?? true,
      enableAnnotations: config.enableAnnotations ?? true,
      enableArtifacts: config.enableArtifacts ?? true,
      failThreshold: config.failThreshold || { critical: 0, high: 5, medium: 20 },
      commentTemplate: config.commentTemplate || this.getDefaultTemplate(),
    };

    this.octokit = new Octokit({ auth: config.token });
    this.env = this.detectEnvironment();
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Run full GitHub Actions integration
   */
  async run(result: AnalysisResult): Promise<void> {
    console.log('🚀 Running GitHub Actions integration...');

    // 1. Create status check
    if (this.config.enableStatusChecks) {
      await this.createStatusCheck(result);
    }

    // 2. Add code annotations
    if (this.config.enableAnnotations && result.issues) {
      await this.addAnnotations(result.issues);
    }

    // 3. Post PR comment
    if (this.config.enableComments && this.env.prNumber) {
      await this.postPRComment(result);
    }

    // 4. Create workflow artifact
    if (this.config.enableArtifacts) {
      await this.createArtifact(result);
    }

    // 5. Check fail threshold
    this.checkFailThreshold(result);

    console.log('✅ GitHub Actions integration complete');
  }

  /**
   * Create GitHub status check
   */
  async createStatusCheck(result: AnalysisResult): Promise<void> {
    const { owner, repo } = this.config;
    const { sha } = this.env;

    const conclusion = this.determineConclusion(result);
    const summary = this.generateSummary(result);
    const annotations = this.convertToAnnotations(result.issues || []);

    try {
      await this.octokit.checks.create({
        owner,
        repo,
        name: 'ODAVL Insight Analysis',
        head_sha: sha,
        status: 'completed',
        conclusion,
        output: {
          title: `ODAVL Analysis - ${conclusion}`,
          summary,
          annotations: annotations.slice(0, 50), // GitHub limit: 50 annotations per request
        },
      });

      console.log(`✓ Status check created: ${conclusion}`);
    } catch (error) {
      console.error('✗ Failed to create status check:', error);
    }
  }

  /**
   * Add code annotations to files
   */
  async addAnnotations(issues: Issue[]): Promise<void> {
    const annotations = this.convertToAnnotations(issues);
    
    // GitHub allows max 50 annotations per request
    const batches = this.chunkArray(annotations, 50);

    for (const batch of batches) {
      try {
        await this.octokit.checks.create({
          owner: this.config.owner,
          repo: this.config.repo,
          name: 'ODAVL Code Annotations',
          head_sha: this.env.sha,
          status: 'completed',
          conclusion: 'neutral',
          output: {
            title: 'Code Quality Issues',
            summary: `Found ${issues.length} issues`,
            annotations: batch,
          },
        });
      } catch (error) {
        console.error('✗ Failed to add annotations:', error);
      }
    }

    console.log(`✓ Added ${annotations.length} annotations`);
  }

  /**
   * Post PR comment with analysis results
   */
  async postPRComment(result: AnalysisResult): Promise<void> {
    if (!this.env.prNumber) {
      console.log('⊘ Not a PR, skipping comment');
      return;
    }

    const body = this.generatePRComment(result);

    try {
      // Check if comment already exists
      const existingComment = await this.findExistingComment();

      if (existingComment) {
        // Update existing comment
        await this.octokit.issues.updateComment({
          owner: this.config.owner,
          repo: this.config.repo,
          comment_id: existingComment.id,
          body,
        });
        console.log('✓ Updated existing PR comment');
      } else {
        // Create new comment
        await this.octokit.issues.createComment({
          owner: this.config.owner,
          repo: this.config.repo,
          issue_number: this.env.prNumber,
          body,
        });
        console.log('✓ Posted PR comment');
      }
    } catch (error) {
      console.error('✗ Failed to post PR comment:', error);
    }
  }

  /**
   * Create workflow artifact
   */
  async createArtifact(result: AnalysisResult): Promise<void> {
    // In real implementation, use @actions/artifact
    const artifactPath = './odavl-report.json';
    const artifactData = JSON.stringify(result, null, 2);

    // Write to file (for Actions to upload)
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(artifactPath, artifactData, 'utf8');
      console.log(`✓ Created artifact: ${artifactPath}`);
    } catch (error) {
      console.error('✗ Failed to create artifact:', error);
    }
  }

  /**
   * Check if analysis should fail build
   */
  checkFailThreshold(result: AnalysisResult): void {
    const issues = result.issues || [];
    const critical = issues.filter(i => i.severity === 'critical').length;
    const high = issues.filter(i => i.severity === 'high').length;
    const medium = issues.filter(i => i.severity === 'medium').length;

    const { failThreshold } = this.config;

    if (critical > (failThreshold.critical || 0)) {
      this.fail(`Critical issues exceeded threshold: ${critical} > ${failThreshold.critical}`);
    }

    if (high > (failThreshold.high || 0)) {
      this.fail(`High severity issues exceeded threshold: ${high} > ${failThreshold.high}`);
    }

    if (medium > (failThreshold.medium || 0)) {
      this.fail(`Medium severity issues exceeded threshold: ${medium} > ${failThreshold.medium}`);
    }

    console.log('✓ All thresholds passed');
  }

  // --------------------------------------------------------------------------
  // Private Methods - Environment Detection
  // --------------------------------------------------------------------------

  private detectEnvironment(): GitHubEnv {
    const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

    if (!isGitHubActions) {
      return {
        isGitHubActions: false,
        workflow: '',
        action: '',
        actor: '',
        eventName: '',
        eventPath: '',
        repository: '',
        sha: '',
        ref: '',
      };
    }

    // Parse repository (owner/repo)
    const repository = process.env.GITHUB_REPOSITORY || '';
    const [owner, repo] = repository.split('/');

    // Parse PR number from event
    const eventName = process.env.GITHUB_EVENT_NAME || '';
    let prNumber: number | undefined;

    if (eventName === 'pull_request' || eventName === 'pull_request_target') {
      const refParts = (process.env.GITHUB_REF || '').split('/');
      prNumber = parseInt(refParts[2], 10);
    }

    return {
      isGitHubActions: true,
      workflow: process.env.GITHUB_WORKFLOW || '',
      action: process.env.GITHUB_ACTION || '',
      actor: process.env.GITHUB_ACTOR || '',
      eventName,
      eventPath: process.env.GITHUB_EVENT_PATH || '',
      repository,
      sha: process.env.GITHUB_SHA || '',
      ref: process.env.GITHUB_REF || '',
      prNumber,
      baseRef: process.env.GITHUB_BASE_REF,
      headRef: process.env.GITHUB_HEAD_REF,
    };
  }

  // --------------------------------------------------------------------------
  // Private Methods - Report Generation
  // --------------------------------------------------------------------------

  private generateSummary(result: AnalysisResult): string {
    const issues = result.issues || [];
    const critical = issues.filter(i => i.severity === 'critical').length;
    const high = issues.filter(i => i.severity === 'high').length;
    const medium = issues.filter(i => i.severity === 'medium').length;
    const low = issues.filter(i => i.severity === 'low').length;

    return `
# ODAVL Insight Analysis Results

## Summary
- **Total Issues:** ${issues.length}
- **Critical:** ${critical} 🔴
- **High:** ${high} 🟠
- **Medium:** ${medium} 🟡
- **Low:** ${low} 🔵

## Metrics
- **Files Analyzed:** ${result.metrics?.filesAnalyzed || 0}
- **Lines of Code:** ${result.metrics?.linesOfCode || 0}
- **Duration:** ${result.metrics?.duration || 0}ms

## Top Issues
${this.formatTopIssues(issues.slice(0, 5))}
    `.trim();
  }

  private generatePRComment(result: AnalysisResult): string {
    const issues = result.issues || [];
    const critical = issues.filter(i => i.severity === 'critical').length;
    const high = issues.filter(i => i.severity === 'high').length;
    const medium = issues.filter(i => i.severity === 'medium').length;

    const status = critical > 0 ? '🔴 Critical Issues Found' :
                   high > 0 ? '🟠 High Priority Issues' :
                   medium > 0 ? '🟡 Medium Priority Issues' :
                   '✅ No Critical Issues';

    return `
## 🔍 ODAVL Insight Analysis Report

${status}

### 📊 Summary
| Severity | Count |
|----------|-------|
| 🔴 Critical | ${critical} |
| 🟠 High | ${high} |
| 🟡 Medium | ${medium} |
| 🔵 Low | ${issues.filter(i => i.severity === 'low').length} |

### 📈 Metrics
- **Files Analyzed:** ${result.metrics?.filesAnalyzed || 0}
- **Lines of Code:** ${result.metrics?.linesOfCode?.toLocaleString() || 0}
- **Analysis Duration:** ${this.formatDuration(result.metrics?.duration || 0)}

${critical > 0 || high > 0 ? `
### ⚠️ Top Issues
${this.formatTopIssuesMarkdown(issues.slice(0, 5))}
` : ''}

---
<sub>Powered by [ODAVL Studio](https://github.com/odavlstudio/odavl) | [View Full Report](./odavl-report.json)</sub>
    `.trim();
  }

  private formatTopIssues(issues: Issue[]): string {
    return issues.map(issue => {
      const emoji = this.getSeverityEmoji(issue.severity);
      return `${emoji} **${issue.message}**\n   File: ${issue.file}:${issue.line}`;
    }).join('\n\n');
  }

  private formatTopIssuesMarkdown(issues: Issue[]): string {
    return issues.map((issue, index) => {
      const emoji = this.getSeverityEmoji(issue.severity);
      return `
${index + 1}. ${emoji} **${issue.message}**
   - **File:** \`${issue.file}:${issue.line}\`
   - **Severity:** ${issue.severity}
   - **Rule:** \`${issue.rule || 'N/A'}\`
      `.trim();
    }).join('\n\n');
  }

  // --------------------------------------------------------------------------
  // Private Methods - Annotations
  // --------------------------------------------------------------------------

  private convertToAnnotations(issues: Issue[]): CheckAnnotation[] {
    return issues.map(issue => ({
      path: issue.file,
      start_line: issue.line || 1,
      end_line: issue.endLine || issue.line || 1,
      annotation_level: this.severityToAnnotationLevel(issue.severity),
      message: issue.message,
      title: issue.rule || 'Code Quality Issue',
      raw_details: issue.details,
    }));
  }

  private severityToAnnotationLevel(severity: string): 'notice' | 'warning' | 'failure' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'failure';
      case 'medium':
        return 'warning';
      default:
        return 'notice';
    }
  }

  // --------------------------------------------------------------------------
  // Private Methods - Status & Conclusion
  // --------------------------------------------------------------------------

  private determineConclusion(result: AnalysisResult): 'success' | 'failure' | 'neutral' {
    const issues = result.issues || [];
    const critical = issues.filter(i => i.severity === 'critical').length;
    const high = issues.filter(i => i.severity === 'high').length;
    const medium = issues.filter(i => i.severity === 'medium').length;

    const { failThreshold } = this.config;

    if (critical > (failThreshold.critical || 0)) return 'failure';
    if (high > (failThreshold.high || 0)) return 'failure';
    if (medium > (failThreshold.medium || 0)) return 'failure';

    return issues.length > 0 ? 'neutral' : 'success';
  }

  // --------------------------------------------------------------------------
  // Private Methods - Utilities
  // --------------------------------------------------------------------------

  private async findExistingComment(): Promise<{ id: number } | null> {
    if (!this.env.prNumber) return null;

    try {
      const { data: comments } = await this.octokit.issues.listComments({
        owner: this.config.owner,
        repo: this.config.repo,
        issue_number: this.env.prNumber,
      });

      // Find comment with ODAVL signature
      const existing = comments.find(c => 
        c.body?.includes('ODAVL Insight Analysis Report')
      );

      return existing ? { id: existing.id } : null;
    } catch {
      return null;
    }
  }

  private getDefaultTemplate(): string {
    return `
# ODAVL Analysis Report
{{summary}}
    `.trim();
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

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private fail(message: string): never {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create GitHub Actions integration instance
 */
export function createGitHubActionsIntegration(
  config: GitHubActionsConfig
): GitHubActionsIntegration {
  return new GitHubActionsIntegration(config);
}

/**
 * Auto-detect and run GitHub Actions integration
 */
export async function runGitHubActions(
  result: AnalysisResult,
  config?: Partial<GitHubActionsConfig>
): Promise<void> {
  // Auto-detect from environment
  const token = config?.token || process.env.GITHUB_TOKEN || '';
  const repository = process.env.GITHUB_REPOSITORY || '';
  const [owner, repo] = repository.split('/');

  if (!token || !owner || !repo) {
    throw new Error('GitHub Actions environment not detected or missing credentials');
  }

  const integration = createGitHubActionsIntegration({
    token,
    owner,
    repo,
    ...config,
  });

  await integration.run(result);
}

/**
 * Check if running in GitHub Actions
 */
export function isGitHubActions(): boolean {
  return process.env.GITHUB_ACTIONS === 'true';
}
