/**
 * @fileoverview Jenkins Integration
 * Provides seamless integration with Jenkins CI/CD pipelines
 * Automatically runs ODAVL Insight analysis and reports results
 * 
 * Features:
 * - Auto-detect Jenkins environment
 * - Build status (pass/fail based on thresholds)
 * - Build badges and trend graphs
 * - Warnings Plugin integration
 * - HTML Publisher reports
 * - Email notifications
 * 
 * @module integrations/jenkins
 */

import type { AnalysisResult, Issue } from '../types';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Jenkins configuration
 */
export interface JenkinsConfig {
  /** Jenkins URL */
  jenkinsUrl?: string;
  
  /** Build number */
  buildNumber?: string;
  
  /** Job name */
  jobName?: string;
  
  /** Enable Warnings Plugin integration */
  enableWarningsPlugin?: boolean;
  
  /** Enable HTML reports */
  enableHtmlReports?: boolean;
  
  /** Enable email notifications */
  enableEmail?: boolean;
  
  /** Email recipients */
  emailRecipients?: string[];
  
  /** Fail on error threshold */
  failThreshold?: {
    critical?: number;
    high?: number;
    medium?: number;
  };
  
  /** Trend chart options */
  trendChart?: {
    enabled?: boolean;
    height?: number;
    width?: number;
  };
}

/**
 * Jenkins environment variables
 */
export interface JenkinsEnv {
  /** Is running in Jenkins */
  isJenkins: boolean;
  
  /** Build number */
  buildNumber: string;
  
  /** Build ID */
  buildId: string;
  
  /** Job name */
  jobName: string;
  
  /** Build URL */
  buildUrl: string;
  
  /** Jenkins URL */
  jenkinsUrl: string;
  
  /** Workspace path */
  workspace: string;
  
  /** Git commit */
  gitCommit?: string;
  
  /** Git branch */
  gitBranch?: string;
  
  /** Git URL */
  gitUrl?: string;
  
  /** User who triggered build */
  buildUser?: string;
  
  /** Change ID (for PRs) */
  changeId?: string;
}

/**
 * Jenkins Warnings Plugin format
 * https://plugins.jenkins.io/warnings-ng/
 */
export interface WarningsNGReport {
  issues: Array<{
    fileName: string;
    lineStart: number;
    lineEnd?: number;
    message: string;
    severity: 'ERROR' | 'WARNING_HIGH' | 'WARNING_NORMAL' | 'WARNING_LOW';
    type: string;
    category: string;
    description?: string;
  }>;
}

/**
 * Jenkins HTML report structure
 */
export interface HtmlReport {
  title: string;
  summary: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    filesAnalyzed: number;
    linesOfCode: number;
    duration: number;
  };
  issues: Issue[];
  trends?: {
    buildNumbers: number[];
    issueCounts: number[];
  };
}

// ============================================================================
// Jenkins Integration Class
// ============================================================================

/**
 * Jenkins integration for automated analysis
 */
export class JenkinsIntegration {
  private config: Required<JenkinsConfig>;
  private env: JenkinsEnv;

