import { TestReport } from './test-orchestrator';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ReportOptions {
  outputDir?: string;
  filename?: string;
  format?: 'json' | 'html' | 'both';
}

export class ReportGenerator {
  /**
   * Generate and save test report
   */
  async generate(report: TestReport, options: ReportOptions = {}): Promise<string> {
    const outputDir = options.outputDir || '.odavl/guardian';
    const filename = options.filename || `report-${Date.now()}.json`;
    const format = options.format || 'json';

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const jsonPath = path.join(outputDir, filename);

    // Generate JSON report
    if (format === 'json' || format === 'both') {
      await this.generateJSON(report, jsonPath);
    }

    // Generate HTML report
    if (format === 'html' || format === 'both') {
      const htmlFilename = filename.replace('.json', '.html');
      const htmlPath = path.join(outputDir, htmlFilename);
      await this.generateHTML(report, htmlPath);
    }

    return jsonPath;
  }

  /**
   * Generate JSON report
   */
  private async generateJSON(report: TestReport, filepath: string): Promise<void> {
    await fs.writeFile(filepath, JSON.stringify(report, null, 2), 'utf8');
  }

  /**
   * Generate HTML report
   */
  private async generateHTML(report: TestReport, filepath: string): Promise<void> {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guardian Test Report - ${report.url}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: ${report.status === 'passed' ? '#10b981' : '#ef4444'}; color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { font-size: 24px; margin-bottom: 10px; }
    .header .status { font-size: 48px; font-weight: bold; text-transform: uppercase; }
    .meta { padding: 20px 30px; border-bottom: 1px solid #e5e5e5; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .meta-item { display: flex; flex-direction: column; }
    .meta-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
    .meta-value { font-size: 16px; font-weight: 600; }
    .metrics { padding: 30px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; }
    .metric { background: #f9fafb; padding: 20px; border-radius: 6px; text-align: center; }
    .metric-value { font-size: 32px; font-weight: bold; }
    .metric-label { font-size: 14px; color: #666; margin-top: 5px; }
    .metric.critical .metric-value { color: #ef4444; }
    .metric.high .metric-value { color: #f59e0b; }
    .metric.medium .metric-value { color: #3b82f6; }
    .metric.low .metric-value { color: #6b7280; }
    .issues { padding: 30px; }
    .issues h2 { font-size: 20px; margin-bottom: 20px; }
    .issue { background: #f9fafb; border-left: 4px solid; padding: 20px; margin-bottom: 20px; border-radius: 4px; }
    .issue.critical { border-color: #ef4444; }
    .issue.high { border-color: #f59e0b; }
    .issue.medium { border-color: #3b82f6; }
    .issue.low { border-color: #6b7280; }
    .issue-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px; }
    .issue-type { font-weight: 600; font-size: 16px; }
    .issue-severity { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .issue-severity.critical { background: #fee2e2; color: #991b1b; }
    .issue-severity.high { background: #fef3c7; color: #92400e; }
    .issue-severity.medium { background: #dbeafe; color: #1e40af; }
    .issue-severity.low { background: #f3f4f6; color: #374151; }
    .issue-message { color: #374151; margin-bottom: 15px; }
    .fix-suggestions { background: white; padding: 15px; border-radius: 4px; }
    .fix-suggestions h4 { font-size: 14px; margin-bottom: 10px; color: #374151; }
    .fix-suggestions ol { padding-left: 20px; }
    .fix-suggestions li { margin-bottom: 8px; color: #6b7280; }
    .no-issues { padding: 60px 30px; text-align: center; color: #10b981; }
    .no-issues-icon { font-size: 64px; margin-bottom: 20px; }
    .no-issues-text { font-size: 24px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Guardian Test Report</h1>
      <div class="status">${report.status}</div>
    </div>

    <div class="meta">
      <div class="meta-item">
        <div class="meta-label">URL</div>
        <div class="meta-value">${report.url}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Timestamp</div>
        <div class="meta-value">${new Date(report.timestamp).toLocaleString()}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Duration</div>
        <div class="meta-value">${(report.duration / 1000).toFixed(2)}s</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Browser</div>
        <div class="meta-value">${report.browserType}</div>
      </div>
    </div>

    <div class="metrics">
      <div class="metric">
        <div class="metric-value">${report.metrics.totalIssues}</div>
        <div class="metric-label">Total Issues</div>
      </div>
      <div class="metric critical">
        <div class="metric-value">${report.metrics.critical}</div>
        <div class="metric-label">Critical</div>
      </div>
      <div class="metric high">
        <div class="metric-value">${report.metrics.high}</div>
        <div class="metric-label">High</div>
      </div>
      <div class="metric medium">
        <div class="metric-value">${report.metrics.medium}</div>
        <div class="metric-label">Medium</div>
      </div>
      <div class="metric low">
        <div class="metric-value">${report.metrics.low}</div>
        <div class="metric-label">Low</div>
      </div>
    </div>

    <div class="issues">
      ${report.issues.length === 0 ? `
        <div class="no-issues">
          <div class="no-issues-icon">✅</div>
          <div class="no-issues-text">No issues detected!</div>
        </div>
      ` : `
        <h2>Issues Detected (${report.issues.length})</h2>
        ${report.issues.map(issue => `
          <div class="issue ${issue.severity}">
            <div class="issue-header">
              <div class="issue-type">${issue.type.replace(/_/g, ' ')}</div>
              <div class="issue-severity ${issue.severity}">${issue.severity}</div>
            </div>
            <div class="issue-message">${issue.message}</div>
            <div class="fix-suggestions">
              <h4>💡 Suggested Fixes:</h4>
              <ol>
                ${issue.fix.map(suggestion => `<li>${suggestion}</li>`).join('')}
              </ol>
            </div>
          </div>
        `).join('')}
      `}
    </div>
  </div>
</body>
</html>`;

    await fs.writeFile(filepath, html, 'utf8');
  }

  /**
   * Generate batch report (multiple test results)
   */
  async generateBatch(reports: TestReport[], options: ReportOptions = {}): Promise<string> {
    const outputDir = options.outputDir || '.odavl/guardian';
    const filename = options.filename || `batch-report-${Date.now()}.json`;

    await fs.mkdir(outputDir, { recursive: true });

    const batchReport = {
      timestamp: new Date().toISOString(),
      totalTests: reports.length,
      passed: reports.filter(r => r.status === 'passed').length,
      failed: reports.filter(r => r.status === 'failed').length,
      reports
    };

    const filepath = path.join(outputDir, filename);
    await fs.writeFile(filepath, JSON.stringify(batchReport, null, 2), 'utf8');

    return filepath;
  }
}
