/**
 * @fileoverview Integrates Clippy - Rust's official linter
 * Clippy has 550+ lints covering correctness, performance, style, and more
 */

import { execSync } from 'node:child_process';
import * as path from 'node:path';
import { RustBaseDetector, type RustDetectorOptions, type RustIssue } from './rust-base-detector';
import type { DetectorResult } from '../../types';

interface ClippyDiagnostic {
  message: string;
  code: {
    code: string;
    explanation?: string;
  } | null;
  level: 'error' | 'warning' | 'note' | 'help';
  spans: Array<{
    file_name: string;
    line_start: number;
    line_end: number;
    column_start: number;
    column_end: number;
    label?: string;
    suggested_replacement?: string;
  }>;
  children: Array<{
    message: string;
    level: string;
    spans: Array<unknown>;
  }>;
  rendered?: string;
}

interface ClippyOutput {
  reason: string;
  message?: ClippyDiagnostic;
}

export class ClippyDetector extends RustBaseDetector {
  constructor(options: RustDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isRustFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'clippy' };
    }

    const issues: RustIssue[] = [];

    try {
      const diagnostics = await this.runClippy(filePath);
      
      for (const diagnostic of diagnostics) {
        if (diagnostic.message) {
          const converted = this.convertClippyIssue(diagnostic.message, filePath);
          if (converted) {
            issues.push(converted);
          }
        }
      }
    } catch (error) {
      console.warn(`Clippy failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      issues,
      duration: 0,
      detectorName: 'clippy',
    };
  }

  /**
   * Run Clippy and parse JSON output
   */
  private async runClippy(filePath: string): Promise<ClippyOutput[]> {
    try {
      const dir = path.dirname(filePath);
      
      // Run cargo clippy with JSON output
      // --message-format=json outputs one JSON object per line
      const output = execSync(
        'cargo clippy --message-format=json --all-features -- -W clippy::all',
        {
          cwd: dir,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large projects
        }
      );

      // Parse JSON lines
      const lines = output.trim().split('\n').filter(Boolean);
      return lines
        .map(line => {
          try {
            return JSON.parse(line) as ClippyOutput;
          } catch {
            return null;
          }
        })
        .filter((item): item is ClippyOutput => item !== null);
    } catch (error) {
      // Clippy exits with non-zero when issues found
      if (error instanceof Error && 'stdout' in error) {
        const stdout = (error as { stdout: Buffer }).stdout.toString();
        if (stdout) {
          const lines = stdout.trim().split('\n').filter(Boolean);
          return lines
            .map(line => {
              try {
                return JSON.parse(line) as ClippyOutput;
              } catch {
                return null;
              }
            })
            .filter((item): item is ClippyOutput => item !== null);
        }
      }
      return [];
    }
  }

  /**
   * Convert Clippy diagnostic to ODAVL RustIssue
   */
  private convertClippyIssue(
    diagnostic: ClippyDiagnostic,
    targetFile: string
  ): RustIssue | null {
    // Only process diagnostics for the target file
    const relevantSpan = diagnostic.spans.find(span => 
      span.file_name.endsWith(targetFile) || targetFile.endsWith(span.file_name)
    );

    if (!relevantSpan) {
      return null;
    }

    const category = this.categorizeClippyLint(diagnostic.code?.code || '');
    const suggestion = relevantSpan.suggested_replacement || 
      diagnostic.children.find(c => c.level === 'help')?.message;

    return this.createIssue(
      category,
      diagnostic.message,
      relevantSpan.file_name,
      relevantSpan.line_start,
      relevantSpan.column_start,
      this.mapSeverity(diagnostic.level),
      'clippy',
      suggestion
    );
  }

  /**
   * Categorize Clippy lint by prefix
   * clippy::correctness = bugs
   * clippy::perf = performance
   * clippy::style = style
   * clippy::complexity = code quality
   */
  private categorizeClippyLint(lintCode: string): RustIssue['category'] {
    const code = lintCode.toLowerCase();

    // Correctness lints (bugs that are almost always wrong)
    if (code.includes('correctness')) {
      return 'correctness';
    }

    // Performance lints
    if (code.includes('perf') || code.includes('performance')) {
      return 'performance';
    }

    // Memory safety
    if (code.includes('mem') || code.includes('leak') || code.includes('drop')) {
      return 'memory';
    }

    // Unsafe code
    if (code.includes('unsafe')) {
      return 'unsafe';
    }

    // Concurrency
    if (code.includes('mutex') || code.includes('thread') || code.includes('atomic')) {
      return 'concurrency';
    }

    // Panic-related
    if (code.includes('panic') || code.includes('unwrap') || code.includes('expect')) {
      return 'panic';
    }

    // Ownership/borrowing
    if (code.includes('borrow') || code.includes('clone') || code.includes('copy')) {
      return 'ownership';
    }

    // Style
    if (code.includes('style') || code.includes('naming')) {
      return 'style';
    }

    return 'correctness';
  }
}
