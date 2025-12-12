/**
 * Analysis Service - Local + Cloud Analysis Manager
 * 
 * Coordinates analysis between:
 * 1. Local Mode - Uses @odavl-studio/insight-core for immediate feedback
 * 2. Cloud Mode - Sends to Insight Cloud for history, trends, collaboration
 * 
 * Handles diagnostics integration and plan-aware feature limits.
 */

import * as vscode from 'vscode';
import type { 
  InsightCloudClient, 
  InsightAnalysisResult, 
  InsightCloudIssue, 
  AnalysisStatus 
} from '@odavl-studio/sdk/insight-cloud';
import type { AuthState } from '../auth/auth-manager';

/**
 * Local analysis issue (from @odavl-studio/insight-core)
 */
export interface LocalIssue {
  filePath: string;
  line: number;
  column?: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  detector: string;
  ruleId?: string;
  category?: string;
  code?: string;
  suggestion?: string;
  autoFixable?: boolean;
}

/**
 * Unified issue format (local + cloud)
 */
export interface UnifiedIssue {
  id?: string; // Only for cloud issues
  filePath: string;
  line: number;
  column?: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  message: string;
  detector: string;
  ruleId?: string;
  category?: string;
  code?: string;
  suggestion?: string;
  autoFixable: boolean;
  source: 'local' | 'cloud';
  analysisId?: string; // Cloud analysis ID
}

/**
 * Analysis mode
 */
export type AnalysisMode = 'local' | 'cloud' | 'both';

/**
 * Analysis options
 */
export interface AnalysisOptions {
  mode: AnalysisMode;
  detectors?: string[];
  language?: string;
  filePath?: string; // For single-file analysis
}

/**
 * Analysis Service
 */
export class AnalysisService {
  private context: vscode.ExtensionContext;
  private cloudClient: InsightCloudClient;
  private diagnosticCollection: vscode.DiagnosticCollection;
  private outputChannel: vscode.OutputChannel;
  
  // Current auth state
  private authState: AuthState;
  
  // Analysis state
  private currentAnalysisId?: string;
  private isAnalyzing = false;
  
  // Event emitter for analysis completion
  private onAnalysisCompleteEmitter = new vscode.EventEmitter<UnifiedIssue[]>();
  readonly onAnalysisComplete = this.onAnalysisCompleteEmitter.event;

  constructor(
    context: vscode.ExtensionContext,
    cloudClient: InsightCloudClient,
    authState: AuthState
  ) {
    this.context = context;
    this.cloudClient = cloudClient;
    this.authState = authState;
    
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('odavl-insight');
    context.subscriptions.push(this.diagnosticCollection);
    
    this.outputChannel = vscode.window.createOutputChannel('ODAVL Insight');
    context.subscriptions.push(this.outputChannel);
  }

  /**
   * Update auth state (called when user signs in/out)
   */
  updateAuthState(authState: AuthState): void {
    this.authState = authState;
  }

  /**
   * Check if cloud analysis is available for current plan
   */
  canUseCloudAnalysis(): boolean {
    // FREE plan can use cloud analysis (with limits)
    // All plans support it
    return this.authState.isAuthenticated;
  }

