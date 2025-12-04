/**
 * GitHub API Client for Mining Fix Commits
 * 
 * Purpose: Collect 1M+ code fix samples from GitHub for ML training
 * 
 * Strategy:
 * 1. Search repos with 100+ stars (quality filter)
 * 2. Find commits with fix keywords (fix, bug, error, resolve)
 * 3. Extract before/after code diffs
 * 4. Label fixes (successful if no revert)
 * 5. Export as training data
 * 
 * Rate Limits:
 * - Without token: 60 requests/hour
 * - With token: 5,000 requests/hour
 */

import https from 'https';

export interface GitHubSearchOptions {
  language: string;
  minStars: number;
  maxResults: number;
}

export interface GitHubRepository {
  fullName: string;
  stars: number;
  language: string;
  url: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  files: string[];
}

export interface CommitDiff {
  file: string;
  before: string;
  after: string;
  linesAdded: number;
  linesRemoved: number;
}

export class GitHubAPIClient {
  private token: string | null;
  private baseUrl = 'https://api.github.com';
  private rateLimitRemaining = 5000;
  private rateLimitReset = 0;

  constructor(token?: string) {
    this.token = token ?? process.env.GITHUB_TOKEN ?? null;
    
    if (!this.token) {
      console.warn('⚠️  No GitHub token provided. Rate limit: 60/hour (vs 5000/hour with token)');
    }
  }

  /**
   * Search repositories by language and stars
   */
  async searchRepositories(options: GitHubSearchOptions): Promise<GitHubRepository[]> {
    const query = `language:${options.language} stars:>=${options.minStars}`;
    const url = `${this.baseUrl}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=${options.maxResults}`;

    const response = await this.makeRequest<{ items: any[] }>(url);
    
    return response.items.map(repo => ({
      fullName: repo.full_name,
      stars: repo.stargazers_count,
      language: repo.language,
      url: repo.html_url,
    }));
  }

  /**
   * Get commits with fix keywords from a repository
   */
  async getFixCommits(repoFullName: string, since?: string): Promise<GitHubCommit[]> {
    const url = `${this.baseUrl}/repos/${repoFullName}/commits?per_page=100${since ? `&since=${since}` : ''}`;
    
    const commits = await this.makeRequest<any[]>(url);
    
    // Filter for fix-related commits
    const fixKeywords = ['fix', 'bug', 'error', 'resolve', 'correct', 'patch'];
    
    return commits
      .filter(commit => {
        const msg = commit.commit.message.toLowerCase();
        return fixKeywords.some(keyword => msg.includes(keyword));
      })
      .map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        files: commit.files?.map((f: any) => f.filename) ?? [],
      }));
  }

  /**
   * Get diff for a specific commit (before/after code)
   */
  async getCommitDiff(repoFullName: string, commitSha: string): Promise<CommitDiff[]> {
    const url = `${this.baseUrl}/repos/${repoFullName}/commits/${commitSha}`;
    
    const commit = await this.makeRequest<any>(url);
    
    const diffs: CommitDiff[] = [];
    
    for (const file of commit.files ?? []) {
      // Only process code files (skip images, binaries, etc.)
      if (!this.isCodeFile(file.filename)) {
        continue;
      }

      try {
        // Get file content before and after commit
        const beforeContent = await this.getFileContent(repoFullName, file.filename, `${commitSha}^`);
        const afterContent = await this.getFileContent(repoFullName, file.filename, commitSha);

        diffs.push({
          file: file.filename,
          before: beforeContent,
          after: afterContent,
          linesAdded: file.additions ?? 0,
          linesRemoved: file.deletions ?? 0,
        });
      } catch (error) {
        // File might be new or deleted, skip
        continue;
      }

      // Rate limit protection: sleep after each file
      await this.sleep(200);
    }

    return diffs;
  }

  /**
   * Get file content at specific commit
   */
  private async getFileContent(repo: string, path: string, ref: string): Promise<string> {
    const url = `${this.baseUrl}/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${ref}`;
    
    const response = await this.makeRequest<{ content: string; encoding: string }>(url);
    
    if (response.encoding === 'base64') {
      return Buffer.from(response.content, 'base64').toString('utf-8');
    }

    return response.content;
  }

  /**
   * Check rate limit status
   */
  async checkRateLimit(): Promise<{ remaining: number; reset: number; limit: number }> {
    const url = `${this.baseUrl}/rate_limit`;
    
    const response = await this.makeRequest<any>(url);
    
    return {
      remaining: response.resources.core.remaining,
      reset: response.resources.core.reset,
      limit: response.resources.core.limit,
    };
  }

  /**
   * Make authenticated HTTPS request to GitHub API
   */
  private makeRequest<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const headers: Record<string, string> = {
        'User-Agent': 'ODAVL-ML-Data-Collector',
        'Accept': 'application/vnd.github.v3+json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const request = https.get(url, { headers }, (response) => {
        let data = '';

        // Update rate limit info from headers
        this.rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining'] as string ?? '0', 10);
        this.rateLimitReset = parseInt(response.headers['x-ratelimit-reset'] as string ?? '0', 10);

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          if (response.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(new Error(`Failed to parse JSON: ${error}`));
            }
          } else if (response.statusCode === 403 && this.rateLimitRemaining === 0) {
            const waitTime = Math.max(0, this.rateLimitReset - Date.now() / 1000);
            reject(new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 60)} minutes.`));
          } else {
            reject(new Error(`GitHub API error: ${response.statusCode} ${data}`));
          }
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.end();
    });
  }

  /**
   * Check if file is a code file (not binary/image)
   */
  private isCodeFile(filename: string): boolean {
    const codeExtensions = [
      '.ts', '.tsx', '.js', '.jsx',
      '.py', '.java', '.go', '.rs',
      '.c', '.cpp', '.h', '.cs',
      '.rb', '.php', '.swift', '.kt',
    ];

    return codeExtensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Sleep for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): { remaining: number; reset: number } {
    return {
      remaining: this.rateLimitRemaining,
      reset: this.rateLimitReset,
    };
  }
}
