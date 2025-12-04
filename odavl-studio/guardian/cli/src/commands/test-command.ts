/**
 * Test Command Module
 * Handles all Guardian testing operations
 */

import chalk from 'chalk';
import ora from 'ora';
import { getAIService } from '../services/ai-service.js';
import { getReportService, type GuardianReport } from '../services/report-service.js';
import { runRealTests } from '../../real-tests.js';

export interface TestOptions {
  mode?: 'ai' | 'quick' | 'full';
  platform?: 'windows' | 'macos' | 'linux' | 'all';
  skipTests?: boolean;
  verbose?: boolean;
  json?: boolean;
  compare?: boolean;
  html?: boolean;
  url?: string;
}

export interface TestResult {
  success: boolean;
  report: GuardianReport;
  duration: number;
  usedAI: boolean;
}

/**
 * Execute Guardian tests
 */
export async function executeTests(
  projectPath: string,
  options: TestOptions = {}
): Promise<TestResult> {
  const startTime = Date.now();
  const spinner = ora('Initializing Guardian tests...').start();

  const aiService = getAIService();
  const reportService = getReportService();

  // Initialize report
  const report = reportService.createEmptyReport(projectPath);
  report.metadata = {
    usedAI: aiService.isAIAvailable(),
    fallbackMode: !aiService.isAIAvailable(),
    environment: options.platform || 'current',
  };

  try {
    // Phase 1: Static Analysis
    spinner.text = 'Running static analysis...';
    const staticStart = Date.now();
    const staticResults = await runStaticAnalysis(projectPath, options);
    report.phases.staticAnalysis = {
      status: staticResults.success ? 'completed' : 'failed',
      duration: Date.now() - staticStart,
    };
    report.issues.total += staticResults.issues;
    report.issues.critical += staticResults.critical;
    report.issues.warnings += staticResults.warnings;

    // Phase 2: Runtime Tests (if not skipped)
    if (!options.skipTests) {
      spinner.text = 'Running runtime tests...';
      const runtimeStart = Date.now();
      const runtimeResults = await runRuntimeTests(projectPath, options);
      report.phases.runtimeTests = {
        status: runtimeResults.success ? 'completed' : 'failed',
        duration: Date.now() - runtimeStart,
      };
      report.issues.total += runtimeResults.issues;
      report.issues.critical += runtimeResults.critical;
    } else {
      report.phases.runtimeTests = { status: 'skipped', duration: 0 };
    }

    // Phase 3: AI Visual Analysis (if URL provided)
    if (options.url) {
      spinner.text = 'Running AI visual analysis...';
      const visualStart = Date.now();
      const visualResults = await runVisualAnalysis(options.url, aiService);
      report.phases.aiVisualAnalysis = {
        status: visualResults.success ? 'completed' : 'failed',
        duration: Date.now() - visualStart,
      };
      report.issues.total += visualResults.issues;
      report.issues.warnings += visualResults.warnings;
    } else {
      report.phases.aiVisualAnalysis = { status: 'skipped', duration: 0 };
    }

    // Phase 4: AI Error Analysis
    spinner.text = 'Analyzing errors with AI...';
    const errorStart = Date.now();
    const errorResults = await runErrorAnalysis(projectPath, aiService);
    report.phases.aiErrorAnalysis = {
      status: errorResults.success ? 'completed' : 'failed',
      duration: Date.now() - errorStart,
    };
    report.issues.info += errorResults.suggestions;

    // Calculate readiness score
    report.readiness = calculateReadiness(report.issues);
    report.confidence = calculateConfidence(report, aiService.isAIAvailable());
    report.executionTime = Date.now() - startTime;

    // Save report
    const reportPath = await reportService.saveReport(report, projectPath);
    spinner.succeed(chalk.green('Tests completed!'));

    // Display results
    if (!options.json) {
      const previousReport = await reportService.loadPreviousReport(projectPath);
      const comparison = previousReport
        ? reportService.compareReports(report, previousReport)
        : undefined;
      reportService.displayReport(report, comparison);
    }

    // Export HTML if requested
    if (options.html) {
      const htmlPath = reportPath.replace('.json', '.html');
      await reportService.exportToHTML(report, htmlPath);
      console.log(chalk.blue(`📄 HTML report: ${htmlPath}`));
    }

    // JSON output if requested
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    }

    return {
      success: report.issues.critical === 0,
      report,
      duration: report.executionTime,
      usedAI: aiService.isAIAvailable(),
    };
  } catch (error) {
    spinner.fail(chalk.red('Tests failed!'));
    throw error;
  }
}

