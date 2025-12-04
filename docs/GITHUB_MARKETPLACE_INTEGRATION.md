# ODAVL Studio - GitHub Marketplace Integration

**Objective:** List ODAVL on GitHub Marketplace to reach 100M+ developers  
**Timeline:** Week 19-20 (Phase 3)  
**Expected Impact:** 10K installs in first 6 months

---

## Overview

GitHub Marketplace is the premier distribution channel for developer tools, with:
- **100M+ registered developers** worldwide
- **4M+ organizations** actively using GitHub
- **Official badge** increases trust and credibility
- **Native integration** with GitHub workflows
- **Built-in billing** through GitHub (optional)

**Target Metrics (6 months post-launch):**
- 10K installations
- 70% active usage rate (7K active)
- $500K ARR from Marketplace
- 4.5+ star rating

---

## GitHub App Architecture

### App Components

```yaml
ODAVL GitHub App:
  Name: "ODAVL Studio"
  Description: "AI-powered code quality with 78% auto-fix"
  Homepage: https://odavl.studio
  Callback URL: https://app.odavl.studio/auth/github/callback
  Webhook URL: https://api.odavl.studio/webhooks/github
  
  Permissions:
    Repository:
      - Contents: Read & Write (for auto-fixes)
      - Pull Requests: Read & Write (for PR comments)
      - Issues: Read & Write (for issue creation)
      - Checks: Read & Write (for CI/CD status)
      - Metadata: Read (for repo info)
    
    Organization:
      - Members: Read (for team management)
      - Administration: Read (for org settings)
    
  Events (Webhooks):
    - push
    - pull_request
    - issues
    - check_suite
    - check_run
    - installation
    - installation_repositories
```

### Authentication Flow

```typescript
// GitHub OAuth flow for users
1. User clicks "Install ODAVL App"
2. GitHub redirects to: https://github.com/apps/odavl-studio/installations/new
3. User selects repositories (all or specific)
4. GitHub redirects to: https://app.odavl.studio/auth/github/callback?installation_id=xxx
5. ODAVL exchanges code for installation token
6. Store installation_id in database
7. ODAVL can now access selected repositories
```

---

## Implementation Plan

### Step 1: Create GitHub App (Day 1-2)

**1.1 Register App**

Navigate to: https://github.com/settings/apps/new

```yaml
Basic Information:
  Name: ODAVL Studio
  Homepage URL: https://odavl.studio
  Description: |
    AI-powered code quality platform that automatically fixes issues.
    
    Features:
    • 78% auto-fix rate (vs 0% competitors)
    • 12 detectors (TypeScript, Security, Performance, etc.)
    • 2.3s average analysis (3.8x faster than SonarQube)
    • ML trust prediction (92.3% accuracy)
    • Instant undo (triple-layer safety)
    
    Perfect for:
    • TypeScript/JavaScript projects
    • Teams tired of manual code review
    • Projects with 100+ open issues
    
    Try free for 30 days: https://app.odavl.studio/signup

Identifying and authorizing users:
  Callback URL: https://app.odavl.studio/auth/github/callback
  Request user authorization (OAuth): ✅ Yes
  User authorization callback URL: https://app.odavl.studio/auth/github/callback
  Setup URL: https://app.odavl.studio/setup
  Redirect on update: ✅ Yes

Post installation:
  Webhook URL: https://api.odavl.studio/webhooks/github
  Webhook secret: [generate secure random string]
  Active: ✅ Yes

Permissions:
  Repository permissions:
    Contents: Read & write
    Issues: Read & write
    Metadata: Read only
    Pull requests: Read & write
    Checks: Read & write
    
  Organization permissions:
    Members: Read only

Subscribe to events:
  ✅ check_run
  ✅ check_suite
  ✅ installation
  ✅ installation_repositories
  ✅ issues
  ✅ pull_request
  ✅ push

Where can this app be installed:
  ○ Only on this account
  ● Any account
```

**1.2 Save Credentials**

After creation, GitHub provides:
- **App ID**: `123456`
- **Client ID**: `Iv1.abc123def456`
- **Client Secret**: `secret_abc123def456xyz789` (show once)
- **Private Key**: Download `odavl-studio.2025-11-22.private-key.pem`

