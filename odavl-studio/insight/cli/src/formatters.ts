/**
 * Output formatters for analysis results
 */

import chalk from 'chalk';
import type { AnalysisResult, InsightIssue, Severity } from './types.js';
import type { ComparisonResult } from './baseline/matcher.js';
import { formatTimestamp } from './utils/format.js';

export interface Formatter {
  format(result: AnalysisResult): string;
  formatWithBaseline?(
    result: AnalysisResult,
    comparison: ComparisonResult,
    showResolved: boolean
  ): string;
}

/**
 * Human-readable console output with colors
 */
export class HumanFormatter implements Formatter {
  format(result: AnalysisResult): string {
    const lines: string[] = [];

    // Header
    lines.push('');
    lines.push(chalk.cyan.bold('🔍 ODAVL Insight Analysis'));
    lines.push(chalk.gray('═'.repeat(60)));
    lines.push('');

    // Summary
    const { summary, metadata } = result;
    lines.push(chalk.white.bold('Summary:'));
    lines.push(chalk.gray(`  Files analyzed:    ${metadata.analyzedFiles}`));
    lines.push(chalk.gray(`  Duration:          ${metadata.duration}ms`));
    lines.push(chalk.gray(`  Total issues:      ${summary.total}`));
    lines.push('');

    if (summary.total === 0) {
      lines.push(chalk.green('✓ No issues found!'));
      lines.push('');
      return lines.join('\n');
    }

    // Severity breakdown
    lines.push(chalk.white.bold('Issues by Severity:'));
    if (summary.critical > 0) {
      lines.push(chalk.red(`  Critical:  ${summary.critical}`));
    }
    if (summary.high > 0) {
      lines.push(chalk.red(`  High:      ${summary.high}`));
    }
    if (summary.medium > 0) {
      lines.push(chalk.yellow(`  Medium:    ${summary.medium}`));
    }
    if (summary.low > 0) {
      lines.push(chalk.blue(`  Low:       ${summary.low}`));
    }
    if (summary.info > 0) {
      lines.push(chalk.gray(`  Info:      ${summary.info}`));
    }
    lines.push('');

    // Group issues by file
    const issuesByFile = this.groupByFile(result.issues);

    // Show top 10 files with most issues
    const sortedFiles = Object.entries(issuesByFile).sort(
      (a, b) => b[1].length - a[1].length
    );
    const topFiles = sortedFiles.slice(0, 10);

    if (topFiles.length > 0) {
      lines.push(chalk.white.bold('Top Issues:'));
      for (const [file, issues] of topFiles) {
        const relativeFile = this.getRelativePath(file);
        lines.push('');
        lines.push(chalk.cyan(`  ${relativeFile}`));
        
        // Show first 3 issues per file
        const displayIssues = issues.slice(0, 3);
        for (const issue of displayIssues) {
          const severityColor = this.getSeverityColor(issue.severity);
          const location = `${issue.line}:${issue.column}`;
          lines.push(
            `    ${severityColor(issue.severity.toUpperCase().padEnd(8))} ` +
            `${chalk.gray(location.padEnd(10))} ${issue.message}`
          );
        }
        
        if (issues.length > 3) {
          lines.push(chalk.gray(`    ... and ${issues.length - 3} more`));
        }
      }
    }

    lines.push('');
    lines.push(chalk.gray('─'.repeat(60)));
    lines.push('');

    return lines.join('\n');
  }

  private groupByFile(issues: InsightIssue[]): Record<string, InsightIssue[]> {
    const grouped: Record<string, InsightIssue[]> = {};
    for (const issue of issues) {
      if (!grouped[issue.file]) {
        grouped[issue.file] = [];
      }
      grouped[issue.file].push(issue);
    }
    return grouped;
  }

  private getRelativePath(absolutePath: string): string {
    const cwd = process.cwd();
    if (absolutePath.startsWith(cwd)) {
      return absolutePath.slice(cwd.length + 1);
    }
    return absolutePath;
  }

