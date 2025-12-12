/**
 * @fileoverview Base detector for Go language analysis
 * Provides foundation for all Go-specific detectors
 */

import type { DetectorResult, Issue, Severity } from '../../types';

export interface GoDetectorOptions {
  /** Enable golangci-lint integration */
  useGolangciLint?: boolean;
  /** Enable staticcheck integration */
  useStaticcheck?: boolean;
  /** Go module path */
  modulePath?: string;
  /** Go version (e.g., "1.21", "1.22") */
  goVersion?: string;
  /** Custom linter configurations */
  linterConfigs?: Record<string, unknown>;
}

export interface GoIssue extends Issue {
  /** Go-specific issue category */
  category: 'goroutine' | 'channel' | 'context' | 'error' | 'memory' | 'concurrency' | 'performance' | 'style' | 'bug';
  /** Source linter (golangci-lint, staticcheck, custom) */
  linter?: string;
  /** Go package path */
  packagePath?: string;
}

export abstract class GoBaseDetector {
  protected readonly options: GoDetectorOptions;

  constructor(options: GoDetectorOptions = {}) {
    this.options = {
      useGolangciLint: true,
      useStaticcheck: true,
      goVersion: '1.21',
      ...options,
    };
  }

  /**
   * Detect issues in Go source code
   */
  abstract detect(filePath: string, content: string): Promise<DetectorResult>;

  /**
   * Check if file is a Go source file
   */
  protected isGoFile(filePath: string): boolean {
    return filePath.endsWith('.go') && !filePath.endsWith('_test.go');
  }

  /**
   * Check if file is a Go test file
   */
  protected isGoTestFile(filePath: string): boolean {
    return filePath.endsWith('_test.go');
  }

  /**
   * Parse Go module path from go.mod file
   */
  protected async parseGoModule(workspaceRoot: string): Promise<string | null> {
    try {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const goModPath = path.join(workspaceRoot, 'go.mod');
      const content = await fs.readFile(goModPath, 'utf8');
      const match = content.match(/^module\s+(.+)$/m);
      return match ? match[1].trim() : null;
    } catch {
      return null;
    }
  }

  /**
   * Create a Go issue
   */
  protected createIssue(
    category: GoIssue['category'],
    message: string,
    filePath: string,
    line: number,
    column: number,
    severity: Severity,
    linter?: string
  ): GoIssue {
    return {
      type: category,
      category,
      message,
      file: filePath,
      line,
      column,
      severity,
      linter,
    };
  }

  /**
   * Map external linter severity to ODAVL severity
   */
  protected mapSeverity(linterSeverity: string): Severity {
    const severityMap: Record<string, Severity> = {
      error: 'critical',
      warning: 'high',
      info: 'info',
      hint: 'info',
    };
    return severityMap[linterSeverity.toLowerCase()] || 'warning';
  }
}
