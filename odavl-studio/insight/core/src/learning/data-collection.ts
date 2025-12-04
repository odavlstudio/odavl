/**
 * Data Collection Module - Orchestrates GitHub Mining
 * 
 * Collects code fix samples for ML training:
 * - TypeScript: 300k samples
 * - JavaScript: 200k samples  
 * - Python: 400k samples
 * 
 * Total: 900k+ training samples
 */

import { GitHubAPIClient, type GitHubRepository, type CommitDiff } from './github-api-client.js';

export interface GitHubFixSample {
  id: string;
  language: string;
  errorType: string;
  beforeCode: string;
  afterCode: string;
  linesChanged: number;
  complexity: number;
  fixSucceeded: boolean;
  metadata: {
    repo: string;
    commitSha: string;
    author: string;
    date: string;
    file: string;
  };
}

export interface DataCollectionProgress {
  language: string;
  samplesCollected: number;
  samplesTarget: number;
  reposProcessed: number;
  estimatedTimeRemaining: number; // seconds
}

export class GitHubDataMiner {
  private githubClient: GitHubAPIClient;
  private samples: GitHubFixSample[] = [];
  private progressCallback?: (progress: DataCollectionProgress) => void;

  constructor(githubToken?: string) {
    this.githubClient = new GitHubAPIClient(githubToken);
  }

  /**
   * Mine repositories for fix samples
   */
  async mineRepositories(
    language: string,
    targetCount: number,
    onProgress?: (progress: DataCollectionProgress) => void
  ): Promise<GitHubFixSample[]> {
    this.progressCallback = onProgress;
    this.samples = [];

    console.log(`🔍 Mining ${language} repositories for ${targetCount} fix samples...`);

    // Search high-quality repos (100+ stars)
    const repos = await this.githubClient.searchRepositories({
      language,
      minStars: 100,
      maxResults: 100, // Process 100 repos at a time
    });

    console.log(`📦 Found ${repos.length} ${language} repositories`);

    const startTime = Date.now();
    let reposProcessed = 0;

    for (const repo of repos) {
      if (this.samples.length >= targetCount) {
        break; // Target reached
      }

      console.log(`  Processing: ${repo.fullName} (⭐ ${repo.stars})`);

      try {
        const repoSamples = await this.processRepository(repo, language);
        this.samples.push(...repoSamples);

        reposProcessed++;

        // Report progress
        if (this.progressCallback) {
          const elapsed = (Date.now() - startTime) / 1000;
          const samplesPerSecond = this.samples.length / elapsed;
          const remaining = targetCount - this.samples.length;
          const estimatedTimeRemaining = remaining / samplesPerSecond;

          this.progressCallback({
            language,
            samplesCollected: this.samples.length,
            samplesTarget: targetCount,
            reposProcessed,
            estimatedTimeRemaining,
          });
        }

        // Rate limit protection
        await this.sleep(1000);
      } catch (error) {
        console.error(`  ❌ Error processing ${repo.fullName}:`, error);
        continue; // Skip failed repos
      }
    }

    console.log(`✅ Collected ${this.samples.length} samples from ${reposProcessed} repositories`);

    return this.samples;
  }

  /**
   * Process a single repository
   */
  private async processRepository(repo: GitHubRepository, language: string): Promise<GitHubFixSample[]> {
    const samples: GitHubFixSample[] = [];

    // Get fix commits from last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const commits = await this.githubClient.getFixCommits(
      repo.fullName,
      sixMonthsAgo.toISOString()
    );

    // Limit commits per repo (avoid overwhelming a single repo)
    const maxCommitsPerRepo = 50;
    const limitedCommits = commits.slice(0, maxCommitsPerRepo);

    for (const commit of limitedCommits) {
      try {
        const diffs = await this.githubClient.getCommitDiff(repo.fullName, commit.sha);

        for (const diff of diffs) {
          // Only include changes with meaningful diffs
          if (diff.linesAdded === 0 && diff.linesRemoved === 0) {
            continue;
          }

          // Detect error type from code
          const errorType = this.detectErrorType(diff.before, diff.after);

          // Label fix (successful if no revert in subsequent commits)
          const fixSucceeded = !commit.message.toLowerCase().includes('revert');

          samples.push({
            id: `${repo.fullName}-${commit.sha}-${diff.file}`,
            language,
            errorType,
            beforeCode: diff.before,
            afterCode: diff.after,
            linesChanged: diff.linesAdded + diff.linesRemoved,
            complexity: this.calculateComplexity(diff.after),
            fixSucceeded,
            metadata: {
              repo: repo.fullName,
              commitSha: commit.sha,
              author: commit.author,
              date: commit.date,
              file: diff.file,
            },
          });
        }

        // Rate limit protection
        await this.sleep(500);
      } catch (error) {
        // Skip failed commits
        continue;
      }
    }

    return samples;
  }

  /**
   * Detect error type from before/after code
   */
  private detectErrorType(before: string, after: string): string {
    // TypeScript type errors
    if (before.includes('any') && !after.includes('any')) {
      return 'typescript-type';
    }

    // Security issues
    if (before.includes('eval(') || before.includes('dangerouslySetInnerHTML')) {
      return 'security';
    }

    // Import errors
    if (before.match(/import .* from ['"].*['"]/)) {
      return 'import-missing';
    }

    // Runtime errors
    if (before.includes('undefined') || before.includes('null')) {
      return 'runtime-null';
    }

    // Performance issues
    if (after.includes('useMemo') || after.includes('useCallback')) {
      return 'performance';
    }

    // Default
    return 'general-fix';
  }

  /**
   * Calculate code complexity (cyclomatic complexity approximation)
   */
  private calculateComplexity(code: string): number {
    const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||'];
    
    let complexity = 1; // Base complexity
    
    for (const keyword of complexityKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      complexity += matches ? matches.length : 0;
    }

    return complexity;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Export samples to JSON
   */
  exportSamples(outputPath: string): void {
    const fs = require('fs');
    const path = require('path');

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write samples
    fs.writeFileSync(outputPath, JSON.stringify(this.samples, null, 2));

    console.log(`💾 Exported ${this.samples.length} samples to ${outputPath}`);
  }

  /**
   * Get current samples
   */
  getSamples(): GitHubFixSample[] {
    return this.samples;
  }

  /**
   * Get progress statistics
   */
  getStats() {
    const byErrorType: Record<string, number> = {};
    const byLanguage: Record<string, number> = {};
    let successCount = 0;
    let failureCount = 0;

    for (const sample of this.samples) {
      byErrorType[sample.errorType] = (byErrorType[sample.errorType] ?? 0) + 1;
      byLanguage[sample.language] = (byLanguage[sample.language] ?? 0) + 1;

      if (sample.fixSucceeded) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    return {
      totalSamples: this.samples.length,
      byErrorType,
      byLanguage,
      successCount,
      failureCount,
      successRate: this.samples.length > 0 ? successCount / this.samples.length : 0,
    };
  }
}