  /**
   * Analyze workspace
   */
  async analyzeWorkspace(options: AnalysisOptions = { mode: 'local' }): Promise<UnifiedIssue[]> {
    if (this.isAnalyzing) {
      vscode.window.showWarningMessage('Analysis already in progress');
      return [];
    }

    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    
    if (!workspaceRoot) {
      vscode.window.showErrorMessage('No workspace folder open');
      return [];
    }

    this.isAnalyzing = true;
    this.diagnosticCollection.clear();
    
    try {
      let allIssues: UnifiedIssue[] = [];

      // Local analysis
      if (options.mode === 'local' || options.mode === 'both') {
        const localIssues = await this.runLocalAnalysis(workspaceRoot, options);
        allIssues = [...allIssues, ...localIssues];
        this.updateDiagnostics(localIssues);
      }

      // Cloud analysis
      if ((options.mode === 'cloud' || options.mode === 'both') && this.canUseCloudAnalysis()) {
        const cloudIssues = await this.runCloudAnalysis(workspaceRoot, options);
        allIssues = [...allIssues, ...cloudIssues];
        this.updateDiagnostics(cloudIssues);
      } else if (options.mode === 'cloud' && !this.canUseCloudAnalysis()) {
        vscode.window.showWarningMessage(
          'Cloud analysis requires sign-in. Running local analysis instead.',
          'Sign In'
        ).then(action => {
          if (action === 'Sign In') {
            vscode.commands.executeCommand('odavl-insight.signIn');
          }
        });
        
        // Fallback to local
        const localIssues = await this.runLocalAnalysis(workspaceRoot, options);
        allIssues = localIssues;
        this.updateDiagnostics(localIssues);
      }

      this.onAnalysisCompleteEmitter.fire(allIssues);
      return allIssues;
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Run local analysis using @odavl-studio/insight-core
   */
  private async runLocalAnalysis(
    workspaceRoot: string,
    options: AnalysisOptions
  ): Promise<UnifiedIssue[]> {
    this.outputChannel.appendLine(`[Local] Starting analysis in ${workspaceRoot}`);
    
    return await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Analyzing workspace (Local)...',
        cancellable: false,
      },
      async (progress) => {
        try {
          // Dynamically import insight-core to avoid bundling issues
          const { analyzeWorkspace } = await import('@odavl-studio/insight-core/detector');
          
          const detectors = options.detectors || [
            'typescript',
            'eslint',
            'security',
            'performance',
            'complexity',
            'import',
            'circular',
          ];

          const result = await analyzeWorkspace(workspaceRoot, {
            detectors,
            language: options.language,
          });

          const issues: UnifiedIssue[] = result.issues.map((issue: LocalIssue) => ({
            filePath: issue.filePath,
            line: issue.line,
            column: issue.column,
            severity: issue.severity.toUpperCase() as any,
            message: issue.message,
            detector: issue.detector,
            ruleId: issue.ruleId,
            category: issue.category,
            code: issue.code,
            suggestion: issue.suggestion,
            autoFixable: issue.autoFixable || false,
            source: 'local' as const,
          }));

          this.outputChannel.appendLine(`[Local] Found ${issues.length} issues`);
          
          return issues;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          this.outputChannel.appendLine(`[Local] Analysis failed: ${errorMsg}`);
          vscode.window.showErrorMessage(`Local analysis failed: ${errorMsg}`);
          return [];
        }
      }
    );
  }

