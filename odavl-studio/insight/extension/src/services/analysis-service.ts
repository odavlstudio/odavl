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
import { InsightError } from '../core/errors';
import { ErrorPresenter } from '../ui/error-presenter';
import { BaselineManager } from '../core/baseline-manager';
import { DetectorIssue } from '../types/DetectorIssue';
import { InsightStatusBar } from '../ui/status-bar';
import { ConfigService, InsightExtensionConfig } from '../core/config';

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
 * Analysis trigger source (for logging and telemetry)
 */
export type AnalysisTrigger = 'save' | 'manual' | 'command' | 'startup' | 'auth-change';

/**
 * Analysis options
 */
export interface AnalysisOptions {
  mode: AnalysisMode;
  detectors?: string[];
  language?: string;
  filePath?: string; // For single-file analysis
  trigger?: AnalysisTrigger; // Phase 4.1.6: Source of analysis request
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
  
  // Phase 4.1.6 - Debounce & Race Condition Fixes:
  // State machine for single in-flight analysis guarantee
  private analysisState: 'idle' | 'running' = 'idle';
  private pendingRunRequested = false;
  
  // Phase 4.1.3 - Delta-first UX: Baseline tracking
  // Issues are classified as NEW or LEGACY to avoid punishing users for pre-existing debt.
  private baselineManager?: BaselineManager;
  private allIssuesForBaseline: DetectorIssue[] = []; // Store for baseline update
  
  // Phase 4.1.4 - Offline/Cloud indicator: Status bar integration
  private statusBar?: InsightStatusBar;
  
  // Phase 4.1.5 - Error attribution: Centralized error handling
  private errorPresenter: ErrorPresenter;
  
  // Phase 4.1.7 - Config validation: Safe config loading
  private configService: ConfigService;
  private currentConfig?: InsightExtensionConfig;
  
  // Event emitter for analysis completion
  private onAnalysisCompleteEmitter = new vscode.EventEmitter<UnifiedIssue[]>();
  readonly onAnalysisComplete = this.onAnalysisCompleteEmitter.event;

  constructor(
    context: vscode.ExtensionContext,
    cloudClient: InsightCloudClient,
    authState: AuthState,
    statusBar?: InsightStatusBar,
    configService?: ConfigService
  ) {
    this.context = context;
    this.cloudClient = cloudClient;
    this.authState = authState;
    this.statusBar = statusBar;
    
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('odavl-insight');
    context.subscriptions.push(this.diagnosticCollection);
    
    this.outputChannel = vscode.window.createOutputChannel('ODAVL Insight');
    context.subscriptions.push(this.outputChannel);
    
    // Phase 4.1.5: Initialize error presenter with output channel
    this.errorPresenter = new ErrorPresenter({ outputChannel: this.outputChannel });
    
    // Phase 4.1.7: Initialize config service
    if (configService) {
      this.configService = configService;
    } else {
      // Fallback: Create config service if not provided
      const { createConfigService } = require('../core/config');
      this.configService = createConfigService(this.errorPresenter, this.outputChannel);
    }
    
    // Phase 4.1.3: Initialize baseline manager
    const workspaceRoot = this.getWorkspaceRoot();
    if (workspaceRoot) {
      this.baselineManager = new BaselineManager(workspaceRoot);
      // Load baseline asynchronously (non-blocking)
      this.baselineManager.loadBaseline().catch(err => {
        console.error('[AnalysisService] Failed to load baseline:', err);
      });
    }
  }