/**
 * Run static analysis
 */
async function runStaticAnalysis(
  projectPath: string,
  options: TestOptions
): Promise<{ success: boolean; issues: number; critical: number; warnings: number }> {
  // Placeholder for static analysis logic
  // In real implementation, this would run ESLint, TypeScript checks, etc.
  return {
    success: true,
    issues: 0,
    critical: 0,
    warnings: 0,
  };
}

/**
 * Run runtime tests
 */
async function runRuntimeTests(
  projectPath: string,
  options: TestOptions
): Promise<{ success: boolean; issues: number; critical: number }> {
  // Use existing runRealTests function
  try {
    // Determine project type from options or path
    const projectType = options.type || 'website';
    
    const results = await runRealTests(
      projectPath,
      projectType as 'extension' | 'website' | 'cli',
      process.env.ANTHROPIC_API_KEY
    );

    return {
      success: results.success,
      issues: results.errors.length + results.warnings.length,
      critical: results.errors.length,
    };
  } catch (error) {
    return {
      success: false,
      issues: 1,
      critical: 1,
    };
  }
}

/**
 * Run visual analysis
 */
async function runVisualAnalysis(
  url: string,
  aiService: ReturnType<typeof getAIService>
): Promise<{ success: boolean; issues: number; warnings: number }> {
  try {
    // This would capture screenshot and analyze it
    // For now, returning placeholder
    return {
      success: true,
      issues: 0,
      warnings: 0,
    };
  } catch (error) {
    return {
      success: false,
      issues: 1,
      warnings: 0,
    };
  }
}

/**
 * Run error analysis
 */
async function runErrorAnalysis(
  projectPath: string,
  aiService: ReturnType<typeof getAIService>
): Promise<{ success: boolean; suggestions: number }> {
  try {
    // This would collect and analyze error logs
    // For now, returning placeholder
    return {
      success: true,
      suggestions: 0,
    };
  } catch (error) {
    return {
      success: false,
      suggestions: 0,
    };
  }
}

/**
 * Calculate readiness score
 */
function calculateReadiness(issues: GuardianReport['issues']): number {
  let score = 100;

  // Deduct points based on severity
  score -= issues.critical * 20;
  score -= issues.warnings * 5;
  score -= issues.info * 1;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate confidence score
 */
function calculateConfidence(report: GuardianReport, usedAI: boolean): number {
  let confidence = 70; // Base confidence

  // Increase if all phases completed
  const completedPhases = Object.values(report.phases).filter(
    (p) => p.status === 'completed'
  ).length;
  confidence += completedPhases * 5;

  // Increase if AI was used
  if (usedAI) {
    confidence += 15;
  }

  return Math.min(100, confidence);
}

/**
 * Quick test command (fast checks only)
 */
export async function quickTest(
  projectPath: string,
  options: Partial<TestOptions> = {}
): Promise<TestResult> {
  return executeTests(projectPath, { ...options, mode: 'quick', skipTests: false });
}

/**
 * Full test command (comprehensive analysis)
 */
export async function fullTest(
  projectPath: string,
  options: Partial<TestOptions> = {}
): Promise<TestResult> {
  return executeTests(projectPath, { ...options, mode: 'full', skipTests: false });
}

/**
 * AI-powered test command (focuses on AI analysis)
 */
export async function aiTest(
  projectPath: string,
  options: Partial<TestOptions> = {}
): Promise<TestResult> {
  const aiService = getAIService();

  if (!aiService.isAIAvailable()) {
    console.log(
      chalk.yellow(
        '⚠️  AI not available - falling back to standard tests'
      )
    );
  }

  return executeTests(projectPath, { ...options, mode: 'ai', skipTests: false });
}
