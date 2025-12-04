/**
 * GitHub App Service for ODAVL Studio
 * 
 * Provides authentication and API access for GitHub App installations.
 * Handles installation tokens, repository access, and GitHub API operations.
 * 
 * @see https://docs.github.com/en/apps
 */

import { App } from '@octokit/app';
import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';

export interface GitHubInstallation {
  id: number;
  accountLogin: string;
  accountType: 'User' | 'Organization';
  repositories: string[];
  createdAt: Date;
}

export interface CheckRunAnnotation {
  path: string;
  start_line: number;
  end_line: number;
  annotation_level: 'notice' | 'warning' | 'failure';
  message: string;
  title?: string;
}

export interface CommitFile {
  path: string;
  content: string;
}

export class GitHubAppService {
  private app: App;
  private privateKey: string;
  private appId: string;

  constructor(config?: { appId?: string; privateKey?: string; privateKeyPath?: string }) {
    this.appId = config?.appId || process.env.GITHUB_APP_ID!;
    
    if (config?.privateKey) {
      this.privateKey = config.privateKey;
    } else if (config?.privateKeyPath) {
      this.privateKey = fs.readFileSync(config.privateKeyPath, 'utf8');
    } else if (process.env.GITHUB_APP_PRIVATE_KEY_PATH) {
      this.privateKey = fs.readFileSync(process.env.GITHUB_APP_PRIVATE_KEY_PATH, 'utf8');
    } else if (process.env.GITHUB_APP_PRIVATE_KEY) {
      this.privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    } else {
      throw new Error('GitHub App private key not provided');
    }

    this.app = new App({
      appId: this.appId,
      privateKey: this.privateKey,
    });
  }

  /**
   * Get authenticated Octokit instance for installation
   */
  async getOctokit(installationId: number): Promise<Octokit> {
    return await this.app.getInstallationOctokit(installationId) as unknown as Octokit;
  }

  /**
   * Get installation access token for API calls (if needed separately)
   * Tokens expire after 1 hour, so regenerate for each operation
   */
  async getInstallationToken(installationId: number): Promise<string> {
    const octokit = await this.getOctokit(installationId);
    // Installation already has auth token built-in
    return (octokit as any).auth.token || '';
  }

