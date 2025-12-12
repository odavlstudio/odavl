/**
 * @fileoverview GitLab CI/CD Integration
 * Provides seamless integration with GitLab CI/CD pipelines
 * Automatically runs ODAVL Insight analysis and reports results
 * 
 * Features:
 * - Auto-detect GitLab CI environment
 * - Merge Request comments with analysis results
 * - Pipeline status (pass/fail based on thresholds)
 * - Code Quality reports (GitLab format)
 * - Security Dashboard integration
 * - Job artifacts (JSON reports)
 * 
 * @module integrations/gitlab-ci
 */

import type { AnalysisResult, Issue } from '../types';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * GitLab CI configuration
 */
export interface GitLabCIConfig {
  /** GitLab API token (GITLAB_TOKEN) */
  token: string;
  
  /** GitLab API URL (default: https://gitlab.com/api/v4) */
  apiUrl?: string;
  
  /** Project ID */
  projectId: string;
  
  /** Enable MR comments */
  enableComments?: boolean;
  
  /** Enable Code Quality reports */
  enableCodeQuality?: boolean;
  
  /** Enable Security Dashboard */
  enableSecurity?: boolean;
  
  /** Enable job artifacts */
  enableArtifacts?: boolean;
  
  /** Fail on error threshold */
  failThreshold?: {
    critical?: number;
    high?: number;
    medium?: number;
  };
}

/**
 * GitLab CI environment variables
 */
export interface GitLabEnv {
  /** Is running in GitLab CI */
  isGitLabCI: boolean;
  
  /** Project ID */
  projectId: string;
  
  /** Pipeline ID */
  pipelineId: string;
  
  /** Job ID */
  jobId: string;
  
  /** Commit SHA */
  sha: string;
  
  /** Branch name */
  branch: string;
  
  /** Merge Request IID (if MR pipeline) */
  mrIid?: string;
  
  /** User login */
  userLogin: string;
  
  /** Project URL */
  projectUrl: string;
  
  /** API URL */
  apiUrl: string;
}

/**
 * GitLab Code Quality report format
 * https://docs.gitlab.com/ee/ci/testing/code_quality.html
 */
export interface CodeQualityReport {
  description: string;
  check_name: string;
  fingerprint: string;
  severity: 'info' | 'minor' | 'major' | 'critical' | 'blocker';
  location: {
    path: string;
    lines: {
      begin: number;
      end?: number;
    };
  };
  categories?: string[];
  remediation_points?: number;
}

/**
 * GitLab Security report format (SAST)
 * https://docs.gitlab.com/ee/ci/testing/security_reports.html
 */
export interface SecurityReport {
  version: string;
  vulnerabilities: Array<{
    id: string;
    category: string;
    name: string;
    message: string;
    description: string;
    cve?: string;
    severity: 'Unknown' | 'Low' | 'Medium' | 'High' | 'Critical';
    confidence: 'Unknown' | 'Low' | 'Medium' | 'High' | 'Confirmed';
    scanner: {
      id: string;
      name: string;
    };
    location: {
      file: string;
      start_line: number;
      end_line?: number;
    };
    identifiers: Array<{
      type: string;
      name: string;
      value: string;
      url?: string;
    }>;
  }>;
  remediations?: Array<{
    fixes: Array<{
      cve?: string;
    }>;
    summary: string;
    diff: string;
  }>;
}

// ============================================================================
// GitLab CI Integration Class
// ============================================================================

/**
 * GitLab CI integration for automated analysis
 */
export class GitLabCIIntegration {
  private config: Required<GitLabCIConfig>;
  private env: GitLabEnv;

