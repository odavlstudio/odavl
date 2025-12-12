/**
 * @fileoverview Integrates golangci-lint for comprehensive Go linting
 * golangci-lint runs multiple linters in parallel (40+ linters)
 */

import { execSync } from 'node:child_process';
import * as path from 'node:path';
import { GoBaseDetector, type GoDetectorOptions, type GoIssue } from './go-base-detector';
import type { DetectorResult } from '../../types';

interface GolangciLintIssue {
  FromLinter: string;
  Text: string;
  Severity: string;
  SourceLines: string[];
  Pos: {
    Filename: string;
    Line: number;
    Column: number;
  };
}

interface GolangciLintOutput {
  Issues: GolangciLintIssue[];
}

export class GolangciLintDetector extends GoBaseDetector {
  constructor(options: GoDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isGoFile(filePath) && !this.isGoTestFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'golangci-lint' };
    }

    const issues: GoIssue[] = [];

    try {
      // Run golangci-lint on the file
      const result = await this.runGolangciLint(filePath);
      
      if (result?.Issues) {
        for (const issue of result.Issues) {
          issues.push(this.convertGolangciIssue(issue));
        }
      }
    } catch (error) {
      // golangci-lint not installed or failed to run
      console.warn(`golangci-lint failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      issues,
      duration: 0,
      detectorName: 'golangci-lint',
    };
  }

  /**
   * Run golangci-lint and parse JSON output
   */
  private async runGolangciLint(filePath: string): Promise<GolangciLintOutput | null> {
    try {
      const dir = path.dirname(filePath);
      
      // Run golangci-lint with JSON output
      const output = execSync(
        `golangci-lint run --out-format=json "${filePath}"`,
        {
          cwd: dir,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        }
      );

      return JSON.parse(output) as GolangciLintOutput;
    } catch (error) {
      // golangci-lint exits with non-zero when issues found
      if (error instanceof Error && 'stdout' in error) {
        const stdout = (error as { stdout: Buffer }).stdout.toString();
        if (stdout) {
          try {
            return JSON.parse(stdout) as GolangciLintOutput;
          } catch {
            return null;
          }
        }
      }
      return null;
    }
  }

  /**
   * Convert golangci-lint issue to ODAVL GoIssue
   */
  private convertGolangciIssue(issue: GolangciLintIssue): GoIssue {
    const category = this.categorizeIssue(issue.FromLinter);
    
    return this.createIssue(
      category,
      `[${issue.FromLinter}] ${issue.Text}`,
      issue.Pos.Filename,
      issue.Pos.Line,
      issue.Pos.Column,
      this.mapSeverity(issue.Severity),
      issue.FromLinter
    );
  }

  /**
   * Categorize issue based on linter name
   */
  private categorizeIssue(linterName: string): GoIssue['category'] {
    const categoryMap: Record<string, GoIssue['category']> = {
      // Concurrency linters
      govet: 'concurrency',
      staticcheck: 'bug',
      
      // Error handling
      errcheck: 'error',
      errorlint: 'error',
      
      // Performance
      prealloc: 'performance',
      ineffassign: 'performance',
      
      // Style
      gofmt: 'style',
      goimports: 'style',
      revive: 'style',
      
      // Memory
      gocritic: 'memory',
      
      // Context
      contextcheck: 'context',
    };

    return categoryMap[linterName] || 'bug';
  }
}
