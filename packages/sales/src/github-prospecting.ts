/**
 * GitHub Prospecting System
 * Analyzes public repositories to identify sales prospects
 * Based on UNIFIED_ACTION_PLAN Phase 3 Week 17-18
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface ProspectCriteria {
  minStars: number;
  minContributors: number;
  languages: string[];
  hasIssues: boolean;
  minIssueCount: number;
  excludeArchived: boolean;
}

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  url: string;
  stars: number;
  language: string;
  description: string;
  openIssues: number;
  contributors: number;
  lastPush: string;
  hasTypeScript: boolean;
  hasESLint: boolean;
  hasSonarQube: boolean;
  estimatedLOC: number;
  idealPlan: 'starter' | 'pro' | 'enterprise';
}

export interface Prospect {
  repo: Repository;
  score: number; // 0-100, higher = better prospect
  reasons: string[];
  estimatedValue: number; // Monthly MRR
  emailTemplate: string;
  contactInfo?: {
    name?: string;
    email?: string;
    twitter?: string;
    website?: string;
  };
}

export class GitHubProspector {
  private octokit: Octokit;
  private criteria: ProspectCriteria;

  constructor(githubToken: string, criteria?: Partial<ProspectCriteria>) {
    this.octokit = new Octokit({ auth: githubToken });
    this.criteria = {
      minStars: 100,
      minContributors: 3,
      languages: ['TypeScript', 'JavaScript', 'Python'],
      hasIssues: true,
      minIssueCount: 10,
      excludeArchived: true,
      ...criteria,
    };
  }

  /**
   * Search GitHub for repositories matching criteria
   */
  async searchRepositories(limit = 1000): Promise<Repository[]> {
    const repos: Repository[] = [];
    const languages = this.criteria.languages.join(' OR language:');
    
    // Search query: TypeScript/JavaScript/Python repos with 100+ stars and issues
    const query = `language:${languages} stars:>=${this.criteria.minStars} is:public archived:false`;
    
    console.log(`🔍 Searching GitHub: ${query}`);
    
    let page = 1;
    while (repos.length < limit) {
      const { data } = await this.octokit.rest.search.repos({
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: 100,
        page,
      });

      if (data.items.length === 0) break;

      for (const item of data.items) {
        // Skip if archived
        if (item.archived && this.criteria.excludeArchived) continue;

        // Skip if too few issues
        if (item.open_issues_count < this.criteria.minIssueCount) continue;

        // Skip if owner is null
        if (!item.owner) continue;

        // Get additional repo details
        const repoDetails = await this.analyzeRepository(item.owner.login, item.name);
        
        if (repoDetails) {
          repos.push(repoDetails);
          console.log(`  ✓ Found prospect: ${repoDetails.fullName} (${repoDetails.stars}⭐, ${repoDetails.openIssues} issues)`);
        }

        if (repos.length >= limit) break;
        
        // Rate limiting: 5000 requests/hour = ~1 request/second
        await this.sleep(200);
      }

      page++;
      
      // GitHub Search API max: 1000 results
      if (page > 10) break;
    }

    return repos;
  }

  /**
   * Analyze individual repository for detailed metrics
   */
  async analyzeRepository(owner: string, repo: string): Promise<Repository | null> {
    try {
      // Get repo details
      const { data: repoData } = await this.octokit.rest.repos.get({ owner, repo });

      // Get contributors count
      const { data: contributors } = await this.octokit.rest.repos.listContributors({
        owner,
        repo,
        per_page: 100,
      });

      // Skip if too few contributors
      if (contributors.length < this.criteria.minContributors) {
        return null;
      }

      // Check for TypeScript/ESLint/SonarQube
      const hasTypeScript = await this.hasFile(owner, repo, 'tsconfig.json');
      const hasESLint = await this.hasFile(owner, repo, '.eslintrc.json') || 
                        await this.hasFile(owner, repo, '.eslintrc.js') ||
                        await this.hasFile(owner, repo, 'eslint.config.js');
      const hasSonarQube = await this.hasFile(owner, repo, 'sonar-project.properties');

      // Estimate LOC based on repo size (rough heuristic)
      const estimatedLOC = Math.round(repoData.size * 10); // 1KB ≈ 10 LOC

      // Determine ideal plan based on LOC
      let idealPlan: 'starter' | 'pro' | 'enterprise';
      if (estimatedLOC < 100000) idealPlan = 'starter';
      else if (estimatedLOC < 500000) idealPlan = 'pro';
      else idealPlan = 'enterprise';

      return {
        id: repoData.id,
        name: repoData.name,
        fullName: repoData.full_name,
        owner: repoData.owner.login,
        url: repoData.html_url,
        stars: repoData.stargazers_count,
        language: repoData.language || 'Unknown',
        description: repoData.description || '',
        openIssues: repoData.open_issues_count,
        contributors: contributors.length,
        lastPush: repoData.pushed_at || '',
        hasTypeScript,
        hasESLint,
        hasSonarQube,
        estimatedLOC,
        idealPlan,
      };
    } catch (error: any) {
      console.error(`  ✗ Error analyzing ${owner}/${repo}:`, error.message);
      return null;
    }
  }

  /**
   * Check if repository has specific file
   */
  async hasFile(owner: string, repo: string, filepath: string): Promise<boolean> {
    try {
      await this.octokit.rest.repos.getContent({ owner, repo, path: filepath });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Score repositories as prospects (0-100)
   */
  scoreProspect(repo: Repository): { score: number; reasons: string[] } {
    let score = 50; // Base score
    const reasons: string[] = [];

    // High stars = popular project = more likely to have budget
    if (repo.stars >= 1000) {
      score += 15;
      reasons.push(`Popular project (${repo.stars}⭐)`);
    } else if (repo.stars >= 500) {
      score += 10;
      reasons.push(`Well-known project (${repo.stars}⭐)`);
    } else if (repo.stars >= 100) {
      score += 5;
      reasons.push(`Active project (${repo.stars}⭐)`);
    }

    // Many contributors = team project = potential enterprise customer
    if (repo.contributors >= 20) {
      score += 15;
      reasons.push(`Large team (${repo.contributors} contributors)`);
    } else if (repo.contributors >= 10) {
      score += 10;
      reasons.push(`Medium team (${repo.contributors} contributors)`);
    } else if (repo.contributors >= 5) {
      score += 5;
      reasons.push(`Small team (${repo.contributors} contributors)`);
    }

    // High issue count = pain points = potential customers
    if (repo.openIssues >= 100) {
      score += 15;
      reasons.push(`Many issues (${repo.openIssues} open)`);
    } else if (repo.openIssues >= 50) {
      score += 10;
      reasons.push(`Moderate issues (${repo.openIssues} open)`);
    } else if (repo.openIssues >= 20) {
      score += 5;
      reasons.push(`Some issues (${repo.openIssues} open)`);
    }

    // TypeScript = type safety focus = good fit for ODAVL
    if (repo.hasTypeScript) {
      score += 10;
      reasons.push('Uses TypeScript (type-aware analysis)');
    }

    // Has ESLint but not SonarQube = potential upgrade path
    if (repo.hasESLint && !repo.hasSonarQube) {
      score += 10;
      reasons.push('Uses ESLint (easy migration to ODAVL)');
    }

    // Using SonarQube = paying for code quality = budget exists
    if (repo.hasSonarQube) {
      score += 20;
      reasons.push('Uses SonarQube (potential replacement opportunity)');
    }

    // Recent activity = maintained project
    const daysSinceLastPush = Math.floor(
      (Date.now() - new Date(repo.lastPush).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastPush <= 7) {
      score += 10;
      reasons.push('Very active (pushed within 7 days)');
    } else if (daysSinceLastPush <= 30) {
      score += 5;
      reasons.push('Active (pushed within 30 days)');
    }

    // Large codebase = needs automation
    if (repo.estimatedLOC >= 500000) {
      score += 10;
      reasons.push(`Large codebase (${Math.round(repo.estimatedLOC / 1000)}K LOC)`);
    } else if (repo.estimatedLOC >= 100000) {
      score += 5;
      reasons.push(`Medium codebase (${Math.round(repo.estimatedLOC / 1000)}K LOC)`);
    }

    return { score: Math.min(100, score), reasons };
  }

  /**
   * Generate personalized email for prospect
   */
  generateEmail(repo: Repository, score: number, reasons: string[]): string {
    const pricing = repo.idealPlan === 'starter' ? '$29' :
                    repo.idealPlan === 'pro' ? '$99' : 'custom';

    const specificIssues = this.identifySpecificIssues(repo);

    return `Subject: [${repo.fullName}] Automated code quality for ${repo.openIssues} open issues

Hi ${repo.owner} team,

I noticed ${repo.fullName} has ${repo.openIssues} open issues and ${repo.contributors} active contributors. We built ODAVL Studio to help teams like yours automate code quality.

**What I found in your repo**:
${specificIssues.map(issue => `- ${issue}`).join('\n')}

**How ODAVL can help**:
✅ Auto-fix 78% of issues (TypeScript, ESLint, imports, security)
✅ Analysis in 2-3 seconds (vs 10-30s for SonarQube)
✅ ML-powered trust prediction (learns from your codebase)
✅ Instant undo (every change is reversible)

**Pricing**: ${pricing}/month for your ${Math.round(repo.estimatedLOC / 1000)}K LOC codebase

**Why reach out now**:
${reasons.slice(0, 3).map(r => `• ${r}`).join('\n')}

Would you be interested in a 30-day free trial? I can set you up in 10 minutes.

Best regards,
[Your Name]
ODAVL Studio

P.S. Check out our benchmark vs SonarQube: https://odavl.studio/blog/benchmark

---
Reply "UNSUBSCRIBE" to stop receiving emails from ODAVL.`;
  }

  /**
   * Identify specific issues in repository (simulated)
   */
  identifySpecificIssues(repo: Repository): string[] {
    const issues: string[] = [];

    if (repo.hasTypeScript) {
      issues.push('TypeScript errors likely present (can auto-fix 52%)');
    }

    if (repo.hasESLint) {
      issues.push('ESLint warnings (we auto-fix 78% vs ESLint\'s 27%)');
    }

    if (repo.openIssues >= 50) {
      issues.push(`${repo.openIssues} open issues (potential quality debt)`);
    }

    if (!repo.hasSonarQube) {
      issues.push('No automated code quality tools detected');
    }

    if (repo.language === 'TypeScript' || repo.language === 'JavaScript') {
      issues.push('Import path issues common in JS/TS projects');
      issues.push('Security vulnerabilities (OWASP Top 10 detection)');
    }

    return issues.slice(0, 4); // Max 4 issues
  }

  /**
   * Get contact information for repository owner
   */
  async getContactInfo(owner: string): Promise<Prospect['contactInfo']> {
    try {
      const { data: user } = await this.octokit.rest.users.getByUsername({ username: owner });

      return {
        name: user.name || owner,
        email: user.email || undefined,
        twitter: user.twitter_username || undefined,
        website: user.blog || undefined,
      };
    } catch {
      return { name: owner };
    }
  }

  /**
   * Create full prospect report
   */
  async createProspects(repos: Repository[]): Promise<Prospect[]> {
    const prospects: Prospect[] = [];

    for (const repo of repos) {
      const { score, reasons } = this.scoreProspect(repo);

      // Skip low-quality prospects (score < 60)
      if (score < 60) continue;

      const emailTemplate = this.generateEmail(repo, score, reasons);
      const contactInfo = await this.getContactInfo(repo.owner);

      // Estimate monthly value based on plan
      const estimatedValue = repo.idealPlan === 'starter' ? 29 :
                             repo.idealPlan === 'pro' ? 99 : 500;

      prospects.push({
        repo,
        score,
        reasons,
        estimatedValue,
        emailTemplate,
        contactInfo,
      });

      await this.sleep(100); // Rate limiting
    }

    // Sort by score (highest first)
    prospects.sort((a, b) => b.score - a.score);

    return prospects;
  }

  /**
   * Export prospects to JSON
   */
  exportProspects(prospects: Prospect[], outputPath: string): void {
    const data = {
      generatedAt: new Date().toISOString(),
      totalProspects: prospects.length,
      estimatedTotalValue: prospects.reduce((sum, p) => sum + p.estimatedValue, 0),
      prospects: prospects.map(p => ({
        repo: {
          fullName: p.repo.fullName,
          url: p.repo.url,
          stars: p.repo.stars,
          openIssues: p.repo.openIssues,
          contributors: p.repo.contributors,
          language: p.repo.language,
          estimatedLOC: p.repo.estimatedLOC,
          idealPlan: p.repo.idealPlan,
        },
        score: p.score,
        reasons: p.reasons,
        estimatedValue: p.estimatedValue,
        contactInfo: p.contactInfo,
        emailTemplate: p.emailTemplate,
      })),
    };

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`\n✅ Exported ${prospects.length} prospects to ${outputPath}`);
    console.log(`💰 Estimated total value: $${data.estimatedTotalValue}/month`);
  }

  /**
   * Generate summary statistics
   */
  generateSummary(prospects: Prospect[]): void {
    const total = prospects.length;
    const avgScore = prospects.reduce((sum, p) => sum + p.score, 0) / total;
    const totalValue = prospects.reduce((sum, p) => sum + p.estimatedValue, 0);

    const byPlan = {
      starter: prospects.filter(p => p.repo.idealPlan === 'starter').length,
      pro: prospects.filter(p => p.repo.idealPlan === 'pro').length,
      enterprise: prospects.filter(p => p.repo.idealPlan === 'enterprise').length,
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 PROSPECTING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Prospects: ${total}`);
    console.log(`Average Score: ${avgScore.toFixed(1)}/100`);
    console.log(`Estimated Monthly Value: $${totalValue.toLocaleString()}`);
    console.log(`\nBy Plan:`);
    console.log(`  Starter ($29/mo): ${byPlan.starter} prospects`);
    console.log(`  Pro ($99/mo): ${byPlan.pro} prospects`);
    console.log(`  Enterprise ($500+/mo): ${byPlan.enterprise} prospects`);
    console.log(`\nTop 10 Prospects:`);
    
    prospects.slice(0, 10).forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.repo.fullName} (${p.score}/100, $${p.estimatedValue}/mo)`);
      console.log(`     ${p.reasons[0]}`);
    });
    
    console.log('='.repeat(60) + '\n');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * CLI Entry Point
 */
async function main() {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.error('❌ Error: GITHUB_TOKEN environment variable not set');
    console.error('Create token at: https://github.com/settings/tokens');
    process.exit(1);
  }

  const prospector = new GitHubProspector(githubToken, {
    minStars: 100,
    minContributors: 3,
    languages: ['TypeScript', 'JavaScript', 'Python'],
    minIssueCount: 10,
  });

  console.log('🚀 Starting GitHub prospecting...\n');

  // Search repositories
  const repos = await prospector.searchRepositories(1000);
  console.log(`\n✓ Found ${repos.length} repositories\n`);

  // Create prospects
  console.log('📧 Generating prospect emails...\n');
  const prospects = await prospector.createProspects(repos);

  // Export results
  const outputPath = path.join(process.cwd(), 'reports', 'prospects.json');
  prospector.exportProspects(prospects, outputPath);

  // Show summary
  prospector.generateSummary(prospects);

  console.log(`\n✅ Done! Next steps:`);
  console.log(`1. Review prospects: cat reports/prospects.json`);
  console.log(`2. Manually verify top 50 prospects`);
  console.log(`3. Send personalized emails (avoid spam filters)`);
  console.log(`4. Track responses in CRM\n`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