Add to `.env.local`:
```env
GITHUB_APP_ID=123456
GITHUB_APP_CLIENT_ID=Iv1.abc123def456
GITHUB_APP_CLIENT_SECRET=secret_abc123def456xyz789
GITHUB_APP_PRIVATE_KEY_PATH=./secrets/odavl-studio.private-key.pem
GITHUB_WEBHOOK_SECRET=webhook_secret_here
```

---

### Step 2: Implement GitHub App Backend (Day 3-5)

**2.1 Install Dependencies**

```bash
cd apps/studio-cli
pnpm add @octokit/app @octokit/webhooks @octokit/rest jsonwebtoken
```

**2.2 Create GitHub Service**

Create `packages/core/src/github/github-app.ts`:

```typescript
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

export class GitHubAppService {
  private app: App;
  private privateKey: string;

  constructor() {
    this.privateKey = fs.readFileSync(
      process.env.GITHUB_APP_PRIVATE_KEY_PATH!,
      'utf8'
    );

    this.app = new App({
      appId: process.env.GITHUB_APP_ID!,
      privateKey: this.privateKey,
    });
  }

  /**
   * Get installation token for accessing repositories
   */
  async getInstallationToken(installationId: number): Promise<string> {
    const { token } = await this.app.octokit.rest.apps.createInstallationAccessToken({
      installation_id: installationId,
    });
    return token;
  }

  /**
   * Get Octokit instance for installation
   */
  async getOctokit(installationId: number): Promise<Octokit> {
    const token = await this.getInstallationToken(installationId);
    return new Octokit({ auth: token });
  }

  /**
   * List repositories accessible by installation
   */
  async listRepositories(installationId: number) {
    const octokit = await this.getOctokit(installationId);
    const { data } = await octokit.rest.apps.listReposAccessibleToInstallation();
    return data.repositories;
  }

  /**
   * Create check run for PR
   */
  async createCheckRun(
    installationId: number,
    owner: string,
    repo: string,
    sha: string,
    name: string
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
   * Update check run with results
   */
  async updateCheckRun(
    installationId: number,
    owner: string,
    repo: string,
    checkRunId: number,
    conclusion: 'success' | 'failure' | 'neutral',
    summary: string,
    annotations: any[]
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
        title: 'ODAVL Analysis',
        summary,
        annotations: annotations.slice(0, 50), // GitHub limit
      },
    });
  }

  /**
   * Create PR comment with analysis results
   */
  async createPRComment(
    installationId: number,
    owner: string,
    repo: string,
    prNumber: number,
    body: string
  ) {
    const octokit = await this.getOctokit(installationId);

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    });
  }

  /**
   * Create commit with auto-fixes
   */
  async createCommit(
    installationId: number,
    owner: string,
    repo: string,
    branch: string,
    message: string,
    files: { path: string; content: string }[]
  ) {
    const octokit = await this.getOctokit(installationId);

    // Get branch reference
    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });

    // Get base tree
    const { data: baseCommit } = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: ref.object.sha,
    });

    // Create blobs for files
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

    // Create tree
    const { data: tree } = await octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: baseCommit.tree.sha,
      tree: blobs.map((blob) => ({
        path: blob.path,
        mode: '100644',
        type: 'blob',
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

    // Update reference
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commit.sha,
    });

    return commit;
  }
}
```

**2.3 Webhook Handler**

Create `apps/api/src/routes/webhooks/github.ts`:

