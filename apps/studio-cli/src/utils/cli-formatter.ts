/**
 * Phase 1.5: CLI Formatter - Consistent output styling
 * 
 * Provides icons, colors, and formatting helpers for polished CLI output.
 */

import chalk from 'chalk';

/**
 * Icons for different output types (using Unicode)
 */
export const icons = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  rocket: '🚀',
  mag: '🔍',
  cache: '💾',
  skip: '⏭',
  clock: '⏱',
  file: '📄',
  folder: '📁',
  chart: '📊',
  sparkles: '✨',
  lightning: '⚡',
  package: '📦',
  wrench: '🔧',
} as const;

/**
 * Severity colors
 */
export const severityColor = {
  critical: chalk.red.bold,
  high: chalk.red,
  medium: chalk.yellow,
  low: chalk.blue,
  info: chalk.gray,
} as const;

/**
 * Format a section header
 */
export function header(text: string): string {
  return chalk.cyan.bold(`\n${text}\n${'─'.repeat(text.length)}`);
}

/**
 * Format a success message
 */
export function success(text: string): string {
  return chalk.green(`${icons.success} ${text}`);
}

/**
 * Format an error message
 */
export function error(text: string): string {
  return chalk.red(`${icons.error} ${text}`);
}

/**
 * Format a warning message
 */
export function warning(text: string): string {
  return chalk.yellow(`${icons.warning} ${text}`);
}

/**
 * Format an info message
 */
export function info(text: string): string {
  return chalk.blue(`${icons.info} ${text}`);
}

/**
 * Format a stat line (label: value)
 */
export function stat(label: string, value: string | number, color: 'green' | 'yellow' | 'blue' | 'gray' = 'gray'): string {
  const colorFn = color === 'green' ? chalk.green : 
                   color === 'yellow' ? chalk.yellow : 
                   color === 'blue' ? chalk.blue : 
                   chalk.gray;
  return `  ${chalk.gray(label + ':')} ${colorFn(value)}`;
}

/**
 * Format a progress message
 */
export function progress(text: string): string {
  return chalk.gray(`${icons.mag} ${text}`);
}

/**
 * Format analysis summary box
 */
export function summaryBox(stats: {
  filesAnalyzed: number;
  filesCached: number;
  detectorsSkipped: number;
  issuesFound: number;
  timeElapsed: string;
}): string {
  const lines = [
    '',
    chalk.cyan.bold('Analysis Summary'),
    chalk.cyan('─'.repeat(50)),
    stat('Files analyzed', stats.filesAnalyzed, 'blue'),
    stat('Files cached', stats.filesCached, stats.filesCached > 0 ? 'green' : 'gray'),
    stat('Detectors skipped', stats.detectorsSkipped, stats.detectorsSkipped > 0 ? 'green' : 'gray'),
    stat('Issues found', stats.issuesFound, stats.issuesFound > 0 ? 'yellow' : 'green'),
    stat('Time elapsed', stats.timeElapsed, 'blue'),
    chalk.cyan('─'.repeat(50)),
    '',
  ];
  return lines.join('\n');
}