  private getSeverityColor(severity: Severity): (text: string) => string {
    switch (severity) {
      case 'critical':
        return chalk.red.bold;
      case 'high':
        return chalk.red;
      case 'medium':
        return chalk.yellow;
      case 'low':
        return chalk.blue;
      case 'info':
        return chalk.gray;
    }
  }

  /**
   * Format with baseline comparison
   */
  formatWithBaseline(
    result: AnalysisResult,
    comparison: ComparisonResult,
    showResolved: boolean
  ): string {
    const lines: string[] = [];

    // Header
    lines.push('');
    lines.push(chalk.cyan.bold('🔍 ODAVL Insight Analysis (vs baseline)'));
    lines.push(chalk.gray('═'.repeat(60)));
    lines.push('');

    // Baseline info
    lines.push(chalk.white.bold('📊 Comparison Summary:'));
    lines.push(chalk.gray(`  Baseline:          ${comparison.baseline.name}.json`));
    lines.push(chalk.gray(`  Created:           ${formatTimestamp(comparison.baseline.timestamp)}`));
    if (comparison.baseline.commit) {
      lines.push(chalk.gray(`  Commit:            ${comparison.baseline.commit.slice(0, 8)}`));
    }
    lines.push('');

    // Issue changes
    lines.push(chalk.white.bold('📈 Issue Changes:'));
    if (comparison.summary.new > 0) {
      lines.push(chalk.red(`  🆕 New:            ${comparison.summary.new} issues`));
    } else {
      lines.push(chalk.green(`  🆕 New:            0 issues`));
    }
    if (comparison.summary.resolved > 0) {
      lines.push(chalk.green(`  ✅ Resolved:       ${comparison.summary.resolved} issues`));
    }
    lines.push(chalk.gray(`  🔄 Unchanged:      ${comparison.summary.unchanged} issues`));
    lines.push('');

    // Show new issues
    if (comparison.summary.new > 0) {
      lines.push(chalk.red.bold(`🚨 New Issues (${comparison.summary.new}):`));
      lines.push('');

      const issuesByFile = this.groupByFile(comparison.newIssues);
      const sortedFiles = Object.entries(issuesByFile).sort(
        (a, b) => b[1].length - a[1].length
      );

      for (const [file, issues] of sortedFiles) {
        const relativeFile = this.getRelativePath(file);
        lines.push(chalk.cyan(`  ${relativeFile}`));

        for (const issue of issues) {
          const severityColor = this.getSeverityColor(issue.severity);
          const location = `${issue.line}:${issue.column}`;
          lines.push(
            `    ${severityColor(issue.severity.toUpperCase().padEnd(8))} ` +
            `${chalk.gray(location.padEnd(10))} ${issue.message}`
          );
        }
        lines.push('');
      }
    } else {
      lines.push(chalk.green('✓ No new issues introduced!'));
      lines.push('');
    }

    // Show resolved issues (if requested)
    if (showResolved && comparison.summary.resolved > 0) {
      lines.push(chalk.green.bold(`✅ Resolved Issues (${comparison.summary.resolved}):`));
      lines.push('');

      const issuesByFile = this.groupByFile(comparison.resolvedIssues);
      const sortedFiles = Object.entries(issuesByFile).sort(
        (a, b) => b[1].length - a[1].length
      );

      for (const [file, issues] of sortedFiles.slice(0, 5)) {
        const relativeFile = this.getRelativePath(file);
        lines.push(chalk.cyan(`  ${relativeFile}`));

        for (const issue of issues.slice(0, 3)) {
          const location = `${issue.line}:${issue.column}`;
          lines.push(
            `    ${chalk.gray('RESOLVED'.padEnd(8))} ` +
            `${chalk.gray(location.padEnd(10))} ${issue.message}`
          );
        }
        if (issues.length > 3) {
          lines.push(chalk.gray(`    ... and ${issues.length - 3} more`));
        }
        lines.push('');
      }
    }

    lines.push(chalk.gray('─'.repeat(60)));
    lines.push('');

    return lines.join('\n');
  }
}

/**
 * JSON output
 */
export class JsonFormatter implements Formatter {
  format(result: AnalysisResult): string {
    return JSON.stringify(result, null, 2);
  }

