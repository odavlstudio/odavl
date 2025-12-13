/**
 * Command Handlers for ODAVL Insight Extension
 */

import * as vscode from 'vscode';
import { MultiLanguageDiagnosticsProvider } from '../multi-language-diagnostics';
import { IssuesExplorerProvider } from '../views/issues-explorer';
import { DetectorsProvider } from '../views/detectors-provider';
import { DashboardProvider } from '../views/dashboard-provider';

export interface CommandHandlers {
  analyzeWorkspace: (workspaceRoot: string, diagnosticsProvider: MultiLanguageDiagnosticsProvider) => Promise<void>;
  clearDiagnostics: (diagnosticCollection: vscode.DiagnosticCollection, issuesExplorer: IssuesExplorerProvider) => void;
  refreshIssues: (issuesExplorer: IssuesExplorerProvider) => void;
  toggleDetector: (detectorsProvider: DetectorsProvider, item: any) => void;
  showDashboard: (dashboardProvider: DashboardProvider) => void;
  runDetector: (detectorId: string, workspaceRoot: string, diagnosticsProvider: MultiLanguageDiagnosticsProvider) => Promise<void>;
}

export function createAnalyzeWorkspaceHandler(
  workspaceRoot: string,
  diagnosticsProvider: MultiLanguageDiagnosticsProvider
): () => Promise<void> {
  return async () => {
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'ODAVL Insight',
      cancellable: false
    }, async (progress) => {
      try {
        progress.report({ message: 'Analyzing workspace...' });
        await diagnosticsProvider.analyzeWorkspace(workspaceRoot);
        // Phase 4.1.1: Removed success notification - use status bar + Problems Panel for feedback
        console.log('ODAVL Insight: Workspace analysis complete');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const action = await vscode.window.showErrorMessage(
          `ODAVL Insight: Analysis failed. ${errorMsg}`,
          'Retry',
          'View Logs'
        );
        
        if (action === 'Retry') {
          await diagnosticsProvider.analyzeWorkspace(workspaceRoot);
        } else if (action === 'View Logs') {
          vscode.commands.executeCommand('workbench.action.toggleDevTools');
        }
      }
    });
  };
}

export function createClearDiagnosticsHandler(
  diagnosticCollection: vscode.DiagnosticCollection,
  issuesExplorer: IssuesExplorerProvider
): () => void {
  return () => {
    diagnosticCollection.clear();
    issuesExplorer.refresh();
    // Phase 4.1.1: Removed notification - user can see in Problems Panel that diagnostics are cleared
    console.log('ODAVL Insight: Diagnostics cleared');
  };
}

export function createRefreshIssuesHandler(
  issuesExplorer: IssuesExplorerProvider
): () => void {
  return () => {
    issuesExplorer.refresh();
  };
}

export function createToggleDetectorHandler(
  detectorsProvider: DetectorsProvider
): (item: any) => void {
  return (item: any) => {
    detectorsProvider.toggleDetector(item);
  };
}

export function createShowDashboardHandler(
  dashboardProvider: DashboardProvider
): () => void {
  return () => {
    dashboardProvider.show();
  };
}

export function createRunDetectorHandler(
  workspaceRoot: string,
  diagnosticsProvider: MultiLanguageDiagnosticsProvider
): (detectorId: string) => Promise<void> {
  return async (detectorId: string) => {
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Running ${detectorId} detector...`,
      cancellable: false
    }, async () => {
      try {
        await diagnosticsProvider.runSingleDetector(detectorId, workspaceRoot);
        // Phase 4.1.1: Removed success notification - use status bar + Problems Panel
        console.log(`${detectorId} detector complete`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        // Error notification is appropriate for explicit user command that failed
        vscode.window.showErrorMessage(`Failed to run ${detectorId}: ${errorMsg}`);
      }
    });
  };
}