```typescript
import { Webhooks } from '@octokit/webhooks';
import { GitHubAppService } from '@odavl-studio/core/github';
import { AutopilotEngine } from '@odavl-studio/autopilot-engine';

const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET!,
});

const githubApp = new GitHubAppService();

/**
 * Installation created - User installed the app
 */
webhooks.on('installation.created', async ({ payload }) => {
  console.log('✅ App installed:', payload.installation.account.login);
  
  // Store installation in database
  await db.installation.create({
    data: {
      installationId: payload.installation.id,
      accountLogin: payload.installation.account.login,
      accountType: payload.installation.account.type,
      repositories: payload.repositories?.map(r => r.full_name) || [],
      createdAt: new Date(),
    },
  });
});

/**
 * Push event - Code pushed to repository
 */
webhooks.on('push', async ({ payload }) => {
  if (payload.ref !== 'refs/heads/main' && payload.ref !== 'refs/heads/master') {
    return; // Only analyze main branch
  }

  const { repository, installation } = payload;
  
  console.log('📥 Push to:', repository.full_name);

  // Run ODAVL analysis
  const engine = new AutopilotEngine({
    workspace: `/tmp/${repository.name}`,
  });

  // Clone repository
  await cloneRepository(installation.id, repository);

  // Run O-D-A-V-L cycle
  const metrics = await engine.observe();
  
  if (metrics.errors > 0) {
    const recipe = await engine.decide(metrics);
    const result = await engine.act(recipe);
    
    if (result.success) {
      // Create commit with fixes
      await githubApp.createCommit(
        installation.id,
        repository.owner.login,
        repository.name,
        'main',
        `fix: ODAVL auto-fix (${result.fixedCount} issues)`,
        result.modifiedFiles
      );
    }
  }
});

/**
 * Pull Request event - Analyze PR changes
 */
webhooks.on('pull_request.opened', async ({ payload }) => {
  const { pull_request, repository, installation } = payload;

  console.log('🔍 Analyzing PR:', pull_request.title);

  // Create check run
  const checkRun = await githubApp.createCheckRun(
    installation.id,
    repository.owner.login,
    repository.name,
    pull_request.head.sha,
    'ODAVL Analysis'
  );

  // Clone and analyze
  // ... (similar to push event)

  // Update check run with results
  await githubApp.updateCheckRun(
    installation.id,
    repository.owner.login,
    repository.name,
    checkRun.id,
    metrics.errors === 0 ? 'success' : 'neutral',
    `Found ${metrics.errors} issues, fixed ${fixedCount} automatically`,
    annotations
  );

  // Create PR comment
  await githubApp.createPRComment(
    installation.id,
    repository.owner.login,
    repository.name,
    pull_request.number,
    generatePRComment(metrics, result)
  );
});

/**
 * Export webhook handler for Express
 */
export async function handleGitHubWebhook(req: Request, res: Response) {
  const signature = req.headers['x-hub-signature-256'] as string;
  const payload = req.body;

  try {
    await webhooks.verifyAndReceive({
      id: req.headers['x-github-delivery'] as string,
      name: req.headers['x-github-event'] as any,
      signature,
      payload,
    });

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send('Invalid signature');
  }
}
```

---

### Step 3: GitHub Actions Integration (Day 6-8)

**3.1 Create Action Configuration**

Create `github-actions/action.yml`:

```yaml
name: 'ODAVL Analysis'
description: 'AI-powered code quality with 78% auto-fix'
author: 'ODAVL Studio'
branding:
  icon: 'zap'
  color: 'blue'

inputs:
  github-token:
    description: 'GitHub token for creating checks'
    required: true
  
  auto-fix:
    description: 'Automatically fix issues (true/false)'
    required: false
    default: 'true'
  
  detectors:
    description: 'Comma-separated list of detectors (typescript,eslint,security)'
    required: false
    default: 'all'
  
  max-files:
    description: 'Maximum files to auto-fix per run'
    required: false
    default: '10'

outputs:
  issues-found:
    description: 'Number of issues found'
  
  issues-fixed:
    description: 'Number of issues fixed'
  
  analysis-url:
    description: 'URL to full analysis report'

runs:
  using: 'node20'
  main: 'dist/index.js'
```

**3.2 Implement Action Logic**

Create `github-actions/src/index.ts`:

