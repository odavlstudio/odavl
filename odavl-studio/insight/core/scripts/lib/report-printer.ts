/**
 * Report Printer - Console output formatting
 */

import { c } from './colors.js';
import type { EnhancedIssue } from '../../src/analyzer/enhanced-analyzer.js';
import type { DetectorResult } from './detector-runner.js';

const colors = {
  reset: '\x1b[0m',
};

const severityColors = {
  critical: '\x1b[91m',
  high: '\x1b[93m',
  medium: '\x1b[94m',
  low: '\x1b[90m',
};

const severityIcons = {
  critical: '🚨',
  high: '⚠️',
  medium: '📊',
  low: '💡',
};

export interface SeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export function calculateSeverityBreakdown(issues: EnhancedIssue[]): SeverityBreakdown {
  const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const issue of issues) {
    const priority = issue.priority || 'low';
    if (priority in breakdown) {
      breakdown[priority as keyof SeverityBreakdown]++;
    }
  }
  return breakdown;
}

export function drawProgressBar(count: number, total: number, width = 30): string {
  const percentage = (count / total) * 100;
  const filled = Math.round((percentage / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled) + ` ${percentage.toFixed(1)}%`;
}

export function getTopPriorities(issues: EnhancedIssue[], limit: number): EnhancedIssue[] {
  return issues
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return b.confidence - a.confidence;
    })
    .slice(0, limit);
}

export function printSummary(duration: string, totalIssues: number): void {
  console.log('\n' + c('cyan', '═'.repeat(60)));
  console.log(c('bold', '📊 ANALYSIS COMPLETE'));
  console.log(c('cyan', '═'.repeat(60)));
  console.log(c('white', `⏱️  Duration: ${duration}s`));
  console.log(c('white', `📈 Total Issues: ${totalIssues}\n`));
}

export function printDetectorSummary(
  result: DetectorResult,
  enhancedIssues: EnhancedIssue[]
): void {
  const severity = calculateSeverityBreakdown(enhancedIssues);
  
  console.log(c('yellow', `\n${result.icon} ${result.name.toUpperCase()} (${result.count} issues) ${'━'.repeat(30)}`));
  
  // Show severity breakdown with progress bars
  if (severity.critical > 0) {
    const bar = drawProgressBar(severity.critical, result.count);
    console.log(`   ${severityColors.critical}${severityIcons.critical} Critical: ${severity.critical}${colors.reset}    ${severityColors.critical}${bar}${colors.reset}`);
  }
  if (severity.high > 0) {
    const bar = drawProgressBar(severity.high, result.count);
    console.log(`   ${severityColors.high}${severityIcons.high} High: ${severity.high}${colors.reset}        ${severityColors.high}${bar}${colors.reset}`);
  }
  if (severity.medium > 0) {
    const bar = drawProgressBar(severity.medium, result.count);
    console.log(`   ${severityColors.medium}${severityIcons.medium} Medium: ${severity.medium}${colors.reset}      ${severityColors.medium}${bar}${colors.reset}`);
  }
  if (severity.low > 0) {
    const bar = drawProgressBar(severity.low, result.count);
    console.log(`   ${severityColors.low}${severityIcons.low} Low: ${severity.low}${colors.reset}          ${severityColors.low}${bar}${colors.reset}`);
  }
  
  // Show top 3 priorities
  const topIssues = getTopPriorities(enhancedIssues, 3);
  if (topIssues.length > 0) {
    console.log(c('cyan', '\n   🎯 TOP PRIORITIES:'));
    topIssues.slice(0, 3).forEach((enhanced, i) => {
      const issue = enhanced.original;
      const priorityBadge = enhanced.priority === 'critical' ? 
        c('red', '[CRITICAL]') : c('yellow', '[HIGH]');
      const msg = issue.message || issue.type || 'Issue detected';
      const shortMsg = msg.length > 60 ? msg.substring(0, 57) + '...' : msg;
      console.log(c('white', `   ${i + 1}. ${priorityBadge} ${shortMsg}`));
      if (issue.file || issue.filePath) {
        const file = issue.file || issue.filePath;
        const line = issue.line || issue.startLine || '?';
        console.log(c('gray', `      📄 ${file}:${line}`));
      }
    });
  }
}

export function printDetailedIssue(enhanced: EnhancedIssue, index: number): void {
  const issue = enhanced.original;
  
  const priorityColor = enhanced.priority === 'critical' ? 'red' : 
                       enhanced.priority === 'high' ? 'yellow' : 
                       enhanced.priority === 'medium' ? 'blue' : 'gray';
  const priorityBadge = c(priorityColor, `[${enhanced.priority.toUpperCase()}]`);
  
  const confColor = enhanced.confidence >= 90 ? 'green' : 
                   enhanced.confidence >= 70 ? 'yellow' : 'red';
  const confBadge = c(confColor, `${enhanced.confidence}% confident`);

  console.log(c('red', `\n${index}. ${issue.message || issue.type || 'Issue detected'}`));
  console.log(`   ${priorityBadge} ${confBadge}`);
  
  if (issue.file || issue.filePath) {
    const file = issue.file || issue.filePath;
    const line = issue.line || issue.startLine || '?';
    const col = issue.column || issue.startColumn || '?';
    console.log(c('gray', `   📄 ${file}:${line}:${col}`));
  }

  if (enhanced.fileContext) {
    const ctx = enhanced.fileContext;
    const contextStr = [
      ctx.framework ? `${ctx.framework}` : null,
      ctx.pattern ? `${ctx.pattern}` : null
    ].filter(Boolean).join(' • ');
    if (contextStr) {
      console.log(c('blue', `   🏗️  ${contextStr}`));
    }
  }

  const impacts = [];
  if (enhanced.impact.security > 0) impacts.push(c('red', `Security: ${enhanced.impact.security}/10`));
  if (enhanced.impact.performance > 0) impacts.push(c('yellow', `Performance: ${enhanced.impact.performance}/10`));
  if (enhanced.impact.maintainability > 0) impacts.push(c('blue', `Maintainability: ${enhanced.impact.maintainability}/10`));
  if (impacts.length > 0) {
    console.log(`   📊 Impact: ${impacts.join(' • ')}`);
  }

  if (enhanced.rootCause) {
    console.log(c('cyan', `   🔍 Root Cause: ${enhanced.rootCause.substring(0, 100)}...`));
  }

  if (enhanced.smartFix) {
    const firstLine = enhanced.smartFix.split('\n')[0];
    console.log(c('green', `   💡 Quick Fix: ${firstLine}`));
  }

  if (enhanced.preventionTip) {
    console.log(c('magenta', `   ${enhanced.preventionTip}`));
  }
}
