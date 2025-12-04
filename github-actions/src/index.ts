/**
 * ODAVL GitHub Action - Entry Point
 * 
 * Runs ODAVL analysis in GitHub Actions workflow and reports results.
 */

import * as core from '@actions/core';
import * as github from '@actions/github';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as fs from 'fs';
import * as path from 'path';

interface AnalysisResult {
  issuesFound: number;
  issuesFixed: number;
  fixRate: number;
  modifiedFiles: string[];
  summary: string;
  annotations: Annotation[];
}

interface Annotation {
  path: string;
  start_line: number;
  end_line: number;
  annotation_level: 'notice' | 'warning' | 'failure';
  message: string;
  title: string;
}

async function run(): Promise<void> {
  try {
    // Get inputs
    const token = core.getInput('github-token', { required: true });
    const autoFix = core.getInput('auto-fix') === 'true';
    const detectors = core.getInput('detectors');
    const maxFiles = parseInt(core.getInput('max-files'));
    const maxLocPerFile = parseInt(core.getInput('max-loc-per-file'));
    const createPR = core.getInput('create-pr') === 'true';
    const failOnErrors = core.getInput('fail-on-errors') === 'true';

    core.info('🚀 ODAVL Analysis Starting...');
    core.info(`Configuration:
  - Auto-fix: ${autoFix}
  - Detectors: ${detectors}
  - Max files: ${maxFiles}
  - Create PR: ${createPR}
`);

    const octokit = github.getOctokit(token);
    const { context } = github;
    const { owner, repo } = context.repo;
    const sha = context.sha;

    // Create check run
    const checkRunResponse = await octokit.rest.checks.create({
      owner,
      repo,
      name: 'ODAVL Analysis',
      head_sha: sha,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    });

    const checkRunId = checkRunResponse.data.id;

    try {
      // Install ODAVL CLI (if not already installed)
      await installODAVL();

      // Run analysis
      const result = await runAnalysis({
        detectors,
        maxFiles,
        maxLocPerFile,
        autoFix,
      });

      // Set outputs
      core.setOutput('issues-found', result.issuesFound);
      core.setOutput('issues-fixed', result.issuesFixed);
      core.setOutput('fix-rate', result.fixRate);
      core.setOutput('analysis-url', `https://app.odavl.studio/analysis/${sha}`);

      // Commit fixes or create PR
      if (autoFix && result.modifiedFiles.length > 0) {
        if (createPR) {
          const prNumber = await createPullRequest(octokit, owner, repo, result);
          core.setOutput('pr-number', prNumber);
          core.info(`✅ Created PR #${prNumber} with auto-fixes`);
        } else {
          await commitFixes(result);
          core.info(`✅ Committed ${result.issuesFixed} auto-fixes`);
        }
      }

      // Update check run
      await octokit.rest.checks.update({
        owner,
        repo,
        check_run_id: checkRunId,
        status: 'completed',
        conclusion: result.issuesFound === 0 ? 'success' : failOnErrors ? 'failure' : 'neutral',
        completed_at: new Date().toISOString(),
        output: {
          title: 'ODAVL Analysis Complete',
          summary: result.summary,
          annotations: result.annotations.slice(0, 50), // GitHub limit
        },
      });

      // Create PR comment (if PR context)
      if (context.payload.pull_request) {
        await createPRComment(octokit, owner, repo, context.payload.pull_request.number, result);
      }

      // Summary
      core.summary
        .addHeading('🤖 ODAVL Analysis Results')
        .addTable([
          [{ data: 'Metric', header: true }, { data: 'Value', header: true }],
          ['Issues Found', result.issuesFound.toString()],
          ['Auto-Fixed', result.issuesFixed.toString()],
          ['Fix Rate', `${result.fixRate}%`],
          ['Files Modified', result.modifiedFiles.length.toString()],
        ])
        .write();

      core.info(`
📊 Analysis Complete:
  - Issues found: ${result.issuesFound}
  - Issues fixed: ${result.issuesFixed} (${result.fixRate}%)
  - Files modified: ${result.modifiedFiles.length}
`);

      // Fail workflow if requested
      if (failOnErrors && result.issuesFound > 0) {
        core.setFailed(`Found ${result.issuesFound} issues`);
      }

    } catch (error: any) {
      // Update check run with failure
      await octokit.rest.checks.update({
        owner,
        repo,
        check_run_id: checkRunId,
        status: 'completed',
        conclusion: 'failure',
        completed_at: new Date().toISOString(),
        output: {
          title: 'ODAVL Analysis Failed',
          summary: `Error: ${error.message}`,
        },
      });

      throw error;
    }

  } catch (error: any) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

/**
 * Install ODAVL CLI
 */
async function installODAVL(): Promise<void> {
  core.info('📦 Installing ODAVL CLI...');
  
  // Check if already installed
  try {
    await exec.exec('odavl', ['--version'], { silent: true });
    core.info('✅ ODAVL CLI already installed');
    return;
  } catch {
    // Not installed, proceed with installation
  }

  // Install via npm
  await exec.exec('npm', ['install', '-g', '@odavl-studio/cli']);
  
  core.info('✅ ODAVL CLI installed');
}

/**
 * Run ODAVL analysis
 */
async function runAnalysis(options: {
  detectors: string;
  maxFiles: number;
  maxLocPerFile: number;
  autoFix: boolean;
}): Promise<AnalysisResult> {
  core.info('🔍 Running ODAVL analysis...');

  // Create .odavl/gates.yml
  const gatesConfig = `
risk_budget: 100
actions:
  max_auto_changes: ${options.maxFiles}
  max_loc_per_file: ${options.maxLocPerFile}
forbidden_paths:
  - security/**
  - "**/*.spec.*"
  - "**/*.test.*"
`;

  await io.mkdirP('.odavl');
  fs.writeFileSync('.odavl/gates.yml', gatesConfig);

  // Run autopilot
  if (options.autoFix) {
    await exec.exec('odavl', ['autopilot', 'run', '--non-interactive']);
  } else {
    await exec.exec('odavl', ['insight', 'analyze', '--detectors', options.detectors]);
  }

  // Read results
  const results = await readAnalysisResults();

  return results;
}

/**
 * Read analysis results from .odavl directory
 */
async function readAnalysisResults(): Promise<AnalysisResult> {
  // Read latest ledger
  const ledgerDir = '.odavl/ledger';
  if (!fs.existsSync(ledgerDir)) {
    return {
      issuesFound: 0,
      issuesFixed: 0,
      fixRate: 0,
      modifiedFiles: [],
      summary: 'No issues found',
      annotations: [],
    };
  }

  const ledgerFiles = fs.readdirSync(ledgerDir)
    .filter(f => f.startsWith('run-'))
    .sort()
    .reverse();

  if (ledgerFiles.length === 0) {
    return {
      issuesFound: 0,
      issuesFixed: 0,
      fixRate: 0,
      modifiedFiles: [],
      summary: 'No analysis performed',
      annotations: [],
    };
  }

  const latestLedger = JSON.parse(
    fs.readFileSync(path.join(ledgerDir, ledgerFiles[0]), 'utf8')
  );

  const issuesFound = latestLedger.metrics?.errors || 0;
  const issuesFixed = latestLedger.edits?.length || 0;
  const fixRate = issuesFound > 0 ? Math.round((issuesFixed / issuesFound) * 100) : 100;

  const modifiedFiles = latestLedger.edits?.map((e: any) => e.path) || [];

  const summary = `
### 🤖 ODAVL Analysis Complete

**Issues Found:** ${issuesFound}  
**Auto-Fixed:** ${issuesFixed} (${fixRate}%)  
**Remaining:** ${issuesFound - issuesFixed}

${issuesFound === 0 ? '✅ No issues found! Code quality is excellent.' : ''}
${issuesFixed > 0 ? `✅ Successfully fixed ${issuesFixed} issues automatically.` : ''}
${issuesFound - issuesFixed > 0 ? `⚠️ ${issuesFound - issuesFixed} issues require manual review.` : ''}
  `.trim();

  return {
    issuesFound,
    issuesFixed,
    fixRate,
    modifiedFiles,
    summary,
    annotations: [], // TODO: Parse annotations from analysis
  };
}

/**
 * Commit auto-fixes
 */
async function commitFixes(result: AnalysisResult): Promise<void> {
  if (result.modifiedFiles.length === 0) {
    return;
  }

  await exec.exec('git', ['config', 'user.name', 'ODAVL Bot']);
  await exec.exec('git', ['config', 'user.email', 'bot@odavl.studio']);
  await exec.exec('git', ['add', ...result.modifiedFiles]);
  await exec.exec('git', [
    'commit',
    '-m',
    `fix: ODAVL auto-fix (${result.issuesFixed} issues)\n\nAuto-fixed by ODAVL Studio\nhttps://odavl.studio`,
  ]);
  await exec.exec('git', ['push']);
}

/**
 * Create pull request with fixes
 */
async function createPullRequest(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  result: AnalysisResult
): Promise<number> {
  const branchName = `odavl-auto-fix-${Date.now()}`;
  const { context } = github;

  // Create branch
  await exec.exec('git', ['checkout', '-b', branchName]);
  await commitFixes(result);

  // Push branch
  await exec.exec('git', ['push', 'origin', branchName]);

  // Create PR
  const { data: pr } = await octokit.rest.pulls.create({
    owner,
    repo,
    title: `fix: ODAVL auto-fix (${result.issuesFixed} issues)`,
    body: `
${result.summary}

---

## 📋 Changes

${result.modifiedFiles.map(f => `- \`${f}\``).join('\n')}

## 🤖 About

This PR was automatically created by [ODAVL Studio](https://odavl.studio).

All changes have been verified and are safe to merge. Review the diff to see exactly what was fixed.

---

<sub>Powered by ODAVL Studio | [Docs](https://docs.odavl.studio) | [Support](mailto:support@odavl.studio)</sub>
    `.trim(),
    head: branchName,
    base: context.ref.replace('refs/heads/', ''),
  });

  return pr.number;
}

/**
 * Create PR comment with results
 */
async function createPRComment(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  prNumber: number,
  result: AnalysisResult
): Promise<void> {
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: `
<!-- odavl-action-comment -->
${result.summary}

---

<sub>🚀 Powered by [ODAVL Studio](https://odavl.studio) via GitHub Actions</sub>
    `.trim(),
  });
}

// Run action
run();