  /**
   * List all repositories accessible by installation
   */
  async listRepositories(installationId: number) {
    const octokit = await this.getOctokit(installationId);
    const { data } = await octokit.rest.apps.listReposAccessibleToInstallation();
    return data.repositories.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      private: repo.private,
      defaultBranch: repo.default_branch,
      language: repo.language,
      size: repo.size,
      stars: repo.stargazers_count,
      openIssues: repo.open_issues_count,
    }));
  }

  /**
   * Get repository details
   */
  async getRepository(installationId: number, owner: string, repo: string) {
    const octokit = await this.getOctokit(installationId);
    const { data } = await octokit.rest.repos.get({ owner, repo });
    return data;
  }

  /**
   * Clone repository to local directory
   */
  async cloneRepository(
    installationId: number,
    owner: string,
    repo: string,
    targetDir: string
  ): Promise<void> {
    const token = await this.getInstallationToken(installationId);
    const cloneUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
    
    const { execSync } = await import('child_process');
    execSync(`git clone ${cloneUrl} ${targetDir}`, { stdio: 'inherit' });
  }

  /**
   * Create check run for commit (CI/CD status)
   */
  async createCheckRun(
    installationId: number,
    owner: string,
    repo: string,
    sha: string,
    name: string = 'ODAVL Analysis'
  ) {
    const octokit = await this.getOctokit(installationId);
    
    const { data } = await octokit.rest.checks.create({
      owner,
      repo,
      name,
      head_sha: sha,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    });

    return data;
  }

  /**
   * Update check run with analysis results
   */
  async updateCheckRun(
    installationId: number,
    owner: string,
    repo: string,
    checkRunId: number,
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required',
    summary: string,
    annotations: CheckRunAnnotation[] = []
  ) {
    const octokit = await this.getOctokit(installationId);

    await octokit.rest.checks.update({
      owner,
      repo,
      check_run_id: checkRunId,
      status: 'completed',
      conclusion,
      completed_at: new Date().toISOString(),
      output: {
        title: 'ODAVL Analysis Complete',
        summary,
        annotations: annotations.slice(0, 50), // GitHub limit: 50 per request
      },
    });
  }

  /**
   * Create comment on PR with analysis results
   */
  async createPRComment(
    installationId: number,
    owner: string,
    repo: string,
    prNumber: number,
    body: string
  ) {
    const octokit = await this.getOctokit(installationId);

    const { data } = await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    });

    return data;
  }

  /**
   * Update existing PR comment
   */
  async updatePRComment(
    installationId: number,
    owner: string,
    repo: string,
    commentId: number,
    body: string
  ) {
    const octokit = await this.getOctokit(installationId);

    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: commentId,
      body,
    });
  }

  /**
   * Find existing ODAVL comment on PR
   */
  async findODAVLComment(
    installationId: number,
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<number | null> {
    const octokit = await this.getOctokit(installationId);

    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
    });

    const odavlComment = comments.find(c => 
      c.body?.startsWith('## 🤖 ODAVL Analysis') || 
      c.body?.includes('<!-- odavl-comment -->')
    );

    return odavlComment?.id || null;
  }

  /**
   * Create or update PR comment (idempotent)
   */
  async upsertPRComment(
    installationId: number,
    owner: string,
    repo: string,
    prNumber: number,
    body: string
  ) {
    const existingId = await this.findODAVLComment(installationId, owner, repo, prNumber);

    if (existingId) {
      await this.updatePRComment(installationId, owner, repo, existingId, body);
    } else {
      await this.createPRComment(installationId, owner, repo, prNumber, body);
    }
  }

  /**
   * Create commit with auto-fixed files
   */
  async createCommit(
    installationId: number,
    owner: string,
    repo: string,
    branch: string,
    message: string,
    files: CommitFile[]
  ) {
    const octokit = await this.getOctokit(installationId);

    // Get branch reference
    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });

    // Get base commit
    const { data: baseCommit } = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: ref.object.sha,
    });

    // Create blobs for each file
    const blobs = await Promise.all(
      files.map(async (file) => {
        const { data } = await octokit.rest.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64',
        });
        return { path: file.path, sha: data.sha };
      })
    );

    // Create tree with new files
    const { data: tree } = await octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: baseCommit.tree.sha,
      tree: blobs.map((blob) => ({
        path: blob.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha,
      })),
    });

    // Create commit
    const { data: commit } = await octokit.rest.git.createCommit({
      owner,
      repo,
      message,
      tree: tree.sha,
      parents: [ref.object.sha],
    });

    // Update branch reference
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commit.sha,
    });

    return commit;
  }

  /**
   * Create pull request with auto-fixes
   */
  async createPullRequest(
    installationId: number,
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string = 'main'
  ) {
    const octokit = await this.getOctokit(installationId);

    const { data } = await octokit.rest.pulls.create({
      owner,
      repo,
      title,
      body,
      head,
      base,
    });

    return data;
  }

  /**
   * Create branch for auto-fixes
   */
  async createBranch(
    installationId: number,
    owner: string,
    repo: string,
    branchName: string,
    baseBranch: string = 'main'
  ) {
    const octokit = await this.getOctokit(installationId);

    // Get base branch SHA
    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });

    // Create new branch
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha,
    });
  }

  /**
   * Get file content from repository
   */
  async getFileContent(
    installationId: number,
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string> {
    const octokit = await this.getOctokit(installationId);

    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    if ('content' in data) {
      return Buffer.from(data.content, 'base64').toString('utf8');
    }

    throw new Error(`Path ${path} is not a file`);
  }

  /**
   * List files changed in PR
   */
  async listPRFiles(
    installationId: number,
    owner: string,
    repo: string,
    prNumber: number
  ) {
    const octokit = await this.getOctokit(installationId);

    const { data } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
    });

    return data.map(file => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch,
    }));
  }

  /**
   * Create issue for analysis results
   */
  async createIssue(
    installationId: number,
    owner: string,
    repo: string,
    title: string,
    body: string,
    labels: string[] = []
  ) {
    const octokit = await this.getOctokit(installationId);

    const { data } = await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });

    return data;
  }
}
