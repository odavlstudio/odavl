/**
 * Report Service
 * Handles all Guardian report generation, storage, and comparison
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';

export interface GuardianReport {
  timestamp: string;
  version: string;
  path: string;
  readiness: number;
  confidence: number;
  issues: {
    total: number;
    critical: number;
    warnings: number;
    info: number;
  };
  phases: {
    staticAnalysis: { status: string; duration: number };
    runtimeTests: { status: string; duration: number };
    aiVisualAnalysis: { status: string; duration: number };
    aiErrorAnalysis: { status: string; duration: number };
  };
  executionTime: number;
  metadata?: {
    usedAI: boolean;
    fallbackMode?: boolean;
    environment?: string;
  };
}

export interface ReportComparison {
  current: GuardianReport;
  previous: GuardianReport;
  changes: {
    readiness: { value: number; trend: 'up' | 'down' | 'same' };
    issues: { value: number; trend: 'up' | 'down' | 'same' };
    critical: { value: number; trend: 'up' | 'down' | 'same' };
  };
}

export class ReportService {
  /**
   * Save report to disk
   */
  async saveReport(report: GuardianReport, projectPath: string): Promise<string> {
    const reportDir = join(projectPath, '.guardian', 'reports');
    await mkdir(reportDir, { recursive: true });

    const reportPath = join(reportDir, `report-${Date.now()}.json`);
    const latestPath = join(reportDir, 'latest.json');

    await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    await writeFile(latestPath, JSON.stringify(report, null, 2), 'utf8');

    return reportPath;
  }

  /**
   * Load previous report
   */
  async loadPreviousReport(projectPath: string): Promise<GuardianReport | null> {
    try {
      const latestPath = join(projectPath, '.guardian', 'reports', 'latest.json');
      const content = await readFile(latestPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Compare current report with previous
   */
  compareReports(current: GuardianReport, previous: GuardianReport): ReportComparison {
    const readinessDiff = current.readiness - previous.readiness;
    const issuesDiff = current.issues.total - previous.issues.total;
    const criticalDiff = current.issues.critical - previous.issues.critical;

    return {
      current,
      previous,
      changes: {
        readiness: {
          value: readinessDiff,
          trend: readinessDiff > 0 ? 'up' : readinessDiff < 0 ? 'down' : 'same',
        },
        issues: {
          value: issuesDiff,
          trend: issuesDiff > 0 ? 'up' : issuesDiff < 0 ? 'down' : 'same',
        },
        critical: {
          value: criticalDiff,
          trend: criticalDiff > 0 ? 'up' : criticalDiff < 0 ? 'down' : 'same',
        },
      },
    };
  }

  /**
   * Format comparison for display
   */
  formatComparison(
    current: number,
    previous: number,
    format: 'percent' | 'number' = 'number'
  ): string {
    const diff = current - previous;
    if (diff === 0) return chalk.gray('→');

    const arrow = diff > 0 ? '↗' : '↘';
    const color = diff > 0 ? chalk.red : chalk.green;
    const sign = diff > 0 ? '+' : '';

    if (format === 'percent') {
      return color(`${arrow} ${sign}${diff.toFixed(1)}%`);
    }

    return color(`${arrow} ${sign}${diff}`);
  }

  /**
   * Get severity status
   */
  getSeverityStatus(issues: {
    total: number;
    critical: number;
  }): { color: string; text: string; emoji: string } {
    if (issues.total === 0) {
      return { color: 'green', text: 'Ready to Launch', emoji: '✅' };
    } else if (issues.critical > 0 || issues.total >= 4) {
      return { color: 'red', text: 'Fix Required', emoji: '❌' };
    } else if (issues.total >= 1 && issues.total <= 3) {
      return { color: 'yellow', text: 'Review Recommended', emoji: '⚠️' };
    }
    return { color: 'gray', text: 'Unknown', emoji: '❓' };
  }

  /**
   * Get readiness color
   */
  getReadinessColor(readiness: number): typeof chalk {
    if (readiness >= 90) return chalk.green;
    if (readiness >= 75) return chalk.yellow;
    return chalk.red;
  }

  /**
   * Display report summary
   */
  displayReport(report: GuardianReport, comparison?: ReportComparison): void {
    const status = this.getSeverityStatus(report.issues);
    const readinessColor = this.getReadinessColor(report.readiness);

    console.log('\n' + chalk.bold('═'.repeat(60)));
    console.log(chalk.bold.cyan('  GUARDIAN REPORT'));
    console.log(chalk.bold('═'.repeat(60)));

    console.log(
      `\n  ${status.emoji} Status: ${chalk[status.color as keyof typeof chalk](status.text)}`
    );
    console.log(`  🎯 Readiness: ${readinessColor(`${report.readiness}%`)}`);
    console.log(`  📊 Confidence: ${report.confidence}%`);

    if (comparison) {
      const { changes } = comparison;
      console.log(
        `  📈 vs Previous: ${this.formatComparison(report.readiness, comparison.previous.readiness, 'percent')}`
      );
    }

    console.log(`\n  📋 Issues:`);
    console.log(`     Total: ${report.issues.total}`);
    console.log(`     Critical: ${chalk.red(report.issues.critical)}`);
    console.log(`     Warnings: ${chalk.yellow(report.issues.warnings)}`);
    console.log(`     Info: ${chalk.blue(report.issues.info)}`);

    console.log(`\n  ⏱️  Execution Time: ${(report.executionTime / 1000).toFixed(2)}s`);

    if (report.metadata?.fallbackMode) {
      console.log(
        `\n  ⚠️  ${chalk.yellow('Ran in fallback mode (AI not available)')}`
      );
    }

    console.log('\n' + chalk.bold('═'.repeat(60)) + '\n');
  }

  /**
   * Export report to HTML
   */
  async exportToHTML(report: GuardianReport, outputPath: string): Promise<void> {
    const status = this.getSeverityStatus(report.issues);
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Guardian Report - ${new Date(report.timestamp).toLocaleString()}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
    .status { font-size: 24px; margin: 20px 0; }
    .status.ready { color: #4CAF50; }
    .status.warning { color: #FF9800; }
    .status.error { color: #F44336; }
    .metric { display: inline-block; margin: 20px 40px 20px 0; }
    .metric-label { font-size: 14px; color: #666; }
    .metric-value { font-size: 32px; font-weight: bold; color: #333; }
    .issues { margin: 30px 0; }
    .issue-row { padding: 10px; margin: 5px 0; border-left: 4px solid; background: #f9f9f9; }
    .issue-critical { border-color: #F44336; }
    .issue-warning { border-color: #FF9800; }
    .issue-info { border-color: #2196F3; }
    .phase { margin: 20px 0; padding: 15px; background: #f0f0f0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🛡️ Guardian Launch Report</h1>
    
    <div class="status ${status.color}">
      ${status.emoji} ${status.text}
    </div>
    
    <div class="metrics">
      <div class="metric">
        <div class="metric-label">Readiness</div>
        <div class="metric-value">${report.readiness}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Confidence</div>
        <div class="metric-value">${report.confidence}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Total Issues</div>
        <div class="metric-value">${report.issues.total}</div>
      </div>
    </div>
    
    <div class="issues">
      <h2>Issues Breakdown</h2>
      <div class="issue-row issue-critical">
        <strong>Critical:</strong> ${report.issues.critical}
      </div>
      <div class="issue-row issue-warning">
        <strong>Warnings:</strong> ${report.issues.warnings}
      </div>
      <div class="issue-row issue-info">
        <strong>Info:</strong> ${report.issues.info}
      </div>
    </div>
    
    <div class="phases">
      <h2>Analysis Phases</h2>
      ${Object.entries(report.phases)
        .map(
          ([name, phase]) => `
        <div class="phase">
          <strong>${name}:</strong> ${phase.status} (${phase.duration}ms)
        </div>
      `
        )
        .join('')}
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
      Generated: ${new Date(report.timestamp).toLocaleString()}<br>
      Version: ${report.version}<br>
      Execution Time: ${(report.executionTime / 1000).toFixed(2)}s
    </div>
  </div>
</body>
</html>
    `.trim();

    await writeFile(outputPath, html, 'utf8');
  }

  /**
   * Create empty report template
   */
  createEmptyReport(projectPath: string): GuardianReport {
    return {
      timestamp: new Date().toISOString(),
      version: '4.0.0',
      path: projectPath,
      readiness: 0,
      confidence: 0,
      issues: {
        total: 0,
        critical: 0,
        warnings: 0,
        info: 0,
      },
      phases: {
        staticAnalysis: { status: 'pending', duration: 0 },
        runtimeTests: { status: 'pending', duration: 0 },
        aiVisualAnalysis: { status: 'pending', duration: 0 },
        aiErrorAnalysis: { status: 'pending', duration: 0 },
      },
      executionTime: 0,
    };
  }
}

// Singleton instance
let reportServiceInstance: ReportService | null = null;

/**
 * Get report service instance (singleton)
 */
export function getReportService(): ReportService {
  if (!reportServiceInstance) {
    reportServiceInstance = new ReportService();
  }
  return reportServiceInstance;
}
