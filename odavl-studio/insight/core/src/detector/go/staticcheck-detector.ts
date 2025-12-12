/**
 * @fileoverview Integrates staticcheck for Go static analysis
 * staticcheck is the gold standard for Go static analysis
 */

import { execSync } from 'node:child_process';
import * as path from 'node:path';
import { GoBaseDetector, type GoDetectorOptions, type GoIssue } from './go-base-detector';
import type { DetectorResult } from '../../types';

interface StaticcheckIssue {
  code: string;
  severity: string;
  location: {
    file: string;
    line: number;
    column: number;
  };
  message: string;
  end?: {
    line: number;
    column: number;
  };
}

export class StaticcheckDetector extends GoBaseDetector {
  constructor(options: GoDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isGoFile(filePath) && !this.isGoTestFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'staticcheck' };
    }

    const issues: GoIssue[] = [];

    try {
      const result = await this.runStaticcheck(filePath);
      
      if (result) {
        for (const issue of result) {
          issues.push(this.convertStaticcheckIssue(issue));
        }
      }
    } catch (error) {
      console.warn(`staticcheck failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      issues,
      duration: 0,
      detectorName: 'staticcheck',
    };
  }

  /**
   * Run staticcheck and parse JSON output
   */
  private async runStaticcheck(filePath: string): Promise<StaticcheckIssue[] | null> {
    try {
      const dir = path.dirname(filePath);
      
      // Run staticcheck with JSON output
      const output = execSync(
        `staticcheck -f json "${filePath}"`,
        {
          cwd: dir,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        }
      );

      // staticcheck outputs JSON lines (one issue per line)
      const lines = output.trim().split('\n').filter(Boolean);
      return lines.map(line => JSON.parse(line) as StaticcheckIssue);
    } catch (error) {
      if (error instanceof Error && 'stdout' in error) {
        const stdout = (error as { stdout: Buffer }).stdout.toString();
        if (stdout) {
          try {
            const lines = stdout.trim().split('\n').filter(Boolean);
            return lines.map(line => JSON.parse(line) as StaticcheckIssue);
          } catch {
            return null;
          }
        }
      }
      return null;
    }
  }

  /**
   * Convert staticcheck issue to ODAVL GoIssue
   */
  private convertStaticcheckIssue(issue: StaticcheckIssue): GoIssue {
    const category = this.categorizeStaticcheckIssue(issue.code);
    
    return this.createIssue(
      category,
      `[${issue.code}] ${issue.message}`,
      issue.location.file,
      issue.location.line,
      issue.location.column,
      this.mapStaticcheckSeverity(issue.severity),
      'staticcheck'
    );
  }

  /**
   * Categorize staticcheck issue by code prefix
   * SA = Static Analysis, S = Style, ST = Testing, QF = Quick Fix
   */
  private categorizeStaticcheckIssue(code: string): GoIssue['category'] {
    const prefix = code.substring(0, 2);
    
    const categoryMap: Record<string, GoIssue['category']> = {
      SA: 'bug',        // Static analysis bugs
      S: 'style',       // Style issues
      ST: 'bug',        // Testing issues
      QF: 'style',      // Quick fixes
      U: 'performance', // Unused code
    };

    // Check for specific codes
    if (code.startsWith('SA1') || code.startsWith('SA2')) {
      return 'concurrency'; // Concurrency issues
    }
    if (code.startsWith('SA5')) {
      return 'memory'; // Memory issues
    }
    if (code.startsWith('SA6')) {
      return 'context'; // Context issues
    }

    return categoryMap[prefix] || 'bug';
  }

  /**
   * Map staticcheck severity to ODAVL severity
   */
  private mapStaticcheckSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const severityMap: Record<string, 'critical' | 'high' | 'medium' | 'low' | 'info'> = {
      error: 'critical',
      warning: 'high',
      info: 'info',
      suggestion: 'info',
    };
    return severityMap[severity.toLowerCase()] || 'high';
  }
}