  /**
   * Format with baseline comparison
   */
  formatWithBaseline(
    result: AnalysisResult,
    comparison: ComparisonResult,
    showResolved: boolean
  ): string {
    const output = {
      ...result,
      baseline: comparison.baseline,
      comparison: {
        newIssues: comparison.newIssues,
        resolvedIssues: showResolved ? comparison.resolvedIssues : undefined,
        unchangedIssues: comparison.unchangedIssues.length,
        summary: comparison.summary,
      },
    };
    return JSON.stringify(output, null, 2);
  }
}

/**
 * SARIF 2.1.0 output (GitHub Code Scanning compatible)
 */
export class SarifFormatter implements Formatter {
  format(result: AnalysisResult): string {
    const sarif = {
      version: '2.1.0',
      $schema:
        'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      runs: [
        {
          tool: {
            driver: {
              name: 'ODAVL Insight',
              version: '1.0.0',
              informationUri: 'https://odavl.dev',
              rules: this.generateRules(result.issues),
            },
          },
          results: this.generateResults(result.issues),
        },
      ],
    };

    return JSON.stringify(sarif, null, 2);
  }

  /**
   * Format with baseline comparison (SARIF only includes new issues)
   */
  formatWithBaseline(
    result: AnalysisResult,
    comparison: ComparisonResult,
    showResolved: boolean
  ): string {
    // SARIF output only includes NEW issues when baseline is active
    const sarif = {
      version: '2.1.0',
      $schema:
        'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      runs: [
        {
          tool: {
            driver: {
              name: 'ODAVL Insight',
              version: '1.0.0',
              informationUri: 'https://odavl.dev',
              rules: this.generateRules(comparison.newIssues),
            },
          },
          results: this.generateResults(comparison.newIssues),
          properties: {
            baseline: {
              name: comparison.baseline.name,
              timestamp: comparison.baseline.timestamp,
              commit: comparison.baseline.commit,
            },
            comparison: {
              newIssues: comparison.summary.new,
              resolvedIssues: comparison.summary.resolved,
              unchangedIssues: comparison.summary.unchanged,
            },
          },
        },
      ],
    };

    return JSON.stringify(sarif, null, 2);
  }

  private generateRules(issues: InsightIssue[]): any[] {
    const ruleMap = new Map<string, any>();

    for (const issue of issues) {
      const ruleId = issue.ruleId || `${issue.detector}/${issue.severity}`;
      if (!ruleMap.has(ruleId)) {
        ruleMap.set(ruleId, {
          id: ruleId,
          name: issue.ruleId || issue.detector,
          shortDescription: {
            text: issue.message.split('\n')[0].slice(0, 100),
          },
          fullDescription: {
            text: issue.message,
          },
          defaultConfiguration: {
            level: this.mapSeverityToLevel(issue.severity),
          },
          properties: {
            tags: [issue.detector, issue.severity],
          },
        });
      }
    }

    return Array.from(ruleMap.values());
  }

  private generateResults(issues: InsightIssue[]): any[] {
    return issues.map((issue) => ({
      ruleId: issue.ruleId || `${issue.detector}/${issue.severity}`,
      level: this.mapSeverityToLevel(issue.severity),
      message: {
        text: issue.message,
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: {
              uri: this.getRelativeUri(issue.file),
            },
            region: {
              startLine: issue.line,
              startColumn: issue.column,
            },
          },
        },
      ],
    }));
  }

  private mapSeverityToLevel(severity: Severity): string {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      case 'info':
        return 'note';
    }
  }

  private getRelativeUri(absolutePath: string): string {
    const cwd = process.cwd().replace(/\\/g, '/'); // Normalize cwd to forward slashes
    const normalized = absolutePath.replace(/\\/g, '/'); // Normalize path too
    
    if (normalized.startsWith(cwd)) {
      return normalized.slice(cwd.length + 1);
    }
    return normalized;
  }
}

/**
 * Factory to get formatter by type
 */
export function getFormatter(format: 'human' | 'json' | 'sarif'): Formatter {
  switch (format) {
    case 'human':
      return new HumanFormatter();
    case 'json':
      return new JsonFormatter();
    case 'sarif':
      return new SarifFormatter();
  }
}
