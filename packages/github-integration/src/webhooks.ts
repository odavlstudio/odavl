/**
 * GitHub Webhooks Handler for ODAVL Studio
 * 
 * Processes GitHub webhook events (push, PR, installation, etc.)
 * and triggers ODAVL analysis/auto-fix workflows.
 * 
 * @see https://docs.github.com/en/webhooks
 */

import { Webhooks, createNodeMiddleware } from '@octokit/webhooks';
import { GitHubAppService } from './app.js';
import type { Request, Response } from 'express';

export interface WebhookConfig {
  secret: string;
  githubApp: GitHubAppService;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

export interface AnalysisResult {
  repository: string;
  sha: string;
  issuesFound: number;
  issuesFixed: number;
  success: boolean;
  duration: number;
}

export class GitHubWebhooksService {
  private webhooks: Webhooks;
  private githubApp: GitHubAppService;
  private onAnalysisComplete?: (result: AnalysisResult) => void;

  constructor(config: WebhookConfig) {
    this.webhooks = new Webhooks({
      secret: config.secret,
    });

    this.githubApp = config.githubApp;
    this.onAnalysisComplete = config.onAnalysisComplete;

    this.setupHandlers();
  }

  /**
   * Setup webhook event handlers
   */
  private setupHandlers() {
    // Installation events
    this.webhooks.on('installation.created', this.handleInstallationCreated.bind(this));
    this.webhooks.on('installation.deleted', this.handleInstallationDeleted.bind(this));
    this.webhooks.on('installation_repositories.added', this.handleRepositoriesAdded.bind(this));

    // Push events
    this.webhooks.on('push', this.handlePush.bind(this));

    // Pull request events
    this.webhooks.on('pull_request.opened', this.handlePullRequestOpened.bind(this));
    this.webhooks.on('pull_request.synchronize', this.handlePullRequestSynchronize.bind(this));

    // Check suite events
    this.webhooks.on('check_suite.requested', this.handleCheckSuiteRequested.bind(this));
    this.webhooks.on('check_suite.rerequested', this.handleCheckSuiteRequested.bind(this));
  }

  /**
   * Handle new installation
   */
  private async handleInstallationCreated({ payload }: any) {
    console.log('✅ App installed:', payload.installation.account.login);
    console.log('📦 Repositories:', payload.repositories?.length || 0);

    // Store installation in database
    // TODO: Implement database storage
    const installation = {
      id: payload.installation.id,
      accountLogin: payload.installation.account.login,
      accountType: payload.installation.account.type,
      repositories: payload.repositories?.map((r: any) => r.full_name) || [],
      createdAt: new Date(),
    };

    console.log('Stored installation:', installation);
  }

  /**
   * Handle installation deletion
   */
  private async handleInstallationDeleted({ payload }: any) {
    console.log('❌ App uninstalled:', payload.installation.account.login);
    
    // Remove installation from database
    // TODO: Implement database cleanup
  }

  /**
   * Handle repositories added to installation
   */
  private async handleRepositoriesAdded({ payload }: any) {
    console.log('➕ Repositories added:', payload.repositories_added.length);
    
    for (const repo of payload.repositories_added) {
      console.log('  -', repo.full_name);
    }

    // Update installation in database
    // TODO: Implement database update
  }