  constructor(config: JenkinsConfig = {}) {
    this.config = {
      jenkinsUrl: config.jenkinsUrl || '',
      buildNumber: config.buildNumber || '',
      jobName: config.jobName || '',
      enableWarningsPlugin: config.enableWarningsPlugin ?? true,
      enableHtmlReports: config.enableHtmlReports ?? true,
      enableEmail: config.enableEmail ?? false,
      emailRecipients: config.emailRecipients || [],
      failThreshold: config.failThreshold || { critical: 0, high: 5, medium: 20 },
      trendChart: {
        enabled: config.trendChart?.enabled ?? true,
        height: config.trendChart?.height || 400,
        width: config.trendChart?.width || 800,
      },
    };

    this.env = this.detectEnvironment();
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Run full Jenkins integration
   */
  async run(result: AnalysisResult): Promise<void> {
    console.log('🚀 Running Jenkins integration...');

    // 1. Generate Warnings Plugin report
    if (this.config.enableWarningsPlugin) {
      await this.generateWarningsReport(result);
    }

    // 2. Generate HTML report
    if (this.config.enableHtmlReports) {
      await this.generateHtmlReport(result);
    }

    // 3. Create build badge
    await this.createBuildBadge(result);

    // 4. Send email notification
    if (this.config.enableEmail && this.config.emailRecipients.length > 0) {
      await this.sendEmailNotification(result);
    }

    // 5. Check fail threshold
    this.checkFailThreshold(result);

    console.log('✅ Jenkins integration complete');
  }

  /**
   * Generate Warnings Plugin report (warnings-ng format)
   */
  async generateWarningsReport(result: AnalysisResult): Promise<void> {
    const issues = result.issues || [];
    
    const report: WarningsNGReport = {
      issues: issues.map(issue => ({
        fileName: issue.file,
        lineStart: issue.line || 1,
        lineEnd: issue.endLine || issue.line || 1,
        message: issue.message,
        severity: this.severityToWarnings(issue.severity),
        type: issue.rule || 'code-quality',
        category: issue.category || 'General',
        description: issue.details,
      })),
    };

    // Write to warnings-ng format (JSON)
    const reportPath = './odavl-warnings.json';
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
      console.log(`✓ Warnings Plugin report: ${reportPath} (${report.issues.length} issues)`);
    } catch (error) {
      console.error('✗ Failed to generate Warnings Plugin report:', error);
    }
  }