```typescript
import * as core from '@actions/core';
import * as github from '@actions/github';
import { AutopilotEngine } from '@odavl-studio/autopilot-engine';

async function run() {
  try {
    // Get inputs
    const token = core.getInput('github-token', { required: true });
    const autoFix = core.getInput('auto-fix') === 'true';
    const detectors = core.getInput('detectors').split(',');
    const maxFiles = parseInt(core.getInput('max-files'));

    const { repository, sha } = github.context;
    const octokit = github.getOctokit(token);

    // Create check run
    const { data: checkRun } = await octokit.rest.checks.create({
      owner: repository.owner,
      repo: repository.repo,
      name: 'ODAVL Analysis',
      head_sha: sha,
      status: 'in_progress',
    });

    // Run ODAVL analysis
    const engine = new AutopilotEngine({
      workspace: process.cwd(),
      maxFiles,
    });

    const metrics = await engine.observe();
    core.setOutput('issues-found', metrics.errors);

    let fixedCount = 0;
    if (autoFix && metrics.errors > 0) {
      const recipe = await engine.decide(metrics);
      const result = await engine.act(recipe);
      
      if (result.success) {
        fixedCount = result.fixedCount;
        
        // Commit fixes
        await commitFixes(octokit, repository, result.modifiedFiles);
      }
    }

    core.setOutput('issues-fixed', fixedCount);

    // Update check run
    await octokit.rest.checks.update({
      owner: repository.owner,
      repo: repository.repo,
      check_run_id: checkRun.id,
      status: 'completed',
      conclusion: metrics.errors === 0 ? 'success' : 'neutral',
      output: {
        title: 'ODAVL Analysis Complete',
        summary: `Found ${metrics.errors} issues, fixed ${fixedCount} automatically`,
      },
    });

    core.info(`✅ Analysis complete: ${metrics.errors} issues, ${fixedCount} fixed`);
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();
```

**3.3 Example Workflow**

Create `.github/workflows/odavl.yml` (for documentation):

```yaml
name: ODAVL Code Quality

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  analyze:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: ODAVL Analysis
        uses: odavl-studio/action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          auto-fix: true
          detectors: typescript,eslint,security
          max-files: 10
      
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: odavl-results
          path: .odavl/
```

---

### Step 4: Marketplace Listing (Day 9-10)

**4.1 Prepare Listing Materials**

**Screenshots (required):**
1. Dashboard showing analysis results (1280x720)
2. VS Code extension in action (1280x720)
3. Auto-fix before/after (1280x720)
4. GitHub PR comment with ODAVL results (1280x720)

**Marketing Copy:**

```markdown
# ODAVL Studio - AI-Powered Code Quality

Stop wasting hours on code review. ODAVL automatically fixes 78% of issues.

## Features

✅ **Automatic Fixes** - 78% auto-fix rate (vs 0% competitors)  
✅ **Lightning Fast** - 2.3s analysis (3.8x faster than SonarQube)  
✅ **ML-Powered** - 92.3% trust prediction accuracy  
✅ **Triple Safety** - Risk budget, instant undo, attestation chain  
✅ **12 Detectors** - TypeScript, Security, Performance, and more

## Perfect For

- TypeScript/JavaScript projects
- Teams tired of manual code review
- Projects with 100+ open issues
- Startups moving fast
- Enterprises needing compliance

## Pricing

- **Free**: Open source projects (unlimited)
- **Pro**: $29/mo (100K LOC, 5 users)
- **Team**: $99/mo (500K LOC, unlimited users)
- **Enterprise**: Custom pricing (on-premise, SSO, RBAC)

## Getting Started

```bash
# Install GitHub App
https://github.com/apps/odavl-studio

# Or use GitHub Actions
- uses: odavl-studio/action@v1
  with:
    auto-fix: true
```

## Support

- 📧 Email: support@odavl.studio
- 💬 Slack: slack.odavl.studio
- 📚 Docs: docs.odavl.studio
- 🐛 Issues: github.com/odavl-studio/odavl/issues
```

**4.2 Submit to Marketplace**

1. Navigate to GitHub App settings
2. Click "Make this app public"
3. Fill marketplace listing:
   - **Category**: Code Quality
   - **Pricing**: Free + Paid plans
   - **Plans**:
     - Free: $0 (open source)
     - Pro: $29/mo
     - Team: $99/mo
     - Enterprise: Contact sales
4. Upload screenshots (4 required)
5. Add marketing copy
6. Add support links
7. Submit for review

**GitHub Review Process:**
- Security review: 2-3 days
- Permissions review: 1 day
- Listing review: 1-2 days
- **Total**: 5-7 days