  /**
   * Handle push to repository
   */
  private async handlePush({ payload }: any) {
    const { repository, ref, installation, after: sha } = payload;

    // Only analyze main/master branches
    const mainBranches = ['refs/heads/main', 'refs/heads/master'];
    if (!mainBranches.includes(ref)) {
      console.log('⏭️  Skipping non-main branch:', ref);
      return;
    }

    console.log('📥 Push to:', repository.full_name);
    console.log('   Branch:', ref);
    console.log('   SHA:', sha.substring(0, 7));

    const startTime = Date.now();

    try {
      // Create check run
      const checkRun = await this.githubApp.createCheckRun(
        installation.id,
        repository.owner.login,
        repository.name,
        sha,
        'ODAVL Auto-Fix'
      );

      // Clone repository (in production, use temporary directory)
      const repoDir = `/tmp/odavl-${repository.name}-${Date.now()}`;
      await this.githubApp.cloneRepository(
        installation.id,
        repository.owner.login,
        repository.name,
        repoDir
      );

      // Run ODAVL analysis (placeholder - integrate with autopilot engine)
      const result = await this.runAnalysis(repoDir);

      // Update check run
      await this.githubApp.updateCheckRun(
        installation.id,
        repository.owner.login,
        repository.name,
        checkRun.id,
        result.issuesFound === 0 ? 'success' : 'neutral',
        this.formatCheckSummary(result)
      );

      // Create commit with fixes (if any)
      if (result.issuesFixed > 0 && result.modifiedFiles.length > 0) {
        await this.githubApp.createCommit(
          installation.id,
          repository.owner.login,
          repository.name,
          repository.default_branch,
          `fix: ODAVL auto-fix (${result.issuesFixed} issues)`,
          result.modifiedFiles
        );

        console.log(`✅ Created commit with ${result.issuesFixed} fixes`);
      }

      // Cleanup
      const { execSync } = await import('child_process');
      execSync(`rm -rf ${repoDir}`);

      // Callback
      if (this.onAnalysisComplete) {
        this.onAnalysisComplete({
          repository: repository.full_name,
          sha,
          issuesFound: result.issuesFound,
          issuesFixed: result.issuesFixed,
          success: true,
          duration: Date.now() - startTime,
        });
      }

    } catch (error) {
      console.error('Error processing push:', error);
    }
  }

  /**
   * Handle PR opened
   */
  private async handlePullRequestOpened({ payload }: any) {
    await this.analyzePullRequest(payload);
  }

  /**
   * Handle PR updated (new commits)
   */
  private async handlePullRequestSynchronize({ payload }: any) {
    await this.analyzePullRequest(payload);
  }

  /**
   * Analyze pull request
   */
  private async analyzePullRequest(payload: any) {
    const { pull_request, repository, installation } = payload;

    console.log('🔍 Analyzing PR:', pull_request.title);
    console.log('   Repo:', repository.full_name);
    console.log('   Number:', pull_request.number);
    console.log('   SHA:', pull_request.head.sha.substring(0, 7));

    const startTime = Date.now();

    try {
      // Create check run
      const checkRun = await this.githubApp.createCheckRun(
        installation.id,
        repository.owner.login,
        repository.name,
        pull_request.head.sha,
        'ODAVL PR Analysis'
      );

      // Get PR files
      const files = await this.githubApp.listPRFiles(
        installation.id,
        repository.owner.login,
        repository.name,
        pull_request.number
      );

      console.log(`   Files changed: ${files.length}`);

      // Clone repository
      const repoDir = `/tmp/odavl-pr-${repository.name}-${pull_request.number}`;
      await this.githubApp.cloneRepository(
        installation.id,
        repository.owner.login,
        repository.name,
        repoDir
      );

      // Checkout PR branch
      const { execSync } = await import('child_process');
      execSync(`cd ${repoDir} && git checkout ${pull_request.head.ref}`);

      // Run analysis
      const result = await this.runAnalysis(repoDir, files.map(f => f.filename));

      // Update check run
      await this.githubApp.updateCheckRun(
        installation.id,
        repository.owner.login,
        repository.name,
        checkRun.id,
        result.issuesFound === 0 ? 'success' : 'neutral',
        this.formatCheckSummary(result),
        result.annotations || []
      );

      // Create/update PR comment
      const comment = this.formatPRComment(result, pull_request);
      await this.githubApp.upsertPRComment(
        installation.id,
        repository.owner.login,
        repository.name,
        pull_request.number,
        comment
      );

      // Cleanup
      execSync(`rm -rf ${repoDir}`);

      console.log(`✅ PR analysis complete: ${result.issuesFound} issues found`);

    } catch (error) {
      console.error('Error analyzing PR:', error);
    }
  }