  /**
   * Run cloud analysis via Insight Cloud API
   */
  private async runCloudAnalysis(
    workspaceRoot: string,
    options: AnalysisOptions
  ): Promise<UnifiedIssue[]> {
    this.outputChannel.appendLine(`[Cloud] Starting analysis in ${workspaceRoot}`);
    
    // Check plan limits for FREE users
    if (this.authState.planId === 'INSIGHT_FREE') {
      const canProceed = await this.checkFreePlanLimits();
      if (!canProceed) {
        return [];
      }
    }

    return await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Sending to ODAVL Insight Cloud...',
        cancellable: false,
      },
      async (progress) => {
        try {
          // Step 1: Create analysis job
          const projectId = this.getOrCreateProjectId(workspaceRoot);
          
          const createResult = await this.cloudClient.startAnalysis({
            projectId,
            detectors: options.detectors,
            language: options.language,
            path: options.filePath,
          });

          if (!createResult.success) {
            throw new Error(createResult.error.message || createResult.error.error);
          }

          const analysisId = createResult.data.id;
          this.currentAnalysisId = analysisId;
          
          this.outputChannel.appendLine(`[Cloud] Analysis created: ${analysisId}`);

          // Step 2: Poll for completion
          progress.report({ message: 'Analyzing workspace (Cloud)...' });
          
          const pollResult = await this.cloudClient.pollAnalysis(
            analysisId,
            (prog, status) => {
              progress.report({ 
                message: `Analyzing workspace (${prog}%)`,
                increment: prog 
              });
              this.outputChannel.appendLine(`[Cloud] Progress: ${prog}% (${status})`);
            }
          );

          if (!pollResult.success) {
            throw new Error(pollResult.error.message || pollResult.error.error);
          }

          const analysis = pollResult.data;

          if (analysis.status === 'FAILED') {
            throw new Error('Analysis failed on server');
          }

          // Step 3: Convert cloud issues to unified format
          const issues: UnifiedIssue[] = analysis.issues.map((issue) => ({
            id: issue.id,
            filePath: issue.filePath,
            line: issue.line,
            column: issue.column,
            severity: issue.severity,
            message: issue.message,
            detector: issue.detector,
            ruleId: issue.ruleId,
            category: issue.category,
            code: issue.code,
            suggestion: issue.suggestion,
            autoFixable: issue.autoFixable,
            source: 'cloud' as const,
            analysisId: analysis.id,
          }));

          this.outputChannel.appendLine(`[Cloud] Found ${issues.length} issues`);
          
          // Show success message with link
          vscode.window.showInformationMessage(
            `✅ Cloud analysis complete: ${analysis.totalIssues} issues found`,
            'View in Cloud',
            'Dismiss'
          ).then(action => {
            if (action === 'View in Cloud') {
              vscode.env.openExternal(
                vscode.Uri.parse(`https://cloud.odavl.studio/insight/analyses/${analysisId}`)
              );
            }
          });

          return issues;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          this.outputChannel.appendLine(`[Cloud] Analysis failed: ${errorMsg}`);
          vscode.window.showErrorMessage(`Cloud analysis failed: ${errorMsg}`);
          return [];
        }
      }
    );
  }

  /**
   * Check FREE plan limits before cloud analysis
   */
  private async checkFreePlanLimits(): Promise<boolean> {
    // For FREE plan:
    // - Max 3 projects
    // - Max 50 analyses/month
    // - Max 100 issues per analysis
    
    const result = await vscode.window.showWarningMessage(
      'FREE plan: Limited to 50 cloud analyses per month',
      'Continue',
      'Upgrade to PRO',
      'Cancel'
    );

    if (result === 'Upgrade to PRO') {
      vscode.env.openExternal(
        vscode.Uri.parse('https://odavl.studio/pricing?from=vscode-limit')
      );
      return false;
    }

    return result === 'Continue';
  }

  /**
   * Get or create project ID for workspace
   * Uses workspace folder name as project identifier
   */
  private getOrCreateProjectId(workspaceRoot: string): string {
    const folderName = workspaceRoot.split(/[/\\]/).pop() || 'unknown';
    
    // Try to get from workspace state
    const key = `odavl.projectId.${folderName}`;
    let projectId = this.context.workspaceState.get<string>(key);
    
    if (!projectId) {
      // Generate new project ID
      projectId = `${folderName}-${Date.now()}`;
      this.context.workspaceState.update(key, projectId);
    }
    
    return projectId;
  }

  /**
   * Update VS Code diagnostics from issues
   */
  private updateDiagnostics(issues: UnifiedIssue[]): void {
    const diagnosticsByFile = new Map<string, vscode.Diagnostic[]>();

    for (const issue of issues) {
      const uri = vscode.Uri.file(issue.filePath);
      
      if (!diagnosticsByFile.has(issue.filePath)) {
        diagnosticsByFile.set(issue.filePath, []);
      }

      const range = new vscode.Range(
        new vscode.Position(Math.max(0, issue.line - 1), issue.column || 0),
        new vscode.Position(Math.max(0, issue.line - 1), (issue.column || 0) + 100)
      );

      const severity = {
        CRITICAL: vscode.DiagnosticSeverity.Error,
        HIGH: vscode.DiagnosticSeverity.Error,
        MEDIUM: vscode.DiagnosticSeverity.Warning,
        LOW: vscode.DiagnosticSeverity.Information,
        INFO: vscode.DiagnosticSeverity.Hint,
      }[issue.severity];

      const diagnostic = new vscode.Diagnostic(range, issue.message, severity);
      diagnostic.source = `ODAVL/${issue.detector}`;
      diagnostic.code = issue.ruleId;

      diagnosticsByFile.get(issue.filePath)!.push(diagnostic);
    }

    // Update diagnostics collection
    for (const [filePath, diagnostics] of diagnosticsByFile.entries()) {
      const uri = vscode.Uri.file(filePath);
      this.diagnosticCollection.set(uri, diagnostics);
    }
  }

  /**
   * Clear all diagnostics
   */
  clearDiagnostics(): void {
    this.diagnosticCollection.clear();
  }

  /**
   * Get current analysis ID (if cloud analysis running)
   */
  getCurrentAnalysisId(): string | undefined {
    return this.currentAnalysisId;
  }

  /**
   * Check if analysis is running
   */
  isRunning(): boolean {
    return this.isAnalyzing;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.diagnosticCollection.dispose();
    this.outputChannel.dispose();
    this.onAnalysisCompleteEmitter.dispose();
  }
}
