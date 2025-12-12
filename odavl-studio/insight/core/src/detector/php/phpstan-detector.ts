/**
 * @fileoverview Integrates PHPStan static analysis tool
 * PHPStan: The gold standard for PHP static analysis (9 strictness levels)
 */

import { PhpBaseDetector, type PhpDetectorOptions, type PhpIssue } from './php-base-detector';
import type { DetectorResult } from '../../types';

interface PHPStanError {
  message: string;
  file: string;
  line: number;
  ignorable?: boolean;
}

interface PHPStanOutput {
  totals: {
    errors: number;
    file_errors: number;
  };
  files: Record<string, {
    errors: number;
    messages: PHPStanError[];
  }>;
  errors: string[];
}

export class PHPStanDetector extends PhpBaseDetector {
  constructor(options: PhpDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isPhpFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'phpstan' };
    }

    const issues: PhpIssue[] = [];

    // Run PHPStan if enabled
    if (this.options.usePHPStan) {
      const phpstanIssues = await this.runPHPStan(filePath);
      issues.push(...phpstanIssues);
    }

    return {
      issues,
      duration: 0,
      detectorName: 'phpstan',
    };
  }

  /**
   * Execute PHPStan analysis
   */
  private async runPHPStan(filePath: string): Promise<PhpIssue[]> {
    try {
      const { execSync } = await import('child_process');
      
      // PHPStan command with JSON output
      // Level 9 = maximum strictness
      const level = 9;
      const cmd = `phpstan analyse ${filePath} --level=${level} --error-format=json --no-progress`;
      
      const output = execSync(cmd, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const result: PHPStanOutput = JSON.parse(output);
      const issues: PhpIssue[] = [];

      // Process file errors
      for (const [file, fileData] of Object.entries(result.files)) {
        for (const error of fileData.messages) {
          const issue = this.convertPHPStanError(error, file);
          if (issue) {
            issues.push(issue);
          }
        }
      }

      return issues;
    } catch (error: unknown) {
      // PHPStan exits with non-zero when errors found
      const execError = error as { stdout?: Buffer; stderr?: Buffer; status?: number };
      
      if (execError.stdout) {
        try {
          const result: PHPStanOutput = JSON.parse(execError.stdout.toString());
          const issues: PhpIssue[] = [];

          for (const [file, fileData] of Object.entries(result.files)) {
            for (const phpError of fileData.messages) {
              const issue = this.convertPHPStanError(phpError, file);
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
   * Convert PHPStan error to ODAVL issue
   */
  private convertPHPStanError(error: PHPStanError, filePath: string): PhpIssue | null {
    const category = this.categorizePHPStanError(error.message);
    const severity = category === 'security' ? 'critical' : 'high';

    return this.createIssue(
      category,
      error.message,
      filePath,
      error.line,
      0,
      severity,
      'phpstan-detector',
      9, // Max level
      this.suggestFix(error.message)
    );
  }

  /**
   * Categorize PHPStan error by message content
   */
  private categorizePHPStanError(message: string): PhpIssue['category'] {
    const lower = message.toLowerCase();

    // Type safety issues
    if (
      lower.includes('type') ||
      lower.includes('expects') ||
      lower.includes('but got') ||
      lower.includes('mixed')
    ) {
      return 'type-safety';
    }

    // Null safety
    if (
      lower.includes('null') ||
      lower.includes('nullable') ||
      lower.includes('cannot access')
    ) {
      return 'nullable';
    }

    // Deprecated
    if (lower.includes('deprecated')) {
      return 'deprecated';
    }

    // Undefined behavior
    if (
      lower.includes('undefined') ||
      lower.includes('does not exist') ||
      lower.includes('not found')
    ) {
      return 'correctness';
    }

    // Dead code
    if (
      lower.includes('unreachable') ||
      lower.includes('never') ||
      lower.includes('always')
    ) {
      return 'design';
    }

    return 'type-safety';
  }

  /**
   * Suggest fix for common PHPStan errors
   */
  private suggestFix(message: string): string | undefined {
    if (message.includes('mixed')) {
      return 'Add specific type hints instead of mixed';
    }

    if (message.includes('expects') && message.includes('but got')) {
      return 'Fix type mismatch - check function signature';
    }

    if (message.includes('nullable')) {
      return 'Add null check: if ($var !== null) { ... }';
    }

    if (message.includes('deprecated')) {
      return 'Update to newer alternative (check PHP docs)';
    }

    if (message.includes('does not exist')) {
      return 'Check spelling or import missing class/function';
    }

    return undefined;
  }
}