  constructor(config: GitLabCIConfig) {
    this.config = {
      token: config.token,
      apiUrl: config.apiUrl || 'https://gitlab.com/api/v4',
      projectId: config.projectId,
      enableComments: config.enableComments ?? true,
      enableCodeQuality: config.enableCodeQuality ?? true,
      enableSecurity: config.enableSecurity ?? true,
      enableArtifacts: config.enableArtifacts ?? true,
      failThreshold: config.failThreshold || { critical: 0, high: 5, medium: 20 },
    };

    this.env = this.detectEnvironment();
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Run full GitLab CI integration
   */
  async run(result: AnalysisResult): Promise<void> {
    console.log('🚀 Running GitLab CI integration...');

    // 1. Generate Code Quality report
    if (this.config.enableCodeQuality) {
      await this.generateCodeQualityReport(result);
    }

    // 2. Generate Security report
    if (this.config.enableSecurity) {
      await this.generateSecurityReport(result);
    }

    // 3. Post MR comment
    if (this.config.enableComments && this.env.mrIid) {
      await this.postMRComment(result);
    }

    // 4. Create job artifacts
    if (this.config.enableArtifacts) {
      await this.createArtifacts(result);
    }

    // 5. Check fail threshold
    this.checkFailThreshold(result);

    console.log('✅ GitLab CI integration complete');
  }

  /**
   * Generate Code Quality report (GitLab format)
   */
  async generateCodeQualityReport(result: AnalysisResult): Promise<void> {
    const issues = result.issues || [];
    const report: CodeQualityReport[] = issues.map(issue => ({
      description: issue.message,
      check_name: issue.rule || 'code-quality',
      fingerprint: this.generateFingerprint(issue),
      severity: this.severityToCodeQuality(issue.severity),
      location: {
        path: issue.file,
        lines: {
          begin: issue.line || 1,
          end: issue.endLine || issue.line || 1,
        },
      },
      categories: issue.category ? [issue.category] : ['Style'],
      remediation_points: this.calculateRemediationPoints(issue.severity),
    }));

    // Write to gl-code-quality-report.json
    const reportPath = './gl-code-quality-report.json';
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
      console.log(`✓ Code Quality report: ${reportPath} (${report.length} issues)`);
    } catch (error) {
      console.error('✗ Failed to generate Code Quality report:', error);
    }
  }