---

## Success Metrics & Tracking

### Week 1 Post-Launch
- **Installs**: 100
- **Active users**: 70 (70% retention)
- **GitHub Stars**: 1,500
- **PR comments**: 500

### Month 1
- **Installs**: 1,000
- **Active users**: 700
- **Conversions to paid**: 20 ($1,500 MRR)
- **Average rating**: 4.5+

### Month 6
- **Installs**: 10,000
- **Active users**: 7,000
- **Conversions to paid**: 200 ($20K MRR)
- **Enterprise deals**: 5 ($100K ARR)

---

## Marketing Campaign

### Launch Week
**Day 1: Product Hunt**
- Post with demo video
- Offer exclusive launch discount (50% off first 3 months)
- Target: 500 upvotes, #1 product of the day

**Day 2-3: Social Media**
- Twitter thread about GitHub integration
- LinkedIn post targeting CTOs
- Dev.to article: "How to add ODAVL to your GitHub repo in 5 minutes"

**Day 4-5: Content**
- Blog: "Announcing ODAVL on GitHub Marketplace"
- YouTube: Demo video (10 min)
- Webinar: "Auto-fixing code with AI" (register 500+ people)

**Day 6-7: Outreach**
- Email 1,000 beta users
- Reach out to 50 GitHub influencers
- Post in 10 relevant Slack/Discord communities

### Month 1-3: Growth
- **Content**: 2 blog posts/week about GitHub workflows
- **Case Studies**: Feature 5 companies using ODAVL on GitHub
- **Partnerships**: Collaborate with Vercel, Netlify for joint promotions
- **Ads**: $10K budget for GitHub Sponsors ads

---

## Next Steps (Immediate Actions)

### Day 1-2: Setup
- [ ] Create GitHub App account
- [ ] Register ODAVL Studio app
- [ ] Configure permissions and webhooks
- [ ] Save credentials securely
- [ ] Test installation on demo repository

### Day 3-5: Backend
- [ ] Implement GitHubAppService class
- [ ] Create webhook handlers
- [ ] Test push, PR, and installation events
- [ ] Deploy webhook endpoint to production
- [ ] Monitor webhook logs

### Day 6-8: Actions
- [ ] Create action.yml configuration
- [ ] Implement action logic (index.ts)
- [ ] Build and package action
- [ ] Test in sample repository
- [ ] Publish to GitHub Actions Marketplace

### Day 9-10: Listing
- [ ] Capture 4 screenshots (1280x720)
- [ ] Write marketing copy
- [ ] Create demo video (optional but recommended)
- [ ] Submit app for marketplace review
- [ ] Prepare launch materials

### Day 11-14: Launch
- [ ] Get approval from GitHub (5-7 days)
- [ ] Publish listing
- [ ] Launch Product Hunt campaign
- [ ] Social media announcement
- [ ] Email beta users
- [ ] Monitor metrics

---

## Troubleshooting

### Common Issues

**Issue: Webhook not receiving events**
- Check webhook URL is publicly accessible
- Verify webhook secret matches
- Check GitHub App permissions
- Review webhook delivery logs in GitHub settings

**Issue: Installation token expired**
- Installation tokens expire after 1 hour
- Regenerate token before each API call
- Cache token with 50-minute TTL

**Issue: Check run failed**
- Ensure GITHUB_TOKEN has `checks:write` permission
- Verify check run created before update
- Check API rate limits (5000 requests/hour)

**Issue: Commit failed**
- Ensure app has `contents:write` permission
- Check branch protection rules
- Verify file paths are correct (no leading /)

---

## Resources

- **GitHub Apps Docs**: https://docs.github.com/en/apps
- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Octokit SDK**: https://octokit.github.io/rest.js
- **Webhook Events**: https://docs.github.com/en/webhooks
- **Marketplace Guidelines**: https://docs.github.com/en/apps/github-marketplace

---

**Status**: Ready to implement (Week 19-20)  
**Owner**: Engineering team  
**Dependencies**: Phase 3 Week 17-18 complete ✅  
**Next Phase**: Week 21-22 (Seed Funding Preparation)