  /**
   * Update auth state (called when user signs in/out)
   * Phase 4.1.6: Mark pending run if auth changes during analysis
   */
  updateAuthState(authState: AuthState): void {
    const authChanged = authState.isAuthenticated !== this.authState.isAuthenticated;
    this.authState = authState;
    
    // Phase 4.1.6: If analysis is running and auth state changes,
    // mark pending run so user gets fresh results with new auth context
    if (this.analysisState === 'running' && authChanged) {
      this.outputChannel.appendLine('[Auth Change] Analysis running - will re-run after completion');
      this.pendingRunRequested = true;
    }
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
   * Phase 4.1.6: Unified analysis entry point
   * 
   * Guarantees at most ONE analysis runs at a time using state machine:
   * - If idle: starts analysis immediately
   * - If running: marks pendingRunRequested = true for one follow-up run
   * 
   * This prevents rapid saves/commands from spawning multiple concurrent analyses.
   * 
   * @param options Analysis configuration
   * @returns Promise<UnifiedIssue[]> - issues found (empty if skipped due to already running)
   */
  async runFullAnalysis(options: AnalysisOptions = { mode: 'local' }): Promise<UnifiedIssue[]> {
    const trigger = options.trigger || 'manual';
    
    // Phase 4.1.6: State machine logic
    if (this.analysisState === 'running') {
      // Analysis already in progress - mark pending for one follow-up run
      this.pendingRunRequested = true;
      this.outputChannel.appendLine(`[${trigger}] Analysis running - marked pending for follow-up`);
      return [];
    }
    
    // State is 'idle' - start analysis
    this.analysisState = 'running';
    this.outputChannel.appendLine(`[${trigger}] Starting analysis (mode: ${options.mode})...`);
    
    try {
      // Delegate to internal method that does the actual work
      const issues = await this.analyzeWorkspace(options);
      return issues;
    } finally {
      // Phase 4.1.6: State machine cleanup - ALWAYS runs, even on error
      this.analysisState = 'idle';
      
      // Check if another run was requested while we were running
      if (this.pendingRunRequested) {
        this.pendingRunRequested = false;
        this.outputChannel.appendLine('[Follow-up] Starting pending analysis...');
        
        // Start ONE follow-up run asynchronously (don't await - prevents recursion)
        // Use setImmediate to avoid blocking the finally cleanup
        setImmediate(() => {
          this.runFullAnalysis(options).catch(err => {
            this.outputChannel.appendLine(`[Follow-up] Analysis failed: ${err}`);
          });
        });
      }
    }
  }

  /**
   * Internal: Analyze workspace (no state machine - called by runFullAnalysis)
   * 
   * This is the actual analysis implementation. External callers should use
   * runFullAnalysis() instead to benefit from the state machine.
   */
  private async analyzeWorkspace(options: AnalysisOptions): Promise<UnifiedIssue[]> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    
    if (!workspaceRoot) {
      const error = InsightError.noWorkspace();
      await this.errorPresenter.present(error, 'Workspace Analysis');
      return [];
    }
    
    // Phase 4.1.7: Load and validate config (safe - returns defaults on error)
    this.currentConfig = await this.configService.loadConfig(workspaceRoot);
    this.outputChannel.appendLine(`[Config] Using mode: ${this.currentConfig.analysis.defaultMode}`);

    this.diagnosticCollection.clear();
    
    // Phase 4.1.4: Update status bar to show analyzing state
    if (this.statusBar) {
      this.statusBar.setAnalyzing(true);
    }
    
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
      
      // Phase 4.1.3: Update baseline after successful analysis
      if (this.baselineManager && this.allIssuesForBaseline.length > 0) {
        await this.baselineManager.updateBaseline(this.allIssuesForBaseline);
        this.outputChannel.appendLine(`[Baseline] Updated with ${this.allIssuesForBaseline.length} issues`);
      }
      
      return allIssues;
    } finally {
      // Phase 4.1.3: Clear accumulated issues for next analysis
      this.allIssuesForBaseline = [];
      
      // Phase 4.1.4: Reset status bar to previous mode (Local/Cloud/Offline)
      if (this.statusBar) {
        this.statusBar.setAnalyzing(false);
      }
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
          // Phase 4.1.5: Attribute local analysis errors
          // Detector crashes are INSIGHT errors (our bug)
          const insightError = InsightError.isInsightError(error)
            ? error
            : InsightError.detectorCrash('local-analysis', error instanceof Error ? error : undefined);
          
          await this.errorPresenter.present(insightError, 'Local Analysis');
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
          // Phase 4.1.5: Attribute cloud errors properly
          const errorMsg = error instanceof Error ? error.message : String(error);
          
          // Network/cloud failures are EXTERNAL errors (not our fault, not user's fault)
          const insightError = InsightError.isInsightError(error)
            ? error
            : InsightError.cloudUnavailable(error instanceof Error ? error : undefined);
          
          await this.errorPresenter.present(insightError, 'Cloud Analysis');
          
          // No toast spam for external errors - logged to output channel only
          // Status bar already shows mode (Local/Cloud/Offline)
          return [];
        }
      }
    );
  }

  /**
   * Check FREE plan limits before cloud analysis
   * Phase 4.1.1: Non-blocking quota check - no modal that blocks analysis
   */
  private async checkFreePlanLimits(): Promise<boolean> {
    // For FREE plan:
    // - Max 3 projects
    // - Max 50 analyses/month
    // - Max 100 issues per analysis
    
    // Phase 4.1.1: Removed blocking modal
    // Cloud analysis proceeds unless quota is actually exceeded (checked server-side)
    // If quota exceeded, server will reject and we show non-blocking notification
    this.outputChannel.appendLine('[FREE Plan] Cloud analysis starting (quota will be checked server-side)');
    
    // Non-blocking hint about plan limits (dismissible, no buttons required)
    // Only show this rarely to avoid notification fatigue
    const lastHintTime = this.context.globalState.get<number>('odavl.lastQuotaHint', 0);
    const now = Date.now();
    if (now - lastHintTime > 86400000) { // Once per day max
      this.outputChannel.appendLine('[FREE Plan] Reminder: 50 cloud analyses/month limit');
      this.context.globalState.update('odavl.lastQuotaHint', now);
    }
    
    return true; // Always proceed - let server enforce quota
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
   * 
   * Phase 4.1.3: Marks NEW issues with [NEW] prefix to distinguish from LEGACY issues
   */
  private updateDiagnostics(issues: UnifiedIssue[]): void {
    const diagnosticsByFile = new Map<string, vscode.Diagnostic[]>();

    // Phase 4.1.3: Convert UnifiedIssue to DetectorIssue for baseline tracking
    const detectorIssues: DetectorIssue[] = issues.map(issue => ({
      file: issue.filePath,
      line: issue.line,
      column: issue.column,
      message: issue.message,
      severity: this.mapSeverityToDetector(issue.severity),
      detector: issue.detector,
      language: 'unknown' as const, // Will be inferred if needed
    }));

    // Phase 4.1.3: Store for baseline update (after successful analysis)
    this.allIssuesForBaseline.push(...detectorIssues);

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

      // Phase 4.1.3: Check if issue is NEW (not in baseline)
      const detectorIssue = detectorIssues.find(
        di => di.file === issue.filePath && di.line === issue.line && di.detector === issue.detector
      );
      const isNew = detectorIssue && this.baselineManager 
        ? this.baselineManager.isNewIssue(detectorIssue) 
        : false;

      // Phase 4.1.3: Mark NEW issues with [NEW] prefix
      // LEGACY issues remain visible but unmarked
      const message = isNew ? `[NEW] ${issue.message}` : issue.message;

      const diagnostic = new vscode.Diagnostic(range, message, severity);
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
   * Phase 4.1.3: Map UnifiedIssue severity to DetectorIssue severity
   */
  private mapSeverityToDetector(severity: string): DetectorIssue['severity'] {
    const mapping: Record<string, DetectorIssue['severity']> = {
      'CRITICAL': 'critical',
      'HIGH': 'error',
      'MEDIUM': 'warning',
      'LOW': 'info',
      'INFO': 'hint',
    };
    return mapping[severity] || 'warning';
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
   * Phase 4.1.6: Uses state machine instead of flag
   */
  isRunning(): boolean {
    return this.analysisState === 'running';
  }
  
  /**
   * Get current state machine state (for debugging/testing)
   * Phase 4.1.6: Expose state for verification
   */
  getAnalysisState(): { state: 'idle' | 'running'; pendingRunRequested: boolean } {
    return {
      state: this.analysisState,
      pendingRunRequested: this.pendingRunRequested
    };
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
