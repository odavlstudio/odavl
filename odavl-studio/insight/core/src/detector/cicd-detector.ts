/**
 * CI/CD Detector - Analyzes GitHub Actions, Vercel, and CI/CD workflows
 * 
 * Detects:
 * - Workflow syntax errors
 * - Security vulnerabilities in workflows
 * - Performance issues in CI/CD pipelines
 * - Deployment configuration problems
 * - Build optimization opportunities
 * 
 * @since Week 13-14 (December 2025)
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as yaml from 'yaml';
import type { DetectorConfig, Issue } from '../types.js';

export interface CICDDetectorConfig extends DetectorConfig {
  /**
   * Check GitHub Actions workflows
   * @default true
   */
  checkGitHubActions?: boolean;

  /**
   * Check Vercel configuration
   * @default true
   */
  checkVercel?: boolean;

  /**
   * Check for security issues
   * @default true
   */
  checkSecurity?: boolean;

  /**
   * Check for performance issues
   * @default true
   */
  checkPerformance?: boolean;

  /**
   * Minimum cache hit rate (0-1)
   * @default 0.8
   */
  minCacheHitRate?: number;

  /**
   * Maximum workflow duration (seconds)
   * @default 600
   */
  maxWorkflowDuration?: number;
}

export interface CICDIssue extends Issue {
  workflowFile?: string;
  jobName?: string;
  stepName?: string;
  configFile?: string;
}

export interface CICDMetrics {
  totalWorkflows: number;
  totalJobs: number;
  totalSteps: number;
  securityIssues: number;
  performanceIssues: number;
  hasVercelConfig: boolean;
  averageBuildTime: number;
  cacheHitRate: number;
  cicdScore: number;
}

interface WorkflowJob {
  name?: string;
  'runs-on'?: string | string[];
  steps?: WorkflowStep[];
  needs?: string | string[];
  strategy?: {
    matrix?: Record<string, unknown>;
  };
}

interface WorkflowStep {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
  env?: Record<string, unknown>;
}

interface GitHubWorkflow {
  name?: string;
  on?: unknown;
  jobs?: Record<string, WorkflowJob>;
  env?: Record<string, unknown>;
}

interface VercelConfig {
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  devCommand?: string;
  framework?: string;
  env?: Record<string, unknown>;
}

export class CICDDetector {
  private config: Required<CICDDetectorConfig>;
  private issues: CICDIssue[] = [];
  private metrics: CICDMetrics = {
    totalWorkflows: 0,
    totalJobs: 0,
    totalSteps: 0,
    securityIssues: 0,
    performanceIssues: 0,
    hasVercelConfig: false,
    averageBuildTime: 0,
    cacheHitRate: 0,
    cicdScore: 100,
  };

