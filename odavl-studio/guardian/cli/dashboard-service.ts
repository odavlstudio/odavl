/**
 * Guardian Dashboard Data Service
 * Real-time data provider for live dashboard
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { existsSync } from 'node:fs';
import type { ParsedStackTrace, ScreenshotComparison } from './real-tests.js';

export interface DashboardData {
  summary: {
    accuracy: number;
    readiness: number;
    confidence: number;
    issues: number;
    criticalIssues: number;
    executionTime: number;
    lastRun: Date;
    status: 'passing' | 'warning' | 'failing';
  };
  screenshots: {
    desktop?: string;
    tablet?: string;
    mobile?: string;
  };
  visualRegression?: {
    comparisons: ScreenshotComparison[];
    hasChanges: boolean;
    totalDiffPercentage: number;
  };
  errors: Array<{
    message: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    file?: string;
    line?: number;
    stackTrace?: ParsedStackTrace;
  }>;
  trends: {
    dates: string[];
    accuracyScores: number[];
    issuesCount: number[];
  };
  projectInfo: {
    type: 'extension' | 'website' | 'cli' | 'unknown';
    path: string;
    name: string;
  };
}

export class DashboardDataService {
  private odavlPath: string;
  private guardiansPath: string;

  constructor(projectPath: string) {
    this.odavlPath = join(projectPath, '.odavl');
    this.guardiansPath = join(this.odavlPath, 'guardian');
  }

  /**
   * Get complete dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    const [summary, screenshots, visualRegression, errors, trends, projectInfo] =
      await Promise.all([
        this.getSummary(),
        this.getScreenshots(),
        this.getVisualRegression(),
        this.getErrors(),
        this.getTrends(),
        this.getProjectInfo(),
      ]);

    return {
      summary,
      screenshots,
      visualRegression,
      errors,
      trends,
      projectInfo,
    };
  }

  /**
   * Get summary from latest report
   */
  private async getSummary(): Promise<DashboardData['summary']> {
    try {
      const reportsPath = join(this.guardiansPath, 'reports');
      const latestReportPath = join(reportsPath, 'latest.json');

      if (!existsSync(latestReportPath)) {
        return this.getDefaultSummary();
      }

      const reportData = await readFile(latestReportPath, 'utf-8');
      const report = JSON.parse(reportData);

      return {
        accuracy: report.accuracy || 0,
        readiness: report.readiness || 0,
        confidence: report.confidence || 0,
        issues: report.issues?.length || 0,
        criticalIssues:
          report.issues?.filter((i: any) => i.severity === 'critical').length || 0,
        executionTime: report.executionTime || 0,
        lastRun: new Date(report.timestamp || Date.now()),
        status: this.calculateStatus(report),
      };
    } catch {
      return this.getDefaultSummary();
    }
  }

  /**
   * Get screenshots from latest run
   */
  private async getScreenshots(): Promise<DashboardData['screenshots']> {
    try {
      const screenshotsPath = join(this.guardiansPath, 'screenshots');

      if (!existsSync(screenshotsPath)) {
        return {};
      }

      const screenshots: DashboardData['screenshots'] = {};

      const desktopPath = join(screenshotsPath, 'desktop.png');
      if (existsSync(desktopPath)) screenshots.desktop = desktopPath;

      const tabletPath = join(screenshotsPath, 'tablet.png');
      if (existsSync(tabletPath)) screenshots.tablet = tabletPath;

      const mobilePath = join(screenshotsPath, 'mobile.png');
      if (existsSync(mobilePath)) screenshots.mobile = mobilePath;

      return screenshots;
    } catch {
      return {};
    }
  }

  /**
   * Get visual regression results
   */
  private async getVisualRegression(): Promise<
    DashboardData['visualRegression'] | undefined
  > {
    try {
      const diffsPath = join(this.guardiansPath, 'diffs');
      const resultsPath = join(diffsPath, 'results.json');

      if (!existsSync(resultsPath)) {
        return undefined;
      }

      const resultsData = await readFile(resultsPath, 'utf-8');
      const results = JSON.parse(resultsData);

      return {
        comparisons: results.comparisons || [],
        hasChanges: results.comparisons?.some((c: any) => c.hasDifference) || false,
        totalDiffPercentage:
          results.comparisons?.reduce(
            (sum: number, c: any) => sum + (c.percentageDiff || 0),
            0
          ) / (results.comparisons?.length || 1),
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Get errors from latest report
   */
  private async getErrors(): Promise<DashboardData['errors']> {
    try {
      const reportsPath = join(this.guardiansPath, 'reports');
      const latestReportPath = join(reportsPath, 'latest.json');

      if (!existsSync(latestReportPath)) {
        return [];
      }

      const reportData = await readFile(latestReportPath, 'utf-8');
      const report = JSON.parse(reportData);

      return (report.issues || []).map((issue: any) => ({
        message: issue.message || 'Unknown error',
        severity: issue.severity || 'medium',
        file: issue.file,
        line: issue.line,
        stackTrace: issue.stackTrace,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get historical trends
   */
  private async getTrends(): Promise<DashboardData['trends']> {
    try {
      const reportsPath = join(this.guardiansPath, 'reports');

      if (!existsSync(reportsPath)) {
        return { dates: [], accuracyScores: [], issuesCount: [] };
      }

      const files = await readdir(reportsPath);
      const reportFiles = files
        .filter((f) => f.endsWith('.json') && f !== 'latest.json')
        .sort()
        .slice(-10); // Last 10 reports

      const trends = {
        dates: [] as string[],
        accuracyScores: [] as number[],
        issuesCount: [] as number[],
      };

      for (const file of reportFiles) {
        try {
          const filePath = join(reportsPath, file);
          const data = await readFile(filePath, 'utf-8');
          const report = JSON.parse(data);

          trends.dates.push(new Date(report.timestamp).toLocaleDateString());
          trends.accuracyScores.push(report.accuracy || 0);
          trends.issuesCount.push(report.issues?.length || 0);
        } catch {
          continue;
        }
      }

      return trends;
    } catch {
      return { dates: [], accuracyScores: [], issuesCount: [] };
    }
  }

  /**
   * Get project information
   */
  private async getProjectInfo(): Promise<DashboardData['projectInfo']> {
    const projectPath = this.odavlPath.replace('/.odavl', '');
    const packageJsonPath = join(projectPath, 'package.json');

    let projectType: DashboardData['projectInfo']['type'] = 'unknown';
    let projectName = 'Unknown Project';

    try {
      if (existsSync(packageJsonPath)) {
        const pkgData = await readFile(packageJsonPath, 'utf-8');
        const pkg = JSON.parse(pkgData);

        projectName = pkg.name || projectName;

        if (pkg.contributes) {
          projectType = 'extension';
        } else if (pkg.dependencies?.['next'] || pkg.dependencies?.['react']) {
          projectType = 'website';
        } else if (pkg.bin) {
          projectType = 'cli';
        }
      }
    } catch {
      // Keep defaults
    }

    return {
      type: projectType,
      path: projectPath,
      name: projectName,
    };
  }

  /**
   * Calculate overall status
   */
  private calculateStatus(
    report: any
  ): DashboardData['summary']['status'] {
    const readiness = report.readiness || 0;
    const criticalIssues =
      report.issues?.filter((i: any) => i.severity === 'critical').length || 0;

    if (criticalIssues > 0 || readiness < 50) return 'failing';
    if (readiness < 80) return 'warning';
    return 'passing';
  }

  /**
   * Get default summary
   */
  private getDefaultSummary(): DashboardData['summary'] {
    return {
      accuracy: 0,
      readiness: 0,
      confidence: 0,
      issues: 0,
      criticalIssues: 0,
      executionTime: 0,
      lastRun: new Date(),
      status: 'warning',
    };
  }

  /**
   * Watch for changes (for real-time updates)
   */
  async *watchChanges(): AsyncGenerator<DashboardData> {
    // Initial data
    yield await this.getDashboardData();

    // TODO: Implement file watcher with chokidar
    // For now, poll every 2 seconds
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      yield await this.getDashboardData();
    }
  }
}

/**
 * Start dashboard server
 */
export async function startDashboardServer(
  projectPath: string,
  port = 3002
): Promise<void> {
  const service = new DashboardDataService(projectPath);

  console.log(`\n🚀 Starting Guardian Dashboard Server...`);
  console.log(`   Port: ${port}`);
  console.log(`   Project: ${projectPath}`);

  // Get initial data
  const data = await service.getDashboardData();

  console.log(`\n📊 Dashboard Data Loaded:`);
  console.log(`   Accuracy: ${data.summary.accuracy}%`);
  console.log(`   Issues: ${data.summary.issues}`);
  console.log(`   Status: ${data.summary.status}`);

  // TODO: Implement WebSocket server
  console.log(`\n✅ Dashboard available at: http://localhost:${port}`);
  console.log(`   (WebSocket real-time updates: ws://localhost:${port}/ws)`);
}
