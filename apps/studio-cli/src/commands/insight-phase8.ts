/**
 * ODAVL Insight CLI - Phase 8: Cloud Integration & Plan Awareness
 * 
 * Production-ready CLI experience comparable to vercel, stripe, sentry-cli.
 * 
 * Features:
 * - Local + Cloud analysis modes
 * - Plan-aware limits with upsell messages
 * - Clean, colored output with progress indicators
 * - Status tracking for cloud analyses
 * - JSON/SARIF export options
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { createInsightClient, type InsightCloudClient } from '@odavl-studio/sdk/insight-cloud';
import { CLIAuthService } from '@odavl/core/services/cli-auth';
import {
  type InsightPlanId,
  getInsightPlan,
} from '../../../../odavl-studio/insight/core/src/config/insight-product.js';
import {
  getAnalysisLimits,
  canRunCloudAnalysis,
  getEnabledDetectors,
  type TrialConfig,
  checkDailyLimit,
  getEffectivePlanId,
} from '../../../../odavl-studio/insight/core/src/config/insight-entitlements.js';
import { analyze as analyzeLocal, type AnalyzeOptions as LocalAnalyzeOptions } from './insight-v2.js';
import { trackInsightEvent, InsightTelemetryClient, configureInsightTelemetry } from '@odavl-studio/telemetry';

/**
 * Enhanced analyze options with cloud support
 */
export interface AnalyzeOptions extends LocalAnalyzeOptions {
  cloud?: boolean;
  plan?: InsightPlanId; // For debugging/override only
}

/**
 * Status command options
 */
export interface StatusOptions {
  json?: boolean;
  last?: number;
}

/**
 * Get current plan and trial status from auth or default to FREE
 */
function getCurrentPlanAndTrial(): { 
  planId: InsightPlanId; 
  trial: { isTrial: boolean; daysRemaining?: number; trialPlanId?: InsightPlanId } 
} {
  const authService = CLIAuthService.getInstance();
  const session = authService.getSession();
  
  // If logged in and has insightPlanId claim, use it
  if (session?.insightPlanId) {
    const planId = session.insightPlanId as InsightPlanId;
    
    // Check for trial data in session
    const isTrial = session.isTrial === true;
    const trialEndsAt = session.trialEndsAt as string | undefined;
    const trialPlanId = session.trialPlanId as InsightPlanId | undefined;
    
    let daysRemaining: number | undefined;
    if (isTrial && trialEndsAt) {
      const now = new Date();
      const endDate = new Date(trialEndsAt);
      daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    return {
      planId,
      trial: {
        isTrial: isTrial && (daysRemaining ?? 0) > 0,
        daysRemaining,
        trialPlanId,
      },
    };
  }
  
  // Default to FREE for unauthenticated users
  return {
    planId: 'INSIGHT_FREE',
    trial: { isTrial: false },
  };
}

/**
 * Display enhanced limit exceeded message with upgrade benefits
 */
function showLimitExceededMessage(
  limitType: 'projects' | 'files' | 'dailyAnalyses' | 'cloudAccess',
  currentValue: number,
  maxValue: number,
  currentPlan: InsightPlanId
): void {
  console.log(chalk.yellow('\n⚠️  Plan Limit Reached\n'));

  // Specific message per limit type
  if (limitType === 'projects') {
    console.log(chalk.white(`You have ${currentValue}/${maxValue} projects. Upgrade to create more.`));
    console.log(chalk.cyan('\n✨ Upgrade Benefits:'));
    console.log(chalk.white('  • Pro: 10 projects ($29/month)'));
    console.log(chalk.white('  • Team: 50 projects + team sharing ($99/month)'));
    console.log(chalk.white('  • Enterprise: Unlimited projects ($299/month)'));
  } else if (limitType === 'files') {
    console.log(chalk.white(`This analysis contains ${currentValue} files, exceeding your limit of ${maxValue}.`));
    console.log(chalk.cyan('\n✨ Upgrade Benefits:'));
    console.log(chalk.white('  • Pro: 1,000 files per analysis ($29/month)'));
    console.log(chalk.white('  • Team: 5,000 files + team sharing ($99/month)'));
    console.log(chalk.white('  • Enterprise: Unlimited files ($299/month)'));
  } else if (limitType === 'dailyAnalyses') {
    console.log(chalk.white(`You've used all ${maxValue} analyses for today (${currentValue}/${maxValue}).`));
    console.log(chalk.cyan('\n✨ Upgrade Benefits:'));
    console.log(chalk.white('  • Pro: 50 analyses/day ($29/month)'));
    console.log(chalk.white('  • Team: 200 analyses/day + team sharing ($99/month)'));
    console.log(chalk.white('  • Enterprise: Unlimited analyses ($299/month)'));
  } else if (limitType === 'cloudAccess') {
    console.log(chalk.white('Cloud analysis is a Pro feature.'));
    console.log(chalk.cyan('\n✨ Upgrade Benefits:'));
    console.log(chalk.white('  • Pro: Cloud analysis with 90-day history ($29/month)'));
    console.log(chalk.white('  • Team: Cloud + team collaboration ($99/month)'));
    console.log(chalk.white('  • Enterprise: Cloud + custom retention ($299/month)'));
  }

  console.log(chalk.cyan('\n🔗 Upgrade Now:'));
  console.log(chalk.white('  https://odavl.com/pricing'));
  console.log(chalk.gray('  Or run: odavl insight upgrade\n'));
}

/**
 * Check if cloud analysis is available for current plan
 */
function checkCloudAccess(planId: InsightPlanId): { allowed: boolean; message?: string } {
  if (!canRunCloudAnalysis(planId)) {
    return {
      allowed: false,
      message: `Cloud analysis requires PRO plan or higher. Current plan: ${planId}`,
    };
  }
  
  return { allowed: true };
}

/**
 * Get project metadata from workspace
 */
async function getProjectMetadata(workspaceRoot: string): Promise<{
  name: string;
  gitUrl?: string;
  gitBranch?: string;
}> {
  // Try to read package.json for project name
  let projectName = path.basename(workspaceRoot);
  
  try {
    const pkgPath = path.join(workspaceRoot, 'package.json');
    const pkgContent = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);
    if (pkg.name) {
      projectName = pkg.name;
    }
  } catch {
    // Fallback to directory name
  }
  
  // Try to read git info
  let gitUrl: string | undefined;
  let gitBranch: string | undefined;
  
  try {
    const { execSync } = await import('child_process');
    
    // Get remote URL
    try {
      const remoteUrl = execSync('git config --get remote.origin.url', {
        cwd: workspaceRoot,
        encoding: 'utf-8',
      }).trim();
      gitUrl = remoteUrl;
    } catch {
      // No git or no remote
    }
    
    // Get current branch
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: workspaceRoot,
        encoding: 'utf-8',
      }).trim();
      gitBranch = branch;
    } catch {
      // No git
    }
  } catch {
    // Git not available
  }
  
  return { name: projectName, gitUrl, gitBranch };
}