  /**
   * Generate Security report (SAST format)
   */
  async generateSecurityReport(result: AnalysisResult): Promise<void> {
    const issues = result.issues || [];
    const securityIssues = issues.filter(i => 
      i.category === 'security' || i.severity === 'critical'
    );

    const report: SecurityReport = {
      version: '15.0.0',
      vulnerabilities: securityIssues.map(issue => ({
        id: this.generateFingerprint(issue),
        category: 'sast',
        name: issue.rule || 'Security Issue',
        message: issue.message,
        description: issue.details || issue.message,
        severity: this.severityToSecurity(issue.severity),
        confidence: 'High',
        scanner: {
          id: 'odavl-insight',
          name: 'ODAVL Insight',
        },
        location: {
          file: issue.file,
          start_line: issue.line || 1,
          end_line: issue.endLine || issue.line || 1,
        },
        identifiers: [{
          type: 'odavl',
          name: issue.rule || 'security-issue',
          value: issue.rule || 'security',
        }],
      })),
    };

    // Write to gl-sast-report.json
    const reportPath = './gl-sast-report.json';
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
      console.log(`✓ Security report: ${reportPath} (${securityIssues.length} vulnerabilities)`);
    } catch (error) {
      console.error('✗ Failed to generate Security report:', error);
    }
  }

  /**
   * Post Merge Request comment
   */
  async postMRComment(result: AnalysisResult): Promise<void> {
    if (!this.env.mrIid) {
      console.log('⊘ Not a Merge Request, skipping comment');
      return;
    }

    const body = this.generateMRComment(result);

    try {
      const response = await fetch(
        `${this.config.apiUrl}/projects/${this.config.projectId}/merge_requests/${this.env.mrIid}/notes`,
        {
          method: 'POST',
          headers: {
            'PRIVATE-TOKEN': this.config.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ body }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✓ Posted MR comment');
    } catch (error) {
      console.error('✗ Failed to post MR comment:', error);
    }
  }

  /**
   * Create job artifacts
   */
  async createArtifacts(result: AnalysisResult): Promise<void> {
    const artifactPath = './odavl-report.json';
    const artifactData = JSON.stringify(result, null, 2);

    try {
      const fs = await import('fs/promises');
      await fs.writeFile(artifactPath, artifactData, 'utf8');
      console.log(`✓ Created artifact: ${artifactPath}`);
    } catch (error) {
      console.error('✗ Failed to create artifact:', error);
    }
  }

  /**
   * Check if analysis should fail pipeline
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

  private detectEnvironment(): GitLabEnv {
    const isGitLabCI = process.env.GITLAB_CI === 'true';

    if (!isGitLabCI) {
      return {
        isGitLabCI: false,
        projectId: '',
        pipelineId: '',
        jobId: '',
        sha: '',
        branch: '',
        userLogin: '',
        projectUrl: '',
        apiUrl: '',
      };
    }

    return {
      isGitLabCI: true,
      projectId: process.env.CI_PROJECT_ID || '',
      pipelineId: process.env.CI_PIPELINE_ID || '',
      jobId: process.env.CI_JOB_ID || '',
      sha: process.env.CI_COMMIT_SHA || '',
      branch: process.env.CI_COMMIT_REF_NAME || '',
      mrIid: process.env.CI_MERGE_REQUEST_IID,
      userLogin: process.env.GITLAB_USER_LOGIN || '',
      projectUrl: process.env.CI_PROJECT_URL || '',
      apiUrl: process.env.CI_API_V4_URL || 'https://gitlab.com/api/v4',
    };
  }

  // --------------------------------------------------------------------------
  // Private Methods - Report Generation
  // --------------------------------------------------------------------------

  private generateMRComment(result: AnalysisResult): string {
    const issues = result.issues || [];
    const critical = issues.filter(i => i.severity === 'critical').length;
    const high = issues.filter(i => i.severity === 'high').length;
    const medium = issues.filter(i => i.severity === 'medium').length;
    const low = issues.filter(i => i.severity === 'low').length;

    const status = critical > 0 ? ':red_circle: Critical Issues Found' :
                   high > 0 ? ':orange_circle: High Priority Issues' :
                   medium > 0 ? ':yellow_circle: Medium Priority Issues' :
                   ':white_check_mark: No Critical Issues';

    return `
## 🔍 ODAVL Insight Analysis Report

${status}

### 📊 Summary
| Severity | Count |
|----------|-------|
| :red_circle: Critical | ${critical} |
| :orange_circle: High | ${high} |
| :yellow_circle: Medium | ${medium} |
| :large_blue_circle: Low | ${low} |

### 📈 Metrics
- **Files Analyzed:** ${result.metrics?.filesAnalyzed || 0}
- **Lines of Code:** ${result.metrics?.linesOfCode?.toLocaleString() || 0}
- **Analysis Duration:** ${this.formatDuration(result.metrics?.duration || 0)}

${critical > 0 || high > 0 ? `
### ⚠️ Top Issues
${this.formatTopIssues(issues.slice(0, 5))}
` : ''}

---
<sub>Powered by [ODAVL Studio](https://github.com/odavlstudio/odavl) • Pipeline: #${this.env.pipelineId} • Job: #${this.env.jobId}</sub>
    `.trim();
  }

  private formatTopIssues(issues: Issue[]): string {
    return issues.map((issue, index) => {
      const emoji = this.getSeverityEmoji(issue.severity);
      return `
${index + 1}. ${emoji} **${issue.message}**
   - **File:** \`${issue.file}:${issue.line}\`
   - **Severity:** ${issue.severity}
   - **Rule:** \`${issue.rule || 'N/A'}\`
      `.trim();
    }).join('\n\n');
  }

  // --------------------------------------------------------------------------
  // Private Methods - Conversions
  // --------------------------------------------------------------------------

  private severityToCodeQuality(severity: string): 'info' | 'minor' | 'major' | 'critical' | 'blocker' {
    const map: Record<string, 'info' | 'minor' | 'major' | 'critical' | 'blocker'> = {
      low: 'info',
      medium: 'minor',
      high: 'major',
      critical: 'blocker',
    };
    return map[severity] || 'info';
  }

  private severityToSecurity(severity: string): 'Unknown' | 'Low' | 'Medium' | 'High' | 'Critical' {
    const map: Record<string, 'Unknown' | 'Low' | 'Medium' | 'High' | 'Critical'> = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical',
    };
    return map[severity] || 'Unknown';
  }

  private calculateRemediationPoints(severity: string): number {
    const points: Record<string, number> = {
      critical: 50000,
      high: 20000,
      medium: 10000,
      low: 5000,
    };
    return points[severity] || 1000;
  }

  // --------------------------------------------------------------------------
  // Private Methods - Utilities
  // --------------------------------------------------------------------------

  private generateFingerprint(issue: Issue): string {
    // Generate stable fingerprint for duplicate detection
    const data = `${issue.file}:${issue.line}:${issue.rule}:${issue.message}`;
    // Simple hash (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private getSeverityEmoji(severity: string): string {
    const emojis: Record<string, string> = {
      critical: ':red_circle:',
      high: ':orange_circle:',
      medium: ':yellow_circle:',
      low: ':large_blue_circle:',
    };
    return emojis[severity] || ':white_circle:';
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
 * Create GitLab CI integration instance
 */
export function createGitLabCIIntegration(
  config: GitLabCIConfig
): GitLabCIIntegration {
  return new GitLabCIIntegration(config);
}

/**
 * Auto-detect and run GitLab CI integration
 */
export async function runGitLabCI(
  result: AnalysisResult,
  config?: Partial<GitLabCIConfig>
): Promise<void> {
  // Auto-detect from environment
  const token = config?.token || process.env.GITLAB_TOKEN || '';
  const projectId = config?.projectId || process.env.CI_PROJECT_ID || '';

  if (!token || !projectId) {
    throw new Error('GitLab CI environment not detected or missing credentials');
  }

  const integration = createGitLabCIIntegration({
    token,
    projectId,
    ...config,
  });

  await integration.run(result);
}

/**
 * Check if running in GitLab CI
 */
export function isGitLabCI(): boolean {
  return process.env.GITLAB_CI === 'true';
}