  /**
   * Generate HTML report for Jenkins HTML Publisher
   */
  async generateHtmlReport(result: AnalysisResult): Promise<void> {
    const issues = result.issues || [];
    const html = this.createHtmlReport(result);

    // Write to HTML file
    const reportPath = './odavl-report.html';
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(reportPath, html, 'utf8');
      console.log(`✓ HTML report: ${reportPath}`);
    } catch (error) {
      console.error('✗ Failed to generate HTML report:', error);
    }
  }

  /**
   * Create build badge
   */
  async createBuildBadge(result: AnalysisResult): Promise<void> {
    const issues = result.issues || [];
    const status = this.determineBuildStatus(result);
    const color = status === 'success' ? 'green' : status === 'warning' ? 'yellow' : 'red';
    
    const badge = {
      schemaVersion: 1,
      label: 'ODAVL Analysis',
      message: `${issues.length} issues`,
      color,
    };

    // Write badge JSON (for Jenkins Badge Plugin)
    const badgePath = './odavl-badge.json';
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(badgePath, JSON.stringify(badge, null, 2), 'utf8');
      console.log(`✓ Build badge: ${badgePath}`);
    } catch (error) {
      console.error('✗ Failed to create build badge:', error);
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(result: AnalysisResult): Promise<void> {
    // In production, integrate with Jenkins Email Extension Plugin
    // This creates an email template file that Jenkins can use
    
    const emailBody = this.createEmailBody(result);
    const emailPath = './odavl-email.html';

    try {
      const fs = await import('fs/promises');
      await fs.writeFile(emailPath, emailBody, 'utf8');
      console.log(`✓ Email template: ${emailPath}`);
      console.log(`  Recipients: ${this.config.emailRecipients.join(', ')}`);
    } catch (error) {
      console.error('✗ Failed to create email template:', error);
    }
  }

  /**
   * Check if build should fail
   */
  checkFailThreshold(result: AnalysisResult): void {
    const issues = result.issues || [];
    const critical = issues.filter(i => i.severity === 'critical').length;
    const high = issues.filter(i => i.severity === 'high').length;
    const medium = issues.filter(i => i.severity === 'medium').length;

    const { failThreshold } = this.config;

    if (critical > (failThreshold.critical || 0)) {
      this.fail(`Critical issues exceeded threshold: ${critical} > ${failThreshold.critical}`);
    }

    if (high > (failThreshold.high || 0)) {
      this.fail(`High severity issues exceeded threshold: ${high} > ${failThreshold.high}`);
    }

    if (medium > (failThreshold.medium || 0)) {
      this.fail(`Medium severity issues exceeded threshold: ${medium} > ${failThreshold.medium}`);
    }

    console.log('✓ All thresholds passed');
  }

  // --------------------------------------------------------------------------
  // Private Methods - Environment Detection
  // --------------------------------------------------------------------------

  private detectEnvironment(): JenkinsEnv {
    const isJenkins = !!process.env.JENKINS_HOME || !!process.env.JENKINS_URL;

    if (!isJenkins) {
      return {
        isJenkins: false,
        buildNumber: '',
        buildId: '',
        jobName: '',
        buildUrl: '',
        jenkinsUrl: '',
        workspace: '',
      };
    }

    return {
      isJenkins: true,
      buildNumber: process.env.BUILD_NUMBER || '',
      buildId: process.env.BUILD_ID || '',
      jobName: process.env.JOB_NAME || '',
      buildUrl: process.env.BUILD_URL || '',
      jenkinsUrl: process.env.JENKINS_URL || '',
      workspace: process.env.WORKSPACE || '',
      gitCommit: process.env.GIT_COMMIT,
      gitBranch: process.env.GIT_BRANCH,
      gitUrl: process.env.GIT_URL,
      buildUser: process.env.BUILD_USER,
      changeId: process.env.CHANGE_ID,
    };
  }

  // --------------------------------------------------------------------------
  // Private Methods - HTML Generation
  // --------------------------------------------------------------------------

  private createHtmlReport(result: AnalysisResult): string {
    const issues = result.issues || [];
    const critical = issues.filter(i => i.severity === 'critical').length;
    const high = issues.filter(i => i.severity === 'high').length;
    const medium = issues.filter(i => i.severity === 'medium').length;
    const low = issues.filter(i => i.severity === 'low').length;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ODAVL Analysis Report - Build #${this.env.buildNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
    .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
    .metric-value { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
    .metric-label { color: #6c757d; font-size: 14px; }
    .critical { color: #dc3545; }
    .high { color: #fd7e14; }
    .medium { color: #ffc107; }
    .low { color: #17a2b8; }
    .issues { padding: 30px; }
    .issue { background: #f8f9fa; padding: 20px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid #dee2e6; }
    .issue-critical { border-left-color: #dc3545; }
    .issue-high { border-left-color: #fd7e14; }
    .issue-medium { border-left-color: #ffc107; }
    .issue-low { border-left-color: #17a2b8; }
    .issue-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .issue-title { font-weight: 600; font-size: 16px; }
    .issue-severity { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .severity-critical { background: #dc3545; color: white; }
    .severity-high { background: #fd7e14; color: white; }
    .severity-medium { background: #ffc107; color: #000; }
    .severity-low { background: #17a2b8; color: white; }
    .issue-location { color: #6c757d; font-size: 14px; margin-bottom: 10px; font-family: 'Courier New', monospace; }
    .issue-message { color: #495057; line-height: 1.6; }
    .footer { padding: 20px 30px; background: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center; color: #6c757d; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 ODAVL Insight Analysis Report</h1>
      <p>Build #${this.env.buildNumber} • ${this.env.jobName} • ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
      <div class="metric">
        <div class="metric-value">${issues.length}</div>
        <div class="metric-label">Total Issues</div>
      </div>
      <div class="metric">
        <div class="metric-value critical">${critical}</div>
        <div class="metric-label">Critical</div>
      </div>
      <div class="metric">
        <div class="metric-value high">${high}</div>
        <div class="metric-label">High</div>
      </div>
      <div class="metric">
        <div class="metric-value medium">${medium}</div>
        <div class="metric-label">Medium</div>
      </div>
      <div class="metric">
        <div class="metric-value low">${low}</div>
        <div class="metric-label">Low</div>
      </div>
      <div class="metric">
        <div class="metric-value">${result.metrics?.filesAnalyzed || 0}</div>
        <div class="metric-label">Files Analyzed</div>
      </div>
    </div>

    ${issues.length > 0 ? `
    <div class="issues">
      <h2 style="margin-bottom: 20px; color: #212529;">Issues Found</h2>
      ${issues.slice(0, 50).map(issue => `
        <div class="issue issue-${issue.severity}">
          <div class="issue-header">
            <div class="issue-title">${this.escapeHtml(issue.message)}</div>
            <span class="issue-severity severity-${issue.severity}">${issue.severity}</span>
          </div>
          <div class="issue-location">${this.escapeHtml(issue.file)}:${issue.line}</div>
          ${issue.details ? `<div class="issue-message">${this.escapeHtml(issue.details)}</div>` : ''}
        </div>
      `).join('')}
      ${issues.length > 50 ? `<p style="text-align: center; color: #6c757d; margin-top: 20px;">... and ${issues.length - 50} more issues</p>` : ''}
    </div>
    ` : `
    <div class="issues">
      <p style="text-align: center; color: #28a745; font-size: 18px;">✅ No issues found! Great work!</p>
    </div>
    `}

    <div class="footer">
      Powered by <strong>ODAVL Studio</strong> • Analysis Duration: ${this.formatDuration(result.metrics?.duration || 0)}
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private createEmailBody(result: AnalysisResult): string {
    const issues = result.issues || [];
    const status = this.determineBuildStatus(result);
    const emoji = status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #667eea; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .metric { display: inline-block; margin: 10px; padding: 15px; background: #f5f5f5; border-radius: 5px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h2>${emoji} ODAVL Analysis - Build #${this.env.buildNumber}</h2>
  </div>
  <div class="content">
    <p>Analysis completed for <strong>${this.env.jobName}</strong></p>
    <div>
      <div class="metric"><strong>${issues.length}</strong> Total Issues</div>
      <div class="metric"><strong>${issues.filter(i => i.severity === 'critical').length}</strong> Critical</div>
      <div class="metric"><strong>${issues.filter(i => i.severity === 'high').length}</strong> High</div>
    </div>
    <p><a href="${this.env.buildUrl}">View Full Report</a></p>
  </div>
  <div class="footer">
    Powered by ODAVL Studio
  </div>
</body>
</html>
    `.trim();
  }

  // --------------------------------------------------------------------------
  // Private Methods - Conversions & Utilities
  // --------------------------------------------------------------------------

  private severityToWarnings(severity: string): 'ERROR' | 'WARNING_HIGH' | 'WARNING_NORMAL' | 'WARNING_LOW' {
    const map: Record<string, 'ERROR' | 'WARNING_HIGH' | 'WARNING_NORMAL' | 'WARNING_LOW'> = {
      critical: 'ERROR',
      high: 'WARNING_HIGH',
      medium: 'WARNING_NORMAL',
      low: 'WARNING_LOW',
    };
    return map[severity] || 'WARNING_NORMAL';
  }

  private determineBuildStatus(result: AnalysisResult): 'success' | 'warning' | 'failure' {
    const issues = result.issues || [];
    const critical = issues.filter(i => i.severity === 'critical').length;
    const high = issues.filter(i => i.severity === 'high').length;

    if (critical > 0) return 'failure';
    if (high > 0) return 'warning';
    return 'success';
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  private fail(message: string): never {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create Jenkins integration instance
 */
export function createJenkinsIntegration(
  config?: JenkinsConfig
): JenkinsIntegration {
  return new JenkinsIntegration(config);
}

/**
 * Auto-detect and run Jenkins integration
 */
export async function runJenkins(
  result: AnalysisResult,
  config?: JenkinsConfig
): Promise<void> {
  const integration = createJenkinsIntegration(config);
  await integration.run(result);
}

/**
 * Check if running in Jenkins
 */
export function isJenkins(): boolean {
  return !!process.env.JENKINS_HOME || !!process.env.JENKINS_URL;
}
