/**
 * Analysis Engine - Calls real Insight Core detectors
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { glob } from 'glob';
import type {
  AnalysisEngine,
  AnalysisResult,
  AnalyzeOptions,
  InsightIssue,
  Severity,
} from './types.js';

// Import real Insight Core components
import { AnalysisEngine as CoreAnalysisEngine } from '../../core/src/analysis-engine.js';
import {
  SequentialDetectorExecutor,
  FileParallelDetectorExecutor,
} from '../../core/src/detector-executor.js';
import {
  loadDetector,
  type DetectorName,
} from '../../core/src/detector/detector-loader.js';

export class RealAnalysisEngine implements AnalysisEngine {
  async analyze(targetPath: string, options: AnalyzeOptions): Promise<AnalysisResult> {
    const startTime = Date.now();

    // Resolve absolute path
    const absolutePath = path.resolve(targetPath);

    // Check if path exists
    try {
      await fs.access(absolutePath);
    } catch (error) {
      throw new Error(`Path does not exist: ${absolutePath}`);
    }

    // Collect files to analyze
    const files = await this.collectFiles(absolutePath, options.changedOnly);

    if (files.length === 0) {
      return {
        issues: [],
        summary: {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
        },
        metadata: {
          analyzedFiles: 0,
          duration: Date.now() - startTime,
          detectors: options.detectors || [],
        },
      };
    }

    // Select execution mode (CI = sequential for deterministic, otherwise file-parallel for speed)
    const executor = options.ci
      ? new SequentialDetectorExecutor()
      : new FileParallelDetectorExecutor();

    // Create analysis engine
    const engine = new CoreAnalysisEngine(executor);

    // Run analysis
    const coreResults = await engine.analyze(files);

    // Convert core results to CLI format
    const issues = this.convertIssues(coreResults);

    // Calculate summary
    const summary = this.calculateSummary(issues);

    // Get list of detectors used
    const detectorsUsed = options.detectors || this.getDefaultDetectors();

    return {
      issues,
      summary,
      metadata: {
        analyzedFiles: files.length,
        duration: Date.now() - startTime,
        detectors: detectorsUsed,
      },
    };
  }

  private async collectFiles(rootPath: string, changedOnly: boolean): Promise<string[]> {
    const stat = await fs.stat(rootPath);

    if (stat.isFile()) {
      return [rootPath];
    }

    // Directory - collect TypeScript and JavaScript files
    const patterns = [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
    ];

    const ignore = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.test.ts',
      '**/*.spec.ts',
    ];

    const allFiles: string[] = [];

    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: rootPath,
        absolute: true,
        ignore,
        nodir: true,
      });
      allFiles.push(...matches);
    }

    // If changed-only, filter to git changed files
    if (changedOnly) {
      return this.filterChangedFiles(allFiles, rootPath);
    }

    return allFiles;
  }

  private async filterChangedFiles(files: string[], cwd: string): Promise<string[]> {
    try {
      const { exec } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const execAsync = promisify(exec);

      // Get changed files from git
      const { stdout } = await execAsync('git diff --name-only HEAD', { cwd });
      const changedFiles = stdout
        .split('\n')
        .filter(Boolean)
        .map((file) => path.resolve(cwd, file));

      // Filter files to only those that changed
      return files.filter((file) => changedFiles.includes(file));
    } catch (error) {
      // Git not available or not a git repo - return all files
      return files;
    }
  }

  private convertIssues(coreResults: any[]): InsightIssue[] {
    const issues: InsightIssue[] = [];

    for (const result of coreResults) {
      if (!result.issues || result.issues.length === 0) continue;

      for (const issue of result.issues) {
        issues.push({
          file: result.file,
          line: issue.line || 1,
          column: issue.column || 0,
          severity: this.normalizeSeverity(issue.severity || issue.effectiveSeverity),
          message: issue.message,
          detector: issue.detector,
          ruleId: issue.ruleId,
          suggestedFix: issue.suggestedFix,
        });
      }
    }

    return issues;
  }

  private normalizeSeverity(severity: any): Severity {
    if (typeof severity === 'number') {
      // Map numeric severity to string
      if (severity >= 90) return 'critical';
      if (severity >= 70) return 'high';
      if (severity >= 50) return 'medium';
      if (severity >= 30) return 'low';
      return 'info';
    }

    const severityStr = String(severity).toLowerCase();
    if (['critical', 'high', 'medium', 'low', 'info'].includes(severityStr)) {
      return severityStr as Severity;
    }

    return 'medium'; // Default
  }

  private calculateSummary(issues: InsightIssue[]) {
    return {
      total: issues.length,
      critical: issues.filter((i) => i.severity === 'critical').length,
      high: issues.filter((i) => i.severity === 'high').length,
      medium: issues.filter((i) => i.severity === 'medium').length,
      low: issues.filter((i) => i.severity === 'low').length,
      info: issues.filter((i) => i.severity === 'info').length,
    };
  }

  private getDefaultDetectors(): string[] {
    return [
      'typescript',
      'eslint',
      'security',
      'performance',
      'complexity',
      'import',
      'package',
      'runtime',
      'build',
      'network',
      'isolation',
    ];
  }
}
