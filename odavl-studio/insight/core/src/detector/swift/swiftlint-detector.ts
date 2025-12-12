/**
 * @fileoverview Integrates SwiftLint static analysis tool
 * SwiftLint: The standard for Swift style enforcement (200+ rules)
 */

import { SwiftBaseDetector, type SwiftDetectorOptions, type SwiftIssue } from './swift-base-detector';
import type { DetectorResult } from '../../types';

interface SwiftLintViolation {
  rule_id: string;
  reason: string;
  character: number | null;
  file: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: string;
  line: number;
}

export class SwiftLintDetector extends SwiftBaseDetector {
  constructor(options: SwiftDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isSwiftFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'swiftlint' };
    }

    const issues: SwiftIssue[] = [];

    // Run SwiftLint if enabled
    if (this.options.useSwiftLint) {
      const swiftlintIssues = await this.runSwiftLint(filePath);
      issues.push(...swiftlintIssues);
    }

    return {
      issues,
      duration: 0,
      detectorName: 'swiftlint',
    };
  }

  /**
   * Execute SwiftLint analysis
   */
  private async runSwiftLint(filePath: string): Promise<SwiftIssue[]> {
    try {
      const { execSync } = await import('child_process');
      
      // SwiftLint command with JSON output
      const cmd = `swiftlint lint ${filePath} --reporter json`;
      
      const output = execSync(cmd, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const violations: SwiftLintViolation[] = JSON.parse(output);
      const issues: SwiftIssue[] = [];

      for (const violation of violations) {
        const issue = this.convertSwiftLintViolation(violation);
        if (issue) {
          issues.push(issue);
        }
      }

      return issues;
    } catch (error: unknown) {
      const execError = error as { stdout?: Buffer; stderr?: Buffer };
      
      if (execError.stdout) {
        try {
          const violations: SwiftLintViolation[] = JSON.parse(execError.stdout.toString());
          return violations.map(v => this.convertSwiftLintViolation(v)).filter(Boolean) as SwiftIssue[];
        } catch {
          // JSON parse failed
        }
      }

      return [];
    }
  }

  /**
   * Convert SwiftLint violation to ODAVL issue
   */
  private convertSwiftLintViolation(violation: SwiftLintViolation): SwiftIssue | null {
    const category = this.categorizeSwiftLintRule(violation.rule_id);
    
    return this.createIssue(
      category,
      violation.reason,
      violation.file,
      violation.line,
      violation.character || 0,
      violation.severity,
      'swiftlint-detector',
      violation.rule_id,
      'Run: swiftlint autocorrect to auto-fix'
    );
  }

  /**
   * Categorize SwiftLint rule
   */
  private categorizeSwiftLintRule(ruleId: string): SwiftIssue['category'] {
    // Memory-related rules
    if (/weak|unowned|capture|retain|cycle/.test(ruleId)) {
      return 'memory';
    }

    // Optional-related rules
    if (/optional|unwrap|force|implicitly/.test(ruleId)) {
      return 'optionals';
    }

    // Concurrency rules
    if (/actor|async|await|sendable|isolated/.test(ruleId)) {
      return 'concurrency';
    }

    // Performance rules
    if (/performance|efficient|lazy/.test(ruleId)) {
      return 'performance';
    }

    // Naming rules
    if (/naming|identifier|name/.test(ruleId)) {
      return 'naming';
    }

    // Complexity rules
    if (/complexity|cognitive|cyclomatic/.test(ruleId)) {
      return 'complexity';
    }

    // SwiftUI rules
    if (/swiftui|view|state|binding/.test(ruleId)) {
      return 'swiftui';
    }

    return 'style';
  }
}