/**
 * Format severity with color
 */
function formatSeverity(severity: string): string {
  switch (severity.toUpperCase()) {
    case 'CRITICAL':
      return chalk.red.bold(severity);
    case 'HIGH':
      return chalk.red(severity);
    case 'MEDIUM':
      return chalk.yellow(severity);
    case 'LOW':
      return chalk.blue(severity);
    case 'INFO':
      return chalk.gray(severity);
    default:
      return severity;
  }
}

/**
 * Display cloud analysis result summary
 */
function displayCloudSummary(analysis: any, cloudUrl: string) {
  const { totalIssues, critical, high, medium, low, info, duration } = analysis;
  
  console.log();
  console.log(boxen(
    chalk.bold.green('✅ Cloud Analysis Complete\n\n') +
    chalk.white(`Total Issues: ${chalk.bold(totalIssues)}\n`) +
    chalk.red(`  Critical: ${critical}\n`) +
    chalk.yellow(`  High: ${high}\n`) +
    chalk.blue(`  Medium: ${medium}\n`) +
    chalk.gray(`  Low: ${low}\n`) +
    chalk.gray(`  Info: ${info}\n\n`) +
    chalk.white(`Duration: ${duration ? `${(duration / 1000).toFixed(1)}s` : 'N/A'}\n\n`) +
    chalk.cyan(`View in dashboard:\n`) +
    chalk.underline(cloudUrl),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green',
    }
  ));
}

/**
 * Display upsell message for plan limits
 */
function displayUpsellMessage(reason: string) {
  console.log();
  console.log(boxen(
    chalk.yellow.bold('⚠️  Plan Limit Reached\n\n') +
    chalk.white(`${reason}\n\n`) +
    chalk.cyan('Upgrade to unlock:\n') +
    chalk.white('  • Unlimited cloud analyses\n') +
    chalk.white('  • All 16 detectors\n') +
    chalk.white('  • 90-day history\n') +
    chalk.white('  • Team collaboration\n\n') +
    chalk.gray('Run ') + chalk.cyan('odavl insight plans') + chalk.gray(' to see options\n') +
    chalk.gray('Or visit: ') + chalk.underline('https://cloud.odavl.studio/pricing'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'yellow',
    }
  ));
}

