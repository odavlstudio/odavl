/**
 * Command Registration - Separate module for cleaner activation
 */
import * as vscode from 'vscode';
import { ODAVLProviders } from './providers';
import {
  createAnalyzeWorkspaceHandler,
  createClearDiagnosticsHandler,
  createRefreshIssuesHandler,
  createToggleDetectorHandler,
  createShowDashboardHandler,
  createRunDetectorHandler,
} from '../commands/handlers';
import { ensureInitialized } from '../core/lazyLoader';

/**
 * Register all ODAVL commands
 * 
 * @param context Extension context
 * @param providers Initialized providers
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  providers: ODAVLProviders
): void {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

  // Analysis commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'odavl-insight.analyzeWorkspace',
      createAnalyzeWorkspaceHandler(workspaceRoot, providers.multiLanguageDiagnostics)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'odavl-insight.clearDiagnostics',
      createClearDiagnosticsHandler(providers.diagnosticCollection, providers.issuesExplorer)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'odavl-insight.refreshIssues',
      createRefreshIssuesHandler(providers.issuesExplorer)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'odavl-insight.toggleDetector',
      createToggleDetectorHandler(providers.detectorsProvider)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'odavl-insight.showDashboard',
      createShowDashboardHandler(providers.dashboardProvider)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'odavl-insight.runDetector',
      createRunDetectorHandler(workspaceRoot, providers.multiLanguageDiagnostics)
    )
  );

  // Language status bar commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'odavl-insight.showLanguageInfo',
      () => providers.languageStatusBar.showLanguageInfo()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.showWorkspaceLanguages', async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showWarningMessage('No workspace open');
        return;
      }
      await providers.languageStatusBar.showWorkspaceLanguages(workspaceFolders[0].uri.fsPath);
    })
  );

  // UI commands
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl-insight.refreshIssues', () => {
      providers.issuesExplorer.refresh();
      providers.statisticsProvider.refresh();
      vscode.window.showInformationMessage('ODAVL: Refreshed');
    })
  );
}

/**
 * Register event listeners
 * 
 * @param context Extension context
 * @param providers Initialized providers
 */
export function registerEventListeners(
  context: vscode.ExtensionContext,
  providers: ODAVLProviders
): void {
  // Update status bar on editor change
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      providers.languageStatusBar.updateFromEditor(editor);
    })
  );

  // Update status bar for current editor
  providers.languageStatusBar.updateFromEditor(vscode.window.activeTextEditor);

  // Auto-analyze on save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      const config = vscode.workspace.getConfiguration('odavl-insight');
      if (config.get('autoAnalyzeOnSave')) {
        await ensureInitialized();
        providers.multiLanguageDiagnostics.analyzeFile(document.uri, true);
      }
    })
  );
}
