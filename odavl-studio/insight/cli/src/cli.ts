/**
 * CLI command definitions and handlers
 */

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import type {
  AnalysisEngine,
  AnalyzeOptions,
  OutputFormat,
  Severity,
  ExitCode,
} from './types.js';
import { getFormatter } from './formatters.js';
import {
  loadBaseline,
  createBaseline,
  baselineExists,
} from './baseline/storage.js';
import { compareWithBaseline, countBySeverity } from './baseline/matcher.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('cli');

export interface CliOptions {
  format: OutputFormat;
  failLevel: Severity;
  detectors?: string;
  changedOnly: boolean;
  ci: boolean;
  baseline?: string;
  failOnNew: boolean;
  showResolved: boolean;
}

export class InsightCli {
  constructor(private engine: AnalysisEngine) {}

  /**
   * Create commander program with analyze command
   */
  createProgram(): Command {
    const program = new Command();

    program
      .name('odavl-insight')
      .description('ODAVL Insight - Code quality and security analysis')
      .version('1.0.0');

    program
      .command('analyze [path]')
      .description('Analyze code for quality and security issues')
      .option(
        '-f, --format <format>',
        'Output format (human, json, sarif)',
        'human'
      )
      .option(
        '--fail-level <level>',
        'Minimum severity to fail with exit code 1 (critical, high, medium, low, info)',
        'high'
      )
      .option(
        '--detectors <detectors>',
        'Comma-separated list of detectors to run (e.g., typescript,security,performance)',
        undefined
      )
      .option('--changed-only', 'Only analyze files changed in git', false)
      .option('--ci', 'CI mode: deterministic, sequential execution', false)
      .option(
        '--baseline <name>',
        'Compare against baseline (auto-creates if not found)',
        undefined
      )
      .option(
        '--fail-on-new',
        'Exit 1 if ANY new issues found (stricter than fail-level)',
        false
      )
      .option(
        '--show-resolved',
        'Include resolved issues in output',
        false
      )
      .action(async (path: string | undefined, options: CliOptions) => {
        await this.handleAnalyze(path || process.cwd(), options);
      });

    return program;
  }

  /**
   * Handle analyze command
   */
  private async handleAnalyze(
    targetPath: string,
    cliOptions: CliOptions
  ): Promise<void> {
    // Validate options
    const format = this.validateFormat(cliOptions.format);
    const failLevel = this.validateSeverity(cliOptions.failLevel);

    // Show spinner in human mode only
    const spinner =
      format === 'human'
        ? ora({
            text: 'Analyzing code...',
            color: 'cyan',
          }).start()
        : null;

    try {
      // Convert CLI options to analysis options
      const analyzeOptions: AnalyzeOptions = {
        detectors: cliOptions.detectors?.split(','),
        changedOnly: cliOptions.changedOnly,
        ci: cliOptions.ci,
      };

      // Run analysis
      const result = await this.engine.analyze(targetPath, analyzeOptions);

      // Stop spinner
      if (spinner) {
        spinner.stop();
      }

      // Baseline mode
      if (cliOptions.baseline) {
        await this.handleBaselineMode(
          targetPath,
          result,
          cliOptions,
          format,
          failLevel
        );
        return;
      }

      // Standard mode (no baseline)
      const formatter = getFormatter(format);
      const output = formatter.format(result);
      console.log(output);

      // Determine exit code
      const exitCode = this.calculateExitCode(result, failLevel);
      process.exit(exitCode);
    } catch (error) {
      if (spinner) {
        spinner.fail('Analysis failed');
      }

      const message =
        error instanceof Error ? error.message : 'Unknown error';

      if (format === 'json') {
        console.error(
          JSON.stringify(
            {
              error: message,
              stack: error instanceof Error ? error.stack : undefined,
            },
            null,
            2
          )
        );
      } else {
        console.error(chalk.red(`\nError: ${message}\n`));
        if (error instanceof Error && error.stack) {
          console.error(chalk.gray(error.stack));
        }
      }

      process.exit(2); // Internal error
    }
  }