  constructor(config: CICDDetectorConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      severity: config.severity ?? 'medium',
      exclude: config.exclude ?? [],
      include: config.include ?? [],
      enableCache: config.enableCache ?? true,
      cacheDir: config.cacheDir ?? '.odavl/cache',
      checkGitHubActions: config.checkGitHubActions ?? true,
      checkVercel: config.checkVercel ?? true,
      checkSecurity: config.checkSecurity ?? true,
      checkPerformance: config.checkPerformance ?? true,
      minCacheHitRate: config.minCacheHitRate ?? 0.8,
      maxWorkflowDuration: config.maxWorkflowDuration ?? 600,
    };
  }

  /**
   * Analyze CI/CD configurations in workspace
   */
  async analyze(workspacePath: string): Promise<{
    issues: CICDIssue[];
    metrics: CICDMetrics;
  }> {
    this.issues = [];
    this.metrics = {
      totalWorkflows: 0,
      totalJobs: 0,
      totalSteps: 0,
      securityIssues: 0,
      performanceIssues: 0,
      hasVercelConfig: false,
      averageBuildTime: 0,
      cacheHitRate: 0,
      cicdScore: 100,
    };

    try {
      // Check GitHub Actions workflows
      if (this.config.checkGitHubActions) {
        await this.analyzeGitHubActions(workspacePath);
      }

      // Check Vercel configuration
      if (this.config.checkVercel) {
        await this.analyzeVercelConfig(workspacePath);
      }

      // Calculate final score
      this.calculateScore();

      return {
        issues: this.issues,
        metrics: this.metrics,
      };
    } catch (error) {
      throw new Error(`CI/CD analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Analyze GitHub Actions workflows
   */
  private async analyzeGitHubActions(workspacePath: string): Promise<void> {
    // First check if workspace exists
    try {
      await fs.access(workspacePath);
    } catch {
      throw new Error(`Workspace not found: ${workspacePath}`);
    }

    const workflowsDir = path.join(workspacePath, '.github', 'workflows');

    try {
      const stats = await fs.stat(workflowsDir);
      if (!stats.isDirectory()) return;
    } catch {
      // No workflows directory
      return;
    }

    try {
      const files = await fs.readdir(workflowsDir);
      const yamlFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

      for (const file of yamlFiles) {
        await this.analyzeWorkflowFile(path.join(workflowsDir, file));
      }
    } catch (error) {
      // Ignore read errors
    }
  }

  /**
   * Analyze single workflow file
   */
  private async analyzeWorkflowFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const workflow = yaml.parse(content) as GitHubWorkflow;

      this.metrics.totalWorkflows++;

      // Validate workflow structure
      if (!workflow.jobs) {
        this.addIssue({
          type: 'cicd-error',
          severity: 'critical',
          file: filePath,
          message: 'Workflow missing jobs definition',
          suggestion: 'Add jobs: section to workflow',
          workflowFile: filePath,
        });
        return;
      }

      // Analyze each job
      for (const [jobId, job] of Object.entries(workflow.jobs)) {
        this.metrics.totalJobs++;
        await this.analyzeJob(filePath, jobId, job);
      }

      // Check for security issues
      if (this.config.checkSecurity) {
        this.checkWorkflowSecurity(filePath, workflow);
      }

    } catch (error) {
      this.addIssue({
        type: 'cicd-error',
        severity: 'high',
        file: filePath,
        message: `Failed to parse workflow: ${error instanceof Error ? error.message : String(error)}`,
        suggestion: 'Check YAML syntax',
        workflowFile: filePath,
      });
    }
  }

  /**
   * Analyze workflow job
   */
  private async analyzeJob(
    filePath: string,
    jobId: string,
    job: WorkflowJob
  ): Promise<void> {
    // Check runner
    if (!job['runs-on']) {
      this.addIssue({
        type: 'cicd-error',
        severity: 'critical',
        file: filePath,
        message: `Job "${jobId}" missing runs-on`,
        suggestion: 'Add runs-on: ubuntu-latest',
        workflowFile: filePath,
        jobName: jobId,
      });
    }

    // Analyze steps
    if (job.steps) {
      for (const [index, step] of job.steps.entries()) {
        this.metrics.totalSteps++;
        this.analyzeStep(filePath, jobId, index, step);
      }
    }

    // Check for performance issues
    if (this.config.checkPerformance) {
      this.checkJobPerformance(filePath, jobId, job);
    }
  }

  /**
   * Analyze workflow step
   */
  private analyzeStep(
    filePath: string,
    jobId: string,
    stepIndex: number,
    step: WorkflowStep
  ): void {
    // Check for unverified actions
    if (step.uses) {
      const actionRef = step.uses;
      
      // Check if action is pinned to SHA
      if (!actionRef.includes('@') || actionRef.endsWith('@master') || actionRef.endsWith('@main')) {
        this.addIssue({
          type: 'security',
          severity: 'high',
          file: filePath,
          message: `Unverified action: ${actionRef}`,
          suggestion: 'Pin action to specific SHA: user/action@abc123',
          workflowFile: filePath,
          jobName: jobId,
          stepName: step.name || `Step ${stepIndex + 1}`,
        });
        this.metrics.securityIssues++;
      }
    }

    // Check for secrets in logs
    if (step.run) {
      if (step.run.includes('echo') && /\$\{\{.*secret.*\}\}/.test(step.run)) {
        this.addIssue({
          type: 'security',
          severity: 'critical',
          file: filePath,
          message: 'Potential secret exposure in echo command',
          suggestion: 'Never echo secrets, use environment variables',
          workflowFile: filePath,
          jobName: jobId,
          stepName: step.name || `Step ${stepIndex + 1}`,
        });
        this.metrics.securityIssues++;
      }
    }
  }

  /**
   * Check workflow security issues
   */
  private checkWorkflowSecurity(filePath: string, workflow: GitHubWorkflow): void {
    // Check for pull_request_target without approval
    if (workflow.on) {
      const onValue = typeof workflow.on === 'string' ? workflow.on : workflow.on;
      const hasPRTarget = typeof onValue === 'object' && onValue !== null && 'pull_request_target' in onValue;
      
      if (hasPRTarget) {
        this.addIssue({
          type: 'security',
          severity: 'critical',
          file: filePath,
          message: 'Using pull_request_target without approval check',
          suggestion: 'Add approval requirement or use pull_request instead',
          workflowFile: filePath,
        });
        this.metrics.securityIssues++;
      }
    }

    // Check for hardcoded secrets
    const workflowStr = JSON.stringify(workflow);
    if (/['\"](?:ghp_|github_pat_)[a-zA-Z0-9]{36,}['\"]/.test(workflowStr)) {
      this.addIssue({
        type: 'security',
        severity: 'critical',
        file: filePath,
        message: 'Hardcoded GitHub token detected',
        suggestion: 'Use secrets: ${{ secrets.GITHUB_TOKEN }}',
        workflowFile: filePath,
      });
      this.metrics.securityIssues++;
    }
  }

  /**
   * Check job performance issues
   */
  private checkJobPerformance(filePath: string, jobId: string, job: WorkflowJob): void {
    // Check for missing cache
    const hasCache = job.steps?.some(step => 
      step.uses?.includes('actions/cache') || step.uses?.includes('actions/setup-node')
    );

    if (!hasCache && job.steps?.some(step => step.run?.includes('npm install') || step.run?.includes('pnpm install'))) {
      this.addIssue({
        type: 'performance',
        severity: 'medium',
        file: filePath,
        message: `Job "${jobId}" missing dependency cache`,
        suggestion: 'Add actions/cache or use actions/setup-node with cache',
        workflowFile: filePath,
        jobName: jobId,
      });
      this.metrics.performanceIssues++;
    }

    // Check for matrix strategy opportunity
    if (!job.strategy?.matrix && job.steps?.some(step => 
      step.run?.includes('node') || step.run?.includes('npm')
    )) {
      this.addIssue({
        type: 'performance',
        severity: 'low',
        file: filePath,
        message: `Job "${jobId}" could benefit from matrix strategy`,
        suggestion: 'Add matrix: { node-version: [18, 20, 22] } for multi-version testing',
        workflowFile: filePath,
        jobName: jobId,
      });
    }
  }

  /**
   * Analyze Vercel configuration
   */
  private async analyzeVercelConfig(workspacePath: string): Promise<void> {
    const vercelConfigPath = path.join(workspacePath, 'vercel.json');

    try {
      const stats = await fs.stat(vercelConfigPath);
      if (!stats.isFile()) return;

      this.metrics.hasVercelConfig = true;

      const content = await fs.readFile(vercelConfigPath, 'utf-8');
      const config = JSON.parse(content) as VercelConfig;

      // Check for missing build command
      if (!config.buildCommand) {
        this.addIssue({
          type: 'cicd-error',
          severity: 'medium',
          file: vercelConfigPath,
          message: 'Missing buildCommand in vercel.json',
          suggestion: 'Add "buildCommand": "pnpm build"',
          configFile: vercelConfigPath,
        });
      }

      // Check for missing output directory
      if (!config.outputDirectory) {
        this.addIssue({
          type: 'cicd-error',
          severity: 'medium',
          file: vercelConfigPath,
          message: 'Missing outputDirectory in vercel.json',
          suggestion: 'Add "outputDirectory": ".next" or "dist"',
          configFile: vercelConfigPath,
        });
      }

      // Check for environment variables
      if (config.env) {
        for (const [key, value] of Object.entries(config.env)) {
          if (typeof value === 'string' && value.length > 0 && !value.startsWith('@')) {
            this.addIssue({
              type: 'security',
              severity: 'high',
              file: vercelConfigPath,
              message: `Environment variable "${key}" has hardcoded value`,
              suggestion: 'Use Vercel environment variables: @env-var-name',
              configFile: vercelConfigPath,
            });
            this.metrics.securityIssues++;
          }
        }
      }

    } catch {
      // No Vercel config or parse error - not an issue
    }
  }

  /**
   * Calculate CI/CD score
   */
  private calculateScore(): void {
    let score = 100;

    // Deduct for security issues
    score -= this.metrics.securityIssues * 10;

    // Deduct for performance issues
    score -= this.metrics.performanceIssues * 5;

    // Deduct for critical issues
    const criticalCount = this.issues.filter(i => i.severity === 'critical').length;
    score -= criticalCount * 15;

    // Bonus for having CI/CD setup
    if (this.metrics.totalWorkflows > 0) {
      score += 10;
    }

    // Bonus for Vercel config
    if (this.metrics.hasVercelConfig) {
      score += 5;
    }

    this.metrics.cicdScore = Math.max(0, Math.min(100, score));
  }

  /**
   * Add issue to list
   */
  private addIssue(issue: CICDIssue): void {
    this.issues.push(issue);
  }
}

/**
 * Helper function to analyze CI/CD configurations
 */
export async function analyzeCICD(
  workspacePath: string,
  config: CICDDetectorConfig = {}
): Promise<{
  issues: CICDIssue[];
  metrics: CICDMetrics;
}> {
  const detector = new CICDDetector(config);
  return detector.analyze(workspacePath);
}