/**
 * Enhanced analyze command with cloud support and trial awareness
 */
export async function analyze(options: AnalyzeOptions = {}) {
  const workspaceRoot = options.dir || process.cwd();
  const { planId: basePlanId, trial } = getCurrentPlanAndTrial();
  const planId = options.plan || basePlanId;
  
  // Initialize telemetry
  const authService = CLIAuthService.getInstance();
  const session = authService.getSession();
  const userId = session?.email ? InsightTelemetryClient.hashUserId(session.email) : 'anonymous';
  const sessionId = InsightTelemetryClient.generateSessionId();
  
  configureInsightTelemetry({
    enabled: true, // TODO: Read from ~/.odavlrc.json config
    userId,
    sessionId,
    workspaceRoot,
    logLocally: true,
  });
  
  // Track CLI scan triggered
  await trackInsightEvent('insight.cli_scan_triggered', {
    command: options.cloud ? 'analyze --cloud' : 'analyze',
    hasDetectors: !!options.detectors,
    detectors: options.detectors?.split(',') || [],
  }, {
    userId,
    planId,
    isTrial: trial.isTrial,
    source: 'cli',
  });
  
  // Create trial config for entitlements
  const trialConfig = trial.isTrial ? {
    isTrial: true,
    trialPlanId: trial.trialPlanId,
    daysRemaining: trial.daysRemaining,
    trialEndsAt: undefined,
  } : undefined;
  
  const plan = getInsightPlan(planId);
  const limits = getAnalysisLimits(planId, trialConfig);
  
  // Cloud analysis requested
  if (options.cloud) {
    console.log(chalk.cyan.bold('☁️  ODAVL Insight Cloud Analysis\n'));
    
    // Check if user is authenticated
    const authService = CLIAuthService.getInstance();
    if (!authService.isAuthenticated()) {
      console.log(chalk.red('❌ Not authenticated. Please run:'));
      console.log(chalk.cyan('   odavl auth login\n'));
      process.exit(1);
    }
    
    // Check cloud access for plan
    const cloudAccess = checkCloudAccess(planId);
    if (!cloudAccess.allowed) {
      // Track limit exceeded
      await trackInsightEvent('insight.limit_hit', {
        limitType: 'cloudAccess',
        currentPlan: planId,
        clickedUpgrade: false,
      }, {
        userId,
        planId,
        source: 'cli',
      });
      
      showLimitExceededMessage('cloudAccess', 0, 0, planId);
      process.exit(1);
    }
    
    // Get project metadata
    const spinner = ora('Preparing workspace metadata...').start();
    const metadata = await getProjectMetadata(workspaceRoot);
    spinner.succeed(`Project: ${metadata.name}`);
    
    // Create cloud client
    const session = authService.getSession();
    const client = createInsightClient({
      accessToken: session?.apiKey,
      baseUrl: process.env.ODAVL_CLOUD_URL || 'https://cloud.odavl.studio',
    });
    
    // Check or create project
    spinner.start('Finding or creating project...');
    let projectId: string | undefined;
    
    try {
      const projectsResult = await client.listProjects({ search: metadata.name, pageSize: 1 });
      
      if (projectsResult.success && projectsResult.data.projects.length > 0) {
        projectId = projectsResult.data.projects[0].id;
        spinner.succeed(`Using existing project: ${metadata.name}`);
      } else {
        // Create new project
        const createResult = await client.createProject({
          name: metadata.name,
          gitUrl: metadata.gitUrl,
          gitBranch: metadata.gitBranch,
        });
        
        if (!createResult.success) {
          spinner.fail('Failed to create project');
          console.log(chalk.red(`Error: ${createResult.error.message || createResult.error.error}\n`));
          process.exit(1);
        }
        
        projectId = createResult.data.id;
        spinner.succeed(`Created project: ${metadata.name}`);
      }
    } catch (error) {
      spinner.fail('Failed to access cloud');
      console.log(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}\n`));
      process.exit(1);
    }
    
    // Track cloud analysis start
    const detectorList = options.detectors?.split(',') || ['all'];
    await trackInsightEvent('insight.cloud_analysis_started', {
      projectId: projectId!,
      detectors: detectorList,
    }, {
      userId,
      planId,
      source: 'cli',
    });
    
    // Start analysis
    const startTime = Date.now();
    spinner.start('Starting cloud analysis...');
    const startResult = await client.startAnalysis({
      projectId: projectId!,
      detectors: options.detectors?.split(','),
      language: options.files?.endsWith('.py') ? 'python' : 'typescript',
      path: workspaceRoot,
    });
    
    if (!startResult.success) {
      spinner.fail('Failed to start analysis');
      console.log(chalk.red(`Error: ${startResult.error.message || startResult.error.error}\n`));
      
      // Check for plan limits in error
      if (startResult.error.statusCode === 429) {
        displayUpsellMessage('You\'ve reached your analysis limit for this billing period.');
      }
      
      process.exit(1);
    }
    
    const analysisId = startResult.data.id;
    spinner.succeed(`Analysis started: ${analysisId}`);
    
    // Poll for completion
    console.log(chalk.gray('\nWaiting for analysis to complete...\n'));
    
    const pollResult = await client.pollAnalysis(
      analysisId,
      (progress, status) => {
        const statusIcon = status === 'RUNNING' ? '⏳' : status === 'COMPLETED' ? '✅' : '❌';
        const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
        process.stdout.write(`\r${statusIcon} ${progressBar} ${progress}% `);
      },
      150 // 5 minutes max
    );
    
    console.log(); // newline after progress
    
    // Track cloud analysis completed
    const duration = Date.now() - startTime;
    const success = pollResult.success && pollResult.data.status === 'COMPLETED';
    
    if (success) {
      const result = pollResult.data;
      await trackInsightEvent('insight.cloud_analysis_completed', {
        analysisId,
        projectId: projectId!,
        durationMs: duration,
        issuesFound: result.summary?.totalIssues || 0,
        criticalCount: result.summary?.critical || 0,
        highCount: result.summary?.high || 0,
        mediumCount: result.summary?.medium || 0,
        lowCount: result.summary?.low || 0,
        success: true,
      }, {
        userId,
        planId,
        source: 'cli',
      });
    } else {
      await trackInsightEvent('insight.cloud_analysis_completed', {
        analysisId,
        projectId: projectId!,
        durationMs: duration,
        issuesFound: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        success: false,
      }, {
        userId,
        planId,
        source: 'cli',
      });
    }
    
    if (!pollResult.success) {
      console.log(chalk.red(`❌ Analysis failed: ${pollResult.error.message || pollResult.error.error}\n`));
      process.exit(1);
    }
    
    const analysis = pollResult.data;
    
    if (analysis.status === 'FAILED') {
      console.log(chalk.red('❌ Analysis failed on server\n'));
      process.exit(1);
    }
    
    // Display results
    const cloudUrl = `https://cloud.odavl.studio/insight/analyses/${analysisId}`;
    displayCloudSummary(analysis, cloudUrl);
    
    // Save result locally for status command
    const resultPath = path.join(workspaceRoot, '.odavl', 'last-cloud-analysis.json');
    await fs.mkdir(path.dirname(resultPath), { recursive: true });
    await fs.writeFile(resultPath, JSON.stringify({
      analysisId,
      projectId,
      timestamp: new Date().toISOString(),
      result: analysis,
      cloudUrl,
    }, null, 2));
    
    // Exit with error code if critical issues found
    if (options.strict && analysis.critical > 0) {
      process.exit(1);
    }
    
    return;
  }
  
  // Local analysis (existing behavior)
  console.log(chalk.cyan.bold('💻 ODAVL Insight Local Analysis\n'));
  console.log(chalk.gray(`Plan: ${plan.displayName} (${getEnabledDetectors(planId).length} detectors enabled)\n`));
  
  // Check file limits
  if (limits.maxFilesPerAnalysis !== 'unlimited') {
    console.log(chalk.yellow(`ℹ️  File limit: ${limits.maxFilesPerAnalysis} files per analysis\n`));
  }
  
  // Track local analysis started
  const localStartTime = Date.now();
  const detectorList = options.detectors?.split(',') || getEnabledDetectors(planId);
  
  // Estimate file count for telemetry (privacy-preserving bucket)
  let fileCount = 0;
  try {
    const files = await fs.readdir(workspaceRoot, { recursive: true });
    fileCount = files.filter((f: any) => typeof f === 'string' && /\.(ts|js|tsx|jsx|py|java|go|rs)$/.test(f)).length;
  } catch {
    fileCount = 0;
  }
  
  await trackInsightEvent('insight.analysis_started', {
    mode: 'local',
    detectors: detectorList,
    fileCountBucket: InsightTelemetryClient.binFileCount(fileCount),
    languages: ['typescript'], // TODO: Detect from files
  }, {
    userId,
    planId,
    source: 'cli',
  });
  
  // Run local analysis
  try {
    await analyzeLocal(options);
    
    // Track local analysis completed (success)
    const localDuration = Date.now() - localStartTime;
    
    // Try to read result from saved file
    let issuesFound = 0;
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    
    try {
      const localPath = path.join(workspaceRoot, '.odavl', 'last-analysis.json');
      const localData = JSON.parse(await fs.readFile(localPath, 'utf-8'));
      issuesFound = localData.summary?.total || 0;
      criticalCount = localData.summary?.critical || 0;
      highCount = localData.summary?.high || 0;
      mediumCount = localData.summary?.medium || 0;
      lowCount = localData.summary?.low || 0;
    } catch {
      // Could not read saved result
    }
    
    await trackInsightEvent('insight.analysis_completed', {
      mode: 'local',
      analysisId: `cli-local-${Date.now()}`,
      durationMs: localDuration,
      issuesFound,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      issueCategories: {},
      success: true,
    }, {
      userId,
      planId,
      source: 'cli',
    });
  } catch (error) {
    // Track local analysis failed
    const localDuration = Date.now() - localStartTime;
    
    await trackInsightEvent('insight.analysis_completed', {
      mode: 'local',
      analysisId: `cli-local-${Date.now()}`,
      durationMs: localDuration,
      issuesFound: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      issueCategories: {},
      success: false,
    }, {
      userId,
      planId,
      source: 'cli',
    });
    
    throw error;
  }
  
  // Show cloud upsell if not authenticated
  if (!canRunCloudAnalysis(planId)) {
    console.log();
    console.log(chalk.cyan('💡 Tip: ') + chalk.white('Upgrade to PRO for cloud analysis with history and team collaboration'));
    console.log(chalk.gray('   Run ') + chalk.cyan('odavl insight plans') + chalk.gray(' to see options\n'));
  }
}

/**
 * Status command - show last analysis status
 */
export async function status(options: StatusOptions = {}) {
  const workspaceRoot = process.cwd();
  
  if (options.json) {
    // JSON output
    const localPath = path.join(workspaceRoot, '.odavl', 'last-analysis.json');
    const cloudPath = path.join(workspaceRoot, '.odavl', 'last-cloud-analysis.json');
    
    const result: any = {
      local: null,
      cloud: null,
    };
    
    try {
      const localData = await fs.readFile(localPath, 'utf-8');
      result.local = JSON.parse(localData);
    } catch {
      // No local analysis
    }
    
    try {
      const cloudData = await fs.readFile(cloudPath, 'utf-8');
      result.cloud = JSON.parse(cloudData);
    } catch {
      // No cloud analysis
    }
    
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  
  // Human-readable output
  console.log();
  console.log(chalk.cyan.bold('📊 ODAVL Insight Analysis Status\n'));
  
  // Local analysis status
  try {
    const localPath = path.join(workspaceRoot, '.odavl', 'last-analysis.json');
    const localData = JSON.parse(await fs.readFile(localPath, 'utf-8'));
    
    console.log(chalk.white.bold('💻 Local Analysis:'));
    console.log(chalk.gray('   Timestamp: ') + chalk.white(new Date(localData.timestamp).toLocaleString()));
    console.log(chalk.gray('   Issues:    ') + chalk.white(localData.summary?.total || 0));
    console.log(chalk.gray('   Critical:  ') + formatSeverity(`${localData.summary?.critical || 0} CRITICAL`));
    console.log();
  } catch {
    console.log(chalk.gray('💻 Local Analysis: No recent analysis found\n'));
  }
  
  // Cloud analysis status
  try {
    const cloudPath = path.join(workspaceRoot, '.odavl', 'last-cloud-analysis.json');
    const cloudData = JSON.parse(await fs.readFile(cloudPath, 'utf-8'));
    
    console.log(chalk.white.bold('☁️  Cloud Analysis:'));
    console.log(chalk.gray('   Timestamp: ') + chalk.white(new Date(cloudData.timestamp).toLocaleString()));
    console.log(chalk.gray('   Issues:    ') + chalk.white(cloudData.result.totalIssues));
    console.log(chalk.gray('   Critical:  ') + formatSeverity(`${cloudData.result.critical} CRITICAL`));
    console.log(chalk.gray('   Dashboard: ') + chalk.cyan.underline(cloudData.cloudUrl));
    console.log();
  } catch {
    console.log(chalk.gray('☁️  Cloud Analysis: No recent analysis found\n'));
  }
}

/**
 * Login command - alias to auth login
 */
export async function login() {
  const { loginCommand } = await import('./auth.js');
  await loginCommand.parseAsync(['login'], { from: 'user' });
}
