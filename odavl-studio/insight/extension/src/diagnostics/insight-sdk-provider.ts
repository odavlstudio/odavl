/**
 * ODAVL Insight - Real SDK Integration Provider
 * Wave 5 - Replaces mock detectors with production Insight SDK
 */

import * as vscode from 'vscode';
import { analyzeWorkspace, analyzeFiles, type InsightIssue, type InsightAnalysisResult } from '@odavl/insight-sdk';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export class InsightAnalysisProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private analysisCache = new Map<string, { issues: InsightIssue[]; timestamp: number }>();
  private isAnalyzing = false;
  private cancellationTokenSource: vscode.CancellationTokenSource | undefined;
  private onIssueCountChanged: ((count: number) => void) | undefined;
  private onDiagnosticsUpdated: ((uri: vscode.Uri, diagnostics: vscode.Diagnostic[]) => void) | undefined;
  
  constructor(private context: vscode.ExtensionContext) {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('odavl-insight');
    context.subscriptions.push(this.diagnosticCollection);
  }
  
  setIssueCountCallback(callback: (count: number) => void): void {
    this.onIssueCountChanged = callback;
  }
  
  setDiagnosticsUpdatedCallback(callback: (uri: vscode.Uri, diagnostics: vscode.Diagnostic[]) => void): void {
    this.onDiagnosticsUpdated = callback;
  }
  
  /**
   * Analyze workspace with full Insight SDK
   */
  async analyzeWorkspaceWithSDK(token?: vscode.CancellationToken): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }
    
    if (this.isAnalyzing) {
      vscode.window.showWarningMessage('Analysis already in progress');
      return;
    }
    
    this.isAnalyzing = true;
    
    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'ODAVL Insight Analysis',
        cancellable: true
      }, async (progress, cancellationToken) => {
        progress.report({ message: 'Running Insight analysis...' });
        
        // Get configuration
        const config = vscode.workspace.getConfiguration('odavl-insight');
        const detectors = config.get<string[]>('enabledDetectors') || [];
        const severityMinimum = config.get<string>('severityMinimum') || 'info';
        
        // Use child_process for heavy analysis (non-blocking)
        const result = await this.runAnalysisInBackground(
          workspaceFolder.uri.fsPath,
          { detectors, severityMinimum: severityMinimum as any },
          cancellationToken
        );
        
        if (cancellationToken.isCancellationRequested || token?.isCancellationRequested) {
          return;
        }
        
        progress.report({ message: 'Updating diagnostics...' });
        this.updateDiagnosticsFromResult(result);
        
        vscode.window.showInformationMessage(
          `Insight: Found ${result.summary.totalIssues} issues in ${result.summary.filesAnalyzed} files`
        );
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Insight analysis failed: ${message}`);
    } finally {
      this.isAnalyzing = false;
    }
  }
  
  /**
   * Analyze single file on save
   */
  async analyzeFileOnSave(document: vscode.TextDocument): Promise<void> {
    const config = vscode.workspace.getConfiguration('odavl-insight');
    const runOnSave = config.get<boolean>('autoAnalyzeOnSave', true);
    
    if (!runOnSave) {
      return;
    }
    
    // Only analyze supported file types
    const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
    const ext = document.fileName.slice(document.fileName.lastIndexOf('.'));
    if (!supportedExtensions.includes(ext)) {
      return;
    }
    
    try {
      // Check cache first (5 minute TTL)
      const cached = this.analysisCache.get(document.uri.fsPath);
      if (cached && Date.now() - cached.timestamp < 300000) {
        this.updateDiagnosticsForFile(document.uri, cached.issues);
        return;
      }
      
      // Run analysis for single file
      const config = vscode.workspace.getConfiguration('odavl-insight');
      const detectors = config.get<string[]>('enabledDetectors') || [];
      const severityMinimum = config.get<string>('severityMinimum') || 'info';
      
      const result = await analyzeFiles([document.uri.fsPath], {
        detectors,
        severityMinimum: severityMinimum as any,
        timeout: 10000 // 10s timeout for single file
      });
      
      // Cache result
      const fileIssues = result.issues.filter(i => i.file === document.uri.fsPath);
      this.analysisCache.set(document.uri.fsPath, {
        issues: fileIssues,
        timestamp: Date.now()
      });
      
      // Update diagnostics
      this.updateDiagnosticsForFile(document.uri, fileIssues);
      
    } catch (error) {
      // Silent failure for on-save analysis
      console.error('Failed to analyze file on save:', error);
    }
  }
  
  /**
   * Run analysis in background using child_process (prevents UI blocking)
   */
  private async runAnalysisInBackground(
    workspacePath: string,
    options: any,
    token?: vscode.CancellationToken
  ): Promise<InsightAnalysisResult> {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Analysis timeout (20s)')), 20000);
    });
    
    // Create cancellation promise
    const cancellationPromise = new Promise<never>((_, reject) => {
      if (token) {
        token.onCancellationRequested(() => {
          reject(new Error('Analysis cancelled'));
        });
      }
    });
    
    // Race between analysis, timeout, and cancellation
    return Promise.race([
      analyzeWorkspace(workspacePath, options),
      timeoutPromise,
      cancellationPromise
    ]);
  }
  
  /**
   * Update diagnostics from analysis result
   */
  private updateDiagnosticsFromResult(result: InsightAnalysisResult): void {
    this.diagnosticCollection.clear();
    
    // Group issues by file
    const issuesByFile = new Map<string, InsightIssue[]>();
    for (const issue of result.issues) {
      if (!issuesByFile.has(issue.file)) {
        issuesByFile.set(issue.file, []);
      }
      issuesByFile.get(issue.file)!.push(issue);
    }
    
    // Update diagnostics for each file
    for (const [file, issues] of issuesByFile) {
      const uri = vscode.Uri.file(file);
      this.updateDiagnosticsForFile(uri, issues);
    }
  }
  
  /**
   * Update diagnostics for a single file
   */
  private updateDiagnosticsForFile(uri: vscode.Uri, issues: InsightIssue[]): void {
    const diagnostics: vscode.Diagnostic[] = issues.map(issue => {
      const range = new vscode.Range(
        Math.max(0, issue.line - 1),
        Math.max(0, issue.column),
        Math.max(0, issue.line - 1),
        Math.max(0, issue.column + 100) // Arbitrary length
      );
      
      const diagnostic = new vscode.Diagnostic(
        range,
        issue.message,
        this.mapSeverity(issue.severity)
      );
      
      diagnostic.source = `ODAVL/${issue.detector}`;
      diagnostic.code = issue.ruleId;
      
      // Add suggested fix as related information
      if (issue.suggestedFix) {
        diagnostic.relatedInformation = [
          new vscode.DiagnosticRelatedInformation(
            new vscode.Location(uri, range),
            `Suggested fix: ${issue.suggestedFix}`
          )
        ];
      }
      
      return diagnostic;
    });
    
    this.diagnosticCollection.set(uri, diagnostics);
    
    // Notify callbacks
    if (this.onDiagnosticsUpdated) {
      this.onDiagnosticsUpdated(uri, diagnostics);
    }
    
    // Update total issue count
    const totalIssues = Array.from(this.diagnosticCollection).reduce(
      (sum, [_, diags]) => sum + diags.length,
      0
    );
    if (this.onIssueCountChanged) {
      this.onIssueCountChanged(totalIssues);
    }
  }
  
  /**
   * Map Insight severity to VS Code DiagnosticSeverity
   */
  private mapSeverity(severity: string): vscode.DiagnosticSeverity {
    switch (severity) {
      case 'critical':
      case 'high':
        return vscode.DiagnosticSeverity.Error;
      case 'medium':
        return vscode.DiagnosticSeverity.Warning;
      case 'low':
        return vscode.DiagnosticSeverity.Information;
      case 'info':
      default:
        return vscode.DiagnosticSeverity.Hint;
    }
  }
  
  /**
   * Clear all diagnostics
   */
  clearDiagnostics(): void {
    this.diagnosticCollection.clear();
    this.analysisCache.clear();
  }
  
  /**
   * Cancel ongoing analysis
   */
  cancelAnalysis(): void {
    if (this.cancellationTokenSource) {
      this.cancellationTokenSource.cancel();
      this.cancellationTokenSource.dispose();
      this.cancellationTokenSource = undefined;
    }
    this.isAnalyzing = false;
  }
}
