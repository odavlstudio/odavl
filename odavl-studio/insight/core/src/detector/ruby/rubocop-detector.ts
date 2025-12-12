/**
 * @fileoverview Integrates RuboCop static analysis tool
 * RuboCop: The gold standard for Ruby style checking (500+ cops)
 */

import { RubyBaseDetector, type RubyDetectorOptions, type RubyIssue } from './ruby-base-detector';
import type { DetectorResult } from '../../types';

interface RuboCopOffense {
  severity: 'error' | 'warning' | 'convention' | 'refactor' | 'info';
  message: string;
  cop_name: string;
  corrected: boolean;
  correctable: boolean;
  location: {
    start_line: number;
    start_column: number;
    last_line: number;
    last_column: number;
    line: number;
    column: number;
  };
}

interface RuboCopFile {
  path: string;
  offenses: RuboCopOffense[];
}

interface RuboCopOutput {
  metadata: {
    rubocop_version: string;
    ruby_engine: string;
    ruby_version: string;
  };
  files: RuboCopFile[];
  summary: {
    offense_count: number;
    target_file_count: number;
    inspected_file_count: number;
  };
}

export class RuboCopDetector extends RubyBaseDetector {
  constructor(options: RubyDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isRubyFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'rubocop' };
    }

    const issues: RubyIssue[] = [];

    // Run RuboCop if enabled
    if (this.options.useRuboCop) {
      const rubocopIssues = await this.runRuboCop(filePath);
      issues.push(...rubocopIssues);
    }

    return {
      issues,
      duration: 0,
      detectorName: 'rubocop',
    };
  }

  /**
   * Execute RuboCop analysis
   */
  private async runRuboCop(filePath: string): Promise<RubyIssue[]> {
    try {
      const { execSync } = await import('child_process');
      
      // RuboCop command with JSON output
      const cmd = `rubocop ${filePath} --format json`;
      
      const output = execSync(cmd, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const result: RuboCopOutput = JSON.parse(output);
      const issues: RubyIssue[] = [];

      // Process file offenses
      for (const file of result.files) {
        for (const offense of file.offenses) {
          const issue = this.convertRuboCopOffense(offense, file.path);
          if (issue) {
            issues.push(issue);
          }
        }
      }

      return issues;
    } catch (error: unknown) {
      // RuboCop exits with non-zero when offenses found
      const execError = error as { stdout?: Buffer; stderr?: Buffer; status?: number };
      
      if (execError.stdout) {
        try {
          const result: RuboCopOutput = JSON.parse(execError.stdout.toString());
          const issues: RubyIssue[] = [];

          for (const file of result.files) {
            for (const offense of file.offenses) {
              const issue = this.convertRuboCopOffense(offense, file.path);
              if (issue) {
                issues.push(issue);
              }
            }
          }

          return issues;
        } catch {
          // JSON parse failed
        }
      }

      return [];
    }
  }

  /**
   * Convert RuboCop offense to ODAVL issue
   */
  private convertRuboCopOffense(offense: RuboCopOffense, filePath: string): RubyIssue | null {
    const category = this.categorizeRuboCopCop(offense.cop_name);
    const severity = this.mapSeverity(offense.severity);

    const codeAction = offense.correctable
      ? 'Run: rubocop -a to auto-correct'
      : undefined;

    return this.createIssue(
      category,
      offense.message,
      filePath,
      offense.location.line,
      offense.location.column,
      severity,
      'rubocop-detector',
      offense.cop_name,
      codeAction
    );
  }

  /**
   * Categorize RuboCop cop by department
   */
  private categorizeRuboCopCop(copName: string): RubyIssue['category'] {
    const [department] = copName.split('/');

    switch (department) {
      case 'Style':
        return 'style';
      case 'Performance':
        return 'performance';
      case 'Security':
        return 'security';
      case 'Rails':
        return 'rails';
      case 'Naming':
        return 'naming';
      case 'Metrics':
        return 'metrics';
      case 'Lint':
        return 'lint';
      case 'Bundler':
        return 'bundler';
      default:
        return 'correctness';
    }
  }

  /**
   * Map RuboCop severity to ODAVL severity
   */
  private mapSeverity(severity: RuboCopOffense['severity']): RubyIssue['severity'] {
    switch (severity) {
      case 'error':
        return 'critical';
      case 'warning':
        return 'high';
      case 'convention':
      case 'refactor':
        return 'info';
      case 'info':
        return 'info';
      default:
        return 'high';
    }
  }
}