  /**
   * Handle check suite requested
   */
  private async handleCheckSuiteRequested({ payload }: any) {
    const { check_suite, repository, installation } = payload;

    console.log('🔄 Check suite requested:', repository.full_name);

    // Create check run
    await this.githubApp.createCheckRun(
      installation.id,
      repository.owner.login,
      repository.name,
      check_suite.head_sha,
      'ODAVL Analysis'
    );

    // Analysis will be triggered by push/PR events
  }

  /**
   * Run ODAVL analysis (placeholder)
   * In production, integrate with @odavl-studio/autopilot-engine
   */
  private async runAnalysis(
    repoDir: string,
    files?: string[]
  ): Promise<{
    issuesFound: number;
    issuesFixed: number;
    modifiedFiles: { path: string; content: string }[];
    annotations?: any[];
  }> {
    // Placeholder - replace with actual autopilot engine integration
    console.log('🤖 Running ODAVL analysis...');
    
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      issuesFound: 12,
      issuesFixed: 9,
      modifiedFiles: [],
      annotations: [],
    };
  }

  /**
   * Format check run summary
   */
  private formatCheckSummary(result: {
    issuesFound: number;
    issuesFixed: number;
  }): string {
    return `
### 🤖 ODAVL Analysis Complete

**Issues Found:** ${result.issuesFound}  
**Auto-Fixed:** ${result.issuesFixed} (${Math.round((result.issuesFixed / result.issuesFound) * 100)}%)  
**Remaining:** ${result.issuesFound - result.issuesFixed}

${result.issuesFound === 0 ? '✅ No issues found!' : ''}
${result.issuesFixed > 0 ? `✅ ${result.issuesFixed} issues fixed automatically` : ''}
${result.issuesFound - result.issuesFixed > 0 ? `⚠️ ${result.issuesFound - result.issuesFixed} issues require manual review` : ''}
    `.trim();
  }

  /**
   * Format PR comment
   */
  private formatPRComment(
    result: { issuesFound: number; issuesFixed: number },
    pr: any
  ): string {
    return `
<!-- odavl-comment -->
## 🤖 ODAVL Analysis

**Summary:** Found ${result.issuesFound} issues, fixed ${result.issuesFixed} automatically.

| Metric | Value |
|--------|-------|
| 📊 Issues Found | ${result.issuesFound} |
| ✅ Auto-Fixed | ${result.issuesFixed} |
| ⚠️ Requires Review | ${result.issuesFound - result.issuesFixed} |
| 📈 Fix Rate | ${Math.round((result.issuesFixed / result.issuesFound) * 100)}% |

${result.issuesFound === 0 ? '### ✅ Perfect! No issues found.\n\nThis PR is ready to merge.' : ''}

${result.issuesFixed > 0 ? `### ✅ Auto-Fixed Issues\n\nODAVL automatically fixed ${result.issuesFixed} issues. Check the latest commit for changes.` : ''}

${result.issuesFound - result.issuesFixed > 0 ? `### ⚠️ Manual Review Required\n\n${result.issuesFound - result.issuesFixed} issues require manual attention. See the check run for details.` : ''}

---

<sub>🚀 Powered by [ODAVL Studio](https://odavl.studio) | [Docs](https://docs.odavl.studio) | [Support](mailto:support@odavl.studio)</sub>
    `.trim();
  }

  /**
   * Get Express middleware for webhooks
   */
  getMiddleware() {
    return createNodeMiddleware(this.webhooks);
  }

  /**
   * Handle webhook request manually (for custom servers)
   */
  async handleRequest(req: Request, res: Response) {
    const signature = req.headers['x-hub-signature-256'] as string;
    const id = req.headers['x-github-delivery'] as string;
    const name = req.headers['x-github-event'] as any;
    const payload = req.body;

    try {
      await this.webhooks.verifyAndReceive({
        id,
        name,
        signature,
        payload,
      });

      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).send('Invalid signature');
    }
  }
}
