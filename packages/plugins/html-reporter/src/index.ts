/**
 * ODAVL HTML Reporter Plugin
 * Generate beautiful HTML reports with charts
 */

import { ReporterPlugin, type PluginContext, type ReportOptions } from '@odavl-studio/sdk/plugin';

export class HTMLReporterPlugin extends ReporterPlugin {
  async onInit(context: PluginContext): Promise<void> {
    this.logger = context.logger;
  }

  async generate(data: any, options?: ReportOptions): Promise<string> {
    const { issues = [], metrics = {}, timestamp = new Date() } = data;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ODAVL Analysis Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 10px; margin-bottom: 20px; }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric-value { font-size: 36px; font-weight: bold; margin-bottom: 5px; }
    .metric-label { color: #666; font-size: 14px; }
    .issues { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .issue { border-left: 4px solid #667eea; padding: 15px; margin-bottom: 15px; background: #f9f9f9; }
    .issue.critical { border-color: #e53e3e; }
    .issue.high { border-color: #ed8936; }
    .issue.medium { border-color: #ecc94b; }
    .issue.low { border-color: #48bb78; }
    .severity { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .severity.critical { background: #e53e3e; color: white; }
    .severity.high { background: #ed8936; color: white; }
    .severity.medium { background: #ecc94b; color: black; }
    .severity.low { background: #48bb78; color: white; }
    .footer { text-align: center; color: #666; margin-top: 40px; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 ODAVL Analysis Report</h1>
      <p>Generated on ${new Date(timestamp).toLocaleString()}</p>
    </div>

    <div class="metrics">
      <div class="metric-card">
        <div class="metric-value">${issues.length}</div>
        <div class="metric-label">Total Issues</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${issues.filter((i: any) => i.severity === 'critical').length}</div>
        <div class="metric-label">Critical</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${metrics.filesAnalyzed || 0}</div>
        <div class="metric-label">Files Analyzed</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${metrics.linesOfCode || 0}</div>
        <div class="metric-label">Lines of Code</div>
      </div>
    </div>

    <div class="issues">
      <h2 style="margin-bottom: 20px;">Issues Found</h2>
      ${issues.map((issue: any, idx: number) => `
        <div class="issue ${issue.severity}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span class="severity ${issue.severity}">${issue.severity}</span>
            <code style="background: #eee; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${issue.file}:${issue.line}</code>
          </div>
          <h3 style="margin-bottom: 8px;">${issue.message}</h3>
          ${issue.suggestion ? `<p style="color: #666; margin-bottom: 8px;"><strong>💡 Suggestion:</strong> ${issue.suggestion}</p>` : ''}
          ${issue.code ? `<pre style="background: #2d3748; color: #fff; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 13px;">${issue.code}</pre>` : ''}
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <p>Powered by <strong>ODAVL Studio</strong> • <a href="https://odavl.studio">odavl.studio</a></p>
    </div>
  </div>
</body>
</html>
`;

    return html;
  }

  getExtension(): string {
    return '.html';
  }

  supports(format: string): boolean {
    return format === 'html';
  }

  async onDestroy(): Promise<void> {
    this.logger?.info('HTML Reporter destroyed');
  }

  validate(): boolean {
    return true;
  }
}

export default HTMLReporterPlugin;
