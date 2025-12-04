/**
 * Provider Initialization - Separate module for cleaner activation
 */
import * as vscode from 'vscode';
import { MultiLanguageDiagnosticsProvider } from '../multi-language-diagnostics';
import { LanguageStatusBar } from '../language-status-bar';
import { IssuesExplorerProvider } from '../views/issues-explorer';
import { DetectorsProvider } from '../views/detectors-provider';
import { StatisticsProvider } from '../views/statistics-provider';
import { DashboardProvider } from '../views/dashboard-provider';

export interface ODAVLProviders {
  diagnosticCollection: vscode.DiagnosticCollection;
  multiLanguageDiagnostics: MultiLanguageDiagnosticsProvider;
  languageStatusBar: LanguageStatusBar;
  issuesExplorer: IssuesExplorerProvider;
  detectorsProvider: DetectorsProvider;
  statisticsProvider: StatisticsProvider;
  dashboardProvider: DashboardProvider;
}

/**
 * Initialize all ODAVL providers
 * 
 * @param context Extension context
 * @returns Initialized providers
 */
export function initializeProviders(context: vscode.ExtensionContext): ODAVLProviders {
  // Lightweight diagnostics collection (no heavy initialization)
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('odavl-insight');
  context.subscriptions.push(diagnosticCollection);

  // Initialize multi-language diagnostics provider
  const multiLanguageDiagnostics = new MultiLanguageDiagnosticsProvider(diagnosticCollection);
  context.subscriptions.push(multiLanguageDiagnostics);

  // Initialize language status bar
  const languageStatusBar = new LanguageStatusBar();
  context.subscriptions.push(languageStatusBar);

  // Initialize UI views
  const issuesExplorer = new IssuesExplorerProvider(diagnosticCollection);
  const detectorsProvider = new DetectorsProvider(context);
  const statisticsProvider = new StatisticsProvider(issuesExplorer, diagnosticCollection);
  const dashboardProvider = new DashboardProvider(context, diagnosticCollection);

  // Register TreeViews
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('odavl-insight.issuesExplorer', issuesExplorer)
  );
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('odavl-insight.detectors', detectorsProvider)
  );
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('odavl-insight.statistics', statisticsProvider)
  );

  return {
    diagnosticCollection,
    multiLanguageDiagnostics,
    languageStatusBar,
    issuesExplorer,
    detectorsProvider,
    statisticsProvider,
    dashboardProvider,
  };
}