  /**
   * Handle baseline mode
   */
  private async handleBaselineMode(
    targetPath: string,
    result: any,
    cliOptions: CliOptions,
    format: OutputFormat,
    failLevel: Severity
  ): Promise<void> {
    const baselineName = cliOptions.baseline!;

    // Check if baseline exists
    const exists = await baselineExists(targetPath, baselineName);

    if (!exists) {
      // Auto-create baseline
      logger.warn(`⚠️  Baseline '${baselineName}' not found. Creating from current analysis...`);
      
      await createBaseline(targetPath, baselineName, result.issues, {
        detectors: result.detectors || [],
        autoCreated: true,
      });

      logger.success(`✅ Baseline '${baselineName}' created: .odavl/baselines/${baselineName}.json`);
      logger.info(`📊 Analyzing against new baseline...\n`);

      // Continue with newly created baseline
    }

    // Load baseline
    const baseline = await loadBaseline(targetPath, baselineName);

    // Compare with baseline
    const comparison = compareWithBaseline(
      result.issues,
      baseline,
      baselineName
    );

    // Format output
    const formatter = getFormatter(format);
    const output = formatter.formatWithBaseline
      ? formatter.formatWithBaseline(result, comparison, cliOptions.showResolved)
      : formatter.format(result);
    console.log(output);

    // Calculate exit code based on new issues
    const exitCode = this.calculateExitCodeWithBaseline(
      comparison,
      failLevel,
      cliOptions.failOnNew
    );

    process.exit(exitCode);
  }

  /**
   * Validate output format
   */
  private validateFormat(format: string): OutputFormat {
    const validFormats: OutputFormat[] = ['human', 'json', 'sarif'];
    if (!validFormats.includes(format as OutputFormat)) {
      throw new Error(
        `Invalid format: ${format}. Valid formats: ${validFormats.join(', ')}`
      );
    }
    return format as OutputFormat;
  }

  /**
   * Validate severity level
   */
  private validateSeverity(severity: string): Severity {
    const validSeverities: Severity[] = [
      'critical',
      'high',
      'medium',
      'low',
      'info',
    ];
    if (!validSeverities.includes(severity as Severity)) {
      throw new Error(
        `Invalid fail-level: ${severity}. Valid levels: ${validSeverities.join(', ')}`
      );
    }
    return severity as Severity;
  }

  /**
   * Calculate exit code based on issues and fail level
   */
  private calculateExitCode(
    result: {
      summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
      };
    },
    failLevel: Severity
  ): ExitCode {
    const { summary } = result;

    // Define severity weights (higher = more severe)
    const severityWeights: Record<Severity, number> = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      info: 1,
    };

    const failWeight = severityWeights[failLevel];

    // Check if any issues at or above fail level exist
    const hasFailingIssues =
      (failWeight <= severityWeights.critical && summary.critical > 0) ||
      (failWeight <= severityWeights.high && summary.high > 0) ||
      (failWeight <= severityWeights.medium && summary.medium > 0) ||
      (failWeight <= severityWeights.low && summary.low > 0) ||
      (failWeight <= severityWeights.info && summary.info > 0);

    return hasFailingIssues ? 1 : 0;
  }

  /**
   * Calculate exit code with baseline (only NEW issues count)
   */
  private calculateExitCodeWithBaseline(
    comparison: any,
    failLevel: Severity,
    failOnNew: boolean
  ): ExitCode {
    const { newIssues } = comparison;

    // Strict mode: fail on ANY new issue
    if (failOnNew && newIssues.length > 0) {
      return 1;
    }

    // Count new issues by severity
    const newCounts = countBySeverity(newIssues);

    // Define severity weights
    const severityWeights: Record<Severity, number> = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      info: 1,
    };

    const failWeight = severityWeights[failLevel];

    // Check if any NEW issues at or above fail level exist
    const hasFailingNewIssues =
      (failWeight <= severityWeights.critical && newCounts.critical > 0) ||
      (failWeight <= severityWeights.high && newCounts.high > 0) ||
      (failWeight <= severityWeights.medium && newCounts.medium > 0) ||
      (failWeight <= severityWeights.low && newCounts.low > 0) ||
      (failWeight <= severityWeights.info && newCounts.info > 0);

    return hasFailingNewIssues ? 1 : 0;
  }
}
