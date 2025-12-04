/**
 * Autopilot Bridge
 * Integrates Guardian with ODAVL Autopilot for advanced fixing
 */

import type { InspectionIssue, InspectionReport } from '../../inspectors/base-inspector.js';
import type { FixResult } from '../../fixers/extension-fixer.js';

export interface AutopilotIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  file?: string;
  line?: number;
  suggestedFix?: string;
}

export interface AutopilotRequest {
  productPath: string;
  productType: string;
  issues: AutopilotIssue[];
  context: {
    readinessScore: number;
    status: string;
    timestamp: string;
  };
}

export interface AutopilotResponse {
  success: boolean;
  fixesApplied: Array<{
    issueId: string;
    applied: boolean;
    message: string;
  }>;
  newReadinessScore?: number;
}

export class AutopilotBridge {
  /**
   * Convert Guardian issues to Autopilot format
   */
  convertToAutopilotIssues(report: InspectionReport): AutopilotIssue[] {
    return report.issues
      .filter(issue => issue.autoFixable)
      .map(issue => ({
        id: issue.id,
        severity: issue.severity,
        category: issue.category,
        message: issue.message,
        file: issue.file,
        line: issue.line,
        suggestedFix: issue.fix,
      }));
  }

  /**
   * Create Autopilot request from inspection report
   */
  createAutopilotRequest(
    productPath: string,
    report: InspectionReport
  ): AutopilotRequest {
    return {
      productPath,
      productType: report.productType,
      issues: this.convertToAutopilotIssues(report),
      context: {
        readinessScore: report.readinessScore,
        status: report.status,
        timestamp: report.timestamp,
      },
    };
  }

  /**
   * Send issues to Autopilot for fixing
   * 
   * Note: This is a bridge interface. In the future, this will integrate
   * with the actual Autopilot engine from @odavl-studio/autopilot-engine
   */
  async sendToAutopilot(request: AutopilotRequest): Promise<AutopilotResponse> {
    // TODO: Integrate with actual Autopilot engine
    // For now, return a mock response indicating the bridge is ready
    
    console.log('📤 Autopilot Bridge: Request prepared');
    console.log(`   Product: ${request.productType}`);
    console.log(`   Issues: ${request.issues.length} auto-fixable`);
    console.log(`   Current readiness: ${request.context.readinessScore}%`);
    
    // In the future, this will call:
    // const autopilot = new AutopilotEngine();
    // const result = await autopilot.fixIssues(request);
    
    return {
      success: true,
      fixesApplied: request.issues.map(issue => ({
        issueId: issue.id,
        applied: false, // Will be true when Autopilot integration is complete
        message: 'Autopilot bridge ready - awaiting full integration',
      })),
    };
  }

  /**
   * Execute full Guardian → Autopilot → Verify flow
   */
  async executeFixFlow(
    productPath: string,
    initialReport: InspectionReport,
    verifyCallback: (path: string) => Promise<InspectionReport>
  ): Promise<{
    initial: InspectionReport;
    autopilotResponse: AutopilotResponse;
    verification: InspectionReport;
    improvement: number;
  }> {
    // Step 1: Prepare Autopilot request
    const request = this.createAutopilotRequest(productPath, initialReport);
    
    // Step 2: Send to Autopilot
    const autopilotResponse = await this.sendToAutopilot(request);
    
    // Step 3: Verify results
    const verification = await verifyCallback(productPath);
    
    // Step 4: Calculate improvement
    const improvement = verification.readinessScore - initialReport.readinessScore;
    
    return {
      initial: initialReport,
      autopilotResponse,
      verification,
      improvement,
    };
  }

  /**
   * Convert Guardian fix results to Autopilot format
   */
  convertFixResults(fixResults: FixResult[]): AutopilotResponse {
    return {
      success: fixResults.some(r => r.success),
      fixesApplied: fixResults.map(result => ({
        issueId: result.issueId || result.fixType,
        applied: result.success,
        message: result.message || result.details || '',
      })),
    };
  }

  /**
   * Generate fix summary for reporting
   */
  generateFixSummary(
    initial: InspectionReport,
    verification: InspectionReport,
    fixResults: FixResult[]
  ): {
    readinessImprovement: number;
    issuesFixed: number;
    issuesRemaining: number;
    statusChange: string;
    fixDetails: Array<{
      issue: string;
      status: 'fixed' | 'failed' | 'partial';
      message: string;
    }>;
  } {
    const readinessImprovement = verification.readinessScore - initial.readinessScore;
    const issuesFixed = fixResults.filter(r => r.success).length;
    const issuesRemaining = verification.issues.length;

    const statusChange = initial.status === verification.status
      ? 'unchanged'
      : `${initial.status} → ${verification.status}`;

    const fixDetails = fixResults.map(result => ({
      issue: result.issueId || result.fixType,
      status: result.success ? ('fixed' as const) : ('failed' as const),
      message: result.message || result.details || '',
    }));

    return {
      readinessImprovement,
      issuesFixed,
      issuesRemaining,
      statusChange,
      fixDetails,
    };
  }

  /**
   * Check if Autopilot integration is available
   */
  isAutopilotAvailable(): boolean {
    // TODO: Check if Autopilot engine is installed and accessible
    // For now, return false - will be true when integration is complete
    return false;
  }

  /**
   * Get Autopilot status
   */
  getAutopilotStatus(): {
    available: boolean;
    message: string;
    features: string[];
  } {
    const available = this.isAutopilotAvailable();

    return {
      available,
      message: available
        ? 'Autopilot integration is active'
        : 'Autopilot integration coming soon - using Guardian fixers',
      features: [
        'Guardian built-in fixers (active)',
        'Autopilot AI-powered fixes (coming soon)',
        'O-D-A-V-L cycle integration (planned)',
      ],
    };
  }
}
